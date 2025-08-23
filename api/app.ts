import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import authRoutes from './routes/auth.js';
import translationRoutes from './routes/translation.js';
import feedbackRoutes from './routes/feedback.js';
import cultureRoutes from './routes/culture.js';
import statsRoutes from './routes/stats.js';

// 加载环境变量
config();

const app = express();

// 信任代理设置（用于 Zeabur、Vercel 等云平台）
app.set('trust proxy', true);

// 安全中间件
app.use(helmet());

// CORS配置
function getAllowedOrigins() {
  if (process.env.NODE_ENV === 'production') {
    // 生产环境支持的域名列表
    const allowedDomains = [
      // Zeabur 部署域名
      /\.zeabur\.app$/,
      // Vercel 部署域名
      /\.vercel\.app$/,
      // Railway 部署域名
      /\.railway\.app$/,
      // Render 部署域名
      /\.onrender\.com$/,
      // 自定义域名（如果有的话）
      'https://your-domain.com'
    ];
    
    return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // 允许无 origin 的请求（如移动应用）
      if (!origin) return callback(null, true);
      
      // 检查域名是否匹配
      const isAllowed = allowedDomains.some(domain => {
        if (typeof domain === 'string') {
          return origin === domain;
        } else {
          return domain.test(origin);
        }
      });
      
      callback(null, isAllowed);
    };
  } else {
    // 开发环境
    return ['http://localhost:5173', 'http://localhost:3000'];
  }
}

app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 全局速率限制
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每15分钟最多100个请求
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 安全的 key generator，结合真实 IP 和 X-Forwarded-For
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  // 跳过本地和内部 IP 的检查
  skip: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    return ip === '127.0.0.1' || ip === '::1' || ip?.startsWith('192.168.') || ip?.startsWith('10.');
  }
});

app.use(globalLimiter);

// 解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// API路由
app.use('/auth', authRoutes);
app.use('/', translationRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/culture', cultureRoutes);
app.use('/stats', statsRoutes);

// LLM API专用速率限制
const llmLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 20, // 每分钟最多20个LLM请求
  message: {
    success: false,
    error: 'LLM请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 安全的 key generator
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  // 跳过本地和内部 IP 的检查
  skip: (req) => {
    const ip = req.ip || req.connection.remoteAddress;
    return ip === '127.0.0.1' || ip === '::1' || ip?.startsWith('192.168.') || ip?.startsWith('10.');
  }
});

// 对翻译和检测接口应用更严格的限制
app.use('/translate', llmLimiter);
app.use('/dialect/detect', llmLimiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '乡音方言翻译平台API服务正常运行',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    path: req.originalUrl
  });
});

// 全局错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('全局错误:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

export default app;