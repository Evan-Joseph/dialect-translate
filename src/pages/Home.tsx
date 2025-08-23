import React, { useEffect, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useFeedback } from '../hooks/useFeedback';
import { useCulture } from '../hooks/useCulture';
import TranslationInput from '../components/TranslationInput/TranslationInput';
import TranslationResult from '../components/TranslationResult/TranslationResult';
import FeedbackBoard from '../components/FeedbackBoard';
import CultureCard from '../components/CultureCard';

function Home() {
  const {
    status: translationStatus,
    mode,
    detectedRegion,
    translationResults,
    originalText,
    error: translationError,
    isLoading: isTranslating,
    lastTranslationRequest,
    setMode,
    detectRegion,
    translate,
    clearResults,
    clearError: clearTranslationError
  } = useTranslation();

  const {
    feedbacks,
    status: feedbackStatus,
    error: feedbackError,
    isLoading: isFeedbackLoading,
    hasMore,
    submitFeedback,
    loadMoreFeedbacks,
    vote,
    clearError: clearFeedbackError
  } = useFeedback();

  const {
    cultureData,
    status: cultureStatus,
    error: cultureError,
    isLoading: isCultureLoading,
    loadCultureContent,
    clearError: clearCultureError
  } = useCulture();

  // 当检测到归属地时，自动加载文化科普内容
  useEffect(() => {
    if (detectedRegion && detectedRegion !== '未知地区') {
      loadCultureContent(detectedRegion);
    }
  }, [detectedRegion, loadCultureContent]);

  // 当翻译完成时，如果有地区信息，加载文化科普内容
  useEffect(() => {
    if (translationStatus === 'completed' && translationResults) {
      // 从翻译请求中获取地区信息
      const region = detectedRegion;
      if (region && region !== '未知地区') {
        loadCultureContent(region);
      }
    }
  }, [translationStatus, translationResults, detectedRegion, loadCultureContent]);

  // 处理归属地手动修正
  const handleRegionChange = useCallback((newRegion: string) => {
    if (newRegion && newRegion !== '未知地区') {
      loadCultureContent(newRegion);
    }
  }, [loadCultureContent]);

  // 处理反馈提交成功后的状态更新
  useEffect(() => {
    if (feedbackStatus === 'submitted') {
      // 可以在这里添加成功提示
      setTimeout(() => {
        clearFeedbackError();
      }, 3000);
    }
  }, [feedbackStatus, clearFeedbackError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-traditional-gold-50 to-traditional-red-50">
      {/* 页面标题 */}
      <div className="bg-gradient-to-r from-traditional-red-600 to-traditional-red-700 py-6">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 font-chinese">
            乡音方言翻译平台
          </h1>
          <p className="text-traditional-red-100 text-sm font-chinese">
            基于AI大语言模型的智能方言翻译工具，传承中华方言文化
          </p>
        </div>
      </div>

      {/* 主要内容区域 */}
      <main className="container mx-auto px-4 py-6">
        {/* 错误提示 */}
        {(translationError || feedbackError || cultureError) && (
          <div className="mb-6 p-4 bg-traditional-red-50 border border-traditional-red-200 rounded-lg shadow-lg">
            <div className="flex justify-between items-start">
              <div className="text-traditional-red-700 text-sm font-chinese">
                {translationError || feedbackError || cultureError}
              </div>
              <button
                onClick={() => {
                  clearTranslationError();
                  clearFeedbackError();
                  clearCultureError();
                }}
                className="text-traditional-red-500 hover:text-traditional-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 成功提示 */}
        {feedbackStatus === 'submitted' && (
          <div className="mb-6 p-4 bg-traditional-green-50 border border-traditional-green-200 rounded-lg shadow-lg">
            <div className="text-traditional-green-700 text-sm font-chinese">
              反馈提交成功！感谢您为改善翻译质量做出的贡献。
            </div>
          </div>
        )}

        {/* 桌面端布局 */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8">
          {/* 左侧：翻译输入 */}
          <div className="lg:col-span-5">
            <TranslationInput
              mode={mode}
              onModeChange={setMode}
              onTranslate={translate}
              onDetectRegion={detectRegion}
              onRegionChange={handleRegionChange}
              detectedRegion={detectedRegion}
              isLoading={isTranslating}
            />
          </div>

          {/* 中间：翻译结果 */}
          <div className="lg:col-span-4">
            {translationResults && (
              <TranslationResult
                results={translationResults.translations}
                wordMapping={translationResults.wordMapping || []}
                originalText={originalText}
                onFeedback={submitFeedback}
                translationMode={lastTranslationRequest?.sourceType === 'dialect' ? 'dialect_to_mandarin' : 'mandarin_to_dialect'}
                sourceDialect={lastTranslationRequest?.region}
                targetDialect={lastTranslationRequest?.targetDialect}
              />
            )}
            
            {/* 文化科普卡片 */}
            {(cultureData || isCultureLoading || cultureError) && (
              <div className="mt-6">
                <CultureCard
                  data={cultureData || { region: detectedRegion || '', content: '' }}
                  isLoading={isCultureLoading}
                  error={cultureError}
                  onRefresh={() => detectedRegion && loadCultureContent(detectedRegion)}
                />
              </div>
            )}
          </div>

          {/* 右侧：反馈留言板 */}
          <div className="lg:col-span-3">
            <FeedbackBoard
              feedbacks={feedbacks}
              onVote={vote}
              onLoadMore={loadMoreFeedbacks}
              hasMore={hasMore}
              isLoading={isFeedbackLoading}
            />
          </div>
        </div>

        {/* 移动端布局 */}
        <div className="lg:hidden space-y-6">
          {/* 翻译输入 */}
          <TranslationInput
            mode={mode}
            onModeChange={setMode}
            onTranslate={translate}
            onDetectRegion={detectRegion}
            onRegionChange={handleRegionChange}
            detectedRegion={detectedRegion}
            isLoading={isTranslating}
          />

          {/* 翻译结果 */}
          {translationResults && (
            <TranslationResult
              results={translationResults.translations}
              wordMapping={translationResults.wordMapping || []}
              originalText={originalText}
              onFeedback={submitFeedback}
              translationMode={lastTranslationRequest?.sourceType === 'dialect' ? 'dialect_to_mandarin' : 'mandarin_to_dialect'}
              sourceDialect={lastTranslationRequest?.region}
              targetDialect={lastTranslationRequest?.targetDialect}
            />
          )}

          {/* 文化科普卡片 */}
          {(cultureData || isCultureLoading || cultureError) && (
            <CultureCard
              data={cultureData || { region: detectedRegion || '', content: '' }}
              isLoading={isCultureLoading}
              error={cultureError}
              onRefresh={() => detectedRegion && loadCultureContent(detectedRegion)}
            />
          )}

          {/* 反馈留言板 */}
          <FeedbackBoard
            feedbacks={feedbacks}
            onVote={vote}
            onLoadMore={loadMoreFeedbacks}
            hasMore={hasMore}
            isLoading={isFeedbackLoading}
          />
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-traditional-gold-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-traditional-bronze-600 text-sm">
            <p className="mb-2 font-chinese">
              乡音方言翻译平台 - 传承中华方言文化，连接古今语言之美
            </p>
            <p className="text-xs font-chinese">
              免责声明：本平台所有翻译和反馈内容均由AI或用户生成，平台不对其准确性负责。
              <br />
              请理性使用翻译结果，如有疑问请咨询专业语言学者。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;