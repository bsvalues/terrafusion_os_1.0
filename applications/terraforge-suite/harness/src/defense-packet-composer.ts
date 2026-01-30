/**
 * Defense Packet Composer
 *
 * Transforms approach results into structured defense packet sections.
 * This module is **formatting-only** - no valuation logic leaks in.
 */

import { createHash } from 'crypto';
import type { AuditEvent } from './types.js';

/* ============================================================================
 * Input Types (from defense_packet_input.json)
 * ============================================================================ */

export interface SalesApproachResult {
  indicatedValue: number;
  confidenceLevel?: 'high' | 'medium' | 'low';
  comparableCount: number;
  valueRange?: {
    min: number;
    max: number;
  };
  keyComparables?: Array<{
    id: string;
    address?: string;
    salePrice: number;
    adjustedPrice: number;
    weight?: number;
  }>;
  adjustmentSummary?: string;
  warnings?: string[];
}

export interface IncomeApproachResult {
  indicatedValue: number;
  confidenceLevel?: 'high' | 'medium' | 'low';
  method: 'direct_capitalization' | 'yield_capitalization' | 'gross_rent_multiplier';
  netOperatingIncome?: number;
  capitalizationRate?: number;
  grossRentMultiplier?: number;
  sensitivityAnalysis?: {
    capRateMinus50bp?: number;
    capRatePlus50bp?: number;
  };
  warnings?: string[];
}

export interface CostApproachResult {
  indicatedValue: number;
  confidenceLevel?: 'high' | 'medium' | 'low';
  landValue: number;
  buildingValue: number;
  replacementCostNew?: number;
  totalDepreciation?: number;
  depreciationBreakdown?: {
    physical?: number;
    functional?: number;
    external?: number;
  };
  warnings?: string[];
}

export interface ReconciliationResult {
  finalValue: number;
  method: 'weighted_average' | 'bracketed' | 'primary_approach';
  weights?: {
    sales?: number;
    income?: number;
    cost?: number;
  };
  primaryApproach?: 'sales' | 'income' | 'cost';
  rationale?: string;
  confidenceLevel?: 'high' | 'medium' | 'low';
  approachAgreement?: 'strong' | 'moderate' | 'weak';
  auditTrailPointers?: string[];
}

export interface DefensePacketInput {
  subjectId: string;
  effectiveDate: string;
  salePrice: number;
  finalValue: number;
  propertyAddress?: string;
  propertyType?: 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'special_purpose';
  assumptions?: string[];
  salesApproach?: SalesApproachResult;
  incomeApproach?: IncomeApproachResult;
  costApproach?: CostApproachResult;
  reconciliation?: ReconciliationResult;
  diagnostics?: {
    pipelineVersion?: string;
    calculationMode?: 'stub' | 'steel';
    auditEventIds?: string[];
  };
}

/* ============================================================================
 * Output Types (from defense_packet_output.json)
 * ============================================================================ */

interface SubjectSection {
  title: string;
  content: {
    parcelId: string;
    address?: string;
    propertyType: string;
    effectiveDate: string;
    assumptions: string[];
    narrative: string;
  };
}

interface ApproachSection {
  title: string;
  developed: boolean;
  indicatedValue: number | null;
  notDevelopedReason?: string;
  tables: Array<{
    name: string;
    headers: string[];
    rows: Array<Array<string | number>>;
  }>;
  narrative: string;
  warnings: string[];
}

interface ReconciliationSection {
  title: string;
  finalValue: number;
  method: string;
  weights: {
    sales?: number;
    income?: number;
    cost?: number;
  };
  conclusion: string;
  rationale: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

interface ExhibitsSection {
  title: string;
  auditEventIds: string[];
  modelInputs: Record<string, unknown>;
  calculationSummary: Record<string, unknown>;
  attachments: Array<{
    name: string;
    type: string;
    reference: string;
  }>;
}

export interface DefensePacketOutput {
  subjectId: string;
  effectiveDate: string;
  propertyAddress?: string;
  finalValue: number;
  salePrice: number;
  ratio: number;
  status: 'OK' | 'Review Required' | 'Appeal Likely';
  sections: {
    A_subject: SubjectSection;
    B_sales: ApproachSection;
    B2_cost: ApproachSection;
    C_income: ApproachSection;
    D_reconciliation: ReconciliationSection;
    E_exhibits: ExhibitsSection;
  };
  summary: string;
  warnings: string[];
  generatedAt: string;
  packetHash: string;
  version: string;
}

export interface DefensePacketComposerResult {
  output: DefensePacketOutput;
  auditEvent: AuditEvent;
}

/* ============================================================================
 * Helpers
 * ============================================================================ */

const PACKET_VERSION = '1.0.0';

function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return (
    '$' + dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  );
}

function formatPercent(decimal: number, decimals = 1): string {
  return (decimal * 100).toFixed(decimals) + '%';
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function determineStatus(ratio: number): 'OK' | 'Review Required' | 'Appeal Likely' {
  if (ratio >= 0.9) return 'OK';
  if (ratio >= 0.8) return 'Review Required';
  return 'Appeal Likely';
}

function calculatePacketHash(data: {
  subjectId: string;
  effectiveDate: string;
  finalValue: number;
  salePrice: number;
  ratio: number;
  status: string;
}): string {
  const content = JSON.stringify(data);
  return createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/* ============================================================================
 * Section Builders
 * ============================================================================ */

function buildSubjectSection(input: DefensePacketInput): SubjectSection {
  const propertyType = input.propertyType ?? 'residential';
  const assumptions = input.assumptions ?? [];

  const narrative =
    `This defense packet supports the valuation of ${input.subjectId} ` +
    `as of ${input.effectiveDate}. ` +
    `Property type: ${propertyType}. ` +
    (assumptions.length > 0
      ? `Key assumptions include: ${assumptions.join('; ')}.`
      : 'Standard appraisal assumptions apply.');

  return {
    title: 'Subject Property & Scope',
    content: {
      parcelId: input.subjectId,
      address: input.propertyAddress,
      propertyType,
      effectiveDate: input.effectiveDate,
      assumptions,
      narrative,
    },
  };
}

function buildSalesSection(input: DefensePacketInput): ApproachSection {
  const sales = input.salesApproach;

  if (!sales) {
    return {
      title: 'Sales Comparison Approach',
      developed: false,
      indicatedValue: null,
      notDevelopedReason:
        'Not Developed - Insufficient comparable sales data available or approach not applicable to property type.',
      tables: [],
      narrative: 'The Sales Comparison Approach was not developed for this valuation.',
      warnings: [],
    };
  }

  const tables: ApproachSection['tables'] = [];

  // Comparable sales table
  if (sales.keyComparables && sales.keyComparables.length > 0) {
    tables.push({
      name: 'Comparable Sales Grid',
      headers: ['ID', 'Address', 'Sale Price', 'Adjusted Price', 'Weight'],
      rows: sales.keyComparables.map(comp => [
        comp.id,
        comp.address ?? 'N/A',
        formatCurrency(comp.salePrice),
        formatCurrency(comp.adjustedPrice),
        comp.weight !== undefined ? formatPercent(comp.weight) : 'N/A',
      ]),
    });
  }

  // Summary table
  tables.push({
    name: 'Sales Approach Summary',
    headers: ['Metric', 'Value'],
    rows: [
      ['Indicated Value', formatCurrency(sales.indicatedValue)],
      ['Comparable Count', sales.comparableCount],
      ['Value Range (Min)', sales.valueRange ? formatCurrency(sales.valueRange.min) : 'N/A'],
      ['Value Range (Max)', sales.valueRange ? formatCurrency(sales.valueRange.max) : 'N/A'],
      ['Confidence', sales.confidenceLevel ?? 'medium'],
    ],
  });

  const narrative =
    sales.adjustmentSummary ??
    `The Sales Comparison Approach yielded an indicated value of ${formatCurrency(sales.indicatedValue)} ` +
      `based on ${sales.comparableCount} comparable sales.`;

  return {
    title: 'Sales Comparison Approach',
    developed: true,
    indicatedValue: sales.indicatedValue,
    tables,
    narrative,
    warnings: sales.warnings ?? [],
  };
}

function buildIncomeSection(input: DefensePacketInput): ApproachSection {
  const income = input.incomeApproach;

  if (!income) {
    return {
      title: 'Income Approach',
      developed: false,
      indicatedValue: null,
      notDevelopedReason:
        'Not Developed - Property does not generate income or insufficient rental data available.',
      tables: [],
      narrative: 'The Income Approach was not developed for this valuation.',
      warnings: [],
    };
  }

  const methodNames: Record<string, string> = {
    direct_capitalization: 'Direct Capitalization',
    yield_capitalization: 'Yield Capitalization',
    gross_rent_multiplier: 'Gross Rent Multiplier',
  };

  const tables: ApproachSection['tables'] = [];

  // Income summary table
  const summaryRows: Array<[string, string | number]> = [
    ['Method', methodNames[income.method] ?? income.method],
    ['Indicated Value', formatCurrency(income.indicatedValue)],
  ];

  if (income.netOperatingIncome !== undefined) {
    summaryRows.push(['Net Operating Income (NOI)', formatCurrency(income.netOperatingIncome)]);
  }
  if (income.capitalizationRate !== undefined) {
    summaryRows.push(['Capitalization Rate', formatPercent(income.capitalizationRate)]);
  }
  if (income.grossRentMultiplier !== undefined) {
    summaryRows.push(['Gross Rent Multiplier', income.grossRentMultiplier.toFixed(2)]);
  }
  summaryRows.push(['Confidence', income.confidenceLevel ?? 'medium']);

  tables.push({
    name: 'Income Approach Summary',
    headers: ['Metric', 'Value'],
    rows: summaryRows,
  });

  // Sensitivity analysis table
  if (
    income.sensitivityAnalysis &&
    (income.sensitivityAnalysis.capRateMinus50bp || income.sensitivityAnalysis.capRatePlus50bp)
  ) {
    tables.push({
      name: 'Sensitivity Analysis',
      headers: ['Scenario', 'Value'],
      rows: [
        [
          'Cap Rate -50bp',
          income.sensitivityAnalysis.capRateMinus50bp
            ? formatCurrency(income.sensitivityAnalysis.capRateMinus50bp)
            : 'N/A',
        ],
        [
          'Cap Rate +50bp',
          income.sensitivityAnalysis.capRatePlus50bp
            ? formatCurrency(income.sensitivityAnalysis.capRatePlus50bp)
            : 'N/A',
        ],
      ],
    });
  }

  const narrative =
    `The Income Approach using ${methodNames[income.method] ?? income.method} ` +
    `yielded an indicated value of ${formatCurrency(income.indicatedValue)}.`;

  return {
    title: 'Income Approach',
    developed: true,
    indicatedValue: income.indicatedValue,
    tables,
    narrative,
    warnings: income.warnings ?? [],
  };
}

function buildCostSection(input: DefensePacketInput): ApproachSection {
  const cost = input.costApproach;

  if (!cost) {
    // For residential properties, use the basic valuation components if available
    // This allows the existing golden workflow to continue working
    return {
      title: 'Cost Approach',
      developed: false,
      indicatedValue: null,
      notDevelopedReason: 'Not Developed - Cost approach data not provided.',
      tables: [],
      narrative: 'The Cost Approach was not developed for this valuation.',
      warnings: [],
    };
  }

  const tables: ApproachSection['tables'] = [];

  // Cost breakdown table
  const breakdownRows: Array<[string, string | number]> = [
    ['Land Value', formatCurrency(cost.landValue)],
  ];

  if (cost.replacementCostNew !== undefined) {
    breakdownRows.push(['Replacement Cost New (RCN)', formatCurrency(cost.replacementCostNew)]);
  }
  if (cost.totalDepreciation !== undefined) {
    breakdownRows.push(['Less: Total Depreciation', formatCurrency(cost.totalDepreciation)]);
  }
  breakdownRows.push(['Building Value (RCNLD)', formatCurrency(cost.buildingValue)]);
  breakdownRows.push(['Total Indicated Value', formatCurrency(cost.indicatedValue)]);

  tables.push({
    name: 'Cost Approach Summary',
    headers: ['Component', 'Value'],
    rows: breakdownRows,
  });

  // Depreciation breakdown
  if (cost.depreciationBreakdown) {
    const deprecRows: Array<[string, string | number]> = [];
    if (cost.depreciationBreakdown.physical !== undefined) {
      deprecRows.push([
        'Physical Depreciation',
        formatCurrency(cost.depreciationBreakdown.physical),
      ]);
    }
    if (cost.depreciationBreakdown.functional !== undefined) {
      deprecRows.push([
        'Functional Obsolescence',
        formatCurrency(cost.depreciationBreakdown.functional),
      ]);
    }
    if (cost.depreciationBreakdown.external !== undefined) {
      deprecRows.push([
        'External Obsolescence',
        formatCurrency(cost.depreciationBreakdown.external),
      ]);
    }
    if (deprecRows.length > 0) {
      tables.push({
        name: 'Depreciation Breakdown',
        headers: ['Type', 'Amount'],
        rows: deprecRows,
      });
    }
  }

  const narrative =
    `The Cost Approach yielded an indicated value of ${formatCurrency(cost.indicatedValue)}, ` +
    `comprising land value of ${formatCurrency(cost.landValue)} ` +
    `and depreciated improvement value of ${formatCurrency(cost.buildingValue)}.`;

  return {
    title: 'Cost Approach',
    developed: true,
    indicatedValue: cost.indicatedValue,
    tables,
    narrative,
    warnings: cost.warnings ?? [],
  };
}

function buildReconciliationSection(input: DefensePacketInput): ReconciliationSection {
  const recon = input.reconciliation;

  // Default weights if not provided
  const weights = recon?.weights ?? {};
  const method = recon?.method ?? 'weighted_average';
  const confidenceLevel = recon?.confidenceLevel ?? 'medium';

  // Build approach list for conclusion
  const approachValues: string[] = [];
  if (input.salesApproach) {
    approachValues.push(`Sales: ${formatCurrency(input.salesApproach.indicatedValue)}`);
  }
  if (input.incomeApproach) {
    approachValues.push(`Income: ${formatCurrency(input.incomeApproach.indicatedValue)}`);
  }
  if (input.costApproach) {
    approachValues.push(`Cost: ${formatCurrency(input.costApproach.indicatedValue)}`);
  }

  const conclusion =
    `Based on the ${method.replace(/_/g, ' ')} of ${approachValues.length > 0 ? approachValues.join(', ') : 'available approaches'}, ` +
    `the final opinion of value is ${formatCurrency(input.finalValue)}.`;

  const rationale =
    recon?.rationale ??
    `The final value was reconciled using the ${method.replace(/_/g, ' ')} method. ` +
      (recon?.primaryApproach
        ? `Primary reliance was placed on the ${recon.primaryApproach} approach.`
        : 'All applicable approaches were considered in reaching the final value opinion.');

  return {
    title: 'Reconciliation & Final Value Opinion',
    finalValue: input.finalValue,
    method,
    weights,
    conclusion,
    rationale,
    confidenceLevel,
  };
}

function buildExhibitsSection(input: DefensePacketInput): ExhibitsSection {
  const auditEventIds: string[] = [
    ...(input.reconciliation?.auditTrailPointers ?? []),
    ...(input.diagnostics?.auditEventIds ?? []),
  ];

  const modelInputs: Record<string, unknown> = {
    subjectId: input.subjectId,
    effectiveDate: input.effectiveDate,
    propertyType: input.propertyType ?? 'residential',
    pipelineVersion: input.diagnostics?.pipelineVersion,
    calculationMode: input.diagnostics?.calculationMode,
  };

  const calculationSummary: Record<string, unknown> = {
    finalValue: input.finalValue,
    salePrice: input.salePrice,
    salesApproachDeveloped: !!input.salesApproach,
    incomeApproachDeveloped: !!input.incomeApproach,
    costApproachDeveloped: !!input.costApproach,
  };

  if (input.salesApproach) {
    calculationSummary.salesIndicatedValue = input.salesApproach.indicatedValue;
  }
  if (input.incomeApproach) {
    calculationSummary.incomeIndicatedValue = input.incomeApproach.indicatedValue;
  }
  if (input.costApproach) {
    calculationSummary.costIndicatedValue = input.costApproach.indicatedValue;
  }

  return {
    title: 'Exhibits & Audit References',
    auditEventIds,
    modelInputs,
    calculationSummary,
    attachments: [],
  };
}

/* ============================================================================
 * Main Composer Function
 * ============================================================================ */

/**
 * Compose a defense packet from approach results
 */
export function composeDefensePacket(input: DefensePacketInput): DefensePacketComposerResult {
  // Validate required fields
  if (!input.subjectId || !input.effectiveDate) {
    throw new Error('subjectId and effectiveDate are required');
  }
  if (input.finalValue === undefined || input.salePrice === undefined) {
    throw new Error('finalValue and salePrice are required');
  }

  // Calculate ratio
  const ratio = input.salePrice > 0 ? roundTo(input.finalValue / input.salePrice, 2) : 0;
  const status = determineStatus(ratio);

  // Build all sections
  const sections = {
    A_subject: buildSubjectSection(input),
    B_sales: buildSalesSection(input),
    B2_cost: buildCostSection(input),
    C_income: buildIncomeSection(input),
    D_reconciliation: buildReconciliationSection(input),
    E_exhibits: buildExhibitsSection(input),
  };

  // Collect all warnings
  const warnings: string[] = [
    ...(input.salesApproach?.warnings ?? []),
    ...(input.incomeApproach?.warnings ?? []),
    ...(input.costApproach?.warnings ?? []),
  ];

  // Generate summary
  const approachesUsed: string[] = [];
  if (input.salesApproach) approachesUsed.push('Sales');
  if (input.incomeApproach) approachesUsed.push('Income');
  if (input.costApproach) approachesUsed.push('Cost');

  const summary =
    `Valuation of ${formatCurrency(input.finalValue)} vs Sale ${formatCurrency(input.salePrice)}. ` +
    `Ratio: ${ratio.toFixed(2)}. Status: ${status}. ` +
    `Approaches: ${approachesUsed.length > 0 ? approachesUsed.join(', ') : 'None'}.`;

  const generatedAt = new Date().toISOString();

  // Calculate deterministic hash
  const packetHash = calculatePacketHash({
    subjectId: input.subjectId,
    effectiveDate: input.effectiveDate,
    finalValue: input.finalValue,
    salePrice: input.salePrice,
    ratio,
    status,
  });

  const output: DefensePacketOutput = {
    subjectId: input.subjectId,
    effectiveDate: input.effectiveDate,
    propertyAddress: input.propertyAddress,
    finalValue: input.finalValue,
    salePrice: input.salePrice,
    ratio,
    status,
    sections,
    summary,
    warnings,
    generatedAt,
    packetHash,
    version: PACKET_VERSION,
  };

  const auditEvent: AuditEvent = {
    type: 'defense_packet_composed',
    timestamp: generatedAt,
    subjectId: input.subjectId,
    details: {
      finalValue: input.finalValue,
      ratio,
      status,
      approachesDeveloped: {
        sales: !!input.salesApproach,
        income: !!input.incomeApproach,
        cost: !!input.costApproach,
      },
      packetHash,
      version: PACKET_VERSION,
    },
  };

  return { output, auditEvent };
}
