#!/usr/bin/env node
/**
 * Runbooks Gate — Phase 5.3 CI Enforcement
 *
 * Validates that all required security runbooks exist and contain
 * the required structural headings. Fails CI if any runbook is
 * missing, structurally incomplete, or contains TODO placeholders
 * in mandatory sections.
 *
 * Usage: node tools/gates/runbooks-gate.mjs
 * Exit:  0 = pass, 1 = fail
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const RUNBOOK_DIR = join(REPO_ROOT, 'docs', 'security', 'runbooks');

// ─── Required files and their mandatory headings ────────────────────
const REQUIRED = [
  {
    file: 'key-rotation.md',
    label: 'Planned Key Rotation Runbook',
    headings: [
      '# Key Rotation Runbook',
      '## Prerequisites',
      '## Key Ring Schema',
      '## Rotation Procedure',
      '## Verification',
      '## Rollback',
      '## Post-Rotation Cleanup',
      '## Evidence Capture',
    ],
  },
  {
    file: 'key-compromise-response.md',
    label: 'Key Compromise Response Runbook',
    headings: [
      '# Key Compromise Response',
      '## Triggers',
      '## Immediate Actions',
      '## Emergency Rotation Procedure',
      '## Containment',
      '## Evidence & Follow-up',
    ],
  },
  {
    file: 'key-material-handling.md',
    label: 'Key Material Handling Runbook',
    headings: [
      '# Key Material Handling',
      '## Generation',
      '## Storage',
      '## Rotation Rules',
      '## Environment Separation',
    ],
  },
  {
    file: 'templates/key-rotation-checklist.md',
    label: 'Key Rotation Checklist Template',
    headings: ['# Key Rotation Checklist'],
  },
];

// ─── Gate logic ─────────────────────────────────────────────────────
let failures = 0;

function fail(msg) {
  console.error(`  ❌ ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`  ✅ ${msg}`);
}

console.log('🔒 Runbooks Gate — Phase 5.3 Structural Validation\n');

for (const spec of REQUIRED) {
  const filePath = join(RUNBOOK_DIR, spec.file);
  console.log(`▶ ${spec.label} (${spec.file})`);

  // 1. File existence
  if (!existsSync(filePath)) {
    fail(`File not found: docs/security/runbooks/${spec.file}`);
    continue;
  }

  const content = readFileSync(filePath, 'utf8');

  // 2. Required headings
  for (const heading of spec.headings) {
    // Match heading at start of line (markdown heading)
    // Allow flexible spacing: "# " or "## " etc.
    const pattern = heading.replace(/^(#+) /, (_, hashes) => `${hashes} `);
    if (!content.includes(pattern)) {
      fail(`Missing heading: "${heading}" in ${spec.file}`);
    } else {
      pass(`Found: "${heading}"`);
    }
  }

  // 3. No TODO placeholders in mandatory sections
  const todoMatches = content.match(/\bTODO\b/gi);
  if (todoMatches && todoMatches.length > 0) {
    fail(`Found ${todoMatches.length} TODO placeholder(s) in ${spec.file}`);
  } else {
    pass(`No TODO placeholders`);
  }
}

// ─── Summary ────────────────────────────────────────────────────────
console.log('');
if (failures > 0) {
  console.error(`❌ Runbooks gate FAILED — ${failures} issue(s) found`);
  process.exit(1);
} else {
  console.log(`✅ Runbooks gate PASSED — all ${REQUIRED.length} runbooks validated`);
  process.exit(0);
}
