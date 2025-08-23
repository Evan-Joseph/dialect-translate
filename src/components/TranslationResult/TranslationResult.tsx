import React, { useState, useMemo } from 'react';
import { TranslationResult as TranslationResultType, WordMapping } from '../../types/translation';
import { FeedbackSubmission } from '../../types/feedback';

// 合并后的翻译结果类型
interface MergedTranslationResult {
  text: string;
  temperatures: number[];
  pronunciations: string[];
  originalResults: TranslationResultType[];
}

interface TranslationResultProps {
  results: TranslationResultType[];
  wordMapping: WordMapping[];
  originalText: string;
  onFeedback: (feedback: FeedbackSubmission) => Promise<boolean>;
  className?: string;
  translationMode?: 'dialect_to_mandarin' | 'mandarin_to_dialect'; // 翻译模式
  sourceDialect?: string;  // 源方言
  targetDialect?: string; // 目标方言
}

export function TranslationResult({
  results,
  wordMapping,
  originalText,
  onFeedback,
  className = '',
  translationMode,
  sourceDialect,
  targetDialect
}: TranslationResultProps) {
  const [selectedResult, setSelectedResult] = useState<TranslationResultType | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    correctedTranslation: '',
    comment: ''
  });
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 合并相同的翻译结果
  const mergedResults = useMemo(() => {
    if (!results || results.length === 0) return [];
    
    const resultMap = new Map<string, MergedTranslationResult>();
    
    results.forEach(result => {
      const key = result.text.trim();
      
      if (resultMap.has(key)) {
        const existing = resultMap.get(key)!;
        existing.temperatures.push(result.temperature);
        if (result.pronunciation && !existing.pronunciations.includes(result.pronunciation)) {
          existing.pronunciations.push(result.pronunciation);
        }
        existing.originalResults.push(result);
      } else {
        resultMap.set(key, {
          text: result.text,
          temperatures: [result.temperature],
          pronunciations: result.pronunciation ? [result.pronunciation] : [],
          originalResults: [result]
        });
      }
    });
    
    return Array.from(resultMap.values());
  }, [results]);

  // 处理反馈提交
  const handleFeedbackSubmit = async () => {
    console.log('🔄 handleFeedbackSubmit 被调用');
    console.log('📝 当前状态:', {
      selectedResult: !!selectedResult,
      correctedTranslation: feedbackForm.correctedTranslation.trim(),
      isSubmitting,
      originalText
    });

    // 检查基本条件
    if (!selectedResult || !feedbackForm.correctedTranslation.trim() || isSubmitting) {
      console.log('❌ 基本提交条件不满足，退出');
      return;
    }

    const feedback: FeedbackSubmission = {
      originalText,
      originalTranslation: selectedResult.text,
      correctedTranslation: feedbackForm.correctedTranslation.trim(),
      comment: feedbackForm.comment.trim() || undefined,
      sourceDialect,
      targetDialect,
      translationMode
    };

    console.log('📤 准备提交反馈:', feedback);

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      console.log('🚀 调用 onFeedback...');
      const success = await onFeedback(feedback);
      console.log('✅ onFeedback 返回结果:', success);
      
      if (success) {
        console.log('🎉 反馈提交成功');
        setSubmitMessage({ type: 'success', text: '反馈提交成功！感谢您的贡献。' });
        setShowFeedbackForm(false);
        setFeedbackForm({ correctedTranslation: '', comment: '' });
        setSelectedResult(null);
        
        // 3秒后清除成功消息
        setTimeout(() => {
          setSubmitMessage(null);
        }, 3000);
      } else {
        console.log('❌ 反馈提交失败');
        setSubmitMessage({ type: 'error', text: '反馈提交失败，请稍后重试。' });
      }
    } catch (error) {
      console.error('💥 反馈提交异常:', error);
      setSubmitMessage({ type: 'error', text: '反馈提交失败，请稍后重试。' });
    } finally {
      console.log('🏁 设置 isSubmitting 为 false');
      setIsSubmitting(false);
    }
  };

  // 处理词语悬停
  const handleWordHover = (word: string) => {
    setHoveredWord(word);
  };

  // 获取词语映射
  const getWordMapping = (word: string): WordMapping | undefined => {
    return wordMapping.find(mapping => 
      mapping.original === word || mapping.translation === word
    );
  };

  // 渲染带注音的文本
  const renderTextWithPronunciation = (result: TranslationResultType) => {
    if (!result.pronunciation) {
      return <span className="text-lg">{result.text}</span>;
    }

    const characters = result.text.split('');
    const pronunciations = result.pronunciation.split(' ');

    return (
      <div className="space-y-1">
        <div className="flex flex-wrap gap-1">
          {characters.map((char, index) => (
            <div key={index} className="text-center">
              <div className="text-xs text-gray-500 h-4">
                {pronunciations[index] || ''}
              </div>
              <div className="text-lg">{char}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染可交互的文本（用于词语映射）
  const renderInteractiveText = (text: string) => {
    const words = text.split('');
    
    return (
      <div className="flex flex-wrap">
        {words.map((word, index) => {
          const mapping = getWordMapping(word);
          const isHovered = hoveredWord === word;
          
          return (
            <span
              key={index}
              className={`cursor-pointer transition-colors ${
                mapping 
                  ? 'text-red-600 hover:text-red-800 hover:bg-red-50 rounded px-1'
                  : ''
              } ${
                isHovered ? 'bg-yellow-200' : ''
              }`}
              onMouseEnter={() => mapping && handleWordHover(word)}
              onMouseLeave={() => setHoveredWord(null)}
              title={mapping ? `对应：${mapping.original === word ? mapping.translation : mapping.original}` : undefined}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-traditional-gold-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-traditional-blue-700 mb-4 font-chinese">翻译结果</h3>
      
      {/* 翻译结果列表 */}
      <div className="space-y-4 mb-6">
        {mergedResults.map((mergedResult, index) => {
          // 使用第一个原始结果作为代表进行渲染
          const representativeResult = mergedResult.originalResults[0];
          
          return (
            <div
              key={index}
              className="border border-traditional-gold-200 rounded-lg p-4 hover:border-traditional-gold-400 transition-colors bg-gradient-to-r from-white to-traditional-gold-50"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-traditional-bronze-600 font-chinese">
                  {mergedResult.temperatures.length === 1 ? (
                    <span>版本 {index + 1} (温度: {mergedResult.temperatures[0]})</span>
                  ) : (
                    <span>
                      版本 {index + 1} (温度: {mergedResult.temperatures.sort((a, b) => a - b).join(', ')})
                      <span className="ml-2 text-xs bg-traditional-gold-100 text-traditional-gold-700 px-2 py-1 rounded">
                        已合并 {mergedResult.originalResults.length} 个相同结果
                      </span>
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedResult(representativeResult);
                    setShowFeedbackForm(true);
                    setFeedbackForm({ 
                      correctedTranslation: representativeResult.text, 
                      comment: '' 
                    });
                  }}
                  className="text-sm text-traditional-red-600 hover:text-traditional-red-800 font-chinese"
                >
                  反馈修正
                </button>
              </div>
              
              <div className="mb-3">
                {representativeResult.pronunciation ? (
                  renderTextWithPronunciation(representativeResult)
                ) : wordMapping.length > 0 ? (
                  renderInteractiveText(representativeResult.text)
                ) : (
                  <span className="text-lg">{representativeResult.text}</span>
                )}
              </div>
              
              {/* 显示所有不同的发音 */}
              {mergedResult.pronunciations.length > 0 && (
                <div className="text-xs text-traditional-bronze-500 font-chinese">
                  注音：{mergedResult.pronunciations.join(' / ')}
                  {mergedResult.pronunciations.length > 1 && (
                    <span className="ml-2 text-traditional-gold-600">
                      (多种发音)
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 词语对应关系 */}
      {wordMapping.length > 0 && (
        <div className="border-t border-traditional-gold-200 pt-4">
          <h4 className="text-sm font-medium text-traditional-blue-700 mb-2 font-chinese">词语对应关系</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {wordMapping.map((mapping, index) => (
              <div
                key={index}
                className="text-xs bg-traditional-gold-50 border border-traditional-gold-200 rounded px-2 py-1 flex justify-between"
              >
                <span className="text-traditional-bronze-600 font-chinese">{mapping.original}</span>
                <span className="text-traditional-gold-400">→</span>
                <span className="text-traditional-blue-700 font-chinese">{mapping.translation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 反馈表单模态框 */}
      {showFeedbackForm && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl border-2 border-traditional-gold-300 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-traditional-blue-700 font-chinese">提交翻译反馈</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-traditional-blue-700 mb-2 font-chinese">
                原始翻译
              </label>
              <div className="p-3 bg-traditional-gold-50 rounded border border-traditional-gold-200 text-sm font-chinese">
                {selectedResult.text}
              </div>
            </div>
            
            {/* 方言信息显示 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-traditional-blue-700 mb-2 font-chinese">
                翻译信息
              </label>
              <div className="p-3 bg-traditional-blue-50 border-traditional-blue-200 text-traditional-blue-700 rounded border text-sm font-chinese space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">翻译模式：</span>
                  <span className="bg-traditional-gold-100 text-traditional-gold-700 px-2 py-1 rounded text-xs">
                    {translationMode === 'dialect_to_mandarin' ? '方言 → 普通话' : 
                     translationMode === 'mandarin_to_dialect' ? '普通话 → 方言' : '未知模式'}
                  </span>
                </div>
                {sourceDialect && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">源方言：</span>
                    <span className="bg-traditional-red-100 text-traditional-red-700 px-2 py-1 rounded text-xs">
                      {sourceDialect}
                    </span>
                  </div>
                )}
                {targetDialect && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">目标方言：</span>
                    <span className="bg-traditional-green-100 text-traditional-green-700 px-2 py-1 rounded text-xs">
                      {targetDialect}
                    </span>
                  </div>
                )}
                <div className="text-xs text-traditional-bronze-600 mt-2">
                  ℹ️ 系统将根据您的IP地址自动识别归属地
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-traditional-blue-700 mb-2 font-chinese">
                修正后的翻译 *
              </label>
              <textarea
                value={feedbackForm.correctedTranslation}
                onChange={(e) => setFeedbackForm(prev => ({
                  ...prev,
                  correctedTranslation: e.target.value
                }))}
                className="w-full h-24 px-3 py-2 border border-traditional-gold-300 rounded-md focus:outline-none focus:ring-2 focus:ring-traditional-gold-500 focus:border-transparent resize-none font-chinese"
                placeholder="请输入您认为正确的翻译"
                maxLength={1000}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-traditional-blue-700 mb-2 font-chinese">
                补充说明（可选）
              </label>
              <textarea
                value={feedbackForm.comment}
                onChange={(e) => setFeedbackForm(prev => ({
                  ...prev,
                  comment: e.target.value
                }))}
                className="w-full h-20 px-3 py-2 border border-traditional-gold-300 rounded-md focus:outline-none focus:ring-2 focus:ring-traditional-gold-500 focus:border-transparent resize-none font-chinese"
                placeholder="请说明修正的原因或提供更多上下文"
                maxLength={500}
              />
            </div>
            
            {/* 提交状态消息 */}
            {submitMessage && (
              <div className={`mb-4 p-3 rounded-md font-chinese ${
                submitMessage.type === 'success' 
                  ? 'bg-traditional-green-50 border border-traditional-green-200 text-traditional-green-700'
                  : 'bg-traditional-red-50 border border-traditional-red-200 text-traditional-red-700'
              }`}>
                {submitMessage.text}
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowFeedbackForm(false);
                  setSelectedResult(null);
                  setFeedbackForm({ correctedTranslation: '', comment: '' });
                  setSubmitMessage(null);
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-traditional-bronze-300 rounded-md text-traditional-bronze-700 hover:bg-traditional-bronze-50 focus:outline-none focus:ring-2 focus:ring-traditional-bronze-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-chinese"
              >
                取消
              </button>
              <button
                onClick={handleFeedbackSubmit}
                disabled={
                  !feedbackForm.correctedTranslation.trim() || 
                  isSubmitting
                }
                className="flex-1 px-4 py-2 bg-traditional-red-600 text-white rounded-md hover:bg-traditional-red-700 focus:outline-none focus:ring-2 focus:ring-traditional-red-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-chinese"
                title={
                  !feedbackForm.correctedTranslation.trim()
                    ? '请输入修正后的翻译'
                    : ''
                }
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    提交中...
                  </div>
                ) : (
                  '提交反馈'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TranslationResult;