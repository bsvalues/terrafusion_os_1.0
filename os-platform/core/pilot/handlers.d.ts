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
export interface ExplainSeniorExemptionParams {
    county: string;
    year: number;
    exemptionProgram?: 'senior' | 'disabled' | 'veteran';
    scenario?: {
        income?: number;
        age?: number;
    };
    parcelId?: string;
}
export interface ExplainSeniorExemptionResult {
    summary: string;
    assumptions: string[];
    impactBands?: {
        tier: string;
        estTaxChange: number;
    }[];
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
    trend: {
        year: number;
        av: number;
        tv?: number;
    }[];
    narrative: string;
    flags?: string[];
}
export interface SummarizeLevyRateParams {
    county: string;
    taxYear: number;
    districtCode?: string;
}
export interface SummarizeLevyRateResult {
    components: {
        name: string;
        rate: number;
    }[];
    totalRate: number;
    explanation: string;
}
export interface ExplainModelInputsParams {
    county: string;
    modelId: string;
    asOfYear: number;
}
export interface ExplainModelInputsResult {
    inputs: {
        name: string;
        source: string;
        pii: boolean;
    }[];
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
    document: {
        title: string;
        body: string;
    };
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
    document: {
        title: string;
        body: string;
    };
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
    comps: {
        id: string;
        similarity: number;
        notes: string[];
    }[];
}
export interface SearchTraceByCorrelationParams {
    county: string;
    correlationId: string;
    limit?: number;
}
export interface SearchTraceByCorrelationResult {
    events: {
        ts: number;
        type: string;
        toolId?: string;
    }[];
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
/**
 * Summarize Dossier - Muse/read_only/payload_ref
 *
 * Generates an executive summary of a case file/dossier.
 * Full output stored as payloadRef; trace records only summary.
 */
export declare const summarizeDossierHandler: ToolHandler<SummarizeDossierParams, SummarizeDossierResult>;
/**
 * Explain Model Results - Muse/read_only/sanitize
 *
 * Generates plain-language explanation of valuation model outputs.
 * Trace stores summary only; all text sanitized.
 */
export declare const explainModelResultsHandler: ToolHandler<ExplainModelResultsParams, ExplainModelResultsResult>;
/**
 * Draft Appeal Response - Muse/write_low/payload_ref
 *
 * Drafts an appeal response letter for assessor review.
 * Full draft stored as payloadRef; trace records only summary.
 */
export declare const draftAppealResponseHandler: ToolHandler<DraftAppealResponseParams, DraftAppealResponseResult>;
/**
 * Explain Senior/Disabled Exemption Impact - Muse/read_only/sanitize
 */
export declare const explainSeniorExemptionHandler: ToolHandler<ExplainSeniorExemptionParams, ExplainSeniorExemptionResult>;
/**
 * Summarize Parcel Casefile - Muse/read_only/payload_ref
 */
export declare const summarizeParcelCasefileHandler: ToolHandler<SummarizeParcelCasefileParams, SummarizeParcelCasefileResult>;
/**
 * Compare Assessed Value History - Muse/read_only/sanitize
 */
export declare const compareAssessedValueHandler: ToolHandler<CompareAssessedValueParams, CompareAssessedValueResult>;
/**
 * Summarize Levy Rate Components - Muse/read_only/sanitize
 */
export declare const summarizeLevyRateHandler: ToolHandler<SummarizeLevyRateParams, SummarizeLevyRateResult>;
/**
 * Explain Valuation Model Inputs - Muse/read_only/sanitize
 */
export declare const explainModelInputsHandler: ToolHandler<ExplainModelInputsParams, ExplainModelInputsResult>;
/**
 * Draft Value Change Notice - Muse/write_low/payload_ref
 */
export declare const draftValueChangeNoticeHandler: ToolHandler<DraftValueChangeNoticeParams, DraftValueChangeNoticeResult>;
/**
 * Draft BOE Appeal Response - Muse/write_low/payload_ref
 */
export declare const draftBoeAppealResponseHandler: ToolHandler<DraftBoeAppealResponseParams, DraftBoeAppealResponseResult>;
/**
 * Summarize Sales/Comps Rationale - Muse/read_only/sanitize
 */
export declare const summarizeSalesCompsHandler: ToolHandler<SummarizeSalesCompsParams, SummarizeSalesCompsResult>;
/**
 * Search Trace By Correlation - Pilot/read_only/none
 */
export declare const searchTraceByCorrelationHandler: ToolHandler<SearchTraceByCorrelationParams, SearchTraceByCorrelationResult>;
/**
 * Add Dossier Note - Pilot/write_low/payload_ref
 */
export declare const addDossierNoteHandler: ToolHandler<AddDossierNoteParams, AddDossierNoteResult>;
/**
 * Register all Phase 8.3 tool handlers with a ToolRunner instance.
 */
export declare function registerPhase83Handlers(runner: {
    registerHandler: <P, R>(toolId: string, handler: ToolHandler<P, R>) => void;
}): void;
/**
 * Register all Phase 8.4 tool handlers with a ToolRunner instance.
 */
export declare function registerPhase84Handlers(runner: {
    registerHandler: <P, R>(toolId: string, handler: ToolHandler<P, R>) => void;
}): void;
/**
 * Register all tool handlers (Phase 8.3 + 8.4).
 */
export declare function registerAllHandlers(runner: {
    registerHandler: <P, R>(toolId: string, handler: ToolHandler<P, R>) => void;
}): void;
/**
 * Map of all Phase 8.3 handlers for direct access.
 */
export declare const phase83Handlers: {
    readonly summarize_dossier: ToolHandler<SummarizeDossierParams, SummarizeDossierResult>;
    readonly explain_model_results: ToolHandler<ExplainModelResultsParams, ExplainModelResultsResult>;
    readonly draft_appeal_response: ToolHandler<DraftAppealResponseParams, DraftAppealResponseResult>;
};
/**
 * Map of all Phase 8.4 handlers for direct access.
 */
export declare const phase84Handlers: {
    readonly explain_senior_exemption_impact: ToolHandler<ExplainSeniorExemptionParams, ExplainSeniorExemptionResult>;
    readonly summarize_parcel_casefile: ToolHandler<SummarizeParcelCasefileParams, SummarizeParcelCasefileResult>;
    readonly compare_assessed_value_history: ToolHandler<CompareAssessedValueParams, CompareAssessedValueResult>;
    readonly summarize_levy_rate_components: ToolHandler<SummarizeLevyRateParams, SummarizeLevyRateResult>;
    readonly explain_model_inputs: ToolHandler<ExplainModelInputsParams, ExplainModelInputsResult>;
    readonly draft_value_change_notice: ToolHandler<DraftValueChangeNoticeParams, DraftValueChangeNoticeResult>;
    readonly draft_boe_appeal_response: ToolHandler<DraftBoeAppealResponseParams, DraftBoeAppealResponseResult>;
    readonly summarize_sales_comps_rationale: ToolHandler<SummarizeSalesCompsParams, SummarizeSalesCompsResult>;
    readonly search_trace_by_correlation: ToolHandler<SearchTraceByCorrelationParams, SearchTraceByCorrelationResult>;
    readonly add_dossier_note: ToolHandler<AddDossierNoteParams, AddDossierNoteResult>;
};
