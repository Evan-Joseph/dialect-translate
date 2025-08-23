import fetch from 'node-fetch';
import { config } from 'dotenv';

config();

export interface GeolocationResult {
  success: boolean;
  location?: string;
  error?: string;
}

class GeolocationService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.IP_GEOLOCATION_API_KEY || '';
  }

  // 解析IP地理位置
  async getLocationFromIP(ip: string): Promise<GeolocationResult> {
    try {
      // 本地IP地址处理
      if (this.isLocalIP(ip)) {
        return {
          success: true,
          location: '本地用户'
        };
      }

      // 如果没有配置API Key，返回默认位置
      if (!this.apiKey) {
        return {
          success: true,
          location: '未知地区'
        };
      }

      // 使用ip-api.com免费服务（无需API Key）
      const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,country,regionName,city`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as any;
      
      if (data.status === 'success') {
        let location = '';
        if (data.country === '中国' || data.country === 'China') {
          // 中国用户显示省份和城市
          if (data.regionName && data.city) {
            location = `${data.regionName}${data.city}`;
          } else if (data.regionName) {
            location = data.regionName;
          } else {
            location = '中国';
          }
        } else {
          // 海外用户显示国家
          location = data.country || '海外';
        }

        return {
          success: true,
          location: location || '未知地区'
        };
      } else {
        return {
          success: true,
          location: '未知'
        };
      }
    } catch (error) {
      console.error('IP地理位置解析失败:', error);
      return {
        success: true,
        location: '未知'
      };
    }
  }

  // 使用备用API服务
  private async getLocationFromBackupAPI(ip: string): Promise<GeolocationResult> {
    try {
      // 使用ipinfo.io作为备用服务
      const response = await fetch(`https://ipinfo.io/${ip}/json`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json() as any;
      
      let location = '未知地区';
      if (data.country === 'CN') {
        // 中国用户
        if (data.region && data.city) {
          location = `${data.region}${data.city}`;
        } else if (data.region) {
          location = data.region;
        } else {
          location = '中国';
        }
      } else if (data.country) {
        // 海外用户
        const countryNames: Record<string, string> = {
          'US': '美国',
          'JP': '日本',
          'KR': '韩国',
          'SG': '新加坡',
          'HK': '香港',
          'TW': '台湾',
          'GB': '英国',
          'DE': '德国',
          'FR': '法国',
          'CA': '加拿大',
          'AU': '澳大利亚'
        };
        location = countryNames[data.country] || data.country;
      }

      return {
        success: true,
        location
      };
    } catch (error) {
      console.error('备用IP地理位置解析失败:', error);
      return {
        success: true,
        location: '未知'
      };
    }
  }

  // 检查是否为本地IP
  private isLocalIP(ip: string): boolean {
    const localPatterns = [
      /^127\./,           // 127.x.x.x
      /^10\./,            // 10.x.x.x
      /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.x.x - 172.31.x.x
      /^192\.168\./,      // 192.168.x.x
      /^::1$/,            // IPv6 localhost
      /^localhost$/i,     // localhost
      /^0\.0\.0\.0$/      // 0.0.0.0
    ];

    return localPatterns.some(pattern => pattern.test(ip));
  }

  // 格式化位置显示
  formatLocationDisplay(location: string): string {
    if (!location || location === '未知地区' || location === '未知') {
      return '来自未知地区的用户';
    }
    
    if (location === '本地用户') {
      return '来自本地的用户';
    }

    return `来自${location}的用户`;
  }

  // 批量解析IP地理位置（用于反馈列表）
  async batchGetLocations(ips: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // 限制并发数量，避免API限制
    const batchSize = 5;
    for (let i = 0; i < ips.length; i += batchSize) {
      const batch = ips.slice(i, i + batchSize);
      const promises = batch.map(async (ip) => {
        const result = await this.getLocationFromIP(ip);
        return { ip, location: result.location || '未知' };
      });
      
      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ ip, location }) => {
        results.set(ip, location);
      });
      
      // 添加延迟，避免API限制
      if (i + batchSize < ips.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  // 简化的IP地理位置获取方法（供API路由使用）
  async getLocationByIP(ip: string): Promise<string> {
    try {
      const result = await this.getLocationFromIP(ip);
      const location = result.location || '未知';
      
      // 如果是格式化的显示文本，提取纯净的地区名称
      if (location.startsWith('来自') && location.endsWith('的用户')) {
        const extracted = location.replace('来自', '').replace('的用户', '');
        return extracted === '未知地区' ? '未知' : extracted;
      }
      
      return location === '未知地区' ? '未知' : location;
    } catch (error) {
      console.error('IP地理位置获取失败:', error);
      return '未知';
    }
  }
}

export const geolocationService = new GeolocationService();