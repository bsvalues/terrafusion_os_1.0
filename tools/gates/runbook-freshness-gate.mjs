#!/usr/bin/env node
/**
 * Runbook Freshness Gate — Validation Period Enforcement
 *
 * Enforces: "Paging alert runbooks must be reviewed regularly."
 *
 * Policy: Every critical (paging) alert must reference a runbook with
 * a "Last Reviewed" or "Last Updated" date within the freshness window
 * (default: 90 days). Prevents stale runbook drift during production operations.
 *
 * Validates:
 *   - docs/ops/alerts.md exists
 *   - Critical alerts have runbook references
 *   - Runbook files exist in docs/ops/runbooks/
 *   - Runbook files have recent review dates
 *
 * Usage: node tools/gates/runbook-freshness-gate.mjs [--days=90]
 * Exit:  0 = all pass, 1 = any failure
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const ALERTS_DOC = join(REPO_ROOT, 'docs', 'ops', 'alerts.md');
const RUNBOOKS_DIR = join(REPO_ROOT, 'docs', 'ops', 'runbooks');

// ─── Freshness window (days) ────────────────────────────────────────
const args = process.argv.slice(2);
const daysArg = args.find(a => a.startsWith('--days='));
const FRESHNESS_DAYS = daysArg ? parseInt(daysArg.split('=')[1], 10) : 90;

// ─── Critical alerts that require fresh runbooks ────────────────────
const CRITICAL_ALERTS = [
  'TerraFusionAPIDown',
  'TerraFusionConsciousnessDown',
  'TerraFusionGatewayDown',
  'VeryHighAPIResponseTime',
  'VeryHighAPIErrorRate',
  'AuditLogIngestionFailure',
  'CountyDataIsolationBreachAttempt',
];

// ─── Gate Runner ────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function rule(ok, label) {
  if (ok) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

console.log('📚 Runbook Freshness Gate — Validation Period\n');
console.log(`Policy: Paging alert runbooks must be reviewed within ${FRESHNESS_DAYS} days.\n`);

// ─── Rule 1: Alerts documentation exists ────────────────────────────
console.log('── 1. Alert Documentation ──');
rule(existsSync(ALERTS_DOC), 'docs/ops/alerts.md exists');

if (!existsSync(ALERTS_DOC)) {
  console.log('\n❌ Runbook Freshness Gate FAILED — alerts.md not found\n');
  process.exit(1);
}

const alertsContent = readFileSync(ALERTS_DOC, 'utf-8');

// ─── Rule 2: Runbooks directory exists ──────────────────────────────
console.log('\n── 2. Runbooks Infrastructure ──');
rule(existsSync(RUNBOOKS_DIR), 'docs/ops/runbooks/ exists');

if (!existsSync(RUNBOOKS_DIR)) {
  console.log('\n❌ Runbook Freshness Gate FAILED — runbooks/ directory not found\n');
  process.exit(1);
}

// ─── Rule 3: Extract runbook references from alerts.md ─────────────
console.log('\n── 3. Critical Alert Runbook References ──');

// Parse alerts.md table to extract runbook references
// Format: | AlertName | ... | [slug](runbooks/slug.md) | OR | AlertName | ... | slug |
const alertRunbooks = new Map();

for (const alert of CRITICAL_ALERTS) {
  // Try markdown link format first: [text](runbooks/slug.md)
  const linkPattern = new RegExp(`${alert}.*?\\[([^\\]]+)\\]\\(runbooks/([^)]+)\\.md\\)`, 'i');
  let match = alertsContent.match(linkPattern);

  if (match) {
    const runbookSlug = match[2];
    alertRunbooks.set(alert, runbookSlug);
    rule(true, `${alert} references runbook: ${runbookSlug}`);
  } else {
    // Try plain text format: | alert | ... | slug |
    const plainPattern = new RegExp(
      `${alert}.*?\\|.*?\\|.*?\\|.*?\\|.*?\\|.*?([a-z][a-z0-9-]+)\\s*\\|?`,
      'i'
    );
    match = alertsContent.match(plainPattern);

    if (match) {
      const runbookSlug = match[1].trim();
      alertRunbooks.set(alert, runbookSlug);
      rule(true, `${alert} references runbook: ${runbookSlug}`);
    } else {
      rule(false, `${alert} has runbook reference`);
    }
  }
}

// ─── Rule 4: Runbook files exist on disk ───────────────────────────
console.log('\n── 4. Runbook File Existence ──');

const runbookFiles = new Map(); // slug -> file path
const runbooksOnDisk = readdirSync(RUNBOOKS_DIR).filter(f => f.endsWith('.md'));

for (const file of runbooksOnDisk) {
  const slug = file.replace('.md', '');
  runbookFiles.set(slug, join(RUNBOOKS_DIR, file));
}

for (const [alert, slug] of alertRunbooks) {
  const exists = runbookFiles.has(slug);
  rule(exists, `runbook ${slug}.md exists`);
}

// ─── Rule 5: Runbook freshness (review date within window) ─────────
console.log('\n── 5. Runbook Freshness (Last Reviewed ≤ ${FRESHNESS_DAYS} days) ──');

const now = Date.now();
const freshnessMs = FRESHNESS_DAYS * 24 * 60 * 60 * 1000;

for (const [alert, slug] of alertRunbooks) {
  const filePath = runbookFiles.get(slug);

  if (!filePath) {
    continue; // Already failed existence check
  }

  const content = readFileSync(filePath, 'utf-8');

  // Look for "Last Reviewed" or "Last Updated" date patterns
  const datePatterns = [
    /Last Reviewed.*?(\d{4}-\d{2}-\d{2})/i,
    /Last Updated.*?(\d{4}-\d{2}-\d{2})/i,
    /Updated.*?(\d{4}-\d{2}-\d{2})/i,
  ];

  let reviewDate = null;
  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      reviewDate = new Date(match[1]);
      break;
    }
  }

  if (reviewDate) {
    const ageMs = now - reviewDate.getTime();
    const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
    const isFresh = ageMs <= freshnessMs;

    rule(isFresh, `${slug}.md reviewed ${ageDays} days ago (≤${FRESHNESS_DAYS})`);
  } else {
    rule(false, `${slug}.md has "Last Reviewed" or "Last Updated" date`);
  }
}

// ─── Summary ────────────────────────────────────────────────────────
console.log(`\nRunbook Freshness Gate: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All paging alert runbooks are fresh and accessible.\n');
} else {
  console.log('❌ Some runbooks are stale or missing.\n');
  console.log(`Action: Review runbooks in docs/ops/runbooks/ and update "Last Reviewed" dates.\n`);
}

process.exit(failed > 0 ? 1 : 0);
