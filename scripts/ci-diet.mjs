#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// CI Diet: Remove pull_request triggers from non-constitutional workflows
// ═══════════════════════════════════════════════════════════════════════════
// This script is a ONE-SHOT tool. Run it, verify the diffs, delete it.
//
// What it does:
//   1. Reads each target workflow YAML
//   2. Removes the `pull_request:` trigger block
//   3. If no `push:` trigger exists, adds `push: branches: [main]`
//   4. Writes back
//
// What it preserves:
//   - All other triggers (push, schedule, workflow_dispatch, etc.)
//   - Comments, formatting, jobs, steps, etc.
//
// Usage: node scripts/ci-diet.mjs [--dry-run]
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const WORKFLOWS = join(ROOT, '.github', 'workflows');
const DRY_RUN = process.argv.includes('--dry-run');

// Workflows to diet (remove pull_request trigger)
const targets = [
  // Wave 1 (original 20)
  'accessibility-audit.yml',
  'ai-swarm-safety.yml',
  'atlas-validation.yml',
  'baseline-guard.yml',
  'deps-fast-lane.yml',
  'designctl.yml',
  'e2e-smoke.yml',
  'golden-corpus-compat.yml',
  'governance-proof.yml',
  'manifest-contract-guard.yml',
  'markdown-lint.yml',
  'performance-budget.yml',
  'performance-regression.yml',
  'rust-verify.yml',
  'scope-drift-guard.yml',
  'tag-lint.yml',
  'test.yml',
  'visual-regression.yml',
  'wave1-freeze-guard.yml',
  'yaml-sanity.yml',
  // Wave 2 (push-signal workflows that also had PR triggers)
  'accessibility.yml',
  'accreditation-compat.yml',
  'benton.yml',
  'build-validation.yml',
  'ci-cd-main.yml',
  'ci-cd-pipeline.yml',
  'ci-cd.yml',
  'ci-verified.yml',
  'ci.yml',
  'code-intel.yml',
  'county-kit-parity.yml',
  'gate-pipeline.yml',
  'governance-audit.yml',
  'gpt-rag.yml',
  'grfe-ci.yaml',
  'infrastructure-cicd.yml',
  'kubernetes-infrastructure-ci.yml',
  'observability-ci.yml',
  'opa-policy-tests.yml',
  'release-validation.yml',
  'rust-security-gates.yml',
  'security-compliance-ci.yml',
  'security-compliance.yml',
  'spec-gates.yml',
  'terra-levy-tests.yml',
  'terraforge-ci.yml',
  'terrafusion-ci-cd-production.yml',
  'terrafusion-gate-enforcement.yml',
  'terrafusion-pipeline.yml',
  'testing.yml',
  'tfctl-ci.yml',
  'tier1-ui-harness.yml',
];

let modified = 0;
let skipped = 0;

for (const file of targets) {
  const path = join(WORKFLOWS, file);
  let content;
  try {
    content = readFileSync(path, 'utf8');
  } catch {
    console.log(`⚠️  ${file}: not found, skipping`);
    skipped++;
    continue;
  }

  // Check it actually has pull_request
  if (!/^\s*pull_request\s*:/m.test(content)) {
    console.log(`⏭️  ${file}: no pull_request trigger, skipping`);
    skipped++;
    continue;
  }

  const lines = content.split('\n');
  const result = [];
  let inOnBlock = false;
  let inPullRequest = false;
  let prBlockIndent = 0;
  let hasPush = /^\s*push\s*:/m.test(content);
  let onBlockIndent = 0;
  let removedPR = false;
  let needsPush = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect `on:` top-level key
    if (/^on\s*:/.test(line)) {
      inOnBlock = true;
      onBlockIndent = 0;
      result.push(line);
      continue;
    }

    // Detect end of `on:` block (next top-level key like `permissions:`, `env:`, `jobs:`, `concurrency:`, `name:`)
    if (inOnBlock && /^[a-zA-Z]/.test(line) && !/^\s/.test(line)) {
      inOnBlock = false;
      inPullRequest = false;

      // If we removed PR and no push exists, inject push before this line
      if (removedPR && !hasPush) {
        result.push(`  push:`);
        result.push(`    branches: [main]`);
        needsPush = false;
      }
    }

    if (inOnBlock) {
      // Detect `  pull_request:` or `  pull_request_review:`
      const prMatch = line.match(/^(\s*)pull_request\s*:/);
      if (prMatch && !/pull_request_target|pull_request_review/.test(line)) {
        inPullRequest = true;
        prBlockIndent = prMatch[1].length;
        removedPR = true;
        // Skip this line (remove it)
        continue;
      }

      // If we're inside the pull_request block, skip sub-lines
      if (inPullRequest) {
        // Check if this line is still indented deeper than the pull_request key
        const lineIndent = line.match(/^(\s*)/)[1].length;
        if (line.trim() === '' || lineIndent > prBlockIndent) {
          // Still inside PR block, skip
          continue;
        }
        // We've exited the PR block
        inPullRequest = false;
      }
    }

    result.push(line);
  }

  // Handle edge case: on block was at end of file
  if (removedPR && !hasPush) {
    // Find the on: block and insert push after it
    // Already handled above in the "end of on block" detection
  }

  const newContent = result.join('\n');

  if (newContent === content) {
    console.log(`⏭️  ${file}: no changes needed`);
    skipped++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`🔍 ${file}: would modify (dry run)`);
  } else {
    writeFileSync(path, newContent, 'utf8');
    console.log(`✅ ${file}: pull_request trigger removed${!hasPush ? ' + push:main added' : ''}`);
  }
  modified++;
}

console.log(`\nDone: ${modified} modified, ${skipped} skipped${DRY_RUN ? ' (DRY RUN)' : ''}`);
