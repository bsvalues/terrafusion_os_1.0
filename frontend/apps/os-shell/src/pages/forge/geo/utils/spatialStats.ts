import { haversineDistanceMi } from './geoMath';
import type { NeighborhoodStat } from '../types/geoforge.types';

export interface MoransIResult {
  I: number;
  n: number;
  interpretation: 'strong-clustering' | 'moderate-clustering' | 'random' | 'dispersed';
  label: string;
  color: string;
  warning: boolean;
}

/**
 * Computes Moran's I global spatial autocorrelation for neighborhood median ratios.
 * Uses binary contiguity (within maxDistMi) with row normalization.
 * I > 0 = clustering (similar ratios near each other); I < 0 = dispersion.
 * IAAO significance: I > 0.30 indicates geographic assessment bias warranting DOR review.
 */
export function computeMoransI(
  stats: NeighborhoodStat[],
  maxDistMi = 5.0,
): MoransIResult | null {
  const eligible = stats.filter(
    (ns) => ns.centroidLat !== 0 && ns.centroidLng !== 0 && ns.saleCount >= 3,
  );
  const n = eligible.length;
  if (n < 5) return null;

  const ratios = eligible.map((ns) => ns.stats.medianRatio);
  const mean = ratios.reduce((s, r) => s + r, 0) / n;
  const z = ratios.map((r) => r - mean);
  const sumZ2 = z.reduce((s, zi) => s + zi * zi, 0);
  if (sumZ2 === 0) return null;

  let numerator = 0;

  for (let i = 0; i < n; i++) {
    const neighbors: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = haversineDistanceMi(
        eligible[i].centroidLat, eligible[i].centroidLng,
        eligible[j].centroidLat, eligible[j].centroidLng,
      );
      if (d <= maxDistMi) neighbors.push(j);
    }
    if (neighbors.length === 0) continue;
    const w = 1 / neighbors.length;
    for (const j of neighbors) {
      numerator += w * z[i] * z[j];
    }
  }

  const I = numerator / sumZ2;

  let interpretation: MoransIResult['interpretation'];
  let label: string;
  let color: string;
  let warning: boolean;

  if (I > 0.45) {
    interpretation = 'strong-clustering';
    label = 'Strong geographic clustering';
    color = '#ef4444';
    warning = true;
  } else if (I > 0.20) {
    interpretation = 'moderate-clustering';
    label = 'Moderate spatial pattern';
    color = '#f97316';
    warning = false;
  } else if (I < -0.20) {
    interpretation = 'dispersed';
    label = 'Spatially dispersed';
    color = '#60a5fa';
    warning = false;
  } else {
    interpretation = 'random';
    label = 'No spatial pattern';
    color = '#4ade80';
    warning = false;
  }

  return { I, n, interpretation, label, color, warning };
}
