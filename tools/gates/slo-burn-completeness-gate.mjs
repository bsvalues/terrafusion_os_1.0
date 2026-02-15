#!/usr/bin/env node
/**
 * TerraFusion OS — SLO Burn Completeness Gate
 *
 * CI/CD gate that enforces 7-day SLO burn completeness for Validation Criterion #3.
 *
 * Gate fails if:
 * - Any of Days 1-7 missing evidence files
 * - SLO log entries not filled with actual data
 * - 7-day average burn ≥25%
 *
 * @classification Government Operations — CI/CD Gate
 */

import { spawnSync } from 'child_process';

console.log('🚦 SLO Burn Completeness Gate — Validation Criterion #3\n');
console.log('Policy: 7 consecutive days, <25% average burn\n');

// Run verification script
const result = spawnSync('node', ['scripts/verify-slo-burn-completeness.mjs'], {
  stdio: 'inherit',
  shell: true,
});

if (result.status === 0) {
  console.log('\n✅ SLO Burn Completeness Gate PASSED\n');
  process.exit(0);
} else {
  console.log('\n❌ SLO Burn Completeness Gate FAILED\n');
  console.log('Fix errors above, then re-run gate.\n');
  process.exit(1);
}
