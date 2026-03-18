/**
 * BIV-100: Market Activity HeatMap
 * Sale frequency heatmap (NOT prices).
 * Intensity-based rendering with configurable radius and blur.
 */
import { useCallback, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketHeatPoint {
  id: string;
  name: string;
  saleCount: number;
  center: [number, number];
}

export interface MarketHeatMapProps {
  points: MarketHeatPoint[];
  mapCenter?: [number, number];
  radius?: number;
  blur?: number;
  onPointClick?: (point: MarketHeatPoint) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const DEFAULT_POINTS: MarketHeatPoint[] = [
  { id: 'mh1', name: 'Downtown', saleCount: 45, center: [46.23, -119.2] },
  { id: 'mh2', name: 'Riverside', saleCount: 82, center: [46.24, -119.21] },
  { id: 'mh3', name: 'West Hills', saleCount: 67, center: [46.25, -119.23] },
  { id: 'mh4', name: 'Eastgate', saleCount: 23, center: [46.22, -119.18] },
  { id: 'mh5', name: 'Southridge', saleCount: 95, center: [46.21, -119.22] },
  { id: 'mh6', name: 'Northview', saleCount: 38, center: [46.26, -119.19] },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function intensityColor(count: number, max: number): string {
  const ratio = max > 0 ? count / max : 0;
  if (ratio >= 0.7) return '#EF4444';
  if (ratio >= 0.4) return '#F59E0B';
  if (ratio >= 0.15) return '#3B82F6';
  return '#22C55E';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketHeatMap({
  points = DEFAULT_POINTS,
  mapCenter = [46.235, -119.21],
  radius = 70,
  blur = 20,
  onPointClick,
  className = '',
}: MarketHeatMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const maxCount = Math.max(...points.map((p) => p.saleCount), 1);

  const handleClick = useCallback(
    (point: MarketHeatPoint) => {
      onPointClick?.(point);
    },
    [onPointClick],
  );

  return (
    <div
      className={`relative bg-terra-midnight rounded-lg border border-white/10 overflow-hidden min-h-[300px] ${className}`}
      role="img"
      aria-label="Market activity heatmap - sale frequency"
    >
      {/* Grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="mhm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mhm-grid)" />
        </svg>
      </div>

      {/* Heat points */}
      {points.map((point) => {
        const xPct = ((point.center[1] - mapCenter[1]) / 0.08 + 0.5) * 100;
        const yPct = ((mapCenter[0] - point.center[0]) / 0.06 + 0.5) * 100;
        const color = intensityColor(point.saleCount, maxCount);
        const isHovered = hoveredId === point.id;
        const intensity = point.saleCount / maxCount;
        const size = radius * (0.6 + intensity * 0.8);

        return (
          <button
            key={point.id}
            className="absolute transition-all duration-200"
            style={{
              left: `${Math.max(5, Math.min(90, xPct))}%`,
              top: `${Math.max(5, Math.min(90, yPct))}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseEnter={() => setHoveredId(point.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handleClick(point)}
            aria-label={`${point.name}: ${point.saleCount} sales`}
          >
            <div
              className="rounded-full transition-all duration-200"
              style={{
                width: size,
                height: size,
                background: `radial-gradient(circle, ${color}${isHovered ? '66' : '44'} 0%, ${color}18 50%, transparent 70%)`,
                filter: `blur(${blur * 0.2}px)`,
                boxShadow: isHovered ? `0 0 16px ${color}44` : 'none',
              }}
            />

            {/* Center label */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              style={{ filter: 'none' }}
            >
              <span className="text-xs font-bold" style={{ color }}>{point.saleCount}</span>
            </div>

            {/* Tooltip */}
            {isHovered && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-terra-slate border border-white/20 rounded px-2 py-1 text-xs whitespace-nowrap z-20 shadow-xl" style={{ filter: 'none' }}>
                <p className="font-medium text-white">{point.name}</p>
                <p className="text-white/60">{point.saleCount} sales</p>
              </div>
            )}
          </button>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-terra-midnight/80 backdrop-blur-sm rounded border border-white/10 p-2">
        <p className="text-[9px] text-white/40 uppercase tracking-wider mb-1">Sale Frequency</p>
        <div className="flex gap-2 text-[9px]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EF4444]" /> High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Med</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Low</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22C55E]" /> Min</span>
        </div>
      </div>
    </div>
  );
}
