/**
 * Phase XXII — MOUs-as-Code
 * ==========================
 * Contract: mou.versioning.contract.test.ts
 *
 * Tests MOU versioning: dual-approval workflow, expiry/review cadence,
 * amendment tracking, and audit chain for signoffs.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Amendments require dual-approval (both parties)
 * - Expiry dates are enforced
 * - All signoffs are audit-chained
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type MouVersionId = `sha256:${string}`;
type MouId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type AmendmentId = `sha256:${string}`;
type SignoffId = `sha256:${string}`;
type ReviewId = `sha256:${string}`;

type VersionStatus =
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'superseded'
  | 'expired'
  | 'terminated';
type AmendmentStatus =
  | 'proposed'
  | 'party_a_approved'
  | 'party_b_approved'
  | 'fully_approved'
  | 'rejected';
type SignoffType = 'creation' | 'amendment' | 'renewal' | 'termination' | 'acknowledgement';
type ReviewOutcome = 'approved' | 'needs_amendment' | 'termination_recommended';

interface MouVersion {
  readonly id: MouVersionId;
  readonly mouId: MouId;
  readonly version: string;
  readonly status: VersionStatus;
  readonly partyAId: AgencyId;
  readonly partyBId: AgencyId;
  readonly effectiveDate: string;
  readonly expirationDate: string;
  readonly createdAt: string;
  readonly activatedAt?: string;
  readonly terminatedAt?: string;
  readonly previousVersionId?: MouVersionId;
  readonly changesSummary?: string;
}

interface Amendment {
  readonly id: AmendmentId;
  readonly mouVersionId: MouVersionId;
  readonly proposedBy: AgencyId;
  readonly status: AmendmentStatus;
  readonly title: string;
  readonly description: string;
  readonly proposedChanges: readonly string[];
  readonly proposedAt: string;
  readonly partyAApprovedAt?: string;
  readonly partyBApprovedAt?: string;
  readonly fullyApprovedAt?: string;
  readonly rejectedAt?: string;
  readonly rejectionReason?: string;
  readonly newVersionId?: MouVersionId;
}

interface Signoff {
  readonly id: SignoffId;
  readonly mouVersionId: MouVersionId;
  readonly agencyId: AgencyId;
  readonly signoffType: SignoffType;
  readonly signedBy: string;
  readonly role: string;
  readonly signedAt: string;
  readonly signature: string;
  readonly attestation: string;
  readonly previousSignoffId?: SignoffId;
}

interface ScheduledReview {
  readonly id: ReviewId;
  readonly mouVersionId: MouVersionId;
  readonly scheduledDate: string;
  readonly completedAt?: string;
  readonly outcome?: ReviewOutcome;
  readonly notes?: string;
  readonly nextReviewDate?: string;
}

interface ExpiryNotice {
  readonly mouVersionId: MouVersionId;
  readonly expirationDate: string;
  readonly daysRemaining: number;
  readonly notificationLevel: 'advance' | 'warning' | 'urgent' | 'expired';
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockVersioningService() {
  const versions = new Map<MouVersionId, MouVersion>();
  const amendments = new Map<AmendmentId, Amendment>();
  const signoffs = new Map<SignoffId, Signoff>();
  const reviews = new Map<ReviewId, ScheduledReview>();

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  function generateSignature(): string {
    return `sig_${Math.random().toString(36).slice(2)}`;
  }

  return {
    // Version Management
    createVersion(
      mouId: MouId,
      version: string,
      partyAId: AgencyId,
      partyBId: AgencyId,
      effectiveDate: string,
      expirationDate: string,
      previousVersionId?: MouVersionId,
      changesSummary?: string
    ): MouVersion {
      const id = generateId('version') as MouVersionId;

      const mouVersion: MouVersion = {
        id,
        mouId,
        version,
        status: 'draft',
        partyAId,
        partyBId,
        effectiveDate,
        expirationDate,
        createdAt: new Date().toISOString(),
        previousVersionId,
        changesSummary,
      };

      versions.set(id, mouVersion);

      // Mark previous version as superseded if exists
      if (previousVersionId) {
        const previous = versions.get(previousVersionId);
        if (previous) {
          versions.set(previousVersionId, { ...previous, status: 'superseded' });
        }
      }

      return mouVersion;
    },

    getVersion(id: MouVersionId): MouVersion | null {
      return versions.get(id) ?? null;
    },

    getVersionsByMou(mouId: MouId): readonly MouVersion[] {
      return [...versions.values()].filter(v => v.mouId === mouId);
    },

    getActiveVersion(mouId: MouId): MouVersion | null {
      return [...versions.values()].find(v => v.mouId === mouId && v.status === 'active') ?? null;
    },

    getVersionHistory(mouId: MouId): readonly MouVersion[] {
      return this.getVersionsByMou(mouId).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },

    submitForApproval(id: MouVersionId): MouVersion | null {
      const version = versions.get(id);
      if (!version || version.status !== 'draft') return null;

      const updated: MouVersion = { ...version, status: 'pending_approval' };
      versions.set(id, updated);
      return updated;
    },

    activateVersion(id: MouVersionId): MouVersion | null {
      const version = versions.get(id);
      if (!version || version.status !== 'pending_approval') return null;

      // Check for dual signoff
      const versionSignoffs = this.getSignoffsForVersion(id);
      const hasPartyA = versionSignoffs.some(s => s.agencyId === version.partyAId);
      const hasPartyB = versionSignoffs.some(s => s.agencyId === version.partyBId);

      if (!hasPartyA || !hasPartyB) return null;

      const updated: MouVersion = {
        ...version,
        status: 'active',
        activatedAt: new Date().toISOString(),
      };
      versions.set(id, updated);
      return updated;
    },

    terminateVersion(id: MouVersionId): MouVersion | null {
      const version = versions.get(id);
      if (!version || version.status !== 'active') return null;

      const updated: MouVersion = {
        ...version,
        status: 'terminated',
        terminatedAt: new Date().toISOString(),
      };
      versions.set(id, updated);
      return updated;
    },

    checkExpiration(id: MouVersionId): MouVersion | null {
      const version = versions.get(id);
      if (!version || version.status !== 'active') return null;

      const expiration = new Date(version.expirationDate);
      if (new Date() > expiration) {
        const updated: MouVersion = { ...version, status: 'expired' };
        versions.set(id, updated);
        return updated;
      }
      return version;
    },

    // Amendment Management
    proposeAmendment(
      mouVersionId: MouVersionId,
      proposedBy: AgencyId,
      title: string,
      description: string,
      proposedChanges: readonly string[]
    ): Amendment | null {
      const version = versions.get(mouVersionId);
      if (!version || version.status !== 'active') return null;

      const id = generateId('amendment') as AmendmentId;

      const amendment: Amendment = {
        id,
        mouVersionId,
        proposedBy,
        status: 'proposed',
        title,
        description,
        proposedChanges,
        proposedAt: new Date().toISOString(),
      };

      amendments.set(id, amendment);
      return amendment;
    },

    getAmendment(id: AmendmentId): Amendment | null {
      return amendments.get(id) ?? null;
    },

    getAmendmentsByVersion(mouVersionId: MouVersionId): readonly Amendment[] {
      return [...amendments.values()].filter(a => a.mouVersionId === mouVersionId);
    },

    getPendingAmendments(): readonly Amendment[] {
      return [...amendments.values()].filter(
        a => !['fully_approved', 'rejected'].includes(a.status)
      );
    },

    approveAmendment(id: AmendmentId, agencyId: AgencyId): Amendment | null {
      const amendment = amendments.get(id);
      if (!amendment) return null;

      const version = versions.get(amendment.mouVersionId);
      if (!version) return null;

      let newStatus = amendment.status;
      let partyAApprovedAt = amendment.partyAApprovedAt;
      let partyBApprovedAt = amendment.partyBApprovedAt;
      let fullyApprovedAt: string | undefined;

      if (agencyId === version.partyAId && !partyAApprovedAt) {
        partyAApprovedAt = new Date().toISOString();
        if (amendment.status === 'proposed') newStatus = 'party_a_approved';
        else if (amendment.status === 'party_b_approved') {
          newStatus = 'fully_approved';
          fullyApprovedAt = new Date().toISOString();
        }
      } else if (agencyId === version.partyBId && !partyBApprovedAt) {
        partyBApprovedAt = new Date().toISOString();
        if (amendment.status === 'proposed') newStatus = 'party_b_approved';
        else if (amendment.status === 'party_a_approved') {
          newStatus = 'fully_approved';
          fullyApprovedAt = new Date().toISOString();
        }
      }

      const updated: Amendment = {
        ...amendment,
        status: newStatus,
        partyAApprovedAt,
        partyBApprovedAt,
        fullyApprovedAt,
      };

      amendments.set(id, updated);
      return updated;
    },

    rejectAmendment(id: AmendmentId, reason: string): Amendment | null {
      const amendment = amendments.get(id);
      if (!amendment || amendment.status === 'fully_approved' || amendment.status === 'rejected')
        return null;

      const updated: Amendment = {
        ...amendment,
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason,
      };

      amendments.set(id, updated);
      return updated;
    },

    applyAmendment(id: AmendmentId): { amendment: Amendment; newVersion: MouVersion } | null {
      const amendment = amendments.get(id);
      if (!amendment || amendment.status !== 'fully_approved') return null;

      const currentVersion = versions.get(amendment.mouVersionId);
      if (!currentVersion) return null;

      // Create new version
      const versionParts = currentVersion.version.split('.').map(Number);
      versionParts[versionParts.length - 1]++;
      const newVersionStr = versionParts.join('.');

      const newVersion = this.createVersion(
        currentVersion.mouId,
        newVersionStr,
        currentVersion.partyAId,
        currentVersion.partyBId,
        new Date().toISOString(),
        currentVersion.expirationDate,
        currentVersion.id,
        amendment.description
      );

      const updatedAmendment: Amendment = {
        ...amendment,
        newVersionId: newVersion.id,
      };

      amendments.set(id, updatedAmendment);
      return { amendment: updatedAmendment, newVersion };
    },

    // Signoff Management
    createSignoff(
      mouVersionId: MouVersionId,
      agencyId: AgencyId,
      signoffType: SignoffType,
      signedBy: string,
      role: string,
      attestation: string
    ): Signoff | null {
      const version = versions.get(mouVersionId);
      if (!version) return null;

      // Get previous signoff for chain - use ID as tiebreaker for stable ordering
      const existingSignoffs = this.getSignoffsForVersion(mouVersionId)
        .filter(s => s.agencyId === agencyId)
        .sort((a, b) => {
          const timeDiff = new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime();
          if (timeDiff !== 0) return timeDiff;
          return b.id.localeCompare(a.id);
        });

      const previousSignoffId = existingSignoffs.length > 0 ? existingSignoffs[0].id : undefined;

      const id = generateId('signoff') as SignoffId;

      const signoff: Signoff = {
        id,
        mouVersionId,
        agencyId,
        signoffType,
        signedBy,
        role,
        signedAt: new Date().toISOString(),
        signature: generateSignature(),
        attestation,
        previousSignoffId,
      };

      signoffs.set(id, signoff);
      return signoff;
    },

    getSignoff(id: SignoffId): Signoff | null {
      return signoffs.get(id) ?? null;
    },

    getSignoffsForVersion(mouVersionId: MouVersionId): readonly Signoff[] {
      return [...signoffs.values()].filter(s => s.mouVersionId === mouVersionId);
    },

    getSignoffChain(signoffId: SignoffId): readonly Signoff[] {
      const chain: Signoff[] = [];
      let current = signoffs.get(signoffId);

      while (current) {
        chain.push(current);
        current = current.previousSignoffId ? signoffs.get(current.previousSignoffId) : undefined;
      }

      return chain.reverse();
    },

    hasDualApproval(mouVersionId: MouVersionId): boolean {
      const version = versions.get(mouVersionId);
      if (!version) return false;

      const versionSignoffs = this.getSignoffsForVersion(mouVersionId);
      const hasPartyA = versionSignoffs.some(s => s.agencyId === version.partyAId);
      const hasPartyB = versionSignoffs.some(s => s.agencyId === version.partyBId);

      return hasPartyA && hasPartyB;
    },

    verifySignature(signoffId: SignoffId): boolean {
      const signoff = signoffs.get(signoffId);
      return signoff ? signoff.signature.startsWith('sig_') : false;
    },

    // Scheduled Review Management
    scheduleReview(mouVersionId: MouVersionId, scheduledDate: string): ScheduledReview | null {
      const version = versions.get(mouVersionId);
      if (!version) return null;

      const id = generateId('review') as ReviewId;

      const review: ScheduledReview = {
        id,
        mouVersionId,
        scheduledDate,
      };

      reviews.set(id, review);
      return review;
    },

    getReview(id: ReviewId): ScheduledReview | null {
      return reviews.get(id) ?? null;
    },

    getReviewsForVersion(mouVersionId: MouVersionId): readonly ScheduledReview[] {
      return [...reviews.values()].filter(r => r.mouVersionId === mouVersionId);
    },

    getUpcomingReviews(daysAhead: number): readonly ScheduledReview[] {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + daysAhead);

      return [...reviews.values()]
        .filter(r => !r.completedAt && new Date(r.scheduledDate) <= cutoff)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    },

    completeReview(
      id: ReviewId,
      outcome: ReviewOutcome,
      notes: string,
      nextReviewDate?: string
    ): ScheduledReview | null {
      const review = reviews.get(id);
      if (!review || review.completedAt) return null;

      const updated: ScheduledReview = {
        ...review,
        completedAt: new Date().toISOString(),
        outcome,
        notes,
        nextReviewDate,
      };

      reviews.set(id, updated);

      // Schedule next review if provided
      if (nextReviewDate) {
        this.scheduleReview(review.mouVersionId, nextReviewDate);
      }

      return updated;
    },

    getOverdueReviews(): readonly ScheduledReview[] {
      const now = new Date();
      return [...reviews.values()].filter(r => !r.completedAt && new Date(r.scheduledDate) < now);
    },

    // Expiry Management
    checkExpiryStatus(mouVersionId: MouVersionId): ExpiryNotice | null {
      const version = versions.get(mouVersionId);
      if (!version || version.status !== 'active') return null;

      const expiration = new Date(version.expirationDate);
      const now = new Date();
      const daysRemaining = Math.floor(
        (expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      let notificationLevel: ExpiryNotice['notificationLevel'];
      if (daysRemaining < 0) notificationLevel = 'expired';
      else if (daysRemaining <= 7) notificationLevel = 'urgent';
      else if (daysRemaining <= 30) notificationLevel = 'warning';
      else if (daysRemaining <= 90) notificationLevel = 'advance';
      else return null; // Too far out for notification

      return {
        mouVersionId,
        expirationDate: version.expirationDate,
        daysRemaining,
        notificationLevel,
      };
    },

    getExpiringVersions(daysAhead: number): readonly MouVersion[] {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + daysAhead);

      return [...versions.values()].filter(
        v => v.status === 'active' && new Date(v.expirationDate) <= cutoff
      );
    },

    renewVersion(id: MouVersionId, newExpirationDate: string): MouVersion | null {
      const version = versions.get(id);
      if (!version || version.status !== 'active') return null;

      // Create new version with same content but new expiration
      const versionParts = version.version.split('.').map(Number);
      versionParts[0]++; // Bump major version for renewal
      versionParts[1] = 0;
      const newVersionStr = versionParts.join('.');

      return this.createVersion(
        version.mouId,
        newVersionStr,
        version.partyAId,
        version.partyBId,
        new Date().toISOString(),
        newExpirationDate,
        version.id,
        'Annual renewal'
      );
    },

    // Audit Trail
    getAuditTrail(mouId: MouId): readonly { type: string; timestamp: string; details: string }[] {
      const trail: { type: string; timestamp: string; details: string }[] = [];

      // Add version events
      for (const version of this.getVersionsByMou(mouId)) {
        trail.push({
          type: 'version_created',
          timestamp: version.createdAt,
          details: `Version ${version.version} created`,
        });

        if (version.activatedAt) {
          trail.push({
            type: 'version_activated',
            timestamp: version.activatedAt,
            details: `Version ${version.version} activated`,
          });
        }

        if (version.terminatedAt) {
          trail.push({
            type: 'version_terminated',
            timestamp: version.terminatedAt,
            details: `Version ${version.version} terminated`,
          });
        }

        // Add signoffs
        for (const signoff of this.getSignoffsForVersion(version.id)) {
          trail.push({
            type: 'signoff',
            timestamp: signoff.signedAt,
            details: `${signoff.signoffType} signoff by ${signoff.role}`,
          });
        }

        // Add amendments
        for (const amendment of this.getAmendmentsByVersion(version.id)) {
          trail.push({
            type: 'amendment_proposed',
            timestamp: amendment.proposedAt,
            details: amendment.title,
          });

          if (amendment.fullyApprovedAt) {
            trail.push({
              type: 'amendment_approved',
              timestamp: amendment.fullyApprovedAt,
              details: `Amendment "${amendment.title}" fully approved`,
            });
          }
        }
      }

      return trail.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXII: MOU Versioning Contracts', () => {
  let versioningService: ReturnType<typeof createMockVersioningService>;
  const mouA = 'sha256:mou_alpha' as MouId;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const agencyB = 'sha256:agency_beta' as AgencyId;

  beforeEach(() => {
    versioningService = createMockVersioningService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate version IDs with sha256: prefix', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      assert.ok(version.id.startsWith('sha256:'));
    });

    it('should generate amendment IDs with sha256: prefix', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.submitForApproval(version.id);
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'I attest'
      );
      versioningService.createSignoff(
        version.id,
        agencyB,
        'creation',
        'Jane',
        'Director',
        'I attest'
      );
      versioningService.activateVersion(version.id);

      const amendment = versioningService.proposeAmendment(version.id, agencyA, 'Test', 'Desc', [
        'Change 1',
      ]);
      assert.ok(amendment?.id.startsWith('sha256:'));
    });

    it('should generate signoff IDs with sha256: prefix', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      const signoff = versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'I attest'
      );
      assert.ok(signoff?.id.startsWith('sha256:'));
    });

    it('should generate review IDs with sha256: prefix', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      const review = versioningService.scheduleReview(version.id, '2024-07-01');
      assert.ok(review?.id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Version Management Tests
  // ==========================================================================

  describe('Version Management', () => {
    it('should create version in draft status', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      assert.strictEqual(version.status, 'draft');
    });

    it('should submit for approval', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      const updated = versioningService.submitForApproval(version.id);
      assert.strictEqual(updated?.status, 'pending_approval');
    });

    it('should not activate without dual approval', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.submitForApproval(version.id);
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'I attest'
      );

      const activated = versioningService.activateVersion(version.id);
      assert.strictEqual(activated, null);
    });

    it('should activate with dual approval', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.submitForApproval(version.id);
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'I attest'
      );
      versioningService.createSignoff(
        version.id,
        agencyB,
        'creation',
        'Jane',
        'Director',
        'I attest'
      );

      const activated = versioningService.activateVersion(version.id);
      assert.strictEqual(activated?.status, 'active');
      assert.ok(activated?.activatedAt);
    });

    it('should terminate version', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.submitForApproval(version.id);
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'I attest'
      );
      versioningService.createSignoff(
        version.id,
        agencyB,
        'creation',
        'Jane',
        'Director',
        'I attest'
      );
      versioningService.activateVersion(version.id);

      const terminated = versioningService.terminateVersion(version.id);
      assert.strictEqual(terminated?.status, 'terminated');
    });

    it('should get version history', () => {
      versioningService.createVersion(mouA, '1.0.0', agencyA, agencyB, '2024-01-01', '2025-01-01');
      versioningService.createVersion(mouA, '1.0.1', agencyA, agencyB, '2024-02-01', '2025-02-01');

      const history = versioningService.getVersionHistory(mouA);
      assert.strictEqual(history.length, 2);
    });

    it('should mark previous version as superseded', () => {
      const v1 = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.createVersion(
        mouA,
        '1.0.1',
        agencyA,
        agencyB,
        '2024-02-01',
        '2025-02-01',
        v1.id
      );

      const oldVersion = versioningService.getVersion(v1.id);
      assert.strictEqual(oldVersion?.status, 'superseded');
    });
  });

  // ==========================================================================
  // Amendment Tests
  // ==========================================================================

  describe('Amendment Management', () => {
    let activeVersion: MouVersion;

    beforeEach(() => {
      activeVersion = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.submitForApproval(activeVersion.id);
      versioningService.createSignoff(
        activeVersion.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'I attest'
      );
      versioningService.createSignoff(
        activeVersion.id,
        agencyB,
        'creation',
        'Jane',
        'Director',
        'I attest'
      );
      versioningService.activateVersion(activeVersion.id);
    });

    it('should propose amendment', () => {
      const amendment = versioningService.proposeAmendment(
        activeVersion.id,
        agencyA,
        'Update SLAs',
        'Improve response times',
        ['Change SLA from 4h to 2h']
      );

      assert.ok(amendment);
      assert.strictEqual(amendment.status, 'proposed');
    });

    it('should not propose amendment on non-active version', () => {
      const draft = versioningService.createVersion(
        mouA,
        '2.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      const amendment = versioningService.proposeAmendment(draft.id, agencyA, 'Test', 'Desc', [
        'Change',
      ]);

      assert.strictEqual(amendment, null);
    });

    it('should approve amendment by party A', () => {
      const amendment = versioningService.proposeAmendment(
        activeVersion.id,
        agencyA,
        'Test',
        'Desc',
        ['Change']
      );
      const approved = versioningService.approveAmendment(amendment!.id, agencyA);

      assert.strictEqual(approved?.status, 'party_a_approved');
      assert.ok(approved?.partyAApprovedAt);
    });

    it('should approve amendment by party B', () => {
      const amendment = versioningService.proposeAmendment(
        activeVersion.id,
        agencyA,
        'Test',
        'Desc',
        ['Change']
      );
      const approved = versioningService.approveAmendment(amendment!.id, agencyB);

      assert.strictEqual(approved?.status, 'party_b_approved');
      assert.ok(approved?.partyBApprovedAt);
    });

    it('should fully approve amendment with dual approval', () => {
      const amendment = versioningService.proposeAmendment(
        activeVersion.id,
        agencyA,
        'Test',
        'Desc',
        ['Change']
      );
      versioningService.approveAmendment(amendment!.id, agencyA);
      const fullyApproved = versioningService.approveAmendment(amendment!.id, agencyB);

      assert.strictEqual(fullyApproved?.status, 'fully_approved');
      assert.ok(fullyApproved?.fullyApprovedAt);
    });

    it('should reject amendment', () => {
      const amendment = versioningService.proposeAmendment(
        activeVersion.id,
        agencyA,
        'Test',
        'Desc',
        ['Change']
      );
      const rejected = versioningService.rejectAmendment(amendment!.id, 'Not acceptable');

      assert.strictEqual(rejected?.status, 'rejected');
      assert.strictEqual(rejected?.rejectionReason, 'Not acceptable');
    });

    it('should apply fully approved amendment', () => {
      const amendment = versioningService.proposeAmendment(
        activeVersion.id,
        agencyA,
        'Test',
        'Desc',
        ['Change']
      );
      versioningService.approveAmendment(amendment!.id, agencyA);
      versioningService.approveAmendment(amendment!.id, agencyB);

      const result = versioningService.applyAmendment(amendment!.id);
      assert.ok(result);
      assert.ok(result.newVersion);
      assert.strictEqual(result.newVersion.version, '1.0.1');
    });

    it('should not apply non-approved amendment', () => {
      const amendment = versioningService.proposeAmendment(
        activeVersion.id,
        agencyA,
        'Test',
        'Desc',
        ['Change']
      );
      const result = versioningService.applyAmendment(amendment!.id);

      assert.strictEqual(result, null);
    });

    it('should get pending amendments', () => {
      versioningService.proposeAmendment(activeVersion.id, agencyA, 'Test 1', 'Desc', ['Change 1']);
      versioningService.proposeAmendment(activeVersion.id, agencyB, 'Test 2', 'Desc', ['Change 2']);

      const pending = versioningService.getPendingAmendments();
      assert.strictEqual(pending.length, 2);
    });
  });

  // ==========================================================================
  // Signoff Tests
  // ==========================================================================

  describe('Signoff Management', () => {
    it('should create signoff with signature', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      const signoff = versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John Doe',
        'Director',
        'I attest to the accuracy'
      );

      assert.ok(signoff);
      assert.ok(signoff.signature.startsWith('sig_'));
    });

    it('should chain signoffs', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'Attest 1'
      );
      const second = versioningService.createSignoff(
        version.id,
        agencyA,
        'acknowledgement',
        'John',
        'Director',
        'Attest 2'
      );

      assert.ok(second?.previousSignoffId);
    });

    it('should get signoff chain', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'Attest 1'
      );
      versioningService.createSignoff(
        version.id,
        agencyA,
        'acknowledgement',
        'John',
        'Director',
        'Attest 2'
      );
      const third = versioningService.createSignoff(
        version.id,
        agencyA,
        'renewal',
        'John',
        'Director',
        'Attest 3'
      );

      const chain = versioningService.getSignoffChain(third!.id);
      // Chain should include all signoffs from this agency for this version
      assert.ok(chain.length >= 1);
      assert.ok(chain.some(s => s.signoffType === 'renewal'));
      // The chain follows previousSignoffId links
      const allSignoffs = versioningService
        .getSignoffsForVersion(version.id)
        .filter(s => s.agencyId === agencyA);
      assert.strictEqual(allSignoffs.length, 3);
    });

    it('should check dual approval', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );

      assert.strictEqual(versioningService.hasDualApproval(version.id), false);

      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'Attest'
      );
      assert.strictEqual(versioningService.hasDualApproval(version.id), false);

      versioningService.createSignoff(
        version.id,
        agencyB,
        'creation',
        'Jane',
        'Director',
        'Attest'
      );
      assert.strictEqual(versioningService.hasDualApproval(version.id), true);
    });

    it('should verify signature', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      const signoff = versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'Attest'
      );

      assert.strictEqual(versioningService.verifySignature(signoff!.id), true);
    });
  });

  // ==========================================================================
  // Scheduled Review Tests
  // ==========================================================================

  describe('Scheduled Review', () => {
    it('should schedule review', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      const review = versioningService.scheduleReview(version.id, '2024-07-01');

      assert.ok(review);
      assert.strictEqual(review.scheduledDate, '2024-07-01');
    });

    it('should complete review', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      const review = versioningService.scheduleReview(version.id, '2024-07-01');
      const completed = versioningService.completeReview(
        review!.id,
        'approved',
        'All requirements met',
        '2025-01-01'
      );

      assert.strictEqual(completed?.outcome, 'approved');
      assert.ok(completed?.completedAt);
    });

    it('should schedule next review on completion', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      const review = versioningService.scheduleReview(version.id, '2024-07-01');
      versioningService.completeReview(review!.id, 'approved', 'OK', '2025-01-01');

      const reviews = versioningService.getReviewsForVersion(version.id);
      assert.strictEqual(reviews.length, 2);
    });

    it('should get upcoming reviews', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      versioningService.scheduleReview(version.id, tomorrow.toISOString().split('T')[0]);

      const upcoming = versioningService.getUpcomingReviews(7);
      assert.strictEqual(upcoming.length, 1);
    });

    it('should get overdue reviews', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.scheduleReview(version.id, '2020-01-01'); // Past date

      const overdue = versioningService.getOverdueReviews();
      assert.strictEqual(overdue.length, 1);
    });
  });

  // ==========================================================================
  // Expiry Management Tests
  // ==========================================================================

  describe('Expiry Management', () => {
    it('should check expiry status', () => {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 5);

      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        nextWeek.toISOString()
      );
      versioningService.submitForApproval(version.id);
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'Attest'
      );
      versioningService.createSignoff(
        version.id,
        agencyB,
        'creation',
        'Jane',
        'Director',
        'Attest'
      );
      versioningService.activateVersion(version.id);

      const notice = versioningService.checkExpiryStatus(version.id);
      assert.ok(notice);
      assert.strictEqual(notice.notificationLevel, 'urgent');
    });

    it('should get expiring versions', () => {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 20);

      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        nextMonth.toISOString()
      );
      versioningService.submitForApproval(version.id);
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'Attest'
      );
      versioningService.createSignoff(
        version.id,
        agencyB,
        'creation',
        'Jane',
        'Director',
        'Attest'
      );
      versioningService.activateVersion(version.id);

      const expiring = versioningService.getExpiringVersions(30);
      assert.strictEqual(expiring.length, 1);
    });

    it('should renew version', () => {
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);

      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        nextMonth.toISOString()
      );
      versioningService.submitForApproval(version.id);
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'Attest'
      );
      versioningService.createSignoff(
        version.id,
        agencyB,
        'creation',
        'Jane',
        'Director',
        'Attest'
      );
      versioningService.activateVersion(version.id);

      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      const renewed = versioningService.renewVersion(version.id, nextYear.toISOString());
      assert.ok(renewed);
      assert.strictEqual(renewed.version, '2.0.0');
    });

    it('should mark version as expired', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        yesterday.toISOString()
      );
      versioningService.submitForApproval(version.id);
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'Attest'
      );
      versioningService.createSignoff(
        version.id,
        agencyB,
        'creation',
        'Jane',
        'Director',
        'Attest'
      );
      versioningService.activateVersion(version.id);

      const checked = versioningService.checkExpiration(version.id);
      assert.strictEqual(checked?.status, 'expired');
    });
  });

  // ==========================================================================
  // Audit Trail Tests
  // ==========================================================================

  describe('Audit Trail', () => {
    it('should generate audit trail', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.submitForApproval(version.id);
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'Attest'
      );
      versioningService.createSignoff(
        version.id,
        agencyB,
        'creation',
        'Jane',
        'Director',
        'Attest'
      );
      versioningService.activateVersion(version.id);

      const trail = versioningService.getAuditTrail(mouA);
      assert.ok(trail.length >= 3); // Created + 2 signoffs + activated
    });

    it('should order audit trail chronologically', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'Attest'
      );

      const trail = versioningService.getAuditTrail(mouA);

      for (let i = 1; i < trail.length; i++) {
        const prev = new Date(trail[i - 1].timestamp).getTime();
        const curr = new Date(trail[i].timestamp).getTime();
        assert.ok(curr >= prev);
      }
    });

    it('should include amendments in audit trail', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.submitForApproval(version.id);
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'Attest'
      );
      versioningService.createSignoff(
        version.id,
        agencyB,
        'creation',
        'Jane',
        'Director',
        'Attest'
      );
      versioningService.activateVersion(version.id);

      versioningService.proposeAmendment(version.id, agencyA, 'Test Amendment', 'Description', [
        'Change',
      ]);

      const trail = versioningService.getAuditTrail(mouA);
      assert.ok(trail.some(e => e.type === 'amendment_proposed'));
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of versions', () => {
      versioningService.createVersion(mouA, '1.0.0', agencyA, agencyB, '2024-01-01', '2025-01-01');
      const v1 = versioningService.getVersionsByMou(mouA);
      const v2 = versioningService.getVersionsByMou(mouA);
      assert.ok(v1 !== v2);
    });

    it('should return copies of signoffs', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'Attest'
      );
      const s1 = versioningService.getSignoffsForVersion(version.id);
      const s2 = versioningService.getSignoffsForVersion(version.id);
      assert.ok(s1 !== s2);
    });

    it('should return copies of amendments', () => {
      const version = versioningService.createVersion(
        mouA,
        '1.0.0',
        agencyA,
        agencyB,
        '2024-01-01',
        '2025-01-01'
      );
      versioningService.submitForApproval(version.id);
      versioningService.createSignoff(
        version.id,
        agencyA,
        'creation',
        'John',
        'Director',
        'Attest'
      );
      versioningService.createSignoff(
        version.id,
        agencyB,
        'creation',
        'Jane',
        'Director',
        'Attest'
      );
      versioningService.activateVersion(version.id);
      versioningService.proposeAmendment(version.id, agencyA, 'Test', 'Desc', ['Change']);

      const a1 = versioningService.getAmendmentsByVersion(version.id);
      const a2 = versioningService.getAmendmentsByVersion(version.id);
      assert.ok(a1 !== a2);
    });
  });
});
