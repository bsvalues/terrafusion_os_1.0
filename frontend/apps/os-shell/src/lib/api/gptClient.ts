// frontend/apps/os-shell/src/lib/api/gptClient.ts

import { getViteEnv } from '../../env/getViteEnv';

export type GPTConfigurationDto = {
  key: string;
  name: string;
  description: string;
};

export type GPTMessageDto = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  // RAG metadata (optional, present for assistant responses using RAG)
  ragDocumentsUsed?: string[] | null;
  ragScore?: number | null;
};

export type ConversationDto = {
  id: string;
  title: string;
};

export type RagDatasetStatus = {
  id: string;
  name: string;
  indexed: boolean;
  documentCount: number;
  embeddingCount: number;
  lastUpdated?: string;
};

export type RagHealthDto = {
  status: string;
  timestamp: string;
  datasets: RagDatasetStatus[];
  error?: string;
};

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error (${res.status}): ${res.statusText} ${text && '- ' + text}`);
  }
  return (await res.json()) as T;
}

export async function getSystemGpts(): Promise<GPTConfigurationDto[]> {
  const res = await fetch(`${API_BASE_URL}/api/gpt/system`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<GPTConfigurationDto[]>(res);
}

export async function createConversation(gptKey: string): Promise<ConversationDto> {
  const res = await fetch(
    `${API_BASE_URL}/api/gpt/system/${encodeURIComponent(gptKey)}/conversations`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}', // simple empty POST; adjust if your API expects more
    }
  );
  return handleResponse<ConversationDto>(res);
}

export async function sendMessage(conversationId: string, content: string): Promise<GPTMessageDto> {
  const res = await fetch(
    `${API_BASE_URL}/api/gpt/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }
  );
  return handleResponse<GPTMessageDto>(res);
}

export async function getMessages(conversationId: string): Promise<GPTMessageDto[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/gpt/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return handleResponse<GPTMessageDto[]>(res);
}

/**
 * Get RAG system health status
 */
export async function getRagHealth(): Promise<RagHealthDto> {
  const res = await fetch(`${API_BASE_URL}/api/gpt/rag/health`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<RagHealthDto>(res);
}

/**
 * Trigger RAG ingestion for a dataset
 */
export async function indexRagDataset(datasetId: string): Promise<{
  datasetId: string;
  success: boolean;
  documentCount: number;
  chunkCount: number;
  error?: string;
}> {
  const res = await fetch(`${API_BASE_URL}/api/gpt/rag/index/${encodeURIComponent(datasetId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(res);
}

// Phase 11: Conversation Trace Types

/**
 * Phase 11: RAG chunk detail for audit trail
 */
export type RAGChunkDetailDto = {
  chunkId: number;
  documentTitle: string;
  sourceUrl?: string | null;
  textSnippet: string;
  score: number;
  chunkIndex: number;
};

export type TraceMessageDto = {
  id: number;
  role: string;
  content: string;
  createdAt: string;
  tokensUsed: number;
  cost: number;
  ragUsed: boolean;
  ragDocuments?: string[] | null;
  ragScore?: number | null;
  /** Phase 11: Detailed chunk information for audit trail */
  ragChunkDetails?: RAGChunkDetailDto[] | null;
};

export type ConversationTraceDto = {
  conversationId: number;
  gptKey: string;
  gptDisplayName: string;
  title?: string;
  messageCount: number;
  totalTokensUsed: number;
  totalCost: number;
  messages: TraceMessageDto[];
  createdAt: string;
  lastMessageAt?: string;
};

/**
 * Get conversation trace with full RAG audit details (Phase 11)
 */
export async function getConversationTrace(conversationId: string): Promise<ConversationTraceDto> {
  const res = await fetch(
    `${API_BASE_URL}/api/gpt/conversations/${encodeURIComponent(conversationId)}/trace`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return handleResponse<ConversationTraceDto>(res);
}
