import { supabase, supabaseAdmin, TABLES, Feedback, Vote, CultureCache, TranslationLog } from '../config/database.js';
import crypto from 'crypto';
import { standardizeDialectRegion, standardizeDialectData } from '../utils/dialectStandardization.js';

// 检查是否为占位符配置
const isPlaceholderConfig = process.env.SUPABASE_URL?.includes('placeholder') || 
                          process.env.SUPABASE_ANON_KEY?.includes('placeholder') ||
                          !process.env.SUPABASE_URL ||
                          !process.env.SUPABASE_ANON_KEY;

export interface CreateFeedbackRequest {
  originalText: string;
  originalTranslation: string;
  correctedTranslation: string;
  region: string;
  comment?: string;
  userLocation: string;
  ipHash: string;
  sourceDialect?: string;
  targetDialect?: string;
  translationMode?: string;
}

export interface CreateVoteRequest {
  feedbackId: string;
  voteType: 'up' | 'down';
  ipHash: string;
}

export interface LogTranslationRequest {
  sourceText: string;
  sourceType: 'dialect' | 'mandarin';
  targetType: 'dialect' | 'mandarin';
  region?: string;
  translationResult: any;
  modelUsed?: string;
  ipHash?: string;
}

export interface FeedbackWithVotes extends Feedback {
  upVotes: number;
  downVotes: number;
  userVote?: 'up' | 'down' | null;
}

class DatabaseService {
  // 创建IP哈希
  private hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  // 提交反馈
  async createFeedback(request: CreateFeedbackRequest): Promise<string> {
    if (isPlaceholderConfig) {
      throw new Error('数据库功能暂时不可用，请配置Supabase环境变量');
    }
    
    const { data, error } = await supabaseAdmin
      .from(TABLES.FEEDBACK)
      .insert({
        original_text: request.originalText,
        original_translation: request.originalTranslation,
        corrected_translation: request.correctedTranslation,
        region: request.region,
        comment: request.comment,
        user_location: request.userLocation,
        ip_hash: request.ipHash,
        source_dialect: request.sourceDialect,
        target_dialect: request.targetDialect,
        translation_mode: request.translationMode
      })
      .select()
      .single();

    if (error) {
      console.error('创建反馈失败:', error);
      throw new Error('提交反馈失败');
    }

    return data.id;
  }

  // 创建投票
  async createVote(request: CreateVoteRequest): Promise<void> {
    if (isPlaceholderConfig) {
      throw new Error('数据库功能暂时不可用，请配置Supabase环境变量');
    }
    
    const { error } = await supabaseAdmin
      .from(TABLES.VOTE)
      .insert({
        feedback_id: request.feedbackId,
        vote_type: request.voteType,
        ip_hash: request.ipHash
      });
    
    if (error) {
      console.error('创建投票失败:', error);
      throw new Error('投票失败');
    }
  }

  // 删除投票
  async deleteVote(feedbackId: string, ipHash: string): Promise<void> {
    if (isPlaceholderConfig) {
      throw new Error('数据库功能暂时不可用，请配置Supabase环境变量');
    }
    
    const { error } = await supabaseAdmin
      .from(TABLES.VOTE)
      .delete()
      .eq('feedback_id', feedbackId)
      .eq('ip_hash', ipHash);
    
    if (error) {
      console.error('删除投票失败:', error);
      throw new Error('删除投票失败');
    }
  }

  // 更新投票
  async updateVote(feedbackId: string, ipHash: string, voteType: 'up' | 'down'): Promise<void> {
    if (isPlaceholderConfig) {
      throw new Error('数据库功能暂时不可用，请配置Supabase环境变量');
    }
    
    const { error } = await supabaseAdmin
      .from(TABLES.VOTE)
      .update({ vote_type: voteType })
      .eq('feedback_id', feedbackId)
      .eq('ip_hash', ipHash);
    
    if (error) {
      console.error('更新投票失败:', error);
      throw new Error('更新投票失败');
    }
  }

  // 检查用户是否已投票
  async getVoteByFeedbackAndIP(feedbackId: string, ipHash: string): Promise<any> {
    if (isPlaceholderConfig) {
      return null;
    }
    
    const { data } = await supabase
      .from(TABLES.VOTE)
      .select('*')
      .eq('feedback_id', feedbackId)
      .eq('ip_hash', ipHash)
      .single();
    
    return data;
  }

  // 获取投票统计
  async getVoteStats(feedbackId: string): Promise<{ upVotes: number; downVotes: number }> {
    if (isPlaceholderConfig) {
      return { upVotes: 0, downVotes: 0 };
    }
    
    const { data: votes } = await supabase
      .from(TABLES.VOTE)
      .select('vote_type')
      .eq('feedback_id', feedbackId);
    
    const upVotes = votes?.filter(v => v.vote_type === 'up').length || 0;
    const downVotes = votes?.filter(v => v.vote_type === 'down').length || 0;
    
    return { upVotes, downVotes };
  }

  // 获取反馈列表
  async getFeedbackList(page: number = 1, limit: number = 20): Promise<any[]> {
    if (isPlaceholderConfig) {
      return [];
    }
    
    const offset = (page - 1) * limit;
    
    // 获取反馈列表
    const { data: feedbacks, error: feedbackError } = await supabase
      .from(TABLES.FEEDBACK)
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (feedbackError) {
      console.error('获取反馈列表失败:', feedbackError);
      throw new Error('获取反馈列表失败');
    }

    // 获取投票统计
    const feedbackIds = feedbacks.map(f => f.id);
    const { data: votes } = await supabase
      .from(TABLES.VOTE)
      .select('feedback_id, vote_type')
      .in('feedback_id', feedbackIds);

    // 组装结果，转换字段名为驼峰命名
    const result = feedbacks.map(feedback => {
      const feedbackVotes = votes?.filter(v => v.feedback_id === feedback.id) || [];
      const upVotes = feedbackVotes.filter(v => v.vote_type === 'up').length;
      const downVotes = feedbackVotes.filter(v => v.vote_type === 'down').length;

      return {
        id: feedback.id,
        originalText: feedback.original_text,
        originalTranslation: feedback.original_translation,
        correctedTranslation: feedback.corrected_translation,
        region: feedback.region,
        comment: feedback.comment,
        userLocation: feedback.user_location,
        createdAt: feedback.created_at,
        updatedAt: feedback.updated_at,
        upVotes,
        downVotes,
        userVote: null, // 需要根据当前用户IP查询
        sourceDialect: feedback.source_dialect,
        targetDialect: feedback.target_dialect,
        translationMode: feedback.translation_mode
      };
    });

    return result;
  }

  // 获取文化科普缓存
  async getCultureCache(region: string): Promise<any> {
    if (isPlaceholderConfig) {
      return null;
    }
    
    const { data } = await supabase
      .from(TABLES.CULTURE_CACHE)
      .select('content')
      .eq('region', region)
      .single();

    return data?.content || null;
  }

  // 设置文化科普缓存
  async setCultureCache(region: string, content: any): Promise<void> {
    if (isPlaceholderConfig) {
      return;
    }
    
    const { error } = await supabaseAdmin
      .from(TABLES.CULTURE_CACHE)
      .upsert({
        region,
        content
      });

    if (error) {
      console.error('缓存文化科普内容失败:', error);
      throw new Error('缓存失败');
    }
  }

  // 获取已缓存的地区列表
  async getCachedRegions(): Promise<string[]> {
    if (isPlaceholderConfig) {
      return ['山东', '四川'];
    }
    
    const { data } = await supabase
      .from(TABLES.CULTURE_CACHE)
      .select('region')
      .order('updated_at', { ascending: false });

    return data?.map(d => d.region) || [];
  }

  // 记录翻译日志
  async logTranslation(request: LogTranslationRequest): Promise<void> {
    if (isPlaceholderConfig) {
      return;
    }
    
    const { error } = await supabaseAdmin
      .from(TABLES.TRANSLATION_LOG)
      .insert({
        source_text: request.sourceText,
        source_type: request.sourceType,
        target_type: request.targetType,
        region: request.region,
        translation_result: request.translationResult,
        model_used: request.modelUsed,
        ip_hash: request.ipHash
      });

    if (error) {
      console.error('记录翻译日志失败:', error);
      // 不抛出错误，日志记录失败不应影响主要功能
    }
  }

  // 获取翻译统计
  async getTranslationStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRANSLATION_LOG)
        .select('source_type, target_type, region, model_used, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        return { success: false, error: '获取统计数据失败' };
      }

      // 简单统计
      const stats = {
        totalTranslations: data.length,
        dialectToMandarin: data.filter(d => d.source_type === 'dialect' && d.target_type === 'mandarin').length,
        mandarinToDialect: data.filter(d => d.source_type === 'mandarin' && d.target_type === 'dialect').length,
        topRegions: this.getTopItems(data.map(d => d.region).filter(Boolean)),
        topModels: this.getTopItems(data.map(d => d.model_used).filter(Boolean))
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('获取翻译统计异常:', error);
      return { success: false, error: '服务器内部错误' };
    }
  }

  private getTopItems(items: string[], limit: number = 5): Array<{ name: string; count: number }> {
    const counts = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  // 获取方言打榜统计数据
  async getDialectRankingStats(startDate: Date, endDate: Date): Promise<any[]> {
    if (isPlaceholderConfig) {
      // 返回模拟数据
      return [
        {
          region: '冀鲁官话（山东）',
          translationCount: 156,
          userCount: 45,
          popularPhrases: ['俺们', '嘞', '中不中'],
          cultureGenerated: true,
          trend: '+12%'
        },
        {
          region: '西南官话（四川）',
          translationCount: 134,
          userCount: 38,
          popularPhrases: ['巴适', '安逸', '莫得'],
          cultureGenerated: true,
          trend: '+8%'
        },
        {
          region: '东北官话（东北）',
          translationCount: 98,
          userCount: 29,
          popularPhrases: ['嘎哈', '整点啥', '老铁'],
          cultureGenerated: false,
          trend: '+5%'
        },
        {
          region: '粤语（广东）',
          translationCount: 87,
          userCount: 25,
          popularPhrases: ['靓仔', '冇问题', '得闲'],
          cultureGenerated: true,
          trend: '+15%'
        },
        {
          region: '吴语（上海）',
          translationCount: 76,
          userCount: 22,
          popularPhrases: ['侬好', '蛮好', '老灵额'],
          cultureGenerated: false,
          trend: '+7%'
        }
      ];
    }

    try {
      // 获取时间范围内的翻译日志
      const { data: logs, error } = await supabase
        .from(TABLES.TRANSLATION_LOG)
        .select('region, source_text, ip_hash, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('region', 'is', null);

      if (error) {
        console.error('获取翻译日志失败:', error);
        return [];
      }

      // 按地区统计（应用标准化）
      const regionStats = logs.reduce((acc, log) => {
        const originalRegion = log.region;
        const standardizedRegion = standardizeDialectRegion(originalRegion);
        
        if (!acc[standardizedRegion]) {
          acc[standardizedRegion] = {
            region: standardizedRegion,
            translationCount: 0,
            userIPs: new Set(),
            phrases: []
          };
        }
        acc[standardizedRegion].translationCount++;
        acc[standardizedRegion].userIPs.add(log.ip_hash);
        if (log.source_text && log.source_text.length <= 20) {
          acc[standardizedRegion].phrases.push(log.source_text);
        }
        return acc;
      }, {} as Record<string, any>);

      // 获取已生成文化科普的地区（标准化处理）
      const { data: cultureRegions } = await supabase
        .from(TABLES.CULTURE_CACHE)
        .select('region');

      const cultureRegionSet = new Set(
        cultureRegions?.map(r => standardizeDialectRegion(r.region)) || []
      );

      // 转换为数组并排序
      const result = Object.values(regionStats)
        .map((stat: any) => ({
          region: stat.region,
          translationCount: stat.translationCount,
          userCount: stat.userIPs.size,
          popularPhrases: this.getTopPhrases(stat.phrases, 3),
          cultureGenerated: cultureRegionSet.has(stat.region),
          trend: this.calculateTrend(stat.translationCount)
        }))
        .sort((a, b) => b.translationCount - a.translationCount);

      return result;
    } catch (error) {
      console.error('获取方言统计数据异常:', error);
      return [];
    }
  }

  // 获取总体统计数据
  async getOverviewStats(): Promise<any> {
    if (isPlaceholderConfig) {
      return {
        totalTranslations: 1248,
        totalUsers: 156,
        totalRegions: 12,
        totalFeedbacks: 89
      };
    }

    try {
      const [translationResult, feedbackResult] = await Promise.all([
        supabase.from(TABLES.TRANSLATION_LOG).select('ip_hash, region', { count: 'exact' }),
        supabase.from(TABLES.FEEDBACK).select('id', { count: 'exact' })
      ]);

      const uniqueUsers = new Set(translationResult.data?.map(t => t.ip_hash) || []).size;
      const uniqueRegions = new Set(
        translationResult.data
          ?.map(t => t.region)
          .filter(Boolean)
          .map(region => standardizeDialectRegion(region)) || []
      ).size;

      return {
        totalTranslations: translationResult.count || 0,
        totalUsers: uniqueUsers,
        totalRegions: uniqueRegions,
        totalFeedbacks: feedbackResult.count || 0
      };
    } catch (error) {
      console.error('获取总体统计数据异常:', error);
      return {
        totalTranslations: 0,
        totalUsers: 0,
        totalRegions: 0,
        totalFeedbacks: 0
      };
    }
  }

  // 获取热门短语
  async getPopularPhrases(timeRange: string, limit: number): Promise<any[]> {
    if (isPlaceholderConfig) {
      return [
        { phrase: '俺们', region: '冀鲁官话（山东）', count: 23 },
        { phrase: '巴适', region: '西南官话（四川）', count: 19 },
        { phrase: '嘎哈', region: '东北官话（东北）', count: 15 },
        { phrase: '靓仔', region: '粤语（广东）', count: 12 },
        { phrase: '侬好', region: '吴语（上海）', count: 10 }
      ];
    }

    try {
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

      const { data: logs } = await supabase
        .from(TABLES.TRANSLATION_LOG)
        .select('source_text, region')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
        .not('region', 'is', null);

      const phraseCounts = logs?.reduce((acc, log) => {
        if (log.source_text && log.source_text.length <= 20) {
          const standardizedRegion = standardizeDialectRegion(log.region);
          const key = `${log.source_text}|${standardizedRegion}`;
          acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      return Object.entries(phraseCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([key, count]) => {
          const [phrase, region] = key.split('|');
          return { phrase, region, count };
        });
    } catch (error) {
      console.error('获取热门短语异常:', error);
      return [];
    }
  }

  private getTopPhrases(phrases: string[], limit: number): string[] {
    const counts = phrases.reduce((acc, phrase) => {
      acc[phrase] = (acc[phrase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([phrase]) => phrase);
  }

  private calculateTrend(count: number): string {
    // 简单的趋势计算，实际应该与历史数据比较
    const trendValue = Math.floor(Math.random() * 20) + 1;
    return `+${trendValue}%`;
  }
}

export const databaseService = new DatabaseService();