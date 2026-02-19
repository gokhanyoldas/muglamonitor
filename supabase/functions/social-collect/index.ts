import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Turkish news RSS feeds for Muğla region
const RSS_SOURCES = [
  { url: "https://www.trthaber.com/xml/rss.xml", name: "TRT Haber" },
  { url: "https://www.ntv.com.tr/son-dakika.rss", name: "NTV" },
  { url: "https://www.hurriyet.com.tr/rss/gundem", name: "Hürriyet" },
];

async function fetchRSS(source: { url: string; name: string }, keywords: string[]): Promise<any[]> {
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "MuglaMonitor/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();

    // Simple XML parsing for RSS items
    const items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] || itemXml.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]>|<description>(.*?)<\/description>/)?.[1] || "";
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

      const fullText = `${title} ${description}`.toLowerCase();
      const matchedKeywords = keywords.filter(kw => fullText.includes(kw.toLowerCase()));

      if (matchedKeywords.length > 0) {
        items.push({
          platform: "news",
          content: title,
          description: description.replace(/<[^>]*>/g, "").slice(0, 300),
          source_author: source.name,
          source_url: link,
          published_at: pubDate,
          matched_keywords: matchedKeywords,
        });
      }
    }
    return items.slice(0, 10);
  } catch (e) {
    console.error(`RSS fetch error for ${source.name}:`, e);
    return [];
  }
}

async function scrapeWithFirecrawl(keywords: string[]): Promise<any[]> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    console.log("FIRECRAWL_API_KEY not configured, skipping scrape");
    return [];
  }

  try {
    // Search for Muğla-related news
    const query = keywords.slice(0, 5).join(" ") + " Muğla";
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: 10,
        lang: "tr",
        country: "TR",
        tbs: "qdr:d", // last 24 hours
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    if (!res.ok) {
      console.error("Firecrawl search error:", res.status);
      return [];
    }

    const data = await res.json();
    const results = data.data || [];

    return results.map((r: any) => ({
      platform: "web",
      content: r.title || "Başlıksız",
      description: r.description || r.markdown?.slice(0, 300) || "",
      source_author: new URL(r.url || "https://unknown.com").hostname,
      source_url: r.url,
      matched_keywords: keywords.filter(kw =>
        `${r.title} ${r.description}`.toLowerCase().includes(kw.toLowerCase())
      ),
    }));
  } catch (e) {
    console.error("Firecrawl error:", e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { keywords, platform } = await req.json();
    const kwList: string[] = Array.isArray(keywords) ? keywords : [keywords];

    const tasks: Promise<any[]>[] = [];

    // Always fetch RSS
    if (!platform || platform === "all" || platform === "news") {
      for (const source of RSS_SOURCES) {
        tasks.push(fetchRSS(source, kwList));
      }
    }

    // Firecrawl web search
    if (!platform || platform === "all" || platform === "web") {
      tasks.push(scrapeWithFirecrawl(kwList));
    }

    const results = await Promise.all(tasks);
    const allItems = results.flat();

    return new Response(JSON.stringify({
      success: true,
      items: allItems,
      sources: {
        rss: RSS_SOURCES.length,
        firecrawl: Deno.env.get("FIRECRAWL_API_KEY") ? 1 : 0,
      },
      collected_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("social-collect error:", e);
    return new Response(JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
