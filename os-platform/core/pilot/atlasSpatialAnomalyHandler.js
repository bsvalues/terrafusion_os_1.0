// GENERATED - DO NOT EDIT
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindAtlasSpatialAnomalyAuthorization = bindAtlasSpatialAnomalyAuthorization;
exports.createAtlasSpatialAnomalyHandler = createAtlasSpatialAnomalyHandler;
exports.registerAtlasSpatialAnomalyHandler = registerAtlasSpatialAnomalyHandler;
const node_crypto_1 = require("node:crypto");
const authorizations = new WeakMap();
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const hash = (value) => (0, node_crypto_1.createHash)('sha256').update(value, 'utf8').digest('hex');
const textId = (value) => typeof value === 'string' && value.length > 0 &&
    value.length <= 256 && value.trim() === value && !/[\u0000-\u001f\u007f-\u009f]/u.test(value);
const count = (value) => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= 100000;
/** Ingress binds the actual caller separately from serializable context and tool parameters. */
function bindAtlasSpatialAnomalyAuthorization(context, authorization) {
    authorizations.delete(context);
    if (typeof authorization === 'string' && /^Bearer [^\s]+$/i.test(authorization))
        authorizations.set(context, authorization.slice(7));
}
function createAtlasSpatialAnomalyHandler(dependencies = {}) {
    return async (params, context) => {
        const token = authorizations.get(context);
        if (!token)
            throw new Error('Actual caller authorization is required for spatial source retrieval.');
        if (!params || !uuid.test(params.county) || params.county !== context.countyId)
            throw new Error('Spatial source county context mismatch.');
        if (!Number.isInteger(params.taxYear) || params.taxYear < 1900 || params.taxYear > 2200 ||
            !['county', 'neighborhood'].includes(params.geographyType) || !textId(params.geographyId) ||
            (params.geographyType === 'county' && params.geographyId !== params.county) ||
            !['residual_cluster', 'prd', 'prb', 'cod'].includes(params.metric))
            throw new Error('Explicit valid spatial geography, metric and assessment year scope are required.');
        const query = new URLSearchParams({ countyId: params.county, taxYear: String(params.taxYear) });
        if (params.geographyType === 'neighborhood')
            query.set('hood', params.geographyId);
        const readRegression = dependencies.readRegression ?? (async (q, options) => {
            const backend = await Promise.resolve().then(() => __importStar(require('./backendClient.js')));
            return backend.backendGetAtlasRegression(q, options);
        });
        const response = await readRegression(query, { token, callerAuthorization: true, correlationId: context.correlationId });
        if (!response?.ok || typeof response.data?.body !== 'string')
            throw new Error('Spatial observation source unavailable.');
        const body = response.data.body;
        if (Buffer.byteLength(body) > 1024 * 1024)
            throw new Error('Spatial observation source exceeds the bounded response limit.');
        let source;
        try {
            source = JSON.parse(body);
        }
        catch {
            throw new Error('Spatial observation source returned malformed JSON.');
        }
        if (!source || source.taxYear !== params.taxYear ||
            (source.hood ?? null) !== (params.geographyType === 'neighborhood' ? params.geographyId : null))
            throw new Error('Spatial observation source scope mismatch.');
        if (!count(source.totalPool) || !count(source.usedForFit) || !count(source.excludedCount) ||
            source.totalPool !== source.usedForFit + source.excludedCount || !Array.isArray(source.residuals) ||
            source.residuals.length > 100000 || typeof source.insufficientData !== 'boolean' ||
            !(source.singularMatrix === undefined || typeof source.singularMatrix === 'boolean'))
            throw new Error('Spatial observation source sample is malformed.');
        const insufficient = source.insufficientData === true;
        const singular = source.singularMatrix === true;
        if ((insufficient || singular) ? source.residuals.length !== 0 :
            source.residuals.length !== source.usedForFit || !source.model || typeof source.model !== 'object')
            throw new Error('Spatial observation source fit accounting is inconsistent.');
        const responseSha256 = hash(body);
        const geography = { kind: params.geographyType, id: params.geographyId };
        const sourceId = `regression:${responseSha256}`;
        const observations = source.residuals.map((row, index) => {
            if (!row || !textId(row.parcelId) || !Number.isFinite(row.residual) || !Number.isFinite(row.percentResidual) ||
                !(row.hood === null || textId(row.hood)))
                throw new Error('Spatial observation source contains an unusable record.');
            if (params.geographyType === 'neighborhood' && row.hood !== params.geographyId)
                throw new Error('Spatial observation source membership scope mismatch.');
            return { observationId: `${responseSha256}:${index}`, parcelId: row.parcelId,
                countyId: params.county, taxYear: params.taxYear, clusterId: row.hood,
                residual: row.residual, percentResidual: row.percentResidual, sourceRef: sourceId };
        });
        const request = { countyId: params.county, taxYear: params.taxYear, geography, metric: params.metric };
        const exchange = { contract: 'atlas.spatial-anomaly', version: '1.0.0', request,
            materialized: { countyId: params.county, taxYear: params.taxYear, geography,
                sourceState: singular ? 'UNAVAILABLE' : insufficient ? 'INSUFFICIENT_DATA' : 'AVAILABLE',
                sample: { total: source.totalPool, used: observations.length, excluded: source.totalPool - observations.length },
                observations, sourceRefs: [{ id: sourceId, countyId: params.county, taxYear: params.taxYear, geography,
                        endpoint: '/api/terraforge/regression', responseSha256, modelId: `model:${hash(JSON.stringify(source.model ?? null))}` }] } };
        const invoke = dependencies.invokeCanonical ?? (async (input) => {
            const canonical = await Promise.resolve().then(() => __importStar(require('./atlas-spatial-anomaly-process.mjs')));
            return canonical.invokeAtlasSpatialAnomaly(input, dependencies.artifactOptions);
        });
        const result = await invoke(exchange);
        const judgment = result?.judgment;
        if (!judgment || judgment.contract !== exchange.contract || judgment.version !== exchange.version ||
            judgment.request?.countyId !== params.county || judgment.request?.taxYear !== params.taxYear ||
            judgment.request?.metric !== params.metric || judgment.request?.geography?.kind !== params.geographyType ||
            judgment.request?.geography?.id !== params.geographyId)
            throw new Error('Canonical spatial judgment returned invalid scope.');
        return { ...judgment, canonicalProvenance: result.provenance,
            sourceEvidence: { endpoint: '/api/terraforge/regression', requestQuery: query.toString(),
                responseSha256, responseBody: body }, correlationId: context.correlationId };
    };
}
function registerAtlasSpatialAnomalyHandler(runner, dependencies = {}) {
    runner.registerHandler('explain_spatial_anomaly', createAtlasSpatialAnomalyHandler(dependencies));
}
