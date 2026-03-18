/**
 * BIV-121: Compact Inline Sentiment Widget
 * Shows overall score + sparkline trend for a neighborhood.
 * Used inside workbench parcel view.
 */
import { useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SentimentWidgetProps {
  neighborhood: string;
  score: number;
  trend: number[];
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

function sentimentLabel(score: number): string {
  if (score >= 80) return 'Positive';
  if (score >= 60) return 'Neutral';
  return 'Low';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SentimentWidget({ neighborhood, score, trend, className = '' }: SentimentWidgetProps) {
  const color = sentimentColor(score);
  const label = sentimentLabel(score);

  const sparklinePath = useMemo(() => {
    if (trend.length < 2) return '';
    const width = 60;
    const height = 20;
    const min = Math.min(...trend);
    const max = Math.max(...trend);
    const range = max - min || 1;
    return trend
      .map((v, i) => {
        const x = (i / (trend.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [trend]);

  const trendDirection = useMemo(() => {
    if (trend.length < 2) return 'stable';
    const last = trend[trend.length - 1];
    const prev = trend[trend.length - 2];
    if (last > prev) return 'up';
    if (last < prev) return 'down';
    return 'stable';
  }, [trend]);

  const trendArrow = trendDirection === 'up' ? '\u2191' : trendDirection === 'down' ? '\u2193' : '\u2192';

  return (
    <div
      className={`inline-flex items-center gap-3 px-3 py-2 rounded-lg border bg-terra-slate/20 backdrop-blur-sm ${className}`}
      style={{ borderColor: `${color}33` }}
      role="status"
      aria-label={`${neighborhood} sentiment: ${score} (${label})`}
    >
      {/* Score badge */}
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold leading-none" style={{ color }}>
          {score}
        </span>
        <span className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">{label}</span>
      </div>

      {/* Sparkline */}
      <div className="flex flex-col items-center gap-0.5">
        <svg width={60} height={20} className="block">
          <path d={sparklinePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-[9px] text-white/30">{neighborhood}</span>
      </div>

      {/* Trend indicator */}
      <span className="text-sm" style={{ color }}>
        {trendArrow}
      </span>
    </div>
  );
}
