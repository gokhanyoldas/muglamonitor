import { IntelligenceItem } from "./osint-data-manager";

export const generateMuglaSampleData = (): IntelligenceItem[] => {
  const now = Date.now();

  const criticalItems: IntelligenceItem[] = [
    {
      id: "critical_1",
      title: "UYARI: Marmaris'te yangın söndürme çalışması başladı",
      source: "Muğla Valilik",
      category: "threat",
      sentiment: "critical",
      importance: "critical",
      date: now - 15000,
      content:
        "Marmaris İçmeler mevkiinde çıkan yangın için hava ve kara müdahale devam ediyor. Bölge sakinleri uyarılmıştır.",
      location: "Marmaris",
      tags: ["yangın", "acil", "marmaris"],
      confidence: 0.98,
      link: "https://example.com",
    },
    {
      id: "critical_2",
      title: "KRİTİK: Bodrum Limanı'nda güvenlik olayı",
      source: "Haber Ajansı",
      category: "alert",
      sentiment: "critical",
      importance: "critical",
      date: now - 45000,
      content: "Bodrum Limanı'nda şüpheli bir paket tespit edildi. Güvenlik güçleri bölgeye sevk edildi.",
      location: "Bodrum",
      tags: ["güvenlik", "liman", "bodrum"],
      confidence: 0.95,
      link: "https://example.com",
    },
  ];

  const highImportanceItems: IntelligenceItem[] = [
    {
      id: "high_1",
      title: "Fethiye'de trafik kazası: 2 yaralı",
      source: "Yerel Medya",
      category: "news",
      sentiment: "negative",
      importance: "high",
      date: now - 120000,
      content: "Fethiye - Ölüdeniz yolunda meydana gelen kazada 2 kişi yaralandı. Ambulans olay yerine yönlendirildi.",
      location: "Fethiye",
      tags: ["trafik", "kaza", "fethiye"],
      confidence: 0.92,
      link: "https://example.com",
    },
    {
      id: "high_2",
      title: "Milas Belediyesi flaş duyuru: Su kesintisi 24 saat",
      source: "Sosyal Medya",
      category: "alert",
      sentiment: "negative",
      importance: "high",
      date: now - 180000,
      content:
        "Milas bölgesinde su arıza nedeniyle 24 saatlik kesinti yaşanacak. Vatandaşlardan su tasarrufu yapılması isteniyor.",
      location: "Milas",
      tags: ["su", "kesinti", "milas"],
      confidence: 0.88,
      link: "https://example.com",
    },
    {
      id: "high_3",
      title: "Datça'da balıkçıların ekonomik sıkıntısı artıyor",
      source: "Kamu Kurumu",
      category: "news",
      sentiment: "negative",
      importance: "high",
      date: now - 240000,
      content:
        "Datça bölgesinde balık av sezonunun kötü gitmesi nedeniyle balıkçılar zor durumda. Yardım paketleri hazırlanıyor.",
      location: "Datça",
      tags: ["ekonomi", "balıkçılık", "datça"],
      confidence: 0.85,
      link: "https://example.com",
    },
  ];

  const mediumImportanceItems: IntelligenceItem[] = [
    {
      id: "medium_1",
      title: "Muğla'da turizmde sezonu hareketlilik başladı",
      source: "Turizm Birliği",
      category: "news",
      sentiment: "positive",
      importance: "medium",
      date: now - 300000,
      content: "Muğla'ya turist akını başladı. Otelciler yüksek doluluk oranlarından memnun.",
      location: "Muğla",
      tags: ["turizm", "ekonomi"],
      confidence: 0.8,
      link: "https://example.com",
    },
    {
      id: "medium_2",
      title: "Ortaca çiftçileri organik üretim projesine başlıyor",
      source: "Yerel Basın",
      category: "opportunity",
      sentiment: "positive",
      importance: "medium",
      date: now - 360000,
      content:
        "Ortaca bölgesinin çiftçileri organik tarım projesi kapsamında eğitim almaya başladılar.",
      location: "Ortaca",
      tags: ["tarım", "organik", "ortaca"],
      confidence: 0.82,
      link: "https://example.com",
    },
  ];

  const lowImportanceItems: IntelligenceItem[] = [
    {
      id: "low_1",
      title: "Menteşe'de kültür merkezi açılışı yapılacak",
      source: "Haber",
      category: "news",
      sentiment: "neutral",
      importance: "low",
      date: now - 420000,
      content:
        "Menteşe ilçesinde yeni kültür merkezi açılışı için hazırlıklar tamamlandı.",
      location: "Menteşe",
      tags: ["kültür"],
      confidence: 0.75,
      link: "https://example.com",
    },
    {
      id: "low_2",
      title: "Seydikemer'de festival planlanıyor",
      source: "Turizm",
      category: "news",
      sentiment: "neutral",
      importance: "low",
      date: now - 480000,
      content: "Seydikemer bölgesinde yaz festivali için hazırlıklara başlandı.",
      location: "Seydikemer",
      tags: ["festival"],
      confidence: 0.7,
      link: "https://example.com",
    },
  ];

  return [
    ...criticalItems,
    ...highImportanceItems,
    ...mediumImportanceItems,
    ...lowImportanceItems,
  ];
};

export const getCategoryStats = (items: IntelligenceItem[]) => {
  const stats = {
    security: { count: 0, items: [] as IntelligenceItem[] },
    weather: { count: 0, items: [] as IntelligenceItem[] },
    economy: { count: 0, items: [] as IntelligenceItem[] },
    health: { count: 0, items: [] as IntelligenceItem[] },
  };

  items.forEach((item) => {
    const location = item.location?.toLowerCase() || "";
    const title = item.title.toLowerCase();
    const content = item.content?.toLowerCase() || "";

    if (
      title.includes("güvenlik") ||
      title.includes("polis") ||
      title.includes("yangın") ||
      title.includes("kaza") ||
      content.includes("güvenlik")
    ) {
      stats.security.count++;
      stats.security.items.push(item);
    } else if (
      title.includes("hava") ||
      title.includes("fırtına") ||
      title.includes("yağış") ||
      title.includes("sıcak")
    ) {
      stats.weather.count++;
      stats.weather.items.push(item);
    } else if (
      title.includes("ekonomi") ||
      title.includes("turizm") ||
      title.includes("tarım") ||
      title.includes("işsizlik")
    ) {
      stats.economy.count++;
      stats.economy.items.push(item);
    } else if (
      title.includes("sağlık") ||
      title.includes("hastalık") ||
      title.includes("aşı") ||
      title.includes("virüs")
    ) {
      stats.health.count++;
      stats.health.items.push(item);
    }
  });

  return stats;
};
