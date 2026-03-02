// GENERATED - DO NOT EDIT
"use strict";
/**
 * TerraFusion OS — R1 Real Handlers
 *
 * Production handler implementations for 8 R1 tools.
 * These call real backend endpoints instead of returning canned data.
 *
 * When registered, they OVERRIDE the canned Phase 8.3/8.4 stubs for the same toolIds.
 * Canned stubs remain for tools NOT in this set (and for test isolation).
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
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeParcelCasefileRealHandler = exports.compareAssessedValueHistoryRealHandler = exports.explainModelInputsRealHandler = exports.summarizeLevyRateRealHandler = exports.routeToParcelHandler = exports.explainValueChangeHandler = exports.runValuationModelHandler = void 0;
exports.createSearchTraceHandler = createSearchTraceHandler;
exports.registerR1Handlers = registerR1Handlers;
const backendClient_js_1 = require("./backendClient.js");
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
// ============================================================================
// Handler 1: run_valuation_model → POST /api/costforge/calculate
// ============================================================================
const runValuationModelHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    const raw = await (0, backendClient_js_1.backendPost)('/api/costforge/calculate', {
        parcelId: params.parcelId,
        taxYear: params.taxYear,
        modelType: params.modelType ?? 'cost',
        countyId: context.countyId,
    });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Valuation model failed');
    return {
        parcelId: params.parcelId,
        taxYear: params.taxYear,
        modelType: params.modelType ?? 'cost',
        estimatedValue: data.estimatedValue ?? 0,
        confidence: data.confidence ?? 0,
        components: data.components ?? data.costBreakdown ?? {},
    };
};
exports.runValuationModelHandler = runValuationModelHandler;
// ============================================================================
// Handler 2: explain_value_change → GET /api/properties/{id}
// ============================================================================
const explainValueChangeHandler = async (params, context, _tool) => {
    assertCountyMatch(params.county, context.countyId);
    // Fetch property data to get valuation history
    const propRaw = await (0, backendClient_js_1.backendGet)(`/api/properties/${encodeURIComponent(params.parcelId)}`);
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
    const raw = await (0, backendClient_js_1.backendPost)('/api/levy-calculation/calculate-rate', {
        countyId: context.countyId,
        taxYear: params.taxYear,
        districtCode: params.districtCode,
    });
    const data = (0, backendClient_js_1.unwrapBackend)(raw, 'Levy rate calculation failed');
    // Normalize backend response — backend may return different shapes
    const components = data.components
        ?? data.districtRates?.map(d => ({ name: d.district, rate: d.rate }))
        ?? [];
    const totalRate = data.totalRate
        ?? data.levyRate
        ?? components.reduce((sum, c) => sum + c.rate, 0);
    const scopeNote = params.districtCode ? ` District ${params.districtCode} applied.` : '';
    return {
        components: components.sort((a, b) => b.rate - a.rate),
        totalRate: Math.round(totalRate * 100) / 100,
        explanation: `Levy components for ${params.taxYear} total $${totalRate.toFixed(2)} per $1,000 assessed value.${scopeNote}`,
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
    const raw = await (0, backendClient_js_1.backendGet)(`/api/costforge/models/${encodeURIComponent(params.modelId)}?year=${params.asOfYear}&countyId=${encodeURIComponent(context.countyId)}`);
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
    const raw = await (0, backendClient_js_1.backendGet)(`/api/properties/${encodeURIComponent(params.parcelId)}`);
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
    const raw = await (0, backendClient_js_1.backendGet)(`/api/dossier/parcels/${encodeURIComponent(params.parcelId)}/casefile${includeParam}`);
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
/**
 * Register R1 real handlers for 8 tools (5 MVP + 3 read-only).
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
}
