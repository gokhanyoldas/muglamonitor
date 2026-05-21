export interface CityConfig {
  id: string; name: string; region: string;
  center: { lat: number; lon: number };
  bounds: { lamin: number; lamax: number; lomin: number; lomax: number };
  airports: { code: string; name: string; lat: number; lon: number }[];
  districts: string[];
  dataSources: { municipality_rss?: string[]; earthquake_region?: string; weather_station?: string };
  enabled: boolean;
}

export const CITIES: Record<string, CityConfig> = {
  mugla: {
    id: "mugla", name: "Muğla", region: "Ege",
    center: { lat: 37.0, lon: 28.4 },
    bounds: { lamin: 36.3, lamax: 37.3, lomin: 27.2, lomax: 29.5 },
    airports: [{ code: "DLM", name: "Dalaman Havalimanı", lat: 36.7131, lon: 28.7925 }, { code: "BJV", name: "Milas-Bodrum Havalimanı", lat: 37.2506, lon: 27.6643 }],
    districts: ["Bodrum", "Fethiye", "Marmaris", "Milas", "Dalaman", "Datça", "Köyceğiz", "Ortaca", "Ula", "Yatağan", "Kavaklıdere", "Menteşe", "Seydikemer"],
    dataSources: { municipality_rss: ["https://www.mugla.bel.tr/rss"], earthquake_region: "mugla", weather_station: "mugla" },
    enabled: true,
  },
  izmir: { id: "izmir", name: "İzmir", region: "Ege", center: { lat: 38.42, lon: 27.13 }, bounds: { lamin: 37.8, lamax: 39.0, lomin: 26.2, lomax: 28.5 }, airports: [{ code: "ADB", name: "Adnan Menderes", lat: 38.2924, lon: 27.157 }], districts: ["Konak", "Bornova", "Karşıyaka", "Çeşme", "Urla"], dataSources: { municipality_rss: ["https://www.izmir.bel.tr/RSS"] }, enabled: false },
  aydin: { id: "aydin", name: "Aydın", region: "Ege", center: { lat: 37.84, lon: 27.85 }, bounds: { lamin: 37.4, lamax: 38.3, lomin: 27.0, lomax: 29.0 }, airports: [], districts: ["Efeler", "Kuşadası", "Didim", "Söke"], dataSources: {}, enabled: false },
  denizli: { id: "denizli", name: "Denizli", region: "Ege", center: { lat: 37.77, lon: 29.09 }, bounds: { lamin: 37.3, lamax: 38.2, lomin: 28.5, lomax: 29.8 }, airports: [{ code: "DNZ", name: "Çardak", lat: 37.7856, lon: 29.7013 }], districts: ["Merkezefendi", "Pamukkale"], dataSources: {}, enabled: false },
};

export const getActiveCity = (): CityConfig => CITIES.mugla;
export const getEnabledCities = (): CityConfig[] => Object.values(CITIES).filter(c => c.enabled);
export const getCityById = (id: string): CityConfig | undefined => CITIES[id];
