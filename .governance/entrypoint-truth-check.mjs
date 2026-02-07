#!/usr/bin/env node
/**
 * AGENT ENTRYPOINT TRUTH CHECK
 * ============================
 * Mechanically verifies that the entrypoint policy matches filesystem reality.
 * Run in CI to prevent drift between policy and actual structure.
 *
 * Exit codes:
 *   0 - All checks pass
 *   1 - Truth violation detected
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ENTRYPOINT_PATH = path.join(ROOT, '.github', 'AGENT_ENTRYPOINT.md');

const results = {
  passed: [],
  failed: [],
};

const fileHashes = {};

function check(name, condition, message) {
  if (condition) {
    results.passed.push({ name, message: `✅ ${name}` });
  } else {
    results.failed.push({ name, message: `❌ ${name}: ${message}` });
  }
}

function pathExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function entrypointContains(text) {
  const content = fs.readFileSync(ENTRYPOINT_PATH, 'utf-8');
  return content.includes(text);
}

function entrypointDoesNotContain(text) {
  const content = fs.readFileSync(ENTRYPOINT_PATH, 'utf-8');
  return !content.includes(text);
}

function hashFile(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  const content = fs.readFileSync(fullPath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

// ============================================================================
// TAMPER-EVIDENT SNAPSHOT: Hash critical governance files
// ============================================================================

const CRITICAL_FILES = [
  '.github/AGENT_ENTRYPOINT.md',
  '.governance/workflow/README.md',
  '.governance/workflow/discovery.md',
  '.governance/workflow/plan.md',
  '.governance/mesh/MESH_GOVERNANCE.md',
];

for (const file of CRITICAL_FILES) {
  const hash = hashFile(file);
  if (hash) {
    fileHashes[file] = hash;
  }
}

// ============================================================================
// TRUTH CHECK 1: Allowed paths must exist
// ============================================================================

check(
  'Lane B: os-shell exists',
  pathExists('frontend/apps/os-shell'),
  'frontend/apps/os-shell does not exist but is listed as ALLOWED'
);

check(
  'Lane B: packages exists',
  pathExists('frontend/packages'),
  'frontend/packages does not exist but is listed as ALLOWED'
);

check(
  'Lane A: core/pilot exists',
  pathExists('os-platform/core/pilot'),
  'os-platform/core/pilot does not exist but is listed as ALLOWED'
);

check(
  'Lane A: tools/registry exists',
  pathExists('tools/registry'),
  'tools/registry does not exist but is listed as ALLOWED'
);

check(
  'Workflow docs exist',
  pathExists('.governance/workflow'),
  '.governance/workflow does not exist but is listed as ALLOWED'
);

check(
  'Mesh docs exist',
  pathExists('.governance/mesh'),
  '.governance/mesh does not exist but is listed as ALLOWED'
);

// ============================================================================
// TRUTH CHECK 2: Forbidden paths correctly scoped (not too broad)
// ============================================================================

check(
  'FORBIDDEN is not overly broad',
  entrypointDoesNotContain('❌ frontend/** '),
  'Entrypoint still contains "frontend/**" as forbidden (too broad, blocks os-shell)'
);

check(
  'FORBIDDEN targets legacy root specifically',
  entrypointContains('frontend/src/**'),
  'Entrypoint must specifically forbid frontend/src/** (legacy root)'
);

// ============================================================================
// TRUTH CHECK 3: Lane B explicitly allows os-shell
// ============================================================================

check(
  'Lane B allows os-shell',
  entrypointContains('frontend/apps/os-shell/**'),
  'Entrypoint must explicitly allow frontend/apps/os-shell/**'
);

check(
  'Lane B marked as ACTIVE UI',
  entrypointContains('ACTIVE UI SURFACE'),
  'Entrypoint must mark os-shell as ACTIVE UI SURFACE'
);

// ============================================================================
// TRUTH CHECK 4: Workflow governance references exist
// ============================================================================

check(
  'References workflow README',
  entrypointContains('.governance/workflow/README.md'),
  'Entrypoint must reference workflow README'
);

check(
  'References mesh governance',
  entrypointContains('.governance/mesh/MESH_GOVERNANCE.md'),
  'Entrypoint must reference mesh governance'
);

// ============================================================================
// TRUTH CHECK 5: Solo-dev mode defined
// ============================================================================

check(
  'Solo-dev mode documented',
  entrypointContains('TF_SOLO_DEV=1'),
  'Entrypoint must document TF_SOLO_DEV=1 mode'
);

// ============================================================================
// TRUTH CHECK 6: Workflow triggers are deterministic
// ============================================================================

check(
  'Workflow triggers defined',
  entrypointContains('Non-Trivial Change Triggers'),
  'Entrypoint must define non-trivial change triggers'
);

check(
  'OS Shell trigger path specified',
  entrypointContains('frontend/apps/os-shell/src/**'),
  'Entrypoint must specify os-shell/src as workflow trigger'
);

// ============================================================================
// OUTPUT
// ============================================================================

console.log('\n🔒 AGENT ENTRYPOINT TRUTH CHECK');
console.log('================================\n');

for (const r of results.passed) {
  console.log(r.message);
}

for (const r of results.failed) {
  console.log(r.message);
}

console.log(`\n📊 Results: ${results.passed.length} passed, ${results.failed.length} failed\n`);

// Output tamper-evident snapshot
console.log('🔐 GOVERNANCE FILE HASHES (tamper-evident snapshot)');
console.log('────────────────────────────────────────────────────');
for (const [file, hash] of Object.entries(fileHashes)) {
  console.log(`  ${hash}  ${file}`);
}
console.log('');

if (results.failed.length > 0) {
  console.log('❌ TRUTH CHECK FAILED\n');
  console.log('The entrypoint policy does not match filesystem reality.');
  console.log('Fix the entrypoint or update the filesystem to match.\n');
  process.exit(1);
} else {
  console.log('✅ TRUTH CHECK PASSED\n');
  console.log('Entrypoint policy is consistent with filesystem.\n');
  process.exit(0);
}
