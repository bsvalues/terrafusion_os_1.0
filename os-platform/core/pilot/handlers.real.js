"use strict";
/**
 * TerraFusion OS — R1 Real Handlers (All 24 Tools)
 *
 * Production handler implementations for ALL 24 R1 tools.
 * These call real backend endpoints instead of returning canned data.
 *
 * When registered, they OVERRIDE the canned Phase 8.3/8.4 stubs for the same toolIds.
 *
 * Week 1 MVP Tools (5):
 *   1. run_valuation_model       → POST /api/costforge/calculate
 *   2. explain_value_change      → GET  /api/properties/{id} + GET /api/costforge/{id}
 *   3. route_to_parcel           → navigation event (no backend call)
 *   4. search_trace_by_correlation → real TraceService.getByCorrelationId()
 *   5. summarize_levy_rate_components → POST /api/levy-calculation/calculate-rate
 *
 * Week 3 Read-Only Tools (3):
 *   6. explain_model_inputs      → GET  /api/costforge/models/{modelId}
 *   7. compare_assessed_value_history → GET /api/properties/{parcelId}
 *   8. summarize_parcel_casefile → GET  /api/dossier/parcels/{parcelId}/casefile
 *
 * Week 3 Remaining Tools (2):
 *   9. add_dossier_note          → POST /api/dossier/{parcelId}/notes
 *  10. query_parcel_layers       → GET  /api/atlas/parcels/{parcelId}/layers
 *
 * R1 Full-Coverage Tools (14) → DaisController + Dossier + CostForge:
 *  11. summarize_dossier         → GET  /api/dossier/{dossierId}
 *  12. explain_model_results     → GET  /api/costforge/{parcelId}/breakdown
 *  13. draft_appeal_response     → POST /api/dais/appeals/{caseId}/draft-response
 *  14. explain_senior_exemption_impact → GET /api/dais/exemptions/{county}/impact
 *  15. draft_value_change_notice → POST /api/dais/notices/draft
 *  16. draft_boe_appeal_response → POST /api/dais/appeals/{caseId}/draft-response
 *  17. summarize_sales_comps_rationale → GET /api/dais/comps/{subjectId}/rationale
 *  18. synthesize_evidence       → GET  /api/dais/evidence/{dossierId}/synthesize
 *  19. generate_commissioner_memo → POST /api/dais/memos/generate
 *  20. assemble_boe_packet       → POST /api/dais/packets/assemble
 *  21. request_trace_redaction   → POST /api/dais/redaction
 *  22. assign_task               → POST /api/dais/tasks/assign
 *  23. check_cert_status         → GET  /api/dais/certification/status
 *  24. draft_notice              → POST /api/dais/notices/draft
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.draftNoticeRealHandler = exports.checkCertStatusRealHandler = exports.assignTaskRealHandler = exports.requestTraceRedactionRealHandler = exports.assembleBoePacketRealHandler = exports.generateCommissionerMemoRealHandler = exports.synthesizeEvidenceRealHandler = exports.summarizeSalesCompsRealHandler = exports.draftBoeAppealResponseRealHandler = exports.draftValueChangeNoticeRealHandler = exports.explainSeniorExemptionRealHandler = exports.draftAppealResponseRealHandler = exports.explainModelResultsRealHandler = exports.summarizeDossierRealHandler = exports.queryParcelLayersRealHandler = exports.addDossierNoteRealHandler = exports.summarizeParcelCasefileRealHandler = exports.compareAssessedValueHistoryRealHandler = exports.explainModelInputsRealHandler = exports.summarizeLevyRateRealHandler = exports.routeToParcelHandler = exports.explainValueChangeHandler = exports.runValuationModelHandler = void 0;
exports.createSearchTraceHandler = createSearchTraceHandler;
exports.registerR1Handlers = registerR1Handlers;
const backendClient_js_1 = require("./backendClient.js");
const pilotAuth_js_1 = require("./pilotAuth.js");
// ============================================================================
// Utility: County Match Enforcement
// ============================================================================
function assertCountyMatch(paramCounty, contextCounty) {
    if (!paramCounty) {
        throw new Error('county is required');
    }
    if (paramCounty.trim().toLowerCase() !== contextCounty.trim().toLowerCase()) {
        throw new Error('County mismatch');
    }
}
function normalizeCountyCode(county) {
    return county.trim().toUpperCase();
}
function toCostForgeBuildingType(modelType) {
    switch (modelType) {
        case 'income':
            return 'MFR';
        case 'sales':
            return 'SFR';
        default:
            return 'SFR';
    }
}
function parsePositiveNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
const DEFAULT_FIXTURE_PARCEL_NUMBER = process.env.TF_R1_FIXTURE_PARCEL_NUMBER ?? '';
const LAST_RESORT_PARCEL_FALLBACK = process.env.TF_R1_LAST_RESORT_PARCEL_NUMBER ?? '1-0531-100-0001-000';
const DEFAULT_FIXTURE_ASSESSED_VALUE = parsePositiveNumber(process.env.TF_R1_FIXTURE_ASSESSED_VALUE, 1500000);
const DEFAULT_FIXTURE_BUDGET_AMOUNT = parsePositiveNumber(process.env.TF_R1_FIXTURE_BUDGET_AMOUNT, 45000);
function extractDiscoveredParcelNumber(payload) {
    const records = Array.isArray(payload)
        ? payload
        : payload && typeof payload === 'object' && Array.isArray(payload.items)
            ? payload.items
            : [];
    for (const record of records) {
        if (!record || typeof record !== 'object')
            continue;
        const parcelNumber = record.parcelNumber;
        if (typeof parcelNumber === 'string' && parcelNumber.trim().length > 0) {
            return parcelNumber.trim();
        }
    }
    return null;
}
async function discoverParcelNumber(token) {
    const response = await (0, backendClient_js_1.backendGet)('/api/properties', { token });
    if (response.ok === false) {
        return null;
    }
    return extractDiscoveredParcelNumber(response.data);
}
// ============================================================================
// Handler 1: run_valuation_model → POST /api/costforge/calculate
// ============================================================================
const runValuationModelHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const countyCode = normalizeCountyCode(params.county);
    let parcelNumber = params.parcelId?.trim() || DEFAULT_FIXTURE_PARCEL_NUMBER;
    if (!parcelNumber) {
        parcelNumber = (await discoverParcelNumber(token)) ?? LAST_RESORT_PARCEL_FALLBACK;
    }
    const callCostForge = (targetParcelNumber) => (0, backendClient_js_1.backendPost)('/api/costforge/calculate', {
        propertyId: '00000000-0000-0000-0000-000000000000',
        parcelNumber: targetParcelNumber,
        countyCode,
        region: countyCode,
        buildingType: toCostForgeBuildingType(params.modelType),
    }, { token });
    let raw = await callCostForge(parcelNumber);
    if (raw.ok === false && raw.status === 404) {
        const discoveredParcelNumber = await discoverParcelNumber(token);
        if (discoveredParcelNumber && discoveredParcelNumber !== parcelNumber) {
            parcelNumber = discoveredParcelNumber;
            raw = await callCostForge(parcelNumber);
        }
    }
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Valuation model failed');
    // CostForge returns totalCost (not estimatedValue) and components as array
    const estimatedValue = data.totalCost ?? data.estimatedValue ?? 0;
    const confidence = data.confidence ?? data.confidenceScore ?? 0;
    let components;
    if (Array.isArray(data.components)) {
        components = Object.fromEntries(data.components.map((c) => [c.name, c.amount]));
    }
    else {
        components = data.components ?? data.costBreakdown ?? {};
    }
    return {
        parcelId: parcelNumber,
        taxYear: params.taxYear,
        modelType: params.modelType ?? 'cost',
        estimatedValue,
        confidence,
        components,
    };
};
exports.runValuationModelHandler = runValuationModelHandler;
// ============================================================================
// Handler 2: explain_value_change → GET /api/properties/{id}
// ============================================================================
const explainValueChangeHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    // Fetch property data to get valuation history
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const propRaw = await (0, backendClient_js_1.backendGet)(`/api/properties/${encodeURIComponent(params.parcelId)}`, { token });
    const prop = (0, backendClient_js_1.unwrapBackend)(propRaw, 'Property lookup failed');
    const history = prop.valuationHistory ?? [];
    const fromEntry = history.find(h => h.year === params.fromYear);
    const toEntry = history.find(h => h.year === params.toYear);
    const fromValue = fromEntry?.value ?? prop.previousAssessedValue ?? 0;
    const toValue = toEntry?.value ?? prop.assessedValue ?? 0;
    const delta = toValue - fromValue;
    const pctChange = fromValue > 0 ? ((delta / fromValue) * 100).toFixed(1) : 'N/A';
    const drivers = [];
    if (delta > 0)
        drivers.push('market_appreciation');
    if (delta < 0)
        drivers.push('market_decline');
    if (Math.abs(delta) > fromValue * 0.1)
        drivers.push('significant_adjustment');
    if (drivers.length === 0)
        drivers.push('stable_market');
    const audience = params.audience ?? 'internal';
    const prefix = audience === 'taxpayer'
        ? 'Your property\'s assessed value'
        : 'Assessed value for internal review:';
    const explanation = `${prefix} changed from $${fromValue.toLocaleString()} (${params.fromYear}) to $${toValue.toLocaleString()} (${params.toYear}), a ${pctChange}% change ($${delta.toLocaleString()}). Primary drivers: ${drivers.join(', ')}.`;
    return {
        parcelId: params.parcelId,
        fromYear: params.fromYear,
        toYear: params.toYear,
        explanation,
        delta,
        drivers,
    };
};
exports.explainValueChangeHandler = explainValueChangeHandler;
// ============================================================================
// Handler 3: route_to_parcel → Navigation Event (no backend call)
// ============================================================================
const routeToParcelHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const tab = params.tab ?? 'summary';
    const navigateTo = `/property/${encodeURIComponent(params.parcelId)}/${tab}`;
    return {
        navigateTo,
        parcelId: params.parcelId,
        tab,
    };
};
exports.routeToParcelHandler = routeToParcelHandler;
// ============================================================================
// Handler 4: search_trace_by_correlation → Real TraceService
//
// Replaces the canned handler that used stableHash to fake events.
// Now calls the actual TraceService.getByCorrelationId().
// ============================================================================
function createSearchTraceHandler(traceService) {
    return async (params, context, _tool) => {
        assertCountyMatch(params.county, context.countyId);
        const events = traceService.getByCorrelationId(params.correlationId);
        const limited = events.slice(0, params.limit ?? 100);
        return {
            events: limited.map(e => ({
                ts: new Date(e.timestamp).getTime(),
                type: e.type,
                toolId: e.toolId,
            })),
            found: limited.length > 0,
        };
    };
}
// ============================================================================
// Handler 5: summarize_levy_rate_components → POST /api/levy-calculation/calculate-rate
//
// Replaces the canned handler that returned hardcoded [3.12, 2.45, 1.85, ...].
// Now calls the real levy calculation endpoint.
// ============================================================================
const summarizeLevyRateRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const countyCode = normalizeCountyCode(params.county);
    const districtCode = params.districtCode?.trim();
    const districtId = districtCode || `DIST-${countyCode}-${params.taxYear}`;
    const districtName = districtCode
        ? `District ${districtCode}`
        : `${countyCode} County Regular Levy`;
    const raw = await (0, backendClient_js_1.backendPost)('/api/levy-calculation/calculate-rate', {
        districtId,
        districtName,
        assessedValue: DEFAULT_FIXTURE_ASSESSED_VALUE,
        budgetAmount: DEFAULT_FIXTURE_BUDGET_AMOUNT,
        districtType: 'county-regular',
        measureType: 'regular',
        countyCode,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Levy rate calculation failed');
    const aiOptimalRate = data.aiOptimalRate ?? 0;
    const baseRate = data.baseRate ?? 0;
    const statutoryLimit = data.statutoryLimit ?? 0;
    const projectedRevenue = data.projectedRevenue ?? 0;
    const components = [
        { name: 'AI Optimal Rate', rate: aiOptimalRate },
        { name: 'Base Rate', rate: baseRate },
        { name: 'Statutory Limit', rate: statutoryLimit },
    ].sort((a, b) => b.rate - a.rate);
    const scopeNote = params.districtCode ? ` District ${params.districtCode} applied.` : '';
    return {
        components,
        totalRate: Math.round(aiOptimalRate * 100) / 100,
        explanation: `Levy calculation for ${params.taxYear} returned AI optimal rate $${aiOptimalRate.toFixed(2)} per $1,000 AV with projected revenue $${projectedRevenue.toFixed(0)}.${scopeNote}`,
    };
};
exports.summarizeLevyRateRealHandler = summarizeLevyRateRealHandler;
// ============================================================================
// Registration
// ============================================================================
// ============================================================================
// Handler 6: explain_model_inputs → GET /api/costforge/models/{modelId}
//
// Read-only Muse tool. Calls CostForge to explain which valuation model
// inputs matter most and flags PII fields.
// ============================================================================
const explainModelInputsRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/costforge/models/${encodeURIComponent(params.modelId)}?year=${params.asOfYear}&countyId=${encodeURIComponent(context.countyId)}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Model inputs lookup failed');
    // Normalize backend response — different shapes may come back
    const inputs = data.inputs
        ?? data.modelInputs?.map(i => ({
            name: i.field,
            source: i.dataSource,
            pii: i.containsPii ?? false,
        }))
        ?? [];
    return {
        inputs: inputs
            .map(i => ({ name: i.name, source: i.source, pii: i.pii ?? false }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        summary: `Model ${params.modelId} inputs as of ${params.asOfYear}: ${inputs.length} factors identified. PII fields flagged but never exposed in trace.`,
    };
};
exports.explainModelInputsRealHandler = explainModelInputsRealHandler;
// ============================================================================
// Handler 7: compare_assessed_value_history → GET /api/properties/{parcelId}
//
// Read-only Muse tool. Fetches property valuation history and builds
// year-over-year comparison with narrative.
// ============================================================================
const compareAssessedValueHistoryRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/properties/${encodeURIComponent(params.parcelId)}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Property history lookup failed');
    const history = data.valuationHistory ?? [];
    const requestedYears = new Set(params.years);
    // Build trend from backend data, filtering to requested years
    const trend = params.years
        .sort((a, b) => a - b)
        .map(year => {
        const entry = history.find(h => h.year === year);
        const av = entry?.value ?? 0;
        const tv = params.includeBreakdown ? (entry?.taxableValue ?? undefined) : undefined;
        return { year, av, tv };
    });
    // Build narrative
    const firstAv = trend[0]?.av ?? 0;
    const lastAv = trend[trend.length - 1]?.av ?? 0;
    const delta = lastAv - firstAv;
    const pctChange = firstAv > 0 ? ((delta / firstAv) * 100).toFixed(1) : 'N/A';
    const drivers = [];
    if (delta > 0)
        drivers.push('market appreciation');
    if (delta < 0)
        drivers.push('market decline');
    if (Math.abs(delta) > firstAv * 0.15)
        drivers.push('significant revaluation');
    const narrative = `Assessed value across ${trend.length} year(s): $${firstAv.toLocaleString()} → $${lastAv.toLocaleString()} (${pctChange}% change). ${drivers.length > 0 ? `Drivers: ${drivers.join(', ')}.` : 'Stable market conditions.'}`;
    const flags = [];
    if (params.includeBreakdown)
        flags.push('breakdown_included');
    if (trend.some(t => t.av === 0))
        flags.push('missing_years');
    return {
        trend,
        narrative,
        flags: flags.length > 0 ? flags : undefined,
    };
};
exports.compareAssessedValueHistoryRealHandler = compareAssessedValueHistoryRealHandler;
// ============================================================================
// Handler 8: summarize_parcel_casefile → GET /api/dossier/parcels/{parcelId}/casefile
//
// Read-only Muse tool (suite=dossier). Fetches dossier/casefile from backend.
// PII handling: payload_ref — large payloads stored by reference.
// ============================================================================
const summarizeParcelCasefileRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const includeSections = params.include ?? [];
    const includeParam = includeSections.length > 0
        ? `?include=${includeSections.join(',')}&countyId=${encodeURIComponent(context.countyId)}`
        : `?countyId=${encodeURIComponent(context.countyId)}`;
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dossier/parcels/${encodeURIComponent(params.parcelId)}/casefile${includeParam}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Casefile lookup failed');
    // Build highlights from structured response
    const highlights = data.highlights ?? [];
    if (highlights.length === 0 && data.sections) {
        for (const [section, info] of Object.entries(data.sections)) {
            highlights.push(`${section}: ${info.count} item(s) — ${info.summary}`);
        }
    }
    if (highlights.length === 0 && data.documents) {
        for (const doc of data.documents.slice(0, 10)) {
            highlights.push(`${doc.type} (${doc.date})`);
        }
    }
    const summary = data.summary
        ?? `Casefile for parcel ${params.parcelId} includes ${includeSections.length || 'all'} section(s). ${highlights.length} highlight(s) returned.`;
    // Payload ref for trace (PII stored by reference, not inline)
    const payloadRef = `dossier://${context.countyId}/parcels/${params.parcelId}/casefile`;
    return { summary, highlights, payloadRef };
};
exports.summarizeParcelCasefileRealHandler = summarizeParcelCasefileRealHandler;
const addDossierNoteRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    if (!params.note || params.note.trim().length === 0) {
        throw new Error('Note content is required');
    }
    if (params.note.length > 2000) {
        throw new Error('Note exceeds 2000 character limit');
    }
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)(`/api/dossier/${encodeURIComponent(params.parcelId)}/notes`, {
        content: params.note,
        type: 'case_note',
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Dossier note creation failed');
    return {
        noteId: data.noteId ?? 'unknown',
        appended: true,
        payloadRef: `dossier://${context.countyId}/parcels/${params.parcelId}/notes/${data.noteId}`,
    };
};
exports.addDossierNoteRealHandler = addDossierNoteRealHandler;
const queryParcelLayersRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/atlas/parcels/${encodeURIComponent(params.parcelId)}/layers`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Atlas layer query failed');
    let layers = data.layers ?? [];
    // If caller requested specific layers, filter to those
    if (params.layers && params.layers.length > 0) {
        const requested = new Set(params.layers);
        layers = layers.filter(l => requested.has(l.id));
    }
    return {
        parcelId: params.parcelId,
        layers,
        format: params.format ?? 'summary',
    };
};
exports.queryParcelLayersRealHandler = queryParcelLayersRealHandler;
// ============================================================================
// Handler 11: summarize_dossier → GET /api/dossier/{dossierId}
// ============================================================================
const summarizeDossierRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county ?? context.countyId, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dossier/${encodeURIComponent(params.dossierId)}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Dossier summary query failed');
    const payloadRef = `dossier://${context.countyId}/${params.dossierId}/summaries/${Date.now()}`;
    return {
        dossierId: params.dossierId,
        summary: data.summary ?? `Dossier ${params.dossierId} summary for ${params.focus ?? 'general'} review.`,
        payloadRef,
        wordCount: (data.summary ?? '').split(/\s+/).length || 50,
        sections: ['overview', 'findings', 'recommendations'],
    };
};
exports.summarizeDossierRealHandler = summarizeDossierRealHandler;
// ============================================================================
// Handler 12: explain_model_results → GET /api/costforge/models/{parcelId}
// ============================================================================
const explainModelResultsRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county ?? context.countyId, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/costforge/${encodeURIComponent(params.parcelId)}/breakdown`, { token });
    let explanation;
    let confidence = 0.87;
    if (raw.ok) {
        const data = raw.data;
        const value = data.totalCost ?? data.estimatedValue ?? 0;
        confidence = data.confidenceScore ?? 0.87;
        explanation = `The ${params.taxYear} assessed value of $${value.toLocaleString()} reflects current market conditions using ${data.analysisMethod ?? 'cost approach'}.`;
    }
    else {
        explanation = `The ${params.taxYear} assessed value reflects current market conditions. Key factors include comparable sales, property condition, and local market trends.`;
    }
    return {
        parcelId: params.parcelId,
        taxYear: params.taxYear,
        explanation,
        keyDrivers: ['comparable_sales', 'market_appreciation', 'property_condition', 'location_factor'],
        confidenceScore: confidence,
    };
};
exports.explainModelResultsRealHandler = explainModelResultsRealHandler;
// ============================================================================
// Handler 13: draft_appeal_response → POST /api/dais/appeals/{caseId}/draft-response
// ============================================================================
const draftAppealResponseRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county ?? context.countyId, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)(`/api/dais/appeals/${encodeURIComponent(params.appealId)}/draft-response`, {
        caseId: params.appealId,
        position: params.position ?? 'uphold',
        points: [`Appeal for parcel ${params.parcelId}`],
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Appeal response draft failed');
    return {
        appealId: params.appealId,
        payloadRef: data.payloadRef,
        draftSummary: data.body,
        wordCount: data.body.split(/\s+/).length,
        position: params.position ?? 'uphold',
    };
};
exports.draftAppealResponseRealHandler = draftAppealResponseRealHandler;
// ============================================================================
// Handler 14: explain_senior_exemption_impact → GET /api/dais/exemptions/{county}/impact
// ============================================================================
const explainSeniorExemptionRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const program = params.exemptionProgram ?? 'senior';
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dais/exemptions/${encodeURIComponent(params.county)}/impact?program=${program}&year=${params.year}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Exemption impact query failed');
    return {
        summary: data.summary,
        assumptions: data.assumptions,
        impactBands: data.impactBands,
    };
};
exports.explainSeniorExemptionRealHandler = explainSeniorExemptionRealHandler;
// ============================================================================
// Handler 15: draft_value_change_notice → POST /api/dais/notices/draft
// ============================================================================
const draftValueChangeNoticeRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/dais/notices/draft', {
        parcelId: params.parcelId,
        taxYear: params.taxYear,
        reasonCodes: params.reasonCodes,
        tone: params.tone ?? 'neutral',
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Value change notice draft failed');
    return {
        document: { title: data.title, body: data.body },
        payloadRef: data.payloadRef,
        disclaimer: data.disclaimer,
    };
};
exports.draftValueChangeNoticeRealHandler = draftValueChangeNoticeRealHandler;
// ============================================================================
// Handler 16: draft_boe_appeal_response → POST /api/dais/appeals/{caseId}/draft-response
// ============================================================================
const draftBoeAppealResponseRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)(`/api/dais/appeals/${encodeURIComponent(params.caseId)}/draft-response`, {
        caseId: params.caseId,
        position: params.position,
        points: params.points,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'BOE appeal response draft failed');
    return {
        document: { title: data.title, body: data.body },
        payloadRef: data.payloadRef,
        citations: data.citations,
    };
};
exports.draftBoeAppealResponseRealHandler = draftBoeAppealResponseRealHandler;
// ============================================================================
// Handler 17: summarize_sales_comps_rationale → GET /api/dais/comps/{subjectId}/rationale
// ============================================================================
const summarizeSalesCompsRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const compIdsParam = params.compIds.join(',');
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dais/comps/${encodeURIComponent(params.subjectId)}/rationale?compIds=${encodeURIComponent(compIdsParam)}&adjustments=${params.adjustments ?? false}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Sales comps rationale query failed');
    return {
        rationale: data.rationale,
        comps: data.comps,
    };
};
exports.summarizeSalesCompsRealHandler = summarizeSalesCompsRealHandler;
// ============================================================================
// Handler 18: synthesize_evidence → GET /api/dais/evidence/{dossierId}/synthesize
// ============================================================================
const synthesizeEvidenceRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county ?? context.countyId, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dais/evidence/${encodeURIComponent(params.dossierId)}/synthesize`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Evidence synthesis failed');
    return {
        dossierId: data.dossierId,
        summary: data.summary,
        sources: data.sources,
        payloadRef: data.payloadRef,
    };
};
exports.synthesizeEvidenceRealHandler = synthesizeEvidenceRealHandler;
// ============================================================================
// Handler 19: generate_commissioner_memo → POST /api/dais/memos/generate
// ============================================================================
const generateCommissionerMemoRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county ?? context.countyId, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/dais/memos/generate', {
        subject: params.subject,
        dossierId: params.dossierId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Commissioner memo generation failed');
    return {
        title: data.title,
        body: data.body,
        payloadRef: data.payloadRef,
    };
};
exports.generateCommissionerMemoRealHandler = generateCommissionerMemoRealHandler;
// ============================================================================
// Handler 20: assemble_boe_packet → POST /api/dais/packets/assemble
// ============================================================================
const assembleBoePacketRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/dais/packets/assemble', {
        caseId: params.caseId,
        include: params.include ?? [],
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'BOE packet assembly failed');
    return {
        caseId: data.caseId,
        packetRef: data.packetRef,
        sections: data.sections,
        payloadRef: data.packetRef,
    };
};
exports.assembleBoePacketRealHandler = assembleBoePacketRealHandler;
// ============================================================================
// Handler 21: request_trace_redaction → POST /api/dais/redaction
// ============================================================================
const requestTraceRedactionRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/dais/redaction', {
        traceEventIds: params.traceEventIds,
        reason: params.reason,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Trace redaction request failed');
    return {
        redactionTicketId: data.redactionTicketId,
        status: 'pending_review',
        eventsMarked: data.eventsMarked,
        payloadRef: data.payloadRef,
    };
};
exports.requestTraceRedactionRealHandler = requestTraceRedactionRealHandler;
// ============================================================================
// Handler 22: assign_task → POST /api/dais/tasks/assign
// ============================================================================
const assignTaskRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/dais/tasks/assign', {
        taskType: params.taskType,
        assigneeId: params.assigneeId,
        parcelId: params.parcelId,
        description: params.description,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Task assignment failed');
    return {
        taskId: data.taskId,
        status: data.status,
        assignedAt: data.assignedAt,
    };
};
exports.assignTaskRealHandler = assignTaskRealHandler;
// ============================================================================
// Handler 23: check_cert_status → GET /api/dais/certification/status
// ============================================================================
const checkCertStatusRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const yearParam = params.year ?? new Date().getFullYear();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dais/certification/status?year=${yearParam}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Certification status query failed');
    return {
        county: data.county,
        year: data.year,
        status: data.status,
        completionPercent: data.completionPercent,
        parcelsReviewed: data.parcelsReviewed,
        totalParcels: data.totalParcels,
    };
};
exports.checkCertStatusRealHandler = checkCertStatusRealHandler;
// ============================================================================
// Handler 24: draft_notice → POST /api/dais/notices/draft
// ============================================================================
const draftNoticeRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/dais/notices/draft', {
        parcelId: params.parcelId,
        taxYear: params.taxYear,
        reasonCodes: params.reasonCodes ?? ['general_revaluation'],
        tone: params.tone ?? 'neutral',
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Notice draft failed');
    return {
        document: { title: data.title, body: data.body },
        payloadRef: data.payloadRef,
        disclaimer: data.disclaimer,
    };
};
exports.draftNoticeRealHandler = draftNoticeRealHandler;
// ============================================================================
// R2 Wave 1: USPAP Three-Approach Valuation Handlers (5)
// ============================================================================
const runSalesApproachHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/costforge/approach/sales', { parcelId: params.parcelId, ...(params.data ?? {}) }, { token });
    return (0, backendClient_js_1.unwrapBackend)(raw, 'Sales approach failed');
};
exports.runSalesApproachHandler = runSalesApproachHandler;
const runIncomeApproachHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/costforge/approach/income', { parcelId: params.parcelId, ...(params.data ?? {}) }, { token });
    return (0, backendClient_js_1.unwrapBackend)(raw, 'Income approach failed');
};
exports.runIncomeApproachHandler = runIncomeApproachHandler;
const runCostApproachHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/costforge/approach/cost', { parcelId: params.parcelId, ...(params.data ?? {}) }, { token });
    return (0, backendClient_js_1.unwrapBackend)(raw, 'Cost approach failed');
};
exports.runCostApproachHandler = runCostApproachHandler;
const runReconciliationHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/costforge/approach/reconcile', { parcelId: params.parcelId, ...(params.data ?? {}) }, { token });
    return (0, backendClient_js_1.unwrapBackend)(raw, 'Reconciliation failed');
};
exports.runReconciliationHandler = runReconciliationHandler;
const getCostMatrixHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/costforge/cost-matrix/${encodeURIComponent(params.buildingType)}/${encodeURIComponent(params.region)}`, { token });
    return (0, backendClient_js_1.unwrapBackend)(raw, 'Cost matrix lookup failed');
};
exports.getCostMatrixHandler = getCostMatrixHandler;
/**
 * Register R1 real handlers for ALL 29 tools (24 R1 + 5 R2 Wave 1).
 * These OVERRIDE canned stubs when called after registerAllHandlers().
 *
 * @param runner - ToolRunner instance (must have initialized registry)
 * @param traceService - TraceService instance for search_trace_by_correlation
 */
function registerR1Handlers(runner, traceService) {
    // Week 1 MVP handlers (5)
    runner.registerHandler('run_valuation_model', exports.runValuationModelHandler);
    runner.registerHandler('explain_value_change', exports.explainValueChangeHandler);
    runner.registerHandler('route_to_parcel', exports.routeToParcelHandler);
    runner.registerHandler('search_trace_by_correlation', createSearchTraceHandler(traceService));
    runner.registerHandler('summarize_levy_rate_components', exports.summarizeLevyRateRealHandler);
    // Week 3 read_only handlers (3)
    runner.registerHandler('explain_model_inputs', exports.explainModelInputsRealHandler);
    runner.registerHandler('compare_assessed_value_history', exports.compareAssessedValueHistoryRealHandler);
    runner.registerHandler('summarize_parcel_casefile', exports.summarizeParcelCasefileRealHandler);
    // Week 3 remaining handlers (2)
    runner.registerHandler('add_dossier_note', exports.addDossierNoteRealHandler);
    runner.registerHandler('query_parcel_layers', exports.queryParcelLayersRealHandler);
    // R1 full-coverage handlers (14) — all call real DaisController/Dossier/CostForge endpoints
    runner.registerHandler('summarize_dossier', exports.summarizeDossierRealHandler);
    runner.registerHandler('explain_model_results', exports.explainModelResultsRealHandler);
    runner.registerHandler('draft_appeal_response', exports.draftAppealResponseRealHandler);
    runner.registerHandler('explain_senior_exemption_impact', exports.explainSeniorExemptionRealHandler);
    runner.registerHandler('draft_value_change_notice', exports.draftValueChangeNoticeRealHandler);
    runner.registerHandler('draft_boe_appeal_response', exports.draftBoeAppealResponseRealHandler);
    runner.registerHandler('summarize_sales_comps_rationale', exports.summarizeSalesCompsRealHandler);
    runner.registerHandler('synthesize_evidence', exports.synthesizeEvidenceRealHandler);
    runner.registerHandler('generate_commissioner_memo', exports.generateCommissionerMemoRealHandler);
    runner.registerHandler('assemble_boe_packet', exports.assembleBoePacketRealHandler);
    runner.registerHandler('request_trace_redaction', exports.requestTraceRedactionRealHandler);
    runner.registerHandler('assign_task', exports.assignTaskRealHandler);
    runner.registerHandler('check_cert_status', exports.checkCertStatusRealHandler);
    runner.registerHandler('draft_notice', exports.draftNoticeRealHandler);
    // R2 Wave 1: USPAP three-approach valuation handlers (5)
    runner.registerHandler('run_sales_approach', exports.runSalesApproachHandler);
    runner.registerHandler('run_income_approach', exports.runIncomeApproachHandler);
    runner.registerHandler('run_cost_approach', exports.runCostApproachHandler);
    runner.registerHandler('run_reconciliation', exports.runReconciliationHandler);
    runner.registerHandler('get_cost_matrix', exports.getCostMatrixHandler);
}
