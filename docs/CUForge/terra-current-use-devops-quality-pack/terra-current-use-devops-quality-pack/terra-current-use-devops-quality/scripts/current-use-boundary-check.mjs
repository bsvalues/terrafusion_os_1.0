import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? 'src/modules/terra-current-use';

const forbidden = [
  'APPROVE_CLASSIFICATION',
  'DENY_CLASSIFICATION',
  'FINALIZE_REMOVAL',
  'OVERRIDE_ROLLBACK_CALCULATION',
  'WAIVE_PENALTY',
  'DETERMINE_STATUTORY_EXCEPTION',
  'ISSUE_FINAL_NOTICE_WITHOUT_HUMAN_REVIEW',
];

function walk(dir) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (/\.(ts|tsx|cs|md)$/.test(path)) checkFile(path);
  }
}

function checkFile(path) {
  const text = readFileSync(path, 'utf8');
  for (const item of forbidden) {
    if (text.includes(item) && !path.includes('Guardrails') && !path.includes('README')) {
      console.error(`Forbidden action string ${item} found in ${path}`);
      process.exitCode = 1;
    }
  }
}

walk(root);

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log('Current Use boundary check passed.');
