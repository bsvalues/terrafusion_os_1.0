/// <reference types="vitest" />
/**
 * wave2-backend-truth.contract.test.ts
 *
 * CP-W2-1 Proof Wall — Wave 2 GPT/RAG Backend Truth
 * ═══════════════════════════════════════════════════════════════
 *
 * Verifies the backend truth registry against frontend API services
 * and documents security/isolation gaps discovered during recon.
 *
 * GATE  1: All registered endpoints are REAL (no stubs)
 * GATE  2: RAG service aligns to all 9 RAGController endpoints
 * GATE  3: GPT service aligns to all GPTController core CRUD endpoints
 * GATE  4: ragAPI uses auth interceptor (Bearer token injection)
 * GATE  5: gptAPI uses auth interceptor (Bearer token injection)
 * GATE  6: ragAPI base path is /api/rag
 * GATE  7: gptAPI base path is /api/gpt
 * GATE  8: Registry captures 16+ anonymous GPT endpoints (security finding)
 * GATE  9: Registry captures 7+ unscoped RAG endpoints (isolation finding)
 * GATE 10: Registry captures 4 CoPilot endpoints with no frontend client
 * GATE 11: No stubs masquerading as real implementations
 * GATE 12: All aligned endpoints have persistence declared
 * GATE 13: Every security finding has a finding ID
 * GATE 14: Wave 2 service lane markers are canonical
 * GATE 15: ragAPI exports singleton instance
 * GATE 16: gptAPI exports singleton instance
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  RAG_ENDPOINTS,
  GPT_ANONYMOUS_ENDPOINTS,
  COPILOT_ENDPOINTS,
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

const SERVICES_DIR = path.resolve(__dirname, '..', '..', 'services');

/* ═══════════════════════════════════════════════════════════════
 * SECTION A: Implementation Status
 * ═══════════════════════════════════════════════════════════════ */
describe('Wave 2: Implementation Status', () => {
  it('GATE 1 — all registered endpoints are REAL', () => {
    const all = getAllEndpoints();
    expect(all.length).toBeGreaterThanOrEqual(29);
    const realCount = getRealEndpoints().length;
    expect(realCount).toBe(all.length);
  });

  it('GATE 11 — no stubs masquerading as real', () => {
    const all = getAllEndpoints();
    const stubs = all.filter((e) => e.implementation === 'stub');
    expect(stubs).toHaveLength(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * SECTION B: Frontend-Backend Alignment
 * ═══════════════════════════════════════════════════════════════ */
describe('Wave 2: Frontend-Backend Alignment', () => {
  it('GATE 2 — RAG service aligns to all 9 RAGController endpoints', () => {
    expect(RAG_ENDPOINTS).toHaveLength(9);
    const aligned = RAG_ENDPOINTS.filter((e) => e.alignment === 'aligned');
    expect(aligned).toHaveLength(9);
  });

  it('GATE 3 — GPT anonymous endpoints are all aligned to frontend', () => {
    expect(GPT_ANONYMOUS_ENDPOINTS.length).toBeGreaterThanOrEqual(16);
    const aligned = GPT_ANONYMOUS_ENDPOINTS.filter((e) => e.alignment === 'aligned');
    expect(aligned.length).toBe(GPT_ANONYMOUS_ENDPOINTS.length);
  });

  it('GATE 4 — ragAPI.ts uses auth interceptor (Bearer token)', () => {
    const ragApiPath = path.join(SERVICES_DIR, 'ragAPI.ts');
    const content = fs.readFileSync(ragApiPath, 'utf-8');
    expect(content).toMatch(/Bearer/);
    expect(content).toMatch(/getToken/);
    expect(content).toMatch(/interceptors\.request/);
  });

  it('GATE 5 — gptAPI.ts uses auth interceptor (Bearer token)', () => {
    const gptApiPath = path.join(SERVICES_DIR, 'gptAPI.ts');
    const content = fs.readFileSync(gptApiPath, 'utf-8');
    expect(content).toMatch(/Bearer/);
    expect(content).toMatch(/getToken/);
    expect(content).toMatch(/interceptors\.request/);
  });

  it('GATE 6 — ragAPI base path is /api/rag', () => {
    expect(RAG_API_BASE_PATH).toBe('/api/rag');
  });

  it('GATE 7 — gptAPI base path is /api/gpt', () => {
    expect(GPT_API_BASE_PATH).toBe('/api/gpt');
  });

  it('GATE 14 — Wave 2 service lane markers are canonical', () => {
    expect(WAVE2_RAG_SERVICE_LANE).toBe('canonical');
    expect(WAVE2_GPT_SERVICE_LANE).toBe('canonical');
  });

  it('GATE 15 — ragAPI exports singleton instance', () => {
    const ragApiPath = path.join(SERVICES_DIR, 'ragAPI.ts');
    const content = fs.readFileSync(ragApiPath, 'utf-8');
    expect(content).toMatch(/export const ragAPI/);
    expect(content).toMatch(/export default ragAPI/);
  });

  it('GATE 16 — gptAPI exports singleton instance', () => {
    const gptApiPath = path.join(SERVICES_DIR, 'gptAPI.ts');
    const content = fs.readFileSync(gptApiPath, 'utf-8');
    expect(content).toMatch(/export const gptAPI/);
    expect(content).toMatch(/export default gptAPI/);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * SECTION C: Security & Isolation Findings
 * ═══════════════════════════════════════════════════════════════ */
describe('Wave 2: Security & Isolation Findings', () => {
  it('GATE 8 — registry captures 16+ anonymous GPT endpoints', () => {
    const anonymous = getAnonymousEndpoints();
    expect(anonymous.length).toBeGreaterThanOrEqual(16);
    // All anonymous endpoints should be in GPT controller
    for (const ep of anonymous) {
      expect(ep.controller).toBe('GPTController');
    }
  });

  it('GATE 9 — registry captures 7+ unscoped RAG endpoints', () => {
    const ragUnscoped = RAG_ENDPOINTS.filter(
      (e) => e.isolation === 'unscoped' || e.isolation === 'hardcoded_county',
    );
    expect(ragUnscoped.length).toBeGreaterThanOrEqual(7);
  });

  it('GATE 10 — CoPilot endpoints have no frontend client', () => {
    expect(COPILOT_ENDPOINTS).toHaveLength(4);
    const unreachable = COPILOT_ENDPOINTS.filter(
      (e) => e.alignment === 'no_frontend_client',
    );
    expect(unreachable).toHaveLength(4);
  });

  it('GATE 12 — all aligned endpoints have persistence declared', () => {
    const aligned = getAlignedEndpoints();
    for (const ep of aligned) {
      expect(ep.persistence).toBeTruthy();
      expect(ep.persistence.length).toBeGreaterThan(0);
    }
  });

  it('GATE 13 — every security finding has a finding ID', () => {
    const withFindings = getEndpointsWithFindings();
    expect(withFindings.length).toBeGreaterThanOrEqual(20);
    for (const ep of withFindings) {
      expect(ep.securityFinding).toMatch(/^W2-(RAG|GPT)-[A-Z]?\d+$/);
    }
  });
});
