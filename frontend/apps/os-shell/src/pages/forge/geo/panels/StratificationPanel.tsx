import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { StratificationResult, StrataRow } from '../types/geoforge.types';

const IAAO = { codMax: 20, medLo: 0.90, medHi: 1.10, prdLo: 0.98, prdHi: 1.03 };

function IaaoBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/40">
      IAAO ✓
    </span>
  ) : (
    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 border border-red-700/40">
      FAIL
    </span>
  );
}

function StatCell({ value, pass, fmt }: { value: number; pass: boolean; fmt: (v: number) => string }) {
  return (
    <td className={`py-2 px-2 text-right font-mono text-[11px] ${pass ? 'text-slate-200' : 'text-red-400 font-bold'}`}>
      {fmt(value)}
    </td>
  );
}

function StrataRow({ row, isOverall }: { row: StrataRow & { isOverall?: boolean }; isOverall?: boolean }) {
  const medOk = row.medianRatio >= IAAO.medLo && row.medianRatio <= IAAO.medHi;
  const codOk = row.cod <= IAAO.codMax;
  const prdOk = row.prd >= IAAO.prdLo && row.prd <= IAAO.prdHi;

  return (
    <tr className={`border-b border-slate-800/60 last:border-0 ${isOverall ? 'bg-slate-800/40' : 'hover:bg-slate-800/20'}`}>
      <td className="py-2 px-3">
        <div className={`text-[11px] font-semibold ${isOverall ? 'text-terra-cyan' : 'text-slate-200'}`}>
          {row.label}
        </div>
        <div className="text-[9px] text-slate-600 font-mono">{row.code}</div>
      </td>
      <td className="py-2 px-2 text-right font-mono text-[11px] text-slate-400">
        {row.n.toLocaleString()}
      </td>
      <StatCell value={row.medianRatio} pass={medOk} fmt={(v) => v.toFixed(3)} />
      <StatCell value={row.cod} pass={codOk} fmt={(v) => v.toFixed(1)} />
      <StatCell value={row.prd} pass={prdOk} fmt={(v) => v.toFixed(3)} />
      <td className="py-2 px-3 text-right">
        <IaaoBadge ok={row.iaaoOk} />
      </td>
    </tr>
  );
}

export function StratificationPanel() {
  const { filter } = useGeoForgeStore();

  const { data, isLoading } = useQuery<StratificationResult>({
    queryKey: ['geoforge-stratification', filter.taxYear],
    queryFn: () =>
      apiFetchJson<StratificationResult>(
        `/api/geoforge/stratification?taxYear=${filter.taxYear}`,
      ),
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-500 text-sm animate-pulse">
        Computing strata…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-600 text-sm">
        No stratification data available.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
          IAAO Property Class Stratification · {data.taxYear}
        </p>
        <p className="text-[9px] text-slate-600 mt-0.5">
          COD ≤ {IAAO.codMax} · Median {IAAO.medLo}–{IAAO.medHi} · PRD {IAAO.prdLo}–{IAAO.prdHi}
        </p>
      </div>

      <div className="bg-slate-900/60 rounded border border-slate-800 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[9px] text-slate-500 uppercase border-b border-slate-800 bg-slate-900/40">
              <th className="text-left px-3 py-2">Strata</th>
              <th className="text-right px-2 py-2">n</th>
              <th className="text-right px-2 py-2">Median</th>
              <th className="text-right px-2 py-2">COD</th>
              <th className="text-right px-2 py-2">PRD</th>
              <th className="text-right px-3 py-2">IAAO</th>
            </tr>
          </thead>
          <tbody>
            {data.strata.map((row) => (
              <StrataRow key={row.code} row={row} />
            ))}
            <StrataRow row={{ ...data.overall }} isOverall />
          </tbody>
        </table>
      </div>

      {/* IAAO thresholds reminder */}
      <div className="bg-slate-900/40 rounded border border-slate-800 p-3 space-y-1 text-[9px] text-slate-600">
        <p className="text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Standards</p>
        <p>
          <span className="text-slate-400 font-mono">Median</span> 0.90 – 1.10 · IAAO Standard on Ratio Studies
        </p>
        <p>
          <span className="text-slate-400 font-mono">COD</span> ≤ 20 for residential · ≤ 25 for income properties
        </p>
        <p>
          <span className="text-slate-400 font-mono">PRD</span> 0.98 – 1.03 · measures vertical equity
        </p>
        <p className="text-slate-700 pt-1 border-t border-slate-800 mt-1">
          Qualified sales only · WAC 458-53A · Tax Year {data.taxYear}
        </p>
      </div>
    </div>
  );
}
