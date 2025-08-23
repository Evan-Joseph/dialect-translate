
## **项目可用大模型API配置参考 (LLM API Configuration Reference)**

### **核心开发者指南**

本文件定义了项目中可用的所有大语言模型（LLM）API的配置信息。开发时，请将这些配置作为环境变量或通过安全的配置文件加载到应用中。

**重要提示**：以下API Key均为敏感信息，严禁硬编码在代码中或提交到公共代码仓库。推荐联网搜索各服务商官方提供的SDK和最佳实践，以实现最高效和稳健的集成。

### **1. 统一配置格式 (JSON)**

为了方便程序化管理和调用，建议在项目配置文件（如 `config.json`）中采用以下统一的数据结构。AI编程助手可以直接解析此结构以生成API调用代码。

```json
{
  "llm_providers": [
    {
      "provider_name": "ChatAnywhere",
      "base_url": "https://api.chatanywhere.tech/v1",
      "credentials": {
        "api_key": "your_chatanywhere_api_key_here"
      },
      "allowed_models": [
        "gpt-4"
      ],
      "documentation_url": "https://chatanywhere.apifox.cn/",
      "notes": "遵循OpenAI API规范。"
    },
    {
      "provider_name": "Xunfei Spark",
      "endpoint": "https://spark-api-open.xf-yun.com/v1/chat/completions",
      "credentials": {
        "api_password": "your_xunfei_api_password_here"
      },
      "allowed_models": [
        "Spark-Lite"
      ],
      "documentation_url": "https://www.xfyun.cn/doc/spark/%E6%8E%A8%E7%90%86%E6%9C%8D%E5%8A%A1-http.html",
      "notes": "认证方式较为特殊，请参考官方文档构建鉴权头。"
    },
    {
      "provider_name": "Zhipu GLM",
      "endpoint": "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      "credentials": {
        "api_key": "your_zhipu_api_key_here"
      },
      "allowed_models": [
        "glm-4.5-flash"
      ],
      "documentation_url": "https://docs.bigmodel.cn/cn/guide/develop/http/introduction",
      "notes": "API Key通常用于生成JWT Bearer Token，请参考文档实现。"
    }
  ]
}
```

### **2. API配置速查表 (Markdown)**

以下为各服务商配置信息的快速查阅表格。

#### **服务商 1: ChatAnywhere**

| 配置项 | 值 |
| :--- | :--- |
| **Provider Name** | `ChatAnywhere` |
| **Base URL** | `https://api.chatanywhere.tech/v1` |
| **API Key** | `your_chatanywhere_api_key_here` |
| **可用模型** | `gpt-4` |
| **官方文档** | [https://chatanywhere.apifox.cn/](https://chatanywhere.apifox.cn/) |

---

#### **服务商 2: 讯飞星火 (Xunfei Spark)**

| 配置项 | 值 |
| :--- | :--- |
| **Provider Name** | `Xunfei Spark` |
| **HTTP 接口** | `https://spark-api-open.xf-yun.com/v1/chat/completions` |
| **API Password** | `your_xunfei_api_password_here` |
| **可用模型** | `Spark-Lite` |
| **官方文档** | [https://www.xfyun.cn/doc/spark/通用大模型-http.html](https://www.xfyun.cn/doc/spark/%E6%8E%A8%E7%90%86%E6%9C%8D%E5%8A%A1-http.html) |

---

#### **服务商 3: 智谱清言 (Zhipu GLM)**

| 配置项 | 值 |
| :--- | :--- |
| **Provider Name** | `Zhipu GLM` |
| **API URL** | `https://open.bigmodel.cn/api/paas/v4/chat/completions` |
| **API Key** | `your_zhipu_api_key_here` |
| **可用模型** | `glm-4.5-flash` |
| **官方文档** | [https://docs.bigmodel.cn/cn/guide/develop/http/introduction](https://docs.bigmodel.cn/cn/guide/develop/http/introduction) |