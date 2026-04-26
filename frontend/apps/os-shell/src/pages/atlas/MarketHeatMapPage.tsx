/**
 * TFT-150: Market Heat Map Page
 * ------------------------------------------------------------------
 * Governed Atlas surface for neighborhood-level sales-frequency mapping.
 *
 * Current truth:
 * - Atlas does not yet expose a governed market-activity feed for this page.
 * - No seeded area rankings or pseudo-sales clusters are rendered.
 * - The page stays mounted with explicit unavailable disclosure until the
 *   live market-heat endpoint exists.
 */
import { useCallback, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketActivityArea {
  id: string;
  name: string;
  saleCount: number;
  avgDaysOnMarket: number;
  totalTransactions: number;
  center: [number, number];
}

interface TimeRange {
  label: string;
  months: number;
}

// ---------------------------------------------------------------------------
// Source-backed data
// ---------------------------------------------------------------------------

const TIME_RANGES: TimeRange[] = [
  { label: '3 months', months: 3 },
  { label: '6 months', months: 6 },
  { label: '1 year', months: 12 },
  { label: '2 years', months: 24 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketHeatMapPage() {
  const [timeRangeIndex, setTimeRangeIndex] = useState(2); // default 1 year
  const timeRange = TIME_RANGES[timeRangeIndex];

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeRangeIndex(Number(e.target.value));
  }, []);

  return (
    <div data-testid="market-heat-map" className="flex flex-col h-full bg-terra-midnight text-white">
      {/* Time slider header */}
      <header className="flex-shrink-0 p-3 border-b border-white/10 flex items-center gap-4">
        <span className="text-sm font-semibold text-terra-cyan">Market Activity</span>

        <div className="flex items-center gap-3 flex-1 max-w-md">
          <span className="text-[10px] text-white/40">3mo</span>
          <input
            type="range"
            min="0"
            max={TIME_RANGES.length - 1}
            value={timeRangeIndex}
            onChange={handleSliderChange}
            className="flex-1 accent-terra-cyan h-1"
            aria-label="Time range slider"
          />
          <span className="text-[10px] text-white/40">2yr</span>
        </div>

        <span className="text-xs text-white/60 bg-terra-slate/40 px-2 py-1 rounded">
          {timeRange.label}
        </span>

        <span className="text-xs text-white/40 ml-auto">
          Live sales activity unavailable
        </span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <main className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="mkt-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mkt-grid)" />
            </svg>
          </div>

          <div
            data-testid="market-heat-map-unavailable"
            className="absolute inset-0 flex items-center justify-center p-6"
          >
            <div className="max-w-xl rounded-xl border border-white/10 bg-terra-midnight/75 p-6 text-center backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terra-cyan">
                Governed Atlas Required
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Market activity heat map unavailable.
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/70">
                Atlas does not have a governed neighborhood sales-frequency feed for this page,
                and no seeded area rankings or pseudo-sale clusters are rendered here.
              </p>
              <p className="mt-4 text-xs text-white/50">
                Selected time range: {timeRange.label}. Control remains visible so the live filter
                contract is preserved once the backend feed exists.
              </p>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 border-l border-white/10 overflow-y-auto p-4 space-y-4">
          <Card variant="glass" data-material="bento">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70">Activity Rankings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-sm text-white/80">Governed neighborhood rankings unavailable.</p>
              <p className="text-xs leading-5 text-white/55">
                This panel stays mounted without seeded Richland or city-level activity rows until
                Atlas exposes a live market-heat dataset.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
