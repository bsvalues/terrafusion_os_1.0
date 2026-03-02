// GENERATED - DO NOT EDIT
"use strict";
/**
 * TerraFusion OS — R1 Real Handlers
 *
 * Production handler implementations for 5 MVP tools.
 * These call real backend endpoints instead of returning canned data.
 *
 * When registered, they OVERRIDE the canned Phase 8.3/8.4 stubs for the same toolIds.
 * Canned stubs remain for tools NOT in this set (and for test isolation).
 *
 * MVP Tools:
 *   1. run_valuation_model       → POST /api/costforge/calculate
 *   2. explain_value_change      → GET  /api/properties/{id} + GET /api/costforge/{id}
 *   3. route_to_parcel           → navigation event (no backend call)
 *   4. search_trace_by_correlation → real TraceService.getByCorrelationId()
 *   5. summarize_levy_rate_components → POST /api/levy-calculation/calculate-rate
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeLevyRateRealHandler = exports.routeToParcelHandler = exports.explainValueChangeHandler = exports.runValuationModelHandler = void 0;
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
/**
 * Register R1 real handlers for 5 MVP tools.
 * These OVERRIDE canned stubs when called after registerAllHandlers().
 *
 * @param runner - ToolRunner instance (must have initialized registry)
 * @param traceService - TraceService instance for search_trace_by_correlation
 */
function registerR1Handlers(runner, traceService) {
    runner.registerHandler('run_valuation_model', exports.runValuationModelHandler);
    runner.registerHandler('explain_value_change', exports.explainValueChangeHandler);
    runner.registerHandler('route_to_parcel', exports.routeToParcelHandler);
    runner.registerHandler('search_trace_by_correlation', createSearchTraceHandler(traceService));
    runner.registerHandler('summarize_levy_rate_components', exports.summarizeLevyRateRealHandler);
}
