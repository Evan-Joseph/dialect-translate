// 反馈相关类型定义

export interface FeedbackSubmission {
  originalText: string;
  originalTranslation: string;
  correctedTranslation: string;
  comment?: string;
  sourceDialect?: string;  // 源方言
  targetDialect?: string; // 目标方言
  translationMode?: 'dialect_to_mandarin' | 'mandarin_to_dialect'; // 翻译模式
}

export interface Feedback {
  id: string;
  originalText: string;
  originalTranslation: string;
  correctedTranslation: string;
  region: string;
  comment?: string;
  userLocation: string;
  createdAt: string;
  updatedAt: string;
  upVotes: number;
  downVotes: number;
  userVote?: 'up' | 'down' | null;
  sourceDialect?: string;  // 源方言
  targetDialect?: string; // 目标方言
  translationMode?: 'dialect_to_mandarin' | 'mandarin_to_dialect'; // 翻译模式
}

export interface FeedbackResponse {
  success: boolean;
  data?: {
    id: string;
    location: string;
  };
  error?: string;
}

export interface FeedbackListResponse {
  success: boolean;
  data?: Feedback[];
  error?: string;
}

export interface VoteRequest {
  type: 'up' | 'down';
}

export interface VoteResponse {
  success: boolean;
  error?: string;
}

// 反馈状态
export type FeedbackStatus = 'idle' | 'submitting' | 'submitted' | 'error';

// 投票状态
export type VoteStatus = 'idle' | 'voting' | 'voted' | 'error';

// 反馈表单数据
export interface FeedbackFormData {
  correctedTranslation: string;
  comment: string;
}

// 反馈统计
export interface FeedbackStats {
  totalFeedbacks: number;
  totalVotes: number;
  averageRating: number;
  topRegions: Array<{
    region: string;
    count: number;
  }>;
}

// 反馈过滤选项
export interface FeedbackFilters {
  region?: string;
  sortBy: 'newest' | 'oldest' | 'most_voted' | 'least_voted';
  page: number;
  limit: number;
}