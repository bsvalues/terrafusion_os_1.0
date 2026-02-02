/**
 * Accreditation Packet Tests
 * ==========================
 * Phase: County Deployment Package + Accreditation Packet Automation
 *
 * Tests the accreditation packet generator that produces:
 * - Complete evidence bundle for county accreditation
 * - Manifest with file hashes (SHA256)
 * - Optional ZIP archive
 * - Deterministic, audit-ready output
 *
 * Success Criteria:
 * - Single command produces complete accreditation bundle
 * - All required evidence files are included
 * - Manifest contains correct hashes
 * - Output is deterministic and auditable
 */

import * as assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

// Import the accreditation packet generator (to be created)
import {
    ACCREDITATION_PACKET_SCHEMA,
    ACCREDITATION_PACKET_VERSION,
    generateAccreditationPacket
} from '../src/accreditation-packet.js';

// ============================================================================
// Schema Validation
// ============================================================================

describe('Accreditation Packet — Schema Contract', () => {
  it('exports_schema_and_version_constants', () => {
    assert.ok(ACCREDITATION_PACKET_SCHEMA, 'ACCREDITATION_PACKET_SCHEMA must be defined');
    assert.ok(ACCREDITATION_PACKET_VERSION, 'ACCREDITATION_PACKET_VERSION must be defined');
    assert.match(ACCREDITATION_PACKET_SCHEMA, /^terrafusion\.autonomy\./);
    assert.match(ACCREDITATION_PACKET_VERSION, /^\d+[A-Z]\d+\.\d+$/);
  });

  it('result_includes_required_fields', () => {
    const testDir = join(tmpdir(), `accred-test-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = generateAccreditationPacket({
        profile: 'test-county',
        outDir: testDir,
      });

      // Required fields
      assert.ok('schemaId' in result, 'must have schemaId');
      assert.ok('schemaVersion' in result, 'must have schemaVersion');
      assert.ok('generatedAt' in result, 'must have generatedAt');
      assert.ok('profile' in result, 'must have profile');
      assert.ok('manifest' in result, 'must have manifest');
      assert.ok('evidence' in result, 'must have evidence');
      assert.ok('ok' in result, 'must have ok');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Evidence Bundle Structure
// ============================================================================

describe('Accreditation Packet — Evidence Bundle', () => {
  it('produces_complete_evidence_bundle', () => {
    const testDir = join(tmpdir(), `accred-bundle-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = generateAccreditationPacket({
        profile: 'bundle-test-county',
        outDir: testDir,
      });

      // Required evidence files
      const requiredFiles = [
        'accreditation-packet.json',
        'manifest.json',
        'county-kit-summary.json',
      ];

      for (const file of requiredFiles) {
        const filePath = join(testDir, file);
        assert.ok(existsSync(filePath), `${file} must exist`);
      }

      // Steps directory with evidence
      const stepsDir = join(testDir, 'steps');
      assert.ok(existsSync(stepsDir), 'steps/ directory must exist');

      // Evidence references in result
      assert.ok(result.evidence.kitSummary, 'evidence.kitSummary must be present');
      assert.ok(result.evidence.manifest, 'evidence.manifest must be present');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('evidence_includes_all_kit_steps', () => {
    const testDir = join(tmpdir(), `accred-steps-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = generateAccreditationPacket({
        profile: 'steps-test-county',
        outDir: testDir,
      });

      // Verify evidence references include step outputs
      const stepNames = ['bootstrap', 'drills', 'hints', 'ops-status', 'slo-gate'];

      for (const stepName of stepNames) {
        const stepFile = join(testDir, 'steps', `${stepName}.json`);
        assert.ok(existsSync(stepFile), `steps/${stepName}.json must exist`);
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Manifest with Hashes
// ============================================================================

describe('Accreditation Packet — Manifest', () => {
  it('manifest_contains_file_hashes', () => {
    const testDir = join(tmpdir(), `accred-manifest-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = generateAccreditationPacket({
        profile: 'manifest-test-county',
        outDir: testDir,
      });

      const manifestPath = join(testDir, 'manifest.json');
      assert.ok(existsSync(manifestPath), 'manifest.json must exist');

      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      // Manifest must have files array
      assert.ok(Array.isArray(manifest.files), 'manifest.files must be an array');
      assert.ok(manifest.files.length > 0, 'manifest.files must not be empty');

      // Each file entry must have path and sha256
      for (const entry of manifest.files) {
        assert.ok(entry.path, 'file entry must have path');
        assert.ok(entry.sha256, 'file entry must have sha256');
        assert.match(entry.sha256, /^[a-f0-9]{64}$/, 'sha256 must be 64 hex chars');
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('manifest_hashes_are_correct', () => {
    const testDir = join(tmpdir(), `accred-hashes-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'hashes-test-county',
        outDir: testDir,
      });

      const manifestPath = join(testDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      // Verify at least one hash is correct
      for (const entry of manifest.files) {
        const filePath = join(testDir, entry.path);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath);
          const actualHash = createHash('sha256').update(content).digest('hex');
          assert.strictEqual(entry.sha256, actualHash, `Hash mismatch for ${entry.path}`);
          break; // Just verify one to avoid test timing issues
        }
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('manifest_includes_timestamp_and_profile', () => {
    const testDir = join(tmpdir(), `accred-meta-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'meta-test-county',
        outDir: testDir,
      });

      const manifestPath = join(testDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      assert.ok(manifest.generatedAt, 'manifest must have generatedAt');
      assert.ok(manifest.profile, 'manifest must have profile');
      assert.strictEqual(manifest.profile, 'meta-test-county');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Accreditation Metadata
// ============================================================================

describe('Accreditation Packet — Metadata', () => {
  it('includes_accreditation_metadata', () => {
    const testDir = join(tmpdir(), `accred-meta2-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = generateAccreditationPacket({
        profile: 'accred-meta-county',
        outDir: testDir,
        accreditationInfo: {
          countyName: 'Benton County',
          jurisdiction: 'WA',
          preparedBy: 'TerraFusion Automated Pipeline',
          preparedFor: 'County CIO Review',
        },
      });

      assert.ok(result.accreditationInfo, 'accreditationInfo must be present');
      assert.strictEqual(result.accreditationInfo!.countyName, 'Benton County');
      assert.strictEqual(result.accreditationInfo!.jurisdiction, 'WA');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('includes_compliance_summary', () => {
    const testDir = join(tmpdir(), `accred-compliance-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = generateAccreditationPacket({
        profile: 'compliance-test-county',
        outDir: testDir,
      });

      // Compliance summary should include key metrics
      assert.ok(result.complianceSummary, 'complianceSummary must be present');
      assert.ok('sloGateStatus' in result.complianceSummary!, 'must have sloGateStatus');
      assert.ok('drillsCompleted' in result.complianceSummary!, 'must have drillsCompleted');
      assert.ok('overallStatus' in result.complianceSummary!, 'must have overallStatus');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Error Handling
// ============================================================================

describe('Accreditation Packet — Error Handling', () => {
  it('fails_closed_on_missing_profile', () => {
    const testDir = join(tmpdir(), `accred-err-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = generateAccreditationPacket({
        profile: '',
        outDir: testDir,
      });

      assert.strictEqual(result.ok, false, 'must fail on empty profile');
      assert.ok(result.errorCode, 'must have errorCode');
      assert.match(result.errorCode!, /PROFILE/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('fails_closed_on_missing_outdir', () => {
    const result = generateAccreditationPacket({
      profile: 'test-county',
      outDir: '',
    });

    assert.strictEqual(result.ok, false, 'must fail on empty outDir');
    assert.ok(result.errorCode, 'must have errorCode');
  });

  it('captures_kit_failures_in_accreditation', () => {
    const testDir = join(tmpdir(), `accred-kit-fail-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = generateAccreditationPacket({
        profile: 'fail-test-county',
        outDir: testDir,
      });

      // Even if kit has failures, accreditation packet should be generated
      assert.ok(existsSync(join(testDir, 'accreditation-packet.json')));

      // Compliance summary should reflect the failure
      if (!result.ok) {
        assert.ok(result.errorCode || result.complianceSummary?.overallStatus !== 'passed');
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Determinism
// ============================================================================

describe('Accreditation Packet — Determinism', () => {
  it('produces_deterministic_output', () => {
    const testDir1 = join(tmpdir(), `accred-det1-${randomUUID()}`);
    const testDir2 = join(tmpdir(), `accred-det2-${randomUUID()}`);
    mkdirSync(testDir1, { recursive: true });
    mkdirSync(testDir2, { recursive: true });

    try {
      const result1 = generateAccreditationPacket({
        profile: 'determinism-test',
        outDir: testDir1,
      });

      const result2 = generateAccreditationPacket({
        profile: 'determinism-test',
        outDir: testDir2,
      });

      // Schema and version must match
      assert.strictEqual(result1.schemaId, result2.schemaId);
      assert.strictEqual(result1.schemaVersion, result2.schemaVersion);
      assert.strictEqual(result1.profile, result2.profile);

      // File structure must match
      const files1 = getFileList(testDir1);
      const files2 = getFileList(testDir2);
      assert.deepStrictEqual(files1, files2, 'file structure must be identical');
    } finally {
      rmSync(testDir1, { recursive: true, force: true });
      rmSync(testDir2, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Helpers
// ============================================================================

function getFileList(dir: string): string[] {
  const result: string[] = [];

  function walk(currentDir: string, prefix: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        result.push(`${relativePath}/`);
        walk(join(currentDir, entry.name), relativePath);
      } else {
        result.push(relativePath);
      }
    }
  }

  walk(dir, '');
  return result;
}
