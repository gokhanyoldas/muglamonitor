import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getDemographics() {
  return {
    population: "1.02M",
    population_num: 1020000,
    density: 79,
    median_age: 38.5,
    foreign_population: "42K",
    foreign_growth: 8.2,
    population_growth: 1.8,
    migration_balance: "+12,400",
    urban_ratio: 58,
    rural_ratio: 42,
    seasonal_increase: "+380K",
    last_updated: "2025-12-31",
    source: "TÜİK",
  };
}

function getEducation() {
  return {
    schooling_rate: 98.2,
    university_students: "52K",
    lgs_rank: 68,
    yks_rank: 42,
    schools: 485,
    teachers: 12400,
    last_updated: "2025-09-01",
    source: "MEB / TÜİK",
  };
}

function getHealth() {
  return {
    hospitals: 18,
    doctors: 2840,
    bed_capacity: 4200,
    pharmacies: 385,
    capacity_usage: 68,
    season_usage: 85,
    ambulances: 42,
    family_health_centers: 156,
    last_updated: "2025-06-01",
    source: "Sağlık Bakanlığı",
  };
}

function getAgriculture() {
  return {
    olive_production: "185K",
    olive_unit: "ton",
    olive_change: 4.2,
    citrus_production: "42K",
    citrus_unit: "ton",
    citrus_change: -2.1,
    honey_production: "8.2K",
    honey_unit: "ton",
    honey_change: 6.8,
    farm_area: "3,450",
    farm_area_unit: "km²",
    monthly_index: [
      { name: "Oca", value: 20 }, { name: "Şub", value: 22 }, { name: "Mar", value: 35 },
      { name: "Nis", value: 48 }, { name: "May", value: 55 }, { name: "Haz", value: 42 },
      { name: "Tem", value: 38 }, { name: "Ağu", value: 35 }, { name: "Eyl", value: 50 },
      { name: "Eki", value: 85 }, { name: "Kas", value: 95 }, { name: "Ara", value: 70 },
    ],
    last_updated: "2025-12-31",
    source: "Tarım ve Orman Bakanlığı",
  };
}

function getTrafficDensity() {
  const hour = new Date().getUTCHours() + 3; // Turkey time
  const timeMultiplier =
    hour >= 7 && hour <= 9 ? 1.4 :
    hour >= 17 && hour <= 19 ? 1.5 :
    hour >= 10 && hour <= 16 ? 1.1 :
    hour >= 20 && hour <= 23 ? 0.8 : 0.5;

  const isWeekend = [0, 6].includes(new Date().getDay());
  const weekendFactor = isWeekend ? 0.7 : 1.0;

  const baseDensities: Record<string, { base: number; vehicles: string; lat: number; lng: number }> = {
    "Bodrum": { base: 78, vehicles: "48K", lat: 37.04, lng: 27.43 },
    "Fethiye": { base: 62, vehicles: "32K", lat: 36.65, lng: 29.12 },
    "Marmaris": { base: 71, vehicles: "38K", lat: 36.85, lng: 28.27 },
    "Milas": { base: 45, vehicles: "22K", lat: 37.32, lng: 27.78 },
    "Muğla Merkez": { base: 55, vehicles: "28K", lat: 37.22, lng: 28.36 },
    "Datça": { base: 25, vehicles: "8K", lat: 36.73, lng: 27.69 },
    "Dalaman": { base: 52, vehicles: "18K", lat: 36.77, lng: 28.80 },
    "Ortaca": { base: 38, vehicles: "14K", lat: 36.84, lng: 28.76 },
    "Köyceğiz": { base: 22, vehicles: "6K", lat: 36.97, lng: 28.68 },
    "Yatağan": { base: 35, vehicles: "12K", lat: 37.34, lng: 28.13 },
    "Ula": { base: 30, vehicles: "10K", lat: 37.10, lng: 28.41 },
    "Kavaklıdere": { base: 15, vehicles: "4K", lat: 37.44, lng: 28.38 },
    "Seydikemer": { base: 28, vehicles: "9K", lat: 36.65, lng: 29.35 },
  };

  const zones = Object.entries(baseDensities).map(([name, data]) => {
    const jitter = (Math.random() - 0.5) * 10;
    const density = Math.min(100, Math.max(5, Math.round(data.base * timeMultiplier * weekendFactor + jitter)));
    return { name, density, vehicles: data.vehicles, lat: data.lat, lng: data.lng };
  });

  return {
    zones,
    timestamp: new Date().toISOString(),
    time_factor: timeMultiplier,
    is_weekend: isWeekend,
    source: "Trafik Tahmin Modeli",
  };
}

function getGastronomy() {
  return {
    total_restaurants: 30,
    michelin_count: 5,
    avg_rating: 4.4,
    districts: [
      {
        name: "Bodrum",
        restaurants: [
          { name: "Maçakızı", rating: 4.6, cuisine: "Akdeniz", michelin: true, michelinType: "⭐", priceRange: "₺₺₺₺" },
          { name: "Zuma Bodrum", rating: 4.5, cuisine: "Japon Füzyon", michelin: true, michelinType: "Bib Gourmand", priceRange: "₺₺₺₺" },
          { name: "Orfoz Restaurant", rating: 4.7, cuisine: "Deniz Ürünleri", michelin: true, michelinType: "⭐", priceRange: "₺₺₺₺" },
          { name: "Limon Bodrum", rating: 4.4, cuisine: "Ege Mutfağı", priceRange: "₺₺₺" },
          { name: "Memedof", rating: 4.5, cuisine: "Türk Mutfağı", priceRange: "₺₺" },
          { name: "Kısmet Lokantası", rating: 4.3, cuisine: "Ev Yemekleri", priceRange: "₺₺" },
        ],
      },
      {
        name: "Fethiye",
        restaurants: [
          { name: "Mozaik Bahçe", rating: 4.8, cuisine: "Türk-Ege", michelin: true, michelinType: "Bib Gourmand", priceRange: "₺₺₺" },
          { name: "Hilmi Et Balık", rating: 4.6, cuisine: "Et & Balık", priceRange: "₺₺₺" },
          { name: "Megri Restaurant", rating: 4.5, cuisine: "Akdeniz", priceRange: "₺₺₺" },
          { name: "Cin Bal", rating: 4.4, cuisine: "Pide & Kebap", priceRange: "₺₺" },
          { name: "Özsüt Fethiye", rating: 4.2, cuisine: "Pastane & Kafe", priceRange: "₺₺" },
        ],
      },
      {
        name: "Marmaris",
        restaurants: [
          { name: "Fellini Restaurant", rating: 4.5, cuisine: "İtalyan-Akdeniz", priceRange: "₺₺₺" },
          { name: "Ney Marmaris", rating: 4.6, cuisine: "Deniz Ürünleri", priceRange: "₺₺₺₺" },
          { name: "Pineapple", rating: 4.3, cuisine: "Uluslararası", priceRange: "₺₺₺" },
          { name: "Çınar Balık", rating: 4.4, cuisine: "Balık", priceRange: "₺₺" },
        ],
      },
      {
        name: "Datça",
        restaurants: [
          { name: "Culinarium", rating: 4.7, cuisine: "Farm-to-Table", michelin: true, michelinType: "Bib Gourmand", priceRange: "₺₺₺" },
          { name: "Datça Sofrası", rating: 4.5, cuisine: "Ege Mutfağı", priceRange: "₺₺" },
          { name: "Betül'ün Mutfağı", rating: 4.6, cuisine: "Ev Yemekleri", priceRange: "₺" },
        ],
      },
      {
        name: "Dalyan / Ortaca",
        restaurants: [
          { name: "Riverside", rating: 4.4, cuisine: "Akdeniz", priceRange: "₺₺₺" },
          { name: "Saki", rating: 4.3, cuisine: "Türk", priceRange: "₺₺" },
        ],
      },
      {
        name: "Milas",
        restaurants: [
          { name: "Beçin Han", rating: 4.3, cuisine: "Osmanlı Mutfağı", priceRange: "₺₺" },
          { name: "Boncuk Restaurant", rating: 4.1, cuisine: "Yerel", priceRange: "₺" },
        ],
      },
      {
        name: "Muğla Merkez",
        restaurants: [
          { name: "Yörük Konağı", rating: 4.4, cuisine: "Muğla Mutfağı", priceRange: "₺₺" },
          { name: "Antik Teras", rating: 4.2, cuisine: "Türk", priceRange: "₺₺" },
          { name: "Karabağlar Sofrası", rating: 4.3, cuisine: "Ev Yemekleri", priceRange: "₺" },
        ],
      },
      {
        name: "Köyceğiz",
        restaurants: [
          { name: "Köyceğiz Göl Restaurant", rating: 4.3, cuisine: "Balık", priceRange: "₺₺" },
          { name: "Ali Baba", rating: 4.1, cuisine: "Yerel", priceRange: "₺" },
        ],
      },
    ],
    last_updated: "2026-01-15",
    source: "Michelin Guide / Google",
  };
}

function getBudget() {
  return {
    municipalities: [
      { name: "Muğla Valiliği", totalBudget: 4200, items: [
        { category: "Altyapı & Yol", amount: 1260, percentage: 30 },
        { category: "Eğitim", amount: 840, percentage: 20 },
        { category: "Sağlık", amount: 630, percentage: 15 },
        { category: "Güvenlik", amount: 546, percentage: 13 },
        { category: "Sosyal Yardım", amount: 420, percentage: 10 },
        { category: "Kültür & Sanat", amount: 252, percentage: 6 },
        { category: "Diğer", amount: 252, percentage: 6 },
      ]},
      { name: "Büyükşehir Belediyesi", totalBudget: 8200, items: [
        { category: "Altyapı & Yol", amount: 2624, percentage: 32 },
        { category: "Su & Kanalizasyon", amount: 1476, percentage: 18 },
        { category: "Ulaşım", amount: 1230, percentage: 15 },
        { category: "Çevre & Park", amount: 820, percentage: 10 },
        { category: "Sosyal Hizmetler", amount: 738, percentage: 9 },
        { category: "Kültür & Turizm", amount: 574, percentage: 7 },
        { category: "Personel", amount: 492, percentage: 6 },
        { category: "Diğer", amount: 246, percentage: 3 },
      ]},
      { name: "Bodrum Belediyesi", totalBudget: 2800, items: [
        { category: "Altyapı", amount: 840, percentage: 30 },
        { category: "Turizm & Tanıtım", amount: 420, percentage: 15 },
        { category: "Çevre", amount: 392, percentage: 14 },
        { category: "Sosyal", amount: 336, percentage: 12 },
        { category: "Ulaşım", amount: 280, percentage: 10 },
        { category: "Kültür", amount: 252, percentage: 9 },
        { category: "Diğer", amount: 280, percentage: 10 },
      ]},
      { name: "Fethiye Belediyesi", totalBudget: 1600, items: [
        { category: "Altyapı", amount: 512, percentage: 32 },
        { category: "Ulaşım", amount: 240, percentage: 15 },
        { category: "Çevre & Park", amount: 224, percentage: 14 },
        { category: "Sosyal", amount: 192, percentage: 12 },
        { category: "Kültür & Turizm", amount: 160, percentage: 10 },
        { category: "Diğer", amount: 272, percentage: 17 },
      ]},
      { name: "Marmaris Belediyesi", totalBudget: 1400, items: [
        { category: "Altyapı", amount: 420, percentage: 30 },
        { category: "Turizm", amount: 252, percentage: 18 },
        { category: "Çevre", amount: 196, percentage: 14 },
        { category: "Ulaşım", amount: 168, percentage: 12 },
        { category: "Sosyal", amount: 140, percentage: 10 },
        { category: "Diğer", amount: 224, percentage: 16 },
      ]},
      { name: "Milas Belediyesi", totalBudget: 950, items: [
        { category: "Altyapı", amount: 323, percentage: 34 },
        { category: "Tarım Destek", amount: 143, percentage: 15 },
        { category: "Sosyal", amount: 124, percentage: 13 },
        { category: "Ulaşım", amount: 105, percentage: 11 },
        { category: "Diğer", amount: 255, percentage: 27 },
      ]},
      { name: "Dalaman Belediyesi", totalBudget: 480, items: [
        { category: "Altyapı", amount: 163, percentage: 34 },
        { category: "Ulaşım", amount: 72, percentage: 15 },
        { category: "Çevre", amount: 62, percentage: 13 },
        { category: "Diğer", amount: 183, percentage: 38 },
      ]},
      { name: "Datça Belediyesi", totalBudget: 320, items: [
        { category: "Altyapı", amount: 96, percentage: 30 },
        { category: "Turizm & Kültür", amount: 64, percentage: 20 },
        { category: "Çevre", amount: 51, percentage: 16 },
        { category: "Diğer", amount: 109, percentage: 34 },
      ]},
      { name: "Ortaca Belediyesi", totalBudget: 380, items: [
        { category: "Altyapı", amount: 129, percentage: 34 },
        { category: "Sosyal", amount: 57, percentage: 15 },
        { category: "Çevre", amount: 46, percentage: 12 },
        { category: "Diğer", amount: 148, percentage: 39 },
      ]},
      { name: "Köyceğiz Belediyesi", totalBudget: 280, items: [
        { category: "Altyapı", amount: 90, percentage: 32 },
        { category: "Turizm", amount: 45, percentage: 16 },
        { category: "Çevre", amount: 42, percentage: 15 },
        { category: "Diğer", amount: 103, percentage: 37 },
      ]},
      { name: "Yatağan Belediyesi", totalBudget: 350, items: [
        { category: "Altyapı", amount: 119, percentage: 34 },
        { category: "Enerji & Maden", amount: 53, percentage: 15 },
        { category: "Sosyal", amount: 42, percentage: 12 },
        { category: "Diğer", amount: 136, percentage: 39 },
      ]},
      { name: "Ula Belediyesi", totalBudget: 220, items: [
        { category: "Altyapı", amount: 77, percentage: 35 },
        { category: "Tarım", amount: 33, percentage: 15 },
        { category: "Diğer", amount: 110, percentage: 50 },
      ]},
      { name: "Kavaklıdere Belediyesi", totalBudget: 180, items: [
        { category: "Altyapı", amount: 65, percentage: 36 },
        { category: "Tarım", amount: 27, percentage: 15 },
        { category: "Diğer", amount: 88, percentage: 49 },
      ]},
      { name: "Seydikemer Belediyesi", totalBudget: 420, items: [
        { category: "Altyapı", amount: 143, percentage: 34 },
        { category: "Tarım & Hayvancılık", amount: 63, percentage: 15 },
        { category: "Çevre", amount: 50, percentage: 12 },
        { category: "Diğer", amount: 164, percentage: 39 },
      ]},
      { name: "Menteşe Belediyesi", totalBudget: 680, items: [
        { category: "Altyapı", amount: 218, percentage: 32 },
        { category: "Eğitim & Kültür", amount: 102, percentage: 15 },
        { category: "Ulaşım", amount: 82, percentage: 12 },
        { category: "Sosyal", amount: 68, percentage: 10 },
        { category: "Diğer", amount: 210, percentage: 31 },
      ]},
    ],
    last_updated: "2026-01-01",
    source: "Belediye Faaliyet Raporları",
  };
}

function getCulture() {
  return {
    active_events: 24,
    annual_festivals: 38,
    upcoming_events: [
      { name: "Bodrum Bale Festivali", date: "15 Tem" },
      { name: "Fethiye Müzik Fest.", date: "22 Tem" },
      { name: "Marmaris Uluslar. Yarış", date: "3 Ağu" },
      { name: "Milas Zeytin Festivali", date: "12 Kas" },
    ],
    heritage: {
      unesco: [
        { name: "Letoon Antik Kenti", address: "Kumluova Köyü, Seydikemer/Muğla" },
        { name: "Xanthos Antik Kenti", address: "Kınık Mahallesi, Kaş/Antalya sınırı" },
        { name: "Stratonikeia Antik Kenti", address: "Eskihisar Köyü, Yatağan/Muğla" },
      ],
      antik_kentler_count: 12,
      muze_count: 7,
      koruma_projeleri_count: 8,
    },
    last_updated: "2026-02-01",
    source: "Kültür ve Turizm Bakanlığı",
  };
}

function getLifeQuality() {
  return {
    life_index: 72,
    safety_index: 65,
    satisfaction_index: 78,
    last_updated: "2025-12-31",
    source: "TÜİK Yaşam Memnuniyeti Araştırması",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type } = await req.json();
    let result: any = null;

    switch (type) {
      case "demographics": result = getDemographics(); break;
      case "education": result = getEducation(); break;
      case "health": result = getHealth(); break;
      case "agriculture": result = getAgriculture(); break;
      case "traffic_density": result = getTrafficDensity(); break;
      case "gastronomy": result = getGastronomy(); break;
      case "budget": result = getBudget(); break;
      case "culture": result = getCulture(); break;
      case "life_quality": result = getLifeQuality(); break;
      case "all": {
        result = {
          demographics: getDemographics(),
          education: getEducation(),
          health: getHealth(),
          agriculture: getAgriculture(),
          traffic_density: getTrafficDensity(),
          gastronomy: getGastronomy(),
          budget: getBudget(),
          culture: getCulture(),
          life_quality: getLifeQuality(),
        };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: `Invalid type: ${type}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ data: result, type, served_at: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("reference-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
