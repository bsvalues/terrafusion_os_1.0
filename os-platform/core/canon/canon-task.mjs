/**
 * Canon Agent Task State Machine (Core)
 *
 * ADR-005: every agent task is an explicit state machine, Draft -> ... ->
 * TraceSealed/Closed. This module is the FAIL-LOUD, read-only governor of that
 * lifecycle: it validates transitions, enforces governance guards (approval
 * before execution; gates must pass before review), and records an append-only
 * audit history. It performs NO execution, runs NO commands, and touches NO
 * files — the caller supplies actor + timestamps (no wall-clock here).
 *
 * @module canon/canon-task
 * @see os-platform/core/canon/canon-task.schema.json
 */

/** Canonical lifecycle order. `Failed` is the off-path terminal. */
export const STATES = Object.freeze([
  'Draft',
  'CanonContextLoaded',
  'ScopeProposed',
  'PlanProposed',
  'RiskScored',
  'AwaitingApproval',
  'WorktreeCreated',
  'Executing',
  'DiffReady',
  'GatesRunning',
  'ReviewRequired',
  'CommitReady',
  'TraceSealed',
  'PRReady',
  'Closed',
  'Failed',
]);

export const INITIAL_STATE = 'Draft';
const STATE_SET = new Set(STATES);
const TERMINAL_STATES = new Set(['Closed', 'Failed']);
const SURFACES = new Set(['os-canon', 'canon-desktop', 'cli', 'ci']);
const RISKS = new Set(['low', 'medium', 'high', 'critical']);

/** Happy-path successor for each state (linear spine). */
const NEXT = Object.freeze({
  Draft: 'CanonContextLoaded',
  CanonContextLoaded: 'ScopeProposed',
  ScopeProposed: 'PlanProposed',
  PlanProposed: 'RiskScored',
  RiskScored: 'AwaitingApproval',
  AwaitingApproval: 'WorktreeCreated',
  WorktreeCreated: 'Executing',
  Executing: 'DiffReady',
  DiffReady: 'GatesRunning',
  GatesRunning: 'ReviewRequired',
  ReviewRequired: 'CommitReady',
  CommitReady: 'TraceSealed',
  TraceSealed: 'PRReady',
  PRReady: 'Closed',
});

/** Transitions that require a governance guard in the transition opts. */
const GUARDS = Object.freeze({
  // from -> { to, opt, message }
  'AwaitingApproval->WorktreeCreated': {
    opt: 'approved',
    message: 'cannot enter WorktreeCreated: approval (opts.approved=true) is required',
  },
  'GatesRunning->ReviewRequired': {
    opt: 'gatesPassed',
    message: 'cannot enter ReviewRequired: gates must pass (opts.gatesPassed=true)',
  },
});

/** @param {unknown} v @returns {v is Record<string, unknown>} */
function isObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** @param {unknown} v @param {string} where @returns {string} */
function requireNonEmptyString(v, where) {
  if (typeof v !== 'string' || v.length === 0) throw new Error(`Canon task: ${where} must be a non-empty string`);
  return v;
}

/** @param {unknown} v @param {string} where @returns {string[]} */
function requireStringArray(v, where) {
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
    throw new Error(`Canon task: ${where} must be an array of strings`);
  }
  return /** @type {string[]} */ (v);
}

/** @param {string} state @returns {boolean} */
export function isTerminal(state) {
  return TERMINAL_STATES.has(state);
}

/**
 * Structural legality of a transition (ignores guards). Every non-terminal
 * state may advance to its linear successor or to `Failed`.
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
  if (!STATE_SET.has(from) || !STATE_SET.has(to)) return false;
  if (TERMINAL_STATES.has(from)) return false;
  if (to === 'Failed') return true;
  return NEXT[from] === to;
}

/**
 * Create a new task in Draft with a creation history entry. Fail-loud.
 * @param {Record<string, unknown>} input
 * @returns {Readonly<Record<string, unknown>>}
 */
export function createTask(input) {
  if (!isObject(input)) throw new Error('Canon task: input must be an object');
  const taskId = requireNonEmptyString(input.taskId, 'taskId');
  const intent = requireNonEmptyString(input.intent, 'intent');
  const surface = requireNonEmptyString(input.surface, 'surface');
  if (!SURFACES.has(surface)) throw new Error(`Canon task: surface must be one of ${[...SURFACES].join(', ')}`);
  const risk = requireNonEmptyString(input.risk, 'risk');
  if (!RISKS.has(risk)) throw new Error(`Canon task: risk must be one of ${[...RISKS].join(', ')}`);
  if (!isObject(input.scope)) throw new Error('Canon task: scope must be an object');
  const allowedPaths = requireStringArray(input.scope.allowedPaths, 'scope.allowedPaths');
  const forbiddenPaths = requireStringArray(input.scope.forbiddenPaths, 'scope.forbiddenPaths');
  const actor = requireNonEmptyString(input.actor, 'actor');
  const at = requireNonEmptyString(input.at, 'at');
  const requiredGates =
    input.requiredGates === undefined ? [] : requireStringArray(input.requiredGates, 'requiredGates');

  return Object.freeze({
    taskId,
    intent,
    surface,
    state: INITIAL_STATE,
    risk,
    scope: Object.freeze({ allowedPaths: Object.freeze(allowedPaths), forbiddenPaths: Object.freeze(forbiddenPaths) }),
    requiredGates: Object.freeze(requiredGates),
    approvals: Object.freeze([]),
    history: Object.freeze([Object.freeze({ from: null, to: INITIAL_STATE, actor, at, reason: 'created' })]),
  });
}

/**
 * Transition a task to a new state. Fail-loud on illegal transitions, terminal
 * sources, missing actor/at, or unmet governance guards. Returns a NEW frozen
 * task with the history entry appended; the input is never mutated.
 * @param {Record<string, unknown>} task
 * @param {string} to
 * @param {{ actor?: string, at?: string, reason?: string, approved?: boolean, gatesPassed?: boolean }} [opts]
 * @returns {Readonly<Record<string, unknown>>}
 */
export function transition(task, to, opts) {
  if (!isObject(task)) throw new Error('Canon task: task must be an object');
  const from = /** @type {string} */ (task.state);
  if (!STATE_SET.has(to)) throw new Error(`Canon task: unknown target state "${to}"`);
  if (TERMINAL_STATES.has(from)) throw new Error(`Canon task: ${from} is terminal — no transitions allowed`);
  if (!canTransition(from, to)) throw new Error(`Canon task: invalid transition ${from} -> ${to}`);

  const o = opts || {};
  const actor = requireNonEmptyString(o.actor, 'transition actor');
  const at = requireNonEmptyString(o.at, 'transition at');

  const guard = GUARDS[`${from}->${to}`];
  if (guard && o[guard.opt] !== true) throw new Error(`Canon task: ${guard.message}`);

  const entry = Object.freeze({
    from,
    to,
    actor,
    at,
    reason: typeof o.reason === 'string' ? o.reason : '',
  });

  return Object.freeze({
    ...task,
    state: to,
    history: Object.freeze([.../** @type {ReadonlyArray<object>} */ (task.history), entry]),
  });
}
