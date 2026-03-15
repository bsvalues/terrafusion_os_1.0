/**
 * TFT-126: Compact Sentiment HeatMap Widget
 * Simplified legend, used in dashboard cards.
 */
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SentimentAreaCompact {
  id: string;
  name: string;
  score: number;
  center: [number, number];
}

export interface SentimentHeatMapWidgetProps {
  areas: SentimentAreaCompact[];
  mapCenter?: [number, number];
  onAreaClick?: (area: SentimentAreaCompact) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sentimentColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const DEFAULT_AREAS: SentimentAreaCompact[] = [
  { id: 'sw1', name: 'Downtown', score: 72, center: [46.23, -119.2] },
  { id: 'sw2', name: 'Riverside', score: 85, center: [46.24, -119.21] },
  { id: 'sw3', name: 'West Hills', score: 79, center: [46.25, -119.23] },
  { id: 'sw4', name: 'Eastgate', score: 45, center: [46.22, -119.18] },
  { id: 'sw5', name: 'Southridge', score: 91, center: [46.21, -119.22] },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SentimentHeatMapWidget({
  areas = DEFAULT_AREAS,
  mapCenter = [46.235, -119.21],
  onAreaClick,
  className = '',
}: SentimentHeatMapWidgetProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      className={`relative bg-terra-midnight rounded border border-white/10 overflow-hidden ${className}`}
      style={{ minHeight: 140 }}
      role="img"
      aria-label="Sentiment heatmap widget"
    >
      {/* Grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="shw-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#shw-grid)" />
        </svg>
      </div>

      {/* Heat blobs */}
      {areas.map((area) => {
        const xPct = ((area.center[1] - mapCenter[1]) / 0.08 + 0.5) * 100;
        const yPct = ((mapCenter[0] - area.center[0]) / 0.06 + 0.5) * 100;
        const color = sentimentColor(area.score);
        const isHovered = hoveredId === area.id;

        return (
          <button
            key={area.id}
            className="absolute transition-all duration-200"
            style={{
              left: `${Math.max(8, Math.min(88, xPct))}%`,
              top: `${Math.max(8, Math.min(88, yPct))}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseEnter={() => setHoveredId(area.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onAreaClick?.(area)}
            aria-label={`${area.name}: ${area.score}`}
          >
            <div
              className="rounded-full transition-all"
              style={{
                width: 36,
                height: 36,
                background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`,
                boxShadow: isHovered ? `0 0 12px ${color}44` : 'none',
              }}
            />
            {isHovered && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-terra-slate border border-white/20 rounded px-1.5 py-0.5 text-[9px] whitespace-nowrap z-20">
                <span className="text-white">{area.name}</span>
                <span className="ml-1" style={{ color }}>{area.score}</span>
              </div>
            )}
          </button>
        );
      })}

      {/* Simplified legend */}
      <div className="absolute bottom-1 right-1 flex gap-1.5 text-[8px] bg-terra-midnight/60 px-1 py-0.5 rounded">
        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />Good</span>
        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />Fair</span>
        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />Low</span>
      </div>
    </div>
  );
}
