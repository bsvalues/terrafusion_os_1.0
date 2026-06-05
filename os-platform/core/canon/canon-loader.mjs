/**
 * Canon Runtime Loader (Core)
 *
 * Reads the static Canon law (rule index, engineering write-lanes, gate
 * registry) from JSON on disk, performs light structural validation, freezes
 * the result, and memoizes it. Read-only. No agents, no commands, no network.
 *
 * Config files are build-time data: if a config file is missing or structurally
 * invalid, load throws a descriptive Error (fail loud at load). Query-time
 * inputs never throw — see canon-query.mjs / canon-risk.mjs.
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
 */

/** @param {string} fileName @returns {unknown} */
function readJson(fileName) {
  const url = new URL(`./${fileName}`, import.meta.url);
  let raw;
  try {
    raw = readFileSync(url, 'utf8');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Canon loader: cannot read ${fileName}: ${msg}`);
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Canon loader: ${fileName} is not valid JSON: ${msg}`);
  }
}

/** @param {unknown} v @returns {v is Record<string, unknown>} */
function isObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** @param {unknown} v @param {string} where @returns {string[]} */
function asStringArray(v, where) {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
    throw new Error(`Canon loader: ${where} must be an array of strings`);
  }
  return /** @type {string[]} */ (v);
}

const RULE_LEVELS = new Set(['block', 'warn', 'require-approval', 'inform']);
const RISK_LEVELS = new Set(['low', 'medium', 'high', 'critical']);

/** @param {unknown} raw @returns {CanonRule} */
function validateRule(raw) {
  if (!isObject(raw)) throw new Error('Canon loader: rule must be an object');
  const { ruleId, version, status, authority, title, description, source, appliesTo, enforcement } = raw;
  if (typeof ruleId !== 'string' || ruleId.length === 0) {
    throw new Error('Canon loader: rule.ruleId is required');
  }
  if (typeof version !== 'string') throw new Error(`Canon loader: ${ruleId}.version is required`);
  if (status !== 'active' && status !== 'draft' && status !== 'deprecated') {
    throw new Error(`Canon loader: ${ruleId}.status is invalid`);
  }
  if (
    authority !== 'constitutional' &&
    authority !== 'os-platform' &&
    authority !== 'engineering-policy' &&
    authority !== 'advisory'
  ) {
    throw new Error(`Canon loader: ${ruleId}.authority is invalid`);
  }
  if (typeof title !== 'string') throw new Error(`Canon loader: ${ruleId}.title is required`);
  if (typeof description !== 'string') throw new Error(`Canon loader: ${ruleId}.description is required`);
  if (!isObject(appliesTo)) throw new Error(`Canon loader: ${ruleId}.appliesTo is required`);
  if (!isObject(enforcement)) throw new Error(`Canon loader: ${ruleId}.enforcement is required`);
  if (typeof enforcement.level !== 'string' || !RULE_LEVELS.has(enforcement.level)) {
    throw new Error(`Canon loader: ${ruleId}.enforcement.level is invalid`);
  }
  return Object.freeze({
    ruleId,
    version,
    status,
    authority,
    title,
    description,
    source: typeof source === 'string' ? source : undefined,
    appliesTo: Object.freeze({
      paths: Object.freeze(asStringArray(appliesTo.paths, `${ruleId}.appliesTo.paths`)),
      taskIntents: Object.freeze(asStringArray(appliesTo.taskIntents, `${ruleId}.appliesTo.taskIntents`)),
      surfaces: Object.freeze(asStringArray(appliesTo.surfaces, `${ruleId}.appliesTo.surfaces`)),
    }),
    enforcement: Object.freeze({
      level: /** @type {RuleEnforcement['level']} */ (enforcement.level),
      requiredGates: Object.freeze(asStringArray(enforcement.requiredGates, `${ruleId}.enforcement.requiredGates`)),
      requiresManualReview: enforcement.requiresManualReview === true,
    }),
  });
}

/** @param {unknown} raw @returns {WriteLane} */
function validateLane(raw) {
  if (!isObject(raw)) throw new Error('Canon loader: write-lane must be an object');
  const { owner, paths, risk, requiredGates, manualReviewRequired } = raw;
  if (typeof owner !== 'string' || owner.length === 0) {
    throw new Error('Canon loader: write-lane.owner is required');
  }
  if (typeof risk !== 'string' || !RISK_LEVELS.has(risk)) {
    throw new Error(`Canon loader: write-lane ${owner}.risk is invalid`);
  }
  return Object.freeze({
    owner,
    paths: Object.freeze(asStringArray(paths, `write-lane ${owner}.paths`)),
    risk: /** @type {WriteLane['risk']} */ (risk),
    requiredGates: Object.freeze(asStringArray(requiredGates, `write-lane ${owner}.requiredGates`)),
    manualReviewRequired: manualReviewRequired === true,
  });
}

/** @param {unknown} raw @returns {Gate} */
function validateGate(raw) {
  if (!isObject(raw)) throw new Error('Canon loader: gate must be an object');
  const { gateId, label, command, kind } = raw;
  if (typeof gateId !== 'string' || gateId.length === 0) {
    throw new Error('Canon loader: gate.gateId is required');
  }
  return Object.freeze({
    gateId,
    label: typeof label === 'string' ? label : gateId,
    command: typeof command === 'string' ? command : '',
    kind: typeof kind === 'string' ? kind : undefined,
  });
}

/** @type {Canon | null} */
let cached = null;

/**
 * Load, validate, freeze, and memoize the Canon law.
 * @param {{ reload?: boolean }} [opts]
 * @returns {Canon}
 */
export function loadCanon(opts) {
  if (cached && !(opts && opts.reload)) return cached;

  const indexRaw = readJson('canon-index.json');
  const lanesRaw = readJson('engineering-write-lanes.json');
  const gatesRaw = readJson('gate-registry.json');

  if (!isObject(indexRaw) || !Array.isArray(indexRaw.rules)) {
    throw new Error('Canon loader: canon-index.json must have a rules array');
  }
  if (!isObject(lanesRaw) || !Array.isArray(lanesRaw.lanes)) {
    throw new Error('Canon loader: engineering-write-lanes.json must have a lanes array');
  }
  if (!isObject(gatesRaw) || !Array.isArray(gatesRaw.gates)) {
    throw new Error('Canon loader: gate-registry.json must have a gates array');
  }

  const canon = Object.freeze({
    rules: Object.freeze(indexRaw.rules.map(validateRule)),
    lanes: Object.freeze(lanesRaw.lanes.map(validateLane)),
    gates: Object.freeze(gatesRaw.gates.map(validateGate)),
  });

  cached = canon;
  return canon;
}
