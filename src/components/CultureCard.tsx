import React, { useState } from 'react';
import { BookOpen, MapPin, RefreshCw, ChevronDown, ChevronUp, Sparkles, History, Star, Heart } from 'lucide-react';
import { CultureData, CultureContent } from '../types/culture';

interface CultureCardProps {
  data: CultureData;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function CultureCard({ data, isLoading, error, onRefresh }: CultureCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">文化科普</h3>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="重新加载"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          <div className="text-center py-8">
            <div className="text-red-600 mb-2">加载失败</div>
            <div className="text-sm text-gray-600">{error}</div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-3 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
              >
                重试
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">文化科普</h3>
          </div>
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
              <span>正在生成文化科普内容...</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              AI正在为您整理相关的方言文化知识
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // 检查content是否为结构化对象
  const isStructuredContent = typeof data.content === 'object' && data.content !== null;
  const structuredContent = isStructuredContent ? data.content as CultureContent : null;
  
  // 如果是字符串内容，按原来的方式处理
  const stringContent = typeof data.content === 'string' ? data.content : null;
  const contentLines = stringContent ? stringContent.split('\n').filter(line => line.trim()) : [];
  const previewLines = isExpanded ? contentLines : contentLines.slice(0, 3);
  const hasMoreContent = contentLines.length > 3;

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">文化科普</h3>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="刷新内容"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-2">
          <MapPin className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
            {data.region}
          </span>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {structuredContent ? (
          /* 结构化内容展示 */
          <div className="space-y-4">
            {/* 历史背景 */}
            <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <History className="w-4 h-4 text-red-600" />
              <h4 className="font-semibold text-red-900">历史背景</h4>
            </div>
            <p className="text-red-800 text-sm leading-relaxed">
                {structuredContent.history}
              </p>
            </div>

            {/* 方言特色 */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-green-900">方言特色</h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {structuredContent.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-green-800 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 文化内涵 */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-purple-600" />
                <h4 className="font-semibold text-purple-900">文化内涵</h4>
              </div>
              <p className="text-purple-800 text-sm leading-relaxed">
                {structuredContent.culture}
              </p>
            </div>
          </div>
        ) : (
          /* 字符串内容展示（兼容旧格式） */
          <div className="prose prose-sm max-w-none">
            {previewLines.map((line, index) => {
              // 检查是否为标题行（通常以数字开头或包含特殊标记）
              const isTitle = /^\d+[、.]/.test(line.trim()) || line.includes('##') || line.includes('**');
              
              if (isTitle) {
                return (
                  <h4 key={index} className="font-semibold text-gray-900 mt-3 mb-2 first:mt-0">
                    {line.replace(/^\d+[、.]\s*/, '').replace(/[#*]/g, '').trim()}
                  </h4>
                );
              }
              
              return (
                <p key={index} className="text-gray-700 leading-relaxed mb-2 last:mb-0">
                  {line.trim()}
                </p>
              );
            })}
          </div>
        )}

        {/* 展开/收起按钮（仅字符串内容需要） */}
        {!structuredContent && hasMoreContent && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>收起内容</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>展开更多 ({contentLines.length - 3} 行)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>由AI生成的文化科普内容</span>
          <span>内容仅供参考</span>
        </div>
      </div>
    </div>
  );
}

export default CultureCard;