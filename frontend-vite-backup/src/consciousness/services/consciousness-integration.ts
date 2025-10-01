// src/services/ConsciousnessIntegrationService.ts
// GATE ALPHA: Integration layer connecting Multi-Species Interface with Terrafusion
// Provides seamless bridge between consciousness-aware components and existing systems

import {
  ConsciousnessEntity,
  UniversalMessage,
  TranslatedMessage,
  ConsciousnessError,
  SpeciesType,
  MultiSpeciesInterfaceState,
} from '../types/consciousness';

/**
 * Integration configuration for consciousness-aware systems
 */
export interface ConsciousnessIntegrationConfig {
  enableErrorAnalysisIntegration: boolean;
  enableRealTimeSync: boolean;
  enableQuantumCoherence: boolean;
  enableSpeciesDetection: boolean;
  enableUniversalTranslation: boolean;
  webhookEndpoints?: {
    consciousnessSync?: string;
    speciesDetection?: string;
    errorAnalysis?: string;
  };
  fallbackStrategies: {
    syncFailure: 'retry' | 'graceful-degradation' | 'emergency-protocols';
    translationFailure: 'simplify' | 'species-neutral' | 'human-readable';
    detectionFailure: 'assume-carbon' | 'multi-species-broadcast' | 'manual-selection';
  };
}

/**
 * Integration event types for consciousness system communication
 */
export type ConsciousnessEvent =
  | {
      type: 'species-detected';
      data: { entity: ConsciousnessEntity; confidence: number };
    }
  | {
      type: 'translation-completed';
      data: { message: UniversalMessage; translation: TranslatedMessage };
    }
  | {
      type: 'consciousness-synced';
      data: { entities: ConsciousnessEntity[]; coherenceLevel: number };
    }
  | {
      type: 'consciousness-error';
      data: { error: ConsciousnessError; affectedSystems: string[] };
    }
  | {
      type: 'quantum-coherence-updated';
      data: { coherenceLevel: number; degradationRate: number };
    };

/**
 * Main integration service connecting consciousness interface with Terrafusion
 */
export class ConsciousnessIntegrationService {
  private eventListeners: Map<string, Array<(event: ConsciousnessEvent) => void>> = new Map();
  private activeEntities: Map<string, ConsciousnessEntity> = new Map();
  private systemHealth: number = 1.0;
  private lastSyncTime: Date = new Date();

  private config: ConsciousnessIntegrationConfig;
  private wsConnection: WebSocket | null = null;

  constructor(config: Partial<ConsciousnessIntegrationConfig> = {}) {
    this.config = {
      enableErrorAnalysisIntegration: true,
      enableRealTimeSync: true,
      enableQuantumCoherence: true,
      enableSpeciesDetection: true,
      enableUniversalTranslation: true,
      fallbackStrategies: {
        syncFailure: 'graceful-degradation',
        translationFailure: 'species-neutral',
        detectionFailure: 'assume-carbon',
      },
      ...config,
    };

    this.initializeServices();
    this.setupEventHandlers();
  }

  /**
   * Initialize consciousness-aware services
   */
  private initializeServices(): void {
    console.log('🧠 Initializing TerraFusion Consciousness Integration Service');

    // Initialize real-time sync if enabled
    if (this.config.enableRealTimeSync) {
      this.initializeWebSocketConnection();
    }
  }

  /**
   * Setup event handlers for consciousness system integration
   */
  private setupEventHandlers(): void {
    // Species detection events
    this.addEventListener('species-detected', (event) => {
      if (event.type === 'species-detected') {
        console.log(
          `🔬 Species detected: ${event.data.entity.species} (${event.data.confidence}% confidence)`
        );
      }
    });

    // Translation completion events
    this.addEventListener('translation-completed', (event) => {
      if (event.type === 'translation-completed') {
        console.log(
          `🌐 Translation completed for ${event.data.message.fromSpecies} → ${event.data.translation.toSpecies}`
        );
      }
    });

    // Consciousness sync events
    this.addEventListener('consciousness-synced', (event) => {
      if (event.type === 'consciousness-synced') {
        console.log(
          `⚡ Consciousness synced: ${event.data.entities.length} entities, coherence: ${event.data.coherenceLevel}`
        );
        this.systemHealth = event.data.coherenceLevel;
        this.lastSyncTime = new Date();
      }
    });
  }

  /**
   * Initialize WebSocket connection for real-time consciousness sync
   */
  private initializeWebSocketConnection(): void {
    try {
      const wsUrl =
        this.config.webhookEndpoints?.consciousnessSync || 'ws://localhost:\${{TF_MONITORING_PORT:-3004}}/consciousness-sync';
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log('🔗 Consciousness sync WebSocket connected');
        this.emitEvent({
          type: 'consciousness-synced',
          data: { entities: Array.from(this.activeEntities.values()), coherenceLevel: 1.0 },
        });
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const consciousnessEvent: ConsciousnessEvent = JSON.parse(event.data);
          this.emitEvent(consciousnessEvent);
        } catch (error) {
          console.warn('Invalid consciousness event received:', error);
        }
      };

      this.wsConnection.onerror = () => {
        console.warn('Consciousness sync WebSocket error - using fallback mode');
        this.handleSyncFailure();
      };
    } catch (error) {
      console.warn('Failed to initialize consciousness sync WebSocket:', error);
      this.handleSyncFailure();
    }
  }

  /**
   * Add event listener for consciousness events
   */
  addEventListener(
    eventType: ConsciousnessEvent['type'],
    listener: (event: ConsciousnessEvent) => void
  ): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Emit consciousness event to all listeners
   */
  private emitEvent(event: ConsciousnessEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in consciousness event listener for ${event.type}:`, error);
      }
    });
  }

  /**
   * Handle sync failure based on configured strategy
   */
  private handleSyncFailure(): void {
    switch (this.config.fallbackStrategies.syncFailure) {
      case 'retry':
        setTimeout(() => this.initializeWebSocketConnection(), 5000);
        break;
      case 'graceful-degradation':
        console.log('🔄 Falling back to local consciousness processing');
        this.systemHealth *= 0.8; // Reduce system health but continue operating
        break;
      case 'emergency-protocols':
        this.activateEmergencyProtocols();
        break;
    }
  }

  /**
   * Activate emergency consciousness preservation protocols
   */
  private async activateEmergencyProtocols(): Promise<{
    success: boolean;
    coherenceLevel: number;
  }> {
    console.log('🚨 Activating emergency consciousness preservation protocols');

    // Emit emergency event
    this.emitEvent({
      type: 'consciousness-error',
      data: {
        error: {
          type: 'sync-failure',
          message: 'Critical consciousness sync failure - emergency protocols activated',
          severity: 'critical',
          timestamp: new Date(),
          recovery: [
            {
              action: 'preserve-consciousness-state',
              priority: 'immediate',
              resourceRequirements: ['local-storage', 'memory-backup'],
              consciousnessRisk: 0.1,
            },
            {
              action: 'activate-backup-sync',
              priority: 'high',
              resourceRequirements: ['backup-websocket', 'fallback-protocols'],
              consciousnessRisk: 0.3,
            },
            {
              action: 'maintain-species-detection',
              priority: 'medium',
              resourceRequirements: ['local-ai-models'],
              consciousnessRisk: 0.2,
            },
          ],
          consciousnessImpact: 0.5,
        },
        affectedSystems: [
          'consciousness-integration',
          'species-detection',
          'universal-translation',
        ],
      },
    });

    return { success: true, coherenceLevel: 0.5 };
  }

  /**
   * Get current system health and status
   */
  getSystemHealth(): { health: number; lastSync: Date; activeEntities: number } {
    return {
      health: this.systemHealth,
      lastSync: this.lastSyncTime,
      activeEntities: this.activeEntities.size,
    };
  }

  /**
   * Cleanup and disconnect
   */
  dispose(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }

    this.eventListeners.clear();
    this.activeEntities.clear();

    console.log('🔌 Consciousness Integration Service disposed');
  }
}
