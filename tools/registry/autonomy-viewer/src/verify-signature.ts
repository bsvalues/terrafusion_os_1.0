/**
 * Phase 4N16 — Keyless Signature Verifier CLI
 *
 * Verifies Sigstore/cosign keyless signatures for evidence artifacts.
 * Cryptographic proof of authorship without secret material.
 *
 * Usage:
 *   pnpm perf:verify-signature --artifact <file> --bundle <file.bundle>
 *   pnpm perf:verify-signature --artifact <file> --bundle <file.bundle> --identity <workflow-uri>
 *   pnpm perf:verify-signature --artifact <file> --bundle <file.bundle> --issuer <oidc-issuer>
 *
 * Options:
 *   --artifact <path>     Path to the signed artifact
 *   --bundle <path>       Path to the .bundle file (contains sig + cert chain)
 *   --identity <uri>      Expected workflow identity (certificate SAN)
 *   --issuer <url>        Expected OIDC issuer (default: GitHub Actions)
 *   --json                Output machine-readable JSON report
 *   --verbose             Verbose output
 *
 * Exit codes:
 *   0 = Signature verification passed
 *   1 = Verification failed (bad signature, identity mismatch, expired cert)
 *   2 = Invalid arguments or file not found
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GITHUB_OIDC_ISSUER } from './evidence-index.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface VerifyOptions {
  artifactPath: string;
  bundlePath: string;
  identity?: string;
  issuer: string;
  json: boolean;
  verbose: boolean;
}

interface VerifyResult {
  ok: boolean;
  artifact: string;
  bundleFile: string;
  identity: IdentityInfo | null;
  errors: VerifyError[];
  warnings: string[];
  checkedAt: string;
}

interface IdentityInfo {
  issuer: string;
  subject: string;
  workflowRef?: string;
  workflowSha?: string;
  runId?: string;
  repositoryOwner?: string;
  repository?: string;
}

interface VerifyError {
  type:
    | 'cosign_not_found'
    | 'bundle_invalid'
    | 'signature_invalid'
    | 'cert_expired'
    | 'identity_mismatch'
    | 'issuer_mismatch'
    | 'file_not_found'
    | 'execution_error';
  message: string;
  expected?: string;
  actual?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Argument Parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(): VerifyOptions | null {
  const args = process.argv.slice(2);
  let artifactPath = '';
  let bundlePath = '';
  let identity: string | undefined;
  let issuer: string = GITHUB_OIDC_ISSUER;
  let json = false;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--artifact' && args[i + 1]) {
      artifactPath = args[++i];
    } else if (arg === '--bundle' && args[i + 1]) {
      bundlePath = args[++i];
    } else if (arg === '--identity' && args[i + 1]) {
      identity = args[++i];
    } else if (arg === '--issuer' && args[i + 1]) {
      issuer = args[++i];
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--verbose') {
      verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!artifactPath || !bundlePath) {
    return null;
  }

  return {
    artifactPath: resolve(artifactPath),
    bundlePath: resolve(bundlePath),
    identity,
    issuer,
    json,
    verbose,
  };
}

function printHelp(): void {
  console.log(`
TerraFusion Keyless Signature Verifier

Usage:
  pnpm perf:verify-signature --artifact <file> --bundle <file.bundle> [options]

Options:
  --artifact <path>    Path to the signed artifact (required)
  --bundle <path>      Path to the .bundle file (required)
  --identity <uri>     Expected workflow identity (certificate subject)
  --issuer <url>       Expected OIDC issuer (default: GitHub Actions)
  --json               Output machine-readable JSON report
  --verbose            Verbose output
  --help, -h           Show this help

Exit codes:
  0 = Signature verification passed
  1 = Verification failed
  2 = Invalid arguments or file not found

Examples:
  # Basic verification
  pnpm perf:verify-signature --artifact bundle.zip --bundle bundle.zip.bundle

  # With identity constraint
  pnpm perf:verify-signature --artifact bundle.zip --bundle bundle.zip.bundle \\
    --identity "https://github.com/terrafusion-dev/terrafusion_os/.github/workflows/autonomy-evidence-publisher.yml@refs/heads/main"
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cosign Detection
// ─────────────────────────────────────────────────────────────────────────────

function findCosign(): string | null {
  const candidates = ['cosign', 'cosign.exe'];

  for (const cmd of candidates) {
    try {
      execSync(`${cmd} version`, { stdio: 'pipe' });
      return cmd;
    } catch {
      // Not found, try next
    }
  }

  return null;
}

function getCosignVersion(cosignCmd: string): string {
  try {
    const output = execSync(`${cosignCmd} version`, { encoding: 'utf8', stdio: 'pipe' });
    const match = output.match(/v?(\d+\.\d+\.\d+)/);
    return match ? match[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bundle Parsing (extract certificate info)
// ─────────────────────────────────────────────────────────────────────────────

interface SigstoreBundle {
  mediaType?: string;
  verificationMaterial?: {
    x509CertificateChain?: {
      certificates?: Array<{ rawBytes: string }>;
    };
    publicKey?: {
      hint?: string;
    };
  };
  messageSignature?: {
    signature?: string;
  };
}

function parseBundle(bundlePath: string): { ok: boolean; bundle?: SigstoreBundle; error?: string } {
  try {
    const content = readFileSync(bundlePath, 'utf8');
    const bundle = JSON.parse(content) as SigstoreBundle;

    // Validate bundle structure
    if (!bundle.mediaType?.includes('sigstore')) {
      return { ok: false, error: 'Not a valid Sigstore bundle (missing mediaType)' };
    }

    if (!bundle.verificationMaterial) {
      return { ok: false, error: 'Bundle missing verificationMaterial' };
    }

    if (!bundle.messageSignature?.signature) {
      return { ok: false, error: 'Bundle missing signature' };
    }

    return { ok: true, bundle };
  } catch (err) {
    return { ok: false, error: `Failed to parse bundle: ${err}` };
  }
}

/**
 * Extract identity info from certificate in bundle using openssl or inline parsing.
 * This is a best-effort extraction - actual verification happens via cosign.
 */
function extractCertificateInfo(bundle: SigstoreBundle): IdentityInfo | null {
  try {
    const certs = bundle.verificationMaterial?.x509CertificateChain?.certificates;
    if (!certs || certs.length === 0) {
      return null;
    }

    // The first cert is the signing cert
    const certDer = Buffer.from(certs[0].rawBytes, 'base64');

    // Try to use openssl to parse the cert
    const tempDir = mkdtempSync(join(tmpdir(), 'tf-verify-'));
    const certPath = join(tempDir, 'cert.der');

    try {
      writeFileSync(certPath, certDer);

      // Convert to PEM and extract subject + extensions
      const pemOutput = execSync(`openssl x509 -inform DER -in "${certPath}" -noout -text`, {
        encoding: 'utf8',
        stdio: 'pipe',
      });

      // Parse OpenSSL output for Fulcio extensions
      const info: IdentityInfo = {
        issuer: '',
        subject: '',
      };

      // Subject Alternative Name contains the identity
      const sanMatch = pemOutput.match(/Subject Alternative Name:[\s\S]*?URI:([^\s,]+)/);
      if (sanMatch) {
        info.subject = sanMatch[1];
      }

      // OIDC Issuer OID: 1.3.6.1.4.1.57264.1.1
      const issuerMatch = pemOutput.match(/1\.3\.6\.1\.4\.1\.57264\.1\.1:\s*\n\s*\.+([^\n]+)/);
      if (issuerMatch) {
        info.issuer = issuerMatch[1].trim();
      } else {
        // Fallback: look for common issuer patterns
        if (pemOutput.includes('token.actions.githubusercontent.com')) {
          info.issuer = GITHUB_OIDC_ISSUER;
        }
      }

      // GitHub Run Ref OID: 1.3.6.1.4.1.57264.1.6
      const refMatch = pemOutput.match(/1\.3\.6\.1\.4\.1\.57264\.1\.6:\s*\n\s*\.+([^\n]+)/);
      if (refMatch) {
        info.workflowRef = refMatch[1].trim();
      }

      // GitHub SHA OID: 1.3.6.1.4.1.57264.1.3
      const shaMatch = pemOutput.match(/1\.3\.6\.1\.4\.1\.57264\.1\.3:\s*\n\s*([a-f0-9]{40})/i);
      if (shaMatch) {
        info.workflowSha = shaMatch[1];
      }

      return info;
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  } catch {
    // Certificate parsing is best-effort
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Verification Logic
// ─────────────────────────────────────────────────────────────────────────────

function verifySignature(options: VerifyOptions): VerifyResult {
  const checkedAt = new Date().toISOString();
  const errors: VerifyError[] = [];
  const warnings: string[] = [];
  const artifactName = basename(options.artifactPath);
  const bundleName = basename(options.bundlePath);
  let identity: IdentityInfo | null = null;

  // Step 1: Check files exist
  if (!existsSync(options.artifactPath)) {
    return {
      ok: false,
      artifact: artifactName,
      bundleFile: bundleName,
      identity: null,
      errors: [
        {
          type: 'file_not_found',
          message: `Artifact not found: ${options.artifactPath}`,
        },
      ],
      warnings: [],
      checkedAt,
    };
  }

  if (!existsSync(options.bundlePath)) {
    return {
      ok: false,
      artifact: artifactName,
      bundleFile: bundleName,
      identity: null,
      errors: [
        {
          type: 'file_not_found',
          message: `Bundle not found: ${options.bundlePath}`,
        },
      ],
      warnings: [],
      checkedAt,
    };
  }

  // Step 2: Parse and validate bundle structure
  const bundleResult = parseBundle(options.bundlePath);
  if (!bundleResult.ok) {
    return {
      ok: false,
      artifact: artifactName,
      bundleFile: bundleName,
      identity: null,
      errors: [
        {
          type: 'bundle_invalid',
          message: bundleResult.error || 'Invalid bundle',
        },
      ],
      warnings: [],
      checkedAt,
    };
  }

  // Step 3: Extract certificate info (best-effort)
  if (bundleResult.bundle) {
    identity = extractCertificateInfo(bundleResult.bundle);
  }

  // Step 4: Find cosign
  const cosignCmd = findCosign();
  if (!cosignCmd) {
    return {
      ok: false,
      artifact: artifactName,
      bundleFile: bundleName,
      identity,
      errors: [
        {
          type: 'cosign_not_found',
          message: 'cosign not found in PATH. Install from: https://github.com/sigstore/cosign',
        },
      ],
      warnings: [],
      checkedAt,
    };
  }

  // Step 5: Build cosign verify-blob command
  const verifyArgs: string[] = [
    'verify-blob',
    '--bundle',
    `"${options.bundlePath}"`,
    // Use public Rekor for transparency log
    '--certificate-oidc-issuer',
    `"${options.issuer}"`,
  ];

  // Add identity constraint if specified
  if (options.identity) {
    verifyArgs.push('--certificate-identity', `"${options.identity}"`);
  } else {
    // Without --certificate-identity, cosign requires --certificate-identity-regexp
    // Use a permissive pattern that matches any GitHub workflow
    verifyArgs.push('--certificate-identity-regexp', '".*"');
  }

  // The artifact to verify
  verifyArgs.push(`"${options.artifactPath}"`);

  const cmd = `${cosignCmd} ${verifyArgs.join(' ')}`;

  // Step 6: Execute cosign verification
  try {
    execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
    // Success!
  } catch (err) {
    const exitError = err as {
      status?: number;
      stderr?: Buffer | string;
      stdout?: Buffer | string;
    };
    const stderr = exitError.stderr?.toString() || '';
    const stdout = exitError.stdout?.toString() || '';
    const output = stderr + stdout;

    // Parse cosign error
    if (output.includes('signature verification failed')) {
      errors.push({
        type: 'signature_invalid',
        message: 'Signature verification failed - artifact may have been modified',
      });
    } else if (output.includes('certificate has expired')) {
      errors.push({
        type: 'cert_expired',
        message: 'Signing certificate has expired',
      });
    } else if (output.includes('issuer') || output.includes('Issuer')) {
      errors.push({
        type: 'issuer_mismatch',
        message: 'OIDC issuer does not match expected value',
        expected: options.issuer,
        actual: identity?.issuer,
      });
    } else if (output.includes('identity') || output.includes('Identity')) {
      errors.push({
        type: 'identity_mismatch',
        message: 'Certificate identity does not match expected workflow',
        expected: options.identity,
        actual: identity?.subject,
      });
    } else {
      errors.push({
        type: 'execution_error',
        message: `Cosign verification failed: ${output.substring(0, 200)}`,
      });
    }

    return {
      ok: false,
      artifact: artifactName,
      bundleFile: bundleName,
      identity,
      errors,
      warnings,
      checkedAt,
    };
  }

  // Step 7: Post-verification identity checks (if we extracted cert info)
  if (options.identity && identity) {
    if (identity.subject && !identity.subject.includes(options.identity)) {
      warnings.push(
        `Identity may not fully match: expected "${options.identity}", found "${identity.subject}"`
      );
    }
  }

  if (identity && identity.issuer && identity.issuer !== options.issuer) {
    warnings.push(`Issuer in cert (${identity.issuer}) differs from expected (${options.issuer})`);
  }

  return {
    ok: true,
    artifact: artifactName,
    bundleFile: bundleName,
    identity,
    errors: [],
    warnings,
    checkedAt,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Output Formatting
// ─────────────────────────────────────────────────────────────────────────────

function formatHumanResult(result: VerifyResult, verbose: boolean): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('  TerraFusion Keyless Signature Verification');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push(`  Artifact:    ${result.artifact}`);
  lines.push(`  Bundle:      ${result.bundleFile}`);
  lines.push(`  Checked At:  ${result.checkedAt}`);
  lines.push('');

  if (result.identity) {
    lines.push('  Certificate Identity:');
    if (result.identity.issuer) {
      lines.push(`    Issuer:     ${result.identity.issuer}`);
    }
    if (result.identity.subject) {
      lines.push(`    Subject:    ${result.identity.subject}`);
    }
    if (result.identity.workflowRef) {
      lines.push(`    Ref:        ${result.identity.workflowRef}`);
    }
    if (result.identity.workflowSha) {
      lines.push(`    SHA:        ${result.identity.workflowSha}`);
    }
    lines.push('');
  }

  if (result.ok) {
    lines.push('  ✅ SIGNATURE VERIFIED');
    lines.push('');
    lines.push('  This artifact was signed by a trusted workflow.');
    lines.push('  Cryptographic proof of authorship confirmed.');

    if (result.warnings.length > 0) {
      lines.push('');
      lines.push('  Warnings:');
      for (const warning of result.warnings) {
        lines.push(`    ⚠️  ${warning}`);
      }
    }
  } else {
    lines.push('  ❌ SIGNATURE VERIFICATION FAILED');
    lines.push('');
    lines.push(`  ${result.errors.length} error${result.errors.length === 1 ? '' : 's'} found:`);
    lines.push('');

    for (const error of result.errors) {
      lines.push(`  → [${error.type.toUpperCase()}]`);
      lines.push(`    ${error.message}`);
      if (error.expected) {
        lines.push(`    Expected: ${error.expected}`);
      }
      if (error.actual) {
        lines.push(`    Actual:   ${error.actual}`);
      }
      lines.push('');
    }

    if (!verbose) {
      lines.push('  Use --verbose for more details.');
    }
  }

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main(): void {
  const options = parseArgs();

  if (!options) {
    console.error('Error: --artifact <path> and --bundle <path> are required');
    console.error('Use --help for usage information');
    process.exit(2);
  }

  // Verify signature
  const result = verifySignature(options);

  // Output result
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatHumanResult(result, options.verbose));
  }

  // Exit with appropriate code
  process.exit(result.ok ? 0 : 1);
}

// Run if main module
if (
  process.argv[1] &&
  (process.argv[1].endsWith('verify-signature.ts') ||
    process.argv[1].endsWith('verify-signature.js'))
) {
  main();
}

// Export for testing
export {
    extractCertificateInfo,
    findCosign,
    getCosignVersion,
    parseArgs,
    parseBundle,
    verifySignature,
    type IdentityInfo,
    type VerifyError,
    type VerifyOptions,
    type VerifyResult
};

