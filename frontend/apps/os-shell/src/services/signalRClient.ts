/**
 * SignalR Client Service
 *
 * Provides real-time communication infrastructure for TerraFlow Quantum Command Center.
 * Connects to backend SignalR hubs for:
 * - Agent swarm telemetry (port 3004 - TerraFusion.Consciousness)
 * - Streaming analytics (port 3006 - TerraFusion.StreamingAnalytics)
 * - System notifications
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - Phase 1 Foundation
 */

import * as signalR from '@microsoft/signalr';
import { getViteEnv } from '../env/getViteEnv';

export type HubConnectionState = 'Disconnected' | 'Connecting' | 'Connected' | 'Reconnecting' | 'Disconnected';

export interface SignalRClientOptions {
  hubUrl: string;
  automaticReconnect?: boolean;
  reconnectDelays?: number[];
  accessToken?: string;
  onConnected?: () => void;
  onDisconnected?: (error?: Error) => void;
  onReconnecting?: (error?: Error) => void;
  onReconnected?: (connectionId?: string) => void;
}

/**
 * SignalR Client for real-time backend communication
 */
export class SignalRClient {
  private connection: signalR.HubConnection | null = null;
  private options: SignalRClientOptions;
  private eventHandlers: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  constructor(options: SignalRClientOptions) {
    this.options = {
      automaticReconnect: true,
      reconnectDelays: [0, 2000, 5000, 10000, 30000],
      ...options
    };
  }

  /**
   * Initialize the SignalR connection
   */
  async connect(): Promise<void> {
    if (this.connection) {
      console.warn('SignalR connection already exists');
      return;
    }

    try {
      // Build connection
      const builder = new signalR.HubConnectionBuilder()
        .withUrl(this.options.hubUrl, {
          accessTokenFactory: () => this.options.accessToken || '',
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents
        })
        .configureLogging(signalR.LogLevel.Information);

      // Add automatic reconnect if enabled
      if (this.options.automaticReconnect) {
        builder.withAutomaticReconnect(this.options.reconnectDelays);
      }

      this.connection = builder.build();

      // Register lifecycle event handlers
      this.connection.onclose((error) => {
        console.log('SignalR connection closed', error);
        this.options.onDisconnected?.(error);
      });

      this.connection.onreconnecting((error) => {
        console.log('SignalR reconnecting...', error);
        this.options.onReconnecting?.(error);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('SignalR reconnected', connectionId);
        this.options.onReconnected?.(connectionId);
      });

      // Start connection
      await this.connection.start();
      console.log(`SignalR connected to ${this.options.hubUrl}`);
      this.options.onConnected?.();

    } catch (error) {
      console.error('SignalR connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the hub
   */
  async disconnect(): Promise<void> {
    if (!this.connection) {
      return;
    }

    try {
      await this.connection.stop();
      this.connection = null;
      this.eventHandlers.clear();
      console.log('SignalR disconnected');
    } catch (error) {
      console.error('SignalR disconnect error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to hub events
   */
  on(eventName: string, handler: (...args: unknown[]) => void): void {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized. Call connect() first.');
    }

    // Store handler for cleanup
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    this.eventHandlers.get(eventName)!.add(handler);

    // Register with SignalR connection
    this.connection.on(eventName, handler);
  }

  /**
   * Unsubscribe from hub events
   */
  off(eventName: string, handler?: (...args: unknown[]) => void): void {
    if (!this.connection) {
      return;
    }

    if (handler) {
      // Remove specific handler
      this.connection.off(eventName, handler);
      this.eventHandlers.get(eventName)?.delete(handler);
    } else {
      // Remove all handlers for this event
      this.connection.off(eventName);
      this.eventHandlers.delete(eventName);
    }
  }

  /**
   * Invoke a hub method
   */
  async invoke<T = unknown>(methodName: string, ...args: unknown[]): Promise<T> {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized. Call connect() first.');
    }

    try {
      return await this.connection.invoke<T>(methodName, ...args);
    } catch (error) {
      console.error(`SignalR invoke error (${methodName}):`, error);
      throw error;
    }
  }

  /**
   * Send a message to the hub (fire-and-forget)
   */
  async send(methodName: string, ...args: unknown[]): Promise<void> {
    if (!this.connection) {
      throw new Error('SignalR connection not initialized. Call connect() first.');
    }

    try {
      await this.connection.send(methodName, ...args);
    } catch (error) {
      console.error(`SignalR send error (${methodName}):`, error);
      throw error;
    }
  }

  /**
   * Get current connection state
   */
  get state(): HubConnectionState {
    if (!this.connection) {
      return 'Disconnected';
    }

    switch (this.connection.state) {
      case signalR.HubConnectionState.Connected:
        return 'Connected';
      case signalR.HubConnectionState.Connecting:
        return 'Connecting';
      case signalR.HubConnectionState.Reconnecting:
        return 'Reconnecting';
      case signalR.HubConnectionState.Disconnected:
        return 'Disconnected';
      default:
        return 'Disconnected';
    }
  }

  /**
   * Check if connection is established
   */
  get isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Get connection ID
   */
  get connectionId(): string | null {
    return this.connection?.connectionId || null;
  }
}

/**
 * Factory for creating specific hub clients
 */
export class SignalRClientFactory {
  /**
   * Create client for AI Agent Swarm hub (TerraFusion.Consciousness)
   */
  static createSwarmClient(accessToken?: string): SignalRClient {
    return new SignalRClient({
      hubUrl: `${getViteEnv().VITE_CONSCIOUSNESS_URL || ''}/hubs/consciousness`,
      accessToken,
      automaticReconnect: true,
      onConnected: () => console.log('✅ Connected to AI Swarm Hub'),
      onDisconnected: (error) => console.warn('❌ Disconnected from AI Swarm Hub', error),
      onReconnecting: () => console.log('🔄 Reconnecting to AI Swarm Hub...'),
      onReconnected: () => console.log('✅ Reconnected to AI Swarm Hub')
    });
  }

  /**
   * Create client for Streaming Analytics hub (TerraFusion.StreamingAnalytics)
   */
  static createStreamingClient(accessToken?: string): SignalRClient {
    return new SignalRClient({
      hubUrl: `${getViteEnv().VITE_PERFORMANCE_URL || ''}/hubs/streaming`,
      accessToken,
      automaticReconnect: true,
      onConnected: () => console.log('✅ Connected to Streaming Analytics Hub'),
      onDisconnected: (error) => console.warn('❌ Disconnected from Streaming Analytics Hub', error),
      onReconnecting: () => console.log('🔄 Reconnecting to Streaming Analytics Hub...'),
      onReconnected: () => console.log('✅ Reconnected to Streaming Analytics Hub')
    });
  }

  /**
   * Create client for System Notifications hub (TerraFusion.API)
   */
  static createSystemClient(accessToken?: string): SignalRClient {
    return new SignalRClient({
      hubUrl: `${getViteEnv().VITE_API_URL || ''}/hubs/system`,
      accessToken,
      automaticReconnect: true,
      onConnected: () => console.log('✅ Connected to System Notifications Hub'),
      onDisconnected: (error) => console.warn('❌ Disconnected from System Notifications Hub', error),
      onReconnecting: () => console.log('🔄 Reconnecting to System Notifications Hub...'),
      onReconnected: () => console.log('✅ Reconnected to System Notifications Hub')
    });
  }
}

export default SignalRClient;
