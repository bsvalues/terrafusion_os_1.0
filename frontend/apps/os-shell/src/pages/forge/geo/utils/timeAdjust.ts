import type { SalePoint } from '../types/geoforge.types';

export interface TimeAdjustResult {
  monthlyRatePct: number; // % per month (e.g. 0.5 = 0.5%/mo)
  rSquared: number | null;
  sampleN: number;
}

export interface AdjustedNeighborhoodStat {
  neighborhoodCode: string;
  neighborhoodName: string;
  originalMedianRatio: number;
  adjustedMedianRatio: number;
  cod: number;
  saleCount: number;
  gainsParity: boolean; // was failing, now passing after adjustment
  lossesParity: boolean; // was passing, now failing after adjustment
}

// Least-squares regression: ratio ~ months_since_study_end
// A positive slope means ratios RISE as sales age — under-assessment trend in market
// We derive rate = -slope (older sales should be adjusted UP if market rising)
export function deriveMonthlyRate(
  sales: SalePoint[],
  studyEndDate: string,
): TimeAdjustResult {
  const endMs = new Date(studyEndDate).getTime();
  const qualified = sales.filter((s) => !s.isOutlier && s.ratio != null && s.saleDate);

  if (qualified.length < 10) {
    return { monthlyRatePct: 0, rSquared: null, sampleN: qualified.length };
  }

  // X = months before study end, Y = ratio
  const pairs = qualified.map((s) => {
    const saleMs = new Date(s.saleDate).getTime();
    const monthsBefore = (endMs - saleMs) / (1000 * 60 * 60 * 24 * 30.44);
    return { x: monthsBefore, y: s.ratio };
  });

  const n = pairs.length;
  const meanX = pairs.reduce((s, p) => s + p.x, 0) / n;
  const meanY = pairs.reduce((s, p) => s + p.y, 0) / n;

  let ssXX = 0, ssXY = 0, ssYY = 0;
  for (const p of pairs) {
    ssXX += (p.x - meanX) ** 2;
    ssXY += (p.x - meanX) * (p.y - meanY);
    ssYY += (p.y - meanY) ** 2;
  }

  if (ssXX === 0) return { monthlyRatePct: 0, rSquared: 0, sampleN: n };

  const slope = ssXY / ssXX;
  const rSquared = ssXX > 0 && ssYY > 0 ? (ssXY ** 2) / (ssXX * ssYY) : 0;

  // slope > 0 means older sales have higher ratios → market rising → rate = +slope * 100
  // (each month further back, ratio is higher by |slope|, so AV is relatively lower vs market)
  const monthlyRatePct = slope * 100;

  return { monthlyRatePct, rSquared, sampleN: n };
}

function medianOf(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

function codOf(ratios: number[]): number {
  if (ratios.length < 2) return 0;
  const med = medianOf(ratios);
  if (med === 0) return 0;
  const aad = ratios.reduce((s, r) => s + Math.abs(r - med), 0) / ratios.length;
  return (aad / med) * 100;
}

function iaaoPass(r: number, cod: number, prd: number): boolean {
  return r >= 0.90 && r <= 1.10 && cod <= 20 && prd >= 0.98 && prd <= 1.03;
}

export function computeAdjustedStats(
  sales: SalePoint[],
  neighborhoodStats: { neighborhoodCode: string; neighborhoodName: string; stats: { medianRatio: number; cod: number; prd: number } }[],
  monthlyRatePct: number,
  studyEndDate: string,
): AdjustedNeighborhoodStat[] {
  const endMs = new Date(studyEndDate).getTime();
  const rate = monthlyRatePct / 100;

  // Build per-neighborhood adjusted ratio lists
  const nbhdMap = new Map<string, number[]>();
  for (const s of sales) {
    if (s.isOutlier || !s.ratio || !s.saleDate) continue;
    const monthsBefore = (endMs - new Date(s.saleDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    const adjFactor = 1 + rate * monthsBefore;
    const adjRatio = s.ratio / adjFactor; // adjust sale price UP → ratio falls proportionally
    const list = nbhdMap.get(s.neighborhoodCode) ?? [];
    list.push(adjRatio);
    nbhdMap.set(s.neighborhoodCode, list);
  }

  return neighborhoodStats
    .map((ns) => {
      const adjRatios = nbhdMap.get(ns.neighborhoodCode) ?? [];
      if (adjRatios.length < 3) return null;

      const adjMed = medianOf(adjRatios);
      const adjCod = codOf(adjRatios);
      const origPass = iaaoPass(ns.stats.medianRatio, ns.stats.cod, ns.stats.prd);
      const adjPass = adjMed >= 0.90 && adjMed <= 1.10 && adjCod <= 20;

      return {
        neighborhoodCode: ns.neighborhoodCode,
        neighborhoodName: ns.neighborhoodName,
        originalMedianRatio: ns.stats.medianRatio,
        adjustedMedianRatio: adjMed,
        cod: adjCod,
        saleCount: adjRatios.length,
        gainsParity: !origPass && adjPass,
        lossesParity: origPass && !adjPass,
      };
    })
    .filter((x): x is AdjustedNeighborhoodStat => x !== null)
    .sort((a, b) => Math.abs(b.adjustedMedianRatio - 1) - Math.abs(a.adjustedMedianRatio - 1));
}
