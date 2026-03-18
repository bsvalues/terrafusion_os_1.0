import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SRC_ROOT = resolve(__dirname, '../..');

function readSrc(relativePath: string): string {
  return readFileSync(resolve(SRC_ROOT, relativePath), 'utf-8');
}

describe('Gate 1 — canonical Wave 2 GPT service lane exports', () => {
  const gptApiSrc = readSrc('services/gptAPI.ts');
  const ragApiSrc = readSrc('services/ragAPI.ts');
  const gptHubSrc = readSrc('services/gptHub.ts');

  it('gptAPI declares the canonical lane and base path', () => {
    expect(gptApiSrc).toContain("export const WAVE2_GPT_SERVICE_LANE = 'canonical'");
    expect(gptApiSrc).toContain("export const GPT_API_BASE_PATH = '/api/gpt'");
    expect(gptApiSrc).toContain('baseURL: `${API_BASE_URL}${GPT_API_BASE_PATH}`');
  });

  it('ragAPI declares the canonical lane and base path', () => {
    expect(ragApiSrc).toContain("export const WAVE2_RAG_SERVICE_LANE = 'canonical'");
    expect(ragApiSrc).toContain("export const RAG_API_BASE_PATH = '/api/rag'");
    expect(ragApiSrc).toContain('baseURL: `${API_BASE_URL}${RAG_API_BASE_PATH}`');
  });

  it('gptHub declares the canonical hub lane and path', () => {
    expect(gptHubSrc).toContain("export const WAVE2_GPT_HUB_LANE = 'canonical'");
    expect(gptHubSrc).toContain("export const GPT_HUB_PATH = '/hubs/gpt'");
    expect(gptHubSrc).toContain('`${env.VITE_API_URL}${GPT_HUB_PATH}`');
  });
});

describe('Gate 2 — routed GPT surfaces use canonical services', () => {
  const managementSrc = readSrc('components/gpt/GPTManagementDashboard.tsx');
  const ragSrc = readSrc('components/gpt/RAGDatasetManager.tsx');
  const chatSrc = readSrc('components/gpt/GPTChatInterface.tsx');
  const hostSrc = readSrc('pages/suites/GptSuiteHome.tsx');

  it('management dashboard imports gptAPI and gptHub from services', () => {
    expect(managementSrc).toContain("from '@/services/gptAPI'");
    expect(managementSrc).toContain("from '@/services/gptHub'");
  });

  it('dataset manager imports ragAPI and gptHub from services', () => {
    expect(ragSrc).toContain("from '@/services/ragAPI'");
    expect(ragSrc).toContain("from '@/services/gptHub'");
  });

  it('chat interface imports gptAPI and gptHub from services', () => {
    expect(chatSrc).toContain("from '@/services/gptAPI'");
    expect(chatSrc).toContain("from '@/services/gptHub'");
  });

  it('the /gpt host only mounts management and rag surfaces for the live slice', () => {
    expect(hostSrc).toContain('GPTManagementDashboard');
    expect(hostSrc).toContain('RAGDatasetManager');
    expect(hostSrc).not.toContain('GptStudioView');
  });
});

describe('Gate 3 — duplicate GPT clients remain quarantined', () => {
  const hostSrc = readSrc('pages/suites/GptSuiteHome.tsx');
  const managementSrc = readSrc('components/gpt/GPTManagementDashboard.tsx');
  const ragSrc = readSrc('components/gpt/RAGDatasetManager.tsx');
  const prototypeSrc = readSrc('features/gpt/GptStudioView.tsx');
  const apiClientSrc = readSrc('api/gptClient.ts');
  const libClientSrc = readSrc('lib/api/gptClient.ts');

  it('the active /gpt host does not import duplicate clients', () => {
    expect(hostSrc).not.toContain('api/gptClient');
    expect(hostSrc).not.toContain('lib/api/gptClient');
  });

  it('live management and rag surfaces do not import duplicate clients', () => {
    expect(managementSrc).not.toContain('api/gptClient');
    expect(managementSrc).not.toContain('lib/api/gptClient');
    expect(ragSrc).not.toContain('api/gptClient');
    expect(ragSrc).not.toContain('lib/api/gptClient');
  });

  it('prototype studio remains on the quarantined api client lane', () => {
    expect(prototypeSrc).toContain("from '../../api/gptClient'");
  });

  it('duplicate client files remain outside the canonical service namespace', () => {
    expect(apiClientSrc).not.toContain("WAVE2_GPT_SERVICE_LANE = 'canonical'");
    expect(libClientSrc).not.toContain("WAVE2_GPT_SERVICE_LANE = 'canonical'");
    expect(libClientSrc).not.toContain("WAVE2_RAG_SERVICE_LANE = 'canonical'");
  });
});