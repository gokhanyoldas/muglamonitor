-- Migration: Add columns for persistent sentiment, unique constraint, and pg_cron support
-- 2026-05-07: Priority improvements (auto-collect, trend persist, source reliability persist)

-- Add content_hash for deduplication
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS content_hash TEXT GENERATED ALWAYS AS (md5(platform || ':' || content)) STORED;
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_posts_content_hash ON social_posts(content_hash);

-- Add sentiment analysis columns to social_posts
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS sentiment TEXT;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS sentiment_confidence REAL;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS sentiment_method TEXT;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;

-- Add positive/negative/neutral counts to social_trends
ALTER TABLE social_trends ADD COLUMN IF NOT EXISTS positive_count INTEGER DEFAULT 0;
ALTER TABLE social_trends ADD COLUMN IF NOT EXISTS negative_count INTEGER DEFAULT 0;
ALTER TABLE social_trends ADD COLUMN IF NOT EXISTS neutral_count INTEGER DEFAULT 0;
ALTER TABLE social_trends ADD COLUMN IF NOT EXISTS avg_confidence REAL DEFAULT 0;

-- Unique constraint for trend upsert (1 row per period)
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_trends_period_unique ON social_trends(period_start, period_type);

-- Source reliability: add unique constraint
ALTER TABLE source_reliability ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE source_reliability ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE source_reliability ADD COLUMN IF NOT EXISTS total_posts INTEGER DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_source_reliability_unique ON source_reliability(platform, source_name);

-- Enable pg_cron extension (requires Supabase Dashboard to enable first)
-- Once enabled, add: SELECT cron.schedule('social-collect-15min', '*/15 * * * *', 
--   $$SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/social-cron',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
--     body := '{}'::jsonb
--   )$$
-- );

-- Protocol changes tracking table
CREATE TABLE IF NOT EXISTS protocol_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  old_name TEXT,
  new_name TEXT NOT NULL,
  social_url TEXT,
  social_source TEXT,
  detected_at TIMESTAMPTZ DEFAULT now(),
  confirmed BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_protocol_changes_date ON protocol_changes(detected_at DESC);
ALTER TABLE protocol_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read protocol changes" ON protocol_changes FOR SELECT USING (true);
