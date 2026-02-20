import { DashboardPanel } from "../DashboardPanel";
import { StatCard } from "../StatCard";
import { StatusList } from "../StatusList";
import { Gauge } from "../Gauge";
import { Shield, AlertTriangle, Landmark, Newspaper, MapPin } from "lucide-react";

const radarPoints = [
  { name: "Bodrum - Milas Arası", lat: 37.28, lng: 27.67, type: "radar" },
  { name: "Marmaris Giriş D400", lat: 36.85, lng: 28.27, type: "radar" },
  { name: "Fethiye - Göcek Arası", lat: 36.65, lng: 29.12, type: "radar" },
  { name: "Muğla - Yatağan Yolu", lat: 37.18, lng: 28.33, type: "radar" },
  { name: "Dalaman Havalimanı Çevresi", lat: 36.71, lng: 28.79, type: "denetim" },
  { name: "Ortaca - Dalyan Kavşağı", lat: 36.84, lng: 28.76, type: "denetim" },
  { name: "Datça Yarımada Girişi", lat: 36.73, lng: 27.69, type: "denetim" },
  { name: "Köyceğiz - Muğla Yolu", lat: 37.07, lng: 28.65, type: "radar" },
  { name: "Milas Şehir İçi", lat: 37.32, lng: 27.78, type: "denetim" },
  { name: "Ula - Muğla Bağlantısı", lat: 37.10, lng: 28.41, type: "radar" },
];

const TrafficMap = () => {
  // Simple SVG-based map of Muğla region
  const mapWidth = 400;
  const mapHeight = 280;
  const minLat = 36.5, maxLat = 37.5;
  const minLng = 27.3, maxLng = 29.5;

  const toX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * (mapWidth - 40) + 20;
  const toY = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * (mapHeight - 40) + 20;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="w-full h-auto" style={{ minHeight: 200 }}>
        {/* Background */}
        <rect width={mapWidth} height={mapHeight} fill="hsl(var(--background))" rx="4" />
        
        {/* Region outline (simplified Muğla shape) */}
        <path
          d={`M ${toX(27.4)} ${toY(37.4)} 
              L ${toX(28.0)} ${toY(37.45)} 
              L ${toX(28.8)} ${toY(37.35)} 
              L ${toX(29.3)} ${toY(37.1)} 
              L ${toX(29.4)} ${toY(36.8)} 
              L ${toX(29.2)} ${toY(36.55)} 
              L ${toX(28.7)} ${toY(36.6)} 
              L ${toX(28.2)} ${toY(36.75)} 
              L ${toX(27.8)} ${toY(36.65)} 
              L ${toX(27.4)} ${toY(36.7)} 
              L ${toX(27.35)} ${toY(37.0)} 
              Z`}
          fill="hsl(var(--muted) / 0.3)"
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />

        {/* Grid lines */}
        {[27.5, 28.0, 28.5, 29.0].map(lng => (
          <line key={`lng-${lng}`} x1={toX(lng)} y1={20} x2={toX(lng)} y2={mapHeight - 20}
            stroke="hsl(var(--border) / 0.3)" strokeWidth="0.5" strokeDasharray="3,3" />
        ))}
        {[36.7, 37.0, 37.3].map(lat => (
          <line key={`lat-${lat}`} x1={20} y1={toY(lat)} x2={mapWidth - 20} y2={toY(lat)}
            stroke="hsl(var(--border) / 0.3)" strokeWidth="0.5" strokeDasharray="3,3" />
        ))}

        {/* Points */}
        {radarPoints.map((p, i) => (
          <g key={i}>
            {/* Pulse animation */}
            <circle cx={toX(p.lng)} cy={toY(p.lat)} r="8"
              fill={p.type === "radar" ? "hsl(var(--destructive) / 0.15)" : "hsl(var(--warning) / 0.15)"}
              className="animate-pulse" />
            {/* Dot */}
            <circle cx={toX(p.lng)} cy={toY(p.lat)} r="3.5"
              fill={p.type === "radar" ? "hsl(var(--destructive))" : "hsl(var(--warning))"}
              stroke="hsl(var(--background))" strokeWidth="1" />
            {/* Label */}
            <text x={toX(p.lng)} y={toY(p.lat) - 8}
              textAnchor="middle" fontSize="5" fontFamily="monospace"
              fill="hsl(var(--muted-foreground))">
              {p.name.length > 20 ? p.name.substring(0, 18) + "…" : p.name}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
          <span className="text-[10px] font-mono text-muted-foreground">Radar Noktası</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-warning" />
          <span className="text-[10px] font-mono text-muted-foreground">Trafik Denetim</span>
        </div>
      </div>
    </div>
  );
};

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

    <DashboardPanel title="Radar & Trafik Denetim Haritası" icon={<MapPin size={14} />} badge="CANLI" badgeVariant="live">
      <TrafficMap />
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <StatCard label="Aktif Radar" value={`${radarPoints.filter(p => p.type === "radar").length}`} variant="destructive" />
        <StatCard label="Denetim Noktası" value={`${radarPoints.filter(p => p.type === "denetim").length}`} variant="warning" />
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
