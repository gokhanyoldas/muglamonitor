// Updated sample-data-service to use real APIs
import { realDataService, MuglaWeather, RecentEarthquake } from "./real-data-service";
import { IntelligenceItem } from "./osint-data-manager";

export async function generateMuglaSampleData(): Promise<IntelligenceItem[]> {
  const [weather, earthquakes] = await Promise.all([
    realDataService.getMuglaWeather(),
    realDataService.getRecentEarthquakes(3)
  ]);

  return [
    {
      id: "weather-1",
      type: "weather",
      title: `Muğla Hava: ${weather.temperature}°C, ${weather.condition}`,
      description: `${weather.humidity}% nem, rüzgar ${weather.windSpeed} km/s`,
      timestamp: new Date().toISOString(),
      source: "Open-Meteo",
      severity: "low"
    },
    ...earthquakes.slice(0, 2).map((eq, i) => ({
      id: `quake-${i}`,
      type: "alert",
      title: `${eq.magnitude} büyüklüğünde deprem` ,
      description: `${eq.place} - Derinlik: ${eq.depth}km`,
      timestamp: eq.time,
      source: "USGS",
      severity: eq.magnitude > 4 ? "high" : "medium"
    }))
  ];
}

export function getCategoryStats() {
  return {
    news: { count: 12, trend: "up" as const },
    social: { count: 34, trend: "stable" as const },
    alert: { count: 7, trend: "up" as const },
    threat: { count: 3, trend: "down" as const },
    opportunity: { count: 5, trend: "stable" as const },
  };
}
