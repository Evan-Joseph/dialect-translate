import { Router, Request, Response } from 'express';
import { databaseService } from '../services/databaseService.js';
import { geolocationService } from '../services/geolocationService.js';
import crypto from 'crypto';

const router = Router();

// 提交反馈
router.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      originalText, 
      originalTranslation, 
      correctedTranslation, 
      comment,
      sourceDialect,
      targetDialect,
      translationMode
    } = req.body;
    
    // 参数验证
    if (!originalText || !originalTranslation || !correctedTranslation) {
      return res.status(400).json({
        success: false,
        error: '请提供完整的反馈信息'
      });
    }

    // 获取用户IP和地理位置
    const clientIP = req.ip || req.connection.remoteAddress || '';
    const ipHash = crypto.createHash('sha256').update(clientIP).digest('hex');
    
    let userLocation = '未知';
    let region = '未知';
    try {
      const location = await geolocationService.getLocationByIP(clientIP);
      userLocation = location || '未知';
      region = userLocation;
    } catch (locationError) {
      console.error('获取地理位置失败:', locationError);
      userLocation = '未知';
      region = '未知';
    }

    // 保存反馈到数据库
    const feedbackId = await databaseService.createFeedback({
      originalText,
      originalTranslation,
      correctedTranslation,
      region,
      comment: comment || null,
      userLocation,
      ipHash,
      sourceDialect: sourceDialect || null,
      targetDialect: targetDialect || null,
      translationMode: translationMode || null
    });

    res.json({
      success: true,
      data: {
        id: feedbackId,
        location: userLocation
      }
    });
  } catch (error) {
    console.error('提交反馈错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取反馈列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: '页码和每页数量参数无效'
      });
    }

    const result = await databaseService.getFeedbackList(page, limit);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取反馈列表错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 投票
router.post('/:id/vote', async (req: Request, res: Response) => {
  try {
    const feedbackId = req.params.id;
    const { type } = req.body;
    
    // 参数验证
    if (!feedbackId || !type) {
      return res.status(400).json({
        success: false,
        error: '请提供反馈ID和投票类型'
      });
    }

    if (!['up', 'down'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: '投票类型只能是up或down'
      });
    }

    // 获取用户IP
    const clientIP = req.ip || req.connection.remoteAddress || '';
    const ipHash = crypto.createHash('sha256').update(clientIP).digest('hex');

    // 检查是否已经投票
    const existingVote = await databaseService.getVoteByFeedbackAndIP(feedbackId, ipHash);
    if (existingVote) {
      return res.status(400).json({
        success: false,
        error: '您已经对此反馈进行过投票'
      });
    }

    // 保存投票
    await databaseService.createVote({
      feedbackId,
      voteType: type,
      ipHash
    });

    // 获取更新后的投票统计
    const voteStats = await databaseService.getVoteStats(feedbackId);
    
    res.json({
      success: true,
      data: {
        upVotes: voteStats.upVotes,
        downVotes: voteStats.downVotes
      }
    });
  } catch (error) {
    console.error('投票错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取投票统计
router.get('/:id/votes', async (req: Request, res: Response) => {
  try {
    const feedbackId = req.params.id;
    
    if (!feedbackId) {
      return res.status(400).json({
        success: false,
        error: '请提供反馈ID'
      });
    }

    const voteStats = await databaseService.getVoteStats(feedbackId);
    
    res.json({
      success: true,
      data: voteStats
    });
  } catch (error) {
    console.error('获取投票统计错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

export default router;