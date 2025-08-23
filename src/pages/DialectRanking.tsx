import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, MessageSquare, Sparkles, Clock } from 'lucide-react';
import { StatsApiService, DialectRankingItem, OverviewStats } from '../services/statsApi';

// 页面组件

interface DialectRankingData {
  id: string;
  region: string;
  translationCount: number;
  cultureCardGenerated: boolean;
  lastUsed: string;
  popularPhrases: string[];
  userCount: number;
}

type TimeRange = '1d' | '7d' | '30d';

const mockRankingData: DialectRankingData[] = [
  {
    id: '1',
    region: '四川话',
    translationCount: 1250,
    cultureCardGenerated: true,
    lastUsed: '2024-01-20T10:30:00Z',
    popularPhrases: ['巴适得很', '瓜娃子', '雄起'],
    userCount: 89
  },
  {
    id: '2',
    region: '广东话',
    translationCount: 980,
    cultureCardGenerated: true,
    lastUsed: '2024-01-20T09:15:00Z',
    popularPhrases: ['冇问题', '好犀利', '食饭'],
    userCount: 76
  },
  {
    id: '3',
    region: '东北话',
    translationCount: 756,
    cultureCardGenerated: true,
    lastUsed: '2024-01-20T08:45:00Z',
    popularPhrases: ['嘎哈呢', '老铁', '贼拉'],
    userCount: 62
  },
  {
    id: '4',
    region: '上海话',
    translationCount: 543,
    cultureCardGenerated: false,
    lastUsed: '2024-01-19T16:20:00Z',
    popularPhrases: ['侬好', '老克勒', '白相'],
    userCount: 45
  },
  {
    id: '5',
    region: '山东话',
    translationCount: 432,
    cultureCardGenerated: true,
    lastUsed: '2024-01-19T14:10:00Z',
    popularPhrases: ['俺们', '中不中', '得劲'],
    userCount: 38
  }
];

export function DialectRanking() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [dialectData, setDialectData] = useState<DialectRankingItem[]>([]);
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    totalTranslations: 0,
    totalUsers: 0,
    totalRegions: 0,
    totalFeedbacks: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [dialectResponse, overviewResponse] = await Promise.all([
        StatsApiService.getDialectRanking(timeRange),
        StatsApiService.getOverviewStats()
      ]);

      if (dialectResponse.success && dialectResponse.data) {
        setDialectData(dialectResponse.data);
      } else {
        setError(dialectResponse.error || '获取方言数据失败');
      }

      if (overviewResponse.success && overviewResponse.data) {
        setOverviewStats(overviewResponse.data);
      }
    } catch (err: any) {
      setError(err.message || '加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载和时间范围变化时重新加载
  useEffect(() => {
    loadData();
  }, [timeRange]);

  const timeRangeOptions = [
    { value: '1d' as TimeRange, label: '最近1天', icon: Clock },
    { value: '7d' as TimeRange, label: '最近7天', icon: Clock },
    { value: '30d' as TimeRange, label: '最近30天', icon: Clock }
  ];

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    setIsLoading(true);
    // 模拟API调用
    setTimeout(() => {
      // 这里应该调用实际的API来获取不同时间范围的数据
      setIsLoading(false);
    }, 500);
  };

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '刚刚使用';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `${index + 1}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-traditional-gold-50 to-traditional-red-50">
      {/* 页面标题 */}
      <div className="bg-gradient-to-r from-traditional-red-600 to-traditional-red-700 py-6">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 font-chinese">
            方言打榜
          </h1>
          <p className="text-traditional-red-100 text-sm font-chinese">
            探索最受欢迎的方言，感受中华文化的多样魅力
          </p>
        </div>
      </div>

      {/* 主要内容 */}
      <main className="container mx-auto px-4 py-6">
        {/* 时间范围选择器 */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg border border-traditional-gold-200 p-6">
            <h2 className="text-lg font-semibold text-traditional-blue-700 mb-4 font-chinese">
              选择统计时间范围
            </h2>
            <div className="flex flex-wrap gap-4">
              {timeRangeOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleTimeRangeChange(option.value)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all font-chinese ${
                      timeRange === option.value
                        ? 'bg-traditional-red-600 text-white border-traditional-red-600'
                        : 'bg-white text-traditional-bronze-700 border-traditional-gold-300 hover:border-traditional-gold-400'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 排行榜 */}
        <div className="bg-white rounded-lg shadow-lg border border-traditional-gold-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-traditional-blue-700 font-chinese">
              方言热度排行榜
            </h2>
            <div className="text-sm text-traditional-bronze-600 font-chinese">
              统计时间：{timeRangeOptions.find(opt => opt.value === timeRange)?.label}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-traditional-red-600"></div>
              <span className="ml-3 text-traditional-bronze-600 font-chinese">加载中...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {dialectData.map((item, index) => (
                <div
                  key={item.region}
                  className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                    index < 3
                      ? 'border-traditional-gold-300 bg-gradient-to-r from-traditional-gold-50 to-white'
                      : 'border-traditional-gold-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* 排名 */}
                      <div className="text-2xl font-bold">
                        {getRankIcon(index)}
                      </div>
                      
                      {/* 方言信息 */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-traditional-blue-700 font-chinese">
                            {item.region}
                          </h3>
                          {item.cultureGenerated && (
                            <span className="px-2 py-1 bg-traditional-green-100 text-traditional-green-700 text-xs rounded-full font-chinese">
                              已生成科普卡片
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-traditional-bronze-600">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-chinese">{item.translationCount} 次翻译</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span className="font-chinese">{item.userCount} 位用户</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span className="font-chinese">最近活跃</span>
                          </div>
                        </div>
                        
                        {/* 热门短语 */}
                        <div className="mt-3">
                          <span className="text-xs text-traditional-bronze-500 font-chinese">热门短语：</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {item.popularPhrases.map((phrase, phraseIndex) => (
                              <span
                                key={phraseIndex}
                                className="px-2 py-1 bg-traditional-blue-50 text-traditional-blue-700 text-xs rounded font-chinese"
                              >
                                {phrase}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex flex-col space-y-2">
                      {item.cultureGenerated ? (
                        <button className="px-3 py-1 bg-traditional-green-600 text-white text-xs rounded hover:bg-traditional-green-700 font-chinese">
                          查看科普
                        </button>
                      ) : (
                        <button className="px-3 py-1 bg-traditional-gold-600 text-white text-xs rounded hover:bg-traditional-gold-700 font-chinese">
                          生成科普
                        </button>
                      )}
                      <button className="px-3 py-1 border border-traditional-red-300 text-traditional-red-600 text-xs rounded hover:bg-traditional-red-50 font-chinese">
                        立即翻译
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg border border-traditional-gold-200 p-6 text-center">
            <div className="text-3xl font-bold text-traditional-red-600 mb-2">
              {overviewStats.totalRegions}
            </div>
            <div className="text-traditional-bronze-600 font-chinese">活跃方言数量</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg border border-traditional-gold-200 p-6 text-center">
            <div className="text-3xl font-bold text-traditional-green-600 mb-2">
              {overviewStats.totalTranslations.toLocaleString()}
            </div>
            <div className="text-traditional-bronze-600 font-chinese">总翻译次数</div>
          </div>
          <div className="bg-white rounded-lg shadow-lg border border-traditional-gold-200 p-6 text-center">
            <div className="text-3xl font-bold text-traditional-blue-600 mb-2">
              {dialectData.filter(item => item.cultureGenerated).length}
            </div>
            <div className="text-traditional-bronze-600 font-chinese">已生成科普卡片</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DialectRanking;