import { describe, expect, it } from 'vitest';

interface Attestation {
  id: string;
  date: string;
  author: string;
  items: Array<{
    package: string;
    from: string;
    to: string;
    roots: string[];
    rationale: string;
  }>;
}

const validateAttestation = (json: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!json.id) errors.push('Missing id');
  if (!json.date) errors.push('Missing date');
  if (!json.author) errors.push('Missing author');
  if (!Array.isArray(json.items)) {
    errors.push('Missing items array');
  } else {
    json.items.forEach((item: any, idx: number) => {
      if (!item.package) errors.push(`Item ${idx}: Missing package`);
      if (item.from !== 'QUARANTINE') errors.push(`Item ${idx}: Must promote from QUARANTINE`);
      if (!['DEV', 'PLUGIN', 'CORE'].includes(item.to))
        errors.push(`Item ${idx}: Invalid target bucket ${item.to}`);
      if (!item.rationale || item.rationale.length < 10)
        errors.push(`Item ${idx}: Rationale too short`);
    });
  }
  return { valid: errors.length === 0, errors };
};

describe('Dependency Scope Attestation Contract', () => {
  it('accepts valid attestation', () => {
    const valid = {
      id: 'ATT-001',
      date: '2026-01-18',
      author: 'GitHub Copilot',
      items: [
        {
          package: 'pkg-a',
          from: 'QUARANTINE',
          to: 'DEV',
          roots: ['Dev/A'],
          rationale: 'Used only for testing',
        },
      ],
    };
    const result = validateAttestation(valid);
    expect(result.valid).toBe(true);
  });

  it('rejects invalid transitions', () => {
    const invalid = {
      id: 'ATT-002',
      date: '2026-01-18',
      author: 'GitHub Copilot',
      items: [
        {
          package: 'pkg-a',
          from: 'DEV', // Invalid start
          to: 'DEV',
          roots: ['Dev/A'],
          rationale: 'Used only for testing',
        },
      ],
    };
    const result = validateAttestation(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Item 0: Must promote from QUARANTINE');
  });
});
