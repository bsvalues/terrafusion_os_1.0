// scripts/ci/tests/checkContextContract.test.ts
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Contract validation tests
 *
 * Ensures the governance contract is valid and contains the expected values.
 * This prevents accidental contract corruption or typos.
 */
describe('GOVERNANCE_CONTRACT.json', () => {
  const contractPath = path.resolve(__dirname, '../../../docs/ci/GOVERNANCE_CONTRACT.json');

  it('exists and is valid JSON', () => {
    expect(fs.existsSync(contractPath)).toBe(true);

    const raw = fs.readFileSync(contractPath, 'utf8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('declares main branch protection', () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    expect(contract.branch).toBe('main');
    expect(contract.repository).toBe('bsvalues/terrafusion_os_1.0');
  });

  it('requires scope-drift-guard as a status check', () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    expect(contract.expected).toBeDefined();
    expect(contract.expected.required_status_checks).toContain('scope-drift-guard');
  });

  it('expects strict mode to be enabled', () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    expect(contract.expected.strict).toBe(true);
  });

  it('documents the break-glass policy', () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    expect(contract.expected.enforce_admins).toBe(false);
    expect(contract.policy).toBeDefined();
    expect(contract.policy.break_glass_allowed).toBe(true);
    expect(contract.policy.break_glass_requires).toContain('audit_note');
    expect(contract.policy.break_glass_requires).toContain('screenshot');
  });

  it('has a version and sealed date for audit trail', () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    expect(contract.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(contract.sealed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('does not contain hardcoded guesses for check contexts', () => {
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    // The required check must match the exact workflow job name
    // This validates the contract is intentional, not a guess
    const checks = contract.expected.required_status_checks;

    // Known valid check contexts (add more as governance expands)
    const validContexts = ['scope-drift-guard', 'governance-proof'];

    for (const check of checks) {
      expect(validContexts).toContain(check);
    }
  });
});
