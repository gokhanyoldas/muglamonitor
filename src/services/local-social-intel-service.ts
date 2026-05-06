import { sentimentAnalyzer } from "./sentiment-analyzer";

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

class LocalSocialIntelService {
  private muglaNewsSources = [
    {
      platform: "news",
      sources: [
        "Muğla'da yangın söndürme çalışması başladı",
        "Bodrum turizminde yoğun sezon beklentisi",
        "Fethiye'de belediye bütçesi onaylandı",
        "Marmaris limanı yenileme projesi devam ediyor",
        "Muğla Üniversitesi yeni laboratu açtı",
        "Milas'ta tarım danışmanlık merkezi kuruluyor",
        "Menteşe'de kültür festivali başlıyor",
        "Ortaca su barajı doluluk oranı %75'e ulaştı",
        "Seydikemer çiftçileri organik ürün üretimine geçiyor",
        "Datça turizm bölgesi altyapı yatırımlarına başladı",
      ],
    },
    {
      platform: "twitter",
      sources: [
        "@MuglaValilik: Muğla'da güvenlik tatbikatı gerçekleştirildi",
        "@BodGovt: Turizm mevsimi rekorları kıracak",
        "@FethiyeBld: Cumhuriyet Meydanı düzenlemesi tamamlandı",
        "@MarmarisTur: Yeni dönem turizm kampanyası başladı",
        "@MuglaHaber: Orman yangınlarına karşı havadan drone desteği",
        "@MilasKultur: Geleneksel duru oyunu festivali düzenleniyor",
        "@YerelHaber: Belediye hizmetleri kalitesi artıyor",
        "@EkonomiMugla: İşletme sayısında %20 artış",
        "@CiftciMugla: Tarım ürünleri fiyatları düştü",
        "@TurizmdeMugla: Ağustos ayında rekor turist beklentisi",
      ],
    },
    {
      platform: "web",
      sources: [
        "Muğla yerel haberleri - Ekonomi ve turizm sektörü",
        "Bodrum turizmcilik raporu 2024",
        "Fethiye belediye haberleri ve duyurular",
        "Marmaris liman modernizasyon projesi",
        "Muğla ticaret ve endüstri odası bülteni",
        "Milas çiftçilerin işbirlikleri anlaşması",
        "Menteşe kültür ve turizm rehberi",
        "Ortaca tarım araştırma merkezi yayınları",
        "Seydikemer gıda sektörü gelişmeler",
        "Datça denizcilik ve balıkçılık forum",
      ],
    },
  ];

  generateMockCollectedItems(keywords: string[], platform: string): LocalCollectedItem[] {
    const items: LocalCollectedItem[] = [];
    const platforms = platform === "all" ? ["news", "twitter", "web"] : [platform];

    platforms.forEach((p) => {
      const sources =
        this.muglaNewsSources.find((s) => s.platform === p)?.sources || [];

      sources.forEach((content) => {
        const matchedKeywords = keywords.filter((kw) =>
          content.toLowerCase().includes(kw.toLowerCase())
        );

        if (matchedKeywords.length > 0 || Math.random() > 0.4) {
          items.push({
            platform: p,
            content,
            description: `${p.toUpperCase()} platformundan alınan yerel haber`,
            source_author:
              p === "twitter"
                ? "@MuglaHaber"
                : p === "news"
                  ? "Muğla Haberleri"
                  : "Yerel Web Kaynakları",
            source_url: `https://example.com/${p}/${Math.random().toString(36).substring(7)}`,
            matched_keywords: matchedKeywords.length > 0 ? matchedKeywords : keywords.slice(0, 2),
          });
        }
      });
    });

    return items.slice(0, 20);
  }

  analyzeCollectedItems(
    items: LocalCollectedItem[]
  ): {
    analyses: LocalAnalysisItem[];
    alerts: LocalAlertItem[];
    trend_summary: LocalTrendSummary;
  } {
    const analyses: LocalAnalysisItem[] = items.map((item) => {
      const sentimentResult = sentimentAnalyzer.analyzeSentiment(item.content);
      const crisisIndicators = sentimentAnalyzer.detectCrisisIndicators(
        item.content
      );

      let finalSentiment = sentimentResult.sentiment;
      if (crisisIndicators.length > 0) {
        finalSentiment = "critical";
      }

      return {
        platform: item.platform,
        content: item.content,
        sentiment:
          finalSentiment === "critical"
            ? "negative"
            : finalSentiment === "positive"
              ? "positive"
              : "neutral",
        sentiment_score: sentimentResult.score,
        source_author: item.source_author,
        engagement_count: Math.floor(Math.random() * 1000) + 50,
        summary:
          finalSentiment === "critical"
            ? "Kritik durum tespit edildi, acil dikkat gerekli"
            : finalSentiment === "positive"
              ? "Olumlu gelişme, takip öneriliyor"
              : "Bilgi niteliğinde içerik",
        source_url: item.source_url,
      };
    });

    const positiveCount = analyses.filter((a) => a.sentiment === "positive")
      .length;
    const negativeCount = analyses.filter((a) => a.sentiment === "negative")
      .length;
    const neutralCount = analyses.filter((a) => a.sentiment === "neutral")
      .length;
    const total = analyses.length || 1;

    const positiveRatio = positiveCount / total;
    const negativeRatio = negativeCount / total;
    const neutralRatio = neutralCount / total;

    const overallSentiment =
      positiveRatio > 0.4
        ? "positive"
        : negativeRatio > 0.4
          ? "negative"
          : "neutral";

    const alerts: LocalAlertItem[] = [];

    if (negativeRatio > 0.5) {
      alerts.push({
        label: "Yüksek Negatif Duygu",
        value: `${Math.round(negativeRatio * 100)}%`,
        severity: "warning",
      });
    }

    if (analyses.some((a) => a.sentiment === "negative" && a.engagement_count > 500)) {
      alerts.push({
        label: "Yüksek Etkileşimli Olumsuz İçerik",
        value: "Dikkat gerekli",
        severity: "critical",
      });
    }

    const topKeywords = this.extractTopKeywords(analyses);

    const trend_summary: LocalTrendSummary = {
      mention_count: analyses.length,
      positive_ratio: positiveRatio,
      negative_ratio: negativeRatio,
      neutral_ratio: neutralRatio,
      top_topics: topKeywords,
      overall_sentiment: overallSentiment,
      key_insights: this.generateInsights(
        analyses,
        overallSentiment,
        topKeywords
      ),
    };

    return { analyses, alerts, trend_summary };
  }

  private extractTopKeywords(analyses: LocalAnalysisItem[]): string[] {
    const keywords: Record<string, number> = {};

    const locations = ["Muğla", "Bodrum", "Fethiye", "Marmaris", "Milas"];
    const categories = ["turizm", "ekonomi", "yangın", "tarım", "belediye", "kültür"];

    analyses.forEach((a) => {
      [...locations, ...categories].forEach((kw) => {
        if (a.content.toLowerCase().includes(kw.toLowerCase())) {
          keywords[kw] = (keywords[kw] || 0) + 1;
        }
      });
    });

    return Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kw]) => kw);
  }

  private generateInsights(
    analyses: LocalAnalysisItem[],
    sentiment: string,
    topics: string[]
  ): string {
    const total = analyses.length;
    const positiveCount = analyses.filter((a) => a.sentiment === "positive")
      .length;
    const negativeCount = analyses.filter((a) => a.sentiment === "negative")
      .length;

    let insight = `Muğla bölgesine ait ${total} adet içerik analiz edilmiştir. `;

    if (sentiment === "positive") {
      insight += `Genel duygu OLUMLU olarak tespit edilmiştir. Turizm ve ekonomi sektörlerinde olumlu gelişmeler devam ediyor. `;
    } else if (sentiment === "negative") {
      insight += `Genel duygu OLUMSUZ olarak tespit edilmiştir. ${negativeCount} adet olumsuz içerik bulunmaktadır, sorun alanları takip edilmelidir. `;
    } else {
      insight += `Genel duygu NÖTR olarak tespit edilmiştir. Bölgede dengeli bir konuşma ortamı vardır. `;
    }

    if (topics.length > 0) {
      insight += `Başlıca konular: ${topics.join(", ")}. `;
    }

    insight +=
      "Yerel gelişmeleri dikkatle takip etmeyi ve düzenli güncellemeleri kontrol etmeyi öneririz.";

    return insight;
  }

  getConnectionStatus() {
    return {
      isConnected: true,
      source: "Local Data Processing",
      lastUpdate: new Date().toLocaleTimeString("tr-TR"),
      dataSource: "Mock Muğla Local News Database",
    };
  }
}

export const localSocialIntelService = new LocalSocialIntelService();
