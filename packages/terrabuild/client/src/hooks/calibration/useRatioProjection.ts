import { useMemo } from "react";

export interface ParcelSale {
  id: number;
  salePrice: number;
  assessedValue: number;
  ratio: number;
  valueQuintile: number;
  ageBand: number;
}

export interface RatioProjection {
  prd: number;
  prb: number;
  cod: number;
  medianRatio: number;
  saleCount: number;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function computePrd(sales: { av: number; sp: number }[]): number {
  if (!sales.length) return 1;
  const meanRatio = sales.reduce((s, x) => s + x.av / x.sp, 0) / sales.length;
  const sumAv = sales.reduce((s, x) => s + x.av, 0);
  const sumSp = sales.reduce((s, x) => s + x.sp, 0);
  const weightedMean = sumSp === 0 ? 1 : sumAv / sumSp;
  return weightedMean === 0 ? 1 : meanRatio / weightedMean;
}

function computePrb(sales: { sp: number; ratio: number }[]): number {
  const valid = sales.filter((x) => x.sp > 0);
  if (valid.length < 2) return 0;
  const xs = valid.map((x) => Math.log(x.sp));
  const ys = valid.map((x) => x.ratio - 1);
  const xMean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const cov = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0);
  const varX = xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
  return varX === 0 ? 0 : cov / varX;
}

function computeCod(ratios: number[]): number {
  if (!ratios.length) return 0;
  const med = median(ratios);
  if (med === 0) return 0;
  const mad = ratios.reduce((s, r) => s + Math.abs(r - med), 0) / ratios.length;
  return (mad / med) * 100;
}

/**
 * Given raw sale records, an adjustment %, and a set of excluded IDs,
 * returns current and projected PRD/PRB/COD/median.
 * All computation is client-side and synchronous — called with useMemo.
 */
export function useRatioProjection(
  sales: ParcelSale[],
  adjustmentPct: number,
  excludedSaleIds: number[]
): { current: RatioProjection; projected: RatioProjection } {
  return useMemo(() => {
    const active = sales.filter((s) => !excludedSaleIds.includes(s.id));

    const currentRatios = active.map((s) => s.ratio);
    const current: RatioProjection = {
      prd: computePrd(active.map((s) => ({ av: s.assessedValue, sp: s.salePrice }))),
      prb: computePrb(active.map((s) => ({ sp: s.salePrice, ratio: s.ratio }))),
      cod: computeCod(currentRatios),
      medianRatio: median(currentRatios),
      saleCount: active.length,
    };

    const factor = 1 + adjustmentPct / 100;
    const projectedSales = active.map((s) => ({
      av: s.assessedValue * factor,
      sp: s.salePrice,
      ratio: (s.assessedValue * factor) / s.salePrice,
    }));
    const projRatios = projectedSales.map((s) => s.ratio);
    const projected: RatioProjection = {
      prd: computePrd(projectedSales),
      prb: computePrb(projectedSales.map((s) => ({ sp: s.sp, ratio: s.ratio }))),
      cod: computeCod(projRatios),
      medianRatio: median(projRatios),
      saleCount: active.length,
    };

    return { current, projected };
  }, [sales, adjustmentPct, excludedSaleIds]);
}
