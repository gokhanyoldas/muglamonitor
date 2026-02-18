import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EconomySection } from "@/components/dashboard/sections/EconomySection";
import { EnvironmentSection } from "@/components/dashboard/sections/EnvironmentSection";
import { TourismSection } from "@/components/dashboard/sections/TourismSection";
import { SocialSection } from "@/components/dashboard/sections/SocialSection";
import { TransportSection } from "@/components/dashboard/sections/TransportSection";
import { EnergySection } from "@/components/dashboard/sections/EnergySection";
import { SecuritySection } from "@/components/dashboard/sections/SecuritySection";
import { CultureAgriSection } from "@/components/dashboard/sections/CultureAgriSection";
import { SocialIntelSection } from "@/components/dashboard/sections/SocialIntelSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scanline">
      <DashboardHeader />
      
      <main className="p-3 max-w-[1800px] mx-auto">
        {/* Top summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
          {[
            { label: "Nüfus", value: "1.02M", color: "text-primary" },
            { label: "Turist/Yıl", value: "3.8M", color: "text-accent" },
            { label: "İşsizlik", value: "11.2%", color: "text-warning" },
            { label: "Hava", value: "14°C", color: "text-foreground" },
            { label: "AQI", value: "42", color: "text-success" },
            { label: "Otel Doluluk", value: "38%", color: "text-accent" },
            { label: "Baraj", value: "54%", color: "text-warning" },
            { label: "Güvenlik", value: "78/100", color: "text-primary" },
          ].map((item) => (
            <div key={item.label} className="bg-secondary/30 border border-border/50 rounded-md px-2.5 py-1.5 text-center">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{item.label}</div>
              <div className={`text-sm font-mono font-bold ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
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

        {/* Footer */}
        <footer className="mt-4 py-3 border-t border-border/50 text-center">
          <p className="text-[10px] font-mono text-muted-foreground">
            MUĞLA MONİTÖR v1.0 — Bölgesel İstihbarat Paneli — Veriler örnek amaçlıdır
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
