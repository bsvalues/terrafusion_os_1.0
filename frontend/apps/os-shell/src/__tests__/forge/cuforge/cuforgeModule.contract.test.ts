import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const TERRAFORGE_ROOT = resolve(import.meta.dirname, '../../../../../../apps/terraforge/src');

function read(relPath: string): string {
  return readFileSync(resolve(TERRAFORGE_ROOT, relPath), 'utf-8');
}

function exists(relPath: string): boolean {
  return existsSync(resolve(TERRAFORGE_ROOT, relPath));
}

describe('CUForge module contract', () => {
  describe('file structure', () => {
    it('has CurrentUsePage.tsx as the main entry', () => {
      expect(exists('pages/CurrentUsePage.tsx')).toBe(true);
    });

    it('has CurrentUseInterestPage.tsx for interest rate management', () => {
      expect(exists('pages/CurrentUseInterestPage.tsx')).toBe(true);
    });

    it('has CurrentUseRemovalsPage.tsx for removal tracking', () => {
      expect(exists('pages/CurrentUseRemovalsPage.tsx')).toBe(true);
    });
  });

  describe('routing integration', () => {
    it('App.tsx imports all three CUForge pages', () => {
      const app = read('App.tsx');
      expect(app).toContain("import CurrentUsePage from './pages/CurrentUsePage'");
      expect(app).toContain("import CurrentUseInterestPage from './pages/CurrentUseInterestPage'");
      expect(app).toContain("import CurrentUseRemovalsPage from './pages/CurrentUseRemovalsPage'");
    });

    it('App.tsx registers /current-use routes', () => {
      const app = read('App.tsx');
      expect(app).toContain('path="/current-use"');
      expect(app).toContain('path="/current-use/interest"');
      expect(app).toContain('path="/current-use/removals"');
    });

    it('App.tsx includes Current Use in NAV_ITEMS', () => {
      const app = read('App.tsx');
      expect(app).toContain("label: 'Current Use'");
      expect(app).toContain("path: '/current-use'");
    });
  });

  describe('API contract', () => {
    it('CurrentUsePage uses /api/currentuse base path', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('/api/currentuse');
    });

    it('CurrentUseInterestPage uses /api/currentuse base path', () => {
      const page = read('pages/CurrentUseInterestPage.tsx');
      expect(page).toContain('/api/currentuse');
    });

    it('CurrentUseRemovalsPage uses /api/currentuse base path', () => {
      const page = read('pages/CurrentUseRemovalsPage.tsx');
      expect(page).toContain('/api/currentuse');
    });
  });

  describe('domain correctness', () => {
    it('CurrentUsePage references RCW 84.33/84.34 (WA current use statutes)', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('RCW 84.33');
      expect(page).toContain('84.34');
    });

    it('CurrentUsePage supports DFL classification code', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('DFL');
    });

    it('CurrentUsePage supports penalty exception handling', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('penaltyExceptionCode');
      expect(page).toContain('penaltyExceptionApplied');
    });

    it('CurrentUseInterestPage references WA DOR as rate source', () => {
      const page = read('pages/CurrentUseInterestPage.tsx');
      expect(page).toContain('DOR');
    });

    it('CurrentUseRemovalsPage shows removal status lifecycle', () => {
      const page = read('pages/CurrentUseRemovalsPage.tsx');
      expect(page).toContain('Pending');
      expect(page).toContain('Confirmed');
    });
  });

  describe('UI patterns', () => {
    it('uses tf- CSS class prefix consistent with TerraForge design system', () => {
      const page = read('pages/CurrentUsePage.tsx');
      expect(page).toContain('tf-page');
      expect(page).toContain('tf-card');
      expect(page).toContain('tf-table');
    });

    it('uses currency formatting for financial values', () => {
      const page = read('pages/CurrentUsePage.tsx');
      // Should have a dollar formatting function
      expect(page).toMatch(/toLocaleString|fmt\$|formatCurrency/);
    });
  });
});
