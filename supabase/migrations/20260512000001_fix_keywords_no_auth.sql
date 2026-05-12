-- Fix: social_keywords for no-auth environment
-- The original table required user_id NOT NULL (auth), but app has no auth yet.
-- This migration makes it work publicly.

-- 1. Make user_id nullable (app has no auth layer yet)
ALTER TABLE public.social_keywords ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add missing columns from social_enhancements migration (if not already there)
ALTER TABLE public.social_keywords ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.social_keywords ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.social_keywords ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.social_keywords ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';

-- 3. Add unique constraint on keyword (needed for ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'social_keywords_keyword_unique'
  ) THEN
    ALTER TABLE public.social_keywords ADD CONSTRAINT social_keywords_keyword_unique UNIQUE (keyword);
  END IF;
END $$;

-- 4. Drop old user-scoped RLS policies, replace with public access
DROP POLICY IF EXISTS "Users manage own keywords" ON public.social_keywords;

-- Public read
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read social_keywords' AND tablename = 'social_keywords') THEN
    CREATE POLICY "Public read social_keywords" ON public.social_keywords FOR SELECT USING (true);
  END IF;
END $$;

-- Public write
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public write social_keywords' AND tablename = 'social_keywords') THEN
    CREATE POLICY "Public write social_keywords" ON public.social_keywords FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Public update
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public update social_keywords' AND tablename = 'social_keywords') THEN
    CREATE POLICY "Public update social_keywords" ON public.social_keywords FOR UPDATE USING (true);
  END IF;
END $$;

-- Public delete
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public delete social_keywords' AND tablename = 'social_keywords') THEN
    CREATE POLICY "Public delete social_keywords" ON public.social_keywords FOR DELETE USING (true);
  END IF;
END $$;

-- 5. Seed default keywords (safe upsert, no user_id needed)
INSERT INTO public.social_keywords (keyword, category, region, is_active, created_by) VALUES
  ('Muğla',     'general',     NULL,         true, 'system'),
  ('Bodrum',    'general',     'Bodrum',     true, 'system'),
  ('Fethiye',   'general',     'Fethiye',    true, 'system'),
  ('Marmaris',  'general',     'Marmaris',   true, 'system'),
  ('Datça',     'general',     'Datça',      true, 'system'),
  ('Dalaman',   'general',     'Dalaman',    true, 'system'),
  ('Milas',     'general',     'Milas',      true, 'system'),
  ('Köyceğiz',  'general',     'Köyceğiz',   true, 'system'),
  ('Ortaca',    'general',     'Ortaca',     true, 'system'),
  ('Menteşe',   'general',     'Menteşe',    true, 'system'),
  ('Yatağan',   'general',     'Yatağan',    true, 'system'),
  ('yangın',    'crisis',      NULL,         true, 'system'),
  ('deprem',    'crisis',      NULL,         true, 'system'),
  ('sel',       'crisis',      NULL,         true, 'system'),
  ('kaza',      'crisis',      NULL,         true, 'system'),
  ('orman',     'environment', NULL,         true, 'system'),
  ('turizm',    'tourism',     NULL,         true, 'system'),
  ('otel',      'tourism',     NULL,         true, 'system'),
  ('tatil',     'tourism',     NULL,         true, 'system'),
  ('ekonomi',   'economy',     NULL,         true, 'system'),
  ('işsizlik',  'economy',     NULL,         true, 'system')
ON CONFLICT (keyword) DO UPDATE
  SET is_active = true,
      category = EXCLUDED.category,
      created_by = EXCLUDED.created_by;

