import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// 使用统一的API配置
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 方言统计数据类型
export interface DialectRankingItem {
  region: string;
  translationCount: number;
  userCount: number;
  popularPhrases: string[];
  cultureGenerated: boolean;
  trend: string;
}

export interface OverviewStats {
  totalTranslations: number;
  totalUsers: number;
  totalRegions: number;
  totalFeedbacks: number;
}

export interface PopularPhrase {
  phrase: string;
  region: string;
  count: number;
}

export interface StatsResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 统计API服务
export class StatsApiService {
  // 获取方言打榜数据
  static async getDialectRanking(
    timeRange: '1d' | '7d' | '30d' = '7d'
  ): Promise<StatsResponse<DialectRankingItem[]>> {
    try {
      const response = await api.get('/stats/dialect-ranking', {
        params: { timeRange }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || '获取方言打榜数据失败'
      };
    }
  }

  // 获取总体统计数据
  static async getOverviewStats(): Promise<StatsResponse<OverviewStats>> {
    try {
      const response = await api.get('/stats/overview');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || '获取总体统计数据失败'
      };
    }
  }

  // 获取热门短语
  static async getPopularPhrases(
    timeRange: '1d' | '7d' | '30d' = '7d',
    limit: number = 10
  ): Promise<StatsResponse<PopularPhrase[]>> {
    try {
      const response = await api.get('/stats/popular-phrases', {
        params: { timeRange, limit }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || '获取热门短语失败'
      };
    }
  }
}

export default StatsApiService;