import { useMemo } from "react";

interface RegionPoint {
  name: string;
  lat: number;
  lng: number;
  mentionCount: number;
  sentiment: "positive" | "negative" | "neutral";
}

interface SocialRegionMapProps {
  data: RegionPoint[];
}

// Muğla district coordinates
const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  "Muğla Merkez": { lat: 37.215, lng: 28.364 },
  "Bodrum": { lat: 37.034, lng: 27.427 },
  "Marmaris": { lat: 36.852, lng: 28.269 },
  "Fethiye": { lat: 36.654, lng: 29.123 },
  "Datça": { lat: 36.730, lng: 27.687 },
  "Dalaman": { lat: 36.767, lng: 28.802 },
  "Milas": { lat: 37.278, lng: 27.783 },
  "Köyceğiz": { lat: 36.968, lng: 28.685 },
  "Ortaca": { lat: 36.838, lng: 28.767 },
  "Menteşe": { lat: 37.215, lng: 28.364 },
  "Yatağan": { lat: 37.340, lng: 28.135 },
  "Kavaklıdere": { lat: 37.425, lng: 28.378 },
  "Seydikemer": { lat: 36.624, lng: 29.357 },
};

// Map bounds
const MAP_BOUNDS = {
  minLat: 36.5, maxLat: 37.5,
  minLng: 27.2, maxLng: 29.5,
};

function latLngToXY(lat: number, lng: number, width: number, height: number) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * width;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * height;
  return { x, y };
}

function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "positive": return "#22c55e";
    case "negative": return "#ef4444";
    default: return "#eab308";
  }
}

export const SocialRegionMap = ({ data }: SocialRegionMapProps) => {
  const width = 320;
  const height = 180;

  const points = useMemo(() => {
    return data.map(d => {
      const coords = DISTRICT_COORDS[d.name];
      if (!coords) return null;
      const { x, y } = latLngToXY(coords.lat, coords.lng, width, height);
      return { ...d, x, y };
    }).filter(Boolean) as (RegionPoint & { x: number; y: number })[];
  }, [data]);

  const maxCount = Math.max(...points.map(p => p.mentionCount), 1);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: "180px" }}>
        {/* Background */}
        <rect width={width} height={height} fill="hsl(var(--muted))" opacity={0.1} rx={8} />
        
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={`h${f}`} x1={0} y1={height * f} x2={width} y2={height * f} stroke="hsl(var(--border))" strokeWidth={0.3} opacity={0.3} />
        ))}
        {[0.25, 0.5, 0.75].map(f => (
          <line key={`v${f}`} x1={width * f} y1={0} x2={width * f} y2={height} stroke="hsl(var(--border))" strokeWidth={0.3} opacity={0.3} />
        ))}

        {/* All district markers (faint) */}
        {Object.entries(DISTRICT_COORDS).map(([name, coords]) => {
          const { x, y } = latLngToXY(coords.lat, coords.lng, width, height);
          const hasData = points.some(p => p.name === name);
          if (hasData) return null;
          return (
            <g key={name}>
              <circle cx={x} cy={y} r={3} fill="hsl(var(--muted-foreground))" opacity={0.15} />
              <text x={x} y={y + 8} textAnchor="middle" fontSize={5} fill="hsl(var(--muted-foreground))" opacity={0.3} fontFamily="monospace">
                {name}
              </text>
            </g>
          );
        })}

        {/* Active data points */}
        {points.map(p => {
          const radius = Math.max(5, (p.mentionCount / maxCount) * 15);
          const color = getSentimentColor(p.sentiment);
          return (
            <g key={p.name}>
              {/* Pulse ring */}
              <circle cx={p.x} cy={p.y} r={radius + 3} fill={color} opacity={0.1}>
                <animate attributeName="r" values={`${radius + 2};${radius + 6};${radius + 2}`} dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Main circle */}
              <circle cx={p.x} cy={p.y} r={radius} fill={color} opacity={0.6} stroke={color} strokeWidth={1} />
              {/* Count label */}
              <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize={7} fill="white" fontFamily="monospace" fontWeight="bold">
                {p.mentionCount}
              </text>
              {/* Name */}
              <text x={p.x} y={p.y + radius + 8} textAnchor="middle" fontSize={6} fill="hsl(var(--foreground))" fontFamily="monospace" opacity={0.7}>
                {p.name}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${width - 80}, 8)`}>
          <circle cx={0} cy={0} r={3} fill="#22c55e" /><text x={6} y={2} fontSize={5} fill="hsl(var(--muted-foreground))" fontFamily="monospace">Pozitif</text>
          <circle cx={0} cy={10} r={3} fill="#ef4444" /><text x={6} y={12} fontSize={5} fill="hsl(var(--muted-foreground))" fontFamily="monospace">Negatif</text>
          <circle cx={0} cy={20} r={3} fill="#eab308" /><text x={6} y={22} fontSize={5} fill="hsl(var(--muted-foreground))" fontFamily="monospace">Nötr</text>
        </g>
      </svg>
    </div>
  );
};

/**
 * Generate region map data from analyses
 */
export function generateRegionMapData(
  analyses: Array<{ region?: string; sentiment: string }>
): RegionPoint[] {
  const regionMap = new Map<string, { count: number; pos: number; neg: number; neu: number }>();

  for (const item of analyses) {
    if (!item.region) continue;
    if (!regionMap.has(item.region)) regionMap.set(item.region, { count: 0, pos: 0, neg: 0, neu: 0 });
    const entry = regionMap.get(item.region)!;
    entry.count++;
    if (item.sentiment === "positive") entry.pos++;
    else if (item.sentiment === "negative") entry.neg++;
    else entry.neu++;
  }

  return Array.from(regionMap.entries()).map(([name, data]) => {
    const coords = DISTRICT_COORDS[name];
    let sentiment: "positive" | "negative" | "neutral" = "neutral";
    if (data.pos > data.neg && data.pos > data.neu) sentiment = "positive";
    else if (data.neg > data.pos) sentiment = "negative";

    return {
      name,
      lat: coords?.lat || 37.0,
      lng: coords?.lng || 28.3,
      mentionCount: data.count,
      sentiment,
    };
  });
}
