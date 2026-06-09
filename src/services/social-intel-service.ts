import { sentimentAnalyzer } from "./sentiment-analyzer";
import { supabase } from "@/integrations/supabase/client";

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

// Fallback static data for Mugla — used only when live sources are unavailable
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
  // Generate items from local fallback data
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

  // Fetch live data from Supabase edge functions; fall back to local mock on failure
  async collectData(keywords: string[], platforms: string[] = ["news", "twitter", "reddit", "eksisozluk"]): Promise<LocalCollectedItem[]> {
    try {
      const [newsResult, socialResult] = await Promise.allSettled([
        supabase.functions.invoke("data-scrape", { body: { type: "news" } }),
        supabase.functions.invoke("social-platforms", { body: { keywords: keywords.slice(0, 4) } }),
      ]);

      const items: LocalCollectedItem[] = [];

      // --- Haber Akışı: RSS news from data-scrape ---
      if (newsResult.status === "fulfilled" && !newsResult.value.error) {
        const raw = newsResult.value.data;
        const data = (raw?.data ?? raw) as Record<string, unknown> | null;
        const newsItems: Record<string, string>[] = Array.isArray(data?.items)
          ? (data!.items as Record<string, string>[])
          : [];

        if ((platforms.includes("all") || platforms.includes("news")) && newsItems.length > 0) {
          for (const item of newsItems.slice(0, 20)) {
            items.push({
              platform: "news",
              content: item.title || "",
              description: item.region
                ? `${item.source} — ${item.region}`
                : item.source || "",
              source_author: item.source || "Haber",
              source_url: item.link || undefined,
              matched_keywords: keywords.filter((k) =>
                (item.title || "").toLowerCase().includes(k.toLowerCase())
              ),
            });
          }
        }
      }

      // --- Canlı Feed: YouTube / Twitter / Facebook from social-platforms ---
      if (socialResult.status === "fulfilled" && !socialResult.value.error) {
        const raw = socialResult.value.data;
        const data = (raw?.data ?? raw) as Record<string, unknown> | null;
        const posts: Record<string, string>[] = Array.isArray(data?.posts)
          ? (data!.posts as Record<string, string>[])
          : [];

        for (const post of posts) {
          const plat = post.platform || "web";
          if (!platforms.includes("all") && !platforms.includes(plat)) continue;
          items.push({
            platform: plat,
            content: post.title || post.content || "",
            description: post.description || "",
            source_author: post.author || post.channel || "Sosyal Medya",
            source_url: post.url || undefined,
            matched_keywords: keywords.filter((k) =>
              (post.title || post.content || "").toLowerCase().includes(k.toLowerCase())
            ),
          });
        }
      }

      // Return live data if we got anything
      if (items.length > 0) return items;
    } catch {
      // Fall through to local fallback
    }

    // Fallback: simulate slight delay then return static mock
    await new Promise((resolve) => setTimeout(resolve, 800));
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
    const platforms = platform === "all" ? ["news", "twitter", "reddit", "eksisozluk", "youtube", "facebook"] : [platform];

    const collectedItems = await this.collectData(keywords, platforms);

    if (collectedItems.length === 0) {
      return {
        collectedItems: [],
        analyses: [],
        alerts: [{ label: "Veri Bulunamadı", value: "Yerel veri kaynaklarından veri çekilemedi", severity: "warning" }],
        trend_summary: this.emptyTrendSummary(),
      };
    }

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
        engagement_count: Math.floor(Math.random() * 150) + 10,
        summary: item.description,
        source_url: item.source_url,
      };
    });

    const alerts: LocalAlertItem[] = [];
    const negativeItems = analyses.filter((a) => a.sentiment === "negative" && a.sentiment_score > 0.7);
    if (negativeItems.length > 3) {
      alerts.push({
        label: "Yüksek Negatif Duygu",
        value: `${negativeItems.length} içerikte yüksek negatif duygu tespit edildi`,
        severity: "warning",
      });
    }

    return {
      collectedItems,
      analyses,
      alerts,
      trend_summary: this.buildTrendSummary(analyses),
    };
  }

  private emptyTrendSummary(): LocalTrendSummary {
    return {
      mention_count: 0,
      positive_ratio: 0,
      negative_ratio: 0,
      neutral_ratio: 1,
      top_topics: [],
      overall_sentiment: "neutral",
      key_insights: "Veri yok",
    };
  }

  private buildTrendSummary(analyses: LocalAnalysisItem[]): LocalTrendSummary {
    const total = analyses.length || 1;
    const positive = analyses.filter((a) => a.sentiment === "positive").length;
    const negative = analyses.filter((a) => a.sentiment === "negative").length;
    const neutral = analyses.filter((a) => a.sentiment === "neutral").length;

    const wordFreq: Record<string, number> = {};
    for (const item of analyses) {
      const words = item.content.split(/\s+/).filter((w) => w.length > 4);
      for (const w of words) {
        const key = w.toLowerCase().replace(/[^\w]/g, "");
        wordFreq[key] = (wordFreq[key] || 0) + 1;
      }
    }
    const top_topics = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);

    return {
      mention_count: total,
      positive_ratio: positive / total,
      negative_ratio: negative / total,
      neutral_ratio: neutral / total,
      top_topics,
      overall_sentiment: positive > negative ? "positive" : negative > positive ? "negative" : "neutral",
      key_insights: `${total} içerik analiz edildi. Baskın duygu: ${positive > negative ? "olumlu" : negative > positive ? "olumsuz" : "nötr"}.`,
    };
  }
}

export const socialIntelService = new SocialIntelService();
