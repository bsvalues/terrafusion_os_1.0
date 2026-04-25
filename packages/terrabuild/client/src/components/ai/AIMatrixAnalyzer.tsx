/**
 * Rate Matrix Deep Analysis — Benton Method
 *
 * Full equity review of the Benton County cost matrix using the Benton Method
 * three-tier diagnostic stack:
 *  1. PRD  — Price-Related Differential (signal: is the model regressive?)
 *  2. PRB  — Price-Related Bias (test: magnitude and direction of scale bias)
 *  3. Decile / quartile breakdown (explanation: where does the model break down?)
 *
 * Plus IAAO standard metrics (COD, COV, spread) and area factor pattern analysis.
 * All computation is client-side on live /api/benchmarking/hierarchical-costs data.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, BarChart3, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Reval area display names ─────────────────────────────────────────────────

const REVAL_NAMES: Record<string, string> = {
  'Reval 1': 'Kennewick NE',
  'Reval 2': 'Kennewick Urban',
  'Reval 3': 'South Richland',
  'Reval 4': 'Benton City / Prosser',
  'Reval 5': 'Richland West',
  'Reval 6': 'Historic Richland',
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface RegionRate { region: string; baseCostPerSqft: number; }
interface HierarchyEntry {
  buildingType: string;
  buildingTypeLabel: string;
  regions: RegionRate[];
  avgRate: number;
  minRate: number;
  maxRate: number;
}

type PropertyCategory = 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'special';

interface TypeMetrics {
  buildingType: string;
  buildingTypeLabel: string;
  category: PropertyCategory;
  mean: number;
  median: number;
  cod: number;
  cov: number;
  spreadRatio: number;
  minRate: number;
  maxRate: number;
  iaaoThreshold: number;
  pass: boolean;
  valueTier: 'Low' | 'Mid' | 'High';
  rates: { region: string; rate: number; devPct: number }[];
}

interface AreaMetrics {
  region: string;
  displayName: string;
  meanRate: number;
  biasPct: number;
  factor: number;
  bias: 'High' | 'Low' | 'On-target';
  typesAbove: number;
  typesBelow: number;
  // Benton Method VEI diagnostics
  prd: number;
  prb: number;
  veiSignal: 'Regressive' | 'Progressive' | 'Equitable';
}

interface OutlierCell {
  buildingType: string;
  buildingTypeLabel: string;
  region: string;
  rate: number;
  typeMean: number;
  devPct: number;
  devSigmas: number;
}

interface Finding {
  level: 'ok' | 'info' | 'warn' | 'flag';
  text: string;
}

interface AnalysisResult {
  countyMean: number;
  countyMedian: number;
  overallCod: number;
  overallCov: number;
  uniformAreaFactors: boolean;
  areaFactors: { region: string; factor: number }[];
  typeMetrics: TypeMetrics[];
  areaMetrics: AreaMetrics[];
  outliers: OutlierCell[];
  findings: Finding[];
  recommendations: string[];
  passCount: number;
  failCount: number;
  matrixVEI: 'Perfect' | 'Near-Perfect' | 'Needs Review';
}

// ─── Classification ───────────────────────────────────────────────────────────

function classifyType(code: string): PropertyCategory {
  if (code.startsWith('R')) return 'residential';
  if (code.startsWith('C')) return 'commercial';
  if (code.startsWith('I')) return 'industrial';
  if (code.startsWith('A')) return 'agricultural';
  return 'special';
}

function iaaoThreshold(cat: PropertyCategory): number {
  return cat === 'residential' ? 15 : 20;
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

function calcMean(vals: number[]): number {
  return vals.length === 0 ? 0 : vals.reduce((a, b) => a + b, 0) / vals.length;
}

function calcMedian(vals: number[]): number {
  const s = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

function calcStdDev(vals: number[]): number {
  const m = calcMean(vals);
  return Math.sqrt(vals.map(v => (v - m) ** 2).reduce((a, b) => a + b, 0) / vals.length);
}

// COD: IAAO standard — mean absolute deviation from median / median × 100
function calcCod(vals: number[]): number {
  const med = calcMedian(vals);
  if (med === 0) return 0;
  return (calcMean(vals.map(v => Math.abs(v - med))) / med) * 100;
}

// COV: std dev / mean × 100
function calcCov(vals: number[]): number {
  const m = calcMean(vals);
  return m === 0 ? 0 : (calcStdDev(vals) / m) * 100;
}

// ─── Benton Method VEI diagnostics ───────────────────────────────────────────
//
// Adapted for cost rate matrices (no sale prices available):
//
// PRD: mean(area_rate / type_mean) / (Σ area_rates / Σ type_means)
//   = uniform_factor / uniform_factor = 1.000 if matrix uses pure multipliers.
//   Deviations from 1.000 indicate that some building types receive
//   disproportionately larger/smaller area adjustments — structural regressivity.
//   IAAO target: 0.98 – 1.03 (equitable)
//
// PRB: OLS slope of (ratio - 1) on (type_mean - county_mean)/county_mean
//   = how much the area adjustment changes as the building type value tier rises.
//   Near zero  → area adjustment is proportional (equitable).
//   Negative   → cheaper types get bigger area adjustment (regressive).
//   Positive   → expensive types get bigger area adjustment (progressive).
//   Target: |PRB| < 0.05

function computeAreaVEI(
  data: HierarchyEntry[],
  region: string,
  overallMean: number
): { prd: number; prb: number; signal: 'Regressive' | 'Progressive' | 'Equitable' } {
  const typeMeans = data.map(e => calcMean(e.regions.map(r => r.baseCostPerSqft)));
  const areaRates = data.map(e => {
    const found = e.regions.find(r => r.region === region);
    return found ? found.baseCostPerSqft : 0;
  });

  const ratios = areaRates.map((rate, i) => typeMeans[i] > 0 ? rate / typeMeans[i] : 1);
  const meanRatio = calcMean(ratios);
  const sumRates = areaRates.reduce((a, b) => a + b, 0);
  const sumMeans = typeMeans.reduce((a, b) => a + b, 0);
  const valueWeightedMean = sumMeans > 0 ? sumRates / sumMeans : 1;
  const prd = valueWeightedMean > 0 ? meanRatio / valueWeightedMean : 1;

  // PRB: OLS slope
  const x = typeMeans.map(m => overallMean > 0 ? (m - overallMean) / overallMean : 0);
  const y = ratios.map(r => r - 1);
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
  const sumX2 = x.reduce((s, xi) => s + xi * xi, 0);
  const denom = n * sumX2 - sumX * sumX;
  const prb = Math.abs(denom) > 1e-10 ? (n * sumXY - sumX * sumY) / denom : 0;

  const signal: 'Regressive' | 'Progressive' | 'Equitable' =
    prd > 1.03 ? 'Regressive' : prd < 0.98 ? 'Progressive' : 'Equitable';

  return { prd, prb, signal };
}

// ─── Heat-map cell coloring ───────────────────────────────────────────────────

function cellBg(devPct: number): string {
  const abs = Math.abs(devPct);
  if (abs <= 5)  return 'bg-green-50 text-green-900 border-green-200';
  if (abs <= 10) return 'bg-yellow-50 text-yellow-900 border-yellow-200';
  if (abs <= 15) return 'bg-orange-50 text-orange-900 border-orange-200';
  return 'bg-red-50 text-red-900 border-red-200';
}

// ─── Analysis engine ──────────────────────────────────────────────────────────

function analyzeMatrix(data: HierarchyEntry[]): AnalysisResult {
  const findings: Finding[] = [];
  const recommendations: string[] = [];

  // Per-type metrics
  const allTypeMeans = data.map(e => calcMean(e.regions.map(r => r.baseCostPerSqft)));
  const meanLow = calcMean(allTypeMeans) * 0.67;
  const meanHigh = calcMean(allTypeMeans) * 1.33;

  const typeMetrics: TypeMetrics[] = data.map((entry, idx) => {
    const rates = entry.regions.map(r => r.baseCostPerSqft);
    const m = allTypeMeans[idx];
    const category = classifyType(entry.buildingType);
    const threshold = iaaoThreshold(category);
    const codVal = calcCod(rates);
    const covVal = calcCov(rates);
    const spreadRatio = entry.maxRate / entry.minRate;
    const valueTier: TypeMetrics['valueTier'] = m < meanLow ? 'Low' : m > meanHigh ? 'High' : 'Mid';
    return {
      buildingType: entry.buildingType,
      buildingTypeLabel: entry.buildingTypeLabel,
      category,
      mean: m,
      median: calcMedian(rates),
      cod: codVal,
      cov: covVal,
      spreadRatio,
      minRate: entry.minRate,
      maxRate: entry.maxRate,
      iaaoThreshold: threshold,
      pass: codVal <= threshold,
      valueTier,
      rates: entry.regions.map(r => ({
        region: r.region,
        rate: r.baseCostPerSqft,
        devPct: ((r.baseCostPerSqft - m) / m) * 100,
      })),
    };
  });

  // County-wide stats
  const allRates = data.flatMap(e => e.regions.map(r => r.baseCostPerSqft));
  const countyMean = calcMean(allRates);
  const countyMedian = calcMedian(allRates);
  const overallCod = calcCod(allRates);
  const overallCov = calcCov(allRates);

  // Area metrics + VEI
  const revalNames = data[0]?.regions.map(r => r.region) ?? [];
  const typeMeans = data.map(e => calcMean(e.regions.map(r => r.baseCostPerSqft)));
  const typeMeanOverall = calcMean(typeMeans);

  const areaMetrics: AreaMetrics[] = revalNames.map(region => {
    const areaRates = data.map(e => {
      const found = e.regions.find(r => r.region === region);
      return found ? found.baseCostPerSqft : countyMean;
    });
    const areaMean = calcMean(areaRates);
    const biasPct = ((areaMean - countyMean) / countyMean) * 100;
    const { prd, prb, signal } = computeAreaVEI(data, region, typeMeanOverall);
    return {
      region,
      displayName: REVAL_NAMES[region] ?? region,
      meanRate: areaMean,
      biasPct,
      factor: areaMean / countyMean,
      bias: biasPct > 3 ? 'High' : biasPct < -3 ? 'Low' : 'On-target',
      typesAbove: areaRates.filter(r => r > countyMean).length,
      typesBelow: areaRates.filter(r => r < countyMean).length,
      prd,
      prb,
      veiSignal: signal,
    };
  });

  // Matrix-level VEI status
  const allEquitable = areaMetrics.every(a => a.veiSignal === 'Equitable');
  const anyRegressive = areaMetrics.some(a => a.veiSignal === 'Regressive');
  const matrixVEI: AnalysisResult['matrixVEI'] = allEquitable ? 'Perfect' : anyRegressive ? 'Needs Review' : 'Near-Perfect';

  // Detect uniform area factor structure
  const impliedFactors = data.map(entry => {
    const tm = calcMean(entry.regions.map(r => r.baseCostPerSqft));
    return entry.regions.map(r => r.baseCostPerSqft / tm);
  });
  const referenceFactors = impliedFactors[0] ?? [];
  const uniformAreaFactors = impliedFactors.every(tf =>
    tf.every((f, i) => Math.abs(f - (referenceFactors[i] ?? f)) < 0.001)
  );
  const areaFactors = revalNames.map((region, i) => ({
    region,
    factor: referenceFactors[i] ?? 1,
  }));

  // Outlier cells (>2σ from type mean)
  const outliers: OutlierCell[] = [];
  typeMetrics.forEach(tm => {
    const sd = calcStdDev(tm.rates.map(r => r.rate));
    tm.rates.forEach(r => {
      const devSigmas = sd > 0 ? Math.abs(r.rate - tm.mean) / sd : 0;
      if (devSigmas > 2) {
        outliers.push({
          buildingType: tm.buildingType,
          buildingTypeLabel: tm.buildingTypeLabel,
          region: r.region,
          rate: r.rate,
          typeMean: tm.mean,
          devPct: r.devPct,
          devSigmas,
        });
      }
    });
  });

  // ─── Findings ────────────────────────────────────────────────────────────────

  if (outliers.length > 0) {
    findings.push({
      level: 'flag',
      text: `${outliers.length} cell${outliers.length > 1 ? 's' : ''} exceed 2σ from building-type mean: ${
        outliers.map(o => `${o.buildingType}/${o.region} (${o.devPct >= 0 ? '+' : ''}${o.devPct.toFixed(1)}%, ${o.devSigmas.toFixed(1)}σ)`).join('; ')
      }. Review these cells in the cost schedule for data entry errors.`,
    });
  }

  // VEI diagnostic summary
  if (matrixVEI === 'Perfect') {
    findings.push({
      level: 'ok',
      text: `BENTON METHOD VEI DIAGNOSTIC — SIGNAL: All ${revalNames.length} reval areas return PRD = 1.000 (range: ${
        Math.min(...areaMetrics.map(a => a.prd)).toFixed(3)} – ${Math.max(...areaMetrics.map(a => a.prd)).toFixed(3)}). ` +
        `The rate matrix is vertically equitable by construction: area factors are applied as proportional multipliers (not lump sums), ` +
        `so every building type receives the identical percentage adjustment regardless of value tier. PRD = 1.000 is the target.`,
    });
    findings.push({
      level: 'ok',
      text: `BENTON METHOD VEI DIAGNOSTIC — TEST: PRB slopes across all reval areas are at or near 0.000. ` +
        `No regression-detectable scale bias is present in the rate matrix structure. ` +
        `Note: full PRB/decile analysis of the complete cost approach (including secondary features, quality, and condition adjustments) ` +
        `requires a ratio study against arm's-length sales records to confirm system-wide vertical equity.`,
    });
  } else {
    const problemAreas = areaMetrics.filter(a => a.veiSignal !== 'Equitable');
    problemAreas.forEach(a => {
      findings.push({
        level: 'flag',
        text: `VEI SIGNAL — ${a.region} (${a.displayName}): PRD = ${a.prd.toFixed(3)} (${a.veiSignal}). ` +
          `PRB slope = ${a.prb.toFixed(4)}. The area factor for this reval area is not applied proportionally ` +
          `across all building type value tiers. Review the rate schedule for this area.`,
      });
    });
  }

  // Uniform area factor flag
  if (uniformAreaFactors) {
    const r3f = areaFactors.find(f => f.region === 'Reval 3');
    const r6f = areaFactors.find(f => f.region === 'Reval 6');
    const r3Pct = r3f ? ((r3f.factor - 1) * 100).toFixed(1) : '?';
    const r6Pct = r6f ? ((r6f.factor - 1) * 100).toFixed(1) : '?';
    findings.push({
      level: 'info',
      text: `UNIFORM AREA FACTOR STRUCTURE: All ${data.length} building types share identical area multipliers ` +
        `(R3 +${r3Pct}% through R6 ${r6Pct}%). The matrix is structured as base_rate × area_factor with no ` +
        `per-type calibration. This is why PRD = 1.000 — the multiplicative design prevents scale bias within the rate matrix. ` +
        `Verify that the same proportional logic is applied to all secondary feature schedules (patios, garages, shops, basements). ` +
        `Lump-sum secondary features will break VEI even when base rates are equitable.`,
    });
    recommendations.push(
      'Audit all secondary feature schedules (patios, shops, basements, garages) for lump-sum dollar adjustments. ' +
      'Per the Benton Method, these must be expressed as %-of-base to prevent the Scale Effect from reintroducing regressivity.'
    );
    recommendations.push(
      'Commission a type-stratified ratio study by reval area using TerraFusion arm\'s-length sales records to validate ' +
      'that the full cost approach (base rate + depreciation + secondary features) achieves PRD 0.98–1.03 and PRB near zero.'
    );
  }

  const failedTypes = typeMetrics.filter(t => !t.pass).sort((a, b) => b.cod - a.cod);
  const passedTypes = typeMetrics.filter(t => t.pass).sort((a, b) => b.cod - a.cod);

  failedTypes.forEach(t => {
    findings.push({
      level: 'flag',
      text: `${t.buildingTypeLabel} (${t.buildingType}) [${t.category}]: COD ${t.cod.toFixed(1)}% exceeds IAAO ` +
        `${t.category} standard of ≤${t.iaaoThreshold}%. Rate range $${t.minRate.toFixed(2)}–$${t.maxRate.toFixed(2)}/sqft, ` +
        `spread ratio ${t.spreadRatio.toFixed(2)}×. Rate variation across reval areas may indicate inequitable cost treatment.`,
    });
  });

  const highBiasAreas = areaMetrics.filter(a => Math.abs(a.biasPct) > 10).sort((a, b) => Math.abs(b.biasPct) - Math.abs(a.biasPct));
  const moderateBiasAreas = areaMetrics.filter(a => Math.abs(a.biasPct) > 3 && Math.abs(a.biasPct) <= 10);

  highBiasAreas.forEach(a => {
    findings.push({
      level: 'flag',
      text: `${a.region} (${a.displayName}): ${Math.abs(a.biasPct).toFixed(1)}% ${a.bias === 'High' ? 'above' : 'below'} county mean ` +
        `(implied area factor ${a.factor.toFixed(3)}). All ${data.length} building types carry this differential. ` +
        `Verify this differential is supported by arm's-length sales ratio results before the next reval cycle.`,
    });
    recommendations.push(
      `Validate ${a.region} (${a.displayName}) area factor (${((a.factor - 1) * 100).toFixed(1)}%) against current TerraFusion ratio study results for this area.`
    );
  });

  moderateBiasAreas.forEach(a => {
    findings.push({
      level: 'warn',
      text: `${a.region} (${a.displayName}): ${a.biasPct >= 0 ? '+' : ''}${a.biasPct.toFixed(1)}% vs. county mean. ` +
        `Monitor — recalibrate if ratio study results diverge from area factor by more than 3%.`,
    });
  });

  passedTypes.forEach(t => {
    findings.push({
      level: 'ok',
      text: `${t.buildingTypeLabel} (${t.buildingType}): COD ${t.cod.toFixed(1)}% within IAAO ${t.category} threshold (≤${t.iaaoThreshold}%). ` +
        `Rate spread $${t.minRate.toFixed(2)}–$${t.maxRate.toFixed(2)}/sqft, ratio ${t.spreadRatio.toFixed(2)}×.`,
    });
  });

  if (failedTypes.length === 0 && outliers.length === 0) {
    recommendations.push('All building types are within IAAO COD thresholds. Maintain annual monitoring and recalibrate when ratio study PRD/PRB drift outside target range.');
  }
  recommendations.push(
    'Document area factor basis in the assessor\'s office methodology manual. WAC 458-07 requires that adjustments be supported by market evidence.'
  );
  if (overallCod > 20) {
    recommendations.push('Overall matrix COD exceeds 20%. Consider a full cost schedule recalibration before the next reval cycle, supported by stratified ratio study results.');
  }

  return {
    countyMean,
    countyMedian,
    overallCod,
    overallCov,
    uniformAreaFactors,
    areaFactors,
    typeMetrics,
    areaMetrics,
    outliers,
    findings,
    recommendations,
    passCount: passedTypes.length,
    failCount: failedTypes.length,
    matrixVEI,
  };
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function fetchHierarchy(): Promise<HierarchyEntry[]> {
  const res = await fetch('/api/benchmarking/hierarchical-costs');
  if (!res.ok) throw new Error('Failed to load cost matrix');
  const d = await res.json();
  return d.hierarchical ?? [];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 pt-1 border-t">
      {children}
    </div>
  );
}

function StatusBadge({ pass }: { pass: boolean }) {
  return pass
    ? <span className="inline-flex items-center gap-0.5 text-xs text-green-700 font-medium"><CheckCircle2 className="h-3 w-3" /> PASS</span>
    : <span className="inline-flex items-center gap-0.5 text-xs text-red-700 font-medium"><AlertTriangle className="h-3 w-3" /> FAIL</span>;
}

function VEIBadge({ signal }: { signal: string }) {
  if (signal === 'Equitable') return <span className="inline-flex items-center gap-0.5 text-xs text-green-700 font-medium"><CheckCircle2 className="h-3 w-3" /> Equitable</span>;
  if (signal === 'Regressive') return <span className="inline-flex items-center gap-0.5 text-xs text-red-700 font-medium"><TrendingDown className="h-3 w-3" /> Regressive</span>;
  return <span className="inline-flex items-center gap-0.5 text-xs text-blue-700 font-medium"><TrendingUp className="h-3 w-3" /> Progressive</span>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIMatrixAnalyzer() {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['matrix-hierarchy'],
    queryFn: fetchHierarchy,
  });

  const handleRun = () => {
    if (!data?.length) return;
    setResult(analyzeMatrix(data));
  };

  const regions = data?.[0]?.regions.map(r => r.region) ?? [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Rate Matrix Deep Analysis — Benton Method
        </CardTitle>
        <CardDescription>
          PRD signal · PRB test · Decile/quartile breakdown · COD by property class · area factor pattern analysis.
          Client-side on live county data.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Matrix status */}
        <div className="rounded-md border bg-muted/30 p-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Live from API</div>
          {isLoading ? (
            <div className="space-y-1.5"><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-36" /></div>
          ) : isError ? (
            <Alert variant="destructive"><AlertDescription>Failed to load matrix data.</AlertDescription></Alert>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{data?.length ?? 0} building types</Badge>
              <Badge variant="outline">{data?.[0]?.regions.length ?? 0} reval areas</Badge>
              <Badge variant="outline" className="text-green-700 border-green-300">Benton County 2025</Badge>
            </div>
          )}
        </div>

        <Button onClick={handleRun} disabled={isLoading || !data?.length} className="w-full">
          Run Rate Equity Analysis
        </Button>

        {result && (
          <div className="space-y-6">

            {/* 1. Executive Summary */}
            <SectionLabel>Executive Summary — Benton County 2025 Cost Matrix</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'County Mean Rate', value: `$${result.countyMean.toFixed(2)}/sqft` },
                { label: 'Overall COD', value: `${result.overallCod.toFixed(1)}%` },
                { label: 'Types Passing IAAO', value: `${result.passCount} / ${result.passCount + result.failCount}` },
                { label: 'Matrix VEI Status', value: result.matrixVEI },
                { label: 'Outlier Cells', value: result.outliers.length.toString() },
              ].map(s => (
                <div key={s.label} className="rounded-md border bg-muted/20 p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                  <div className={`font-semibold text-sm ${s.label === 'Matrix VEI Status' ? (s.value === 'Perfect' ? 'text-green-700' : s.value === 'Needs Review' ? 'text-red-700' : 'text-amber-700') : ''}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* 2. Benton Method VEI Diagnostics — PRD + PRB */}
            <SectionLabel>Benton Method VEI Diagnostics — PRD Signal · PRB Test</SectionLabel>
            <div className="text-xs text-muted-foreground mb-2 space-y-1">
              <p><strong>PRD (Signal):</strong> mean assessment ratio / value-weighted mean ratio. Target 0.98–1.03. PRD &gt; 1.03 = regressivity (lower-tier properties over-assessed). PRD &lt; 0.98 = progressivity.</p>
              <p><strong>PRB (Test):</strong> OLS slope of rate-deviation vs. building-type value tier. Near zero = proportional/equitable. Negative = cheaper types get larger area adjustments (regressive). Target |PRB| &lt; 0.05.</p>
              <p className="text-[10px] italic">Adapted for cost rate matrix: uses type mean rate as value-tier proxy. Full PRD/PRB with sale prices requires a ratio study against arm's-length sales records.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="border px-2 py-1.5 text-left">Reval Area</th>
                    <th className="border px-2 py-1.5 text-left">Neighborhood</th>
                    <th className="border px-2 py-1.5 text-center">PRD</th>
                    <th className="border px-2 py-1.5 text-center">PRD Target</th>
                    <th className="border px-2 py-1.5 text-center">PRB Slope</th>
                    <th className="border px-2 py-1.5 text-center">PRB Target</th>
                    <th className="border px-2 py-1.5 text-center">VEI Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {result.areaMetrics.sort((a, b) => b.biasPct - a.biasPct).map(a => (
                    <tr key={a.region} className="hover:bg-muted/20">
                      <td className="border px-2 py-1.5 font-semibold">{a.region}</td>
                      <td className="border px-2 py-1.5 text-muted-foreground">{a.displayName}</td>
                      <td className={`border px-2 py-1.5 text-center font-mono font-semibold ${a.prd > 1.03 || a.prd < 0.98 ? 'text-red-700' : 'text-green-700'}`}>
                        {a.prd.toFixed(3)}
                      </td>
                      <td className="border px-2 py-1.5 text-center text-muted-foreground">0.98–1.03</td>
                      <td className={`border px-2 py-1.5 text-center font-mono ${Math.abs(a.prb) > 0.05 ? 'text-red-700 font-semibold' : 'text-green-700'}`}>
                        {a.prb.toFixed(4)}
                      </td>
                      <td className="border px-2 py-1.5 text-center text-muted-foreground">|PRB| &lt; 0.05</td>
                      <td className="border px-2 py-1.5 text-center">
                        <VEIBadge signal={a.veiSignal} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3. Value-Tier Breakdown — Decile Equivalent */}
            <SectionLabel>Value-Tier Breakdown (Benton Method Decile Explanation) — Rate by Value Tier × Reval Area</SectionLabel>
            <div className="text-xs text-muted-foreground mb-2">
              Building types sorted by mean rate (value-tier proxy — Low / Mid / High). With proportional area factors, all tiers receive identical % adjustment. Any deviation here indicates structural scale bias.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="border px-2 py-1.5 text-left">Tier</th>
                    <th className="border px-2 py-1.5 text-left">Type</th>
                    <th className="border px-2 py-1.5 text-center">Mean $/sqft</th>
                    {regions.map(r => (
                      <th key={r} className="border px-2 py-1.5 text-center">{r.replace('Reval ', 'R')}</th>
                    ))}
                    <th className="border px-2 py-1.5 text-center">R3/R6 Spread</th>
                  </tr>
                </thead>
                <tbody>
                  {[...result.typeMetrics].sort((a, b) => a.mean - b.mean).map(tm => {
                    const r3Rate = tm.rates.find(r => r.region === 'Reval 3')?.rate ?? 0;
                    const r6Rate = tm.rates.find(r => r.region === 'Reval 6')?.rate ?? 0;
                    const spread = r6Rate > 0 ? r3Rate / r6Rate : 1;
                    return (
                      <tr key={tm.buildingType} className="hover:bg-muted/20">
                        <td className={`border px-2 py-1.5 font-semibold text-xs ${
                          tm.valueTier === 'Low' ? 'text-blue-700' :
                          tm.valueTier === 'High' ? 'text-purple-700' : 'text-gray-600'}`}>
                          {tm.valueTier}
                        </td>
                        <td className="border px-2 py-1.5">
                          <span className="font-mono font-semibold">{tm.buildingType}</span>
                          <span className="text-muted-foreground ml-1">{tm.buildingTypeLabel}</span>
                        </td>
                        <td className="border px-2 py-1.5 text-center font-mono font-semibold">${tm.mean.toFixed(2)}</td>
                        {tm.rates.map(r => (
                          <td key={r.region} className={`border px-1.5 py-1.5 text-center font-mono text-[11px] ${cellBg(r.devPct)}`}>
                            <div>${r.rate.toFixed(2)}</div>
                            <div className="text-[10px] opacity-70">{r.devPct >= 0 ? '+' : ''}{r.devPct.toFixed(1)}%</div>
                          </td>
                        ))}
                        <td className="border px-2 py-1.5 text-center font-mono">{spread.toFixed(3)}×</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 4. Full Heat-Map Rate Matrix */}
            <SectionLabel>Full Rate Matrix — $/sqft Heat Map by Building Type × Reval Area</SectionLabel>
            <div className="text-xs text-muted-foreground mb-2 flex gap-3 flex-wrap">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-300" /> ±5% of type mean</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-yellow-100 border border-yellow-300" /> 5–10%</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-orange-100 border border-orange-300" /> 10–15%</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-300" /> &gt;15%</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="border px-2 py-1.5 text-left">Type</th>
                    <th className="border px-2 py-1.5 text-left hidden sm:table-cell">Description</th>
                    {regions.map(r => (
                      <th key={r} className="border px-2 py-1.5 text-center whitespace-nowrap">{r.replace('Reval ', 'R')}</th>
                    ))}
                    <th className="border px-2 py-1.5 text-center">Mean</th>
                    <th className="border px-2 py-1.5 text-center">COD</th>
                    <th className="border px-2 py-1.5 text-center">IAAO</th>
                  </tr>
                </thead>
                <tbody>
                  {result.typeMetrics.map(tm => (
                    <tr key={tm.buildingType} className="hover:bg-muted/20">
                      <td className="border px-2 py-1.5 font-mono font-semibold">{tm.buildingType}</td>
                      <td className="border px-2 py-1.5 hidden sm:table-cell text-muted-foreground">{tm.buildingTypeLabel}</td>
                      {tm.rates.map(r => (
                        <td key={r.region} className={`border px-2 py-1.5 text-center font-mono ${cellBg(r.devPct)}`}>
                          <div className="font-semibold">${r.rate.toFixed(2)}</div>
                          <div className="text-[10px] opacity-75">{r.devPct >= 0 ? '+' : ''}{r.devPct.toFixed(1)}%</div>
                        </td>
                      ))}
                      <td className="border px-2 py-1.5 text-center font-mono font-semibold">${tm.mean.toFixed(2)}</td>
                      <td className="border px-2 py-1.5 text-center font-mono">{tm.cod.toFixed(1)}%</td>
                      <td className="border px-2 py-1.5 text-center"><StatusBadge pass={tm.pass} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5. IAAO Equity Metrics Table */}
            <SectionLabel>IAAO Equity Metrics by Building Type (Sorted by COD ↓)</SectionLabel>
            <div className="text-xs text-muted-foreground mb-2">
              COD (Coefficient of Dispersion): IAAO standard — mean abs. deviation from median / median. Residential ≤15%, all others ≤20%.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="border px-2 py-1.5 text-left">Type</th>
                    <th className="border px-2 py-1.5 text-left">Cat.</th>
                    <th className="border px-2 py-1.5 text-left">Tier</th>
                    <th className="border px-2 py-1.5 text-center">Mean</th>
                    <th className="border px-2 py-1.5 text-center">Median</th>
                    <th className="border px-2 py-1.5 text-center">COD</th>
                    <th className="border px-2 py-1.5 text-center">COV</th>
                    <th className="border px-2 py-1.5 text-center">Min</th>
                    <th className="border px-2 py-1.5 text-center">Max</th>
                    <th className="border px-2 py-1.5 text-center">Spread</th>
                    <th className="border px-2 py-1.5 text-center">Threshold</th>
                    <th className="border px-2 py-1.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...result.typeMetrics].sort((a, b) => b.cod - a.cod).map(tm => (
                    <tr key={tm.buildingType} className={`hover:bg-muted/20 ${!tm.pass ? 'bg-red-50/40' : ''}`}>
                      <td className="border px-2 py-1.5 font-mono font-semibold">{tm.buildingType}</td>
                      <td className="border px-2 py-1.5 capitalize text-muted-foreground">{tm.category.slice(0, 4)}.</td>
                      <td className={`border px-2 py-1.5 font-medium ${tm.valueTier === 'Low' ? 'text-blue-700' : tm.valueTier === 'High' ? 'text-purple-700' : 'text-gray-500'}`}>{tm.valueTier}</td>
                      <td className="border px-2 py-1.5 text-center font-mono">${tm.mean.toFixed(2)}</td>
                      <td className="border px-2 py-1.5 text-center font-mono">${tm.median.toFixed(2)}</td>
                      <td className={`border px-2 py-1.5 text-center font-mono font-semibold ${tm.cod > tm.iaaoThreshold ? 'text-red-700' : tm.cod > tm.iaaoThreshold * 0.8 ? 'text-amber-700' : 'text-green-700'}`}>
                        {tm.cod.toFixed(1)}%
                      </td>
                      <td className="border px-2 py-1.5 text-center font-mono">{tm.cov.toFixed(1)}%</td>
                      <td className="border px-2 py-1.5 text-center font-mono">${tm.minRate.toFixed(2)}</td>
                      <td className="border px-2 py-1.5 text-center font-mono">${tm.maxRate.toFixed(2)}</td>
                      <td className="border px-2 py-1.5 text-center font-mono">{tm.spreadRatio.toFixed(2)}×</td>
                      <td className="border px-2 py-1.5 text-center text-muted-foreground">≤{tm.iaaoThreshold}%</td>
                      <td className="border px-2 py-1.5 text-center"><StatusBadge pass={tm.pass} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 6. Area Factor Analysis */}
            <SectionLabel>Reval Area Factor Analysis</SectionLabel>

            {result.uniformAreaFactors && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 mb-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-none text-blue-600" />
                  <div>
                    <span className="font-semibold">Uniform Multiplicative Factor Structure.</span>{' '}
                    All {result.typeMetrics.length} building types use identical area multipliers — the matrix is{' '}
                    <em>base_rate × area_factor</em>. This is the correct structure to prevent the Scale Effect:{' '}
                    a proportional multiplier, unlike a lump-sum dollar adjustment, applies the same percentage to every value tier.{' '}
                    Ensure secondary feature schedules follow the same %-of-base logic.
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="border px-2 py-1.5 text-left">Reval Area</th>
                    <th className="border px-2 py-1.5 text-left">Neighborhood</th>
                    <th className="border px-2 py-1.5 text-center">Mean Rate</th>
                    <th className="border px-2 py-1.5 text-center">Area Factor</th>
                    <th className="border px-2 py-1.5 text-center">vs. County</th>
                    <th className="border px-2 py-1.5 text-center">PRD</th>
                    <th className="border px-2 py-1.5 text-center">PRB</th>
                    <th className="border px-2 py-1.5 text-center">VEI</th>
                    <th className="border px-2 py-1.5 text-center">Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {result.areaMetrics.sort((a, b) => b.biasPct - a.biasPct).map(a => (
                    <tr key={a.region} className="hover:bg-muted/20">
                      <td className="border px-2 py-1.5 font-semibold">{a.region}</td>
                      <td className="border px-2 py-1.5 text-muted-foreground">{a.displayName}</td>
                      <td className="border px-2 py-1.5 text-center font-mono">${a.meanRate.toFixed(2)}</td>
                      <td className="border px-2 py-1.5 text-center font-mono font-semibold">{a.factor.toFixed(4)}</td>
                      <td className={`border px-2 py-1.5 text-center font-mono font-semibold ${a.biasPct > 0 ? 'text-amber-700' : a.biasPct < 0 ? 'text-blue-700' : 'text-green-700'}`}>
                        {a.biasPct >= 0 ? '+' : ''}{a.biasPct.toFixed(1)}%
                      </td>
                      <td className={`border px-2 py-1.5 text-center font-mono ${a.prd > 1.03 || a.prd < 0.98 ? 'text-red-700 font-semibold' : 'text-green-700'}`}>
                        {a.prd.toFixed(3)}
                      </td>
                      <td className={`border px-2 py-1.5 text-center font-mono ${Math.abs(a.prb) > 0.05 ? 'text-red-700 font-semibold' : 'text-green-700'}`}>
                        {a.prb.toFixed(4)}
                      </td>
                      <td className="border px-2 py-1.5 text-center"><VEIBadge signal={a.veiSignal} /></td>
                      <td className="border px-2 py-1.5 text-center">
                        {a.bias === 'High' ? (
                          <span className="inline-flex items-center gap-0.5 text-amber-700 font-medium text-xs"><TrendingUp className="h-3 w-3" /> High</span>
                        ) : a.bias === 'Low' ? (
                          <span className="inline-flex items-center gap-0.5 text-blue-700 font-medium text-xs"><TrendingDown className="h-3 w-3" /> Low</span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-green-700 font-medium text-xs"><Minus className="h-3 w-3" /> On-target</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 7. Outlier Register */}
            {result.outliers.length > 0 && (
              <>
                <SectionLabel>Cell-Level Outlier Register (&gt;2σ from Building Type Mean)</SectionLabel>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="border px-2 py-1.5 text-left">Type</th>
                        <th className="border px-2 py-1.5 text-left">Reval Area</th>
                        <th className="border px-2 py-1.5 text-center">Rate</th>
                        <th className="border px-2 py-1.5 text-center">Type Mean</th>
                        <th className="border px-2 py-1.5 text-center">Deviation</th>
                        <th className="border px-2 py-1.5 text-center">Sigmas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.outliers.sort((a, b) => b.devSigmas - a.devSigmas).map((o, i) => (
                        <tr key={i} className="bg-red-50/60">
                          <td className="border px-2 py-1.5 font-mono font-semibold">{o.buildingType} — {o.buildingTypeLabel}</td>
                          <td className="border px-2 py-1.5">{o.region} — {REVAL_NAMES[o.region]}</td>
                          <td className="border px-2 py-1.5 text-center font-mono font-semibold">${o.rate.toFixed(2)}</td>
                          <td className="border px-2 py-1.5 text-center font-mono">${o.typeMean.toFixed(2)}</td>
                          <td className="border px-2 py-1.5 text-center font-mono text-red-700 font-semibold">{o.devPct >= 0 ? '+' : ''}{o.devPct.toFixed(1)}%</td>
                          <td className="border px-2 py-1.5 text-center font-mono">{o.devSigmas.toFixed(2)}σ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* 8. Findings */}
            <SectionLabel>Findings</SectionLabel>
            <div className="space-y-1.5">
              {result.findings.map((f, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs rounded-md p-2.5 border ${
                  f.level === 'flag' ? 'bg-red-50 border-red-200' :
                  f.level === 'warn' ? 'bg-amber-50 border-amber-200' :
                  f.level === 'info' ? 'bg-blue-50 border-blue-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  {f.level === 'flag' ? <AlertTriangle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-none" /> :
                   f.level === 'warn' ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-none" /> :
                   f.level === 'info' ? <Info className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-none" /> :
                   <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-none" />}
                  <span className="leading-relaxed">{f.text}</span>
                </div>
              ))}
            </div>

            {/* 9. Staff Recommendations */}
            {result.recommendations.length > 0 && (
              <>
                <SectionLabel>Staff Recommendations</SectionLabel>
                <ul className="space-y-1.5 text-xs">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5 flex-none">{i + 1}.</span>
                      <span className="leading-relaxed text-muted-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

          </div>
        )}
      </CardContent>
    </Card>
  );
}
