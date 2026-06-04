import { sentimentAnalyzer } from "./sentiment-analyzer";

export interface SocialPost {
  id: string;
  platform: string;
  content: string;
  author: string;
  url: string;
  published_at: string;
  keywords_matched: string[];
  sentiment: string | null;
  sentiment_confidence: number | null;
  sentiment_method: string | null;
  collected_at: string;
}

export interface CollectionResult {
  posts: SocialPost[];
  total: number;
  platforms_queried: string[];
  keywords_used: string[];
  collected_at: string;
}

export interface SentimentSummary {
  total: number;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  positive_ratio: number;
  negative_ratio: number;
  neutral_ratio: number;
  avg_confidence: number;
  overall_sentiment: string;
  method: string;
}

export interface AnalysisResult {
  results: Array<{
    text: string;
    sentiment: string;
    confidence: number;
    method: string;
  }>;
  summary: SentimentSummary;
  analyzed_at: string;
}

export interface LocalAnalysisItem {
  platform: string;
  content: string;
  sentiment: string;
  sentiment_score: number;
  source_author: string;
  engagement_count: number;
  summary?: string;
  source_url?: string;
}

export interface LocalAlertItem {
  label: string;
  value: string;
  severity: string;
}

export interface LocalTrendSummary {
  mention_count: number;
  positive_ratio: number;
  negative_ratio: number;
  neutral_ratio: number;
  top_topics: string[];
  overall_sentiment: string;
  key_insights: string;
}

export interface LocalCollectedItem {
  platform: string;
  content: string;
  description?: string;
  source_author: string;
  source_url?: string;
  matched_keywords?: string[];
}

// Local mock data for Mugla
const MUGLA_LOCAL_DATA: { platform: string; content: string; author: string }[] = [
  { platform: "news", content: "Muğla Büyükşehir Belediyesi yeni ulaşım projesini açıkladı", author: "Muğla Haber" },
  { platform: "news", content: "Bodrum'da turizm sezonu rekor kırıyor — otel doluluk %95 üstü", author: "Bodrum Gazetesi" },
  { platform: "news", content: "Fethiye'de belediye meclisi bütçe görüşmelerini tamamladı", author: "Fethiye Haber" },
  { platform: "news", content: "Marmaris'te orman yangınına karşı yeni önlemler alınıyor", author: "Marmaris Postası" },
  { platform: "news", content: "Datça'da alternatif turizm rotaları belirlendi", author: "Datça Haber" },
  { platform: "news", content: "Milas'tan yeni tarım destek paketi müjdesi", author: "Milas Gazete" },
  { platform: "news", content: "Dalaman Havalimanı yoğun sezon hazırlığını tamamladı", author: "Sahil Haber" },
  { platform: "news", content: "Köyceğiz Gölü'nde su seviyesi düştü — çevre uzmanları uyarıyor", author: "Çevre Haber" },
  { platform: "twitter", content: "RT: Muğla Valiliği yangın riskine karşı uyarıda bulundu", author: "@MuglaValilik" },
  { platform: "twitter", content: "Bodrum Beach Club sezonu açtı! Canlı müzik ve dj performansları", author: "@BodrumEvents" },
  { platform: "twitter", content: "Fethiye Ölüdeniz'de yamaç paraşütü sezonu başladı", author: "@FethiyeTur" },
  { platform: "twitter", content: "Marmaris Marina yeni yat sezonunu karşılıyor", author: "@MarmarisMarina" },
  { platform: "reddit", content: "Muğla'da yaşayanlara: Hangi ilçe en iyi yaşam kalitesine sahip? Tartışma", author: "r/mugla" },
  { platform: "reddit", content: "Bodrum vs Marmaris karşılaştırması — turizm ve yaşam maliyeti", author: "r/Turkturizm" },
  { platform: "eksisozluk", content: "Muğla'nın en güzel köyleri ve doğal alanları hakkında düşünceler", author: "eksi_user_1" },
  { platform: "eksisozluk", content: "Fethiye'de emlak piyasası son durum — fiyatlar artıyor mu?", author: "eksi_user_2" },
  { platform: "news", content: "Muğla'da sağlıklı yaşam merkezi açıldı", author: "Sağlık Haberleri" },
  { platform: "news", content: "Yatağan Termik Santrali çevre raporu tartışılıyor", author: "Enerji Gündem" },
  { platform: "twitter", content: "Muğla'da deprem riski tartışılıyor — bilim insanlarından açıklama", author: "@DepremTR" },
  { platform: "news", content: "Seydikemer'de tarım kooperatifi yeni pazar anlaşması imzaladı", author: "Tarım Gazetesi" },
];

class SocialIntelService {
  // Local-only data generation — no Supabase Edge Function calls
  generateLocalItems(keywords: string[], platforms: string[] = ["news", "twitter", "reddit", "eksisozluk"]): LocalCollectedItem[] {
    const filtered = MUGLA_LOCAL_DATA.filter((item) => {
      const matchesPlatform = platforms.includes("all") || platforms.includes(item.platform);
      const matchesKeyword =
        keywords.length === 0 ||
        keywords.some(
          (kw) =>
            item.content.toLowerCase().includes(kw.toLowerCase()) ||
            item.author.toLowerCase().includes(kw.toLowerCase())
        );
      return matchesPlatform && (matchesKeyword || Math.random() > 0.5);
    });

    return filtered.map((item, i) => ({
      platform: item.platform,
      content: item.content,
      description: `${item.platform.toUpperCase()} — ${item.author}`,
      source_author: item.author,
      source_url: `https://example.com/${item.platform}/${i}`,
      matched_keywords: keywords.filter((kw) => item.content.toLowerCase().includes(kw.toLowerCase())),
    }));
  }

  async collectData(keywords: string[], platforms: string[] = ["news", "twitter", "reddit", "eksisozluk"]): Promise<LocalCollectedItem[]> {
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return this.generateLocalItems(keywords, platforms);
  }

  async analyzeSentiment(texts: string[]): Promise<AnalysisResult> {
    const results = texts.map((text) => {
      const analysis = sentimentAnalyzer.analyzeSentiment(text);
      return {
        text,
        sentiment: analysis.sentiment === "critical" ? "negative" : analysis.sentiment,
        confidence: analysis.confidence,
        method: "keyword_client_side",
      };
    });

    const total = results.length || 1;
    const positiveCount = results.filter((r) => r.sentiment === "positive").length;
    const negativeCount = results.filter((r) => r.sentiment === "negative").length;
    const neutralCount = results.filter((r) => r.sentiment === "neutral").length;

    return {
      results,
      summary: {
        total: results.length,
        positive_count: positiveCount,
        negative_count: negativeCount,
        neutral_count: neutralCount,
        positive_ratio: positiveCount / total,
        negative_ratio: negativeCount / total,
        neutral_ratio: neutralCount / total,
        avg_confidence: results.reduce((sum, r) => sum + r.confidence, 0) / total,
        overall_sentiment: positiveCount > negativeCount ? "positive" : negativeCount > positiveCount ? "negative" : "neutral",
        method: "keyword_client_side",
      },
      analyzed_at: new Date().toISOString(),
    };
  }

  async collectAndAnalyze(
    keywords: string[],
    platform: string = "all"
  ): Promise<{
    collectedItems: LocalCollectedItem[];
    analyses: LocalAnalysisItem[];
    alerts: LocalAlertItem[];
    trend_summary: LocalTrendSummary;
  }> {
    const platforms = platform === "all" ? ["news", "twitter", "reddit", "eksisozluk"] : [platform];

    // Collect locally
    const collectedItems = await this.collectData(keywords, platforms);

    if (collectedItems.length === 0) {
      return {
        collectedItems: [],
        analyses: [],
        alerts: [{ label: "Veri Bulunamadı", value: "Yerel veri kaynaklarından veri çekilemedi", severity: "warning" }],
        trend_summary: this.emptyTrendSummary(),
      };
    }

    // Analyze sentiment locally
    const texts = collectedItems.map((item) => item.content);
    const analysisResult = await this.analyzeSentiment(texts);

    const analyses: LocalAnalysisItem[] = collectedItems.map((item, i) => {
      const sentimentResult = analysisResult.results[i];
      return {
        platform: item.platform,
        content: item.content,
        sentiment: sentimentResult?.sentiment || "neutral",
        sentiment_score: sentimentResult?.confidence || 0.5,
        source_author: item.source_author,
        engagement_count: Math.floor(Math.random() * 500),
        summary: this.generateItemSummary(sentimentResult?.sentiment || "neutral"),
        source_url: item.source_url,
      };
    });

    const alerts = this.generateAlerts(analyses, analysisResult.summary);
    const trend_summary = this.buildTrendSummary(analyses, analysisResult.summary, keywords);

    return { collectedItems, analyses, alerts, trend_summary };
  }

  private generateItemSummary(sentiment: string): string {
    switch (sentiment) {
      case "positive":
        return "Olumlu gelişme tespit edildi";
      case "negative":
        return "Olumsuz içerik, dikkat gerekli";
      default:
        return "Bilgi niteliğinde içerik";
    }
  }

  private generateAlerts(analyses: LocalAnalysisItem[], summary?: SentimentSummary): LocalAlertItem[] {
    const alerts: LocalAlertItem[] = [];

    if (summary) {
      if (summary.negative_ratio > 0.5) {
        alerts.push({
          label: "Yüksek Negatif Duygu",
          value: `%${Math.round(summary.negative_ratio * 100)}`,
          severity: "warning",
        });
      }
    }

    const criticalKeywords = ["yangın", "deprem", "sel", "kaza", "ölüm", "terör"];
    const hasCritical = analyses.some((a) =>
      criticalKeywords.some((kw) => a.content.toLowerCase().includes(kw))
    );
    if (hasCritical) {
      alerts.push({
        label: "Kritik İçerik Tespit Edildi",
        value: "Acil dikkat gerekebilir",
        severity: "critical",
      });
    }

    return alerts;
  }

  private buildTrendSummary(
    analyses: LocalAnalysisItem[],
    summary: SentimentSummary | null | undefined,
    keywords: string[]
  ): LocalTrendSummary {
    const total = analyses.length || 1;
    const positiveRatio = summary?.positive_ratio || analyses.filter((a) => a.sentiment === "positive").length / total;
    const negativeRatio = summary?.negative_ratio || analyses.filter((a) => a.sentiment === "negative").length / total;
    const neutralRatio = summary?.neutral_ratio || analyses.filter((a) => a.sentiment === "neutral").length / total;
    const overallSentiment = summary?.overall_sentiment || "neutral";

    const topTopics = this.extractTopics(analyses, keywords);

    return {
      mention_count: analyses.length,
      positive_ratio: positiveRatio,
      negative_ratio: negativeRatio,
      neutral_ratio: neutralRatio,
      top_topics: topTopics,
      overall_sentiment: overallSentiment,
      key_insights: this.generateInsights(analyses.length, overallSentiment, topTopics),
    };
  }

  private extractTopics(analyses: LocalAnalysisItem[], keywords: string[]): string[] {
    const freq: Record<string, number> = {};
    for (const a of analyses) {
      for (const kw of keywords) {
        if (a.content.toLowerCase().includes(kw.toLowerCase())) {
          freq[kw] = (freq[kw] || 0) + 1;
        }
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kw]) => kw);
  }

  private generateInsights(total: number, sentiment: string, topics: string[]): string {
    let insight = `${total} adet yerel içerik analiz edildi (client-side keyword analizi). `;
    if (sentiment === "positive") {
      insight += "Genel duygu OLUMLU. Bölgede pozitif gelişmeler ön planda. ";
    } else if (sentiment === "negative") {
      insight += "Genel duygu OLUMSUZ. Dikkat gerektiren konular mevcut. ";
    } else {
      insight += "Genel duygu NÖTR. Dengeli bir haber dağılımı var. ";
    }
    if (topics.length > 0) {
      insight += `Öne çıkan konular: ${topics.join(", ")}.`;
    }
    return insight;
  }

  private emptyTrendSummary(): LocalTrendSummary {
    return {
      mention_count: 0,
      positive_ratio: 0,
      negative_ratio: 0,
      neutral_ratio: 0,
      top_topics: [],
      overall_sentiment: "neutral",
      key_insights: "Henüz veri toplanmadı.",
    };
  }

  async getRecentPosts(limit: number = 50): Promise<SocialPost[]> {
    // Return from local mock data
    return MUGLA_LOCAL_DATA.slice(0, limit).map((item, i) => ({
      id: `local_${i}`,
      platform: item.platform,
      content: item.content,
      author: item.author,
      url: `https://example.com/${item.platform}/${i}`,
      published_at: new Date(Date.now() - i * 600000).toISOString(),
      keywords_matched: [],
      sentiment: null,
      sentiment_confidence: null,
      sentiment_method: null,
      collected_at: new Date().toISOString(),
    }));
  }

  getConnectionStatus() {
    return {
      isConnected: true,
      source: "Yerel Veri İşleme (Local Logic)",
      lastUpdate: new Date().toLocaleTimeString("tr-TR"),
      dataSource: "Muğla Yerel Veri Tabanı + Client-Side Analiz",
    };
  }

  async getTrendData() {
    return [];
  }

  async getSourceReliability() {
    return [];
  }

  async triggerCronCollection() {
    return { success: true, collected: 0, analyzed: 0 };
  }

  async collectPlatformData(keywords: string[]): Promise<LocalCollectedItem[]> {
    return this.generateLocalItems(keywords, ["twitter", "youtube"]);
  }
}

export const socialIntelService = new SocialIntelService();
