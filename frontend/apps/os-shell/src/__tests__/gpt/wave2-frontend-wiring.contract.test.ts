/// <reference types="vitest" />
/**
 * wave2-frontend-wiring.contract.test.ts
 *
 * CP-W2-2 Proof Wall — Wave 2 Task 7.2 Frontend Wiring
 * ═══════════════════════════════════════════════════════════════
 *
 * Verifies that RAGDatasetManager, GPTManagementDashboard, and
 * SystemGptAtlasPanel are fully wired to their backend endpoints.
 * This closes Task 7.2 from plan.md Phase 7.
 *
 * Frontend wiring was verified AFTER backend truth (CP-W2-1)
 * established the canonical endpoint inventory.
 *
 * GATE  1: RAGDatasetManager imports ragAPI service
 * GATE  2: RAGDatasetManager calls all 9 ragAPI methods
 * GATE  3: GPTManagementDashboard imports gptAPI service
 * GATE  4: GPTManagementDashboard imports useSession for auth context
 * GATE  5: GPTManagementDashboard calls 5 distinct gptAPI methods (CRUD + stats)
 * GATE  6: GPTManagementDashboard references countyId (partial scoping)
 * GATE  7: GPTManagementDashboard defers chat to CP-W2-5
 * GATE  8: SystemGptAtlasPanel has existing test coverage
 * GATE  9: No TODO/FIXME/HACK in RAGDatasetManager
 * GATE 10: No TODO/FIXME/HACK in GPTManagementDashboard
 * GATE 11: No TODO/FIXME/HACK in SystemGptAtlasPanel
 * GATE 12: ragAPI has auth interceptor (Bearer token)
 * GATE 13: gptAPI has auth interceptor (Bearer token)
 * GATE 14: ragAPI exposes all 9 endpoint methods
 * GATE 15: gptAPI exposes 20+ endpoint methods
 * GATE 16: All 3 target files are production-shaped (non-trivial)
 * GATE 17: Backend truth registry documents county isolation gaps
 * GATE 18: GPTManagementDashboard imports gptHub for real-time
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ── Backend truth registry (from CP-W2-1) ──
import {
  getUnscopedEndpoints,
  getAlignedEndpoints,
} from '../../services/gptBackendTruth';

// ── Service lane markers ──
import {
  WAVE2_RAG_SERVICE_LANE,
  RAG_API_BASE_PATH,
} from '../../services/ragAPI';

import {
  WAVE2_GPT_SERVICE_LANE,
  GPT_API_BASE_PATH,
} from '../../services/gptAPI';

// ── File paths ──
const COMPONENTS_DIR = path.resolve(__dirname, '..', '..', 'components', 'gpt');
const SERVICES_DIR = path.resolve(__dirname, '..', '..', 'services');
const FEATURES_DIR = path.resolve(__dirname, '..', '..', 'features', 'gpt', 'components');

const RAG_MANAGER_PATH = path.join(COMPONENTS_DIR, 'RAGDatasetManager.tsx');
const GPT_DASHBOARD_PATH = path.join(COMPONENTS_DIR, 'GPTManagementDashboard.tsx');
const ATLAS_PANEL_PATH = path.join(FEATURES_DIR, 'SystemGptAtlasPanel.tsx');
const ATLAS_TEST_PATH = path.join(FEATURES_DIR, '__tests__', 'SystemGptAtlasPanel.test.tsx');
const RAG_API_PATH = path.join(SERVICES_DIR, 'ragAPI.ts');
const GPT_API_PATH = path.join(SERVICES_DIR, 'gptAPI.ts');

/* ═══════════════════════════════════════════════════════════════
 * SECTION A: RAGDatasetManager Wiring
 * ═══════════════════════════════════════════════════════════════ */
describe('Wave 2 Frontend Wiring: RAGDatasetManager', () => {
  const ragSource = fs.readFileSync(RAG_MANAGER_PATH, 'utf-8');

  it('GATE 1 — imports ragAPI service', () => {
    expect(ragSource).toMatch(/from\s+['"]@\/services\/ragAPI['"]/);
  });

  it('GATE 2 — calls all 9 ragAPI methods', () => {
    const methods = [
      'ragAPI.getDatasets',
      'ragAPI.getDataset',
      'ragAPI.createDataset',
      'ragAPI.deleteDataset',
      'ragAPI.reindexDataset',
      'ragAPI.getDocuments',
      'ragAPI.addDocument',
      'ragAPI.deleteDocument',
      'ragAPI.getChunks',
    ];
    const missing = methods.filter((m) => !ragSource.includes(m));
    expect(missing).toEqual([]);
  });

  it('GATE 9 — no TODO/FIXME/HACK in RAGDatasetManager', () => {
    const debtMarkers = ragSource.match(/\b(TODO|FIXME|HACK)\b/g) || [];
    expect(debtMarkers).toHaveLength(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * SECTION B: GPTManagementDashboard Wiring
 * ═══════════════════════════════════════════════════════════════ */
describe('Wave 2 Frontend Wiring: GPTManagementDashboard', () => {
  const gptSource = fs.readFileSync(GPT_DASHBOARD_PATH, 'utf-8');

  it('GATE 3 — imports gptAPI service', () => {
    expect(gptSource).toMatch(/from\s+['"]@\/services\/gptAPI['"]/);
  });

  it('GATE 4 — imports useSession for auth context', () => {
    expect(gptSource).toMatch(/from\s+['"]@\/auth\/useSession['"]/);
  });

  it('GATE 5 — calls 5 distinct gptAPI methods (CRUD + stats)', () => {
    const methods = [
      'gptAPI.getAvailableGPTs',
      'gptAPI.createGPT',
      'gptAPI.updateGPT',
      'gptAPI.deleteGPT',
      'gptAPI.getGPTStatistics',
    ];
    const missing = methods.filter((m) => !gptSource.includes(m));
    expect(missing).toEqual([]);
  });

  it('GATE 6 — references countyId (partial scoping)', () => {
    expect(gptSource).toContain('countyId');
  });

  it('GATE 7 — defers chat to CP-W2-5', () => {
    expect(gptSource).toContain('CP-W2-5');
  });

  it('GATE 10 — no TODO/FIXME/HACK in GPTManagementDashboard', () => {
    const debtMarkers = gptSource.match(/\b(TODO|FIXME|HACK)\b/g) || [];
    expect(debtMarkers).toHaveLength(0);
  });

  it('GATE 18 — imports gptHub for real-time updates', () => {
    expect(gptSource).toMatch(/from\s+['"]@\/services\/gptHub['"]/);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * SECTION C: SystemGptAtlasPanel Coverage
 * ═══════════════════════════════════════════════════════════════ */
describe('Wave 2 Frontend Wiring: SystemGptAtlasPanel', () => {
  const atlasSource = fs.readFileSync(ATLAS_PANEL_PATH, 'utf-8');

  it('GATE 8 — has existing test coverage', () => {
    expect(fs.existsSync(ATLAS_TEST_PATH)).toBe(true);
    const testSource = fs.readFileSync(ATLAS_TEST_PATH, 'utf-8');
    expect(testSource.length).toBeGreaterThan(100);
  });

  it('GATE 11 — no TODO/FIXME/HACK in SystemGptAtlasPanel', () => {
    const debtMarkers = atlasSource.match(/\b(TODO|FIXME|HACK)\b/g) || [];
    expect(debtMarkers).toHaveLength(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * SECTION D: Service Layer Integrity
 * ═══════════════════════════════════════════════════════════════ */
describe('Wave 2 Frontend Wiring: Service Layer', () => {
  const ragApiSource = fs.readFileSync(RAG_API_PATH, 'utf-8');
  const gptApiSource = fs.readFileSync(GPT_API_PATH, 'utf-8');

  it('GATE 12 — ragAPI has auth interceptor (Bearer token)', () => {
    expect(ragApiSource).toContain('Bearer');
    expect(ragApiSource).toContain('getToken');
    expect(ragApiSource).toContain('interceptors');
  });

  it('GATE 13 — gptAPI has auth interceptor (Bearer token)', () => {
    expect(gptApiSource).toContain('Bearer');
    expect(gptApiSource).toContain('getToken');
    expect(gptApiSource).toContain('interceptors');
  });

  it('GATE 14 — ragAPI exposes all 9 endpoint methods', () => {
    const methods = [
      'getDatasets',
      'getDataset',
      'createDataset',
      'deleteDataset',
      'reindexDataset',
      'getDocuments',
      'addDocument',
      'deleteDocument',
      'getChunks',
    ];
    const missing = methods.filter((m) => !ragApiSource.includes(m));
    expect(missing).toEqual([]);
  });

  it('GATE 15 — gptAPI exposes 20+ endpoint methods', () => {
    const methods = [
      'getAvailableGPTs',
      'getSystemGPTs',
      'getFeaturedGPTs',
      'getPopularGPTs',
      'searchGPTs',
      'getGPTById',
      'createGPT',
      'updateGPT',
      'deleteGPT',
      'createConversation',
      'getConversation',
      'getUserConversations',
      'getConversationHistory',
      'getConversationTrace',
      'sendMessage',
      'archiveConversation',
      'deleteConversation',
      'rateConversation',
      'getGPTStatistics',
      'getCountyStatistics',
    ];
    const missing = methods.filter((m) => !gptApiSource.includes(m));
    expect(missing).toEqual([]);
  });

  it('GATE 16 — all 3 target files are production-shaped', () => {
    const ragLines = fs.readFileSync(RAG_MANAGER_PATH, 'utf-8').split('\n').length;
    const gptLines = fs.readFileSync(GPT_DASHBOARD_PATH, 'utf-8').split('\n').length;
    const atlasLines = fs.readFileSync(ATLAS_PANEL_PATH, 'utf-8').split('\n').length;
    // All must be non-trivial production components (>100 lines)
    expect(ragLines).toBeGreaterThan(100);
    expect(gptLines).toBeGreaterThan(100);
    expect(atlasLines).toBeGreaterThan(100);
  });
});

/* ═══════════════════════════════════════════════════════════════
 * SECTION E: Backend Truth Cross-Check
 * ═══════════════════════════════════════════════════════════════ */
describe('Wave 2 Frontend Wiring: Backend Truth Cross-Check', () => {
  it('GATE 17 — backend truth registry documents county isolation gaps', () => {
    const unscoped = getUnscopedEndpoints();
    // W2-RAG-01 through W2-RAG-07: 7+ unscoped RAG endpoints
    expect(unscoped.length).toBeGreaterThanOrEqual(7);
  });

  it('service lane markers are canonical', () => {
    expect(WAVE2_RAG_SERVICE_LANE).toBe('canonical');
    expect(WAVE2_GPT_SERVICE_LANE).toBe('canonical');
    expect(RAG_API_BASE_PATH).toBe('/api/rag');
    expect(GPT_API_BASE_PATH).toBe('/api/gpt');
  });

  it('backend truth aligned endpoints match frontend coverage', () => {
    const aligned = getAlignedEndpoints();
    // All RAG (9) + GPT anonymous (16) should be aligned = 25+
    expect(aligned.length).toBeGreaterThanOrEqual(25);
  });
});
