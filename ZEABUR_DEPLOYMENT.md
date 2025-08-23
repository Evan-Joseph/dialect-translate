# Zeabur 部署指南

## 问题诊断

如果 API 请求返回 HTML 页面而不是 JSON 数据，说明后端服务没有正确启动或配置。

### 当前问题
- 请求 `https://dialect.zeabur.app/api/...` 返回前端 HTML 页面
- 后端 API 服务没有正确响应

## Zeabur 部署步骤

### 1. 项目配置

确保项目包含以下文件：
- ✅ `zeabur.json` - Zeabur 部署配置
- ✅ `tsconfig.server.json` - 后端 TypeScript 配置
- ✅ `package.json` 包含正确的构建和启动脚本

### 2. 在 Zeabur 控制台设置环境变量

```bash
# 前端配置
VITE_API_BASE_URL=/api

# 后端配置
NODE_ENV=production
PORT=3000

# LLM API 配置
CHATANYWHERE_API_KEY=your_api_key
CHATANYWHERE_BASE_URL=https://api.chatanywhere.tech/v1
XUNFEI_API_PASSWORD=your_password
XUNFEI_ENDPOINT=https://spark-api-open.xf-yun.com/v1/chat/completions
ZHIPU_API_KEY=your_api_key
ZHIPU_ENDPOINT=https://open.bigmodel.cn/api/paas/v4/chat/completions

# 数据库配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# 可选配置
IP_GEOLOCATION_API_KEY=your_ip_api_key
```

### 3. Zeabur 项目设置

#### 方案A：单个服务部署（推荐）
1. 在 Zeabur 创建新项目
2. 连接 GitHub 仓库
3. Zeabur 会自动检测到 `zeabur.json` 配置
4. 设置环境变量
5. 部署

#### 方案B：前后端分离部署
如果需要分离部署：
1. **前端服务**：
   - 构建命令：`npm run build`
   - 输出目录：`dist`
   - 服务类型：Static

2. **后端服务**：
   - 构建命令：`npm run build:server`
   - 启动命令：`npm start`
   - 服务类型：Node.js

### 4. 验证部署

#### 检查后端 API
访问：`https://your-domain.zeabur.app/api/health`

应该返回：
```json
{
  "success": true,
  "message": "乡音方言翻译平台API服务正常运行",
  "version": "1.0.0",
  "timestamp": "...",
  "uptime": "...",
  "environment": "production"
}
```

#### 检查前端
访问：`https://your-domain.zeabur.app`

控制台应显示：
```
🔌 API配置: {VITE_API_BASE_URL: "/api", isProd: true, finalBaseUrl: "/api"}
```

### 5. 常见问题排查

#### 问题1：API 返回 HTML 页面
**原因**：后端服务没有启动
**解决**：
1. 检查 Zeabur 部署日志
2. 确认 `npm start` 命令能正确启动后端
3. 确认端口配置为 3000
4. 检查环境变量是否正确设置

#### 问题2：前端无法访问 API
**原因**：CORS 配置或路由问题
**解决**：
1. 确认后端 CORS 配置包含 `.zeabur.app` 域名
2. 检查前端 `VITE_API_BASE_URL=/api` 设置

#### 问题3：构建失败
**原因**：依赖或配置问题
**解决**：
1. 检查 `tsconfig.server.json` 文件是否存在
2. 确认所有依赖都在 `package.json` 中
3. 查看构建日志获取详细错误信息

### 6. 本地测试生产构建

在部署前，本地测试：

```bash
# 构建后端
npm run build:server

# 构建前端
npm run build

# 启动生产服务器
npm start

# 测试 API
curl http://localhost:3000/api/health
```

### 7. 手动部署检查清单

- [ ] 环境变量设置完整
- [ ] `zeabur.json` 配置正确
- [ ] `package.json` 包含 `start` 脚本
- [ ] `tsconfig.server.json` 存在
- [ ] 后端端口配置为 3000
- [ ] CORS 配置包含 Zeabur 域名
- [ ] 前端 `VITE_API_BASE_URL=/api`

完成这些步骤后，你的 API 应该能正确响应 JSON 数据而不是 HTML 页面。