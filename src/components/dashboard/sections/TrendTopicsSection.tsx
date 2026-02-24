import { useState } from "react";
import { DashboardPanel } from "../DashboardPanel";
import { MiniChart } from "../MiniChart";
import { TrendingUp, Flame, Clock } from "lucide-react";

type TrendItem = {
  keyword: string;
  mentions: number;
  change: number;
  sentiment: "positive" | "negative" | "neutral";
};

const dailyTrends: TrendItem[] = [
  { keyword: "#BodrumYaz2026", mentions: 4820, change: 145, sentiment: "positive" },
  { keyword: "Muğla Trafik", mentions: 2340, change: 82, sentiment: "negative" },
  { keyword: "#Fethiye", mentions: 1980, change: 34, sentiment: "positive" },
  { keyword: "Datça Festivali", mentions: 1560, change: 210, sentiment: "positive" },
  { keyword: "Marmaris Yangın Riski", mentions: 1240, change: -18, sentiment: "negative" },
  { keyword: "#MuğlaLezzet", mentions: 890, change: 56, sentiment: "positive" },
  { keyword: "Dalaman Uçuş", mentions: 780, change: 12, sentiment: "neutral" },
  { keyword: "Bodrum Marina", mentions: 650, change: 28, sentiment: "positive" },
];

const weeklyTrends: TrendItem[] = [
  { keyword: "Muğla Turizm", mentions: 18400, change: 22, sentiment: "positive" },
  { keyword: "#Bodrum", mentions: 15200, change: 18, sentiment: "positive" },
  { keyword: "Muğla Deprem", mentions: 12800, change: 340, sentiment: "negative" },
  { keyword: "#Fethiye", mentions: 9600, change: 15, sentiment: "positive" },
  { keyword: "Marmaris Etkinlik", mentions: 7200, change: 8, sentiment: "positive" },
  { keyword: "D400 Yol Çalışması", mentions: 5400, change: 45, sentiment: "negative" },
  { keyword: "Milas Zeytinyağı", mentions: 4100, change: -5, sentiment: "neutral" },
  { keyword: "#DataçaBağBozumu", mentions: 3200, change: 120, sentiment: "positive" },
];

const monthlyTrends: TrendItem[] = [
  { keyword: "Muğla Turizm 2026", mentions: 68000, change: 32, sentiment: "positive" },
  { keyword: "#Bodrum", mentions: 52000, change: 14, sentiment: "positive" },
  { keyword: "Muğla Emlak", mentions: 41000, change: 28, sentiment: "neutral" },
  { keyword: "#FethiyeÖlüdeniz", mentions: 35000, change: 42, sentiment: "positive" },
  { keyword: "Marmaris Kruvaziyer", mentions: 28000, change: 65, sentiment: "positive" },
  { keyword: "Muğla İstihdam", mentions: 22000, change: -12, sentiment: "negative" },
  { keyword: "Dalaman Havalimanı", mentions: 18000, change: 8, sentiment: "neutral" },
  { keyword: "Datça Doğa", mentions: 15000, change: 55, sentiment: "positive" },
];

const trendChartData = [
  { name: "Pzt", value: 3200 }, { name: "Sal", value: 4100 }, { name: "Çar", value: 3800 },
  { name: "Per", value: 5200 }, { name: "Cum", value: 4600 }, { name: "Cmt", value: 6100 },
  { name: "Paz", value: 5800 },
];

type Period = "daily" | "weekly" | "monthly";

const periodLabels: Record<Period, string> = {
  daily: "Günlük",
  weekly: "Haftalık",
  monthly: "Aylık",
};

const periodData: Record<Period, TrendItem[]> = {
  daily: dailyTrends,
  weekly: weeklyTrends,
  monthly: monthlyTrends,
};

const formatCount = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

export const TrendTopicsSection = () => {
  const [period, setPeriod] = useState<Period>("daily");
  const trends = periodData[period];

  return (
    <div className="space-y-3">
      <DashboardPanel title="Trend Konular" icon={<TrendingUp size={14} />} badge="CANLI" badgeVariant="live">
        {/* Period selector */}
        <div className="flex items-center gap-1 mb-3">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors ${
                period === p
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* Trend list */}
        <div className="space-y-1.5">
          {trends.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
                {i < 3 && <Flame size={10} className="text-destructive shrink-0" />}
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  item.sentiment === "positive" ? "bg-success" :
                  item.sentiment === "negative" ? "bg-destructive" : "bg-accent"
                }`} />
                <span className="text-xs font-mono text-foreground truncate">{item.keyword}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-mono text-muted-foreground">{formatCount(item.mentions)}</span>
                <span className={`text-[10px] font-mono font-bold min-w-[40px] text-right ${
                  item.change > 0 ? "text-success" : item.change < 0 ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {item.change > 0 ? "▲" : item.change < 0 ? "▼" : "—"} {Math.abs(item.change)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Haftalık Bahsetme Hacmi</div>
          <MiniChart data={trendChartData} color="hsl(160, 60%, 45%)" height={50} showAxis />
        </div>
      </DashboardPanel>
    </div>
  );
};
