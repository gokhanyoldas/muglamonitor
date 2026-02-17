import { DashboardPanel } from "../DashboardPanel";
import { StatCard } from "../StatCard";
import { StatusList } from "../StatusList";
import { MiniChart } from "../MiniChart";
import { Car, PlaneTakeoff, Ship } from "lucide-react";

const airportData = [
  { name: "Oca", value: 120 }, { name: "Şub", value: 135 }, { name: "Mar", value: 180 },
  { name: "Nis", value: 280 }, { name: "May", value: 420 }, { name: "Haz", value: 580 },
  { name: "Tem", value: 720 }, { name: "Ağu", value: 750 }, { name: "Eyl", value: 480 },
  { name: "Eki", value: 280 }, { name: "Kas", value: 150 }, { name: "Ara", value: 110 },
];

export const TransportSection = () => (
  <div className="space-y-3">
    <DashboardPanel title="Ulaşım" icon={<Car size={14} />} badge="CANLI" badgeVariant="live" count={6}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <StatCard label="Trafik Yoğunluk" value="42" unit="%" variant="primary" />
        <StatCard label="Günlük Araç" value="285K" />
        <StatCard label="Kaza (Ay)" value="128" variant="warning" />
      </div>
      <StatusList items={[
        { label: "Muğla-Bodrum Yolu", value: "NORMAL", status: "ok" },
        { label: "Muğla-Fethiye Yolu", value: "YOĞUN", status: "warning" },
        { label: "Muğla-Marmaris Yolu", value: "NORMAL", status: "ok" },
        { label: "Otobüs Seferleri", value: "124/gün", status: "ok" },
        { label: "Feribot Seferleri", value: "18/gün", status: "ok" },
      ]} />
    </DashboardPanel>

    <DashboardPanel title="Havalimanları" icon={<PlaneTakeoff size={14} />} badge="AKTİF" badgeVariant="active">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatCard label="DLM Havalimanı" value="2.8M" unit="yolcu/yıl" variant="accent" />
        <StatCard label="BJV Havalimanı" value="1.4M" unit="yolcu/yıl" variant="accent" />
      </div>
      <span className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Aylık Yolcu (bin)</span>
      <MiniChart data={airportData} color="hsl(200, 80%, 50%)" height={50} showAxis />
    </DashboardPanel>

    <DashboardPanel title="Altyapı Projeleri" badge="DEVAM" badgeVariant="warning">
      <StatusList items={[
        { label: "Muğla Çevreyolu", value: "78%", status: "ok" },
        { label: "Bodrum Marina Genişleme", value: "45%", status: "warning" },
        { label: "Fethiye Alt Geçit", value: "92%", status: "ok" },
        { label: "Akıllı Kavşak Sistemi", value: "33%", status: "warning" },
        { label: "Bisiklet Yolu Ağı", value: "15%", status: "critical" },
      ]} />
    </DashboardPanel>
  </div>
);
