import type { SalePoint } from '../types/geoforge.types';

export interface SaleInfluenceRow {
  saleId: string;
  parcelId: string;
  saleDate: string;
  salePrice: number;
  assessedValue: number;
  ratio: number;
  neighborhoodCode: string;
  isOutlier: boolean;
  qualDecision: string;
  // LOO influence
  looMedianRatio: number;    // median ratio of neighborhood without this sale
  looInfluence: number;      // delta = looMedian - fullMedian (positive = this sale pulls ratio up)
  isInfluential: boolean;    // |influence| > threshold
  // Status change
  looIaaoPass: boolean;      // would neighborhood pass IAAO without this sale?
  currentIaaoPass: boolean;
  changesCompliance: boolean; // removing this sale changes pass/fail status
}

export interface InfluenceResult {
  neighborhoodCode: string;
  fullMedianRatio: number;
  fullN: number;
  rows: SaleInfluenceRow[];
  influentialCount: number;
  complianceChangerCount: number;
}

function sampleMedian(ratios: number[]): number {
  if (ratios.length === 0) return 0;
  const s = [...ratios].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function iaaoPass(medRatio: number, cod: number): boolean {
  return medRatio >= 0.90 && medRatio <= 1.10 && cod <= 20;
}

function computeCod(ratios: number[], med: number): number {
  if (ratios.length === 0 || med === 0) return 0;
  return (ratios.reduce((s, r) => s + Math.abs(r - med), 0) / ratios.length / med) * 100;
}

export function computeSaleInfluence(
  sales: SalePoint[],
  neighborhoodCode: string,
  influenceThreshold = 0.005,
): InfluenceResult | null {
  const hood = sales.filter(
    (s) => s.neighborhoodCode === neighborhoodCode && s.ratio > 0
  );
  if (hood.length < 3) return null;

  const qualRatios = hood.filter((s) => !s.isOutlier).map((s) => s.ratio);
  const fullMedian = sampleMedian(qualRatios);
  const fullCod = computeCod(qualRatios, fullMedian);
  const currentIaaoPass = iaaoPass(fullMedian, fullCod);

  const rows: SaleInfluenceRow[] = hood.map((s) => {
    let looRatios: number[];
    if (s.isOutlier) {
      // If currently excluded: what if it were included?
      looRatios = [...qualRatios, s.ratio];
    } else {
      // If currently included: what without it?
      looRatios = qualRatios.filter((r) => r !== s.ratio);
    }

    const looMedian = sampleMedian(looRatios);
    const looInfluence = s.isOutlier
      ? looMedian - fullMedian                    // adding this sale moves ratio by...
      : fullMedian - looMedian;                   // removing this sale moves ratio by...
    const looCod = computeCod(looRatios, looMedian);
    const looPass = iaaoPass(looMedian, looCod);

    return {
      saleId: s.saleId,
      parcelId: s.parcelId,
      saleDate: s.saleDate,
      salePrice: s.salePrice,
      assessedValue: s.assessedValue,
      ratio: s.ratio,
      neighborhoodCode,
      isOutlier: s.isOutlier,
      qualDecision: s.qualificationDecision,
      looMedianRatio: looMedian,
      looInfluence,
      isInfluential: Math.abs(looInfluence) >= influenceThreshold,
      looIaaoPass: looPass,
      currentIaaoPass,
      changesCompliance: looPass !== currentIaaoPass,
    };
  });

  // Sort: compliance-changers first, then most influential
  rows.sort((a, b) => {
    if (a.changesCompliance !== b.changesCompliance) return a.changesCompliance ? -1 : 1;
    return Math.abs(b.looInfluence) - Math.abs(a.looInfluence);
  });

  return {
    neighborhoodCode,
    fullMedianRatio: fullMedian,
    fullN: qualRatios.length,
    rows,
    influentialCount: rows.filter((r) => r.isInfluential).length,
    complianceChangerCount: rows.filter((r) => r.changesCompliance).length,
  };
}
