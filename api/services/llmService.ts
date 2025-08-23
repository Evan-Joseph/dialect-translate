import OpenAI from 'openai';
import fetch from 'node-fetch';
import { LLMProvider, getLLMProvider, getDefaultProvider, llmProviders, getProviderByPriority } from '../config/llm.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface LLMResponse {
  success: boolean;
  data?: any;
  error?: string;
  provider?: string;
  retryCount?: number;
}

export interface ProviderStatus {
  name: string;
  available: boolean;
  lastError?: string;
  lastErrorTime?: Date;
  consecutiveFailures: number;
}

export interface TranslationRequest {
  text: string;
  sourceType: 'dialect' | 'mandarin';
  targetType: 'dialect' | 'mandarin';
  region?: string;
  targetDialect?: string;
  model?: string;
}

export interface DetectionRequest {
  text: string;
  model?: string;
}

class LLMService {
  private openaiClients: Map<string, OpenAI> = new Map();
  private providerStatus: Map<string, ProviderStatus> = new Map();
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 1000; // 1秒基础延迟
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5; // 连续失败5次后熔断
  private readonly CIRCUIT_BREAKER_TIMEOUT = 300000; // 5分钟后重试

  constructor() {
    this.initializeClients();
    this.initializeProviderStatus();
  }

  // 健康检查方法
  async healthCheck(): Promise<{ [key: string]: ProviderStatus }> {
    const healthStatus: { [key: string]: ProviderStatus } = {};
    
    for (const provider of llmProviders) {
      const status = this.providerStatus.get(provider.provider_name);
      if (status) {
        healthStatus[provider.provider_name] = {
          ...status,
          available: this.isProviderAvailable(provider.provider_name)
        };
      }
    }
    
    return healthStatus;
  }

  // 重置提供商状态
  resetProviderStatus(providerName: string): void {
    const status = this.providerStatus.get(providerName);
    if (status) {
      status.consecutiveFailures = 0;
      status.available = true;
      status.lastError = undefined;
      status.lastErrorTime = undefined;
    }
  }

  // 获取提供商统计信息
  getProviderStats(): { [key: string]: { available: boolean; failures: number; lastError?: string } } {
    const stats: { [key: string]: { available: boolean; failures: number; lastError?: string } } = {};
    
    for (const [name, status] of this.providerStatus) {
      stats[name] = {
        available: status.available,
        failures: status.consecutiveFailures,
        lastError: status.lastError
      };
    }
    
    return stats;
  }

  private initializeClients() {
    // 初始化ChatAnywhere客户端
    const chatAnywhereProvider = getLLMProvider('ChatAnywhere');
    if (chatAnywhereProvider?.credentials.api_key) {
      const client = new OpenAI({
        apiKey: chatAnywhereProvider.credentials.api_key,
        baseURL: chatAnywhereProvider.base_url
      });
      this.openaiClients.set('ChatAnywhere', client);
    }
  }

  private initializeProviderStatus() {
    llmProviders.forEach(provider => {
      this.providerStatus.set(provider.provider_name, {
        name: provider.provider_name,
        available: true,
        consecutiveFailures: 0
      });
    });
  }

  private updateProviderStatus(providerName: string, success: boolean, error?: string) {
    const status = this.providerStatus.get(providerName);
    if (!status) return;

    if (success) {
      status.consecutiveFailures = 0;
      status.available = true;
      status.lastError = undefined;
      status.lastErrorTime = undefined;
    } else {
      status.consecutiveFailures++;
      status.lastError = error;
      status.lastErrorTime = new Date();
      
      // 熔断机制：连续失败超过阈值时标记为不可用
      if (status.consecutiveFailures >= this.CIRCUIT_BREAKER_THRESHOLD) {
        status.available = false;
      }
    }
  }

  private isProviderAvailable(providerName: string): boolean {
    const status = this.providerStatus.get(providerName);
    if (!status) return false;

    // 如果提供商被熔断，检查是否可以重试
    if (!status.available && status.lastErrorTime) {
      const timeSinceLastError = Date.now() - status.lastErrorTime.getTime();
      if (timeSinceLastError > this.CIRCUIT_BREAKER_TIMEOUT) {
        status.available = true;
        status.consecutiveFailures = 0;
      }
    }

    return status.available;
  }

  private getAvailableProviders(): LLMProvider[] {
    // 按优先级获取可用的提供商
    return getProviderByPriority().filter(provider => 
      this.isProviderAvailable(provider.provider_name) &&
      (provider.credentials.api_key || provider.credentials.api_password)
    );
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRetryDelay(attempt: number): number {
    // 指数退避策略
    return this.RETRY_DELAY_BASE * Math.pow(2, attempt) + Math.random() * 1000;
  }

  private getErrorMessage(error: any): string {
    if (error?.status === 429) {
      return '服务请求频率过高，请稍后再试。建议使用其他模型或等待配额重置。';
    } else if (error?.status === 401) {
      return 'API密钥无效或已过期，请检查配置。';
    } else if (error?.status === 403) {
      return 'API访问权限不足，请检查账户权限或升级服务。';
    } else if (error?.status === 500) {
      return '服务器内部错误，请稍后重试。';
    } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      return '网络连接失败，请检查网络连接。';
    } else {
      return error?.message || '未知错误，请稍后重试。';
    }
  }

  // 方言归属地推理
  async detectDialectRegion(request: DetectionRequest): Promise<LLMResponse> {
    const availableProviders = this.getAvailableProviders();
    if (availableProviders.length === 0) {
      return { 
        success: false, 
        error: '所有LLM服务商暂时不可用，请稍后重试。' 
      };
    }

    const prompt = `请分析以下文本的方言归属地，只返回地区名称（如：山东、四川、广东等）：\n\n"${request.text}"\n\n请直接回答地区名称，不要其他解释。`;

    // 如果指定了模型，优先使用指定的提供商
    if (request.model) {
      const specifiedProvider = getLLMProvider(request.model);
      if (specifiedProvider && this.isProviderAvailable(specifiedProvider.provider_name)) {
        const result = await this.callProviderWithRetry(specifiedProvider, prompt, 'detectDialectRegion');
        if (result.success) {
          return result;
        }
      }
    }

    // 依次尝试可用的提供商
    for (const provider of availableProviders) {
      const result = await this.callProviderWithRetry(provider, prompt, 'detectDialectRegion');
      if (result.success) {
        return result;
      }
    }

    return { 
      success: false, 
      error: '所有LLM服务商都无法处理请求，请稍后重试。' 
    };
  }

  // 带重试机制的提供商调用
  private async callProviderWithRetry(
    provider: LLMProvider, 
    prompt: string, 
    operation: string,
    retryCount: number = 0
  ): Promise<LLMResponse> {
    try {
      let result: LLMResponse;

      if (provider.provider_name === 'ChatAnywhere') {
        result = await this.callChatAnywhere(provider, prompt, operation);
      } else {
        result = await this.callOtherProvider(provider, prompt);
      }

      if (result.success) {
        this.updateProviderStatus(provider.provider_name, true);
        return { ...result, provider: provider.provider_name, retryCount };
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error);
      this.updateProviderStatus(provider.provider_name, false, errorMessage);

      // 对于429错误（频率限制），不进行重试
      if (error?.status === 429) {
        console.warn(`${provider.provider_name} 达到频率限制:`, errorMessage);
        return { 
          success: false, 
          error: errorMessage, 
          provider: provider.provider_name,
          retryCount 
        };
      }

      // 重试机制
      if (retryCount < this.MAX_RETRIES) {
        const delay = this.getRetryDelay(retryCount);
        console.log(`${provider.provider_name} 调用失败，${delay}ms后重试 (${retryCount + 1}/${this.MAX_RETRIES}):`, errorMessage);
        await this.sleep(delay);
        return this.callProviderWithRetry(provider, prompt, operation, retryCount + 1);
      }

      console.error(`${provider.provider_name} 调用最终失败:`, errorMessage);
      return { 
        success: false, 
        error: errorMessage, 
        provider: provider.provider_name,
        retryCount 
      };
    }
  }

  // 清理LLM返回的JSON内容，移除代码块标记
  private cleanJsonContent(content: string): string {
    // 移除```json和```标记
    return content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  // 安全的JSON解析
  private safeJsonParse(content: string): any {
    try {
      const cleanedContent = this.cleanJsonContent(content);
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.warn('JSON解析失败，原始内容:', content);
      throw error;
    }
  }

  // ChatAnywhere专用调用方法
  private async callChatAnywhere(provider: LLMProvider, prompt: string, operation: string): Promise<LLMResponse> {
    const client = this.openaiClients.get('ChatAnywhere');
    if (!client) {
      throw new Error('ChatAnywhere客户端未初始化');
    }

    // 根据操作类型选择合适的模型
    let model = 'gpt-4o-mini'; // 默认使用更便宜的模型
    let maxTokens = 50;
    let temperature = 0.3;

    if (operation === 'translateText') {
      model = 'gpt-4o-mini';
      maxTokens = 1000;
      // 对于翻译，我们需要多次调用以获得不同温度的结果
      return await this.callChatAnywhereMultiTemperature(client, prompt, model, maxTokens);
    } else if (operation === 'generateCultureContent') {
      model = 'gpt-4o-mini';
      maxTokens = 800;
      temperature = 0.8;
    }

    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('API返回空结果');
    }

    // 根据操作类型处理返回结果
    if (operation === 'detectDialectRegion') {
      return {
        success: true,
        data: {
          region: content || '未知地区',
          confidence: 0.8
        }
      };
    } else if (operation === 'generateCultureContent') {
      try {
        const result = this.safeJsonParse(content);
        return { success: true, data: result };
      } catch {
        throw new Error('科普内容格式解析失败');
      }
    }

    return { success: true, data: content };
  }

  // ChatAnywhere多温度翻译调用
  private async callChatAnywhereMultiTemperature(client: OpenAI, prompt: string, model: string, maxTokens: number): Promise<LLMResponse> {
    const temperatures = [0.3, 0.7, 1.0];
    const translations: any[] = [];
    let wordMapping: any[] = [];

    // 并行调用多个温度
    const promises = temperatures.map(async (temp) => {
      try {
        const response = await client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: temp,
          max_tokens: maxTokens
        });

        const content = response.choices[0]?.message?.content?.trim();
        if (!content) {
          return null;
        }

        // 尝试解析JSON格式
        try {
          const parsed = this.safeJsonParse(content);
          if (parsed.translations && Array.isArray(parsed.translations)) {
            // 如果返回的是完整的翻译结果，取第一个并设置正确的温度
            const translation = parsed.translations[0];
            translation.temperature = temp;
            if (parsed.wordMapping && wordMapping.length === 0) {
              wordMapping = parsed.wordMapping;
            }
            return translation;
          } else if (parsed.text) {
            // 如果返回的是单个翻译对象
            parsed.temperature = temp;
            return parsed;
          }
        } catch {
          // 如果不是JSON格式，作为纯文本处理
          return {
            text: content,
            temperature: temp
          };
        }

        return null;
      } catch (error) {
        console.warn(`温度${temp}的翻译调用失败:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    
    // 过滤掉失败的结果
    for (const result of results) {
      if (result) {
        translations.push(result);
      }
    }

    if (translations.length === 0) {
      throw new Error('所有温度的翻译都失败了');
    }

    return {
      success: true,
      data: {
        translations,
        wordMapping
      }
    };
  }

  // 方言翻译
  async translateText(request: TranslationRequest): Promise<LLMResponse> {
    const availableProviders = this.getAvailableProviders();
    if (availableProviders.length === 0) {
      return { 
        success: false, 
        error: '所有LLM服务商暂时不可用，请稍后重试。' 
      };
    }

    let prompt = '';
    if (request.sourceType === 'dialect' && request.targetType === 'mandarin') {
      prompt = `请将以下${request.region || ''}方言翻译成标准普通话，并提供词语对应关系。\n\n要求：
1. 请提供一个准确的翻译结果
2. 提供方言词汇与普通话的对应关系
3. 以JSON格式返回，不要包含代码块标记

返回格式：
{
  "text": "翻译结果",
  "wordMapping": [{"original": "方言词", "translation": "普通话词"}]
}

方言原文："${request.text}"`;
    } else if (request.sourceType === 'mandarin' && request.targetType === 'dialect') {
      prompt = `请将以下普通话翻译成地道的${request.targetDialect || '方言'}，体现真正的方言特色，不要保留普通话表达。\n\n要求：
1. 翻译结果必须体现${request.targetDialect || '方言'}的独特表达方式和词汇
2. 为每个汉字提供标准拼音注音（只能是拼音，不能是文字）
3. 避免与普通话相同的表达
4. 以JSON格式返回，不要包含代码块标记

返回格式：
{
  "text": "方言翻译结果",
  "pronunciation": "pīn yīn zhù yīn"
}

普通话原文："${request.text}"`;
    }

    // 如果指定了模型，优先使用指定的提供商
    if (request.model) {
      const specifiedProvider = getLLMProvider(request.model);
      if (specifiedProvider && this.isProviderAvailable(specifiedProvider.provider_name)) {
        const result = await this.callProviderWithRetry(specifiedProvider, prompt, 'translateText');
        if (result.success) {
          return result;
        }
      }
    }

    // 依次尝试可用的提供商
    for (const provider of availableProviders) {
      const result = await this.callProviderWithRetry(provider, prompt, 'translateText');
      if (result.success) {
        return result;
      }
    }

    return { 
      success: false, 
      error: '所有LLM服务商都无法处理翻译请求，请稍后重试。' 
    };
  }

  // 文化科普内容生成
  async generateCultureContent(region: string, model?: string): Promise<LLMResponse> {
    const availableProviders = this.getAvailableProviders();
    if (availableProviders.length === 0) {
      return { 
        success: false, 
        error: '所有LLM服务商暂时不可用，请稍后重试。' 
      };
    }

    const prompt = `请为${region}地区的方言生成文化科普内容，以JSON格式返回：\n\n{
  "history": "历史背景介绍",
  "features": ["特色1", "特色2", "特色3"],
  "culture": "文化内涵描述"
}\n\n请确保内容准确、有趣且富有教育意义。`;

    // 如果指定了模型，优先使用指定的提供商
    if (model) {
      const specifiedProvider = getLLMProvider(model);
      if (specifiedProvider && this.isProviderAvailable(specifiedProvider.provider_name)) {
        const result = await this.callProviderWithRetry(specifiedProvider, prompt, 'generateCultureContent');
        if (result.success) {
          return result;
        }
      }
    }

    // 依次尝试可用的提供商
    for (const provider of availableProviders) {
      const result = await this.callProviderWithRetry(provider, prompt, 'generateCultureContent');
      if (result.success) {
        return result;
      }
    }

    return { 
      success: false, 
      error: '所有LLM服务商都无法处理科普内容生成请求，请稍后重试。' 
    };
  }

  // 调用其他提供商的通用方法
  private async callOtherProvider(provider: LLMProvider, prompt: string): Promise<LLMResponse> {
    try {
      if (provider.provider_name === 'Xunfei Spark') {
        return await this.callXunfeiSpark(provider, prompt);
      } else if (provider.provider_name === 'Zhipu GLM') {
        return await this.callZhipuGLM(provider, prompt);
      }
      
      return { success: false, error: '不支持的LLM提供商' };
    } catch (error) {
      console.error(`调用${provider.provider_name}失败:`, error);
      return { success: false, error: `${provider.provider_name}服务暂时不可用` };
    }
  }

  // 讯飞星火API调用
  private async callXunfeiSpark(provider: LLMProvider, prompt: string): Promise<LLMResponse> {
    const response = await fetch(provider.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.credentials.api_password}`
      },
      body: JSON.stringify({
        model: 'Spark-Lite',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: (data as any).error?.message || '讯飞星火API调用失败' };
    }

    const content = (data as any).choices?.[0]?.message?.content || '无响应内容';
    
    // 尝试解析JSON格式的内容
    if (typeof content === 'string' && (content.includes('{') || content.includes('```'))) {
      try {
        const parsedContent = this.safeJsonParse(content);
        return { success: true, data: parsedContent };
      } catch {
        // 解析失败，返回原始内容
        return { success: true, data: content };
      }
    }

    return {
      success: true,
      data: content
    };
  }

  // 智谱GLM API调用
  private async callZhipuGLM(provider: LLMProvider, prompt: string): Promise<LLMResponse> {
    // 生成JWT Token
    const token = this.generateZhipuToken(provider.credentials.api_key!);
    
    const response = await fetch(provider.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: 'glm-4.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: (data as any).error?.message || '智谱GLM API调用失败' };
    }

    const content = (data as any).choices?.[0]?.message?.content || '无响应内容';
    
    // 尝试解析JSON格式的内容
    if (typeof content === 'string' && (content.includes('{') || content.includes('```'))) {
      try {
        const parsedContent = this.safeJsonParse(content);
        return { success: true, data: parsedContent };
      } catch {
        // 解析失败，返回原始内容
        return { success: true, data: content };
      }
    }

    return {
      success: true,
      data: content
    };
  }

  // 生成智谱GLM的JWT Token
  private generateZhipuToken(apiKey: string): string {
    try {
      const [id, secret] = apiKey.split('.');
      const payload = {
        iss: id,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1小时过期
        iat: Math.floor(Date.now() / 1000)
      };
      
      const header = {
        alg: 'HS256',
        sign_type: 'SIGN'
      };
      
      return jwt.sign(payload, secret, { header });
    } catch (error) {
      console.error('生成智谱GLM Token失败:', error);
      return apiKey; // 降级处理
    }
  }

  // 流式翻译（支持Server-Sent Events）
  async translateTextStream(request: TranslationRequest): Promise<AsyncGenerator<string, void, unknown>> {
    const availableProviders = this.getAvailableProviders();
    if (availableProviders.length === 0) {
      throw new Error('所有LLM服务商暂时不可用，请稍后重试。');
    }

    let prompt = '';
    if (request.sourceType === 'dialect' && request.targetType === 'mandarin') {
      prompt = `请将以下${request.region || ''}方言翻译成标准普通话，并提供词语对应关系。\n\n要求：
1. 请提供一个准确的翻译结果
2. 提供方言词汇与普通话的对应关系
3. 以JSON格式返回，不要包含代码块标记

返回格式：
{
  "text": "翻译结果",
  "wordMapping": [{"original": "方言词", "translation": "普通话词"}]
}

方言原文："${request.text}"`;
    } else if (request.sourceType === 'mandarin' && request.targetType === 'dialect') {
      prompt = `请将以下普通话翻译成地道的${request.targetDialect || '方言'}，体现真正的方言特色，不要保留普通话表达。\n\n要求：
1. 翻译结果必须体现${request.targetDialect || '方言'}的独特表达方式和词汇
2. 为每个汉字提供标准拼音注音（只能是拼音，不能是文字）
3. 避免与普通话相同的表达
4. 以JSON格式返回，不要包含代码块标记

返回格式：
{
  "text": "方言翻译结果",
  "pronunciation": "pīn yīn zhù yīn"
}

普通话原文："${request.text}"`;
    }

    // 优先尝试ChatAnywhere的流式输出
    const chatAnywhereProvider = getLLMProvider('ChatAnywhere');
    if (chatAnywhereProvider && this.isProviderAvailable('ChatAnywhere')) {
      try {
        const client = this.openaiClients.get('ChatAnywhere');
        if (client) {
          const stream = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
          });

          async function* generateStream() {
            let fullContent = '';
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                fullContent += content;
                yield content;
              }
            }
            // 流式完成后，尝试解析完整内容以验证JSON格式
            try {
              this.safeJsonParse(fullContent);
            } catch (error) {
              console.warn('流式输出JSON格式验证失败:', error);
            }
          }

          this.updateProviderStatus('ChatAnywhere', true);
          return generateStream();
        }
      } catch (error: any) {
        console.warn('ChatAnywhere流式调用失败，降级到非流式模式:', this.getErrorMessage(error));
        this.updateProviderStatus('ChatAnywhere', false, this.getErrorMessage(error));
      }
    }

    // 降级到非流式模式，依次尝试可用的提供商
    for (const provider of availableProviders) {
      try {
        const result = await this.callProviderWithRetry(provider, prompt, 'translateText');
        if (result.success && result.data) {
          async function* generateFallback() {
            // 确保返回的是正确格式的JSON字符串
            const jsonString = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
            yield jsonString;
          }
          return generateFallback();
        }
      } catch (error) {
        console.warn(`${provider.provider_name}非流式调用失败:`, error);
        continue;
      }
    }

    // 所有提供商都失败
    async function* generateError() {
      throw new Error('所有LLM服务商都无法处理流式翻译请求，请稍后重试。');
    }
    return generateError();
  }
}

export const llmService = new LLMService();