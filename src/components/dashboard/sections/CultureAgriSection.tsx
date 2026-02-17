import { DashboardPanel } from "../DashboardPanel";
import { StatCard } from "../StatCard";
import { StatusList } from "../StatusList";
import { MiniChart } from "../MiniChart";
import { Wheat, Palette, Landmark } from "lucide-react";

const productionData = [
  { name: "Oca", value: 20 }, { name: "Şub", value: 22 }, { name: "Mar", value: 35 },
  { name: "Nis", value: 48 }, { name: "May", value: 55 }, { name: "Haz", value: 42 },
  { name: "Tem", value: 38 }, { name: "Ağu", value: 35 }, { name: "Eyl", value: 50 },
  { name: "Eki", value: 85 }, { name: "Kas", value: 95 }, { name: "Ara", value: 70 },
];

export const CultureAgriSection = () => (
  <div className="space-y-3">
    <DashboardPanel title="Tarım & Üretim" icon={<Wheat size={14} />} badge="SEZON" badgeVariant="info">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatCard label="Zeytin Üretimi" value="185K" unit="ton" change={4.2} variant="primary" />
        <StatCard label="Narenciye" value="42K" unit="ton" change={-2.1} />
        <StatCard label="Bal Üretimi" value="8.2K" unit="ton" change={6.8} variant="primary" />
        <StatCard label="Tarım Alanı" value="3,450" unit="km²" />
      </div>
      <span className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Aylık Üretim Endeksi</span>
      <MiniChart data={productionData} color="hsl(142, 71%, 45%)" height={50} showAxis />
    </DashboardPanel>

    <DashboardPanel title="Kültür & Etkinlikler" icon={<Palette size={14} />} badge="AKTİF" badgeVariant="active">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatCard label="Aktif Etkinlik" value="24" variant="accent" />
        <StatCard label="Festival (Yıl)" value="38" />
      </div>
      <StatusList items={[
        { label: "Bodrum Bale Festivali", value: "15 Tem", status: "info" },
        { label: "Fethiye Müzik Fest.", value: "22 Tem", status: "info" },
        { label: "Marmaris Uluslar. Yarış", value: "3 Ağu", status: "info" },
        { label: "Milas Zeytin Festivali", value: "12 Kas", status: "info" },
      ]} />
    </DashboardPanel>

    <DashboardPanel title="Kültürel Miras" icon={<Landmark size={14} />}>
      <StatusList items={[
        { label: "UNESCO Alanları", value: "3", status: "ok" },
        { label: "Antik Kentler", value: "12", status: "ok" },
        { label: "Müze & Ören Yeri", value: "28", status: "ok" },
        { label: "Yerel Sanatçı", value: "1,240", status: "info" },
        { label: "Koruma Projesi", value: "8 AKTİF", status: "ok" },
      ]} />
    </DashboardPanel>
  </div>
);
