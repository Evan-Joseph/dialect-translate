# 乡音方言翻译平台

基于AI大语言模型的智能方言翻译工具，传承中华方言文化。

## 项目概述

本项目是一个前后端分离的Web应用，旨在利用大语言模型技术实现方言与普通话的双向翻译，并提供文化科普和社区反馈功能。

## 技术栈

### 前端
- React 18 + TypeScript
- Tailwind CSS
- Vite
- Axios

### 后端
- Express 4 + TypeScript
- Node.js
- Supabase (PostgreSQL)

### 外部服务
- ChatAnywhere (GPT-4)
- 讯飞星火 (Spark-Lite)
- 智谱清言 (GLM-4.5-flash)

## 核心功能

### 1. 双向翻译
- **方言 → 普通话**：智能识别方言归属地，提供多种温度配置的翻译结果
- **普通话 → 方言**：支持目标方言选择，生成带注音的翻译结果

### 2. 社区反馈
- 用户可对翻译结果提交修正建议
- 公开展示所有反馈，支持投票功能
- 显示用户匿名地理位置信息

### 3. 文化科普
- 自动生成方言相关的文化背景介绍
- 包含历史背景、方言特色、文化内涵等内容
- 支持数据库缓存机制

### 4. 多模型支持
- 支持多个LLM服务商切换
- 用户可选择不同的AI模型进行翻译
- 环境变量配置，支持热修改

## 快速开始

### 环境要求
- Node.js 18+
- pnpm (推荐) 或 npm

### 安装依赖
```bash
pnpm install
```

### 环境配置
1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 配置环境变量：
```bash
# LLM API配置
CHATANYWHERE_API_KEY=your_chatanywhere_api_key
CHATANYWHERE_BASE_URL=https://api.chatanywhere.tech/v1

XUNFEI_API_PASSWORD=your_xunfei_api_password
XUNFEI_ENDPOINT=https://spark-api-open.xf-yun.com/v1/chat/completions

ZHIPU_API_KEY=your_zhipu_api_key
ZHIPU_ENDPOINT=https://open.bigmodel.cn/api/paas/v4/chat/completions

# 数据库配置（可选，使用占位符可正常运行）
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# 服务配置
PORT=3000
NODE_ENV=development

# IP地理位置服务（可选）
IP_GEOLOCATION_API_KEY=your_ip_api_key
```

### 启动开发服务器
```bash
pnpm run dev
```

访问地址：
- 前端：http://localhost:5173
- 后端API：http://localhost:3000

## 项目结构

```
├── api/                    # 后端代码
│   ├── config/            # 配置文件
│   │   ├── database.ts    # 数据库配置
│   │   └── llm.ts         # LLM配置
│   ├── services/          # 业务服务
│   │   ├── llmService.ts  # LLM服务
│   │   ├── databaseService.ts # 数据库服务
│   │   └── geolocationService.ts # 地理位置服务
│   ├── routes/            # API路由
│   │   └── auth.ts        # 主要API路由
│   ├── app.ts             # Express应用配置
│   └── server.ts          # 服务器启动文件
├── src/                   # 前端代码
│   ├── components/        # React组件
│   │   ├── TranslationInput/    # 翻译输入组件
│   │   ├── TranslationResult/   # 翻译结果组件
│   │   ├── FeedbackBoard/       # 反馈留言板组件
│   │   └── CultureCard/         # 文化科普卡片组件
│   ├── hooks/             # 自定义Hook
│   │   ├── useTranslation.ts    # 翻译Hook
│   │   ├── useFeedback.ts       # 反馈Hook
│   │   └── useCulture.ts        # 文化科普Hook
│   ├── services/          # API服务
│   │   ├── translationApi.ts    # 翻译API
│   │   ├── feedbackApi.ts       # 反馈API
│   │   └── cultureApi.ts        # 文化科普API
│   ├── types/             # TypeScript类型定义
│   │   ├── translation.ts       # 翻译相关类型
│   │   ├── feedback.ts          # 反馈相关类型
│   │   └── culture.ts           # 文化科普类型
│   └── pages/             # 页面组件
│       └── Home.tsx       # 主页
├── .env.example           # 环境变量模板
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## API接口

### 翻译相关
- `POST /api/dialect/detect` - 方言归属地推理
- `POST /api/translate` - 方言翻译

### 反馈相关
- `POST /api/feedback` - 提交反馈
- `GET /api/feedback` - 获取反馈列表
- `POST /api/feedback/:id/vote` - 反馈投票

### 文化科普
- `GET /api/culture/:region` - 获取文化科普内容

### 其他
- `GET /api/health` - 健康检查
- `GET /api/stats` - 获取统计数据

## 开发指南

### 核心开发原则
1. **范围严格**：严禁开发PRD规定范围之外的任何功能
2. **无模拟数据**：产品中不得使用任何Mock或伪数据
3. **API合规**：所有LLM服务调用必须使用指定的API
4. **配置灵活性**：LLM服务配置通过环境变量管理

### 响应式设计
- **桌面端 (≥1024px)**：三栏布局
- **平板端 (768px-1023px)**：两栏布局
- **移动端 (<768px)**：单栏布局

### 安全考虑
- API密钥通过环境变量管理
- IP地址仅存储哈希值
- 前后端双重输入验证
- 实现速率限制防止滥用

## 部署

### 生产环境配置
1. 设置正确的环境变量
2. 配置Supabase数据库
3. 设置域名和CORS策略
4. 启用HTTPS

### Docker部署
```bash
# 构建镜像
docker build -t dialect-translator .

# 运行容器
docker run -p 3000:3000 --env-file .env dialect-translator
```

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 免责声明

本平台所有翻译和反馈内容均由AI或用户生成，平台不对其准确性负责。请理性使用翻译结果，如有疑问请咨询专业语言学者。

## 联系我们

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件至：[your-email@example.com]

---

**乡音方言翻译平台** - 传承中华方言文化，连接古今语言之美