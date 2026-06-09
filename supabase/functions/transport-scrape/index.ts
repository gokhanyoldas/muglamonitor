import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Muğla region center — used for ADSB.fi radius query
const MUGLA_CENTER = { lat: 37.05, lon: 28.35 };
// Query radius: 100 nautical miles ≈ 185 km — covers both airports + approach paths
const ADSB_RADIUS_NM = 100;

const AIRPORTS: Record<string, { name: string; lat: number; lon: number }> = {
  DLM: { name: "Dalaman Havalimanı",       lat: 36.7131, lon: 28.7925 },
  BJV: { name: "Milas-Bodrum Havalimanı",  lat: 37.2506, lon: 27.6643 },
};

// Registration prefix → country (Turkish + common European / regional carriers)
function registrationToCountry(reg: string): string {
  if (!reg) return "—";
  const r = reg.toUpperCase();
  if (r.startsWith("TC-"))              return "Türkiye";
  if (r.startsWith("D-"))               return "Almanya";
  if (r.startsWith("F-"))               return "Fransa";
  if (r.startsWith("G-") || r.startsWith("M-")) return "İngiltere";
  if (r.startsWith("PH-"))              return "Hollanda";
  if (r.startsWith("EC-"))              return "İspanya";
  if (r.startsWith("EI-"))              return "İrlanda";
  if (r.startsWith("I-"))               return "İtalya";
  if (r.startsWith("OE-"))              return "Avusturya";
  if (r.startsWith("SP-"))              return "Polonya";
  if (r.startsWith("OK-"))              return "Çek C.";
  if (r.startsWith("HA-"))              return "Macaristan";
  if (r.startsWith("OY-"))              return "Danimarka";
  if (r.startsWith("SE-"))              return "İsveç";
  if (r.startsWith("OH-"))              return "Finlandiya";
  if (r.startsWith("LN-"))              return "Norveç";
  if (r.startsWith("A6-"))              return "BAE";
  if (r.startsWith("4X-"))              return "İsrail";
  if (r.startsWith("EP-"))              return "İran";
  if (r.startsWith("RA-") || r.startsWith("RF-")) return "Rusya";
  if (r.startsWith("UR-"))              return "Ukrayna";
  if (r.startsWith("EK-"))              return "Ermenistan";
  if (r.startsWith("9H-"))              return "Malta";
  if (r.startsWith("5B-"))              return "Kıbrıs";
  if (r.startsWith("LZ-"))              return "Bulgaristan";
  if (r.startsWith("YR-"))              return "Romanya";
  if (r.startsWith("SX-"))              return "Yunanistan";
  if (r.startsWith("LY-"))              return "Litvanya";
  if (r.startsWith("YL-"))             return "Letonya";
  if (r.startsWith("ES-"))              return "Estonya";
  if (r.startsWith("CS-"))              return "Portekiz";
  if (r.startsWith("HB-"))              return "İsviçre";
  if (r.startsWith("OO-"))              return "Belçika";
  // fallback: use prefix up to first dash
  const dash = r.indexOf("-");
  return dash > 0 ? r.substring(0, dash) : r.substring(0, 3);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// verticalRateFpm: feet per minute (ADSB.fi baro_rate field)
// Threshold: ±200 fpm (~1 m/s) — enough to distinguish cruise vs. climb/descent
function classifyFlight(
  lat: number,
  lon: number,
  verticalRateFpm: number | null,
  onGround: boolean
) {
  let nearestAirport: string | null = null;
  let minDist = Infinity;
  for (const [code, ap] of Object.entries(AIRPORTS)) {
    const d = haversineKm(lat, lon, ap.lat, ap.lon);
    if (d < minDist) { minDist = d; nearestAirport = code; }
  }
  // 120 km radius per airport — catches approaches from further out
  if (minDist > 120) return null;
  const isDeparting = !onGround && verticalRateFpm !== null && verticalRateFpm > 200;
  const isArriving  = !onGround && verticalRateFpm !== null && verticalRateFpm < -200;
  const type = onGround
    ? "on_ground"
    : isDeparting ? "departure"
    : isArriving  ? "arrival"
    : "transit";
  return { airport: nearestAirport!, distance: Math.round(minDist), type };
}

// ── ADSB.fi open data (no-auth, free, reliable EU coverage) ─────────────────
async function fetchAdsbFiFlights(): Promise<any[]> {
  const url = `https://opendata.adsb.fi/api/v2/lat/${MUGLA_CENTER.lat}/lon/${MUGLA_CENTER.lon}/dist/${ADSB_RADIUS_NM}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "MuglaMonitor/2.0", "Accept": "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`ADSB.fi error: ${res.status}`);
  const data = await res.json();
  const aircraft: any[] = data.aircraft || data.ac || [];

  return aircraft
    .filter((ac) => typeof ac.lat === "number" && typeof ac.lon === "number")
    .map((ac) => {
      const altFt = ac.alt_baro;
      const onGround = altFt === "ground" || (typeof altFt === "number" && altFt < 150);
      const altM = altFt === "ground" ? 0 : (typeof altFt === "number" ? Math.round(altFt * 0.3048) : null);
      return {
        icao24:         ac.hex,
        callsign:       (ac.flight || "").trim() || ac.r || ac.hex,
        origin_country: registrationToCountry(ac.r || ""),
        registration:   ac.r   || null,
        aircraft_type:  ac.t   || null,
        longitude:      ac.lon,
        latitude:       ac.lat,
        altitude:       altM,
        on_ground:      onGround,
        velocity:       typeof ac.gs        === "number" ? Math.round(ac.gs * 1.852) : null, // kts→km/h
        heading:        typeof ac.track     === "number" ? Math.round(ac.track) : null,
        vertical_rate:  typeof ac.baro_rate === "number" ? ac.baro_rate : null, // fpm
      };
    });
}

function formatFlightData(rawFlights: any[]) {
  const airports: Record<
    string,
    { code: string; name: string; departures: any[]; arrivals: any[]; overhead: any[] }
  > = {
    DLM: { code: "DLM", name: "Dalaman Havalimanı",       departures: [], arrivals: [], overhead: [] },
    BJV: { code: "BJV", name: "Milas-Bodrum Havalimanı",  departures: [], arrivals: [], overhead: [] },
  };
  for (const f of rawFlights) {
    if (!f.latitude || !f.longitude) continue;
    const c = classifyFlight(f.latitude, f.longitude, f.vertical_rate, f.on_ground);
    if (!c || !airports[c.airport]) continue;
    const info = {
      callsign:        f.callsign,
      origin_country:  f.origin_country,
      registration:    f.registration,
      aircraft_type:   f.aircraft_type,
      altitude:        f.altitude,
      velocity:        f.velocity,
      heading:         f.heading,
      on_ground:       f.on_ground,
      distance_km:     c.distance,
      latitude:        f.latitude,
      longitude:       f.longitude,
    };
    if (c.type === "departure")       airports[c.airport].departures.push(info);
    else if (c.type === "arrival")    airports[c.airport].arrivals.push(info);
    else                              airports[c.airport].overhead.push(info); // transit + on_ground
  }
  return Object.values(airports);
}

// ── Bus routes (static) ───────────────────────────────────────────────────────
const BUS_ROUTES = [
  { carrier: "Muğla Koop.", from: "Muğla", to: "Bodrum",    departures: ["06:00","07:30","09:00","10:30","12:00","13:30","15:00","16:30","18:00","19:30"], duration: "2s 45dk", price: "₺180", type: "ilçe" },
  { carrier: "Muğla Koop.", from: "Muğla", to: "Fethiye",   departures: ["06:30","08:00","09:30","11:00","13:00","15:00","17:00","19:00"],                   duration: "2s 15dk", price: "₺150", type: "ilçe" },
  { carrier: "Muğla Koop.", from: "Muğla", to: "Marmaris",  departures: ["07:00","08:30","10:00","12:00","14:00","16:00","18:00","20:00"],                   duration: "1s 30dk", price: "₺120", type: "ilçe" },
  { carrier: "Muğla Koop.", from: "Muğla", to: "Dalaman",   departures: ["07:00","09:00","11:00","14:00","16:30","19:00"],                                    duration: "1s 45dk", price: "₺130", type: "ilçe" },
  { carrier: "Muğla Koop.", from: "Muğla", to: "Milas",     departures: ["06:30","07:30","08:30","09:30","10:30","11:30","13:00","14:30","16:00","17:30","19:00"], duration: "45dk",    price: "₺70",  type: "ilçe" },
  { carrier: "Muğla Koop.", from: "Muğla", to: "Datça",     departures: ["08:00","10:30","14:00","17:00"],                                                    duration: "3s 15dk", price: "₺200", type: "ilçe" },
  { carrier: "Muğla Koop.", from: "Muğla", to: "Köyceğiz",  departures: ["07:30","10:00","13:00","16:00","18:30"],                                            duration: "1s 15dk", price: "₺100", type: "ilçe" },
  { carrier: "Pamukkale",   from: "Muğla", to: "İstanbul",  departures: ["08:00","14:00","20:00","22:00"],                                                    duration: "11s",     price: "₺700", type: "şehirlerarası" },
  { carrier: "Kamil Koç",   from: "Muğla", to: "Ankara",    departures: ["09:00","17:00","21:00","23:00"],                                                    duration: "9s 30dk", price: "₺600", type: "şehirlerarası" },
  { carrier: "Metro",       from: "Muğla", to: "İzmir",     departures: ["06:00","08:00","10:00","12:00","14:00","16:00","18:00","20:00"],                   duration: "3s 30dk", price: "₺280", type: "şehirlerarası" },
  { carrier: "Pamukkale",   from: "Muğla", to: "Antalya",   departures: ["07:30","10:00","13:00","16:00","19:00"],                                            duration: "4s",      price: "₺320", type: "şehirlerarası" },
  { carrier: "Kamil Koç",   from: "Muğla", to: "Denizli",   departures: ["07:00","09:30","12:00","15:00","18:00"],                                            duration: "3s",      price: "₺220", type: "şehirlerarası" },
  { carrier: "Metro",       from: "Muğla", to: "Aydın",     departures: ["06:30","09:00","11:30","14:00","16:30","19:00"],                                    duration: "2s 15dk", price: "₺180", type: "şehirlerarası" },
];

const EMPTY_AIRPORTS = [
  { code: "DLM", name: "Dalaman Havalimanı",       departures: [], arrivals: [], overhead: [] },
  { code: "BJV", name: "Milas-Bodrum Havalimanı",  departures: [], arrivals: [], overhead: [] },
];

// ── Handler ───────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const type = body.type || new URL(req.url).searchParams.get("type") || "flights";

    if (type === "flights") {
      try {
        const rawFlights = await fetchAdsbFiFlights();
        const airports   = formatFlightData(rawFlights);
        return new Response(
          JSON.stringify({
            source:         "adsb.fi",
            total_aircraft: rawFlights.length,
            airports,
            fetched_at:     new Date().toISOString(),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        console.error("ADSB.fi fetch failed:", e);
        return new Response(
          JSON.stringify({
            source:         "adsb.fi",
            error:          "Veri alınamadı. Kısa süre içinde yeniden denenecek.",
            total_aircraft: 0,
            airports:       EMPTY_AIRPORTS,
            fetched_at:     new Date().toISOString(),
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (type === "bus") {
      return new Response(
        JSON.stringify({
          source:     "mugla-terminal-static",
          routes:     BUS_ROUTES,
          note:       "Static schedule — updated monthly from official terminal boards.",
          fetched_at: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid type. Use 'flights' or 'bus'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
