#!/usr/bin/env node
/**
 * warningsGate.mjs - Warning count governance gate
 *
 * Policy: ZERO_TOLERANCE
 * - PASS if warning count === 0
 * - FAIL if warning count > 0
 *
 * Usage:
 *   node scripts/governance/warningsGate.mjs
 *   node scripts/governance/warningsGate.mjs --backend-only
 *   node scripts/governance/warningsGate.mjs --frontend-only
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const POLICY = 'zero-tolerance';
const POLICY_NOTE = 'Zero warnings allowed. Any warning fails the gate.';

function runCommand(cmd, cwd = ROOT) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e) {
    return e.stdout || e.stderr || '';
  }
}

function countBackendWarnings() {
  console.log('📦 Checking backend warnings...');
  const output = runCommand(
    'dotnet build TerraFusion.sln -c Release -v:minimal',
    join(ROOT, 'backend')
  );
  const matches = output.match(/(\d+)\s+Warning\(s\)/i);
  return matches ? parseInt(matches[1], 10) : 0;
}

function countFrontendWarnings() {
  console.log('🎨 Checking frontend warnings...');
  // ESLint warnings
  const lintOutput = runCommand('pnpm run lint 2>&1', ROOT);
  const lintWarnings = (lintOutput.match(/warning/gi) || []).length;

  // TypeScript warnings (tsc --noEmit)
  const tscOutput = runCommand('pnpm run type-check 2>&1', ROOT);
  const tscWarnings = (tscOutput.match(/warning/gi) || []).length;

  return lintWarnings + tscWarnings;
}

function main() {
  const args = process.argv.slice(2);
  const backendOnly = args.includes('--backend-only');
  const frontendOnly = args.includes('--frontend-only');

  console.log('🛡️  TerraFusion Warning Gate');
  console.log(`📋 Policy: ${POLICY}`);
  console.log('');

  let backendWarnings = 0;
  let frontendWarnings = 0;

  if (!frontendOnly) {
    backendWarnings = countBackendWarnings();
    console.log(`   Backend warnings: ${backendWarnings}`);
  }

  if (!backendOnly) {
    frontendWarnings = countFrontendWarnings();
    console.log(`   Frontend warnings: ${frontendWarnings}`);
  }

  const totalWarnings = backendWarnings + frontendWarnings;
  const status = totalWarnings === 0 ? 'PASS' : 'FAIL';

  console.log('');
  console.log(`📊 Total warnings: ${totalWarnings}`);
  console.log(`🎯 Status: ${status}`);

  const snapshot = {
    timestamp: new Date().toISOString(),
    policy: POLICY,
    policyNote: POLICY_NOTE,
    metrics: {
      backend: backendWarnings,
      frontend: frontendWarnings,
      total: totalWarnings,
    },
    status,
  };

  // Write snapshot
  const snapshotPath = join(__dirname, 'warnings-snapshot.json');
  writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`💾 Snapshot written to ${snapshotPath}`);

  if (status === 'FAIL') {
    console.error('');
    console.error('❌ Warning gate FAILED - fix all warnings before merging');
    process.exit(1);
  }

  console.log('');
  console.log('✅ Warning gate PASSED');
  process.exit(0);
}

main();
