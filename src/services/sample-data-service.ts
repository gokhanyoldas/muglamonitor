import { IntelligenceItem } from "./osint-data-manager";
import { sentimentAnalyzer } from "./sentiment-analyzer";

const now = Date.now();

const LOCAL_NEWS_DB: IntelligenceItem[] = [
  {
    id: "sec_1",
    title: "Marmaris'te orman yangını söndürme çalışması başladı",
    source: "Muğla Valilik",
    category: "threat",
    sentiment: "critical",
    importance: "critical",
    date: now - 30000,
    content: "Marmaris İçmeler mevkiinde orman yangını tespit edildi. Hava ve kara müdahale devam ediyor.",
    location: "Marmaris",
    tags: ["yangın", "acil", "marmaris"],
    confidence: 0.97,
  },
  {
    id: "sec_2",
    title: "Bodrum limanında güvenlik tatbikatı yapılacak",
    source: "Sahil Güvenlik",
    category: "alert",
    sentiment: "negative",
    importance: "high",
    date: now - 120000,
    content: "Bodrum Limanı'nda kapsamlı güvenlik tatbikatı planlanmıştır.",
    location: "Bodrum",
    tags: ["güvenlik", "liman", "bodrum"],
    confidence: 0.92,
  },
  {
    id: "sec_3",
    title: "Fethiye'de trafik kazası: 2 yaralı",
    source: "Yerel Medya",
    category: "news",
    sentiment: "negative",
    importance: "high",
    date: now - 180000,
    content: "Fethiye-Ölüdeniz yolunda meydana gelen kazada 2 kişi yaralandı.",
    location: "Fethiye",
    tags: ["trafik", "kaza", "fethiye"],
    confidence: 0.88,
  },
  {
    id: "wea_1",
    title: "Meteoroloji uyarısı: Muğla'da fırtına bekleniyor",
    source: "MGM",
    category: "alert",
    sentiment: "critical",
    importance: "critical",
    date: now - 60000,
    content: "Muğla bölgesinde yarın kuvvetli rüzgar ve fırtına beklenmektedir.",
    location: "Muğla",
    tags: ["hava", "fırtına", "uyarı"],
    confidence: 0.95,
  },
  {
    id: "eco_1",
    title: "Bodrum turizminde rekor sezon beklentisi",
    source: "Turizm Birliği",
    category: "opportunity",
    sentiment: "positive",
    importance: "medium",
    date: now - 240000,
    content: "Bodrum'da turizm sezonu rekor kırmaya hazırlanıyor. Otel doluluk oranları yüksek seviyelerde.",
    location: "Bodrum",
    tags: ["turizm", "ekonomi"],
    confidence: 0.85,
  },
  {
    id: "eco_2",
    title: "Muğla genelinde işsizlik oranı düştü",
    source: "İŞKUR",
    category: "news",
    sentiment: "positive",
    importance: "medium",
    date: now - 300000,
    content: "Muğla il genelinde işsizlik oranı geçen aya göre %2 oranında azaldı.",
    location: "Muğla",
    tags: ["ekonomi", "istihdam"],
    confidence: 0.82,
  },
  {
    id: "hea_1",
    title: "Milas'ta sağlık tarama kampanyası başlıyor",
    source: "Sağlık Bakanlığı",
    category: "news",
    sentiment: "positive",
    importance: "medium",
    date: now - 360000,
    content: "Milas ilçesinde ücretsiz kanser tarama kampanyası başlatılmıştır.",
    location: "Milas",
    tags: ["sağlık", "tarama", "milas"],
    confidence: 0.90,
  },
  {
    id: "sec_4",
    title: "Datça'da kaçak yapı yıkımı devam ediyor",
    source: "Belediye",
    category: "news",
    sentiment: "neutral",
    importance: "low",
    date: now - 420000,
    content: "Datça'da sahil şeridindeki kaçak yapıların yıkımına devam ediliyor.",
    location: "Datça",
    tags: ["yıkım", "datça"],
    confidence: 0.78,
  },
  {
    id: "wea_2",
    title: "Muğla'da sıcak hava dalgası uyarısı",
    source: "MGM",
    category: "alert",
    sentiment: "negative",
    importance: "high",
    date: now - 150000,
    content: "Hafta sonu Muğla'da sıcaklık 45 dereceye kadar yükselecek. Vatandaşlar uyarılmıştır.",
    location: "Muğla",
    tags: ["hava", "sıcak", "uyarı"],
    confidence: 0.93,
  },
  {
    id: "eco_3",
    title: "Ortaca çiftçileri organik üretim projesine katılıyor",
    source: "Tarım Odası",
    category: "opportunity",
    sentiment: "positive",
    importance: "low",
    date: now - 480000,
    content: "Ortaca bölgesinin çiftçileri organik tarım projesi kapsamında eğitim almaya başladı.",
    location: "Ortaca",
    tags: ["tarım", "organik", "ortaca"],
    confidence: 0.80,
  },
];

export function generateMuglaSampleData(): IntelligenceItem[] {
  return LOCAL_NEWS_DB;
}

interface CategoryStat {
  count: number;
  items: IntelligenceItem[];
}

interface CategoryStatsMap {
  security: CategoryStat;
  weather: CategoryStat;
  economy: CategoryStat;
  health: CategoryStat;
}

export function getCategoryStats(items: IntelligenceItem[]): CategoryStatsMap {
  const stats: CategoryStatsMap = {
    security: { count: 0, items: [] },
    weather: { count: 0, items: [] },
    economy: { count: 0, items: [] },
    health: { count: 0, items: [] },
  };

  (items || []).forEach((item) => {
    const text = (item.title + " " + (item.content || "")).toLowerCase();

    const isSecurity =
      text.includes("güvenlik") ||
      text.includes("yangın") ||
      text.includes("kaza") ||
      text.includes("polis") ||
      text.includes("tatbikat") ||
      text.includes("yıkım") ||
      item.tags?.some((t) => ["güvenlik", "yangın", "trafik", "kaza", "acil"].includes(t));

    const isWeather =
      text.includes("hava") ||
      text.includes("fırtına") ||
      text.includes("sıcak") ||
      text.includes("yağış") ||
      item.tags?.some((t) => ["hava", "fırtına", "sıcak", "uyarı"].includes(t));

    const isEconomy =
      text.includes("ekonomi") ||
      text.includes("turizm") ||
      text.includes("tarım") ||
      text.includes("istihdam") ||
      text.includes("işsizlik") ||
      item.tags?.some((t) => ["ekonomi", "turizm", "tarım", "istihdam"].includes(t));

    const isHealth =
      text.includes("sağlık") ||
      text.includes("hastalık") ||
      text.includes("tarama") ||
      text.includes("aşı") ||
      item.tags?.some((t) => ["sağlık", "tarama"].includes(t));

    if (isSecurity) {
      stats.security.count++;
      stats.security.items.push(item);
    }
    if (isWeather) {
      stats.weather.count++;
      stats.weather.items.push(item);
    }
    if (isEconomy) {
      stats.economy.count++;
      stats.economy.items.push(item);
    }
    if (isHealth) {
      stats.health.count++;
      stats.health.items.push(item);
    }
  });

  return stats;
}
