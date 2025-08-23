import { useState, useCallback, useRef } from 'react';
import { CultureData, CultureStatus } from '../types/culture';
import { CultureApiService } from '../services/cultureApi';

export interface UseCultureReturn {
  // 状态
  cultureData: CultureData | null;
  status: CultureStatus;
  error: string | null;
  isLoading: boolean;
  
  // 操作
  loadCultureContent: (region: string) => Promise<void>;
  clearCultureData: () => void;
  clearError: () => void;
}

export function useCulture(): UseCultureReturn {
  const [cultureData, setCultureData] = useState<CultureData | null>(null);
  const [status, setStatus] = useState<CultureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, CultureData>>(new Map());

  const isLoading = status === 'loading';

  // 加载文化科普内容
  const loadCultureContent = useCallback(async (region: string) => {
    if (!region || !region.trim()) {
      setError('请提供有效的地区名称');
      return;
    }

    // 检查缓存
    const cached = cacheRef.current.get(region);
    if (cached) {
      setCultureData(cached);
      setStatus('loaded');
      setError(null);
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const response = await CultureApiService.getCultureContent(region);
      
      if (response.success && response.data) {
        const data = response.data;
        setCultureData(data);
        setStatus('loaded');
        
        // 缓存结果
        cacheRef.current.set(region, data);
        
        // 限制缓存大小
        if (cacheRef.current.size > 50) {
          const firstKey = cacheRef.current.keys().next().value;
          cacheRef.current.delete(firstKey);
        }
      } else {
        setError(response.error || '获取文化科普内容失败');
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.message || '获取文化科普内容失败');
      setStatus('error');
    }
  }, []);

  // 清除文化数据
  const clearCultureData = useCallback(() => {
    setCultureData(null);
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
    cultureData,
    status,
    error,
    isLoading,
    loadCultureContent,
    clearCultureData,
    clearError
  };
}

// 批量文化内容Hook
export interface UseBatchCultureReturn {
  cultureMap: Map<string, CultureData>;
  loadingRegions: Set<string>;
  errorRegions: Map<string, string>;
  loadBatchCultureContent: (regions: string[]) => Promise<void>;
  getCultureData: (region: string) => CultureData | undefined;
  clearBatchData: () => void;
}

export function useBatchCulture(): UseBatchCultureReturn {
  const [cultureMap, setCultureMap] = useState<Map<string, CultureData>>(new Map());
  const [loadingRegions, setLoadingRegions] = useState<Set<string>>(new Set());
  const [errorRegions, setErrorRegions] = useState<Map<string, string>>(new Map());

  // 批量加载文化内容
  const loadBatchCultureContent = useCallback(async (regions: string[]) => {
    const validRegions = regions.filter(region => region && region.trim());
    if (validRegions.length === 0) return;

    // 设置加载状态
    setLoadingRegions(new Set(validRegions));
    setErrorRegions(new Map());

    try {
      const response = await CultureApiService.getBatchCultureContent(validRegions);
      
      if (response.success && response.data) {
        setCultureMap(prev => {
          const newMap = new Map(prev);
          Object.entries(response.data!).forEach(([region, data]) => {
            if (data) {
              newMap.set(region, data);
            }
          });
          return newMap;
        });
      }
      
      if (response.error) {
        // 解析错误信息
        const errors = response.error.split('; ');
        const errorMap = new Map<string, string>();
        errors.forEach(error => {
          const [region, message] = error.split(': ');
          if (region && message) {
            errorMap.set(region, message);
          }
        });
        setErrorRegions(errorMap);
      }
    } catch (err: any) {
      const errorMap = new Map<string, string>();
      validRegions.forEach(region => {
        errorMap.set(region, err.message || '获取失败');
      });
      setErrorRegions(errorMap);
    } finally {
      setLoadingRegions(new Set());
    }
  }, []);

  // 获取单个地区的文化数据
  const getCultureData = useCallback((region: string): CultureData | undefined => {
    return cultureMap.get(region);
  }, [cultureMap]);

  // 清除批量数据
  const clearBatchData = useCallback(() => {
    setCultureMap(new Map());
    setLoadingRegions(new Set());
    setErrorRegions(new Map());
  }, []);

  return {
    cultureMap,
    loadingRegions,
    errorRegions,
    loadBatchCultureContent,
    getCultureData,
    clearBatchData
  };
}