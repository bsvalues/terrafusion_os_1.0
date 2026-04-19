import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { computeLevyParity, fmtM } from '../utils/levyParity';
import type { YoyChangePoint } from '../types/geoforge.types';

const $ = (v: number) =>
  v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function RatioChip({ r }: { r: number }) {
  const color =
    r >= 0.95 && r <= 1.05
      ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'
      : r >= 0.90 && r <= 1.10
        ? 'bg-amber-900/50 text-amber-300 border-amber-700/50'
        : 'bg-red-900/50 text-red-300 border-red-700/50';
  return (
    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${color}`}>
      {r.toFixed(3)}
    </span>
  );
}

function ShiftBar({ pct, maxAbs }: { pct: number; maxAbs: number }) {
  const width = maxAbs > 0 ? Math.abs(pct) / maxAbs : 0;
  const isOver = pct > 0;
  return (
    <div className="flex items-center gap-1 w-full">
      {isOver ? (
        <>
          <div className="w-[48%] flex justify-end">
            <div style={{ width: `${width * 100}%` }} className="h-[6px] bg-red-500/70 rounded-l" />
          </div>
          <div className="w-1 h-3 bg-slate-600" />
          <div className="w-[48%]" />
        </>
      ) : (
        <>
          <div className="w-[48%]" />
          <div className="w-1 h-3 bg-slate-600" />
          <div style={{ width: `${width * 100}%` }} className="h-[6px] bg-blue-500/70 rounded-r" />
          <div className="flex-1" />
        </>
      )}
    </div>
  );
}

export function LevyParityPanel() {
  const { filter, neighborhoodStats } = useGeoForgeStore();
  const [levyInput, setLevyInput] = useState('');

  const levyAmount = useMemo(() => {
    const n = parseFloat(levyInput.replace(/[^0-9.]/g, ''));
    return isNaN(n) || n <= 0 ? null : n;
  }, [levyInput]);

  const { data: avData, isLoading } = useQuery<YoyChangePoint[]>({
    queryKey: ['geoforge-av-change', filter.taxYear],
    queryFn: () =>
      apiFetchJson<YoyChangePoint[]>(
        `/api/geoforge/neighborhoods/av-change?taxYear=${filter.taxYear}`
      ),
    staleTime: 1000 * 60 * 10,
  });

  const summary = useMemo(
    () => computeLevyParity(neighborhoodStats, avData ?? [], levyAmount),
    [neighborhoodStats, avData, levyAmount],
  );

  const maxAbsPct = useMemo(
    () =>
      summary
        ? Math.max(...summary.rows.map((r) => Math.abs(r.burdenShiftPct)), 0.01)
        : 1,
    [summary],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-xs">
        Loading AV data…
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-xs">
        Insufficient data — need AV totals for at least one neighborhood.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header / Levy Input */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700/50 space-y-3">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
            Annual levy total (optional)
          </p>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">$</span>
            <input
              type="text"
              className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-terra-cyan"
              placeholder="e.g. 12000000"
              value={levyInput}
              onChange={(e) => setLevyInput(e.target.value)}
            />
          </div>
          <p className="text-[9px] text-slate-600 mt-1">
            Leave blank to show relative % burden shift only
          </p>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/50 rounded p-2">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Total County AV</div>
            <div className="text-sm font-mono font-bold text-white">{fmtM(summary.totalAV)}</div>
          </div>
          <div className="bg-slate-800/50 rounded p-2">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Est. True MV</div>
            <div className="text-sm font-mono font-bold text-white">{fmtM(summary.totalTVEst)}</div>
          </div>
          <div className="bg-red-900/30 border border-red-800/40 rounded p-2">
            <div className="text-[9px] text-red-400 uppercase tracking-wider">Over-paying nbhds</div>
            <div className="text-sm font-mono font-bold text-red-300">{summary.overPaidNbhds}</div>
            <div className="text-[9px] text-red-400 font-mono">
              max +{summary.maxOverPaidPct.toFixed(2)}% burden
            </div>
          </div>
          <div className="bg-blue-900/30 border border-blue-800/40 rounded p-2">
            <div className="text-[9px] text-blue-400 uppercase tracking-wider">Under-paying nbhds</div>
            <div className="text-sm font-mono font-bold text-blue-300">{summary.underPaidNbhds}</div>
            <div className="text-[9px] text-blue-400 font-mono">
              max -{summary.maxUnderPaidPct.toFixed(2)}% burden
            </div>
          </div>
        </div>

        {summary.totalBurdenShiftedDollars !== null && (
          <div className="bg-amber-900/30 border border-amber-700/40 rounded px-3 py-2 text-sm">
            <span className="text-amber-400 font-semibold">
              {$(summary.totalBurdenShiftedDollars)}
            </span>
            <span className="text-amber-300/70 text-xs ml-2">
              shifted from under-assessed to over-assessed neighborhoods
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 text-[9px] text-slate-600">
          <span className="flex items-center gap-1">
            <span className="inline-block w-6 h-[5px] bg-red-500/70 rounded" /> over-paying
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-6 h-[5px] bg-blue-500/70 rounded" /> under-paying
          </span>
          <span className="ml-auto">WAC 458-53A · IAAO Standard</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-[10px]">
          <thead className="sticky top-0 bg-slate-900 z-10">
            <tr className="border-b border-slate-700">
              <th className="text-left px-2 py-1.5 text-slate-500 font-normal w-[90px]">Nbhd</th>
              <th className="text-center px-1 py-1.5 text-slate-500 font-normal w-[54px]">Ratio</th>
              <th className="text-right px-2 py-1.5 text-slate-500 font-normal w-[54px]">Parcels</th>
              <th className="px-2 py-1.5 text-slate-500 font-normal">Burden shift</th>
              {levyAmount !== null && (
                <th className="text-right px-2 py-1.5 text-slate-500 font-normal w-[70px]">Impact</th>
              )}
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((row) => {
              const isOver = row.burdenShiftPct > 0.05;
              const isUnder = row.burdenShiftPct < -0.05;
              const shiftColor = isOver ? 'text-red-400' : isUnder ? 'text-blue-400' : 'text-slate-500';
              return (
                <tr
                  key={row.neighborhoodCode}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-2 py-1.5">
                    <div className="font-mono text-white">{row.neighborhoodCode}</div>
                    <div className="text-slate-600 truncate max-w-[82px]">{row.neighborhoodName}</div>
                  </td>
                  <td className="px-1 py-1.5 text-center">
                    <RatioChip r={row.medianRatio} />
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-slate-400">
                    {row.parcelCount.toLocaleString()}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className={`font-mono font-semibold mb-0.5 ${shiftColor}`}>
                      {row.burdenShiftPct >= 0 ? '+' : ''}
                      {row.burdenShiftPct.toFixed(2)}%
                    </div>
                    <ShiftBar pct={row.burdenShiftPct} maxAbs={maxAbsPct} />
                  </td>
                  {levyAmount !== null && (
                    <td className={`px-2 py-1.5 text-right font-mono ${shiftColor}`}>
                      {row.burdenShiftDollars !== null
                        ? `${row.burdenShiftDollars >= 0 ? '+' : ''}${fmtM(row.burdenShiftDollars)}`
                        : '—'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="px-3 py-2 text-[9px] text-slate-700 border-t border-slate-800">
          Burden shift = (AV share − estimated true MV share). True MV est = AV ÷ median ratio.
          Source: {filter.taxYear} ratio study · WAC 458-53A.
        </div>
      </div>
    </div>
  );
}
