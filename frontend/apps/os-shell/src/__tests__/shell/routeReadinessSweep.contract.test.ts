/**
 * routeReadinessSweep.contract.test.ts
 *
 * Phase 22 — Brick 22-A: Route Readiness Sweep
 * =============================================
 *
 * Proves that every named route registered in Router.tsx hosts a real surface
 * component — not a generic placeholder, stub, or "Coming soon" screen.
 *
 * Invariant: zero placeholder text in any routed suite home.
 *
 * Routed suite homes under test (from Router.tsx lazy imports):
 *   /forge     → ForgeSuiteHome.tsx
 *   /atlas     → AtlasSuiteHome.tsx
 *   /dais      → DaisSuiteHome.tsx
 *   /dossier   → DossierSuiteHome.tsx
 *   /gpt       → GptSuiteHome.tsx
 *   /pilot     → PilotHome.tsx
 *   /trace     → TraceHome.tsx
 *   /canon     → CanonHome.tsx
 *
 * @see src/Router.tsx — lazy import declarations
 * @see src/pages/suites/ — suite home implementations
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Source loading ────────────────────────────────────────────────────────────

const SRC = resolve(import.meta.dirname, '../..');

function read(rel: string): string {
  return readFileSync(resolve(SRC, rel), 'utf-8');
}

let routerSrc: string;
let forgeSrc: string;
let atlasSrc: string;
let daisSrc: string;
let dossierSrc: string;
let gptSrc: string;
let pilotSrc: string;
let traceSrc: string;
let canonSrc: string;

// Generic wrapper that must NOT be used by Router.tsx
const PLACEHOLDER_PHRASES = [
  'This suite home page is a placeholder',
  'Coming soon',
  'coming-soon',
  'Not implemented',
  'Under construction',
] as const;

beforeAll(() => {
  routerSrc = read('Router.tsx');
  forgeSrc = read('pages/suites/ForgeSuiteHome.tsx');
  atlasSrc = read('pages/suites/AtlasSuiteHome.tsx');
  daisSrc = read('pages/suites/DaisSuiteHome.tsx');
  dossierSrc = read('pages/suites/DossierSuiteHome.tsx');
  gptSrc = read('pages/suites/GptSuiteHome.tsx');
  pilotSrc = read('pages/PilotHome.tsx');
  traceSrc = read('pages/TraceHome.tsx');
  canonSrc = read('pages/CanonHome.tsx');
});

// ── 22-A-1: Router imports real suite-specific files, not the generic wrapper ─

describe('22-A-1: Router uses specific suite home files', () => {
  it('ForgeHome imports from ForgeSuiteHome (not SuiteHome generic)', () => {
    expect(routerSrc).toContain("import('./pages/suites/ForgeSuiteHome')");
  });

  it('AtlasHome imports from AtlasSuiteHome (not SuiteHome generic)', () => {
    expect(routerSrc).toContain("import('./pages/suites/AtlasSuiteHome')");
  });

  it('DaisHome imports from DaisSuiteHome (not SuiteHome generic)', () => {
    expect(routerSrc).toContain("import('./pages/suites/DaisSuiteHome')");
  });

  it('DossierHome imports from DossierSuiteHome (not SuiteHome generic)', () => {
    expect(routerSrc).toContain("import('./pages/suites/DossierSuiteHome')");
  });

  it('GptHome imports from GptSuiteHome (not SuiteHome generic)', () => {
    expect(routerSrc).toContain("import('./pages/suites/GptSuiteHome')");
  });

  it('Router does NOT lazily import the generic SuiteHome placeholder', () => {
    // The generic SuiteHome wrapper must not appear as a lazy route import
    expect(routerSrc).not.toMatch(/lazy\([^)]*SuiteHome[^)]*\)/);
  });
});

// ── 22-A-2: Each routed suite home contains zero placeholder text ─────────────

describe('22-A-2: ForgeSuiteHome has no placeholder content', () => {
  it.each(PLACEHOLDER_PHRASES)('does not contain "%s"', (phrase) => {
    expect(forgeSrc).not.toContain(phrase);
  });
});

describe('22-A-2: AtlasSuiteHome has no placeholder content', () => {
  it.each(PLACEHOLDER_PHRASES)('does not contain "%s"', (phrase) => {
    expect(atlasSrc).not.toContain(phrase);
  });
});

describe('22-A-2: DaisSuiteHome has no placeholder content', () => {
  it.each(PLACEHOLDER_PHRASES)('does not contain "%s"', (phrase) => {
    expect(daisSrc).not.toContain(phrase);
  });
});

describe('22-A-2: DossierSuiteHome has no placeholder content', () => {
  it.each(PLACEHOLDER_PHRASES)('does not contain "%s"', (phrase) => {
    expect(dossierSrc).not.toContain(phrase);
  });
});

describe('22-A-2: GptSuiteHome has no placeholder content', () => {
  it.each(PLACEHOLDER_PHRASES)('does not contain "%s"', (phrase) => {
    expect(gptSrc).not.toContain(phrase);
  });
});

describe('22-A-2: PilotHome has no placeholder content', () => {
  it.each(PLACEHOLDER_PHRASES)('does not contain "%s"', (phrase) => {
    expect(pilotSrc).not.toContain(phrase);
  });
});

describe('22-A-2: TraceHome has no placeholder content', () => {
  it.each(PLACEHOLDER_PHRASES)('does not contain "%s"', (phrase) => {
    expect(traceSrc).not.toContain(phrase);
  });
});

describe('22-A-2: CanonHome has no placeholder content', () => {
  it.each(PLACEHOLDER_PHRASES)('does not contain "%s"', (phrase) => {
    expect(canonSrc).not.toContain(phrase);
  });
});

// ── 22-A-3: All named OS routes are registered in Router.tsx ─────────────────

describe('22-A-3: All OS suite routes are registered', () => {
  const REQUIRED_ROUTES = [
    "path='forge'",
    "path='atlas'",
    "path='dais'",
    "path='dossier'",
    "path='gpt'",
    "path='pilot'",
    "path='trace'",
    "path='canon'",
  ] as const;

  it.each(REQUIRED_ROUTES)('route %s is registered', (route) => {
    expect(routerSrc).toContain(route);
  });
});
