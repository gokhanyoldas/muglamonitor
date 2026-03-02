import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function firecrawlScrape(apiKey: string, url: string, prompt: string, waitFor = 3000): Promise<any> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: [{ type: "json", prompt }],
        waitFor,
      }),
    });
    if (!res.ok) {
      console.error(`Firecrawl error for ${url}:`, res.status);
      return null;
    }
    const data = await res.json();
    return data?.data?.json || data?.json || null;
  } catch (e) {
    console.error(`Scrape error for ${url}:`, e);
    return null;
  }
}

async function firecrawlSearch(apiKey: string, query: string, limit = 10): Promise<any[]> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit,
        lang: "tr",
        country: "tr",
        tbs: "qdr:d",
        scrapeOptions: { formats: ["markdown"] },
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data || [];
  } catch {
    return [];
  }
}

// ========== WEATHER ==========
async function scrapeWeather(apiKey: string) {
  const json = await firecrawlScrape(
    apiKey,
    "https://www.mgm.gov.tr/tahmin/il-ve-ilceler.aspx?il=Mu%C4%9Fla",
    `Extract current weather for Muğla province. Return JSON: { temperature (number °C), humidity (number %), wind_speed (number km/h), wind_direction (string), condition (string like "Güneşli", "Bulutlu", "Yağmurlu"), uv_index (number), sea_temp (number °C if available), districts: [{ name, temperature, condition }] }`
  );
  return json;
}

// ========== AIR QUALITY ==========
async function scrapeAirQuality(apiKey: string) {
  const json = await firecrawlScrape(
    apiKey,
    "https://www.havaizleme.gov.tr/",
    `Extract air quality data for Muğla stations. Return JSON: { aqi (number 0-500), pm25 (number), pm10 (number), quality_label (string: "İyi", "Orta", "Hassas", "Sağlıksız"), stations: [{ name, aqi, pm25, pm10 }] }`
  );
  return json;
}

// ========== DAM LEVELS ==========
async function scrapeDamLevels(apiKey: string) {
  const json = await firecrawlScrape(
    apiKey,
    "https://www.dsi.gov.tr/AnaSayfa/Detay/Baraj_Doluluk_Oranlari",
    `Extract dam water levels for dams in Muğla province (Aydın/Muğla region). For each dam return: { name (string), occupancy_rate (number 0-100), capacity (string like "55 hm³"), current_volume (string), date (string) }. Focus on: Mumcular, Yedigöller, Geyik, Dalaman, Akköprü, Kemer, Yılanlı, Çamiçi barajları.`
  );
  return json;
}

// ========== PROTOCOL (Governor's Office) ==========
async function scrapeProtocol(apiKey: string) {
  const json = await firecrawlScrape(
    apiKey,
    "https://www.mugla.gov.tr/il-protokol-listesi",
    `Extract the official protocol list of Muğla province officials. For each person return: { title (string - official position), name (string - full name), isNew (boolean - if recently appointed) }. Include: Vali, Garnizon Komutanı, Büyükşehir Belediye Başkanı, Başsavcı, Emniyet Müdürü, Jandarma Komutanı, Rektör, and all district Kaymakams.`
  );
  return json;
}

// ========== NEWS ==========
async function scrapeNews(apiKey: string) {
  const results = await firecrawlSearch(apiKey, "Muğla haberleri güncel son dakika", 15);
  const news = results.map((r: any) => ({
    title: r.title || "",
    url: r.url || "",
    description: r.description || "",
    source: new URL(r.url || "https://example.com").hostname.replace("www.", ""),
    snippet: r.markdown?.substring(0, 200) || "",
  })).filter((n: any) => n.title);
  return news;
}

// ========== ECONOMY ==========
async function scrapeEconomy(apiKey: string) {
  const json = await firecrawlScrape(
    apiKey,
    "https://www.tuik.gov.tr/",
    `Extract latest economic indicators relevant to Turkey/Muğla: { unemployment_rate (number %), inflation_rate (number %), tourism_revenue (string), new_companies (number), gdp_growth (number %) }. Return whatever is available.`
  );
  return json;
}

// ========== REAL ESTATE ==========
async function scrapeRealEstate(apiKey: string) {
  const json = await firecrawlScrape(
    apiKey,
    "https://www.hepsiemlak.com/mugla-satilik",
    `Extract real estate market summary for Muğla: { avg_price_per_sqm (number TL), avg_rent (number TL/month), total_for_sale (number), total_for_rent (number), districts: [{ name, avg_price }] }`
  );
  return json;
}

// ========== TOURISM ==========
async function scrapeTourism(apiKey: string) {
  const json = await firecrawlScrape(
    apiKey,
    "https://mugla.ktb.gov.tr/",
    `Extract tourism statistics for Muğla province: { annual_tourists (string), hotel_occupancy (number %), blue_flag_beaches (number), cruise_ships (number), accommodation_capacity (number beds) }`
  );
  return json;
}

// ========== ROAD WORKS ==========
async function scrapeRoadWorks(apiKey: string) {
  const results = await firecrawlSearch(apiKey, "Muğla yol çalışması kapalı yol trafik", 8);
  const works = results.map((r: any) => ({
    title: r.title || "",
    description: r.description || "",
    source: r.url || "",
  })).filter((w: any) => w.title);
  return works;
}

// ========== ENERGY ==========
async function scrapeEnergy(apiKey: string) {
  const json = await firecrawlScrape(
    apiKey,
    "https://seffaflik.epias.com.tr/transparency/",
    `Extract current electricity data for Turkey: { daily_consumption_gwh (number), current_price_mwh (number TL), renewable_share (number %) }`
  );
  return json;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type } = await req.json();
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any = null;

    switch (type) {
      case "weather":
        result = await scrapeWeather(apiKey);
        break;
      case "air_quality":
        result = await scrapeAirQuality(apiKey);
        break;
      case "dams":
        result = await scrapeDamLevels(apiKey);
        break;
      case "protocol":
        result = await scrapeProtocol(apiKey);
        break;
      case "news":
        result = await scrapeNews(apiKey);
        break;
      case "economy":
        result = await scrapeEconomy(apiKey);
        break;
      case "real_estate":
        result = await scrapeRealEstate(apiKey);
        break;
      case "tourism":
        result = await scrapeTourism(apiKey);
        break;
      case "road_works":
        result = await scrapeRoadWorks(apiKey);
        break;
      case "energy":
        result = await scrapeEnergy(apiKey);
        break;
      case "all": {
        const [weather, airQuality, dams, protocol, news, economy, realEstate, tourism, roadWorks, energy] =
          await Promise.allSettled([
            scrapeWeather(apiKey),
            scrapeAirQuality(apiKey),
            scrapeDamLevels(apiKey),
            scrapeProtocol(apiKey),
            scrapeNews(apiKey),
            scrapeEconomy(apiKey),
            scrapeRealEstate(apiKey),
            scrapeTourism(apiKey),
            scrapeRoadWorks(apiKey),
            scrapeEnergy(apiKey),
          ]);
        result = {
          weather: weather.status === "fulfilled" ? weather.value : null,
          air_quality: airQuality.status === "fulfilled" ? airQuality.value : null,
          dams: dams.status === "fulfilled" ? dams.value : null,
          protocol: protocol.status === "fulfilled" ? protocol.value : null,
          news: news.status === "fulfilled" ? news.value : null,
          economy: economy.status === "fulfilled" ? economy.value : null,
          real_estate: realEstate.status === "fulfilled" ? realEstate.value : null,
          tourism: tourism.status === "fulfilled" ? tourism.value : null,
          road_works: roadWorks.status === "fulfilled" ? roadWorks.value : null,
          energy: energy.status === "fulfilled" ? energy.value : null,
        };
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: `Invalid type: ${type}. Use: weather, air_quality, dams, protocol, news, economy, real_estate, tourism, road_works, energy, or all.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ data: result, scraped_at: new Date().toISOString(), type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("data-scrape error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
