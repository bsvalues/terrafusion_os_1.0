/**
 * Air-Gap Bundle Generator
 * ========================
 * Phase II: Distribution Hardening
 *
 * Generates a self-contained verification bundle that can be used
 * in restricted environments without GitHub access.
 *
 * Bundle contents:
 * - reference-packet.zip (accreditation artifacts)
 * - checksums.sha256 (hash verification)
 * - verify.sh (Linux/macOS verification script)
 * - verify.ps1 (Windows verification script)
 * - README.txt (usage instructions)
 *
 * @schema terrafusion.autonomy.airgap-bundle.v1
 * @version 4N51.1
 */

import { createHash } from 'node:crypto';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    writeFileSync
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { toJsonWithLF } from './utils/deterministic-json.js';
import { normalizePath } from './utils/path-normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const AIRGAP_BUNDLE_SCHEMA = 'terrafusion.autonomy.airgap-bundle.v1';
export const AIRGAP_BUNDLE_VERSION = '4N51.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AirgapBundleOptions {
  /** Source directory containing accreditation packet */
  readonly sourceDir: string;
  /** Output directory for the bundle */
  readonly outDir: string;
  /** Bundle name (default: 'airgap-bundle') */
  readonly bundleName?: string;
  /** Include reference lock file */
  readonly includeLock?: boolean;
}

export interface FileChecksum {
  readonly path: string;
  readonly sha256: string;
  readonly sizeBytes: number;
}

export interface AirgapBundleResult {
  readonly $schema: typeof AIRGAP_BUNDLE_SCHEMA;
  readonly version: typeof AIRGAP_BUNDLE_VERSION;
  readonly generatedAt: string;
  readonly bundleName: string;
  readonly sourceDir: string;
  readonly outDir: string;
  readonly files: readonly FileChecksum[];
  readonly totalBytes: number;
  readonly ok: boolean;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Codes
// ─────────────────────────────────────────────────────────────────────────────

const ERROR_CODES = {
  SOURCE_NOT_FOUND: 'AIRGAP_SOURCE_NOT_FOUND',
  MANIFEST_NOT_FOUND: 'AIRGAP_MANIFEST_NOT_FOUND',
  WRITE_FAILED: 'AIRGAP_WRITE_FAILED',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate an air-gap verification bundle.
 *
 * @param options - Bundle generation options
 * @returns AirgapBundleResult
 */
export function generateAirgapBundle(options: AirgapBundleOptions): AirgapBundleResult {
  const generatedAt = new Date().toISOString();
  const bundleName = options.bundleName ?? 'airgap-bundle';
  const includeLock = options.includeLock ?? true;

  // ─────────────────────────────────────────────────────────────────────────
  // Input Validation
  // ─────────────────────────────────────────────────────────────────────────

  if (!existsSync(options.sourceDir)) {
    return createFailureResult({
      generatedAt,
      bundleName,
      sourceDir: options.sourceDir,
      outDir: options.outDir,
      errorCode: ERROR_CODES.SOURCE_NOT_FOUND,
      errorMessage: `Source directory not found: ${options.sourceDir}`,
    });
  }

  const manifestPath = join(options.sourceDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    return createFailureResult({
      generatedAt,
      bundleName,
      sourceDir: options.sourceDir,
      outDir: options.outDir,
      errorCode: ERROR_CODES.MANIFEST_NOT_FOUND,
      errorMessage: 'manifest.json not found in source directory',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Setup Output Directory
  // ─────────────────────────────────────────────────────────────────────────

  const outDir = resolve(options.outDir);
  const bundleDir = join(outDir, bundleName);

  try {
    mkdirSync(bundleDir, { recursive: true });
  } catch (err) {
    return createFailureResult({
      generatedAt,
      bundleName,
      sourceDir: options.sourceDir,
      outDir,
      errorCode: ERROR_CODES.WRITE_FAILED,
      errorMessage: `Failed to create output directory: ${(err as Error).message}`,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Copy Artifacts & Compute Checksums
  // ─────────────────────────────────────────────────────────────────────────

  const checksums: FileChecksum[] = [];
  let totalBytes = 0;

  // Copy all JSON files from source
  const artifactsDir = join(bundleDir, 'artifacts');
  mkdirSync(artifactsDir, { recursive: true });

  function copyFiles(srcDir: string, destDir: string, relativePath: string = '') {
    const entries = readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const srcPath = join(srcDir, entry.name);
      const destPath = join(destDir, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        mkdirSync(destPath, { recursive: true });
        copyFiles(srcPath, destPath, relPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        const content = readFileSync(srcPath);
        writeFileSync(destPath, content);

        const sha256 = createHash('sha256').update(content).digest('hex');
        checksums.push({
          path: normalizePath(relPath),
          sha256,
          sizeBytes: content.length,
        });
        totalBytes += content.length;
      }
    }
  }

  copyFiles(options.sourceDir, artifactsDir);

  // ─────────────────────────────────────────────────────────────────────────
  // Include Reference Lock File (Optional)
  // ─────────────────────────────────────────────────────────────────────────

  if (includeLock) {
    const lockPath = join(dirname(options.sourceDir), 'ACCREDITATION_REFERENCE.lock.json');
    if (existsSync(lockPath)) {
      const lockContent = readFileSync(lockPath);
      const lockDest = join(bundleDir, 'ACCREDITATION_REFERENCE.lock.json');
      writeFileSync(lockDest, lockContent);

      const sha256 = createHash('sha256').update(lockContent).digest('hex');
      checksums.push({
        path: 'ACCREDITATION_REFERENCE.lock.json',
        sha256,
        sizeBytes: lockContent.length,
      });
      totalBytes += lockContent.length;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Generate Checksums File
  // ─────────────────────────────────────────────────────────────────────────

  const checksumLines = checksums
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(c => `${c.sha256}  ${c.path}`)
    .join('\n');

  writeFileSync(join(bundleDir, 'checksums.sha256'), checksumLines + '\n', 'utf-8');

  // ─────────────────────────────────────────────────────────────────────────
  // Generate Verification Scripts
  // ─────────────────────────────────────────────────────────────────────────

  // Bash script for Linux/macOS
  const bashScript = `#!/usr/bin/env bash
# TerraFusion Accreditation Packet Verifier
# Generated: ${generatedAt}
# Bundle: ${bundleName}

set -e

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🏛️ TerraFusion Air-Gap Verification"
echo "===================================="
echo "Bundle: ${bundleName}"
echo "Generated: ${generatedAt}"
echo ""

# Verify checksums
echo "Verifying file checksums..."
if command -v sha256sum &> /dev/null; then
  sha256sum -c checksums.sha256
elif command -v shasum &> /dev/null; then
  shasum -a 256 -c checksums.sha256
else
  echo "ERROR: No SHA256 tool found (sha256sum or shasum required)"
  exit 1
fi

echo ""
echo "✅ All checksums verified successfully"
echo ""

# Parse manifest
if [ -f "artifacts/manifest.json" ]; then
  echo "Manifest Summary:"
  echo "  Files: $(grep -o '"fileCount":[0-9]*' artifacts/manifest.json | cut -d: -f2)"
  echo "  Bytes: $(grep -o '"totalBytes":[0-9]*' artifacts/manifest.json | cut -d: -f2)"
fi

echo ""
echo "✅ Verification Complete"
`;

  writeFileSync(join(bundleDir, 'verify.sh'), bashScript, { mode: 0o755 });

  // PowerShell script for Windows
  const psScript = `# TerraFusion Accreditation Packet Verifier
# Generated: ${generatedAt}
# Bundle: ${bundleName}

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "🏛️ TerraFusion Air-Gap Verification"
Write-Host "===================================="
Write-Host "Bundle: ${bundleName}"
Write-Host "Generated: ${generatedAt}"
Write-Host ""

# Verify checksums
Write-Host "Verifying file checksums..."
$checksums = Get-Content "checksums.sha256"
$failed = $false

foreach ($line in $checksums) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    $parts = $line -split "  ", 2
    $expectedHash = $parts[0].ToUpper()
    $filePath = $parts[1]
    
    if (-not (Test-Path $filePath)) {
        Write-Host "MISSING: $filePath" -ForegroundColor Red
        $failed = $true
        continue
    }
    
    $actualHash = (Get-FileHash -Path $filePath -Algorithm SHA256).Hash
    
    if ($actualHash -eq $expectedHash) {
        Write-Host "OK: $filePath" -ForegroundColor Green
    } else {
        Write-Host "FAIL: $filePath" -ForegroundColor Red
        Write-Host "  Expected: $expectedHash"
        Write-Host "  Actual:   $actualHash"
        $failed = $true
    }
}

if ($failed) {
    Write-Host ""
    Write-Host "❌ Verification FAILED" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All checksums verified successfully" -ForegroundColor Green
Write-Host ""

# Parse manifest
if (Test-Path "artifacts/manifest.json") {
    $manifest = Get-Content "artifacts/manifest.json" | ConvertFrom-Json
    Write-Host "Manifest Summary:"
    Write-Host "  Files: \$($manifest.fileCount)"
    Write-Host "  Bytes: \$($manifest.totalBytes)"
}

Write-Host ""
Write-Host "✅ Verification Complete" -ForegroundColor Green
`;

  writeFileSync(join(bundleDir, 'verify.ps1'), psScript, 'utf-8');

  // ─────────────────────────────────────────────────────────────────────────
  // Generate README
  // ─────────────────────────────────────────────────────────────────────────

  const readme = `TerraFusion Accreditation Air-Gap Bundle
==========================================
Generated: ${generatedAt}
Bundle Name: ${bundleName}

This bundle contains a self-verifiable accreditation packet that can be
validated without network access.

CONTENTS
--------
- artifacts/           Accreditation packet files
- checksums.sha256     SHA256 hashes for all files
- verify.sh            Verification script (Linux/macOS)
- verify.ps1           Verification script (Windows)
- README.txt           This file

VERIFICATION (Linux/macOS)
--------------------------
chmod +x verify.sh
./verify.sh

VERIFICATION (Windows)
----------------------
.\\verify.ps1

MANUAL VERIFICATION
-------------------
1. Compute SHA256 of each file in artifacts/
2. Compare against checksums.sha256
3. All hashes must match exactly

INTEGRITY CHAIN
---------------
This bundle is derived from a reference-locked accreditation packet.
The checksums in this bundle can be traced back to:
- ACCREDITATION_REFERENCE.lock.json (if included)
- GitHub Release assets (v1.5.1+)

CONTACT
-------
TerraFusion OS - Government. Transcended.
`;

  writeFileSync(join(bundleDir, 'README.txt'), readme, 'utf-8');

  // ─────────────────────────────────────────────────────────────────────────
  // Generate Bundle Manifest
  // ─────────────────────────────────────────────────────────────────────────

  const result: AirgapBundleResult = {
    $schema: AIRGAP_BUNDLE_SCHEMA,
    version: AIRGAP_BUNDLE_VERSION,
    generatedAt,
    bundleName,
    sourceDir: normalizePath(options.sourceDir),
    outDir: normalizePath(bundleDir),
    files: checksums.sort((a, b) => a.path.localeCompare(b.path)),
    totalBytes,
    ok: true,
  };

  writeFileSync(join(bundleDir, 'bundle-manifest.json'), toJsonWithLF(result), 'utf-8');

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createFailureResult(params: {
  generatedAt: string;
  bundleName: string;
  sourceDir: string;
  outDir: string;
  errorCode: string;
  errorMessage: string;
}): AirgapBundleResult {
  return {
    $schema: AIRGAP_BUNDLE_SCHEMA,
    version: AIRGAP_BUNDLE_VERSION,
    generatedAt: params.generatedAt,
    bundleName: params.bundleName,
    sourceDir: normalizePath(params.sourceDir),
    outDir: normalizePath(params.outDir),
    files: [],
    totalBytes: 0,
    ok: false,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
  };
}

export default generateAirgapBundle;
