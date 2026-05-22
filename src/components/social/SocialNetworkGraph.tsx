// src/components/social/SocialNetworkGraph.tsx
// Network graph visualization with 2D/3D toggle, sentiment coloring, filters
// Uses react-force-graph-2d and react-force-graph-3d

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import ForceGraph2D from "react-force-graph-2d";
import ForceGraph3D from "react-force-graph-3d";
import {
  Network, Eye, Filter, Maximize2, RotateCcw,
  ZoomIn, ZoomOut, Layers, AlertTriangle, Users,
  MapPin, X as XIcon
} from "lucide-react";
import { generateNetworkGraphData, NetworkNode, NetworkGraphData } from "@/services/network-graph-service";
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

export const SocialNetworkGraph = ({ analyses, keywords = [], className }: SocialNetworkGraphProps) => {
  const [is3D, setIs3D] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [graphDimensions, setGraphDimensions] = useState({ width: 800, height: 500 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);

  // Generate graph data
  const graphData: NetworkGraphData = useMemo(() => {
    return generateNetworkGraphData(analyses, keywords, { filter: activeFilter, maxNodes: 400 });
  }, [analyses, keywords, activeFilter]);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setGraphDimensions({
          width: entry.contentRect.width,
          height: Math.max(400, entry.contentRect.height),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Node paint (2D)
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const n = node as NetworkNode;
    const size = n.val || 5;
    const isSelected = selectedNode?.id === n.id;
    const isHovered = hoveredNode?.id === n.id;

    // Glow effect
    if (isSelected || isHovered) {
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size + 4, 0, 2 * Math.PI);
      ctx.fillStyle = `${n.color}44`;
      ctx.fill();
    }

    // Main circle
    ctx.beginPath();
    ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
    ctx.fillStyle = n.color;
    ctx.fill();

    // Border
    ctx.strokeStyle = isSelected ? '#fff' : `${n.color}88`;
    ctx.lineWidth = isSelected ? 2 : 0.5;
    ctx.stroke();

    // Label (only at sufficient zoom)
    if (globalScale > 1.2 || size > 10 || isHovered) {
      const label = n.name.length > 16 ? n.name.slice(0, 14) + '…' : n.name;
      const fontSize = Math.max(8, 10 / globalScale);
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillText(label, node.x!, node.y! + size + fontSize + 2);
    }

    // Type indicator icon (small shape)
    if (n.type === 'district') {
      ctx.beginPath();
      ctx.arc(node.x! + size * 0.6, node.y! - size * 0.6, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#60a5fa';
      ctx.fill();
    }
  }, [selectedNode, hoveredNode]);

  // Link paint
  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(
      link.source.x, link.source.y,
      link.target.x, link.target.y
    );
    gradient.addColorStop(0, `${link.source.color || '#666'}66`);
    gradient.addColorStop(1, `${link.target.color || '#666'}66`);

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.max(0.5, (link.value || 1) * 0.5);
    ctx.stroke();
  }, []);

  // Node click handler
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node as NetworkNode);
    // Center camera on node
    if (fgRef.current) {
      if (is3D) {
        fgRef.current.cameraPosition(
          { x: node.x, y: node.y, z: 200 },
          node,
          1000
        );
      } else {
        fgRef.current.centerAt(node.x, node.y, 500);
        fgRef.current.zoom(3, 500);
      }
    }
  }, [is3D]);

  // Controls
  const handleZoomIn = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.5, 300);
  const handleZoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() * 0.7, 300);
  const handleReset = () => {
    fgRef.current?.zoomToFit(400, 50);
    setSelectedNode(null);
  };

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
        </div>

        {/* 2D/3D Toggle */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/10">
          <button
            onClick={() => setIs3D(false)}
            className={cn(
              "px-2.5 py-1 text-[10px] font-mono rounded transition-all",
              !is3D ? "bg-primary/30 text-primary border border-primary/40" : "text-white/60 hover:text-white"
            )}
          >
            2D
          </button>
          <button
            onClick={() => setIs3D(true)}
            className={cn(
              "px-2.5 py-1 text-[10px] font-mono rounded transition-all",
              is3D ? "bg-primary/30 text-primary border border-primary/40" : "text-white/60 hover:text-white"
            )}
          >
            3D
          </button>
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

        {/* Stats chips */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[9px] font-mono text-red-400">
            ⚠ {graphData.stats.highRiskCount} risk
          </span>
          <span className="text-[9px] font-mono text-blue-400">
            ★ {graphData.stats.influencerCount} influencer
          </span>
          <span className="text-[9px] font-mono text-white/40">
            Ort. {graphData.stats.avgConnections} bağlantı
          </span>
        </div>
      </div>

      {/* Graph Container */}
      <div ref={containerRef} className="relative w-full" style={{ height: '500px' }}>
        {graphData.nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/40">
            <Network size={48} className="mb-3 opacity-30" />
            <p className="text-sm">Ağ verisi oluşturulamadı</p>
            <p className="text-xs mt-1">Sosyal medya verisi toplandıktan sonra ağ görselleştirilir</p>
          </div>
        ) : !is3D ? (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            width={graphDimensions.width}
            height={500}
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, (node as NetworkNode).val + 3, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            linkCanvasObject={paintLink}
            onNodeClick={handleNodeClick}
            onNodeHover={(node: any) => setHoveredNode(node as NetworkNode | null)}
            cooldownTicks={100}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            backgroundColor="transparent"
          />
        ) : (
          <ForceGraph3D
            ref={fgRef}
            graphData={graphData}
            width={graphDimensions.width}
            height={500}
            nodeColor={(node: any) => (node as NetworkNode).color}
            nodeVal={(node: any) => (node as NetworkNode).val}
            nodeLabel={(node: any) => `${(node as NetworkNode).name} (${(node as NetworkNode).mentions} mention)`}
            linkColor={() => 'rgba(255,255,255,0.15)'}
            linkWidth={(link: any) => Math.max(0.3, (link.value || 1) * 0.3)}
            onNodeClick={handleNodeClick}
            backgroundColor="rgba(0,0,0,0)"
            enableNodeDrag={true}
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
          <button onClick={() => fgRef.current?.zoomToFit(400, 50)} className="p-1.5 rounded bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-all">
            <Maximize2 size={14} />
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
            {[
              { shape: '●', label: 'İlçe', color: '#60a5fa' },
              { shape: '◆', label: 'Kaynak', color: '#4ade80' },
              { shape: '▲', label: 'Anahtar Kelime', color: '#a78bfa' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className="text-[9px]" style={{ color: l.color }}>{l.shape}</span>
                <span className="text-[9px] text-white/70">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cluster info */}
        {graphData.clusters.length > 0 && (
          <div className="absolute top-3 right-3 flex flex-col gap-0.5 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-2 border border-white/10">
            <span className="text-[9px] font-mono text-white/50 mb-0.5">KÜMELER</span>
            {graphData.clusters.slice(0, 6).map(c => (
              <div key={c.id} className="flex items-center gap-1.5 text-[9px] text-white/70">
                <div className="w-2 h-2 rounded-sm" style={{ background: c.color }} />
                <span>{c.name}</span>
                <span className="text-white/40 ml-auto">{c.nodeCount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Node Detail Panel */}
      {selectedNode && (
        <div className="absolute top-0 right-0 w-72 h-full bg-black/90 backdrop-blur-xl border-l border-white/10 overflow-y-auto z-20 animate-in slide-in-from-right-5 duration-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white truncate">{selectedNode.name}</h4>
              <button onClick={() => setSelectedNode(null)} className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white">
                <XIcon size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Node info */}
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

              {/* Related posts */}
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
