import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function firecrawlScrape(apiKey: string, url: string, prompt: string, waitFor = 3000): Promise<any> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: [{ type: "json", prompt }], waitFor }),
    });
    if (!res.ok) { console.error(`Firecrawl error for ${url}:`, res.status); return null; }
    const data = await res.json();
    return data?.data?.json || data?.json || null;
  } catch (e) { console.error(`Scrape error for ${url}:`, e); return null; }
}

async function firecrawlSearch(apiKey: string, query: string, limit = 10): Promise<any[]> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit, lang: "tr", country: "tr", tbs: "qdr:d", scrapeOptions: { formats: ["markdown"] } }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data || [];
  } catch { return []; }
}

// ========== PROTOCOL - Direct HTML parsing from mugla.gov.tr ==========
async function scrapeProtocol(_apiKey: string) {
  try {
    const res = await fetch("https://www.mugla.gov.tr/il-protokol-listesi", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "tr-TR,tr;q=0.9",
      },
    });
    if (!res.ok) { console.error("Protocol direct fetch failed:", res.status); return null; }
    const html = await res.text();
    return parseProtocolHtml(html);
  } catch (e) { console.error("Protocol fetch error:", e); return null; }
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&Uuml;/g, "Ü").replace(/&uuml;/g, "ü")
    .replace(/&Ouml;/g, "Ö").replace(/&ouml;/g, "ö")
    .replace(/&Ccedil;/g, "Ç").replace(/&ccedil;/g, "ç")
    .replace(/&Iuml;/g, "İ").replace(/&#304;/g, "İ")
    .replace(/&Scedil;/g, "Ş").replace(/&scedil;/g, "ş")
    .replace(/&Gbreve;/g, "Ğ").replace(/&gbreve;/g, "ğ")
    .replace(/&#\d+;/g, "");
}

function stripHtml(h: string): string {
  return decodeHtmlEntities(h.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "")).trim();
}

function parseProtocolHtml(html: string): any[] {
  const members: any[] = [];
  // Key positions we want to extract
  const keyPositions = [
    "vali", "kaymakam", "büyükşehir belediye başkanı", "belediye başkanı",
    "cumhuriyet başsavcısı", "emniyet müdürü", "jandarma komutanı",
    "rektör", "garnizon komutanı", "milletvekili", "vali yardımcısı",
    "komutan", "amiral", "general", "tuğgeneral", "tümamiral", "tuğamiral", "koramiral",
  ];

  // Parse table rows: <tr><td>...</td><td>TITLE</td><td>NAME</td><td>...</td></tr>
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  while ((match = rowPattern.exec(html)) !== null) {
    const cells: string[] = [];
    const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch;
    while ((cellMatch = cellPattern.exec(match[1])) !== null) {
      cells.push(stripHtml(cellMatch[1]));
    }

    // The table has columns: [number/empty, ÜNVANI, ADI SOYADI, İŞ TEL., FAKS TEL.]
    if (cells.length >= 3) {
      const title = cells[1]?.trim();
      const name = cells[2]?.trim();

      if (!title || !name) continue;
      // Skip category headers (they have number in first cell and no name)
      if (/^\d+$/.test(cells[0]?.trim()) && !name) continue;
      // Skip table header row
      if (title === "ÜNVANI" || title === "NVANI") continue;

      const titleLower = title.toLowerCase();
      const isKeyPosition = keyPositions.some(k => titleLower.includes(k));

      if (isKeyPosition && name.length > 2) {
        members.push({ title, name, isNew: false });
      }
    }
  }

  console.log(`Parsed ${members.length} protocol members from HTML`);
  return members;
}

// ========== OTHER SCRAPERS (unchanged) ==========
async function scrapeWeather(apiKey: string) {
  return firecrawlScrape(apiKey, "https://www.mgm.gov.tr/tahmin/il-ve-ilceler.aspx?il=Mu%C4%9Fla",
    `Extract current weather for Muğla province. Return JSON: { temperature, humidity, wind_speed, wind_direction, condition, uv_index, sea_temp, districts: [{ name, temperature, condition }] }`);
}
async function scrapeAirQuality(apiKey: string) {
  return firecrawlScrape(apiKey, "https://www.havaizleme.gov.tr/",
    `Extract air quality data for Muğla stations. Return JSON: { aqi, pm25, pm10, quality_label, stations: [{ name, aqi, pm25, pm10 }] }`);
}
async function scrapeDamLevels(apiKey: string) {
  return firecrawlScrape(apiKey, "https://www.dsi.gov.tr/AnaSayfa/Detay/Baraj_Doluluk_Oranlari",
    `Extract dam levels for Muğla: { name, occupancy_rate, capacity, current_volume, date }. Focus on: Mumcular, Yedigöller, Geyik, Dalaman barajları.`);
}
async function scrapeNews(apiKey: string) {
  const results = await firecrawlSearch(apiKey, "Muğla haberleri güncel son dakika", 15);
  return results.map((r: any) => ({
    title: r.title || "", url: r.url || "", description: r.description || "",
    source: new URL(r.url || "https://example.com").hostname.replace("www.", ""),
    snippet: r.markdown?.substring(0, 200) || "",
  })).filter((n: any) => n.title);
}
async function scrapeEconomy(apiKey: string) {
  return firecrawlScrape(apiKey, "https://www.tuik.gov.tr/",
    `Extract economic indicators for Turkey/Muğla: { unemployment_rate, inflation_rate, tourism_revenue, new_companies, gdp_growth }`);
}
async function scrapeRealEstate(apiKey: string) {
  return firecrawlScrape(apiKey, "https://www.hepsiemlak.com/mugla-satilik",
    `Extract real estate summary for Muğla: { avg_price_per_sqm, avg_rent, total_for_sale, total_for_rent, districts: [{ name, avg_price }] }`);
}
async function scrapeTourism(apiKey: string) {
  return firecrawlScrape(apiKey, "https://mugla.ktb.gov.tr/",
    `Extract tourism stats for Muğla: { annual_tourists, hotel_occupancy, blue_flag_beaches, cruise_ships, accommodation_capacity }`);
}
async function scrapeRoadWorks(apiKey: string) {
  const results = await firecrawlSearch(apiKey, "Muğla yol çalışması kapalı yol trafik", 8);
  return results.map((r: any) => ({ title: r.title || "", description: r.description || "", source: r.url || "" })).filter((w: any) => w.title);
}
async function scrapeEnergy(apiKey: string) {
  return firecrawlScrape(apiKey, "https://seffaflik.epias.com.tr/transparency/",
    `Extract electricity data for Turkey: { daily_consumption_gwh, current_price_mwh, renewable_share }`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { type } = await req.json();
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY") || "";

    let result: any = null;
    switch (type) {
      case "weather": result = await scrapeWeather(apiKey); break;
      case "air_quality": result = await scrapeAirQuality(apiKey); break;
      case "dams": result = await scrapeDamLevels(apiKey); break;
      case "protocol": result = await scrapeProtocol(apiKey); break;
      case "news": result = await scrapeNews(apiKey); break;
      case "economy": result = await scrapeEconomy(apiKey); break;
      case "real_estate": result = await scrapeRealEstate(apiKey); break;
      case "tourism": result = await scrapeTourism(apiKey); break;
      case "road_works": result = await scrapeRoadWorks(apiKey); break;
      case "energy": result = await scrapeEnergy(apiKey); break;
      case "all": {
        const results = await Promise.allSettled([
          scrapeWeather(apiKey), scrapeAirQuality(apiKey), scrapeDamLevels(apiKey),
          scrapeProtocol(apiKey), scrapeNews(apiKey), scrapeEconomy(apiKey),
          scrapeRealEstate(apiKey), scrapeTourism(apiKey), scrapeRoadWorks(apiKey), scrapeEnergy(apiKey),
        ]);
        const keys = ["weather","air_quality","dams","protocol","news","economy","real_estate","tourism","road_works","energy"];
        result = Object.fromEntries(keys.map((k, i) => [k, results[i].status === "fulfilled" ? results[i].value : null]));
        break;
      }
      default:
        return new Response(JSON.stringify({ error: `Invalid type: ${type}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ data: result, scraped_at: new Date().toISOString(), type }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("data-scrape error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
