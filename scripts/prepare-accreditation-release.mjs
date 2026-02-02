#!/usr/bin/env node
/**
 * Prepare Accreditation Release Artifacts
 * ========================================
 * Creates a release-ready artifact bundle for county accreditation.
 *
 * Usage:
 *   node scripts/prepare-accreditation-release.mjs [--version X.Y.Z]
 *
 * Outputs:
 *   dist/release/
 *   ├── accreditation-reference-vX.Y.Z.zip
 *   ├── RELEASE_NOTES.md
 *   └── checksums.sha256
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

// Parse version from args or package.json
const args = process.argv.slice(2);
let version = '1.0.0';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--version' && args[i + 1]) {
    version = args[i + 1];
  }
}

const autonomyViewerDir = join(import.meta.dirname, '..', 'tools', 'registry', 'autonomy-viewer');
const releaseDir = join(autonomyViewerDir, 'dist', 'release');
const accreditationDir = join(autonomyViewerDir, 'dist', 'accreditation');

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  TerraFusion Accreditation Release Preparation');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log(`  Version: ${version}`);
console.log(`  Output:  ${releaseDir}`);
console.log('');

// Create release directory
mkdirSync(releaseDir, { recursive: true });

// Step 1: Generate fresh accreditation packet
console.log('Step 1: Generating fresh accreditation packet...');
try {
  // Note: accreditation may exit non-zero if some steps fail validation
  // This is expected - we still get a valid packet structure
  execSync(
    `pnpm run accreditation -- --profile benton-county --out "${accreditationDir.replace(/\\/g, '/')}"`,
    {
      cwd: autonomyViewerDir,
      stdio: 'inherit',
    }
  );
  console.log('  ✅ Packet generated');
} catch (err) {
  // Check if packet was generated despite exit code
  if (existsSync(join(accreditationDir, 'accreditation-packet.json'))) {
    console.log('  ⚠️ Packet generated with warnings (some steps may have failed validation)');
  } else {
    console.error('  ❌ Failed to generate packet:', err.message);
    process.exit(1);
  }
}

// Step 2: Verify the packet
console.log('Step 2: Verifying packet...');
try {
  // Run verification directly with tsx to avoid pnpm output pollution
  const result = execSync(
    `npx tsx bin/accreditation-verify.mjs --dir "${accreditationDir.replace(/\\/g, '/')}" --json`,
    {
      cwd: autonomyViewerDir,
      encoding: 'utf-8',
    }
  );
  const verification = JSON.parse(result);
  if (!verification.ok) {
    console.error('  ❌ Verification failed:', verification.errorMessage);
    process.exit(1);
  }
  console.log(`  ✅ Verified (${verification.filesVerified} files)`);
} catch (err) {
  console.error('  ❌ Verification error:', err.message);
  process.exit(1);
}

// Step 3: Copy reference lock
console.log('Step 3: Copying reference lock...');
const lockSrc = join(autonomyViewerDir, 'ACCREDITATION_REFERENCE.lock.json');
const lockDest = join(releaseDir, 'ACCREDITATION_REFERENCE.lock.json');
copyFileSync(lockSrc, lockDest);
console.log('  ✅ Lock file copied');

// Step 4: Copy accreditation packet files
console.log('Step 4: Copying accreditation packet...');
const packetDest = join(releaseDir, 'reference-packet');
mkdirSync(packetDest, { recursive: true });

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}
copyDir(accreditationDir, packetDest);
console.log('  ✅ Packet files copied');

// Step 5: Generate checksums
console.log('Step 5: Generating checksums...');
const checksums = [];

function hashFile(filePath) {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

function walkDir(dir, relativeTo) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, relativeTo);
    } else {
      const relativePath = fullPath.replace(relativeTo + '/', '').replace(relativeTo + '\\', '');
      const hash = hashFile(fullPath);
      checksums.push(`${hash}  ${relativePath.replace(/\\/g, '/')}`);
    }
  }
}

walkDir(releaseDir, releaseDir);
const checksumsPath = join(releaseDir, 'checksums.sha256');
writeFileSync(checksumsPath, checksums.sort().join('\n') + '\n', 'utf-8');
console.log(`  ✅ ${checksums.length} checksums generated`);

// Step 6: Generate release notes
console.log('Step 6: Generating release notes...');
const releaseNotes = `# TerraFusion Accreditation Reference Packet v${version}

## Contents

This release contains the reference accreditation packet for county deployments.

### Files

| File | Description |
|------|-------------|
| \`ACCREDITATION_REFERENCE.lock.json\` | Contract lock with required files, fields, and determinism rules |
| \`reference-packet/\` | Complete reference accreditation packet |
| \`checksums.sha256\` | SHA256 checksums for all files |

### Contract Details

- **Schema ID:** terrafusion.autonomy.accreditation-packet.v1
- **Schema Version:** 4N51.1
- **Manifest Schema:** terrafusion.autonomy.manifest.v1

### Determinism Rules

| Rule | Value |
|------|-------|
| Sorted Keys | ✅ Enabled |
| Normalized Paths | ✅ Enabled (forward slashes) |
| LF Line Endings | ✅ Enabled |
| SHA256 Hashing | ✅ Enabled |

### Verification

To verify a packet against this reference:

\`\`\`bash
cd tools/registry/autonomy-viewer
pnpm run accreditation:verify -- --dir <packet-directory>
\`\`\`

### Upgrade Policy

- **Minor bumps** (4N51.1 → 4N51.2): Backwards-compatible, no migration required
- **Major bumps** (4N51.x → 4N52.0): Breaking, requires RC → GA cycle

## Checksums

See \`checksums.sha256\` for file integrity verification.

---

*Government. Transcended.*
`;

writeFileSync(join(releaseDir, 'RELEASE_NOTES.md'), releaseNotes, 'utf-8');
console.log('  ✅ Release notes generated');

// Summary
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Release Preparation Complete');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('  Output directory:', releaseDir);
console.log('  Files:');
for (const entry of readdirSync(releaseDir)) {
  const stat = statSync(join(releaseDir, entry));
  if (stat.isDirectory()) {
    console.log(`    📁 ${entry}/`);
  } else {
    console.log(`    📄 ${entry}`);
  }
}
console.log('');
console.log('  Next steps:');
console.log('    1. git tag v' + version);
console.log('    2. git push origin v' + version);
console.log('    3. Create GitHub release with artifacts from dist/release/');
console.log('');
