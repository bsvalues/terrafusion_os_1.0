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
exports.phase84Handlers = exports.phase83Handlers = exports.addDossierNoteHandler = exports.searchTraceByCorrelationHandler = exports.summarizeSalesCompsHandler = exports.draftBoeAppealResponseHandler = exports.draftValueChangeNoticeHandler = exports.explainModelInputsHandler = exports.summarizeLevyRateHandler = exports.compareAssessedValueHandler = exports.summarizeParcelCasefileHandler = exports.explainSeniorExemptionHandler = exports.draftAppealResponseHandler = exports.explainModelResultsHandler = exports.summarizeDossierHandler = void 0;
exports.registerPhase83Handlers = registerPhase83Handlers;
exports.registerPhase84Handlers = registerPhase84Handlers;
exports.registerAllHandlers = registerAllHandlers;
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
// Phase 8.4 Handler Implementations - Benton County Workflow Tools
// ============================================================================
function normalizeCounty(value) {
    return value.trim().toLowerCase();
}
function assertCountyMatch(paramCounty, contextCounty) {
    if (!paramCounty) {
        throw new Error('county is required');
    }
    if (normalizeCounty(paramCounty) !== normalizeCounty(contextCounty)) {
        throw new Error('County mismatch');
    }
}
function stableHash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}
function buildPayloadRef(prefix, seed) {
    return `${prefix}/${stableHash(seed)}`;
}
function roundTo(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}
function sanitizeNoteText(note) {
    const withoutScripts = note.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    return withoutScripts.replace(/<[^>]*>/g, '').trim();
}
/**
 * Explain Senior/Disabled Exemption Impact - Muse/read_only/sanitize
 */
const explainSeniorExemptionHandler = async (params, _context, _tool) => {
    const { county, year, exemptionProgram = 'senior', parcelId } = params;
    assertCountyMatch(county, _context.countyId);
    const programLabels = {
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
exports.explainSeniorExemptionHandler = explainSeniorExemptionHandler;
/**
 * Summarize Parcel Casefile - Muse/read_only/payload_ref
 */
const summarizeParcelCasefileHandler = async (params, context, _tool) => {
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
        payloadRef: buildPayloadRef(`dossier://${context.countyId}/parcels/${parcelId}/casefile`, `${context.countyId}:${parcelId}:${include.sort().join(',')}`),
    };
};
exports.summarizeParcelCasefileHandler = summarizeParcelCasefileHandler;
/**
 * Compare Assessed Value History - Muse/read_only/sanitize
 */
const compareAssessedValueHandler = async (params, _context, _tool) => {
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
exports.compareAssessedValueHandler = compareAssessedValueHandler;
/**
 * Summarize Levy Rate Components - Muse/read_only/sanitize
 */
const summarizeLevyRateHandler = async (params, _context, _tool) => {
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
exports.summarizeLevyRateHandler = summarizeLevyRateHandler;
/**
 * Explain Valuation Model Inputs - Muse/read_only/sanitize
 */
const explainModelInputsHandler = async (params, _context, _tool) => {
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
exports.explainModelInputsHandler = explainModelInputsHandler;
/**
 * Draft Value Change Notice - Muse/write_low/payload_ref
 */
const draftValueChangeNoticeHandler = async (params, context, _tool) => {
    const { county, parcelId, taxYear, reasonCodes, tone = 'neutral' } = params;
    assertCountyMatch(county, context.countyId);
    const title = `Notice of Value Change — ${taxYear}`;
    const toneLine = tone === 'friendly'
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
        payloadRef: buildPayloadRef(`dossier://${context.countyId}/notices/${parcelId}/${taxYear}`, `${context.countyId}:${parcelId}:${taxYear}:${reasonCodes.sort().join(',')}:${tone}`),
        disclaimer: 'Draft for internal review only. Not a final notice.',
    };
};
exports.draftValueChangeNoticeHandler = draftValueChangeNoticeHandler;
/**
 * Draft BOE Appeal Response - Muse/write_low/payload_ref
 */
const draftBoeAppealResponseHandler = async (params, context, _tool) => {
    const { county, caseId, position, points } = params;
    assertCountyMatch(county, context.countyId);
    const positionLine = {
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
        payloadRef: buildPayloadRef(`dossier://${context.countyId}/boe/${caseId}/response`, `${context.countyId}:${caseId}:${position}:${points.join('|')}`),
        citations: ['RCW-84.40', 'WAC-458-07'],
    };
};
exports.draftBoeAppealResponseHandler = draftBoeAppealResponseHandler;
/**
 * Summarize Sales/Comps Rationale - Muse/read_only/sanitize
 */
const summarizeSalesCompsHandler = async (params, _context, _tool) => {
    const { county, subjectId, compIds, adjustments = false } = params;
    assertCountyMatch(county, _context.countyId);
    const comps = compIds.map((id, index) => ({
        id,
        similarity: roundTo(0.92 - index * 0.04, 2),
        notes: adjustments ? ['time', 'size', 'quality'] : ['baseline'],
    }));
    comps.sort((a, b) => b.similarity - a.similarity);
    return {
        rationale: `Subject ${subjectId} comps were selected using similarity scoring and recent sale windows. Adjustments ${adjustments ? 'were applied' : 'were not applied'} and are summarized without addresses.`,
        comps,
    };
};
exports.summarizeSalesCompsHandler = summarizeSalesCompsHandler;
/**
 * Search Trace By Correlation - Pilot/read_only/none
 */
const searchTraceByCorrelationHandler = async (params, _context, _tool) => {
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
exports.searchTraceByCorrelationHandler = searchTraceByCorrelationHandler;
/**
 * Add Dossier Note - Pilot/write_low/payload_ref
 */
const addDossierNoteHandler = async (params, context, _tool) => {
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
        payloadRef: buildPayloadRef(`dossier://${context.countyId}/parcels/${parcelId}/notes`, `${context.countyId}:${parcelId}:${sanitized}:${tags.sort().join(',')}`),
    };
};
exports.addDossierNoteHandler = addDossierNoteHandler;
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
 * Register all Phase 8.4 tool handlers with a ToolRunner instance.
 */
function registerPhase84Handlers(runner) {
    runner.registerHandler('explain_senior_exemption_impact', exports.explainSeniorExemptionHandler);
    runner.registerHandler('summarize_parcel_casefile', exports.summarizeParcelCasefileHandler);
    runner.registerHandler('compare_assessed_value_history', exports.compareAssessedValueHandler);
    runner.registerHandler('summarize_levy_rate_components', exports.summarizeLevyRateHandler);
    runner.registerHandler('explain_model_inputs', exports.explainModelInputsHandler);
    runner.registerHandler('draft_value_change_notice', exports.draftValueChangeNoticeHandler);
    runner.registerHandler('draft_boe_appeal_response', exports.draftBoeAppealResponseHandler);
    runner.registerHandler('summarize_sales_comps_rationale', exports.summarizeSalesCompsHandler);
    runner.registerHandler('search_trace_by_correlation', exports.searchTraceByCorrelationHandler);
    runner.registerHandler('add_dossier_note', exports.addDossierNoteHandler);
}
/**
 * Register all tool handlers (Phase 8.3 + 8.4).
 */
function registerAllHandlers(runner) {
    registerPhase83Handlers(runner);
    registerPhase84Handlers(runner);
}
/**
 * Map of all Phase 8.3 handlers for direct access.
 */
exports.phase83Handlers = {
    summarize_dossier: exports.summarizeDossierHandler,
    explain_model_results: exports.explainModelResultsHandler,
    draft_appeal_response: exports.draftAppealResponseHandler,
};
/**
 * Map of all Phase 8.4 handlers for direct access.
 */
exports.phase84Handlers = {
    explain_senior_exemption_impact: exports.explainSeniorExemptionHandler,
    summarize_parcel_casefile: exports.summarizeParcelCasefileHandler,
    compare_assessed_value_history: exports.compareAssessedValueHandler,
    summarize_levy_rate_components: exports.summarizeLevyRateHandler,
    explain_model_inputs: exports.explainModelInputsHandler,
    draft_value_change_notice: exports.draftValueChangeNoticeHandler,
    draft_boe_appeal_response: exports.draftBoeAppealResponseHandler,
    summarize_sales_comps_rationale: exports.summarizeSalesCompsHandler,
    search_trace_by_correlation: exports.searchTraceByCorrelationHandler,
    add_dossier_note: exports.addDossierNoteHandler,
};
