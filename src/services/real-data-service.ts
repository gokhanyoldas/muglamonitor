// src/services/real-data-service.ts
export interface MuglaWeather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  daily: Array<{
    date: string;
    maxTemp: number;
    minTemp: number;
    precipitationProb: number;
  }>;
}

export interface RecentEarthquake {
  magnitude: number;
  place: string;
  time: string;
  depth: number;
}

class RealDataService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getMuglaWeather(): Promise<MuglaWeather> {
    const cacheKey = 'mugla-weather';
    const cached = this.getCached<MuglaWeather>(cacheKey);
    if (cached) return cached;

    try {
      const lat = 37.215;
      const lon = 28.363;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?` +
        `latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=Europe/Istanbul`
      );

      if (!response.ok) throw new Error('Weather API error');

      const data = await response.json();

      const weather: MuglaWeather = {
        temperature: Math.round(data.current.temperature_2m),
        humidity: Math.round(data.current.relative_humidity_2m),
        windSpeed: Math.round(data.current.wind_speed_10m),
        condition: this.getWeatherCodeDescription(data.current.weather_code),
        daily: data.daily.time.map((date: string, i: number) => ({
          date,
          maxTemp: Math.round(data.daily.temperature_2m_max[i]),
          minTemp: Math.round(data.daily.temperature_2m_min[i]),
          precipitationProb: data.daily.precipitation_probability_max[i],
        })),
      };

      this.setCache(cacheKey, weather);
      return weather;
    } catch (error) {
      console.error('Weather fetch error:', error);
      return this.getFallbackWeather();
    }
  }

  async getRecentEarthquakes(limit = 5): Promise<RecentEarthquake[]> {
    const cacheKey = 'recent-earthquakes';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
      );
      const data = await response.json();

      const quakes = data.features
        .slice(0, limit)
        .map((f: any) => ({
          magnitude: f.properties.mag,
          place: f.properties.place,
          time: new Date(f.properties.time).toISOString(),
          depth: f.geometry.coordinates[2],
        }));

      this.setCache(cacheKey, quakes);
      return quakes;
    } catch (error) {
      console.error('Earthquake API error:', error);
      return [];
    }
  }

  private getWeatherCodeDescription(code: number): string {
    const codes: Record<number, string> = {
      0: "Açık", 1: "Çoğunlukla Açık", 2: "Parçalı Bulutlu",
      3: "Bulutlu", 45: "Sis", 51: "Hafif Yağmur", 61: "Yağmur",
      71: "Kar", 80: "Sağnak Yağış", 95: "Fırtına"
    };
    return codes[code] || "Değişken";
  }

  private getFallbackWeather(): MuglaWeather {
    return {
      temperature: 24,
      humidity: 65,
      windSpeed: 12,
      condition: "Parçalı Bulutlu",
      daily: []
    };
  }
}

export const realDataService = new RealDataService();
