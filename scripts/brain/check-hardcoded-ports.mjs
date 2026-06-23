#!/usr/bin/env node
/**
 * Brain check: hardcoded ports (AGENT_ENTRYPOINT "ZERO TOLERANCE").
 *
 * Scans changed source files for hardcoded deprecated ports (localhost:3000 / :5000, etc.) that
 * should be env-driven (TF_FRONTEND_PORT / TF_API_PORT).
 *
 *   node scripts/brain/check-hardcoded-ports.mjs [--staged] [file ...]
 *
 * Exit 0 = clean, 1 = violation. Only scans source-ish files; skips docs/json/lock/this script.
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { REPO_ROOT } from './canon.mjs';

const BANNED = [/localhost:3000\b/, /localhost:5000\b/, /:3000\b(?![0-9])/, /:5000\b(?![0-9])/];
const ENV_DRIVEN = /(process\.env|import\.meta\.env|TF_FRONTEND_PORT|TF_API_PORT|:-3102|:-5046)/;
const SCAN_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|cs|json|yml|yaml|env)$/i;
const SKIP =
  /(node_modules|\/dist\/|\/bin\/|\/obj\/|pnpm-lock|package-lock|\.min\.|docs\/|scripts\/brain\/check-hardcoded-ports)/;

function changedFiles(argv) {
  const explicit = argv.filter(a => !a.startsWith('--'));
  if (explicit.length) return explicit;
  const staged = argv.includes('--staged');
  try {
    const args = staged ? ['diff', '--cached', '--name-only'] : ['diff', '--name-only'];
    const out = execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    if (out) return out.split('\n');
    const s = execFileSync('git', ['diff', '--cached', '--name-only'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim();
    return s ? s.split('\n') : [];
  } catch {
    return [];
  }
}

const files = changedFiles(process.argv.slice(2)).filter(f => SCAN_EXT.test(f) && !SKIP.test(f));
const hits = [];
for (const f of files) {
  const abs = join(REPO_ROOT, f);
  if (!existsSync(abs) || statSync(abs).isDirectory()) continue;
  const lines = readFileSync(abs, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (BANNED.some(re => re.test(line)) && !ENV_DRIVEN.test(line)) {
      hits.push({ file: f, line: i + 1, text: line.trim().slice(0, 100) });
    }
  });
}

if (!files.length) {
  console.log('hardcoded-ports: no scannable changed files');
  process.exit(0);
}
if (hits.length) {
  console.log(`❌ hardcoded-ports: ${hits.length} hit(s) — use TF_FRONTEND_PORT / TF_API_PORT`);
  for (const h of hits.slice(0, 20)) console.log(`   ${h.file}:${h.line}  ${h.text}`);
  process.exit(1);
}
console.log(`✅ hardcoded-ports: ${files.length} file(s) scanned, none hardcoded`);
process.exit(0);
