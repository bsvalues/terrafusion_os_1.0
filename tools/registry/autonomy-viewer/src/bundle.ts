/**
 * Phase 4N3 — Autonomy Evidence Bundle CLI
 *
 * Creates a deterministic ZIP bundle containing all artifacts needed for
 * county CIO / auditor sign-off without CLI access.
 *
 * Usage:
 *   pnpm perf:bundle [options]
 *   npx tsx tools/registry/autonomy-viewer/src/bundle.ts [options]
 *
 * Options:
 *   --in <dir>        Root directory containing artifacts (default: workspace root)
 *   --out <dir>       Output directory for ZIP (default: ./dist)
 *   --name <name>     Override ZIP filename
 *   --run-id <id>     CI run ID for naming/manifest
 *   --strict          Fail if required files are missing (default: true)
 *   --no-strict       Skip missing files without error
 *   --emit-manifest   Emit manifest JSON alongside ZIP (default: true)
 *   --include-seals   Phase 4N19: Include signature triplet + VERIFY.md in sealed bundle
 *   --seals-dir <dir> Directory containing .sig/.crt/.bundle files (default: out dir)
 *   --verbose         Verbose output
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildManifest } from './manifest.js';
import { buildDeterministicZip } from './zip/zip-writer.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// CLI Argument Parsing
// ─────────────────────────────────────────────────────────────────────────────

interface BundleOptions {
  inDir: string;
  outDir: string;
  name?: string;
  runId?: string;
  strict: boolean;
  emitManifest: boolean;
  verbose: boolean;
  /** Phase 4N19: Include signature triplet and VERIFY.md for offline verification */
  includeSeals: boolean;
  /** Path to signature triplet directory (default: same as outDir after signing) */
  sealsDir?: string;
}

function parseArgs(): BundleOptions {
  const args = process.argv.slice(2);
  // Default inDir is 4 levels up from this file (workspace root)
  const defaultInDir = resolve(__dirname, '..', '..', '..', '..');
  const opts: BundleOptions = {
    inDir: defaultInDir,
    outDir: resolve(__dirname, '..', 'dist'),
    strict: true,
    emitManifest: true,
    verbose: false,
    includeSeals: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--in' && args[i + 1]) {
      opts.inDir = resolve(args[++i]);
    } else if (arg.startsWith('--in=')) {
      opts.inDir = resolve(arg.slice('--in='.length));
    } else if (arg === '--out' && args[i + 1]) {
      opts.outDir = resolve(args[++i]);
    } else if (arg.startsWith('--out=')) {
      opts.outDir = resolve(arg.slice('--out='.length));
    } else if (arg === '--name' && args[i + 1]) {
      opts.name = args[++i];
    } else if (arg.startsWith('--name=')) {
      opts.name = arg.slice('--name='.length);
    } else if (arg === '--run-id' && args[i + 1]) {
      opts.runId = args[++i];
    } else if (arg.startsWith('--run-id=')) {
      opts.runId = arg.slice('--run-id='.length);
    } else if (arg === '--strict') {
      opts.strict = true;
    } else if (arg === '--no-strict') {
      opts.strict = false;
    } else if (arg === '--emit-manifest') {
      opts.emitManifest = true;
    } else if (arg === '--no-emit-manifest') {
      opts.emitManifest = false;
    } else if (arg === '--verbose') {
      opts.verbose = true;
    } else if (arg === '--include-seals') {
      // Phase 4N19: Include signature triplet for offline verification
      opts.includeSeals = true;
    } else if (arg === '--seals-dir' && args[i + 1]) {
      opts.sealsDir = resolve(args[++i]);
    } else if (arg.startsWith('--seals-dir=')) {
      opts.sealsDir = resolve(arg.slice('--seals-dir='.length));
    }
  }

  return opts;
}

// ─────────────────────────────────────────────────────────────────────────────
// File Loading
// ─────────────────────────────────────────────────────────────────────────────

function loadFile(absPath: string, strict: boolean, verbose: boolean): Buffer | null {
  if (!existsSync(absPath)) {
    if (strict) {
      throw new Error(`Missing required file: ${absPath}`);
    }
    if (verbose) {
      console.log(`⚠️  Skipping missing file: ${absPath}`);
    }
    return null;
  }
  const data = readFileSync(absPath);
  if (verbose) {
    console.log(`📄 Loaded: ${absPath} (${data.length} bytes)`);
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// README Template
// ─────────────────────────────────────────────────────────────────────────────

function generateReadme(proofId?: string): Buffer {
  const rollbackId = proofId || '<plan_item_id>';
  return Buffer.from(
    `# TerraFusion Autonomy Evidence Bundle

## Quick Start

### Step 1: Open the Dashboard
Open \`autonomy-dashboard.html\` in any browser (works offline).

### Step 2: Review the Proof
Check \`apply-proofs.json\` for the complete audit trail.

---

## Rollback Instructions (if needed)

### Preview rollback (safe, no changes)
\`\`\`bash
pnpm perf:rollback --proof ${rollbackId} --dry-run
\`\`\`

### Execute rollback
\`\`\`bash
pnpm perf:rollback --proof ${rollbackId}
\`\`\`

### Post-rollback verification
\`\`\`bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
\`\`\`

---

## Bundle Contents

| File | Purpose |
|------|---------|
| \`autonomy-dashboard.html\` | Offline dashboard viewer |
| \`autonomy-dashboard.json\` | Dashboard view model (optional) |
| \`apply-proofs.json\` | Audit trail with rollback commands |
| \`perf.plan.json\` | Deterministic selection input |
| \`perf-audit-report.actionable.json\` | Allowed-surface findings only |
| \`AUTONOMY_V1_GOVERNANCE_CONTRACT.md\` | Governance contract document |
| \`MANIFEST.json\` | SHA256 hashes for integrity verification |

---

## What Autonomy Will NOT Do

Per the Autonomy v1 Governance Contract:

- ❌ Modify more than 1 file per patch
- ❌ Apply Tier 1+ strategies without explicit opt-in
- ❌ Auto-merge (human approval always required)
- ❌ Push directly to main/master
- ❌ Apply patches with risk score > 40
- ❌ Modify forbidden paths (ARCHIVE, specialized, applications)

---

## Integrity Verification

\`MANIFEST.json\` contains SHA256 hashes for every file in this bundle.
Verify integrity by re-computing hashes and comparing.

---

*TerraFusion Autonomy v1 — Government. Transcended.*
`,
    'utf8'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N19: VERIFY.md Template (Offline Signature Verification)
// ─────────────────────────────────────────────────────────────────────────────

interface VerifyMdOptions {
  bundleName: string;
  manifestPath: string;
  signatureIdentity?: string;
}

/**
 * Generates VERIFY.md with offline cosign verification instructions.
 * This allows auditors to verify cryptographic signatures without network access
 * (after first installing cosign).
 */
function generateVerifyMd(opts: VerifyMdOptions): Buffer {
  const bundleBase = opts.bundleName.replace(/\.zip$/, '');
  return Buffer.from(
    `# Offline Signature Verification Guide

## Phase 4N19: Self-Contained Evidence Bag

This bundle contains its own cryptographic seals for offline verification.

---

## Step 1: Install cosign (one-time)

Download cosign from: https://github.com/sigstore/cosign/releases

\`\`\`bash
# macOS
brew install cosign

# Windows (scoop)
scoop install cosign

# Linux
curl -O -L https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64
chmod +x cosign-linux-amd64
sudo mv cosign-linux-amd64 /usr/local/bin/cosign
\`\`\`

---

## Step 2: Verify Manifest Signature (Offline)

The \`${opts.manifestPath}.sig\` file contains the detached signature.
The \`${opts.manifestPath}.crt\` file contains the certificate.
The \`${opts.manifestPath}.bundle\` file contains the Rekor transparency log proof.

\`\`\`bash
# Extract the bundle first
unzip ${opts.bundleName} -d ./evidence

# Verify the manifest signature (uses embedded certificate + bundle)
cosign verify-blob \\
  --signature ./seals/${bundleBase}.manifest.json.sig \\
  --certificate ./seals/${bundleBase}.manifest.json.crt \\
  --bundle ./seals/${bundleBase}.manifest.json.bundle \\
  --certificate-identity-regexp ".*" \\
  --certificate-oidc-issuer-regexp ".*" \\
  ./evidence/${opts.manifestPath}
\`\`\`

---

## Step 3: Verify File Integrity

After signature verification, verify all files against the manifest:

\`\`\`bash
# Use the verify-bundle CLI
npx @terrafusion/autonomy-viewer verify-bundle \\
  --in ${opts.bundleName} \\
  --strict
\`\`\`

Or manually verify SHA256 hashes:

\`\`\`bash
# Read the manifest
cat ./evidence/MANIFEST.json | jq '.files[]'

# Verify each file hash
sha256sum ./evidence/<filename> | grep <expected_hash>
\`\`\`

---

## What These Seals Prove

1. **Authenticity**: The manifest was signed by a GitHub Actions workflow
2. **Integrity**: The SHA256 hashes in the manifest match the file contents
3. **Non-repudiation**: The signature is recorded in Sigstore's transparency log
4. **Provenance**: The certificate contains the workflow run ID and repository

---

## Included Signature Files

| File | Purpose |
|------|---------|
| \`seals/${bundleBase}.manifest.json.sig\` | Detached signature |
| \`seals/${bundleBase}.manifest.json.crt\` | Signing certificate |
| \`seals/${bundleBase}.manifest.json.bundle\` | Rekor transparency log proof |

---

## Troubleshooting

### "certificate has expired"
This is expected for keyless signatures. The \`.bundle\` file contains the
timestamp proof from Rekor, which proves the signature was valid at signing time.

### "failed to verify signature"
Ensure you're using the correct manifest file and that no files have been modified.

---

*TerraFusion Phase 4N19 — Self-Contained Evidence Bag*
*Government. Transcended.*
`,
    'utf8'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export function main(): void {
  const opts = parseArgs();

  if (opts.verbose) {
    console.log('📦 Autonomy Evidence Bundle Generator');
    console.log(`   Input: ${opts.inDir}`);
    console.log(`   Output: ${opts.outDir}`);
    console.log(`   Strict: ${opts.strict}`);
    console.log(`   Run ID: ${opts.runId || 'local'}`);
  }

  // Ensure output directory exists
  if (!existsSync(opts.outDir)) {
    mkdirSync(opts.outDir, { recursive: true });
  }

  // Define file locations
  const auditOut = join(opts.inDir, 'tools', 'registry', 'perf-skill-audit', 'out');
  const viewerDist = join(opts.inDir, 'tools', 'registry', 'autonomy-viewer', 'dist');
  const contractPath = join(opts.inDir, 'AUTONOMY_V1_GOVERNANCE_CONTRACT.md');

  // Load required files
  const perfPlan = loadFile(join(auditOut, 'perf.plan.json'), opts.strict, opts.verbose);
  const proofs = loadFile(join(auditOut, 'apply-proofs.json'), opts.strict, opts.verbose);
  const actionable = loadFile(
    join(auditOut, 'perf-audit-report.actionable.json'),
    false, // Not strictly required
    opts.verbose
  );
  const dashboardHtml = loadFile(
    join(viewerDist, 'autonomy-dashboard.html'),
    opts.strict,
    opts.verbose
  );
  const dashboardJson = loadFile(join(viewerDist, 'autonomy-dashboard.json'), false, opts.verbose);
  const contractMd = loadFile(contractPath, opts.strict, opts.verbose);

  // Extract baseSha from plan (if available)
  let baseSha = 'unknown';
  let planBaseSha: string | undefined;
  let proofId: string | undefined;

  if (perfPlan) {
    try {
      const planObj = JSON.parse(perfPlan.toString('utf8')) as { baseSha?: string };
      baseSha = planObj.baseSha || 'unknown';
      planBaseSha = planObj.baseSha;
    } catch {
      // Ignore parse errors
    }
  }

  // Extract proof ID from proofs (if available)
  if (proofs) {
    try {
      const proofsData = JSON.parse(proofs.toString('utf8'));
      const proofsArray = Array.isArray(proofsData) ? proofsData : proofsData.proofs || [];
      const applied = proofsArray.find((p: { outcome?: string }) => p.outcome === 'applied');
      if (applied?.planItemId) {
        proofId = applied.planItemId;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Build file list for ZIP
  const files: Array<{ zipPath: string; data: Buffer }> = [];

  if (dashboardHtml) files.push({ zipPath: 'autonomy-dashboard.html', data: dashboardHtml });
  if (dashboardJson) files.push({ zipPath: 'autonomy-dashboard.json', data: dashboardJson });
  if (proofs) files.push({ zipPath: 'apply-proofs.json', data: proofs });
  if (perfPlan) files.push({ zipPath: 'perf.plan.json', data: perfPlan });
  if (actionable) files.push({ zipPath: 'perf-audit-report.actionable.json', data: actionable });
  if (contractMd) files.push({ zipPath: 'AUTONOMY_V1_GOVERNANCE_CONTRACT.md', data: contractMd });

  // Generate README
  const readme = generateReadme(proofId);
  files.push({ zipPath: 'README_AUDIT_PACKET.md', data: readme });

  // Build manifest
  const manifest = buildManifest({
    baseSha,
    planBaseSha,
    runId: opts.runId,
    files,
  });

  // Add manifest to files
  if (opts.emitManifest) {
    const manifestJson = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
    files.push({ zipPath: 'MANIFEST.json', data: manifestJson });
  }

  // Build deterministic ZIP
  const zipBuf = buildDeterministicZip(files);

  // Determine output filename
  const shortSha = baseSha.slice(0, 8);
  const runIdSuffix = opts.runId || 'local';
  const zipName = opts.name || `autonomy-evidence-${shortSha}-${runIdSuffix}.zip`;
  const zipPath = join(opts.outDir, zipName);

  // Write ZIP
  writeFileSync(zipPath, zipBuf);
  console.log(`✅ Evidence bundle: ${zipPath} (${zipBuf.length} bytes)`);

  // Write standalone manifest (for quick inspection)
  if (opts.emitManifest) {
    const manifestPath = join(opts.outDir, `${zipName}.manifest.json`);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    if (opts.verbose) {
      console.log(`✅ Manifest: ${manifestPath}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 4N19: Include signature seals for offline verification
  // ─────────────────────────────────────────────────────────────────────────
  if (opts.includeSeals) {
    const sealsDir = opts.sealsDir || opts.outDir;
    const manifestBaseName = `${zipName}.manifest.json`;

    // Load signature triplet files
    const sigFile = loadFile(join(sealsDir, `${manifestBaseName}.sig`), false, opts.verbose);
    const crtFile = loadFile(join(sealsDir, `${manifestBaseName}.crt`), false, opts.verbose);
    const bundleFile = loadFile(join(sealsDir, `${manifestBaseName}.bundle`), false, opts.verbose);

    // Check if we have at least the signature file
    const hasTriplet = sigFile && crtFile && bundleFile;

    if (hasTriplet) {
      // Create sealed bundle with signature triplet included
      const sealedFiles = [...files];

      // Add seals in a subdirectory
      sealedFiles.push({ zipPath: `seals/${manifestBaseName}.sig`, data: sigFile });
      sealedFiles.push({ zipPath: `seals/${manifestBaseName}.crt`, data: crtFile });
      sealedFiles.push({ zipPath: `seals/${manifestBaseName}.bundle`, data: bundleFile });

      // Generate and add VERIFY.md
      const verifyMd = generateVerifyMd({
        bundleName: zipName,
        manifestPath: 'MANIFEST.json',
      });
      sealedFiles.push({ zipPath: 'VERIFY.md', data: verifyMd });

      // Build sealed ZIP
      const sealedZipBuf = buildDeterministicZip(sealedFiles);
      const sealedZipName = zipName.replace(/\.zip$/, '-sealed.zip');
      const sealedZipPath = join(opts.outDir, sealedZipName);

      writeFileSync(sealedZipPath, sealedZipBuf);
      console.log(`🔒 Sealed bundle: ${sealedZipPath} (${sealedZipBuf.length} bytes)`);

      if (opts.verbose) {
        console.log('📋 Sealed bundle contains signature triplet:');
        console.log(`   - seals/${manifestBaseName}.sig`);
        console.log(`   - seals/${manifestBaseName}.crt`);
        console.log(`   - seals/${manifestBaseName}.bundle`);
        console.log('   - VERIFY.md');
      }
    } else {
      console.log('⚠️  --include-seals specified but signature triplet not found');
      console.log(`   Looking in: ${sealsDir}`);
      console.log(`   Expected: ${manifestBaseName}.sig, .crt, .bundle`);
    }
  }

  if (opts.verbose) {
    console.log(`📋 Bundle contains ${files.length} files:`);
    for (const f of files) {
      console.log(`   - ${f.zipPath} (${f.data.length} bytes)`);
    }
  }
}

// Run if executed directly
const isMainModule = (() => {
  try {
    const scriptPath = fileURLToPath(import.meta.url);
    const argPath = process.argv[1];
    return (
      scriptPath.replace(/\\/g, '/').toLowerCase() === argPath?.replace(/\\/g, '/').toLowerCase()
    );
  } catch {
    return false;
  }
})();

if (isMainModule) {
  main();
}
