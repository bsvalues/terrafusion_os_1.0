/**
 * Income Approach Module - Direct Capitalization Method
 * USPAP-aligned implementation for TerraForge
 *
 * Formula: Value = NOI / Cap Rate
 * NOI = EGI - Operating Expenses
 * EGI = PGI - Vacancy + Other Income
 */

import type { AuditEvent } from '../types.js';

export interface IncomeApproachInput {
  subjectId: string;
  effectiveDate: string;
  incomeData: {
    potentialGrossIncome: number;
    vacancyRate?: number;
    otherIncome?: number;
    operatingExpenses?: {
      taxes?: number;
      insurance?: number;
      utilities?: number;
      maintenance?: number;
      management?: number;
      reserves?: number;
      other?: number;
    };
  };
  capitalizationRate: {
    rate: number;
    source?: 'market_extraction' | 'band_of_investment' | 'debt_coverage' | 'provided';
    supportingData?: Array<{
      propertyId?: string;
      salePrice?: number;
      noi?: number;
      extractedRate?: number;
    }>;
  };
  analysisParameters?: {
    expenseRatioCheck?: boolean;
    typicalExpenseRatioMin?: number;
    typicalExpenseRatioMax?: number;
  };
}

export interface IncomeApproachOutput {
  subjectId: string;
  effectiveDate: string;
  indicatedValue: number;
  incomeAnalysis: {
    potentialGrossIncome: number;
    vacancyLoss: number;
    otherIncome: number;
    effectiveGrossIncome: number;
    operatingExpenseBreakdown: {
      taxes: number;
      insurance: number;
      utilities: number;
      maintenance: number;
      management: number;
      reserves: number;
      other: number;
    };
    totalOperatingExpenses: number;
    netOperatingIncome: number;
    capitalizationRate: number;
    expenseRatio: number;
  };
  qualityIndicators: {
    confidenceLevel: 'high' | 'medium' | 'low';
    dataQuality: 'verified' | 'estimated' | 'incomplete';
    warnings: string[];
    capRateSupport: 'strong' | 'moderate' | 'weak';
  };
  explanation: string;
  generatedAt: string;
}

export interface IncomeApproachResult {
  output: IncomeApproachOutput;
  auditEvent: AuditEvent;
}

/**
 * Run the income approach analysis using direct capitalization
 */
export function runIncomeApproach(input: IncomeApproachInput): IncomeApproachResult {
  const { subjectId, effectiveDate, incomeData, capitalizationRate, analysisParameters } = input;

  // Extract income data with defaults
  const pgi = incomeData.potentialGrossIncome;
  const vacancyRate = incomeData.vacancyRate ?? 0.05;
  const otherIncome = incomeData.otherIncome ?? 0;
  const expenses = incomeData.operatingExpenses ?? {};

  // Build expense breakdown
  const expenseBreakdown = {
    taxes: expenses.taxes ?? 0,
    insurance: expenses.insurance ?? 0,
    utilities: expenses.utilities ?? 0,
    maintenance: expenses.maintenance ?? 0,
    management: expenses.management ?? 0,
    reserves: expenses.reserves ?? 0,
    other: expenses.other ?? 0,
  };

  // Calculate income metrics
  const vacancyLoss = Math.round(pgi * vacancyRate);
  const egi = pgi - vacancyLoss + otherIncome;
  const totalOpEx = Object.values(expenseBreakdown).reduce((sum, v) => sum + v, 0);
  const noi = egi - totalOpEx;

  // Calculate expense ratio
  const expenseRatio = egi > 0 ? totalOpEx / egi : 0;

  // Calculate indicated value: NOI / Cap Rate
  // Round to nearest whole cent
  const capRate = capitalizationRate.rate;
  const indicatedValue = Math.round(noi / capRate);

  // Determine quality indicators
  const warnings: string[] = [];
  let dataQuality: 'verified' | 'estimated' | 'incomplete' = 'verified';
  let confidenceLevel: 'high' | 'medium' | 'low' = 'high';
  let capRateSupport: 'strong' | 'moderate' | 'weak' = 'moderate';

  // Check expense ratio
  const params = analysisParameters ?? {};
  const checkExpenseRatio = params.expenseRatioCheck ?? true;
  const minExpenseRatio = params.typicalExpenseRatioMin ?? 0.3;
  const maxExpenseRatio = params.typicalExpenseRatioMax ?? 0.5;

  if (checkExpenseRatio) {
    if (expenseRatio < minExpenseRatio) {
      warnings.push(
        `Expense ratio (${(expenseRatio * 100).toFixed(1)}%) below typical range (${(minExpenseRatio * 100).toFixed(0)}-${(maxExpenseRatio * 100).toFixed(0)}%)`
      );
      confidenceLevel = confidenceLevel === 'high' ? 'medium' : confidenceLevel;
    } else if (expenseRatio > maxExpenseRatio) {
      warnings.push(
        `Expense ratio (${(expenseRatio * 100).toFixed(1)}%) above typical range (${(minExpenseRatio * 100).toFixed(0)}-${(maxExpenseRatio * 100).toFixed(0)}%)`
      );
      confidenceLevel = confidenceLevel === 'high' ? 'medium' : confidenceLevel;
    }
  }

  // Check cap rate support
  const supportingData = capitalizationRate.supportingData ?? [];
  if (supportingData.length >= 3) {
    capRateSupport = 'strong';
  } else if (supportingData.length >= 1) {
    capRateSupport = 'moderate';
  } else {
    capRateSupport = 'weak';
    if (capitalizationRate.source === 'provided') {
      warnings.push('Cap rate provided without market extraction support');
    }
  }

  // Check for zero/negative NOI
  if (noi <= 0) {
    warnings.push('Net operating income is zero or negative');
    confidenceLevel = 'low';
    dataQuality = 'incomplete';
  }

  // Check for incomplete expense data
  if (totalOpEx === 0 && pgi > 0) {
    warnings.push('No operating expenses provided - typical properties have 30-50% expense ratios');
    dataQuality = 'incomplete';
    confidenceLevel = 'low';
  }

  // Generate explanation
  const explanation = generateExplanation(input, {
    pgi,
    vacancyLoss,
    otherIncome,
    egi,
    totalOpEx,
    noi,
    capRate,
    indicatedValue,
    expenseRatio,
  });

  const output: IncomeApproachOutput = {
    subjectId,
    effectiveDate,
    indicatedValue,
    incomeAnalysis: {
      potentialGrossIncome: pgi,
      vacancyLoss,
      otherIncome,
      effectiveGrossIncome: egi,
      operatingExpenseBreakdown: expenseBreakdown,
      totalOperatingExpenses: totalOpEx,
      netOperatingIncome: noi,
      capitalizationRate: capRate,
      expenseRatio: Math.round(expenseRatio * 10000) / 10000, // 4 decimal places
    },
    qualityIndicators: {
      confidenceLevel,
      dataQuality,
      warnings,
      capRateSupport,
    },
    explanation,
    generatedAt: new Date().toISOString(),
  };

  const auditEvent: AuditEvent = {
    type: 'approach_income_completed',
    timestamp: output.generatedAt,
    subjectId,
    details: {
      method: 'direct_capitalization',
      indicatedValue,
      noi,
      capRate,
      confidenceLevel,
      warningCount: warnings.length,
    },
  };

  return { output, auditEvent };
}

interface CalculationDetails {
  pgi: number;
  vacancyLoss: number;
  otherIncome: number;
  egi: number;
  totalOpEx: number;
  noi: number;
  capRate: number;
  indicatedValue: number;
  expenseRatio: number;
}

function generateExplanation(input: IncomeApproachInput, calc: CalculationDetails): string {
  const {
    pgi,
    vacancyLoss,
    otherIncome,
    egi,
    totalOpEx,
    noi,
    capRate,
    indicatedValue,
    expenseRatio,
  } = calc;

  const formatCurrency = (cents: number): string => {
    const dollars = cents / 100;
    return (
      '$' + dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  };

  const lines: string[] = [
    `Income Approach Analysis for ${input.subjectId} as of ${input.effectiveDate}`,
    '',
    'INCOME CALCULATION:',
    `  Potential Gross Income (PGI):    ${formatCurrency(pgi)}`,
    `  Less: Vacancy & Collection Loss: (${formatCurrency(vacancyLoss)})`,
    `  Plus: Other Income:               ${formatCurrency(otherIncome)}`,
    `  Effective Gross Income (EGI):    ${formatCurrency(egi)}`,
    '',
    `  Less: Operating Expenses:        (${formatCurrency(totalOpEx)})`,
    `  Net Operating Income (NOI):      ${formatCurrency(noi)}`,
    '',
    'CAPITALIZATION:',
    `  NOI ${formatCurrency(noi)} ÷ Cap Rate ${(capRate * 100).toFixed(2)}%`,
    `  = Indicated Value: ${formatCurrency(indicatedValue)}`,
    '',
    `Expense Ratio: ${(expenseRatio * 100).toFixed(1)}%`,
    `Cap Rate Source: ${input.capitalizationRate.source ?? 'provided'}`,
  ];

  return lines.join('\n');
}

/**
 * Calculate market-extracted cap rate from comparable sales
 */
export function extractCapRate(comparables: Array<{ salePrice: number; noi: number }>): number {
  if (comparables.length === 0) {
    throw new Error('At least one comparable required for cap rate extraction');
  }

  const rates = comparables.map(c => c.noi / c.salePrice);
  const sum = rates.reduce((a, b) => a + b, 0);
  return sum / rates.length;
}
