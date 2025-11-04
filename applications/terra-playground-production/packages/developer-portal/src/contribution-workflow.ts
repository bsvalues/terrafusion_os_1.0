/**
 * Contribution Workflow
 *
 * Provides a comprehensive workflow for contributing plugins, core models, and other components:
 * - Submission workflow
 * - Review process
 * - Approval/rejection
 * - Role-based access control
 * - Quality checks
 * - Security scans
 */

import { EventEmitter } from 'events';
import { PluginEntity, PluginStatus } from './plugin-management';

// Contribution Type
export enum ContributionType {
  PLUGIN = 'plugin',
  CORE_MODEL = 'core_model',
  UI_COMPONENT = 'ui_component',
  API = 'api',
  DOCUMENTATION = 'documentation',
  EXAMPLE = 'example',
  FEATURE_REQUEST = 'feature_request',
  BUG_FIX = 'bug_fix',
}

// Contribution Status
export enum ContributionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  NEEDS_CHANGES = 'needs_changes',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
}

// Review Decision
export enum ReviewDecision {
  APPROVE = 'approve',
  REQUEST_CHANGES = 'request_changes',
  REJECT = 'reject',
}

// Review Type
export enum ReviewType {
  CODE_REVIEW = 'code_review',
  SECURITY_REVIEW = 'security_review',
  DOCUMENTATION_REVIEW = 'documentation_review',
  USABILITY_REVIEW = 'usability_review',
  PERFORMANCE_REVIEW = 'performance_review',
}

// User Role
export enum UserRole {
  CONTRIBUTOR = 'contributor',
  REVIEWER = 'reviewer',
  APPROVER = 'approver',
  ADMIN = 'admin',
}

// Quality Check Result
export interface QualityCheckResult {
  name: string;
  passed: boolean;
  score?: number;
  details?: string;
  url?: string;
}

// Security Scan Result
export interface SecurityScanResult {
  name: string;
  passed: boolean;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  details?: string;
  url?: string;
}

// Review Comment
export interface ReviewComment {
  id: string;
  reviewId: string;
  userId: string;
  userName: string;
  comment: string;
  path?: string;
  lineNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Review
export interface Review {
  id: string;
  contributionId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  type: ReviewType;
  decision?: ReviewDecision;
  comments: ReviewComment[];
  createdAt: Date;
  completedAt?: Date;
}

// Contribution Entity
export interface ContributionEntity {
  id: string;
  type: ContributionType;
  status: ContributionStatus;
  title: string;
  description: string;
  repositoryUrl: string;
  branch: string;
  commitHash?: string;
  submitterId: string;
  submitterName: string;
  assignedReviewers: string[]; // User IDs
  reviews: Review[];
  qualityChecks: QualityCheckResult[];
  securityScans: SecurityScanResult[];
  relatedEntityId?: string; // ID of related plugin, core model, etc.
  changes?: string; // Summary of changes
  publishedVersion?: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewStartedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  publishedAt?: Date;
}

/**
 * Contribution Workflow Manager
 */
export class ContributionWorkflowManager extends EventEmitter {
  private contributions: Map<string, ContributionEntity> = new Map();
  private reviews: Map<string, Review> = new Map();
  private userRoles: Map<string, UserRole> = new Map(); // userId -> role

  constructor() {
    super();
  }

  /**
   * Initialize the contribution workflow manager
   */
  public initialize(): void {
    this.emit('initialized');
  }

  /**
   * Create a new contribution
   */
  public createContribution(
    contribution: Omit<
      ContributionEntity,
      'id' | 'status' | 'reviews' | 'qualityChecks' | 'securityScans' | 'createdAt' | 'updatedAt'
    >
  ): ContributionEntity {
    const id = `contribution-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newContribution: ContributionEntity = {
      ...contribution,
      id,
      status: ContributionStatus.DRAFT,
      reviews: [],
      qualityChecks: [],
      securityScans: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.contributions.set(id, newContribution);

    `);
    this.emit('contribution:created', newContribution);

    return newContribution;
  }

  /**
   * Update a contribution
   */
  public updateContribution(
    id: string,
    updates: Partial<Omit<ContributionEntity, 'id' | 'createdAt' | 'updatedAt'>>
  ): ContributionEntity | null {
    const contribution = this.contributions.get(id);

    if (!contribution) {
      console.error(`Contribution not found: ${id}`);
      return null;
    }

    const updatedContribution: ContributionEntity = {
      ...contribution,
      ...updates,
      updatedAt: new Date(),
    };

    this.contributions.set(id, updatedContribution);

    `);
    this.emit('contribution:updated', updatedContribution);

    return updatedContribution;
  }

  /**
   * Submit a contribution
   */
  public submitContribution(id: string): ContributionEntity | null {
    const contribution = this.contributions.get(id);

    if (!contribution) {
      console.error(`Contribution not found: ${id}`);
      return null;
    }

    if (contribution.status !== ContributionStatus.DRAFT) {
      console.error(`Contribution ${id} is not in draft status`);
      return null;
    }

    const updatedContribution = this.updateContribution(id, {
      status: ContributionStatus.SUBMITTED,
      submittedAt: new Date(),
    });

    if (updatedContribution) {
      this.emit('contribution:submitted', updatedContribution);

      // Automatically start quality checks and security scans
      this.runQualityChecks(id);
      this.runSecurityScans(id);
    }

    return updatedContribution;
  }

  /**
   * Assign reviewers to a contribution
   */
  public assignReviewers(id: string, reviewerIds: string[]): ContributionEntity | null {
    const contribution = this.contributions.get(id);

    if (!contribution) {
      console.error(`Contribution not found: ${id}`);
      return null;
    }

    // Update assigned reviewers
    const updatedContribution = this.updateContribution(id, {
      assignedReviewers: reviewerIds,
      status: ContributionStatus.IN_REVIEW,
      reviewStartedAt: new Date(),
    });

    if (updatedContribution) {
      this.emit('contribution:reviewers-assigned', {
        contribution: updatedContribution,
        reviewerIds,
      });
    }

    return updatedContribution;
  }

  /**
   * Create a review
   */
  public createReview(review: Omit<Review, 'id' | 'comments' | 'createdAt'>): Review {
    const id = `review-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newReview: Review = {
      ...review,
      id,
      comments: [],
      createdAt: new Date(),
    };

    this.reviews.set(id, newReview);

    // Add review to contribution
    const contribution = this.contributions.get(review.contributionId);
    if (contribution) {
      contribution.reviews.push(newReview);
      contribution.updatedAt = new Date();

      this.emit('review:created', { contribution, review: newReview });
    }

    return newReview;
  }

  /**
   * Add a comment to a review
   */
  public addReviewComment(
    reviewId: string,
    comment: Omit<ReviewComment, 'id' | 'reviewId' | 'createdAt' | 'updatedAt'>
  ): ReviewComment | null {
    const review = this.reviews.get(reviewId);

    if (!review) {
      console.error(`Review not found: ${reviewId}`);
      return null;
    }

    const id = `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newComment: ReviewComment = {
      ...comment,
      id,
      reviewId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    review.comments.push(newComment);

    const contribution = this.contributions.get(review.contributionId);
    if (contribution) {
      contribution.updatedAt = new Date();

      this.emit('review:comment-added', { contribution, review, comment: newComment });
    }

    return newComment;
  }

  /**
   * Complete a review
   */
  public completeReview(reviewId: string, decision: ReviewDecision): Review | null {
    const review = this.reviews.get(reviewId);

    if (!review) {
      console.error(`Review not found: ${reviewId}`);
      return null;
    }

    review.decision = decision;
    review.completedAt = new Date();

    const contribution = this.contributions.get(review.contributionId);
    if (contribution) {
      contribution.updatedAt = new Date();

      this.emit('review:completed', { contribution, review });

      // Check if all reviews are completed
      this.checkReviewStatus(contribution.id);
    }

    return review;
  }

  /**
   * Check the status of all reviews for a contribution
   */
  private checkReviewStatus(contributionId: string): void {
    const contribution = this.contributions.get(contributionId);

    if (!contribution) {
      return;
    }

    // Check if all assigned reviewers have completed their reviews
    const assignedReviewerIds = new Set(contribution.assignedReviewers);
    const completedReviews = contribution.reviews.filter(review => review.completedAt);

    const allReviewsCompleted = contribution.assignedReviewers.every(reviewerId => {
      return completedReviews.some(review => review.userId === reviewerId);
    });

    if (!allReviewsCompleted) {
      return;
    }

    // Check if any reviewer requested changes or rejected
    const needsChanges = completedReviews.some(
      review => review.decision === ReviewDecision.REQUEST_CHANGES
    );
    const rejected = completedReviews.some(review => review.decision === ReviewDecision.REJECT);

    if (rejected) {
      this.updateContribution(contributionId, {
        status: ContributionStatus.REJECTED,
        rejectedAt: new Date(),
      });
    } else if (needsChanges) {
      this.updateContribution(contributionId, {
        status: ContributionStatus.NEEDS_CHANGES,
      });
    } else {
      // All reviews approved
      this.updateContribution(contributionId, {
        status: ContributionStatus.APPROVED,
        approvedAt: new Date(),
      });
    }
  }

  /**
   * Run quality checks on a contribution
   */
  private async runQualityChecks(id: string): Promise<void> {
    const contribution = this.contributions.get(id);

    if (!contribution) {
      console.error(`Contribution not found: ${id}`);
      return;
    }

    // In a real implementation, this would run actual quality checks
    // For demonstration, we'll simulate the checks

    const checks: QualityCheckResult[] = [
      {
        name: 'Code Style',
        passed: Math.random() > 0.2,
        score: Math.floor(Math.random() * 30) + 70, // 70-100
        details: 'Code style analysis completed.',
      },
      {
        name: 'Test Coverage',
        passed: Math.random() > 0.3,
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        details: 'Test coverage analysis completed.',
      },
      {
        name: 'Documentation',
        passed: Math.random() > 0.25,
        score: Math.floor(Math.random() * 50) + 50, // 50-100
        details: 'Documentation analysis completed.',
      },
    ];

    // Simulate async checks
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.updateContribution(id, { qualityChecks: checks });

    this.emit('contribution:quality-checks-completed', { contribution, checks });
  }

  /**
   * Run security scans on a contribution
   */
  private async runSecurityScans(id: string): Promise<void> {
    const contribution = this.contributions.get(id);

    if (!contribution) {
      console.error(`Contribution not found: ${id}`);
      return;
    }

    // In a real implementation, this would run actual security scans
    // For demonstration, we'll simulate the scans

    const scans: SecurityScanResult[] = [
      {
        name: 'Dependency Scan',
        passed: Math.random() > 0.2,
        vulnerabilities: {
          critical: Math.floor(Math.random() * 2),
          high: Math.floor(Math.random() * 3),
          medium: Math.floor(Math.random() * 5),
          low: Math.floor(Math.random() * 10),
        },
        details: 'Dependency vulnerabilities scan completed.',
      },
      {
        name: 'SAST (Static Analysis)',
        passed: Math.random() > 0.3,
        vulnerabilities: {
          critical: Math.floor(Math.random() * 1),
          high: Math.floor(Math.random() * 2),
          medium: Math.floor(Math.random() * 4),
          low: Math.floor(Math.random() * 8),
        },
        details: 'Static code analysis completed.',
      },
      {
        name: 'Secret Detection',
        passed: Math.random() > 0.1,
        vulnerabilities: {
          critical: Math.floor(Math.random() * 1),
          high: Math.floor(Math.random() * 1),
          medium: 0,
          low: Math.floor(Math.random() * 2),
        },
        details: 'Secret detection scan completed.',
      },
    ];

    // Simulate async scans
    await new Promise(resolve => setTimeout(resolve, 1500));

    this.updateContribution(id, { securityScans: scans });

    this.emit('contribution:security-scans-completed', { contribution, scans });
  }

  /**
   * Publish a contribution
   */
  public async publishContribution(
    id: string,
    version: string
  ): Promise<ContributionEntity | null> {
    const contribution = this.contributions.get(id);

    if (!contribution) {
      console.error(`Contribution not found: ${id}`);
      return null;
    }

    if (contribution.status !== ContributionStatus.APPROVED) {
      console.error(`Contribution ${id} is not approved`);
      return null;
    }

    // In a real implementation, this would publish the contribution
    // For demonstration, we'll simulate the publishing process

    // Simulate async publishing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const updatedContribution = this.updateContribution(id, {
      status: ContributionStatus.PUBLISHED,
      publishedAt: new Date(),
      publishedVersion: version,
    });

    if (updatedContribution) {
      this.emit('contribution:published', updatedContribution);

      // If this is a plugin contribution, update the plugin status
      if (contribution.type === ContributionType.PLUGIN && contribution.relatedEntityId) {
        this.emit('plugin:published', {
          contributionId: id,
          pluginId: contribution.relatedEntityId,
          version,
        });
      }
    }

    return updatedContribution;
  }

  /**
   * Request changes for a contribution
   */
  public requestChanges(id: string, comments: string): ContributionEntity | null {
    const contribution = this.contributions.get(id);

    if (!contribution) {
      console.error(`Contribution not found: ${id}`);
      return null;
    }

    const updatedContribution = this.updateContribution(id, {
      status: ContributionStatus.NEEDS_CHANGES,
    });

    if (updatedContribution) {
      this.emit('contribution:changes-requested', { contribution: updatedContribution, comments });
    }

    return updatedContribution;
  }

  /**
   * Reject a contribution
   */
  public rejectContribution(id: string, reason: string): ContributionEntity | null {
    const contribution = this.contributions.get(id);

    if (!contribution) {
      console.error(`Contribution not found: ${id}`);
      return null;
    }

    const updatedContribution = this.updateContribution(id, {
      status: ContributionStatus.REJECTED,
      rejectedAt: new Date(),
    });

    if (updatedContribution) {
      this.emit('contribution:rejected', { contribution: updatedContribution, reason });
    }

    return updatedContribution;
  }

  /**
   * Set user role
   */
  public setUserRole(userId: string, role: UserRole): void {
    this.userRoles.set(userId, role);
    this.emit('user:role-set', { userId, role });
  }

  /**
   * Get user role
   */
  public getUserRole(userId: string): UserRole | undefined {
    return this.userRoles.get(userId);
  }

  /**
   * Check if user has permission for an action
   */
  public hasPermission(userId: string, action: string): boolean {
    const role = this.userRoles.get(userId);

    if (!role) {
      return false;
    }

    switch (action) {
      case 'create_contribution':
        return true; // All roles can create contributions

      case 'submit_contribution':
        return true; // All roles can submit contributions

      case 'review_contribution':
        return role === UserRole.REVIEWER || role === UserRole.APPROVER || role === UserRole.ADMIN;

      case 'approve_contribution':
        return role === UserRole.APPROVER || role === UserRole.ADMIN;

      case 'publish_contribution':
        return role === UserRole.ADMIN;

      case 'manage_users':
        return role === UserRole.ADMIN;

      default:
        return false;
    }
  }

  /**
   * Get a contribution by ID
   */
  public getContribution(id: string): ContributionEntity | undefined {
    return this.contributions.get(id);
  }

  /**
   * Get all contributions
   */
  public getAllContributions(): ContributionEntity[] {
    return Array.from(this.contributions.values());
  }

  /**
   * Get contributions by type
   */
  public getContributionsByType(type: ContributionType): ContributionEntity[] {
    return this.getAllContributions().filter(contribution => contribution.type === type);
  }

  /**
   * Get contributions by status
   */
  public getContributionsByStatus(status: ContributionStatus): ContributionEntity[] {
    return this.getAllContributions().filter(contribution => contribution.status === status);
  }

  /**
   * Get contributions by submitter
   */
  public getContributionsBySubmitter(submitterId: string): ContributionEntity[] {
    return this.getAllContributions().filter(
      contribution => contribution.submitterId === submitterId
    );
  }

  /**
   * Get contributions by reviewer
   */
  public getContributionsByReviewer(reviewerId: string): ContributionEntity[] {
    return this.getAllContributions().filter(contribution =>
      contribution.assignedReviewers.includes(reviewerId)
    );
  }

  /**
   * Get contribution workflow statistics
   */
  public getWorkflowStatistics(): any {
    const contributions = this.getAllContributions();

    const stats = {
      totalContributions: contributions.length,
      byStatus: {
        draft: contributions.filter(c => c.status === ContributionStatus.DRAFT).length,
        submitted: contributions.filter(c => c.status === ContributionStatus.SUBMITTED).length,
        inReview: contributions.filter(c => c.status === ContributionStatus.IN_REVIEW).length,
        needsChanges: contributions.filter(c => c.status === ContributionStatus.NEEDS_CHANGES)
          .length,
        approved: contributions.filter(c => c.status === ContributionStatus.APPROVED).length,
        rejected: contributions.filter(c => c.status === ContributionStatus.REJECTED).length,
        published: contributions.filter(c => c.status === ContributionStatus.PUBLISHED).length,
      },
      byType: {
        plugin: contributions.filter(c => c.type === ContributionType.PLUGIN).length,
        coreModel: contributions.filter(c => c.type === ContributionType.CORE_MODEL).length,
        uiComponent: contributions.filter(c => c.type === ContributionType.UI_COMPONENT).length,
        api: contributions.filter(c => c.type === ContributionType.API).length,
        documentation: contributions.filter(c => c.type === ContributionType.DOCUMENTATION).length,
        example: contributions.filter(c => c.type === ContributionType.EXAMPLE).length,
        featureRequest: contributions.filter(c => c.type === ContributionType.FEATURE_REQUEST)
          .length,
        bugFix: contributions.filter(c => c.type === ContributionType.BUG_FIX).length,
      },
      averageTimeToReview: this.calculateAverageTimeToReview(),
      averageTimeToApproval: this.calculateAverageTimeToApproval(),
      mostActiveContributors: this.getMostActiveContributors(5),
      mostActiveReviewers: this.getMostActiveReviewers(5),
    };

    return stats;
  }

  /**
   * Calculate average time to review
   */
  private calculateAverageTimeToReview(): number {
    const submittedContributions = this.getAllContributions().filter(
      c => c.submittedAt && c.reviewStartedAt
    );

    if (submittedContributions.length === 0) {
      return 0;
    }

    const totalTime = submittedContributions.reduce((sum, c) => {
      const submittedTime = c.submittedAt!.getTime();
      const reviewTime = c.reviewStartedAt!.getTime();
      return sum + (reviewTime - submittedTime);
    }, 0);

    // Return average time in hours
    return totalTime / submittedContributions.length / (1000 * 60 * 60);
  }

  /**
   * Calculate average time to approval
   */
  private calculateAverageTimeToApproval(): number {
    const approvedContributions = this.getAllContributions().filter(
      c => c.submittedAt && c.approvedAt
    );

    if (approvedContributions.length === 0) {
      return 0;
    }

    const totalTime = approvedContributions.reduce((sum, c) => {
      const submittedTime = c.submittedAt!.getTime();
      const approvalTime = c.approvedAt!.getTime();
      return sum + (approvalTime - submittedTime);
    }, 0);

    // Return average time in hours
    return totalTime / approvedContributions.length / (1000 * 60 * 60);
  }

  /**
   * Get most active contributors
   */
  private getMostActiveContributors(limit: number): any[] {
    const contributions = this.getAllContributions();

    // Count contributions by submitter
    const submitterCounts = new Map<string, number>();

    for (const contribution of contributions) {
      const count = submitterCounts.get(contribution.submitterId) || 0;
      submitterCounts.set(contribution.submitterId, count + 1);
    }

    // Convert to array and sort
    const submitters = Array.from(submitterCounts.entries())
      .map(([submitterId, count]) => {
        const contributions = this.getContributionsBySubmitter(submitterId);
        const publishedCount = contributions.filter(
          c => c.status === ContributionStatus.PUBLISHED
        ).length;

        return {
          id: submitterId,
          name: contributions[0].submitterName,
          contributions: count,
          published: publishedCount,
        };
      })
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, limit);

    return submitters;
  }

  /**
   * Get most active reviewers
   */
  private getMostActiveReviewers(limit: number): any[] {
    // Count reviews by reviewer
    const reviewerCounts = new Map<string, number>();

    for (const [_, review] of this.reviews) {
      const count = reviewerCounts.get(review.userId) || 0;
      reviewerCounts.set(review.userId, count + 1);
    }

    // Convert to array and sort
    const reviewers = Array.from(reviewerCounts.entries())
      .map(([userId, count]) => {
        const reviews = Array.from(this.reviews.values()).filter(r => r.userId === userId);
        const completedCount = reviews.filter(r => r.completedAt).length;

        return {
          id: userId,
          name: reviews[0]?.userName || 'Unknown',
          reviews: count,
          completed: completedCount,
        };
      })
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, limit);

    return reviewers;
  }
}

/**
 * Create a new contribution workflow manager
 */
export function createContributionWorkflowManager(): ContributionWorkflowManager {
  return new ContributionWorkflowManager();
}

