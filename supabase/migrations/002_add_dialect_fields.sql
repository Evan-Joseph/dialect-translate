-- 为反馈表添加方言信息字段
ALTER TABLE feedback 
ADD COLUMN source_dialect VARCHAR(100),
ADD COLUMN target_dialect VARCHAR(100),
ADD COLUMN translation_mode VARCHAR(50) CHECK (translation_mode IN ('dialect_to_mandarin', 'mandarin_to_dialect'));

-- 创建索引以提高查询性能
CREATE INDEX idx_feedback_source_dialect ON feedback(source_dialect);
CREATE INDEX idx_feedback_target_dialect ON feedback(target_dialect);
CREATE INDEX idx_feedback_translation_mode ON feedback(translation_mode);

-- 添加注释
COMMENT ON COLUMN feedback.source_dialect IS '源方言，如"山东话"、"四川话"等';
COMMENT ON COLUMN feedback.target_dialect IS '目标方言，用于普通话转方言的情况';
COMMENT ON COLUMN feedback.translation_mode IS '翻译模式：dialect_to_mandarin（方言转普通话）或 mandarin_to_dialect（普通话转方言）';