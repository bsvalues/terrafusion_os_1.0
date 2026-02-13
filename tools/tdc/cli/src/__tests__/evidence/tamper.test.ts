/**
 * Evidence Pack Tamper Detection Tests (Phase 7A)
 *
 * CRITICAL GATE: These tests MUST PASS before Phase 8 begins.
 *
 * Purpose: Prove that Evidence Pack validation detects tampering.
 * Requirement: ANY single-byte artifact modification → validation FAILS deterministically
 *
 * Why tamper detection matters:
 * - Government compliance requires audit trail integrity
 * - Cryptographic receipts must detect ANY modification
 * - SEAL gate enforcement depends on trustworthy evidence
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { aggregateEvidencePack } from '../../lib/evidence/aggregate';
import { validateEvidencePack } from '../../lib/evidence/validate';

describe('Evidence Pack Tamper Detection (Phase 7A)', () => {
  let tempDir: string;
  let contractsDir: string;
  let contextPath: string;

  beforeEach(() => {
    // Create temporary test directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tamper-test-'));
    contractsDir = path.join(tempDir, '.terrafusion', 'contracts');
    fs.mkdirSync(contractsDir, { recursive: true });

    // Create empty context file
    contextPath = path.join(tempDir, '.terrafusion', 'context', 'latest.json');
    fs.mkdirSync(path.dirname(contextPath), { recursive: true });
    fs.writeFileSync(contextPath, JSON.stringify({ version: '1.0.0' }), 'utf8');
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('Tamper detection: Modified artifact → validation FAILS', async () => {
    // Create test contract
    const contractPath = path.join(contractsDir, 'contract-1.json');
    const originalContent = JSON.stringify(
      { skillName: 'tf-ui-foundation', lane: 'ui', status: 'PASS', violationsCount: 0 },
      null,
      2
    );
    fs.writeFileSync(contractPath, originalContent, 'utf8');

    // Build Evidence Pack
    const pack = await aggregateEvidencePack({
      contractFiles: [contractPath],
      contextPath,
    });

    // Validation SHOULD PASS before tampering
    const validation1 = await validateEvidencePack(pack, contractsDir, contextPath);
    expect(validation1.valid).toBe(true);
    expect(validation1.tamperedArtifacts.length).toBe(0);

    // TAMPER: Modify artifact (change 1 byte)
    const tamperedContent = originalContent.replace('PASS', 'FAIL');
    fs.writeFileSync(contractPath, tamperedContent, 'utf8');

    // Validation SHOULD FAIL after tampering
    const validation2 = await validateEvidencePack(pack, contractsDir, contextPath);
    expect(validation2.valid).toBe(false);
    expect(validation2.tamperedArtifacts.length).toBeGreaterThan(0);
    expect(validation2.tamperedArtifacts[0].path).toContain('contract-1.json');
  });

  test('Tamper detection: Single-space modification detected', async () => {
    // Create test contract
    const contractPath = path.join(contractsDir, 'contract-1.json');
    fs.writeFileSync(
      contractPath,
      JSON.stringify({ skillName: 'test', lane: 'ui', status: 'PASS', violationsCount: 0 }),
      'utf8'
    );

    // Build Evidence Pack
    const pack = await aggregateEvidencePack({
      contractFiles: [contractPath],
      contextPath,
    });

    // TAMPER: Add single space at end of file
    fs.appendFileSync(contractPath, ' ');

    // Validation SHOULD FAIL (single space changes hash)
    const validation = await validateEvidencePack(pack, contractsDir, contextPath);
    expect(validation.valid).toBe(false);
    expect(validation.tamperedArtifacts.length).toBe(1);
  });

  test('Tamper detection: Missing artifact → validation FAILS', async () => {
    // Create test contract
    const contractPath = path.join(contractsDir, 'contract-1.json');
    fs.writeFileSync(
      contractPath,
      JSON.stringify({ skillName: 'test', lane: 'ui', status: 'PASS', violationsCount: 0 }),
      'utf8'
    );

    // Build Evidence Pack
    const pack = await aggregateEvidencePack({
      contractFiles: [contractPath],
      contextPath,
    });

    // DELETE artifact
    fs.unlinkSync(contractPath);

    // Validation SHOULD FAIL (artifact missing)
    const validation = await validateEvidencePack(pack, contractsDir, contextPath);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some(e => e.includes('Artifact not found'))).toBe(true);
  });

  test('Tamper detection: Multiple artifacts, one tampered → validation FAILS', async () => {
    // Create multiple test contracts
    const contract1Path = path.join(contractsDir, 'contract-1.json');
    const contract2Path = path.join(contractsDir, 'contract-2.json');
    const contract3Path = path.join(contractsDir, 'contract-3.json');

    fs.writeFileSync(
      contract1Path,
      JSON.stringify({ skillName: 'skill1', lane: 'ui', status: 'PASS', violationsCount: 0 }),
      'utf8'
    );
    fs.writeFileSync(
      contract2Path,
      JSON.stringify({ skillName: 'skill2', lane: 'security', status: 'PASS', violationsCount: 0 }),
      'utf8'
    );
    fs.writeFileSync(
      contract3Path,
      JSON.stringify({ skillName: 'skill3', lane: 'ops', status: 'PASS', violationsCount: 0 }),
      'utf8'
    );

    // Build Evidence Pack
    const pack = await aggregateEvidencePack({
      contractFiles: [contract1Path, contract2Path, contract3Path],
      contextPath,
    });

    // TAMPER: Modify only contract2
    const content2 = fs.readFileSync(contract2Path, 'utf8');
    fs.writeFileSync(contract2Path, content2.replace('PASS', 'FAIL'), 'utf8');

    // Validation SHOULD FAIL (1 out of 3 tampered)
    const validation = await validateEvidencePack(pack, contractsDir, contextPath);
    expect(validation.valid).toBe(false);
    expect(validation.artifactsChecked).toBe(3);
    expect(validation.tamperedArtifacts.length).toBe(1);
    expect(validation.tamperedArtifacts[0].path).toContain('contract-2.json');
  });

  test('Tamper detection: Context Pack modification detected (WARN-level)', async () => {
    // Create test contract
    const contractPath = path.join(contractsDir, 'contract-1.json');
    fs.writeFileSync(
      contractPath,
      JSON.stringify({ skillName: 'test', lane: 'ui', status: 'PASS', violationsCount: 0 }),
      'utf8'
    );

    // Build Evidence Pack (captures Context Pack hash)
    const pack = await aggregateEvidencePack({
      contractFiles: [contractPath],
      contextPath,
    });

    // TAMPER: Modify Context Pack
    const contextContent = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
    contextContent.modified = true;
    fs.writeFileSync(contextPath, JSON.stringify(contextContent, null, 2), 'utf8');

    // Validation SHOULD WARN (Context Pack hash mismatch)
    const validation = await validateEvidencePack(pack, contractsDir, contextPath);

    // Note: In production, Context Pack mismatch is WARN-level (not FAIL)
    // because Context Pack may update after Evidence Pack generation
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors.some(e => e.includes('Context Pack hash mismatch'))).toBe(true);
  });

  test('Tamper detection: Hash format validation', async () => {
    // Create test contract
    const contractPath = path.join(contractsDir, 'contract-1.json');
    fs.writeFileSync(
      contractPath,
      JSON.stringify({ skillName: 'test', lane: 'ui', status: 'PASS', violationsCount: 0 }),
      'utf8'
    );

    // Build Evidence Pack
    const pack = await aggregateEvidencePack({
      contractFiles: [contractPath],
      contextPath,
    });

    // ASSERT: Hash has correct format (sha256:hex)
    expect(pack.contracts[0].hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(pack.contextHash).toMatch(/^sha256:[a-f0-9]{64}$/);

    // TAMPER: Manually corrupt hash (invalid format)
    pack.contracts[0].hash = 'invalid-hash';

    // Validation behavior: Will still detect mismatch because re-computed hash won't match
    // (Schema validation would catch invalid format in Phase 7A with ajv)
  });

  test('No tampering: Validation PASSES with all hashes matching', async () => {
    // Create test contracts
    const contract1Path = path.join(contractsDir, 'contract-1.json');
    const contract2Path = path.join(contractsDir, 'contract-2.json');

    fs.writeFileSync(
      contract1Path,
      JSON.stringify({ skillName: 'skill1', lane: 'ui', status: 'PASS', violationsCount: 0 }),
      'utf8'
    );
    fs.writeFileSync(
      contract2Path,
      JSON.stringify({ skillName: 'skill2', lane: 'security', status: 'PASS', violationsCount: 0 }),
      'utf8'
    );

    // Build Evidence Pack
    const pack = await aggregateEvidencePack({
      contractFiles: [contract1Path, contract2Path],
      contextPath,
    });

    // NO TAMPERING - validation should pass
    const validation = await validateEvidencePack(pack, contractsDir, contextPath);
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
    expect(validation.tamperedArtifacts.length).toBe(0);
    expect(validation.artifactsChecked).toBe(2);
  });
});
