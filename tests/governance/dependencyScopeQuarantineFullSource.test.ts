import { describe, expect, it } from 'vitest';
import { processFullInventory } from '../../scripts/governance/dependencyScopeQuarantine.mjs';

describe('Dependency Scope Full Source Parsing', () => {
  it('correctly processes full JSON inventory and applies promotions', () => {
    const mockData = [
      { root: 'pkg1', bucket: 'QUARANTINE', evidence: { scoreLocal: 1, scoreTotal: 1 } },
      { root: 'pkg2', bucket: 'QUARANTINE', evidence: { scoreLocal: 1, scoreTotal: 1 } },
      { root: 'pkg3', bucket: 'CORE', evidence: { scoreLocal: 1, scoreTotal: 1 } },
    ];

    const promotions = {
      pkg2: 'DEV', // Promote pkg2 out of quarantine
    };

    const result = processFullInventory(mockData, promotions);

    // pkg1 should be QUARANTINE
    // pkg2 should be DEV (not quarantine)
    // pkg3 should be CORE (not quarantine)

    expect(result.quarantineCount).toBe(1);
    expect(result.quarantineItems.length).toBe(1);
    expect(result.quarantineItems[0].package).toBe('pkg1');
  });

  it('handles empty inventory', () => {
    const result = processFullInventory([], {});
    expect(result.quarantineCount).toBe(0);
  });
});
