#!/usr/bin/env node
/**
 * Brain check: agent passport. "No passport, no commit" (when enforcement is enabled).
 *
 *   node scripts/brain/check-agent-passport.mjs <passport.json>
 *   node scripts/brain/check-agent-passport.mjs            # validates all docs/brain/passports/*.agent-passport.json
 *
 * Validates a passport against passport.schema.json (required fields + enums + patterns, zero-dep)
 * AND cross-checks integrity: referenced work order exists; allowed_files non-empty; risk routing
 * (R2+ requires a work order). Exit 0 = valid, 1 = invalid.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { REPO_ROOT } from './canon.mjs';

const SCHEMA = JSON.parse(
  readFileSync(join(REPO_ROOT, 'docs', 'brain', 'passports', 'passport.schema.json'), 'utf8')
);

function validateAgainstSchema(p) {
  const errs = [];
  for (const field of SCHEMA.required) {
    if (
      p[field] === undefined ||
      p[field] === null ||
      (Array.isArray(p[field]) && p[field].length === 0) ||
      (typeof p[field] === 'string' && p[field].trim() === '')
    ) {
      errs.push(`missing/empty required field: ${field}`);
    }
  }
  for (const [field, def] of Object.entries(SCHEMA.properties)) {
    const v = p[field];
    if (v === undefined) continue;
    if (def.enum && !def.enum.includes(v))
      errs.push(`${field}="${v}" not in [${def.enum.join('|')}]`);
    if (def.pattern && typeof v === 'string' && !new RegExp(def.pattern).test(v))
      errs.push(`${field}="${v}" fails pattern ${def.pattern}`);
    if (def.minLength && typeof v === 'string' && v.trim().length < def.minLength)
      errs.push(`${field} needs >= ${def.minLength} chars`);
    if (def.minItems && Array.isArray(v) && v.length < def.minItems)
      errs.push(`${field} needs >= ${def.minItems} items`);
  }
  return errs;
}

function crossCheck(p) {
  const errs = [];
  // work order must exist
  if (p.work_order) {
    const workOrderAbs = resolve(REPO_ROOT, p.work_order);
    const workOrderRoot = resolve(REPO_ROOT, 'docs', 'brain', 'workorders') + sep;
    if (!workOrderAbs.startsWith(workOrderRoot)) {
      errs.push(`work_order must be under docs/brain/workorders/: ${p.work_order}`);
    } else if (!existsSync(workOrderAbs)) {
      errs.push(`work_order not found: ${p.work_order}`);
    }
  }
  // risk routing: R2+ requires a real work order reference
  if (['R2', 'R3', 'R4', 'R5'].includes(p.risk) && !p.work_order) {
    errs.push(`risk ${p.risk} requires a work_order (risk-levels.json)`);
  }
  // placeholder hashes are not acceptable for ready/approved passports
  if (['ready_for_review', 'approved', 'applied'].includes(p.status)) {
    if (/REPLACE_WITH/.test(p.entrypoint_hash || '') || !p.entrypoint_hash)
      errs.push('entrypoint_hash missing/placeholder for a non-draft passport');
    if (/REPLACE_WITH/.test(p.graphify_report_hash || ''))
      errs.push('graphify_report_hash is still a placeholder');
  }
  return errs;
}

function check(file) {
  let p;
  try {
    p = JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    console.log(`❌ ${file}: parse error — ${e.message}`);
    return false;
  }
  const errs = [...validateAgainstSchema(p), ...crossCheck(p)];
  if (errs.length) {
    console.log(`❌ ${file} (${p.task_id || 'no task_id'})`);
    errs.forEach(e => console.log(`   - ${e}`));
    return false;
  }
  console.log(
    `✅ ${file} — ${p.task_id} (${p.agent}/${p.mode}, risk ${p.risk}, suite ${p.affected_suite})`
  );
  return true;
}

const arg = process.argv[2];
let targets;
if (arg) {
  targets = [arg];
} else {
  const dir = join(REPO_ROOT, 'docs', 'brain', 'passports');
  targets = existsSync(dir)
    ? readdirSync(dir)
        .filter(f => f.endsWith('.agent-passport.json') && !f.startsWith('TEMPLATE'))
        .map(f => join(dir, f))
    : [];
  if (!targets.length) {
    console.log(
      'passport: no non-template passports to validate (docs/brain/passports/*.agent-passport.json)'
    );
    process.exit(0);
  }
}

const ok = targets.map(check).every(Boolean);
process.exit(ok ? 0 : 1);
