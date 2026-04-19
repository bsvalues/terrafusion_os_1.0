import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { apiFetchJson } from '@/lib/apiBase';
import { computeEquityIndex } from '../utils/equityIndex';
import { computeMoransI } from '../utils/spatialStats';
import type { YoyChangePoint } from '../types/geoforge.types';

function fmtB(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${(v / 1e3).toFixed(0)}K`;
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded p-2.5">
      <div className="text-[8px] text-slate-600 uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-sm font-bold font-mono ${color ?? 'text-slate-200'}`}>{value}</div>
      {sub && <div className="text-[8px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

const RATIO_BANDS = [
  { lo: 0,    hi: 0.80, label: '< 0.80', desc: 'Severely under', color: '#dc2626' },
  { lo: 0.80, hi: 0.90, label: '0.80–0.90', desc: 'Under-assessed', color: '#f97316' },
  { lo: 0.90, hi: 1.10, label: '0.90–1.10', desc: 'IAAO Compliant', color: '#22c55e' },
  { lo: 1.10, hi: 1.20, label: '1.10–1.20', desc: 'Over-assessed', color: '#f97316' },
  { lo: 1.20, hi: Infinity, label: '> 1.20', desc: 'Severely over', color: '#dc2626' },
];

function medianOf(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function codOf(ratios: number[]): number {
  if (ratios.length < 2) return 0;
  const med = medianOf(ratios);
  if (!med) return 0;
  return (ratios.reduce((s, r) => s + Math.abs(r - med), 0) / ratios.length / med) * 100;
}

export function AssessmentRollPanel() {
  const { neighborhoodStats, salePoints, filter } = useGeoForgeStore();

  const { data: avData } = useQuery<YoyChangePoint[]>({
    queryKey: ['geoforge-av-change', filter.taxYear],
    queryFn: () =>
      apiFetchJson<YoyChangePoint[]>(
        `/api/geoforge/neighborhoods/av-change?taxYear=${filter.taxYear}`
      ),
    staleTime: 1000 * 60 * 15,
  });

  const moransI = useMemo(() => computeMoransI(neighborhoodStats), [neighborhoodStats]);

  const roll = useMemo(() => {
    if (!neighborhoodStats.length) return null;

    // Build a map of medianRatio by neighborhoodCode
    const ratioMap = new Map(neighborhoodStats.map((ns) => [ns.neighborhoodCode, ns.stats.medianRatio]));

    // AV totals from av-change data
    let totalAV = 0;
    let totalTVEst = 0;
    let totalParcels = 0;

    if (avData?.length) {
      for (const pt of avData) {
        const av = pt.parcelCount * pt.currAvgAv;
        const med = ratioMap.get(pt.neighborhoodCode) ?? 1.0;
        totalAV += av;
        totalTVEst += med > 0 ? av / med : av;
        totalParcels += pt.parcelCount;
      }
    }

    // Sale ratio bands
    const qualified = salePoints.filter((s) => !s.isOutlier && s.ratio != null);
    const bandCounts = RATIO_BANDS.map((band) => ({
      ...band,
      count: qualified.filter((s) => s.ratio >= band.lo && s.ratio < band.hi).length,
    }));

    // Property class breakdown
    const classMap = new Map<string, number[]>();
    for (const s of qualified) {
      const cls = s.propertyClass || 'Unknown';
      const list = classMap.get(cls) ?? [];
      list.push(s.ratio);
      classMap.set(cls, list);
    }
    const classes = Array.from(classMap.entries())
      .map(([cls, ratios]) => ({
        cls,
        n: ratios.length,
        med: medianOf(ratios),
        cod: codOf(ratios),
        iaaoOk: (() => { const m = medianOf(ratios); return m >= 0.9 && m <= 1.1 && codOf(ratios) <= 20; })(),
      }))
      .sort((a, b) => b.n - a.n);

    // County-wide stats
    const totalSales = neighborhoodStats.reduce((s, ns) => s + ns.saleCount, 0);
    const wAvg = (fn: (ns: typeof neighborhoodStats[0]) => number) =>
      totalSales > 0 ? neighborhoodStats.reduce((s, ns) => s + fn(ns) * ns.saleCount, 0) / totalSales : 0;
    const cwMed = wAvg((ns) => ns.stats.medianRatio);
    const cwCod = wAvg((ns) => ns.stats.cod);
    const cwPrd = wAvg((ns) => ns.stats.prd);

    const qualifiedNbhds = neighborhoodStats.filter((ns) => ns.saleCount >= 5);
    const passingNbhds = qualifiedNbhds.filter((ns) => {
      const { medianRatio, cod, prd } = ns.stats;
      return medianRatio >= 0.9 && medianRatio <= 1.1 && cod <= 20 && prd >= 0.98 && prd <= 1.03;
    });

    const eqi = computeEquityIndex({
      cwMed, cwCod, cwPrd,
      passRate: passingNbhds.length / Math.max(1, qualifiedNbhds.length),
      moransI: moransI?.I ?? 0,
      totalSales,
      totalNbhds: qualifiedNbhds.length,
    });

    const impliedRatio = totalTVEst > 0 ? totalAV / totalTVEst : cwMed;

    return {
      totalAV, totalTVEst, totalParcels, impliedRatio,
      cwMed, cwCod, cwPrd,
      bandCounts, totalQualified: qualified.length,
      classes,
      passingNbhds: passingNbhds.length,
      qualifiedNbhds: qualifiedNbhds.length,
      totalNbhds: neighborhoodStats.length,
      eqi,
    };
  }, [neighborhoodStats, salePoints, avData, moransI]);

  if (!roll) {
    return (
      <div className="p-4 text-slate-600 text-xs text-center">
        Load neighborhood stats to generate the assessment roll summary.
      </div>
    );
  }

  const maxBandCount = Math.max(...roll.bandCounts.map((b) => b.count), 1);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 space-y-4">

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-2">
          {roll.totalAV > 0 && (
            <KpiCard
              label="Total County AV"
              value={fmtB(roll.totalAV)}
              sub={`${roll.totalParcels.toLocaleString()} parcels`}
            />
          )}
          {roll.totalTVEst > 0 && (
            <KpiCard
              label="Est. True MV"
              value={fmtB(roll.totalTVEst)}
              sub="AV ÷ median ratio"
            />
          )}
          <KpiCard
            label="County-Wide MED"
            value={roll.cwMed.toFixed(3)}
            sub={`COD ${roll.cwCod.toFixed(1)} · PRD ${roll.cwPrd.toFixed(3)}`}
            color={Math.abs(roll.cwMed - 1) > 0.10 ? 'text-red-400' : Math.abs(roll.cwMed - 1) > 0.05 ? 'text-amber-400' : 'text-emerald-400'}
          />
          <KpiCard
            label={`EQI Score · ${roll.eqi.grade}`}
            value={`${roll.eqi.score}/100`}
            sub={`${roll.passingNbhds}/${roll.qualifiedNbhds} nbhds pass`}
            color={roll.eqi.color === 'green' ? 'text-emerald-400' : roll.eqi.color === 'amber' ? 'text-amber-400' : 'text-red-400'}
          />
          {roll.totalAV > 0 && (
            <KpiCard
              label="Implied AV/MV Ratio"
              value={(roll.impliedRatio * 100).toFixed(1) + '%'}
              sub="Roll-wide level of assessment"
              color={Math.abs(roll.impliedRatio - 1) > 0.10 ? 'text-amber-400' : 'text-slate-200'}
            />
          )}
          <KpiCard
            label="Qualified Sales"
            value={roll.totalQualified.toLocaleString()}
            sub={`${filter.taxYear} study period`}
          />
        </div>

        {/* Ratio band distribution */}
        <div>
          <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Sale Ratio Distribution</div>
          <div className="space-y-1.5">
            {roll.bandCounts.map((band) => {
              const pct = roll.totalQualified > 0 ? (band.count / roll.totalQualified) * 100 : 0;
              const barW = maxBandCount > 0 ? (band.count / maxBandCount) * 100 : 0;
              return (
                <div key={band.label} className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-slate-500 w-20 shrink-0">{band.label}</span>
                  <div className="flex-1 h-4 bg-slate-800 rounded overflow-hidden relative">
                    <div
                      className="h-full rounded transition-all"
                      style={{ width: `${barW}%`, backgroundColor: band.color, opacity: 0.75 }}
                    />
                    <span className="absolute inset-0 flex items-center px-1.5 text-[8px] text-slate-300">
                      {band.desc}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 w-16 text-right shrink-0">
                    {band.count.toLocaleString()} ({pct.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Property class breakdown */}
        {roll.classes.length > 0 && (
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">By Property Class</div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-[8px] text-slate-600 font-normal py-1">Class</th>
                  <th className="text-right text-[8px] text-slate-600 font-normal py-1">Sales</th>
                  <th className="text-right text-[8px] text-slate-600 font-normal py-1">MED</th>
                  <th className="text-right text-[8px] text-slate-600 font-normal py-1">COD</th>
                  <th className="text-right text-[8px] text-slate-600 font-normal py-1">IAAO</th>
                </tr>
              </thead>
              <tbody>
                {roll.classes.map((cls) => (
                  <tr key={cls.cls} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                    <td className="py-1 text-[9px] text-slate-400">{cls.cls}</td>
                    <td className="py-1 text-[9px] font-mono text-slate-500 text-right">{cls.n}</td>
                    <td className={`py-1 text-[9px] font-mono text-right ${Math.abs(cls.med - 1) > 0.10 ? 'text-red-400' : Math.abs(cls.med - 1) > 0.05 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {cls.med.toFixed(3)}
                    </td>
                    <td className={`py-1 text-[9px] font-mono text-right ${cls.cod > 20 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {cls.cod.toFixed(1)}
                    </td>
                    <td className="py-1 text-right">
                      <span className={`text-[8px] ${cls.iaaoOk ? 'text-emerald-500' : 'text-red-400'}`}>
                        {cls.iaaoOk ? '✓' : '✗'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Neighborhood IAAO breakdown */}
        <div>
          <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Neighborhood IAAO Status</div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{roll.passingNbhds}</div>
              <div className="text-[8px] text-slate-600">Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{roll.qualifiedNbhds - roll.passingNbhds}</div>
              <div className="text-[8px] text-slate-600">Non-compliant</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-500">{roll.totalNbhds - roll.qualifiedNbhds}</div>
              <div className="text-[8px] text-slate-600">&lt; 5 sales</div>
            </div>
            <div className="ml-auto text-center">
              <div className={`text-lg font-bold ${(roll.passingNbhds / Math.max(1, roll.qualifiedNbhds)) >= 0.75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {((roll.passingNbhds / Math.max(1, roll.qualifiedNbhds)) * 100).toFixed(0)}%
              </div>
              <div className="text-[8px] text-slate-600">Pass rate</div>
            </div>
          </div>
        </div>

        <p className="text-[8px] text-slate-700 border-t border-slate-800 pt-2">
          {filter.taxYear} assessment roll summary. AV totals require av-change data. IAAO standard: MED 0.90–1.10, COD ≤ 20, PRD 0.98–1.03. WAC 458-53A · RCW 84.41.030.
        </p>
      </div>
    </div>
  );
}
