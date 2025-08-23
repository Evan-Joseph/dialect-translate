import React, { useState } from 'react';
import { ChevronUp, ChevronDown, MessageSquare, MapPin, Clock, MoreVertical } from 'lucide-react';
import { Feedback } from '../types/feedback';
import { Empty } from './Empty';

interface FeedbackBoardProps {
  feedbacks: Feedback[];
  onVote: (feedbackId: string, voteType: 'up' | 'down') => Promise<void>;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
}

export function FeedbackBoard({
  feedbacks,
  onVote,
  onLoadMore,
  hasMore,
  isLoading
}: FeedbackBoardProps) {
  const [votingIds, setVotingIds] = useState<Set<string>>(new Set());

  const handleVote = async (feedbackId: string, voteType: 'up' | 'down') => {
    if (votingIds.has(feedbackId)) return;
    
    setVotingIds(prev => new Set(prev).add(feedbackId));
    try {
      await onVote(feedbackId, voteType);
    } finally {
      setVotingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(feedbackId);
        return newSet;
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (feedbacks.length === 0 && !isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">社区反馈</h3>
        </div>
        <Empty 
          icon={MessageSquare}
          title="暂无反馈"
          description="还没有用户提交翻译反馈，快来成为第一个吧！"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">社区反馈</h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
              {feedbacks.length}
            </span>
          </div>
          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          用户提交的翻译修正建议，帮助改善翻译质量
        </p>
      </div>

      {/* 反馈列表 */}
      <div className="divide-y divide-gray-100">
        {feedbacks.map((feedback) => (
          <div key={feedback.id} className="p-4 hover:bg-gray-50 transition-colors">
            {/* 反馈头部信息 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{feedback.userLocation || '未知地区'}</span>
                <span className="text-gray-400">•</span>
                <Clock className="w-4 h-4" />
                <span>{formatTime(feedback.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* 翻译模式标签 */}
                {feedback.translationMode && (
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    feedback.translationMode === 'dialect_to_mandarin'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {feedback.translationMode === 'dialect_to_mandarin' ? '方言→普通话' : '普通话→方言'}
                  </span>
                )}
                {/* 地区标签 */}
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                  {feedback.region}
                </span>
              </div>
            </div>

            {/* 方言信息显示 */}
            {(feedback.sourceDialect || feedback.targetDialect) && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-center gap-4 text-xs">
                  {feedback.sourceDialect && (
                    <div className="flex items-center gap-1">
                      <span className="text-blue-600 font-medium">源方言：</span>
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded">
                        {feedback.sourceDialect}
                      </span>
                    </div>
                  )}
                  {feedback.targetDialect && (
                    <div className="flex items-center gap-1">
                      <span className="text-blue-600 font-medium">目标方言：</span>
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                        {feedback.targetDialect}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 原始翻译 */}
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-1">原文：</div>
              <div className="text-gray-900 bg-gray-50 p-2 rounded text-sm">
                {feedback.originalText}
              </div>
            </div>

            {/* 原始翻译结果 */}
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-1">原翻译：</div>
              <div className="text-gray-700 bg-red-50 p-2 rounded text-sm border-l-2 border-red-200">
                {feedback.originalTranslation}
              </div>
            </div>

            {/* 修正后翻译 */}
            <div className="mb-3">
              <div className="text-sm text-gray-600 mb-1">修正建议：</div>
              <div className="text-gray-900 bg-green-50 p-2 rounded text-sm border-l-2 border-green-200">
                {feedback.correctedTranslation}
              </div>
            </div>

            {/* 评论 */}
            {feedback.comment && (
              <div className="mb-3">
                <div className="text-sm text-gray-600 mb-1">补充说明：</div>
                <div className="text-gray-700 bg-red-50 p-2 rounded text-sm">
                  {feedback.comment}
                </div>
              </div>
            )}

            {/* 投票区域 */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleVote(feedback.id, 'up')}
                  disabled={votingIds.has(feedback.id)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                    feedback.userVote === 'up'
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'hover:bg-gray-100 text-gray-600'
                  } ${votingIds.has(feedback.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>{feedback.upVotes || 0}</span>
                </button>
                
                <button
                  onClick={() => handleVote(feedback.id, 'down')}
                  disabled={votingIds.has(feedback.id)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                    feedback.userVote === 'down'
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : 'hover:bg-gray-100 text-gray-600'
                  } ${votingIds.has(feedback.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>{feedback.downVotes || 0}</span>
                </button>
              </div>

              <div className="text-xs text-gray-500">
                {feedback.upVotes + feedback.downVotes > 0 && (
                  <span>
                    {feedback.upVotes + feedback.downVotes} 人参与投票
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 加载更多 */}
      {hasMore && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>加载中...</span>
              </div>
            ) : (
              '加载更多反馈'
            )}
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && feedbacks.length === 0 && (
        <div className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span>加载反馈中...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedbackBoard;