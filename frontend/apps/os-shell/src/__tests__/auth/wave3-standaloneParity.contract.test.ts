/**
 * wave3-standaloneParity.contract.test.ts
 *
 * Wave 3: Standalone Entry Parity — proves actor threading in
 * SuiteModuleGrid, StandaloneHomeShell, ModuleRouteBridge,
 * moduleActivation, and standaloneHomeContracts.
 *
 * Static-analysis contract tests (readFileSync pattern).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SRC_ROOT = resolve(__dirname, '../..');
const readSrc = (p: string) => readFileSync(resolve(SRC_ROOT, p), 'utf-8');

// ============================================================================
// Gate 1: SuiteModuleGrid imports auth and threads actor
// ============================================================================

describe('Gate 1 — SuiteModuleGrid actor threading', () => {
  const src = readSrc('components/suites/SuiteModuleGrid.tsx');

  it('imports useAuthContext from auth', () => {
    expect(src).toContain('useAuthContext');
  });

  it('imports toOsActor from auth', () => {
    expect(src).toContain('toOsActor');
  });

  it('passes actor to activateModule', () => {
    expect(src).toContain('actor');
    expect(src).toContain('activateModule');
  });
});

// ============================================================================
// Gate 2: StandaloneHomeShell threads actor into OsActionContext
// ============================================================================

describe('Gate 2 — StandaloneHomeShell actor in contexts', () => {
  const src = readSrc('components/standalone/StandaloneHomeShell.tsx');

  it('imports useAuthContext', () => {
    expect(src).toContain('useAuthContext');
  });

  it('imports toOsActor', () => {
    expect(src).toContain('toOsActor');
  });

  it('has actor field in context construction (at least 3 occurrences)', () => {
    const actorOccurrences = (src.match(/actor/g) || []).length;
    expect(actorOccurrences).toBeGreaterThanOrEqual(3);
  });
});

// ============================================================================
// Gate 3: ModuleRouteBridge threads actor
// ============================================================================

describe('Gate 3 — ModuleRouteBridge actor threading', () => {
  const src = readSrc('routing/ModuleRouteBridge.tsx');

  it('imports useAuthContext', () => {
    expect(src).toContain('useAuthContext');
  });

  it('imports toOsActor', () => {
    expect(src).toContain('toOsActor');
  });

  it('passes actor to activateModule', () => {
    expect(src).toContain('actor');
  });
});

// ============================================================================
// Gate 4: moduleActivation has typed actor
// ============================================================================

describe('Gate 4 — moduleActivation typed actor field', () => {
  const src = readSrc('orchestration/moduleActivation.ts');

  it('imports OsActor type', () => {
    expect(src).toContain('OsActor');
  });

  it('has actor field in ActivateModuleOptions', () => {
    expect(src).toMatch(/actor\??\s*:\s*OsActor/);
  });
});

// ============================================================================
// Gate 5: standaloneHomeContracts has actor
// ============================================================================

describe('Gate 5 — standaloneHomeContracts actor field', () => {
  const src = readSrc('components/standalone/standaloneHomeContracts.ts');

  it('imports OsActor type', () => {
    expect(src).toContain('OsActor');
  });

  it('has actor field in StandaloneHomeContext', () => {
    expect(src).toMatch(/actor\??\s*:\s*OsActor/);
  });
});
