/**
 * BIV-099: Sentiment HeatMap Overlay
 * Neighborhood sentiment heatmap overlay.
 * Color scale: green (positive) to red (negative).
 * Hover tooltip with neighborhood name + score.
 */
import { useCallback, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SentimentArea {
  id: string;
  name: string;
  score: number; // 0-100
  center: [number, number];
  radius?: number;
}

export interface SentimentHeatMapProps {
  areas: SentimentArea[];
  mapCenter?: [number, number];
  onAreaClick?: (area: SentimentArea) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sentimentColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#84CC16';
  if (score >= 40) return '#F59E0B';
  if (score >= 20) return '#F97316';
  return '#EF4444';
}

// ---------------------------------------------------------------------------
// Empty data
// ---------------------------------------------------------------------------

const EMPTY_AREAS: SentimentArea[] = [];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SentimentHeatMap({
  areas = EMPTY_AREAS,
  mapCenter = [46.235, -119.21],
  onAreaClick,
  className = '',
}: SentimentHeatMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleClick = useCallback(
    (area: SentimentArea) => {
      onAreaClick?.(area);
    },
    [onAreaClick],
  );

  return (
    <div
      className={`relative bg-terra-midnight rounded-lg border border-white/10 overflow-hidden min-h-[300px] ${className}`}
      role="img"
      aria-label="Neighborhood sentiment heatmap"
    >
      {areas.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-sm text-white/50">
          No governed sentiment layer loaded.
        </div>
      )}

      {/* Grid */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="shm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#shm-grid)" />
        </svg>
      </div>

      {/* Heat blobs */}
      {areas.map((area) => {
        const xPct = ((area.center[1] - mapCenter[1]) / 0.08 + 0.5) * 100;
        const yPct = ((mapCenter[0] - area.center[0]) / 0.06 + 0.5) * 100;
        const color = sentimentColor(area.score);
        const isHovered = hoveredId === area.id;
        const size = (area.radius ?? 60) + (isHovered ? 10 : 0);

        return (
          <button
            key={area.id}
            className="absolute transition-all duration-200"
            style={{
              left: `${Math.max(5, Math.min(90, xPct))}%`,
              top: `${Math.max(5, Math.min(90, yPct))}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onMouseEnter={() => setHoveredId(area.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handleClick(area)}
            aria-label={`${area.name}: sentiment ${area.score}`}
          >
            <div
              className="rounded-full transition-all duration-200"
              style={{
                width: size,
                height: size,
                background: `radial-gradient(circle, ${color}55 0%, ${color}22 40%, transparent 70%)`,
                boxShadow: isHovered ? `0 0 20px ${color}44` : 'none',
              }}
            />

            {/* Tooltip */}
            {isHovered && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-terra-slate border border-white/20 rounded px-2 py-1 text-xs whitespace-nowrap z-20 shadow-xl">
                <p className="font-medium text-white">{area.name}</p>
                <p style={{ color }}>Score: {area.score}</p>
              </div>
            )}
          </button>
        );
      })}

      {/* Color scale legend */}
      {areas.length > 0 && (
      <div className="absolute bottom-3 left-3 bg-terra-midnight/80 backdrop-blur-sm rounded border border-white/10 p-2">
        <p className="text-[9px] text-white/40 uppercase tracking-wider mb-1">Sentiment</p>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-[#EF4444]">Low</span>
          <div
            className="w-16 h-2 rounded-full"
            style={{ background: 'linear-gradient(to right, #EF4444, #F97316, #F59E0B, #84CC16, #22C55E)' }}
          />
          <span className="text-[9px] text-[#22C55E]">High</span>
        </div>
      </div>
      )}
    </div>
  );
}
