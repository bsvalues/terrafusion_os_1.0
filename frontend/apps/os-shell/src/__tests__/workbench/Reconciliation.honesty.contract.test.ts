import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

describe('Forge reconciliation honesty contract', () => {
  it('Reconciliation does not retain Benton fixture indications', () => {
    const src = readSrc('pages/workbench/tabs/forge/Reconciliation.tsx');
    expect(src).not.toContain('FIXTURE_INDICATIONS');
    expect(src).not.toContain('using estimated data');
  });

  it('Reconciliation renders an explicit unavailable state when live approach data is missing', () => {
    const src = readSrc('pages/workbench/tabs/forge/Reconciliation.tsx');
    expect(src).toContain('forge-reconciliation-unavailable');
    expect(src).toContain('Live cost, sales, and income indications are required for this lane');
    expect(src).toContain("type ReconciliationReadState = 'loading' | 'live' | 'unavailable'");
  });

  it('useForgeValuation exposes unavailable instead of fallback when no governed response exists', () => {
    const src = readSrc('hooks/forge/useForgeValuation.ts');
    expect(src).toContain("source: 'live' | 'unavailable'");
    expect(src).toContain("source: query.data ? 'live' : 'unavailable'");
    expect(src).not.toContain("source = \"fallback\"");
    expect(src).not.toContain('component should use its own fallback data');
  });

  it('ForgeOverview marks the valuation summary unavailable instead of demo-backed fallback', () => {
    const src = readSrc('pages/workbench/tabs/forge/ForgeOverview.tsx');
    expect(src).toContain(": 'unavailable' as const;");
    expect(src).toContain('Valuation data unavailable from the live workbench API.');
  });
});
