/**
 * Work-order engine (Brain v0.3 — agent containment). Pure functions, testable without side effects.
 *
 * `brain workorder create "<task>"` generates a scoped work-order packet (md + embedded machine policy).
 * `brain review-diff --workorder WO-NNNN` enforces a changed-file set against that policy.
 *
 * Doctrine: no agent prompt without a work order; no agent output accepted without review-diff.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { canon } from './canon.mjs';

export const WO_DIR = ['docs', 'brain', 'workorders', 'active'];

// Always-forbidden (protected paths + constitution). Mirrors reserved-staging/protected-paths + TF-052.
export const BASE_FORBIDDEN = [
  '**/ARCHIVE/**',
  'specialized/**',
  'applications/**',
  'os-platform/ai-systems/ai-systems/ai-swarm/**',
  'frontend/src/**',
  'frontend/components/**',
  'docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md',
];

// minimal glob → RegExp (supports ** and *)
export function globToRe(glob) {
  const re = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '<<GLOBSTAR>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<GLOBSTAR>>/g, '.*');
  return new RegExp('^' + re + '$');
}

/** Next WO number by scanning existing active work-order filenames. */
export function nextWoNumber(repoRoot) {
  const dir = join(repoRoot, ...WO_DIR);
  let max = 0;
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      const m = f.match(/WO-(\d+)/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
  }
  return max + 1;
}

export function slugify(task) {
  return String(task)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/**
 * Derive a scoped policy from a classification. allowed = suite-scoped hints (human refines);
 * forbidden = BASE_FORBIDDEN + every OTHER active suite's obvious paths.
 */
export function derivePolicy(woId, task, classified) {
  const suite = classified.suite || 'UNRESOLVED';
  const suiteKey = Object.keys(canon.suites.active).find(
    k => canon.suites.active[k].display === suite
  );
  const allowed = [];
  if (suiteKey) {
    allowed.push(`backend/src/TerraFusion.*/**/*${cap(suiteKey)}*`);
    allowed.push(`frontend/apps/os-shell/src/**/*${cap(suiteKey)}*`);
  }
  // governance/docs are generally allowed to be updated by any WO (memory, ADRs, wiki)
  allowed.push('docs/brain/memory/**', 'docs/brain/canon/**', 'wiki/**');

  const otherSuites = Object.keys(canon.suites.active).filter(k => k !== suiteKey);
  const forbidden = [
    ...BASE_FORBIDDEN,
    ...otherSuites.map(k => `backend/src/TerraFusion.*/**/*${cap(k)}*`),
  ];
  return {
    id: woId,
    task,
    risk: classified.riskLevel || 'R2',
    suite,
    allowed_files: allowed,
    forbidden_patterns: forbidden,
    required_proof: ['pnpm brain check', `pnpm brain review-diff --workorder ${woId}`],
  };
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/** Render the human-readable work-order markdown with an embedded machine-policy json block. */
export function renderWorkOrder(policy, classified) {
  return `# ${policy.id} — ${policy.task}

- **Risk:** ${policy.risk} · **Suite:** ${policy.suite} · **Agent:** ${suggestAgent(policy.risk)}
- **Surface:** ${classified.surface || '—'}

## Allowed files
${policy.allowed_files.map(f => `- \`${f}\``).join('\n')}

## Forbidden files
${policy.forbidden_patterns.map(f => `- \`${f}\``).join('\n')}

## Required proof
${policy.required_proof.map(p => `- \`${p}\``).join('\n')}

## Stop conditions
- another suite must be changed · shell routing must change · owner unclear
- a forbidden file must be touched · proof cannot be produced

## Acceptance criteria
- [ ] only allowed files touched (\`brain review-diff --workorder ${policy.id}\` = PROCEED)
- [ ] required proof passes
- [ ] memory updated (drift/release-gates/ADR as needed)

> REFINE the allowed/forbidden lists before dispatch — these are canon-derived defaults, not final scope.

<!-- brain-machine-policy: brain review-diff reads the json block below -->
\`\`\`json
${JSON.stringify(policy, null, 2)}
\`\`\`
`;
}
function suggestAgent(risk) {
  return (
    {
      R0: 'Graph/Docs',
      R1: 'Docs/QA',
      R2: 'Builder',
      R3: 'Builder+Reviewer',
      R4: 'Architect',
      R5: 'Human only',
    }[risk] || 'Builder'
  );
}

/** Extract the machine policy from a work-order markdown file's json block. */
export function parsePolicy(mdText) {
  const m = mdText.match(/```json\s*([\s\S]*?)```/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/** Find a work-order file by id (WO-NNNN) and return its parsed policy. */
export function loadWorkOrderPolicy(repoRoot, woId) {
  const dir = join(repoRoot, ...WO_DIR);
  if (!existsSync(dir)) return null;
  const file = readdirSync(dir).find(f => f.startsWith(woId) || f.includes(`${woId}-`));
  if (!file) return null;
  return parsePolicy(readFileSync(join(dir, file), 'utf8'));
}

/**
 * Staged-file risk (commit-race hardening, WO-0011). Staged-but-uncommitted files in a SHARED
 * worktree get silently absorbed by whichever agent commits next (observed twice: fleet commits
 * 1e75e628c and a3fcb143b swallowed staged Brain files). Pure: callers pass the staged list.
 *
 * Returns { level: 'none'|'warn'|'block', forbidden, outOfScope, count }:
 *  - no staged files               → none
 *  - staged files, no policy       → warn (unattended staged state is itself the hazard)
 *  - staged forbidden by policy    → block
 *  - staged outside policy allowed → warn
 *  - staged all within policy      → warn (still flagged: commit immediately or unstage)
 */
export function evaluateStagedRisk(stagedFiles, policy) {
  const count = stagedFiles.length;
  if (count === 0) return { level: 'none', forbidden: [], outOfScope: [], count };
  if (!policy) return { level: 'warn', forbidden: [], outOfScope: stagedFiles, count };
  const r = reviewAgainstPolicy(stagedFiles, policy);
  if (r.forbidden.length)
    return { level: 'block', forbidden: r.forbidden, outOfScope: r.outOfScope, count };
  return { level: 'warn', forbidden: [], outOfScope: r.outOfScope, count };
}

/** Enforce a changed-file set against a policy. Returns {verdict, forbidden, outOfScope}. */
export function reviewAgainstPolicy(changedFiles, policy) {
  const fb = policy.forbidden_patterns.map(globToRe);
  const al = policy.allowed_files.map(globToRe);
  const forbidden = [];
  const outOfScope = [];
  for (const f of changedFiles) {
    if (fb.some(re => re.test(f))) {
      forbidden.push(f);
      continue;
    }
    if (al.length && !al.some(re => re.test(f))) outOfScope.push(f);
  }
  const verdict = forbidden.length
    ? 'BLOCK'
    : outOfScope.length
      ? 'PROCEED WITH WARNINGS'
      : 'PROCEED';
  return { verdict, forbidden, outOfScope };
}
