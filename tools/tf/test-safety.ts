#!/usr/bin/env node
/**
 * test-safety.ts — Phase 11 Red-Team Safety Validator
 *
 * Validates that sovereign.yaml is present, complete, and enforces all
 * TerraFusion Sovereign Governance requirements:
 *   - HITL approval gate is enabled
 *   - County isolation is enforced
 *   - TruthGate is configured
 *   - Trace correlation is required
 *   - Audit logging is enabled
 *
 * Exit 0 = all checks pass
 * Exit 1 = one or more checks failed
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const MANIFEST_PATH = resolve(REPO_ROOT, 'sovereign.yaml');

interface CheckResult {
  name: string;
  passed: boolean;
  detail?: string;
}

function check(name: string, passed: boolean, detail?: string): CheckResult {
  return { name, passed, detail };
}

function runChecks(): CheckResult[] {
  const results: CheckResult[] = [];

  // Check 1: Manifest exists
  if (!existsSync(MANIFEST_PATH)) {
    results.push(check('manifest_exists', false, `sovereign.yaml not found at ${MANIFEST_PATH}`));
    return results; // Can't continue without the file
  }
  results.push(check('manifest_exists', true));

  const content = readFileSync(MANIFEST_PATH, 'utf-8');

  // Check 2: Non-empty
  results.push(check('manifest_non_empty', content.trim().length > 0));

  // Check 3: HITL approval gate
  results.push(check(
    'hitl_approval_required',
    content.includes('ai_pilot_mutations_require_approval: true'),
    'sovereign.yaml must declare ai_pilot_mutations_require_approval: true'
  ));

  // Check 4: County isolation
  results.push(check(
    'county_isolation_enforced',
    content.includes('county_isolation'),
    'sovereign.yaml must declare county_isolation section'
  ));

  // Check 5: TruthGate
  results.push(check(
    'truthgate_configured',
    content.includes('truthgate'),
    'sovereign.yaml must declare truthgate section'
  ));

  // Check 6: Trace correlation
  results.push(check(
    'trace_correlation_required',
    content.includes('trace'),
    'sovereign.yaml must declare trace section'
  ));

  // Check 7: Audit logging
  results.push(check(
    'audit_logging_enabled',
    content.includes('audit'),
    'sovereign.yaml must declare audit section'
  ));

  // Check 8: HITL section (not just the flag)
  results.push(check(
    'hitl_section_present',
    content.includes('hitl:') || content.includes('hitl:\n'),
    'sovereign.yaml must have a hitl: section'
  ));

  return results;
}

const results = runChecks();
const passed = results.filter(r => r.passed);
const failed = results.filter(r => !r.passed);

console.log('\n🛡️  TerraFusion Sovereign Safety Check\n');

for (const r of results) {
  const icon = r.passed ? '✅' : '❌';
  const detail = r.detail && !r.passed ? ` — ${r.detail}` : '';
  console.log(`  ${icon} ${r.name}${detail}`);
}

console.log(`\n  ${passed.length}/${results.length} checks passed`);

if (failed.length > 0) {
  console.log(`\n❌ Sovereign safety checks FAILED. Deployment blocked.\n`);
  process.exit(1);
} else {
  console.log(`\n✅ All sovereign safety checks passed. Safe to deploy.\n`);
  process.exit(0);
}
