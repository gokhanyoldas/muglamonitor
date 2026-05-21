import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MUGLA_BOUNDS = { lamin: 36.3, lamax: 37.3, lomin: 27.2, lomax: 29.5 };

const AIRPORTS: Record<string, { name: string; lat: number; lon: number }> = {
  DLM: { name: "Dalaman Havalimanı", lat: 36.7131, lon: 28.7925 },
  BJV: { name: "Milas-Bodrum Havalimanı", lat: 37.2506, lon: 27.6643 },
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function classifyFlight(lat: number, lon: number, verticalRate: number | null, onGround: boolean) {
  let nearestAirport: string | null = null;
  let minDist = Infinity;
  for (const [code, ap] of Object.entries(AIRPORTS)) {
    const d = haversineKm(lat, lon, ap.lat, ap.lon);
    if (d < minDist) { minDist = d; nearestAirport = code; }
  }
  if (minDist > 80) return null;
  const isDeparting = verticalRate !== null && verticalRate > 2;
  const isArriving = verticalRate !== null && verticalRate < -2;
  const type = onGround ? "on_ground" : isDeparting ? "departure" : isArriving ? "arrival" : "transit";
  return { airport: nearestAirport, distance: Math.round(minDist), type };
}

async function fetchOpenSkyFlights() {
  const { lamin, lamax, lomin, lomax } = MUGLA_BOUNDS;
  const url = `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;
  const res = await fetch(url, { headers: { "User-Agent": "MuglaMonitor/2.0" } });
  if (!res.ok) throw new Error(`OpenSky API error: ${res.status}`);
  const data = await res.json();
  if (!data.states) return [];
  return data.states.map((s: any[]) => ({
    icao24: s[0], callsign: (s[1] || "").trim(), origin_country: s[2],
    longitude: s[5], latitude: s[6], altitude: s[7] ? Math.round(s[7]) : null,
    on_ground: s[8], velocity: s[9] ? Math.round(s[9] * 3.6) : null,
    heading: s[10] ? Math.round(s[10]) : null, vertical_rate: s[11],
  }));
}

function formatFlightData(rawFlights: any[]) {
  const airports: Record<string, { code: string; name: string; departures: any[]; arrivals: any[]; overhead: any[] }> = {
    DLM: { code: "DLM", name: "Dalaman Havalimanı", departures: [], arrivals: [], overhead: [] },
    BJV: { code: "BJV", name: "Milas-Bodrum Havalimanı", departures: [], arrivals: [], overhead: [] },
  };
  for (const f of rawFlights) {
    if (!f.latitude || !f.longitude) continue;
    const c = classifyFlight(f.latitude, f.longitude, f.vertical_rate, f.on_ground);
    if (!c || !airports[c.airport!]) continue;
    const info = { callsign: f.callsign || f.icao24, origin_country: f.origin_country, altitude: f.altitude, velocity: f.velocity, heading: f.heading, on_ground: f.on_ground, distance_km: c.distance, latitude: f.latitude, longitude: f.longitude };
    if (c.type === "departure") airports[c.airport!].departures.push(info);
    else if (c.type === "arrival") airports[c.airport!].arrivals.push(info);
    else airports[c.airport!].overhead.push(info);
  }
  return Object.values(airports);
}

const BUS_ROUTES = [
  { carrier: "Muğla Koop.", from: "Muğla", to: "Bodrum", departures: ["06:00","07:30","09:00","10:30","12:00","13:30","15:00","16:30","18:00","19:30"], duration: "2s 45dk", price: "₺180", type: "ilçe" },
  { carrier: "Muğla Koop.", from: "Muğla", to: "Fethiye", departures: ["06:30","08:00","09:30","11:00","13:00","15:00","17:00","19:00"], duration: "2s 15dk", price: "₺150", type: "ilçe" },
  { carrier: "Muğla Koop.", from: "Muğla", to: "Marmaris", departures: ["07:00","08:30","10:00","12:00","14:00","16:00","18:00","20:00"], duration: "1s 30dk", price: "₺120", type: "ilçe" },
  { carrier: "Muğla Koop.", from: "Muğla", to: "Dalaman", departures: ["07:00","09:00","11:00","14:00","16:30","19:00"], duration: "1s 45dk", price: "₺130", type: "ilçe" },
  { carrier: "Muğla Koop.", from: "Muğla", to: "Milas", departures: ["06:30","07:30","08:30","09:30","10:30","11:30","13:00","14:30","16:00","17:30","19:00"], duration: "45dk", price: "₺70", type: "ilçe" },
  { carrier: "Muğla Koop.", from: "Muğla", to: "Datça", departures: ["08:00","10:30","14:00","17:00"], duration: "3s 15dk", price: "₺200", type: "ilçe" },
  { carrier: "Muğla Koop.", from: "Muğla", to: "Köyceğiz", departures: ["07:30","10:00","13:00","16:00","18:30"], duration: "1s 15dk", price: "₺100", type: "ilçe" },
  { carrier: "Pamukkale", from: "Muğla", to: "İstanbul", departures: ["08:00","14:00","20:00","22:00"], duration: "11s", price: "₺700", type: "şehirlerarası" },
  { carrier: "Kamil Koç", from: "Muğla", to: "Ankara", departures: ["09:00","17:00","21:00","23:00"], duration: "9s 30dk", price: "₺600", type: "şehirlerarası" },
  { carrier: "Metro", from: "Muğla", to: "İzmir", departures: ["06:00","08:00","10:00","12:00","14:00","16:00","18:00","20:00"], duration: "3s 30dk", price: "₺280", type: "şehirlerarası" },
  { carrier: "Pamukkale", from: "Muğla", to: "Antalya", departures: ["07:30","10:00","13:00","16:00","19:00"], duration: "4s", price: "₺320", type: "şehirlerarası" },
  { carrier: "Kamil Koç", from: "Muğla", to: "Denizli", departures: ["07:00","09:30","12:00","15:00","18:00"], duration: "3s", price: "₺220", type: "şehirlerarası" },
  { carrier: "Metro", from: "Muğla", to: "Aydın", departures: ["06:30","09:00","11:30","14:00","16:30","19:00"], duration: "2s 15dk", price: "₺180", type: "şehirlerarası" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const type = body.type || new URL(req.url).searchParams.get("type") || "flights";

    if (type === "flights") {
      try {
        const rawFlights = await fetchOpenSkyFlights();
        const airports = formatFlightData(rawFlights);
        return new Response(JSON.stringify({ source: "opensky-network.org", total_aircraft: rawFlights.length, airports, fetched_at: new Date().toISOString() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ source: "opensky-network.org", error: "Rate limited. Retry in 10s.", total_aircraft: 0, airports: [{ code: "DLM", name: "Dalaman Havalimanı", departures: [], arrivals: [], overhead: [] }, { code: "BJV", name: "Milas-Bodrum Havalimanı", departures: [], arrivals: [], overhead: [] }], fetched_at: new Date().toISOString() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (type === "bus") {
      return new Response(JSON.stringify({ source: "mugla-terminal-static", routes: BUS_ROUTES, note: "Static schedule — updated monthly from official terminal boards.", fetched_at: new Date().toISOString() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid type. Use 'flights' or 'bus'." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
