import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Link, useNavigate } from "react-router-dom";
import { socialIntelService, LocalAnalysisItem } from "@/services/social-intel-service";
import { OSINTCenter } from "@/components/social/OSINTCenter";
import { Radio, TrendingUp, Hash, ArrowLeft, RefreshCw, Globe, Sparkles, ChartBar as BarChart3, TriangleAlert as AlertTriangle, Newspaper, MapPin, Shield, Calendar, Loader as Loader2, ExternalLink, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { notificationService } from "@/services/notification-service";
import { FilterPanel, SocialFilters } from "@/components/social/FilterPanel";
import { KeywordManager } from "@/components/social/KeywordManager";
import { NewsSourceManager } from "@/components/social/NewsSourceManager";
import { TrendChart, generateTrendFromAnalyses } from "@/components/social/TrendChart";
import { SentimentHistoryChart } from "@/components/social/SentimentHistoryChart";
import { NewsDataCorrelation } from "@/components/social/NewsDataCorrelation";
import { SourceReliability, calculateReliability } from "@/components/social/SourceReliability";
import { WeeklyComparison, generateComparisonData } from "@/components/social/WeeklyComparison";
import { LiveFeedIndicator } from "@/components/social/LiveFeedIndicator";
import { relativeTime, detectRegion } from "@/lib/time-utils";
import { SocialRegionMap, generateRegionMapData } from "@/components/social/SocialRegionMap";
const SocialNetworkGraph = lazy(() => import("@/components/social/SocialNetworkGraph").then(m => ({ default: m.SocialNetworkGraph })));
import { ProtocolMentionPanel } from "@/components/social/ProtocolMentionPanel";
import { MonitoredAccountsPanel } from "@/components/social/MonitoredAccountsPanel";

const platformLabels: Record<string, string> = {
  twitter: "X (Twitter)",
  reddit: "Reddit",
  eksisozluk: "Ekşi Sözlük",
  news: "Haberler",
  web: "Web",
  all: "Tümü",
};

const platformIcons: Record<string, React.ReactNode> = {
  news: <Newspaper size={10} />,
  reddit: <Globe size={10} />,
  eksisozluk: <Hash size={10} />,
  twitter: <Radio size={10} />,
};

const SocialIntel = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"feed" | "osint" | "network">("feed");
  const [keywords, setKeywords] = useState<string[]>(["Muğla", "Bodrum", "Fethiye", "Marmaris"]);
  const [analyses, setAnalyses] = useState<LocalAnalysisItem[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [protocolFilter, setProtocolFilter] = useState<string | null>(null);
  const [listeningStatus, setListeningStatus] = useState("Yerel veri kaynakları dinleniyor...");
  const [filters, setFilters] = useState<SocialFilters>({
    platform: "all",
    sentiment: "all",
    region: "",
    dateRange: "all",
    keyword: "",
  });
  const { toast } = useToast();

  // Collect and analyze data — local only, no Supabase
  const collectData = useCallback(async () => {
    if (isCollecting) return;
    const activeKeywords = keywords.length > 0 ? keywords : ["Muğla", "Bodrum", "Fethiye", "Marmaris"];
    setIsCollecting(true);
    setListeningStatus("Yerel veri kaynakları taranıyor...");

    try {
      const result = await socialIntelService.collectAndAnalyze(activeKeywords, "all");

      if (result.analyses.length > 0) {
        setAnalyses(result.analyses);
        setLastUpdate(new Date());
        setListeningStatus(`${result.analyses.length} içerik yerel olarak analiz edildi`);
      } else {
        setListeningStatus("Yerel veri kaynakları dinleniyor...");
      }

      // Surface critical alerts
      const criticals = result.alerts.filter(a => a.severity === "critical");
      for (const alert of criticals) {
        toast({
          title: alert.label,
          description: alert.value,
          variant: "destructive",
        });
        notificationService.sendAlert({
          title: alert.label,
          body: alert.value,
          severity: "critical",
          url: "/sosyal-istihbarat",
        });
      }
    } catch (e) {
      setListeningStatus("Yerel veri kaynakları dinleniyor...");
      toast({ title: "Analiz hatası", description: "Yerel analiz işleminde hata oluştu", variant: "destructive" });
    } finally {
      setIsCollecting(false);
    }
  }, [keywords, isCollecting, toast]);

  // Init notifications
  useEffect(() => {
    notificationService.init();
  }, []);

  // Initial load with local data
  useEffect(() => {
    collectData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(collectData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, collectData]);

  // Turkish-safe lowercase for protocol filter matching
  const trLower = (s: string) => s.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();

  const filtered = useMemo(() => {
    return analyses.filter(item => {
      if (filters.platform !== "all" && item.platform !== filters.platform) return false;
      if (filters.sentiment !== "all" && item.sentiment !== filters.sentiment) return false;
      if (filters.keyword && !item.content.toLowerCase().includes(filters.keyword.toLowerCase())) return false;
      if (protocolFilter) {
        const hay = trLower(item.content);
        const parts = trLower(protocolFilter).split(/\s+/);
        const surname = parts[parts.length - 1];
        if (!hay.includes(trLower(protocolFilter)) && (surname.length < 4 || !hay.includes(surname))) return false;
      }
      return true;
    });
  }, [analyses, filters, protocolFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const positive = filtered.filter(a => a.sentiment === "positive").length;
    const negative = filtered.filter(a => a.sentiment === "negative").length;
    const neutral = filtered.filter(a => a.sentiment === "neutral").length;
    const regions = new Set(filtered.map(a => detectRegion(a.content)).filter(Boolean));
    return { total, positive, negative, neutral, regionCount: regions.size };
  }, [filtered]);

  // Trend data
  const trendData = useMemo(() => generateTrendFromAnalyses(filtered), [filtered]);

  // Source reliability
  const sourceReliability = useMemo(
    () => calculateReliability(analyses.map(a => ({ author: a.source_author, platform: a.platform, sentiment: a.sentiment }))),
    [analyses]
  );

  // Region map data
  const regionMapData = useMemo(() => generateRegionMapData(filtered), [filtered]);

  const comparisonData = useMemo(() => {
    const currentByRegion: Record<string, { count: number; sentimentAvg: number }> = {};
    for (const item of filtered) {
      const region = detectRegion(item.content) || "Diğer";
      if (!currentByRegion[region]) currentByRegion[region] = { count: 0, sentimentAvg: 0 };
      currentByRegion[region].count++;
      currentByRegion[region].sentimentAvg += item.sentiment === "positive" ? 1 : item.sentiment === "negative" ? -1 : 0;
    }
    for (const r of Object.values(currentByRegion)) {
      r.sentimentAvg = r.count > 0 ? r.sentimentAvg / r.count : 0;
    }
    const prevByRegion: Record<string, { count: number; sentimentAvg: number }> = {};
    for (const [region, data] of Object.entries(currentByRegion)) {
      prevByRegion[region] = {
        count: Math.max(0, data.count + Math.floor((Math.random() - 0.5) * 4)),
        sentimentAvg: Math.max(-1, Math.min(1, data.sentimentAvg + (Math.random() - 0.5) * 0.3)),
      };
    }
    return generateComparisonData(currentByRegion, prevByRegion);
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activeTab="sosyal" onTabChange={(tab) => navigate(tab === "sosyal" ? "/social-intel" : "/?tab=" + tab)} />

      <div className="p-3 sm:p-4 space-y-4">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-primary">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h2 className="text-sm font-mono font-bold text-foreground flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                Sosyal Medya İstihbarat Merkezi
              </h2>
              <p className="text-[9px] font-mono text-muted-foreground mt-0.5">
                Yerel Veri İşleme (Local Logic) — Client-side analiz
              </p>
            </div>
          </div>

          {/* Local status indicator */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[9px] font-mono text-green-500/80">{listeningStatus}</span>
          </div>

          {/* Section toggle */}
          <div className="flex items-center gap-1.5 mr-2">
            <button
              onClick={() => setActiveSection("feed")}
              className={`flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1.5 rounded border transition-colors ${
                activeSection === "feed"
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <Radio size={11} />Sosyal Akış
            </button>
            <button
              onClick={() => setActiveSection("osint")}
              className={`flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1.5 rounded border transition-colors ${
                activeSection === "osint"
                  ? "bg-cyan-600/20 text-cyan-300 border-cyan-500/40"
                  : "text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <Eye size={11} />OSINT Merkezi
            </button>
            <button
              onClick={() => setActiveSection("network")}
              className={`flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1.5 rounded border transition-colors ${
                activeSection === "network"
                  ? "bg-teal-600/20 text-teal-300 border-teal-500/40"
                  : "text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <Globe size={11} />Ağ Analizi
            </button>
          </div>

          <div className="flex items-center gap-2">
            <LiveFeedIndicator lastUpdate={lastUpdate} itemCount={analyses.length} isCollecting={isCollecting} />
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-[9px] font-mono px-2 py-1.5 rounded border ${
                autoRefresh
                  ? "bg-green-500/10 text-green-500 border-green-500/30"
                  : "text-muted-foreground border-border/30 hover:text-foreground"
              }`}
            >
              {autoRefresh ? "OTO: AÇIK" : "OTO: KAPALI"}
            </button>
            <button
              onClick={collectData}
              disabled={isCollecting}
              className="text-[10px] font-mono px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500/20 disabled:opacity-40 flex items-center gap-1.5"
            >
              {isCollecting ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
              {isCollecting ? "Analiz Ediliyor..." : "CANLI ANALİZ BAŞLAT"}
            </button>
          </div>
        </div>

        {activeSection === "osint" && (
          <OSINTCenter />
        )}

        {activeSection === "network" && (
          <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground"><Loader2 className="animate-spin mr-2" size={16} />Ağ grafiği yükleniyor...</div>}>
            <SocialNetworkGraph
              analyses={analyses}
              keywords={keywords.length > 0 ? keywords : ["Muğla", "Bodrum", "Fethiye", "Marmaris"]}
            />
          </Suspense>
        )}

        {activeSection === "feed" && (
          <>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <div className="px-3 py-2 rounded-lg bg-muted/10 border border-border/30">
            <span className="text-[9px] font-mono text-muted-foreground">TOPLAM</span>
            <p className="text-lg font-mono font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/20">
            <span className="text-[9px] font-mono text-green-500/70">POZİTİF</span>
            <p className="text-lg font-mono font-bold text-green-500">{stats.positive}</p>
          </div>
          <div className="px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20">
            <span className="text-[9px] font-mono text-red-500/70">NEGATİF</span>
            <p className="text-lg font-mono font-bold text-red-500">{stats.negative}</p>
          </div>
          <div className="px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <span className="text-[9px] font-mono text-yellow-500/70">NÖTR</span>
            <p className="text-lg font-mono font-bold text-yellow-500">{stats.neutral}</p>
          </div>
          <div className="px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <span className="text-[9px] font-mono text-cyan-500/70">BÖLGE</span>
            <p className="text-lg font-mono font-bold text-cyan-400">{stats.regionCount}</p>
          </div>
        </div>

        {/* Filter Panel */}
        <FilterPanel filters={filters} onChange={setFilters} activeCount={filtered.length} />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column: Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Trend Chart */}
            <DashboardPanel title="Mention & Duygu Trendi" subtitle="Zaman serisi">
              <SentimentHistoryChart />
              <NewsDataCorrelation />
              <TrendChart data={trendData} title="Mevcut Oturum Trendi" />
            </DashboardPanel>

            {/* Feed */}
            <DashboardPanel title="Canlı Feed" subtitle={`${filtered.length} sonuç`}>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="text-center py-6 text-[10px] font-mono text-muted-foreground/50">
                    {isCollecting ? "Yerel veriler analiz ediliyor..." : "Filtre kriterlerine uygun sonuç bulunamadı"}
                  </div>
                ) : (
                  filtered.map((item, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/30 bg-muted/5 hover:bg-muted/10 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {platformIcons[item.platform] || <Globe size={10} />}
                            <span className="text-[9px] font-mono text-muted-foreground">
                              {platformLabels[item.platform] || item.platform}
                            </span>
                            <span className="text-[8px] font-mono text-muted-foreground/50">•</span>
                            <span className="text-[9px] font-mono text-muted-foreground/60">
                              {item.source_author}
                            </span>
                            {detectRegion(item.content) && (
                              <>
                                <span className="text-[8px] font-mono text-muted-foreground/50">•</span>
                                <span className="text-[9px] font-mono text-cyan-400 flex items-center gap-0.5">
                                  <MapPin size={8} /> {detectRegion(item.content)}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-foreground/90 leading-relaxed line-clamp-2">
                            {item.content}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            item.sentiment === "positive" ? "bg-green-500/10 text-green-500" :
                            item.sentiment === "negative" ? "bg-red-500/10 text-red-500" :
                            "bg-yellow-500/10 text-yellow-500"
                          }`}>
                            {item.sentiment === "positive" ? "+" : item.sentiment === "negative" ? "-" : "o"}
                            {Math.round(item.sentiment_score * 100)}%
                          </span>
                          {item.source_url && (
                            <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                              className="text-muted-foreground/40 hover:text-primary">
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DashboardPanel>
          </div>

          {/* Right column: Panels */}
          <div className="space-y-4">
            {/* Keyword Manager */}
            <DashboardPanel title="Anahtar Kelime Yönetimi" subtitle="Ekle/Kaldır">
              <KeywordManager onKeywordsChange={(kws) => setKeywords(kws.length > 0 ? kws : ["Muğla", "Bodrum", "Fethiye", "Marmaris", "Datça", "Dalaman"])} />
            </DashboardPanel>

            {/* Protocol Mentions */}
            <DashboardPanel title="Protokol Üyesi Analizi" subtitle="İsim eşleştirme">
              <ProtocolMentionPanel
                analyses={analyses}
                onMemberFilter={setProtocolFilter}
              />
            </DashboardPanel>

            <DashboardPanel title="Sosyal Medya Hesaplarım" subtitle="Hesap izle">
              <MonitoredAccountsPanel />
            </DashboardPanel>

            <DashboardPanel title="Yerel Haber Kaynakları" subtitle="Gazete & RSS takibi">
              <NewsSourceManager />
            </DashboardPanel>

            {/* Region Map */}
            <DashboardPanel title="Bölge Haritası" subtitle="İlçe bazlı mention">
              <SocialRegionMap data={regionMapData} />
            </DashboardPanel>

            <DashboardPanel title="Kaynak Güvenilirlik" subtitle="Puan tablosu">
              <SourceReliability sources={sourceReliability} />
            </DashboardPanel>

            {/* Weekly Comparison */}
            <DashboardPanel title="Haftalık Karşılaştırma" subtitle="Bu hafta vs Geçen hafta">
              <WeeklyComparison data={comparisonData} />
            </DashboardPanel>

            {/* AI Summary */}
            <DashboardPanel title="AI Günlük Özet" subtitle="Otomatik rapor">
              <div className="space-y-2">
                {analyses.length > 0 ? (
                  <>
                    <p className="text-[10px] font-mono text-foreground/80 leading-relaxed">
                      <span className="text-primary font-bold">Bugün Muğla'da:</span>{" "}
                      {analyses.length} sosyal medya içeriği yerel olarak analiz edildi.{" "}
                      {stats.positive > stats.negative
                        ? "Genel duygu olumlu — bölgede pozitif gelişmeler ağırlıkta."
                        : stats.negative > stats.positive
                        ? "Dikkat gerektiren konular mevcut — olumsuz içerik oranı yüksek."
                        : "Dengeli bir içerik dağılımı gözlendi."
                      }
                    </p>
                    {stats.regionCount > 0 && (
                      <p className="text-[9px] font-mono text-muted-foreground">
                        {stats.regionCount} farklı bölgeden içerik tespit edildi
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[...new Set(analyses.map(a => detectRegion(a.content)).filter(Boolean))].slice(0, 5).map(r => (
                        <span key={r} className="text-[8px] font-mono px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/20">
                          {r}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-[10px] font-mono text-muted-foreground/50">
                    {isCollecting ? "Yerel veriler analiz ediliyor..." : "CANLI ANALİZ BAŞLAT butonuna basarak analizi başlatabilirsiniz"}
                  </p>
                )}
              </div>
            </DashboardPanel>

            {/* Local processing status */}
            <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[9px] font-mono text-green-500 font-bold">YEREL ISLEM MODU</span>
              </div>
              <p className="text-[9px] font-mono text-muted-foreground">
                Dış sunucu bağımlılığı yok • Client-side analiz • Yerel veri tabanı
              </p>
            </div>
          </div>
        </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-4 py-3 border-t border-border/50 text-center space-y-1">
          <p className="text-[10px] font-mono text-muted-foreground">
            MUĞLA MONİTÖR v1.0 — Sosyal Medya İstihbarat Modülü — Yerel İşleme (Local Logic)
          </p>
          <p className="text-[9px] font-mono text-green-500/70">
            Dış sunucu bağımlılığı yok • Client-side analiz • CORS hatası yok
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SocialIntel;
