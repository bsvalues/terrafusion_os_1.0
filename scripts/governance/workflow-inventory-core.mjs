/**
 * Workflow Inventory — core classification and snapshot logic.
 *
 * Pure functions with zero external dependencies.
 * I/O-performing callers (CLI, tests) import these.
 *
 * Classification rules (from CI_WORKFLOW_LIFECYCLE_POLICY.md):
 *
 *   REQUIRED       — file is in REQUIRED_WORKFLOW_FILES set
 *   SCHEDULED      — has `schedule:` trigger (takes priority over push for non-required)
 *   PUSH-OPTIONAL  — has `push:` (or `pull_request:`) but not required + not scheduled
 *   MANUAL         — only `workflow_dispatch:`
 *   DEPRECATED     — no triggers at all
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// ─── Required workflow files ────────────────────────────────────────────────
// These produce the 5 required status checks in branch protection:
//   seal-gate-fast.yml        → 🔒 TerraFusion Seal Gate, 🔒 SEAL
//   core-governance-gates.yml → governed-spine, phase85-tools, phase86-toolrunner
//   tier1-ui-harness.yml      → 🧪 Tier-1 UI Harness Validation
export const REQUIRED_WORKFLOW_FILES = new Set([
  'seal-gate-fast.yml',
  'core-governance-gates.yml',
  'tier1-ui-harness.yml',
]);

// ─── Trigger parsing ────────────────────────────────────────────────────────

/**
 * Parse the `on:` triggers from a workflow YAML string.
 * Returns { push, pull_request, schedule, workflow_dispatch } booleans.
 *
 * Uses simple regex — no YAML parser needed for trigger detection.
 */
export function parseTriggers(yamlContent) {
  return {
    push: /^\s+push:/m.test(yamlContent),
    pull_request: /^\s+pull_request/m.test(yamlContent),
    schedule: /^\s+schedule:/m.test(yamlContent),
    workflow_dispatch: /^\s+workflow_dispatch/m.test(yamlContent),
  };
}

// ─── Classification ─────────────────────────────────────────────────────────

/**
 * Classify a workflow file into one of 5 lifecycle classes.
 *
 * @param {string} filename - Workflow filename (e.g. 'seal-gate-fast.yml')
 * @param {{ push: boolean, pull_request: boolean, schedule: boolean, workflow_dispatch: boolean }} triggers
 * @returns {'REQUIRED'|'PUSH-OPTIONAL'|'SCHEDULED'|'MANUAL'|'DEPRECATED'}
 */
export function classifyWorkflow(filename, triggers) {
  // 1. Required — file is in the required set (regardless of triggers)
  if (REQUIRED_WORKFLOW_FILES.has(filename)) return 'REQUIRED';

  // 2. No triggers → deprecated
  const hasTrigger =
    triggers.push || triggers.pull_request || triggers.schedule || triggers.workflow_dispatch;
  if (!hasTrigger) return 'DEPRECATED';

  // 3. Schedule → SCHEDULED (takes priority over push for non-required)
  if (triggers.schedule) return 'SCHEDULED';

  // 4. Push or PR → PUSH-OPTIONAL
  if (triggers.push || triggers.pull_request) return 'PUSH-OPTIONAL';

  // 5. Only workflow_dispatch → MANUAL
  return 'MANUAL';
}

// ─── Inventory building ─────────────────────────────────────────────────────

/**
 * Build a full inventory from the repo's tracked workflow files.
 *
 * @param {string} repoRoot - Absolute path to the repo root
 * @returns {{ total: number, classes: Record<string, string[]> }}
 */
export function buildInventory(repoRoot) {
  // Enumerate via git (not filesystem)
  const gitOutput = execSync('git ls-tree --name-only HEAD .github/workflows/', {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  const files = gitOutput
    .trim()
    .split('\n')
    .map(f => f.replace('.github/workflows/', ''))
    .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
    .sort();

  const classes = {
    REQUIRED: [],
    'PUSH-OPTIONAL': [],
    SCHEDULED: [],
    MANUAL: [],
    DEPRECATED: [],
  };

  for (const file of files) {
    const content = readFileSync(join(repoRoot, '.github', 'workflows', file), 'utf8');
    const triggers = parseTriggers(content);
    const cls = classifyWorkflow(file, triggers);
    classes[cls].push(file);
  }

  // Sort within each class for determinism
  for (const cls of Object.keys(classes)) {
    classes[cls].sort();
  }

  return { total: files.length, classes };
}

// ─── Snapshot formatting ────────────────────────────────────────────────────

const SNAPSHOT_BEGIN = '<!-- INVENTORY-SNAPSHOT-BEGIN -->';
const SNAPSHOT_END = '<!-- INVENTORY-SNAPSHOT-END -->';

/**
 * Format an inventory as a deterministic markdown snapshot block.
 * No timestamps, no dates — pure function of the input.
 *
 * @param {{ total: number, classes: Record<string, string[]> }} inventory
 * @returns {string}
 */
export function formatSnapshotBlock(inventory) {
  const lines = [];

  // Summary table
  lines.push('| Class | Count |');
  lines.push('|-------|-------|');
  for (const cls of ['REQUIRED', 'PUSH-OPTIONAL', 'SCHEDULED', 'MANUAL', 'DEPRECATED']) {
    const count = inventory.classes[cls]?.length ?? 0;
    lines.push(`| ${cls} | ${count} |`);
  }
  lines.push(`| **Total** | ${inventory.total} |`);
  lines.push('');

  // Per-class file lists (sorted for determinism)
  for (const cls of ['REQUIRED', 'PUSH-OPTIONAL', 'SCHEDULED', 'MANUAL', 'DEPRECATED']) {
    const files = [...(inventory.classes[cls] ?? [])].sort();
    lines.push(`**${cls}** (${files.length}):`);
    if (files.length === 0) {
      lines.push('- _(none)_');
    } else {
      for (const f of files) {
        lines.push(`- \`${f}\``);
      }
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

// ─── Snapshot extraction and comparison ─────────────────────────────────────

/**
 * Extract the snapshot block content between the sentinel markers.
 * Returns null if markers are missing or incomplete.
 *
 * @param {string} docContent - Full markdown document
 * @returns {string|null}
 */
export function extractSnapshotBlock(docContent) {
  const beginIdx = docContent.indexOf(SNAPSHOT_BEGIN);
  if (beginIdx === -1) return null;

  const endIdx = docContent.indexOf(SNAPSHOT_END, beginIdx);
  if (endIdx === -1) return null;

  const start = beginIdx + SNAPSHOT_BEGIN.length;
  return docContent.slice(start, endIdx).trim();
}

/**
 * Compare two snapshot strings for semantic equality.
 * Normalizes trailing whitespace per line.
 *
 * @param {string} a
 * @param {string} b
 * @returns {{ match: boolean }}
 */
export function compareSnapshots(a, b) {
  const normalize = s =>
    s
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .trim();

  return { match: normalize(a) === normalize(b) };
}

/**
 * Replace the snapshot block in a document with new content.
 * Preserves everything before BEGIN and after END markers.
 *
 * @param {string} docContent - Full markdown document
 * @param {string} newSnapshot - New snapshot content (without markers)
 * @returns {string} Updated document
 */
export function replaceSnapshotBlock(docContent, newSnapshot) {
  const beginIdx = docContent.indexOf(SNAPSHOT_BEGIN);
  const endIdx = docContent.indexOf(SNAPSHOT_END);

  if (beginIdx === -1 || endIdx === -1) {
    throw new Error('Snapshot markers not found in document');
  }

  const before = docContent.slice(0, beginIdx + SNAPSHOT_BEGIN.length);
  const after = docContent.slice(endIdx);

  return `${before}\n${newSnapshot}\n${after}`;
}

export { SNAPSHOT_BEGIN, SNAPSHOT_END };

/**
 * Check whether the snapshot sentinel markers are present in a document.
 *
 * @param {string} docContent
 * @returns {boolean}
 */
export function hasSnapshotMarkers(docContent) {
  return docContent.includes(SNAPSHOT_BEGIN) && docContent.includes(SNAPSHOT_END);
}
