// supabase/functions/social-collect/index.ts
// Collects social data from: Google News RSS, Reddit, Ekşi Sözlük
// No API keys needed - all free sources

import { corsHeaders } from "../_shared/cors.ts";

interface CollectedPost {
  platform: string;
  content: string;
  author: string;
  url: string;
  published_at: string;
  keywords_matched: string[];
}

const DEFAULT_KEYWORDS = ["Muğla", "Bodrum", "Fethiye", "Marmaris", "Milas", "Datça", "Dalaman", "Menteşe", "Ortaca", "Seydikemer"];

// ─── Google News RSS ───
async function fetchGoogleNews(keywords: string[]): Promise<CollectedPost[]> {
  const posts: CollectedPost[] = [];
  
  // Fetch news for main keyword groups
  const queries = [
    keywords.slice(0, 3).join(" OR "),
    keywords.slice(3, 6).join(" OR "),
  ];

  for (const query of queries) {
    try {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=tr&gl=TR&ceid=TR:tr`;
      const resp = await fetch(url, { 
        headers: { "User-Agent": "MuglaMonitor/1.0" },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!resp.ok) continue;
      const xml = await resp.text();
      
      // Parse RSS items
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
      
      for (const item of items.slice(0, 15)) {
        const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1") || "";
        const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
        const source = item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1") || "Google News";
        
        const matchedKw = keywords.filter(kw => 
          title.toLowerCase().includes(kw.toLowerCase())
        );
        
        if (matchedKw.length > 0) {
          posts.push({
            platform: "news",
            content: title.trim(),
            author: source.trim(),
            url: link.trim(),
            published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            keywords_matched: matchedKw,
          });
        }
      }
    } catch (e) {
      console.error("Google News fetch error:", e);
    }
  }
  
  return posts;
}

// ─── Reddit ───
async function fetchReddit(keywords: string[]): Promise<CollectedPost[]> {
  const posts: CollectedPost[] = [];
  
  const subreddits = ["Turkey", "turkiye"];
  const searchQuery = keywords.slice(0, 5).join(" OR ");
  
  for (const sub of subreddits) {
    try {
      const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(searchQuery)}&sort=new&limit=15&restrict_sr=on&t=week`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "MuglaMonitor/1.0 (Educational)" },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!resp.ok) continue;
      const data = await resp.json();
      
      const children = data?.data?.children || [];
      for (const child of children) {
        const post = child.data;
        if (!post) continue;
        
        const text = `${post.title || ""} ${post.selftext || ""}`;
        const matchedKw = keywords.filter(kw =>
          text.toLowerCase().includes(kw.toLowerCase())
        );
        
        if (matchedKw.length > 0) {
          posts.push({
            platform: "reddit",
            content: (post.title || "").slice(0, 300),
            author: `u/${post.author || "unknown"}`,
            url: `https://reddit.com${post.permalink || ""}`,
            published_at: new Date((post.created_utc || 0) * 1000).toISOString(),
            keywords_matched: matchedKw,
          });
        }
      }
    } catch (e) {
      console.error("Reddit fetch error:", e);
    }
  }
  
  return posts;
}

// ─── Ekşi Sözlük (via public başlık pages) ───
async function fetchEksiSozluk(keywords: string[]): Promise<CollectedPost[]> {
  const posts: CollectedPost[] = [];
  
  // Ekşi Sözlük topics related to Muğla
  const topics = ["mugla", "bodrum", "fethiye", "marmaris", "datca"];
  
  for (const topic of topics.slice(0, 3)) {
    try {
      const url = `https://eksisozluk1923.com/basliklar/gundem?q=${encodeURIComponent(topic)}`;
      const resp = await fetch(url, {
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html"
        },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!resp.ok) continue;
      const html = await resp.text();
      
      // Extract topic titles from HTML
      const titleMatches = html.match(/<a[^>]*href="\/([^"]+)"[^>]*>([^<]+)<\/a>/g) || [];
      
      for (const match of titleMatches.slice(0, 10)) {
        const hrefMatch = match.match(/href="\/([^"]+)"/);
        const textMatch = match.match(/>([^<]+)</);
        
        if (hrefMatch && textMatch) {
          const title = textMatch[1].trim();
          const href = hrefMatch[1];
          
          const matchedKw = keywords.filter(kw =>
            title.toLowerCase().includes(kw.toLowerCase())
          );
          
          if (matchedKw.length > 0 && title.length > 5) {
            posts.push({
              platform: "eksisozluk",
              content: title,
              author: "Ekşi Sözlük",
              url: `https://eksisozluk1923.com/${href}`,
              published_at: new Date().toISOString(),
              keywords_matched: matchedKw,
            });
          }
        }
      }
    } catch (e) {
      console.error("Ekşi Sözlük fetch error:", e);
    }
  }
  
  return posts;
}

// ─── Main Handler ───
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const keywords: string[] = body.keywords || DEFAULT_KEYWORDS;
    const platforms: string[] = body.platforms || ["news", "reddit", "eksisozluk"];

    const results: CollectedPost[] = [];
    const errors: string[] = [];

    // Fetch in parallel
    const fetchers: Promise<CollectedPost[]>[] = [];
    
    if (platforms.includes("news")) fetchers.push(fetchGoogleNews(keywords));
    if (platforms.includes("reddit")) fetchers.push(fetchReddit(keywords));
    if (platforms.includes("eksisozluk")) fetchers.push(fetchEksiSozluk(keywords));

    const allResults = await Promise.allSettled(fetchers);
    
    for (const result of allResults) {
      if (result.status === "fulfilled") {
        results.push(...result.value);
      } else {
        errors.push(result.reason?.message || "Unknown error");
      }
    }

    // Sort by date (newest first)
    results.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    return new Response(
      JSON.stringify({
        data: {
          posts: results.slice(0, 50),
          total: results.length,
          platforms_queried: platforms,
          keywords_used: keywords,
          collected_at: new Date().toISOString(),
        },
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
