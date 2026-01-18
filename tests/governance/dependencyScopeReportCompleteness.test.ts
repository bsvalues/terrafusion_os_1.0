import { describe, expect, it } from 'vitest';
import { parseReport } from '../../scripts/governance/dependencyScopeQuarantine.mjs';

describe('Dependency Scope Report Completeness', () => {
  it('detects truncation when totals > samples', () => {
    const truncatedReport = `
## Totals
- CORE_OS_RUNTIME: 5
- QUARANTINE: 100

## Top Evidence Samples
- item1 -> QUARANTINE (local=1; total=1; wiring=none)
- item2 -> QUARANTINE (local=1; total=1; wiring=none)
`;

    const result = parseReport(truncatedReport);

    // Assert that the parsed samples count is 2 (what we actually loaded)
    expect(result.samples.length).toBe(2);
    expect(result.totals['QUARANTINE']).toBe(2);

    // Assert that truncation is detected (header said 100, we found 2)
    expect(result.truncationDetected).toBe(true);
  });

  it('considers report complete when totals match samples', () => {
    const completeReport = `
## Totals
- QUARANTINE: 2

## Top Evidence Samples
- item1 -> QUARANTINE (local=1; total=1; wiring=none)
- item2 -> QUARANTINE (local=1; total=1; wiring=none)
`;
    const result = parseReport(completeReport);
    expect(result.truncationDetected).toBe(false);
  });
});
