/**
 * authThreading.contract.test.ts
 *
 * Wave 1: Auth Context Threading contract tests.
 *
 * Enforces that all governed service modules import the canonical auth
 * infrastructure and attach auth headers to outbound fetch calls.
 * Also verifies the PropertyWorkbench wires session roles into the
 * role-based tab visibility hook.
 *
 * These are static-analysis tests (file content inspection) — they do NOT
 * require a running backend or React rendering.
 *
 * @module __tests__/auth/authThreading.contract.test
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ============================================================================
// Helpers
// ============================================================================

const SRC_ROOT = resolve(__dirname, '../..');

function readSrc(relativePath: string): string {
  return readFileSync(resolve(SRC_ROOT, relativePath), 'utf-8');
}

// ============================================================================
// Gate 1: Service modules import getToken from auth infrastructure
// ============================================================================

describe('Gate 1 — Service auth imports', () => {
  const GOVERNED_SERVICES = [
    'services/suites/daisService.ts',
    'services/forge/propertyValuationClientService.ts',
    'services/suites/queueService.ts',
    'services/suites/atlasService.ts', // reference — already correct
  ];

  for (const svc of GOVERNED_SERVICES) {
    it(`${svc} imports getToken from authStorage`, () => {
      const src = readSrc(svc);
      expect(src).toMatch(/import\s+\{[^}]*getToken[^}]*\}\s+from\s+['"]@\/auth\/authStorage['"]/);
    });
  }
});

// ============================================================================
// Gate 2: Service modules define an authHeaders() helper
// ============================================================================

describe('Gate 2 — Service authHeaders() helper', () => {
  const GOVERNED_SERVICES = [
    'services/suites/daisService.ts',
    'services/forge/propertyValuationClientService.ts',
    'services/suites/queueService.ts',
    'services/suites/atlasService.ts',
  ];

  for (const svc of GOVERNED_SERVICES) {
    it(`${svc} defines an authHeaders function`, () => {
      const src = readSrc(svc);
      expect(src).toMatch(/function\s+authHeaders\s*\(/);
    });
  }
});

// ============================================================================
// Gate 3: Service fetch calls use authHeaders()
// ============================================================================

describe('Gate 3 — fetch calls use authHeaders', () => {
  const GOVERNED_SERVICES = [
    'services/suites/daisService.ts',
    'services/forge/propertyValuationClientService.ts',
    'services/suites/queueService.ts',
  ];

  for (const svc of GOVERNED_SERVICES) {
    it(`${svc} has no bare fetch calls without authHeaders`, () => {
      const src = readSrc(svc);
      // Split into function bodies and check each fetch statement block
      // Ensure every `await fetch(` is accompanied by authHeaders on the
      // same statement (which may span multiple lines up to the next `;`).
      const statements = src.split(/;\s*\n/);
      const fetchStatements = statements.filter((s) => s.includes('await fetch('));
      expect(fetchStatements.length).toBeGreaterThan(0);
      for (const stmt of fetchStatements) {
        expect(stmt).toMatch(/authHeaders/);
      }
    });
  }
});

// ============================================================================
// Gate 4: Workbench role gate wires session.role (not hardcoded [])
// ============================================================================

describe('Gate 4 — Workbench role gate', () => {
  const WORKBENCH_FILES = [
    'pages/workbench/PropertyWorkbench.tsx',
    'pages/workbench/PropertyWorkbenchWindow.tsx',
  ];

  for (const wb of WORKBENCH_FILES) {
    it(`${wb} does not hardcode roles to empty array`, () => {
      const src = readSrc(wb);
      // Must NOT have: useMemo(() => [], [])
      expect(src).not.toMatch(/roles:\s*string\[\]\s*=\s*useMemo\(\s*\(\)\s*=>\s*\[\]\s*,\s*\[\]\s*\)/);
      expect(src).not.toContain('roles: [],');
    });

    it(`${wb} wires session.role into roles`, () => {
      const src = readSrc(wb);
      // Must reference session.role in the roles derivation
      expect(src).toMatch(/session\.role/);
    });
  }
});

// ============================================================================
// Gate 5: No duplicate AuthProvider nesting
// ============================================================================

describe('Gate 5 — No duplicate AuthProvider', () => {
  it('Router.tsx has exactly one AuthProvider', () => {
    const src = readSrc('Router.tsx');
    const matches = src.match(/<AuthProvider/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('Workbench files do not nest their own AuthProvider', () => {
    for (const wb of [
      'pages/workbench/PropertyWorkbench.tsx',
      'pages/workbench/PropertyWorkbenchWindow.tsx',
    ]) {
      const src = readSrc(wb);
      expect(src).not.toMatch(/<AuthProvider/);
    }
  });
});

// ============================================================================
// Gate 6: ResearchPortal uses governed auth + session APIs
// ============================================================================

describe('Gate 6 — ResearchPortal auth threading', () => {
  const src = readSrc('components/research/ResearchPortal.tsx');

  it('imports useAuthContext and useSession', () => {
    expect(src).toMatch(/import\s+\{[^}]*useAuthContext[^}]*\}\s+from\s+['"]@\/auth\/useAuthContext['"]/);
    expect(src).toMatch(/import\s+\{[^}]*useSession[^}]*\}\s+from\s+['"]@\/auth\/useSession['"]/);
  });

  it('imports researchSessionAPI from governed research services', () => {
    expect(src).toMatch(/import\s+\{[^}]*researchSessionAPI[^}]*\}\s+from\s+['"]@\/api\/researchServices['"]/);
  });

  it('does not contain legacy hardcoded researcher identity strings', () => {
    expect(src).not.toContain('phd-researcher-001');
    expect(src).not.toContain('Dr. Sarah Chen');
    expect(src).not.toContain('Harvard University - MIT Joint Program');
  });
});

// ============================================================================
// Gate 7: QuantumModuleManager uses canonical auth/session helpers
// ============================================================================

describe('Gate 7 — QuantumModuleManager auth threading', () => {
  const src = readSrc('services/QuantumModuleManager.ts');

  it('imports getSession + getToken + decodeAuthClaims', () => {
    expect(src).toContain("import { getToken } from '../auth/authStorage'");
    expect(src).toContain("import { getSession, type Session } from '../auth/session'");
    expect(src).toContain("import { decodeAuthClaims } from '../auth/useAuthContext'");
  });

  it('does not read tf.session.dev directly', () => {
    expect(src).not.toContain('tf.session.dev');
  });

  it('removes permission and security TODO stubs', () => {
    expect(src).not.toContain("permissions: ['read', 'write', 'execute']");
    expect(src).toContain('resolveModuleSecurityLevel');
    expect(src).toContain('buildModuleLoadingContext');
  });
});

// ============================================================================
// Gate 8: Wave 1 hooks are API-first with fallback provenance
// ============================================================================

describe('Gate 8 — Wave 1 hooks', () => {
  it('useTodaysWork reads from queueService before falling back', () => {
    const src = readSrc('hooks/useTodaysWork.ts');
    expect(src).toContain("import { getQueueItems } from '../services/suites/queueService'");
    expect(src).toContain('getQueueItems({ throwOnError: true })');
    expect(src).toContain('setIsSampleData(false)');
  });

  it('useBudgetData reads levy endpoints through the governed API client', () => {
    const src = readSrc('applications/terra-levy/hooks/useBudgetData.ts');
    expect(src).toMatch(/import\s+api\s+from\s+['"]@\/services\/api['"]/);
    expect(src).toContain('/levy/dashboard/summary');
    expect(src).toContain('/levy/budget/scenarios');
    expect(src).toContain('/levy/budget/visualization');
    expect(src).toContain('setIsSampleData(false)');
  });
});
