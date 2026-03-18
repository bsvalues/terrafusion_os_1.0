/**
 * TFR-037: Metric Catalog — Single Source of Truth
 *
 * Every statistical metric surfaced by the OS is defined here with
 * human-readable explanations, health guidance, and provenance links.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetricEntry {
  /** Stable machine identifier, e.g. "cod". */
  id: string;
  /** Display name. */
  name: string;
  /** Plain-language explanation of what the metric measures. */
  whatItMeans: string;
  /** Why this metric matters to the assessor. */
  soWhat: string;
  /** Data source / derivation method. */
  whereItCameFrom: string;
  /** Interpretive guidance: good / warning / critical thresholds. */
  healthGuidance: string;
  /** Unit of measurement (e.g. "%", "ratio", "score"). */
  unit: string;
  /** URL to IAAO standard or other authoritative reference. */
  proofLink: string;
}

// ---------------------------------------------------------------------------
// Catalog entries
// ---------------------------------------------------------------------------

const CATALOG: MetricEntry[] = [
  {
    id: 'cod',
    name: 'Coefficient of Dispersion (COD)',
    whatItMeans:
      'Measures the average percentage deviation of individual assessment ratios from the median ratio. Lower values indicate more uniform assessments.',
    soWhat:
      'High COD signals inequitable treatment — some properties are systematically over- or under-assessed relative to peers.',
    whereItCameFrom:
      'Computed from the ratio study: median absolute deviation of ratios / median ratio * 100.',
    healthGuidance:
      'IAAO standard: residential COD should be 5-15%. Commercial/industrial 5-20%. Values above 20% warrant investigation.',
    unit: '%',
    proofLink: 'https://www.iaao.org/media/standards/Standard_on_Ratio_Studies.pdf',
  },
  {
    id: 'prd',
    name: 'Price-Related Differential (PRD)',
    whatItMeans:
      'Detects whether higher-value properties are assessed at different rates than lower-value properties (regressivity vs. progressivity).',
    soWhat:
      'PRD > 1.03 means low-value homes bear a disproportionate tax burden. PRD < 0.98 means high-value homes bear more burden.',
    whereItCameFrom: 'Mean ratio / weighted mean ratio.',
    healthGuidance: 'IAAO standard: PRD should be between 0.98 and 1.03.',
    unit: 'ratio',
    proofLink: 'https://www.iaao.org/media/standards/Standard_on_Ratio_Studies.pdf',
  },
  {
    id: 'prb',
    name: 'Price-Related Bias (PRB)',
    whatItMeans:
      'A regression-based measure of vertical equity that is more robust than PRD. Negative PRB indicates regressivity.',
    soWhat:
      'PRB captures non-linear assessment bias that PRD can miss, especially in heterogeneous markets.',
    whereItCameFrom:
      'Regression coefficient from ln(value) on assessment ratio, per Gloudemans (2011).',
    healthGuidance: 'Should be between -0.05 and 0.05. Values outside indicate vertical inequity.',
    unit: 'coefficient',
    proofLink: 'https://www.iaao.org/media/standards/Standard_on_Ratio_Studies.pdf',
  },
  {
    id: 'cov',
    name: 'Coefficient of Variation (COV)',
    whatItMeans:
      'Standard deviation of ratios divided by the mean ratio, expressed as a percentage. Similar to COD but uses mean instead of median.',
    soWhat:
      'COV is more sensitive to outliers than COD. Comparing both helps identify whether dispersion is driven by a few outliers or systemic issues.',
    whereItCameFrom: 'Standard deviation of ratios / mean ratio * 100.',
    healthGuidance: 'Generally should track close to COD. Large divergence flags outlier influence.',
    unit: '%',
    proofLink: 'https://www.iaao.org/media/standards/Standard_on_Ratio_Studies.pdf',
  },
  {
    id: 'median_ratio',
    name: 'Median Assessment Ratio',
    whatItMeans:
      'The middle value when all assessment-to-sale ratios are sorted. Indicates the typical level of assessment.',
    soWhat:
      'If the statutory ratio is 100%, the median ratio should be near 1.00. Deviation means the jurisdiction is systematically over- or under-assessing.',
    whereItCameFrom: 'Median of (assessed value / sale price) for qualified sales.',
    healthGuidance:
      'Should be within 5% of the statutory level. Washington state target is 100% of market value.',
    unit: 'ratio',
    proofLink: 'https://www.iaao.org/media/standards/Standard_on_Ratio_Studies.pdf',
  },
  {
    id: 'parity_rate',
    name: 'Parity Rate',
    whatItMeans:
      'Percentage of parcels whose assessment ratio falls within an acceptable range of the median (typically +/- 10%).',
    soWhat:
      'High parity rate means most properties are assessed consistently. Low parity rate flags widespread assessment disparity.',
    whereItCameFrom:
      'Count of parcels with ratio within tolerance / total parcels * 100.',
    healthGuidance: 'Target > 80%. Below 70% indicates significant uniformity problems.',
    unit: '%',
    proofLink: 'https://www.iaao.org/media/standards/Standard_on_Ratio_Studies.pdf',
  },
  {
    id: 'data_quality_score',
    name: 'Data Quality Score',
    whatItMeans:
      'Weighted completeness score for parcel records. Required fields (APN, owner, situs, value) carry more weight than optional fields.',
    soWhat:
      'Low data quality scores correlate with assessment errors. Incomplete records cannot be reliably valued.',
    whereItCameFrom: 'Computed by dataQualityScoring service across all weighted fields.',
    healthGuidance:
      'A = 90-100, B = 75-89, C = 60-74, D = 40-59, F = below 40. Target: county-wide average of B or above.',
    unit: 'score',
    proofLink: '',
  },
];

// ---------------------------------------------------------------------------
// Index for O(1) lookup
// ---------------------------------------------------------------------------

const INDEX = new Map<string, MetricEntry>();
for (const entry of CATALOG) {
  INDEX.set(entry.id, entry);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieve a single metric definition by its stable id.
 * Returns undefined if the id is not found.
 */
export function getMetric(id: string): MetricEntry | undefined {
  return INDEX.get(id);
}

/**
 * Return the full catalog as an array (defensive copy).
 */
export function getAllMetrics(): MetricEntry[] {
  return [...CATALOG];
}
