import { DashboardPanel } from "../DashboardPanel";
import { StatCard } from "../StatCard";
import { StatusList } from "../StatusList";
import { MiniChart } from "../MiniChart";
import { Gauge } from "../Gauge";
import { Radio, MessageCircle, Hash, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const sentimentTrend = [
  { name: "Pzt", value: 65 }, { name: "Sal", value: 72 }, { name: "Çar", value: 58 },
  { name: "Per", value: 80 }, { name: "Cum", value: 74 }, { name: "Cmt", value: 85 }, { name: "Paz", value: 78 },
];

const mentionTrend = [
  { name: "Pzt", value: 120 }, { name: "Sal", value: 185 }, { name: "Çar", value: 142 },
  { name: "Per", value: 210 }, { name: "Cum", value: 198 }, { name: "Cmt", value: 245 }, { name: "Paz", value: 230 },
];

export const SocialIntelSection = () => {
  return (
    <div className="space-y-3">
      <DashboardPanel
        title="Sosyal Medya İstihbaratı"
        icon={<Radio size={14} />}
        badge="AI ANALİZ"
        badgeVariant="info"
      >
        <div className="grid grid-cols-2 gap-2 mb-3">
          <StatCard label="Toplam Bahsetme" value="1,330" change={12} variant="primary" icon={<MessageCircle size={12} />} />
          <StatCard label="Aktif Kelime" value="8" variant="accent" icon={<Hash size={12} />} />
        </div>

        <div className="mb-3">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Haftalık Bahsetme Trendi</div>
          <MiniChart data={mentionTrend} color="hsl(200, 80%, 50%)" height={50} showAxis />
        </div>

        <div className="flex justify-around mb-3">
          <Gauge value={72} max={100} label="Pozitif Oran" variant="primary" />
          <Gauge value={18} max={100} label="Negatif Oran" variant="destructive" />
        </div>

        <StatusList items={[
          { label: "X (Twitter)", value: "520 bahsetme", status: "ok" },
          { label: "Instagram", value: "380 bahsetme", status: "ok" },
          { label: "Facebook", value: "245 bahsetme", status: "info" },
          { label: "YouTube", value: "185 bahsetme", status: "info" },
        ]} />

        <div className="mt-3">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Duygu Analizi Trendi</div>
          <MiniChart data={sentimentTrend} color="hsl(160, 60%, 45%)" height={50} showAxis />
        </div>

        <Link
          to="/social-intel"
          className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-mono text-primary hover:text-primary/80 transition-colors py-1.5 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20"
        >
          <BarChart3 size={12} />
          DETAYLI ANALİZ SAYFASI →
        </Link>
      </DashboardPanel>
    </div>
  );
};
