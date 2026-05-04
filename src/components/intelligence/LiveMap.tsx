import { useEffect, useRef } from "react";
import { osintDataManager, IntelligenceItem } from "@/services/osint-data-manager";

interface MapDistrict {
  name: string;
  coords: [number, number];
  items: IntelligenceItem[];
}

export const LiveMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const muglaistricts: MapDistrict[] = [
    { name: "Bodrum", coords: [37.0344, 27.4267], items: [] },
    { name: "Marmaris", coords: [37.2397, 28.2731], items: [] },
    { name: "Datça", coords: [36.7128, 27.6658], items: [] },
    { name: "Fethiye", coords: [36.6184, 29.1078], items: [] },
    { name: "Ölüdeniz", coords: [36.5475, 29.1245], items: [] },
    { name: "Muğla (Merkez)", coords: [36.9127, 28.3636], items: [] },
    { name: "Seydikemer", coords: [36.5869, 28.6842], items: [] },
    { name: "Ortaca", coords: [36.8522, 28.3394], items: [] },
    { name: "Milas", coords: [37.2469, 27.7431], items: [] },
    { name: "Menteşe", coords: [37.2028, 28.3661], items: [] },
  ];

  useEffect(() => {
    loadMap();
  }, []);

  const loadMap = () => {
    if (!mapContainer.current || mapRef.current) return;

    // Create SVG map representation (fallback since we can't use Leaflet via CDN easily)
    const container = mapContainer.current;
    container.innerHTML = `
      <div class="w-full h-full bg-gradient-to-b from-blue-950 to-slate-950 rounded-lg border border-slate-700 p-4 relative overflow-hidden">
        <div class="absolute inset-0 opacity-10">
          <svg class="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="0.5"/>
              </pattern>
            </defs>
            <rect width="400" height="300" fill="url(#grid)" />
          </svg>
        </div>

        <div class="absolute inset-4 rounded-lg border border-blue-500/20 pointer-events-none">
          <div class="absolute inset-0 rounded-lg bg-gradient-to-tr from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>
        </div>

        <div class="relative z-10 h-full flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 003 16.382V5.618a1 1 0 011.553-.894L9 7.16" />
              </svg>
              Canlı Muğla Haritası
            </h3>
            <span class="text-[10px] text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded">İlçe Bazlı Görünüm</span>
          </div>

          <div id="district-list" class="flex-1 grid grid-cols-2 gap-2 overflow-y-auto pr-2">
            <!-- Districts will be populated here -->
          </div>

          <div class="mt-4 pt-3 border-t border-slate-700">
            <div class="grid grid-cols-3 gap-2 text-[10px]">
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-red-500"></div>
                <span class="text-slate-400">Kritik (>2)</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-orange-500"></div>
                <span class="text-slate-400">Yüksek (1-2)</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                <span class="text-slate-400">Bilgi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    updateDistrictData();
  };

  const updateDistrictData = () => {
    const items = osintDataManager.getIntelligenceFeed();
    const districtList = document.getElementById("district-list");
    if (!districtList) return;

    muglaistricts.forEach((district) => {
      district.items = items.filter((item) =>
        item.location?.toLowerCase().includes(district.name.toLowerCase())
      );
    });

    districtList.innerHTML = muglaistricts
      .map((district) => {
        const criticalCount = district.items.filter(
          (i) => i.importance === "critical"
        ).length;
        const highCount = district.items.filter(
          (i) => i.importance === "high"
        ).length;
        const totalCount = district.items.length;

        let markerColor = "bg-blue-500";
        if (criticalCount > 2) markerColor = "bg-red-500";
        else if (criticalCount > 0 || highCount > 0) markerColor = "bg-orange-500";

        return `
          <div class="p-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer group hover:bg-slate-800" title="${district.name}">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-2 h-2 rounded-full ${markerColor}"></div>
              <span class="text-xs font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">${district.name}</span>
            </div>
            <div class="text-[10px] text-slate-400 space-y-0.5">
              <div>Kritik: <span class="text-red-400 font-semibold">${criticalCount}</span></div>
              <div>Toplam: <span class="text-cyan-400">${totalCount}</span></div>
            </div>
          </div>
        `;
      })
      .join("");
  };

  // Update map every 30 seconds
  useEffect(() => {
    const interval = setInterval(updateDistrictData, 30000);
    return () => clearInterval(interval);
  }, []);

  return <div ref={mapContainer} className="w-full h-full" />;
};
