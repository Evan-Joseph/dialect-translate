import { Router, Request, Response } from 'express';
import { llmService } from '../services/llmService.js';
import { databaseService } from '../services/databaseService.js';

const router = Router();

// 获取文化科普内容
router.get('/:region', async (req: Request, res: Response) => {
  try {
    const region = req.params.region;
    
    if (!region || typeof region !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的地区名称'
      });
    }

    // 首先检查数据库缓存
    let cultureContent = await databaseService.getCultureCache(region);
    
    if (cultureContent) {
      // 缓存命中，直接返回
      return res.json({
        success: true,
        data: {
          region,
          content: cultureContent,
          cached: true
        }
      });
    }

    // 缓存未命中，调用LLM生成内容
    const model = req.query.model as string;
    const result = await llmService.generateCultureContent(region, model);
    
    if (result.success && result.data) {
      // 保存到缓存
      try {
        await databaseService.setCultureCache(region, result.data);
      } catch (cacheError) {
        console.error('保存文化科普缓存失败:', cacheError);
        // 不影响内容返回
      }

      res.json({
        success: true,
        data: {
          region,
          content: result.data,
          cached: false
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || '生成文化科普内容失败'
      });
    }
  } catch (error) {
    console.error('获取文化科普内容错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 刷新文化科普缓存
router.post('/:region/refresh', async (req: Request, res: Response) => {
  try {
    const region = req.params.region;
    const model = req.body.model;
    
    if (!region || typeof region !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的地区名称'
      });
    }

    // 强制重新生成内容
    const result = await llmService.generateCultureContent(region, model);
    
    if (result.success && result.data) {
      // 更新缓存
      await databaseService.setCultureCache(region, result.data);
      
      res.json({
        success: true,
        data: {
          region,
          content: result.data,
          refreshed: true
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || '刷新文化科普内容失败'
      });
    }
  } catch (error) {
    console.error('刷新文化科普内容错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取所有已缓存的地区列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const regions = await databaseService.getCachedRegions();
    
    res.json({
      success: true,
      data: {
        regions,
        count: regions.length
      }
    });
  } catch (error) {
    console.error('获取地区列表错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

export default router;