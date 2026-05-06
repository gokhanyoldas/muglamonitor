// Stub: sample-data-service (mock data removed, real data via Edge Functions)
import { IntelligenceItem } from "./osint-data-manager";

export function generateMuglaSampleData(): IntelligenceItem[] {
  return [];
}

export function getCategoryStats() {
  return {
    news: { count: 0, trend: "stable" },
    social: { count: 0, trend: "stable" },
    alert: { count: 0, trend: "stable" },
    threat: { count: 0, trend: "stable" },
    opportunity: { count: 0, trend: "stable" },
  };
}
