import { Router, Request, Response } from 'express';
import { databaseService } from '../services/databaseService.js';

const router = Router();

// 获取方言打榜统计数据
router.get('/dialect-ranking', async (req: Request, res: Response) => {
  try {
    const timeRange = req.query.timeRange as string || '7d';
    
    // 计算时间范围
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // 获取方言统计数据
    const dialectStats = await databaseService.getDialectRankingStats(startDate, now);
    
    res.json({
      success: true,
      data: dialectStats
    });
  } catch (error) {
    console.error('获取方言打榜数据错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取总体统计数据
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const overviewStats = await databaseService.getOverviewStats();
    
    res.json({
      success: true,
      data: overviewStats
    });
  } catch (error) {
    console.error('获取总体统计数据错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取热门短语
router.get('/popular-phrases', async (req: Request, res: Response) => {
  try {
    const timeRange = req.query.timeRange as string || '7d';
    const limit = parseInt(req.query.limit as string) || 10;
    
    const popularPhrases = await databaseService.getPopularPhrases(timeRange, limit);
    
    res.json({
      success: true,
      data: popularPhrases
    });
  } catch (error) {
    console.error('获取热门短语错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

export default router;