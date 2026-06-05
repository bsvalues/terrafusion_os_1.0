/**
 * Shared runtime for advisory Canon gate scripts.
 *
 * Pure CLI plumbing: argument parsing and report printing. NO command
 * execution, NO git, NO network — callers (pre-commit/CI) pass the changed
 * file paths as arguments (the lint-staged convention). Read-only.
 *
 * @module gates/gate-runtime
 */

import { fileURLToPath } from 'node:url';

/**
 * @typedef {Readonly<{ strict: boolean, json: boolean, paths: ReadonlyArray<string> }>} GateArgs
 * @typedef {Readonly<{ path?: string, detail: string }>} Finding
 */

/**
 * Parse gate CLI args: flags --strict/--json, everything else is a path.
 * @param {ReadonlyArray<string>} argv
 * @returns {GateArgs}
 */
export function parseArgs(argv) {
  const a = Array.isArray(argv) ? argv : [];
  return Object.freeze({
    strict: a.includes('--strict'),
    json: a.includes('--json'),
    paths: Object.freeze(a.filter((x) => typeof x === 'string' && !x.startsWith('--'))),
  });
}

/**
 * Print a gate report. Advisory by default: findings are reported but exit code
 * stays 0 unless --strict was passed. Returns { ok, exitCode }.
 * @param {Readonly<{ gate: string, json?: boolean, strict?: boolean, findings: ReadonlyArray<Finding>, okMessage: string }>} r
 * @returns {Readonly<{ ok: boolean, exitCode: number }>}
 */
export function printReport(r) {
  const findings = r.findings || [];
  const ok = findings.length === 0;
  const exitCode = ok || !r.strict ? 0 : 1;

  if (r.json) {
    process.stdout.write(
      JSON.stringify({ gate: r.gate, mode: r.strict ? 'strict' : 'advisory', ok, count: findings.length, findings }) +
        '\n',
    );
    return Object.freeze({ ok, exitCode });
  }

  const mode = r.strict ? 'STRICT' : 'ADVISORY';
  if (ok) {
    process.stdout.write(`✅ canon:${r.gate} [${mode}] — ${r.okMessage}\n`);
  } else {
    const verb = r.strict ? '❌' : '⚠️';
    process.stdout.write(`${verb} canon:${r.gate} [${mode}] — ${findings.length} finding(s):\n`);
    for (const f of findings) {
      process.stdout.write(`   - ${f.path ? f.path + ': ' : ''}${f.detail}\n`);
    }
    if (!r.strict) process.stdout.write(`   (advisory: not blocking; rerun with --strict to enforce)\n`);
  }
  return Object.freeze({ ok, exitCode });
}

/**
 * Run a gate as a CLI only when this module is the process entrypoint.
 * @param {string} metaUrl import.meta.url of the gate module
 * @param {(opts: GateArgs) => Readonly<{ ok: boolean, exitCode: number }>} fn
 */
export function runMain(metaUrl, fn) {
  const entry = process.argv[1] ? process.argv[1].replace(/\\/g, '/') : '';
  const self = fileURLToPath(metaUrl).replace(/\\/g, '/');
  if (entry !== self) return;
  const result = fn(parseArgs(process.argv.slice(2)));
  process.exitCode = result.exitCode;
}
