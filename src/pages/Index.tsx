import { useState } from "react";
import { DashboardHeader, type DashboardTab } from "@/components/dashboard/DashboardHeader";
import { EconomySection } from "@/components/dashboard/sections/EconomySection";
import { EnvironmentSection } from "@/components/dashboard/sections/EnvironmentSection";
import { TourismSection } from "@/components/dashboard/sections/TourismSection";
import { SocialSection } from "@/components/dashboard/sections/SocialSection";
import { TransportSection } from "@/components/dashboard/sections/TransportSection";
import { FlightTrackerSection } from "@/components/dashboard/sections/FlightTrackerSection";
import { BusScheduleSection } from "@/components/dashboard/sections/BusScheduleSection";
import { EnergySection } from "@/components/dashboard/sections/EnergySection";
import { SecuritySection } from "@/components/dashboard/sections/SecuritySection";
import { CultureAgriSection } from "@/components/dashboard/sections/CultureAgriSection";
import { SocialIntelSection } from "@/components/dashboard/sections/SocialIntelSection";
import { GastronomySection } from "@/components/dashboard/sections/GastronomySection";
import { TrafficDensityMap } from "@/components/dashboard/sections/TrafficDensityMap";
import { ProtocolSection } from "@/components/dashboard/sections/ProtocolSection";
import { TrendTopicsSection } from "@/components/dashboard/sections/TrendTopicsSection";
import { LocalGovBudgetSection } from "@/components/dashboard/sections/LocalGovBudgetSection";
import { useLiveData } from "@/hooks/useLiveData";

const sectionComponents: Record<Exclude<DashboardTab, "genel">, React.FC[]> = {
  ekonomi: [EconomySection],
  cevre: [EnvironmentSection],
  turizm: [TourismSection, GastronomySection, CultureAgriSection],
  ulasim: [TrafficDensityMap, FlightTrackerSection, BusScheduleSection, TransportSection],
  sosyal: [TrendTopicsSection, SocialIntelSection, SocialSection],
  guvenlik: [SecuritySection, LocalGovBudgetSection],
  enerji: [EnergySection],
  protokol: [ProtocolSection],
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("genel");

  // Live data hooks for top summary bar
  const { data: weatherData } = useLiveData<any>("weather", { refetchInterval: 15 * 60 * 1000 });
  const { data: ecoData } = useLiveData<any>("economy", { refetchInterval: 30 * 60 * 1000 });
  const { data: aqData } = useLiveData<any>("air_quality", { refetchInterval: 30 * 60 * 1000 });
  const { data: damData } = useLiveData<any>("dams", { refetchInterval: 60 * 60 * 1000 });
  const { data: tourismData } = useLiveData<any>("tourism", { refetchInterval: 60 * 60 * 1000 });
  const { data: demoData } = useLiveData<any>("demographics", { refetchInterval: 24 * 60 * 60 * 1000 });

  // Compute dynamic top bar values
  const population = demoData?.population ?? "1.02M";
  const annualTourists = tourismData?.annual_tourists ?? "3.8M";
  const unemployment = ecoData?.unemployment_rate ? `${ecoData.unemployment_rate}%` : "11.2%";
  const temperature = weatherData?.temperature ? `${weatherData.temperature}°C` : "14°C";
  const aqi = aqData?.aqi ?? 42;
  const hotelOccupancy = tourismData?.hotel_occupancy ? `${tourismData.hotel_occupancy}%` : "38%";

  // Compute average dam level
  const dams = Array.isArray(damData) ? damData : damData?.dams || [];
  const avgDam = dams.length > 0
    ? `${Math.round(dams.reduce((a: number, d: any) => a + (d.occupancy_rate ?? d.rate ?? 50), 0) / dams.length)}%`
    : "54%";

  const isGenel = activeTab === "genel";

  return (
    <div className="min-h-screen bg-background scanline">
      <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="p-3 max-w-[1800px] mx-auto">
        {/* Top summary bar - LIVE */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
          {[
            { label: "Nüfus", value: population, color: "text-primary" },
            { label: "Turist/Yıl", value: annualTourists, color: "text-accent" },
            { label: "İşsizlik", value: unemployment, color: "text-warning" },
            { label: "Hava", value: temperature, color: "text-foreground" },
            { label: "AQI", value: String(aqi), color: "text-success" },
            { label: "Otel Doluluk", value: hotelOccupancy, color: "text-accent" },
            { label: "Baraj", value: avgDam, color: "text-warning" },
            { label: "Güvenlik", value: "78/100", color: "text-primary" },
          ].map((item) => (
            <div key={item.label} className="bg-secondary/30 border border-border/50 rounded-md px-2.5 py-1.5 text-center">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{item.label}</div>
              <div className={`text-sm font-mono font-bold ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Filtered or full grid */}
        {isGenel ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="space-y-3">
              <EconomySection />
            </div>
            <div className="space-y-3">
              <EnvironmentSection />
            </div>
            <div className="space-y-3">
              <TourismSection />
              <CultureAgriSection />
            </div>
            <div className="space-y-3">
              <SocialIntelSection />
              <SocialSection />
              <TransportSection />
              <EnergySection />
              <SecuritySection />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {sectionComponents[activeTab as Exclude<DashboardTab, "genel">]?.map((Section, i) => (
              <div key={i} className="space-y-3">
                <Section />
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-4 py-3 border-t border-border/50 text-center">
          <p className="text-[10px] font-mono text-muted-foreground">
            MUĞLA MONİTÖR v1.0 — Bölgesel İstihbarat Paneli — Canlı veri akışı aktif
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
