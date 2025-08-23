import { useState, useCallback } from 'react';
import { TranslationRequest, DetectionRequest, TranslationResponse, DetectionResponse, TranslationStatus, TranslationMode } from '../types/translation';
import { TranslationApiService } from '../services/translationApi';

export interface UseTranslationReturn {
  // 状态
  status: TranslationStatus;
  mode: TranslationMode;
  detectedRegion: string;
  translationResults: TranslationResponse['data'];
  originalText: string;
  error: string | null;
  isLoading: boolean;
  
  // 翻译请求信息
  lastTranslationRequest: TranslationRequest | null;
  
  // 操作
  setMode: (mode: TranslationMode) => void;
  detectRegion: (text: string, model?: string) => Promise<void>;
  translate: (request: TranslationRequest) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

export function useTranslation(): UseTranslationReturn {
  const [status, setStatus] = useState<TranslationStatus>('idle');
  const [mode, setMode] = useState<TranslationMode>('dialect-to-mandarin');
  const [detectedRegion, setDetectedRegion] = useState<string>('');
  const [translationResults, setTranslationResults] = useState<TranslationResponse['data']>(undefined);
  const [originalText, setOriginalText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [lastTranslationRequest, setLastTranslationRequest] = useState<TranslationRequest | null>(null);

  const isLoading = status === 'detecting' || status === 'translating';

  // 方言归属地推理
  const detectRegion = useCallback(async (text: string, model?: string) => {
    if (!text.trim()) {
      setError('请输入要检测的文本');
      return;
    }

    setStatus('detecting');
    setError(null);

    try {
      const request: DetectionRequest = { text, model };
      const response = await TranslationApiService.detectDialectRegion(request);
      
      if (response.success && response.data) {
        setDetectedRegion(response.data.region);
        setStatus('idle');
      } else {
        setError(response.error || '归属地检测失败');
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.message || '归属地检测失败');
      setStatus('error');
    }
  }, []);

  // 翻译
  const translate = useCallback(async (request: TranslationRequest) => {
    if (!request.text.trim()) {
      setError('请输入要翻译的文本');
      return;
    }

    // 参数验证
    if (request.sourceType === 'dialect' && !request.region) {
      setError('方言翻译需要指定归属地区');
      return;
    }

    if (request.sourceType === 'mandarin' && request.targetType === 'dialect' && !request.targetDialect) {
      setError('普通话转方言需要指定目标方言');
      return;
    }

    setStatus('translating');
    setError(null);
    setTranslationResults(undefined);
    setOriginalText(request.text);
    setLastTranslationRequest(request); // 保存翻译请求信息

    try {
      const response = await TranslationApiService.translateText(request);
      
      if (response.success && response.data) {
        setTranslationResults(response.data);
        setStatus('completed');
      } else {
        setError(response.error || '翻译失败');
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.message || '翻译失败');
      setStatus('error');
    }
  }, []);

  // 清除结果
  const clearResults = useCallback(() => {
    setTranslationResults(undefined);
    setDetectedRegion('');
    setOriginalText('');
    setLastTranslationRequest(null);
    setStatus('idle');
    setError(null);
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  return {
    status,
    mode,
    detectedRegion,
    translationResults,
    originalText,
    error,
    isLoading,
    lastTranslationRequest,
    setMode,
    detectRegion,
    translate,
    clearResults,
    clearError
  };
}