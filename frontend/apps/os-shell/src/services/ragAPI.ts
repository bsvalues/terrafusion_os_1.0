// TerraFusion OS: RAG API Service Layer
// Wave 2 — Axios-based frontend client for /api/rag endpoints
// Follows gptAPI.ts auth-interceptor pattern (getToken + Bearer)

import axios, { AxiosInstance } from 'axios';
import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';
export const WAVE2_RAG_SERVICE_LANE = 'canonical';
export const RAG_API_BASE_PATH = '/api/rag';

// ==================== Types (mirror RAGDatasetManager local types) ====================

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
  totalEmbeddings?: number;
  storageSize?: number;
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
  embeddingCount?: number;
  status?: string;
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
  embeddingProvider?: string;
  embeddingModel?: string;
}

export interface AddDocumentRequest {
  title: string;
  content: string;
  sourceUrl?: string;
  documentType?: string;
  author?: string;
}

// ==================== Service ====================

class RAGAPIService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}${RAG_API_BASE_PATH}`,
      headers: { 'Content-Type': 'application/json' },
    });

    // Auth interceptor — mirrors gptAPI pattern
    this.api.interceptors.request.use((config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ---- Datasets ----

  async getDatasets(): Promise<RAGDataset[]> {
    const res = await this.api.get<RAGDataset[]>('/datasets');
    return res.data;
  }

  async getDataset(id: number): Promise<RAGDataset> {
    const res = await this.api.get<RAGDataset>(`/datasets/${id}`);
    return res.data;
  }

  async createDataset(request: CreateDatasetRequest): Promise<RAGDataset> {
    const res = await this.api.post<RAGDataset>('/datasets', request);
    return res.data;
  }

  async deleteDataset(id: number): Promise<void> {
    await this.api.delete(`/datasets/${id}`);
  }

  async reindexDataset(id: number): Promise<{ message: string; documentCount: number }> {
    const res = await this.api.post<{ message: string; documentCount: number }>(
      `/datasets/${id}/reindex`,
    );
    return res.data;
  }

  // ---- Documents ----

  async getDocuments(datasetId: number): Promise<RAGDocument[]> {
    const res = await this.api.get<RAGDocument[]>(`/datasets/${datasetId}/documents`);
    return res.data;
  }

  async addDocument(datasetId: number, request: AddDocumentRequest): Promise<RAGDocument> {
    const res = await this.api.post<RAGDocument>(`/datasets/${datasetId}/documents`, request);
    return res.data;
  }

  async deleteDocument(id: number): Promise<void> {
    await this.api.delete(`/documents/${id}`);
  }

  // ---- Chunks ----

  async getChunks(documentId: number): Promise<RAGDocumentChunk[]> {
    const res = await this.api.get<RAGDocumentChunk[]>(`/documents/${documentId}/chunks`);
    return res.data;
  }
}

/** Singleton instance — import this in components. */
export const ragAPI = new RAGAPIService();
export default ragAPI;
