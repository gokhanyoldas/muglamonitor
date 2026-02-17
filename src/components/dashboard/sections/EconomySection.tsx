import { DashboardPanel } from "../DashboardPanel";
import { StatCard } from "../StatCard";
import { MiniChart } from "../MiniChart";
import { TrendingUp, Building2, Briefcase } from "lucide-react";

const gdpData = [
  { name: "Oca", value: 82 }, { name: "Şub", value: 85 }, { name: "Mar", value: 88 },
  { name: "Nis", value: 91 }, { name: "May", value: 95 }, { name: "Haz", value: 110 },
  { name: "Tem", value: 125 }, { name: "Ağu", value: 130 }, { name: "Eyl", value: 115 },
  { name: "Eki", value: 100 }, { name: "Kas", value: 92 }, { name: "Ara", value: 88 },
];

const realEstateData = [
  { name: "Oca", value: 12500 }, { name: "Şub", value: 12800 }, { name: "Mar", value: 13200 },
  { name: "Nis", value: 14000 }, { name: "May", value: 15200 }, { name: "Haz", value: 16800 },
  { name: "Tem", value: 17500 }, { name: "Ağu", value: 17200 }, { name: "Eyl", value: 16500 },
  { name: "Eki", value: 15800 }, { name: "Kas", value: 15200 }, { name: "Ara", value: 14800 },
];

export const EconomySection = () => (
  <div className="space-y-3">
    <DashboardPanel title="Ekonomi & İstihdam" icon={<TrendingUp size={14} />} badge="CANLI" badgeVariant="live" count={8}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <StatCard label="İşsizlik" value="11.2" unit="%" change={-0.8} variant="primary" />
        <StatCard label="Turizm Geliri" value="4.8" unit="Myr ₺" change={12.5} variant="primary" />
        <StatCard label="Yeni Şirket" value="342" change={5.2} variant="accent" />
        <StatCard label="KOBİ Sayısı" value="18.5K" change={2.1} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Turizm Gelir Endeksi</span>
          <MiniChart data={gdpData} color="hsl(160, 60%, 45%)" showAxis />
        </div>
        <div>
          <span className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Sektör Dağılımı</span>
          <div className="space-y-1.5 mt-1">
            {[
              { label: "Turizm & Hizmet", pct: 62 },
              { label: "Tarım", pct: 18 },
              { label: "İnşaat", pct: 12 },
              { label: "Sanayi", pct: 8 },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-24 shrink-0">{s.label}</span>
                <div className="flex-1 bg-muted/30 rounded-full h-1.5">
                  <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${s.pct}%` }} />
                </div>
                <span className="text-[10px] font-mono text-foreground w-8 text-right">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardPanel>

    <DashboardPanel title="Gayrimenkul" icon={<Building2 size={14} />} badge="AKTİF" badgeVariant="active">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <StatCard label="Konut m² Fiyat" value="42.5K" unit="₺" change={18.3} variant="warning" />
        <StatCard label="Kira Ort." value="15.2K" unit="₺/ay" change={22.1} variant="destructive" />
        <StatCard label="Satılık" value="8,420" change={-3.2} />
        <StatCard label="Kiralık" value="2,180" change={-12.5} />
      </div>
      <MiniChart data={realEstateData} color="hsl(38, 92%, 50%)" height={50} showAxis />
    </DashboardPanel>
  </div>
);
