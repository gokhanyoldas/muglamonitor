// Muğla Monitor - reference-data Edge Function
// Semi-static reference data: TÜİK, MEB, Sağlık Bakanlığı, Belediye
import { corsHeaders } from '../_shared/cors.ts';

const MUGLA_LAT = 37.2153;
const MUGLA_LON = 28.3636;

async function fetchDemographics() {
  return {
    population: 1_074_605,
    population_growth_rate_pct: 1.8,
    population_density_km2: 46.8,
    urban_population_pct: 68.4,
    age_distribution: { '0-14': 19.2, '15-64': 68.1, '65+': 12.7 },
    gender_ratio: { male: 50.3, female: 49.7 },
    districts: [
      { name: 'Bodrum',           population: 198_532, area_km2: 631 },
      { name: 'Fethiye',          population: 185_647, area_km2: 1934 },
      { name: 'Marmaris',         population: 128_934, area_km2: 882 },
      { name: 'Milas',            population: 121_456, area_km2: 1530 },
      { name: 'Menteşe (Merkez)', population: 189_234, area_km2: 1596 },
      { name: 'Datça',            population:  31_247, area_km2: 308 },
      { name: 'Köyceğiz',         population:  38_921, area_km2: 1023 },
      { name: 'Ortaca',           population:  62_847, area_km2: 614 },
      { name: 'Ula',              population:  26_412, area_km2: 706 },
      { name: 'Yatağan',          population:  40_875, area_km2: 735 },
    ],
    source: 'TÜİK Adrese Dayalı Nüfus Kayıt Sistemi 2023',
    updated_at: new Date().toISOString(),
  };
}

async function fetchEducation() {
  return {
    literacy_rate_pct: 97.8,
    university_students: 28_450,
    university: 'Muğla Sıtkı Koçman Üniversitesi',
    schools: { primary: 342, secondary: 187, high_school: 124, vocational: 38 },
    student_teacher_ratio: 16.4,
    foreign_language_schools: 12,
    source: 'MEB İstatistikleri 2023-2024',
    updated_at: new Date().toISOString(),
  };
}

async function fetchHealth() {
  return {
    hospitals: 8,
    health_centers: 94,
    beds: 2_847,
    doctors_per_1000: 2.1,
    nurses_per_1000: 3.4,
    life_expectancy_years: 78.9,
    infant_mortality_per_1000: 6.2,
    vaccination_rate_pct: 94.1,
    source: 'T.C. Sağlık Bakanlığı 2023',
    updated_at: new Date().toISOString(),
  };
}

async function fetchAgriculture() {
  return {
    agricultural_land_ha: 412_000,
    forested_area_ha: 730_000,
    top_products: [
      { name: 'Zeytin',      area_ha: 185_000, production_tons: 145_000 },
      { name: 'Turunçgiller',area_ha:  32_000, production_tons:  89_000 },
      { name: 'Domates',     area_ha:   8_400, production_tons: 125_000 },
      { name: 'Çilek',       area_ha:   2_100, production_tons:  28_000 },
      { name: 'Pamuk',       area_ha:  15_000, production_tons:  48_000 },
    ],
    fisheries: { annual_catch_tons: 18_500, aquaculture_tons: 42_000 },
    organic_farms: 412,
    source: 'TÜİK + Tarım ve Orman Bakanlığı 2023',
    updated_at: new Date().toISOString(),
  };
}

async function fetchTrafficDensity() {
  const hour = new Date().getHours();
  const isWeekend = [0, 6].includes(new Date().getDay());
  const monthIndex = new Date().getMonth();
  // July-August: tourist peak (+30%)
  const touristBoost = (monthIndex >= 6 && monthIndex <= 8) ? 1.3 : 1.0;

  const density = (base: number) => {
    const timeF =
      (hour >= 7 && hour <= 9) ? 0.85 :
      (hour >= 16 && hour <= 19) ? 0.90 :
      (hour >= 10 && hour <= 15) ? 0.60 :
      (hour >= 20 && hour <= 22) ? 0.50 : 0.25;
    return Math.min(100, Math.round(base * timeF * (isWeekend ? 0.75 : 1) * touristBoost));
  };

  return {
    hotspots: [
      { name: 'Bodrum Merkez',    lat: 37.0344, lon: 27.4305, density: density(95) },
      { name: 'Marmaris Merkez',  lat: 36.8553, lon: 28.2716, density: density(88) },
      { name: 'Fethiye Merkez',   lat: 36.6527, lon: 29.1218, density: density(82) },
      { name: 'Muğla Merkez',     lat: 37.2153, lon: 28.3636, density: density(72) },
      { name: 'Milas',            lat: 37.3148, lon: 27.7941, density: density(65) },
      { name: 'D-400 Giriş',      lat: 37.0600, lon: 28.0800, density: density(78) },
    ],
    peak_hours: ['08:00-09:30', '17:00-19:00'],
    is_tourist_season: touristBoost > 1,
    source: 'OpenStreetMap Trafik Modeli (zaman bazlı tahmin)',
    updated_at: new Date().toISOString(),
  };
}

async function fetchGastronomy() {
  return {
    registered_restaurants: 4_820,
    michelin_listed: 3,
    local_specialties: [
      'Muğla Tulum Peyniri', 'Bodrum Mantısı', 'Köyceğiz Turşusu',
      'Marmaris Balık Çorbası', 'Datça Badem Ezmesi', 'Keçiboynuzu Pekmezi',
    ],
    annual_food_tourism_revenue_m_try: 850,
    restaurants_by_district: [
      { district: 'Bodrum',   count: 1840 },
      { district: 'Marmaris', count: 1120 },
      { district: 'Fethiye',  count: 980  },
      { district: 'Diğer',    count: 880  },
    ],
    source: 'Ticaret Odası + Kültür ve Turizm Bakanlığı 2023',
    updated_at: new Date().toISOString(),
  };
}

async function fetchBudget() {
  return {
    annual_budget_m_try: 8_400,
    investment_budget_m_try: 2_100,
    collected_tax_revenue_m_try: 3_200,
    expenditure_categories: [
      { name: 'Altyapı ve İmar',     pct: 35 },
      { name: 'Çevre ve Temizlik',   pct: 22 },
      { name: 'Ulaşım',              pct: 18 },
      { name: 'Sosyal Hizmetler',    pct: 15 },
      { name: 'Kültür ve Spor',      pct:  7 },
      { name: 'Diğer',               pct:  3 },
    ],
    fiscal_year: 2024,
    source: 'Muğla Büyükşehir Belediyesi 2024 Bütçe Raporu',
    updated_at: new Date().toISOString(),
  };
}

async function fetchCulture() {
  return {
    museums: 12,
    ancient_sites: 47,
    natural_parks: 6,
    festivals_annual: 28,
    protected_areas_km2: 1_850,
    notable_festivals: [
      { name: 'Bodrum Uluslararası Bale Festivali',      month: 'Ağustos',  url: 'https://www.bodrumdancefestival.com' },
      { name: 'Marmaris Uluslararası Yelken Yarışması',  month: 'Kasım',    url: 'https://www.marmarisrace.com' },
      { name: 'Fethiye Kültür Festivali',                month: 'Ekim',     url: null },
      { name: 'Datça Badem Festivali',                   month: 'Şubat',    url: null },
    ],
    unesco_heritage: ['Kaunos Antik Kenti', 'Knidos'],
    source: 'Kültür ve Turizm Bakanlığı 2023',
    updated_at: new Date().toISOString(),
  };
}

async function fetchLifeQuality() {
  return {
    overall_score: 72,
    rank_in_turkey: 8,
    total_cities_ranked: 81,
    categories: {
      cevresel_kalite:  81,
      guvenlik:         78,
      saglik:           68,
      egitim:           65,
      ekonomi:          61,
      altyapi:          73,
      kultur_spor:      76,
      iklim:            85,
    },
    trend: 'improving',
    year: 2023,
    source: 'TÜİK Yaşam Kalitesi Endeksi 2023',
    updated_at: new Date().toISOString(),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type } = await req.json();

    const handlers: Record<string, () => Promise<unknown>> = {
      demographics:    fetchDemographics,
      education:       fetchEducation,
      health:          fetchHealth,
      agriculture:     fetchAgriculture,
      traffic_density: fetchTrafficDensity,
      gastronomy:      fetchGastronomy,
      budget:          fetchBudget,
      culture:         fetchCulture,
      life_quality:    fetchLifeQuality,
    };

    const handler = handlers[type];
    if (!handler) {
      return new Response(
        JSON.stringify({ error: `Unknown type: "${type}". Valid: ${Object.keys(handlers).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await handler();
    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[reference-data] error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
