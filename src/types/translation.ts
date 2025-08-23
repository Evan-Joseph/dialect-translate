// 翻译相关类型定义

export interface TranslationRequest {
  text: string;
  sourceType: 'dialect' | 'mandarin';
  targetType: 'dialect' | 'mandarin';
  region?: string;
  targetDialect?: string;
  model?: string;
}

export interface DetectionRequest {
  text: string;
  model?: string;
}

export interface TranslationResult {
  text: string;
  temperature: number;
  pronunciation?: string;
}

export interface WordMapping {
  original: string;
  translation: string;
}

export interface TranslationResponse {
  success: boolean;
  data?: {
    translations: TranslationResult[];
    wordMapping: WordMapping[];
  };
  error?: string;
}

export interface DetectionResponse {
  success: boolean;
  data?: {
    region: string;
    confidence: number;
  };
  error?: string;
}

export interface LLMProvider {
  provider_name: string;
  base_url?: string;
  endpoint?: string;
  credentials: {
    api_key?: string;
    api_password?: string;
  };
  allowed_models: string[];
  documentation_url: string;
  notes: string;
}

// 翻译状态
export type TranslationStatus = 'idle' | 'detecting' | 'translating' | 'completed' | 'error';

// 翻译模式
export type TranslationMode = 'dialect-to-mandarin' | 'mandarin-to-dialect';

// 流式翻译数据
export interface StreamingData {
  type: 'chunk' | 'complete' | 'error';
  content: string;
  index?: number;
}

// 翻译历史记录（本地存储）
export interface TranslationHistory {
  id: string;
  timestamp: string;
  sourceText: string;
  sourceType: 'dialect' | 'mandarin';
  targetType: 'dialect' | 'mandarin';
  region?: string;
  targetDialect?: string;
  results: TranslationResult[];
  selectedResult?: TranslationResult;
}