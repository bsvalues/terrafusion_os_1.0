/**
 * Evidence Collector
 *
 * Collects, manages, and organizes evidence for compliance audits.
 * This module supports:
 * - Automated evidence collection
 * - Evidence metadata tracking
 * - Evidence storage and retrieval
 * - Evidence validation
 */

import { EventEmitter } from 'events';
import { Logger } from './logger';

// Evidence types
export enum EvidenceType {
  DOCUMENT = 'document',
  SCREENSHOT = 'screenshot',
  LOG = 'log',
  CONFIG = 'configuration',
  REPORT = 'report',
  OTHER = 'other',
}

// Evidence status
export enum EvidenceStatus {
  PENDING = 'pending',
  COLLECTED = 'collected',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

// Evidence interface
export interface Evidence {
  id: string;
  name: string;
  description: string;
  type: EvidenceType;
  status: EvidenceStatus;
  controlIds: string[]; // IDs of controls this evidence supports
  collectDate: Date;
  expiryDate?: Date;
  dataLocation: string; // URL, file path, or reference to evidence data
  collector: string; // Person or system that collected the evidence
  approver?: string; // Person who approved the evidence
  metadata?: Record<string, any>; // Additional metadata
}

// Evidence collector configuration
export interface EvidenceCollectorConfig {
  storageLocation: string;
  automaticCollection: boolean;
  collectionFrequency?: number; // In milliseconds
  retentionPeriod: number; // In milliseconds
}

/**
 * Evidence Collector
 */
export class EvidenceCollector extends EventEmitter {
  private evidence: Map<string, Evidence> = new Map();
  private config: EvidenceCollectorConfig;
  private logger: Logger;
  private collectionIntervalId?: NodeJS.Timeout;

  constructor(config: EvidenceCollectorConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
  }

  /**
   * Initialize the evidence collector
   */
  public initialize(): void {
    this.logger.info('Initializing evidence collector', this.config);

    // Start automatic evidence collection if configured
    if (this.config.automaticCollection && this.config.collectionFrequency) {
      this.startAutomaticCollection();
    }

    this.emit('initialized', { config: this.config });
  }

  /**
   * Start automatic evidence collection
   */
  public startAutomaticCollection(): void {
    if (!this.config.collectionFrequency) {
      this.logger.error('Cannot start automatic collection without a frequency');
      return;
    }

    this.logger.info('Starting automatic evidence collection', {
      frequency: this.config.collectionFrequency,
    });

    this.collectionIntervalId = setInterval(() => {
      this.collectAutomaticEvidence();
    }, this.config.collectionFrequency);

    this.emit('collection:started');
  }

  /**
   * Stop automatic evidence collection
   */
  public stopAutomaticCollection(): void {
    if (this.collectionIntervalId) {
      clearInterval(this.collectionIntervalId);
      this.collectionIntervalId = undefined;

      this.logger.info('Stopped automatic evidence collection');
      this.emit('collection:stopped');
    }
  }

  /**
   * Collect evidence automatically
   */
  private collectAutomaticEvidence(): void {
    this.logger.debug('Running automatic evidence collection');

    // This would integrate with various systems to collect evidence
    // For demonstration, we'll just log the operation
    this.logger.info('Automatic evidence collection completed');
  }

  /**
   * Manually collect evidence
   */
  public collectEvidence(evidence: Omit<Evidence, 'id' | 'collectDate' | 'status'>): Evidence {
    const id = `evidence-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newEvidence: Evidence = {
      ...evidence,
      id,
      collectDate: new Date(),
      status: EvidenceStatus.COLLECTED,
    };

    this.evidence.set(id, newEvidence);

    this.logger.info('Evidence collected', {
      evidenceId: id,
      name: newEvidence.name,
      type: newEvidence.type,
    });

    this.emit('evidence:collected', newEvidence);

    return newEvidence;
  }

  /**
   * Approve evidence
   */
  public approveEvidence(id: string, approver: string): Evidence | null {
    const evidence = this.evidence.get(id);

    if (!evidence) {
      this.logger.error('Evidence not found', { evidenceId: id });
      return null;
    }

    const updatedEvidence: Evidence = {
      ...evidence,
      status: EvidenceStatus.APPROVED,
      approver,
    };

    this.evidence.set(id, updatedEvidence);

    this.logger.info('Evidence approved', {
      evidenceId: id,
      approver,
    });

    this.emit('evidence:approved', updatedEvidence);

    return updatedEvidence;
  }

  /**
   * Reject evidence
   */
  public rejectEvidence(id: string, reason: string): Evidence | null {
    const evidence = this.evidence.get(id);

    if (!evidence) {
      this.logger.error('Evidence not found', { evidenceId: id });
      return null;
    }

    const updatedEvidence: Evidence = {
      ...evidence,
      status: EvidenceStatus.REJECTED,
      metadata: {
        ...evidence.metadata,
        rejectionReason: reason,
      },
    };

    this.evidence.set(id, updatedEvidence);

    this.logger.info('Evidence rejected', {
      evidenceId: id,
      reason,
    });

    this.emit('evidence:rejected', updatedEvidence);

    return updatedEvidence;
  }

  /**
   * Get evidence by ID
   */
  public getEvidence(id: string): Evidence | undefined {
    return this.evidence.get(id);
  }

  /**
   * Get all evidence
   */
  public getAllEvidence(): Evidence[] {
    return Array.from(this.evidence.values());
  }

  /**
   * Get evidence for a specific control
   */
  public getEvidenceForControl(controlId: string): Evidence[] {
    return this.getAllEvidence().filter(evidence => evidence.controlIds.includes(controlId));
  }

  /**
   * Check for expired evidence
   */
  public checkExpiredEvidence(): Evidence[] {
    const now = new Date();
    const expiredEvidence: Evidence[] = [];

    for (const evidence of this.evidence.values()) {
      if (
        evidence.expiryDate &&
        evidence.expiryDate < now &&
        evidence.status !== EvidenceStatus.EXPIRED
      ) {
        // Update status to expired
        const updatedEvidence: Evidence = {
          ...evidence,
          status: EvidenceStatus.EXPIRED,
        };

        this.evidence.set(evidence.id, updatedEvidence);
        expiredEvidence.push(updatedEvidence);

        this.logger.info('Evidence expired', {
          evidenceId: evidence.id,
          name: evidence.name,
        });

        this.emit('evidence:expired', updatedEvidence);
      }
    }

    return expiredEvidence;
  }

  /**
   * Clean up old evidence based on retention policy
   */
  public cleanupEvidence(): void {
    const now = Date.now();
    const retentionThreshold = now - this.config.retentionPeriod;
    const retentionDate = new Date(retentionThreshold);

    const expiredIds: string[] = [];

    for (const [id, evidence] of this.evidence.entries()) {
      if (evidence.collectDate.getTime() < retentionThreshold) {
        expiredIds.push(id);
      }
    }

    // Remove expired evidence
    for (const id of expiredIds) {
      const evidence = this.evidence.get(id);
      this.evidence.delete(id);

      if (evidence) {
        this.logger.info('Evidence removed due to retention policy', {
          evidenceId: id,
          name: evidence.name,
          age: Math.floor((now - evidence.collectDate.getTime()) / (1000 * 60 * 60 * 24)) + ' days',
        });

        this.emit('evidence:removed', evidence);
      }
    }

    this.logger.info('Evidence cleanup completed', {
      removedCount: expiredIds.length,
      retentionThreshold: retentionDate.toISOString(),
    });
  }
}

/**
 * Create a new evidence collector
 */
export function createEvidenceCollector(
  config: EvidenceCollectorConfig,
  logger: Logger
): EvidenceCollector {
  return new EvidenceCollector(config, logger);
}
