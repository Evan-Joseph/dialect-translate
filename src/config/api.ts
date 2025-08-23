// API 配置
function getApiBaseUrl(): string {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 生产环境自动检测
  if (import.meta.env.PROD) {
    // 在生产环境中使用相对路径，这样会自动适配当前域名
    return '/api';
  }
  
  // 开发环境回退
  return 'http://localhost:3000/api';
}

export const API_BASE_URL = getApiBaseUrl();

// 调试日志
console.log('🔌 API配置:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  isProd: import.meta.env.PROD,
  finalBaseUrl: API_BASE_URL
});