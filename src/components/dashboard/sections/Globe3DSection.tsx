import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardPanel } from "../DashboardPanel";
import { Globe, Layers, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface DataPoint { id: string; lat: number; lon: number; type: "earthquake" | "fire" | "social" | "flight" | "weather"; intensity: number; label: string; }

const MUGLA_CENTER = { lat: 37.0, lon: 28.4 };
const TYPE_COLORS: Record<DataPoint["type"], string> = { earthquake: "#ef4444", fire: "#f97316", social: "#3b82f6", flight: "#22c55e", weather: "#06b6d4" };

export const Globe3DSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataPoints] = useState<DataPoint[]>([
    { id: "eq1", lat: 36.82, lon: 28.27, type: "earthquake", intensity: 0.6, label: "M2.3 Fethiye" },
    { id: "eq2", lat: 37.03, lon: 28.98, type: "earthquake", intensity: 0.3, label: "M1.8 Muğla" },
    { id: "f1", lat: 36.95, lon: 28.63, type: "fire", intensity: 0.8, label: "Yangın Riski" },
    { id: "s1", lat: 37.04, lon: 27.43, type: "social", intensity: 0.5, label: "#Bodrum" },
    { id: "s2", lat: 36.62, lon: 29.12, type: "social", intensity: 0.4, label: "#Fethiye" },
    { id: "fl1", lat: 36.71, lon: 28.79, type: "flight", intensity: 0.7, label: "DLM" },
    { id: "fl2", lat: 37.25, lon: 27.66, type: "flight", intensity: 0.6, label: "BJV" },
    { id: "w1", lat: 36.85, lon: 28.27, type: "weather", intensity: 0.4, label: "28°C" },
  ]);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [is3D, setIs3D] = useState(true);
  const animRef = useRef<number>(0);

  const project = useCallback((lat: number, lon: number, w: number, h: number) => {
    const scale = zoom * Math.min(w, h) / 3;
    const dx = (lon - MUGLA_CENTER.lon) * scale / 10;
    const dy = -(lat - MUGLA_CENTER.lat) * scale / 10;
    const tilt = is3D ? 0.6 : 0;
    const cosR = Math.cos(rotation * 0.01);
    const sinR = Math.sin(rotation * 0.01);
    const rx = dx * cosR - dy * sinR;
    const ry = (dx * sinR + dy * cosR) * (1 - tilt * 0.3);
    return { x: w / 2 + rx, y: h / 2 + ry };
  }, [zoom, rotation, is3D]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "rgba(100,200,255,0.08)";
    ctx.lineWidth = 0.5;
    for (let lat = 36.3; lat <= 37.5; lat += 0.2) {
      ctx.beginPath();
      for (let lon = 27.0; lon <= 29.8; lon += 0.1) { const {x,y} = project(lat, lon, w, h); lon === 27.0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); }
      ctx.stroke();
    }
    for (let lon = 27.0; lon <= 29.8; lon += 0.2) {
      ctx.beginPath();
      for (let lat = 36.3; lat <= 37.5; lat += 0.1) { const {x,y} = project(lat, lon, w, h); lat === 36.3 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); }
      ctx.stroke();
    }

    // Coastline
    const coast = [[36.55,27.2],[36.6,27.4],[36.55,27.65],[36.75,27.8],[36.65,28.0],[36.58,28.3],[36.53,28.6],[36.6,28.95],[36.55,29.1],[36.6,29.3]];
    ctx.strokeStyle = "rgba(100,200,255,0.4)"; ctx.lineWidth = 1.5; ctx.beginPath();
    coast.forEach(([lat,lon],i) => { const {x,y} = project(lat, lon, w, h); i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y); });
    ctx.stroke();

    // Data points
    const time = Date.now() * 0.001;
    dataPoints.forEach(p => {
      const {x,y} = project(p.lat, p.lon, w, h);
      const pulse = Math.sin(time*2 + p.intensity*10)*0.3 + 0.7;
      const r = (4 + p.intensity*8) * zoom * pulse;
      const color = TYPE_COLORS[p.type];
      const g = ctx.createRadialGradient(x,y,0,x,y,r*2);
      g.addColorStop(0, color+"80"); g.addColorStop(1, color+"00");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r*2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x,y,r*0.6,0,Math.PI*2); ctx.fill();
      ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(p.label, x, y-12);
    });
    animRef.current = requestAnimationFrame(draw);
  }, [dataPoints, project, zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <DashboardPanel title="3D Bölge Haritası" icon={<Globe size={14} />} badge="BETA" badgeVariant="active">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setIs3D(!is3D)} className={`text-[9px] font-mono px-2 py-0.5 rounded ${is3D ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}><Layers size={10} className="inline mr-1" />{is3D ? "3D" : "2D"}</button>
        <div className="flex gap-1">
          <button onClick={() => setZoom(z => Math.min(z+0.3,3))} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/40"><ZoomIn size={12} /></button>
          <button onClick={() => setZoom(z => Math.max(z-0.3,0.5))} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/40"><ZoomOut size={12} /></button>
          <button onClick={() => setRotation(r => r+30)} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/40"><RotateCw size={12} /></button>
        </div>
      </div>
      <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-[#0a0a0f] border border-border/30">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/30">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {type === "earthquake" ? "Deprem" : type === "fire" ? "Yangın" : type === "social" ? "Sosyal" : type === "flight" ? "Uçuş" : "Hava"}
          </span>
        ))}
      </div>
    </DashboardPanel>
  );
};
