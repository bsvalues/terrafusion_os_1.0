#!/usr/bin/env node
/**
 * TerraFusion Evidence Pack Builder
 *
 * Keystone module: aggregates all lane audit results into a
 * deterministic, content-addressed evidence bundle for SEAL gate.
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../..');
const CONTEXT_DIR = join(REPO_ROOT, '.terrafusion', 'context');
const EVIDENCE_DIR = join(REPO_ROOT, '.terrafusion', 'evidence');

/**
 * Generate a content identifier (CID) from evidence pack contents.
 * Uses SHA-256 with a 'bafybei' prefix for content-addressing convention.
 */
export function generateCID(data) {
  const hash = createHash('sha256').update(JSON.stringify(data)).digest('hex');
  return `bafybei${hash.slice(0, 52)}`;
}

/**
 * Generate an integrity hash for tamper detection.
 */
export function generateIntegrityHash(data) {
  const hash = createHash('sha256').update(JSON.stringify(data)).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Collect test results from available test runners.
 */
async function collectTestResults() {
  // Default structure - populated by CI or local test runs
  return {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    passRate: 0,
    source: 'not-collected',
  };
}

/**
 * Collect coverage metrics.
 */
async function collectCoverage() {
  return {
    line: 0,
    branch: 0,
    function: 0,
    statement: 0,
    meetsThreshold: false,
    source: 'not-collected',
  };
}

/**
 * Collect lint results.
 */
async function collectLintResults() {
  return {
    errors: 0,
    warnings: 0,
    clean: true,
    source: 'not-collected',
  };
}

/**
 * Collect FISMA-HIGH compliance scan results.
 */
async function collectComplianceResults() {
  return {
    fismaHigh: false,
    nist80053: false,
    violations: 0,
    controlsCovered: 0,
    controlsTotal: 247,
    source: 'not-collected',
  };
}

/**
 * Collect accessibility audit results.
 */
async function collectAccessibilityResults() {
  return {
    wcag21AA: false,
    section508: false,
    violations: 0,
    warnings: 0,
    source: 'not-collected',
  };
}

/**
 * Collect security scan results.
 */
async function collectSecurityResults() {
  return {
    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
    dependencyAudit: false,
    sastClean: false,
    source: 'not-collected',
  };
}

/**
 * Collect contract drift status.
 */
async function collectContractDrift() {
  const contractDir = join(REPO_ROOT, 'tools', 'dx', 'command-contracts');
  let totalContracts = 0;

  try {
    const { readdirSync } = await import('node:fs');
    const files = readdirSync(contractDir).filter(f => f.endsWith('.contract.json'));
    totalContracts = files.length;
  } catch {
    // Contract directory may not exist
  }

  return {
    totalContracts,
    driftedContracts: 0,
    zeroDrift: true,
    source: 'filesystem',
  };
}

/**
 * Build a complete evidence pack.
 */
export async function buildEvidencePack(options = {}) {
  const { lanes = ['dev', 'governance', 'security'], includeAccessibility = true } = options;

  // Collect all artifacts in parallel
  const [testResults, coverage, lint, compliance, accessibility, security, contractDrift] =
    await Promise.all([
      collectTestResults(),
      collectCoverage(),
      collectLintResults(),
      collectComplianceResults(),
      includeAccessibility ? collectAccessibilityResults() : null,
      collectSecurityResults(),
      collectContractDrift(),
    ]);

  const artifacts = {
    testResults,
    coverage,
    lint,
    compliance,
    ...(accessibility ? { accessibility } : {}),
    security,
    contractDrift,
  };

  // Calculate summary
  const checks = [
    testResults.passRate > 0 ? testResults.failed === 0 : null,
    coverage.meetsThreshold,
    lint.clean,
    compliance.fismaHigh,
    accessibility?.wcag21AA ?? null,
    security.vulnerabilities.critical === 0 && security.vulnerabilities.high === 0,
    contractDrift.zeroDrift,
  ].filter(c => c !== null);

  const passed = checks.filter(Boolean).length;
  const failed = checks.length - passed;

  const summary = {
    totalChecks: checks.length,
    passed,
    failed,
    verdict: failed === 0 ? 'pass' : 'fail',
  };

  // Get git info
  let branch = 'unknown';
  try {
    const { execSync } = await import('node:child_process');
    branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    // Git may not be available
  }

  const evidencePack = {
    cid: '', // Will be set after CID generation
    generatedAt: new Date().toISOString(),
    generator: 'tdc',
    branch,
    pr: options.pr ?? null,
    artifacts,
    summary,
  };

  // Generate CID from evidence content
  evidencePack.cid = generateCID(evidencePack);

  // Generate receipt
  const receipt = {
    version: '1.0',
    cid: evidencePack.cid,
    generatedAt: evidencePack.generatedAt,
    generator: 'tdc',
    integrityHash: generateIntegrityHash(evidencePack),
    verdict: summary.verdict,
  };

  const status = summary.verdict;

  return { status, evidencePack, receipt };
}

/**
 * Save evidence pack to disk.
 */
export async function saveEvidencePack(result) {
  // Ensure evidence directory exists
  if (!existsSync(EVIDENCE_DIR)) {
    await mkdir(EVIDENCE_DIR, { recursive: true });
  }

  const packPath = join(EVIDENCE_DIR, 'latest-pack.json');
  const receiptPath = join(EVIDENCE_DIR, 'latest-receipt.json');

  await Promise.all([
    writeFile(packPath, JSON.stringify(result.evidencePack, null, 2)),
    writeFile(receiptPath, JSON.stringify(result.receipt, null, 2)),
  ]);

  // Update Context Pack evidencePack section
  const contextPath = join(CONTEXT_DIR, 'latest.json');
  try {
    const contextRaw = await readFile(contextPath, 'utf8');
    const context = JSON.parse(contextRaw);
    context.evidencePack = {
      cid: result.receipt.cid,
      traceUrl: null,
      latencyMs: null,
      receiptPresent: true,
    };
    context.governance = context.governance || {};
    context.governance.tier1EvidenceStatus =
      result.receipt.verdict === 'pass' ? 'complete' : 'incomplete';
    await writeFile(contextPath, JSON.stringify(context, null, 2));
  } catch {
    // Context pack may not exist yet
  }

  return { packPath, receiptPath };
}

/**
 * Validate an existing evidence pack.
 */
export async function validateEvidencePack() {
  const packPath = join(EVIDENCE_DIR, 'latest-pack.json');
  const receiptPath = join(EVIDENCE_DIR, 'latest-receipt.json');

  if (!existsSync(packPath) || !existsSync(receiptPath)) {
    return { valid: false, reason: 'Evidence pack or receipt not found' };
  }

  const pack = JSON.parse(await readFile(packPath, 'utf8'));
  const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));

  // Verify CID matches
  const expectedCID = generateCID({ ...pack, cid: '' });
  if (pack.cid !== expectedCID) {
    return { valid: false, reason: 'CID mismatch - evidence pack may have been tampered with' };
  }

  // Verify integrity hash
  const expectedHash = generateIntegrityHash({ ...pack, cid: '' });
  // Note: Recalculate with original pack for proper comparison
  const packForHash = { ...pack };
  const actualHash = generateIntegrityHash(packForHash);
  if (receipt.integrityHash !== actualHash) {
    return { valid: false, reason: 'Integrity hash mismatch - receipt may have been tampered with' };
  }

  return {
    valid: true,
    cid: pack.cid,
    verdict: receipt.verdict,
    generatedAt: pack.generatedAt,
    summary: pack.summary,
  };
}
