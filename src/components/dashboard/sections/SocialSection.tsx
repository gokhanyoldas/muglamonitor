import { DashboardPanel } from "../DashboardPanel";
import { StatCard } from "../StatCard";
import { StatusList } from "../StatusList";
import { Gauge } from "../Gauge";
import { Users, GraduationCap, HeartPulse, Scale } from "lucide-react";

export const SocialSection = () => (
  <div className="space-y-3">
    <DashboardPanel title="Nüfus & Demografi" icon={<Users size={14} />} badge="2025" badgeVariant="info">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <StatCard label="Nüfus" value="1.02M" change={1.8} variant="primary" />
        <StatCard label="Yoğunluk" value="79" unit="kişi/km²" />
        <StatCard label="Medyan Yaş" value="38.5" />
        <StatCard label="Yabancı Nüfus" value="42K" change={8.2} variant="accent" />
      </div>
      <StatusList items={[
        { label: "Göç Dengesi", value: "+12,400", status: "ok" },
        { label: "Kentsel Nüfus", value: "58%", status: "info" },
        { label: "Kırsal Nüfus", value: "42%", status: "info" },
        { label: "Sezon Artışı", value: "+380K", status: "warning" },
      ]} />
    </DashboardPanel>

    <DashboardPanel title="Eğitim" icon={<GraduationCap size={14} />}>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatCard label="Okullaşma" value="98.2" unit="%" variant="primary" />
        <StatCard label="Üniversite Öğrenci" value="52K" />
        <StatCard label="LGS Başarı" value="68. sıra" />
        <StatCard label="YKS Başarı" value="42. sıra" />
      </div>
    </DashboardPanel>

    <DashboardPanel title="Sağlık" icon={<HeartPulse size={14} />}>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatCard label="Hastane" value="18" />
        <StatCard label="Doktor" value="2,840" />
        <StatCard label="Yatak Kapasitesi" value="4,200" />
        <StatCard label="Eczane" value="385" />
      </div>
      <div className="flex justify-around">
        <Gauge value={68} max={100} label="Kapasite Kullanım" variant="warning" />
        <Gauge value={85} max={100} label="Sezon Kullanım" variant="destructive" />
      </div>
    </DashboardPanel>

    <DashboardPanel title="Yaşam Kalitesi" icon={<Scale size={14} />}>
      <div className="flex justify-around mb-3">
        <Gauge value={72} max={100} label="Yaşam Endeksi" variant="primary" />
        <Gauge value={65} max={100} label="Güvenlik" variant="primary" />
        <Gauge value={78} max={100} label="Memnuniyet" variant="primary" />
      </div>
    </DashboardPanel>
  </div>
);
