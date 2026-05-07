import { useEffect, useRef, useState } from "react";
import { DashboardPanel } from "../DashboardPanel";
import { UserCheck, Crown, Loader2, AlertTriangle, ExternalLink, Search, ChevronDown, ChevronUp } from "lucide-react";
import { useLiveData } from "@/hooks/useLiveData";
import { toast } from "@/hooks/use-toast";

type ProtocolMember = {
  title: string;
  name: string;
  isNew?: boolean;
  changedDate?: string;
  socialLink?: string; // Social media post/story URL about the change
  socialSource?: string; // "twitter", "news", etc.
};

// Full Muğla protocol list (Valilik resmi sıralama)
const fallbackProtocol: ProtocolMember[] = [
  // İl Düzeyi
  { title: "Vali", name: "Dr. İdris AKBIYIK" },
  { title: "Büyükşehir Belediye Başkanı", name: "Ahmet ARAS" },
  { title: "Cumhuriyet Başsavcısı", name: "Oğuzhan DÖNMEZ" },
  { title: "İl Emniyet Müdürü", name: "Süleyman KARADENİZ" },
  { title: "İl Jandarma Komutanı", name: "Tuğgeneral Adem ŞEN" },
  { title: "Garnizon Komutanı", name: "Tuğamiral Hasan KUCUR" },
  { title: "Sahil Güvenlik Güney Ege Grup Komutanı", name: "Albay Mustafa TÜRKEL" },
  { title: "Muğla Sıtkı Koçman Üniversitesi Rektörü", name: "Prof. Dr. Turhan KAÇAR" },
  { title: "İl Müftüsü", name: "Mehmet GÜNDOĞDU" },
  { title: "İl Milli Eğitim Müdürü", name: "Emre ÇAY" },
  { title: "İl Sağlık Müdürü", name: "Dr. Mustafa Burak SAYHAN" },
  { title: "İl Tarım ve Orman Müdürü", name: "Barış SAYLAK" },
  { title: "Çevre, Şehircilik ve İklim Değişikliği İl Müdürü", name: "Mehmet BAŞARAN" },
  { title: "Aile ve Sosyal Hizmetler İl Müdürü", name: "İlknur ERİŞ" },
  { title: "Gençlik ve Spor İl Müdürü", name: "Ömer Adil ATALAY" },
  { title: "Kültür ve Turizm İl Müdürü", name: "Funda YALIM" },
  // Kaymakamlar
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
  // İlçe Belediye Başkanları
  { title: "Bodrum Belediye Başkanı", name: "Tamer MANDALINCI" },
  { title: "Dalaman Belediye Başkanı", name: "Muhammet KARAKUŞ" },
  { title: "Datça Belediye Başkanı", name: "Abdullah Gürsel UÇAR" },
  { title: "Fethiye Belediye Başkanı", name: "Alim KARACA" },
  { title: "Kavaklıdere Belediye Başkanı", name: "Mehmet DEMIR" },
  { title: "Köyceğiz Belediye Başkanı", name: "Kamil CEYLAN" },
  { title: "Marmaris Belediye Başkanı", name: "Mehmet OKTAY" },
  { title: "Menteşe Belediye Başkanı", name: "Bahattin GÜMÜŞTEKİN" },
  { title: "Milas Belediye Başkanı", name: "Fevzi TOPUZ" },
  { title: "Ortaca Belediye Başkanı", name: "Alim UZUNDEMIR" },
  { title: "Seydikemer Belediye Başkanı", name: "Yakup OTGÖZ" },
  { title: "Ula Belediye Başkanı", name: "İsmail AKKAYA" },
  { title: "Yatağan Belediye Başkanı", name: "Mustafa TOKSÖZ" },
];

const STORAGE_KEY = "mugla-protocol-snapshot";

function detectChanges(current: ProtocolMember[], previous: Record<string, string>): ProtocolMember[] {
  return current.map((m) => {
    const prevName = previous[m.title];
    if (prevName && prevName !== m.name) {
      return { ...m, isNew: true, changedDate: new Date().toISOString() };
    }
    return m;
  });
}

// Search for social media posts about a protocol change
async function searchSocialLink(title: string, name: string): Promise<{ url: string; source: string } | null> {
  try {
    // Search Google News for the appointment
    const query = encodeURIComponent(`"${name}" "${title.replace("Kaymakamı", "").replace("Belediye Başkanı", "").trim()}" atama`);
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=tr&gl=TR&ceid=TR:tr`;
    
    const resp = await fetch(rssUrl, { 
      headers: { "User-Agent": "MuglaMonitor/1.0" },
      signal: AbortSignal.timeout(5000)
    });
    
    if (resp.ok) {
      const xml = await resp.text();
      const firstItem = xml.match(/<item>([\s\S]*?)<\/item>/);
      if (firstItem) {
        const link = firstItem[1].match(/<link>([\s\S]*?)<\/link>/)?.[1] || "";
        if (link) return { url: link.trim(), source: "news" };
      }
    }
  } catch { /* ignore */ }
  return null;
}

export const ProtocolSection = () => {
  const { data: liveProtocol, isLoading, isError } = useLiveData<any>("protocol", { refetchInterval: 60 * 60 * 1000 });
  const notifiedRef = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, { url: string; source: string }>>({});

  const rawList: ProtocolMember[] = Array.isArray(liveProtocol) && liveProtocol.length > 0
    ? liveProtocol.map((p: any) => ({
        title: p.title || "",
        name: p.name || "",
      }))
    : fallbackProtocol;

  const isLive = Array.isArray(liveProtocol) && liveProtocol.length > 0;

  // Compare with stored snapshot and detect changes
  let protocolList = rawList;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const previous: Record<string, string> = JSON.parse(stored);
      protocolList = detectChanges(rawList, previous);
    }
  } catch { /* ignore */ }

  // Filter by search
  const filteredList = searchTerm
    ? protocolList.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : protocolList;

  // Show limited or full
  const displayList = expanded ? filteredList : filteredList.slice(0, 10);

  // Notify & persist on changes + fetch social links
  useEffect(() => {
    if (notifiedRef.current) return;

    const changes = protocolList.filter((m) => m.isNew);
    if (changes.length > 0) {
      notifiedRef.current = true;
      toast({
        title: `🔔 Protokol Değişikliği (${changes.length})`,
        description: changes.map((c) => `${c.title}: ${c.name}`).join(" • "),
        variant: "default",
      });

      // Fetch social links for new appointments
      changes.forEach(async (change) => {
        const link = await searchSocialLink(change.title, change.name);
        if (link) {
          setSocialLinks(prev => ({ ...prev, [change.title]: link }));
        }
      });
    }

    // Save current snapshot
    const snapshot: Record<string, string> = {};
    rawList.forEach((m) => { snapshot[m.title] = m.name; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [protocolList, rawList]);

  return (
    <div className="space-y-3">
      <DashboardPanel title="Muğla İl Protokol Listesi" icon={<Crown size={14} />} badge={isLive ? "CANLI" : "TAM LİSTE"} badgeVariant={isLive ? "live" : "info"}>
        <div className="text-[9px] font-mono text-muted-foreground mb-2 flex items-center gap-2">
          <span>Kaynak: mugla.gov.tr</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
          <span>{protocolList.length} üye</span>
          {isLoading && <Loader2 size={10} className="animate-spin" />}
          {isError && <AlertTriangle size={10} className="text-destructive" />}
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="İsim veya unvan ara..."
            className="w-full text-[10px] font-mono pl-6 pr-3 py-1.5 rounded bg-muted/20 border border-border/30 focus:outline-none focus:border-primary/40 placeholder:text-muted-foreground/30"
          />
        </div>

        {/* List */}
        <div className="space-y-1">
          {displayList.map((member, i) => (
            <div
              key={i}
              className={`flex items-center justify-between py-2 px-2.5 rounded transition-colors ${
                member.isNew
                  ? "bg-primary/10 border border-primary/30 animate-pulse"
                  : "bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <UserCheck size={12} className={member.isNew ? "text-primary" : "text-muted-foreground"} />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground block">{member.title}</span>
                  <span className={`text-xs font-mono font-semibold block truncate ${
                    member.isNew ? "text-primary" : "text-foreground/90"
                  }`}>{member.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {member.isNew && (
                  <span className="text-[8px] font-mono font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                    YENİ
                  </span>
                )}
                {(member.isNew || member.socialLink || socialLinks[member.title]) && (
                  <a
                    href={member.socialLink || socialLinks[member.title]?.url || `https://www.google.com/search?q=${encodeURIComponent(`"${member.name}" "${member.title}" atama`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[8px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                    title="İlgili haber/sosyal medya kaynağı"
                  >
                    <ExternalLink size={9} />
                    <span>{socialLinks[member.title]?.source || "kaynak"}</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Expand/Collapse */}
        {filteredList.length > 10 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-2 flex items-center justify-center gap-1 text-[9px] font-mono text-primary/70 hover:text-primary py-1.5 rounded bg-muted/10 hover:bg-muted/20 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp size={10} /> Daralt ({filteredList.length - 10} gizle)
              </>
            ) : (
              <>
                <ChevronDown size={10} /> Tümünü Göster (+{filteredList.length - 10} daha)
              </>
            )}
          </button>
        )}

        <div className="text-[8px] font-mono text-muted-foreground mt-2 text-right">
          {filteredList.length} / {protocolList.length} kayıt • {isLive ? "Canlı veri" : "Güncel liste"} • Değişikliklerde otomatik haber linki
        </div>
      </DashboardPanel>
    </div>
  );
};
