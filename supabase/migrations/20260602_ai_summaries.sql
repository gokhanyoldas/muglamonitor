CREATE TABLE public.ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  summary text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  date date NOT NULL DEFAULT current_date,
  UNIQUE (type, date)
);
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_summaries_public_read" ON public.ai_summaries FOR SELECT USING (true);
CREATE POLICY "ai_summaries_service_write" ON public.ai_summaries FOR ALL TO service_role USING (true);
