import { describe, expect, it } from 'vitest';

// Replicating logic from dotnetWarningBudget.mjs to test it in isolation
const parseWarnings = output => {
  const match = output.match(/\s+(\d+)\s+Warning\(s\)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 0;
};

const checkBudget = (current, baseline, budget = 0) => {
  const diff = current - baseline;
  if (diff > budget) {
    return {
      pass: false,
      message: `Warning count ${current} exceeds baseline ${baseline} + budget ${budget} (diff: +${diff})`,
    };
  }
  return {
    pass: true,
    message: `Warning count ${current} is within budget (baseline: ${baseline}, budget: ${budget}, diff: ${diff > 0 ? '+' : ''}${diff})`,
  };
};

describe('Dotnet Warning Parser', () => {
  it('extracts warning count correctly from standard output', () => {
    const output = `
Build succeeded.
    123 Warning(s)
    0 Error(s)
`;
    expect(parseWarnings(output)).toBe(123);
  });

  it('handling zero warnings', () => {
    const output = `
Build succeeded.
    0 Warning(s)
    0 Error(s)
`;
    expect(parseWarnings(output)).toBe(0);
  });

  it('handling minimal output', () => {
    const output = `Build FAILED.`;
    expect(parseWarnings(output)).toBe(0);
  });
});

describe('Budget Check Logic', () => {
  it('passes when equal to baseline', () => {
    const result = checkBudget(1000, 1000, 0);
    expect(result.pass).toBe(true);
  });

  it('passes when less than baseline', () => {
    const result = checkBudget(990, 1000, 0);
    expect(result.pass).toBe(true);
  });

  it('fails when exceeding baseline with 0 budget', () => {
    const result = checkBudget(1001, 1000, 0);
    expect(result.pass).toBe(false);
  });

  it('passes when exceeding baseline but within budget', () => {
    const result = checkBudget(1005, 1000, 10);
    expect(result.pass).toBe(true);
  });
});
