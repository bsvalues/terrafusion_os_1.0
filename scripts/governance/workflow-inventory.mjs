#!/usr/bin/env node
/**
 * Workflow Inventory — CLI.
 *
 * Verifies or updates the inventory snapshot in CI_WORKFLOW_LIFECYCLE_POLICY.md.
 *
 * Usage:
 *   node scripts/governance/workflow-inventory.mjs --check   # Verify (CI default)
 *   node scripts/governance/workflow-inventory.mjs --write   # Update snapshot
 *   node scripts/governance/workflow-inventory.mjs --json    # Dump inventory as JSON
 *
 * Environment:
 *   UPDATE_WORKFLOW_INVENTORY=1  — same as --write
 *
 * Zero dependencies — Node built-ins only.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { argv, env, exit } from 'node:process';

import {
  buildInventory,
  compareSnapshots,
  extractSnapshotBlock,
  formatSnapshotBlock,
  hasSnapshotMarkers,
  replaceSnapshotBlock,
} from './workflow-inventory-core.mjs';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..');
const POLICY_PATH = join(REPO_ROOT, 'docs', 'governance', 'CI_WORKFLOW_LIFECYCLE_POLICY.md');

// ─── Parse args ─────────────────────────────────────────────────────────────

const args = argv.slice(2);
const mode =
  args.includes('--write') || env.UPDATE_WORKFLOW_INVENTORY === '1'
    ? 'write'
    : args.includes('--json')
      ? 'json'
      : 'check'; // default

// ─── Build inventory ────────────────────────────────────────────────────────

const inventory = buildInventory(REPO_ROOT);

// ─── JSON mode ──────────────────────────────────────────────────────────────

if (mode === 'json') {
  console.log(JSON.stringify(inventory, null, 2));
  exit(0);
}

// ─── Compute snapshot ───────────────────────────────────────────────────────

const computed = formatSnapshotBlock(inventory);

// ─── Write mode ─────────────────────────────────────────────────────────────

if (mode === 'write') {
  const doc = readFileSync(POLICY_PATH, 'utf8');
  const markersExist = hasSnapshotMarkers(doc);
  const existing = extractSnapshotBlock(doc);

  if (existing) {
    const { match } = compareSnapshots(existing, computed);
    if (match) {
      console.log('✅ Snapshot already up to date — no changes needed');
      exit(0);
    }
  }

  const updated = markersExist
    ? replaceSnapshotBlock(doc, computed)
    : injectSnapshotBlock(doc, computed);

  writeFileSync(POLICY_PATH, updated, 'utf8');
  console.log('✅ Snapshot updated in CI_WORKFLOW_LIFECYCLE_POLICY.md');
  printSummary(inventory);
  exit(0);
}

// ─── Check mode (default) ───────────────────────────────────────────────────

const doc = readFileSync(POLICY_PATH, 'utf8');

if (!hasSnapshotMarkers(doc)) {
  console.error('❌ No snapshot markers found in CI_WORKFLOW_LIFECYCLE_POLICY.md');
  console.error('   Run with --write to create the initial snapshot.');
  exit(1);
}

const existing = extractSnapshotBlock(doc);
const { match } = compareSnapshots(existing || '', computed);

if (match) {
  console.log('✅ Workflow inventory snapshot matches');
  printSummary(inventory);
  exit(0);
} else {
  console.error('❌ Workflow inventory snapshot MISMATCH');
  console.error('');
  console.error('Computed inventory:');
  console.error(computed);
  console.error('');
  console.error('To update: node scripts/governance/workflow-inventory.mjs --write');
  exit(1);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function printSummary(inv) {
  console.log(`   Total: ${inv.total} workflows`);
  for (const cls of ['REQUIRED', 'PUSH-OPTIONAL', 'SCHEDULED', 'MANUAL', 'DEPRECATED']) {
    console.log(`   ${cls}: ${inv.classes[cls].length}`);
  }
}

/**
 * Inject snapshot markers + content before the "## Verification Commands" section.
 * Fallback if markers don't exist yet.
 */
function injectSnapshotBlock(docContent, snapshot) {
  // Try to insert before "## Verification Commands" or append before final ---
  const insertBefore = '## Verification Commands';
  const idx = docContent.indexOf(insertBefore);

  const block = [
    '',
    '<!-- INVENTORY-SNAPSHOT-BEGIN -->',
    snapshot,
    '<!-- INVENTORY-SNAPSHOT-END -->',
    '',
  ].join('\n');

  if (idx !== -1) {
    return docContent.slice(0, idx) + block + '\n' + docContent.slice(idx);
  }

  // Fallback: append before last ---
  return docContent.trimEnd() + '\n\n' + block + '\n';
}
