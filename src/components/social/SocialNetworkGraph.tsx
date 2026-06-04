// src/components/social/SocialNetworkGraph.tsx
// Custom Canvas-based Network Graph — no external graph dependencies (WebContainer compatible)
// Implements force-directed layout with sentiment coloring, interactive nodes, filters

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  Network, Filter, Maximize2, RotateCcw,
  ZoomIn, ZoomOut, Layers, AlertTriangle, Users,
  MapPin, X as XIcon, Play, Pause
} from "lucide-react";
import { generateNetworkGraphData, NetworkNode, NetworkLink, NetworkGraphData } from "@/services/network-graph-service";
import { cn } from "@/lib/utils";

type FilterType = 'all' | 'districts' | 'last24h' | 'highRisk' | 'influencers';

interface SocialNetworkGraphProps {
  analyses: Array<{
    platform: string;
    content: string;
    sentiment: string;
    sentiment_score: number;
    source_author: string;
    engagement_count: number;
    summary?: string;
    source_url?: string;
    region?: string;
  }>;
  keywords?: string[];
  className?: string;
}

// Simple force-directed layout simulation
interface SimNode extends NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
}

function initializePositions(nodes: NetworkNode[], width: number, height: number): SimNode[] {
  return nodes.map((n, i) => ({
    ...n,
    x: width / 2 + (Math.random() - 0.5) * width * 0.6,
    y: height / 2 + (Math.random() - 0.5) * height * 0.6,
    vx: 0,
    vy: 0,
  }));
}

function simulateForces(
  nodes: SimNode[],
  links: NetworkLink[],
  width: number,
  height: number,
  alpha: number
): void {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Repulsion between nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (150 * alpha) / (dist * dist);
      dx *= force / dist;
      dy *= force / dist;
      a.vx -= dx;
      a.vy -= dy;
      b.vx += dx;
      b.vy += dy;
    }
  }

  // Attraction along links
  for (const link of links) {
    const source = nodeMap.get(link.source as string);
    const target = nodeMap.get(link.target as string);
    if (!source || !target) continue;
    let dx = target.x - source.x;
    let dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = (dist - 80) * 0.005 * alpha;
    dx = (dx / dist) * force;
    dy = (dy / dist) * force;
    source.vx += dx;
    source.vy += dy;
    target.vx -= dx;
    target.vy -= dy;
  }

  // Center gravity
  for (const node of nodes) {
    node.vx += (width / 2 - node.x) * 0.001 * alpha;
    node.vy += (height / 2 - node.y) * 0.001 * alpha;
  }

  // Apply velocities with damping
  for (const node of nodes) {
    if (node.fx !== undefined) { node.x = node.fx; node.vx = 0; }
    else {
      node.vx *= 0.6;
      node.x += node.vx;
      node.x = Math.max(30, Math.min(width - 30, node.x));
    }
    if (node.fy !== undefined) { node.y = node.fy; node.vy = 0; }
    else {
      node.vy *= 0.6;
      node.y += node.vy;
      node.y = Math.max(30, Math.min(height - 30, node.y));
    }
  }
}

export const SocialNetworkGraph = ({ analyses, keywords = [], className }: SocialNetworkGraphProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const animFrameRef = useRef<number>(0);
  const alphaRef = useRef(1);
  const dragRef = useRef<{ nodeId: string | null; isPanning: boolean; lastX: number; lastY: number }>({ nodeId: null, isPanning: false, lastX: 0, lastY: 0 });

  // Generate graph data
  const graphData: NetworkGraphData = useMemo(() => {
    return generateNetworkGraphData(analyses, keywords, { filter: activeFilter, maxNodes: 300 });
  }, [analyses, keywords, activeFilter]);

  const WIDTH = 900;
  const HEIGHT = 500;

  // Initialize simulation nodes when data changes
  useEffect(() => {
    simNodesRef.current = initializePositions(graphData.nodes, WIDTH, HEIGHT);
    alphaRef.current = 1;
    setIsSimulating(true);
  }, [graphData.nodes]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const draw = () => {
      if (!running) return;

      // Simulate
      if (isSimulating && alphaRef.current > 0.01) {
        simulateForces(simNodesRef.current, graphData.links, WIDTH, HEIGHT, alphaRef.current);
        alphaRef.current *= 0.995;
      } else if (alphaRef.current <= 0.01) {
        setIsSimulating(false);
      }

      // Clear
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const nodeMap = new Map(simNodesRef.current.map(n => [n.id, n]));

      // Draw links
      for (const link of graphData.links) {
        const source = nodeMap.get(link.source as string);
        const target = nodeMap.get(link.target as string);
        if (!source || !target) continue;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `rgba(255,255,255,${0.08 + (link.value || 1) * 0.03})`;
        ctx.lineWidth = Math.min(2, 0.5 + (link.value || 1) * 0.3);
        ctx.stroke();
      }

      // Draw nodes
      for (const node of simNodesRef.current) {
        const size = Math.max(4, node.val * 0.8);
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode === node.id;

        // Glow
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 6, 0, Math.PI * 2);
          ctx.fillStyle = `${node.color}33`;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Border
        if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (isHovered) {
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Label for important nodes
        if (size > 8 || isHovered || isSelected) {
          const label = node.name.length > 14 ? node.name.slice(0, 12) + '…' : node.name;
          ctx.font = '9px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillText(label, node.x, node.y + size + 12);
        }

        // Type indicator
        if (node.type === 'district') {
          ctx.beginPath();
          ctx.arc(node.x + size * 0.7, node.y - size * 0.7, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#60a5fa';
          ctx.fill();
        } else if (node.type === 'institution') {
          ctx.beginPath();
          ctx.arc(node.x + size * 0.7, node.y - size * 0.7, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [graphData.links, isSimulating, zoom, pan, selectedNode, hoveredNode]);

  // Mouse interaction
  const getNodeAt = useCallback((clientX: number, clientY: number): SimNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;

    for (const node of simNodesRef.current) {
      const size = Math.max(4, node.val * 0.8);
      const dx = node.x - x;
      const dy = node.y - y;
      if (dx * dx + dy * dy < (size + 4) * (size + 4)) {
        return node;
      }
    }
    return null;
  }, [zoom, pan]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const node = getNodeAt(e.clientX, e.clientY);
    if (node) {
      dragRef.current = { nodeId: node.id, isPanning: false, lastX: e.clientX, lastY: e.clientY };
      node.fx = node.x;
      node.fy = node.y;
    } else {
      dragRef.current = { nodeId: null, isPanning: true, lastX: e.clientX, lastY: e.clientY };
    }
  }, [getNodeAt]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const drag = dragRef.current;
    if (drag.nodeId) {
      const node = simNodesRef.current.find(n => n.id === drag.nodeId);
      if (node) {
        const dx = (e.clientX - drag.lastX) / zoom;
        const dy = (e.clientY - drag.lastY) / zoom;
        node.fx = (node.fx || node.x) + dx;
        node.fy = (node.fy || node.y) + dy;
        node.x = node.fx;
        node.y = node.fy;
        drag.lastX = e.clientX;
        drag.lastY = e.clientY;
        alphaRef.current = Math.max(alphaRef.current, 0.3);
        setIsSimulating(true);
      }
    } else if (drag.isPanning) {
      setPan(p => ({
        x: p.x + (e.clientX - drag.lastX),
        y: p.y + (e.clientY - drag.lastY),
      }));
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
    } else {
      const node = getNodeAt(e.clientX, e.clientY);
      setHoveredNode(node?.id || null);
    }
  }, [getNodeAt, zoom]);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current.nodeId) {
      const node = simNodesRef.current.find(n => n.id === dragRef.current.nodeId);
      if (node) {
        delete node.fx;
        delete node.fy;
      }
    }
    dragRef.current = { nodeId: null, isPanning: false, lastX: 0, lastY: 0 };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const node = getNodeAt(e.clientX, e.clientY);
    if (node) {
      setSelectedNode(node);
    }
  }, [getNodeAt]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.3, Math.min(5, z * factor)));
  }, []);

  // Controls
  const handleZoomIn = () => setZoom(z => Math.min(5, z * 1.3));
  const handleZoomOut = () => setZoom(z => Math.max(0.3, z * 0.7));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); setSelectedNode(null); alphaRef.current = 1; setIsSimulating(true); };
  const toggleSim = () => { if (!isSimulating) { alphaRef.current = 0.5; } setIsSimulating(!isSimulating); };

  const filters: Array<{ id: FilterType; label: string; icon: any }> = [
    { id: 'all', label: 'Tümü', icon: Layers },
    { id: 'districts', label: 'İlçeler', icon: MapPin },
    { id: 'highRisk', label: 'Yüksek Risk', icon: AlertTriangle },
    { id: 'influencers', label: 'Influencer', icon: Users },
  ];

  return (
    <div className={cn("relative rounded-xl border border-white/10 bg-black/30 backdrop-blur-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
          <Network size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-white">Sosyal Ağ Analizi</h3>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
            {graphData.stats.totalNodes} Node • {graphData.stats.totalLinks} Edge
          </span>
          {isSimulating && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 animate-pulse">
              Yerleştiriliyor...
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-[10px] font-mono rounded-md transition-all whitespace-nowrap",
              activeFilter === f.id
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-white/50 hover:text-white/80 border border-transparent hover:border-white/10"
            )}
          >
            <f.icon size={10} />
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[9px] font-mono text-red-400">⚠ {graphData.stats.highRiskCount} risk</span>
          <span className="text-[9px] font-mono text-blue-400">★ {graphData.stats.influencerCount} influencer</span>
        </div>
      </div>

      {/* Graph Canvas */}
      <div ref={containerRef} className="relative w-full" style={{ height: '500px' }}>
        {graphData.nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40">
            <Network size={48} className="mb-3 opacity-30" />
            <p className="text-sm">Ağ verisi oluşturulamadı</p>
            <p className="text-xs mt-1">Sosyal medya verisi toplandıktan sonra ağ görselleştirilir</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
            onWheel={handleWheel}
          />
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1">
          <button onClick={handleZoomIn} className="p-1.5 rounded bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-all">
            <ZoomIn size={14} />
          </button>
          <button onClick={handleZoomOut} className="p-1.5 rounded bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-all">
            <ZoomOut size={14} />
          </button>
          <button onClick={handleReset} className="p-1.5 rounded bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-all">
            <RotateCcw size={14} />
          </button>
          <button onClick={toggleSim} className="p-1.5 rounded bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-all">
            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>

        {/* Legend */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-white/10">
          <span className="text-[9px] font-mono text-white/50 mb-0.5">AÇIKLAMA</span>
          {[
            { color: 'hsl(140, 70%, 50%)', label: 'Pozitif' },
            { color: 'hsl(45, 70%, 55%)', label: 'Nötr' },
            { color: 'hsl(0, 70%, 50%)', label: 'Negatif' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
              <span className="text-[9px] text-white/70">{l.label}</span>
            </div>
          ))}
          <div className="border-t border-white/10 mt-1 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-[9px] text-white/70">İlçe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[9px] text-white/70">Kurum</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Node Detail Panel */}
      {selectedNode && (
        <div className="absolute top-0 right-0 w-72 h-full bg-black/90 backdrop-blur-xl border-l border-white/10 overflow-y-auto z-20">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white truncate">{selectedNode.name}</h4>
              <button onClick={() => setSelectedNode(null)} className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white">
                <XIcon size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="text-[9px] font-mono text-white/40">Tür</div>
                  <div className="text-[11px] text-white capitalize">{selectedNode.type}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="text-[9px] font-mono text-white/40">Bahsetme</div>
                  <div className="text-[11px] text-white">{selectedNode.mentions}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="text-[9px] font-mono text-white/40">Duygu</div>
                  <div className="text-[11px]" style={{ color: selectedNode.color }}>
                    {selectedNode.sentiment === 'positive' ? '😊 Pozitif' : selectedNode.sentiment === 'negative' ? '😡 Negatif' : '😐 Nötr'}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                  <div className="text-[9px] font-mono text-white/40">Skor</div>
                  <div className="text-[11px] text-white">{Math.round(selectedNode.sentimentScore * 100)}%</div>
                </div>
              </div>

              {selectedNode.relatedPosts && selectedNode.relatedPosts.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono text-white/50 uppercase mb-2">İlgili İçerikler</div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedNode.relatedPosts.map((post, i) => (
                      <div key={i} className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <p className="text-[10px] text-white/80 leading-relaxed">{post.content}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[9px] text-white/40">{post.source}</span>
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded",
                            post.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                            post.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          )}>
                            {post.sentiment === 'positive' ? 'Pozitif' : post.sentiment === 'negative' ? 'Negatif' : 'Nötr'}
                          </span>
                        </div>
                        {post.url && (
                          <a href={post.url} target="_blank" rel="noopener noreferrer"
                            className="text-[9px] text-primary hover:underline mt-1 block">
                            Kaynağa git →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
