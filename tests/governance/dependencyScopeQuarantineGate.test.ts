import { describe, expect, it } from 'vitest';
import { checkGate } from '../../scripts/governance/dependencyScopeQuarantine.mjs';

describe('Dependency Scope Quarantine Gate Logic', () => {
  const baseline = { quarantineCount: 100, hash: 'abc' };

  it('passes when count equals baseline (Strict Pass)', () => {
    const budget = { maxNewQuarantineItems: 0, allowDrift: false };
    const result = checkGate(100, baseline, budget);
    expect(result.pass).toBe(true);
  });

  it('fails when count increases (Strict Fail)', () => {
    const budget = { maxNewQuarantineItems: 0, allowDrift: false };
    const result = checkGate(101, baseline, budget);
    expect(result.pass).toBe(false);
    expect(result.message).toMatch(/increased by 1/);
  });

  it('passes when count increases within budget', () => {
    const budget = { maxNewQuarantineItems: 5, allowDrift: false };
    const result = checkGate(105, baseline, budget);
    expect(result.pass).toBe(true);
  });

  it('fails when count decreases but drift is disallowed (Drift Fail)', () => {
    const budget = { maxNewQuarantineItems: 0, allowDrift: false };
    const result = checkGate(99, baseline, budget);
    expect(result.pass).toBe(false);
    expect(result.message).toMatch(/drift detected/i);
  });

  it('passes when count decreases and drift is allowed', () => {
    const budget = { maxNewQuarantineItems: 0, allowDrift: true };
    const result = checkGate(99, baseline, budget);
    expect(result.pass).toBe(true);
  });
});
