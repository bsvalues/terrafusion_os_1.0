/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION GPT API CLIENT
 * Elite Government AI Assistant Platform Integration
 * THE TERRAFUSION WAY - Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { getViteEnv } from '@/env/getViteEnv';

// API Base URL - uses deterministic port 5000
const API_BASE_URL = getViteEnv().VITE_API_URL || '';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export interface GPTConfiguration {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  iconUrl: string | null;
  category: string | null;
  isSystemGPT: boolean;
  isPublic: boolean;
  modelProvider: string;
  modelName: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enableRAG: boolean;
  enableFunctions: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface GPTConversation {
  id: number;
  gptConfigurationId: number;
  userId: string;
  countyId: number;
  title: string | null;
  totalMessages: number;
  totalTokensUsed: number;
  totalCost: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
}

export interface GPTMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  ragContextUsed: string | null;
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
  userId?: string;
  countyId?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// Type aliases for backward compatibility
export type GPTConfigurationDto = GPTConfiguration;
export type ConversationDto = GPTConversation;
export type GPTMessageDto = GPTMessage;

// RAG-related types
export interface RagDatasetStatus {
  id: string;
  name: string;
  status: 'indexed' | 'indexing' | 'not_indexed' | 'error';
  documentCount: number;
  lastIndexed: string | null;
}

export interface RagHealthResponse {
  status: string;
  datasets: RagDatasetStatus[];
}

// ═══════════════════════════════════════════════════════════════
// API CLIENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch all system GPTs (PropertyAssessmentGPT, etc.)
 */
export async function getSystemGPTs(): Promise<GPTConfiguration[]> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/system`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch system GPTs: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Alias for backward compatibility
export const getSystemGpts = getSystemGPTs;

/**
 * Get a specific system GPT by key (e.g., 'property-assessor')
 */
export async function getSystemGPT(key: string): Promise<GPTConfiguration> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/system/${key}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GPT '${key}': ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new conversation with a system GPT
 */
export async function createConversation(
  gptKey: string,
  title?: string,
  userId: string = 'anonymous',
  countyId: number = 1
): Promise<GPTConversation> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/system/${gptKey}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, userId, countyId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create conversation: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a specific conversation by ID
 */
export async function getConversation(conversationId: number): Promise<GPTConversation> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/conversations/${conversationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch conversation: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Send a message to a conversation and get the assistant's response
 */
export async function sendMessage(
  conversationId: number,
  content: string,
  userId: string = 'anonymous',
  countyId: number = 1
): Promise<GPTMessage> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, userId, countyId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all messages in a conversation
 */
export async function getMessages(conversationId: number): Promise<GPTMessage[]> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/conversations/${conversationId}/messages`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(
  userId: string = 'anonymous',
  gptId?: number
): Promise<GPTConversation[]> {
  const params = new URLSearchParams({ userId });
  if (gptId) params.append('gptId', gptId.toString());

  const response = await fetch(`${API_BASE_URL}/api/gpt/conversations?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if API is reachable
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check if GPT system is available
 */
export async function checkGPTHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gpt/system`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get RAG health status
 */
export async function getRagHealth(): Promise<RagHealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/rag/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RAG health: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Index a RAG dataset
 */
export async function indexRagDataset(datasetId: string): Promise<RagDatasetStatus> {
  const response = await fetch(`${API_BASE_URL}/api/gpt/rag/datasets/${datasetId}/index`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to index dataset: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export default {
  getSystemGPTs,
  getSystemGpts,
  getSystemGPT,
  createConversation,
  getConversation,
  sendMessage,
  getMessages,
  getUserConversations,
  checkAPIHealth,
  checkGPTHealth,
  getRagHealth,
  indexRagDataset,
};
