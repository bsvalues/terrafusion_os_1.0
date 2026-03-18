/**
 * BIV-097: Animated Trend Map
 * Temporal spatial visualization with play/pause/scrub timeline.
 * Color interpolation between time frames. Legend with dynamic scale.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrendFrame {
  timestamp: string;
  label: string;
  areas: TrendAreaData[];
}

export interface TrendAreaData {
  id: string;
  name: string;
  value: number;
  center: [number, number];
}

export interface AnimatedTrendMapProps {
  frames: TrendFrame[];
  valueLabel?: string;
  colorScale?: { low: string; mid: string; high: string };
  className?: string;
}

// ---------------------------------------------------------------------------
// Default data
// ---------------------------------------------------------------------------

const DEFAULT_FRAMES: TrendFrame[] = Array.from({ length: 8 }, (_, i) => {
  const year = 2019 + i;
  return {
    timestamp: `${year}-01-01`,
    label: String(year),
    areas: [
      { id: 'a1', name: 'Downtown', value: 120 + i * 15 + Math.round(Math.random() * 10), center: [46.23, -119.2] },
      { id: 'a2', name: 'Riverside', value: 85 + i * 12 + Math.round(Math.random() * 8), center: [46.24, -119.21] },
      { id: 'a3', name: 'West Hills', value: 95 + i * 10 + Math.round(Math.random() * 12), center: [46.25, -119.23] },
      { id: 'a4', name: 'Eastgate', value: 60 + i * 8 + Math.round(Math.random() * 6), center: [46.22, -119.18] },
      { id: 'a5', name: 'Southridge', value: 110 + i * 14 + Math.round(Math.random() * 10), center: [46.21, -119.22] },
    ],
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function interpolateColor(lowHex: string, highHex: string, t: number): string {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(lowHex);
  const [r2, g2, b2] = parse(highHex);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AnimatedTrendMap({
  frames = DEFAULT_FRAMES,
  valueLabel = 'Activity',
  colorScale = { low: '#22C55E', mid: '#F59E0B', high: '#EF4444' },
  className = '',
}: AnimatedTrendMapProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentFrame = frames[frameIndex] ?? frames[0];

  const { minValue, maxValue } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    frames.forEach((f) =>
      f.areas.forEach((a) => {
        if (a.value < min) min = a.value;
        if (a.value > max) max = a.value;
      }),
    );
    return { minValue: min, maxValue: max };
  }, [frames]);

  const getColor = useCallback(
    (value: number) => {
      const range = maxValue - minValue || 1;
      const t = (value - minValue) / range;
      if (t < 0.5) return interpolateColor(colorScale.low, colorScale.mid, t * 2);
      return interpolateColor(colorScale.mid, colorScale.high, (t - 0.5) * 2);
    },
    [minValue, maxValue, colorScale],
  );

  // Play/pause logic
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setFrameIndex((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, frames.length]);

  const togglePlay = useCallback(() => {
    if (frameIndex >= frames.length - 1) {
      setFrameIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [frameIndex, frames.length]);

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setFrameIndex(Number(e.target.value));
  }, []);

  return (
    <div className={`flex flex-col bg-terra-midnight text-white rounded-lg border border-white/10 overflow-hidden ${className}`}>
      {/* Map area */}
      <div className="flex-1 relative min-h-[300px]">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="trend-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#trend-grid)" />
          </svg>
        </div>

        {/* Area indicators */}
        {currentFrame?.areas.map((area) => {
          const xPct = ((area.center[1] + 119.24) / 0.08) * 100;
          const yPct = ((46.27 - area.center[0]) / 0.08) * 100;
          const color = getColor(area.value);
          const size = 40 + ((area.value - minValue) / (maxValue - minValue || 1)) * 50;

          return (
            <div
              key={area.id}
              className="absolute transition-all duration-700 ease-in-out"
              style={{
                left: `${Math.max(8, Math.min(88, xPct))}%`,
                top: `${Math.max(8, Math.min(88, yPct))}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="rounded-full flex flex-col items-center justify-center"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: `${color}33`,
                  border: `2px solid ${color}88`,
                  transition: 'all 700ms ease-in-out',
                }}
              >
                <span className="text-xs font-bold" style={{ color }}>{area.value}</span>
                <span className="text-[7px] text-white/50">{area.name}</span>
              </div>
            </div>
          );
        })}

        {/* Frame label */}
        <div className="absolute top-4 left-4 text-2xl font-bold text-white/20">
          {currentFrame?.label}
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-terra-midnight/80 backdrop-blur-sm rounded border border-white/10 p-2">
          <p className="text-[9px] text-white/40 uppercase tracking-wider mb-1">{valueLabel}</p>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-white/40">{minValue}</span>
            <div
              className="w-20 h-2 rounded-full"
              style={{
                background: `linear-gradient(to right, ${colorScale.low}, ${colorScale.mid}, ${colorScale.high})`,
              }}
            />
            <span className="text-[9px] text-white/40">{maxValue}</span>
          </div>
        </div>
      </div>

      {/* Timeline controls */}
      <div className="flex-shrink-0 p-3 border-t border-white/10 flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-terra-cyan/20 border border-terra-cyan/40 text-terra-cyan hover:bg-terra-cyan/30 transition-colors flex items-center justify-center text-xs"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '||' : '\u25B6'}
        </button>

        <input
          type="range"
          min="0"
          max={frames.length - 1}
          value={frameIndex}
          onChange={handleScrub}
          className="flex-1 accent-terra-cyan h-1"
          aria-label="Timeline scrubber"
        />

        <span className="text-xs text-white/60 min-w-[60px] text-right">
          {currentFrame?.label}
        </span>
      </div>
    </div>
  );
}
