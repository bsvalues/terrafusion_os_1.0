/**
 * Canon Runtime Loader (Core)
 *
 * Reads the static Canon law (rule index, engineering write-lanes, gate
 * registry) from JSON on disk, validates it FAIL-LOUD, freezes the result, and
 * memoizes it. Read-only. No agents, no commands, no network.
 *
 * Fail-loud contract: Canon law is governance. Invalid or incomplete config is
 * a hard error, never a silent default that softens governance. Specifically:
 *   - required arrays must be present and be arrays of strings;
 *   - boolean governance fields must be real booleans (no coercion);
 *   - risk / enforcement levels must be known enum values;
 *   - every referenced gate id must exist in the gate registry;
 *   - ruleIds, lane owners, and gate ids must be unique;
 *   - a rule that applies to nothing (no paths/intents/surfaces) is invalid.
 * Query-time inputs (paths, task intents) never throw — see canon-query.mjs.
 *
 * @module canon/canon-loader
 * @see docs/TerraCanon/CANON_IDE_REPO_ADAPTATION_PLAN.md
 */

import { readFileSync } from 'node:fs';

/**
 * @typedef {Readonly<{
 *   level: 'block' | 'warn' | 'require-approval' | 'inform',
 *   requiredGates: ReadonlyArray<string>,
 *   requiresManualReview: boolean
 * }>} RuleEnforcement
 *
 * @typedef {Readonly<{
 *   ruleId: string,
 *   version: string,
 *   status: 'active' | 'draft' | 'deprecated',
 *   authority: 'constitutional' | 'os-platform' | 'engineering-policy' | 'advisory',
 *   title: string,
 *   description: string,
 *   source?: string,
 *   appliesTo: Readonly<{ paths: ReadonlyArray<string>, taskIntents: ReadonlyArray<string>, surfaces: ReadonlyArray<string> }>,
 *   enforcement: RuleEnforcement
 * }>} CanonRule
 *
 * @typedef {Readonly<{
 *   owner: string,
 *   paths: ReadonlyArray<string>,
 *   risk: 'low' | 'medium' | 'high' | 'critical',
 *   requiredGates: ReadonlyArray<string>,
 *   manualReviewRequired: boolean
 * }>} WriteLane
 *
 * @typedef {Readonly<{ gateId: string, label: string, command: string, kind?: string }>} Gate
 *
 * @typedef {Readonly<{
 *   rules: ReadonlyArray<CanonRule>,
 *   lanes: ReadonlyArray<WriteLane>,
 *   gates: ReadonlyArray<Gate>
 * }>} Canon
 *
 * @typedef {Readonly<{ index: unknown, lanes: unknown, gates: unknown }>} RawCanonConfig
 */

const RULE_LEVELS = new Set(['block', 'warn', 'require-approval', 'inform']);
const RISK_LEVELS = new Set(['low', 'medium', 'high', 'critical']);
const RULE_STATUSES = new Set(['active', 'draft', 'deprecated']);
const RULE_AUTHORITIES = new Set(['constitutional', 'os-platform', 'engineering-policy', 'advisory']);

/** @param {unknown} v @returns {v is Record<string, unknown>} */
function isObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** @param {unknown} v @param {string} where @returns {string} */
function requireNonEmptyString(v, where) {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Canon config: ${where} must be a non-empty string`);
  }
  return v;
}

/** @param {unknown} v @param {string} where @returns {string} */
function requireString(v, where) {
  if (typeof v !== 'string') throw new Error(`Canon config: ${where} must be a string`);
  return v;
}

/**
 * Require a present array of strings. Absent or wrong-typed → throw (fail-loud).
 * @param {unknown} v @param {string} where @returns {string[]}
 */
function requireStringArray(v, where) {
  if (!Array.isArray(v)) throw new Error(`Canon config: ${where} must be a present array of strings`);
  if (v.some((x) => typeof x !== 'string')) {
    throw new Error(`Canon config: ${where} must contain only strings`);
  }
  return /** @type {string[]} */ (v);
}

/**
 * Require a real boolean. No coercion of truthy/falsy values (fail-loud).
 * @param {unknown} v @param {string} where @returns {boolean}
 */
function requireBoolean(v, where) {
  if (typeof v !== 'boolean') throw new Error(`Canon config: ${where} must be a boolean`);
  return v;
}

/** @param {unknown} v @param {Set<string>} allowed @param {string} where @returns {string} */
function requireEnum(v, allowed, where) {
  if (typeof v !== 'string' || !allowed.has(v)) {
    throw new Error(`Canon config: ${where} must be one of ${[...allowed].join(', ')}`);
  }
  return v;
}

/** @param {string[]} gateRefs @param {Set<string>} known @param {string} where */
function assertGatesKnown(gateRefs, known, where) {
  for (const g of gateRefs) {
    if (!known.has(g)) {
      throw new Error(`Canon config: ${where} references unknown gate "${g}"`);
    }
  }
}

/** @param {unknown} raw @param {Set<string>} seenGateIds @returns {Gate} */
function validateGate(raw, seenGateIds) {
  if (!isObject(raw)) throw new Error('Canon config: gate must be an object');
  const gateId = requireNonEmptyString(raw.gateId, 'gate.gateId');
  if (seenGateIds.has(gateId)) throw new Error(`Canon config: duplicate gate id "${gateId}"`);
  seenGateIds.add(gateId);
  return Object.freeze({
    gateId,
    label: typeof raw.label === 'string' ? raw.label : gateId,
    command: typeof raw.command === 'string' ? raw.command : '',
    kind: typeof raw.kind === 'string' ? raw.kind : undefined,
  });
}

/** @param {unknown} raw @param {Set<string>} gateIds @param {Set<string>} seenRuleIds @returns {CanonRule} */
function validateRule(raw, gateIds, seenRuleIds) {
  if (!isObject(raw)) throw new Error('Canon config: rule must be an object');
  const ruleId = requireNonEmptyString(raw.ruleId, 'rule.ruleId');
  if (seenRuleIds.has(ruleId)) throw new Error(`Canon config: duplicate ruleId "${ruleId}"`);
  seenRuleIds.add(ruleId);

  const version = requireString(raw.version, `${ruleId}.version`);
  const status = requireEnum(raw.status, RULE_STATUSES, `${ruleId}.status`);
  const authority = requireEnum(raw.authority, RULE_AUTHORITIES, `${ruleId}.authority`);
  const title = requireString(raw.title, `${ruleId}.title`);
  const description = requireString(raw.description, `${ruleId}.description`);

  if (!isObject(raw.appliesTo)) throw new Error(`Canon config: ${ruleId}.appliesTo must be an object`);
  const paths = requireStringArray(raw.appliesTo.paths, `${ruleId}.appliesTo.paths`);
  const taskIntents = requireStringArray(raw.appliesTo.taskIntents, `${ruleId}.appliesTo.taskIntents`);
  const surfaces = requireStringArray(raw.appliesTo.surfaces, `${ruleId}.appliesTo.surfaces`);
  if (paths.length === 0 && taskIntents.length === 0 && surfaces.length === 0) {
    throw new Error(`Canon config: ${ruleId}.appliesTo matches nothing (paths, taskIntents and surfaces all empty)`);
  }

  if (!isObject(raw.enforcement)) throw new Error(`Canon config: ${ruleId}.enforcement must be an object`);
  const level = requireEnum(raw.enforcement.level, RULE_LEVELS, `${ruleId}.enforcement.level`);
  const requiredGates = requireStringArray(raw.enforcement.requiredGates, `${ruleId}.enforcement.requiredGates`);
  assertGatesKnown(requiredGates, gateIds, `${ruleId}.enforcement.requiredGates`);
  const requiresManualReview = requireBoolean(
    raw.enforcement.requiresManualReview,
    `${ruleId}.enforcement.requiresManualReview`,
  );

  return Object.freeze({
    ruleId,
    version,
    status: /** @type {CanonRule['status']} */ (status),
    authority: /** @type {CanonRule['authority']} */ (authority),
    title,
    description,
    source: typeof raw.source === 'string' ? raw.source : undefined,
    appliesTo: Object.freeze({
      paths: Object.freeze(paths),
      taskIntents: Object.freeze(taskIntents),
      surfaces: Object.freeze(surfaces),
    }),
    enforcement: Object.freeze({
      level: /** @type {RuleEnforcement['level']} */ (level),
      requiredGates: Object.freeze(requiredGates),
      requiresManualReview,
    }),
  });
}

/** @param {unknown} raw @param {Set<string>} gateIds @param {Set<string>} seenOwners @returns {WriteLane} */
function validateLane(raw, gateIds, seenOwners) {
  if (!isObject(raw)) throw new Error('Canon config: write-lane must be an object');
  const owner = requireNonEmptyString(raw.owner, 'write-lane.owner');
  if (seenOwners.has(owner)) throw new Error(`Canon config: duplicate write-lane owner "${owner}"`);
  seenOwners.add(owner);

  const paths = requireStringArray(raw.paths, `write-lane ${owner}.paths`);
  if (paths.length === 0) throw new Error(`Canon config: write-lane ${owner}.paths must not be empty`);
  const risk = requireEnum(raw.risk, RISK_LEVELS, `write-lane ${owner}.risk`);
  const requiredGates = requireStringArray(raw.requiredGates, `write-lane ${owner}.requiredGates`);
  assertGatesKnown(requiredGates, gateIds, `write-lane ${owner}.requiredGates`);
  const manualReviewRequired = requireBoolean(raw.manualReviewRequired, `write-lane ${owner}.manualReviewRequired`);

  return Object.freeze({
    owner,
    paths: Object.freeze(paths),
    risk: /** @type {WriteLane['risk']} */ (risk),
    requiredGates: Object.freeze(requiredGates),
    manualReviewRequired,
  });
}

/**
 * Pure fail-loud validator. Validates the three raw config documents, freezes
 * them into a Canon, and throws a descriptive Error on the first violation.
 * Gates are validated first so rule/lane gate references can be cross-checked.
 *
 * @param {RawCanonConfig} raw
 * @returns {Canon}
 */
export function validateCanonConfig(raw) {
  if (!isObject(raw)) throw new Error('Canon config: raw config must be an object');
  const { index, lanes, gates } = raw;

  if (!isObject(gates) || !Array.isArray(gates.gates)) {
    throw new Error('Canon config: gate-registry must have a gates array');
  }
  if (!isObject(index) || !Array.isArray(index.rules)) {
    throw new Error('Canon config: canon-index must have a rules array');
  }
  if (!isObject(lanes) || !Array.isArray(lanes.lanes)) {
    throw new Error('Canon config: engineering-write-lanes must have a lanes array');
  }

  const seenGateIds = new Set();
  const validatedGates = gates.gates.map((g) => validateGate(g, seenGateIds));
  const gateIds = new Set(validatedGates.map((g) => g.gateId));

  const seenRuleIds = new Set();
  const validatedRules = index.rules.map((r) => validateRule(r, gateIds, seenRuleIds));

  const seenOwners = new Set();
  const validatedLanes = lanes.lanes.map((l) => validateLane(l, gateIds, seenOwners));

  return Object.freeze({
    rules: Object.freeze(validatedRules),
    lanes: Object.freeze(validatedLanes),
    gates: Object.freeze(validatedGates),
  });
}

/** @param {string} fileName @returns {unknown} */
function readJson(fileName) {
  const url = new URL(`./${fileName}`, import.meta.url);
  let rawText;
  try {
    rawText = readFileSync(url, 'utf8');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Canon loader: cannot read ${fileName}: ${msg}`);
  }
  try {
    return JSON.parse(rawText);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Canon loader: ${fileName} is not valid JSON: ${msg}`);
  }
}

/** @type {Canon | null} */
let cached = null;

/**
 * Load, validate (fail-loud), freeze, and memoize the Canon law from disk.
 * @param {{ reload?: boolean }} [opts]
 * @returns {Canon}
 */
export function loadCanon(opts) {
  if (cached && !(opts && opts.reload)) return cached;
  const canon = validateCanonConfig({
    index: readJson('canon-index.json'),
    lanes: readJson('engineering-write-lanes.json'),
    gates: readJson('gate-registry.json'),
  });
  cached = canon;
  return canon;
}
