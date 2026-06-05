/**
 * Advisory Canon gate: hardcoded ports.
 *
 * Scans the given files for hardcoded network ports (TerraFusion Constitution
 * Article VI: ports come from environment/config). ADVISORY by default — it
 * reports findings and exits 0. Pass --strict to exit non-zero on findings
 * (enforcement is a deliberate later decision, not this slice).
 *
 * Read-only: reads file contents, runs NO commands, mutates nothing. File paths
 * are passed as arguments (lint-staged/CI convention) — no git invocation.
 *
 * CLI:  node os-platform/core/gates/check-hardcoded-ports.mjs [--strict] [--json] <paths...>
 *
 * @module gates/check-hardcoded-ports
 */

import { readFileSync } from 'node:fs';
import { printReport, runMain } from './gate-runtime.mjs';

/**
 * @typedef {Readonly<{ line: number, port: string, snippet: string }>} PortHit
 */

const URL_PORT = /(?:https?:\/\/|wss?:\/\/)[^\s'"`]*?:(\d{2,5})\b/gi;
const LOCALHOST_PORT = /\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{2,5})\b/gi;
const PORT_ASSIGN = /\bport\s*[:=]\s*(\d{2,5})\b/gi;
const ENV_CONTEXT = /process\.env|import\.meta\.env|getenv|\benv\(|configuration|appsettings/i;

/**
 * True when a line sources its port from env/config (allowed, not a finding).
 * @param {string} line
 * @returns {boolean}
 */
export function isAllowedPortContext(line) {
  if (typeof line !== 'string') return false;
  return ENV_CONTEXT.test(line);
}

/**
 * Find hardcoded ports in a blob of source text. Deterministic, never throws.
 * @param {unknown} text
 * @returns {ReadonlyArray<PortHit>}
 */
export function findHardcodedPorts(text) {
  if (typeof text !== 'string' || text.length === 0) return Object.freeze([]);
  const lines = text.split(/\r?\n/);
  /** @type {PortHit[]} */
  const hits = [];
  lines.forEach((line, idx) => {
    if (isAllowedPortContext(line)) return;
    const seen = new Set();
    for (const re of [URL_PORT, LOCALHOST_PORT, PORT_ASSIGN]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        const port = m[1];
        if (seen.has(port)) continue;
        seen.add(port);
        hits.push(Object.freeze({ line: idx + 1, port, snippet: line.trim().slice(0, 120) }));
      }
    }
  });
  return Object.freeze(hits);
}

/**
 * Scan a set of files. Never throws; unreadable files are skipped.
 * @param {ReadonlyArray<string>} paths
 * @returns {ReadonlyArray<Readonly<{ path: string, line: number, port: string, snippet: string }>>}
 */
export function checkHardcodedPorts(paths) {
  /** @type {Array<Readonly<{ path: string, line: number, port: string, snippet: string }>>} */
  const findings = [];
  for (const path of paths || []) {
    let text;
    try {
      text = readFileSync(path, 'utf8');
    } catch {
      continue;
    }
    for (const hit of findHardcodedPorts(text)) {
      findings.push(Object.freeze({ path, line: hit.line, port: hit.port, snippet: hit.snippet }));
    }
  }
  return Object.freeze(findings);
}

runMain(import.meta.url, (opts) => {
  const paths = opts.paths.filter((p) => /\.(ts|tsx|js|jsx|mjs|cjs|cs|json|ya?ml)$/i.test(p));
  const findings = checkHardcodedPorts(paths);
  return printReport({
    gate: 'hardcoded-ports',
    json: opts.json,
    strict: opts.strict,
    findings: findings.map((f) => ({ path: f.path, detail: `port ${f.port} at line ${f.line}: ${f.snippet}` })),
    okMessage: `scanned ${paths.length} file(s); no hardcoded ports found.`,
  });
});
