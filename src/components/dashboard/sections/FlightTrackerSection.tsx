import { useState, useEffect, useCallback } from "react";
import { DashboardPanel } from "../DashboardPanel";
import { PlaneTakeoff, RefreshCw, Loader2, Radar, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type LiveFlight = {
  callsign: string;
  origin_country: string;
  altitude: number | null;
  velocity: number | null;
  heading: number | null;
  on_ground: boolean;
  distance_km: number;
  latitude: number;
  longitude: number;
};

type AirportLiveData = {
  code: string;
  name: string;
  departures: LiveFlight[];
  arrivals: LiveFlight[];
  overhead: LiveFlight[];
};

const headingToDirection = (h: number | null): string => {
  if (h === null) return "—";
  const dirs = ["K", "KD", "D", "GD", "G", "GB", "B", "KB"];
  return dirs[Math.round(h / 45) % 8];
};

const FlightRow = ({ flight, type }: { flight: LiveFlight; type: "dep" | "arr" | "over" }) => (
  <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/10 hover:bg-muted/25 transition-colors text-[10px] font-mono">
    <span className="w-16 font-bold text-foreground">{flight.callsign || "—"}</span>
    <span className="w-14 text-muted-foreground truncate">{flight.origin_country}</span>
    <span className="flex-1 text-foreground/80">
      {flight.altitude ? `${flight.altitude}m` : "Yerde"} • {flight.velocity ? `${flight.velocity} km/h` : "—"}
    </span>
    <span className="w-8 text-center text-accent">{headingToDirection(flight.heading)}</span>
    <span className="w-12 text-center text-muted-foreground">{flight.distance_km} km</span>
    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
      type === "dep" ? "text-accent bg-accent/15" :
      type === "arr" ? "text-success bg-success/15" :
      "text-primary bg-primary/15"
    }`}>
      {type === "dep" ? "KALKIŞ" : type === "arr" ? "İNİŞ" : "GEÇİŞ"}
    </span>
  </div>
);

export const FlightTrackerSection = () => {
  const [airports, setAirports] = useState<AirportLiveData[]>([
    { code: "DLM", name: "Dalaman Havalimanı", departures: [], arrivals: [], overhead: [] },
    { code: "BJV", name: "Milas-Bodrum Havalimanı", departures: [], arrivals: [], overhead: [] },
  ]);
  const [selectedAirport, setSelectedAirport] = useState(0);
  const [viewMode, setViewMode] = useState<"all" | "dep" | "arr">("all");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [totalAircraft, setTotalAircraft] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [lastUpdateTs, setLastUpdateTs] = useState<Date | null>(null);
  const [source, setSource] = useState("adsb.lol");

  const fetchLiveData = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const { data, error } = await supabase.functions.invoke("transport-scrape", {
        body: { type: "flights" },
      });
      if (!error && data?.airports?.length) {
        setAirports(data.airports);
        setTotalAircraft(data.total_aircraft || 0);
        setSource(data.source || "adsb.lol");
        const now = new Date();
        setLastUpdate(now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
        setLastUpdateTs(now);
      } else if (error) {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 15_000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  const airport = airports[selectedAirport];
  const allFlights = [
    ...airport.departures.map(f => ({ ...f, _type: "dep" as const })),
    ...airport.arrivals.map(f => ({ ...f, _type: "arr" as const })),
    ...airport.overhead.map(f => ({ ...f, _type: "over" as const })),
  ];
  const flights = viewMode === "all" ? allFlights :
    viewMode === "dep" ? allFlights.filter(f => f._type === "dep") :
    allFlights.filter(f => f._type === "arr");

  // How stale is the data?
  const isStale = lastUpdateTs ? (Date.now() - lastUpdateTs.getTime()) > 60_000 : false;

  return (
    <DashboardPanel
      title="Uçuş Takip"
      icon={<PlaneTakeoff size={14} />}
      badge="CANLI"
      badgeVariant="live"
      count={totalAircraft > 0 ? totalAircraft : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1">
          {airports.map((ap, i) => (
            <button key={ap.code} onClick={() => setSelectedAirport(i)} className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${selectedAirport === i ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}>{ap.code}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {([["all", "Tümü"], ["dep", "Kalkış"], ["arr", "İniş"]] as const).map(([val, label]) => (
              <button key={val} onClick={() => setViewMode(val)} className={`text-[9px] font-mono px-2 py-0.5 rounded ${viewMode === val ? "bg-accent/20 text-accent" : "text-muted-foreground"}`}>{label}</button>
            ))}
          </div>
          <button onClick={fetchLiveData} disabled={loading} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted/40">
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
        </div>
      </div>

      {/* Source + last-update bar — always visible once first fetch completes */}
      <div className="text-[9px] font-mono text-muted-foreground mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1">
          {fetchError ? (
            <WifiOff size={10} className="text-destructive" />
          ) : (
            <Radar size={10} className={isStale ? "text-yellow-500" : "text-success"} />
          )}
          {airport.name} — {source}
        </span>
        <span className={`flex items-center gap-1 ${isStale ? "text-yellow-500" : ""}`}>
          {loading ? (
            <span className="animate-pulse">Güncelleniyor...</span>
          ) : fetchError ? (
            <span className="text-destructive">Bağlantı hatası</span>
          ) : lastUpdate ? (
            <>⟳ {lastUpdate}</>
          ) : (
            <span className="animate-pulse">Yükleniyor...</span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 px-2 py-1 text-[8px] font-mono text-muted-foreground uppercase tracking-wider border-b border-border/50 mb-1">
        <span className="w-16">Çağrı</span><span className="w-14">Ülke</span><span className="flex-1">Yükseklik • Hız</span><span className="w-8 text-center">Yön</span><span className="w-12 text-center">Mesafe</span><span className="w-14 text-center">Durum</span>
      </div>

      <div className="space-y-1 max-h-[320px] overflow-y-auto">
        {flights.length > 0 ? (
          flights.map((f, i) => <FlightRow key={`${f.callsign}-${i}`} flight={f} type={f._type} />)
        ) : (
          <div className="text-center py-6 space-y-1">
            <p className="text-[10px] text-muted-foreground">
              {loading
                ? "Uçuş verileri yükleniyor..."
                : fetchError
                ? "Veri alınamadı — yeniden dene"
                : "Şu an bölgede takip edilen uçuş yok"}
            </p>
            {!loading && !fetchError && lastUpdate && (
              <p className="text-[9px] text-muted-foreground/50 font-mono">
                ADS-B son tarama: {lastUpdate}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/30 text-[9px] font-mono text-muted-foreground">
        <span className="text-success">↗ Kalkış: {airport.departures.length}</span>
        <span className="text-accent">↙ İniş: {airport.arrivals.length}</span>
        <span className="text-primary">↔ Geçiş: {airport.overhead.length}</span>
        <span className="ml-auto">Toplam bölge: {totalAircraft}</span>
      </div>
    </DashboardPanel>
  );
};
