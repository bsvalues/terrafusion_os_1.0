/**
 * TFT-150: Market Heat Map Page
 * Spatial visualization of market activity -- sale FREQUENCY by area.
 * Shows WHERE sales are happening, NOT WHAT things are worth.
 * Time slider for date range.
 */
import { useCallback, useMemo, useState } from 'react';

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
// Demo data
// ---------------------------------------------------------------------------

const TIME_RANGES: TimeRange[] = [
  { label: '3 months', months: 3 },
  { label: '6 months', months: 6 },
  { label: '1 year', months: 12 },
  { label: '2 years', months: 24 },
];

const BASE_ACTIVITY: MarketActivityArea[] = [
  { id: 'm1', name: 'Downtown', saleCount: 45, avgDaysOnMarket: 28, totalTransactions: 180, center: [46.23, -119.2] },
  { id: 'm2', name: 'Riverside', saleCount: 82, avgDaysOnMarket: 18, totalTransactions: 328, center: [46.24, -119.21] },
  { id: 'm3', name: 'West Hills', saleCount: 67, avgDaysOnMarket: 22, totalTransactions: 268, center: [46.25, -119.23] },
  { id: 'm4', name: 'Eastgate', saleCount: 23, avgDaysOnMarket: 45, totalTransactions: 92, center: [46.22, -119.18] },
  { id: 'm5', name: 'Southridge', saleCount: 95, avgDaysOnMarket: 14, totalTransactions: 380, center: [46.21, -119.22] },
  { id: 'm6', name: 'Northview', saleCount: 38, avgDaysOnMarket: 32, totalTransactions: 152, center: [46.26, -119.19] },
  { id: 'm7', name: 'Farm District', saleCount: 12, avgDaysOnMarket: 65, totalTransactions: 48, center: [46.215, -119.25] },
];

function scaleActivity(base: MarketActivityArea[], months: number): MarketActivityArea[] {
  const factor = months / 12;
  return base.map((a) => ({
    ...a,
    saleCount: Math.round(a.saleCount * factor),
    totalTransactions: Math.round(a.totalTransactions * factor),
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function intensityColor(saleCount: number, maxCount: number): string {
  const ratio = maxCount > 0 ? saleCount / maxCount : 0;
  if (ratio >= 0.75) return '#EF4444';
  if (ratio >= 0.5) return '#F59E0B';
  if (ratio >= 0.25) return '#3B82F6';
  return '#22C55E';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketHeatMapPage() {
  const [timeRangeIndex, setTimeRangeIndex] = useState(2); // default 1 year
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const timeRange = TIME_RANGES[timeRangeIndex];

  const activityData = useMemo(
    () => scaleActivity(BASE_ACTIVITY, timeRange.months),
    [timeRange.months],
  );

  const maxSaleCount = useMemo(
    () => Math.max(...activityData.map((a) => a.saleCount), 1),
    [activityData],
  );

  const selectedArea = useMemo(
    () => activityData.find((a) => a.id === selectedAreaId) ?? null,
    [activityData, selectedAreaId],
  );

  const totalSales = useMemo(
    () => activityData.reduce((sum, a) => sum + a.saleCount, 0),
    [activityData],
  );

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
          {totalSales.toLocaleString()} total sales
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

          {/* Heat circles */}
          {activityData.map((area) => {
            const xPct = ((area.center[1] + 119.26) / 0.1) * 100;
            const yPct = ((46.27 - area.center[0]) / 0.08) * 100;
            const color = intensityColor(area.saleCount, maxSaleCount);
            const isSelected = selectedAreaId === area.id;
            const ratio = area.saleCount / maxSaleCount;
            const size = 40 + ratio * 80;

            return (
              <button
                key={area.id}
                onClick={() => setSelectedAreaId(isSelected ? null : area.id)}
                className="absolute transition-all duration-300"
                style={{
                  left: `${Math.max(8, Math.min(88, xPct))}%`,
                  top: `${Math.max(8, Math.min(88, yPct))}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                aria-label={`${area.name}: ${area.saleCount} sales`}
              >
                {/* Glow ring */}
                <div
                  className="rounded-full transition-all"
                  style={{
                    width: size,
                    height: size,
                    background: `radial-gradient(circle, ${color}44 0%, ${color}11 50%, transparent 70%)`,
                    border: `2px solid ${color}${isSelected ? 'CC' : '44'}`,
                    boxShadow: isSelected ? `0 0 24px ${color}66` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <span className="text-xs font-bold" style={{ color }}>{area.saleCount}</span>
                  <span className="text-[8px] text-white/50">{area.name}</span>
                </div>
              </button>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-terra-midnight/80 backdrop-blur-sm rounded border border-white/10 p-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Sale Frequency</p>
            <div className="flex gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EF4444]" /> High</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Medium</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3B82F6]" /> Low</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22C55E]" /> Minimal</span>
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
              {[...activityData].sort((a, b) => b.saleCount - a.saleCount).map((area, i) => {
                const color = intensityColor(area.saleCount, maxSaleCount);
                const barWidth = (area.saleCount / maxSaleCount) * 100;
                return (
                  <button
                    key={area.id}
                    role="link"
                    onClick={() => setSelectedAreaId(area.id)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                      selectedAreaId === area.id ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/70">{i + 1}. {area.name}</span>
                      <span className="font-medium" style={{ color }}>{area.saleCount}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: color }} />
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {selectedArea && (
            <Card variant="glass" data-material="bento">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-terra-cyan">{selectedArea.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-white/50">Sales ({timeRange.label})</dt>
                    <dd className="text-white font-medium">{selectedArea.saleCount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/50">Avg Days on Market</dt>
                    <dd className="text-white">{selectedArea.avgDaysOnMarket}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/50">Total Transactions</dt>
                    <dd className="text-white">{selectedArea.totalTransactions.toLocaleString()}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
