#!/usr/bin/env node
/**
 * TerraFusion Brain — operational command interface (Brain v1.0 skeleton).
 *
 *   node scripts/brain/brain.mjs <command> [args]
 *   pnpm brain <command> [args]
 *
 * Commands:
 *   status                       What is true / what matters now (release gate, drift, open WO).
 *   ask "<question>"             Governed architecture Q&A over canon (owns / can-write / routing).
 *   classify "<work request>"    Layer / suite / allowed-forbidden writes / naming flags.
 *   workorder "<work request>"   Emit a bounded work-order skeleton from classification.
 *   check                        Run enforcement (naming-lint + write-lanes) and aggregate.
 *   drift                        Print the drift ledger.
 *   release                      Print the release gates.
 *   defer "<idea>"               Park an idea in the deferred board (the only mutating command).
 *   help
 *
 * The Brain reasons over docs/brain/canon/*.json and wraps EXISTING enforcement
 * (tools/naming/naming-lint.mjs, scripts/spec-gates/write-lanes.mjs). It never fabricates:
 * if canon does not answer, it says UNRESOLVED. (ADR-0003 proof standard)
 *
 * Subprocesses use execFileSync with fixed argv arrays (no shell) — no command injection.
 */
import { readFileSync, appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { canon, REPO_ROOT, ownerOf, canWrite, classify, judge, riskOf } from './canon.mjs';
import {
  WO_DIR,
  nextWoNumber,
  slugify,
  derivePolicy,
  renderWorkOrder,
  loadWorkOrderPolicy,
  reviewAgainstPolicy,
  globToRe,
  evaluateStagedRisk,
} from './workorder.mjs';

/** Staged files in the index (commit-race hazard surface — WO-0011). */
function stagedFiles() {
  try {
    return run('git', ['diff', '--cached', '--name-only']).trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/** One-line staged-file warning for status/next (commit-race hardening, observed 2x). */
function warnStaged() {
  const staged = stagedFiles();
  if (staged.length) {
    console.log(
      `\n⚠ STAGED-FILE HAZARD: ${staged.length} file(s) staged but uncommitted in a SHARED worktree.`
    );
    console.log(
      "  Another agent's commit will silently absorb them (observed 2x). Commit path-limited NOW or unstage."
    );
  }
  return staged.length;
}

// Files that belong to the Brain governance footprint — the default commit-plan include set when no
// work order is supplied (isolates this layer's work from an unrelated working-tree diff).
const GOVERNANCE_FOOTPRINT = [
  'docs/brain/**',
  'scripts/brain/**',
  'scripts/spec-gates/reserved-staging-exception*',
  'graphify-out/**',
  'wiki/**',
  'AGENT_ENTRYPOINT.md',
  '.github/workflows/seal-gate-fast.yml',
  '.husky/pre-commit',
  'frontend/.env.example',
];

const MEM = join(REPO_ROOT, 'docs', 'brain', 'memory');
const TODAY = join(REPO_ROOT, 'docs', 'brain', '00_TODAY.md');
const read = p => (existsSync(p) ? readFileSync(p, 'utf8') : null);

const [, , cmd = 'help', ...rest] = process.argv;
const arg = rest.join(' ').replace(/^["']|["']$/g, '');

function run(file, args) {
  return execFileSync(file, args, { cwd: REPO_ROOT, stdio: 'pipe', encoding: 'utf8' });
}

function gitBranch() {
  try {
    return run('git', ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  } catch {
    return 'unknown';
  }
}

// Open drift rows with severity parsed from the Sev COLUMN (not a row-wide grep —
// finding text can contain "P0/P1" and would false-count). Returns ['P0','P1',...].
function openDriftSeverities(driftMd) {
  return (driftMd || '')
    .split('\n')
    .filter(l => /^\|\s*D-\d+/.test(l) && /\|\s*Open\s*\|/i.test(l))
    .map(
      l =>
        l
          .split('|')
          .map(c => c.trim())
          .find(c => /^P[0-3]$/.test(c)) || 'P3'
    );
}

function section(md, heading) {
  if (!md) return null;
  const re = new RegExp(`#{2,4}\\s*${heading}[^\\n]*\\n([\\s\\S]*?)(?=\\n#{2,4}\\s|$)`, 'i');
  const m = md.match(re);
  return m ? m[1].trim() : null;
}

function cmdStatus() {
  const drift = read(join(MEM, 'drift-ledger.md')) || '';
  const wos = read(join(MEM, 'agent-workorders.md')) || '';
  const today = read(TODAY) || '';
  const sev = openDriftSeverities(drift);
  const p0 = sev.filter(s => s === 'P0').length;
  const p1 = sev.filter(s => s === 'P1').length;
  const openRows = sev;
  const activeWOs = wos
    .split('\n')
    .filter(l => /^###\s+WO-/.test(l))
    .map(l => l.replace(/^###\s+/, ''));
  const forbidden = section(today, 'Forbidden Work Today');

  console.log('🧠 TerraFusion Brain — STATUS');
  console.log('────────────────────────────');
  console.log(`Release target : TerraFusion OS 1.0`);
  console.log(`Branch         : ${gitBranch()}`);
  console.log(`Open drift     : P0=${p0}  P1=${p1}  (open rows: ${openRows.length})`);
  console.log(`Work orders    : ${activeWOs.length ? activeWOs.join('; ') : '(none active)'}`);
  if (forbidden) {
    console.log(`Forbidden today:`);
    forbidden
      .split('\n')
      .filter(l => l.trim().startsWith('-'))
      .forEach(l => console.log(`   ${l.trim()}`));
  }
  console.log('');
  console.log('Run `brain drift` / `brain release` / `brain check` for detail.');
  warnStaged();
}

function cmdAsk() {
  if (!arg) return console.log('usage: brain ask "can dais write documents?"');
  const t = arg.toLowerCase();

  const canMatch = t.match(/can\s+(?:terra)?(\w+)\s+(?:write|modify|update|own)s?\s+(.+?)\??$/);
  if (canMatch) {
    const suite = canMatch[1];
    const targetOwner = ownerOf(canMatch[2]);
    const target = targetOwner?.suite || canMatch[2].trim();
    const r = canWrite(suite, target);
    console.log(`Q: ${arg}`);
    if (r.allowed === null) return console.log(`A: UNRESOLVED — ${r.reason}.`);
    if (r.allowed) return console.log(`A: YES — ${r.reason}.`);
    console.log(`A: NO — ${r.reason}.`);
    return console.log(`   Bridge: ${r.bridge}. (cross-lane intent must emit a TerraTrace event)`);
  }

  const ownMatch = t.match(/(?:who|what)\s+owns?\s+(.+?)\??$/);
  if (ownMatch) {
    const o = ownerOf(ownMatch[1]);
    console.log(`Q: ${arg}`);
    return console.log(
      o
        ? `A: ${canon.suites.active[o.suite]?.display || o.suite} (matched on "${o.matched}").`
        : `A: UNRESOLVED — no suite in canon owns "${ownMatch[1].trim()}". Ask the architect.`
    );
  }

  if (/where.*(parcel|open|route)/.test(t)) {
    console.log(`Q: ${arg}`);
    console.log(
      `A: Parcel-scoped work routes to ${canon.layers.workbench_routing.parcel_actions} (Tier-0 Property Workbench).`
    );
    return console.log(`   ${canon.layers.workbench_routing.invariant}`);
  }

  console.log(`Q: ${arg}`);
  console.log(
    'A: UNRESOLVED — I answer: "can <suite> write <X>?", "who owns <X>?", "where does parcel <X> open?".'
  );
  console.log(
    '   For anything else, classify the work (`brain classify "..."`) or consult canon docs.'
  );
}

function cmdClassify(emitWorkOrder = false) {
  if (!arg)
    return console.log(
      `usage: brain ${emitWorkOrder ? 'workorder' : 'classify'} "add appeal hearing persistence"`
    );
  const c = classify(arg);
  const j = judge(arg);
  if (!emitWorkOrder) {
    console.log(`Request : ${c.request}`);
    console.log(`Layer   : ${c.layer}`);
    console.log(`Suite   : ${c.suite}${c.matchedOn ? ` (matched "${c.matchedOn}")` : ''}`);
    console.log(`Surface : ${c.surface}`);
    console.log(`Risk    : ${j.risk}  (${j.riskReasons.join('; ') || 'baseline'})`);
    console.log(`Verdict : ${verdictIcon(j.verdict)} ${j.verdict}`);
    console.log(`Allowed writes  : ${c.allowedWrites.join(', ') || '—'}`);
    console.log(`Forbidden writes: ${c.forbiddenWrites.join(', ') || '—'}`);
    if (c.bridge) console.log(`Cross-lane via  : ${c.bridge}`);
    if (j.constraints.length) {
      console.log(`Constraints     :`);
      j.constraints.forEach(x => console.log(`   - ${x}`));
    }
    if (j.escalation) console.log(`Escalation      : ${j.escalation}`);
    if (c.suite === 'UNRESOLVED')
      console.log('\n⚠ Owner unclear — STOP. Do not build until the architect assigns a lane.');
    return;
  }
  console.log(`# WO-NNN: ${c.request}`);
  console.log(`## Layer            ${c.layer}`);
  console.log(`## Suite / Owner    ${c.suite}`);
  console.log(`## Surface          ${c.surface}`);
  console.log(`## Allowed Writes   ${c.allowedWrites.join(', ') || '—'}`);
  console.log(`## Forbidden Writes ${c.forbiddenWrites.join(', ') || '—'}`);
  console.log(
    `## Required Checks  - CountyId filter  - AuditableEntity pattern  - service+controller tests  - brain check green`
  );
  console.log(
    `## Stop Conditions  another suite must change · shell routing must change · owner unclear · mock on governed path`
  );
  if (c.bridge) console.log(`## Cross-lane       ${c.bridge} (emit TerraTrace event)`);
  if (c.namingFlags.length)
    c.namingFlags.forEach(f => console.log(`## ⚠ Naming         [${f.kind}] "${f.term}"`));
}

function verdictIcon(v) {
  return (
    {
      Proceed: '✅',
      'Proceed with constraints': '🟡',
      Escalate: '🔺',
      Defer: '🅿️',
      Block: '⛔',
      Recover: '🚑',
    }[v] || '•'
  );
}

// ── today: next-best-action engine ──────────────────────────────────────────
function cmdToday() {
  const drift = read(join(MEM, 'drift-ledger.md')) || '';
  const rows = drift.split('\n').filter(l => /^\| D-\d+/.test(l) && /\|\s*Open\s*\|/i.test(l));
  // parse: | D-00x | date | finding | Sev | Owner | Open | action |
  const items = rows.map(l => {
    const cells = l.split('|').map(s => s.trim());
    const sev = cells.find(c => /^P[0-3]$/.test(c)) || 'P3';
    return {
      id: cells[1],
      sev,
      finding: cells[3] || '',
      owner: cells[5] || '',
      action: cells[7] || '',
    };
  });
  // practical priority: P0 > P1 > P2 > P3; tie-break: shorter/clearer action first
  const sevRank = { P0: 0, P1: 1, P2: 2, P3: 3 };
  items.sort((a, b) => sevRank[a.sev] - sevRank[b.sev] || a.finding.length - b.finding.length);
  const top = items[0];
  const today = read(TODAY) || '';
  const forbidden = section(today, 'Forbidden Work Today');

  console.log('🧠 Cortex — TODAY (next best action)');
  console.log('────────────────────────────────────');
  if (!top) {
    console.log('No open drift. Check open work orders: `brain status`.');
    return;
  }
  console.log(`Highest-value move: [${top.sev}] ${top.id} — ${top.finding.slice(0, 110)}`);
  console.log(
    `\nWhy: severity ${top.sev}, owner ${top.owner}. (P0>P1>P2>P3; lowest-ambiguity first)`
  );
  console.log(`Do:  ${top.action.slice(0, 200) || '(see drift ledger)'}`);
  if (forbidden) {
    console.log(`\nDo NOT:`);
    forbidden
      .split('\n')
      .filter(l => l.trim().startsWith('-'))
      .slice(0, 5)
      .forEach(l => console.log(`   ${l.trim()}`));
  }
  console.log(
    `\nThen: \`brain workorder "<the fix>"\`  →  build  →  \`brain check\`  →  \`brain release\``
  );
  console.log(
    `(ranking is over OPEN drift-ledger rows; refine by adding blast-radius once Graph reports land — D-003)`
  );
}

// ── release: deterministic confidence from gate checkboxes + open drift ──────
function cmdRelease() {
  const gates = read(join(MEM, 'release-gates.md'));
  if (!gates) return console.log('(no release gates yet)');
  const done = (gates.match(/- \[x\]/g) || []).length;
  const open = (gates.match(/- \[ \]/g) || []).length;
  const total = done + open;
  const drift = read(join(MEM, 'drift-ledger.md')) || '';
  const sev = openDriftSeverities(drift);
  const p0 = sev.filter(s => s === 'P0').length;
  const p1 = sev.filter(s => s === 'P1').length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  // confidence = gate completion, hard-capped by open blockers (honest, not flattering)
  let confidence = pct;
  if (p0 > 0) confidence = Math.min(confidence, 40);
  if (p1 > 0) confidence = Math.min(confidence, 70);
  const verdict =
    p0 > 0
      ? 'NOT READY (P0 open)'
      : p1 > 0
        ? 'READY WITH KNOWN LIMITATIONS (P1 open)'
        : pct === 100
          ? 'READY'
          : 'NOT READY (gates open)';

  console.log('🧠 Cortex — RELEASE READINESS');
  console.log('─────────────────────────────');
  console.log(`Target           : TerraFusion OS 1.0`);
  console.log(`Gates            : ${done}/${total} checked (${pct}%)`);
  console.log(`Open drift       : P0=${p0}  P1=${p1}`);
  console.log(
    `Release confidence: ${confidence}%  (capped by open blockers — see ADR-0003 proof standard)`
  );
  console.log(`Verdict          : ${verdict}`);
  console.log(`\nDetail: \`brain check\`, \`brain drift\`, and docs/brain/memory/release-gates.md`);
}

// ── workorder create: generate a scoped work-order packet ───────────────────
function cmdWorkorderCreate(args) {
  const task = args.join(' ').replace(/^["']|["']$/g, '');
  if (!task) return console.log('usage: brain workorder create "Wire X into Y"');
  const c = classify(task);
  c.riskLevel = riskOf(task, c).level;
  const id = `WO-${String(nextWoNumber(REPO_ROOT)).padStart(4, '0')}`;
  const policy = derivePolicy(id, task, c);
  const md = renderWorkOrder(policy, c);
  const dir = join(REPO_ROOT, ...WO_DIR);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${id}-${slugify(task)}.md`);
  writeFileSync(path, md);
  console.log(`🧠 Work order created: ${id}  (risk ${policy.risk}, suite ${policy.suite})`);
  console.log(`   ${path.replace(REPO_ROOT, '.')}`);
  console.log(
    `   allowed: ${policy.allowed_files.length} pattern(s) · forbidden: ${policy.forbidden_patterns.length}`
  );
  console.log(
    `\n⚠ REFINE allowed/forbidden before dispatch, then: brain review-diff --workorder ${id}`
  );
}

// ── review-diff: judge the working diff (optionally against a work order) ─────
function cmdReviewDiff(sub) {
  console.log('🧠 Cortex — REVIEW DIFF\n');
  const woIdx = sub.indexOf('--workorder');
  const woId = woIdx >= 0 ? sub[woIdx + 1] : null;

  let failed = 0;
  for (const name of ['protected-paths', 'hardcoded-ports', 'write-lanes']) {
    try {
      run('node', [CHECKS[name][0]]);
      console.log(`✅ ${name}`);
    } catch (e) {
      failed++;
      const out = `${e.stdout || ''}${e.stderr || ''}`.trim().split('\n').slice(-3).join('\n   ');
      console.log(`❌ ${name}\n   ${out}`);
    }
  }
  let files = [];
  try {
    files = run('git', ['diff', '--name-only']).trim().split('\n').filter(Boolean);
  } catch {}
  const suites = new Set();
  files.forEach(f => {
    const m = f.toLowerCase().match(/forge|atlas|dais|dossier/);
    if (m) suites.add(m[0]);
  });
  console.log(
    `\nChanged files: ${files.length}  ·  suites touched: ${[...suites].join(', ') || 'none detected'}`
  );

  // WO-0011 commit-race hardening: staged files are a shared-worktree absorption hazard.
  const stagedNow = stagedFiles();
  if (stagedNow.length) {
    const stagedRisk = evaluateStagedRisk(
      stagedNow,
      woId ? loadWorkOrderPolicy(REPO_ROOT, woId) : null
    );
    console.log(
      `\n⚠ STAGED files present (${stagedRisk.count}) — absorption hazard (observed 2x):`
    );
    stagedNow.slice(0, 10).forEach(f => console.log(`   staged: ${f}`));
    if (stagedRisk.level === 'block') {
      console.log(
        `  ⛔ staged files FORBIDDEN by the work order (${stagedRisk.forbidden.length}) — unstage before proceeding`
      );
      failed++;
    } else {
      console.log(
        '  → commit path-limited immediately or unstage; do not leave staged files unattended.'
      );
    }
  }

  let woVerdict = null;
  if (woId) {
    const policy = loadWorkOrderPolicy(REPO_ROOT, woId);
    if (!policy) {
      console.log(
        `\n⚠ work order ${woId} not found under docs/brain/workorders/active/ — scope not enforced.`
      );
    } else {
      const r = reviewAgainstPolicy(files, policy);
      woVerdict = r.verdict;
      console.log(`\n── against ${woId} "${policy.task}" ──`);
      if (r.forbidden.length) {
        console.log(`  ⛔ FORBIDDEN files touched (${r.forbidden.length}):`);
        r.forbidden.slice(0, 20).forEach(f => console.log(`     ${f}`));
      }
      if (r.outOfScope.length) {
        console.log(`  🔺 outside allowed scope (${r.outOfScope.length}):`);
        r.outOfScope.slice(0, 20).forEach(f => console.log(`     ${f}`));
      }
      if (!r.forbidden.length && !r.outOfScope.length)
        console.log('  ✅ all changed files within work-order scope');
      if (r.verdict === 'BLOCK') failed++;
    }
  } else if (suites.size > 1) {
    console.log(
      `🔺 multi-suite diff (${suites.size}) — verify no cross-lane direct writes; bridge via TerraTrace.`
    );
  }

  const verdict = failed
    ? '⛔ BLOCK — forbidden files or failing checks; fix before commit'
    : woVerdict === 'PROCEED WITH WARNINGS'
      ? '🔺 PROCEED WITH WARNINGS — files outside work-order scope; confirm intentional'
      : suites.size > 1 && !woId
        ? '🔺 Escalate — multi-suite, architect review'
        : '✅ PROCEED';
  console.log(`\nVerdict: ${verdict}`);
  process.exit(failed ? 1 : 0);
}

// ── next: single best next slice (config-driven; P0/P1 drift overrides queue) ─
function cmdNext() {
  const drift = read(join(MEM, 'drift-ledger.md')) || '';
  const sev = openDriftSeverities(drift);
  const p0 = sev.filter(s => s === 'P0').length;
  const p1 = sev.filter(s => s === 'P1').length;
  console.log('🧠 Cortex — NEXT (single best action)');
  console.log('─────────────────────────────────────');
  if (p0 || p1) {
    console.log(
      `⛔ Open ${p0 ? 'P0' : 'P1'} drift overrides the queue — run \`brain today\` and clear it first.`
    );
    process.exit(1);
  }
  let queue;
  try {
    queue = JSON.parse(read(join(REPO_ROOT, 'docs', 'brain', 'canon', 'next-queue.json'))).queue;
  } catch {
    console.log(
      'UNRESOLVED — no next-queue.json and no open P0/P1. Edit docs/brain/canon/next-queue.json.'
    );
    process.exit(1);
  }
  if (!queue?.length) {
    console.log('Queue empty — edit docs/brain/canon/next-queue.json.');
    return;
  }
  const top = queue[0];
  console.log(`Next slice : ${top.title}`);
  console.log(`Risk       : ${top.risk}`);
  console.log(`Why now    : ${top.why_now}`);
  console.log(`Files      : ${top.files.join(' · ')}`);
  console.log(`Stop if    : ${top.stop_conditions.join(' · ')}`);
  console.log(`Proof      : ${top.proof.join(' · ')}`);
  if (queue.length > 1) {
    console.log(`\nWhy not yet:`);
    queue
      .slice(1, 4)
      .forEach(q => console.log(`  - ${q.title}  (${q.risk}) — queued behind the above`));
  }
  console.log(
    `\nThen: brain workorder create "${top.title}"  →  execute  →  brain review-diff  →  brain proof  →  brain commit-plan  →  stop`
  );
}

// ── commit-plan: isolate in-scope files from an unrelated diff ───────────────
function cmdCommitPlan(sub) {
  const woIdx = sub.indexOf('--workorder');
  const woId = woIdx >= 0 ? sub[woIdx + 1] : null;
  let files = [];
  try {
    files = run('git', ['diff', '--name-only']).trim().split('\n').filter(Boolean);
  } catch {}
  // also surface untracked files (new Brain files won't show in `git diff`)
  let untracked = [];
  try {
    untracked = run('git', ['ls-files', '--others', '--exclude-standard'])
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {}
  const all = [...new Set([...files, ...untracked])];

  let include, exclude, message;
  if (woId) {
    const policy = loadWorkOrderPolicy(REPO_ROOT, woId);
    if (!policy) {
      console.log(`⚠ work order ${woId} not found.`);
      return;
    }
    const r = reviewAgainstPolicy(all, policy);
    const bad = new Set([...r.forbidden, ...r.outOfScope]);
    include = all.filter(f => !bad.has(f));
    exclude = all.filter(f => bad.has(f));
    message = `${policy.suite !== 'UNRESOLVED' ? policy.suite.toLowerCase() : 'chore'}: ${policy.task}`;
  } else {
    const fp = GOVERNANCE_FOOTPRINT.map(globToRe);
    include = all.filter(f => fp.some(re => re.test(f)));
    exclude = all.filter(f => !fp.some(re => re.test(f)));
    message = 'governance(brain): <describe this slice>';
  }

  console.log('🧠 Cortex — COMMIT PLAN' + (woId ? ` (${woId})` : ' (Brain governance footprint)'));
  console.log('────────────────────────────');
  console.log(`Suggested message:\n  ${message}\n`);
  console.log(`Include (${include.length}):`);
  include.slice(0, 40).forEach(f => console.log(`  + ${f}`));
  if (include.length > 40) console.log(`  … +${include.length - 40} more`);
  console.log(`\nExclude (${exclude.length})${exclude.length ? ' — NOT part of this slice:' : ''}`);
  exclude.slice(0, 15).forEach(f => console.log(`  - ${f}`));
  if (exclude.length > 15) console.log(`  … +${exclude.length - 15} more`);
  if (exclude.length > include.length) {
    console.log(
      `\n⚠ DIFF RISK: ${exclude.length} files outside this slice (likely unrelated/fleet work).`
    );
    console.log('  Use a PATH-LIMITED commit — do NOT `git add -A`. Suggested:');
  }
  console.log(
    `\n  git add \\\n${include
      .slice(0, 12)
      .map(f => `    ${f}`)
      .join(' \\\n')}${include.length > 12 ? ' \\\n    …' : ''}`
  );
  console.log(`  git commit -m "${message}"`);
  console.log('\n(advisory only — review before staging. No git mutation performed.)');
}

// ── proof: run the proof set + write an evidence bundle ──────────────────────
function cmdProof(sub) {
  const woIdx = sub.indexOf('--workorder');
  const woId = woIdx >= 0 ? sub[woIdx + 1] : null;
  const stamp = new Date().toISOString();
  console.log('🧠 Cortex — PROOF BUNDLE\n');

  const proofs = [
    { name: 'brain check', file: 'node', args: ['scripts/brain/brain.mjs', 'check'] },
    { name: 'wiki --check', file: 'node', args: ['scripts/brain/publish-wiki.mjs', '--check'] },
  ];
  const results = [];
  for (const p of proofs) {
    let pass = true,
      tail = '';
    try {
      tail = run(p.file, p.args).trim().split('\n').slice(-1)[0];
    } catch (e) {
      pass = false;
      tail = `${e.stdout || ''}${e.stderr || ''}`.trim().split('\n').slice(-1)[0];
    }
    results.push({ ...p, pass, tail });
    console.log(`  ${pass ? '✅' : '❌'} ${p.name}`);
  }

  let changed = 0;
  try {
    changed = run('git', ['diff', '--name-only']).trim().split('\n').filter(Boolean).length;
  } catch {}
  const drift = read(join(MEM, 'drift-ledger.md')) || '';
  const sev = openDriftSeverities(drift);
  const risks = `P0=${sev.filter(s => s === 'P0').length} P1=${sev.filter(s => s === 'P1').length} P2=${sev.filter(s => s === 'P2').length} P3=${sev.filter(s => s === 'P3').length}`;
  const allPass = results.every(r => r.pass);

  const id = woId || `slice-${stamp.slice(0, 10)}`;
  const dir = join(REPO_ROOT, 'docs', 'brain', 'evidence');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${id}-proof.md`);
  const body = `# Proof Bundle — ${id}

- Generated: ${stamp}${woId ? `\n- Work order: ${woId}` : ''}

## Commands run
${results.map(r => `- \`${r.name}\` → ${r.pass ? 'PASS' : 'FAIL'}${r.tail ? ` (${r.tail})` : ''}`).join('\n')}

## Negative tests
(record per slice — e.g. drift→fail→restore. See the slice ADR for evidence; \`proof\` runs positive checks.)

## Working tree
- changed (tracked) files: ${changed}
- staged files at proof time: ${stagedFiles().length} (commit-race hazard if > 0 — WO-0011)

## Known risks (open drift)
- ${risks}

## Result
${allPass ? '✅ PASS' : '❌ FAIL — see commands above'}
`;
  writeFileSync(path, body);
  console.log(`\nResult: ${allPass ? '✅ PASS' : '❌ FAIL'}  ·  open drift: ${risks}`);
  console.log(`📝 Evidence: ${path.replace(REPO_ROOT, '.')}`);
  process.exit(allPass ? 0 : 1);
}

// ── contradiction: bounded, honest canon-vs-code scan ───────────────────────
function cmdContradiction() {
  console.log('🧠 Cortex — CONTRADICTION REPORT (bounded; not exhaustive)\n');
  const findings = [];
  // 1) write-lane manifest drift (real, via existing gate)
  try {
    run('node', ['scripts/spec-gates/write-lanes.mjs']);
  } catch {
    findings.push({
      sev: 'P1',
      src: 'TF-052 write-lanes vs tools/registry/terrapilot.tools.json',
      note: 'tool manifest declares reserved/invalid suites (run `brain check write-lanes`). See drift D-004.',
    });
  }
  // 2) reserved name used as code symbol/path (grep)
  for (const term of canon.naming.reserved_suite_names) {
    try {
      const hits = run('git', [
        'grep',
        '-l',
        '-i',
        term,
        '--',
        'backend',
        'frontend/apps',
        'os-platform/core',
      ]).trim();
      if (hits)
        findings.push({
          sev: 'P2',
          src: `TF-052 reserved name "${term}"`,
          note: `appears in: ${hits.split('\n').slice(0, 3).join(', ')}${hits.split('\n').length > 3 ? ' …' : ''}`,
        });
    } catch {
      /* git grep exits 1 when no match — fine */
    }
  }
  if (!findings.length) {
    console.log('✅ No contradictions in the bounded set (write-lanes + reserved-name usage).');
    return;
  }
  findings.forEach(f => console.log(`[${f.sev}] ${f.src}\n   ${f.note}\n`));
  console.log(
    'Promote anything real into docs/brain/memory/drift-ledger.md. Scope: bounded — full canon-vs-code needs Graph reports (D-003).'
  );
}

// ── panic: recovery — stop damage, write incident skeleton ──────────────────
function cmdPanic() {
  console.log('🚑 Cortex — PANIC / RECOVERY\n');
  let stat = '',
    files = [];
  try {
    stat = run('git', ['diff', '--stat']).trim();
  } catch {}
  try {
    files = run('git', ['diff', '--name-only']).trim().split('\n').filter(Boolean);
  } catch {}
  let forbidden = '';
  try {
    forbidden = run('node', ['scripts/brain/check-protected-paths.mjs']);
    console.log('✅ protected-paths: no forbidden-path changes');
  } catch (e) {
    forbidden = `${e.stdout || ''}`;
    console.log(
      '⛔ protected-paths VIOLATION:\n' +
        forbidden
          .trim()
          .split('\n')
          .slice(-10)
          .map(l => '   ' + l)
          .join('\n')
    );
  }
  console.log(`\nChanged files: ${files.length}`);
  console.log(stat ? stat.split('\n').slice(-12).join('\n') : '(no working-tree diff)');
  // write incident skeleton
  const dir = join(MEM, 'incidents');
  const stamp = (read(TODAY) || '').match(/##\s*(\d{4}-\d{2}-\d{2})/)?.[1] || 'undated';
  const path = join(dir, `INCIDENT-${stamp}.md`);
  const body = `# Incident — ${stamp}\n\n## Trigger\n(panic invoked)\n\n## Working-tree diff\n- files changed: ${files.length}\n\n## Forbidden-path changes\n${/❌|⛔/.test(forbidden) ? forbidden.trim() : 'none detected'}\n\n## Immediate action\n- [ ] \`git restore\` any unauthorized forbidden-path files\n- [ ] confirm work-order scope\n\n## Root cause\n(fill in)\n\n## Brain rule added\n(fill in — feed the learning loop)\n\n## Status\nopen\n`;
  try {
    mkdirSync(dir, { recursive: true });
    appendFileSync(path, body);
    console.log(`\n📝 Incident skeleton: ${path.replace(REPO_ROOT, '.')}`);
  } catch (e) {
    console.log(`\n(could not write incident file: ${e.message})`);
  }
  console.log(
    '\nNext: review the diff, restore forbidden paths, fill the incident, add a rule (learning loop).'
  );
}

// Registry of checks. Each wraps an existing/dedicated script (ADR-0005: wrap, don't reinvent).
const CHECKS = {
  naming: ['tools/naming/naming-lint.mjs'],
  'write-lanes': ['scripts/spec-gates/write-lanes.mjs'],
  'protected-paths': ['scripts/brain/check-protected-paths.mjs'],
  'hardcoded-ports': ['scripts/brain/check-hardcoded-ports.mjs'],
  'reserved-staging': ['scripts/brain/check-reserved-staging.mjs'],
  passport: ['scripts/brain/check-agent-passport.mjs'],
};
// `brain check` (no sub) runs the always-on local set. passport is per-task (run explicitly).
const DEFAULT_CHECKS = [
  'naming',
  'write-lanes',
  'protected-paths',
  'hardcoded-ports',
  'reserved-staging',
];

function cmdCheck(sub) {
  console.log('🧠 Brain CHECK — wrapping existing enforcement\n');
  let names,
    extra = [];
  if (sub.length) {
    const name = sub[0];
    if (!CHECKS[name]) {
      console.log(
        `unknown check "${name}". Available: ${Object.keys(CHECKS).join(', ')} (or no arg for the default set)`
      );
      process.exit(2);
    }
    names = [name];
    extra = sub.slice(1); // pass-through args (e.g. a passport file, --staged)
  } else {
    names = DEFAULT_CHECKS;
  }
  let failed = 0;
  for (const name of names) {
    try {
      const out = run('node', [...CHECKS[name], ...extra]);
      const tail = out.trim().split('\n').slice(-1)[0] || '';
      console.log(`✅ ${name}${tail && !tail.startsWith('✅') ? `  (${tail})` : ''}`);
    } catch (e) {
      failed++;
      const out = `${e.stdout || ''}${e.stderr || ''}`.trim().split('\n').slice(-5).join('\n   ');
      console.log(`❌ ${name}\n   ${out}`);
    }
  }
  console.log(`\n${failed ? `❌ ${failed} check(s) failed` : '✅ all checks passed'}`);
  process.exit(failed ? 1 : 0);
}

function cmdPrint(file, label) {
  const md = read(join(MEM, file));
  if (!md) return console.log(`(no ${label} yet at docs/brain/memory/${file})`);
  console.log(md);
}

function cmdDefer() {
  if (!arg) return console.log('usage: brain defer "statewide interoperability"');
  const f = join(MEM, 'deferred.md');
  if (!existsSync(f)) return console.log(`(deferred board missing: docs/brain/memory/deferred.md)`);
  appendFileSync(f, `\n- (parked via CLI) ${arg}`);
  console.log(`Parked in deferred board: "${arg}"`);
  console.log(
    'Reminder: moving it OUT later must become a release gate or work order — never a silent "while I\'m here".'
  );
}

function cmdHelp() {
  console.log(`🧠 TerraFusion Cortex — engineering command brain  (alias: cortex = brain)

 REASON
  brain status                    what is true / what matters now
  brain today                     next best action (ranked over open drift) + do-not list
  brain next                      single best next SLICE (P0/P1 overrides; else docs/brain/canon/next-queue.json)
  brain ask "<question>"          can <suite> write <X>? · who owns <X>? · where does parcel <X> open?
  brain classify "<work>"         layer / suite / RISK (R0-R5) / VERDICT (Proceed…Block) / constraints
  brain what-if "<change>"        foresight: judge a hypothetical before doing it
  brain workorder "<work>"        print a bounded work-order skeleton (stdout)
  brain workorder create "<work>" generate a scoped work-order file under docs/brain/workorders/active/

 ENFORCE
  brain check [name] [args]       naming | write-lanes | protected-paths | hardcoded-ports | passport [file]
  brain review-diff [--workorder WO-NNNN]   judge the working diff (vs a work order's allowed/forbidden) → PROCEED/WARN/BLOCK
  brain commit-plan [--workorder WO-NNNN]   isolate in-scope files from an unrelated diff → include/exclude + message
  brain proof [--workorder WO-NNNN]         run the proof set + write docs/brain/evidence/<id>-proof.md
  brain contradiction             bounded canon-vs-code scan (write-lanes + reserved-name usage)

 JUDGE / RECORD
  brain release                   release confidence % + READY/NOT-READY verdict
  brain wiki [--check]            (re)generate the wiki from canon  ·  --check fails if stale
  brain gates | drift             print release gates / drift ledger
  brain defer "<idea>"            park an idea (anti-expansion valve)
  brain panic                     recovery: diff summary + forbidden-path scan + incident skeleton

Authority: docs/brain/BRAIN_AUTHORITY.md  ·  Canon: docs/brain/canon/*.json  ·  Law: TF-052 + .github/AGENT_ENTRYPOINT.md`);
}

switch (cmd) {
  case 'status':
    cmdStatus();
    break;
  case 'ask':
    cmdAsk();
    break;
  case 'classify':
    cmdClassify(false);
    break;
  case 'workorder':
    rest[0] === 'create' ? cmdWorkorderCreate(rest.slice(1)) : cmdClassify(true);
    break;
  case 'check':
    cmdCheck(rest);
    break;
  case 'today':
    cmdToday();
    break;
  case 'next':
    cmdNext();
    break;
  case 'what-if':
    cmdClassify(false);
    break;
  case 'wiki':
    try {
      run('node', ['scripts/brain/publish-wiki.mjs', ...rest]);
      console.log(rest.includes('--check') ? '✅ wiki current' : '✅ wiki published → wiki/');
    } catch (e) {
      console.log((e.stdout || '') + (e.stderr || ''));
      process.exit(1);
    }
    break;
  case 'review-diff':
    cmdReviewDiff(rest);
    break;
  case 'commit-plan':
    cmdCommitPlan(rest);
    break;
  case 'proof':
    cmdProof(rest);
    break;
  case 'contradiction':
    cmdContradiction();
    break;
  case 'panic':
    cmdPanic();
    break;
  case 'drift':
    cmdPrint('drift-ledger.md', 'drift ledger');
    break;
  case 'release':
    cmdRelease();
    break;
  case 'gates':
    cmdPrint('release-gates.md', 'release gates');
    break;
  case 'defer':
    cmdDefer();
    break;
  default:
    cmdHelp();
}
