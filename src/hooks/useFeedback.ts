import { useState, useCallback, useEffect } from 'react';
import { Feedback, FeedbackSubmission, FeedbackStatus, VoteStatus } from '../types/feedback';
import { FeedbackApiService } from '../services/feedbackApi';

export interface UseFeedbackReturn {
  // 状态
  feedbacks: Feedback[];
  status: FeedbackStatus;
  voteStatus: VoteStatus;
  error: string | null;
  isLoading: boolean;
  hasMore: boolean;
  
  // 操作
  submitFeedback: (feedback: FeedbackSubmission) => Promise<boolean>;
  loadFeedbacks: (page?: number, limit?: number) => Promise<void>;
  loadMoreFeedbacks: () => Promise<void>;
  vote: (feedbackId: string, voteType: 'up' | 'down') => Promise<void>;
  clearError: () => void;
  refreshFeedbacks: () => Promise<void>;
}

export function useFeedback(): UseFeedbackReturn {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [status, setStatus] = useState<FeedbackStatus>('idle');
  const [voteStatus, setVoteStatus] = useState<VoteStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [limit] = useState(20);

  const isLoading = status === 'submitting' || voteStatus === 'voting';



  // 提交反馈
  const submitFeedback = useCallback(async (feedback: FeedbackSubmission): Promise<boolean> => {
    console.log('🎯 useFeedback.submitFeedback 被调用:', feedback);
    setStatus('submitting');
    setError(null);

    try {
      console.log('📡 调用 FeedbackApiService.submitFeedback...');
      const response = await FeedbackApiService.submitFeedback(feedback);
      console.log('📨 API 响应:', response);
      
      if (response.success) {
        console.log('✅ 反馈提交成功，更新状态');
        setStatus('submitted');
        // 提交成功后刷新反馈列表
        try {
          console.log('🔄 刷新反馈列表...');
          const refreshResponse = await FeedbackApiService.getFeedbackList(1, limit);
          if (refreshResponse.success && refreshResponse.data) {
            setFeedbacks(refreshResponse.data);
            setCurrentPage(1);
            setHasMore(refreshResponse.data.length === limit);
            console.log('✅ 反馈列表刷新成功');
          }
        } catch (refreshErr) {
          // 刷新失败不影响提交成功的状态
          console.warn('⚠️ 刷新反馈列表失败:', refreshErr);
        }
        return true;
      } else {
        console.log('❌ 反馈提交失败:', response.error);
        setError(response.error || '提交反馈失败');
        setStatus('error');
        return false;
      }
    } catch (err: any) {
      console.error('💥 反馈提交异常:', err);
      setError(err.message || '提交反馈失败');
      setStatus('error');
      return false;
    }
  }, [limit]);

  // 加载反馈列表
  const loadFeedbacks = useCallback(async (page: number = 1, pageLimit: number = 20) => {
    try {
      const response = await FeedbackApiService.getFeedbackList(page, pageLimit);
      
      if (response.success && response.data) {
        if (page === 1) {
          setFeedbacks(response.data);
        } else {
          setFeedbacks(prev => [...prev, ...response.data!]);
        }
        
        setCurrentPage(page);
        setHasMore(response.data.length === pageLimit);
        setError(null);
      } else {
        setError(response.error || '加载反馈列表失败');
      }
    } catch (err: any) {
      setError(err.message || '加载反馈列表失败');
    }
  }, []);

  // 加载更多反馈
  const loadMoreFeedbacks = useCallback(async () => {
    if (!hasMore || isLoading) return;
    
    await loadFeedbacks(currentPage + 1, limit);
  }, [hasMore, isLoading, currentPage, limit, loadFeedbacks]);

  // 投票
  const vote = useCallback(async (feedbackId: string, voteType: 'up' | 'down') => {
    setVoteStatus('voting');
    setError(null);

    try {
      const response = await FeedbackApiService.vote(feedbackId, voteType);
      
      if (response.success) {
        // 更新本地状态
        setFeedbacks(prev => prev.map(feedback => {
          if (feedback.id === feedbackId) {
            const currentVote = feedback.userVote;
            let newUpVotes = feedback.upVotes;
            let newDownVotes = feedback.downVotes;
            let newUserVote: 'up' | 'down' | null = voteType;

            // 处理投票逻辑
            if (currentVote === voteType) {
              // 取消投票
              if (voteType === 'up') {
                newUpVotes--;
              } else {
                newDownVotes--;
              }
              newUserVote = null;
            } else if (currentVote) {
              // 切换投票
              if (currentVote === 'up') {
                newUpVotes--;
                newDownVotes++;
              } else {
                newDownVotes--;
                newUpVotes++;
              }
            } else {
              // 新投票
              if (voteType === 'up') {
                newUpVotes++;
              } else {
                newDownVotes++;
              }
            }

            return {
              ...feedback,
              upVotes: newUpVotes,
              downVotes: newDownVotes,
              userVote: newUserVote
            };
          }
          return feedback;
        }));
        
        setVoteStatus('voted');
      } else {
        setError(response.error || '投票失败');
        setVoteStatus('error');
      }
    } catch (err: any) {
      setError(err.message || '投票失败');
      setVoteStatus('error');
    }
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
    if (voteStatus === 'error') {
      setVoteStatus('idle');
    }
  }, [status, voteStatus]);

  // 刷新反馈列表
  const refreshFeedbacks = useCallback(async () => {
    setCurrentPage(1);
    setHasMore(true);
    await loadFeedbacks(1, limit);
  }, [limit, loadFeedbacks]);

  // 初始加载
  useEffect(() => {
    loadFeedbacks(1, limit);
  }, [loadFeedbacks, limit]);

  return {
    feedbacks,
    status,
    voteStatus,
    error,
    isLoading,
    hasMore,
    submitFeedback,
    loadFeedbacks,
    loadMoreFeedbacks,
    vote,
    clearError,
    refreshFeedbacks
  };
}