#!/usr/bin/env node
/**
 * Threat Model Gate — Phase 5.2 CI Enforcement
 *
 * Validates that the STRIDE threat model exists, contains all required
 * structural sections, has no unresolved TODOs, and that every STRIDE
 * category in the mapping table has at least one ENFORCED test.
 *
 * Usage: node tools/gates/threatmodel-gate.mjs
 * Exit:  0 = pass, 1 = fail
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const THREAT_MODEL = join(REPO_ROOT, 'docs', 'security', 'threat-model.md');

// ─── Required headings ──────────────────────────────────────────────
const REQUIRED_HEADINGS = [
  '# TerraFusion Security Threat Model',
  '## System Overview',
  '## Assets',
  '## Trust Boundaries',
  '## STRIDE Threat Analysis',
  '### S — Spoofing Identity',
  '### T — Tampering with Data',
  '### R — Repudiation',
  '### I — Information Disclosure',
  '### D — Denial of Service',
  '### E — Elevation of Privilege',
  '## Threat-to-Mitigation-to-Test Mapping',
  '## Coverage Summary',
];

// ─── STRIDE categories that must have at least one ENFORCED row ─────
const STRIDE_SECTIONS = [
  { label: 'Spoofing', heading: '### Spoofing Mitigations' },
  { label: 'Tampering', heading: '### Tampering Mitigations' },
  { label: 'Repudiation', heading: '### Repudiation Mitigations' },
  { label: 'Information Disclosure', heading: '### Information Disclosure Mitigations' },
  { label: 'Denial of Service', heading: '### Denial of Service Mitigations' },
  { label: 'Elevation of Privilege', heading: '### Elevation of Privilege Mitigations' },
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

console.log('🛡️  Threat Model Gate — Phase 5.2 Structural Validation\n');

// 1. File existence
console.log('▶ File existence');
if (!existsSync(THREAT_MODEL)) {
  fail('File not found: docs/security/threat-model.md');
  console.error('\n❌ Threat model gate FAILED — file missing');
  process.exit(1);
}
pass('docs/security/threat-model.md exists');

const content = readFileSync(THREAT_MODEL, 'utf8');

// 2. Required headings
console.log('\n▶ Required headings');
for (const heading of REQUIRED_HEADINGS) {
  if (content.includes(heading)) {
    pass(`Found: "${heading}"`);
  } else {
    fail(`Missing heading: "${heading}"`);
  }
}

// 3. No TODO placeholders
console.log('\n▶ TODO check');
const todoMatches = content.match(/\bTODO\b/gi);
if (todoMatches && todoMatches.length > 0) {
  fail(`Found ${todoMatches.length} TODO placeholder(s)`);
} else {
  pass('No TODO placeholders');
}

// 4. Every STRIDE category has at least one ENFORCED test in mapping
console.log('\n▶ STRIDE coverage (each category must have ENFORCED tests)');
for (const { label, heading } of STRIDE_SECTIONS) {
  const sectionIdx = content.indexOf(heading);
  if (sectionIdx === -1) {
    fail(`Missing mapping section: "${heading}"`);
    continue;
  }

  // Extract section content (from heading to next ### or ## heading)
  const afterHeading = content.slice(sectionIdx + heading.length);
  const nextHeadingMatch = afterHeading.match(/\n#{2,3} /);
  const sectionContent = nextHeadingMatch
    ? afterHeading.slice(0, nextHeadingMatch.index)
    : afterHeading;

  const enforcedCount = (sectionContent.match(/ENFORCED/g) || []).length;
  if (enforcedCount > 0) {
    pass(`${label}: ${enforcedCount} ENFORCED mitigation(s)`);
  } else {
    fail(`${label}: no ENFORCED mitigations found — breaker test coverage required`);
  }
}

// 5. Coverage summary table exists and reports numbers
console.log('\n▶ Coverage summary');
const coverageMatch = content.match(/\*\*Total\*\*\s*\|\s*\*\*(\d+)\*\*/);
if (coverageMatch) {
  pass(`Coverage summary reports ${coverageMatch[1]} total threats`);
} else {
  fail('Coverage summary table missing or malformed (expected **Total** row with threat count)');
}

// ─── Summary ────────────────────────────────────────────────────────
console.log('');
if (failures > 0) {
  console.error(`❌ Threat model gate FAILED — ${failures} issue(s) found`);
  process.exit(1);
} else {
  console.log('✅ Threat model gate PASSED — STRIDE coverage verified');
  process.exit(0);
}
