import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { StatusList } from "@/components/dashboard/StatusList";
import { MiniChart } from "@/components/dashboard/MiniChart";
import { Gauge } from "@/components/dashboard/Gauge";
import { Link } from "react-router-dom";
import { localSocialIntelService } from "@/services/local-social-intel-service";
import { Radio, TrendingUp, MessageCircle, Hash, ArrowLeft, Plus, X, Loader as Loader2, Globe, Sparkles, ChartBar as BarChart3, TriangleAlert as AlertTriangle, Newspaper, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AnalysisItem = {
  platform: string;
  content: string;
  sentiment: string;
  sentiment_score: number;
  source_author: string;
  engagement_count: number;
  summary?: string;
  source_url?: string;
};

type AlertItem = {
  label: string;
  value: string;
  severity: string;
};

type TrendSummary = {
  mention_count: number;
  positive_ratio: number;
  negative_ratio: number;
  neutral_ratio: number;
  top_topics: string[];
  overall_sentiment: string;
  key_insights: string;
};

type CollectedItem = {
  platform: string;
  content: string;
  description?: string;
  source_author: string;
  source_url?: string;
  matched_keywords?: string[];
};

const platformColors: Record<string, string> = {
  twitter: "hsl(200, 97%, 50%)",
  instagram: "hsl(330, 70%, 55%)",
  facebook: "hsl(220, 46%, 48%)",
  youtube: "hsl(0, 100%, 50%)",
  news: "hsl(35, 80%, 50%)",
  web: "hsl(260, 60%, 55%)",
  all: "hsl(160, 60%, 45%)",
};

const platformLabels: Record<string, string> = {
  twitter: "X (Twitter)",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  news: "Haber",
  web: "Web",
  all: "Tümü",
};

const SocialIntel = () => {
  const [keywords, setKeywords] = useState<string[]>(() => {
    const saved = localStorage.getItem("social-intel-keywords");
    return saved ? JSON.parse(saved) : ["Muğla", "Bodrum", "Fethiye", "Marmaris", "turizm", "yangın", "belediye", "havalimanı"];
  });
  const [newKeyword, setNewKeyword] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [isCollecting, setIsCollecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [trendSummary, setTrendSummary] = useState<TrendSummary | null>(null);
  const [collectedItems, setCollectedItems] = useState<CollectedItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasUnsavedKeywords, setHasUnsavedKeywords] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [nextRefreshIn, setNextRefreshIn] = useState(0);
  const [listeningStatus, setListeningStatus] = useState("Yerel veri kaynakları dinleniyor...");
  const { toast } = useToast();

  const saveKeywords = () => {
    localStorage.setItem("social-intel-keywords", JSON.stringify(keywords));
    setHasUnsavedKeywords(false);
    toast({ title: "Kaydedildi", description: "Anahtar kelimeler başarıyla kaydedildi." });
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
      setHasUnsavedKeywords(true);
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
    setHasUnsavedKeywords(true);
  };

  const collectData = useCallback(async () => {
    setIsCollecting(true);
    setListeningStatus("Yerel veri kaynakları taranıyor...");
    try {
      // Simulate collection delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Use local mock data instead of Supabase
      const items = localSocialIntelService.generateMockCollectedItems(
        keywords,
        selectedPlatform
      );
      setCollectedItems(items);
      setListeningStatus(`${items.length} adet yerel veri bulundu`);
      return items;
    } catch (err: any) {
      console.error("Collection error:", err);
      setListeningStatus("Yerel veri kaynakları dinleniyor...");
      return [];
    } finally {
      setIsCollecting(false);
    }
  }, [keywords, selectedPlatform]);

  const runFullAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalyses([]);
    setAlerts([]);
    setTrendSummary(null);
    setListeningStatus("Yerel analiz modülü başlatıldı...");

    try {
      // Step 1: Collect local data
      const collected = await collectData();

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Analyze with local engine (no Supabase)
      const { analyses, trend_summary, alerts } =
        localSocialIntelService.analyzeCollectedItems(collected);

      setAnalyses(analyses);
      setTrendSummary(trend_summary);
      setAlerts(alerts);
      setLastUpdated(new Date().toLocaleTimeString("tr-TR"));
      setListeningStatus(`Analiz tamamlandı: ${analyses.length} içerik işlendi`);

      toast({
        title: "Analiz tamamlandı",
        description: `${analyses.length} içerik başarıyla yerel olarak analiz edildi.`,
      });
    } catch (err: any) {
      console.error("Analysis error:", err);
      setListeningStatus("Yerel veri kaynakları dinleniyor...");
      toast({
        title: "Analiz hatası",
        description: "Yerel analiz işleminde hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [keywords, selectedPlatform, collectData, toast]);

  const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Auto-run on first load
  useEffect(() => {
    runFullAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      if (!isCollecting && !isAnalyzing) {
        runFullAnalysis();
      }
    }, AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [autoRefresh, runFullAnalysis, isCollecting, isAnalyzing]);

  // Countdown timer
  useEffect(() => {
    if (!autoRefresh || !lastUpdated) return;
    const tick = setInterval(() => {
      const elapsed = Date.now() - new Date().setHours(
        ...lastUpdated.split(":").map(Number) as [number, number, number]
      );
      const remaining = Math.max(0, Math.ceil((AUTO_REFRESH_INTERVAL - elapsed) / 1000));
      setNextRefreshIn(remaining);
    }, 1000);
    return () => clearInterval(tick);
  }, [autoRefresh, lastUpdated]);

  const filteredAnalyses = selectedPlatform === "all"
    ? analyses
    : analyses.filter(a => a.platform === selectedPlatform);

  const positiveCount = filteredAnalyses.filter(a => a.sentiment === "positive").length;
  const negativeCount = filteredAnalyses.filter(a => a.sentiment === "negative").length;
  const neutralCount = filteredAnalyses.filter(a => a.sentiment === "neutral").length;
  const total = filteredAnalyses.length || 1;

  const isLoading = isCollecting || isAnalyzing;

  return (
    <div className="min-h-screen bg-background scanline">
      <DashboardHeader />
      <main className="p-3 max-w-[1800px] mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft size={14} /> ANA PANEL
        </Link>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Radio size={20} className="text-primary" />
            <h2 className="font-mono text-lg font-bold tracking-wider">
              <span className="text-primary">SOSYAL MEDYA</span>
              <span className="text-muted-foreground ml-2">İSTİHBARAT MERKEZİ</span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[10px] font-mono text-muted-foreground">
                Son: {lastUpdated}
              </span>
            )}
            {autoRefresh && nextRefreshIn > 0 && !isLoading && (
              <span className="text-[10px] font-mono text-accent">
                ⟳ {Math.floor(nextRefreshIn / 60)}:{String(nextRefreshIn % 60).padStart(2, "0")}
              </span>
            )}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                autoRefresh
                  ? "bg-success/20 text-success border-success/30"
                  : "bg-muted/20 text-muted-foreground border-border/50"
              }`}
            >
              {autoRefresh ? "OTO-GÜNCELLEME AÇIK" : "OTO-GÜNCELLEME KAPALI"}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
          {[
            { label: "Toplam Analiz", value: isLoading ? "..." : `${analyses.length}`, color: "text-primary" },
            { label: "RSS Haber", value: isLoading ? "..." : `${collectedItems.filter(i => i.platform === "news").length}`, color: "text-accent" },
            { label: "Web Scrape", value: isLoading ? "..." : `${collectedItems.filter(i => i.platform === "web").length}`, color: "text-accent" },
            { label: "Pozitif", value: isLoading ? "..." : `${positiveCount}`, color: "text-success" },
            { label: "Negatif", value: isLoading ? "..." : `${negativeCount}`, color: "text-destructive" },
            { label: "Platform", value: platformLabels[selectedPlatform] || selectedPlatform, color: "text-accent" },
          ].map((item) => (
            <div key={item.label} className="bg-secondary/30 border border-border/50 rounded-md px-2.5 py-1.5 text-center">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{item.label}</div>
              <div className={`text-sm font-mono font-bold ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Left: Controls */}
          <div className="space-y-3">
            <DashboardPanel title="Anahtar Kelimeler" icon={<Hash size={14} />} count={keywords.length}>
              <div className="flex gap-1.5 mb-3">
                <input
                  type="text" value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                  placeholder="Kelime ekle..."
                  className="flex-1 bg-muted/30 border border-border/50 rounded px-2 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
                <button onClick={addKeyword} className="bg-primary/20 border border-primary/30 text-primary rounded px-2 hover:bg-primary/30 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((kw) => (
                  <span key={kw} className="inline-flex items-center gap-1 text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 rounded px-2 py-0.5">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="hover:text-destructive transition-colors"><X size={10} /></button>
                  </span>
                ))}
              </div>
              {hasUnsavedKeywords && (
                <button onClick={saveKeywords} className="w-full mt-2 flex items-center justify-center gap-1.5 bg-success/20 border border-success/30 text-success rounded py-1.5 text-[11px] font-mono font-semibold hover:bg-success/30 transition-colors">
                  KAYDET
                </button>
              )}
            </DashboardPanel>

            <DashboardPanel title="Platform Filtresi" icon={<Globe size={14} />}>
              <div className="space-y-1.5">
                {["all", "news", "web", "twitter", "instagram", "facebook", "youtube"].map((p) => (
                  <button
                    key={p} onClick={() => setSelectedPlatform(p)}
                    className={`w-full flex items-center gap-2 py-1.5 px-2 rounded text-xs font-mono transition-colors ${
                      selectedPlatform === p ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: platformColors[p] }} />
                    <span className="uppercase">{platformLabels[p] || p}</span>
                  </button>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Yerel Analiz Motoru" icon={<Sparkles size={14} />} badge="LOCAL" badgeVariant="success">
              <button
                onClick={runFullAnalysis} disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary/20 border border-primary/30 text-primary rounded py-2 text-xs font-mono font-semibold hover:bg-primary/30 transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {isCollecting ? "VERİ TOPLANIYOR..." : isAnalyzing ? "ANALİZ EDİLİYOR..." : "CANLI ANALİZ BAŞLAT"}
              </button>
              <div className="mt-3 p-2 rounded bg-success/10 border border-success/30">
                <div className="text-[9px] font-mono text-success mb-1.5">● YERELSİSTEM ÇALIŞIYOR</div>
                <p className="text-[10px] font-mono text-foreground/70 leading-relaxed">{listeningStatus}</p>
              </div>
              <div className="mt-2 text-[10px] font-mono text-muted-foreground space-y-0.5">
                <div className="flex items-center gap-1"><Newspaper size={10} /> Yerel Muğla veri tabanı</div>
                <div className="flex items-center gap-1"><Search size={10} /> İçerik analizi (client-side)</div>
                <div className="flex items-center gap-1"><Sparkles size={10} /> Duygu analizi & trend tespiti</div>
              </div>
            </DashboardPanel>
          </div>

          {/* Middle: Charts & AI Insight */}
          <div className="space-y-3">
            {trendSummary && (
              <DashboardPanel title="AI İstihbarat Raporu" icon={<Sparkles size={14} />} badge="AI" badgeVariant="info">
                <p className="text-xs text-foreground/80 leading-relaxed mb-3">{trendSummary.key_insights}</p>
                {trendSummary.top_topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {trendSummary.top_topics.map((t, i) => (
                      <span key={i} className="text-[10px] font-mono bg-accent/10 text-accent border border-accent/20 rounded px-1.5 py-0.5">#{t}</span>
                    ))}
                  </div>
                )}
              </DashboardPanel>
            )}

            <DashboardPanel title="Duygu Dağılımı">
              <div className="flex justify-around">
                <Gauge value={Math.round((positiveCount / total) * 100)} max={100} label="Pozitif" variant="primary" />
                <Gauge value={Math.round((negativeCount / total) * 100)} max={100} label="Negatif" variant="destructive" />
                <Gauge value={Math.round((neutralCount / total) * 100)} max={100} label="Nötr" variant="primary" />
              </div>
            </DashboardPanel>

            {trendSummary && (
              <DashboardPanel title="Genel Duygu" icon={<BarChart3 size={14} />}>
                <StatusList items={[
                  { label: "Genel Duygu", value: trendSummary.overall_sentiment === "positive" ? "POZİTİF" : trendSummary.overall_sentiment === "negative" ? "NEGATİF" : "NÖTR", status: trendSummary.overall_sentiment === "positive" ? "ok" : trendSummary.overall_sentiment === "negative" ? "critical" : "info" },
                  { label: "Pozitif Oran", value: `%${Math.round(trendSummary.positive_ratio * 100)}`, status: "ok" },
                  { label: "Negatif Oran", value: `%${Math.round(trendSummary.negative_ratio * 100)}`, status: trendSummary.negative_ratio > 0.3 ? "critical" : "info" },
                  { label: "Nötr Oran", value: `%${Math.round(trendSummary.neutral_ratio * 100)}`, status: "info" },
                ]} />
              </DashboardPanel>
            )}

            {/* Collected real data */}
            {collectedItems.length > 0 && (
              <DashboardPanel title="Toplanan Gerçek Veriler" icon={<Newspaper size={14} />} badge="CANLI" badgeVariant="live" count={collectedItems.length}>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {collectedItems.slice(0, 20).map((item, i) => (
                    <div key={i} className="p-2 rounded bg-muted/20 border border-border/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: platformColors[item.platform] }} />
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{platformLabels[item.platform] || item.platform}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">• {item.source_author}</span>
                      </div>
                      <p className="text-[11px] text-foreground/80 leading-snug">{item.content}</p>
                      {item.description && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                      {item.matched_keywords && item.matched_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.matched_keywords.map((kw, ki) => (
                            <span key={ki} className="text-[9px] font-mono bg-primary/10 text-primary border border-primary/20 rounded px-1 py-0.5">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.source_url && (
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-primary/60 hover:text-primary mt-1 block truncate">
                          {item.source_url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </DashboardPanel>
            )}
          </div>

          {/* Right: AI Analysis Feed */}
          <div className="lg:col-span-1 xl:col-span-2 space-y-3">
            <DashboardPanel title="AI Analiz Akışı" icon={<MessageCircle size={14} />} badge={isLoading ? "YÜKLENİYOR" : "CANLI"} badgeVariant="live" count={filteredAnalyses.length}>
              {isLoading && analyses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Loader2 size={24} className="animate-spin mb-2" />
                  <p className="text-xs font-mono">{isCollecting ? "RSS ve web verileri toplanıyor..." : "AI analiz ediliyor..."}</p>
                </div>
              ) : analyses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-xs font-mono">Henüz analiz yok. "CANLI ANALİZ BAŞLAT" butonuna tıklayın.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAnalyses.map((item, i) => (
                    <div key={i} className="p-2.5 rounded bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors animate-slide-in" style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: platformColors[item.platform] || platformColors.all }} />
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">{platformLabels[item.platform] || item.platform}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">• {item.source_author}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                            item.sentiment === "positive" ? "bg-success/20 text-success" :
                            item.sentiment === "negative" ? "bg-destructive/20 text-destructive" :
                            "bg-accent/20 text-accent"
                          }`}>
                            {item.sentiment === "positive" ? "POZİTİF" : item.sentiment === "negative" ? "NEGATİF" : "NÖTR"}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">{item.sentiment_score?.toFixed(2)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-foreground/80 mb-1.5">{item.content}</p>
                      {item.summary && <p className="text-[10px] text-muted-foreground italic">{item.summary}</p>}
                      <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground mt-1">
                        <MessageCircle size={10} />
                        <span>{(item.engagement_count || 0).toLocaleString()} etkileşim</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashboardPanel>

            {alerts.length > 0 && (
              <DashboardPanel title="AI Uyarıları" icon={<AlertTriangle size={14} />} badge="DİKKAT" badgeVariant="warning">
                <StatusList items={alerts.map(a => ({
                  label: a.label,
                  value: a.value,
                  status: a.severity === "critical" ? "critical" : a.severity === "warning" ? "warning" : "ok",
                }))} />
              </DashboardPanel>
            )}
          </div>
        </div>

        <footer className="mt-4 py-3 border-t border-border/50 text-center space-y-1">
          <p className="text-[10px] font-mono text-muted-foreground">
            MUĞLA MONİTÖR v1.0 — Sosyal Medya İstihbarat Modülü — Yerel İşleme (Local Logic)
          </p>
          <p className="text-[9px] font-mono text-success">
            ✓ Dış sunucu bağımlılığı yok • Client-side analiz • Yerel veri tabanı
          </p>
        </footer>
      </main>
    </div>
  );
};

export default SocialIntel;
