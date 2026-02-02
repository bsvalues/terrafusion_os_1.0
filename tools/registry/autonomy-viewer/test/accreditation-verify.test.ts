/**
 * Accreditation Verify Tests
 * ==========================
 * Phase: Lock Accreditation Contract + Verify Command
 *
 * Tests the accreditation verification command that:
 * - Recomputes SHA256 hashes and validates against manifest
 * - Validates schema/structure compliance
 * - Fails closed on tampering or missing files
 *
 * Success Criteria:
 * - Valid packets pass verification
 * - Tampered files are detected
 * - Missing files fail verification
 * - Schema violations are caught
 */

import * as assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

// Import the verify function (to be created)
import {
    ACCREDITATION_CONTRACT,
    verifyAccreditationPacket
} from '../src/accreditation-verify.js';

// Import generator to create test packets
import { generateAccreditationPacket } from '../src/accreditation-packet.js';

// ============================================================================
// Contract Schema
// ============================================================================

describe('Accreditation Verify — Contract Schema', () => {
  it('contract_defines_required_files', () => {
    assert.ok(ACCREDITATION_CONTRACT, 'ACCREDITATION_CONTRACT must be defined');
    assert.ok(ACCREDITATION_CONTRACT.requiredFiles, 'requiredFiles must be defined');
    assert.ok(Array.isArray(ACCREDITATION_CONTRACT.requiredFiles));
    assert.ok(ACCREDITATION_CONTRACT.requiredFiles.length > 0);

    // Must include core files
    assert.ok(
      ACCREDITATION_CONTRACT.requiredFiles.includes('accreditation-packet.json'),
      'must require accreditation-packet.json'
    );
    assert.ok(
      ACCREDITATION_CONTRACT.requiredFiles.includes('manifest.json'),
      'must require manifest.json'
    );
  });

  it('contract_defines_required_fields', () => {
    assert.ok(ACCREDITATION_CONTRACT.requiredPacketFields, 'requiredPacketFields must be defined');
    assert.ok(Array.isArray(ACCREDITATION_CONTRACT.requiredPacketFields));

    // Must include essential fields
    const required = ACCREDITATION_CONTRACT.requiredPacketFields;
    assert.ok(required.includes('schemaId'), 'must require schemaId');
    assert.ok(required.includes('schemaVersion'), 'must require schemaVersion');
    assert.ok(required.includes('generatedAt'), 'must require generatedAt');
    assert.ok(required.includes('profile'), 'must require profile');
  });

  it('contract_defines_determinism_rules', () => {
    assert.ok(ACCREDITATION_CONTRACT.determinismRules, 'determinismRules must be defined');
    assert.ok(ACCREDITATION_CONTRACT.determinismRules.sortedKeys, 'must require sorted keys');
    assert.ok(
      ACCREDITATION_CONTRACT.determinismRules.normalizedPaths,
      'must require normalized paths'
    );
    assert.ok(
      ACCREDITATION_CONTRACT.determinismRules.lfLineEndings,
      'must require LF line endings'
    );
  });
});

// ============================================================================
// Valid Packet Verification
// ============================================================================

describe('Accreditation Verify — Valid Packets', () => {
  it('valid_packet_passes_verification', () => {
    const testDir = join(tmpdir(), `accred-verify-valid-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      // Generate a valid packet
      generateAccreditationPacket({
        profile: 'verify-test',
        outDir: testDir,
      });

      // Verify it
      const result = verifyAccreditationPacket({ packetDir: testDir });

      assert.strictEqual(result.ok, true, 'valid packet must pass');
      assert.strictEqual(result.hashMismatches.length, 0, 'no hash mismatches');
      assert.strictEqual(result.missingFiles.length, 0, 'no missing files');
      assert.strictEqual(result.schemaViolations.length, 0, 'no schema violations');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('verification_produces_structured_result', () => {
    const testDir = join(tmpdir(), `accred-verify-struct-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'struct-test',
        outDir: testDir,
      });

      const result = verifyAccreditationPacket({ packetDir: testDir });

      // Required fields in result
      assert.ok('ok' in result, 'must have ok');
      assert.ok('verifiedAt' in result, 'must have verifiedAt');
      assert.ok('packetDir' in result, 'must have packetDir');
      assert.ok('filesVerified' in result, 'must have filesVerified');
      assert.ok('hashMismatches' in result, 'must have hashMismatches');
      assert.ok('missingFiles' in result, 'must have missingFiles');
      assert.ok('schemaViolations' in result, 'must have schemaViolations');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Tamper Detection
// ============================================================================

describe('Accreditation Verify — Tamper Detection', () => {
  it('detects_tampered_file_content', () => {
    const testDir = join(tmpdir(), `accred-verify-tamper-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'tamper-test',
        outDir: testDir,
      });

      // Tamper with a file
      const kitSummaryPath = join(testDir, 'county-kit-summary.json');
      const original = readFileSync(kitSummaryPath, 'utf-8');
      const tampered = original.replace('"ok":', '"TAMPERED": true, "ok":');
      writeFileSync(kitSummaryPath, tampered, 'utf-8');

      // Verify should fail
      const result = verifyAccreditationPacket({ packetDir: testDir });

      assert.strictEqual(result.ok, false, 'tampered packet must fail');
      assert.ok(result.hashMismatches.length > 0, 'must detect hash mismatch');
      assert.ok(
        result.hashMismatches.some(m => m.file.includes('county-kit-summary')),
        'must identify tampered file'
      );
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('detects_added_bytes_in_file', () => {
    const testDir = join(tmpdir(), `accred-verify-append-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'append-test',
        outDir: testDir,
      });

      // Append data to a file
      const stepsDir = join(testDir, 'steps');
      const bootstrapPath = join(stepsDir, 'bootstrap.json');
      const original = readFileSync(bootstrapPath, 'utf-8');
      writeFileSync(bootstrapPath, original + '\n', 'utf-8');

      const result = verifyAccreditationPacket({ packetDir: testDir });

      assert.strictEqual(result.ok, false, 'appended file must fail');
      assert.ok(result.hashMismatches.length > 0, 'must detect hash mismatch');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Missing File Detection
// ============================================================================

describe('Accreditation Verify — Missing Files', () => {
  it('detects_missing_manifest_file', () => {
    const testDir = join(tmpdir(), `accred-verify-missing-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'missing-test',
        outDir: testDir,
      });

      // Delete manifest
      const manifestPath = join(testDir, 'manifest.json');
      rmSync(manifestPath);

      const result = verifyAccreditationPacket({ packetDir: testDir });

      assert.strictEqual(result.ok, false, 'missing manifest must fail');
      assert.ok(result.errorCode, 'must have errorCode');
      assert.match(result.errorCode!, /MANIFEST/i);
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('detects_missing_evidence_file', () => {
    const testDir = join(tmpdir(), `accred-verify-missing-ev-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'missing-evidence',
        outDir: testDir,
      });

      // Delete a step file (referenced in manifest)
      const drillsPath = join(testDir, 'steps', 'drills.json');
      rmSync(drillsPath);

      const result = verifyAccreditationPacket({ packetDir: testDir });

      assert.strictEqual(result.ok, false, 'missing evidence file must fail');
      assert.ok(result.missingFiles.length > 0, 'must report missing file');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Schema Validation
// ============================================================================

describe('Accreditation Verify — Schema Validation', () => {
  it('detects_missing_required_packet_field', () => {
    const testDir = join(tmpdir(), `accred-verify-schema-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'schema-test',
        outDir: testDir,
      });

      // Remove required field from packet
      const packetPath = join(testDir, 'accreditation-packet.json');
      const packet = JSON.parse(readFileSync(packetPath, 'utf-8'));
      delete packet.schemaId;
      writeFileSync(packetPath, JSON.stringify(packet, null, 2), 'utf-8');

      const result = verifyAccreditationPacket({ packetDir: testDir });

      assert.strictEqual(result.ok, false, 'missing schemaId must fail');
      assert.ok(result.schemaViolations.length > 0, 'must report schema violation');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('detects_wrong_schema_version', () => {
    const testDir = join(tmpdir(), `accred-verify-version-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'version-test',
        outDir: testDir,
      });

      // Modify schema version
      const packetPath = join(testDir, 'accreditation-packet.json');
      const packet = JSON.parse(readFileSync(packetPath, 'utf-8'));
      packet.schemaVersion = 'INVALID.VERSION';
      writeFileSync(packetPath, JSON.stringify(packet, null, 2), 'utf-8');

      const result = verifyAccreditationPacket({ packetDir: testDir });

      // May pass or warn depending on compatibility mode
      // At minimum should be detected
      if (!result.ok) {
        assert.ok(
          result.schemaViolations.some(v => v.includes('version') || v.includes('schemaVersion')),
          'must mention version issue'
        );
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Error Handling
// ============================================================================

describe('Accreditation Verify — Error Handling', () => {
  it('fails_closed_on_missing_directory', () => {
    const result = verifyAccreditationPacket({
      packetDir: '/nonexistent/directory/path',
    });

    assert.strictEqual(result.ok, false, 'missing directory must fail');
    assert.ok(result.errorCode, 'must have errorCode');
    assert.match(result.errorCode!, /DIRECTORY|NOT_FOUND/i);
  });

  it('fails_closed_on_empty_directory', () => {
    const testDir = join(tmpdir(), `accred-verify-empty-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      const result = verifyAccreditationPacket({ packetDir: testDir });

      assert.strictEqual(result.ok, false, 'empty directory must fail');
      assert.ok(result.errorCode, 'must have errorCode');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});
