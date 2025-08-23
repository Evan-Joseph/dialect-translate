import React, { useState, useCallback } from 'react';
import { TranslationMode, TranslationRequest } from '../../types/translation';
import { COMMON_DIALECT_REGIONS } from '../../types/culture';

interface TranslationInputProps {
  mode: TranslationMode;
  onModeChange: (mode: TranslationMode) => void;
  onTranslate: (request: TranslationRequest) => void;
  onDetectRegion: (text: string) => void;
  onRegionChange?: (region: string) => void;
  detectedRegion: string;
  isLoading: boolean;
  className?: string;
}

export function TranslationInput({
  mode,
  onModeChange,
  onTranslate,
  onDetectRegion,
  onRegionChange,
  detectedRegion,
  isLoading,
  className = ''
}: TranslationInputProps) {
  const [inputText, setInputText] = useState('');
  const [region, setRegion] = useState('');
  const [targetDialect, setTargetDialect] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  // 处理模式切换
  const handleModeChange = useCallback((newMode: TranslationMode) => {
    onModeChange(newMode);
    setInputText('');
    setRegion('');
    setTargetDialect('');
  }, [onModeChange]);

  // 处理归属地检测
  const handleDetectRegion = useCallback(() => {
    if (inputText.trim()) {
      onDetectRegion(inputText.trim());
    }
  }, [inputText, onDetectRegion]);

  // 处理翻译
  const handleTranslate = useCallback(() => {
    if (!inputText.trim()) return;

    const request: TranslationRequest = {
      text: inputText.trim(),
      sourceType: mode === 'dialect-to-mandarin' ? 'dialect' : 'mandarin',
      targetType: mode === 'dialect-to-mandarin' ? 'mandarin' : 'dialect',
      model: selectedModel || undefined
    };

    if (mode === 'dialect-to-mandarin') {
      request.region = region || detectedRegion;
    } else {
      request.targetDialect = targetDialect;
    }

    onTranslate(request);
  }, [inputText, mode, region, detectedRegion, targetDialect, selectedModel, onTranslate]);

  // 检查是否可以翻译
  const canTranslate = inputText.trim() && 
    (mode === 'mandarin-to-dialect' ? targetDialect.trim() : (region || detectedRegion));

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* 模式切换 */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleModeChange('dialect-to-mandarin')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'dialect-to-mandarin'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            方言 → 普通话
          </button>
          <button
            onClick={() => handleModeChange('mandarin-to-dialect')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'mandarin-to-dialect'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            普通话 → 方言
          </button>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {mode === 'dialect-to-mandarin' ? '请输入方言文本' : '请输入普通话文本'}
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={mode === 'dialect-to-mandarin' 
            ? '例如：俺今天要去赶集' 
            : '例如：我今天要去市场'
          }
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          maxLength={1000}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            {inputText.length}/1000
          </span>
          {mode === 'dialect-to-mandarin' && inputText.trim() && (
            <button
              onClick={handleDetectRegion}
              disabled={isLoading}
              className="text-xs text-red-600 hover:text-red-800 disabled:text-gray-400"
            >
              {isLoading ? '检测中...' : '智能检测归属地'}
            </button>
          )}
        </div>
      </div>

      {/* 方言归属地输入 */}
      {mode === 'dialect-to-mandarin' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            方言归属地
            {detectedRegion && (
              <span className="text-xs text-gray-500 ml-2">
                (可手动修正AI推理结果)
              </span>
            )}
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={region || detectedRegion}
              onChange={(e) => {
                const newRegion = e.target.value;
                setRegion(newRegion);
                // 当用户手动修改归属地时，通知父组件
                if (onRegionChange && newRegion && newRegion !== detectedRegion) {
                  onRegionChange(newRegion);
                }
              }}
              placeholder="如：山东、四川、广东等"
              className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                detectedRegion && !region 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300'
              }`}
            />
            <select
              value={region}
              onChange={(e) => {
                const newRegion = e.target.value;
                setRegion(newRegion);
                // 当用户从下拉菜单选择归属地时，通知父组件
                if (onRegionChange && newRegion && newRegion !== detectedRegion) {
                  onRegionChange(newRegion);
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">选择地区</option>
              {COMMON_DIALECT_REGIONS.map((regionInfo) => (
                <option key={regionInfo.name} value={regionInfo.name}>
                  {regionInfo.displayName}
                </option>
              ))}
            </select>
          </div>
          {detectedRegion && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between">
                <p className="text-xs text-green-700">
                  🤖 AI智能检测：<strong>{detectedRegion}</strong>
                </p>
                {region !== detectedRegion && region && (
                  <p className="text-xs text-red-600">
                    ✏️ 已手动修正为：<strong>{region}</strong>
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                如果检测结果不准确，请在上方输入框中手动修正或从下拉菜单选择正确的地区
              </p>
            </div>
          )}
        </div>
      )}

      {/* 目标方言输入 */}
      {mode === 'mandarin-to-dialect' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            目标方言
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={targetDialect}
              onChange={(e) => setTargetDialect(e.target.value)}
              placeholder="如：山东话、四川话、粤语等"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <select
              value={targetDialect}
              onChange={(e) => setTargetDialect(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">选择方言</option>
              {COMMON_DIALECT_REGIONS.map((regionInfo) => (
                <option key={regionInfo.name} value={regionInfo.displayName}>
                  {regionInfo.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 模型选择（可选） */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          AI模型选择（可选）
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">默认模型</option>
          <option value="ChatAnywhere">ChatAnywhere (GPT-4)</option>
          <option value="Xunfei Spark">讯飞星火</option>
          <option value="Zhipu GLM">智谱清言</option>
        </select>
      </div>

      {/* 翻译按钮 */}
      <button
        onClick={handleTranslate}
        disabled={!canTranslate || isLoading}
        className="w-full bg-red-600 text-white py-3 px-4 rounded-md font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            翻译中...
          </div>
        ) : (
          '开始翻译'
        )}
      </button>
    </div>
  );
}

export default TranslationInput;