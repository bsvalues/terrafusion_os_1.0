import { useMemo } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { NeighborhoodStat } from '../types/geoforge.types';

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

function grade(med: number, cod: number, prd: number): Grade {
  if (cod <= 12 && med >= 0.97 && med <= 1.03 && prd >= 0.98 && prd <= 1.03) return 'A';
  if (cod <= 15 && med >= 0.95 && med <= 1.05 && prd >= 0.97 && prd <= 1.04) return 'B';
  if (cod <= 20 && med >= 0.90 && med <= 1.10 && prd >= 0.96 && prd <= 1.05) return 'C';
  if (cod <= 25 && med >= 0.85 && med <= 1.15) return 'D';
  return 'F';
}

const GRADE_COLOR: Record<Grade, string> = {
  A: 'text-emerald-400',
  B: 'text-green-400',
  C: 'text-amber-400',
  D: 'text-orange-400',
  F: 'text-red-400',
};

const GRADE_BG: Record<Grade, string> = {
  A: 'bg-emerald-900/30 border-emerald-700/40',
  B: 'bg-green-900/30 border-green-700/40',
  C: 'bg-amber-900/30 border-amber-700/40',
  D: 'bg-orange-900/30 border-orange-700/40',
  F: 'bg-red-900/30 border-red-700/40',
};

function requiredAdj(med: number): number {
  return ((1.0 - med) / med) * 100;
}

function impactScore(med: number, saleCount: number): number {
  return Math.abs(med - 1.0) * saleCount;
}

interface ScoredNeighborhood {
  ns: NeighborhoodStat;
  grade: Grade;
  adjPct: number;
  impact: number;
}

export function RemedyQueuePanel() {
  const { neighborhoodStats, selectNeighborhood, openDrawer, filter } = useGeoForgeStore();

  const scored: ScoredNeighborhood[] = useMemo(() => {
    return neighborhoodStats
      .map((ns) => ({
        ns,
        grade: grade(ns.stats.medianRatio, ns.stats.cod, ns.stats.prd),
        adjPct: requiredAdj(ns.stats.medianRatio),
        impact: impactScore(ns.stats.medianRatio, ns.saleCount),
      }))
      .sort((a, b) => b.impact - a.impact);
  }, [neighborhoodStats]);

  const failing = scored.filter((s) => s.grade === 'D' || s.grade === 'F');
  const marginal = scored.filter((s) => s.grade === 'C');
  const passing  = scored.filter((s) => s.grade === 'A' || s.grade === 'B');

  const totalSales = neighborhoodStats.reduce((s, n) => s + n.saleCount, 0);
  const countyWillPass = failing.length === 0;

  function handleRowClick(ns: NeighborhoodStat) {
    selectNeighborhood(ns.neighborhoodCode, 'workbench');
  }

  if (neighborhoodStats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs text-muted-foreground">No neighborhood data loaded.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* County verdict header */}
      <div className={`px-4 py-2.5 flex-shrink-0 border-b border-slate-800 ${
        countyWillPass ? 'bg-emerald-950/40' : 'bg-red-950/40'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold tracking-widest uppercase ${
            countyWillPass ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {countyWillPass ? '✓ DOR CERTIFICATION ACHIEVABLE' : '✗ CERTIFICATION AT RISK'}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-500">
          <span>{failing.length} failing</span>
          <span>·</span>
          <span>{marginal.length} marginal</span>
          <span>·</span>
          <span>{passing.length} passing</span>
          <span>·</span>
          <span>{totalSales} qualified sales</span>
          <span>·</span>
          <span className="text-slate-600">{filter.taxYear}</span>
        </div>
      </div>

      {/* Explanation */}
      <div className="px-4 py-1.5 text-[9px] text-slate-600 bg-slate-950/40 flex-shrink-0 border-b border-slate-900">
        Sorted by county-level impact (|deviation| × n). Click row → fly to neighborhood + open workbench.
      </div>

      {/* Scrollable table */}
      <div className="flex-1 overflow-y-auto">
        {scored.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No neighborhoods to display.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-950 z-10">
              <tr className="text-[8px] text-slate-500 uppercase border-b border-slate-800">
                <th className="text-left py-1.5 px-3">Nbhd</th>
                <th className="text-right py-1.5 px-2">Grade</th>
                <th className="text-right py-1.5 px-2">Ratio</th>
                <th className="text-right py-1.5 px-2">Req Adj%</th>
                <th className="text-right py-1.5 px-2">COD</th>
                <th className="text-right py-1.5 px-2">n</th>
              </tr>
            </thead>
            <tbody>
              {scored.map(({ ns, grade: g, adjPct }) => {
                const med = ns.stats.medianRatio;
                const isUrgent = g === 'D' || g === 'F';
                return (
                  <tr
                    key={ns.neighborhoodCode}
                    onClick={() => handleRowClick(ns)}
                    className={`border-b border-slate-900 cursor-pointer transition-colors
                      ${isUrgent ? 'hover:bg-red-900/20' : g === 'C' ? 'hover:bg-amber-900/10' : 'hover:bg-slate-900/40'}`}
                  >
                    <td className="py-1.5 px-3">
                      <span className="font-mono text-[10px] text-slate-300">
                        {ns.neighborhoodCode}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${GRADE_COLOR[g]} ${GRADE_BG[g]}`}>
                        {g}
                      </span>
                    </td>
                    <td className={`py-1.5 px-2 text-right font-mono text-[10px] font-semibold ${
                      med >= 0.95 && med <= 1.05 ? 'text-emerald-400'
                        : med >= 0.90 && med <= 1.10 ? 'text-amber-400'
                        : 'text-red-400'
                    }`}>
                      {med.toFixed(3)}
                    </td>
                    <td className={`py-1.5 px-2 text-right font-mono text-[10px] ${
                      Math.abs(adjPct) < 2 ? 'text-slate-500'
                        : adjPct > 0 ? 'text-sky-400' : 'text-orange-400'
                    }`}>
                      {adjPct >= 0 ? '+' : ''}{adjPct.toFixed(1)}%
                    </td>
                    <td className={`py-1.5 px-2 text-right font-mono text-[10px] ${
                      ns.stats.cod <= 15 ? 'text-slate-400' : ns.stats.cod <= 20 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {ns.stats.cod.toFixed(1)}
                    </td>
                    <td className="py-1.5 px-2 text-right text-[10px] text-slate-500">
                      {ns.saleCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-1.5 border-t border-slate-800 flex-shrink-0 text-[9px] text-slate-600">
        Grade: A (COD≤12, med 0.97–1.03) · B (COD≤15, 0.95–1.05) · C (IAAO pass) · D/F = failing · Req Adj% = (1−med)/med×100
      </div>
    </div>
  );
}
