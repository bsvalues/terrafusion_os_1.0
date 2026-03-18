/**
 * BIV-120: Neighborhood Sentiment Dashboard
 * Full sentiment dashboard with heatmap overlay, trend charts, and category breakdown.
 * Atlas spatial visualization -- renders sentiment data on a map.
 */
import { useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SentimentCategory {
  name: string;
  score: number;
}

export interface NeighborhoodSentiment {
  id: string;
  name: string;
  overallScore: number;
  trend: number[];
  categories: SentimentCategory[];
  center: [number, number];
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const SENTIMENT_DATA: NeighborhoodSentiment[] = [
  {
    id: 'ns1',
    name: 'Downtown',
    overallScore: 72,
    trend: [65, 68, 70, 69, 72, 74, 72],
    categories: [
      { name: 'Safety', score: 68 },
      { name: 'Schools', score: 55 },
      { name: 'Amenities', score: 88 },
      { name: 'Transit', score: 85 },
      { name: 'Parks', score: 62 },
    ],
    center: [46.23, -119.2],
  },
  {
    id: 'ns2',
    name: 'Riverside',
    overallScore: 85,
    trend: [78, 80, 82, 83, 84, 85, 85],
    categories: [
      { name: 'Safety', score: 90 },
      { name: 'Schools', score: 82 },
      { name: 'Amenities', score: 78 },
      { name: 'Transit', score: 70 },
      { name: 'Parks', score: 92 },
    ],
    center: [46.24, -119.21],
  },
  {
    id: 'ns3',
    name: 'West Hills',
    overallScore: 79,
    trend: [75, 76, 77, 78, 78, 79, 79],
    categories: [
      { name: 'Safety', score: 85 },
      { name: 'Schools', score: 88 },
      { name: 'Amenities', score: 72 },
      { name: 'Transit', score: 55 },
      { name: 'Parks', score: 80 },
    ],
    center: [46.25, -119.23],
  },
  {
    id: 'ns4',
    name: 'Eastgate',
    overallScore: 58,
    trend: [55, 54, 56, 57, 58, 58, 58],
    categories: [
      { name: 'Safety', score: 62 },
      { name: 'Schools', score: 48 },
      { name: 'Amenities', score: 55 },
      { name: 'Transit', score: 65 },
      { name: 'Parks', score: 50 },
    ],
    center: [46.22, -119.18],
  },
  {
    id: 'ns5',
    name: 'Southridge',
    overallScore: 91,
    trend: [82, 85, 87, 89, 90, 90, 91],
    categories: [
      { name: 'Safety', score: 94 },
      { name: 'Schools', score: 92 },
      { name: 'Amenities', score: 85 },
      { name: 'Transit', score: 78 },
      { name: 'Parks', score: 95 },
    ],
    center: [46.21, -119.22],
  },
  {
    id: 'ns6',
    name: 'Northview',
    overallScore: 67,
    trend: [70, 69, 68, 67, 66, 67, 67],
    categories: [
      { name: 'Safety', score: 72 },
      { name: 'Schools', score: 65 },
      { name: 'Amenities', score: 60 },
      { name: 'Transit', score: 58 },
      { name: 'Parks', score: 75 },
    ],
    center: [46.26, -119.19],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sentimentColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
}

function Sparkline({ data, color, width = 80, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SentimentDashboard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const selectedNeighborhood = useMemo(
    () => SENTIMENT_DATA.find((n) => n.id === selectedId) ?? null,
    [selectedId],
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    SENTIMENT_DATA.forEach((n) => n.categories.forEach((c) => set.add(c.name)));
    return Array.from(set);
  }, []);

  const sortedData = useMemo(() => {
    return [...SENTIMENT_DATA].sort((a, b) => b.overallScore - a.overallScore);
  }, []);

  return (
    <div data-testid="sentiment-dashboard" className="flex h-full bg-terra-midnight text-white">
      {/* Map area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="sent-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#sent-grid)" />
          </svg>
        </div>

        {/* Heatmap bubbles */}
        {SENTIMENT_DATA.map((n) => {
          const xPct = ((n.center[1] + 119.24) / 0.08) * 100;
          const yPct = ((46.27 - n.center[0]) / 0.08) * 100;
          const color = sentimentColor(n.overallScore);
          const isSelected = selectedId === n.id;
          const size = 40 + n.overallScore * 0.6;

          return (
            <button
              key={n.id}
              onClick={() => setSelectedId(isSelected ? null : n.id)}
              className="absolute transition-all duration-300 group"
              style={{
                left: `${Math.max(8, Math.min(88, xPct))}%`,
                top: `${Math.max(8, Math.min(88, yPct))}%`,
                transform: 'translate(-50%, -50%)',
              }}
              aria-label={`${n.name}: sentiment score ${n.overallScore}`}
            >
              <div
                className="rounded-full flex flex-col items-center justify-center transition-all"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: `${color}${isSelected ? '44' : '22'}`,
                  border: `2px solid ${color}${isSelected ? 'DD' : '66'}`,
                  boxShadow: isSelected ? `0 0 24px ${color}44` : 'none',
                }}
              >
                <span className="text-xs font-bold" style={{ color }}>{n.overallScore}</span>
                <span className="text-[8px] text-white/60">{n.name}</span>
              </div>
            </button>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-terra-midnight/80 backdrop-blur-sm rounded border border-white/10 p-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Sentiment Score</p>
          <div className="flex gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" /> 80+
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> 60-79
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> &lt;60
            </span>
          </div>
        </div>
      </main>

      {/* Right panel */}
      <aside className="w-80 flex-shrink-0 border-l border-white/10 overflow-y-auto p-4 space-y-4">
        <h1 className="text-lg font-semibold text-terra-cyan">Sentiment Dashboard</h1>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              categoryFilter === null
                ? 'bg-terra-cyan/20 text-terra-cyan border border-terra-cyan/40'
                : 'bg-white/5 text-white/50 border border-white/10 hover:text-white/80'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                categoryFilter === cat
                  ? 'bg-terra-cyan/20 text-terra-cyan border border-terra-cyan/40'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:text-white/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Rankings */}
        <Card variant="glass" data-material="bento">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Rankings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedData.map((n, i) => {
              const score = categoryFilter
                ? n.categories.find((c) => c.name === categoryFilter)?.score ?? n.overallScore
                : n.overallScore;
              const color = sentimentColor(score);
              return (
                <button
                  key={n.id}
                  onClick={() => setSelectedId(n.id)}
                  role="link"
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                    selectedId === n.id ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="text-white/30 w-4 text-right">{i + 1}</span>
                  <span className="flex-1 text-left text-white/80">{n.name}</span>
                  <Sparkline data={n.trend} color={color} />
                  <span className="font-bold text-sm" style={{ color }}>{score}</span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Selected detail */}
        {selectedNeighborhood && (
          <Card variant="glass" data-material="bento">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-terra-cyan">{selectedNeighborhood.name}</CardTitle>
                <span
                  className="text-lg font-bold"
                  style={{ color: sentimentColor(selectedNeighborhood.overallScore) }}
                >
                  {selectedNeighborhood.overallScore}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Trend */}
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">7-Period Trend</p>
                <Sparkline
                  data={selectedNeighborhood.trend}
                  color={sentimentColor(selectedNeighborhood.overallScore)}
                  width={240}
                  height={40}
                />
              </div>

              {/* Category breakdown */}
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Categories</p>
                <div className="space-y-2">
                  {selectedNeighborhood.categories.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-white/60">{cat.name}</span>
                        <span style={{ color: sentimentColor(cat.score) }}>{cat.score}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${cat.score}%`,
                            backgroundColor: sentimentColor(cat.score),
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </aside>
    </div>
  );
}
