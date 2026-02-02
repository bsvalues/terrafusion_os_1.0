/**
 * Accreditation Reference Compat Tests
 * =====================================
 * Phase: Reference Packet Lock + Compat Gate
 *
 * These tests ensure that:
 * - Generated packets remain compatible with the reference lock
 * - Structural changes don't break verification semantics
 * - Upgrade policy is enforced
 *
 * Run with: npx tsx --test test/accreditation-compat.test.ts
 */

import * as assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { generateAccreditationPacket } from '../src/accreditation-packet.js';
import { ACCREDITATION_CONTRACT, verifyAccreditationPacket } from '../src/accreditation-verify.js';

// Load reference lock
const lockPath = join(import.meta.dirname, '..', 'ACCREDITATION_REFERENCE.lock.json');
const referenceLock = JSON.parse(readFileSync(lockPath, 'utf-8'));

// ============================================================================
// Reference Contract Compliance
// ============================================================================

describe('Accreditation Compat — Reference Contract', () => {
  it('contract_matches_reference_lock_schema_version', () => {
    assert.ok(
      referenceLock.contract.supportedVersions.includes(
        ACCREDITATION_CONTRACT.supportedSchemaVersions[0]
      ),
      `Contract version ${ACCREDITATION_CONTRACT.supportedSchemaVersions[0]} must be in reference lock supportedVersions`
    );
  });

  it('contract_required_files_subset_of_reference', () => {
    for (const file of ACCREDITATION_CONTRACT.requiredFiles) {
      assert.ok(
        referenceLock.contract.requiredFiles.includes(file),
        `Required file '${file}' must be in reference lock`
      );
    }
  });

  it('contract_required_fields_subset_of_reference', () => {
    for (const field of ACCREDITATION_CONTRACT.requiredPacketFields) {
      assert.ok(
        referenceLock.contract.requiredPacketFields.includes(field),
        `Required field '${field}' must be in reference lock`
      );
    }
  });

  it('determinism_rules_match_reference', () => {
    assert.strictEqual(
      ACCREDITATION_CONTRACT.determinismRules.sortedKeys,
      referenceLock.determinismRules.sortedKeys,
      'sortedKeys rule must match'
    );
    assert.strictEqual(
      ACCREDITATION_CONTRACT.determinismRules.normalizedPaths,
      referenceLock.determinismRules.normalizedPaths,
      'normalizedPaths rule must match'
    );
    assert.strictEqual(
      ACCREDITATION_CONTRACT.determinismRules.lfLineEndings,
      referenceLock.determinismRules.lfLineEndings,
      'lfLineEndings rule must match'
    );
  });
});

// ============================================================================
// Generated Packet Structure
// ============================================================================

describe('Accreditation Compat — Generated Packet Structure', () => {
  it('generated_packet_contains_all_reference_files', () => {
    const testDir = join(tmpdir(), `accred-compat-files-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'compat-test',
        outDir: testDir,
      });

      for (const expectedFile of referenceLock.referencePacket.expectedFileList) {
        const filePath = join(testDir, expectedFile);
        assert.ok(
          existsSync(filePath),
          `Reference file '${expectedFile}' must exist in generated packet`
        );
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('generated_packet_has_at_least_reference_file_count', () => {
    const testDir = join(tmpdir(), `accred-compat-count-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'compat-test',
        outDir: testDir,
      });

      // Read generated manifest
      const manifestPath = join(testDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      assert.ok(
        manifest.fileCount >= referenceLock.referencePacket.expectedFileCount,
        `File count (${manifest.fileCount}) must be >= reference (${referenceLock.referencePacket.expectedFileCount})`
      );
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('generated_packet_has_required_packet_fields', () => {
    const testDir = join(tmpdir(), `accred-compat-fields-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'compat-test',
        outDir: testDir,
      });

      const packetPath = join(testDir, 'accreditation-packet.json');
      const packet = JSON.parse(readFileSync(packetPath, 'utf-8'));

      for (const field of referenceLock.contract.requiredPacketFields) {
        assert.ok(field in packet, `Required field '${field}' must exist in generated packet`);
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('generated_manifest_has_required_fields', () => {
    const testDir = join(tmpdir(), `accred-compat-manifest-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'compat-test',
        outDir: testDir,
      });

      const manifestPath = join(testDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      for (const field of referenceLock.contract.requiredManifestFields) {
        assert.ok(field in manifest, `Required manifest field '${field}' must exist`);
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('generated_manifest_files_have_required_fields', () => {
    const testDir = join(tmpdir(), `accred-compat-manifest-files-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'compat-test',
        outDir: testDir,
      });

      const manifestPath = join(testDir, 'manifest.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

      for (const file of manifest.files) {
        for (const field of referenceLock.contract.requiredManifestFileFields) {
          assert.ok(
            field in file,
            `Required manifest file field '${field}' must exist in ${file.path}`
          );
        }
      }
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Verify Compat
// ============================================================================

describe('Accreditation Compat — Verifier', () => {
  it('verifier_accepts_fresh_generated_packet', () => {
    const testDir = join(tmpdir(), `accred-compat-verify-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'compat-test',
        outDir: testDir,
      });

      const result = verifyAccreditationPacket({ packetDir: testDir });

      assert.strictEqual(result.ok, true, 'Freshly generated packet must pass verification');
      assert.strictEqual(result.hashMismatches.length, 0, 'No hash mismatches');
      assert.strictEqual(result.missingFiles.length, 0, 'No missing files');
      assert.strictEqual(result.schemaViolations.length, 0, 'No schema violations');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('verifier_reports_correct_file_count', () => {
    const testDir = join(tmpdir(), `accred-compat-count-verify-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'compat-test',
        outDir: testDir,
      });

      const result = verifyAccreditationPacket({ packetDir: testDir });

      assert.ok(
        result.filesVerified >= referenceLock.referencePacket.expectedFileCount,
        `Files verified (${result.filesVerified}) must be >= reference (${referenceLock.referencePacket.expectedFileCount})`
      );
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

// ============================================================================
// Schema Version Compat
// ============================================================================

describe('Accreditation Compat — Schema Version', () => {
  it('generated_packet_uses_supported_schema_version', () => {
    const testDir = join(tmpdir(), `accred-compat-version-${randomUUID()}`);
    mkdirSync(testDir, { recursive: true });

    try {
      generateAccreditationPacket({
        profile: 'compat-test',
        outDir: testDir,
      });

      const packetPath = join(testDir, 'accreditation-packet.json');
      const packet = JSON.parse(readFileSync(packetPath, 'utf-8'));

      assert.ok(
        referenceLock.contract.supportedVersions.includes(packet.schemaVersion),
        `Schema version '${packet.schemaVersion}' must be in supported versions`
      );
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('lock_file_schema_matches_contract', () => {
    assert.strictEqual(
      referenceLock.contract.schemaId,
      'terrafusion.autonomy.accreditation-packet.v1',
      'Lock schema ID must match expected'
    );
    assert.strictEqual(
      referenceLock.contract.schemaVersion,
      '4N51.1',
      'Lock schema version must be 4N51.1'
    );
  });
});
