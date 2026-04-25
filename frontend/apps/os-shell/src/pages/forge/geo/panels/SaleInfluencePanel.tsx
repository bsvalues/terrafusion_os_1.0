import { useMemo, useState } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { computeSaleInfluence } from '../utils/saleInfluence';

const $ = (v: number) =>
  v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(2)}M` : `$${(v / 1_000).toFixed(0)}K`;

type FilterMode = 'all' | 'influential' | 'changers';

export function SaleInfluencePanel() {
  const { salePoints, selectedNeighborhoodCode } = useGeoForgeStore();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [threshold, setThreshold] = useState(0.005);

  const result = useMemo(() => {
    if (!selectedNeighborhoodCode) return null;
    return computeSaleInfluence(salePoints, selectedNeighborhoodCode, threshold);
  }, [salePoints, selectedNeighborhoodCode, threshold]);

  const visibleRows = useMemo(() => {
    if (!result) return [];
    if (filterMode === 'influential') return result.rows.filter((r) => r.isInfluential);
    if (filterMode === 'changers') return result.rows.filter((r) => r.changesCompliance);
    return result.rows;
  }, [result, filterMode]);

  if (!selectedNeighborhoodCode) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
        Select a neighborhood on the map first.
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500 text-xs">
        Need ≥ 3 sales in {selectedNeighborhoodCode} for influence analysis.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700/50 space-y-2">
        <div className="flex items-center gap-3">
          <div className="text-terra-cyan font-mono font-bold text-sm">{result.neighborhoodCode}</div>
          <div className="text-slate-500 text-[10px]">
            Full median: <span className="font-mono text-slate-300">{result.fullMedianRatio.toFixed(3)}</span>
          </div>
          <div className={`text-[10px] font-semibold ml-auto ${result.rows[0]?.currentIaaoPass ? 'text-emerald-400' : 'text-red-400'}`}>
            {result.rows[0]?.currentIaaoPass ? 'IAAO PASS' : 'IAAO FAIL'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-800/50 rounded p-1.5 text-center">
            <div className="text-base font-mono font-bold text-white">{result.fullN}</div>
            <div className="text-[8px] text-slate-500">Qualified sales</div>
          </div>
          <div className={`rounded p-1.5 text-center ${result.influentialCount > 0 ? 'bg-amber-900/30 border border-amber-800/40' : 'bg-slate-800/50'}`}>
            <div className={`text-base font-mono font-bold ${result.influentialCount > 0 ? 'text-amber-300' : 'text-white'}`}>
              {result.influentialCount}
            </div>
            <div className="text-[8px] text-slate-500">Influential</div>
          </div>
          <div className={`rounded p-1.5 text-center ${result.complianceChangerCount > 0 ? 'bg-red-900/30 border border-red-800/40' : 'bg-slate-800/50'}`}>
            <div className={`text-base font-mono font-bold ${result.complianceChangerCount > 0 ? 'text-red-300' : 'text-white'}`}>
              {result.complianceChangerCount}
            </div>
            <div className="text-[8px] text-slate-500">Change status</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex rounded overflow-hidden border border-slate-700 text-[9px]">
            {(['all', 'influential', 'changers'] as FilterMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-2 py-1 transition-colors ${filterMode === m ? 'bg-terra-cyan/20 text-terra-cyan' : 'text-slate-500 hover:text-white'}`}
              >
                {m === 'all' ? 'All' : m === 'influential' ? 'Influential' : 'Status-changers'}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-[9px] text-slate-500">
            <span>Δ threshold:</span>
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-white text-[9px]"
            >
              {[0.001, 0.005, 0.010, 0.020].map((v) => (
                <option key={v} value={v}>{v.toFixed(3)}</option>
              ))}
            </select>
          </div>
        </div>

        {result.complianceChangerCount > 0 && (
          <div className="bg-red-900/20 border border-red-800/40 rounded px-2 py-1.5 text-[9px] text-red-300">
            {result.complianceChangerCount} sale{result.complianceChangerCount !== 1 ? 's' : ''} individually change the
            neighborhood's IAAO compliance status. Review qualification decisions.
          </div>
        )}
      </div>

      {/* Sale table */}
      <div className="flex-1 overflow-y-auto">
        {visibleRows.length === 0 ? (
          <div className="p-4 text-slate-600 text-xs text-center">No sales match the selected filter.</div>
        ) : (
          <table className="w-full text-[9px]">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-slate-700 text-slate-500">
                <th className="text-left px-2 py-1.5 font-normal">Sale</th>
                <th className="text-right px-1 py-1.5 font-normal">Ratio</th>
                <th className="text-right px-2 py-1.5 font-normal">LOO Δ</th>
                <th className="text-right px-2 py-1.5 font-normal">LOO Med</th>
                <th className="text-left px-1 py-1.5 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const influenceColor =
                  Math.abs(row.looInfluence) >= 0.02 ? '#ef4444' :
                  Math.abs(row.looInfluence) >= 0.01 ? '#fbbf24' : '#64748b';
                const ratioColor =
                  row.ratio >= 0.95 && row.ratio <= 1.05 ? '#4ade80' :
                  row.ratio >= 0.90 && row.ratio <= 1.10 ? '#fbbf24' : '#f87171';

                return (
                  <tr
                    key={row.saleId}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors
                      ${row.changesCompliance ? 'bg-red-950/20' : row.isOutlier ? 'opacity-60' : ''}`}
                  >
                    <td className="px-2 py-1.5">
                      <div className="font-mono text-slate-400 text-[8px]">{row.parcelId.slice(-8)}</div>
                      <div className="text-slate-600">{row.saleDate.slice(0, 7)} · {$(row.salePrice)}</div>
                      {row.isOutlier && <span className="text-slate-600 text-[8px]">[excluded]</span>}
                    </td>
                    <td className="px-1 py-1.5 text-right">
                      <span className="font-mono font-semibold" style={{ color: ratioColor }}>
                        {row.ratio.toFixed(3)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono" style={{ color: influenceColor }}>
                      {row.looInfluence >= 0 ? '+' : ''}{row.looInfluence.toFixed(4)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-slate-400">
                      {row.looMedianRatio.toFixed(3)}
                    </td>
                    <td className="px-1 py-1.5">
                      {row.changesCompliance ? (
                        <span className="text-red-400 font-bold text-[8px]">
                          {row.isOutlier ? '→FAIL' : row.looIaaoPass ? '→PASS' : '→FAIL'}
                        </span>
                      ) : row.isInfluential ? (
                        <span className="text-amber-400 text-[8px]">influential</span>
                      ) : (
                        <span className="text-slate-700 text-[8px]">stable</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="px-3 py-2 text-[8px] text-slate-700 border-t border-slate-800">
          LOO Δ = change in neighborhood median ratio when this sale is added/removed.
          Red rows: individually change IAAO pass/fail status.
        </div>
      </div>
    </div>
  );
}
