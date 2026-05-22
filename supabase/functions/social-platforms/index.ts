// supabase/functions/social-platforms/index.ts
// Fetches social data from YouTube, Twitter/X, and Facebook
// YouTube uses Data API v3 (free 10k units/day) with RSS fallback
// Twitter uses v2 API (when bearer token is available)
// Facebook uses Graph API (when page token is available)

import { corsHeaders } from '../_shared/cors.ts';

const MUGLA_KEYWORDS = ['Muğla', 'Bodrum', 'Fethiye', 'Marmaris', 'Milas', 'Datça', 'Dalaman'];

interface SocialPost {
  platform: string;
  content: string;
  author: string;
  url: string;
  published_at: string;
  keywords_matched: string[];
  engagement?: { views?: number; likes?: number; comments?: number };
}

// ─────────────────────────────────────────────
//  YOUTUBE — Data API v3 (search.list)
// ─────────────────────────────────────────────
async function fetchYouTube(keywords: string[]): Promise<SocialPost[]> {
  const apiKey = Deno.env.get('YOUTUBE_API_KEY');
  if (!apiKey) {
    return fetchYouTubeRSS(keywords);
  }

  const posts: SocialPost[] = [];
  const query = keywords.slice(0, 5).join(' | ');

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('order', 'date');
    url.searchParams.set('regionCode', 'TR');
    url.searchParams.set('relevanceLanguage', 'tr');
    url.searchParams.set('maxResults', '20');
    url.searchParams.set('key', apiKey);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    url.searchParams.set('publishedAfter', since);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      console.error(`YouTube API error: ${res.status}`);
      return fetchYouTubeRSS(keywords);
    }

    const data = await res.json();
    for (const item of (data.items || [])) {
      const snippet = item.snippet || {};
      const videoId = item.id?.videoId || '';
      const title = snippet.title || '';
      const description = (snippet.description || '').slice(0, 300);
      const channel = snippet.channelTitle || '';
      const publishedAt = snippet.publishedAt || '';

      const matched = keywords.filter(k =>
        (title + ' ' + description).toLowerCase().includes(k.toLowerCase())
      );

      posts.push({
        platform: 'youtube',
        content: `${title}\n${description}`.trim(),
        author: channel,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        published_at: publishedAt,
        keywords_matched: matched.length > 0 ? matched : [keywords[0]],
      });
    }
  } catch (e) {
    console.error('[YouTube API]', e);
    return fetchYouTubeRSS(keywords);
  }

  return posts;
}

// YouTube RSS fallback (no API key needed)
async function fetchYouTubeRSS(keywords: string[]): Promise<SocialPost[]> {
  const posts: SocialPost[] = [];

  // Known Muğla-region YouTube channels
  const channels = [
    { id: 'UCHW-vRdvRiGUS-O_L-o450g', name: 'Muğla Merkez TV' },
    { id: 'UCzHBhO0FhUVN_k44Gq6GhFA', name: 'Bodrum Belediyesi' },
  ];

  for (const ch of channels) {
    try {
      const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MuglaMonitor/1.0' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const text = await res.text();

      const entries = [...text.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
      for (const entry of entries.slice(0, 5)) {
        const xml = entry[1];
        const title = xml.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const videoId = xml.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] || '';
        const published = xml.match(/<published>(.*?)<\/published>/)?.[1] || '';
        const author = xml.match(/<author>[\s\S]*?<name>(.*?)<\/name>/)?.[1] || ch.name;

        const matched = keywords.filter(k => title.toLowerCase().includes(k.toLowerCase()));

        posts.push({
          platform: 'youtube',
          content: title,
          author,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          published_at: published,
          keywords_matched: matched.length > 0 ? matched : ['Muğla'],
        });
      }
    } catch (_) { /* skip */ }
  }

  return posts;
}

// ─────────────────────────────────────────────
//  TWITTER/X — v2 API (Bearer Token)
// ─────────────────────────────────────────────
async function fetchTwitter(keywords: string[]): Promise<SocialPost[]> {
  const bearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');
  if (!bearerToken) {
    console.log('[Twitter] No TWITTER_BEARER_TOKEN set, skipping');
    return [];
  }

  const posts: SocialPost[] = [];
  const query = keywords.slice(0, 4).join(' OR ') + ' lang:tr -is:retweet';

  try {
    const url = new URL('https://api.twitter.com/2/tweets/search/recent');
    url.searchParams.set('query', query);
    url.searchParams.set('max_results', '20');
    url.searchParams.set('tweet.fields', 'created_at,public_metrics,author_id');
    url.searchParams.set('expansions', 'author_id');

    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${bearerToken}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error(`[Twitter] API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const tweets = data.data || [];
    const users: Record<string, string> = {};
    for (const u of (data.includes?.users || [])) {
      users[u.id] = u.username;
    }

    for (const tweet of tweets) {
      const username = users[tweet.author_id] || tweet.author_id;
      const matched = keywords.filter(k => tweet.text.toLowerCase().includes(k.toLowerCase()));

      posts.push({
        platform: 'twitter',
        content: tweet.text,
        author: `@${username}`,
        url: `https://x.com/${username}/status/${tweet.id}`,
        published_at: tweet.created_at || '',
        keywords_matched: matched.length > 0 ? matched : [keywords[0]],
        engagement: {
          likes: tweet.public_metrics?.like_count,
          comments: tweet.public_metrics?.reply_count,
        },
      });
    }
  } catch (e) {
    console.error('[Twitter]', e);
  }

  return posts;
}

// ─────────────────────────────────────────────
//  FACEBOOK — Graph API (Page Token)
// ─────────────────────────────────────────────
async function fetchFacebook(keywords: string[]): Promise<SocialPost[]> {
  const pageToken = Deno.env.get('FACEBOOK_PAGE_TOKEN');
  const pageId = Deno.env.get('FACEBOOK_PAGE_ID');
  if (!pageToken || !pageId) {
    console.log('[Facebook] No FACEBOOK_PAGE_TOKEN or FACEBOOK_PAGE_ID set, skipping');
    return [];
  }

  const posts: SocialPost[] = [];

  try {
    const url = `https://graph.facebook.com/v23.0/${pageId}/feed?fields=id,message,created_time,permalink_url&limit=15&access_token=${pageToken}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!res.ok) {
      console.error(`[Facebook] API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    for (const post of (data.data || [])) {
      if (!post.message) continue;
      const matched = keywords.filter(k => post.message.toLowerCase().includes(k.toLowerCase()));

      posts.push({
        platform: 'facebook',
        content: post.message.slice(0, 1000),
        author: pageId,
        url: post.permalink_url || '',
        published_at: post.created_time || '',
        keywords_matched: matched.length > 0 ? matched : [keywords[0]],
      });
    }
  } catch (e) {
    console.error('[Facebook]', e);
  }

  return posts;
}

// ─────────────────────────────────────────────
//  MAIN HANDLER
// ─────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const keywords: string[] = body.keywords || MUGLA_KEYWORDS;
    const platforms: string[] = body.platforms || ['youtube', 'twitter', 'facebook'];

    const results: SocialPost[] = [];
    const errors: string[] = [];
    const stats: Record<string, number> = {};

    const fetchers: Array<{ name: string; fn: () => Promise<SocialPost[]> }> = [];
    if (platforms.includes('youtube')) fetchers.push({ name: 'youtube', fn: () => fetchYouTube(keywords) });
    if (platforms.includes('twitter')) fetchers.push({ name: 'twitter', fn: () => fetchTwitter(keywords) });
    if (platforms.includes('facebook')) fetchers.push({ name: 'facebook', fn: () => fetchFacebook(keywords) });

    const allResults = await Promise.allSettled(fetchers.map(f => f.fn()));
    for (let i = 0; i < allResults.length; i++) {
      const result = allResults[i];
      const name = fetchers[i].name;
      if (result.status === 'fulfilled') {
        results.push(...result.value);
        stats[name] = result.value.length;
      } else {
        errors.push(`${name}: ${result.reason?.message || 'Unknown'}`);
        stats[name] = 0;
      }
    }

    results.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    return new Response(
      JSON.stringify({
        data: {
          posts: results,
          total: results.length,
          stats,
          platforms_queried: platforms,
          keywords_used: keywords,
          collected_at: new Date().toISOString(),
        },
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[social-platforms] error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
