import { useEffect, useState } from "react";
import { osintDataManager } from "@/services/osint-data-manager";
import { IntelligenceFeed } from "@/components/intelligence/IntelligenceFeed";
import { LiveMap } from "@/components/intelligence/LiveMap";
import { AnomalyAlertSystem } from "@/components/intelligence/AnomalyAlertSystem";
import { CircleAlert as AlertCircle, RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function OSINTDashboard() {
  const [stats, setStats] = useState({
    totalItems: 0,
    criticalItems: 0,
    sourceCount: 0,
    lastUpdate: Date.now(),
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataFreshness, setDataFreshness] = useState<string | null>(null);

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStats = () => {
    const feed = osintDataManager.getIntelligenceFeed();
    const critical = osintDataManager.getCriticalItems();
    const sources = osintDataManager.getSources();
    const health = osintDataManager.getHealthStatus();

    setStats({
      totalItems: feed.length,
      criticalItems: critical.length,
      sourceCount: Object.keys(health).length,
      lastUpdate: Date.now(),
    });

    const oldestUpdate = Math.min(
      ...Object.values(health)
        .filter((s) => s.lastUpdate)
        .map((s) => s.lastUpdate)
    );

    if (oldestUpdate) {
      const age = Date.now() - oldestUpdate;
      if (age < 60000) setDataFreshness("Canlı");
      else if (age < 300000) setDataFreshness("Az eski");
      else setDataFreshness("Eski veriler gösteriliyor");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1500));
    updateStats();
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <AnomalyAlertSystem />

      {dataFreshness === "Eski veriler gösteriliyor" && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-950/50 border border-yellow-700/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-300">Veri Uyarısı</p>
            <p className="text-xs text-yellow-200/70 mt-0.5">
              Son başarılı veriler gösteriliyor. Gerçek zamanlı veri henüz güncellenemedi.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Database className="w-6 h-6 text-white" />
              </div>
              Muğla Monitör
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              OSINT & Yerel İstihbarat Dashboard
            </p>
          </div>

          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Yenileniyor..." : "Yenile"}
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Toplam Bildirim
            </p>
            <p className="text-2xl font-bold text-slate-100 mt-1">
              {stats.totalItems}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-red-950/50 border border-red-700/50">
            <p className="text-xs font-semibold text-red-300 uppercase">
              Kritik Uyarılar
            </p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              {stats.criticalItems}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Aktif Kaynaklar
            </p>
            <p className="text-2xl font-bold text-slate-100 mt-1">
              {stats.sourceCount}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-blue-950/50 border border-blue-700/50">
            <p className="text-xs font-semibold text-blue-300 uppercase">
              Veri Durumu
            </p>
            <Badge
              className={`mt-1 text-xs ${
                dataFreshness === "Canlı"
                  ? "bg-green-600"
                  : dataFreshness === "Az eski"
                    ? "bg-yellow-600"
                    : "bg-red-600"
              }`}
            >
              {dataFreshness || "Kontrol Ediliyor"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-96">
            <LiveMap />
          </div>
        </div>

        <div className="h-96">
          <IntelligenceFeed />
        </div>
      </div>

      <div className="mt-6 p-4 rounded-lg bg-slate-800/30 border border-slate-700 text-xs text-slate-400 space-y-2">
        <p className="font-semibold text-slate-300">Sistem Bilgileri</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Veri kaynakları: Google Alerts (Gmail), RSS Feeds</li>
          <li>Güncelleme aralığı: Her 5-15 dakika</li>
          <li>Duygu analizi: Client-side işleme</li>
          <li>Anomali tespiti: Real-time</li>
        </ul>
      </div>
    </div>
  );
}
