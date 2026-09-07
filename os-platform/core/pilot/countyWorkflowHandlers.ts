/** Real county workflows. Credentials remain outside serializable/trace context. */
import type { ToolExecutionContext } from '../types/index.js';
import type { ToolHandler } from './ToolRunner.js';
import { backendGet, backendPost, unwrapBackend } from './backendClient.js';

const authorizations = new WeakMap<ToolExecutionContext, string>();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const revisionPattern = /^[0-9a-f]{64}$/;
const base = '/api/dossier/workflows';

export const COUNTY_WORKFLOW_TOOLS = new Set([
  'generate_morning_brief', 'open_appeal_packet',
  'export_equalization_package', 'export_audit_bundle',
]);

export function bindCountyWorkflowAuthorization(context: ToolExecutionContext, authorization: unknown): void {
  if (typeof authorization !== 'string' || !/^Bearer [^\s]+$/i.test(authorization)) return;
  authorizations.set(context, authorization.slice(7));
}

interface WorkflowParams {
  county: string;
  taxYear: number;
  role?: string;
  appealId?: string;
  parcelId?: string;
  draftVersion?: string;
  revision?: string;
  requestId?: string;
  bundleScope?: string;
  subjectId?: string;
}

function tokenFor(params: WorkflowParams, context: ToolExecutionContext): string {
  const token = authorizations.get(context);
  if (!token) throw new Error('Caller authorization is required; service-account fallback is prohibited.');
  if (!uuid.test(params.county) || params.county !== context.countyId)
    throw new Error('County context mismatch.');
  if (!Number.isInteger(params.taxYear) || params.taxYear < 1900 || params.taxYear > 2200)
    throw new Error('A valid selected assessment year is required.');
  return token;
}

function requireExport(params: WorkflowParams, context: ToolExecutionContext): void {
  if (context.confirmation !== true) throw new Error('Explicit confirmation is required.');
  if (!context.reasonCode?.trim()) throw new Error('A reason code is required.');
  if (!uuid.test(params.requestId ?? '')) throw new Error('A valid request identity is required.');
}

function scopedResult(value: unknown, county: string, year: number): unknown {
  if (!value || typeof value !== 'object') throw new Error('Invalid workflow response.');
  const result = value as Record<string, unknown>;
  if (result.countyId !== county || result.taxYear !== year)
    throw new Error('Backend workflow response context mismatch.');
  return result;
}

export const generateMorningBriefRealHandler: ToolHandler<WorkflowParams, unknown> = async (params, context) => {
  const token = tokenFor(params, context);
  if (!params.role?.trim()) throw new Error('A briefing role is required.');
  const query = new URLSearchParams({ county: params.county, taxYear: String(params.taxYear), role: params.role });
  return scopedResult(unwrapBackend(await backendGet(`${base}/morning-brief?${query}`, { token, callerAuthorization: true }), 'Briefing unavailable'), params.county, params.taxYear);
};

export const openAppealPacketRealHandler: ToolHandler<WorkflowParams, unknown> = async (params, context) => {
  const token = tokenFor(params, context);
  if (!uuid.test(params.appealId ?? '')) throw new Error('An actual appeal identity is required.');
  const query = new URLSearchParams({ county: params.county, taxYear: String(params.taxYear) });
  const parcelId = params.parcelId ?? context.parcelId;
  if (parcelId) query.set('parcelId', parcelId);
  return scopedResult(unwrapBackend(await backendGet(`${base}/appeals/${params.appealId}/packet?${query}`, { token, callerAuthorization: true }), 'Appeal packet unavailable'), params.county, params.taxYear);
};

export const exportEqualizationPackageRealHandler: ToolHandler<WorkflowParams, unknown> = async (params, context) => {
  const token = tokenFor(params, context);
  requireExport(params, context);
  if (!uuid.test(params.draftVersion ?? '') || !revisionPattern.test(params.revision ?? ''))
    throw new Error('An existing draft identity and exact revision are required.');
  const result = unwrapBackend(await backendPost(`${base}/exports/equalization`, {
    county: params.county, draftId: params.draftVersion, revision: params.revision,
    taxYear: params.taxYear, requestId: params.requestId,
    confirmed: context.confirmation, reasonCode: context.reasonCode,
  }, { token, callerAuthorization: true }), 'Equalization export failed');
  return scopedResult(result, params.county, params.taxYear);
};

export const exportAuditBundleRealHandler: ToolHandler<WorkflowParams, unknown> = async (params, context) => {
  const token = tokenFor(params, context);
  requireExport(params, context);
  const scope = params.bundleScope ?? 'county';
  if (!['county', 'parcel', 'appeal'].includes(scope)) throw new Error('Unsupported evidence bundle scope.');
  if (scope !== 'county' && !params.subjectId?.trim()) throw new Error('A bundle subject is required.');
  const result = unwrapBackend(await backendPost(`${base}/exports/audit`, {
    county: params.county, taxYear: params.taxYear, bundleScope: scope,
    subjectId: params.subjectId, requestId: params.requestId,
    confirmed: context.confirmation, reasonCode: context.reasonCode,
  }, { token, callerAuthorization: true }), 'Evidence bundle export failed');
  return scopedResult(result, params.county, params.taxYear);
};

export function registerCountyWorkflowHandlers(runner: { registerHandler: <P, R>(id: string, handler: ToolHandler<P, R>) => void }): void {
  runner.registerHandler('generate_morning_brief', generateMorningBriefRealHandler);
  runner.registerHandler('open_appeal_packet', openAppealPacketRealHandler);
  runner.registerHandler('export_equalization_package', exportEqualizationPackageRealHandler);
  runner.registerHandler('export_audit_bundle', exportAuditBundleRealHandler);
}
