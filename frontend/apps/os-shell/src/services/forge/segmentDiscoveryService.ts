/**
 * TFR-045 -- Segment Discovery Service
 *
 * Derives stratification segments from regression output.
 *   - Factor importance ranking (by |t-stat|)
 *   - Breakpoint suggestions for variable stratification
 *   - Data-quality / completeness coverage reporting
 *
 * Regression models in scope: OLS, GWR, quantile, spatial lag/error.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FactorImportance {
  variable: string;
  coefficient: number;
  tStat: number;
  pValue: number;
  importance: 'high' | 'medium' | 'low';
}

export interface SuggestedSegment {
  variable: string;
  breakpoints: number[];
  segmentCount: number;
  rationale: string;
}

export interface DataCoverage {
  variable: string;
  totalRecords: number;
  nonNullCount: number;
  /** 0-1 fraction */
  completeness: number;
}

export interface SegmentDiscoveryResult {
  factorImportance: FactorImportance[];
  suggestedSegments: SuggestedSegment[];
  dataCoverage: DataCoverage[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const API_BASE = '/api/v1/regression';

async function apiFetch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Regression API ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

function classifyImportance(absTStat: number): 'high' | 'medium' | 'low' {
  if (absTStat >= 3.0) return 'high';
  if (absTStat >= 1.96) return 'medium';
  return 'low';
}

/**
 * Jenks-style natural-breaks heuristic.
 *
 * Given sorted coefficient magnitudes for a single variable across
 * sub-models (e.g. GWR local coefficients), find the k-1 largest
 * adjacent gaps to produce k segments.
 */
function naturalBreaks(values: number[], k: number): number[] {
  if (values.length <= k) return [];
  const sorted = [...values].sort((a, b) => a - b);

  const gaps: { idx: number; gap: number }[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push({ idx: i, gap: sorted[i] - sorted[i - 1] });
  }
  gaps.sort((a, b) => b.gap - a.gap);

  const breakIndices = gaps
    .slice(0, k - 1)
    .map((g) => g.idx)
    .sort((a, b) => a - b);

  return breakIndices.map((idx) => {
    // Breakpoint = midpoint between the two values straddling the gap
    return (sorted[idx - 1] + sorted[idx]) / 2;
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Rank regression coefficients by absolute t-statistic to identify the
 * most influential variables.
 *
 * @param modelId  Identifier for a completed regression run (OLS / GWR /
 *                 quantile / spatial lag / spatial error).
 */
export async function analyzeFactors(modelId: string): Promise<FactorImportance[]> {
  interface CoefficientRow {
    variable: string;
    coefficient: number;
    tStat: number;
    pValue: number;
  }

  const rows = await apiFetch<CoefficientRow[]>(`/models/${modelId}/coefficients`);

  const ranked: FactorImportance[] = rows
    .map((r) => ({
      variable: r.variable,
      coefficient: r.coefficient,
      tStat: r.tStat,
      pValue: r.pValue,
      importance: classifyImportance(Math.abs(r.tStat)),
    }))
    .sort((a, b) => Math.abs(b.tStat) - Math.abs(a.tStat));

  return ranked;
}

/**
 * Suggest breakpoints for stratifying a continuous variable into segments.
 *
 * When local coefficients are available (GWR, spatial error) the service
 * examines how the coefficient varies across observations and picks natural
 * break points.  For global models (OLS, quantile) the service falls back
 * to the raw variable distribution from the regression dataset.
 *
 * @param modelId   Regression model identifier.
 * @param variable  Variable name to segment on (e.g. "building_area").
 * @param maxSegments  Maximum number of segments to propose (default 4).
 */
export async function suggestSegments(
  modelId: string,
  variable: string,
  maxSegments = 4,
): Promise<SuggestedSegment[]> {
  interface LocalCoefficients {
    variable: string;
    values: number[];
  }

  // Try local coefficients first (GWR / spatial models)
  let values: number[];
  let source: 'local_coefficients' | 'raw_distribution';

  try {
    const local = await apiFetch<LocalCoefficients>(
      `/models/${modelId}/local-coefficients/${encodeURIComponent(variable)}`,
    );
    values = local.values;
    source = 'local_coefficients';
  } catch {
    // Fallback: use raw variable values from the regression dataset
    const dist = await apiFetch<{ values: number[] }>(
      `/models/${modelId}/variable-distribution/${encodeURIComponent(variable)}`,
    );
    values = dist.values;
    source = 'raw_distribution';
  }

  if (values.length === 0) return [];

  const k = Math.min(maxSegments, Math.max(2, Math.ceil(Math.sqrt(values.length / 10))));
  const breakpoints = naturalBreaks(values, k);

  const rationale =
    source === 'local_coefficients'
      ? `Breakpoints derived from ${values.length} local GWR/spatial coefficients for ${variable}; ` +
        `${k} segments chosen by largest coefficient-magnitude gaps.`
      : `Breakpoints derived from ${values.length} observed values of ${variable}; ` +
        `${k} segments chosen via natural-breaks on the raw distribution.`;

  return [
    {
      variable,
      breakpoints,
      segmentCount: breakpoints.length + 1,
      rationale,
    },
  ];
}

/**
 * Report per-variable completeness within the regression dataset.
 *
 * @param modelId  Regression model identifier.
 */
export async function assessDataCoverage(modelId: string): Promise<DataCoverage[]> {
  interface CoverageRow {
    variable: string;
    totalRecords: number;
    nonNullCount: number;
  }

  const rows = await apiFetch<CoverageRow[]>(`/models/${modelId}/data-coverage`);

  return rows.map((r) => ({
    variable: r.variable,
    totalRecords: r.totalRecords,
    nonNullCount: r.nonNullCount,
    completeness: r.totalRecords > 0 ? r.nonNullCount / r.totalRecords : 0,
  }));
}

/**
 * Convenience wrapper: run all three analyses and return a unified result.
 */
export async function discoverSegments(
  modelId: string,
  topN = 5,
  maxSegments = 4,
): Promise<SegmentDiscoveryResult> {
  const [factorImportance, dataCoverage] = await Promise.all([
    analyzeFactors(modelId),
    assessDataCoverage(modelId),
  ]);

  // Suggest segments for the top-N most important factors
  const topFactors = factorImportance.slice(0, topN);
  const segmentArrays = await Promise.all(
    topFactors.map((f) => suggestSegments(modelId, f.variable, maxSegments)),
  );
  const suggestedSegments = segmentArrays.flat();

  return { factorImportance, suggestedSegments, dataCoverage };
}
