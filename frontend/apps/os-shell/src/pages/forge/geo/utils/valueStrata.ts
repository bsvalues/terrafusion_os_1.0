import type { SalePoint } from '../types/geoforge.types';

export interface StrataDecile {
  label: string;
  lo: number;
  hi: number;
  n: number;
  medianRatio: number;
  meanRatio: number;
  cod: number | null;
  q1: number | null;
  q3: number | null;
}

export interface ValueStrataResult {
  deciles: StrataDecile[];
  prbSlope: number | null;   // regression of ratio on log(SP): slope as % per 10% SP increase
  prbR2: number | null;
  prbIntercept: number | null;
  verticalBias: 'regressive' | 'progressive' | 'uniform' | 'insufficient';
  totalN: number;
}

function sampleMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function olsSlope(xs: number[], ys: number[]): { slope: number; intercept: number; r2: number } | null {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let ssxy = 0, ssxx = 0, ssyy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    ssxy += dx * dy;
    ssxx += dx * dx;
    ssyy += dy * dy;
  }
  if (ssxx === 0) return null;
  const slope = ssxy / ssxx;
  const intercept = my - slope * mx;
  const r2 = ssxx * ssyy > 0 ? (ssxy * ssxy) / (ssxx * ssyy) : 0;
  return { slope, intercept, r2 };
}

export function computeValueStrata(
  sales: SalePoint[],
  decileCount: 5 | 10 | 20 = 10,
): ValueStrataResult {
  const qualified = sales.filter(
    (s) => !s.isOutlier && s.ratio > 0 && s.salePrice > 0
  );

  if (qualified.length < decileCount) {
    return { deciles: [], prbSlope: null, prbR2: null, prbIntercept: null, verticalBias: 'insufficient', totalN: qualified.length };
  }

  // Sort by sale price, split into equal-count deciles
  const sorted = [...qualified].sort((a, b) => a.salePrice - b.salePrice);
  const chunkSize = sorted.length / decileCount;

  const deciles: StrataDecile[] = [];
  for (let i = 0; i < decileCount; i++) {
    const from = Math.floor(i * chunkSize);
    const to = Math.floor((i + 1) * chunkSize);
    const chunk = sorted.slice(from, Math.min(to, sorted.length));
    if (chunk.length === 0) continue;

    const ratios = chunk.map((s) => s.ratio);
    const lo = chunk[0].salePrice;
    const hi = chunk[chunk.length - 1].salePrice;
    const medRatio = sampleMedian(ratios);
    const meanRatio = ratios.reduce((s, r) => s + r, 0) / ratios.length;

    let cod: number | null = null;
    if (ratios.length >= 3) {
      cod = (ratios.reduce((s, r) => s + Math.abs(r - medRatio), 0) / ratios.length / medRatio) * 100;
    }

    const sortedR = [...ratios].sort((a, b) => a - b);
    const q1 = sortedR.length >= 4 ? sortedR[Math.floor(sortedR.length * 0.25)] : null;
    const q3 = sortedR.length >= 4 ? sortedR[Math.floor(sortedR.length * 0.75)] : null;

    const fmtK = (v: number) =>
      v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}K`;

    deciles.push({
      label: i === 0
        ? `<$${fmtK(hi)}`
        : i === decileCount - 1
          ? `>$${fmtK(lo)}`
          : `$${fmtK(lo)}`,
      lo, hi, n: chunk.length, medianRatio: medRatio, meanRatio, cod, q1, q3,
    });
  }

  // PRB: regress ratio on log(SP) — positive slope = progressive, negative = regressive
  const logSPs = qualified.map((s) => Math.log(s.salePrice));
  const ratios = qualified.map((s) => s.ratio);
  const ols = olsSlope(logSPs, ratios);

  let prbSlope: number | null = null;
  let prbR2: number | null = null;
  let prbIntercept: number | null = null;

  if (ols) {
    // slope is per unit of ln(SP); express as change per 10% SP increase = slope * ln(1.1) * 100
    prbSlope = ols.slope * Math.log(1.1) * 100;
    prbR2 = ols.r2;
    prbIntercept = ols.intercept;
  }

  const verticalBias: ValueStrataResult['verticalBias'] =
    prbSlope === null ? 'insufficient' :
    prbSlope < -0.5 ? 'regressive' :
    prbSlope > 0.5 ? 'progressive' :
    'uniform';

  return { deciles, prbSlope, prbR2, prbIntercept, verticalBias, totalN: qualified.length };
}
