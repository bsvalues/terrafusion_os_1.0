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

// ─── Local Moran's I (LISA) ────────────────────────────────────────────────

export interface LISAResult {
  neighborhoodCode: string;
  /** Moran scatterplot quadrant based on z[i] and spatial lag signs */
  quadrant: 'HH' | 'LL' | 'HL' | 'LH' | 'ns';
  Ii: number;
  color: string;
}

const LISA_COLORS: Record<LISAResult['quadrant'], string> = {
  HH: '#dc2626',  // red — over-assessed cluster
  LL: '#1d4ed8',  // deep blue — under-assessed cluster
  HL: '#f97316',  // orange — over-assessed island
  LH: '#60a5fa',  // light blue — under-assessed island
  ns: '#334155',  // slate — not significant
};

export const LISA_LEGEND: { quadrant: LISAResult['quadrant']; color: string; label: string; sub: string }[] = [
  { quadrant: 'HH', color: LISA_COLORS.HH, label: 'High-High', sub: 'Over-assessed cluster' },
  { quadrant: 'LL', color: LISA_COLORS.LL, label: 'Low-Low',  sub: 'Under-assessed cluster' },
  { quadrant: 'HL', color: LISA_COLORS.HL, label: 'High-Low', sub: 'Over-assessed island' },
  { quadrant: 'LH', color: LISA_COLORS.LH, label: 'Low-High', sub: 'Under-assessed island' },
  { quadrant: 'ns', color: LISA_COLORS.ns, label: 'Not significant', sub: '' },
];

/**
 * Computes LISA (Local Indicators of Spatial Association) for each neighborhood.
 * Uses row-normalized binary contiguity weights. Quadrant based on z[i] and spatial lag:
 *   HH = high ratio + high-ratio neighbors (over-assessed cluster)
 *   LL = low ratio + low-ratio neighbors (under-assessed cluster)
 *   HL = high ratio + low-ratio neighbors (isolated over-assessment)
 *   LH = low ratio + high-ratio neighbors (isolated under-assessment)
 * Significance threshold: |standardized Ii| > 1.0 (≈ p < 0.32 — suitable for county-level data).
 */
export function computeLISA(
  stats: NeighborhoodStat[],
  maxDistMi = 5.0,
): LISAResult[] {
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

  // Compute spatial lag and local Ii for each neighborhood
  const localData = eligible.map((ns, i) => {
    let lagSum = 0;
    let cnt = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const d = haversineDistanceMi(
        ns.centroidLat, ns.centroidLng,
        eligible[j].centroidLat, eligible[j].centroidLng,
      );
      if (d <= maxDistMi) { lagSum += z[j]; cnt++; }
    }
    const lag = cnt > 0 ? lagSum / cnt : 0;
    return { lag, Ii: (z[i] / S2) * lag };
  });

  const allIi = localData.map((d) => d.Ii);
  const meanI = allIi.reduce((s, v) => s + v, 0) / n;
  const stdI = Math.sqrt(allIi.reduce((s, v) => s + (v - meanI) ** 2, 0) / n) || 1;

  return eligible.map((ns, i) => {
    const { lag, Ii } = localData[i];
    const ziStd = (Ii - meanI) / stdI;
    const significant = Math.abs(ziStd) > 1.0;

    let quadrant: LISAResult['quadrant'];
    if (!significant) {
      quadrant = 'ns';
    } else if (z[i] > 0 && lag > 0) {
      quadrant = 'HH';
    } else if (z[i] < 0 && lag < 0) {
      quadrant = 'LL';
    } else if (z[i] > 0 && lag < 0) {
      quadrant = 'HL';
    } else {
      quadrant = 'LH';
    }

    return { neighborhoodCode: ns.neighborhoodCode, quadrant, Ii, color: LISA_COLORS[quadrant] };
  });
}
