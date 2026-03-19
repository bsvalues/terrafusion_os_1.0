/**
 * Phase 6 Debt Contract Tests
 *
 * Proves: catch(error: any) eliminated from production files.
 * We test the source text because TypeScript types are erased at runtime.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SRC = resolve(__dirname, '../..');

function readSrc(rel: string) {
  return readFileSync(resolve(SRC, rel), 'utf8');
}

describe('Phase 6 — Debt Contract', () => {
  describe('catch (error: any) eliminated', () => {
    const targets = [
      'api/researchServices.ts',
      'components/test/APIConnectionTest.tsx',
      'hooks/useBackendConnection.tsx',
    ];

    it.each(targets)('%s has no catch(error: any)', (file) => {
      const src = readSrc(file);
      expect(src).not.toMatch(/catch\s*\(\s*error\s*:\s*any\s*\)/);
    });
  });

  describe('useCostForgeAPI: Record<string, any> eliminated', () => {
    it('useCostForgeAPI.ts has no Record<string, any>', () => {
      const src = readSrc('hooks/useCostForgeAPI.ts');
      expect(src).not.toMatch(/Record<string,\s*any>/);
    });

    it('useCostForgeAPI.ts has no APIResponse<any>', () => {
      const src = readSrc('hooks/useCostForgeAPI.ts');
      expect(src).not.toMatch(/APIResponse<any>/);
    });
  });

  describe('console noise eliminated', () => {
    it('GovernmentAIStatus.tsx: no console.info loading noise', () => {
      const src = readSrc('components/ai/GovernmentAIStatus.tsx');
      expect(src).not.toMatch(/console\.info\('📊 Government AI: Loading/);
    });

    it('PropertyForge.tsx: no console.debug value indicator', () => {
      const src = readSrc('pages/workbench/tabs/PropertyForge.tsx');
      expect(src).not.toMatch(/console\.debug\(`\[Forge\] Value indicated/);
    });

    it('useCostForgeAPI.ts: no console.debug perf timing', () => {
      const src = readSrc('hooks/useCostForgeAPI.ts');
      expect(src).not.toMatch(/console\.debug\(\s*`\[CostForge API\]/);
    });
  });
});
