import type { NeighborhoodStat } from '../types/geoforge.types';

export interface ClusterProfile {
  id: number;
  color: string;
  label: string;
  action: string;
  centroid: { ratio: number; cod: number; prd: number };
  members: NeighborhoodStat[];
  iaaoPassRate: number;
}

export interface ClusterResult {
  clusters: ClusterProfile[];
  assignments: Map<string, number>; // neighborhoodCode → clusterId
}

const CLUSTER_COLORS = ['#4ade80', '#fbbf24', '#f87171'];

function dist(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function iaaoPass(ns: NeighborhoodStat): boolean {
  const { medianRatio, cod, prd } = ns.stats;
  return medianRatio >= 0.90 && medianRatio <= 1.10 && cod <= 20 && prd >= 0.98 && prd <= 1.03;
}

// Normalize to [0,1] range for equal-weight clustering
function normalize(
  stats: NeighborhoodStat[],
): { ns: NeighborhoodStat; vec: [number, number, number] }[] {
  const ratios = stats.map((s) => s.stats.medianRatio);
  const cods = stats.map((s) => s.stats.cod);
  const prds = stats.map((s) => s.stats.prd);

  const rMin = Math.min(...ratios), rMax = Math.max(...ratios);
  const cMin = Math.min(...cods), cMax = Math.max(...cods);
  const pMin = Math.min(...prds), pMax = Math.max(...prds);

  const norm = (v: number, lo: number, hi: number) =>
    hi > lo ? (v - lo) / (hi - lo) : 0;

  return stats.map((ns) => ({
    ns,
    vec: [
      norm(ns.stats.medianRatio, rMin, rMax),
      norm(ns.stats.cod, cMin, cMax),
      norm(ns.stats.prd, pMin, pMax),
    ],
  }));
}

export function kMeansCluster(
  stats: NeighborhoodStat[],
  k = 3,
  maxIter = 50,
): ClusterResult | null {
  if (stats.length < k) return null;

  const points = normalize(stats);

  // Init: pick k seeds evenly spaced after sorting by deviation from parity
  const sorted = [...points].sort(
    (a, b) => Math.abs(a.ns.stats.medianRatio - 1) - Math.abs(b.ns.stats.medianRatio - 1)
  );
  const step = Math.floor(sorted.length / k);
  let centroids: [number, number, number][] = Array.from(
    { length: k }, (_, i) => [...sorted[Math.min(i * step, sorted.length - 1)].vec] as [number, number, number]
  );

  let assignments = new Array(points.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign
    const next = points.map((p) => {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = dist(p.vec, centroids[c]);
        if (d < bestD) { bestD = d; best = c; }
      }
      return best;
    });

    // Converged?
    if (next.every((a, i) => a === assignments[i])) break;
    assignments = next;

    // Update centroids
    for (let c = 0; c < k; c++) {
      const members = points.filter((_, i) => assignments[i] === c);
      if (members.length === 0) continue;
      centroids[c] = [
        mean(members.map((m) => m.vec[0])),
        mean(members.map((m) => m.vec[1])),
        mean(members.map((m) => m.vec[2])),
      ];
    }
  }

  // Build cluster profiles
  // Sort clusters by average deviation from parity (cluster 0 = best, k-1 = worst)
  const clusterMembers: NeighborhoodStat[][] = Array.from({ length: k }, () => []);
  points.forEach((p, i) => clusterMembers[assignments[i]].push(p.ns));

  const clusterOrder = Array.from({ length: k }, (_, i) => i).sort((a, b) => {
    const avgDevA = mean(clusterMembers[a].map((ns) => Math.abs(ns.stats.medianRatio - 1)));
    const avgDevB = mean(clusterMembers[b].map((ns) => Math.abs(ns.stats.medianRatio - 1)));
    return avgDevA - avgDevB;
  });

  const assignMap = new Map<string, number>();
  const clusterLabels = [
    { label: 'Compliant', action: 'Monitor — no immediate action required' },
    { label: 'At-Risk', action: 'Review outliers and apply targeted adjustments' },
    { label: 'Critical', action: 'Mass appraisal adjustment required before DOR certification' },
  ];

  const clusters: ClusterProfile[] = clusterOrder.map((origId, rank) => {
    const members = clusterMembers[origId];
    members.forEach((ns) => assignMap.set(ns.neighborhoodCode, rank));
    const passRate = members.length > 0
      ? members.filter(iaaoPass).length / members.length : 0;
    return {
      id: rank,
      color: CLUSTER_COLORS[rank],
      label: clusterLabels[rank]?.label ?? `Cluster ${rank}`,
      action: clusterLabels[rank]?.action ?? '',
      centroid: {
        ratio: mean(members.map((m) => m.stats.medianRatio)),
        cod: mean(members.map((m) => m.stats.cod)),
        prd: mean(members.map((m) => m.stats.prd)),
      },
      members,
      iaaoPassRate: passRate,
    };
  });

  return { clusters, assignments: assignMap };
}
