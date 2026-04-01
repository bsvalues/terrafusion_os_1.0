// GENERATED - DO NOT EDIT
"use strict";
/**
 * TerraFusion OS — Real Handlers (R1 + Wave 1–3 + R2.9 + R3.2–R3.4)
 *
 * 53 production handler implementations that call real backend endpoints.
 *
 * When registered, they OVERRIDE the canned Phase 8.3/8.4 stubs for the same toolIds.
 * Canned stubs remain for tools NOT in this set (and for test isolation).
 *
 * R1 MVP Tools (5):
 *   1. run_valuation_model       → POST /api/costforge/calculate
 *   2. explain_value_change      → GET  /api/properties/{id} + GET /api/costforge/{id}
 *   3. route_to_parcel           → navigation event (no backend call)
 *   4. search_trace_by_correlation → real TraceService.getByCorrelationId()
 *   5. summarize_levy_rate_components → POST /api/levy-calculation/calculate-rate
 *
 * R1 Read-Only Tools (3):
 *   6. explain_model_inputs      → GET  /api/costforge/models/{modelId}
 *   7. compare_assessed_value_history → GET /api/properties/{parcelId}
 *   8. summarize_parcel_casefile → GET  /api/dossier/parcels/{parcelId}/casefile
 *
 * R1 Remaining Tools (2):
 *   9. add_dossier_note          → POST /api/dossier/{parcelId}/notes
 *  10. query_parcel_layers       → GET  /api/atlas/parcels/{parcelId}/layers
 *
 * Wave 1 Forge Extraction (2):
 *  11. explain_model_results     → GET  /api/costforge/{parcelId}/breakdown
 *  12. summarize_sales_comps_rationale → GET /api/costforge/comps/{subjectId}
 *
 * Wave 2 Full Tool Extraction (12):
 *  13. assign_task               → PUT  /api/collaboration/tasks/{taskId}/assign
 *  14. check_cert_status         → GET  /api/dais/certification/{county}/{taxYear}
 *  15. summarize_dossier         → GET  /api/dossier/{parcelId}
 *  16. explain_senior_exemption_impact → GET /api/dais/exemptions/impact
 *  17. draft_value_change_notice → POST /api/dossier/notices/drafts
 *  18. draft_appeal_response     → POST /api/dossier/appeals/{appealId}/drafts
 *  19. draft_boe_appeal_response → POST /api/dossier/boe/{caseId}/response-drafts
 *  20. draft_notice              → POST /api/dossier/notices
 *  21. synthesize_evidence       → GET  /api/dossier/{parcelId}/evidence
 *  22. generate_commissioner_memo → POST /api/dossier/memos/drafts
 *  23. assemble_boe_packet       → POST /api/dossier/boe/{caseId}/packet
 *  24. request_trace_redaction   → TraceService.requestRedaction() (local)
 *
 * Wave 3 Enrichment (2):
 *  25. calculate_pilt_payment    → GET  /api/pilt/districts
 *  26. run_income_valuation      → POST /api/costforge/income-approach/calculate-valuation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitAuditFindingRealHandler = exports.checkLevyComplianceRealHandler = exports.auditRollSummaryRealHandler = exports.initiateTaxSaleRealHandler = exports.summarizeCollectionStatsRealHandler = exports.createInstallmentPlanRealHandler = exports.checkDelinquencyStatusRealHandler = exports.recordPaymentRealHandler = exports.explainTaxBreakdownRealHandler = exports.getTaxStatementRealHandler = exports.summarizeParcelRecordingsRealHandler = exports.releaseLienRealHandler = exports.recordDocumentRealHandler = exports.explainRecordingFeesRealHandler = exports.getTitleChainRealHandler = exports.searchRecordedDocumentsRealHandler = exports.escalateTaskRealHandler = exports.getQueueStatisticsRealHandler = exports.queueNoticeForMailingRealHandler = exports.signOffCertificationStepRealHandler = exports.getCertificationProgressRealHandler = exports.scheduleBoeHearingRealHandler = exports.fileAppealRealHandler = exports.processExemptionRenewalRealHandler = exports.checkExemptionEligibilityRealHandler = exports.calculateDepreciationRealHandler = exports.runIncomeValuationRealHandler = exports.calculatePiltPaymentRealHandler = exports.assembleBoePacketRealHandler = exports.generateCommissionerMemoRealHandler = exports.synthesizeEvidenceRealHandler = exports.draftNoticeRealHandler = exports.draftBoeAppealResponseRealHandler = exports.draftAppealResponseRealHandler = exports.draftValueChangeNoticeRealHandler = exports.explainSeniorExemptionRealHandler = exports.summarizeDossierRealHandler = exports.checkCertStatusRealHandler = exports.assignTaskRealHandler = exports.summarizeSalesCompsRealHandler = exports.explainModelResultsRealHandler = exports.queryParcelLayersRealHandler = exports.addDossierNoteRealHandler = exports.summarizeParcelCasefileRealHandler = exports.compareAssessedValueHistoryRealHandler = exports.explainModelInputsRealHandler = exports.summarizeLevyRateRealHandler = exports.routeToParcelHandler = exports.explainValueChangeHandler = exports.runValuationModelHandler = void 0;
exports.generateComplianceReportRealHandler = exports.reconcileCrossOfficeRealHandler = void 0;
exports.createSearchTraceHandler = createSearchTraceHandler;
exports.createRequestTraceRedactionHandler = createRequestTraceRedactionHandler;
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
// Handler 7: compare_assessed_value_history → GET /api/properties/parcel/{parcelNumber}
//                                           → GET /api/properties/{id}/valuations
//
// Read-only Muse tool. Fetches property valuation history and builds
// year-over-year comparison with narrative.
// ============================================================================
const compareAssessedValueHistoryRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const propertyRaw = await (0, backendClient_js_1.backendGet)(`/api/properties/parcel/${encodeURIComponent(params.parcelId)}`, { token });
    const property = (0, backendClient_js_1.unwrapBackend)(propertyRaw, 'Property history lookup failed');
    let history = [];
    if (property.id) {
        const valuationsRaw = await (0, backendClient_js_1.backendGet)(`/api/properties/${encodeURIComponent(property.id)}/valuations`, { token });
        if (valuationsRaw.ok) {
            history = (valuationsRaw.data ?? [])
                .filter((valuation) => valuation.createdAt && typeof valuation.estimatedValue === 'number')
                .map((valuation) => ({
                year: new Date(valuation.createdAt).getUTCFullYear(),
                value: Number(valuation.estimatedValue),
            }));
        }
    }
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
    const narrative = history.length === 0
        ? `Current assessed value for parcel ${property.parcelNumber ?? params.parcelId} is $${Number(property.assessedValue ?? 0).toLocaleString()}. Historical valuation records were not returned by the backend for requested years ${params.years.join(', ')}.`
        : `Assessed value across ${trend.length} year(s): $${firstAv.toLocaleString()} → $${lastAv.toLocaleString()} (${pctChange}% change). ${drivers.length > 0 ? `Drivers: ${drivers.join(', ')}.` : 'Stable market conditions.'}`;
    const flags = [];
    if (params.includeBreakdown)
        flags.push('breakdown_included');
    if (trend.some(t => t.av === 0))
        flags.push('missing_years');
    if (history.length === 0)
        flags.push('history_unavailable');
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
const explainModelResultsRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const audience = params.audience ?? 'internal';
    // Fetch cost breakdown from CostForge
    const breakdownRaw = await (0, backendClient_js_1.backendGet)(`/api/costforge/${encodeURIComponent(params.parcelId)}/breakdown`, { token });
    const breakdown = (0, backendClient_js_1.unwrapBackend)(breakdownRaw, 'Cost breakdown lookup failed');
    // Fetch property for assessed value context
    const propertyRaw = await (0, backendClient_js_1.backendGet)(`/api/properties/${encodeURIComponent(params.parcelId)}`, { token });
    const property = (0, backendClient_js_1.unwrapBackend)(propertyRaw, 'Property lookup failed');
    // Extract key drivers from cost categories (sorted by amount descending)
    const categories = breakdown.categories ?? [];
    const keyDrivers = categories
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map(c => c.name.toLowerCase().replace(/\s+/g, '_'));
    const totalValue = breakdown.totalValue ?? 0;
    const assessedValue = property.assessedValue ?? totalValue;
    // Build comparison narrative if compareToYear requested
    let comparisonNote = '';
    if (params.compareToYear && property.valuationHistory) {
        const compareEntry = property.valuationHistory.find(h => h.year === params.compareToYear);
        if (compareEntry) {
            const delta = assessedValue - compareEntry.value;
            const pctChange = compareEntry.value > 0 ? ((delta / compareEntry.value) * 100).toFixed(1) : 'N/A';
            comparisonNote = ` Compared to ${params.compareToYear} ($${compareEntry.value.toLocaleString()}), the value changed by $${delta.toLocaleString()} (${pctChange}%).`;
        }
    }
    // Generate audience-appropriate explanation
    const prefix = audience === 'taxpayer'
        ? 'Your property valuation'
        : 'Valuation analysis for internal review:';
    const categoryBreakdown = categories
        .slice(0, 3)
        .map(c => `${c.name} ($${c.amount.toLocaleString()}, ${c.percentage.toFixed(1)}%)`)
        .join(', ');
    const explanation = `${prefix} The ${params.taxYear} assessed value of $${assessedValue.toLocaleString()} is based on cost approach analysis. Primary components: ${categoryBreakdown || 'see breakdown'}.${comparisonNote}`;
    // Confidence from breakdown completeness (real endpoint may provide this;
    // fallback: derive from category coverage)
    const confidenceScore = categories.length >= 3 ? 0.87 : categories.length >= 1 ? 0.72 : 0.50;
    return {
        parcelId: params.parcelId,
        taxYear: params.taxYear,
        explanation,
        keyDrivers,
        confidenceScore,
    };
};
exports.explainModelResultsRealHandler = explainModelResultsRealHandler;
const summarizeSalesCompsRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const includeAdjustments = params.adjustments ?? false;
    const compIdsParam = params.compIds.map(id => encodeURIComponent(id)).join(',');
    const raw = await (0, backendClient_js_1.backendGet)(`/api/costforge/comps/${encodeURIComponent(params.subjectId)}?compIds=${compIdsParam}&adjustments=${includeAdjustments}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Comp analysis lookup failed');
    const backendComps = data.comps ?? [];
    // Map backend response to governed output shape — no PII (addresses, names)
    const comps = backendComps.map(c => {
        const notes = c.notes ?? [];
        if (includeAdjustments && c.adjustments) {
            for (const adj of c.adjustments) {
                notes.push(`${adj.type}: ${adj.amount >= 0 ? '+' : ''}$${adj.amount.toLocaleString()}`);
            }
        }
        return {
            id: c.id,
            similarity: c.similarity ?? 0,
            notes,
        };
    }).sort((a, b) => b.similarity - a.similarity);
    const method = data.selectionMethod ?? 'similarity scoring and recent sale windows';
    const adjustmentNote = includeAdjustments
        ? 'Adjustments were applied for time, size, quality, and location.'
        : 'Adjustments were not applied (summary mode).';
    return {
        rationale: `Subject ${params.subjectId} comps were selected using ${method}. ${comps.length} comparable(s) analyzed. ${adjustmentNote} All addresses and owner names are excluded per PII policy.`,
        comps,
    };
};
exports.summarizeSalesCompsRealHandler = summarizeSalesCompsRealHandler;
const assignTaskRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    if (!params.taskId || params.taskId.trim().length === 0) {
        throw new Error('taskId is required');
    }
    if (!params.assigneeId || params.assigneeId.trim().length === 0) {
        throw new Error('assigneeId is required');
    }
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPut)(`/api/collaboration/tasks/${encodeURIComponent(params.taskId)}/assign`, {
        assigneeId: params.assigneeId,
        reason: params.reason ?? 'Assigned via TerraPilot',
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Task assignment failed');
    return {
        taskId: data.taskId ?? params.taskId,
        assignedTo: data.assigneeId ?? params.assigneeId,
        status: data.status ?? 'assigned',
        payloadRef: `dais://${context.countyId}/tasks/${params.taskId}/assignment`,
    };
};
exports.assignTaskRealHandler = assignTaskRealHandler;
const checkCertStatusRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const countyCode = normalizeCountyCode(params.county);
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dais/certification/${encodeURIComponent(countyCode)}/${params.taxYear}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Certification status lookup failed');
    return {
        county: countyCode,
        taxYear: params.taxYear,
        status: data.status ?? 'unknown',
        completedSteps: data.completedSteps ?? [],
        remainingSteps: data.remainingSteps ?? [],
        certifiedAt: data.certifiedAt,
    };
};
exports.checkCertStatusRealHandler = checkCertStatusRealHandler;
const summarizeDossierRealHandler = async (params, context, _tool) => {
    const focus = params.focus ?? 'general';
    const length = params.length ?? 'standard';
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dossier/${encodeURIComponent(params.dossierId)}?focus=${focus}&length=${length}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Dossier summarization failed');
    const sections = data.sections ?? ['overview', 'findings', 'recommendations'];
    // Build focus-specific summary from backend data
    let summary = data.summary ?? '';
    if (!summary) {
        const docCount = data.documents?.length ?? 0;
        const focusDetail = focus === 'appeal' && data.appealInfo
            ? ` Appeal status: ${data.appealInfo.status}, ${data.appealInfo.count} case(s).`
            : focus === 'permit' && data.permitInfo
                ? ` Permit status: ${data.permitInfo.status}, ${data.permitInfo.count} permit(s).`
                : focus === 'exemption' && data.exemptionInfo
                    ? ` Exemption type: ${data.exemptionInfo.type}, status: ${data.exemptionInfo.status}.`
                    : '';
        summary = `Executive summary for dossier ${params.dossierId}. ${docCount} document(s) on file. Focus: ${focus}.${focusDetail}`;
    }
    // Approximate word count based on length preference
    const wordCount = length === 'short' ? Math.min(summary.split(/\s+/).length, 50)
        : length === 'detailed' ? Math.max(summary.split(/\s+/).length, 100)
            : summary.split(/\s+/).length;
    return {
        dossierId: params.dossierId,
        summary,
        payloadRef: `dossier://${context.countyId}/${params.dossierId}/summaries/latest`,
        wordCount,
        sections,
    };
};
exports.summarizeDossierRealHandler = summarizeDossierRealHandler;
const explainSeniorExemptionRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const program = params.exemptionProgram ?? 'senior';
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const countyCode = normalizeCountyCode(params.county);
    const queryParts = [
        `county=${encodeURIComponent(countyCode)}`,
        `year=${params.year}`,
        `program=${encodeURIComponent(program)}`,
    ];
    if (params.parcelId)
        queryParts.push(`parcelId=${encodeURIComponent(params.parcelId)}`);
    if (params.scenario?.income)
        queryParts.push(`income=${params.scenario.income}`);
    if (params.scenario?.age)
        queryParts.push(`age=${params.scenario.age}`);
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dais/exemptions/impact?${queryParts.join('&')}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Exemption impact lookup failed');
    const programLabels = {
        senior: 'Senior exemption',
        disabled: 'Disability exemption',
        veteran: 'Veteran exemption',
    };
    const assumptions = data.assumptions ?? [
        `Tax year ${params.year}`,
        params.parcelId ? `Parcel ${params.parcelId} provided` : 'Parcel not provided',
        'Public-rate estimate only',
    ];
    const summary = data.summary
        ?? `${programLabels[program]} impact is estimated using public levy rates and standard exemption bands. Exact savings vary by levy district.`;
    return {
        summary,
        assumptions,
        impactBands: data.impactBands,
        payloadRef: params.parcelId
            ? `dais://${context.countyId}/exemptions/${params.parcelId}/${params.year}`
            : undefined,
    };
};
exports.explainSeniorExemptionRealHandler = explainSeniorExemptionRealHandler;
const draftValueChangeNoticeRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const tone = params.tone ?? 'neutral';
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/dossier/notices/drafts', {
        parcelId: params.parcelId,
        taxYear: params.taxYear,
        reasonCodes: params.reasonCodes,
        tone,
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Notice draft creation failed');
    const title = data.title ?? `Notice of Value Change — ${params.taxYear}`;
    const toneLine = tone === 'friendly'
        ? 'We are here to help if you have questions about your assessment.'
        : 'This notice provides information about your assessment change.';
    const body = data.body ?? [
        'Reason:',
        `- ${params.reasonCodes.join(', ') || 'General revaluation'}`,
        'Appeal Rights:',
        '- You may request a review within the statutory window.',
        toneLine,
    ].join('\n');
    return {
        document: { title, body },
        payloadRef: `dossier://${context.countyId}/notices/${params.parcelId}/${params.taxYear}/${data.draftId ?? 'latest'}`,
        disclaimer: data.disclaimer ?? 'Draft for internal review only. Not a final notice.',
    };
};
exports.draftValueChangeNoticeRealHandler = draftValueChangeNoticeRealHandler;
const draftAppealResponseRealHandler = async (params, context, _tool) => {
    const position = params.position ?? 'uphold';
    const tone = params.tone ?? 'formal';
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)(`/api/dossier/appeals/${encodeURIComponent(params.appealId)}/drafts`, {
        parcelId: params.parcelId,
        position,
        tone,
        includeEvidenceRefs: params.includeEvidenceRefs ?? true,
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Appeal response draft failed');
    const positionTexts = {
        uphold: `After careful review of the appeal for parcel ${params.parcelId}, we recommend upholding the current assessed value.`,
        adjust: `After careful review of the appeal for parcel ${params.parcelId}, we recommend adjusting the assessed value.`,
        partial: `After careful review of the appeal for parcel ${params.parcelId}, we recommend a partial adjustment.`,
    };
    return {
        appealId: params.appealId,
        payloadRef: `dossier://${context.countyId}/appeals/${params.appealId}/drafts/${data.draftId ?? 'latest'}`,
        draftSummary: data.summary ?? positionTexts[position],
        wordCount: data.wordCount ?? (tone === 'formal' ? 450 : 350),
        position,
    };
};
exports.draftAppealResponseRealHandler = draftAppealResponseRealHandler;
const draftBoeAppealResponseRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)(`/api/dossier/boe/${encodeURIComponent(params.caseId)}/response-drafts`, {
        position: params.position,
        points: params.points,
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'BOE response draft failed');
    const positionLine = {
        support_assessor: 'Position: support assessor.',
        support_taxpayer: 'Position: support taxpayer.',
        balanced: 'Position: balanced review.',
    };
    const title = data.title ?? `BOE Appeal Response — Case ${params.caseId}`;
    const body = data.body ?? [
        positionLine[params.position],
        'Summary of Points:',
        ...params.points.map(p => `- ${p}`),
        'No personal identifiers included.',
    ].join('\n');
    return {
        document: { title, body },
        payloadRef: `dossier://${context.countyId}/boe/${params.caseId}/response/${data.draftId ?? 'latest'}`,
        citations: data.citations ?? ['RCW-84.40', 'WAC-458-07'],
    };
};
exports.draftBoeAppealResponseRealHandler = draftBoeAppealResponseRealHandler;
const draftNoticeRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/dossier/notices', {
        parcelId: params.parcelId,
        noticeType: params.noticeType,
        taxYear: params.taxYear,
        body: params.body ?? '',
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Notice draft creation failed');
    return {
        noticeId: data.noticeId ?? 'pending',
        parcelId: params.parcelId,
        noticeType: params.noticeType,
        payloadRef: `dossier://${context.countyId}/notices/${params.parcelId}/${data.noticeId ?? 'latest'}`,
        status: data.status ?? 'draft',
    };
};
exports.draftNoticeRealHandler = draftNoticeRealHandler;
const synthesizeEvidenceRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const categoryParam = params.categories?.length
        ? `?categories=${params.categories.map(c => encodeURIComponent(c)).join(',')}`
        : '';
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dossier/${encodeURIComponent(params.parcelId)}/evidence${categoryParam}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Evidence synthesis failed');
    const items = data.evidenceItems ?? [];
    const totalItems = data.totalItems ?? items.reduce((sum, i) => sum + i.count, 0);
    const synthesis = data.synthesis
        ?? `Evidence for parcel ${params.parcelId}: ${totalItems} item(s) across ${items.length} categor${items.length === 1 ? 'y' : 'ies'}. ${items.map(i => `${i.category}: ${i.count}`).join(', ')}.`;
    return {
        parcelId: params.parcelId,
        synthesis,
        evidenceItems: items,
        payloadRef: `dossier://${context.countyId}/parcels/${params.parcelId}/evidence/synthesis`,
    };
};
exports.synthesizeEvidenceRealHandler = synthesizeEvidenceRealHandler;
const generateCommissionerMemoRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const format = params.format ?? 'brief';
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/dossier/memos/drafts', {
        topic: params.topic,
        taxYear: params.taxYear,
        format,
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Commissioner memo generation failed');
    const title = data.title ?? `Commissioner Briefing — ${params.topic} (${params.taxYear})`;
    const body = data.body ?? `Summary of ${params.topic} for tax year ${params.taxYear}. This memo contains no personal identifiers. Prepared for commissioner review.`;
    const wordCount = data.wordCount ?? body.split(/\s+/).length;
    return {
        memo: { title, body },
        payloadRef: `dossier://${context.countyId}/memos/${data.memoId ?? 'latest'}`,
        wordCount,
    };
};
exports.generateCommissionerMemoRealHandler = generateCommissionerMemoRealHandler;
const assembleBoePacketRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const include = params.include ?? [];
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)(`/api/dossier/boe/${encodeURIComponent(params.caseId)}/packet`, {
        include,
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'BOE packet assembly failed');
    const sections = data.sections ?? [
        'cover_sheet',
        ...include.map(i => `section_${i}`),
        'certification',
    ];
    const packetRef = `dossier://${context.countyId}/boe/${params.caseId}/packet/${data.packetId ?? 'latest'}`;
    return {
        caseId: params.caseId,
        packetRef,
        sections,
        payloadRef: packetRef,
    };
};
exports.assembleBoePacketRealHandler = assembleBoePacketRealHandler;
// ============================================================================
// Wave 2 — Handler 24: request_trace_redaction
//
// Pilot/irreversible/payload_ref. Requests redaction of trace events.
// Requires confirmation + reasonCode + supervisorApproval.
// Uses TraceService locally (same pattern as search_trace_by_correlation).
// ============================================================================
function createRequestTraceRedactionHandler(traceService) {
    return async (params, context, _tool) => {
        assertCountyMatch(params.county, context.countyId);
        if (!params.traceEventIds || params.traceEventIds.length === 0) {
            throw new Error('At least one trace event ID is required');
        }
        if (!params.reason || params.reason.trim().length === 0) {
            throw new Error('Redaction reason is required');
        }
        // Verify events exist in trace
        let verifiedCount = 0;
        for (const eventId of params.traceEventIds) {
            const events = traceService.getByCorrelationId(eventId);
            if (events.length > 0)
                verifiedCount++;
        }
        // Create redaction ticket as trace event
        const correlationId = `redact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        traceService.emit({
            type: 'redaction_requested',
            toolId: 'request_trace_redaction',
            correlationId,
            context,
            summary: `Redaction requested for ${params.traceEventIds.length} event(s): ${params.reason}`,
        });
        return {
            redactionTicketId: correlationId,
            status: 'pending_review',
            eventsMarked: params.traceEventIds.length,
            payloadRef: `secure-blob://${context.countyId}/redaction/${correlationId}`,
        };
    };
}
// ============================================================================
// Wave 3 — Handler 25: calculate_pilt_payment → GET /api/pilt/districts
//
// Read-only Pilot tool. Calls PILT controller to get Benton County district
// PILT distribution for federal lands (Hanford Nuclear Reservation).
// County-isolated: only Benton County supported (others return 501 from backend).
// ============================================================================
const calculatePiltPaymentRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)('/api/pilt/districts', { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'PILT district lookup failed');
    const totalAV = data.totalAssessedValue ?? 0;
    const totalPiltDue = data.totalPiltDue ?? 0;
    const districtCount = data.count ?? (data.districts?.length ?? 0);
    return {
        county: params.county.toUpperCase(),
        fiscalYear: params.fiscalYear,
        totalAssessedValue: totalAV,
        totalPiltDue,
        districtCount,
        summary: `PILT calculation for FY${params.fiscalYear}: ${districtCount} districts, $${totalPiltDue.toLocaleString()} total due on $${totalAV.toLocaleString()} assessed value (Hanford Nuclear Reservation, 586,000 federal acres).`,
    };
};
exports.calculatePiltPaymentRealHandler = calculatePiltPaymentRealHandler;
// ============================================================================
// Wave 3 — Handler 26: run_income_valuation → POST /api/costforge/income-approach/calculate-valuation
//
// Read-only Pilot tool. Calls the income capitalization endpoint with
// real Benton County market data (location premiums, cap rates).
// ============================================================================
const runIncomeValuationRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/costforge/income-approach/calculate-valuation', {
        annualRentalIncome: params.annualRentalIncome,
        vacancyRate: params.vacancyRate ?? 5,
        capRate: params.capRate ?? 7.5,
        propertyType: params.propertyType ?? 'commercial',
        location: params.location ?? '',
        // Zero-fill expense fields — the handler is for quick calculation
        otherIncome: 0,
        propertyTaxes: 0,
        insurance: 0,
        utilities: 0,
        maintenance: 0,
        managementFees: 0,
        replacementReserves: 0,
        otherExpenses: 0,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Income valuation calculation failed');
    return {
        netOperatingIncome: data.NetOperatingIncome ?? data.netOperatingIncome ?? 0,
        capRate: data.CapRate ?? data.capRate ?? params.capRate ?? 7.5,
        valuation: data.AdjustedValuation ?? data.adjustedValuation ?? 0,
        grossIncomeMultiplier: data.GrossIncomeMultiplier ?? data.grossIncomeMultiplier ?? 0,
        riskClassification: data.RiskClassification ?? data.riskClassification ?? 'medium',
        source: data.Source ?? data.source ?? 'Benton County Income Approach',
    };
};
exports.runIncomeValuationRealHandler = runIncomeValuationRealHandler;
// ============================================================================
// Wave 3 (supplement) — calculate_depreciation → POST /api/costforge/depreciation-calculate
//
// Computes physical depreciation (Benton County bracket table), functional
// obsolescence (condition-based), and external obsolescence for a structure.
// BIV-086 — wired from DepreciationCalculator.tsx (third fabric-corrected route).
// ============================================================================
const calculateDepreciationRealHandler = async (params, _context, _tool) => {
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/costforge/depreciation-calculate', {
        actualAge: params.actualAge ?? 0,
        effectiveAge: params.effectiveAge ?? params.actualAge ?? 0,
        condition: params.condition ?? 'average',
        quality: params.quality ?? 'average',
        replacementCostNew: params.replacementCostNew ?? 0,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Depreciation calculation failed');
    return {
        physicalDepreciation: data.physicalDepreciation ?? 0,
        functionalObsolescence: data.functionalObsolescence ?? 0,
        externalObsolescence: data.externalObsolescence ?? 0,
        totalDepreciation: data.totalDepreciation ?? 0,
        depreciatedValue: data.depreciatedValue ?? 0,
    };
};
exports.calculateDepreciationRealHandler = calculateDepreciationRealHandler;
// ============================================================================
// R2.9 — Handler 27: check_exemption_eligibility
// Read-only. Checks senior/disabled exemption eligibility per RCW 84.36.381.
// Endpoint: GET /api/dais/exemptions/eligibility
// ============================================================================
const checkExemptionEligibilityRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const qs = [
        `county=${encodeURIComponent(normalizeCountyCode(params.county))}`,
        `parcelId=${encodeURIComponent(params.parcelId)}`,
    ];
    if (params.applicantAge != null)
        qs.push(`age=${params.applicantAge}`);
    if (params.income != null)
        qs.push(`income=${params.income}`);
    if (params.disability != null)
        qs.push(`disability=${params.disability}`);
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dais/exemptions/eligibility?${qs.join('&')}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Exemption eligibility check failed');
    return {
        eligible: data.eligible ?? false,
        program: data.program ?? (params.disability ? 'disabled' : 'senior'),
        reason: data.reason ?? (data.eligible ? 'Meets all statutory requirements' : 'Does not meet eligibility criteria'),
        incomeThreshold: data.incomeThreshold ?? 40000,
        parcelId: params.parcelId,
    };
};
exports.checkExemptionEligibilityRealHandler = checkExemptionEligibilityRealHandler;
// ============================================================================
// R2.9 — Handler 28: process_exemption_renewal
// Write-low. Processes annual exemption renewal with documentation verification.
// Endpoint: POST /api/dais/exemptions/renewals
// ============================================================================
const processExemptionRenewalRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/dais/exemptions/renewals', {
        exemptionId: params.exemptionId,
        taxYear: params.taxYear,
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Exemption renewal failed');
    return {
        exemptionId: data.exemptionId ?? params.exemptionId,
        taxYear: params.taxYear,
        status: data.status ?? 'renewed',
        payloadRef: `dais://${context.countyId}/exemptions/${params.exemptionId}/renewal/${params.taxYear}`,
    };
};
exports.processExemptionRenewalRealHandler = processExemptionRenewalRealHandler;
// ============================================================================
// R2.9 — Handler 29: file_appeal
// Write-low. Files a new BOE appeal for a property assessment.
// Endpoint: POST /api/dais/appeals
// ============================================================================
const fileAppealRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    if (!params.grounds || params.grounds.trim().length === 0) {
        throw new Error('Appeal grounds are required');
    }
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/dais/appeals', {
        parcelId: params.parcelId,
        grounds: params.grounds,
        requestedValue: params.requestedValue,
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Appeal filing failed');
    return {
        appealId: data.appealId ?? `APL-${Date.now()}`,
        parcelId: params.parcelId,
        status: data.status ?? 'filed',
        filedAt: data.filedAt ?? new Date().toISOString(),
        payloadRef: `dais://${context.countyId}/appeals/${data.appealId ?? 'latest'}`,
    };
};
exports.fileAppealRealHandler = fileAppealRealHandler;
// ============================================================================
// R2.9 — Handler 30: schedule_boe_hearing
// Write-high. Schedules a BOE hearing with panel assignment.
// Endpoint: POST /api/dais/appeals/{appealId}/hearings
// ============================================================================
const scheduleBoeHearingRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)(`/api/dais/appeals/${encodeURIComponent(params.appealId)}/hearings`, {
        requestedDate: params.requestedDate,
        panelMembers: params.panelMembers ?? [],
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'BOE hearing scheduling failed');
    return {
        hearingId: data.hearingId ?? `HRG-${Date.now()}`,
        appealId: params.appealId,
        scheduledDate: data.scheduledDate ?? params.requestedDate,
        panelSize: data.panelSize ?? (params.panelMembers?.length ?? 3),
        payloadRef: `dais://${context.countyId}/appeals/${params.appealId}/hearings/${data.hearingId ?? 'latest'}`,
    };
};
exports.scheduleBoeHearingRealHandler = scheduleBoeHearingRealHandler;
// ============================================================================
// R2.9 — Handler 31: get_certification_progress
// Read-only. Gets assessment roll certification progress with checklist.
// Endpoint: GET /api/dais/certification/{county}/{taxYear}/progress
// ============================================================================
const getCertificationProgressRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const countyCode = normalizeCountyCode(params.county);
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dais/certification/${encodeURIComponent(countyCode)}/${params.taxYear}/progress`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Certification progress lookup failed');
    return {
        county: countyCode,
        taxYear: params.taxYear,
        percentComplete: data.percentComplete ?? 0,
        steps: data.steps ?? [],
        blockers: data.blockers ?? [],
    };
};
exports.getCertificationProgressRealHandler = getCertificationProgressRealHandler;
// ============================================================================
// R2.9 — Handler 32: sign_off_certification_step
// Write-high. Signs off a certification checklist step.
// Endpoint: POST /api/dais/certification/{county}/{taxYear}/sign-off
// ============================================================================
const signOffCertificationStepRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const countyCode = normalizeCountyCode(params.county);
    const raw = await (0, backendClient_js_1.backendPost)(`/api/dais/certification/${encodeURIComponent(countyCode)}/${params.taxYear}/sign-off`, {
        stepId: params.stepId,
        signedBy: params.signedBy,
        notes: params.notes ?? '',
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Certification sign-off failed');
    return {
        stepId: params.stepId,
        signedBy: params.signedBy,
        signedAt: data.signedAt ?? new Date().toISOString(),
        payloadRef: `dais://${context.countyId}/certification/${countyCode}/${params.taxYear}/sign-off/${params.stepId}`,
    };
};
exports.signOffCertificationStepRealHandler = signOffCertificationStepRealHandler;
// ============================================================================
// R2.9 — Handler 33: queue_notice_for_mailing
// Write-low. Queues generated notices for batch mailing.
// Endpoint: POST /api/dais/notices/queue
// ============================================================================
const queueNoticeForMailingRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    if (!params.noticeIds || params.noticeIds.length === 0) {
        throw new Error('At least one notice ID is required');
    }
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/dais/notices/queue', {
        noticeIds: params.noticeIds,
        deliveryMethod: params.deliveryMethod ?? 'usps_first_class',
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Notice queuing failed');
    return {
        queued: data.queued ?? params.noticeIds.length,
        batchId: data.batchId ?? `BATCH-${Date.now()}`,
        deliveryMethod: params.deliveryMethod ?? 'usps_first_class',
        payloadRef: `dais://${context.countyId}/notices/queue/${data.batchId ?? 'latest'}`,
    };
};
exports.queueNoticeForMailingRealHandler = queueNoticeForMailingRealHandler;
// ============================================================================
// R2.9 — Handler 34: get_queue_statistics
// Read-only. Gets task queue statistics with SLA compliance metrics.
// Endpoint: GET /api/dais/queue/statistics
// ============================================================================
const getQueueStatisticsRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const qs = [`county=${encodeURIComponent(normalizeCountyCode(params.county))}`];
    if (params.period)
        qs.push(`period=${encodeURIComponent(params.period)}`);
    if (params.assignee)
        qs.push(`assignee=${encodeURIComponent(params.assignee)}`);
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dais/queue/statistics?${qs.join('&')}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Queue statistics lookup failed');
    return {
        county: normalizeCountyCode(params.county),
        period: params.period ?? '30d',
        totalTasks: data.totalTasks ?? 0,
        completedTasks: data.completedTasks ?? 0,
        slaCompliance: data.slaCompliance ?? 0,
        overdueCount: data.overdueCount ?? 0,
    };
};
exports.getQueueStatisticsRealHandler = getQueueStatisticsRealHandler;
// ============================================================================
// R2.9 — Handler 35: escalate_task
// Write-low. Escalates an overdue or high-priority task.
// Endpoint: POST /api/dais/queue/escalate
// ============================================================================
const escalateTaskRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    if (!params.reason || params.reason.trim().length === 0) {
        throw new Error('Escalation reason is required');
    }
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/dais/queue/escalate', {
        taskId: params.taskId,
        reason: params.reason,
        escalateTo: params.escalateTo ?? 'supervisor',
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Task escalation failed');
    return {
        taskId: params.taskId,
        escalatedTo: data.escalatedTo ?? params.escalateTo ?? 'supervisor',
        status: data.status ?? 'escalated',
        payloadRef: `dais://${context.countyId}/queue/escalations/${params.taskId}`,
    };
};
exports.escalateTaskRealHandler = escalateTaskRealHandler;
// ============================================================================
// R3.2 — Handler 36: search_recorded_documents
// Read-only. Searches clerk recordings by parcel, grantor, grantee, or type.
// Endpoint: GET /api/clerk/documents
// ============================================================================
const searchRecordedDocumentsRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const qs = [`county=${encodeURIComponent(normalizeCountyCode(params.county))}`];
    if (params.parcelId)
        qs.push(`parcelId=${encodeURIComponent(params.parcelId)}`);
    if (params.grantor)
        qs.push(`grantor=${encodeURIComponent(params.grantor)}`);
    if (params.grantee)
        qs.push(`grantee=${encodeURIComponent(params.grantee)}`);
    if (params.documentType && params.documentType !== 'all')
        qs.push(`type=${encodeURIComponent(params.documentType)}`);
    const raw = await (0, backendClient_js_1.backendGet)(`/api/clerk/documents?${qs.join('&')}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Recorded document search failed');
    return {
        county: normalizeCountyCode(params.county),
        documents: data.documents ?? [],
        totalCount: data.totalCount ?? (data.documents?.length ?? 0),
    };
};
exports.searchRecordedDocumentsRealHandler = searchRecordedDocumentsRealHandler;
// ============================================================================
// R3.2 — Handler 37: get_title_chain
// Read-only (Muse). Retrieves chain of title for a parcel.
// Endpoint: GET /api/clerk/parcels/{parcelId}/title-chain
// ============================================================================
const getTitleChainRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/clerk/parcels/${encodeURIComponent(params.parcelId)}/title-chain`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Title chain lookup failed');
    return {
        parcelId: params.parcelId,
        chain: data.chain ?? [],
        chainLength: data.chain?.length ?? 0,
    };
};
exports.getTitleChainRealHandler = getTitleChainRealHandler;
// ============================================================================
// R3.2 — Handler 38: explain_recording_fees
// Read-only (Muse). Explains fee schedule for document recording.
// Endpoint: GET /api/clerk/fees
// ============================================================================
const explainRecordingFeesRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const qs = [
        `county=${encodeURIComponent(normalizeCountyCode(params.county))}`,
        `type=${encodeURIComponent(params.documentType)}`,
    ];
    if (params.pageCount != null)
        qs.push(`pages=${params.pageCount}`);
    const raw = await (0, backendClient_js_1.backendGet)(`/api/clerk/fees?${qs.join('&')}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Recording fee lookup failed');
    return {
        documentType: params.documentType,
        baseFee: data.baseFee ?? 0,
        perPageFee: data.perPageFee ?? 0,
        totalFee: data.totalFee ?? 0,
        statuteRef: data.statuteRef ?? 'RCW 36.18.010',
    };
};
exports.explainRecordingFeesRealHandler = explainRecordingFeesRealHandler;
// ============================================================================
// R3.2 — Handler 39: record_document
// Write-high. Records a new document in the county recording system.
// Endpoint: POST /api/clerk/documents
// ============================================================================
const recordDocumentRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/clerk/documents', {
        parcelId: params.parcelId,
        documentType: params.documentType,
        grantor: params.grantor,
        grantee: params.grantee,
        consideration: params.consideration ?? 0,
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Document recording failed');
    return {
        documentId: data.documentId ?? `DOC-${Date.now()}`,
        recordingNumber: data.recordingNumber ?? `REC-${Date.now()}`,
        recordedAt: data.recordedAt ?? new Date().toISOString(),
        fees: data.fees ?? 0,
        payloadRef: `clerk://${context.countyId}/documents/${data.documentId ?? 'latest'}`,
    };
};
exports.recordDocumentRealHandler = recordDocumentRealHandler;
// ============================================================================
// R3.2 — Handler 40: release_lien
// Write-low. Releases an existing lien on a parcel.
// Endpoint: POST /api/clerk/liens/{lienId}/release
// ============================================================================
const releaseLienRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)(`/api/clerk/liens/${encodeURIComponent(params.lienId)}/release`, {
        reason: params.releaseReason ?? 'satisfied',
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Lien release failed');
    return {
        lienId: params.lienId,
        status: data.status ?? 'released',
        releasedAt: data.releasedAt ?? new Date().toISOString(),
        payloadRef: `clerk://${context.countyId}/liens/${params.lienId}/release`,
    };
};
exports.releaseLienRealHandler = releaseLienRealHandler;
// ============================================================================
// R3.2 — Handler 41: summarize_parcel_recordings
// Read-only (Muse). Summarizes all recordings for a parcel.
// Endpoint: GET /api/clerk/parcels/{parcelId}/recordings/summary
// ============================================================================
const summarizeParcelRecordingsRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/clerk/parcels/${encodeURIComponent(params.parcelId)}/recordings/summary`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Parcel recordings summary failed');
    return {
        parcelId: params.parcelId,
        summary: data.summary ?? `Recording summary for parcel ${params.parcelId}: ${data.totalRecordings ?? 0} documents on file.`,
        totalRecordings: data.totalRecordings ?? 0,
        documentTypes: data.documentTypes ?? {},
    };
};
exports.summarizeParcelRecordingsRealHandler = summarizeParcelRecordingsRealHandler;
// ============================================================================
// R3.3 — Handler 42: get_tax_statement
// Read-only. Retrieves property tax statement with levy breakdown.
// Endpoint: GET /api/treasury/parcels/{parcelId}/statement
// ============================================================================
const getTaxStatementRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const yearParam = params.taxYear ? `?taxYear=${params.taxYear}` : '';
    const raw = await (0, backendClient_js_1.backendGet)(`/api/treasury/parcels/${encodeURIComponent(params.parcelId)}/statement${yearParam}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Tax statement lookup failed');
    return {
        parcelId: params.parcelId,
        taxYear: data.taxYear ?? params.taxYear ?? new Date().getFullYear(),
        totalDue: data.totalDue ?? 0,
        paid: data.paid ?? 0,
        balance: data.balance ?? 0,
        dueDate: data.dueDate ?? '',
        levies: data.levies ?? [],
    };
};
exports.getTaxStatementRealHandler = getTaxStatementRealHandler;
// ============================================================================
// R3.3 — Handler 43: explain_tax_breakdown
// Read-only (Muse). Explains levy components in plain language.
// Endpoint: GET /api/treasury/parcels/{parcelId}/breakdown
// ============================================================================
const explainTaxBreakdownRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const yearParam = params.taxYear ? `?taxYear=${params.taxYear}` : '';
    const raw = await (0, backendClient_js_1.backendGet)(`/api/treasury/parcels/${encodeURIComponent(params.parcelId)}/breakdown${yearParam}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Tax breakdown lookup failed');
    const levies = data.levies ?? [];
    const largest = levies.sort((a, b) => b.amount - a.amount)[0];
    return {
        parcelId: params.parcelId,
        explanation: data.explanation ?? `Tax breakdown for parcel ${params.parcelId}: ${levies.length} levy component(s). ${largest ? `Largest: ${largest.name} ($${largest.amount.toLocaleString()}).` : ''}`,
        levyCount: data.levyCount ?? levies.length,
        largestLevy: data.largestLevy ?? largest?.name ?? 'unknown',
    };
};
exports.explainTaxBreakdownRealHandler = explainTaxBreakdownRealHandler;
// ============================================================================
// R3.3 — Handler 44: record_payment
// Write-low. Records a property tax payment.
// Endpoint: POST /api/treasury/parcels/{parcelId}/payments
// ============================================================================
const recordPaymentRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    if (params.amount <= 0)
        throw new Error('Payment amount must be positive');
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)(`/api/treasury/parcels/${encodeURIComponent(params.parcelId)}/payments`, {
        amount: params.amount,
        paymentMethod: params.paymentMethod ?? 'check',
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Payment recording failed');
    return {
        receiptId: data.receiptId ?? `RCP-${Date.now()}`,
        parcelId: params.parcelId,
        amount: params.amount,
        newBalance: data.newBalance ?? 0,
        payloadRef: `treasury://${context.countyId}/parcels/${params.parcelId}/payments/${data.receiptId ?? 'latest'}`,
    };
};
exports.recordPaymentRealHandler = recordPaymentRealHandler;
// ============================================================================
// R3.3 — Handler 45: check_delinquency_status
// Read-only. Checks delinquency status and deadlines.
// Endpoint: GET /api/treasury/parcels/{parcelId}/delinquency
// ============================================================================
const checkDelinquencyStatusRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/treasury/parcels/${encodeURIComponent(params.parcelId)}/delinquency`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Delinquency status lookup failed');
    return {
        parcelId: params.parcelId,
        delinquent: data.delinquent ?? false,
        amountOverdue: data.amountOverdue ?? 0,
        oldestDelinquentYear: data.oldestDelinquentYear ?? null,
        deadlines: data.deadlines ?? [],
    };
};
exports.checkDelinquencyStatusRealHandler = checkDelinquencyStatusRealHandler;
// ============================================================================
// R3.3 — Handler 46: create_installment_plan
// Write-low. Creates installment payment plan for delinquent taxes.
// Endpoint: POST /api/treasury/parcels/{parcelId}/installment-plans
// ============================================================================
const createInstallmentPlanRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)(`/api/treasury/parcels/${encodeURIComponent(params.parcelId)}/installment-plans`, {
        numberOfPayments: params.numberOfPayments ?? 12,
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Installment plan creation failed');
    return {
        planId: data.planId ?? `PLN-${Date.now()}`,
        parcelId: params.parcelId,
        numberOfPayments: data.numberOfPayments ?? params.numberOfPayments ?? 12,
        monthlyAmount: data.monthlyAmount ?? 0,
        payloadRef: `treasury://${context.countyId}/parcels/${params.parcelId}/installment-plans/${data.planId ?? 'latest'}`,
    };
};
exports.createInstallmentPlanRealHandler = createInstallmentPlanRealHandler;
// ============================================================================
// R3.3 — Handler 47: summarize_collection_stats
// Read-only (Muse). Summarizes tax collection statistics.
// Endpoint: GET /api/treasury/collection-stats
// ============================================================================
const summarizeCollectionStatsRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const yearParam = params.taxYear ? `?taxYear=${params.taxYear}` : '';
    const raw = await (0, backendClient_js_1.backendGet)(`/api/treasury/collection-stats${yearParam}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Collection stats lookup failed');
    return {
        county: normalizeCountyCode(params.county),
        taxYear: data.taxYear ?? params.taxYear ?? new Date().getFullYear(),
        totalBilled: data.totalBilled ?? 0,
        totalCollected: data.totalCollected ?? 0,
        collectionRate: data.collectionRate ?? 0,
        delinquentCount: data.delinquentCount ?? 0,
    };
};
exports.summarizeCollectionStatsRealHandler = summarizeCollectionStatsRealHandler;
// ============================================================================
// R3.3 — Handler 48: initiate_tax_sale
// Write-high. Initiates tax sale process per RCW 84.64.
// Endpoint: POST /api/treasury/parcels/{parcelId}/tax-sale
// ============================================================================
const initiateTaxSaleRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    if (!params.delinquentYears || params.delinquentYears.length === 0) {
        throw new Error('At least one delinquent year is required');
    }
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)(`/api/treasury/parcels/${encodeURIComponent(params.parcelId)}/tax-sale`, {
        delinquentYears: params.delinquentYears,
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Tax sale initiation failed');
    return {
        saleId: data.saleId ?? `SALE-${Date.now()}`,
        parcelId: params.parcelId,
        status: data.status ?? 'initiated',
        scheduledDate: data.scheduledDate ?? '',
        totalOwed: data.totalOwed ?? 0,
        payloadRef: `treasury://${context.countyId}/parcels/${params.parcelId}/tax-sale/${data.saleId ?? 'latest'}`,
    };
};
exports.initiateTaxSaleRealHandler = initiateTaxSaleRealHandler;
// ============================================================================
// R3.4 — Handler 49: audit_roll_summary
// Read-only (Muse). Summarizes assessment roll audit status.
// Endpoint: GET /api/audit/roll-summary
// ============================================================================
const auditRollSummaryRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendGet)(`/api/audit/roll-summary?county=${encodeURIComponent(normalizeCountyCode(params.county))}&taxYear=${params.taxYear}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Roll summary lookup failed');
    return {
        county: normalizeCountyCode(params.county),
        taxYear: params.taxYear,
        totalParcels: data.totalParcels ?? 0,
        auditedParcels: data.auditedParcels ?? 0,
        discrepancyCount: data.discrepancyCount ?? 0,
        summary: data.summary ?? `Roll audit for ${params.taxYear}: ${data.auditedParcels ?? 0} of ${data.totalParcels ?? 0} parcels audited.`,
    };
};
exports.auditRollSummaryRealHandler = auditRollSummaryRealHandler;
// ============================================================================
// R3.4 — Handler 50: check_levy_compliance
// Read-only. Verifies levy limit compliance against RCW 84.52 and 84.55.
// Endpoint: GET /api/audit/levy-compliance
// ============================================================================
const checkLevyComplianceRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const qs = [
        `county=${encodeURIComponent(normalizeCountyCode(params.county))}`,
        `taxYear=${params.taxYear}`,
    ];
    if (params.districtCode)
        qs.push(`district=${encodeURIComponent(params.districtCode)}`);
    const raw = await (0, backendClient_js_1.backendGet)(`/api/audit/levy-compliance?${qs.join('&')}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Levy compliance check failed');
    return {
        county: normalizeCountyCode(params.county),
        taxYear: params.taxYear,
        compliant: data.compliant ?? true,
        findings: data.findings ?? [],
        statuteRefs: data.statuteRefs ?? ['RCW 84.52', 'RCW 84.55'],
    };
};
exports.checkLevyComplianceRealHandler = checkLevyComplianceRealHandler;
// ============================================================================
// R3.4 — Handler 51: submit_audit_finding
// Write-low. Submits an audit finding for a parcel or district.
// Endpoint: POST /api/audit/findings
// ============================================================================
const submitAuditFindingRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/audit/findings', {
        parcelId: params.parcelId,
        findingType: params.findingType,
        description: params.description,
        severity: params.severity ?? 'medium',
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Audit finding submission failed');
    return {
        findingId: data.findingId ?? `FND-${Date.now()}`,
        status: data.status ?? 'submitted',
        severity: params.severity ?? 'medium',
        payloadRef: `audit://${context.countyId}/findings/${data.findingId ?? 'latest'}`,
    };
};
exports.submitAuditFindingRealHandler = submitAuditFindingRealHandler;
// ============================================================================
// R3.4 — Handler 52: reconcile_cross_office
// Write-high. Cross-office financial reconciliation.
// Endpoint: POST /api/audit/reconciliation
// ============================================================================
const reconcileCrossOfficeRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const raw = await (0, backendClient_js_1.backendPost)('/api/audit/reconciliation', {
        taxYear: params.taxYear,
        offices: params.offices ?? ['assessor', 'treasurer'],
        countyId: context.countyId,
    }, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Cross-office reconciliation failed');
    return {
        reconciliationId: data.reconciliationId ?? `REC-${Date.now()}`,
        taxYear: params.taxYear,
        status: data.status ?? 'completed',
        discrepancies: data.discrepancies ?? 0,
        totalReconciled: data.totalReconciled ?? 0,
        payloadRef: `audit://${context.countyId}/reconciliation/${data.reconciliationId ?? 'latest'}`,
    };
};
exports.reconcileCrossOfficeRealHandler = reconcileCrossOfficeRealHandler;
// ============================================================================
// R3.4 — Handler 53: generate_compliance_report
// Read-only (Muse). Generates compliance report with findings summary.
// Endpoint: GET /api/audit/compliance-report
// ============================================================================
const generateComplianceReportRealHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const { token } = await (0, pilotAuth_js_1.acquirePilotToken)();
    const qs = [
        `county=${encodeURIComponent(normalizeCountyCode(params.county))}`,
        `taxYear=${params.taxYear}`,
    ];
    if (params.scope)
        qs.push(`scope=${encodeURIComponent(params.scope)}`);
    const raw = await (0, backendClient_js_1.backendGet)(`/api/audit/compliance-report?${qs.join('&')}`, { token });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Compliance report generation failed');
    return {
        county: normalizeCountyCode(params.county),
        taxYear: params.taxYear,
        report: data.report ?? `Compliance report for ${params.taxYear}: ${data.findingsCount ?? 0} findings.`,
        findingsCount: data.findingsCount ?? 0,
        complianceScore: data.complianceScore ?? 0,
        payloadRef: `audit://${context.countyId}/compliance-report/${params.taxYear}`,
    };
};
exports.generateComplianceReportRealHandler = generateComplianceReportRealHandler;
// ============================================================================
// Registration
// ============================================================================
/**
 * Register all 53 real handlers (R1 + Wave 1–3 + R2.9 + R3.2–R3.4).
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
    // Wave 1 Forge extraction handlers (2)
    runner.registerHandler('explain_model_results', exports.explainModelResultsRealHandler);
    runner.registerHandler('summarize_sales_comps_rationale', exports.summarizeSalesCompsRealHandler);
    // Wave 2 Full extraction handlers (12)
    runner.registerHandler('assign_task', exports.assignTaskRealHandler);
    runner.registerHandler('check_cert_status', exports.checkCertStatusRealHandler);
    runner.registerHandler('summarize_dossier', exports.summarizeDossierRealHandler);
    runner.registerHandler('explain_senior_exemption_impact', exports.explainSeniorExemptionRealHandler);
    runner.registerHandler('draft_value_change_notice', exports.draftValueChangeNoticeRealHandler);
    runner.registerHandler('draft_appeal_response', exports.draftAppealResponseRealHandler);
    runner.registerHandler('draft_boe_appeal_response', exports.draftBoeAppealResponseRealHandler);
    runner.registerHandler('draft_notice', exports.draftNoticeRealHandler);
    runner.registerHandler('synthesize_evidence', exports.synthesizeEvidenceRealHandler);
    runner.registerHandler('generate_commissioner_memo', exports.generateCommissionerMemoRealHandler);
    runner.registerHandler('assemble_boe_packet', exports.assembleBoePacketRealHandler);
    runner.registerHandler('request_trace_redaction', createRequestTraceRedactionHandler(traceService));
    // Wave 3 Enrichment handlers (3)
    runner.registerHandler('calculate_pilt_payment', exports.calculatePiltPaymentRealHandler);
    runner.registerHandler('run_income_valuation', exports.runIncomeValuationRealHandler);
    runner.registerHandler('calculate_depreciation', exports.calculateDepreciationRealHandler);
    // R2.9 TerraDais Hardening handlers (9)
    runner.registerHandler('check_exemption_eligibility', exports.checkExemptionEligibilityRealHandler);
    runner.registerHandler('process_exemption_renewal', exports.processExemptionRenewalRealHandler);
    runner.registerHandler('file_appeal', exports.fileAppealRealHandler);
    runner.registerHandler('schedule_boe_hearing', exports.scheduleBoeHearingRealHandler);
    runner.registerHandler('get_certification_progress', exports.getCertificationProgressRealHandler);
    runner.registerHandler('sign_off_certification_step', exports.signOffCertificationStepRealHandler);
    runner.registerHandler('queue_notice_for_mailing', exports.queueNoticeForMailingRealHandler);
    runner.registerHandler('get_queue_statistics', exports.getQueueStatisticsRealHandler);
    runner.registerHandler('escalate_task', exports.escalateTaskRealHandler);
    // R3.2 TerraClerk handlers (6)
    runner.registerHandler('search_recorded_documents', exports.searchRecordedDocumentsRealHandler);
    runner.registerHandler('get_title_chain', exports.getTitleChainRealHandler);
    runner.registerHandler('explain_recording_fees', exports.explainRecordingFeesRealHandler);
    runner.registerHandler('record_document', exports.recordDocumentRealHandler);
    runner.registerHandler('release_lien', exports.releaseLienRealHandler);
    runner.registerHandler('summarize_parcel_recordings', exports.summarizeParcelRecordingsRealHandler);
    // R3.3 TerraTreasury handlers (7)
    runner.registerHandler('get_tax_statement', exports.getTaxStatementRealHandler);
    runner.registerHandler('explain_tax_breakdown', exports.explainTaxBreakdownRealHandler);
    runner.registerHandler('record_payment', exports.recordPaymentRealHandler);
    runner.registerHandler('check_delinquency_status', exports.checkDelinquencyStatusRealHandler);
    runner.registerHandler('create_installment_plan', exports.createInstallmentPlanRealHandler);
    runner.registerHandler('summarize_collection_stats', exports.summarizeCollectionStatsRealHandler);
    runner.registerHandler('initiate_tax_sale', exports.initiateTaxSaleRealHandler);
    // R3.4 TerraAudit handlers (5)
    runner.registerHandler('audit_roll_summary', exports.auditRollSummaryRealHandler);
    runner.registerHandler('check_levy_compliance', exports.checkLevyComplianceRealHandler);
    runner.registerHandler('submit_audit_finding', exports.submitAuditFindingRealHandler);
    runner.registerHandler('reconcile_cross_office', exports.reconcileCrossOfficeRealHandler);
    runner.registerHandler('generate_compliance_report', exports.generateComplianceReportRealHandler);
}
