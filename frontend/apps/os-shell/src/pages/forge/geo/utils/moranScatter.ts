import { haversineDistanceMi } from './geoMath';
import type { NeighborhoodStat } from '../types/geoforge.types';

export type LisaQuadrant = 'HH' | 'LL' | 'HL' | 'LH' | 'ns';

export interface MoranPoint {
  neighborhoodCode: string;
  neighborhoodName: string;
  ratio: number;
  z: number;          // standardized deviation from mean
  lag: number;        // spatial lag of z (mean neighbor z)
  Ii: number;         // local Moran's I
  quadrant: LisaQuadrant;
  significant: boolean;
  color: string;
}

const QUAD_COLORS: Record<LisaQuadrant, string> = {
  HH: '#dc2626',
  LL: '#1d4ed8',
  HL: '#f97316',
  LH: '#60a5fa',
  ns: '#334155',
};

export const QUAD_META: { q: LisaQuadrant; color: string; label: string; sub: string }[] = [
  { q: 'HH', color: QUAD_COLORS.HH, label: 'High-High', sub: 'Over-assessed cluster' },
  { q: 'LL', color: QUAD_COLORS.LL, label: 'Low-Low',   sub: 'Under-assessed cluster' },
  { q: 'HL', color: QUAD_COLORS.HL, label: 'High-Low',  sub: 'Over-assessed spatial outlier' },
  { q: 'LH', color: QUAD_COLORS.LH, label: 'Low-High',  sub: 'Under-assessed spatial outlier' },
  { q: 'ns', color: QUAD_COLORS.ns, label: 'Not sig.',   sub: 'No local spatial pattern' },
];

export function computeMoranScatter(
  stats: NeighborhoodStat[],
  maxDistMi = 5.0,
): MoranPoint[] {
  const eligible = stats.filter(
    (ns) => ns.centroidLat !== 0 && ns.centroidLng !== 0 && ns.saleCount >= 3,
  );
  const n = eligible.length;
  if (n < 5) return [];

  const ratios = eligible.map((ns) => ns.stats.medianRatio);
  const mean = ratios.reduce((s, r) => s + r, 0) / n;
  const z = ratios.map((r) => r - mean);
  const sumZ2 = z.reduce((s, zi) => s + zi * zi, 0);
  if (sumZ2 === 0) return [];
  const S2 = sumZ2 / n;

  // Spatial lag per neighborhood
  const lags = eligible.map((ns, i) => {
    let lagSum = 0, cnt = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = haversineDistanceMi(ns.centroidLat, ns.centroidLng, eligible[j].centroidLat, eligible[j].centroidLng);
      if (d <= maxDistMi) { lagSum += z[j]; cnt++; }
    }
    return cnt > 0 ? lagSum / cnt : 0;
  });

  const Iis = eligible.map((_, i) => (z[i] / S2) * lags[i]);
  const meanI = Iis.reduce((s, v) => s + v, 0) / n;
  const stdI = Math.sqrt(Iis.reduce((s, v) => s + (v - meanI) ** 2, 0) / n) || 1;

  return eligible.map((ns, i) => {
    const ziStd = (Iis[i] - meanI) / stdI;
    const significant = Math.abs(ziStd) > 1.0;

    let quadrant: LisaQuadrant;
    if (!significant)               quadrant = 'ns';
    else if (z[i] > 0 && lags[i] > 0) quadrant = 'HH';
    else if (z[i] < 0 && lags[i] < 0) quadrant = 'LL';
    else if (z[i] > 0 && lags[i] < 0) quadrant = 'HL';
    else                            quadrant = 'LH';

    return {
      neighborhoodCode: ns.neighborhoodCode,
      neighborhoodName: ns.neighborhoodName,
      ratio: ns.stats.medianRatio,
      z: z[i],
      lag: lags[i],
      Ii: Iis[i],
      quadrant,
      significant,
      color: QUAD_COLORS[quadrant],
    };
  });
}
