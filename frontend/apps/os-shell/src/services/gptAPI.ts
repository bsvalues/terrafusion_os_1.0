// TerraFusionGPT Suite: API Service Layer
// Elite Government OS Engineering - Frontend Integration

import axios, { AxiosInstance } from 'axios';

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';
const API_BASE_URL = getViteEnv().VITE_API_URL || '';

/**
 * GPT Configuration entity
 */
export interface GPTConfiguration {
  id: number;
  name: string;
  displayName: string;
  description?: string;
  iconUrl?: string;
  category?: string;
  isSystemGPT: boolean;
  isPublic: boolean;
  createdByUserId?: string;
  countyId?: number;
  modelProvider: string;
  modelName: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  enableRAG: boolean;
  ragDatasetId?: number;
  ragTopK: number;
  ragScoreThreshold: number;
  enableFunctions: boolean;
  functionsJson?: string;
  requiredRole?: string;
  allowedCounties?: string;
  totalConversations: number;
  totalMessages: number;
  totalTokensUsed: number;
  totalCost: number;
  averageRating?: number;
  ratingCount: number;
  installCount: number;
  isFeatured: boolean;
  price: number;
  status: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * GPT Conversation entity
 */
export interface GPTConversation {
  id: number;
  gptConfigurationId: number;
  userId: string;
  countyId: number;
  title?: string;
  totalMessages: number;
  totalTokensUsed: number;
  totalCost: number;
  duration?: number;
  rating?: number;
  feedback?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  gptConfiguration?: GPTConfiguration;
}

/**
 * GPT Message entity
 */
export interface GPTMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  modelUsed?: string;
  provider?: string;
  functionName?: string;
  functionArgs?: string;
  functionResult?: string;
  ragDocumentsUsed?: string;
  ragScore?: number;
  responseTime?: number;
  finishReason?: string;
  createdAt: string;
}

/**
 * GPT Usage Statistics
 */
export interface GPTUsageStatistics {
  gptConfigId: number;
  gptName: string;
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  uniqueUsers: number;
  averageRating: number;
  ratingCount: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * County Usage Statistics
 */
export interface CountyUsageStatistics {
  countyId: number;
  countyName: string;
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  activeUsers: number;
  costByGPT: Record<string, number>;
  tokensByProvider: Record<string, number>;
  periodStart: string;
  periodEnd: string;
}

/**
 * Create Conversation Request
 */
export interface CreateConversationRequest {
  gptConfigId: number;
  title?: string;
}

/**
 * Send Message Request
 */
export interface SendMessageRequest {
  gptConfigId: number;
  message: string;
}

/**
 * Rate Conversation Request
 */
export interface RateConversationRequest {
  rating: number;
  feedback?: string;
}

/**
 * GPT API Service
 */
class GPTAPIService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/gpt`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.api.interceptors.request.use((config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ==================== GPT Configuration Management ====================

  /**
   * Get all available GPTs for current user
   */
  async getAvailableGPTs(): Promise<GPTConfiguration[]> {
    const response = await this.api.get<GPTConfiguration[]>('/');
    return response.data;
  }

  /**
   * Get system-provided GPTs
   */
  async getSystemGPTs(): Promise<GPTConfiguration[]> {
    const response = await this.api.get<GPTConfiguration[]>('/system');
    return response.data;
  }

  /**
   * Get featured GPTs
   */
  async getFeaturedGPTs(): Promise<GPTConfiguration[]> {
    const response = await this.api.get<GPTConfiguration[]>('/featured');
    return response.data;
  }

  /**
   * Get popular GPTs
   */
  async getPopularGPTs(count: number = 10): Promise<GPTConfiguration[]> {
    const response = await this.api.get<GPTConfiguration[]>('/popular', {
      params: { count },
    });
    return response.data;
  }

  /**
   * Search GPTs
   */
  async searchGPTs(query: string): Promise<GPTConfiguration[]> {
    const response = await this.api.get<GPTConfiguration[]>('/search', {
      params: { query },
    });
    return response.data;
  }

  /**
   * Get GPT by ID
   */
  async getGPTById(id: number): Promise<GPTConfiguration> {
    const response = await this.api.get<GPTConfiguration>(`/${id}`);
    return response.data;
  }

  /**
   * Create a new GPT
   */
  async createGPT(gpt: Partial<GPTConfiguration>): Promise<GPTConfiguration> {
    const response = await this.api.post<GPTConfiguration>('/', gpt);
    return response.data;
  }

  /**
   * Update a GPT
   */
  async updateGPT(id: number, gpt: Partial<GPTConfiguration>): Promise<GPTConfiguration> {
    const response = await this.api.put<GPTConfiguration>(`/${id}`, gpt);
    return response.data;
  }

  /**
   * Delete a GPT
   */
  async deleteGPT(id: number): Promise<void> {
    await this.api.delete(`/${id}`);
  }

  // ==================== Conversation Management ====================

  /**
   * Create a new conversation
   */
  async createConversation(request: CreateConversationRequest): Promise<GPTConversation> {
    const response = await this.api.post<GPTConversation>('/conversations', request);
    return response.data;
  }

  /**
   * Get conversation by ID
   */
  async getConversation(id: number): Promise<GPTConversation> {
    const response = await this.api.get<GPTConversation>(`/conversations/${id}`);
    return response.data;
  }

  /**
   * Get user's conversations for a GPT
   */
  async getUserConversations(gptId: number, limit: number = 20): Promise<GPTConversation[]> {
    const response = await this.api.get<GPTConversation[]>(`/${gptId}/conversations`, {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId: number, limit: number = 50): Promise<GPTMessage[]> {
    const response = await this.api.get<GPTMessage[]>(`/conversations/${conversationId}/history`, {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Send a message to a GPT
   */
  async sendMessage(conversationId: number, request: SendMessageRequest): Promise<GPTMessage> {
    const response = await this.api.post<GPTMessage>(
      `/conversations/${conversationId}/messages`,
      request
    );
    return response.data;
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: number): Promise<void> {
    await this.api.post(`/conversations/${conversationId}/archive`);
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: number): Promise<void> {
    await this.api.delete(`/conversations/${conversationId}`);
  }

  /**
   * Rate a conversation
   */
  async rateConversation(conversationId: number, request: RateConversationRequest): Promise<void> {
    await this.api.post(`/conversations/${conversationId}/rate`, request);
  }

  // ==================== Statistics ====================

  /**
   * Get GPT usage statistics
   */
  async getGPTStatistics(
    gptId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<GPTUsageStatistics> {
    const response = await this.api.get<GPTUsageStatistics>(`/${gptId}/statistics`, {
      params: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
    });
    return response.data;
  }

  /**
   * Get county usage statistics (admin only)
   */
  async getCountyStatistics(startDate?: Date, endDate?: Date): Promise<CountyUsageStatistics> {
    const response = await this.api.get<CountyUsageStatistics>('/statistics/county', {
      params: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
    });
    return response.data;
  }
}

// Export singleton instance
export const gptAPI = new GPTAPIService();
export default gptAPI;
