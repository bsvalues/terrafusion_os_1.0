/** Transport only. Canonical judgments and authoritative IDs live on the server. */
export interface PacketWorkflowContext { countyId: string; taxYear: number; parcelId: string; token: string }
export interface PacketSummary { packetId: string; name: string; status: string }
export interface PacketReceiptProvenance { traceId: string; suiteCommit: string; artifactSha256: string; contractVersion: string }
export interface PacketFinalizationReceipt {
  finalizationId: string; finalizedAt?: string; finalizedBy?: string; provenance?: PacketReceiptProvenance;
}
export interface PreparedPacketHandoff {
  countyId: string; taxYear: number; parcelId: string; packetId: string;
  handoffId: string; packetRevision: string;
  preparedAt?: string; preparedBy?: string; provenance?: PacketReceiptProvenance;
}
export interface PacketWorkflowView extends PacketSummary {
  countyId: string; taxYear: number; parcelId: string; revision: string; packetStatus: string;
  narrative: { content: string; revision: string; contentHash: string };
  evidence: Array<{ evidenceId: string; documentId?: string; revision: string; contentHash: string }>;
  decision: { decision: string; status: string; violations: Array<{ code: string; message: string }> };
  finalization: PacketFinalizationReceipt | null;
  handoff?: PreparedPacketHandoff | null;
}
const base = '/api/dossier/packet-workflow';
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(value);
const hash = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
export class PacketWorkflowHttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'PacketWorkflowHttpError';
  }
}
async function responseError(response: Response): Promise<PacketWorkflowHttpError> {
  const fallback = `Packet request failed (${response.status}).`;
  const reader = response.body?.getReader();
  if (!reader) return new PacketWorkflowHttpError(response.status, fallback);
  // Error details are optional: never lose the authoritative HTTP status to an
  // invalid, interrupted or oversized response body. Retain at most 4 KiB.
  const bytes = new Uint8Array(4096);
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (length + value.byteLength > bytes.length) {
        void reader.cancel().catch(() => {});
        return new PacketWorkflowHttpError(response.status, fallback);
      }
      bytes.set(value, length); length += value.byteLength;
    }
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes.subarray(0, length)));
    const message = value && typeof value === 'object' && 'error' in value && typeof value.error === 'string'
      ? value.error : fallback;
    return new PacketWorkflowHttpError(response.status, message);
  } catch {
    return new PacketWorkflowHttpError(response.status, fallback);
  } finally { reader.releaseLock(); }
}
function scoped(context: PacketWorkflowContext, value: { countyId: string; taxYear: number; parcelId: string }) {
  if (!value || value.countyId !== context.countyId || value.taxYear !== context.taxYear || value.parcelId !== context.parcelId) {
    throw new Error('Packet response scope changed; reload the selected county and year.');
  }
}
function handoffIdentity(context: PacketWorkflowContext, result: PreparedPacketHandoff, packetId: string, revision: string) {
  scoped(context, result);
  if (result.packetId !== packetId || result.packetRevision !== revision || !uuid(result.handoffId)) throw new Error('Invalid prepared handoff identity.');
}
async function request<T>(context: PacketWorkflowContext, path: string, signal: AbortSignal, body?: object): Promise<T> {
  if (!uuid(context.countyId) || !context.token || !context.parcelId || !Number.isInteger(context.taxYear)) throw new Error('Explicit authenticated packet scope is required.');
  const query = new URLSearchParams({ county: context.countyId, taxYear: String(context.taxYear), parcelId: context.parcelId });
  const cid = body && 'requestId' in body && typeof body.requestId === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(body.requestId)
    ? body.requestId : undefined;
  const response = await fetch(`${base}${path}?${query}`, { signal, method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${context.token}`, ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cid ? { 'X-Correlation-ID': cid } : {}) },
    ...(body ? { body: JSON.stringify({ ...body, county: context.countyId, taxYear: context.taxYear, parcelId: context.parcelId }) } : {}) });
  if (response.status === 409) {
    // Conflict headers already invalidate eligibility. Optional details and even
    // cancellation completion must never delay that authoritative signal.
    void response.body?.cancel().catch(() => {});
    throw new PacketWorkflowHttpError(409, 'Packet conflict (409). Reload before retrying.');
  }
  if (!response.ok) throw await responseError(response);
  return await response.json() as T;
}
export async function listWorkflowPackets(context: PacketWorkflowContext, signal: AbortSignal): Promise<PacketSummary[]> {
  const result = await request<PacketWorkflowContext & { packets: PacketSummary[] }>(context, '/packets', signal);
  scoped(context, result);
  if (!Array.isArray(result.packets) || result.packets.some(x => !uuid(x.packetId) || typeof x.name !== 'string')) throw new Error('Invalid packet list response.');
  return result.packets;
}
export async function getWorkflowPacket(context: PacketWorkflowContext, packetId: string, signal: AbortSignal): Promise<PacketWorkflowView> {
  const result = await request<PacketWorkflowView>(context, `/packets/${encodeURIComponent(packetId)}`, signal);
  scoped(context, result);
  if (result.packetId !== packetId || !hash(result.revision) || !result.decision || !Array.isArray(result.decision.violations)
    || !result.narrative || typeof result.narrative.content !== 'string' || !Array.isArray(result.evidence)) throw new Error('Invalid packet snapshot response.');
  if (result.handoff) handoffIdentity(context, result.handoff, packetId, result.revision);
  return result;
}
export async function finalizeWorkflowPacket(context: PacketWorkflowContext, packetId: string, expectedRevision: string, requestId: string, signal: AbortSignal) {
  await request(context, `/packets/${encodeURIComponent(packetId)}/finalize`, signal, { expectedRevision, requestId });
}
export async function saveWorkflowNarrative(context: PacketWorkflowContext, packetId: string, expectedRevision: string, requestId: string, content: string, signal: AbortSignal) {
  await request(context, `/packets/${encodeURIComponent(packetId)}/narrative`, signal, { expectedRevision, requestId, content });
}
export async function reviseWorkflowPacket(context: PacketWorkflowContext, packetId: string, expectedRevision: string, requestId: string, reason: string, signal: AbortSignal) {
  await request(context, `/packets/${encodeURIComponent(packetId)}/revise`, signal, { expectedRevision, requestId, reason });
}
export async function prepareWorkflowHandoff(context: PacketWorkflowContext, packetId: string, expectedRevision: string, requestId: string, signal: AbortSignal) {
  const result = await request<PreparedPacketHandoff>(context, `/packets/${encodeURIComponent(packetId)}/prepare`, signal, { expectedRevision, requestId });
  handoffIdentity(context, result, packetId, expectedRevision);
  return result;
}
