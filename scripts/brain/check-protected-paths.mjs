#!/usr/bin/env node
/**
 * Brain check: protected paths.
 *
 * Pre-flights the forbidden-path rules (docs/brain/rules/protected-paths.json) against a changed-file
 * set, BEFORE commit — so bypass is caught locally, not at PR time. SEAL (governance-fast) remains the
 * authority in CI; this mirrors it for fast local feedback.
 *
 *   node scripts/brain/check-protected-paths.mjs [--staged] [file ...]
 *
 * Default file set: staged files (git diff --cached) if any, else working-tree changes (git diff).
 * Exit 0 = clean, 1 = violation.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { REPO_ROOT } from './canon.mjs';

const rules = JSON.parse(
  readFileSync(join(REPO_ROOT, 'docs', 'brain', 'rules', 'protected-paths.json'), 'utf8')
);

// minimal glob -> RegExp (supports ** and *)
function globToRe(glob) {
  const re = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '<<GLOBSTAR>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<GLOBSTAR>>/g, '.*');
  return new RegExp('^' + re + '$');
}

function changedFiles(argv) {
  const explicit = argv.filter(a => !a.startsWith('--'));
  if (explicit.length) return explicit;
  const staged = argv.includes('--staged');
  try {
    const args = staged ? ['diff', '--cached', '--name-only'] : ['diff', '--name-only'];
    const out = execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    if (out) return out.split('\n');
    // fall back to staged if working tree empty
    const s = execFileSync('git', ['diff', '--cached', '--name-only'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim();
    return s ? s.split('\n') : [];
  } catch {
    return [];
  }
}

const files = changedFiles(process.argv.slice(2));
const forbidden = rules.forbidden.map(f => ({ ...f, re: globToRe(f.glob) }));
const violations = [];

for (const f of files) {
  for (const rule of forbidden) {
    if (rule.re.test(f)) violations.push({ file: f, rule: rule.glob, reason: rule.reason });
  }
}

if (!files.length) {
  console.log('protected-paths: no changed files to check');
  process.exit(0);
}
if (violations.length) {
  console.log(
    `❌ protected-paths: ${violations.length} violation(s) in ${files.length} changed file(s)`
  );
  for (const v of violations.slice(0, 20)) console.log(`   ${v.file}  [${v.rule}] — ${v.reason}`);
  process.exit(1);
}
console.log(`✅ protected-paths: ${files.length} changed file(s), no forbidden paths touched`);
process.exit(0);
