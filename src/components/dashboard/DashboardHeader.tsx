import { useState, useEffect } from "react";

export type DashboardTab = "genel" | "ekonomi" | "cevre" | "turizm" | "ulasim" | "sosyal" | "guvenlik" | "enerji" | "protokol";

interface DashboardHeaderProps {
  activeTab?: DashboardTab;
  onTabChange?: (tab: DashboardTab) => void;
}

const tabs: { label: string; value: DashboardTab }[] = [
  { label: "Genel Bakış", value: "genel" },
  { label: "Ekonomi", value: "ekonomi" },
  { label: "Çevre", value: "cevre" },
  { label: "Turizm", value: "turizm" },
  { label: "Ulaşım", value: "ulasim" },
  { label: "Sosyal", value: "sosyal" },
  { label: "Güvenlik", value: "guvenlik" },
  { label: "Enerji", value: "enerji" },
  { label: "Muğla Protokol", value: "protokol" },
];

export const DashboardHeader = ({ activeTab = "genel", onTabChange }: DashboardHeaderProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("tr-TR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString("tr-TR", { hour12: false });
  };

  return (
    <header className="border-b border-border bg-secondary/20 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-primary font-mono font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="font-mono text-sm font-bold tracking-wider">
                <span className="text-primary">MUĞLA</span>
                <span className="text-muted-foreground ml-1.5">MONİTÖR</span>
              </h1>
              <p className="text-[9px] font-mono text-muted-foreground tracking-widest uppercase">
                Bölgesel İstihbarat Paneli
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 ml-4">
            <span className="status-dot-live" />
            <span className="text-[10px] font-mono text-destructive font-semibold">CANLI</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/30 border border-border/50">
              <span>📡</span>
              <span>48 KAYNAK</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted/30 border border-border/50">
              <span>⏱</span>
              <span>SON GÜNCELLEME: 2dk</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono text-foreground font-medium">{formatTime(time)}</div>
            <div className="text-[9px] font-mono text-muted-foreground">{formatDate(time)}</div>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1 px-4 py-1.5 overflow-x-auto scrollbar-hide border-t border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange?.(tab.value)}
            className={`text-[10px] font-mono px-3 py-1 rounded whitespace-nowrap transition-colors ${
              activeTab === tab.value
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
