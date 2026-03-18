/**
 * ResidualMapPanel.tsx (Phase 17)
 *
 * SVG choropleth of model residuals by neighborhood.
 * Green = under-assessed (< -5%), Yellow = neutral (-5% to +5%), Red = over-assessed (> +5%).
 * Sidebar: global stats, neighborhood residual list sorted by magnitude.
 * Click neighborhood → selectNeighborhood for drill-through.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAtlasSpatialStore } from '@/stores/atlasSpatialStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function residualColor(pct: number): string {
  if (pct < -5) return '#22C55E';    // green: under-assessed
  if (pct > 5) return '#EF4444';     // red: over-assessed
  return '#F59E0B';                   // yellow: neutral
}

function residualLabel(pct: number): string {
  if (pct < -5) return 'Under-assessed';
  if (pct > 5) return 'Over-assessed';
  return 'Neutral';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResidualMapPanel() {
  const residualData = useAtlasSpatialStore((s) => s.residualData);
  const selectNeighborhood = useAtlasSpatialStore((s) => s.selectNeighborhood);

  if (!residualData) {
    return (
      <div data-testid="residual-map" className="p-4">
        <span style={{ color: 'hsl(var(--tf-muted))' }}>No residual data available</span>
      </div>
    );
  }

  const sorted = [...residualData.neighborhoods].sort(
    (a, b) => Math.abs(b.medianResidualPct) - Math.abs(a.medianResidualPct),
  );

  return (
    <div data-testid="residual-map" className="flex h-full" style={{ color: 'hsl(var(--tf-fg))' }}>
      {/* Map area */}
      <main className="flex-1 relative overflow-hidden" style={{ background: 'hsl(var(--tf-bg))' }}>
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="res-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#res-grid)" />
          </svg>
        </div>

        {/* Neighborhood areas */}
        {residualData.neighborhoods.map((n) => {
          const xPct = ((n.center[1] + 119.8) / 0.8) * 100;
          const yPct = ((46.35 - n.center[0]) / 0.2) * 100;
          const color = residualColor(n.medianResidualPct);
          const size = 50 + n.parcelCount / 200;

          return (
            <button
              key={n.code}
              data-neighborhood={n.code}
              onClick={() => selectNeighborhood(n.code)}
              className="absolute transition-all duration-300"
              style={{
                left: `${Math.max(8, Math.min(88, xPct))}%`,
                top: `${Math.max(8, Math.min(88, yPct))}%`,
                transform: 'translate(-50%, -50%)',
              }}
              aria-label={`${n.name}: residual ${n.medianResidualPct.toFixed(1)}%`}
            >
              <div
                className="rounded-lg flex flex-col items-center justify-center"
                style={{
                  width: size,
                  height: size * 0.75,
                  backgroundColor: `${color}22`,
                  border: `2px solid ${color}66`,
                }}
              >
                <span className="text-xs font-bold" style={{ color }}>
                  {n.medianResidualPct > 0 ? '+' : ''}{n.medianResidualPct.toFixed(1)}%
                </span>
                <span className="text-[8px] truncate max-w-full px-1" style={{ color: 'hsl(var(--tf-muted))' }}>
                  {n.name}
                </span>
              </div>
            </button>
          );
        })}

        {/* Legend */}
        <div
          data-testid="residual-legend"
          className="absolute bottom-4 left-4 rounded border p-3"
          style={{
            background: 'hsl(var(--tf-bg) / 0.8)',
            borderColor: 'hsl(var(--tf-border) / 0.2)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--tf-muted))' }}>
            Residual %
          </p>
          <div className="flex gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" /> Under (&lt;-5%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Neutral
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Over (&gt;+5%)
            </span>
          </div>
        </div>
      </main>

      {/* Sidebar */}
      <aside
        className="w-80 flex-shrink-0 overflow-y-auto p-4 space-y-4"
        style={{ borderLeft: '1px solid hsl(var(--tf-border) / 0.2)' }}
      >
        <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-accent))' }}>
          Residual Map
        </h2>

        {/* Global summary */}
        <div
          data-testid="residual-summary"
          className="p-3 rounded border"
          style={{
            borderColor: 'hsl(var(--tf-border) / 0.2)',
            background: 'hsl(var(--tf-surface) / 0.3)',
          }}
        >
          <p className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Global Median Residual</p>
          <p className="text-xl font-bold font-mono">
            ${residualData.globalMedianResidual.toLocaleString()}
          </p>
          <p className="text-sm font-mono" style={{ color: residualColor(residualData.globalMedianResidualPct) }}>
            {residualData.globalMedianResidualPct > 0 ? '+' : ''}{residualData.globalMedianResidualPct.toFixed(1)}%
          </p>
        </div>

        {/* Neighborhood list sorted by magnitude */}
        <Card data-material="bento">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
              By Neighborhood
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {sorted.map((n) => {
              const color = residualColor(n.medianResidualPct);
              return (
                <button
                  key={n.code}
                  data-neighborhood={n.code}
                  onClick={() => selectNeighborhood(n.code)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors"
                  style={{ color: 'hsl(var(--tf-fg))' }}
                >
                  <div className="text-left">
                    <div>{n.name}</div>
                    <div className="text-[10px]" style={{ color: 'hsl(var(--tf-muted))' }}>
                      {n.parcelCount.toLocaleString()} parcels
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs" style={{ color }}>
                      {n.medianResidualPct > 0 ? '+' : ''}{n.medianResidualPct.toFixed(1)}%
                    </span>
                    <Badge variant="outline">{residualLabel(n.medianResidualPct)}</Badge>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

export default ResidualMapPanel;
