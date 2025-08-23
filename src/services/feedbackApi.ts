import axios from 'axios';
import { FeedbackSubmission, FeedbackResponse, FeedbackListResponse, VoteRequest, VoteResponse } from '../types/feedback';
import { API_BASE_URL } from '../config/api';

// 使用统一的API配置
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 反馈API服务
export class FeedbackApiService {
  // 提交反馈
  static async submitFeedback(feedback: FeedbackSubmission): Promise<FeedbackResponse> {
    try {
      console.log('🌐 FeedbackApiService.submitFeedback 开始请求');
      console.log('📍 请求URL:', `${api.defaults.baseURL}/feedback`);
      console.log('📦 请求数据:', feedback);
      
      const response = await api.post('/feedback', feedback);
      console.log('📥 API 响应状态:', response.status);
      console.log('📄 API 响应数据:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('🚨 API 请求失败:', error);
      console.error('📊 错误详情:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || '提交反馈失败'
      };
    }
  }

  // 获取反馈列表
  static async getFeedbackList(
    page: number = 1,
    limit: number = 20
  ): Promise<FeedbackListResponse> {
    try {
      const response = await api.get('/feedback', {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || '获取反馈列表失败'
      };
    }
  }

  // 投票
  static async vote(feedbackId: string, voteType: 'up' | 'down'): Promise<VoteResponse> {
    try {
      const response = await api.post(`/feedback/${feedbackId}/vote`, {
        type: voteType
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || '投票失败'
      };
    }
  }

  // 获取反馈统计
  static async getFeedbackStats(): Promise<{
    success: boolean;
    data?: {
      totalFeedbacks: number;
      totalVotes: number;
      topRegions: Array<{ region: string; count: number }>;
    };
    error?: string;
  }> {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || '获取统计数据失败'
      };
    }
  }
}

export default FeedbackApiService;