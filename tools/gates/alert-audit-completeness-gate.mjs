#!/usr/bin/env node
/**
 * TerraFusion OS — Alert Audit Completeness Gate
 * 
 * CI/CD gate that enforces Alert #001-100 audit completeness for Validation Criterion #4.
 * 
 * Gate fails if:
 * - Any of Alerts #001-100 missing
 * - Sequential gaps detected (cherry-picking)
 * - Evidence files incomplete
 * - FP rate ≥25%
 * 
 * @classification Government Operations — CI/CD Gate
 */

import { spawnSync } from 'child_process';

console.log('🚦 Alert Audit Completeness Gate — Validation Criterion #4\n');
console.log('Policy: 100 sequential alerts, FP rate <25%\n');

// Run verification script
const result = spawnSync('node', ['scripts/verify-alert-audit-completeness.mjs'], {
  stdio: 'inherit',
  shell: true
});

if (result.status === 0) {
  console.log('\n✅ Alert Audit Completeness Gate PASSED\n');
  process.exit(0);
} else {
  console.log('\n❌ Alert Audit Completeness Gate FAILED\n');
  console.log('Fix errors above, then re-run gate.\n');
  process.exit(1);
}
