import { IntelligenceItem } from "./osint-data-manager";
import { sentimentAnalyzer } from "./sentiment-analyzer";

export interface RawDataItem {
  date: string;
  title: string;
  source: string;
  content?: string;
  link?: string;
  location?: string;
  category?: "news" | "social" | "alert" | "threat" | "opportunity";
  tags?: string[];
}

export interface GASResponse {
  status: "success" | "error";
  data?: RawDataItem[];
  error?: string;
  timestamp?: number;
  cacheAge?: number;
}

class GoogleAppsScriptBridge {
  private gasUrl: string =
    import.meta.env.VITE_GAS_URL ||
    "https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercopy";
  private cacheKey = "gas_bridge_cache";
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private lastFetchTime = 0;
  private isConnected = false;

  constructor() {
    this.checkConnection();
  }

  private checkConnection() {
    const cached = this.getCache();
    this.isConnected = cached !== null;
  }

  async fetchFromGAS(): Promise<{
    success: boolean;
    items?: IntelligenceItem[];
    error?: string;
    fromCache?: boolean;
  }> {
    try {
      const cached = this.getCache();
      const now = Date.now();

      if (
        cached &&
        now - cached.timestamp < this.cacheExpiry &&
        this.lastFetchTime > 0
      ) {
        return {
          success: true,
          items: cached.items,
          fromCache: true,
        };
      }

      const response = await this.fetchWithTimeout(this.gasUrl, 10000);

      if (!response.ok) {
        throw new Error(`GAS returned status ${response.status}`);
      }

      const data: GASResponse = await response.json();

      if (data.status === "error") {
        throw new Error(data.error || "GAS returned error");
      }

      const items = this.transformRawData(data.data || []);
      this.setCache(items, now);
      this.lastFetchTime = now;
      this.isConnected = true;

      return { success: true, items };
    } catch (error) {
      console.error("GAS fetch error:", error);

      const cached = this.getCache();
      if (cached) {
        return {
          success: false,
          items: cached.items,
          error: `GAS unavailable. Showing cached data from ${new Date(cached.timestamp).toLocaleTimeString("tr-TR")}`,
          fromCache: true,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private fetchWithTimeout(
    url: string,
    timeout: number
  ): Promise<Response> {
    return Promise.race([
      fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        mode: "no-cors",
      }),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), timeout)
      ),
    ]);
  }

  private transformRawData(rawData: RawDataItem[]): IntelligenceItem[] {
    return rawData
      .map((item) => {
        const sentimentAnalysis = sentimentAnalyzer.analyzeSentiment(
          item.title + " " + (item.content || "")
        );
        const crisisIndicators = sentimentAnalyzer.detectCrisisIndicators(
          item.title + " " + (item.content || "")
        );

        let importance: "critical" | "high" | "medium" | "low";
        if (crisisIndicators.length > 0 || sentimentAnalysis.sentiment === "critical") {
          importance = "critical";
        } else if (sentimentAnalysis.sentiment === "negative") {
          importance = "high";
        } else if (sentimentAnalysis.sentiment === "neutral") {
          importance = "medium";
        } else {
          importance = "low";
        }

        return {
          id: `${item.source}_${Date.parse(item.date)}_${item.title.substring(0, 10).hashCode()}`,
          title: item.title,
          source: item.source,
          category: item.category || "news",
          sentiment: sentimentAnalysis.sentiment,
          importance,
          date: new Date(item.date).getTime(),
          content: item.content,
          link: item.link,
          location: item.location,
          tags: item.tags || [],
          confidence: sentimentAnalysis.confidence,
        };
      })
      .filter((item) => !isNaN(item.date));
  }

  private setCache(items: IntelligenceItem[], timestamp: number) {
    try {
      const cache = { items, timestamp };
      localStorage.setItem(
        this.cacheKey,
        JSON.stringify(cache)
      );
    } catch (error) {
      console.error("Cache storage error:", error);
    }
  }

  private getCache(): { items: IntelligenceItem[]; timestamp: number } | null {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error("Cache retrieval error:", error);
    }
    return null;
  }

  generateSampleData(): RawDataItem[] {
    const locations = [
      "Bodrum",
      "Marmaris",
      "Datça",
      "Fethiye",
      "Muğla Merkez",
      "Milas",
      "Menteşe",
      "Ortaca",
      "Seydikemer",
      "Ölüdeniz",
    ];

    const categories = ["security", "environment", "economy", "weather", "health"];
    const sources = ["Google Alerts", "Twitter", "Haber Siteleri", "RSS", "Sosyal Medya"];

    const sampleTitles = {
      security: [
        "Bodrum'da güvenlik tatbikatı yapılacak",
        "Trafik kazası: 3 yaralı",
        "Kaçak işletme kapatıldı",
      ],
      environment: [
        "Muğla'da orman yangını uyarısı",
        "Baraj suyu seviyesi düştü",
        "Deniz kirliliği raporu",
      ],
      economy: [
        "Turizm sektörü toplanıyor",
        "İşsizlik oranı açıklandı",
        "Dış ticaret verileri",
      ],
      weather: [
        "Meteoroloji uyarısı: Fırtına bekleniyor",
        "Sıcak hava uyarısı",
        "Yağış tahminleri",
      ],
      health: [
        "Sağlık merkezinde tarama yapılacak",
        "Hastalık uyarısı",
        "Aşı kampanyası başlıyor",
      ],
    };

    const now = Date.now();
    const data: RawDataItem[] = [];

    for (let i = 0; i < 8; i++) {
      const category = categories[i % categories.length] as keyof typeof sampleTitles;
      const location = locations[Math.floor(Math.random() * locations.length)];
      const titles = sampleTitles[category];

      data.push({
        date: new Date(now - i * 3600000).toISOString(),
        title: `${location} - ${titles[Math.floor(Math.random() * titles.length)]}`,
        source: sources[Math.floor(Math.random() * sources.length)],
        content: `${location} bölgesinde ${category} kategorisinde güncellemeler tespit edildi. Detaylar için takip ediniz.`,
        location,
        category: category as "news" | "social" | "alert" | "threat" | "opportunity",
        tags: [category, location.toLowerCase(), "muğla"],
        link: `https://example.com/news/${i}`,
      });
    }

    return data;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      lastFetchTime: this.lastFetchTime,
      gasUrl: this.gasUrl.substring(0, 50) + "...",
    };
  }

  setGasUrl(url: string) {
    this.gasUrl = url;
  }

  clearCache() {
    localStorage.removeItem(this.cacheKey);
    this.lastFetchTime = 0;
  }
}

export const googleAppsScriptBridge = new GoogleAppsScriptBridge();

// String.prototype.hashCode polyfill
if (!String.prototype.hashCode) {
  String.prototype.hashCode = function (): number {
    let hash = 0;
    for (let i = 0; i < this.length; i++) {
      const char = this.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };
}

declare global {
  interface String {
    hashCode(): number;
  }
}
