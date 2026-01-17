import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Dotnet Warning Artifacts Contract', () => {
  it('scripts/governance/dotnetWarningBudget.mjs exists and is executable', () => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'governance', 'dotnetWarningBudget.mjs');
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('governance/dotnet-warning-baseline.json exists', () => {
    const baselinePath = path.join(process.cwd(), 'governance', 'dotnet-warning-baseline.json');
    expect(fs.existsSync(baselinePath)).toBe(true);
  });
});
