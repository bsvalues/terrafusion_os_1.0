import { useMemo, useState } from 'react';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { SalePoint } from '../types/geoforge.types';

type Severity = 'critical' | 'major' | 'moderate';

interface DataFlag {
  id: string;
  category: string;
  severity: Severity;
  headline: string;
  detail: string;
  count: number;
  action: string;
  saleIds?: string[];
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function isRoundPrice(price: number): boolean {
  return price >= 10000 && (price % 5000 === 0 || price % 10000 === 0);
}

function buildFlags(sales: SalePoint[]): DataFlag[] {
  const flags: DataFlag[] = [];
  const qualified = sales.filter((s) => !s.isOutlier);
  const allPrices = qualified.filter((s) => s.salePrice > 0).map((s) => s.salePrice);
  const countyMedianAV = median(qualified.filter((s) => s.assessedValue > 0).map((s) => s.assessedValue));
  const countyMedianSP = median(allPrices);

  // 1. Round-number prices (possible non-arm's-length)
  const roundPrices = qualified.filter((s) => isRoundPrice(s.salePrice));
  const roundRate = qualified.length > 0 ? roundPrices.length / qualified.length : 0;
  if (roundRate > 0.15) {
    flags.push({
      id: 'round-prices',
      category: 'Data Integrity',
      severity: roundRate > 0.30 ? 'major' : 'moderate',
      headline: 'High rate of round-number sale prices',
      detail: `${roundPrices.length} sales (${(roundRate * 100).toFixed(1)}%) have prices divisible by $5,000 or $10,000.`,
      count: roundPrices.length,
      action: 'Review for non-arm\'s-length transfers. Verify through Tyler Vision or source system transaction records.',
      saleIds: roundPrices.slice(0, 20).map((s) => s.saleId),
    });
  }

  // 2. Sales below county median AV (price < AV = extreme under-market)
  const belowAV = qualified.filter((s) => s.salePrice > 0 && s.assessedValue > 0 && s.salePrice < s.assessedValue * 0.70);
  if (belowAV.length > 0) {
    flags.push({
      id: 'below-av',
      category: 'Ratio Contamination',
      severity: belowAV.length > 5 ? 'critical' : 'major',
      headline: 'Sales priced below 70% of assessed value',
      detail: `${belowAV.length} qualified sales have sale price < 70% of AV — extremely low ratios that may contaminate study.`,
      count: belowAV.length,
      action: 'Verify these are arm\'s-length. Consider exclusion with documented rationale. Check for data entry errors.',
      saleIds: belowAV.slice(0, 20).map((s) => s.saleId),
    });
  }

  // 3. Sales far above median (price > 2× county median SP — possible data entry error)
  const extremeHigh = qualified.filter(
    (s) => countyMedianSP > 0 && s.salePrice > countyMedianSP * 3 && s.salePrice > 1_000_000
  );
  if (extremeHigh.length > 0) {
    flags.push({
      id: 'extreme-high',
      category: 'Data Entry',
      severity: 'major',
      headline: 'Unusually high sale prices (possible data entry errors)',
      detail: `${extremeHigh.length} sales exceed 3× the county median sale price of $${(countyMedianSP / 1000).toFixed(0)}K.`,
      count: extremeHigh.length,
      action: 'Verify sale prices in the source assessment system. Check for misplaced decimal points or duplicate recording.',
      saleIds: extremeHigh.map((s) => s.saleId),
    });
  }

  // 4. Missing qualification decisions on excluded sales
  const excludedNoReason = sales.filter(
    (s) => s.isOutlier && (!s.qualificationDecision || s.qualificationDecision.trim().length < 3)
  );
  if (excludedNoReason.length > 0) {
    flags.push({
      id: 'undoc-exclusions',
      category: 'Documentation',
      severity: excludedNoReason.length > 3 ? 'critical' : 'major',
      headline: 'Excluded sales without documented rationale',
      detail: `${excludedNoReason.length} excluded sales have no qualification decision on record.`,
      count: excludedNoReason.length,
      action: 'IAAO §5.2 requires written justification for each exclusion. Document before DOR submission (hotkey U).',
      saleIds: excludedNoReason.slice(0, 20).map((s) => s.saleId),
    });
  }

  // 5. Outlier concentration by neighborhood (>40% of a neighborhood's sales excluded)
  const byNbhd = new Map<string, { total: number; outlier: number }>();
  for (const s of sales) {
    const r = byNbhd.get(s.neighborhoodCode) ?? { total: 0, outlier: 0 };
    r.total++;
    if (s.isOutlier) r.outlier++;
    byNbhd.set(s.neighborhoodCode, r);
  }
  const highOutlierNbhds = Array.from(byNbhd.entries()).filter(
    ([, { total, outlier }]) => total >= 5 && outlier / total > 0.40
  );
  if (highOutlierNbhds.length > 0) {
    flags.push({
      id: 'outlier-concentration',
      category: 'Neighborhood Integrity',
      severity: highOutlierNbhds.length > 2 ? 'critical' : 'major',
      headline: 'High outlier concentration in neighborhoods',
      detail: `${highOutlierNbhds.length} neighborhood${highOutlierNbhds.length !== 1 ? 's' : ''} have > 40% of sales excluded: ${highOutlierNbhds.map(([c]) => c).join(', ')}.`,
      count: highOutlierNbhds.length,
      action: 'Review exclusion criteria for these neighborhoods. High rates inflate COD and may indicate systemic misclassification.',
    });
  }

  // 6. Zero or negative sale prices
  const zeroPrice = sales.filter((s) => s.salePrice <= 0);
  if (zeroPrice.length > 0) {
    flags.push({
      id: 'zero-price',
      category: 'Data Integrity',
      severity: 'critical',
      headline: 'Sales with zero or negative sale price',
      detail: `${zeroPrice.length} sale record${zeroPrice.length !== 1 ? 's' : ''} have salePrice ≤ 0 — should never appear in ratio study.`,
      count: zeroPrice.length,
      action: 'Exclude these records immediately. Investigate the data extract pipeline for ETL issues.',
      saleIds: zeroPrice.map((s) => s.saleId),
    });
  }

  // 7. Missing property class
  const missingClass = sales.filter((s) => !s.propertyClass || s.propertyClass.trim() === '');
  if (missingClass.length > 0) {
    flags.push({
      id: 'missing-class',
      category: 'Classification',
      severity: missingClass.length > 10 ? 'major' : 'moderate',
      headline: 'Sales with missing property class',
      detail: `${missingClass.length} sale${missingClass.length !== 1 ? 's' : ''} have no property class code — required for stratification analysis.`,
      count: missingClass.length,
      action: 'Reclassify via Tyler Vision or the source assessment system. Missing class codes prevent valid stratification per WAC 458-53A.',
    });
  }

  // Sort: critical first, then by count
  return flags.sort((a, b) => {
    const order = { critical: 0, major: 1, moderate: 2 };
    if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity];
    return b.count - a.count;
  });
}

const SEV_META: Record<Severity, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: 'text-red-400',    bg: 'bg-red-950/20',    border: 'border-red-800/40',    label: 'CRITICAL' },
  major:    { color: 'text-amber-400',  bg: 'bg-amber-950/15',  border: 'border-amber-800/30',  label: 'MAJOR' },
  moderate: { color: 'text-yellow-500', bg: '',                  border: 'border-slate-800/50',  label: 'MODERATE' },
};

function FlagCard({ flag }: { flag: DataFlag }) {
  const [expanded, setExpanded] = useState(false);
  const meta = SEV_META[flag.severity];

  return (
    <div
      className={`border-b ${meta.border} ${meta.bg} cursor-pointer`}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start gap-2 px-3 py-2">
        <span className={`text-[9px] font-bold shrink-0 mt-0.5 w-16 ${meta.color}`}>{meta.label}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className={`text-[10px] font-semibold ${meta.color}`}>{flag.headline}</span>
            <span className={`text-[9px] font-mono shrink-0 ${meta.color}`}>{flag.count.toLocaleString()}</span>
          </div>
          <div className="text-[8px] text-slate-500 mt-0.5">{flag.category}</div>
          {!expanded && (
            <div className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{flag.detail}</div>
          )}
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-2.5 border-t border-slate-800/40 pt-1.5">
          <div className="text-[9px] text-slate-300 mb-1">{flag.detail}</div>
          <div className={`text-[9px] ${meta.color}/80 mb-1`}>→ {flag.action}</div>
          {flag.saleIds && flag.saleIds.length > 0 && (
            <div className="text-[8px] text-slate-600 font-mono">
              Sample IDs: {flag.saleIds.slice(0, 5).join(', ')}{flag.saleIds.length > 5 ? ` +${flag.saleIds.length - 5} more` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DataQualityPanel() {
  const { salePoints, filter } = useGeoForgeStore();

  const flags = useMemo(() => buildFlags(salePoints), [salePoints]);

  const critCount = flags.filter((f) => f.severity === 'critical').length;
  const majCount  = flags.filter((f) => f.severity === 'major').length;
  const modCount  = flags.filter((f) => f.severity === 'moderate').length;

  const overallStatus =
    critCount > 0 ? 'critical' :
    majCount > 0  ? 'major' :
    modCount > 0  ? 'moderate' : 'clean';

  const overallMeta = {
    clean:    { label: 'Data quality: No issues detected',      color: 'text-emerald-400' },
    moderate: { label: `${modCount} moderate quality concern${modCount !== 1 ? 's' : ''}`, color: 'text-yellow-500' },
    major:    { label: `${majCount + modCount} issue${majCount + modCount !== 1 ? 's' : ''} — review before DOR submission`, color: 'text-amber-400' },
    critical: { label: `${critCount} critical data problem${critCount !== 1 ? 's' : ''} — must resolve before ratio study`, color: 'text-red-400' },
  }[overallStatus];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-slate-700/50">
        <div className={`text-[11px] font-semibold ${overallMeta.color} mb-1`}>{overallMeta.label}</div>
        <div className="flex items-center gap-3 text-[9px]">
          {critCount > 0 && <span className="text-red-400">{critCount} critical</span>}
          {majCount > 0  && <span className="text-amber-400">{majCount} major</span>}
          {modCount > 0  && <span className="text-yellow-500">{modCount} moderate</span>}
          {flags.length === 0 && <span className="text-emerald-400">All checks passed</span>}
          <span className="ml-auto text-[8px] text-slate-600">
            {salePoints.length.toLocaleString()} sales · {filter.taxYear}
          </span>
        </div>

        {/* Score bar */}
        <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.max(5, 100 - critCount * 25 - majCount * 10 - modCount * 5)}%`,
              backgroundColor: critCount > 0 ? '#ef4444' : majCount > 0 ? '#fbbf24' : '#4ade80',
            }}
          />
        </div>
      </div>

      {/* Flag list */}
      <div className="flex-1 overflow-y-auto">
        {salePoints.length === 0 ? (
          <div className="p-4 text-slate-600 text-xs text-center">Load sales data to run data quality checks.</div>
        ) : flags.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-emerald-400 text-lg mb-1">✓</div>
            <div className="text-slate-400 text-sm">No data quality issues detected.</div>
            <div className="text-slate-600 text-[9px] mt-1">
              All {salePoints.length.toLocaleString()} sales passed automated quality checks.
            </div>
          </div>
        ) : (
          flags.map((f) => <FlagCard key={f.id} flag={f} />)
        )}
        <p className="px-3 py-2 text-[8px] text-slate-700">
          Automated checks per IAAO Standard on Ratio Studies and WAC 458-53A-060 documentation requirements.
          Click any flag to expand detail and recommended action.
        </p>
      </div>
    </div>
  );
}
