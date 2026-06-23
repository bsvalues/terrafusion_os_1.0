/**
 * tf canon — headless CLI surface over the read-only Canon runtime.
 *
 * A thin command router; all logic lives in the runtime modules. `runCli(argv)`
 * is pure — it returns { code, lines } and never calls process.exit or writes
 * to stdout — so it is fully testable. The main guard prints + exits.
 *
 * Read-only: no file writes, no commands, no network. Paths are arguments.
 *
 * Usage:
 *   tf-canon query <path> [--json]
 *   tf-canon risk  <path> [--json]
 *   tf-canon rules (--task "<intent>" | --path <path>) [--json]
 *   tf-canon gates <paths...> [--strict] [--json]
 *   tf-canon help
 *
 * @module canon/tf-canon
 */

import {
  getOwnerForPath,
  getRulesForPath,
  getRulesForTask,
  getRequiredGatesForPath,
} from './canon-query.mjs';
import { scorePathRisk } from './canon-risk.mjs';
import { runCanonGates } from '../gates/canon-gates.mjs';
import { fileURLToPath } from 'node:url';

const USAGE = [
  'usage: tf-canon <command> [options]',
  '',
  'commands:',
  '  query <path> [--json]                  owner + rules + gates + risk for a path',
  '  risk  <path> [--json]                  risk score for a path',
  '  rules (--task "<intent>" | --path <p>) [--json]   rules for a task intent or path',
  '  gates <paths...> [--strict] [--json]   run advisory gates (--strict exits 1 on blocking)',
  '  help                                   show this help',
];

/** @param {ReadonlyArray<string>} argv @returns {{flags:Set<string>, opts:Record<string,string>, rest:string[]}} */
function parse(argv) {
  const flags = new Set();
  /** @type {Record<string, string>} */
  const opts = {};
  const rest = [];
  const a = Array.isArray(argv) ? argv : [];
  for (let i = 0; i < a.length; i++) {
    const tok = a[i];
    if (tok === '--json' || tok === '--strict') {
      flags.add(tok.slice(2));
    } else if (tok === '--task' || tok === '--path') {
      opts[tok.slice(2)] = a[++i] ?? '';
    } else {
      rest.push(tok);
    }
  }
  return { flags, opts, rest };
}

/** @param {object} obj @returns {string[]} */
function jsonLines(obj) {
  return [JSON.stringify(obj, null, 2)];
}

/**
 * Pure CLI dispatcher. Returns an exit code and output lines; never throws,
 * never exits, never prints.
 * @param {ReadonlyArray<string>} argv
 * @returns {Readonly<{ code: number, lines: string[] }>}
 */
export function runCli(argv) {
  try {
    const { flags, opts, rest } = parse(argv);
    const cmd = rest[0];
    const json = flags.has('json');

    if (!cmd || cmd === 'help' || cmd === '--help') {
      return Object.freeze({ code: 0, lines: USAGE.slice() });
    }

    if (cmd === 'query') {
      const path = rest[1];
      if (!path) return Object.freeze({ code: 2, lines: ['error: query requires <path>', ...USAGE] });
      const owner = getOwnerForPath(path);
      const risk = scorePathRisk(path);
      const requiredGates = getRequiredGatesForPath(path);
      const rules = getRulesForPath(path).map((r) => r.ruleId);
      if (json) {
        return Object.freeze({ code: 0, lines: jsonLines({ path, owner: owner.owner, confidence: owner.confidence, risk, requiredGates, rules }) });
      }
      return Object.freeze({
        code: 0,
        lines: [
          `path   : ${path}`,
          `owner  : ${owner.owner} (${owner.confidence})`,
          `risk   : ${risk.level}${risk.manualReviewRequired ? ' (manual review)' : ''}`,
          `gates  : ${requiredGates.join(', ') || '(none)'}`,
          `rules  : ${rules.join(', ') || '(none)'}`,
        ],
      });
    }

    if (cmd === 'risk') {
      const path = rest[1];
      if (!path) return Object.freeze({ code: 2, lines: ['error: risk requires <path>', ...USAGE] });
      const risk = scorePathRisk(path);
      return Object.freeze({ code: 0, lines: json ? jsonLines(risk) : [`${path}: ${risk.level}`, ...risk.reasons.map((r) => `  - ${r}`)] });
    }

    if (cmd === 'rules') {
      if (opts.task) {
        const rules = getRulesForTask(opts.task);
        return Object.freeze({ code: 0, lines: json ? jsonLines(rules) : rules.map((r) => `${r.ruleId} [${r.enforcement.level}]`) });
      }
      if (opts.path) {
        const rules = getRulesForPath(opts.path);
        return Object.freeze({ code: 0, lines: json ? jsonLines(rules) : rules.map((r) => `${r.ruleId} [${r.enforcement.level}]`) });
      }
      return Object.freeze({ code: 2, lines: ['error: rules requires --task "<intent>" or --path <path>', ...USAGE] });
    }

    if (cmd === 'gates') {
      const paths = rest.slice(1);
      if (paths.length === 0) return Object.freeze({ code: 2, lines: ['error: gates requires <paths...>', ...USAGE] });
      const res = runCanonGates(paths, { strict: flags.has('strict') });
      if (json) return Object.freeze({ code: res.exitCode, lines: jsonLines({ blocking: res.blocking, advisory: res.advisory, ok: res.ok }) });
      const lines = [];
      for (const f of res.blocking) lines.push(`BLOCK   ${f.path}: [${f.gate}] ${f.detail}`);
      for (const f of res.advisory) lines.push(`advise  ${f.path}: [${f.gate}] ${f.detail}`);
      if (!lines.length) lines.push(`ok: scanned ${paths.length} path(s); no findings.`);
      return Object.freeze({ code: res.exitCode, lines });
    }

    return Object.freeze({ code: 2, lines: [`error: unknown command "${cmd}"`, ...USAGE] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Object.freeze({ code: 2, lines: [`error: ${msg}`] });
  }
}

// CLI entry (only when run directly).
const entry = process.argv[1] ? process.argv[1].replace(/\\/g, '/') : '';
const self = fileURLToPath(import.meta.url).replace(/\\/g, '/');
if (entry === self) {
  const { code, lines } = runCli(process.argv.slice(2));
  process.stdout.write(lines.join('\n') + '\n');
  process.exitCode = code;
}
