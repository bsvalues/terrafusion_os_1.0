/**
 * Canon Evidence Bundle (Core)
 *
 * Builds the proof artifact for a completed Canon task: which rules were loaded,
 * what was read/changed, which gates ran, the diff hash, and the risk score.
 * FAIL-LOUD: invalid/incomplete input is a hard error. Deterministic and
 * read-only — the caller supplies all values (including timestamps); this module
 * runs no commands and reads no files.
 *
 * Distinct from the frozen Phase 7 trace spine (os-platform/core/trace). Sealing
 * lives in canon-trace-seal.mjs.
 *
 * @module canon/canon-evidence
 * @see os-platform/core/canon/canon-evidence-bundle.schema.json
 */

const GATE_STATUSES = new Set(['pass', 'fail', 'warning', 'skipped']);

/**
 * @typedef {Readonly<{ gateId: string, status: 'pass'|'fail'|'warning'|'skipped', command?: string, summary?: string, startedAt?: string, finishedAt?: string }>} GateResult
 * @typedef {Readonly<{
 *   taskId: string, intent: string, surface: string,
 *   agentLanes: ReadonlyArray<string>,
 *   canonRulesLoaded: ReadonlyArray<string>,
 *   filesRead: ReadonlyArray<string>,
 *   filesChanged: ReadonlyArray<string>,
 *   commandsRun: ReadonlyArray<object>,
 *   approvals: ReadonlyArray<object>,
 *   gateResults: ReadonlyArray<GateResult>,
 *   diffHash: string, riskScore: number,
 *   commitHash: string, prUrl: string,
 *   sealed: boolean, traceHash?: string, sealedAt?: string
 * }>} EvidenceBundle
 */

/** @param {unknown} v @returns {v is Record<string, unknown>} */
function isObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** @param {unknown} v @param {string} where @returns {string} */
function requireNonEmptyString(v, where) {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Evidence bundle: ${where} must be a non-empty string`);
  }
  return v;
}

/** @param {unknown} v @param {string} where @returns {string[]} */
function requireStringArray(v, where) {
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
    throw new Error(`Evidence bundle: ${where} must be an array of strings`);
  }
  return /** @type {string[]} */ (v);
}

/** @param {unknown} v @param {string} where @returns {object[]} */
function requireObjectArray(v, where) {
  if (!Array.isArray(v) || v.some((x) => !isObject(x))) {
    throw new Error(`Evidence bundle: ${where} must be an array of objects`);
  }
  return /** @type {object[]} */ (v);
}

/** @param {unknown} raw @param {number} i @returns {GateResult} */
function validateGateResult(raw, i) {
  if (!isObject(raw)) throw new Error(`Evidence bundle: gateResults[${i}] must be an object`);
  const gateId = requireNonEmptyString(raw.gateId, `gateResults[${i}].gateId`);
  if (typeof raw.status !== 'string' || !GATE_STATUSES.has(raw.status)) {
    throw new Error(`Evidence bundle: gateResults[${i}].status must be one of ${[...GATE_STATUSES].join(', ')}`);
  }
  return Object.freeze({
    gateId,
    status: /** @type {GateResult['status']} */ (raw.status),
    command: typeof raw.command === 'string' ? raw.command : undefined,
    summary: typeof raw.summary === 'string' ? raw.summary : undefined,
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : undefined,
    finishedAt: typeof raw.finishedAt === 'string' ? raw.finishedAt : undefined,
  });
}

/**
 * Build a frozen, UNSEALED evidence bundle from caller-supplied values.
 * Fail-loud on missing/invalid fields. `sealed` is always false on build.
 * @param {Record<string, unknown>} input
 * @returns {EvidenceBundle}
 */
export function buildEvidenceBundle(input) {
  if (!isObject(input)) throw new Error('Evidence bundle: input must be an object');

  const taskId = requireNonEmptyString(input.taskId, 'taskId');
  const intent = requireNonEmptyString(input.intent, 'intent');
  const surface = requireNonEmptyString(input.surface, 'surface');
  const diffHash = requireNonEmptyString(input.diffHash, 'diffHash');

  if (typeof input.riskScore !== 'number' || !Number.isFinite(input.riskScore)) {
    throw new Error('Evidence bundle: riskScore must be a finite number');
  }

  const canonRulesLoaded = requireStringArray(input.canonRulesLoaded, 'canonRulesLoaded');
  const filesRead = requireStringArray(input.filesRead, 'filesRead');
  const filesChanged = requireStringArray(input.filesChanged, 'filesChanged');
  const commandsRun = requireObjectArray(input.commandsRun, 'commandsRun');
  const gateResultsRaw = Array.isArray(input.gateResults) ? input.gateResults : null;
  if (!gateResultsRaw) throw new Error('Evidence bundle: gateResults must be an array');
  const gateResults = gateResultsRaw.map((g, i) => validateGateResult(g, i));

  // Optional fields (typed, never coerced into governance-relevant defaults).
  const agentLanes = input.agentLanes === undefined ? [] : requireStringArray(input.agentLanes, 'agentLanes');
  const approvals = input.approvals === undefined ? [] : requireObjectArray(input.approvals, 'approvals');
  const commitHash = typeof input.commitHash === 'string' ? input.commitHash : '';
  const prUrl = typeof input.prUrl === 'string' ? input.prUrl : '';

  return Object.freeze({
    taskId,
    intent,
    surface,
    agentLanes: Object.freeze(agentLanes),
    canonRulesLoaded: Object.freeze(canonRulesLoaded),
    filesRead: Object.freeze(filesRead),
    filesChanged: Object.freeze(filesChanged),
    commandsRun: Object.freeze(commandsRun),
    approvals: Object.freeze(approvals),
    gateResults: Object.freeze(gateResults),
    diffHash,
    riskScore: input.riskScore,
    commitHash,
    prUrl,
    sealed: false,
  });
}

/**
 * Deterministic, key-order-independent JSON string. Used for hashing.
 * @param {unknown} value
 * @returns {string}
 */
export function canonicalize(value) {
  return JSON.stringify(sortDeep(value));
}

/** @param {unknown} v @returns {unknown} */
function sortDeep(v) {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === 'object') {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortDeep(/** @type {Record<string, unknown>} */ (v)[k]);
    return out;
  }
  return v;
}

/**
 * Pretty JSON serialization of a bundle (for writing to disk by a caller).
 * @param {EvidenceBundle} bundle
 * @returns {string}
 */
export function serializeEvidenceBundle(bundle) {
  return JSON.stringify(bundle, null, 2) + '\n';
}
