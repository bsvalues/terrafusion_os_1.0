/**
 * Canon Runtime Query (Core)
 *
 * Read-only, deterministic answers to Canon questions, derived from static law
 * (canon-index.json rules + engineering-write-lanes.json). No LLM calls, no
 * agents, no command execution, no file editing. Query-time inputs never throw;
 * unknown inputs fall back safely.
 *
 * @module canon/canon-query
 */

import { loadCanon } from './canon-loader.mjs';

/**
 * @typedef {import('./canon-loader.mjs').CanonRule} CanonRule
 * @typedef {import('./canon-loader.mjs').WriteLane} WriteLane
 *
 * @typedef {Readonly<{
 *   owner: string,
 *   matchedPolicy: string,
 *   confidence: 'exact' | 'pattern' | 'fallback'
 * }>} OwnerResolution
 */

const FALLBACK_OWNER = 'unassigned';

/**
 * Normalize a path for matching: forward slashes, strip leading "./",
 * drop a single leading slash. Empty/invalid → "".
 * @param {unknown} p
 * @returns {string}
 */
export function normalizePath(p) {
  if (typeof p !== 'string') return '';
  let s = p.replace(/\\/g, '/').trim();
  if (s.startsWith('./')) s = s.slice(2);
  if (s.startsWith('/')) s = s.slice(1);
  return s;
}

/**
 * Convert a glob pattern (`*` within a segment, `**` across segments) to a
 * RegExp anchored to the whole string. Regex metacharacters are escaped.
 * @param {string} pattern
 * @returns {RegExp}
 */
function globToRegExp(pattern) {
  let re = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*') {
      if (pattern[i + 1] === '*') {
        re += '.*';
        i++;
        if (pattern[i + 1] === '/') i++; // consume the slash; .* already spans it
      } else {
        re += '[^/]*';
      }
    } else if ('\\^$.|?+()[]{}'.includes(c)) {
      re += '\\' + c;
    } else {
      re += c;
    }
  }
  return new RegExp('^' + re + '$');
}

/** @param {string} pattern @returns {boolean} */
function isExactPattern(pattern) {
  return !pattern.includes('*');
}

/**
 * Specificity score for disambiguating overlapping patterns: longer literal
 * prefix (chars before first `*`) wins; ties broken by total pattern length.
 * @param {string} pattern
 * @returns {number}
 */
function specificity(pattern) {
  const star = pattern.indexOf('*');
  const prefixLen = star === -1 ? pattern.length : star;
  return prefixLen * 1000 + pattern.length;
}

/**
 * @param {string} path
 * @param {string} pattern
 * @returns {boolean}
 */
export function pathMatchesPattern(path, pattern) {
  const np = normalizePath(path);
  const npat = normalizePath(pattern);
  if (np.length === 0 || npat.length === 0) return false;
  return globToRegExp(npat).test(np);
}

/**
 * Resolve the most specific write-lane that owns a path.
 * @param {string} path
 * @returns {Readonly<{ lane: WriteLane, pattern: string }> | null}
 */
export function getLaneForPath(path) {
  const np = normalizePath(path);
  if (np.length === 0) return null;
  const { lanes } = loadCanon();
  /** @type {{ lane: WriteLane, pattern: string, score: number } | null} */
  let best = null;
  for (const lane of lanes) {
    for (const pattern of lane.paths) {
      if (pathMatchesPattern(np, pattern)) {
        const score = specificity(normalizePath(pattern));
        if (!best || score > best.score) best = { lane, pattern, score };
      }
    }
  }
  return best ? Object.freeze({ lane: best.lane, pattern: best.pattern }) : null;
}

/**
 * Which rules govern this path?
 * @param {string} path
 * @returns {ReadonlyArray<CanonRule>}
 */
export function getRulesForPath(path) {
  const np = normalizePath(path);
  if (np.length === 0) return Object.freeze([]);
  const { rules } = loadCanon();
  return Object.freeze(
    rules.filter(
      (r) => r.status === 'active' && r.appliesTo.paths.some((pat) => pathMatchesPattern(np, pat)),
    ),
  );
}

/**
 * Normalize an intent/token string to space-separated lowercase words.
 * @param {string} s
 * @returns {string}
 */
function normalizeIntent(s) {
  return s
    .toLowerCase()
    .replace(/[-_]+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Which rules govern this task intent? A rule matches when any of its declared
 * taskIntents (normalized) appears as a phrase within the normalized intent.
 * @param {string} taskIntent
 * @returns {ReadonlyArray<CanonRule>}
 */
export function getRulesForTask(taskIntent) {
  if (typeof taskIntent !== 'string' || taskIntent.trim().length === 0) return Object.freeze([]);
  const intent = ` ${normalizeIntent(taskIntent)} `;
  const { rules } = loadCanon();
  return Object.freeze(
    rules.filter(
      (r) =>
        r.status === 'active' &&
        r.appliesTo.taskIntents.some((t) => {
          const token = normalizeIntent(t);
          return token.length > 0 && intent.includes(` ${token} `);
        }),
    ),
  );
}

/**
 * Who owns this source-code area?
 * @param {string} path
 * @returns {OwnerResolution}
 */
export function getOwnerForPath(path) {
  const np = normalizePath(path);
  const match = np.length === 0 ? null : getLaneForPath(np);
  if (!match) {
    return Object.freeze({ owner: FALLBACK_OWNER, matchedPolicy: '(fallback)', confidence: 'fallback' });
  }
  const confidence = isExactPattern(match.pattern) && normalizePath(match.pattern) === np ? 'exact' : 'pattern';
  return Object.freeze({
    owner: match.lane.owner,
    matchedPolicy: match.pattern,
    confidence,
  });
}

/**
 * What gates are required for this path? Union of the owning write-lane's gates
 * and every active matching rule's required gates. Stable, de-duplicated order.
 * @param {string} path
 * @returns {ReadonlyArray<string>}
 */
export function getRequiredGatesForPath(path) {
  const np = normalizePath(path);
  if (np.length === 0) return Object.freeze([]);
  /** @type {string[]} */
  const gates = [];
  const lane = getLaneForPath(np);
  if (lane) for (const g of lane.lane.requiredGates) if (!gates.includes(g)) gates.push(g);
  for (const rule of getRulesForPath(np)) {
    for (const g of rule.enforcement.requiredGates) if (!gates.includes(g)) gates.push(g);
  }
  return Object.freeze(gates);
}
