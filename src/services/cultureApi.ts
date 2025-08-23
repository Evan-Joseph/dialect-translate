import axios from 'axios';
import { CultureResponse } from '../types/culture';
import { API_BASE_URL } from '../config/api';

// 使用统一的API配置
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 文化科普API服务
export class CultureApiService {
  // 获取文化科普内容
  static async getCultureContent(region: string): Promise<CultureResponse> {
    try {
      const response = await api.get(`/culture/${encodeURIComponent(region)}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || '获取文化科普内容失败'
      };
    }
  }

  // 批量获取多个地区的文化内容
  static async getBatchCultureContent(regions: string[]): Promise<{
    success: boolean;
    data?: Record<string, any>;
    error?: string;
  }> {
    try {
      const promises = regions.map(region => this.getCultureContent(region));
      const results = await Promise.allSettled(promises);
      
      const data: Record<string, any> = {};
      const errors: string[] = [];
      
      results.forEach((result, index) => {
        const region = regions[index];
        if (result.status === 'fulfilled' && result.value.success) {
          data[region] = result.value.data;
        } else {
          errors.push(`${region}: ${result.status === 'fulfilled' ? result.value.error : '请求失败'}`);
        }
      });
      
      return {
        success: errors.length === 0,
        data,
        error: errors.length > 0 ? errors.join('; ') : undefined
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '批量获取文化内容失败'
      };
    }
  }
}

export default CultureApiService;