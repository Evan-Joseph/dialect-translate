-- 创建反馈表
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_text TEXT NOT NULL,
    original_translation TEXT NOT NULL,
    corrected_translation TEXT NOT NULL,
    region VARCHAR(100) NOT NULL,
    comment TEXT,
    user_location VARCHAR(200),
    ip_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_region ON feedback(region);
CREATE INDEX idx_feedback_ip_hash ON feedback(ip_hash);

-- 设置权限
GRANT SELECT ON feedback TO anon;
GRANT ALL PRIVILEGES ON feedback TO authenticated;

-- 创建投票表
CREATE TABLE vote (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    ip_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(feedback_id, ip_hash)
);

-- 创建索引
CREATE INDEX idx_vote_feedback_id ON vote(feedback_id);
CREATE INDEX idx_vote_ip_hash ON vote(ip_hash);

-- 设置权限
GRANT SELECT ON vote TO anon;
GRANT ALL PRIVILEGES ON vote TO authenticated;

-- 创建文化科普缓存表
CREATE TABLE culture_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region VARCHAR(100) UNIQUE NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_culture_cache_region ON culture_cache(region);
CREATE INDEX idx_culture_cache_updated_at ON culture_cache(updated_at DESC);

-- 设置权限
GRANT SELECT ON culture_cache TO anon;
GRANT ALL PRIVILEGES ON culture_cache TO authenticated;

-- 创建翻译日志表
CREATE TABLE translation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_text TEXT NOT NULL,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('dialect', 'mandarin')),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('dialect', 'mandarin')),
    region VARCHAR(100),
    translation_result JSONB NOT NULL,
    model_used VARCHAR(50),
    ip_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_translation_log_created_at ON translation_log(created_at DESC);
CREATE INDEX idx_translation_log_region ON translation_log(region);
CREATE INDEX idx_translation_log_model ON translation_log(model_used);

-- 设置权限
GRANT SELECT ON translation_log TO anon;
GRANT ALL PRIVILEGES ON translation_log TO authenticated;

-- 插入示例文化科普数据
INSERT INTO culture_cache (region, content) VALUES 
('山东', '{
  "history": "山东方言属于北方官话，历史悠久，受齐鲁文化影响深远。",
  "features": ["声调平缓", "儿化音较少", "语速适中"],
  "culture": "体现了山东人豪爽直率的性格特征，是齐鲁文化的重要载体。"
}'),
('四川', '{
  "history": "四川话属于西南官话，融合了巴蜀文化特色。",
  "features": ["语调丰富", "词汇独特", "表达生动"],
  "culture": "反映了四川人乐观幽默的生活态度和深厚的文化底蕴。"
}');