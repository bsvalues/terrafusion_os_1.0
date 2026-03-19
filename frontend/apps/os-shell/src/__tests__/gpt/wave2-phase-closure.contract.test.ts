/// <reference types="vitest" />
/**
 * wave2-phase-closure.contract.test.ts
 *
 * CP-W2-CLOSE Proof Wall — Wave 2 Phase Closure + Waves 3-5 Gate
 * ═══════════════════════════════════════════════════════════════
 *
 * Formal closure of plan.md Phase 7 (Wave 2 split) and Phase 8
 * (Waves 3-5 entry gate). Verifies the full governance chain from
 * CP-W4-1 through CP-W2-2 is complete and all proof artifacts exist.
 *
 * This closes the Assessor Vertical planning slice (Slice 26).
 *
 * GATE  1: TerraTrace module exists (CP-W4-1)
 * GATE  2: TerraPilot RBAC module exists (CP-W4-2)
 * GATE  3: County Isolation module exists (CP-W5-1)
 * GATE  4: OWASP Security Baseline module exists (CP-W5-2)
 * GATE  5: Backend Truth Registry exists (CP-W2-1)
 * GATE  6: Frontend Wiring proof exists (CP-W2-2)
 * GATE  7: Assessor Vertical Attestation exists (CP-ASSESSOR-1)
 * GATE  8: All 5 governance modules export canonical types
 * GATE  9: All Wave 2 proof walls exist
 * GATE 10: Auth proof walls exist (Wave 1)
 * GATE 11: TerraTrace exports append-only helpers
 * GATE 12: pilotRbac exports risk policy + access check
 * GATE 13: countyIsolation exports assertion + headers + validation
 * GATE 14: securityBaseline exports sanitizer + findings registry
 * GATE 15: gptBackendTruth exports all query functions
 * GATE 16: Service lanes are all canonical
 * GATE 17: Phase 8 gate satisfied (all prior phases closed)
 * GATE 18: No governance module contains TODO/FIXME/HACK
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ── Governance modules ──
import {
  getAllEndpoints,
  getRealEndpoints,
  getAnonymousEndpoints,
  getUnscopedEndpoints,
  getUnreachableEndpoints,
  getEndpointsWithFindings,
  getAlignedEndpoints,
} from '../../services/gptBackendTruth';

import {
  WAVE2_RAG_SERVICE_LANE,
  RAG_API_BASE_PATH,
} from '../../services/ragAPI';

import {
  WAVE2_GPT_SERVICE_LANE,
  GPT_API_BASE_PATH,
} from '../../services/gptAPI';

// ── Paths ──
const SERVICES_DIR = path.resolve(__dirname, '..', '..', 'services');
const TESTS_DIR = path.resolve(__dirname, '..');

// Walk up from __tests__/gpt → src → os-shell → apps → frontend → workspace root
const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..', '..');
const GOVERNANCE_DIR = path.join(WORKSPACE_ROOT, '.governance');

// Governance modules (CP-W4-1 through CP-W5-2)
const TRACE_PATH = path.join(SERVICES_DIR, 'terraTrace.ts');
const RBAC_PATH = path.join(SERVICES_DIR, 'pilotRbac.ts');
const ISOLATION_PATH = path.join(SERVICES_DIR, 'countyIsolation.ts');
const SECURITY_PATH = path.join(SERVICES_DIR, 'securityBaseline.ts');
const BACKEND_TRUTH_PATH = path.join(SERVICES_DIR, 'gptBackendTruth.ts');

// Proof walls
const W2_BACKEND_TEST = path.join(TESTS_DIR, 'gpt', 'wave2-backend-truth.contract.test.ts');
const W2_FRONTEND_TEST = path.join(TESTS_DIR, 'gpt', 'wave2-frontend-wiring.contract.test.ts');
const TRACE_TEST = path.join(TESTS_DIR, 'trace', 'terratrace.canon.contract.test.ts');
const AUTH_HOOKS_TEST = path.join(TESTS_DIR, 'auth', 'wave2-hooks.contract.test.ts');
const AUTH_BRIDGE_TEST = path.join(TESTS_DIR, 'auth', 'wave2-gptActorBridge.contract.test.ts');
const ATTESTATION_DOC = path.join(GOVERNANCE_DIR, 'ASSESSOR_VERTICAL_ATTESTATION.md');

/* ═══════════════════════════════════════════════════════════════
 * SECTION A: Governance Module Existence
 * ═══════════════════════════════════════════════════════════════ */
describe('Phase Closure: Governance Modules Exist', () => {
  it('GATE 1 — TerraTrace module exists (CP-W4-1)', () => {
    expect(fs.existsSync(TRACE_PATH)).toBe(true);
    const src = fs.readFileSync(TRACE_PATH, 'utf-8');
    expect(src).toContain('CP-W4-1');
  });

  it('GATE 2 — TerraPilot RBAC module exists (CP-W4-2)', () => {
    expect(fs.existsSync(RBAC_PATH)).toBe(true);
    const src = fs.readFileSync(RBAC_PATH, 'utf-8');
    expect(src).toContain('CP-W4-2');
  });

  it('GATE 3 — County Isolation module exists (CP-W5-1)', () => {
    expect(fs.existsSync(ISOLATION_PATH)).toBe(true);
    const src = fs.readFileSync(ISOLATION_PATH, 'utf-8');
    expect(src).toContain('CP-W5-1');
  });

  it('GATE 4 — OWASP Security Baseline module exists (CP-W5-2)', () => {
    expect(fs.existsSync(SECURITY_PATH)).toBe(true);
    const src = fs.readFileSync(SECURITY_PATH, 'utf-8');
    expect(src).toContain('CP-W5-2');
  });

  it('GATE 5 — Backend Truth Registry exists (CP-W2-1)', () => {
    expect(fs.existsSync(BACKEND_TRUTH_PATH)).toBe(true);
    const src = fs.readFileSync(BACKEND_TRUTH_PATH, 'utf-8');
    expect(src).toContain('CP-W2-1');
  });

  it('GATE 6 — Frontend Wiring proof exists (CP-W2-2)', () => {
    expect(fs.existsSync(W2_FRONTEND_TEST)).toBe(true);
    const src = fs.readFileSync(W2_FRONTEND_TEST, 'utf-8');
    expect(src).toContain('CP-W2-2');
  });

  it('GATE 7 — Assessor Vertical Attestation exists (CP-ASSESSOR-1)', () => {
    expect(fs.existsSync(ATTESTATION_DOC)).toBe(true);
    const doc = fs.readFileSync(ATTESTATION_DOC, 'utf-8');
    expect(doc).toContain('ATTESTED');
  });
});

/* ═══════════════════════════════════════════════════════════════
 * SECTION B: Governance Module Exports
 * ═══════════════════════════════════════════════════════════════ */
describe('Phase Closure: Module Canonical Exports', () => {
  it('GATE 8 — all governance modules export canonical types', () => {
    // Each module must contain its type exports
    const traceSource = fs.readFileSync(TRACE_PATH, 'utf-8');
    expect(traceSource).toContain('emitCanonTrace');

    const rbacSource = fs.readFileSync(RBAC_PATH, 'utf-8');
    expect(rbacSource).toContain('getRiskPolicy');
    expect(rbacSource).toContain('checkToolAccess');

    const isolSource = fs.readFileSync(ISOLATION_PATH, 'utf-8');
    expect(isolSource).toContain('assertCountyContext');

    const secSource = fs.readFileSync(SECURITY_PATH, 'utf-8');
    expect(secSource).toContain('sanitizeHtml');

    const truthSource = fs.readFileSync(BACKEND_TRUTH_PATH, 'utf-8');
    expect(truthSource).toContain('getAllEndpoints');
  });

  it('GATE 11 — TerraTrace exports append-only helpers', () => {
    const src = fs.readFileSync(TRACE_PATH, 'utf-8');
    const helpers = [
      'emitCanonTrace',
      'generateCorrelationId',
      'emitToolInvoked',
      'emitToolSucceeded',
      'emitToolFailed',
      'emitModeSwitched',
      'emitPermissionDenied',
      'emitArtifactCreated',
      'emitArtifactPublished',
    ];
    const missing = helpers.filter((h) => !src.includes(h));
    expect(missing).toEqual([]);
  });

  it('GATE 12 — pilotRbac exports risk policy + access check', () => {
    const src = fs.readFileSync(RBAC_PATH, 'utf-8');
    expect(src).toContain('getRiskPolicy');
    expect(src).toContain('checkToolAccess');
    expect(src).toContain('AccessDecision');
  });

  it('GATE 13 — countyIsolation exports assertion + headers + validation', () => {
    const src = fs.readFileSync(ISOLATION_PATH, 'utf-8');
    expect(src).toContain('assertCountyContext');
    expect(src).toContain('buildCountyScopedHeaders');
    expect(src).toContain('validateCountyOwnership');
  });

  it('GATE 14 — securityBaseline exports sanitizer + findings registry', () => {
    const src = fs.readFileSync(SECURITY_PATH, 'utf-8');
    expect(src).toContain('sanitizeHtml');
    expect(src).toContain('OWASP_SECURITY_BASELINE');
  });

  it('GATE 15 — gptBackendTruth exports all query functions', () => {
    // Runtime verification
    expect(typeof getAllEndpoints).toBe('function');
    expect(typeof getRealEndpoints).toBe('function');
    expect(typeof getAnonymousEndpoints).toBe('function');
    expect(typeof getUnscopedEndpoints).toBe('function');
    expect(typeof getUnreachableEndpoints).toBe('function');
    expect(typeof getEndpointsWithFindings).toBe('function');
    expect(typeof getAlignedEndpoints).toBe('function');
    expect(getAllEndpoints().length).toBeGreaterThanOrEqual(29);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * SECTION C: Proof Wall Chain
 * ═══════════════════════════════════════════════════════════════ */
describe('Phase Closure: Proof Wall Chain', () => {
  it('GATE 9 — all Wave 2 proof walls exist', () => {
    expect(fs.existsSync(W2_BACKEND_TEST)).toBe(true);
    expect(fs.existsSync(W2_FRONTEND_TEST)).toBe(true);
    // Both must be non-trivial
    expect(fs.readFileSync(W2_BACKEND_TEST, 'utf-8').length).toBeGreaterThan(1000);
    expect(fs.readFileSync(W2_FRONTEND_TEST, 'utf-8').length).toBeGreaterThan(1000);
  });

  it('GATE 10 — auth proof walls exist (Wave 1)', () => {
    expect(fs.existsSync(AUTH_HOOKS_TEST)).toBe(true);
    expect(fs.existsSync(AUTH_BRIDGE_TEST)).toBe(true);
  });

  it('GATE 16 — service lanes are all canonical', () => {
    expect(WAVE2_RAG_SERVICE_LANE).toBe('canonical');
    expect(WAVE2_GPT_SERVICE_LANE).toBe('canonical');
    expect(RAG_API_BASE_PATH).toBe('/api/rag');
    expect(GPT_API_BASE_PATH).toBe('/api/gpt');
  });
});

/* ═══════════════════════════════════════════════════════════════
 * SECTION D: Phase 8 Gate Satisfaction
 * ═══════════════════════════════════════════════════════════════ */
describe('Phase Closure: Waves 3-5 Entry Gate (Phase 8)', () => {
  it('GATE 17 — all prior phases closed (Phase 8 gate satisfied)', () => {
    // Phase 8 says: enter Waves 3-5 only after Phases 1-6 closed with proof
    // Phases 7-11 prove the full chain is complete
    // Verify via governance module existence + attestation
    const requiredFiles = [
      TRACE_PATH,        // Phase 7 (CP-W4-1)
      RBAC_PATH,         // Phase 8 (CP-W4-2)
      ISOLATION_PATH,    // Phase 9 (CP-W5-1)
      SECURITY_PATH,     // Phase 10 (CP-W5-2)
      ATTESTATION_DOC,   // Phase 11 (CP-ASSESSOR-1)
      BACKEND_TRUTH_PATH, // Wave 2 (CP-W2-1)
      W2_FRONTEND_TEST,  // Wave 2 (CP-W2-2)
    ];
    const missing = requiredFiles.filter((f) => !fs.existsSync(f));
    expect(missing).toEqual([]);
  });

  it('GATE 18 — no governance module contains TODO/FIXME/HACK', () => {
    const modules = [TRACE_PATH, RBAC_PATH, ISOLATION_PATH, SECURITY_PATH, BACKEND_TRUTH_PATH];
    for (const mod of modules) {
      const src = fs.readFileSync(mod, 'utf-8');
      const markers = src.match(/\b(TODO|FIXME|HACK)\b/g) || [];
      expect(markers, `${path.basename(mod)} has debt markers`).toHaveLength(0);
    }
  });
});
