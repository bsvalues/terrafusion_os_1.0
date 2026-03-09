/**
 * TerraFusion OS - Tool Handlers (Phase 8.3)
 *
 * Stub executors for Muse-mode tools.
 * These are demonstration handlers that produce realistic outputs
 * for testing the GovernanceLock dashboard.
 *
 * Production implementations would connect to:
 *   - Dossier service (summarize_dossier)
 *   - Valuation model service (explain_model_results)
 *   - Document generation service (draft_appeal_response)
 */

import type { ToolHandler } from './ToolRunner.js';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SummarizeDossierParams {
  dossierId: string;
  focus?: 'appeal' | 'permit' | 'exemption' | 'general';
  length?: 'short' | 'standard' | 'detailed';
}

export interface SummarizeDossierResult {
  dossierId: string;
  summary: string;
  payloadRef: string;
  wordCount: number;
  sections: string[];
}

export interface ExplainModelResultsParams {
  parcelId: string;
  taxYear: number;
  compareToYear?: number;
  audience?: 'internal' | 'taxpayer';
}

export interface ExplainModelResultsResult {
  parcelId: string;
  taxYear: number;
  explanation: string;
  keyDrivers: string[];
  confidenceScore: number;
}

export interface DraftAppealResponseParams {
  parcelId: string;
  appealId: string;
  position?: 'uphold' | 'adjust' | 'partial';
  tone?: 'formal' | 'neutral';
  includeEvidenceRefs?: boolean;
}

export interface DraftAppealResponseResult {
  appealId: string;
  payloadRef: string;
  draftSummary: string;
  wordCount: number;
  position: string;
}

// ============================================================================
// Phase 8.4 Tool Types - Benton County Workflow Tools
// ============================================================================

export interface ExplainSeniorExemptionParams {
  county: string;
  year: number;
  exemptionProgram?: 'senior' | 'disabled' | 'veteran';
  scenario?: { income?: number; age?: number };
  parcelId?: string;
}

export interface ExplainSeniorExemptionResult {
  summary: string;
  assumptions: string[];
  impactBands?: { tier: string; estTaxChange: number }[];
  payloadRef?: string;
}

export interface SummarizeParcelCasefileParams {
  county: string;
  parcelId: string;
  include?: ('notices' | 'appeals' | 'permits' | 'sales')[];
}

export interface SummarizeParcelCasefileResult {
  summary: string;
  highlights: string[];
  payloadRef: string;
}

export interface CompareAssessedValueParams {
  county: string;
  parcelId: string;
  years: number[];
  includeBreakdown?: boolean;
}

export interface CompareAssessedValueResult {
  trend: { year: number; av: number; tv?: number }[];
  narrative: string;
  flags?: string[];
}

export interface SummarizeLevyRateParams {
  county: string;
  taxYear: number;
  districtCode?: string;
}

export interface SummarizeLevyRateResult {
  components: { name: string; rate: number }[];
  totalRate: number;
  explanation: string;
}

export interface ExplainModelInputsParams {
  county: string;
  modelId: string;
  asOfYear: number;
}

export interface ExplainModelInputsResult {
  inputs: { name: string; source: string; pii: boolean }[];
  summary: string;
}

export interface DraftValueChangeNoticeParams {
  county: string;
  parcelId: string;
  taxYear: number;
  reasonCodes: string[];
  tone?: 'neutral' | 'friendly';
}

export interface DraftValueChangeNoticeResult {
  document: { title: string; body: string };
  payloadRef: string;
  disclaimer: string;
}

export interface DraftBoeAppealResponseParams {
  county: string;
  caseId: string;
  position: 'support_assessor' | 'support_taxpayer' | 'balanced';
  points: string[];
}

export interface DraftBoeAppealResponseResult {
  document: { title: string; body: string };
  payloadRef: string;
  citations?: string[];
}

export interface SummarizeSalesCompsParams {
  county: string;
  subjectId: string;
  compIds: string[];
  adjustments?: boolean;
}

export interface SummarizeSalesCompsResult {
  rationale: string;
  comps: { id: string; similarity: number; notes: string[] }[];
}

export interface SearchTraceByCorrelationParams {
  county: string;
  correlationId: string;
  limit?: number;
}

export interface SearchTraceByCorrelationResult {
  events: { ts: number; type: string; toolId?: string }[];
  found: boolean;
}

export interface AddDossierNoteParams {
  county: string;
  parcelId: string;
  note: string;
  tags?: string[];
  noteId?: string;
}

export interface AddDossierNoteResult {
  noteId: string;
  appended: true;
  payloadRef: string;
}

// ============================================================================
// Phase C2: Write-Lane Governance Tool Types
// ============================================================================

export interface AssembleBoePacketParams {
  county: string;
  caseId: string;
  include?: ('evidence' | 'valuation_history' | 'comps')[];
}

export interface AssembleBoePacketResult {
  caseId: string;
  packetRef: string;
  sections: string[];
  payloadRef: string;
}

export interface RequestTraceRedactionParams {
  county: string;
  traceEventIds: string[];
  reason: string;
}

export interface RequestTraceRedactionResult {
  redactionTicketId: string;
  status: 'pending_review';
  eventsMarked: number;
  payloadRef: string;
}

// ============================================================================
// Wave 3 Tool Types — PILT + Income Valuation
// ============================================================================

export interface CalculatePiltPaymentParams {
  county: string;
  fiscalYear: number;
}

export interface CalculatePiltPaymentResult {
  county: string;
  fiscalYear: number;
  totalAssessedValue: number;
  totalPiltDue: number;
  districtCount: number;
  summary: string;
}

export interface RunIncomeValuationParams {
  county: string;
  annualRentalIncome: number;
  vacancyRate?: number;
  capRate?: number;
  propertyType?: 'residential' | 'commercial' | 'industrial' | 'mixed';
  location?: string;
}

export interface RunIncomeValuationResult {
  netOperatingIncome: number;
  capRate: number;
  valuation: number;
  grossIncomeMultiplier: number;
  riskClassification: string;
  source: string;
}

// ============================================================================
// Handler Implementations
// ============================================================================

/**
 * Summarize Dossier - Muse/read_only/payload_ref
 *
 * Generates an executive summary of a case file/dossier.
 * Full output stored as payloadRef; trace records only summary.
 */
export const summarizeDossierHandler: ToolHandler<
  SummarizeDossierParams,
  SummarizeDossierResult
> = async (params, context, _tool) => {
  const { dossierId, focus = 'general', length = 'standard' } = params;

  // Stub: Generate realistic summary based on focus
  const focusSummaries: Record<string, string> = {
    appeal: `Appeal case summary for dossier ${dossierId}. Key issues: valuation dispute, comparable sales analysis, and physical inspection findings. Recommended position: uphold with minor adjustment.`,
    permit: `Permit application summary for dossier ${dossierId}. Type: new construction. Status: under review. Key observations: setback compliance verified, environmental clearance pending.`,
    exemption: `Exemption review summary for dossier ${dossierId}. Type: senior citizen exemption. Eligibility: meets age and income requirements. Documentation: complete.`,
    general: `Executive summary for dossier ${dossierId}. Property: residential single-family. Last assessment: 2025. Current status: active. Key notes: no pending appeals, standard maintenance schedule.`,
  };

  const summary = focusSummaries[focus] || focusSummaries.general;
  const wordCount = length === 'short' ? 50 : length === 'detailed' ? 200 : 100;

  // Payload would be stored in dossier store; this is the reference
  const payloadRef = `dossier://${context.countyId}/${dossierId}/summaries/${Date.now()}`;

  return {
    dossierId,
    summary,
    payloadRef,
    wordCount,
    sections: ['overview', 'findings', 'recommendations'],
  };
};

/**
 * Explain Model Results - Muse/read_only/sanitize
 *
 * Generates plain-language explanation of valuation model outputs.
 * Trace stores summary only; all text sanitized.
 */
export const explainModelResultsHandler: ToolHandler<
  ExplainModelResultsParams,
  ExplainModelResultsResult
> = async (params, _context, _tool) => {
  const { parcelId, taxYear, compareToYear, audience = 'internal' } = params;

  // Stub: Generate realistic explanation
  const audiencePrefix =
    audience === 'taxpayer' ? 'Your property valuation' : 'Valuation analysis for internal review:';

  const explanation = `${audiencePrefix} The ${taxYear} assessed value reflects current market conditions. Key factors include: comparable sales within 0.5 miles (3 transactions), property size and condition adjustments, and local market trends showing +4.2% appreciation.${
    compareToYear
      ? ` Compared to ${compareToYear}, the primary driver of change is increased comparable sale prices in the neighborhood.`
      : ''
  }`;

  return {
    parcelId,
    taxYear,
    explanation,
    keyDrivers: [
      'comparable_sales',
      'market_appreciation',
      'property_condition',
      'location_factor',
    ],
    confidenceScore: 0.87,
  };
};

/**
 * Draft Appeal Response - Muse/write_low/payload_ref
 *
 * Drafts an appeal response letter for assessor review.
 * Full draft stored as payloadRef; trace records only summary.
 */
export const draftAppealResponseHandler: ToolHandler<
  DraftAppealResponseParams,
  DraftAppealResponseResult
> = async (params, context, _tool) => {
  const {
    parcelId,
    appealId,
    position = 'uphold',
    tone = 'formal',
    includeEvidenceRefs = true,
  } = params;

  // Stub: Generate draft summary based on position
  const positionTexts: Record<string, string> = {
    uphold: `After careful review of the appeal for parcel ${parcelId}, we recommend upholding the current assessed value. The analysis supports the valuation methodology and comparable sales data.`,
    adjust: `After careful review of the appeal for parcel ${parcelId}, we recommend adjusting the assessed value. The appellant has provided compelling evidence of over-assessment.`,
    partial: `After careful review of the appeal for parcel ${parcelId}, we recommend a partial adjustment. While the overall methodology is sound, certain comparable adjustments warrant revision.`,
  };

  const draftSummary = positionTexts[position];
  const wordCount = tone === 'formal' ? 450 : 350;

  // Payload would be stored in dossier store
  const payloadRef = `dossier://${context.countyId}/appeals/${appealId}/drafts/${Date.now()}`;

  return {
    appealId,
    payloadRef,
    draftSummary,
    wordCount,
    position,
  };
};

// ============================================================================
// Phase 8.4 Handler Implementations - Benton County Workflow Tools
// ============================================================================

function normalizeCounty(value: string): string {
  return value.trim().toLowerCase();
}

function assertCountyMatch(paramCounty: string | undefined, contextCounty: string): void {
  if (!paramCounty) {
    throw new Error('county is required');
  }
  if (normalizeCounty(paramCounty) !== normalizeCounty(contextCounty)) {
    throw new Error('County mismatch');
  }
}

function stableHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function buildPayloadRef(prefix: string, seed: string): string {
  return `${prefix}/${stableHash(seed)}`;
}

function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function sanitizeNoteText(note: string): string {
  const withoutScripts = note.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  return withoutScripts.replace(/<[^>]*>/g, '').trim();
}

/**
 * Explain Senior/Disabled Exemption Impact - Muse/read_only/sanitize
 */
export const explainSeniorExemptionHandler: ToolHandler<
  ExplainSeniorExemptionParams,
  ExplainSeniorExemptionResult
> = async (params, _context, _tool) => {
  const { county, year, exemptionProgram = 'senior', parcelId } = params;
  assertCountyMatch(county, _context.countyId);

  const programLabels: Record<string, string> = {
    senior: 'Senior exemption',
    disabled: 'Disability exemption',
    veteran: 'Veteran exemption',
  };

  const assumptions = [
    `Tax year ${year}`,
    parcelId ? `Parcel ${parcelId} provided` : 'Parcel not provided',
    'Public-rate estimate only',
  ];

  const impactBands = [
    { tier: 'Base', estTaxChange: -180 },
    { tier: 'Moderate', estTaxChange: -320 },
    { tier: 'High', estTaxChange: -520 },
  ];

  return {
    summary: `${programLabels[exemptionProgram]} impact is estimated using public levy rates and standard exemption bands. Exact savings vary by levy district.`,
    assumptions,
    impactBands,
  };
};

/**
 * Summarize Parcel Casefile - Muse/read_only/payload_ref
 */
export const summarizeParcelCasefileHandler: ToolHandler<
  SummarizeParcelCasefileParams,
  SummarizeParcelCasefileResult
> = async (params, context, _tool) => {
  const { county, parcelId, include = [] } = params;
  assertCountyMatch(county, context.countyId);

  const includeSet = new Set(include);
  const highlights = [
    includeSet.has('appeals') ? 'Appeals: 2 resolved' : 'Appeals: none requested',
    includeSet.has('permits') ? 'Permits: 1 closed' : 'Permits: none recorded',
    includeSet.has('sales') ? 'Sales: 1 in-window' : 'Sales: none in-window',
    includeSet.has('notices') ? 'Notices: 1 issued' : 'Notices: none issued',
  ];

  const summary = `Casefile for parcel ${parcelId} includes ${include.length || 0} selected sections. Highlights are summarized without personal identifiers.`;

  return {
    summary,
    highlights,
    payloadRef: buildPayloadRef(
      `dossier://${context.countyId}/parcels/${parcelId}/casefile`,
      `${context.countyId}:${parcelId}:${include.sort().join(',')}`
    ),
  };
};

/**
 * Compare Assessed Value History - Muse/read_only/sanitize
 */
export const compareAssessedValueHandler: ToolHandler<
  CompareAssessedValueParams,
  CompareAssessedValueResult
> = async (params, _context, _tool) => {
  const { county, years, includeBreakdown = false } = params;
  assertCountyMatch(county, _context.countyId);

  const sortedYears = [...years].sort((a, b) => a - b);
  const base = 250000;
  const trend = sortedYears.map((year, index) => {
    const av = base + index * 5000;
    const tv = includeBreakdown ? av - 40000 : undefined;
    return { year, av, tv };
  });

  const narrative = `Assessed value trend shows ${trend.length} year(s) with a consistent step-up pattern. Changes are attributed to market appreciation and periodic revaluation.`;
  const flags = includeBreakdown ? ['breakdown_included'] : undefined;

  return { trend, narrative, flags };
};

/**
 * Summarize Levy Rate Components - Muse/read_only/sanitize
 */
export const summarizeLevyRateHandler: ToolHandler<
  SummarizeLevyRateParams,
  SummarizeLevyRateResult
> = async (params, _context, _tool) => {
  const { county, taxYear, districtCode } = params;
  assertCountyMatch(county, _context.countyId);

  const components = [
    { name: 'Local School', rate: 3.12 },
    { name: 'State School', rate: 2.45 },
    { name: 'County General', rate: 1.85 },
    { name: 'Fire District', rate: 1.2 },
    { name: 'Road District', rate: 0.75 },
    { name: 'Library', rate: 0.45 },
  ].sort((a, b) => b.rate - a.rate);

  const totalRate = roundTo(components.reduce((sum, c) => sum + c.rate, 0), 2);
  const scopeNote = districtCode ? ` District ${districtCode} applied.` : '';

  return {
    components,
    totalRate,
    explanation: `Levy components for ${taxYear} total $${totalRate.toFixed(2)} per $1,000 assessed value.${scopeNote}`,
  };
};

/**
 * Explain Valuation Model Inputs - Muse/read_only/sanitize
 */
export const explainModelInputsHandler: ToolHandler<
  ExplainModelInputsParams,
  ExplainModelInputsResult
> = async (params, _context, _tool) => {
  const { county, modelId, asOfYear } = params;
  assertCountyMatch(county, _context.countyId);

  const inputs = [
    { name: 'condition', source: 'inspection', pii: false },
    { name: 'effective_age', source: 'records', pii: false },
    { name: 'location_factor', source: 'geospatial', pii: false },
    { name: 'owner_name', source: 'title', pii: true },
    { name: 'sale_comps', source: 'market', pii: false },
  ].sort((a, b) => a.name.localeCompare(b.name));

  return {
    inputs,
    summary: `Model ${modelId} inputs as of ${asOfYear} emphasize location, condition, and market comps. PII fields are flagged but never exposed.`,
  };
};

/**
 * Draft Value Change Notice - Muse/write_low/payload_ref
 */
export const draftValueChangeNoticeHandler: ToolHandler<
  DraftValueChangeNoticeParams,
  DraftValueChangeNoticeResult
> = async (params, context, _tool) => {
  const { county, parcelId, taxYear, reasonCodes, tone = 'neutral' } = params;
  assertCountyMatch(county, context.countyId);

  const title = `Notice of Value Change — ${taxYear}`;
  const toneLine =
    tone === 'friendly'
      ? 'We are here to help if you have questions about your assessment.'
      : 'This notice provides information about your assessment change.';

  const body = [
    'Reason:',
    `- ${reasonCodes.join(', ') || 'General revaluation'}`,
    'Appeal Rights:',
    '- You may request a review within the statutory window.',
    'Dates:',
    '- [MAIL DATE]',
    '- [APPEAL DEADLINE]',
    toneLine,
    'This notice uses placeholders for personal information.',
  ].join('\n');

  return {
    document: { title, body },
    payloadRef: buildPayloadRef(
      `dossier://${context.countyId}/notices/${parcelId}/${taxYear}`,
      `${context.countyId}:${parcelId}:${taxYear}:${reasonCodes.sort().join(',')}:${tone}`
    ),
    disclaimer: 'Draft for internal review only. Not a final notice.',
  };
};

/**
 * Draft BOE Appeal Response - Muse/write_low/payload_ref
 */
export const draftBoeAppealResponseHandler: ToolHandler<
  DraftBoeAppealResponseParams,
  DraftBoeAppealResponseResult
> = async (params, context, _tool) => {
  const { county, caseId, position, points } = params;
  assertCountyMatch(county, context.countyId);

  const positionLine: Record<string, string> = {
    support_assessor: 'Position: support assessor.',
    support_taxpayer: 'Position: support taxpayer.',
    balanced: 'Position: balanced review.',
  };

  const title = `BOE Appeal Response — Case ${caseId}`;
  const body = [
    positionLine[position],
    'Summary of Points:',
    ...points.map(p => `- ${p}`),
    'Recommendation:',
    position === 'support_assessor'
      ? 'Uphold current value based on comparable analysis.'
      : position === 'support_taxpayer'
        ? 'Adjust value based on taxpayer evidence.'
        : 'Consider partial adjustment where supported.',
    'No personal identifiers included.',
  ].join('\n');

  return {
    document: { title, body },
    payloadRef: buildPayloadRef(
      `dossier://${context.countyId}/boe/${caseId}/response`,
      `${context.countyId}:${caseId}:${position}:${points.join('|')}`
    ),
    citations: ['RCW-84.40', 'WAC-458-07'],
  };
};

/**
 * Summarize Sales/Comps Rationale - Muse/read_only/sanitize
 */
export const summarizeSalesCompsHandler: ToolHandler<
  SummarizeSalesCompsParams,
  SummarizeSalesCompsResult
> = async (params, _context, _tool) => {
  const { county, subjectId, compIds, adjustments = false } = params;
  assertCountyMatch(county, _context.countyId);

  const comps = compIds.map((id, index) => ({
    id,
    similarity: roundTo(0.92 - index * 0.04, 2),
    notes: adjustments ? ['time', 'size', 'quality'] : ['baseline'],
  }));

  comps.sort((a, b) => b.similarity - a.similarity);

  return {
    rationale: `Subject ${subjectId} comps were selected using similarity scoring and recent sale windows. Adjustments ${
      adjustments ? 'were applied' : 'were not applied'
    } and are summarized without addresses.`,
    comps,
  };
};

/**
 * Search Trace By Correlation - Pilot/read_only/none
 */
export const searchTraceByCorrelationHandler: ToolHandler<
  SearchTraceByCorrelationParams,
  SearchTraceByCorrelationResult
> = async (params, _context, _tool) => {
  const { county, correlationId, limit = 100 } = params;
  assertCountyMatch(county, _context.countyId);

  const baseTs = 1700000000000 + parseInt(stableHash(correlationId).slice(0, 4), 16);
  const events = [
    { ts: baseTs, type: 'tool_invoked' },
    { ts: baseTs + 15, type: 'tool_completed' },
  ].slice(0, Math.max(0, Math.min(limit, 2)));

  return {
    events,
    found: events.length > 0,
  };
};

/**
 * Add Dossier Note - Pilot/write_low/payload_ref
 */
export const addDossierNoteHandler: ToolHandler<
  AddDossierNoteParams,
  AddDossierNoteResult
> = async (params, context, _tool) => {
  const { county, parcelId, note, noteId, tags = [] } = params;
  assertCountyMatch(county, context.countyId);

  if (noteId) {
    throw new Error('Append-only notes cannot overwrite existing entries');
  }

  if (note.length > 1000) {
    throw new Error('Note exceeds maximum length');
  }

  const sanitized = sanitizeNoteText(note);
  if (!sanitized) {
    throw new Error('Note is empty after sanitization');
  }

  const derivedId = `note-${stableHash(`${parcelId}:${sanitized}:${tags.sort().join(',')}`)}`;

  return {
    noteId: derivedId,
    appended: true,
    payloadRef: buildPayloadRef(
      `dossier://${context.countyId}/parcels/${parcelId}/notes`,
      `${context.countyId}:${parcelId}:${sanitized}:${tags.sort().join(',')}`
    ),
  };
};

// ============================================================================
// Phase C2: Write-Lane Governance Handlers
// ============================================================================

/**
 * Assemble BOE Packet - Pilot/write_high/payload_ref
 * Requires confirmation + reasonCode.
 */
export const assembleBoePacketHandler: ToolHandler<
  AssembleBoePacketParams,
  AssembleBoePacketResult
> = async (params, context, _tool) => {
  const { county, caseId, include = [] } = params;
  assertCountyMatch(county, context.countyId);

  const sections = [
    'cover_sheet',
    ...include.map(i => `section_${i}`),
    'certification',
  ];

  const packetRef = buildPayloadRef(
    `dossier://${context.countyId}/boe/${caseId}/packet`,
    `${context.countyId}:${caseId}:${include.sort().join(',')}`
  );

  return {
    caseId,
    packetRef,
    sections,
    payloadRef: packetRef,
  };
};

/**
 * Request Trace Redaction - Pilot/irreversible/payload_ref
 * Requires confirmation + reasonCode + supervisorApproval.
 */
export const requestTraceRedactionHandler: ToolHandler<
  RequestTraceRedactionParams,
  RequestTraceRedactionResult
> = async (params, context, _tool) => {
  const { county, traceEventIds, reason } = params;
  assertCountyMatch(county, context.countyId);

  if (!traceEventIds || traceEventIds.length === 0) {
    throw new Error('At least one trace event ID is required');
  }

  const ticketId = `redact-${stableHash(`${context.countyId}:${traceEventIds.join(',')}:${reason}`)}`;

  return {
    redactionTicketId: ticketId,
    status: 'pending_review',
    eventsMarked: traceEventIds.length,
    payloadRef: buildPayloadRef(
      `secure-blob://${context.countyId}/redaction/${ticketId}`,
      `${context.countyId}:${ticketId}`
    ),
  };
};

/**
 * Calculate PILT Payment - Pilot/read_only
 * Returns PILT district distribution for Benton County federal lands.
 */
export const calculatePiltPaymentHandler: ToolHandler<
  CalculatePiltPaymentParams,
  CalculatePiltPaymentResult
> = async (params, context, _tool) => {
  const { county, fiscalYear } = params;
  assertCountyMatch(county, context.countyId);

  // Canned Benton County PILT data (Hanford Nuclear Reservation)
  const totalAssessedValue = 1_247_500_000;
  const totalPiltDue = 12_891_450;
  const districtCount = 12;

  return {
    county: county.toUpperCase(),
    fiscalYear,
    totalAssessedValue,
    totalPiltDue,
    districtCount,
    summary: `PILT calculation for FY${fiscalYear}: ${districtCount} districts, $${totalPiltDue.toLocaleString()} total due on $${totalAssessedValue.toLocaleString()} assessed value (Hanford Nuclear Reservation, 586,000 federal acres).`,
  };
};

/**
 * Run Income Valuation - Pilot/read_only
 * Calculates property value using income capitalization approach.
 */
export const runIncomeValuationHandler: ToolHandler<
  RunIncomeValuationParams,
  RunIncomeValuationResult
> = async (params, context, _tool) => {
  const { county, annualRentalIncome, vacancyRate = 5, capRate = 7.5, propertyType = 'commercial' } = params;
  assertCountyMatch(county, context.countyId);

  const effectiveGrossIncome = annualRentalIncome * (1 - vacancyRate / 100);
  const totalExpenses = effectiveGrossIncome * 0.35; // canned 35% expense ratio
  const noi = effectiveGrossIncome - totalExpenses;
  const valuation = noi / (capRate / 100);
  const gim = effectiveGrossIncome > 0 ? valuation / effectiveGrossIncome : 0;

  return {
    netOperatingIncome: Math.round(noi * 100) / 100,
    capRate,
    valuation: Math.round(valuation * 100) / 100,
    grossIncomeMultiplier: Math.round(gim * 100) / 100,
    riskClassification: capRate > 7 ? 'low' : capRate < 4 ? 'high' : 'medium',
    source: `Canned income approach for ${propertyType} property in ${county}`,
  };
};

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * Register all Phase 8.3 tool handlers with a ToolRunner instance.
 */
export function registerPhase83Handlers(runner: {
  registerHandler: <P, R>(toolId: string, handler: ToolHandler<P, R>) => void;
}): void {
  runner.registerHandler('summarize_dossier', summarizeDossierHandler);
  runner.registerHandler('explain_model_results', explainModelResultsHandler);
  runner.registerHandler('draft_appeal_response', draftAppealResponseHandler);
}

/**
 * Register all Phase 8.4 tool handlers with a ToolRunner instance.
 */
export function registerPhase84Handlers(runner: {
  registerHandler: <P, R>(toolId: string, handler: ToolHandler<P, R>) => void;
}): void {
  runner.registerHandler('explain_senior_exemption_impact', explainSeniorExemptionHandler);
  runner.registerHandler('summarize_parcel_casefile', summarizeParcelCasefileHandler);
  runner.registerHandler('compare_assessed_value_history', compareAssessedValueHandler);
  runner.registerHandler('summarize_levy_rate_components', summarizeLevyRateHandler);
  runner.registerHandler('explain_model_inputs', explainModelInputsHandler);
  runner.registerHandler('draft_value_change_notice', draftValueChangeNoticeHandler);
  runner.registerHandler('draft_boe_appeal_response', draftBoeAppealResponseHandler);
  runner.registerHandler('summarize_sales_comps_rationale', summarizeSalesCompsHandler);
  runner.registerHandler('search_trace_by_correlation', searchTraceByCorrelationHandler);
  runner.registerHandler('add_dossier_note', addDossierNoteHandler);
}

/**
 * Register C2 write-lane governance handlers (write_high + irreversible).
 */
export function registerWriteGateHandlers(runner: {
  registerHandler: <P, R>(toolId: string, handler: ToolHandler<P, R>) => void;
}): void {
  runner.registerHandler('assemble_boe_packet', assembleBoePacketHandler);
  runner.registerHandler('request_trace_redaction', requestTraceRedactionHandler);
}

/**
 * Register all tool handlers (Phase 8.3 + 8.4 + C2 + Wave 3).
 */
export function registerAllHandlers(runner: {
  registerHandler: <P, R>(toolId: string, handler: ToolHandler<P, R>) => void;
}): void {
  registerPhase83Handlers(runner);
  registerPhase84Handlers(runner);
  registerWriteGateHandlers(runner);
  registerWave3Handlers(runner);
}

/**
 * Register Wave 3 tool handlers (PILT + Income Valuation).
 */
export function registerWave3Handlers(runner: {
  registerHandler: <P, R>(toolId: string, handler: ToolHandler<P, R>) => void;
}): void {
  runner.registerHandler('calculate_pilt_payment', calculatePiltPaymentHandler);
  runner.registerHandler('run_income_valuation', runIncomeValuationHandler);
}

/**
 * Map of all Phase 8.3 handlers for direct access.
 */
export const phase83Handlers = {
  summarize_dossier: summarizeDossierHandler,
  explain_model_results: explainModelResultsHandler,
  draft_appeal_response: draftAppealResponseHandler,
} as const;

/**
 * Map of all Phase 8.4 handlers for direct access.
 */
export const phase84Handlers = {
  explain_senior_exemption_impact: explainSeniorExemptionHandler,
  summarize_parcel_casefile: summarizeParcelCasefileHandler,
  compare_assessed_value_history: compareAssessedValueHandler,
  summarize_levy_rate_components: summarizeLevyRateHandler,
  explain_model_inputs: explainModelInputsHandler,
  draft_value_change_notice: draftValueChangeNoticeHandler,
  draft_boe_appeal_response: draftBoeAppealResponseHandler,
  summarize_sales_comps_rationale: summarizeSalesCompsHandler,
  search_trace_by_correlation: searchTraceByCorrelationHandler,
  add_dossier_note: addDossierNoteHandler,
} as const;

/**
 * Map of C2 write-lane governance handlers for direct access.
 */
export const writeGateHandlers = {
  assemble_boe_packet: assembleBoePacketHandler,
  request_trace_redaction: requestTraceRedactionHandler,
} as const;

/**
 * Map of Wave 3 handlers for direct access.
 */
export const wave3Handlers = {
  calculate_pilt_payment: calculatePiltPaymentHandler,
  run_income_valuation: runIncomeValuationHandler,
} as const;
