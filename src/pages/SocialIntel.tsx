import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { StatusList } from "@/components/dashboard/StatusList";
import { MiniChart } from "@/components/dashboard/MiniChart";
import { Gauge } from "@/components/dashboard/Gauge";
import { Link } from "react-router-dom";
import { socialIntelService } from "@/services/social-intel-service";
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
  reddit: "hsl(16, 100%, 50%)",
  eksisozluk: "hsl(120, 50%, 40%)",
  news: "hsl(35, 80%, 50%)",
  web: "hsl(260, 60%, 55%)",
  all: "hsl(160, 60%, 45%)",
};

const platformLabels: Record<string, string> = {
  twitter: "X (Twitter)",
  reddit: "Reddit",
  eksisozluk: "Ekşi Sözlük",
  news: "Google News",
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
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [nextRefreshIn, setNextRefreshIn] = useState(0);
  const [hasUnsavedKeywords, setHasUnsavedKeywords] = useState(false);
  const [listeningStatus, setListeningStatus] = useState("Gerçek veri kaynakları bekleniyor...");
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

  const runFullAnalysis = useCallback(async () => {
    setIsCollecting(true);
    setIsAnalyzing(true);
    setListeningStatus("Gerçek kaynaklar taranıyor (Google News, Reddit, Ekşi)...");

    try {
      const result = await socialIntelService.collectAndAnalyze(keywords, selectedPlatform);

      setCollectedItems(result.collectedItems);
      setAnalyses(result.analyses);
      setAlerts(result.alerts);
      setTrendSummary(result.trend_summary);
      setLastUpdated(new Date().toLocaleTimeString("tr-TR"));
      
      const method = result.trend_summary.key_insights.includes("AI BERT") ? "AI" : "Keyword";
      setListeningStatus(`✅ ${result.analyses.length} gerçek içerik analiz edildi (${method})`);

      toast({
        title: "Analiz tamamlandı",
        description: `${result.analyses.length} gerçek içerik ${method} ile analiz edildi.`,
      });
    } catch (err: any) {
      console.error("Analysis error:", err);
      setListeningStatus("⚠️ Bağlantı hatası, tekrar denenecek...");
      toast({
        title: "Analiz hatası",
        description: err.message || "Veri çekme/analiz işleminde hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsCollecting(false);
      setIsAnalyzing(false);
    }
  }, [keywords, selectedPlatform, toast]);

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
            <button
              onClick={runFullAnalysis}
              disabled={isLoading}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
              <span className="ml-1">{isLoading ? "ANALİZ EDİLİYOR..." : "YENİLE"}</span>
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mb-4 flex items-center gap-2 text-[10px] font-mono">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${isLoading ? "bg-accent animate-pulse" : "bg-success"}`}></span>
          <span className="text-muted-foreground">{listeningStatus}</span>
          <span className="ml-auto text-muted-foreground/60">
            Kaynak: Google News RSS • Reddit API • Ekşi Sözlük • HuggingFace AI
          </span>
        </div>

        {/* Keywords Management */}
        <DashboardPanel title="Anahtar Kelimeler" icon={<Hash size={14} />} badge={`${keywords.length}`}>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {keywords.map(kw => (
              <span key={kw} className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {kw}
                <button onClick={() => removeKeyword(kw)} className="hover:text-destructive">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              placeholder="Yeni kelime ekle..."
              className="flex-1 text-[11px] font-mono px-2 py-1 rounded bg-muted/30 border border-border/50 focus:outline-none focus:border-primary/50"
            />
            <button onClick={addKeyword} className="text-[10px] font-mono px-2 py-1 rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20">
              <Plus size={10} />
            </button>
            {hasUnsavedKeywords && (
              <button onClick={saveKeywords} className="text-[10px] font-mono px-2 py-1 rounded bg-success/10 border border-success/30 text-success hover:bg-success/20">
                KAYDET
              </button>
            )}
          </div>
        </DashboardPanel>

        {/* Platform Filter */}
        <div className="flex gap-1.5 mb-4 mt-3">
          {Object.entries(platformLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedPlatform(key)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                selectedPlatform === key
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-muted/10 text-muted-foreground border-border/30 hover:border-primary/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Left Column - Stats */}
          <div className="space-y-3">
            <DashboardPanel title="Anlık Durum" icon={<BarChart3 size={14} />}>
              <StatusList items={[
                { label: "Toplam İçerik", value: isLoading ? "..." : `${filteredAnalyses.length}`, color: "text-primary" },
                { label: "Google News", value: isLoading ? "..." : `${collectedItems.filter(i => i.platform === "news").length}`, color: "text-accent" },
                { label: "Reddit", value: isLoading ? "..." : `${collectedItems.filter(i => i.platform === "reddit").length}`, color: "text-orange-400" },
                { label: "Ekşi Sözlük", value: isLoading ? "..." : `${collectedItems.filter(i => i.platform === "eksisozluk").length}`, color: "text-green-400" },
              ]} />
            </DashboardPanel>

            <DashboardPanel title="Duygu Dağılımı" icon={<Sparkles size={14} />}>
              <div className="space-y-2">
                <Gauge label="Olumlu" value={Math.round((positiveCount / total) * 100)} color="hsl(142, 76%, 45%)" />
                <Gauge label="Nötr" value={Math.round((neutralCount / total) * 100)} color="hsl(45, 93%, 47%)" />
                <Gauge label="Olumsuz" value={Math.round((negativeCount / total) * 100)} color="hsl(0, 84%, 60%)" />
              </div>
            </DashboardPanel>

            {trendSummary && (
              <DashboardPanel title="Trend Özeti" icon={<TrendingUp size={14} />}>
                <div className="text-[10px] font-mono text-muted-foreground space-y-1">
                  <p><span className="text-primary">Genel:</span> {trendSummary.overall_sentiment === "positive" ? "🟢 Olumlu" : trendSummary.overall_sentiment === "negative" ? "🔴 Olumsuz" : "🟡 Nötr"}</p>
                  <p><span className="text-primary">Öne Çıkanlar:</span> {trendSummary.top_topics.join(", ") || "—"}</p>
                  <p className="mt-2 text-[9px] leading-relaxed">{trendSummary.key_insights}</p>
                </div>
              </DashboardPanel>
            )}
          </div>

          {/* Middle Column - Collected Items */}
          <div className="space-y-3">
            {collectedItems.length > 0 && (
              <DashboardPanel title="Toplanan Gerçek Veriler" icon={<Newspaper size={14} />} badge="CANLI" badgeVariant="live" count={collectedItems.length}>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {collectedItems.slice(0, 25).map((item, i) => (
                    <div key={i} className="text-[10px] font-mono p-2 rounded bg-muted/20 border border-border/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1 py-0.5 rounded text-[8px] uppercase" style={{ backgroundColor: `${platformColors[item.platform] || platformColors.web}20`, color: platformColors[item.platform] || platformColors.web }}>
                          {platformLabels[item.platform] || item.platform}
                        </span>
                        <span className="text-muted-foreground/60">{item.source_author}</span>
                      </div>
                      <p className="text-foreground/80 leading-relaxed">{item.content}</p>
                      {item.source_url && item.source_url !== "" && (
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-primary/60 hover:text-primary text-[9px] mt-1 inline-block">
                          🔗 Kaynak
                        </a>
                      )}
                      {item.matched_keywords && item.matched_keywords.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {item.matched_keywords.map(kw => (
                            <span key={kw} className="text-[8px] px-1 rounded bg-accent/10 text-accent">{kw}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </DashboardPanel>
            )}
          </div>

          {/* Right Column - Analysis Results */}
          <div className="space-y-3">
            {alerts.length > 0 && (
              <DashboardPanel title="Uyarılar" icon={<AlertTriangle size={14} />} badge={`${alerts.length}`} badgeVariant="warning">
                <div className="space-y-1.5">
                  {alerts.map((alert, i) => (
                    <div key={i} className={`text-[10px] font-mono p-2 rounded border ${
                      alert.severity === "critical" ? "bg-destructive/10 border-destructive/30 text-destructive" :
                      alert.severity === "warning" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" :
                      "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    }`}>
                      <span className="font-bold">{alert.label}:</span> {alert.value}
                    </div>
                  ))}
                </div>
              </DashboardPanel>
            )}

            {filteredAnalyses.length > 0 && (
              <DashboardPanel title="Duygu Analizi Sonuçları" icon={<MessageCircle size={14} />} count={filteredAnalyses.length}>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredAnalyses.slice(0, 20).map((item, i) => (
                    <div key={i} className="text-[10px] font-mono p-2 rounded bg-muted/20 border border-border/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="px-1 py-0.5 rounded text-[8px] uppercase" style={{ backgroundColor: `${platformColors[item.platform] || platformColors.web}20`, color: platformColors[item.platform] || platformColors.web }}>
                          {platformLabels[item.platform] || item.platform}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          item.sentiment === "positive" ? "bg-success/20 text-success" :
                          item.sentiment === "negative" ? "bg-destructive/20 text-destructive" :
                          "bg-yellow-500/20 text-yellow-500"
                        }`}>
                          {item.sentiment === "positive" ? "OLUMLU" : item.sentiment === "negative" ? "OLUMSUZ" : "NÖTR"}
                          {" "}({Math.round(item.sentiment_score * 100)}%)
                        </span>
                      </div>
                      <p className="text-foreground/70 leading-relaxed">{item.content.slice(0, 150)}</p>
                      {item.summary && (
                        <p className="text-muted-foreground/60 mt-1 text-[9px]">→ {item.summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              </DashboardPanel>
            )}

            {/* Sentiment Chart */}
            {filteredAnalyses.length > 0 && (
              <DashboardPanel title="Platform Dağılımı" icon={<Globe size={14} />}>
                <MiniChart
                  data={Object.entries(
                    filteredAnalyses.reduce((acc, a) => {
                      acc[a.platform] = (acc[a.platform] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([name, value]) => ({ name: platformLabels[name] || name, value }))}
                  color="hsl(var(--primary))"
                  type="bar"
                />
              </DashboardPanel>
            )}
          </div>
        </div>

        {/* Connection Status Footer */}
        <div className="mt-4 flex items-center justify-between text-[9px] font-mono text-muted-foreground/50 border-t border-border/20 pt-2">
          <span>Kaynak: {socialIntelService.getConnectionStatus().dataSource}</span>
          <span>Durum: {socialIntelService.getConnectionStatus().isConnected ? "🟢 Bağlı" : "🔴 Bağlantı Yok"}</span>
        </div>
      </main>
    </div>
  );
};

export default SocialIntel;
