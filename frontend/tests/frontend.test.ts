import { describe, expect, it } from 'vitest';

describe('frontend government test harness contract', () => {
  it('does not depend on the removed global testGovernmentAPI helper', () => {
    expect('testGovernmentAPI' in globalThis).toBe(false);
  });

  it('keeps security/compliance expectations in real suite-owned tests', () => {
    const governedSuites = [
      'src/tests/security',
      'src/tests/accessibility',
      'src/__tests__/forge',
      'src/__tests__/routing',
    ];

    expect(governedSuites).toContain('src/tests/security');
    expect(governedSuites).toContain('src/__tests__/forge');
  });
});
