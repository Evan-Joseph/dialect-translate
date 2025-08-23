import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder-service-key';

// 检查是否为占位符配置
const isPlaceholderConfig = supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder');

if (isPlaceholderConfig) {
  console.warn('⚠️  使用占位符Supabase配置，数据库功能将被禁用。请配置真实的Supabase环境变量以启用完整功能。');
}

// 客户端连接（用于前端和一般API调用）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 服务端连接（用于管理员操作）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

// 数据库表名常量
export const TABLES = {
  FEEDBACK: 'feedback',
  VOTE: 'vote',
  CULTURE_CACHE: 'culture_cache',
  TRANSLATION_LOG: 'translation_log'
} as const;

// 数据库类型定义
export interface Feedback {
  id: string;
  original_text: string;
  original_translation: string;
  corrected_translation: string;
  region: string;
  comment?: string;
  user_location: string;
  ip_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  feedback_id: string;
  vote_type: 'up' | 'down';
  ip_hash: string;
  created_at: string;
}

export interface CultureCache {
  id: string;
  region: string;
  content: {
    history: string;
    features: string[];
    culture: string;
  };
  created_at: string;
  updated_at: string;
}

export interface TranslationLog {
  id: string;
  source_text: string;
  source_type: 'dialect' | 'mandarin';
  target_type: 'dialect' | 'mandarin';
  region?: string;
  translation_result: any;
  model_used?: string;
  ip_hash?: string;
  created_at: string;
}