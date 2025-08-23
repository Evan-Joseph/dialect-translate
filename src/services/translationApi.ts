import axios from 'axios';
import { TranslationRequest, DetectionRequest, TranslationResponse, DetectionResponse } from '../types/translation';
import { API_BASE_URL } from '../config/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[API Response Error]', error.response?.data || error.message);
    
    // 统一错误处理
    if (error.response?.status === 429) {
      throw new Error('请求过于频繁，请稍后再试');
    } else if (error.response?.status >= 500) {
      throw new Error('服务器内部错误，请稍后再试');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('请求超时，请检查网络连接');
    }
    
    return Promise.reject(error);
  }
);

// 翻译API服务
export class TranslationApiService {
  // 方言归属地推理
  static async detectDialectRegion(request: DetectionRequest): Promise<DetectionResponse> {
    try {
      const response = await api.post('/dialect/detect', request);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || '归属地推理失败'
      };
    }
  }

  // 方言翻译
  static async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const response = await api.post('/translate', request);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || '翻译失败'
      };
    }
  }

  // 清理JSON内容（移除代码块标记）
  private static cleanJsonContent(content: string): string {
    // 移除```json和```标记
    return content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  // 安全解析JSON
  private static safeJsonParse(content: string): any {
    try {
      const cleanedContent = this.cleanJsonContent(content);
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.warn('JSON解析失败，返回原始内容:', error);
      return content;
    }
  }

  // 流式翻译（Server-Sent Events）
  static async translateTextStream(
    request: TranslationRequest,
    onChunk: (chunk: string) => void,
    onComplete: (result: TranslationResponse) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const url = `${API_BASE_URL}/translate/stream`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          fullContent += chunk;

          // 处理Server-Sent Events格式
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留最后一行（可能不完整）

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6); // 移除'data: '前缀
              if (data === '[DONE]') {
                // 流式传输完成，解析完整内容
                try {
                  const parsedResult = this.safeJsonParse(fullContent);
                  const translationResponse: TranslationResponse = {
                    success: true,
                    data: parsedResult
                  };
                  onComplete(translationResponse);
                } catch (error) {
                  console.error('解析流式响应失败:', error);
                  onError('解析翻译结果失败');
                }
                return;
              } else if (data.trim()) {
                onChunk(data);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error: any) {
      console.error('流式翻译失败:', error);
      // 降级到普通翻译
      try {
        const result = await this.translateText(request);
        if (result.success && result.data) {
          // 模拟流式输出效果
          const jsonString = JSON.stringify(result.data);
          for (let i = 0; i < jsonString.length; i++) {
            setTimeout(() => {
              onChunk(jsonString.slice(0, i + 1));
            }, i * 10);
          }
          setTimeout(() => {
            onComplete(result);
          }, jsonString.length * 10 + 100);
        } else {
          onError(result.error || '翻译失败');
        }
      } catch (fallbackError: any) {
        onError(fallbackError.message || '翻译失败');
      }
    }
  }

  // 获取可用的LLM模型列表
  static async getAvailableModels(): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      // 这里可以添加获取模型列表的API
      // 目前返回硬编码的模型列表
      return {
        success: true,
        data: ['ChatAnywhere', 'Xunfei Spark', 'Zhipu GLM']
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '获取模型列表失败'
      };
    }
  }

  // 健康检查
  static async healthCheck(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '服务不可用'
      };
    }
  }
}

export default TranslationApiService;