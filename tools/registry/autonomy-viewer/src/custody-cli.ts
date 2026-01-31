#!/usr/bin/env node
/**
 * Phase 4N11 — Chain of Custody CLI
 *
 * Generates courtroom-grade chain-of-custody HTML + JSON from autonomy artifacts.
 *
 * Usage:
 *   pnpm perf:custody \
 *     --proof apply-proofs.json \
 *     --out autonomy-custody.html \
 *     [--plan perf.plan.json] \
 *     [--verify verify-bundle.json] \
 *     [--evidence-index autonomy-evidence-index.json] \
 *     [--emit-json] \
 *     [--strict] \
 *     [--verbose]
 *
 * @module custody-cli
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { generateCustody, renderCustodyHtml } from './custody-generate.js';
import type { CustodyCliOptions } from './custody-types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx >= 0 && idx < process.argv.length - 1 ? process.argv[idx + 1] : undefined;
}

function has(name: string): boolean {
  return process.argv.includes(name);
}

function log(msg: string, verbose: boolean): void {
  if (verbose) console.log(`[custody] ${msg}`);
}

function usage(): void {
  console.log(`
TerraFusion Autonomy Chain of Custody Generator (Phase 4N11)

Usage:
  pnpm perf:custody --proof <path> --out <path> [options]

Required:
  --proof <path>           Path to apply-proofs.json
  --out <path>             Output path for custody HTML

Optional:
  --plan <path>            Path to perf.plan.json
  --verify <path>          Path to verify-bundle.json
  --evidence-index <path>  Path to autonomy-evidence-index.json
  --emit-json              Also emit JSON file (sibling to HTML)
  --strict                 Fail if optional inputs are missing
  --verbose                Enable verbose output

Graph Navigation URLs (for evidence stitching):
  --ledger-url <url>       URL to evidence ledger HTML
  --release-url <url>      URL to GitHub release page
  --bundle-url <url>       URL to download evidence bundle
  --dashboard-url <url>    URL to performance dashboard
  --custody-url <url>      Self-referential URL (for ledger backlink)

Examples:
  pnpm perf:custody --proof out/apply-proofs.json --out dist/custody.html
  pnpm perf:custody --proof out/apply-proofs.json --out dist/custody.html --emit-json
  pnpm perf:custody --proof out/apply-proofs.json --plan out/perf.plan.json --verify out/verify.json --out dist/custody.html --strict
  pnpm perf:custody --proof out/proofs.json --out dist/custody.html --ledger-url "./ledger.html" --release-url "https://github.com/owner/repo/releases/tag/v1"
`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main(): void {
  if (has('--help') || has('-h')) {
    usage();
    process.exit(0);
  }

  const options: Partial<CustodyCliOptions> = {
    proofPath: arg('--proof'),
    out: arg('--out'),
    planPath: arg('--plan'),
    verifyPath: arg('--verify'),
    evidenceIndexPath: arg('--evidence-index'),
    emitJson: has('--emit-json'),
    strict: has('--strict'),
    verbose: has('--verbose'),
    // Graph navigation URLs
    ledgerUrl: arg('--ledger-url'),
    releaseUrl: arg('--release-url'),
    bundleDownloadUrl: arg('--bundle-url'),
    dashboardUrl: arg('--dashboard-url'),
    custodyUrl: arg('--custody-url'),
  };

  // Validate required args
  if (!options.proofPath || !options.out) {
    console.error('Error: --proof and --out are required.');
    usage();
    process.exit(1);
  }

  const verbose = options.verbose ?? false;

  log(`Proof: ${options.proofPath}`, verbose);
  log(`Output: ${options.out}`, verbose);
  if (options.planPath) log(`Plan: ${options.planPath}`, verbose);
  if (options.verifyPath) log(`Verify: ${options.verifyPath}`, verbose);
  if (options.evidenceIndexPath) log(`Evidence Index: ${options.evidenceIndexPath}`, verbose);

  // Strict mode: check all optional inputs exist
  if (options.strict) {
    const missing: string[] = [];
    if (!options.planPath) missing.push('plan');
    if (!options.verifyPath) missing.push('verify');
    if (!options.evidenceIndexPath) missing.push('evidence-index');
    if (missing.length > 0) {
      console.error(`STRICT mode: missing inputs: ${missing.join(', ')}`);
      process.exit(1);
    }
    // Also check files exist
    if (options.planPath && !fs.existsSync(options.planPath)) {
      console.error(`STRICT mode: plan file not found: ${options.planPath}`);
      process.exit(1);
    }
    if (options.verifyPath && !fs.existsSync(options.verifyPath)) {
      console.error(`STRICT mode: verify file not found: ${options.verifyPath}`);
      process.exit(1);
    }
    if (options.evidenceIndexPath && !fs.existsSync(options.evidenceIndexPath)) {
      console.error(`STRICT mode: evidence-index file not found: ${options.evidenceIndexPath}`);
      process.exit(1);
    }
  }

  // Check proof file exists
  if (!fs.existsSync(options.proofPath)) {
    console.error(`Error: Proof file not found: ${options.proofPath}`);
    process.exit(1);
  }

  try {
    log('Generating custody model...', verbose);
    const model = generateCustody({
      proofPath: options.proofPath,
      planPath: options.planPath,
      verifyPath: options.verifyPath,
      evidenceIndexPath: options.evidenceIndexPath,
      ledgerUrl: options.ledgerUrl,
      releaseUrl: options.releaseUrl,
      bundleDownloadUrl: options.bundleDownloadUrl,
      dashboardUrl: options.dashboardUrl,
      custodyUrl: options.custodyUrl,
    });

    log(`Audit Ready: ${model.auditReady}`, verbose);
    if (!model.auditReady) {
      log(`Reasons: ${model.auditReadyReasons.join('; ')}`, verbose);
    }

    // Ensure output directory exists
    const outDir = path.dirname(options.out);
    if (outDir && !fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Write HTML
    log('Rendering HTML...', verbose);
    const html = renderCustodyHtml(model);
    fs.writeFileSync(options.out, html, 'utf8');
    log(`Wrote: ${options.out}`, verbose);

    // Write JSON if requested
    if (options.emitJson) {
      const jsonPath = options.out.replace(/\.html$/i, '.json');
      fs.writeFileSync(jsonPath, JSON.stringify(model, null, 2) + '\n', 'utf8');
      log(`Wrote: ${jsonPath}`, verbose);
    }

    // Summary
    console.log(`✅ Custody generated: ${options.out}`);
    console.log(`   Status: ${model.auditReady ? 'AUDIT READY' : 'NOT AUDIT READY'}`);
    if (!model.auditReady) {
      console.log(`   Reasons: ${model.auditReadyReasons.join('; ')}`);
    }

    process.exit(0);
  } catch (err) {
    console.error(`Error generating custody: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
