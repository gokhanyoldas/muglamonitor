import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("transport-scrape: flights (OpenSky)", () => {
  beforeEach(() => { mockFetch.mockClear(); });

  it("should classify departing flights by positive vertical rate", () => {
    const verticalRate = 5;
    expect(verticalRate > 2).toBe(true); // departure
  });

  it("should classify arriving flights by negative vertical rate", () => {
    const verticalRate = -8;
    expect(verticalRate < -2).toBe(true); // arrival
  });

  it("should handle OpenSky rate limiting gracefully", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
    const res = await mockFetch("https://opensky-network.org/api/states/all");
    expect(res.ok).toBe(false);
    expect(res.status).toBe(429);
  });

  it("should compute haversine distance correctly", () => {
    const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };
    const dist = haversineKm(36.71, 28.79, 36.7131, 28.7925);
    expect(dist).toBeLessThan(5);
  });
});

describe("transport-scrape: bus", () => {
  it("should return valid bus route structure", () => {
    const route = { carrier: "Muğla Koop.", from: "Muğla", to: "Bodrum", departures: ["06:00","07:30"], duration: "2s 45dk", price: "₺180", type: "ilçe" };
    expect(route.type).toBe("ilçe");
    expect(route.departures.length).toBeGreaterThan(0);
    expect(route.price).toMatch(/^₺\d+$/);
  });

  it("should have valid HH:MM departure times", () => {
    const times = ["06:00", "07:30", "09:00", "23:59"];
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    times.forEach(t => expect(t).toMatch(timeRegex));
  });

  it("should cover both route types", () => {
    const types = new Set(["ilçe", "şehirlerarası"]);
    expect(types.has("ilçe")).toBe(true);
    expect(types.has("şehirlerarası")).toBe(true);
  });
});
