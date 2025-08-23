import { config } from 'dotenv';

config();

export interface LLMProvider {
  provider_name: string;
  base_url?: string;
  endpoint?: string;
  credentials: {
    api_key?: string;
    api_password?: string;
  };
  allowed_models: string[];
  documentation_url: string;
  notes: string;
}

export const llmProviders: LLMProvider[] = [
  {
    provider_name: "ChatAnywhere",
    base_url: process.env.CHATANYWHERE_BASE_URL || "https://api.chatanywhere.tech/v1",
    credentials: {
      api_key: process.env.CHATANYWHERE_API_KEY
    },
    allowed_models: ["gpt-4o-mini", "gpt-4o", "gpt-4", "gpt-3.5-turbo"],
    documentation_url: "https://chatanywhere.apifox.cn/",
    notes: "遵循OpenAI API规范。推荐使用gpt-4o-mini以降低成本。"
  },
  {
    provider_name: "Xunfei Spark",
    endpoint: process.env.XUNFEI_ENDPOINT || "https://spark-api-open.xf-yun.com/v1/chat/completions",
    credentials: {
      api_password: process.env.XUNFEI_API_PASSWORD
    },
    allowed_models: ["Spark-Lite"],
    documentation_url: "https://www.xfyun.cn/doc/spark/%E6%8E%A8%E7%90%86%E6%9C%8D%E5%8A%A1-http.html",
    notes: "认证方式较为特殊，请参考官方文档构建鉴权头。"
  },
  {
    provider_name: "Zhipu GLM",
    endpoint: process.env.ZHIPU_ENDPOINT || "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    credentials: {
      api_key: process.env.ZHIPU_API_KEY
    },
    allowed_models: ["glm-4.5-flash"],
    documentation_url: "https://docs.bigmodel.cn/cn/guide/develop/http/introduction",
    notes: "API Key通常用于生成JWT Bearer Token，请参考文档实现。"
  }
];

export const getLLMProvider = (providerName: string): LLMProvider | undefined => {
  return llmProviders.find(provider => provider.provider_name === providerName);
};

export const getDefaultProvider = (): LLMProvider => {
  // 优先选择可用的提供商
  return llmProviders.find(provider => provider.credentials.api_key || provider.credentials.api_password) || llmProviders[0];
};

export const getProviderByPriority = (): LLMProvider[] => {
  // 按优先级排序：ChatAnywhere > Zhipu GLM > Xunfei Spark
  const priorityOrder = ['ChatAnywhere', 'Zhipu GLM', 'Xunfei Spark'];
  return llmProviders.sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a.provider_name);
    const bIndex = priorityOrder.indexOf(b.provider_name);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
};