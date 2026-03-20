/**
 * TFT-127: Compact Market HeatMap Widget
 * Shows activity density only (NOT prices).
 */
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketHeatPointCompact {
  id: string;
  name: string;
  saleCount: number;
  center: [number, number];
}

export interface MarketHeatMapWidgetProps {
  points: MarketHeatPointCompact[];
  mapCenter?: [number, number];
  onPointClick?: (point: MarketHeatPointCompact) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function intensityColor(count: number, max: number): string {
  const ratio = max > 0 ? count / max : 0;
  if (ratio >= 0.7) return 'hsl(var(--tf-error))';
  if (ratio >= 0.4) return 'hsl(var(--tf-warning))';
  return 'hsl(var(--primary))';
}

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const DEFAULT_POINTS: MarketHeatPointCompact[] = [
  { id: 'mhw1', name: 'Downtown', saleCount: 45, center: [46.23, -119.2] },
  { id: 'mhw2', name: 'Riverside', saleCount: 82, center: [46.24, -119.21] },
  { id: 'mhw3', name: 'West Hills', saleCount: 67, center: [46.25, -119.23] },
  { id: 'mhw4', name: 'Eastgate', saleCount: 23, center: [46.22, -119.18] },
  { id: 'mhw5', name: 'Southridge', saleCount: 95, center: [46.21, -119.22] },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketHeatMapWidget({
  points = DEFAULT_POINTS,
  mapCenter = [46.235, -119.21],
  onPointClick,
  className = '',
}: MarketHeatMapWidgetProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const maxCount = Math.max(...points.map((p) => p.saleCount), 1);

  return (
    <div
      className={`relative bg-terra-midnight rounded border border-white/10 overflow-hidden ${className}`}
      style={{ minHeight: 140 }}
      role="img"
      aria-label="Market activity heatmap widget"
    >
      {/* Grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="mhw-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mhw-grid)" />
        </svg>
      </div>

      {/* Heat points */}
      {points.map((point) => {
        const xPct = ((point.center[1] - mapCenter[1]) / 0.08 + 0.5) * 100;
        const yPct = ((mapCenter[0] - point.center[0]) / 0.06 + 0.5) * 100;
        const color = intensityColor(point.saleCount, maxCount);
        const isHovered = hoveredId === point.id;
        const ratio = point.saleCount / maxCount;
        const size = 24 + ratio * 24;

        return (
          <button
            key={point.id}
            className="absolute transition-all duration-200"
            style={{
              left: `${Math.max(8, Math.min(88, xPct))}%`,
              top: `${Math.max(8, Math.min(88, yPct))}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseEnter={() => setHoveredId(point.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onPointClick?.(point)}
            aria-label={`${point.name}: ${point.saleCount} sales`}
          >
            <div
              className="rounded-full transition-all"
              style={{
                width: size,
                height: size,
                background: `radial-gradient(circle, ${color}${isHovered ? '66' : '44'} 0%, transparent 70%)`,
              }}
            />
            {isHovered && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-terra-slate border border-white/20 rounded px-1.5 py-0.5 text-[9px] whitespace-nowrap z-20">
                <span className="text-white">{point.name}</span>
                <span className="text-white/50 ml-1">{point.saleCount} sales</span>
              </div>
            )}
          </button>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-1 right-1 flex gap-1.5 text-[8px] bg-terra-midnight/60 px-1 py-0.5 rounded">
        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--tf-error))' }} />High</span>
        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--tf-warning))' }} />Med</span>
        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--primary))' }} />Low</span>
      </div>
    </div>
  );
}
