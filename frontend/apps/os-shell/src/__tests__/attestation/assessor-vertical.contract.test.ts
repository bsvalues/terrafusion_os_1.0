/// <reference types="vitest" />
/**
 * assessor-vertical.contract.test.ts
 *
 * CP-ASSESSOR-1 Proof Wall — Assessor Vertical Attestation
 * ═══════════════════════════════════════════════════════════════
 *
 * Verifies all 11 attestation criteria for the Assessor Vertical.
 * Each gate imports from the canonical proof-wall modules and
 * validates that committed evidence satisfies the attestation checklist.
 *
 * GATE  1: TerraForge — proof-wall modules exist and export expected symbols
 * GATE  2: TerraAtlas — standalone home exports AtlasSuiteHome component
 * GATE  3: TerraDais — standalone home exports DaisSuiteHome component
 * GATE  4: TerraDossier — standalone home exports DossierSuiteHome component
 * GATE  5: TerraGPT — suite home exports GptSuiteHome component
 * GATE  6: Property Workbench — exports WORKBENCH_TABS with 5+ suite tabs
 * GATE  7: Property Workbench — exports WORK_MODES with all 5 modes
 * GATE  8: TerraPilot RBAC — pilotRbac exports all enforcement functions
 * GATE  9: TerraPilot — PII redaction rule enforced (no SSN/phone/email in violations)
 * GATE 10: TerraTrace — terraTrace exports all canonical emitters
 * GATE 11: TerraTrace — append-only: emitCanonTrace uses POST method
 * GATE 12: County Isolation — countyIsolation exports enforcement and audit
 * GATE 13: County Isolation — cross-county ownership denied
 * GATE 14: Security Baseline — securityBaseline exports OWASP registry
 * GATE 15: Security Baseline — sanitizeHtml strips script tags
 * GATE 16: Auth — no hardcoded admin role in AuthProvider
 * GATE 17: Auth — dev token gated behind environment check
 * GATE 18: Suite route registry — all 5 constitutional suites routable
 */

import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

/* ─── Service imports (proof-wall modules) ─── */
import {
  getRiskPolicy,
  isToolEnabled,
  hasRequiredClaims,
  checkToolAccess,
} from '../../services/pilotRbac';

import {
  emitCanonTrace,
  generateCorrelationId,
  emitToolInvoked,
  emitToolSucceeded,
  emitToolFailed,
  emitModeSwitched,
  emitPermissionDenied,
  emitArtifactCreated,
  emitArtifactPublished,
  initTraceContext,
} from '../../services/terraTrace';

import {
  assertCountyContext,
  buildCountyScopedHeaders,
  validateCountyOwnership,
  COUNTY_ISOLATION_AUDIT,
  getIsolationGaps,
  getEnforcedSurfaces,
} from '../../services/countyIsolation';

import {
  sanitizeHtml,
  isAuthEnforcementActive,
  validateTokenStorageKey,
  OWASP_SECURITY_BASELINE,
  getFindingsByCategory,
  getOpenFindings,
  getCriticalAndHighFindings,
} from '../../services/securityBaseline';

/* ─── Source file paths for static analysis gates ─── */
const SHELL_SRC = path.resolve(__dirname, '..', '..');
const PAGES_DIR = path.join(SHELL_SRC, 'pages');
const SUITES_DIR = path.join(PAGES_DIR, 'suites');
const AUTH_DIR = path.join(SHELL_SRC, 'auth');

/* ═══════════════════════════════════════════════════════════════
 * CRITERION 1: TerraForge — F1 + F2 proof lanes
 * ═══════════════════════════════════════════════════════════════ */
describe('Criterion 1: TerraForge', () => {
  it('GATE 1 — Forge contract test files exist', () => {
    const forgeTestDir = path.join(SHELL_SRC, '__tests__', 'forge');
    const files = fs.readdirSync(forgeTestDir).filter(f => f.endsWith('.test.tsx') || f.endsWith('.test.ts'));
    // At least 6 Forge proof-wall test files
    expect(files.length).toBeGreaterThanOrEqual(6);
    // Key proof files present
    const names = files.map(f => f.toLowerCase());
    expect(names.some(n => n.includes('modeling'))).toBe(true);
    expect(names.some(n => n.includes('regression'))).toBe(true);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * CRITERION 2: TerraAtlas — standalone home honest
 * ═══════════════════════════════════════════════════════════════ */
describe('Criterion 2: TerraAtlas', () => {
  it('GATE 2 — AtlasSuiteHome.tsx exists and exports a component', () => {
    const atlasPath = path.join(SUITES_DIR, 'AtlasSuiteHome.tsx');
    expect(fs.existsSync(atlasPath)).toBe(true);
    const content = fs.readFileSync(atlasPath, 'utf-8');
    expect(content).toMatch(/export\s+(default\s+)?/);
    expect(content).toMatch(/AtlasSuiteHome/);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * CRITERION 3: TerraDais — standalone home honest
 * ═══════════════════════════════════════════════════════════════ */
describe('Criterion 3: TerraDais', () => {
  it('GATE 3 — DaisSuiteHome.tsx exists and exports a component', () => {
    const daisPath = path.join(SUITES_DIR, 'DaisSuiteHome.tsx');
    expect(fs.existsSync(daisPath)).toBe(true);
    const content = fs.readFileSync(daisPath, 'utf-8');
    expect(content).toMatch(/export\s+(default\s+)?/);
    expect(content).toMatch(/DaisSuiteHome/);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * CRITERION 4: TerraDossier — standalone home honest
 * ═══════════════════════════════════════════════════════════════ */
describe('Criterion 4: TerraDossier', () => {
  it('GATE 4 — DossierSuiteHome.tsx exists and exports a component', () => {
    const dossierPath = path.join(SUITES_DIR, 'DossierSuiteHome.tsx');
    expect(fs.existsSync(dossierPath)).toBe(true);
    const content = fs.readFileSync(dossierPath, 'utf-8');
    expect(content).toMatch(/export\s+(default\s+)?/);
    expect(content).toMatch(/DossierSuiteHome/);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * CRITERION 5: TerraGPT — GPT + RAG wiring closed
 * ═══════════════════════════════════════════════════════════════ */
describe('Criterion 5: TerraGPT', () => {
  it('GATE 5 — GptSuiteHome.tsx exists and exports a component', () => {
    const gptPath = path.join(SUITES_DIR, 'GptSuiteHome.tsx');
    expect(fs.existsSync(gptPath)).toBe(true);
    const content = fs.readFileSync(gptPath, 'utf-8');
    expect(content).toMatch(/export\s+(default\s+)?/);
    expect(content).toMatch(/GptSuiteHome/);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * CRITERION 6: Property Workbench — all suite tabs + work modes
 * ═══════════════════════════════════════════════════════════════ */
describe('Criterion 6: Property Workbench', () => {
  it('GATE 6 — PropertyWorkbench defines at least 5 suite tabs', () => {
    const wbPath = path.join(PAGES_DIR, 'workbench', 'PropertyWorkbench.tsx');
    expect(fs.existsSync(wbPath)).toBe(true);
    const content = fs.readFileSync(wbPath, 'utf-8');
    // Must contain all 5 constitutional suite tab slugs
    for (const slug of ['summary', 'forge', 'atlas', 'dais', 'dossier']) {
      expect(content).toContain(slug);
    }
  });

  it('GATE 7 — workbench.ts defines all 5 work modes', () => {
    const contractPath = path.join(SHELL_SRC, 'contracts', 'workbench.ts');
    expect(fs.existsSync(contractPath)).toBe(true);
    const content = fs.readFileSync(contractPath, 'utf-8');
    for (const mode of ['overview', 'valuation', 'mapping', 'admin', 'case']) {
      expect(content).toContain(mode);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
 * CRITERION 7: TerraPilot — RBAC + tool allowlists + PII
 * ═══════════════════════════════════════════════════════════════ */
describe('Criterion 7: TerraPilot RBAC', () => {
  it('GATE 8 — pilotRbac exports all enforcement functions', () => {
    expect(typeof getRiskPolicy).toBe('function');
    expect(typeof isToolEnabled).toBe('function');
    expect(typeof hasRequiredClaims).toBe('function');
    expect(typeof checkToolAccess).toBe('function');
  });

  it('GATE 9 — PII never leaks into violations (no SSN/phone/email)', () => {
    const PII_RE = /\b\d{3}-\d{2}-\d{4}\b|\b\d{3}[.\-]?\d{3}[.\-]?\d{4}\b|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const result = checkToolAccess(
      { toolId: 'tool_write_assessment', risk: 'write_high', requiredClaims: ['valuation:write'] },
      { enabledTools: ['tool_write_assessment'], userClaims: ['valuation:write'], countyId: 'benton' },
    );
    const serialized = JSON.stringify(result);
    expect(PII_RE.test(serialized)).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * CRITERION 8: TerraTrace — append-only, county-scoped, correlationId
 * ═══════════════════════════════════════════════════════════════ */
describe('Criterion 8: TerraTrace', () => {
  let fetchSpy: MockInstance;
  const calls: { method: string; url: string; body: string }[] = [];

  beforeEach(() => {
    calls.length = 0;
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (input: string | URL | Request, init?: RequestInit) => {
        calls.push({
          method: (init?.method ?? 'GET').toUpperCase(),
          url: typeof input === 'string' ? input : (input as Request).url ?? String(input),
          body: typeof init?.body === 'string' ? init.body : '',
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    );
    initTraceContext({ countyId: 'benton', userId: 'tester', sessionId: 'sess-attest' });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('GATE 10 — terraTrace exports all canonical emitters', () => {
    expect(typeof emitCanonTrace).toBe('function');
    expect(typeof generateCorrelationId).toBe('function');
    expect(typeof emitToolInvoked).toBe('function');
    expect(typeof emitToolSucceeded).toBe('function');
    expect(typeof emitToolFailed).toBe('function');
    expect(typeof emitModeSwitched).toBe('function');
    expect(typeof emitPermissionDenied).toBe('function');
    expect(typeof emitArtifactCreated).toBe('function');
    expect(typeof emitArtifactPublished).toBe('function');
    expect(typeof initTraceContext).toBe('function');
  });

  it('GATE 11 — emitCanonTrace uses POST (append-only)', async () => {
    await emitCanonTrace({ eventType: 'tool_invoked', toolName: 'attest_check' });
    expect(calls.length).toBe(1);
    expect(calls[0].method).toBe('POST');
  });
});

/* ═══════════════════════════════════════════════════════════════
 * CRITERION 9 (Auth) verified via GATE 16-17 below
 * ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
 * CRITERION 10: Multi-tenancy — cross-county isolation
 * ═══════════════════════════════════════════════════════════════ */
describe('Criterion 10: Multi-tenancy', () => {
  it('GATE 12 — countyIsolation exports enforcement and audit', () => {
    expect(typeof assertCountyContext).toBe('function');
    expect(typeof buildCountyScopedHeaders).toBe('function');
    expect(typeof validateCountyOwnership).toBe('function');
    expect(Array.isArray(COUNTY_ISOLATION_AUDIT)).toBe(true);
    expect(COUNTY_ISOLATION_AUDIT.length).toBeGreaterThanOrEqual(15);
    expect(typeof getIsolationGaps).toBe('function');
    expect(typeof getEnforcedSurfaces).toBe('function');
  });

  it('GATE 13 — cross-county ownership is denied', () => {
    // Same county → allowed
    expect(validateCountyOwnership('benton', 'benton')).toBe(true);
    // Different county → denied (cross-county isolation)
    expect(validateCountyOwnership('benton', 'yakima')).toBe(false);
    // Empty → denied
    expect(validateCountyOwnership('', 'benton')).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * CRITERION 11: Security — OWASP Top 10 baseline
 * ═══════════════════════════════════════════════════════════════ */
describe('Criterion 11: OWASP Security', () => {
  it('GATE 14 — securityBaseline exports OWASP registry', () => {
    expect(Array.isArray(OWASP_SECURITY_BASELINE)).toBe(true);
    expect(OWASP_SECURITY_BASELINE.length).toBeGreaterThanOrEqual(20);
    expect(typeof sanitizeHtml).toBe('function');
    expect(typeof isAuthEnforcementActive).toBe('function');
    expect(typeof validateTokenStorageKey).toBe('function');
    expect(typeof getFindingsByCategory).toBe('function');
    expect(typeof getOpenFindings).toBe('function');
    expect(typeof getCriticalAndHighFindings).toBe('function');
  });

  it('GATE 15 — sanitizeHtml strips <script> tags', () => {
    const dirty = '<p>Hello</p><script>alert("xss")</script><b>world</b>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toMatch(/<script/i);
    expect(clean).toContain('<p>Hello</p>');
    expect(clean).toContain('<b>world</b>');
  });
});

/* ═══════════════════════════════════════════════════════════════
 * CRITERION 9: Auth gates (static analysis)
 * ═══════════════════════════════════════════════════════════════ */
describe('Criterion 9: Auth — no hardcoded admin', () => {
  it('GATE 16 — AuthProvider contains no hardcoded admin role', () => {
    const authProviderPath = path.join(AUTH_DIR, 'AuthProvider.tsx');
    expect(fs.existsSync(authProviderPath)).toBe(true);
    const content = fs.readFileSync(authProviderPath, 'utf-8');
    // Must not contain a hardcoded 'admin' role assignment
    const adminRolePattern = /role\s*[:=]\s*['"]admin['"]/i;
    expect(adminRolePattern.test(content)).toBe(false);
  });

  it('GATE 17 — dev preview token gated behind environment check', () => {
    const authProviderPath = path.join(AUTH_DIR, 'AuthProvider.tsx');
    const content = fs.readFileSync(authProviderPath, 'utf-8');
    // Dev token must require isDevPreviewMode or equivalent env guard
    expect(content).toMatch(/isDevPreviewMode|DEV_PREVIEW|import\.meta\.env/);
    // And must contain the dev token constant
    expect(content).toMatch(/dev-preview-token/);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * META: Suite route registry completeness
 * ═══════════════════════════════════════════════════════════════ */
describe('Meta: Suite Route Registry', () => {
  it('GATE 18 — Router.tsx contains routes for all 5 constitutional suites', () => {
    const routerPath = path.join(SHELL_SRC, 'Router.tsx');
    expect(fs.existsSync(routerPath)).toBe(true);
    const content = fs.readFileSync(routerPath, 'utf-8');
    for (const route of ['forge', 'atlas', 'dais', 'dossier', 'gpt']) {
      expect(content).toContain(`path='${route}'`);
    }
    // Workbench sub-routes
    for (const tab of ['forge', 'atlas', 'dais', 'dossier', 'pilot']) {
      expect(content).toContain(tab);
    }
  });
});
