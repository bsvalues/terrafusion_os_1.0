/**
 * ragWiring.contract.test.ts
 *
 * Wave 2: RAG & GPT API Completion contract tests.
 *
 * Enforces that:
 *   1. ragAPI service imports getToken from authStorage (auth interceptor)
 *   2. RAGDatasetManager imports ragAPI (no more fetch stubs)
 *   3. RAGDatasetManager has no commented-out TODO stubs
 *   4. GPTManagementDashboard uses useSession (no hardcoded userId)
 *
 * These are static-analysis tests (file content inspection) — they do NOT
 * require a running backend or React rendering.
 *
 * @module __tests__/auth/ragWiring.contract.test
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
// Gate 1: ragAPI service has auth interceptor via getToken
// ============================================================================

describe('Gate 1 — ragAPI auth interceptor', () => {
  const src = readSrc('services/ragAPI.ts');

  it('imports getToken from authStorage', () => {
    expect(src).toMatch(/import\s+\{[^}]*getToken[^}]*\}\s+from\s+['"]@\/auth\/authStorage['"]/);
  });

  it('attaches Bearer token in interceptor', () => {
    expect(src).toContain('Bearer');
    expect(src).toContain('interceptors.request.use');
  });

  it('targets /api/rag base URL', () => {
    expect(src).toContain('/api/rag');
  });
});

// ============================================================================
// Gate 2: RAGDatasetManager imports ragAPI (not raw fetch)
// ============================================================================

describe('Gate 2 — RAGDatasetManager wiring', () => {
  const src = readSrc('components/gpt/RAGDatasetManager.tsx');

  it('imports ragAPI service', () => {
    expect(src).toMatch(/import\s+\{[^}]*ragAPI[^}]*\}\s+from\s+['"]@\/services\/ragAPI['"]/);
  });

  it('calls ragAPI.getDatasets()', () => {
    expect(src).toContain('ragAPI.getDatasets()');
  });

  it('calls ragAPI.getDocuments(', () => {
    expect(src).toContain('ragAPI.getDocuments(');
  });

  it('calls ragAPI.getChunks(', () => {
    expect(src).toContain('ragAPI.getChunks(');
  });

  it('calls ragAPI.createDataset(', () => {
    expect(src).toContain('ragAPI.createDataset(');
  });

  it('calls ragAPI.addDocument(', () => {
    expect(src).toContain('ragAPI.addDocument(');
  });

  it('calls ragAPI.deleteDataset(', () => {
    expect(src).toContain('ragAPI.deleteDataset(');
  });

  it('calls ragAPI.deleteDocument(', () => {
    expect(src).toContain('ragAPI.deleteDocument(');
  });

  it('calls ragAPI.reindexDataset(', () => {
    expect(src).toContain('ragAPI.reindexDataset(');
  });

  it('has no remaining TODO stubs for API calls', () => {
    // All "TODO: Implement" comments should be gone
    expect(src).not.toMatch(/\/\/\s*TODO:\s*Implement (RAG )?API/i);
  });
});

// ============================================================================
// Gate 3: GPTManagementDashboard uses session auth (no hardcoded userId)
// ============================================================================

describe('Gate 3 — GPTManagementDashboard auth', () => {
  const src = readSrc('components/gpt/GPTManagementDashboard.tsx');

  it('imports useSession from auth module', () => {
    expect(src).toMatch(/import\s+\{[^}]*useSession[^}]*\}\s+from\s+['"]@\/auth\/useSession['"]/);
  });

  it('calls useSession()', () => {
    expect(src).toContain('useSession()');
  });

  it('uses session.userId instead of hardcoded string', () => {
    expect(src).toContain('session.userId');
  });

  it('does not contain hardcoded current-user-id', () => {
    expect(src).not.toContain("'current-user-id'");
  });
});
