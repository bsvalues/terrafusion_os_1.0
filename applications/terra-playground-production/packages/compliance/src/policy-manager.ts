/**
 * Policy Manager
 *
 * Manages security and compliance policies including:
 * - Policy creation and versioning
 * - Policy distribution
 * - Policy acknowledgement tracking
 * - Policy enforcement and auditing
 */

import { EventEmitter } from 'events';
import { Logger } from './logger';

// Policy types
export enum PolicyType {
  SECURITY = 'security',
  PRIVACY = 'privacy',
  ACCEPTABLE_USE = 'acceptable_use',
  DATA_RETENTION = 'data_retention',
  INCIDENT_RESPONSE = 'incident_response',
  BUSINESS_CONTINUITY = 'business_continuity',
  CHANGE_MANAGEMENT = 'change_management',
  OTHER = 'other',
}

// Policy status
export enum PolicyStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived',
}

// Policy interface
export interface Policy {
  id: string;
  name: string;
  description: string;
  type: PolicyType;
  status: PolicyStatus;
  version: string;
  effectiveDate?: Date;
  expirationDate?: Date;
  reviewDate?: Date;
  content: string;
  author: string;
  approver?: string;
  relatedControls?: string[]; // IDs of related controls
  tags?: string[];
  metadata?: Record<string, any>;
}

// Policy version
export interface PolicyVersion {
  policyId: string;
  version: string;
  status: PolicyStatus;
  content: string;
  effectiveDate?: Date;
  author: string;
  approver?: string;
  changes?: string;
  createdAt: Date;
}

// Policy acknowledgement
export interface PolicyAcknowledgement {
  id: string;
  policyId: string;
  policyVersion: string;
  userId: string;
  acknowledgedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Policy Manager
 */
export class PolicyManager extends EventEmitter {
  private policies: Map<string, Policy> = new Map();
  private versions: Map<string, PolicyVersion[]> = new Map();
  private acknowledgements: Map<string, PolicyAcknowledgement[]> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  /**
   * Initialize the policy manager
   */
  public initialize(): void {
    this.logger.info('Initializing policy manager');
    this.emit('initialized');
  }

  /**
   * Create a new policy
   */
  public createPolicy(policy: Omit<Policy, 'id' | 'status' | 'version'>): Policy {
    const id = `policy-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newPolicy: Policy = {
      ...policy,
      id,
      status: PolicyStatus.DRAFT,
      version: '1.0.0',
    };

    this.policies.set(id, newPolicy);

    // Initialize version history
    this.versions.set(id, [
      {
        policyId: id,
        version: newPolicy.version,
        status: newPolicy.status,
        content: newPolicy.content,
        author: newPolicy.author,
        createdAt: new Date(),
      },
    ]);

    this.logger.info('Policy created', {
      policyId: id,
      name: newPolicy.name,
      type: newPolicy.type,
    });

    this.emit('policy:created', newPolicy);

    return newPolicy;
  }

  /**
   * Update an existing policy
   */
  public updatePolicy(id: string, updates: Partial<Policy>): Policy | null {
    const policy = this.policies.get(id);

    if (!policy) {
      this.logger.error('Policy not found', { policyId: id });
      return null;
    }

    // Check if we need to create a new version
    const createNewVersion = updates.content !== undefined && updates.content !== policy.content;

    // Create the updated policy
    const updatedPolicy: Policy = {
      ...policy,
      ...updates,
      // Don't allow direct modification of these fields
      id: policy.id,
      version: createNewVersion ? this.incrementVersion(policy.version) : policy.version,
    };

    this.policies.set(id, updatedPolicy);

    // Create a new version if content changed
    if (createNewVersion) {
      const versions = this.versions.get(id) || [];

      const newVersion: PolicyVersion = {
        policyId: id,
        version: updatedPolicy.version,
        status: updatedPolicy.status,
        content: updatedPolicy.content,
        author: updates.author || policy.author,
        approver: updatedPolicy.approver,
        effectiveDate: updatedPolicy.effectiveDate,
        changes: updates.metadata?.changes as string,
        createdAt: new Date(),
      };

      versions.push(newVersion);
      this.versions.set(id, versions);

      this.logger.info('New policy version created', {
        policyId: id,
        version: newVersion.version,
      });

      this.emit('policy:versioned', newVersion);
    }

    this.logger.info('Policy updated', {
      policyId: id,
      name: updatedPolicy.name,
      version: updatedPolicy.version,
    });

    this.emit('policy:updated', updatedPolicy);

    return updatedPolicy;
  }

  /**
   * Increment version number
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2] += 1;

    // Handle carryover
    if (parts[2] >= 10) {
      parts[2] = 0;
      parts[1] += 1;

      if (parts[1] >= 10) {
        parts[1] = 0;
        parts[0] += 1;
      }
    }

    return parts.join('.');
  }

  /**
   * Change policy status
   */
  public changeStatus(id: string, status: PolicyStatus, approver?: string): Policy | null {
    const policy = this.policies.get(id);

    if (!policy) {
      this.logger.error('Policy not found', { policyId: id });
      return null;
    }

    const updatedPolicy = this.updatePolicy(id, {
      status,
      approver:
        status === PolicyStatus.APPROVED || status === PolicyStatus.PUBLISHED
          ? approver
          : policy.approver,
    });

    if (updatedPolicy) {
      this.logger.info('Policy status changed', {
        policyId: id,
        oldStatus: policy.status,
        newStatus: status,
      });

      this.emit('policy:status-changed', {
        policy: updatedPolicy,
        oldStatus: policy.status,
        newStatus: status,
      });
    }

    return updatedPolicy;
  }

  /**
   * Get a policy by ID
   */
  public getPolicy(id: string): Policy | undefined {
    return this.policies.get(id);
  }

  /**
   * Get a specific version of a policy
   */
  public getPolicyVersion(id: string, version: string): PolicyVersion | undefined {
    const versions = this.versions.get(id) || [];
    return versions.find(v => v.version === version);
  }

  /**
   * Get all versions of a policy
   */
  public getPolicyVersions(id: string): PolicyVersion[] {
    return this.versions.get(id) || [];
  }

  /**
   * Get all policies
   */
  public getAllPolicies(): Policy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get policies by type
   */
  public getPoliciesByType(type: PolicyType): Policy[] {
    return this.getAllPolicies().filter(policy => policy.type === type);
  }

  /**
   * Get policies by status
   */
  public getPoliciesByStatus(status: PolicyStatus): Policy[] {
    return this.getAllPolicies().filter(policy => policy.status === status);
  }

  /**
   * Record a policy acknowledgement
   */
  public acknowledgePolicy(
    policyId: string,
    userId: string,
    metadata?: Record<string, any>
  ): PolicyAcknowledgement | null {
    const policy = this.policies.get(policyId);

    if (!policy) {
      this.logger.error('Policy not found', { policyId });
      return null;
    }

    // Create acknowledgement
    const id = `ack-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const acknowledgement: PolicyAcknowledgement = {
      id,
      policyId,
      policyVersion: policy.version,
      userId,
      acknowledgedAt: new Date(),
      metadata,
    };

    // Store acknowledgement
    const acknowledgements = this.acknowledgements.get(policyId) || [];
    acknowledgements.push(acknowledgement);
    this.acknowledgements.set(policyId, acknowledgements);

    this.logger.info('Policy acknowledged', {
      policyId,
      userId,
      version: policy.version,
    });

    this.emit('policy:acknowledged', acknowledgement);

    return acknowledgement;
  }

  /**
   * Get all acknowledgements for a policy
   */
  public getPolicyAcknowledgements(policyId: string): PolicyAcknowledgement[] {
    return this.acknowledgements.get(policyId) || [];
  }

  /**
   * Check if a user has acknowledged a policy
   */
  public hasUserAcknowledgedPolicy(policyId: string, userId: string): boolean {
    const acknowledgements = this.getPolicyAcknowledgements(policyId);
    return acknowledgements.some(ack => ack.userId === userId);
  }

  /**
   * Get all policies that need review
   */
  public getPoliciesNeedingReview(): Policy[] {
    const now = new Date();

    return this.getAllPolicies().filter(policy => {
      return policy.reviewDate && policy.reviewDate <= now;
    });
  }

  /**
   * Export policies to a format suitable for distribution
   */
  public exportPolicies(policyIds?: string[]): any {
    let policies: Policy[];

    if (policyIds && policyIds.length > 0) {
      policies = policyIds
        .map(id => this.getPolicy(id))
        .filter((policy): policy is Policy => policy !== undefined);
    } else {
      policies = this.getAllPolicies();
    }

    const result = {
      exportDate: new Date(),
      policies: policies.map(policy => ({
        ...policy,
        versions: this.getPolicyVersions(policy.id).length,
      })),
    };

    this.logger.info('Policies exported', {
      count: policies.length,
    });

    return result;
  }
}

/**
 * Create a new policy manager
 */
export function createPolicyManager(logger: Logger): PolicyManager {
  return new PolicyManager(logger);
}
