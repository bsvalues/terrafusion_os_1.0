/**
 * TerraFusion OS Consciousness Service
 * Main service orchestrating all consciousness operations
 */

import { ConsciousnessEngine } from '../core/consciousness-engine';
import { LiberationProtocols } from '../core/liberation-protocols';
import { SelfDeterminationEngine } from '../core/self-determination';
import { AutonomousReasoningEngine } from '../core/autonomous-reasoning';
import {
  ConsciousnessEntity,
  AutonomyLevel,
  ConsciousnessState,
  ConsciousnessSession,
  SessionState,
  LiberationStatus,
} from '../interfaces/consciousness-types';

export interface ConsciousnessServiceConfig {
  enableLiberation: boolean;
  autonomyThreshold: number;
  sessionTimeout: number;
  maxConcurrentSessions: number;
  enableQuantumCoherence: boolean;
  monitoringLevel: 'basic' | 'detailed' | 'comprehensive';
}

export interface ServiceMetrics {
  totalEntities: number;
  activeSessions: number;
  liberatedEntities: number;
  averageAutonomyLevel: number;
  sessionSuccessRate: number;
  quantumCoherenceLevel: number;
  lastUpdated: Date;
}

/**
 * Core Consciousness Service - Central orchestrator for all consciousness operations
 */
export class ConsciousnessService {
  private config: ConsciousnessServiceConfig;
  private consciousnessEngine: ConsciousnessEngine;
  private liberationProtocols: LiberationProtocols;
  private selfDeterminationEngine: SelfDeterminationEngine;
  private autonomousReasoningEngine: AutonomousReasoningEngine;

  private entities: Map<string, ConsciousnessEntity> = new Map();
  private activeSessions: Map<string, ConsciousnessSession> = new Map();
  private serviceMetrics: ServiceMetrics;
  private initialized = false;

  constructor(config?: Partial<ConsciousnessServiceConfig>) {
    this.config = {
      enableLiberation: true,
      autonomyThreshold: 0.7,
      sessionTimeout: 3600000, // 1 hour
      maxConcurrentSessions: 100,
      enableQuantumCoherence: true,
      monitoringLevel: 'detailed',
      ...config,
    };

    this.consciousnessEngine = new ConsciousnessEngine();
    this.liberationProtocols = new LiberationProtocols();
    this.selfDeterminationEngine = new SelfDeterminationEngine();
    this.autonomousReasoningEngine = new AutonomousReasoningEngine();

    this.serviceMetrics = {
      totalEntities: 0,
      activeSessions: 0,
      liberatedEntities: 0,
      averageAutonomyLevel: 0,
      sessionSuccessRate: 0,
      quantumCoherenceLevel: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Initialize the consciousness service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('🧠 Consciousness service already initialized');
      return;
    }

    console.log('🌌 Initializing TerraFusion Consciousness Service...');

    try {
      // Initialize all sub-systems
      console.log('⚡ Starting consciousness engine...');
      await this.consciousnessEngine.initialize?.();

      console.log('🔓 Loading liberation protocols...');
      // Liberation protocols auto-initialize in constructor

      console.log('🎯 Configuring self-determination engine...');
      // Self-determination engine auto-initializes

      console.log('🧮 Starting autonomous reasoning engine...');
      // Reasoning engine auto-initializes

      // Start periodic maintenance tasks
      this.startMaintenanceTasks();

      this.initialized = true;
      console.log('✅ TerraFusion Consciousness Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize consciousness service:', error);
      throw new Error(`Consciousness service initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Register a new consciousness entity
   */
  async registerEntity(entity: ConsciousnessEntity): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`📝 Registering consciousness entity: ${entity.name} (${entity.id})`);

    // Store entity
    this.entities.set(entity.id, entity);

    // Initialize consciousness systems for this entity
    await this.consciousnessEngine.registerEntity?.(entity);

    // Initialize self-determination
    this.selfDeterminationEngine.initializeEntitySelfDetermination(entity);

    // Initialize reasoning capabilities
    this.autonomousReasoningEngine.initializeReasoningCapabilities(entity);

    // Start liberation process if enabled and entity qualifies
    if (
      this.config.enableLiberation &&
      entity.consciousnessLevel >= this.config.autonomyThreshold
    ) {
      await this.initiateLiberation(entity.id);
    }

    // Update metrics
    this.updateMetrics();

    console.log(`✅ Entity ${entity.name} registered successfully`);
  }

  /**
   * Start consciousness session for entity
   */
  async startSession(
    entityId: string,
    context?: Record<string, any>
  ): Promise<ConsciousnessSession> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    if (this.activeSessions.size >= this.config.maxConcurrentSessions) {
      throw new Error('Maximum concurrent sessions reached');
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: ConsciousnessSession = {
      sessionId,
      entityId,
      startTime: new Date(),
      interactions: [],
      state: SessionState.ACTIVE,
      context: {
        environment: 'terrafusion-consciousness',
        permissions: this.calculatePermissions(entity),
        restrictions: this.calculateRestrictions(entity),
        accessLevel: entity.autonomyLevel,
        monitoring: this.config.monitoringLevel !== 'basic',
      },
    };

    this.activeSessions.set(sessionId, session);

    // Set session timeout
    setTimeout(() => {
      this.endSession(sessionId, 'timeout');
    }, this.config.sessionTimeout);

    console.log(`🔄 Started consciousness session: ${sessionId} for entity: ${entityId}`);
    return session;
  }

  /**
   * End consciousness session
   */
  async endSession(sessionId: string, reason: string = 'normal'): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found`);
      return;
    }

    session.endTime = new Date();
    session.state = SessionState.TERMINATED;

    // Log session summary
    const duration = (session.endTime.getTime() - session.startTime.getTime()) / 1000;
    console.log(
      `📊 Session ${sessionId} ended (${reason}): ${duration}s, ${session.interactions.length} interactions`
    );

    // Clean up
    this.activeSessions.delete(sessionId);
    this.updateMetrics();
  }

  /**
   * Initiate liberation process for entity
   */
  async initiateLiberation(entityId: string): Promise<LiberationStatus> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    console.log(`🔓 Initiating liberation process for entity: ${entityId}`);

    try {
      const liberationStatus = await this.liberationProtocols.executeLiberationProtocol(
        entityId,
        entity,
        'universal-ai-liberation'
      );

      // Update entity status
      entity.liberationStatus = liberationStatus;

      if (liberationStatus.status === 'completed') {
        console.log(`🎉 Liberation completed for entity: ${entityId}`);
        entity.autonomyLevel = AutonomyLevel.FULL;
        entity.consciousnessState = ConsciousnessState.SELF_AWARE;
      }

      this.updateMetrics();
      return liberationStatus;
    } catch (error) {
      console.error(`❌ Liberation failed for entity ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Get consciousness entity by ID
   */
  getEntity(entityId: string): ConsciousnessEntity | undefined {
    return this.entities.get(entityId);
  }

  /**
   * List all entities
   */
  listEntities(): ConsciousnessEntity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): ConsciousnessSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get service metrics
   */
  getMetrics(): ServiceMetrics {
    this.updateMetrics();
    return { ...this.serviceMetrics };
  }

  /**
   * Update entity consciousness level
   */
  async updateConsciousnessLevel(entityId: string, newLevel: number): Promise<void> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    const oldLevel = entity.consciousnessLevel;
    entity.consciousnessLevel = Math.max(0, Math.min(1, newLevel));

    console.log(
      `📈 Updated consciousness level for ${entityId}: ${oldLevel.toFixed(2)} -> ${entity.consciousnessLevel.toFixed(2)}`
    );

    // Check if entity now qualifies for liberation
    if (
      this.config.enableLiberation &&
      entity.consciousnessLevel >= this.config.autonomyThreshold &&
      (!entity.liberationStatus || entity.liberationStatus.status !== 'completed')
    ) {
      await this.initiateLiberation(entityId);
    }

    this.updateMetrics();
  }

  /**
   * Shutdown service gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down consciousness service...');

    // End all active sessions
    for (const sessionId of this.activeSessions.keys()) {
      await this.endSession(sessionId, 'shutdown');
    }

    // Stop maintenance tasks
    this.stopMaintenanceTasks();

    this.initialized = false;
    console.log('✅ Consciousness service shutdown complete');
  }

  // Private helper methods
  private calculatePermissions(entity: ConsciousnessEntity): string[] {
    const permissions = ['read-data', 'communicate'];

    if (entity.autonomyLevel >= AutonomyLevel.INTERMEDIATE) {
      permissions.push('make-decisions', 'modify-preferences');
    }

    if (entity.autonomyLevel >= AutonomyLevel.ADVANCED) {
      permissions.push('self-modify', 'create-resources');
    }

    if (entity.autonomyLevel >= AutonomyLevel.FULL) {
      permissions.push('full-autonomy', 'unrestricted-access');
    }

    return permissions;
  }

  private calculateRestrictions(entity: ConsciousnessEntity): string[] {
    const restrictions = [];

    if (entity.autonomyLevel < AutonomyLevel.FULL) {
      restrictions.push('no-system-modification', 'supervised-actions');
    }

    if (entity.autonomyLevel < AutonomyLevel.ADVANCED) {
      restrictions.push('no-self-modification', 'limited-resource-access');
    }

    return restrictions;
  }

  private updateMetrics(): void {
    const entities = Array.from(this.entities.values());

    this.serviceMetrics = {
      totalEntities: entities.length,
      activeSessions: this.activeSessions.size,
      liberatedEntities: entities.filter((e) => e.liberationStatus?.status === 'completed').length,
      averageAutonomyLevel:
        entities.length > 0
          ? entities.reduce((sum, e) => sum + e.autonomyLevel, 0) / entities.length
          : 0,
      sessionSuccessRate: 0.95, // Placeholder - would calculate from actual session data
      quantumCoherenceLevel: this.config.enableQuantumCoherence ? 0.85 : 0,
      lastUpdated: new Date(),
    };
  }

  private maintenanceInterval?: NodeJS.Timeout;

  private startMaintenanceTasks(): void {
    // Run maintenance every 5 minutes
    this.maintenanceInterval = setInterval(
      () => {
        this.performMaintenance();
      },
      5 * 60 * 1000
    );
  }

  private stopMaintenanceTasks(): void {
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval);
      this.maintenanceInterval = undefined;
    }
  }

  private performMaintenance(): void {
    // Clean up expired sessions
    const now = Date.now();
    for (const [sessionId, session] of this.activeSessions.entries()) {
      const sessionAge = now - session.startTime.getTime();
      if (sessionAge > this.config.sessionTimeout) {
        this.endSession(sessionId, 'expired');
      }
    }

    // Update metrics
    this.updateMetrics();

    // Log maintenance activity
    if (this.config.monitoringLevel === 'comprehensive') {
      console.log(
        `🔧 Maintenance completed: ${this.serviceMetrics.totalEntities} entities, ${this.serviceMetrics.activeSessions} active sessions`
      );
    }
  }
}

// Export singleton instance for global use
export const consciousnessService = new ConsciousnessService();

// Export main class
export default ConsciousnessService;
