import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

function parseRSSItems(xml: string, limit = 10) {
  const items: { title: string; link: string; pubDate: string; description: string; source: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const item = match[1];
    const get = (tag: string) => { const m = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i")); return m ? m[1].trim() : ""; };
    items.push({ title: get("title"), link: get("link"), pubDate: get("pubDate"), description: get("description").replace(/<[^>]+>/g, "").slice(0, 200), source: "" });
  }
  return items;
}

async function fetchWithTimeout(url: string, ms = 5000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "MuglaMonitor/2.0" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally { clearTimeout(timeout); }
}

const SOURCES: Record<string, { urls: string[]; label: string }> = {
  municipality: { urls: ["https://www.mugla.bel.tr/rss", "https://www.bodrum.bel.tr/rss", "https://www.fethiye.bel.tr/rss"], label: "Belediye" },
  afad: { urls: ["https://afad.gov.tr/rss/haberler.rss"], label: "AFAD" },
  news: { urls: ["https://news.google.com/rss/search?q=Mu%C4%9Fla&hl=tr&gl=TR&ceid=TR:tr", "https://news.google.com/rss/search?q=Bodrum+OR+Fethiye+OR+Marmaris&hl=tr&gl=TR&ceid=TR:tr"], label: "Haberler" },
  environment: { urls: ["https://news.google.com/rss/search?q=Mu%C4%9Fla+%C3%A7evre+OR+orman+OR+yang%C4%B1n&hl=tr&gl=TR&ceid=TR:tr"], label: "Çevre" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const source = url.searchParams.get("source") ?? "all";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "15"), 50);

  try {
    let allItems: ReturnType<typeof parseRSSItems> = [];
    const sourcesToFetch = source === "all" ? Object.keys(SOURCES) : [source];

    for (const srcKey of sourcesToFetch) {
      const src = SOURCES[srcKey];
      if (!src) continue;
      for (const feedUrl of src.urls) {
        try {
          const xml = await fetchWithTimeout(feedUrl, 4000);
          const items = parseRSSItems(xml, limit).map(i => ({ ...i, source: src.label }));
          allItems = [...allItems, ...items];
        } catch { /* skip */ }
      }
    }

    allItems.sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    });

    return new Response(JSON.stringify({ source, count: Math.min(allItems.length, limit), sources_queried: sourcesToFetch, fetched_at: new Date().toISOString(), items: allItems.slice(0, limit) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e), items: [] }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
