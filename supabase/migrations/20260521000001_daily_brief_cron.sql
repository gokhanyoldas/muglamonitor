-- Daily Brief cron job: runs every morning at 05:00 UTC (08:00 Turkey time)
SELECT cron.schedule(
  'daily-brief',
  '0 5 * * *',
  $$SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/daily-brief',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.anon_key'))
  )$$
);
