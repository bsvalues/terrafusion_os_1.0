// GENERATED - DO NOT EDIT
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportAuditBundleRealHandler = exports.exportEqualizationPackageRealHandler = exports.openAppealPacketRealHandler = exports.generateMorningBriefRealHandler = exports.COUNTY_WORKFLOW_TOOLS = void 0;
exports.bindCountyWorkflowAuthorization = bindCountyWorkflowAuthorization;
exports.registerCountyWorkflowHandlers = registerCountyWorkflowHandlers;
const backendClient_js_1 = require("./backendClient.js");
const authorizations = new WeakMap();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const revisionPattern = /^[0-9a-f]{64}$/;
const base = '/api/dossier/workflows';
exports.COUNTY_WORKFLOW_TOOLS = new Set([
    'generate_morning_brief', 'open_appeal_packet',
    'export_equalization_package', 'export_audit_bundle',
]);
function bindCountyWorkflowAuthorization(context, authorization) {
    if (typeof authorization !== 'string' || !/^Bearer [^\s]+$/i.test(authorization))
        return;
    authorizations.set(context, authorization.slice(7));
}
function tokenFor(params, context) {
    const token = authorizations.get(context);
    if (!token)
        throw new Error('Caller authorization is required; service-account fallback is prohibited.');
    if (!uuid.test(params.county) || params.county !== context.countyId)
        throw new Error('County context mismatch.');
    if (!Number.isInteger(params.taxYear) || params.taxYear < 1900 || params.taxYear > 2200)
        throw new Error('A valid selected assessment year is required.');
    return token;
}
function requireExport(params, context) {
    if (context.confirmation !== true)
        throw new Error('Explicit confirmation is required.');
    if (!context.reasonCode?.trim())
        throw new Error('A reason code is required.');
    if (!uuid.test(params.requestId ?? ''))
        throw new Error('A valid request identity is required.');
}
function scopedResult(value, county, year) {
    if (!value || typeof value !== 'object')
        throw new Error('Invalid workflow response.');
    const result = value;
    if (result.countyId !== county || result.taxYear !== year)
        throw new Error('Backend workflow response context mismatch.');
    return result;
}
const generateMorningBriefRealHandler = async (params, context) => {
    const token = tokenFor(params, context);
    if (!params.role?.trim())
        throw new Error('A briefing role is required.');
    const query = new URLSearchParams({ county: params.county, taxYear: String(params.taxYear), role: params.role });
    return scopedResult((0, backendClient_js_1.unwrapBackend)(await (0, backendClient_js_1.backendGet)(`${base}/morning-brief?${query}`, { token, callerAuthorization: true, correlationId: context.correlationId }), 'Briefing unavailable'), params.county, params.taxYear);
};
exports.generateMorningBriefRealHandler = generateMorningBriefRealHandler;
const openAppealPacketRealHandler = async (params, context) => {
    const token = tokenFor(params, context);
    if (!uuid.test(params.appealId ?? ''))
        throw new Error('An actual appeal identity is required.');
    const query = new URLSearchParams({ county: params.county, taxYear: String(params.taxYear) });
    const parcelId = params.parcelId ?? context.parcelId;
    if (parcelId)
        query.set('parcelId', parcelId);
    return scopedResult((0, backendClient_js_1.unwrapBackend)(await (0, backendClient_js_1.backendGet)(`${base}/appeals/${params.appealId}/packet?${query}`, { token, callerAuthorization: true, correlationId: context.correlationId }), 'Appeal packet unavailable'), params.county, params.taxYear);
};
exports.openAppealPacketRealHandler = openAppealPacketRealHandler;
const exportEqualizationPackageRealHandler = async (params, context) => {
    const token = tokenFor(params, context);
    requireExport(params, context);
    if (!uuid.test(params.draftVersion ?? '') || !revisionPattern.test(params.revision ?? ''))
        throw new Error('An existing draft identity and exact revision are required.');
    const result = (0, backendClient_js_1.unwrapBackend)(await (0, backendClient_js_1.backendPost)(`${base}/exports/equalization`, {
        county: params.county, draftId: params.draftVersion, revision: params.revision,
        taxYear: params.taxYear, requestId: params.requestId,
        confirmed: context.confirmation, reasonCode: context.reasonCode,
    }, { token, callerAuthorization: true, correlationId: context.correlationId }), 'Equalization export failed');
    return scopedResult(result, params.county, params.taxYear);
};
exports.exportEqualizationPackageRealHandler = exportEqualizationPackageRealHandler;
const exportAuditBundleRealHandler = async (params, context) => {
    const token = tokenFor(params, context);
    requireExport(params, context);
    const scope = params.bundleScope ?? 'county';
    if (!['county', 'parcel', 'appeal'].includes(scope))
        throw new Error('Unsupported evidence bundle scope.');
    if (scope !== 'county' && !params.subjectId?.trim())
        throw new Error('A bundle subject is required.');
    const result = (0, backendClient_js_1.unwrapBackend)(await (0, backendClient_js_1.backendPost)(`${base}/exports/audit`, {
        county: params.county, taxYear: params.taxYear, bundleScope: scope,
        subjectId: params.subjectId, requestId: params.requestId,
        confirmed: context.confirmation, reasonCode: context.reasonCode,
    }, { token, callerAuthorization: true, correlationId: context.correlationId }), 'Evidence bundle export failed');
    return scopedResult(result, params.county, params.taxYear);
};
exports.exportAuditBundleRealHandler = exportAuditBundleRealHandler;
function registerCountyWorkflowHandlers(runner) {
    runner.registerHandler('generate_morning_brief', exports.generateMorningBriefRealHandler);
    runner.registerHandler('open_appeal_packet', exports.openAppealPacketRealHandler);
    runner.registerHandler('export_equalization_package', exports.exportEqualizationPackageRealHandler);
    runner.registerHandler('export_audit_bundle', exports.exportAuditBundleRealHandler);
}
