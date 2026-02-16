// TerraFusionGPT Suite: SignalR Hub Client
// Elite Government OS Engineering - Real-Time Communication

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';
import * as signalR from '@microsoft/signalr';
import { GPTConfiguration, GPTMessage } from './gptAPI';

const env = getViteEnv();
const HUB_URL = env.VITE_API_URL
  ? `${env.VITE_API_URL}/hubs/gpt`
  : 'http://localhost:5000/hubs/gpt';

/**
 * Message chunk for streaming responses
 */
export interface MessageChunk {
  conversationId: number;
  chunk: string;
  chunkIndex: number;
  timestamp: string;
}

/**
 * Typing indicator event
 */
export interface TypingIndicator {
  conversationId: number;
  isTyping: boolean;
  userId: string;
  timestamp: string;
}

/**
 * Conversation update event
 */
export interface ConversationUpdate {
  conversationId: number;
  updateType: string;
  data: any;
  timestamp: string;
}

/**
 * GPT update event
 */
export interface GPTUpdate {
  gptId: number;
  updateType: string;
  data: any;
  timestamp: string;
}

/**
 * Usage alert event
 */
export interface UsageAlert {
  countyId: number;
  alertType: string;
  data: any;
  timestamp: string;
}

/**
 * Cost update event
 */
export interface CostUpdate {
  conversationId: number;
  totalCost: number;
  totalTokens: number;
  timestamp: string;
}

/**
 * GPT Hub Event Handlers
 */
export interface GPTHubEventHandlers {
  onMessageChunk?: (chunk: MessageChunk) => void;
  onMessage?: (data: { conversationId: number; message: GPTMessage; timestamp: string }) => void;
  onTypingIndicator?: (indicator: TypingIndicator) => void;
  onConversationUpdate?: (update: ConversationUpdate) => void;
  onNewGPT?: (data: { gpt: GPTConfiguration; timestamp: string }) => void;
  onGPTUpdate?: (update: GPTUpdate) => void;
  onCountyGPTUpdate?: (update: any) => void;
  onUsageAlert?: (alert: UsageAlert) => void;
  onCostUpdate?: (update: CostUpdate) => void;
  onRAGProcessingStatus?: (status: any) => void;
  onRefreshRequested?: (data: any) => void;
  onPong?: (data: { timestamp: string; connectionId: string }) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onReconnecting?: () => void;
  onReconnected?: () => void;
  onError?: (error: Error) => void;
}

/**
 * GPT SignalR Hub Client
 */
class GPTHubClient {
  private connection: signalR.HubConnection | null = null;
  private handlers: GPTHubEventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Initialize and start connection
   */
  async start(eventHandlers: GPTHubEventHandlers): Promise<void> {
    this.handlers = eventHandlers;

    // Get auth token
    const token = getToken();

    // Build connection
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token || '',
        withCredentials: true,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
            return null; // Stop reconnecting
          }
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Register event handlers
    this.registerEventHandlers();

    // Connection lifecycle handlers
    this.connection.onreconnecting(() => {
      console.log('GPT Hub: Reconnecting...');
      this.handlers.onReconnecting?.();
    });

    this.connection.onreconnected(() => {
      console.log('GPT Hub: Reconnected');
      this.reconnectAttempts = 0;
      this.handlers.onReconnected?.();
    });

    this.connection.onclose((error) => {
      console.log('GPT Hub: Connection closed', error);
      this.handlers.onDisconnected?.();
      if (error) {
        this.handlers.onError?.(error);
      }
    });

    // Start connection
    try {
      await this.connection.start();
      console.log('GPT Hub: Connected successfully');
      this.handlers.onConnected?.();
    } catch (error) {
      console.error('GPT Hub: Connection failed', error);
      this.handlers.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop connection
   */
  async stop(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
    }
  }

  /**
   * Register all event handlers
   */
  private registerEventHandlers(): void {
    if (!this.connection) return;

    // Message chunk (streaming)
    this.connection.on('ReceiveMessageChunk', (data: MessageChunk) => {
      this.handlers.onMessageChunk?.(data);
    });

    // Complete message
    this.connection.on('ReceiveMessage', (data: any) => {
      this.handlers.onMessage?.(data);
    });

    // Typing indicator
    this.connection.on('TypingIndicator', (data: TypingIndicator) => {
      this.handlers.onTypingIndicator?.(data);
    });

    // Conversation update
    this.connection.on('ConversationUpdate', (data: ConversationUpdate) => {
      this.handlers.onConversationUpdate?.(data);
    });

    // New GPT available
    this.connection.on('NewGPTAvailable', (data: any) => {
      this.handlers.onNewGPT?.(data);
    });

    // GPT update
    this.connection.on('GPTUpdate', (data: GPTUpdate) => {
      this.handlers.onGPTUpdate?.(data);
    });

    // County GPT update
    this.connection.on('CountyGPTUpdate', (data: any) => {
      this.handlers.onCountyGPTUpdate?.(data);
    });

    // Usage alert
    this.connection.on('UsageAlert', (data: UsageAlert) => {
      this.handlers.onUsageAlert?.(data);
    });

    // Cost update
    this.connection.on('CostUpdate', (data: CostUpdate) => {
      this.handlers.onCostUpdate?.(data);
    });

    // RAG processing status
    this.connection.on('RAGProcessingStatus', (data: any) => {
      this.handlers.onRAGProcessingStatus?.(data);
    });

    // Refresh requested
    this.connection.on('RefreshRequested', (data: any) => {
      this.handlers.onRefreshRequested?.(data);
    });

    // Pong response
    this.connection.on('Pong', (data: any) => {
      this.handlers.onPong?.(data);
    });

    // Subscription confirmations
    this.connection.on('SubscribedToConversation', (conversationId: number) => {
      console.log(`GPT Hub: Subscribed to conversation ${conversationId}`);
    });

    this.connection.on('SubscribedToMarketplace', () => {
      console.log('GPT Hub: Subscribed to marketplace');
    });

    this.connection.on('SubscribedToCountyGPTs', (countyId: number) => {
      console.log(`GPT Hub: Subscribed to county ${countyId} GPTs`);
    });
  }

  // ==================== Client Methods ====================

  /**
   * Subscribe to conversation updates
   */
  async subscribeToConversation(conversationId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected to GPT Hub');
    await this.connection.invoke('SubscribeToConversation', conversationId);
  }

  /**
   * Unsubscribe from conversation updates
   */
  async unsubscribeFromConversation(conversationId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected to GPT Hub');
    await this.connection.invoke('UnsubscribeFromConversation', conversationId);
  }

  /**
   * Subscribe to marketplace updates
   */
  async subscribeToMarketplace(): Promise<void> {
    if (!this.connection) throw new Error('Not connected to GPT Hub');
    await this.connection.invoke('SubscribeToMarketplace');
  }

  /**
   * Subscribe to county GPT updates
   */
  async subscribeToCountyGPTs(countyId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected to GPT Hub');
    await this.connection.invoke('SubscribeToCountyGPTs', countyId);
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(conversationId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected to GPT Hub');
    await this.connection.invoke('SendTypingIndicator', conversationId);
  }

  /**
   * Request conversation refresh
   */
  async requestConversationRefresh(conversationId: number): Promise<void> {
    if (!this.connection) throw new Error('Not connected to GPT Hub');
    await this.connection.invoke('RequestConversationRefresh', conversationId);
  }

  /**
   * Ping to check connection health
   */
  async ping(): Promise<void> {
    if (!this.connection) throw new Error('Not connected to GPT Hub');
    await this.connection.invoke('Ping');
  }

  /**
   * Get connection state
   */
  getConnectionState(): signalR.HubConnectionState {
    return this.connection?.state || signalR.HubConnectionState.Disconnected;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Export singleton instance
export const gptHub = new GPTHubClient();
export default gptHub;
