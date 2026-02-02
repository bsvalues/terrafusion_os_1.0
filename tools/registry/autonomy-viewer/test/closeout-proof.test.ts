/**
 * Phase 4N52 – Closeout Proof Tests
 * ==================================
 *
 * Contract coverage:
 *   1. generateCloseoutProof() validates required inputs
 *   2. Proof includes project metadata
 *   3. Proof includes artifact hashes
 *   4. Proof includes attestations
 *   5. Executive summary is generated
 *   6. Recommendations are generated
 *   7. Integrity hash is computed
 *   8. HTML output is generated
 *   9. loadCloseoutProof() loads from file
 *  10. addAttestation() appends to proof
 */

import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  addAttestation,
  CLOSEOUT_PROOF_SCHEMA,
  CLOSEOUT_PROOF_VERSION,
  generateCloseoutProof,
  loadCloseoutProof,
  type CloseoutAttestation,
} from '../src/closeout-proof.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test fixtures
const TEST_FIXTURES = path.join(__dirname, '.closeout-test-fixtures');
const TEST_OUTPUT = path.join(__dirname, '.closeout-test-output');

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

function setupTestFixtures(): void {
  cleanupTestFixtures();

  fs.mkdirSync(TEST_FIXTURES, { recursive: true });
  fs.mkdirSync(TEST_OUTPUT, { recursive: true });

  // Create mock evidence index
  const evidenceIndex = {
    $schema: 'terrafusion.autonomy.evidence-index.v1',
    summary: { total: 42 },
    records: [],
  };
  fs.writeFileSync(
    path.join(TEST_FIXTURES, 'evidence-index.json'),
    JSON.stringify(evidenceIndex, null, 2)
  );

  // Create mock fleet index
  const fleetIndex = {
    $schema: 'terrafusion.autonomy.fleet-index.v1',
    summary: {
      totalCounties: 10,
      successfulEnrollments: 8,
      failedEnrollments: 2,
    },
    entries: [],
  };
  fs.writeFileSync(path.join(TEST_FIXTURES, 'fleet-index.json'), JSON.stringify(fleetIndex, null, 2));

  // Create mock SLO gate
  const sloGate = {
    sloCompliance: 95,
    checks: [],
  };
  fs.writeFileSync(path.join(TEST_FIXTURES, 'slo-gate.json'), JSON.stringify(sloGate, null, 2));
}

function cleanupTestFixtures(): void {
  for (const dir of [TEST_FIXTURES, TEST_OUTPUT]) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Schema Constants
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Closeout Proof Schema', () => {
  it('exports proof schema constant', () => {
    assert.strictEqual(CLOSEOUT_PROOF_SCHEMA, 'terrafusion.autonomy.closeout-proof.v1');
  });

  it('exports version constant', () => {
    assert.strictEqual(CLOSEOUT_PROOF_VERSION, '4N52.1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Input Validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Input Validation', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('fails with MISSING_REQUIRED_INPUT when projectId missing', async () => {
    const result = await generateCloseoutProof({
      projectId: '',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error?.code, 'MISSING_REQUIRED_INPUT');
  });

  it('fails with MISSING_REQUIRED_INPUT when organization missing', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: '',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error?.code, 'MISSING_REQUIRED_INPUT');
  });

  it('fails with MISSING_REQUIRED_INPUT when version missing', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, false);
  });

  it('fails with MISSING_REQUIRED_INPUT when releaseRef missing', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: '',
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Proof Generation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Proof Generation', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('generates proof with correct schema', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.proof.$schema, CLOSEOUT_PROOF_SCHEMA);
    assert.strictEqual(result.proof.version, CLOSEOUT_PROOF_VERSION);
  });

  it('includes project metadata', async () => {
    const result = await generateCloseoutProof({
      projectId: 'terrafusion-os',
      organization: 'TerraFusion Platform',
      fismaSystemId: 'FISMA-2024-001',
      version: '1.5.1',
      releaseRef: 'v1.5.1',
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.proof.project.id, 'terrafusion-os');
    assert.strictEqual(result.proof.project.organization, 'TerraFusion Platform');
    assert.strictEqual(result.proof.project.fismaSystemId, 'FISMA-2024-001');
    assert.strictEqual(result.proof.project.version, '1.5.1');
    assert.strictEqual(result.proof.project.releaseRef, 'v1.5.1');
  });

  it('includes generatedAt timestamp', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    assert.ok(result.proof.generatedAt);
    const date = new Date(result.proof.generatedAt);
    assert.ok(!isNaN(date.getTime()));
  });

  it('creates output files', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, true);
    assert.ok(fs.existsSync(result.outputPath));
    assert.ok(fs.existsSync(result.htmlPath as string));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Artifact Handling
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Artifact Handling', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('includes evidence index artifact', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      evidenceIndexPath: path.join(TEST_FIXTURES, 'evidence-index.json'),
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, true);
    const artifact = result.proof.artifacts.find(a => a.type === 'evidence-index');
    assert.ok(artifact);
    assert.ok(artifact.sha256);
    assert.ok(artifact.size > 0);
  });

  it('includes fleet index artifact', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      fleetIndexPath: path.join(TEST_FIXTURES, 'fleet-index.json'),
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, true);
    const artifact = result.proof.artifacts.find(a => a.type === 'fleet-index');
    assert.ok(artifact);
  });

  it('extracts summary from evidence index', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      evidenceIndexPath: path.join(TEST_FIXTURES, 'evidence-index.json'),
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.proof.summary.packagesVerified, 42);
  });

  it('extracts summary from fleet index', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      fleetIndexPath: path.join(TEST_FIXTURES, 'fleet-index.json'),
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.proof.summary.countiesEnrolled, 10);
    assert.strictEqual(result.proof.summary.countiesAccredited, 8);
  });

  it('extracts SLO compliance', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      sloGatePath: path.join(TEST_FIXTURES, 'slo-gate.json'),
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.proof.summary.sloCompliance, 95);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Attestations
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Attestations', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('includes attestations in proof', async () => {
    const attestations: CloseoutAttestation[] = [
      {
        type: 'security-scan',
        attestedBy: 'Snyk CI',
        attestedAt: '2024-01-01T00:00:00Z',
        status: 'passed',
      },
      {
        type: 'code-review',
        attestedBy: 'PR#123',
        attestedAt: '2024-01-01T00:00:00Z',
        status: 'passed',
      },
    ];

    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      attestations,
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.proof.attestations.length, 2);
    assert.strictEqual(result.proof.attestations[0].type, 'security-scan');
    assert.strictEqual(result.proof.attestations[1].type, 'code-review');
  });

  it('failed attestation generates recommendation', async () => {
    const attestations: CloseoutAttestation[] = [
      {
        type: 'security-scan',
        attestedBy: 'Snyk CI',
        attestedAt: '2024-01-01T00:00:00Z',
        status: 'failed',
      },
    ];

    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      attestations,
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.success, true);
    const rec = result.proof.recommendations.find(r => r.includes('failed attestation'));
    assert.ok(rec);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Executive Summary & Recommendations
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Executive Summary', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('generates executive summary', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    assert.ok(result.proof.executiveSummary);
    assert.ok(result.proof.executiveSummary.includes('Test Org'));
    assert.ok(result.proof.executiveSummary.includes('1.0.0'));
  });

  it('includes FISMA system ID in summary when provided', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      fismaSystemId: 'FISMA-2024-ABC',
      outDir: TEST_OUTPUT,
    });

    assert.ok(result.proof.executiveSummary.includes('FISMA-2024-ABC'));
  });

  it('generates default recommendation when no issues', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    assert.ok(result.proof.recommendations.length > 0);
    const readyRec = result.proof.recommendations.find(r => r.includes('ready for closeout'));
    assert.ok(readyRec);
  });

  it('generates SLO recommendation when below 100%', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      sloGatePath: path.join(TEST_FIXTURES, 'slo-gate.json'),
      outDir: TEST_OUTPUT,
    });

    const rec = result.proof.recommendations.find(r => r.includes('SLO compliance'));
    assert.ok(rec);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Integrity
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Integrity', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('computes integrity hash', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    assert.ok(result.proof.integrity.proofSha256);
    assert.match(result.proof.integrity.proofSha256, /^[a-f0-9]{64}$/i);
  });

  it('signatureRequired true when FISMA system ID provided', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      fismaSystemId: 'FISMA-123',
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.proof.integrity.signatureRequired, true);
  });

  it('signatureRequired false when no FISMA system ID', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    assert.strictEqual(result.proof.integrity.signatureRequired, false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: HTML Output
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – HTML Output', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('generates HTML file', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    assert.ok(result.htmlPath);
    assert.ok(fs.existsSync(result.htmlPath));
  });

  it('HTML contains project info', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    const html = fs.readFileSync(result.htmlPath as string, 'utf-8');
    assert.ok(html.includes('Test Org'));
    assert.ok(html.includes('test-project'));
    assert.ok(html.includes('v1.0.0'));
  });

  it('HTML contains integrity hash', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    const html = fs.readFileSync(result.htmlPath as string, 'utf-8');
    assert.ok(html.includes(result.proof.integrity.proofSha256));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Load and Add
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Load and Modify', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('loadCloseoutProof loads from file', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    const loaded = loadCloseoutProof(result.outputPath);
    assert.strictEqual(loaded.$schema, CLOSEOUT_PROOF_SCHEMA);
    assert.strictEqual(loaded.project.id, 'test-project');
  });

  it('loadCloseoutProof throws for missing file', () => {
    assert.throws(() => loadCloseoutProof('/nonexistent/path.json'), /not found/);
  });

  it('addAttestation appends to proof', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    const newAttestation: CloseoutAttestation = {
      type: 'final-review',
      attestedBy: 'Manager',
      attestedAt: '2024-01-02T00:00:00Z',
      status: 'passed',
    };

    const updated = addAttestation(result.proof, newAttestation);
    assert.strictEqual(updated.attestations.length, result.proof.attestations.length + 1);
    assert.strictEqual(updated.attestations[updated.attestations.length - 1].type, 'final-review');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Determinism
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N52 – Determinism', () => {
  beforeEach(() => setupTestFixtures());
  afterEach(() => cleanupTestFixtures());

  it('JSON output has trailing newline', async () => {
    const result = await generateCloseoutProof({
      projectId: 'test-project',
      organization: 'Test Org',
      version: '1.0.0',
      releaseRef: 'v1.0.0',
      outDir: TEST_OUTPUT,
    });

    const content = fs.readFileSync(result.outputPath, 'utf-8');
    assert.ok(content.endsWith('\n'));
  });
});
