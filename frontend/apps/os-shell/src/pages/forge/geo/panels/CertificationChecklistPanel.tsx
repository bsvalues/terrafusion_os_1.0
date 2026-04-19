import { useMemo, useState } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import { computeMoransI } from '../utils/spatialStats';
import { computeEquityIndex } from '../utils/equityIndex';
import type { NeighborhoodStat } from '../types/geoforge.types';

function iaaoPass(ns: NeighborhoodStat): boolean {
  const { medianRatio, cod, prd } = ns.stats;
  return medianRatio >= 0.90 && medianRatio <= 1.10 && cod <= 20 && prd >= 0.98 && prd <= 1.03;
}

interface CheckItem {
  id: string;
  label: string;
  detail: string;
  result: 'pass' | 'fail' | 'warn' | 'manual';
  value?: string;
  action?: string;
}

function CheckRow({
  item,
  manualChecked,
  onToggle,
}: {
  item: CheckItem;
  manualChecked: boolean;
  onToggle: () => void;
}) {
  const isManual = item.result === 'manual';
  const effectiveResult = isManual ? (manualChecked ? 'pass' : 'fail') : item.result;

  const icon =
    effectiveResult === 'pass' ? '✓' :
    effectiveResult === 'warn' ? '⚠' : '✗';
  const iconColor =
    effectiveResult === 'pass' ? 'text-emerald-400' :
    effectiveResult === 'warn' ? 'text-amber-400' : 'text-red-400';
  const rowBg =
    effectiveResult === 'pass' ? '' :
    effectiveResult === 'warn' ? 'bg-amber-950/10' : 'bg-red-950/10';

  return (
    <div className={`px-3 py-2 border-b border-slate-800/50 ${rowBg}`}>
      <div className="flex items-start gap-2">
        <span className={`font-bold text-[11px] shrink-0 mt-0.5 ${iconColor}`}>{icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold ${effectiveResult === 'pass' ? 'text-slate-300' : effectiveResult === 'warn' ? 'text-amber-200' : 'text-red-200'}`}>
              {item.label}
            </span>
            {item.value && (
              <span className="text-[9px] font-mono text-slate-500 ml-auto">{item.value}</span>
            )}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">{item.detail}</div>
          {item.action && effectiveResult !== 'pass' && (
            <div className="text-[9px] text-amber-400/70 mt-0.5">→ {item.action}</div>
          )}
        </div>
        {isManual && (
          <input
            type="checkbox"
            checked={manualChecked}
            onChange={onToggle}
            className="w-3.5 h-3.5 mt-0.5 accent-emerald-500 shrink-0 cursor-pointer"
          />
        )}
      </div>
    </div>
  );
}

export function CertificationChecklistPanel() {
  const { neighborhoodStats, salePoints, filter } = useGeoForgeStore();
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({});

  const moransI = useMemo(() => computeMoransI(neighborhoodStats), [neighborhoodStats]);

  const computed = useMemo(() => {
    if (neighborhoodStats.length === 0) return null;

    const qualified = neighborhoodStats.filter((ns) => ns.saleCount >= 5);
    const totalSales = neighborhoodStats.reduce((s, n) => s + n.saleCount, 0);
    const wAvg = (fn: (ns: NeighborhoodStat) => number) => {
      if (totalSales === 0) return 0;
      return neighborhoodStats.reduce((s, n) => s + fn(n) * n.saleCount, 0) / totalSales;
    };
    const cwMed = wAvg((n) => n.stats.medianRatio);
    const cwCod = wAvg((n) => n.stats.cod);
    const cwPrd = wAvg((n) => n.stats.prd);
    const passing = qualified.filter(iaaoPass);
    const critical = qualified.filter(
      (ns) => Math.abs(ns.stats.medianRatio - 1) > 0.15 || ns.stats.cod > 25
    );
    const largeNonCompliant = qualified.filter(
      (ns) => ns.saleCount >= 20 && !iaaoPass(ns)
    );
    const outlierCount = salePoints.filter((s) => s.isOutlier).length;
    const outlierRate = salePoints.length > 0 ? outlierCount / salePoints.length : 0;
    const eqi = computeEquityIndex({
      cwMed, cwCod, cwPrd,
      passRate: passing.length / Math.max(1, qualified.length),
      moransI: moransI?.I ?? 0,
      totalSales, totalNbhds: qualified.length,
    });

    return {
      cwMed, cwCod, cwPrd,
      totalSales, qualifiedNbhds: qualified.length,
      passingNbhds: passing.length,
      criticalNbhds: critical.length,
      largeNonCompliant: largeNonCompliant.length,
      outlierCount, outlierRate,
      eqi,
      passRate: passing.length / Math.max(1, qualified.length),
    };
  }, [neighborhoodStats, salePoints, moransI]);

  const checks = useMemo((): CheckItem[] => {
    if (!computed) return [];
    const c = computed;
    const passStyle = (pass: boolean): 'pass' | 'fail' => pass ? 'pass' : 'fail';
    return [
      // ── Automated checks ──────────────────────────────────────────
      {
        id: 'cw-median',
        label: 'County-wide median ratio within standard',
        detail: 'WAC 458-53A requires median ratio 0.90–1.10',
        result: passStyle(c.cwMed >= 0.90 && c.cwMed <= 1.10),
        value: c.cwMed.toFixed(3),
        action: c.cwMed < 0.90 ? 'Under-assessed — increase AV or apply time adjustment'
          : c.cwMed > 1.10 ? 'Over-assessed — reduce AV or review exclusions' : undefined,
      },
      {
        id: 'cw-cod',
        label: 'County-wide COD within standard',
        detail: 'IAAO standard: COD ≤ 20 for residential',
        result: passStyle(c.cwCod <= 20),
        value: c.cwCod.toFixed(1),
        action: 'High COD indicates non-uniform assessments. Review outliers and neighborhood spreads.',
      },
      {
        id: 'cw-prd',
        label: 'County-wide PRD within standard',
        detail: 'IAAO standard: PRD 0.98–1.03 (vertical equity)',
        result: passStyle(c.cwPrd >= 0.98 && c.cwPrd <= 1.03),
        value: c.cwPrd.toFixed(3),
        action: c.cwPrd > 1.03 ? 'Regressive inequity — lower-value properties over-assessed'
          : c.cwPrd < 0.98 ? 'Progressive inequity — higher-value properties over-assessed' : undefined,
      },
      {
        id: 'nbhd-pass-rate',
        label: 'Neighborhood IAAO pass rate acceptable',
        detail: `${c.passingNbhds} of ${c.qualifiedNbhds} neighborhoods passing IAAO (≥ 5 sales)`,
        result: c.passRate >= 0.75 ? 'pass' : c.passRate >= 0.60 ? 'warn' : 'fail',
        value: `${(c.passRate * 100).toFixed(0)}%`,
        action: 'Open Equity Ranking (R) to review failing neighborhoods.',
      },
      {
        id: 'critical',
        label: 'No critically non-compliant neighborhoods',
        detail: 'No neighborhood should have MED deviation > 15% or COD > 25',
        result: passStyle(c.criticalNbhds === 0),
        value: c.criticalNbhds > 0 ? `${c.criticalNbhds} critical` : 'None',
        action: 'Open Remedy Queue (Q) for prioritized corrective actions.',
      },
      {
        id: 'large-nbhd',
        label: 'No large-sample neighborhoods non-compliant',
        detail: 'Neighborhoods with ≥ 20 sales should meet IAAO standards',
        result: passStyle(c.largeNonCompliant === 0),
        value: c.largeNonCompliant > 0 ? `${c.largeNonCompliant} failing` : 'None',
        action: 'Large-sample non-compliance is hardest to defend at DOR review.',
      },
      {
        id: 'sales-min',
        label: 'Adequate qualified sales volume',
        detail: `Need ≥ 50 county-wide qualified sales for DOR certification`,
        result: passStyle(c.totalSales >= 50),
        value: `${c.totalSales.toLocaleString()} sales`,
        action: 'Insufficient sales — consider requesting DOR exception or extending study period.',
      },
      {
        id: 'outlier-rate',
        label: 'Outlier exclusion rate reasonable',
        detail: 'Excluded sales should be < 10% of total (per IAAO guidelines)',
        result: c.outlierRate < 0.10 ? 'pass' : c.outlierRate < 0.15 ? 'warn' : 'fail',
        value: `${(c.outlierRate * 100).toFixed(1)}%`,
        action: 'High exclusion rate requires documented rationale for each exclusion.',
      },
      {
        id: 'spatial',
        label: 'No severe spatial autocorrelation',
        detail: 'Moran\'s I > 0.45 indicates geographic bias requiring review',
        result: moransI
          ? moransI.I < 0.30 ? 'pass' : moransI.I < 0.45 ? 'warn' : 'fail'
          : 'warn',
        value: moransI ? moransI.I.toFixed(3) : 'N/A',
        action: 'Run LISA analysis to identify spatial hot spots.',
      },
      {
        id: 'eqi',
        label: 'County Equity Index acceptable',
        detail: 'EQI ≥ 65 recommended for DOR certification (Grade C+)',
        result: c.eqi.score >= 80 ? 'pass' : c.eqi.score >= 65 ? 'warn' : 'fail',
        value: `${c.eqi.score}/100 (${c.eqi.grade})`,
        action: 'Review EQI component breakdown in County Health Dashboard (C).',
      },
      // ── Manual confirmations ──────────────────────────────────────
      {
        id: 'time-adj',
        label: 'Time adjustments reviewed',
        detail: 'Confirm that sale date adjustments have been evaluated for all neighborhoods',
        result: 'manual',
      },
      {
        id: 'outlier-docs',
        label: 'Outlier exclusions documented',
        detail: 'All excluded sales must have documented rationale on file',
        result: 'manual',
      },
      {
        id: 'strat-done',
        label: 'Stratification analysis complete',
        detail: 'Property class stratification reviewed in Stratification panel (S)',
        result: 'manual',
      },
      {
        id: 'memo-gen',
        label: 'DOR narrative memo generated and reviewed',
        detail: 'Use hotkey M to generate and review the WAC 458-53A narrative draft',
        result: 'manual',
      },
    ];
  }, [computed, moransI]);

  const autoFail = checks.filter((c) => c.result === 'fail').length;
  const autoWarn = checks.filter((c) => c.result === 'warn').length;
  const manualDone = checks.filter((c) => c.result === 'manual' && manualChecks[c.id]).length;
  const manualTotal = checks.filter((c) => c.result === 'manual').length;
  const autoPassed = checks.filter((c) => c.result === 'pass').length;
  const readyForSubmit = autoFail === 0 && manualDone === manualTotal;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Summary header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <div className={`text-sm font-bold ${readyForSubmit ? 'text-emerald-400' : autoFail > 0 ? 'text-red-400' : 'text-amber-400'}`}>
            {readyForSubmit ? '✓ Ready for DOR Submission'
              : autoFail > 0 ? `${autoFail} check${autoFail > 1 ? 's' : ''} failing — not ready`
              : `${autoWarn} warning${autoWarn > 1 ? 's' : ''} — review before submitting`}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[9px]">
          <span className="text-emerald-400">{autoPassed} auto-pass</span>
          {autoFail > 0 && <span className="text-red-400">{autoFail} fail</span>}
          {autoWarn > 0 && <span className="text-amber-400">{autoWarn} warn</span>}
          <span className="text-slate-500">{manualDone}/{manualTotal} manual confirmed</span>
          <span className="ml-auto text-[8px] text-slate-600">
            {filter.taxYear} · WAC 458-53A
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${((autoPassed + manualDone) / checks.length) * 100}%`,
              backgroundColor: readyForSubmit ? '#4ade80' : autoFail > 0 ? '#ef4444' : '#fbbf24',
            }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="flex-1 overflow-y-auto">
        {checks.length === 0 ? (
          <div className="p-4 text-slate-600 text-xs text-center">
            Load neighborhood stats to run the pre-flight checklist.
          </div>
        ) : (
          <>
            <div className="px-3 py-1.5 text-[9px] text-slate-600 uppercase tracking-wider border-b border-slate-800 bg-slate-900/30">
              Automated checks
            </div>
            {checks.filter((c) => c.result !== 'manual').map((item) => (
              <CheckRow
                key={item.id}
                item={item}
                manualChecked={false}
                onToggle={() => {}}
              />
            ))}
            <div className="px-3 py-1.5 text-[9px] text-slate-600 uppercase tracking-wider border-b border-slate-800 bg-slate-900/30">
              Manual confirmations (check when complete)
            </div>
            {checks.filter((c) => c.result === 'manual').map((item) => (
              <CheckRow
                key={item.id}
                item={item}
                manualChecked={manualChecks[item.id] ?? false}
                onToggle={() =>
                  setManualChecks((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                }
              />
            ))}
          </>
        )}
        <div className="px-3 py-2 text-[8px] text-slate-700 border-t border-slate-800">
          Automated checks derived from {filter.taxYear} ratio study data.
          Manual items require assessor confirmation. WAC 458-53A · RCW 84.41.030.
        </div>
      </div>
    </div>
  );
}
