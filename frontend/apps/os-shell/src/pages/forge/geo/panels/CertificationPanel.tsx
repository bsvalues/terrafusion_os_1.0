import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { CertificationSummary, StratumResult } from '../types/geoforge.types';

function PassBadge({ pass }: { pass: boolean }) {
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
      pass ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'
    }`}>
      {pass ? 'PASS' : 'FAIL'}
    </span>
  );
}

function StratumRow({ s }: { s: StratumResult }) {
  if (s.n === 0) return (
    <tr className="border-b border-slate-800">
      <td className="py-1.5 pr-2 text-slate-400 text-xs">{s.stratum}</td>
      <td colSpan={5} className="py-1.5 text-xs text-slate-600 text-center">Insufficient sales</td>
    </tr>
  );

  const medColor = s.medianRatio
    ? s.medianRatio >= 0.95 && s.medianRatio <= 1.05 ? 'text-green-400'
      : s.medianRatio >= 0.90 && s.medianRatio <= 1.10 ? 'text-yellow-400' : 'text-red-400'
    : 'text-slate-400';

  const codColor = s.cod
    ? s.cod <= 15 ? 'text-green-400' : s.cod <= 20 ? 'text-yellow-400' : 'text-red-400'
    : 'text-slate-400';

  return (
    <tr className="border-b border-slate-800">
      <td className="py-1.5 pr-2 text-xs text-slate-300">{s.stratum}</td>
      <td className="py-1.5 px-1 text-right text-xs text-slate-400">{s.n}</td>
      <td className={`py-1.5 px-1 text-right font-mono text-xs ${medColor}`}>
        {s.medianRatio?.toFixed(3) ?? '—'}
      </td>
      <td className={`py-1.5 px-1 text-right font-mono text-xs ${codColor}`}>
        {s.cod?.toFixed(1) ?? '—'}
      </td>
      <td className="py-1.5 pl-1 text-right">
        <PassBadge pass={s.rcwPass} />
      </td>
    </tr>
  );
}

export function CertificationPanel() {
  const { filter } = useGeoForgeStore();

  const { data, isLoading, error } = useQuery<CertificationSummary>({
    queryKey: ['geoforge-certification', filter.taxYear],
    queryFn: () => apiFetchJson<CertificationSummary>(
      `/api/geoforge/certification/summary?taxYear=${filter.taxYear}`
    ),
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) {
    return (
      <div className="p-4 text-slate-400 text-sm flex items-center gap-2">
        <span className="animate-spin">⟳</span> Computing ratio study…
      </div>
    );
  }

  if (error || !data) {
    return <div className="p-4 text-red-400 text-sm">Failed to load certification summary.</div>;
  }

  const cw = data.countywide;
  const cwColor = cw.iaaoPass ? 'border-green-700/60 bg-green-950/20' : 'border-red-700/60 bg-red-950/20';
  const cwTextColor = cw.iaaoPass ? 'text-green-300' : 'text-red-300';

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full text-sm">
      {/* Header */}
      <div>
        <h3 className="text-terra-cyan font-bold text-sm tracking-wide">
          {filter.taxYear} Ratio Study
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          WAC 458-53A-050 · Benton County · {data.totalQualifiedSales.toLocaleString()} qualified sales
        </p>
      </div>

      {/* County-wide banner */}
      <div className={`rounded-lg border p-3 ${cwColor}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            County-Wide
          </span>
          <span className={`text-xs font-bold uppercase ${cwTextColor}`}>
            {cw.iaaoPass ? '✓ IAAO Compliant' : '✗ Non-Compliant'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Median Ratio', value: cw.medianRatio?.toFixed(3) ?? '—', sub: 'target: 1.000' },
            { label: 'COD', value: cw.cod?.toFixed(1) ?? '—', sub: 'max: 20.0' },
            { label: 'PRD', value: cw.prd?.toFixed(3) ?? '—', sub: '0.98–1.03' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="text-center">
              <div className="text-white font-mono text-base font-bold">{value}</div>
              <div className="text-[9px] text-slate-400 uppercase">{label}</div>
              <div className="text-[8px] text-slate-600">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* IAAO thresholds legend */}
      <div className="flex gap-3 text-[9px] text-slate-500">
        <span className="text-green-400">■</span> Median 0.95–1.05, COD ≤15
        <span className="text-yellow-400 ml-2">■</span> 0.90–1.10, COD ≤20
        <span className="text-red-400 ml-2">■</span> Outside
      </div>

      {/* Strata table */}
      <div>
        <h4 className="text-xs text-slate-500 uppercase tracking-wide mb-2">By Stratum</h4>
        <table className="w-full">
          <thead>
            <tr className="text-[9px] text-slate-500 border-b border-slate-700 uppercase">
              <th className="text-left py-1 pr-2">Stratum</th>
              <th className="text-right py-1 px-1">n</th>
              <th className="text-right py-1 px-1">Median</th>
              <th className="text-right py-1 px-1">COD</th>
              <th className="text-right py-1 pl-1">RCW</th>
            </tr>
          </thead>
          <tbody>
            {data.strata.map(s => <StratumRow key={s.stratum} s={s} />)}
          </tbody>
        </table>
      </div>

      {/* PRB by stratum */}
      {data.strata.some(s => s.prb !== null) && (
        <div>
          <h4 className="text-xs text-slate-500 uppercase tracking-wide mb-2">
            PRB (Regressivity)
          </h4>
          {data.strata.filter(s => s.prb !== null).map(s => {
            const prb = s.prb!;
            const color = Math.abs(prb) < 0.05 ? 'text-green-400'
              : Math.abs(prb) < 0.10 ? 'text-yellow-400' : 'text-red-400';
            return (
              <div key={s.stratum} className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">{s.stratum}</span>
                <span className={`font-mono ${color}`}>
                  {prb >= 0 ? '+' : ''}{prb.toFixed(3)}
                  <span className="text-slate-600 ml-1 text-[9px]">
                    {Math.abs(prb) < 0.05 ? '(uniform)' : prb < 0 ? '(regressive)' : '(progressive)'}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Generated timestamp */}
      <div className="mt-auto pt-2 border-t border-slate-800">
        <p className="text-[9px] text-slate-600">{data.certificationNote}</p>
        <p className="text-[9px] text-slate-700 mt-1">
          Generated {new Date(data.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
