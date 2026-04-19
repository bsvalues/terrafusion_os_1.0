import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { FlaggedSale } from '../types/geoforge.types';

const RATIO_COLOR = (r: number) =>
  r > 1.10 ? 'text-red-400' : r > 1.05 ? 'text-orange-400'
  : r < 0.90 ? 'text-blue-400' : r < 0.95 ? 'text-sky-400' : 'text-green-400';

const DECISION_BADGE = (d: string) => {
  if (d === 'disqualified') return 'bg-red-900/60 text-red-300';
  if (d === 'outlier') return 'bg-yellow-900/60 text-yellow-300';
  return 'bg-slate-800 text-slate-400';
};

async function patchQualification(saleId: string, decision: string) {
  const res = await fetch(`/api/geoforge/sales/${saleId}/qualification`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function OutlierReviewPanel() {
  const { filter, selectedNeighborhoodCode } = useGeoForgeStore();
  const qc = useQueryClient();
  const [showAll, setShowAll] = useState(false);

  const { data = [], isLoading, error } = useQuery<FlaggedSale[]>({
    queryKey: ['geoforge-outliers', filter.taxYear, selectedNeighborhoodCode],
    queryFn: () => {
      const params = new URLSearchParams({ taxYear: String(filter.taxYear) });
      if (selectedNeighborhoodCode) params.set('neighborhoodCode', selectedNeighborhoodCode);
      return apiFetchJson<FlaggedSale[]>(`/geoforge/sales/outliers?${params}`);
    },
    staleTime: 1000 * 60 * 2,
  });

  const mutation = useMutation({
    mutationFn: ({ saleId, decision }: { saleId: string; decision: string }) =>
      patchQualification(saleId, decision),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['geoforge-outliers'] });
      qc.invalidateQueries({ queryKey: ['geoforge-nbhd-stats'] });
      qc.invalidateQueries({ queryKey: ['geoforge-sales'] });
      qc.invalidateQueries({ queryKey: ['geoforge-certification'] });
    },
  });

  const outliers = data.filter(s => s.isOutlier);
  const disqualified = data.filter(s => s.currentDecision === 'disqualified' && !s.isOutlier);
  const displayed = showAll ? data : outliers;

  if (isLoading) {
    return (
      <div className="p-4 text-slate-400 text-sm flex items-center gap-2">
        <span className="animate-spin">⟳</span> Scanning for outlier sales…
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-400 text-sm">Failed to load flagged sales.</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="text-orange-400 font-bold">{outliers.length} outliers</span>
          <span>·</span>
          <span className="text-red-400">{disqualified.length} disqualified</span>
          {selectedNeighborhoodCode && (
            <>
              <span>·</span>
              <span className="text-terra-cyan">{selectedNeighborhoodCode}</span>
            </>
          )}
        </div>
        <p className="text-[9px] text-slate-600 mt-0.5">
          3 MAD from neighborhood median · Click to disqualify or restore
        </p>
        <button
          className="mt-1.5 text-[10px] text-slate-500 hover:text-slate-300 underline"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show outliers only' : `Show all flagged (${data.length})`}
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-500">
          No {showAll ? 'flagged' : 'outlier'} sales found.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-950 z-10">
              <tr className="text-[9px] text-slate-500 uppercase border-b border-slate-800">
                <th className="text-left py-1.5 px-3">Parcel / Hood</th>
                <th className="text-right py-1.5 px-2">Ratio</th>
                <th className="text-right py-1.5 px-2">Dev</th>
                <th className="text-right py-1.5 px-2">Decision</th>
                <th className="py-1.5 px-2" />
              </tr>
            </thead>
            <tbody>
              {displayed.map((s) => (
                <tr key={s.saleId} className="border-b border-slate-900 hover:bg-slate-900/40">
                  <td className="py-2 px-3">
                    <div className="text-slate-300 font-mono text-[10px] truncate max-w-[110px]">
                      {s.parcelId}
                    </div>
                    <div className="text-slate-600 text-[9px]">{s.neighborhoodCode} · {s.saleDate}</div>
                    <div className="text-slate-600 text-[9px]">
                      ${s.salePrice.toLocaleString()} → AV ${s.assessedValue.toLocaleString()}
                    </div>
                  </td>
                  <td className={`py-2 px-2 text-right font-mono font-bold ${RATIO_COLOR(s.ratio)}`}>
                    {s.ratio.toFixed(3)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-[10px] text-slate-400">
                    {s.ratioDeviation >= 0 ? '+' : ''}{s.ratioDeviation.toFixed(3)}
                  </td>
                  <td className="py-2 px-2 text-right">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${DECISION_BADGE(s.currentDecision)}`}>
                      {s.currentDecision === 'auto-qualified' ? 'auto' : s.currentDecision}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    {s.currentDecision === 'disqualified' ? (
                      <button
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate({ saleId: s.saleId, decision: 'qualified' })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-green-900/50 text-green-300 hover:bg-green-800/60 disabled:opacity-40"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        disabled={mutation.isPending}
                        onClick={() => mutation.mutate({ saleId: s.saleId, decision: 'disqualified' })}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 hover:bg-red-800/60 disabled:opacity-40"
                      >
                        DQ
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer: impact warning */}
      {mutation.isSuccess && (
        <div className="px-4 py-2 text-[10px] text-green-400 border-t border-slate-800 flex-shrink-0">
          ✓ Qualification updated — ratio study will recompute on next load.
        </div>
      )}
    </div>
  );
}
