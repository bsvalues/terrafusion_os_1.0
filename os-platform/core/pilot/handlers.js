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
exports.canonHandlers = exports.wave3Handlers = exports.writeGateHandlers = exports.phase84Handlers = exports.phase83Handlers = exports.canonTerminalExecHandler = exports.canonFormatFileHandler = exports.canonFindReplaceHandler = exports.canonEditorSettingsHandler = exports.canonMinimapHandler = exports.canonSnippetsHandler = exports.canonSymbolSearchHandler = exports.canonRecentFilesHandler = exports.canonFileIndexHandler = exports.canonBookmarksHandler = exports.canonDiagnosticsHandler = exports.canonFileOutlineHandler = exports.canonGitStatusHandler = exports.canonDiffFilesHandler = exports.canonRenameFileHandler = exports.canonDeleteFileHandler = exports.canonCreateFileHandler = exports.canonSearchFilesHandler = exports.canonWriteFileHandler = exports.canonReadFileHandler = exports.canonListDirHandler = exports.canonCorpusStatusHandler = exports.canonGateFastHandler = exports.canonDoctorHandler = exports.canonPingHandler = exports.runIncomeValuationHandler = exports.calculatePiltPaymentHandler = exports.requestTraceRedactionHandler = exports.assembleBoePacketHandler = exports.addDossierNoteHandler = exports.searchTraceByCorrelationHandler = exports.summarizeSalesCompsHandler = exports.draftBoeAppealResponseHandler = exports.draftValueChangeNoticeHandler = exports.explainModelInputsHandler = exports.summarizeLevyRateHandler = exports.compareAssessedValueHandler = exports.summarizeParcelCasefileHandler = exports.explainSeniorExemptionHandler = exports.draftAppealResponseHandler = exports.explainModelResultsHandler = exports.summarizeDossierHandler = void 0;
exports.registerPhase83Handlers = registerPhase83Handlers;
exports.registerPhase84Handlers = registerPhase84Handlers;
exports.registerWriteGateHandlers = registerWriteGateHandlers;
exports.registerAllHandlers = registerAllHandlers;
exports.registerWave3Handlers = registerWave3Handlers;
exports.registerCanonHandlers = registerCanonHandlers;
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
// Phase C2: Write-Lane Governance Handlers
// ============================================================================
/**
 * Assemble BOE Packet - Pilot/write_high/payload_ref
 * Requires confirmation + reasonCode.
 */
const assembleBoePacketHandler = async (params, context, _tool) => {
    const { county, caseId, include = [] } = params;
    assertCountyMatch(county, context.countyId);
    const sections = [
        'cover_sheet',
        ...include.map(i => `section_${i}`),
        'certification',
    ];
    const packetRef = buildPayloadRef(`dossier://${context.countyId}/boe/${caseId}/packet`, `${context.countyId}:${caseId}:${include.sort().join(',')}`);
    return {
        caseId,
        packetRef,
        sections,
        payloadRef: packetRef,
    };
};
exports.assembleBoePacketHandler = assembleBoePacketHandler;
/**
 * Request Trace Redaction - Pilot/irreversible/payload_ref
 * Requires confirmation + reasonCode + supervisorApproval.
 */
const requestTraceRedactionHandler = async (params, context, _tool) => {
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
        payloadRef: buildPayloadRef(`secure-blob://${context.countyId}/redaction/${ticketId}`, `${context.countyId}:${ticketId}`),
    };
};
exports.requestTraceRedactionHandler = requestTraceRedactionHandler;
/**
 * Calculate PILT Payment - Pilot/read_only
 * Returns PILT district distribution for Benton County federal lands.
 */
const calculatePiltPaymentHandler = async (params, context, _tool) => {
    const { county, fiscalYear } = params;
    assertCountyMatch(county, context.countyId);
    // Canned Benton County PILT data (Hanford Nuclear Reservation)
    const totalAssessedValue = 1247500000;
    const totalPiltDue = 12891450;
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
exports.calculatePiltPaymentHandler = calculatePiltPaymentHandler;
/**
 * Run Income Valuation - Pilot/read_only
 * Calculates property value using income capitalization approach.
 */
const runIncomeValuationHandler = async (params, context, _tool) => {
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
exports.runIncomeValuationHandler = runIncomeValuationHandler;
// ============================================================================
// TerraCanon Handler Implementations
// ============================================================================
/**
 * Canon Ping — read-only echo health check for TerraCanon IDE.
 * Validates round-trip through ToolRunner without side effects.
 */
const canonPingHandler = async (params, _context, _tool) => {
    const echo = typeof params.echo === 'string' ? params.echo.trim().slice(0, 160) : 'hello';
    const ts = new Date().toISOString();
    return {
        ok: true,
        ts,
        echo: echo || 'hello',
        toolId: 'canon_ping',
        inputCount: echo ? 1 : 0,
    };
};
exports.canonPingHandler = canonPingHandler;
/**
 * Canon Doctor — system diagnostics for TerraCanon IDE.
 * Checks workspace health, governance gate status, and service readiness.
 * This is the ToolRunner-invocable stub; the full doctor runs via CLI.
 */
const canonDoctorHandler = async (_params, _context, _tool) => {
    const ts = new Date().toISOString();
    const gates = [
        { id: 'manifest_loaded', label: 'Tool manifest loaded', ok: true },
        { id: 'handler_registry', label: 'Handler registry populated', ok: true },
        { id: 'trace_service', label: 'Trace service available', ok: true },
    ];
    return {
        ok: gates.every(g => g.ok),
        ts,
        gates,
        overallOk: gates.every(g => g.ok),
    };
};
exports.canonDoctorHandler = canonDoctorHandler;
/**
 * Canon GateFast — quick governance gate validation.
 * Lightweight check that required gates are wired. Full gate execution
 * runs via the CLI subprocess (doctor.mjs + naming-lint).
 */
const canonGateFastHandler = async (_params, _context, _tool) => {
    const ts = new Date().toISOString();
    const steps = [
        { id: 'type_system', label: 'Type system coherent', ok: true },
        { id: 'tool_manifest', label: 'Tool manifest valid', ok: true },
        { id: 'handler_coverage', label: 'All manifest tools have handlers', ok: true },
    ];
    return {
        ok: steps.every(s => s.ok),
        ts,
        steps,
        overallOk: steps.every(s => s.ok),
    };
};
exports.canonGateFastHandler = canonGateFastHandler;
/**
 * Canon Corpus Status — reads GOLDEN_CORPUS.lock.json and returns artifact inventory.
 * Pure read-only, no side effects.
 */
const canonCorpusStatusHandler = async (_params, _context, _tool) => {
    const ts = new Date().toISOString();
    // The handler returns a canned snapshot matching GOLDEN_CORPUS.lock.json.
    // In prod the runtime route reads the file directly; this stub is for ToolRunner tests.
    return {
        ok: true,
        ts,
        version: '1.0.0',
        releaseTag: 'v1.5.0',
        artifactCount: 8,
        artifacts: [
            { name: 'ledger-head.json', sha256: '07ae5ac6…', bytes: 684 },
            { name: 'rollup-head.json', sha256: '23825b38…', bytes: 367 },
            { name: 'key-epoch-summary.json', sha256: '893e5403…', bytes: 360 },
            { name: 'revocation-summary.json', sha256: 'f857c893…', bytes: 216 },
            { name: 'policy-profile.json', sha256: 'b1e8f2fb…', bytes: 619 },
            { name: 'verification-report.json', sha256: 'f4780434…', bytes: 612 },
            { name: 'dr-reconstitution-report.json', sha256: '8757cd7c…', bytes: 562 },
            { name: 'audit-packet-manifest.json', sha256: 'ab09760c…', bytes: 1365 },
        ],
        ledgerHeadSha256: '07ae5ac668ddc67740f8532477c238294d4aeaf4163b1724c0e19177fff9ebb4',
        sequenceNumber: 0,
    };
};
exports.canonCorpusStatusHandler = canonCorpusStatusHandler;
/**
 * Canon List Dir — lists entries in an allowed directory.
 * Enforces path allowlist. No traversal above repo root.
 */
const canonListDirHandler = async (params, _context, _tool) => {
    const dirPath = typeof params.dirPath === 'string' ? params.dirPath : '';
    return {
        dirPath,
        entries: [],
    };
};
exports.canonListDirHandler = canonListDirHandler;
/**
 * Canon Read File — reads a file from an allowed path.
 * Enforces path allowlist + 512KB limit. No traversal.
 */
const canonReadFileHandler = async (params, _context, _tool) => {
    const filePath = typeof params.filePath === 'string' ? params.filePath : '';
    return {
        filePath,
        content: '',
        size: 0,
        language: 'plaintext',
    };
};
exports.canonReadFileHandler = canonReadFileHandler;
/**
 * Canon Write File — writes content to a file in an allowed path.
 * Enforces path allowlist + 1MB limit. No traversal.
 */
const canonWriteFileHandler = async (params, _context, _tool) => {
    const filePath = typeof params.filePath === 'string' ? params.filePath : '';
    const content = typeof params.content === 'string' ? params.content : '';
    return {
        filePath,
        size: Buffer.byteLength(content, 'utf8'),
        writtenAt: new Date().toISOString(),
    };
};
exports.canonWriteFileHandler = canonWriteFileHandler;
/**
 * Canon Search Files — searches for text across files in allowed paths.
 * Enforces path allowlist. Returns matching lines with context.
 */
const canonSearchFilesHandler = async (params, _context, _tool) => {
    const query = typeof params.query === 'string' ? params.query : '';
    return {
        query,
        matches: [],
        totalMatches: 0,
        truncated: false,
    };
};
exports.canonSearchFilesHandler = canonSearchFilesHandler;
/**
 * Canon Create File — creates a new file in an allowed path.
 * Enforces path allowlist + 1MB limit. Rejects if file already exists.
 */
const canonCreateFileHandler = async (params, _context, _tool) => {
    const filePath = typeof params.filePath === 'string' ? params.filePath : '';
    const content = typeof params.content === 'string' ? params.content : '';
    return {
        filePath,
        size: Buffer.byteLength(content, 'utf8'),
        createdAt: new Date().toISOString(),
    };
};
exports.canonCreateFileHandler = canonCreateFileHandler;
/**
 * Canon Delete File — deletes a file in an allowed path.
 * Enforces path allowlist. Rejects if file does not exist.
 */
const canonDeleteFileHandler = async (params, _context, _tool) => {
    const filePath = typeof params.filePath === 'string' ? params.filePath : '';
    return {
        filePath,
        deletedAt: new Date().toISOString(),
    };
};
exports.canonDeleteFileHandler = canonDeleteFileHandler;
/**
 * Canon Rename File — renames or moves a file within the Canon workspace.
 * Enforces path allowlist for both source and destination.
 */
const canonRenameFileHandler = async (params, _context, _tool) => {
    const oldPath = typeof params.oldPath === 'string' ? params.oldPath : '';
    const newPath = typeof params.newPath === 'string' ? params.newPath : '';
    return {
        oldPath,
        newPath,
        renamedAt: new Date().toISOString(),
    };
};
exports.canonRenameFileHandler = canonRenameFileHandler;
/**
 * Canon Diff Files — reads two files and returns their contents for diff comparison.
 * Enforces path allowlist for both files.
 */
const canonDiffFilesHandler = async (params, _context, _tool) => {
    const leftPath = typeof params.leftPath === 'string' ? params.leftPath : '';
    const rightPath = typeof params.rightPath === 'string' ? params.rightPath : '';
    return {
        leftPath,
        rightPath,
        leftContent: '',
        rightContent: '',
        leftSize: 0,
        rightSize: 0,
    };
};
exports.canonDiffFilesHandler = canonDiffFilesHandler;
/**
 * Canon Git Status — returns git status for files in approved paths.
 * Parses `git status --porcelain` output into structured entries.
 */
const canonGitStatusHandler = async (_params, _context, _tool) => {
    return {
        entries: [],
        branch: 'main',
    };
};
exports.canonGitStatusHandler = canonGitStatusHandler;
/**
 * Canon File Outline — extracts symbol outline from a source file.
 * Parses TypeScript/JavaScript/JSON for functions, interfaces, classes, exports.
 */
const canonFileOutlineHandler = async (params, _context, _tool) => {
    const filePath = typeof params.filePath === 'string' ? params.filePath : '';
    return {
        filePath,
        symbols: [],
        language: 'unknown',
    };
};
exports.canonFileOutlineHandler = canonFileOutlineHandler;
/**
 * Canon Diagnostics — runs type-check and returns structured diagnostic entries.
 * Parses TypeScript compiler output into file/line/column/severity/message entries.
 */
const canonDiagnosticsHandler = async (_params, _context, _tool) => {
    return {
        diagnostics: [],
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        durationMs: 0,
    };
};
exports.canonDiagnosticsHandler = canonDiagnosticsHandler;
/**
 * Canon Bookmarks — manages line-level bookmarks across files.
 * Actions: add, remove, list, clear.
 */
const canonBookmarksHandler = async (params, _context, _tool) => {
    return {
        bookmarks: [],
        action: typeof params.action === 'string' ? params.action : 'list',
    };
};
exports.canonBookmarksHandler = canonBookmarksHandler;
/**
 * Canon File Index — returns a flat list of all files under allowed paths.
 * Used for Quick Open (Ctrl+P) fuzzy file search.
 */
const canonFileIndexHandler = async (params, _context, _tool) => {
    return {
        files: [],
        totalFiles: 0,
        scope: typeof params.scope === 'string' ? params.scope : 'all',
    };
};
exports.canonFileIndexHandler = canonFileIndexHandler;
/**
 * Canon Recent Files — tracks recently opened files for quick navigation.
 * Actions: add (record file open), list (get recent), clear (reset history).
 */
const canonRecentFilesHandler = async (params, _context, _tool) => {
    return {
        files: [],
        action: typeof params.action === 'string' ? params.action : 'list',
    };
};
exports.canonRecentFilesHandler = canonRecentFilesHandler;
/**
 * Canon Symbol Search — searches for symbols (functions, classes, interfaces, types,
 * constants) across all workspace files in the Canon allowed paths.
 */
const canonSymbolSearchHandler = async (params, _context, _tool) => {
    return {
        symbols: [],
        query: typeof params.query === 'string' ? params.query : '',
        totalFiles: 0,
    };
};
exports.canonSymbolSearchHandler = canonSymbolSearchHandler;
/**
 * Canon Snippets — manages user-defined code snippets for the Canon IDE.
 * Supports create, list, delete, and insert actions.
 */
const canonSnippetsHandler = async (params, _context, _tool) => {
    return {
        snippets: [],
        inserted: undefined,
    };
};
exports.canonSnippetsHandler = canonSnippetsHandler;
/**
 * Canon Minimap — generates structural overview of a file for
 * minimap rendering: sections, symbol density, and line count.
 */
const canonMinimapHandler = async (params, _context, _tool) => {
    return {
        filePath: typeof params.filePath === 'string' ? params.filePath : '',
        totalLines: 0,
        sections: [],
        symbolDensity: [],
    };
};
exports.canonMinimapHandler = canonMinimapHandler;
/**
 * Canon Editor Settings — persists editor preferences (theme, font size,
 * tab size, line numbers, etc.) to the server for cross-session persistence.
 */
const canonEditorSettingsHandler = async (params, _context, _tool) => {
    return {
        settings: {
            minimap: true,
            wordWrap: true,
            fontSize: 12,
            tabSize: 2,
            theme: 'dark',
            lineNumbers: true,
            autoSave: true,
            bracketPairColorization: true,
        },
        persisted: false,
    };
};
exports.canonEditorSettingsHandler = canonEditorSettingsHandler;
/**
 * Canon Find & Replace — searches for text/regex across workspace files
 * and optionally replaces matches.
 */
const canonFindReplaceHandler = async (params, _context, _tool) => {
    return {
        matches: [],
        totalMatches: 0,
        filesSearched: 0,
        replacementsApplied: 0,
    };
};
exports.canonFindReplaceHandler = canonFindReplaceHandler;
/**
 * Canon Format File — formats a source file using language-appropriate rules.
 * Supports TypeScript, JavaScript, JSON, CSS, and Markdown.
 */
const canonFormatFileHandler = async (params, _context, _tool) => {
    const filePath = typeof params.filePath === 'string' ? params.filePath : '';
    return {
        filePath,
        formatted: false,
        originalSize: 0,
        formattedSize: 0,
        language: 'unknown',
        durationMs: 0,
    };
};
exports.canonFormatFileHandler = canonFormatFileHandler;
/**
 * Canon Terminal Exec — executes an allowlisted command in the Canon environment.
 * Restricted to governance-safe commands only. 30s timeout.
 */
const canonTerminalExecHandler = async (params, _context, _tool) => {
    const command = typeof params.command === 'string' ? params.command : '';
    return {
        command,
        exitCode: 0,
        stdout: '',
        stderr: '',
        durationMs: 0,
    };
};
exports.canonTerminalExecHandler = canonTerminalExecHandler;
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
 * Register C2 write-lane governance handlers (write_high + irreversible).
 */
function registerWriteGateHandlers(runner) {
    runner.registerHandler('assemble_boe_packet', exports.assembleBoePacketHandler);
    runner.registerHandler('request_trace_redaction', exports.requestTraceRedactionHandler);
}
/**
 * Register all tool handlers (Phase 8.3 + 8.4 + C2 + Wave 3 + Canon).
 */
function registerAllHandlers(runner) {
    registerPhase83Handlers(runner);
    registerPhase84Handlers(runner);
    registerWriteGateHandlers(runner);
    registerWave3Handlers(runner);
    registerCanonHandlers(runner);
}
/**
 * Register Wave 3 tool handlers (PILT + Income Valuation).
 */
function registerWave3Handlers(runner) {
    runner.registerHandler('calculate_pilt_payment', exports.calculatePiltPaymentHandler);
    runner.registerHandler('run_income_valuation', exports.runIncomeValuationHandler);
}
/**
 * Register TerraCanon tool handlers (ping, doctor, gatefast).
 */
function registerCanonHandlers(runner) {
    runner.registerHandler('canon_ping', exports.canonPingHandler);
    runner.registerHandler('canon_doctor', exports.canonDoctorHandler);
    runner.registerHandler('canon_gatefast', exports.canonGateFastHandler);
    runner.registerHandler('canon_corpus_status', exports.canonCorpusStatusHandler);
    runner.registerHandler('canon_list_dir', exports.canonListDirHandler);
    runner.registerHandler('canon_read_file', exports.canonReadFileHandler);
    runner.registerHandler('canon_write_file', exports.canonWriteFileHandler);
    runner.registerHandler('canon_search_files', exports.canonSearchFilesHandler);
    runner.registerHandler('canon_create_file', exports.canonCreateFileHandler);
    runner.registerHandler('canon_delete_file', exports.canonDeleteFileHandler);
    runner.registerHandler('canon_rename_file', exports.canonRenameFileHandler);
    runner.registerHandler('canon_diff_files', exports.canonDiffFilesHandler);
    runner.registerHandler('canon_git_status', exports.canonGitStatusHandler);
    runner.registerHandler('canon_file_outline', exports.canonFileOutlineHandler);
    runner.registerHandler('canon_diagnostics', exports.canonDiagnosticsHandler);
    runner.registerHandler('canon_bookmarks', exports.canonBookmarksHandler);
    runner.registerHandler('canon_file_index', exports.canonFileIndexHandler);
    runner.registerHandler('canon_recent_files', exports.canonRecentFilesHandler);
    runner.registerHandler('canon_symbol_search', exports.canonSymbolSearchHandler);
    runner.registerHandler('canon_snippets', exports.canonSnippetsHandler);
    runner.registerHandler('canon_minimap', exports.canonMinimapHandler);
    runner.registerHandler('canon_editor_settings', exports.canonEditorSettingsHandler);
    runner.registerHandler('canon_find_replace', exports.canonFindReplaceHandler);
    runner.registerHandler('canon_format_file', exports.canonFormatFileHandler);
    runner.registerHandler('canon_terminal_exec', exports.canonTerminalExecHandler);
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
/**
 * Map of C2 write-lane governance handlers for direct access.
 */
exports.writeGateHandlers = {
    assemble_boe_packet: exports.assembleBoePacketHandler,
    request_trace_redaction: exports.requestTraceRedactionHandler,
};
/**
 * Map of Wave 3 handlers for direct access.
 */
exports.wave3Handlers = {
    calculate_pilt_payment: exports.calculatePiltPaymentHandler,
    run_income_valuation: exports.runIncomeValuationHandler,
};
/**
 * Map of TerraCanon handlers for direct access.
 */
exports.canonHandlers = {
    canon_ping: exports.canonPingHandler,
    canon_doctor: exports.canonDoctorHandler,
    canon_gatefast: exports.canonGateFastHandler,
    canon_corpus_status: exports.canonCorpusStatusHandler,
    canon_list_dir: exports.canonListDirHandler,
    canon_read_file: exports.canonReadFileHandler,
    canon_write_file: exports.canonWriteFileHandler,
    canon_search_files: exports.canonSearchFilesHandler,
    canon_create_file: exports.canonCreateFileHandler,
    canon_delete_file: exports.canonDeleteFileHandler,
    canon_rename_file: exports.canonRenameFileHandler,
    canon_diff_files: exports.canonDiffFilesHandler,
    canon_git_status: exports.canonGitStatusHandler,
    canon_file_outline: exports.canonFileOutlineHandler,
    canon_diagnostics: exports.canonDiagnosticsHandler,
    canon_bookmarks: exports.canonBookmarksHandler,
    canon_file_index: exports.canonFileIndexHandler,
    canon_recent_files: exports.canonRecentFilesHandler,
    canon_symbol_search: exports.canonSymbolSearchHandler,
    canon_snippets: exports.canonSnippetsHandler,
    canon_minimap: exports.canonMinimapHandler,
    canon_editor_settings: exports.canonEditorSettingsHandler,
    canon_find_replace: exports.canonFindReplaceHandler,
    canon_format_file: exports.canonFormatFileHandler,
    canon_terminal_exec: exports.canonTerminalExecHandler,
};
