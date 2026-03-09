/**
 * Enhancement Communication Service - Frontend-Backend Integration
 * Establishes service-to-service communication for PhD-level enhancement phases
 */

import { signal } from '@preact/signals';
import { getViteEnv } from '../env/getViteEnv';

// Enhancement status interface
interface EnhancementStatus {
  overallStatus: string;
  phaseStatuses: Record<string, any>;
  overallEfficiency: number;
  lastUpdated: string;
}

// Enhancement metrics interface
interface EnhancementMetrics {
  performanceMetrics: Record<string, number>;
  statusMetrics: Record<string, string>;
  timestamp: string;
}

// Enhancement operation request interfaces
interface SwarmOperationRequest {
  operation: string;
  parameters?: Record<string, any>;
  agentCount?: number;
  priority?: string;
}

interface ConsciousnessRequest {
  speciesType: string;
  communicationType: string;
  parameters?: Record<string, any>;
  priority?: string;
}

interface SecurityAuditRequest {
  auditType: string;
  scope?: string;
  parameters?: Record<string, any>;
  quantumLevel?: string;
}

interface PerformanceOptimizationRequest {
  target: string;
  optimizationType?: string;
  parameters?: Record<string, any>;
  expectedGain?: number;
}

interface EnhancementCoordinationRequest {
  phases: string[];
  parameters?: Record<string, any>;
  priority?: string;
}

// Reactive signals for enhancement state
export const enhancementStatus = signal<EnhancementStatus | null>(null);
export const enhancementMetrics = signal<EnhancementMetrics | null>(null);
export const isEnhancementConnected = signal(false);
export const enhancementError = signal<string | null>(null);
export const lastEnhancementUpdate = signal<Date | null>(null);

// API endpoints configuration
const API_BASE_URL = getViteEnv().VITE_API_URL ? `${getViteEnv().VITE_API_URL}/api` : '/api';
const ENHANCEMENT_API_URL = `${API_BASE_URL}/enhancement`;

/**
 * Enhancement Communication Service Class
 * Manages all communication between frontend and backend enhancement systems
 */
export class EnhancementCommunicationService {
  private static instance: EnhancementCommunicationService;
  private hubConnection: any = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EnhancementCommunicationService {
    if (!this.instance) {
      this.instance = new EnhancementCommunicationService();
    }
    return this.instance;
  }

  /**
   * Initialize enhancement communication service
   */
  async initialize(): Promise<void> {
    try {
      // eslint-disable-next-line no-console
      console.debug('🚀 Initializing Enhancement Communication Service...');

      // Initialize SignalR connection for real-time updates
      await this.initializeSignalRConnection();

      // Get initial enhancement status
      await this.refreshEnhancementStatus();

      // Start periodic metrics updates
      this.startPeriodicUpdates();

      this.isInitialized = true;
      isEnhancementConnected.value = true;

      // eslint-disable-next-line no-console
      console.debug('✅ Enhancement Communication Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Enhancement Communication Service:', error);
      enhancementError.value = `Initialization failed: ${error}`;
      throw error;
    }
  }

  /**
   * Initialize SignalR connection for real-time enhancement updates
   */
  private async initializeSignalRConnection(): Promise<void> {
    try {
      // Import SignalR dynamically to avoid SSR issues
      const { HubConnectionBuilder, LogLevel } = await import('@microsoft/signalr');

      this.hubConnection = new HubConnectionBuilder()
        .withUrl(`${getViteEnv().VITE_API_URL || ''}/hubs/enhancement`)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupSignalREventHandlers();

      // Start connection
      await this.hubConnection.start();
      // eslint-disable-next-line no-console
      console.debug('🔗 Enhancement SignalR connection established');

      // Join enhancement monitoring groups
      await this.hubConnection.invoke('StartEnhancementMonitoring', [
        'Swarm',
        'Consciousness',
        'Security',
        'Performance',
      ]);
    } catch (error) {
      console.error('❌ SignalR connection failed:', error);
      throw error;
    }
  }

  /**
   * Set up SignalR event handlers for real-time updates
   */
  private setupSignalREventHandlers(): void {
    if (!this.hubConnection) return;

    // Enhancement status updates
    this.hubConnection.on('EnhancementStatusUpdate', (status: EnhancementStatus) => {
      enhancementStatus.value = status;
      lastEnhancementUpdate.value = new Date();
      // eslint-disable-next-line no-console
      console.debug('📊 Enhancement status updated:', status);
    });

    // Enhancement metrics updates
    this.hubConnection.on('EnhancementMetricsUpdate', (metrics: EnhancementMetrics) => {
      enhancementMetrics.value = metrics;
      lastEnhancementUpdate.value = new Date();
      // eslint-disable-next-line no-console
      console.debug('📈 Enhancement metrics updated:', metrics);
    });

    // Swarm operation complete
    this.hubConnection.on('SwarmOperationComplete', (result: any) => {
      // eslint-disable-next-line no-console
      console.debug('🤖 Swarm operation completed:', result);
      this.refreshEnhancementStatus();
    });

    // Consciousness update
    this.hubConnection.on('ConsciousnessUpdate', (result: any) => {
      // eslint-disable-next-line no-console
      console.debug('🧠 Consciousness coordination updated:', result);
      this.refreshEnhancementStatus();
    });

    // Security audit complete
    this.hubConnection.on('SecurityAuditComplete', (result: any) => {
      // eslint-disable-next-line no-console
      console.debug('🔒 Security audit completed:', result);
      this.refreshEnhancementStatus();
    });

    // Performance optimization complete
    this.hubConnection.on('PerformanceOptimizationComplete', (result: any) => {
      // eslint-disable-next-line no-console
      console.debug('⚡ Performance optimization completed:', result);
      this.refreshEnhancementStatus();
    });

    // Enhancement coordination complete
    this.hubConnection.on('EnhancementCoordinationComplete', (result: any) => {
      // eslint-disable-next-line no-console
      console.debug('🎯 Enhancement coordination completed:', result);
      this.refreshEnhancementStatus();
    });

    // Error handling
    this.hubConnection.on('EnhancementError', (error: any) => {
      console.error('❌ Enhancement error received:', error);
      enhancementError.value = error.error || 'Unknown enhancement error';
    });

    // Connection events
    this.hubConnection.onreconnecting(() => {
      // eslint-disable-next-line no-console
      console.debug('🔄 Enhancement SignalR reconnecting...');
      isEnhancementConnected.value = false;
    });

    this.hubConnection.onreconnected(() => {
      // eslint-disable-next-line no-console
      console.debug('✅ Enhancement SignalR reconnected');
      isEnhancementConnected.value = true;
      this.refreshEnhancementStatus();
    });

    this.hubConnection.onclose(() => {
      // eslint-disable-next-line no-console
      console.debug('🔴 Enhancement SignalR connection closed');
      isEnhancementConnected.value = false;
    });
  }

  /**
   * Get current enhancement status
   */
  async getEnhancementStatus(): Promise<EnhancementStatus> {
    try {
      const response = await fetch(`${ENHANCEMENT_API_URL}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const status: EnhancementStatus = await response.json();
      enhancementStatus.value = status;
      lastEnhancementUpdate.value = new Date();

      return status;
    } catch (error) {
      console.error('❌ Failed to get enhancement status:', error);
      enhancementError.value = `Status fetch failed: ${error}`;
      throw error;
    }
  }

  /**
   * Refresh enhancement status
   */
  async refreshEnhancementStatus(): Promise<void> {
    try {
      await this.getEnhancementStatus();
    } catch (error) {
      // Error already logged in getEnhancementStatus
    }
  }

  /**
   * Execute AI Swarm Virtual Machine operation
   */
  async executeSwarmOperation(request: SwarmOperationRequest): Promise<any> {
    try {
      // eslint-disable-next-line no-console
      console.debug('🤖 Executing swarm operation:', request);

      const response = await fetch(`${ENHANCEMENT_API_URL}/swarm/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      // eslint-disable-next-line no-console
      console.debug('✅ Swarm operation completed:', result);

      return result;
    } catch (error) {
      console.error('❌ Swarm operation failed:', error);
      enhancementError.value = `Swarm operation failed: ${error}`;
      throw error;
    }
  }

  /**
   * Execute Quantum Consciousness Matrix coordination
   */
  async coordinateConsciousness(request: ConsciousnessRequest): Promise<any> {
    try {
      // eslint-disable-next-line no-console
      console.debug('🧠 Coordinating consciousness:', request);

      const response = await fetch(`${ENHANCEMENT_API_URL}/consciousness/coordinate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      // eslint-disable-next-line no-console
      console.debug('✅ Consciousness coordination completed:', result);

      return result;
    } catch (error) {
      console.error('❌ Consciousness coordination failed:', error);
      enhancementError.value = `Consciousness coordination failed: ${error}`;
      throw error;
    }
  }

  /**
   * Execute Quantum Security Engine audit
   */
  async executeSecurityAudit(request: SecurityAuditRequest): Promise<any> {
    try {
      // eslint-disable-next-line no-console
      console.debug('🔒 Executing security audit:', request);

      const response = await fetch(`${ENHANCEMENT_API_URL}/security/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      // eslint-disable-next-line no-console
      console.debug('✅ Security audit completed:', result);

      return result;
    } catch (error) {
      console.error('❌ Security audit failed:', error);
      enhancementError.value = `Security audit failed: ${error}`;
      throw error;
    }
  }

  /**
   * Execute Performance Intelligence Matrix optimization
   */
  async optimizePerformance(request: PerformanceOptimizationRequest): Promise<any> {
    try {
      // eslint-disable-next-line no-console
      console.debug('⚡ Optimizing performance:', request);

      const response = await fetch(`${ENHANCEMENT_API_URL}/performance/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      // eslint-disable-next-line no-console
      console.debug('✅ Performance optimization completed:', result);

      return result;
    } catch (error) {
      console.error('❌ Performance optimization failed:', error);
      enhancementError.value = `Performance optimization failed: ${error}`;
      throw error;
    }
  }

  /**
   * Execute unified enhancement coordination
   */
  async coordinateEnhancements(request: EnhancementCoordinationRequest): Promise<any> {
    try {
      // eslint-disable-next-line no-console
      console.debug('🎯 Coordinating enhancements:', request);

      const response = await fetch(`${ENHANCEMENT_API_URL}/coordinate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      // eslint-disable-next-line no-console
      console.debug('✅ Enhancement coordination completed:', result);

      return result;
    } catch (error) {
      console.error('❌ Enhancement coordination failed:', error);
      enhancementError.value = `Enhancement coordination failed: ${error}`;
      throw error;
    }
  }

  /**
   * Get enhancement metrics
   */
  async getEnhancementMetrics(): Promise<EnhancementMetrics> {
    try {
      const response = await fetch(`${ENHANCEMENT_API_URL}/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const metrics: EnhancementMetrics = await response.json();
      enhancementMetrics.value = metrics;
      lastEnhancementUpdate.value = new Date();

      return metrics;
    } catch (error) {
      console.error('❌ Failed to get enhancement metrics:', error);
      enhancementError.value = `Metrics fetch failed: ${error}`;
      throw error;
    }
  }

  /**
   * Start periodic updates for enhancement status and metrics
   */
  private startPeriodicUpdates(): void {
    // Update status every 30 seconds
    setInterval(async () => {
      if (this.isInitialized && isEnhancementConnected.value) {
        try {
          await this.refreshEnhancementStatus();
        } catch (error) {
          // Error already logged
        }
      }
    }, 30000);

    // Update metrics every 10 seconds
    setInterval(async () => {
      if (this.isInitialized && isEnhancementConnected.value) {
        try {
          await this.getEnhancementMetrics();
        } catch (error) {
          // Error already logged
        }
      }
    }, 10000);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.hubConnection) {
        await this.hubConnection.stop();
        this.hubConnection = null;
      }

      this.isInitialized = false;
      isEnhancementConnected.value = false;

      // eslint-disable-next-line no-console
      console.debug('🧹 Enhancement Communication Service cleaned up');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const enhancementService = EnhancementCommunicationService.getInstance();

// Auto-initialize on import (can be disabled if needed)
if (typeof window !== 'undefined') {
  enhancementService.initialize().catch(console.error);
}
