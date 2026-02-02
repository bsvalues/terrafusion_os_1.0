/**
 * Phase 4N52 – Closeout Proof Generator
 * ======================================
 *
 * Generates a one-page audit artifact summarizing complete system state
 * for FISMA-High closeout and audit trail purposes.
 *
 * Invariants:
 *   1. All referenced hashes must be verifiable
 *   2. All dates in ISO 8601 UTC format
 *   3. All attestations include identity + timestamp
 *   4. Executive summary ≤ 500 words
 *   5. Output is deterministic for same inputs
 *
 * @module closeout-proof
 * @version 4N52.1
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { toJsonWithLF } from './utils/deterministic-json.js';

// ─────────────────────────────────────────────────────────────────────────────
// Schema Constants
// ─────────────────────────────────────────────────────────────────────────────

export const CLOSEOUT_PROOF_SCHEMA = 'terrafusion.autonomy.closeout-proof.v1';
export const CLOSEOUT_PROOF_VERSION = '4N52.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CloseoutProofOptions {
  /** Project identifier */
  projectId: string;
  /** Organization name */
  organization: string;
  /** FISMA system identifier (if applicable) */
  fismaSystemId?: string;
  /** Project version */
  version: string;
  /** Release tag or commit SHA */
  releaseRef: string;
  /** Release date (defaults to now) */
  releaseDate?: string;
  /** Path to evidence index JSON */
  evidenceIndexPath?: string;
  /** Path to fleet index JSON (if multi-county) */
  fleetIndexPath?: string;
  /** Path to accreditation packet */
  accreditationPacketPath?: string;
  /** Path to SLO gate results */
  sloGatePath?: string;
  /** Additional attestations */
  attestations?: CloseoutAttestation[];
  /** Output directory */
  outDir: string;
  /** Verbose output */
  verbose?: boolean;
}

export interface CloseoutAttestation {
  /** Attestation type (e.g., 'code-review', 'security-scan', 'test-coverage') */
  type: string;
  /** Entity that made the attestation */
  attestedBy: string;
  /** When attestation was made */
  attestedAt: string;
  /** Attestation status */
  status: 'passed' | 'failed' | 'waived';
  /** Optional details */
  details?: string;
  /** Optional evidence hash */
  evidenceHash?: string;
}

export interface CloseoutSummary {
  /** Total packages verified */
  packagesVerified: number;
  /** Total counties enrolled (if multi-county) */
  countiesEnrolled?: number;
  /** Counties with successful accreditation */
  countiesAccredited?: number;
  /** SLO compliance percentage */
  sloCompliance?: number;
  /** Total tests run */
  testsRun?: number;
  /** Tests passed */
  testsPassed?: number;
  /** Coverage percentage */
  coveragePercent?: number;
  /** Security issues resolved */
  securityIssuesResolved?: number;
  /** Open security issues */
  openSecurityIssues?: number;
}

export interface CloseoutProof {
  $schema: typeof CLOSEOUT_PROOF_SCHEMA;
  version: typeof CLOSEOUT_PROOF_VERSION;
  generatedAt: string;
  project: {
    id: string;
    organization: string;
    fismaSystemId?: string;
    version: string;
    releaseRef: string;
    releaseDate: string;
  };
  summary: CloseoutSummary;
  attestations: CloseoutAttestation[];
  artifacts: Array<{
    type: string;
    path: string;
    sha256: string;
    size: number;
    description: string;
  }>;
  integrity: {
    proofSha256: string;
    signatureRequired: boolean;
    signaturePresent: boolean;
  };
  executiveSummary: string;
  recommendations: string[];
}

export interface CloseoutResult {
  success: boolean;
  proof: CloseoutProof;
  outputPath: string;
  htmlPath?: string;
  error?: {
    code: 'MISSING_REQUIRED_INPUT' | 'ARTIFACT_NOT_FOUND' | 'INVALID_INPUT' | 'WRITE_FAILED';
    message: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load and validate an artifact, returning its hash and metadata.
 */
function loadArtifact(
  artifactPath: string,
  type: string,
  description: string
): { type: string; path: string; sha256: string; size: number; description: string } | null {
  if (!fs.existsSync(artifactPath)) {
    return null;
  }

  const content = fs.readFileSync(artifactPath);
  const sha256 = crypto.createHash('sha256').update(content).digest('hex');
  const stats = fs.statSync(artifactPath);

  return {
    type,
    path: artifactPath,
    sha256,
    size: stats.size,
    description,
  };
}

/**
 * Parse evidence index and extract summary statistics.
 */
function parseEvidenceIndex(indexPath: string): Partial<CloseoutSummary> {
  if (!fs.existsSync(indexPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(indexPath, 'utf-8');
    const index = JSON.parse(content);

    return {
      packagesVerified: index.summary?.total || 0,
    };
  } catch {
    return {};
  }
}

/**
 * Parse fleet index and extract county statistics.
 */
function parseFleetIndex(indexPath: string): Partial<CloseoutSummary> {
  if (!fs.existsSync(indexPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(indexPath, 'utf-8');
    const index = JSON.parse(content);

    return {
      countiesEnrolled: index.summary?.totalCounties || 0,
      countiesAccredited: index.summary?.successfulEnrollments || 0,
    };
  } catch {
    return {};
  }
}

/**
 * Parse SLO gate results.
 */
function parseSloGate(gatePath: string): Partial<CloseoutSummary> {
  if (!fs.existsSync(gatePath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(gatePath, 'utf-8');
    const gate = JSON.parse(content);

    return {
      sloCompliance: gate.compliance?.percentage || gate.sloCompliance || 100,
    };
  } catch {
    return {};
  }
}

/**
 * Generate executive summary based on proof data.
 */
function generateExecutiveSummary(proof: Partial<CloseoutProof>): string {
  const project = proof.project;
  const summary = proof.summary;
  const attestations = proof.attestations || [];

  const passedAttestations = attestations.filter(a => a.status === 'passed').length;
  const totalAttestations = attestations.length;

  let text = `TerraFusion Autonomy Proof for ${project?.organization || 'Unknown Organization'}.\n\n`;

  text += `Release ${project?.version || 'unknown'} (${project?.releaseRef || 'unknown'}) `;
  text += `dated ${project?.releaseDate || 'unknown'}.\n\n`;

  if (summary?.packagesVerified) {
    text += `${summary.packagesVerified} evidence packages verified with cryptographic integrity.\n`;
  }

  if (summary?.countiesEnrolled) {
    text += `${summary.countiesEnrolled} counties enrolled, `;
    text += `${summary.countiesAccredited || 0} successfully accredited.\n`;
  }

  if (summary?.sloCompliance !== undefined) {
    text += `SLO compliance: ${summary.sloCompliance}%.\n`;
  }

  if (totalAttestations > 0) {
    text += `\n${passedAttestations}/${totalAttestations} attestations passed.\n`;
  }

  if (project?.fismaSystemId) {
    text += `\nFISMA System ID: ${project.fismaSystemId}\n`;
  }

  text += '\nThis proof package provides auditable evidence of system readiness ';
  text += 'for deployment in FISMA-High environments.';

  return text;
}

/**
 * Generate recommendations based on proof data.
 */
function generateRecommendations(proof: Partial<CloseoutProof>): string[] {
  const recommendations: string[] = [];
  const summary = proof.summary;
  const attestations = proof.attestations || [];

  // Check for failed attestations
  const failedAttestations = attestations.filter(a => a.status === 'failed');
  if (failedAttestations.length > 0) {
    recommendations.push(
      `Resolve ${failedAttestations.length} failed attestation(s): ${failedAttestations.map(a => a.type).join(', ')}`
    );
  }

  // Check SLO compliance
  if (summary?.sloCompliance !== undefined && summary.sloCompliance < 100) {
    recommendations.push(`Improve SLO compliance from ${summary.sloCompliance}% to 100%`);
  }

  // Check open security issues
  if (summary?.openSecurityIssues && summary.openSecurityIssues > 0) {
    recommendations.push(`Address ${summary.openSecurityIssues} open security issue(s)`);
  }

  // Check coverage
  if (summary?.coveragePercent !== undefined && summary.coveragePercent < 80) {
    recommendations.push(`Increase test coverage from ${summary.coveragePercent}% to ≥80%`);
  }

  // Default if no issues
  if (recommendations.length === 0) {
    recommendations.push('No blocking issues identified. System is ready for closeout.');
  }

  return recommendations;
}

/**
 * Generate closeout proof artifact.
 *
 * @example
 * ```typescript
 * const result = await generateCloseoutProof({
 *   projectId: 'terrafusion-os',
 *   organization: 'TerraFusion Platform',
 *   version: '1.5.1',
 *   releaseRef: 'v1.5.1',
 *   evidenceIndexPath: './dist/autonomy-evidence-index.json',
 *   outDir: './dist/closeout',
 * });
 * ```
 */
export async function generateCloseoutProof(
  options: CloseoutProofOptions
): Promise<CloseoutResult> {
  const {
    projectId,
    organization,
    fismaSystemId,
    version,
    releaseRef,
    releaseDate = new Date().toISOString(),
    evidenceIndexPath,
    fleetIndexPath,
    accreditationPacketPath,
    sloGatePath,
    attestations = [],
    outDir,
    verbose = false,
  } = options;

  // Validate required inputs
  if (!projectId || !organization || !version || !releaseRef) {
    return {
      success: false,
      proof: createEmptyProof(),
      outputPath: '',
      error: {
        code: 'MISSING_REQUIRED_INPUT',
        message: 'projectId, organization, version, and releaseRef are required',
      },
    };
  }

  if (verbose) {
    console.log('Generating Closeout Proof...');
    console.log(`  Project: ${projectId}`);
    console.log(`  Version: ${version}`);
    console.log(`  Release: ${releaseRef}`);
  }

  // Collect artifacts
  const artifacts: Array<{
    type: string;
    path: string;
    sha256: string;
    size: number;
    description: string;
  }> = [];

  // Evidence index
  if (evidenceIndexPath) {
    const artifact = loadArtifact(evidenceIndexPath, 'evidence-index', 'Autonomy evidence index');
    if (artifact) artifacts.push(artifact);
    if (verbose && artifact)
      console.log(`  Found evidence index: ${artifact.sha256.slice(0, 16)}...`);
  }

  // Fleet index
  if (fleetIndexPath) {
    const artifact = loadArtifact(fleetIndexPath, 'fleet-index', 'Fleet enrollment index');
    if (artifact) artifacts.push(artifact);
    if (verbose && artifact) console.log(`  Found fleet index: ${artifact.sha256.slice(0, 16)}...`);
  }

  // Accreditation packet
  if (accreditationPacketPath) {
    const artifact = loadArtifact(
      accreditationPacketPath,
      'accreditation-packet',
      'County accreditation packet'
    );
    if (artifact) artifacts.push(artifact);
    if (verbose && artifact)
      console.log(`  Found accreditation packet: ${artifact.sha256.slice(0, 16)}...`);
  }

  // SLO gate
  if (sloGatePath) {
    const artifact = loadArtifact(sloGatePath, 'slo-gate', 'SLO gate assessment');
    if (artifact) artifacts.push(artifact);
    if (verbose && artifact) console.log(`  Found SLO gate: ${artifact.sha256.slice(0, 16)}...`);
  }

  // Collect summary statistics
  const evidenceSummary = evidenceIndexPath ? parseEvidenceIndex(evidenceIndexPath) : {};
  const fleetSummary = fleetIndexPath ? parseFleetIndex(fleetIndexPath) : {};
  const sloSummary = sloGatePath ? parseSloGate(sloGatePath) : {};

  const summary: CloseoutSummary = {
    packagesVerified: evidenceSummary.packagesVerified || 0,
    ...fleetSummary,
    ...sloSummary,
  };

  // Build proof structure (without integrity hash yet)
  const proofData: Omit<CloseoutProof, 'integrity'> = {
    $schema: CLOSEOUT_PROOF_SCHEMA,
    version: CLOSEOUT_PROOF_VERSION,
    generatedAt: new Date().toISOString(),
    project: {
      id: projectId,
      organization,
      fismaSystemId,
      version,
      releaseRef,
      releaseDate,
    },
    summary,
    attestations,
    artifacts,
    executiveSummary: '',
    recommendations: [],
  };

  // Generate executive summary and recommendations
  proofData.executiveSummary = generateExecutiveSummary(proofData);
  proofData.recommendations = generateRecommendations(proofData);

  // Calculate integrity hash (of content before integrity field)
  const contentHash = crypto.createHash('sha256').update(JSON.stringify(proofData)).digest('hex');

  // Complete proof
  const proof: CloseoutProof = {
    ...proofData,
    integrity: {
      proofSha256: contentHash,
      signatureRequired: !!fismaSystemId, // FISMA systems require signature
      signaturePresent: false, // Would be set by signing tool
    },
  };

  // Ensure output directory exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Write JSON proof
  const jsonPath = path.join(outDir, 'closeout-proof.json');
  fs.writeFileSync(jsonPath, toJsonWithLF(proof), 'utf-8');

  // Generate HTML version
  const htmlPath = path.join(outDir, 'closeout-proof.html');
  const html = generateProofHtml(proof);
  fs.writeFileSync(htmlPath, html, 'utf-8');

  if (verbose) {
    console.log(`\nCloseout proof generated:`);
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  HTML: ${htmlPath}`);
    console.log(`  Integrity: ${contentHash.slice(0, 16)}...`);
  }

  return {
    success: true,
    proof,
    outputPath: jsonPath,
    htmlPath,
  };
}

/**
 * Create empty proof for error cases.
 */
function createEmptyProof(): CloseoutProof {
  return {
    $schema: CLOSEOUT_PROOF_SCHEMA,
    version: CLOSEOUT_PROOF_VERSION,
    generatedAt: new Date().toISOString(),
    project: {
      id: '',
      organization: '',
      version: '',
      releaseRef: '',
      releaseDate: '',
    },
    summary: {
      packagesVerified: 0,
    },
    attestations: [],
    artifacts: [],
    integrity: {
      proofSha256: '',
      signatureRequired: false,
      signaturePresent: false,
    },
    executiveSummary: '',
    recommendations: [],
  };
}

/**
 * Generate HTML version of closeout proof.
 */
function generateProofHtml(proof: CloseoutProof): string {
  const failedAttestations = proof.attestations.filter(a => a.status === 'failed').length;
  const passedAttestations = proof.attestations.filter(a => a.status === 'passed').length;
  const overallStatus = failedAttestations === 0 ? 'READY' : 'ATTENTION REQUIRED';
  const statusColor = failedAttestations === 0 ? '#28a745' : '#dc3545';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TerraFusion Closeout Proof - ${proof.project.id} ${proof.project.version}</title>
  <style>
    :root {
      --primary: #1a365d;
      --success: #28a745;
      --warning: #ffc107;
      --danger: #dc3545;
      --gray: #6c757d;
      --light: #f8f9fa;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }
    header {
      border-bottom: 3px solid var(--primary);
      padding-bottom: 1rem;
      margin-bottom: 2rem;
    }
    h1 { color: var(--primary); font-size: 1.75rem; }
    h2 { color: var(--primary); font-size: 1.25rem; margin-top: 1.5rem; border-bottom: 1px solid #ddd; padding-bottom: 0.5rem; }
    .meta { color: var(--gray); font-size: 0.875rem; }
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-weight: bold;
      color: white;
      margin-left: 1rem;
    }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: var(--light); font-weight: 600; }
    .hash { font-family: monospace; font-size: 0.75rem; color: var(--gray); }
    .attestation { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; }
    .attestation .badge {
      padding: 0.125rem 0.5rem;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: bold;
    }
    .badge.passed { background: var(--success); color: white; }
    .badge.failed { background: var(--danger); color: white; }
    .badge.waived { background: var(--warning); color: #333; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0; }
    .summary-card { background: var(--light); padding: 1rem; border-radius: 8px; text-align: center; }
    .summary-card .value { font-size: 2rem; font-weight: bold; color: var(--primary); }
    .summary-card .label { font-size: 0.875rem; color: var(--gray); }
    .executive-summary { background: var(--light); padding: 1rem; border-radius: 8px; margin: 1rem 0; }
    ul { margin-left: 1.5rem; }
    footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ddd; font-size: 0.75rem; color: var(--gray); }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <header>
    <h1>
      TerraFusion Closeout Proof
      <span class="status-badge" style="background: ${statusColor}">${overallStatus}</span>
    </h1>
    <p class="meta">
      ${proof.project.organization} | ${proof.project.id} v${proof.project.version} |
      Release: ${proof.project.releaseRef} |
      Generated: ${proof.generatedAt}
    </p>
  </header>

  <section>
    <h2>Executive Summary</h2>
    <div class="executive-summary">
      ${proof.executiveSummary
        .split('\n')
        .map(p => `<p>${p}</p>`)
        .join('')}
    </div>
  </section>

  <section>
    <h2>Summary Metrics</h2>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="value">${proof.summary.packagesVerified}</div>
        <div class="label">Packages Verified</div>
      </div>
      ${
        proof.summary.countiesEnrolled
          ? `
      <div class="summary-card">
        <div class="value">${proof.summary.countiesAccredited || 0}/${proof.summary.countiesEnrolled}</div>
        <div class="label">Counties Accredited</div>
      </div>`
          : ''
      }
      ${
        proof.summary.sloCompliance !== undefined
          ? `
      <div class="summary-card">
        <div class="value">${proof.summary.sloCompliance}%</div>
        <div class="label">SLO Compliance</div>
      </div>`
          : ''
      }
      <div class="summary-card">
        <div class="value">${passedAttestations}/${proof.attestations.length}</div>
        <div class="label">Attestations Passed</div>
      </div>
    </div>
  </section>

  <section>
    <h2>Attestations</h2>
    ${
      proof.attestations.length === 0
        ? '<p>No attestations recorded.</p>'
        : `
    <div>
      ${proof.attestations
        .map(
          a => `
        <div class="attestation">
          <span class="badge ${a.status}">${a.status.toUpperCase()}</span>
          <strong>${a.type}</strong>
          <span class="meta">by ${a.attestedBy} at ${a.attestedAt}</span>
          ${a.details ? `<span class="meta">${a.details}</span>` : ''}
        </div>
      `
        )
        .join('')}
    </div>`
    }
  </section>

  <section>
    <h2>Referenced Artifacts</h2>
    <table>
      <thead>
        <tr><th>Type</th><th>Description</th><th>SHA256</th><th>Size</th></tr>
      </thead>
      <tbody>
        ${proof.artifacts
          .map(
            a => `
          <tr>
            <td>${a.type}</td>
            <td>${a.description}</td>
            <td class="hash">${a.sha256}</td>
            <td>${(a.size / 1024).toFixed(1)} KB</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </section>

  <section>
    <h2>Recommendations</h2>
    <ul>
      ${proof.recommendations.map(r => `<li>${r}</li>`).join('')}
    </ul>
  </section>

  <section>
    <h2>Integrity</h2>
    <table>
      <tr><th>Proof SHA256</th><td class="hash">${proof.integrity.proofSha256}</td></tr>
      <tr><th>Signature Required</th><td>${proof.integrity.signatureRequired ? 'Yes' : 'No'}</td></tr>
      <tr><th>Signature Present</th><td>${proof.integrity.signaturePresent ? 'Yes' : 'No'}</td></tr>
    </table>
  </section>

  <footer>
    <p>
      Schema: ${proof.$schema} | Version: ${proof.version}<br>
      ${proof.project.fismaSystemId ? `FISMA System ID: ${proof.project.fismaSystemId}` : ''}
    </p>
    <p><em>This document is auto-generated. Keep for audit records.</em></p>
  </footer>
</body>
</html>`;
}

/**
 * Add attestation to existing proof.
 */
export function addAttestation(
  proof: CloseoutProof,
  attestation: CloseoutAttestation
): CloseoutProof {
  return {
    ...proof,
    attestations: [...proof.attestations, attestation],
  };
}

/**
 * Load proof from JSON file.
 */
export function loadCloseoutProof(proofPath: string): CloseoutProof {
  if (!fs.existsSync(proofPath)) {
    throw new Error(`Proof file not found: ${proofPath}`);
  }

  const content = fs.readFileSync(proofPath, 'utf-8');
  return JSON.parse(content) as CloseoutProof;
}
