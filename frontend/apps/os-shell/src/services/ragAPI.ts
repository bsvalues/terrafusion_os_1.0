// TerraFusionGPT Suite: RAG Dataset API Service Layer
// Elite Government OS Engineering - Knowledge Base Management

import axios, { AxiosInstance, AxiosError } from 'axios';

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';

/** Error thrown when the RAG backend service is not available or not implemented. */
export class RAGServiceUnavailableError extends Error {
  constructor(message = 'RAG service not configured') {
    super(message);
    this.name = 'RAGServiceUnavailableError';
  }
}

/**
 * Determine whether an axios error represents a "service not available" condition
 * (404 = endpoint not registered, 501 = not implemented, network error = backend down).
 */
function isServiceUnavailable(error: AxiosError): boolean {
  const status = error.response?.status;
  return status === 404 || status === 501 || !error.response;
}

/**
 * Wrap an axios error into either a RAGServiceUnavailableError (for 404/501/network)
 * or re-throw the original error for everything else.
 */
function normalizeError(error: unknown): never {
  if (axios.isAxiosError(error) && isServiceUnavailable(error)) {
    throw new RAGServiceUnavailableError();
  }
  throw error;
}

// ---- Interfaces ----

export interface RAGDataset {
  id: number;
  name: string;
  description?: string;
  countyId?: number;
  category?: string;
  embeddingProvider: string;
  embeddingModel: string;
  documentCount: number;
  totalChunks: number;
  totalEmbeddings: number;
  storageSize: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RAGDocument {
  id: number;
  datasetId: number;
  title: string;
  content: string;
  sourceUrl?: string;
  documentType?: string;
  author?: string;
  chunkCount: number;
  embeddingCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RAGDocumentChunk {
  id: number;
  documentId: number;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  hasEmbedding: boolean;
  createdAt: string;
}

export interface CreateDatasetRequest {
  name: string;
  description?: string;
  category?: string;
  embeddingProvider: string;
  embeddingModel: string;
}

export interface UploadDocumentRequest {
  title: string;
  content: string;
  sourceUrl?: string;
  documentType?: string;
  author?: string;
}

/**
 * RAG API Service — mirrors the gptAPI pattern with bearer-token auth.
 *
 * All methods gracefully throw `RAGServiceUnavailableError` when the backend
 * returns 404, 501, or is unreachable, allowing the UI to fall back to
 * placeholder state without faking success.
 */
class RAGAPIService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/rag`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Auth interceptor — same pattern as gptAPI
    this.api.interceptors.request.use((config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ==================== Datasets ====================

  async getDatasets(): Promise<RAGDataset[]> {
    try {
      const response = await this.api.get<RAGDataset[]>('/datasets');
      return response.data;
    } catch (error) {
      normalizeError(error);
    }
  }

  async createDataset(request: CreateDatasetRequest): Promise<RAGDataset> {
    try {
      const response = await this.api.post<RAGDataset>('/datasets', request);
      return response.data;
    } catch (error) {
      normalizeError(error);
    }
  }

  async deleteDataset(id: number): Promise<void> {
    try {
      await this.api.delete(`/datasets/${id}`);
    } catch (error) {
      normalizeError(error);
    }
  }

  async reindexDataset(id: number): Promise<void> {
    try {
      await this.api.post(`/datasets/${id}/reindex`);
    } catch (error) {
      normalizeError(error);
    }
  }

  // ==================== Documents ====================

  async getDocuments(datasetId: number): Promise<RAGDocument[]> {
    try {
      const response = await this.api.get<RAGDocument[]>(`/datasets/${datasetId}/documents`);
      return response.data;
    } catch (error) {
      normalizeError(error);
    }
  }

  async uploadDocument(datasetId: number, request: UploadDocumentRequest): Promise<RAGDocument> {
    try {
      const response = await this.api.post<RAGDocument>(
        `/datasets/${datasetId}/documents`,
        request
      );
      return response.data;
    } catch (error) {
      normalizeError(error);
    }
  }

  async deleteDocument(id: number): Promise<void> {
    try {
      await this.api.delete(`/documents/${id}`);
    } catch (error) {
      normalizeError(error);
    }
  }

  // ==================== Chunks ====================

  async getChunks(documentId: number): Promise<RAGDocumentChunk[]> {
    try {
      const response = await this.api.get<RAGDocumentChunk[]>(`/documents/${documentId}/chunks`);
      return response.data;
    } catch (error) {
      normalizeError(error);
    }
  }
}

// Export singleton
export const ragAPI = new RAGAPIService();
export default ragAPI;
