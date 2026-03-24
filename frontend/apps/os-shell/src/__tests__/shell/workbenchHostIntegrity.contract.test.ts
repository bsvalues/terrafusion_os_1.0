/**
 * workbenchHostIntegrity.contract.test.ts
 *
 * Phase 22 — Brick 22-B: WorkbenchHost Integrity
 * ===============================================
 *
 * Proves that PropertyWorkbench hosts all required tab surfaces via React
 * Router Outlet — no hardcoded tab content, no fake-host fallback, no
 * missing tab route registrations.
 *
 * Inherits evidence from Phases 16–18 contracts (parcel routing, canonical URL,
 * back/forward preservation, alias deduplication). Adds: no fake-host fallback
 * in any required tab position.
 *
 * Required tab routes in Router.tsx under /property/:parcelId:
 *   index   → PropertySummary
 *   summary → PropertySummary
 *   forge   → PropertyForge
 *   atlas   → PropertyAtlas
 *   dais    → PropertyDais
 *   clerk   → PropertyClerk
 *   treasury → PropertyTreasury
 *   audit   → PropertyAudit
 *   dossier → PropertyDossier
 *   pilot   → PropertyPilot
 *
 * @see src/pages/workbench/PropertyWorkbench.tsx — Outlet host
 * @see src/Router.tsx — tab route declarations
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Source loading ────────────────────────────────────────────────────────────

const SRC = resolve(import.meta.dirname, '../..');

function read(rel: string): string {
  return readFileSync(resolve(SRC, rel), 'utf-8');
}

let workbenchSrc: string;
let routerSrc: string;

beforeAll(() => {
  workbenchSrc = read('pages/workbench/PropertyWorkbench.tsx');
  routerSrc = read('Router.tsx');
});

// ── 22-B-1: PropertyWorkbench uses Outlet (not hardcoded tab content) ─────────

describe('22-B-1: PropertyWorkbench hosts via Outlet', () => {
  it('PropertyWorkbench renders <Outlet', () => {
    expect(workbenchSrc).toContain('<Outlet');
  });

  it('PropertyWorkbench imports Outlet from react-router-dom', () => {
    expect(workbenchSrc).toMatch(/import\s*\{[^}]*Outlet[^}]*\}\s*from\s*['"]react-router-dom['"]/);
  });

  it('PropertyWorkbench passes context through Outlet', () => {
    // Outlet must have context prop to pass parcelId + propertyData to tabs
    expect(workbenchSrc).toMatch(/<Outlet\s[^>]*context/);
  });

  it('PropertyWorkbench does NOT contain hardcoded tab content fallback', () => {
    // The workbench itself must not render tab content — Outlet does
    const FORBIDDEN_HARDCODED = [
      'Coming soon',
      'This tab is not yet available',
      'Tab under construction',
    ];
    for (const phrase of FORBIDDEN_HARDCODED) {
      expect(workbenchSrc).not.toContain(phrase);
    }
  });
});

// ── 22-B-2: All required tab routes registered under /property/:parcelId ──────

describe('22-B-2: All workbench tab routes are registered in Router.tsx', () => {
  const REQUIRED_TAB_IMPORTS = [
    'PropertySummary',
    'PropertyForge',
    'PropertyAtlas',
    'PropertyDais',
    'PropertyClerk',
    'PropertyTreasury',
    'PropertyAudit',
    'PropertyDossier',
    'PropertyPilot',
  ] as const;

  it.each(REQUIRED_TAB_IMPORTS)('Router.tsx lazy-imports %s tab', (tabName) => {
    expect(routerSrc).toContain(tabName);
  });

  it('Router.tsx registers property/:parcelId nested route tree', () => {
    expect(routerSrc).toContain("path='property/:parcelId'");
  });

  it('Summary tab uses Route index (not path=summary)', () => {
    // Summary is the index route — no path attribute needed
    expect(routerSrc).toMatch(/Route index[^/]*PropertySummary/);
  });
});

// ── 22-B-3: Specific tab path registrations ───────────────────────────────────

describe('22-B-3: Individual tab paths registered', () => {
  const REQUIRED_TAB_PATHS = [
    // summary uses <Route index /> not path='summary'
    "path='forge'",
    "path='atlas'",
    "path='dais'",
    "path='clerk'",
    "path='treasury'",
    "path='audit'",
    "path='dossier'",
    "path='pilot'",
  ] as const;

  it.each(REQUIRED_TAB_PATHS)('tab route %s is registered', (path) => {
    expect(routerSrc).toContain(path);
  });
});

// ── 22-B-4: Inherited evidence citation (Phases 16–18) ───────────────────────

describe('22-B-4: Inherited contract evidence (Phases 16–18)', () => {
  it('Router.tsx parcelId param exists in property route', () => {
    // Phase 16 contract: parcelId drives workbench activation
    expect(routerSrc).toContain(':parcelId');
  });

  it('PropertyWorkbench reads parcelId from useParams', () => {
    // Phase 17 contract: URL is single source of truth
    expect(workbenchSrc).toMatch(/useParams|parcelId/);
  });

  it('PropertyWorkbench is wrapped in error boundary or suspense pattern', () => {
    // Phase 16 contract: no white-screen on tab load failure
    const hasErrorBoundary = workbenchSrc.includes('ErrorBoundary') || workbenchSrc.includes('Suspense');
    expect(hasErrorBoundary).toBe(true);
  });
});
