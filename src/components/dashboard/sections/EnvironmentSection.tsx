import { DashboardPanel } from "../DashboardPanel";
import { StatCard } from "../StatCard";
import { Gauge } from "../Gauge";
import { StatusList } from "../StatusList";
import { TreePine, Droplets, Wind } from "lucide-react";

export const EnvironmentSection = () => (
  <div className="space-y-3">
    <DashboardPanel title="Hava & İklim" icon={<Wind size={14} />} badge="CANLI" badgeVariant="live">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <StatCard label="Sıcaklık" value="14" unit="°C" variant="primary" />
        <StatCard label="Nem" value="68" unit="%" />
        <StatCard label="Rüzgar" value="22" unit="km/h" />
        <StatCard label="UV İndeksi" value="3" variant="accent" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Deniz Suyu" value="16" unit="°C" variant="accent" />
        <StatCard label="Dalga Yüksekliği" value="0.8" unit="m" />
      </div>
    </DashboardPanel>

    <DashboardPanel title="Hava Kalitesi" badge="İYİ" badgeVariant="active">
      <div className="flex justify-around">
        <Gauge value={42} max={100} label="AQI" variant="primary" />
        <Gauge value={15} max={50} label="PM2.5" variant="primary" />
        <Gauge value={28} max={100} label="PM10" variant="primary" />
      </div>
    </DashboardPanel>

    <DashboardPanel title="Su & Orman" icon={<Droplets size={14} />} badge="AKTİF" badgeVariant="active">
      <div className="flex justify-around mb-3">
        <Gauge value={54} max={100} label="Baraj Doluluk" variant="warning" />
        <Gauge value={72} max={100} label="Orman Alan" unit="%" variant="primary" />
      </div>
      <StatusList items={[
        { label: "Yangın Riski", value: "DÜŞÜK", status: "ok" },
        { label: "Yedigöller Barajı", value: "62%", status: "ok" },
        { label: "Mumcular Barajı", value: "48%", status: "warning" },
        { label: "Koruma Alanları", value: "12 bölge", status: "info" },
        { label: "Geri Dönüşüm Oranı", value: "34%", status: "warning" },
      ]} />
    </DashboardPanel>

    <DashboardPanel title="Biyoçeşitlilik" icon={<TreePine size={14} />}>
      <StatusList items={[
        { label: "Endemik Türler", value: "156", status: "info" },
        { label: "Koruma Altında", value: "43 tür", status: "ok" },
        { label: "Caretta Caretta Yuvalama", value: "AKTİF", status: "ok" },
        { label: "Mavi Bayraklı Plaj", value: "87", status: "ok" },
      ]} />
    </DashboardPanel>
  </div>
);
