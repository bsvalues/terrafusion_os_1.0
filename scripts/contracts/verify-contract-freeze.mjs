#!/usr/bin/env node
// contract-compat: verify the WO-SR-002 shared-contract freeze.
// Dependency-light (Node built-ins only). Exits non-zero on any violation.
//
// Checks:
//   1. every file in every frozen group exists under the Abstractions root
//   2. every group version is valid SemVer
//   3. no os_internal_excluded file appears in any frozen group (impl details are not suite contracts)
//   4. no file is frozen twice (single ownership)
//   5. os_internal_excluded / deferred files, if they exist, are NOT in the frozen set
//
// This proves the frozen surface is real and disjoint from OS-internal detail.
// It does NOT (yet) validate suite repos — those don't exist; consumer-side redefinition
// checks activate per-suite post-creation (phase-2 tighten).

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const freezePath = join(repoRoot, 'backend/src/TerraFusion.Abstractions/contracts.freeze.json');

const errors = [];
const ok = [];
const SEMVER = /^\d+\.\d+\.\d+$/;

if (!existsSync(freezePath)) {
  console.error(`FAIL: freeze manifest missing: ${freezePath}`);
  process.exit(1);
}

const freeze = JSON.parse(readFileSync(freezePath, 'utf8'));
const root = join(repoRoot, freeze.root);
const excluded = new Set(freeze.os_internal_excluded || []);
const seen = new Map();

for (const g of freeze.frozen || []) {
  if (!SEMVER.test(g.version || '')) errors.push(`group ${g.group}: bad version "${g.version}"`);
  if (!Array.isArray(g.consumers) || g.consumers.length === 0) errors.push(`group ${g.group}: no consumers`);
  for (const f of g.files || []) {
    // (1) file exists
    if (existsSync(join(root, f))) ok.push(`${g.group}@${g.version}  ${f}`);
    else errors.push(`group ${g.group}: frozen file missing on disk: ${f}`);
    // (3) not an OS-internal detail
    if (excluded.has(f)) errors.push(`group ${g.group}: OS-internal file frozen as suite contract: ${f}`);
    // (4) single ownership
    if (seen.has(f)) errors.push(`file frozen in two groups (${seen.get(f)} + ${g.group}): ${f}`);
    else seen.set(f, g.group);
  }
}

// (5) excluded/deferred must not be frozen
for (const f of [...(freeze.os_internal_excluded || []), ...(freeze.deferred || [])]) {
  if (seen.has(f)) errors.push(`excluded/deferred file is frozen: ${f}`);
}

// (6) planned_promotion: spec frozen, source DTOs exist OUTSIDE Abstractions (repo-relative), pending promotion
const groups = new Set(freeze.frozen?.map((g) => g.group) || []);
for (const g of freeze.planned_promotion || []) {
  if (!SEMVER.test(g.version || '')) errors.push(`planned ${g.group}: bad version "${g.version}"`);
  if (groups.has(g.group)) errors.push(`planned ${g.group}: collides with a frozen group`);
  groups.add(g.group);
  for (const f of g.source_files || []) {
    if (existsSync(join(repoRoot, f))) ok.push(`${g.group}@${g.version} (planned)  ${f}`);
    else errors.push(`planned ${g.group}: source DTO missing: ${f}`);
    // planned source must NOT already be a frozen Abstractions file
    if (existsSync(join(root, f.replace(/^backend\/src\/TerraFusion\.Abstractions\//, '')))
        && f.includes('Abstractions')) errors.push(`planned ${g.group}: already in Abstractions (should be frozen, not planned): ${f}`);
  }
}

// (7) spec_declared: forward spec — must NOT reference concrete frozen files or invent them; needs a source_of_record
for (const g of freeze.spec_declared || []) {
  if (!SEMVER.test(g.version || '')) errors.push(`spec ${g.group}: bad version "${g.version}"`);
  if (groups.has(g.group)) errors.push(`spec ${g.group}: collides with an existing group`);
  groups.add(g.group);
  if (!g.source_of_record) errors.push(`spec ${g.group}: missing source_of_record (forward spec must cite ratification)`);
  if (g.source_files || g.files) errors.push(`spec ${g.group}: must not list concrete files (DTOs not yet materialized)`);
}

console.log(`contract-compat: ${freeze.frozen?.length || 0} frozen groups, ${ok.length} files verified, ` +
  `${excluded.size} OS-internal excluded, ${(freeze.deferred || []).length} deferred, ` +
  `${(freeze.planned_promotion || []).length} planned-promotion, ${(freeze.spec_declared || []).length} spec-declared.`);

if (errors.length) {
  console.error('\ncontract-compat: FAIL');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('contract-compat: PASS');
