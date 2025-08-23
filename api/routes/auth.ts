import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { llmService } from '../services/llmService.js';
import { databaseService } from '../services/databaseService.js';
import { geolocationService } from '../services/geolocationService.js';

const router = Router();

// 创建IP哈希
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

// 速率限制配置
const translateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 30, // 每15分钟最多30次翻译请求
  message: { success: false, error: '请求过于频繁，请稍后再试' }
});

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 每小时最多10次反馈
  message: { success: false, error: '反馈提交过于频繁，请稍后再试' }
});

const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 20, // 每分钟最多20次投票
  message: { success: false, error: '投票过于频繁，请稍后再试' }
});

// 获取客户端IP地址
function getClientIP(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         '127.0.0.1';
}

// 方言归属地推理
router.post('/dialect/detect', translateLimiter, async (req, res) => {
  try {
    const { text, model } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的文本内容'
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        error: '文本长度不能超过500字符'
      });
    }

    const result = await llmService.detectDialectRegion({ text, model });
    res.json(result);
  } catch (error) {
    console.error('方言归属地推理错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 方言翻译
router.post('/translate', translateLimiter, async (req, res) => {
  try {
    const { text, sourceType, targetType, region, targetDialect, model } = req.body;
    
    // 参数验证
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的文本内容'
      });
    }

    if (!sourceType || !targetType) {
      return res.status(400).json({
        success: false,
        error: '请指定源语言和目标语言类型'
      });
    }

    if (!['dialect', 'mandarin'].includes(sourceType) || !['dialect', 'mandarin'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        error: '语言类型只能是dialect或mandarin'
      });
    }

    if (sourceType === 'dialect' && !region) {
      return res.status(400).json({
        success: false,
        error: '方言翻译需要指定归属地区'
      });
    }

    if (sourceType === 'mandarin' && targetType === 'dialect' && !targetDialect) {
      return res.status(400).json({
        success: false,
        error: '普通话转方言需要指定目标方言'
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: '文本长度不能超过1000字符'
      });
    }

    const result = await llmService.translateText({
      text,
      sourceType,
      targetType,
      region,
      targetDialect,
      model
    });

    // 记录翻译日志
    if (result.success) {
      const clientIP = getClientIP(req);
      await databaseService.logTranslation({
        sourceText: text,
        sourceType,
        targetType,
        region,
        translationResult: result.data,
        modelUsed: model,
        ipHash: hashIP(clientIP)
      });
    }

    res.json(result);
  } catch (error) {
    console.error('翻译错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 提交反馈
router.post('/feedback', feedbackLimiter, async (req, res) => {
  try {
    const { originalText, originalTranslation, correctedTranslation, region, comment } = req.body;
    
    // 参数验证
    if (!originalText || !originalTranslation || !correctedTranslation || !region) {
      return res.status(400).json({
        success: false,
        error: '请提供完整的反馈信息'
      });
    }

    if (originalText.length > 1000 || originalTranslation.length > 1000 || correctedTranslation.length > 1000) {
      return res.status(400).json({
        success: false,
        error: '文本长度不能超过1000字符'
      });
    }

    if (comment && comment.length > 500) {
      return res.status(400).json({
        success: false,
        error: '评论长度不能超过500字符'
      });
    }

    const clientIP = getClientIP(req);
    const locationResult = await geolocationService.getLocationFromIP(clientIP);
    const userLocation = locationResult.location || '未知地区';

    const result = await databaseService.createFeedback({
      originalText,
      originalTranslation,
      correctedTranslation,
      region,
      comment,
      ipHash: hashIP(clientIP),
      userLocation
    });

    res.json(result);
  } catch (error) {
    console.error('提交反馈错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 反馈投票
router.post('/feedback/:id/vote', voteLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    
    if (!type || !['up', 'down'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: '投票类型只能是up或down'
      });
    }

    const clientIP = getClientIP(req);
    const clientIPHash = hashIP(clientIP);
    
    // 检查是否已投票
    const existingVote = await databaseService.getVoteByFeedbackAndIP(id, clientIPHash);
    
    if (existingVote) {
      if (existingVote.vote_type === type) {
        // 取消投票 - 删除现有投票
        await databaseService.deleteVote(id, clientIPHash);
        const stats = await databaseService.getVoteStats(id);
        return res.json({
          success: true,
          data: { action: 'removed', ...stats }
        });
      } else {
        // 更新投票类型
        await databaseService.updateVote(id, clientIPHash, type);
        const stats = await databaseService.getVoteStats(id);
        return res.json({
          success: true,
          data: { action: 'updated', ...stats }
        });
      }
    }
    
    // 创建新投票
    await databaseService.createVote({
      feedbackId: id,
      voteType: type,
      ipHash: clientIPHash
    });
    
    const stats = await databaseService.getVoteStats(id);
    res.json({
       success: true,
       data: { action: 'created', ...stats }
     });
  } catch (error) {
    console.error('投票错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取反馈列表
router.get('/feedback', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50); // 最大50条
    
    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        error: '页码和限制数量必须大于0'
      });
    }

    const clientIP = getClientIP(req);
    const result = await databaseService.getFeedbackList(page, limit);
    
    // 格式化用户位置显示
    const formattedResult = result.map((feedback: any) => ({
      ...feedback,
      user_location: geolocationService.formatLocationDisplay(feedback.user_location)
    }));

    res.json({
      success: true,
      data: formattedResult
    });
  } catch (error) {
    console.error('获取反馈列表错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取文化科普内容
router.get('/culture/:region', async (req, res) => {
  try {
    const { region } = req.params;
    
    if (!region || region.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的地区名称'
      });
    }

    // 先查询缓存
    const cacheResult = await databaseService.getCultureCache(region);
    
    if (cacheResult.success && cacheResult.data) {
      // 缓存命中
      return res.json({
        success: true,
        data: {
          region: cacheResult.data.region,
          content: cacheResult.data.content
        }
      });
    }

    // 缓存未命中，生成新内容
    const generateResult = await llmService.generateCultureContent(region);
    
    if (generateResult.success && generateResult.data) {
      // 缓存新生成的内容
      await databaseService.setCultureCache(region, generateResult.data);
      
      return res.json({
        success: true,
        data: {
          region,
          content: generateResult.data
        }
      });
    }

    res.json(generateResult);
  } catch (error) {
    console.error('获取文化科普内容错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取翻译统计（可选功能）
router.get('/stats', async (req, res) => {
  try {
    const result = await databaseService.getTranslationStats();
    res.json(result);
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '乡音方言翻译平台API服务正常运行',
    timestamp: new Date().toISOString()
  });
});

export default router;