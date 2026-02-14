/**
 * Evidence Pack Validator
 *
 * Verifies cryptographic integrity of Evidence Packs:
 * 1. Re-computes SHA-256 hashes for all referenced artifacts
 * 2. Compares computed hashes with stored hashes
 * 3. Validates Context Pack hash
 * 4. Validates JSON against contract schema (Phase 7A will add ajv validation)
 *
 * ANY hash mismatch = FAIL (tamper detection)
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { EvidencePack } from './aggregate';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  artifactsChecked: number;
  tamperedArtifacts: Array<{
    path: string;
    expectedHash: string;
    actualHash: string;
  }>;
}

/**
 * Compute SHA-256 hash of a file
 */
function hashFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Artifact not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Validate Evidence Pack cryptographic integrity
 */
export async function validateEvidencePack(
  evidencePack: EvidencePack,
  contractsDir: string,
  contextPath: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const tamperedArtifacts: ValidationResult['tamperedArtifacts'] = [];
  let artifactsChecked = 0;

  // 1. Validate Evidence Pack structure (basic schema check)
  if (!evidencePack.contractVersion) {
    errors.push('Missing contractVersion');
  }
  if (!evidencePack.generatedAt) {
    errors.push('Missing generatedAt timestamp');
  }
  if (!evidencePack.overallStatus) {
    errors.push('Missing overallStatus');
  }
  if (!Array.isArray(evidencePack.contracts)) {
    errors.push('contracts must be an array');
    return { valid: false, errors, artifactsChecked: 0, tamperedArtifacts };
  }

  // 2. Validate all contract artifact hashes
  for (const contract of evidencePack.contracts) {
    artifactsChecked++;

    const artifactPath = path.isAbsolute(contract.artifactPath)
      ? contract.artifactPath
      : path.join(process.cwd(), contract.artifactPath);

    // Check artifact exists
    if (!fs.existsSync(artifactPath)) {
      errors.push(`Artifact not found: ${contract.artifactPath}`);
      continue;
    }

    // Re-compute hash
    try {
      const actualHash = hashFile(artifactPath);
      const expectedHash = contract.hash;

      if (actualHash !== expectedHash) {
        tamperedArtifacts.push({
          path: contract.artifactPath,
          expectedHash,
          actualHash,
        });
      }
    } catch (error: any) {
      errors.push(`Failed to hash artifact ${contract.artifactPath}: ${error.message}`);
    }
  }

  // 3. Validate Context Pack hash (if Context Pack exists)
  if (evidencePack.contextHash && fs.existsSync(contextPath)) {
    try {
      const actualContextHash = hashFile(contextPath);
      const expectedContextHash = evidencePack.contextHash;

      if (actualContextHash !== expectedContextHash) {
        errors.push(
          `Context Pack hash mismatch (expected: ${expectedContextHash}, actual: ${actualContextHash})`
        );
        // Note: This is WARN-level in production (Context Pack may update after pack generation)
        // For Phase 7A hardening, we'll make this configurable
      }
    } catch (error: any) {
      errors.push(`Failed to validate Context Pack hash: ${error.message}`);
    }
  }

  // 4. Check for tampering
  if (tamperedArtifacts.length > 0) {
    errors.push(`${tamperedArtifacts.length} artifact(s) have been tampered with`);
  }

  const valid = errors.length === 0 && tamperedArtifacts.length === 0;

  return {
    valid,
    errors,
    artifactsChecked,
    tamperedArtifacts,
  };
}

/**
 * Validate Evidence Pack against JSON Schema (Phase 7A)
 *
 * This will be implemented in Phase 7A with ajv JSON Schema validator.
 * For now, we do basic structure validation above.
 */
export async function validateEvidencePackSchema(evidencePack: EvidencePack): Promise<boolean> {
  // TODO: Phase 7A - Add ajv JSON Schema validation
  // const Ajv = require('ajv');
  // const ajv = new Ajv();
  // const schema = require('../../../../dx/skills/tf-pr-evidence-pack/evidence-pack.contract.json');
  // const validate = ajv.compile(schema);
  // return validate(evidencePack);

  return true; // Basic validation passes for now
}
