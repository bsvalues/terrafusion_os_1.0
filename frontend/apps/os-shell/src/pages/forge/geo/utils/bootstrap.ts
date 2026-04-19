export interface BootstrapCIResult {
  median: number;
  lo: number;
  hi: number;
  n: number;
  // Compliance interpretation
  definitelyCompliant: boolean;     // hi < 1.10 && lo > 0.90
  definitelyNonCompliant: boolean;  // hi < 0.90 || lo > 1.10
  uncertain: boolean;               // CI straddles an IAAO boundary
}

function sampleMedian(arr: number[], indices: Uint32Array): number {
  const sub = Array.from(indices).map((i) => arr[i]);
  sub.sort((a, b) => a - b);
  const m = sub.length >> 1;
  return sub.length % 2 === 1 ? sub[m] : (sub[m - 1] + sub[m]) / 2;
}

/**
 * Percentile bootstrap CI on median ratio.
 * Iterations capped at 999 to stay sub-10ms for n ≤ 50.
 */
export function bootstrapMedianCI(
  ratios: number[],
  iterations = 599,
  alpha = 0.05,
): BootstrapCIResult | null {
  const n = ratios.length;
  if (n < 3) return null;

  const sorted = [...ratios].sort((a, b) => a - b);
  const observed =
    sorted.length % 2 === 1
      ? sorted[sorted.length >> 1]
      : (sorted[(sorted.length >> 1) - 1] + sorted[sorted.length >> 1]) / 2;

  const medians: number[] = new Array(iterations);
  const indices = new Uint32Array(n);
  for (let b = 0; b < iterations; b++) {
    for (let i = 0; i < n; i++) indices[i] = Math.floor(Math.random() * n);
    medians[b] = sampleMedian(ratios, indices);
  }
  medians.sort((a, b) => a - b);

  const loIdx = Math.floor((alpha / 2) * iterations);
  const hiIdx = Math.ceil((1 - alpha / 2) * iterations) - 1;

  const lo = medians[Math.max(0, loIdx)];
  const hi = medians[Math.min(iterations - 1, hiIdx)];

  const definitelyCompliant = lo >= 0.90 && hi <= 1.10;
  const definitelyNonCompliant = hi < 0.90 || lo > 1.10;
  const uncertain = !definitelyCompliant && !definitelyNonCompliant;

  return { median: observed, lo, hi, n, definitelyCompliant, definitelyNonCompliant, uncertain };
}
