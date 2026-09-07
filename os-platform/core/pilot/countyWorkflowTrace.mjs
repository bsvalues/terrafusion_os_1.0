import { isAbsolute } from 'node:path';
import { TraceService, traceService } from '../trace/TraceService.js';
import { FileTraceStore } from '../trace/TraceStore.js';
import { filterVisibleTraceEvents } from '../trace/TraceAccessControl.js';
import { backendGet } from './backendClient.js';

const WORKFLOW_IDS = new Set([
  'generate_morning_brief', 'open_appeal_packet',
  'export_equalization_package', 'export_audit_bundle',
]);
const COUNTY_ID = /^(?!00000000-0000-0000-0000-000000000000$)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NAME_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

function failure(status, error) { return { status, body: { error } }; }

function unavailable() {
  return Object.assign(new Error('Durable county workflow trace is unavailable.'), {
    status: 503,
    code: 'COUNTY_WORKFLOW_TRACE_UNAVAILABLE',
  });
}

// Decoding is NOT authentication. No principal is used until the same bearer
// passes the backend's authenticated, permission- and county-checked context API.
function decodeBearer(req) {
  const authorization = req?.headers?.authorization;
  if (typeof authorization !== 'string' || authorization.length > 16384) return null;
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(authorization);
  if (!match) return null;
  try {
    const token = match[1];
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    const countyId = claims.countyId;
    // JwtSecurityTokenHandler writes NameIdentifier as nameid. Every supplied
    // alias must be a valid, identical subject; never choose between identities.
    const subjects = [claims.nameid, claims.sub, claims[NAME_ID]]
      .filter(value => value !== undefined);
    if (subjects.length === 0 || subjects.some(value =>
      typeof value !== 'string' || !value.trim() || value.length > 200) ||
      new Set(subjects).size !== 1) return null;
    const [userId] = subjects;
    if (typeof countyId !== 'string' || !COUNTY_ID.test(countyId)) return null;
    const roles = [claims.role, claims.roles, claims[ROLE]]
      .filter(value => value !== undefined).flat();
    if (!roles.every(role => typeof role === 'string')) return null;
    return { token, principal: { countyId, userId, roles } };
  } catch { return null; }
}

// Shared by invocation ingress and durable reads, including when file mode is
// disabled. Authentication never emits events, touches storage, or returns the
// bearer. Callers must use this principal before creating execution context.
async function authenticate(req) {
  const identity = decodeBearer(req);
  if (!identity) return failure(401, 'COUNTY_WORKFLOW_TRACE_UNAUTHENTICATED');
  const { token, principal } = identity;
  let validated;
  try {
    validated = await backendGet(
      `/api/dossier/workflows/context?county=${encodeURIComponent(principal.countyId)}`,
      { token, callerAuthorization: true },
    );
  } catch { return failure(503, unavailable().code); }
  if (!validated.ok) {
    if (validated.status === 401) return failure(401, 'COUNTY_WORKFLOW_TRACE_UNAUTHENTICATED');
    if (validated.status === 403) return failure(403, 'COUNTY_WORKFLOW_TRACE_FORBIDDEN');
    return failure(503, unavailable().code);
  }
  if (validated.data?.countyId !== principal.countyId) return failure(503, unavailable().code);
  return { status: 200, principal };
}

// Explicit allowlist: never copy summaries, sources, raw payloads, payload refs,
// or arbitrary context fields to disk or an authenticated response.
function metadata(event) {
  if (!event || !['schemaVersion', 'eventId', 'timestamp', 'type', 'toolId', 'correlationId']
    .every(key => typeof event[key] === 'string' && event[key].length > 0) ||
      !COUNTY_ID.test(event.context?.countyId ?? '') ||
      typeof event.context?.userId !== 'string' || !event.context.userId.trim()) throw unavailable();
  const context = { countyId: event.context.countyId, userId: event.context.userId };
  if (event.context.mode === 'pilot' || event.context.mode === 'muse') context.mode = event.context.mode;
  return {
    schemaVersion: event.schemaVersion, eventId: event.eventId, timestamp: event.timestamp,
    type: event.type, toolId: event.toolId, correlationId: event.correlationId, context,
  };
}

/**
 * Opt-in adapter; configuration/environment selection belongs to its caller.
 * service is for the trusted ToolRunner, NOT an HTTP read endpoint.
 * Await flush() after execution before claiming durable trace success: shared
 * TraceService.emit intentionally catches asynchronous store append failures.
 * Requires backendClient's callerAuthorization loopback + no-redirect guard.
 */
export function createCountyWorkflowTrace(filePath) {
  if (filePath === undefined) return {
    service: traceService,
    authenticate,
    async queryAuthenticated() {
      return failure(503, unavailable().code);
    },
    async flush() { throw unavailable(); },
  };
  if (typeof filePath !== 'string' || !isAbsolute(filePath)) throw new TypeError('An absolute trace file path is required.');

  const store = new FileTraceStore({ filePath });
  const pending = new Set();
  let storageFailed = false;
  let inventoryChecked = false;
  async function checked(operation) {
    try {
      if (storageFailed) throw unavailable();
      if (!inventoryChecked) {
        // Validate the loaded inventory before a CID filter can hide corrupt
        // rows. FileTraceStore itself tolerates malformed JSON lines on load.
        const inventory = await store.query({ limit: Number.MAX_SAFE_INTEGER });
        inventory.forEach(metadata);
        if (store.getCorruptLineCount() > 0) throw unavailable();
        inventoryChecked = true;
      }
      const result = await operation();
      if (store.getCorruptLineCount() > 0) throw unavailable();
      return result;
    } catch {
      storageFailed = true;
      throw unavailable();
    }
  }
  const boundedStore = {
    append(event) {
      if (!WORKFLOW_IDS.has(event.toolId)) return Promise.resolve(event);
      const append = checked(() => store.append(metadata(event)));
      pending.add(append);
      // Track settlement independently of the shared service's swallowed error.
      append.then(() => pending.delete(append), () => pending.delete(append));
      return append;
    },
    query: options => checked(() => store.query(options)),
    getByCorrelationId: (cid, county) => checked(() => store.getByCorrelationId(cid, county)),
    prune: retention => checked(() => store.prune(retention)),
    stats: () => checked(() => store.stats()),
  };
  const service = new TraceService({ store: boundedStore });
  async function flush() {
    while (pending.size) await Promise.allSettled([...pending]);
    if (storageFailed) throw unavailable();
  }

  async function queryAuthenticated(req, cid) {
    const identity = await authenticate(req);
    if (identity.status !== 200) return identity;
    const { principal } = identity;
    if (cid !== undefined && (typeof cid !== 'string' || !/^[A-Za-z0-9._-]{1,128}$/.test(cid))) {
      return failure(400, 'COUNTY_WORKFLOW_TRACE_INVALID_CID');
    }
    try {
      await flush();
      const events = cid === undefined
        // FileTraceStore already loads its file; filter identity BEFORE limiting.
        ? await service.queryAsync({ limit: Number.MAX_SAFE_INTEGER })
        : await service.getByCorrelationIdAsync(cid, principal.countyId);
      const safe = events.map(metadata).filter(event => WORKFLOW_IDS.has(event.toolId));
      const visible = filterVisibleTraceEvents(principal, safe);
      return { status: 200, body: { events: cid === undefined ? visible.slice(0, 100) : visible } };
    } catch {
      storageFailed = true;
      return failure(503, unavailable().code);
    }
  }
  return { service, authenticate, queryAuthenticated, flush };
}
