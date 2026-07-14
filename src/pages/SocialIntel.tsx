import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { Link, useNavigate } from "react-router-dom";
import { socialIntelService, LocalAnalysisItem, SocialDataMode } from "@/services/social-intel-service";
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

const modePresentation: Record<SocialDataMode | "loading", {
  dotClass: string;
  textClass: string;
  containerClass: string;
  label: string;
  detail: string;
}> = {
  loading: {
    dotClass: "bg-muted-foreground/40",
    textClass: "text-muted-foreground",
    containerClass: "bg-muted/5 border-border/30",
    label: "KAYNAKLAR DENETLENİYOR",
    detail: "Canlı veri kaynaklarından yanıt bekleniyor",
  },
  live: {
    dotClass: "bg-green-500 animate-pulse",
    textClass: "text-green-500",
    containerClass: "bg-green-500/5 border-green-500/20",
    label: "CANLI KAYNAK MODU",
    detail: "Canlı kaynak yanıtları • Client-side duygu analizi",
  },
  demo: {
    dotClass: "bg-amber-400",
    textClass: "text-amber-400",
    containerClass: "bg-amber-500/5 border-amber-500/20",
    label: "DEMO MODU",
    detail: "Açıkça etiketlenmiş örnek içerik • Gerçek olay değildir",
  },
  unavailable: {
    dotClass: "bg-red-400",
    textClass: "text-red-400",
    containerClass: "bg-red-500/5 border-red-500/20",
    label: "KAYNAK KULLANILAMIYOR",
    detail: "Sahte fallback kapalı • Doğrulanmış veri bekleniyor",
  },
};

const SocialIntel = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"feed" | "osint" | "network">("feed");
  const [keywords, setKeywords] = useState<string[]>(["Muğla", "Bodrum", "Fethiye", "Marmaris"]);
  const [analyses, setAnalyses] = useState<LocalAnalysisItem[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dataMode, setDataMode] = useState<SocialDataMode | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [protocolFilter, setProtocolFilter] = useState<string | null>(null);
  const [listeningStatus, setListeningStatus] = useState("Canlı veri kaynakları denetleniyor...");
  const [filters, setFilters] = useState<SocialFilters>({
    platform: "all",
    sentiment: "all",
    region: "",
    dateRange: "all",
    keyword: "",
  });
  const { toast } = useToast();
  const mode = modePresentation[dataMode ?? "loading"];

  const collectData = useCallback(async () => {
    if (isCollecting) return;
    const activeKeywords = keywords.length > 0 ? keywords : ["Muğla", "Bodrum", "Fethiye", "Marmaris"];
    setIsCollecting(true);
    setListeningStatus("Canlı veri kaynakları taranıyor...");

    try {
      const result = await socialIntelService.collectAndAnalyze(activeKeywords, "all");
      setDataMode(result.mode);

      if (result.analyses.length > 0) {
        setAnalyses(result.analyses);
        setLastUpdate(new Date());
        setListeningStatus(
          result.mode === "demo"
            ? `DEMO MODU: ${result.analyses.length} örnek içerik`
            : `${result.analyses.length} canlı içerik analiz edildi`
        );
      } else {
        setAnalyses([]);
        setLastUpdate(null);
        setListeningStatus("Canlı kaynaklardan doğrulanmış veri alınamadı");
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
      setDataMode("unavailable");
      setAnalyses([]);
      setLastUpdate(null);
      setListeningStatus("Canlı veri kaynakları kullanılamıyor");
      toast({ title: "Analiz hatası", description: "Canlı veri analizi sırasında hata oluştu", variant: "destructive" });
    } finally {
      setIsCollecting(false);
    }
  }, [keywords, isCollecting, toast]);

  // Init notifications
  useEffect(() => {
    notificationService.init();
  }, []);

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
                Canlı kaynak taraması — Client-side duygu analizi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mr-2">
            <span className={`w-1.5 h-1.5 rounded-full ${mode.dotClass}`}></span>
            <span className={`text-[9px] font-mono ${mode.textClass}`}>{listeningStatus}</span>
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
              {isCollecting ? "Analiz Ediliyor..." : dataMode === "demo" ? "DEMO ANALİZİ YENİLE" : "CANLI ANALİZ BAŞLAT"}
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
        {dataMode === "demo" && (
          <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2">
            <p className="text-[10px] font-mono font-bold text-amber-300">DEMO MODU — ÖRNEK VERİ</p>
            <p className="text-[9px] font-mono text-amber-100/70 mt-0.5">
              Gösterilen içerikler canlı kaynaklardan gelmez ve gerçek olay olarak yorumlanmamalıdır.
            </p>
          </div>
        )}

        {dataMode === "unavailable" && (
          <div className="rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-2">
            <p className="text-[10px] font-mono font-bold text-red-300">CANLI VERİ KULLANILAMIYOR</p>
            <p className="text-[9px] font-mono text-red-100/70 mt-0.5">
              Sahte içerik gösterilmedi. Kaynaklar yeniden erişilebilir olduğunda veriler güncellenecektir.
            </p>
          </div>
        )}

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
                    {isCollecting ? "Canlı veriler analiz ediliyor..." : "Filtre kriterlerine uygun sonuç bulunamadı"}
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
                            {dataMode === "demo" && (
                              <span className="text-[8px] font-mono font-bold text-amber-300 border border-amber-400/30 bg-amber-400/10 rounded px-1">
                                DEMO VERİSİ
                              </span>
                            )}
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
              <p className="text-[9px] font-mono text-muted-foreground text-center py-3">
                Doğrulanmış geçmiş veri oluştuğunda haftalık karşılaştırma gösterilecektir.
              </p>
            </DashboardPanel>

            {/* AI Summary */}
            <DashboardPanel title="AI Günlük Özet" subtitle="Otomatik rapor">
              <div className="space-y-2">
                {analyses.length > 0 ? (
                  <>
                    <p className="text-[10px] font-mono text-foreground/80 leading-relaxed">
                      <span className="text-primary font-bold">
                        {dataMode === "demo" ? "Demo özeti:" : "Bugün Muğla'da:"}
                      </span>{" "}
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
                    {isCollecting ? "Canlı veriler analiz ediliyor..." : "CANLI ANALİZ BAŞLAT butonuna basarak analizi başlatabilirsiniz"}
                  </p>
                )}
              </div>
            </DashboardPanel>

            <div className={`p-2 rounded-lg border ${mode.containerClass}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${mode.dotClass}`}></span>
                <span className={`text-[9px] font-mono font-bold ${mode.textClass}`}>{mode.label}</span>
              </div>
              <p className="text-[9px] font-mono text-muted-foreground">{mode.detail}</p>
            </div>
          </div>
        </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-4 py-3 border-t border-border/50 text-center space-y-1">
          <p className="text-[10px] font-mono text-muted-foreground">
            MUĞLA MONİTÖR v1.0 — Sosyal Medya İstihbarat Modülü
          </p>
          <p className="text-[9px] font-mono text-muted-foreground/70">
            Canlı, demo ve kullanılamıyor durumları birbirinden açıkça ayrılır
          </p>
        </footer>
      </div>
    </div>
  );
};

export default SocialIntel;
