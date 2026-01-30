// GENERATED - DO NOT EDIT
"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.phase83Handlers = exports.draftAppealResponseHandler = exports.explainModelResultsHandler = exports.summarizeDossierHandler = void 0;
exports.registerPhase83Handlers = registerPhase83Handlers;
// ============================================================================
// Handler Implementations
// ============================================================================
/**
 * Summarize Dossier - Muse/read_only/payload_ref
 *
 * Generates an executive summary of a case file/dossier.
 * Full output stored as payloadRef; trace records only summary.
 */
const summarizeDossierHandler = async (params, context, _tool) => {
    const { dossierId, focus = 'general', length = 'standard' } = params;
    // Stub: Generate realistic summary based on focus
    const focusSummaries = {
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
exports.summarizeDossierHandler = summarizeDossierHandler;
/**
 * Explain Model Results - Muse/read_only/sanitize
 *
 * Generates plain-language explanation of valuation model outputs.
 * Trace stores summary only; all text sanitized.
 */
const explainModelResultsHandler = async (params, _context, _tool) => {
    const { parcelId, taxYear, compareToYear, audience = 'internal' } = params;
    // Stub: Generate realistic explanation
    const audiencePrefix = audience === 'taxpayer' ? 'Your property valuation' : 'Valuation analysis for internal review:';
    const explanation = `${audiencePrefix} The ${taxYear} assessed value reflects current market conditions. Key factors include: comparable sales within 0.5 miles (3 transactions), property size and condition adjustments, and local market trends showing +4.2% appreciation.${compareToYear
        ? ` Compared to ${compareToYear}, the primary driver of change is increased comparable sale prices in the neighborhood.`
        : ''}`;
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
exports.explainModelResultsHandler = explainModelResultsHandler;
/**
 * Draft Appeal Response - Muse/write_low/payload_ref
 *
 * Drafts an appeal response letter for assessor review.
 * Full draft stored as payloadRef; trace records only summary.
 */
const draftAppealResponseHandler = async (params, context, _tool) => {
    const { parcelId, appealId, position = 'uphold', tone = 'formal', includeEvidenceRefs = true, } = params;
    // Stub: Generate draft summary based on position
    const positionTexts = {
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
exports.draftAppealResponseHandler = draftAppealResponseHandler;
// ============================================================================
// Handler Registry
// ============================================================================
/**
 * Register all Phase 8.3 tool handlers with a ToolRunner instance.
 */
function registerPhase83Handlers(runner) {
    runner.registerHandler('summarize_dossier', exports.summarizeDossierHandler);
    runner.registerHandler('explain_model_results', exports.explainModelResultsHandler);
    runner.registerHandler('draft_appeal_response', exports.draftAppealResponseHandler);
}
/**
 * Map of all Phase 8.3 handlers for direct access.
 */
exports.phase83Handlers = {
    summarize_dossier: exports.summarizeDossierHandler,
    explain_model_results: exports.explainModelResultsHandler,
    draft_appeal_response: exports.draftAppealResponseHandler,
};
