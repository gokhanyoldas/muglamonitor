import { DashboardPanel } from "../DashboardPanel";
import { UserCheck, Crown, Loader2, AlertTriangle } from "lucide-react";
import { useLiveData } from "@/hooks/useLiveData";

type ProtocolMember = {
  title: string;
  name: string;
  isNew?: boolean;
  changedDate?: string;
};

const fallbackProtocol: ProtocolMember[] = [
  { title: "Vali", name: "Dr. İdris AKBIYIK" },
  { title: "Büyükşehir Belediye Başkanı", name: "Ahmet ARAS" },
  { title: "Cumhuriyet Başsavcısı", name: "Oğuzhan DÖNMEZ" },
  { title: "İl Emniyet Müdürü", name: "Süleyman KARADENİZ" },
  { title: "İl Jandarma Komutanı", name: "Tuğgeneral Adem ŞEN" },
  { title: "Muğla Sıtkı Koçman Üniversitesi Rektörü", name: "Prof. Dr. Turhan KAÇAR" },
  { title: "Bodrum Kaymakamı", name: "Ali SIRMALI" },
  { title: "Dalaman Kaymakamı", name: "Mesut YAKUTA" },
  { title: "Datça Kaymakamı", name: "Murat ATICI" },
  { title: "Fethiye Kaymakamı", name: "Fatih AKKAYA" },
  { title: "Kavaklıdere Kaymakamı", name: "Ali ARGAMA" },
  { title: "Köyceğiz Kaymakamı", name: "Mert KUMCU" },
  { title: "Marmaris Kaymakamı", name: "Nurullah KAYA" },
  { title: "Menteşe Kaymakamı", name: "Mehmet ERİŞ" },
  { title: "Milas Kaymakamı", name: "Mustafa Ünver BÖKE" },
  { title: "Ortaca Kaymakamı", name: "Kenan AKTAŞ" },
  { title: "Seydikemer Kaymakamı", name: "Mustafa DİLEKLİ" },
  { title: "Ula Kaymakamı", name: "Mehmet Rıdvan DOĞAN" },
  { title: "Yatağan Kaymakamı", name: "Turgay İLHAN" },
];

export const ProtocolSection = () => {
  const { data: liveProtocol, isLoading, isError } = useLiveData<any>("protocol", { refetchInterval: 60 * 60 * 1000 });

  const protocolList: ProtocolMember[] = Array.isArray(liveProtocol) && liveProtocol.length > 0
    ? liveProtocol.map((p: any) => ({
        title: p.title || "",
        name: p.name || "",
        isNew: p.isNew || false,
        changedDate: p.changedDate,
      }))
    : fallbackProtocol;

  const isLive = Array.isArray(liveProtocol) && liveProtocol.length > 0;

  return (
    <div className="space-y-3">
      <DashboardPanel title="Muğla İl Protokol Listesi" icon={<Crown size={14} />} badge={isLive ? "CANLI" : "VARSAYILAN"} badgeVariant={isLive ? "live" : "info"}>
        <div className="text-[9px] font-mono text-muted-foreground mb-2 flex items-center gap-2">
          <span>Kaynak: mugla.gov.tr</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
          <span>Son güncelleme: {new Date().toLocaleDateString("tr-TR")}</span>
          {isLoading && <Loader2 size={10} className="animate-spin" />}
          {isError && <AlertTriangle size={10} className="text-destructive" />}
        </div>
        <div className="space-y-1">
          {protocolList.map((member, i) => (
            <div
              key={i}
              className={`flex items-center justify-between py-2 px-2.5 rounded transition-colors ${
                member.isNew
                  ? "bg-primary/10 border border-primary/30 animate-protocol-flash"
                  : "bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck size={12} className={member.isNew ? "text-primary" : "text-muted-foreground"} />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground block">{member.title}</span>
                  <span className={`text-xs font-mono font-semibold block truncate ${
                    member.isNew ? "text-primary" : "text-foreground/90"
                  }`}>{member.name}</span>
                </div>
              </div>
              {member.isNew && (
                <span className="text-[8px] font-mono font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded animate-pulse shrink-0">
                  YENİ ATAMA
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="text-[8px] font-mono text-muted-foreground mt-2 text-right">
          {protocolList.length} kayıt • {isLive ? "Valilik web sitesinden canlı çekildi" : "Önbellek verisi"}
        </div>
      </DashboardPanel>
    </div>
  );
};
