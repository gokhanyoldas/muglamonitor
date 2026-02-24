import { DashboardPanel } from "../DashboardPanel";
import { StatusList } from "../StatusList";
import { UserCheck, Crown } from "lucide-react";

type ProtocolMember = {
  title: string;
  name: string;
  isNew?: boolean;
  changedDate?: string;
};

const protocolList: ProtocolMember[] = [
  { title: "Muğla Valisi", name: "İdris Akbıyık" },
  { title: "Garnizon Komutanı", name: "Tuğg. Mehmet Yılmaz" },
  { title: "Büyükşehir Belediye Başkanı", name: "Ahmet Aras" },
  { title: "Cumhuriyet Başsavcısı", name: "Ali Rıza Demir" },
  { title: "İl Emniyet Müdürü", name: "Süleyman Suvat Dilberoğlu" },
  { title: "İl Jandarma Komutanı", name: "Alb. Hasan Kılıç" },
  { title: "Rektör (MÜ)", name: "Prof. Dr. Hüseyin Çiçek" },
  { title: "Bodrum Kaymakamı", name: "Bekir Yılmaz", isNew: true, changedDate: "2026-02-18" },
  { title: "Fethiye Kaymakamı", name: "Yusuf Gültekin" },
  { title: "Marmaris Kaymakamı", name: "Ertuğ Şevket Atasoy" },
  { title: "Milas Kaymakamı", name: "Mustafa Ünver Böke" },
  { title: "Dalaman Kaymakamı", name: "Fatih Çobanoğlu" },
  { title: "Datça Kaymakamı", name: "Mesut Çoban" },
  { title: "Köyceğiz Kaymakamı", name: "Erdem Çalışkan" },
  { title: "Ortaca Kaymakamı", name: "Hakan Benli" },
  { title: "Yatağan Kaymakamı", name: "Oğuz Alp Çağlar" },
  { title: "Ula Kaymakamı", name: "Mehmet Fatih Kaya" },
  { title: "Kavaklıdere Kaymakamı", name: "İsmail Hakkı Ertaş" },
  { title: "Seydikemer Kaymakamı", name: "Ahmet Demirtaş", isNew: true, changedDate: "2026-02-20" },
  { title: "Menteşe Kaymakamı", name: "Murat Polat" },
];

const isRecentChange = (changedDate?: string) => {
  if (!changedDate) return false;
  const changed = new Date(changedDate);
  const now = new Date();
  const diffDays = (now.getTime() - changed.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

export const ProtocolSection = () => (
  <div className="space-y-3">
    <DashboardPanel title="Muğla İl Protokol Listesi" icon={<Crown size={14} />} badge="RESMİ" badgeVariant="info">
      <div className="text-[9px] font-mono text-muted-foreground mb-2 flex items-center gap-2">
        <span>Kaynak: Muğla Valiliği</span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground" />
        <span>Son güncelleme: {new Date().toLocaleDateString("tr-TR")}</span>
      </div>
      <div className="space-y-1">
        {protocolList.map((member, i) => {
          const isRecent = isRecentChange(member.changedDate);
          return (
            <div
              key={i}
              className={`flex items-center justify-between py-2 px-2.5 rounded transition-colors ${
                isRecent
                  ? "bg-primary/10 border border-primary/30 animate-protocol-flash"
                  : "bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck size={12} className={isRecent ? "text-primary" : "text-muted-foreground"} />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground block">{member.title}</span>
                  <span className={`text-xs font-mono font-semibold block truncate ${
                    isRecent ? "text-primary" : "text-foreground/90"
                  }`}>{member.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isRecent && (
                  <span className="text-[8px] font-mono font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded animate-pulse">
                    YENİ ATAMA
                  </span>
                )}
                {member.changedDate && (
                  <span className="text-[8px] font-mono text-muted-foreground">{member.changedDate}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  </div>
);
