begin;

-- Edge Functions use the service role, which already bypasses RLS. These
-- policies unintentionally granted the same write access to anonymous clients.
drop policy if exists "Service insert social_posts" on public.social_posts;
drop policy if exists "Service update social_posts" on public.social_posts;
drop policy if exists "Service insert social_collection_runs" on public.social_collection_runs;
drop policy if exists "Service update social_collection_runs" on public.social_collection_runs;
drop policy if exists "Service insert social_trends" on public.social_trends;
drop policy if exists "Service upsert source_reliability" on public.source_reliability;
drop policy if exists "Service update source_reliability" on public.source_reliability;
drop policy if exists "service insert" on public.historical_snapshots;
drop policy if exists "service upsert" on public.historical_snapshots;

drop policy if exists "Public write social_keywords" on public.social_keywords;
drop policy if exists "Public update social_keywords" on public.social_keywords;
drop policy if exists "Public delete social_keywords" on public.social_keywords;

drop policy if exists "Public write news_sources" on public.news_sources;
drop policy if exists "Public update news_sources" on public.news_sources;
drop policy if exists "Public delete news_sources" on public.news_sources;

create policy "Managers insert news_sources"
  on public.news_sources
  for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'analyst'));

create policy "Managers update news_sources"
  on public.news_sources
  for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'analyst'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'analyst'));

create policy "Managers delete news_sources"
  on public.news_sources
  for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'analyst'));

drop policy if exists "auth_write" on public.monitored_accounts;

create policy "Managers write monitored_accounts"
  on public.monitored_accounts
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'analyst'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'analyst'));

create policy "Managers manage social_keywords"
  on public.social_keywords
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'analyst'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'analyst'));

-- Alert payloads may include e-mail content and internal processing state.
drop policy if exists "Public read email_alerts" on public.email_alerts;
drop policy if exists "Public write email_alerts" on public.email_alerts;
drop policy if exists "Public update email_alerts" on public.email_alerts;

-- Search history belongs to the signed-in user who initiated the lookup.
alter table public.osint_searches
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists idx_osint_searches_user_at
  on public.osint_searches(user_id, searched_at desc);

drop policy if exists "Public read osint_searches" on public.osint_searches;
drop policy if exists "Public write osint_searches" on public.osint_searches;
drop policy if exists "Public delete osint_searches" on public.osint_searches;

create policy "Owners read osint_searches"
  on public.osint_searches
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Owners delete osint_searches"
  on public.osint_searches
  for delete
  to authenticated
  using (auth.uid() = user_id);

commit;
