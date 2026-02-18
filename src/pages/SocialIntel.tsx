import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusList } from "@/components/dashboard/StatusList";
import { MiniChart } from "@/components/dashboard/MiniChart";
import { Gauge } from "@/components/dashboard/Gauge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Radio, Search, TrendingUp, MessageCircle, Hash,
  ArrowLeft, Plus, X, Loader2, Twitter, Instagram,
  Facebook, Youtube, Globe, Sparkles, BarChart3, AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const platformIcons: Record<string, React.ReactNode> = {
  twitter: <Twitter size={12} />,
  instagram: <Instagram size={12} />,
  facebook: <Facebook size={12} />,
  youtube: <Youtube size={12} />,
  all: <Globe size={12} />,
};

const platformColors: Record<string, string> = {
  twitter: "hsl(200, 97%, 50%)",
  instagram: "hsl(330, 70%, 55%)",
  facebook: "hsl(220, 46%, 48%)",
  youtube: "hsl(0, 100%, 50%)",
  all: "hsl(160, 60%, 45%)",
};

// Demo analysis data
const demoAnalyses = [
  { platform: "twitter", content: "Bodrum'da yaz sezonu erken başladı, oteller dolmaya başladı", sentiment: "positive", sentiment_score: 0.85, source_author: "@bodrumhaber", engagement_count: 342 },
  { platform: "instagram", content: "Fethiye Ölüdeniz'den muhteşem manzara paylaşımları artıyor", sentiment: "positive", sentiment_score: 0.92, source_author: "@fethiyetravel", engagement_count: 1250 },
  { platform: "twitter", content: "Marmaris'te orman yangını riski uyarısı yapıldı", sentiment: "negative", sentiment_score: 0.25, source_author: "@marmarishaber", engagement_count: 890 },
  { platform: "facebook", content: "Muğla Belediyesi yeni bisiklet yolu projesini duyurdu", sentiment: "positive", sentiment_score: 0.78, source_author: "Muğla Belediyesi", engagement_count: 456 },
  { platform: "youtube", content: "Dalaman Havalimanı sezon hazırlıkları - vlog", sentiment: "neutral", sentiment_score: 0.55, source_author: "TravelTR", engagement_count: 12400 },
  { platform: "twitter", content: "Muğla'da hava kalitesi son 5 yılın en iyi seviyesinde", sentiment: "positive", sentiment_score: 0.88, source_author: "@muglacevre", engagement_count: 234 },
  { platform: "instagram", content: "Bodrum kalesi restorasyonu tamamlandı", sentiment: "positive", sentiment_score: 0.90, source_author: "@bodrumkultur", engagement_count: 2100 },
  { platform: "facebook", content: "İşsizlik oranı turizmle birlikte düşüşe geçti", sentiment: "positive", sentiment_score: 0.72, source_author: "Muğla Ekonomi", engagement_count: 345 },
];

const weeklyData = [
  { name: "Pzt", value: 120 },
  { name: "Sal", value: 185 },
  { name: "Çar", value: 142 },
  { name: "Per", value: 210 },
  { name: "Cum", value: 198 },
  { name: "Cmt", value: 245 },
  { name: "Paz", value: 230 },
];

const sentimentData = [
  { name: "Pzt", value: 65 },
  { name: "Sal", value: 72 },
  { name: "Çar", value: 58 },
  { name: "Per", value: 80 },
  { name: "Cum", value: 74 },
  { name: "Cmt", value: 85 },
  { name: "Paz", value: 78 },
];

const SocialIntel = () => {
  const [keywords, setKeywords] = useState<string[]>(["Muğla", "Bodrum", "Fethiye", "Marmaris", "turizm", "yangın", "belediye", "havalimanı"]);
  const [newKeyword, setNewKeyword] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const { toast } = useToast();

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAiInsight(null);
    try {
      const { data, error } = await supabase.functions.invoke("social-analyze", {
        body: { keywords, platform: selectedPlatform },
      });

      if (error) throw error;

      if (data?.trend_summary?.key_insights) {
        setAiInsight(data.trend_summary.key_insights);
        toast({ title: "Analiz tamamlandı", description: "AI istihbarat raporu hazır." });
      } else if (data?.error) {
        toast({ title: "Hata", description: data.error, variant: "destructive" });
      } else {
        setAiInsight("Analiz sonuçları alındı ancak detaylı içgörü oluşturulamadı.");
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast({ title: "Analiz hatası", description: err.message || "Bir hata oluştu", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredAnalyses = selectedPlatform === "all"
    ? demoAnalyses
    : demoAnalyses.filter(a => a.platform === selectedPlatform);

  const positiveCount = filteredAnalyses.filter(a => a.sentiment === "positive").length;
  const negativeCount = filteredAnalyses.filter(a => a.sentiment === "negative").length;
  const neutralCount = filteredAnalyses.filter(a => a.sentiment === "neutral").length;

  return (
    <div className="min-h-screen bg-background scanline">
      <DashboardHeader />

      <main className="p-3 max-w-[1800px] mx-auto">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft size={14} />
          ANA PANEL
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <Radio size={20} className="text-primary" />
          <h2 className="font-mono text-lg font-bold tracking-wider">
            <span className="text-primary">SOSYAL MEDYA</span>
            <span className="text-muted-foreground ml-2">İSTİHBARAT MERKEZİ</span>
          </h2>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
          {[
            { label: "Toplam Bahsetme", value: "1,330", color: "text-primary" },
            { label: "Pozitif", value: `${positiveCount}`, color: "text-success" },
            { label: "Negatif", value: `${negativeCount}`, color: "text-destructive" },
            { label: "Nötr", value: `${neutralCount}`, color: "text-accent" },
            { label: "Aktif Kelime", value: `${keywords.length}`, color: "text-primary" },
            { label: "Platform", value: selectedPlatform === "all" ? "Tümü" : selectedPlatform, color: "text-accent" },
          ].map((item) => (
            <div key={item.label} className="bg-secondary/30 border border-border/50 rounded-md px-2.5 py-1.5 text-center">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{item.label}</div>
              <div className={`text-sm font-mono font-bold ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Left: Keywords & Controls */}
          <div className="space-y-3">
            <DashboardPanel title="Anahtar Kelimeler" icon={<Hash size={14} />} count={keywords.length}>
              <div className="flex gap-1.5 mb-3">
                <input
                  type="text"
                  value={newKeyword}
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
                    <button onClick={() => removeKeyword(kw)} className="hover:text-destructive transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Platform Filtresi" icon={<Globe size={14} />}>
              <div className="space-y-1.5">
                {["all", "twitter", "instagram", "facebook", "youtube"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPlatform(p)}
                    className={`w-full flex items-center gap-2 py-1.5 px-2 rounded text-xs font-mono transition-colors ${
                      selectedPlatform === p
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {platformIcons[p]}
                    <span className="uppercase">{p === "all" ? "Tüm Platformlar" : p}</span>
                  </button>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="AI Analiz" icon={<Sparkles size={14} />} badge="AI" badgeVariant="info">
              <button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                className="w-full flex items-center justify-center gap-2 bg-primary/20 border border-primary/30 text-primary rounded py-2 text-xs font-mono font-semibold hover:bg-primary/30 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {isAnalyzing ? "ANALİZ EDİLİYOR..." : "AI İSTİHBARAT RAPORU OLUŞTUR"}
              </button>
              {aiInsight && (
                <div className="mt-3 p-2.5 rounded bg-accent/10 border border-accent/20">
                  <div className="text-[10px] font-mono text-accent uppercase tracking-wider mb-1">AI İçgörü</div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{aiInsight}</p>
                </div>
              )}
            </DashboardPanel>
          </div>

          {/* Middle: Charts & Gauges */}
          <div className="space-y-3">
            <DashboardPanel title="Bahsetme Trendi" icon={<TrendingUp size={14} />}>
              <MiniChart data={weeklyData} color="hsl(200, 80%, 50%)" height={80} showAxis />
            </DashboardPanel>

            <DashboardPanel title="Duygu Analizi Trendi" icon={<BarChart3 size={14} />}>
              <MiniChart data={sentimentData} color="hsl(160, 60%, 45%)" height={80} showAxis />
            </DashboardPanel>

            <DashboardPanel title="Duygu Dağılımı">
              <div className="flex justify-around">
                <Gauge value={Math.round((positiveCount / filteredAnalyses.length) * 100)} max={100} label="Pozitif" variant="primary" />
                <Gauge value={Math.round((negativeCount / filteredAnalyses.length) * 100)} max={100} label="Negatif" variant="destructive" />
                <Gauge value={Math.round((neutralCount / filteredAnalyses.length) * 100)} max={100} label="Nötr" variant="primary" />
              </div>
            </DashboardPanel>

            <DashboardPanel title="Platform Dağılımı">
              <StatusList items={[
                { label: "X (Twitter)", value: "520 (%39)", status: "ok" },
                { label: "Instagram", value: "380 (%29)", status: "ok" },
                { label: "Facebook", value: "245 (%18)", status: "info" },
                { label: "YouTube", value: "185 (%14)", status: "info" },
              ]} />
            </DashboardPanel>
          </div>

          {/* Right: Feed */}
          <div className="lg:col-span-1 xl:col-span-2 space-y-3">
            <DashboardPanel title="Sosyal Medya Akışı" icon={<MessageCircle size={14} />} badge="CANLI" badgeVariant="live" count={filteredAnalyses.length}>
              <div className="space-y-2">
                {filteredAnalyses.map((item, i) => (
                  <div key={i} className="p-2.5 rounded bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors animate-slide-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span style={{ color: platformColors[item.platform] }}>{platformIcons[item.platform]}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{item.platform}</span>
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
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {item.sentiment_score.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/80 mb-1.5">{item.content}</p>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                      <MessageCircle size={10} />
                      <span>{item.engagement_count.toLocaleString()} etkileşim</span>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardPanel>

            <DashboardPanel title="Uyarılar" icon={<AlertTriangle size={14} />} badge="DİKKAT" badgeVariant="warning">
              <StatusList items={[
                { label: "Yangın riski bahsetmeleri artışta", value: "+45%", status: "warning" },
                { label: "Negatif turizm yorumları", value: "12 yeni", status: "critical" },
                { label: "Belediye projeleri ilgi çekiyor", value: "+28%", status: "ok" },
                { label: "Havalimanı şikayetleri", value: "8 yeni", status: "warning" },
              ]} />
            </DashboardPanel>
          </div>
        </div>

        <footer className="mt-4 py-3 border-t border-border/50 text-center">
          <p className="text-[10px] font-mono text-muted-foreground">
            MUĞLA MONİTÖR v1.0 — Sosyal Medya İstihbarat Modülü — AI destekli analiz
          </p>
        </footer>
      </main>
    </div>
  );
};

export default SocialIntel;
