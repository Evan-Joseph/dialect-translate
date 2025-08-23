import { Router, Request, Response } from 'express';
import { llmService } from '../services/llmService.js';
import { databaseService } from '../services/databaseService.js';
import { geolocationService } from '../services/geolocationService.js';
import crypto from 'crypto';

const router = Router();

// 方言归属地推理
router.post('/dialect/detect', async (req: Request, res: Response) => {
  try {
    const { text, model } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的文本内容'
      });
    }

    const result = await llmService.detectDialectRegion({ text, model });
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('方言归属地推理错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 方言翻译
router.post('/translate', async (req: Request, res: Response) => {
  try {
    const { text, sourceType, targetType, region, targetDialect, model } = req.body;
    
    // 参数验证
    if (!text || typeof text !== 'string') {
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
        error: '方言翻译需要指定归属地'
      });
    }

    if (targetType === 'dialect' && !targetDialect) {
      return res.status(400).json({
        success: false,
        error: '翻译为方言需要指定目标方言'
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

    if (result.success) {
      // 记录翻译日志
      try {
        const clientIP = req.ip || req.connection.remoteAddress || '';
        const ipHash = crypto.createHash('sha256').update(clientIP).digest('hex');
        
        await databaseService.logTranslation({
          sourceText: text,
          sourceType,
          targetType,
          region: region || targetDialect,
          translationResult: result.data,
          modelUsed: model || 'default',
          ipHash
        });
      } catch (logError) {
        console.error('翻译日志记录失败:', logError);
        // 不影响翻译结果返回
      }

      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('翻译错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 流式翻译
router.post('/translate/stream', async (req: Request, res: Response) => {
  try {
    const { text, sourceType, targetType, region, targetDialect, model } = req.body;
    
    // 参数验证（同上）
    if (!text || typeof text !== 'string') {
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

    // 设置SSE响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    try {
      const stream = await llmService.translateTextStream({
        text,
        sourceType,
        targetType,
        region,
        targetDialect,
        model
      });

      let fullContent = '';
      for await (const chunk of stream) {
        fullContent += chunk;
        // 发送原始内容块
        res.write(`data: ${chunk}\n\n`);
      }

      // 流式传输完成标记
      res.write(`data: [DONE]\n\n`);
      res.end();

      // 记录翻译日志
      try {
        const clientIP = req.ip || req.connection.remoteAddress || '';
        const ipHash = crypto.createHash('sha256').update(clientIP).digest('hex');
        
        // 尝试解析完整内容以获取翻译结果
        let translationResult;
        try {
          translationResult = JSON.parse(fullContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim());
        } catch {
          translationResult = { content: fullContent };
        }
        
        await databaseService.logTranslation({
          sourceText: text,
          sourceType,
          targetType,
          region: region || targetDialect,
          translationResult,
          modelUsed: model || 'default',
          ipHash
        });
      } catch (logError) {
        console.error('流式翻译日志记录失败:', logError);
      }
    } catch (streamError) {
      console.error('流式翻译处理失败:', streamError);
      res.write(`data: ${JSON.stringify({ error: '流式翻译失败' })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('流式翻译错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// LLM服务健康检查
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await llmService.healthCheck();
    const stats = llmService.getProviderStats();
    
    res.json({
      success: true,
      data: {
        providers: healthStatus,
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('健康检查失败:', error);
    res.status(500).json({
      success: false,
      error: '健康检查服务暂时不可用'
    });
  }
});

// 重置提供商状态
router.post('/reset-provider/:providerName', async (req, res) => {
  try {
    const { providerName } = req.params;
    llmService.resetProviderStatus(providerName);
    
    res.json({
      success: true,
      message: `${providerName} 状态已重置`
    });
  } catch (error) {
    console.error('重置提供商状态失败:', error);
    res.status(500).json({
      success: false,
      error: '重置操作失败'
    });
  }
});

export default router;