/**
 * Reconciliation Module - USPAP-aligned final value opinion
 *
 * Combines Sales, Income, and Cost approach indications
 * into a reconciled final opinion of value.
 */

import type { AuditEvent } from '../types.js';

export interface ApproachValue {
  indicatedValue: number;
  confidenceLevel?: 'high' | 'medium' | 'low';
  weight?: number;
}

export interface ReconciliationInput {
  subjectId: string;
  effectiveDate: string;
  approaches: {
    sales?: ApproachValue;
    income?: ApproachValue;
    cost?: ApproachValue;
  };
  propertyType?: 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'special_purpose';
  reconciliationMethod?: 'weighted_average' | 'bracketed' | 'primary_approach';
  forcedWeights?: boolean;
}

export interface ApproachSummaryItem {
  indicatedValue: number;
  weight: number;
  contributedValue: number;
}

export interface ReconciliationOutput {
  subjectId: string;
  effectiveDate: string;
  finalOpinionOfValue: number;
  approachSummary: {
    sales?: ApproachSummaryItem;
    income?: ApproachSummaryItem;
    cost?: ApproachSummaryItem;
  };
  reconciliationAnalysis: {
    method: 'weighted_average' | 'bracketed' | 'primary_approach';
    valueRange: {
      min: number;
      max: number;
    };
    spreadPercentage: number;
    primaryApproach?: 'sales' | 'income' | 'cost';
    weightsNormalized: boolean;
  };
  qualityIndicators: {
    confidenceLevel: 'high' | 'medium' | 'low';
    warnings: string[];
    approachAgreement: 'strong' | 'moderate' | 'weak';
  };
  explanation: string;
  generatedAt: string;
}

export interface ReconciliationResult {
  output: ReconciliationOutput;
  auditEvent: AuditEvent;
}

type ApproachKey = 'sales' | 'income' | 'cost';

/**
 * Default weight distribution based on property type
 */
const DEFAULT_WEIGHTS: Record<string, Record<ApproachKey, number>> = {
  residential: { sales: 0.6, income: 0.1, cost: 0.3 },
  commercial: { sales: 0.3, income: 0.5, cost: 0.2 },
  industrial: { sales: 0.25, income: 0.45, cost: 0.3 },
  agricultural: { sales: 0.4, income: 0.4, cost: 0.2 },
  special_purpose: { sales: 0.2, income: 0.2, cost: 0.6 },
};

/**
 * Confidence level multipliers for weight adjustment
 */
const CONFIDENCE_MULTIPLIERS: Record<string, number> = {
  high: 1.0,
  medium: 0.75,
  low: 0.5,
};

/**
 * Run the reconciliation analysis
 */
export function runReconciliation(input: ReconciliationInput): ReconciliationResult {
  const {
    subjectId,
    effectiveDate,
    approaches,
    propertyType = 'residential',
    reconciliationMethod = 'weighted_average',
    forcedWeights = false,
  } = input;

  const approachKeys = Object.keys(approaches) as ApproachKey[];
  if (approachKeys.length === 0) {
    throw new Error('At least one approach value is required for reconciliation');
  }

  // Calculate weights
  const weights = calculateWeights(approaches, propertyType, forcedWeights);

  // Calculate weighted values
  const approachSummary: ReconciliationOutput['approachSummary'] = {};
  let totalWeightedValue = 0;
  const values: number[] = [];

  for (const key of approachKeys) {
    const approach = approaches[key];
    if (approach) {
      const weight = weights[key] ?? 0;
      const contributedValue = Math.round(approach.indicatedValue * weight);
      approachSummary[key] = {
        indicatedValue: approach.indicatedValue,
        weight,
        contributedValue,
      };
      totalWeightedValue += contributedValue;
      values.push(approach.indicatedValue);
    }
  }

  // Final value based on method
  let finalOpinionOfValue: number;

  switch (reconciliationMethod) {
    case 'bracketed':
      finalOpinionOfValue = calculateBracketedValue(values);
      break;
    case 'primary_approach':
      finalOpinionOfValue = getPrimaryApproachValue(approaches, weights);
      break;
    case 'weighted_average':
    default:
      finalOpinionOfValue = totalWeightedValue;
      break;
  }

  // Calculate range statistics
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
  const spreadPercentage =
    avgValue > 0 ? Math.round(((maxValue - minValue) / avgValue) * 10000) / 100 : 0;

  // Determine primary approach (highest weight)
  let primaryApproach: ApproachKey | undefined;
  let maxWeight = 0;
  for (const key of approachKeys) {
    const weight = weights[key] ?? 0;
    if (weight > maxWeight) {
      maxWeight = weight;
      primaryApproach = key;
    }
  }

  // Quality indicators
  const warnings: string[] = [];
  let approachAgreement: 'strong' | 'moderate' | 'weak' = 'strong';

  if (spreadPercentage > 20) {
    warnings.push(`Large value spread (${spreadPercentage.toFixed(1)}%) between approaches`);
    approachAgreement = 'weak';
  } else if (spreadPercentage > 10) {
    approachAgreement = 'moderate';
  }

  if (approachKeys.length === 1) {
    warnings.push('Only one approach available - limited reconciliation possible');
    approachAgreement = 'weak';
  }

  // Overall confidence based on approach agreements and individual confidences
  const confidences = approachKeys.map(k => approaches[k]?.confidenceLevel ?? 'medium');
  const lowCount = confidences.filter(c => c === 'low').length;
  let confidenceLevel: 'high' | 'medium' | 'low' = 'high';

  if (lowCount > 0 || approachAgreement === 'weak') {
    confidenceLevel = 'low';
  } else if (approachAgreement === 'moderate') {
    confidenceLevel = 'medium';
  }

  // Generate explanation
  const explanation = generateExplanation(
    input,
    approachSummary,
    finalOpinionOfValue,
    weights,
    primaryApproach,
    spreadPercentage
  );

  const output: ReconciliationOutput = {
    subjectId,
    effectiveDate,
    finalOpinionOfValue,
    approachSummary,
    reconciliationAnalysis: {
      method: reconciliationMethod,
      valueRange: {
        min: minValue,
        max: maxValue,
      },
      spreadPercentage,
      primaryApproach,
      weightsNormalized: true,
    },
    qualityIndicators: {
      confidenceLevel,
      warnings,
      approachAgreement,
    },
    explanation,
    generatedAt: new Date().toISOString(),
  };

  const auditEvent: AuditEvent = {
    type: 'reconciliation_completed',
    timestamp: output.generatedAt,
    subjectId,
    details: {
      method: reconciliationMethod,
      finalValue: finalOpinionOfValue,
      approachCount: approachKeys.length,
      primaryApproach,
      spreadPercentage,
      confidenceLevel,
    },
  };

  return { output, auditEvent };
}

/**
 * Calculate weights for each approach
 */
function calculateWeights(
  approaches: ReconciliationInput['approaches'],
  propertyType: string,
  forcedWeights: boolean
): Record<ApproachKey, number> {
  const approachKeys = Object.keys(approaches) as ApproachKey[];
  const defaults = DEFAULT_WEIGHTS[propertyType] ?? DEFAULT_WEIGHTS.residential;
  const weights: Record<ApproachKey, number> = { sales: 0, income: 0, cost: 0 };

  if (forcedWeights) {
    // Use explicit weights from input
    for (const key of approachKeys) {
      const approach = approaches[key];
      if (approach?.weight !== undefined) {
        weights[key] = approach.weight;
      }
    }
  } else {
    // Auto-calculate based on property type and confidence
    for (const key of approachKeys) {
      const approach = approaches[key];
      if (approach) {
        const baseWeight = defaults[key] ?? 0;
        const confidence = approach.confidenceLevel ?? 'medium';
        const multiplier = CONFIDENCE_MULTIPLIERS[confidence] ?? 1;
        weights[key] = baseWeight * multiplier;
      }
    }
  }

  // Normalize weights to sum to 1.0
  const totalWeight = weights.sales + weights.income + weights.cost;
  if (totalWeight > 0) {
    weights.sales = Math.round((weights.sales / totalWeight) * 10000) / 10000;
    weights.income = Math.round((weights.income / totalWeight) * 10000) / 10000;
    weights.cost = Math.round((weights.cost / totalWeight) * 10000) / 10000;

    // Ensure sum is exactly 1.0 by adjusting largest weight
    const sum = weights.sales + weights.income + weights.cost;
    if (sum !== 1) {
      const diff = 1 - sum;
      const largest = approachKeys.reduce((a, b) => (weights[a] > weights[b] ? a : b));
      weights[largest] = Math.round((weights[largest] + diff) * 10000) / 10000;
    }
  }

  return weights;
}

/**
 * Calculate bracketed (midpoint) value
 */
function calculateBracketedValue(values: number[]): number {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return Math.round((min + max) / 2);
}

/**
 * Get value from primary (highest weighted) approach
 */
function getPrimaryApproachValue(
  approaches: ReconciliationInput['approaches'],
  weights: Record<ApproachKey, number>
): number {
  const keys = Object.keys(approaches) as ApproachKey[];
  let maxWeight = 0;
  let primaryValue = 0;

  for (const key of keys) {
    const weight = weights[key] ?? 0;
    if (weight > maxWeight && approaches[key]) {
      maxWeight = weight;
      primaryValue = approaches[key]!.indicatedValue;
    }
  }

  return primaryValue;
}

/**
 * Generate human-readable reconciliation narrative
 */
function generateExplanation(
  input: ReconciliationInput,
  summary: ReconciliationOutput['approachSummary'],
  finalValue: number,
  weights: Record<ApproachKey, number>,
  primaryApproach: ApproachKey | undefined,
  spreadPercentage: number
): string {
  const formatCurrency = (cents: number): string => {
    const dollars = cents / 100;
    return (
      '$' + dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    );
  };

  const formatPercent = (decimal: number): string => {
    return (decimal * 100).toFixed(1) + '%';
  };

  const lines: string[] = [
    `RECONCILIATION ANALYSIS`,
    `Subject: ${input.subjectId}`,
    `Effective Date: ${input.effectiveDate}`,
    `Property Type: ${input.propertyType ?? 'residential'}`,
    '',
    'APPROACH VALUES:',
  ];

  if (summary.sales) {
    lines.push(
      `  Sales Comparison: ${formatCurrency(summary.sales.indicatedValue)} × ${formatPercent(weights.sales)} = ${formatCurrency(summary.sales.contributedValue)}`
    );
  }
  if (summary.income) {
    lines.push(
      `  Income Approach:  ${formatCurrency(summary.income.indicatedValue)} × ${formatPercent(weights.income)} = ${formatCurrency(summary.income.contributedValue)}`
    );
  }
  if (summary.cost) {
    lines.push(
      `  Cost Approach:    ${formatCurrency(summary.cost.indicatedValue)} × ${formatPercent(weights.cost)} = ${formatCurrency(summary.cost.contributedValue)}`
    );
  }

  lines.push('');
  lines.push(`RECONCILED VALUE: ${formatCurrency(finalValue)}`);
  lines.push('');
  lines.push(`Method: ${input.reconciliationMethod ?? 'weighted_average'}`);
  if (primaryApproach) {
    lines.push(`Primary Approach: ${primaryApproach}`);
  }
  lines.push(`Value Spread: ${spreadPercentage.toFixed(1)}%`);

  return lines.join('\n');
}
