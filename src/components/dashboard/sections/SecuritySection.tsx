import { DashboardPanel } from "../DashboardPanel";
import { StatCard } from "../StatCard";
import { StatusList } from "../StatusList";
import { Gauge } from "../Gauge";
import { Shield, AlertTriangle, Landmark, Newspaper } from "lucide-react";

export const SecuritySection = () => (
  <div className="space-y-3">
    <DashboardPanel title="Güvenlik" icon={<Shield size={14} />} badge="AKTİF" badgeVariant="active">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatCard label="Asayiş Olayı (Ay)" value="485" variant="primary" />
        <StatCard label="Trafik Kazası (Ay)" value="128" variant="warning" />
      </div>
      <div className="flex justify-around">
        <Gauge value={78} max={100} label="Güvenlik Skoru" variant="primary" />
        <Gauge value={22} max={100} label="Suç Oranı İndeks" variant="primary" />
      </div>
    </DashboardPanel>

    <DashboardPanel title="Acil Durum" icon={<AlertTriangle size={14} />} badge="NORMAL" badgeVariant="active">
      <StatusList items={[
        { label: "Deprem Riski", value: "ORTA", status: "warning" },
        { label: "Sel Riski", value: "DÜŞÜK", status: "ok" },
        { label: "Yangın Riski", value: "DÜŞÜK", status: "ok" },
        { label: "Kriz Yönetimi", value: "HAZIR", status: "ok" },
        { label: "Aktif Uyarı", value: "YOK", status: "ok" },
      ]} />
    </DashboardPanel>

    <DashboardPanel title="Yerel Yönetim" icon={<Landmark size={14} />}>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <StatCard label="Belediye Bütçesi" value="8.2" unit="Myr ₺" />
        <StatCard label="Yatırım" value="1.4" unit="Myr ₺" variant="primary" />
      </div>
      <StatusList items={[
        { label: "Altyapı Harcama", value: "32%", status: "ok" },
        { label: "Sosyal Hizmetler", value: "18%", status: "info" },
        { label: "Kültür & Sanat", value: "8%", status: "info" },
        { label: "Şeffaflık Skoru", value: "72/100", status: "ok" },
        { label: "Meclis Kararları", value: "48 karar", status: "info" },
      ]} />
    </DashboardPanel>

    <DashboardPanel title="Haber Akışı" icon={<Newspaper size={14} />} badge="CANLI" badgeVariant="live">
      <div className="space-y-2">
        {[
          { time: "14:32", text: "Bodrum'da yeni marina projesi onaylandı", type: "info" as const },
          { time: "12:15", text: "Marmaris'te orman yangını riski düşük seviyede", type: "ok" as const },
          { time: "10:45", text: "Fethiye belediyesi bisiklet yolu ihalesini açıkladı", type: "info" as const },
          { time: "09:20", text: "Dalaman Havalimanı sezon hazırlıkları tamamlandı", type: "ok" as const },
          { time: "08:00", text: "Muğla'da hava kalitesi 'İYİ' seviyesinde", type: "ok" as const },
        ].map((news, i) => (
          <div key={i} className="flex items-start gap-2 py-1.5 px-2 rounded bg-muted/20 hover:bg-muted/40 transition-colors">
            <span className="text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5">{news.time}</span>
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${news.type === "ok" ? "bg-success" : "bg-accent"}`} />
            <span className="text-xs text-foreground/80">{news.text}</span>
          </div>
        ))}
      </div>
    </DashboardPanel>
  </div>
);
