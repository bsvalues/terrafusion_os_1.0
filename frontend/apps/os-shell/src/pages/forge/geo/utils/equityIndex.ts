export interface EquityIndexResult {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
  components: {
    ratio: number;   // 0–1
    cod: number;     // 0–1
    prd: number;     // 0–1
    passRate: number; // 0–1
    spatial: number;  // 0–1
    adequacy: number; // 0–1
  };
}

/**
 * County Equity Index (EQI) — 0 to 100 composite DOR-readiness score.
 *
 * Weights (sum to 100):
 *   25  Ratio score    — how close county-wide median is to 1.0
 *   20  COD score      — uniformity (COD ≤ 10 = perfect, ≥ 25 = 0)
 *   15  PRD score      — vertical equity (deviation from 1.0, tolerance ±0.05)
 *   25  Pass rate      — % of neighborhoods meeting IAAO standards
 *   10  Spatial score  — Moran's I < 0 → full marks; I ≥ 0.50 → 0
 *    5  Adequacy       — sales coverage (10 sales/nbhd = full marks)
 */
export function computeEquityIndex(params: {
  cwMed: number;
  cwCod: number;
  cwPrd: number;
  passRate: number;    // fraction 0–1
  moransI: number;     // global Moran's I (pass 0 if unavailable)
  totalSales: number;
  totalNbhds: number;
}): EquityIndexResult {
  const ratioScore    = Math.max(0, 1 - Math.abs(params.cwMed - 1.0) / 0.15);
  const codScore      = Math.max(0, 1 - Math.max(0, params.cwCod - 10) / 15);
  const prdScore      = Math.max(0, 1 - Math.abs(params.cwPrd - 1.0) / 0.05);
  const passScore     = Math.max(0, Math.min(1, params.passRate));
  const spatialScore  = Math.max(0, 1 - params.moransI / 0.50);
  const adequacyScore = params.totalNbhds > 0
    ? Math.min(1, params.totalSales / (params.totalNbhds * 10))
    : 0;

  const score = Math.round(
    ratioScore   * 25 +
    codScore     * 20 +
    prdScore     * 15 +
    passScore    * 25 +
    spatialScore * 10 +
    adequacyScore * 5,
  );

  const grade: EquityIndexResult['grade'] =
    score >= 90 ? 'A' :
    score >= 80 ? 'B' :
    score >= 65 ? 'C' :
    score >= 50 ? 'D' : 'F';

  const color =
    score >= 85 ? '#4ade80' :
    score >= 70 ? '#fbbf24' :
    score >= 50 ? '#f97316' : '#ef4444';

  return {
    score,
    grade,
    color,
    components: {
      ratio: ratioScore,
      cod: codScore,
      prd: prdScore,
      passRate: passScore,
      spatial: spatialScore,
      adequacy: adequacyScore,
    },
  };
}
