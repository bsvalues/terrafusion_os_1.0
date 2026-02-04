/**
 * Phase XIX — Game Days + Red Team Governance
 * ============================================
 * Contract: postmortem.quality.contract.test.ts
 *
 * Tests postmortem document governance during game day exercises,
 * including required sections, action items, signoff workflows,
 * and timeline compliance.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Postmortems require specific sections for compliance
 * - Action items must have owners and deadlines
 * - Signoff requires multiple stakeholders
 * - Timelines enforced from incident to publication
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type PostmortemId = `sha256:${string}`;
type ActionItemId = `sha256:${string}`;
type IncidentId = `sha256:${string}`;
type OperatorId = `sha256:${string}`;
type SignoffId = `sha256:${string}`;

type PostmortemStatus = 'draft' | 'review' | 'pending_signoff' | 'published' | 'archived';
type ActionItemStatus = 'open' | 'in_progress' | 'completed' | 'deferred' | 'cancelled';
type SeverityLevel = 'sev1' | 'sev2' | 'sev3' | 'sev4';

interface RequiredSection {
  readonly name: string;
  readonly present: boolean;
  readonly wordCount: number;
  readonly minimumWords: number;
}

interface ActionItem {
  readonly id: ActionItemId;
  readonly title: string;
  readonly description: string;
  readonly owner: OperatorId;
  readonly deadline: string;
  readonly status: ActionItemStatus;
  readonly priority: 'critical' | 'high' | 'medium' | 'low';
  readonly createdAt: string;
  readonly completedAt?: string;
}

interface Signoff {
  readonly id: SignoffId;
  readonly operator: OperatorId;
  readonly role: 'author' | 'reviewer' | 'stakeholder' | 'executive';
  readonly timestamp: string;
  readonly comment?: string;
}

interface PostmortemTimeline {
  readonly incidentStart: string;
  readonly incidentEnd: string;
  readonly draftCreated: string;
  readonly reviewRequested?: string;
  readonly signoffRequested?: string;
  readonly published?: string;
  readonly deadlines: {
    readonly draftDue: string;
    readonly reviewDue: string;
    readonly publicationDue: string;
  };
}

interface Postmortem {
  readonly id: PostmortemId;
  readonly incidentId: IncidentId;
  readonly gameDayId: string;
  readonly title: string;
  readonly severity: SeverityLevel;
  readonly status: PostmortemStatus;
  readonly author: OperatorId;
  readonly sections: Record<string, string>;
  readonly actionItems: readonly ActionItem[];
  readonly signoffs: readonly Signoff[];
  readonly timeline: PostmortemTimeline;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly publishedAt?: string;
}

interface QualityReport {
  readonly postmortemId: PostmortemId;
  readonly valid: boolean;
  readonly score: number;
  readonly maxScore: number;
  readonly sectionAnalysis: readonly RequiredSection[];
  readonly actionItemsAnalysis: {
    readonly total: number;
    readonly withOwner: number;
    readonly withDeadline: number;
    readonly valid: boolean;
  };
  readonly signoffAnalysis: {
    readonly required: readonly string[];
    readonly present: readonly string[];
    readonly complete: boolean;
  };
  readonly timelineAnalysis: {
    readonly onTime: boolean;
    readonly overdueDays: number;
    readonly violations: readonly string[];
  };
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockPostmortemService() {
  const postmortems = new Map<PostmortemId, Postmortem>();

  // Required sections for compliance
  const requiredSections = [
    { name: 'summary', minimumWords: 50 },
    { name: 'impact', minimumWords: 30 },
    { name: 'root_cause', minimumWords: 50 },
    { name: 'timeline', minimumWords: 30 },
    { name: 'detection', minimumWords: 20 },
    { name: 'response', minimumWords: 30 },
    { name: 'lessons_learned', minimumWords: 50 },
    { name: 'action_items', minimumWords: 20 },
  ];

  // Signoff requirements by severity
  const signoffRequirements: Record<SeverityLevel, readonly string[]> = {
    sev1: ['author', 'reviewer', 'stakeholder', 'executive'],
    sev2: ['author', 'reviewer', 'stakeholder'],
    sev3: ['author', 'reviewer'],
    sev4: ['author'],
  };

  // Timeline requirements by severity (hours from incident end)
  const timelineRequirements: Record<
    SeverityLevel,
    { draft: number; review: number; publish: number }
  > = {
    sev1: { draft: 24, review: 48, publish: 72 },
    sev2: { draft: 48, review: 96, publish: 168 },
    sev3: { draft: 72, review: 168, publish: 336 },
    sev4: { draft: 168, review: 336, publish: 672 },
  };

  function generateId(prefix: string): PostmortemId {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}` as PostmortemId;
  }

  function countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0).length;
  }

  function calculateDeadlines(
    incidentEnd: string,
    severity: SeverityLevel
  ): PostmortemTimeline['deadlines'] {
    const endDate = new Date(incidentEnd);
    const req = timelineRequirements[severity];
    return {
      draftDue: new Date(endDate.getTime() + req.draft * 60 * 60 * 1000).toISOString(),
      reviewDue: new Date(endDate.getTime() + req.review * 60 * 60 * 1000).toISOString(),
      publicationDue: new Date(endDate.getTime() + req.publish * 60 * 60 * 1000).toISOString(),
    };
  }

  return {
    // Postmortem Lifecycle
    createPostmortem(
      incidentId: IncidentId,
      gameDayId: string,
      title: string,
      severity: SeverityLevel,
      author: OperatorId,
      incidentStart: string,
      incidentEnd: string
    ): Postmortem {
      const id = generateId('postmortem');
      const now = new Date().toISOString();
      const deadlines = calculateDeadlines(incidentEnd, severity);

      const postmortem: Postmortem = {
        id,
        incidentId,
        gameDayId,
        title,
        severity,
        status: 'draft',
        author,
        sections: {},
        actionItems: [],
        signoffs: [],
        timeline: {
          incidentStart,
          incidentEnd,
          draftCreated: now,
          deadlines,
        },
        createdAt: now,
        updatedAt: now,
      };
      postmortems.set(id, postmortem);
      return postmortem;
    },

    getPostmortem(id: PostmortemId): Postmortem | null {
      return postmortems.get(id) ?? null;
    },

    // Section Management
    updateSection(
      postmortemId: PostmortemId,
      sectionName: string,
      content: string
    ): Postmortem | null {
      const pm = postmortems.get(postmortemId);
      if (!pm || pm.status === 'published' || pm.status === 'archived') return null;

      const updated: Postmortem = {
        ...pm,
        sections: { ...pm.sections, [sectionName]: content },
        updatedAt: new Date().toISOString(),
      };
      postmortems.set(postmortemId, updated);
      return updated;
    },

    getSection(postmortemId: PostmortemId, sectionName: string): string | null {
      const pm = postmortems.get(postmortemId);
      return pm?.sections[sectionName] ?? null;
    },

    // Action Item Management
    addActionItem(
      postmortemId: PostmortemId,
      title: string,
      description: string,
      owner: OperatorId,
      deadline: string,
      priority: ActionItem['priority']
    ): ActionItem | null {
      const pm = postmortems.get(postmortemId);
      if (!pm || pm.status === 'published' || pm.status === 'archived') return null;

      const actionItem: ActionItem = {
        id: generateId('action') as ActionItemId,
        title,
        description,
        owner,
        deadline,
        priority,
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      const updated: Postmortem = {
        ...pm,
        actionItems: [...pm.actionItems, actionItem],
        updatedAt: new Date().toISOString(),
      };
      postmortems.set(postmortemId, updated);
      return actionItem;
    },

    updateActionItem(
      postmortemId: PostmortemId,
      actionItemId: ActionItemId,
      updates: Partial<Pick<ActionItem, 'status' | 'owner' | 'deadline'>>
    ): ActionItem | null {
      const pm = postmortems.get(postmortemId);
      if (!pm) return null;

      const index = pm.actionItems.findIndex(a => a.id === actionItemId);
      if (index === -1) return null;

      const existingItem = pm.actionItems[index];
      const updatedItem: ActionItem = {
        ...existingItem,
        ...updates,
        completedAt:
          updates.status === 'completed' ? new Date().toISOString() : existingItem.completedAt,
      };

      const newActionItems = [...pm.actionItems];
      newActionItems[index] = updatedItem;

      const updated: Postmortem = {
        ...pm,
        actionItems: newActionItems,
        updatedAt: new Date().toISOString(),
      };
      postmortems.set(postmortemId, updated);
      return updatedItem;
    },

    getActionItems(postmortemId: PostmortemId): readonly ActionItem[] {
      return postmortems.get(postmortemId)?.actionItems ?? [];
    },

    // Workflow Transitions
    submitForReview(postmortemId: PostmortemId): Postmortem | null {
      const pm = postmortems.get(postmortemId);
      if (!pm || pm.status !== 'draft') return null;

      const updated: Postmortem = {
        ...pm,
        status: 'review',
        timeline: {
          ...pm.timeline,
          reviewRequested: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };
      postmortems.set(postmortemId, updated);
      return updated;
    },

    requestSignoff(postmortemId: PostmortemId): Postmortem | null {
      const pm = postmortems.get(postmortemId);
      if (!pm || pm.status !== 'review') return null;

      const updated: Postmortem = {
        ...pm,
        status: 'pending_signoff',
        timeline: {
          ...pm.timeline,
          signoffRequested: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };
      postmortems.set(postmortemId, updated);
      return updated;
    },

    addSignoff(
      postmortemId: PostmortemId,
      operator: OperatorId,
      role: Signoff['role'],
      comment?: string
    ): Signoff | null {
      const pm = postmortems.get(postmortemId);
      if (!pm || (pm.status !== 'pending_signoff' && pm.status !== 'review')) return null;

      // Cannot sign off twice
      if (pm.signoffs.some(s => s.operator === operator && s.role === role)) {
        return null;
      }

      const signoff: Signoff = {
        id: generateId('signoff') as SignoffId,
        operator,
        role,
        timestamp: new Date().toISOString(),
        comment,
      };

      const updated: Postmortem = {
        ...pm,
        signoffs: [...pm.signoffs, signoff],
        updatedAt: new Date().toISOString(),
      };
      postmortems.set(postmortemId, updated);
      return signoff;
    },

    publish(postmortemId: PostmortemId): Postmortem | null {
      const pm = postmortems.get(postmortemId);
      if (!pm || pm.status !== 'pending_signoff') return null;

      // Check all required signoffs present
      const required = signoffRequirements[pm.severity];
      const presentRoles = pm.signoffs.map(s => s.role);
      for (const role of required) {
        if (!presentRoles.includes(role as Signoff['role'])) {
          return null; // Missing required signoff
        }
      }

      const now = new Date().toISOString();
      const updated: Postmortem = {
        ...pm,
        status: 'published',
        publishedAt: now,
        timeline: {
          ...pm.timeline,
          published: now,
        },
        updatedAt: now,
      };
      postmortems.set(postmortemId, updated);
      return updated;
    },

    archive(postmortemId: PostmortemId): Postmortem | null {
      const pm = postmortems.get(postmortemId);
      if (!pm || pm.status !== 'published') return null;

      const updated: Postmortem = {
        ...pm,
        status: 'archived',
        updatedAt: new Date().toISOString(),
      };
      postmortems.set(postmortemId, updated);
      return updated;
    },

    // Return to draft
    rejectReview(postmortemId: PostmortemId, reason: string): Postmortem | null {
      const pm = postmortems.get(postmortemId);
      if (!pm || pm.status !== 'review') return null;

      const updated: Postmortem = {
        ...pm,
        status: 'draft',
        updatedAt: new Date().toISOString(),
      };
      postmortems.set(postmortemId, updated);
      return updated;
    },

    // Quality Analysis
    analyzeQuality(postmortemId: PostmortemId): QualityReport | null {
      const pm = postmortems.get(postmortemId);
      if (!pm) return null;

      const errors: string[] = [];
      const warnings: string[] = [];
      let score = 0;
      let maxScore = 0;

      // Section Analysis
      const sectionAnalysis: RequiredSection[] = requiredSections.map(req => {
        const content = pm.sections[req.name] ?? '';
        const wordCount = countWords(content);
        const present = wordCount >= req.minimumWords;

        maxScore += 10;
        if (present) {
          score += 10;
        } else if (wordCount > 0) {
          score += 5;
          warnings.push(
            `Section '${req.name}' below minimum: ${wordCount}/${req.minimumWords} words`
          );
        } else {
          errors.push(`Missing required section: ${req.name}`);
        }

        return {
          name: req.name,
          present,
          wordCount,
          minimumWords: req.minimumWords,
        };
      });

      // Action Items Analysis
      const aiTotal = pm.actionItems.length;
      const aiWithOwner = pm.actionItems.filter(a => a.owner).length;
      const aiWithDeadline = pm.actionItems.filter(a => a.deadline).length;

      maxScore += 20;
      const aiValid = aiTotal > 0 && aiWithOwner === aiTotal && aiWithDeadline === aiTotal;
      if (aiValid) {
        score += 20;
      } else {
        if (aiTotal === 0) {
          errors.push('No action items defined');
        } else {
          if (aiWithOwner < aiTotal) {
            errors.push(`${aiTotal - aiWithOwner} action items missing owner`);
          }
          if (aiWithDeadline < aiTotal) {
            errors.push(`${aiTotal - aiWithDeadline} action items missing deadline`);
          }
          score += Math.floor((20 * (aiWithOwner + aiWithDeadline)) / (aiTotal * 2));
        }
      }

      // Signoff Analysis
      const requiredRoles = signoffRequirements[pm.severity];
      const presentRoles = [...new Set(pm.signoffs.map(s => s.role))];
      const signoffComplete = requiredRoles.every(r => presentRoles.includes(r as Signoff['role']));

      maxScore += 10;
      if (signoffComplete) {
        score += 10;
      } else {
        const missingRoles = requiredRoles.filter(
          r => !presentRoles.includes(r as Signoff['role'])
        );
        warnings.push(`Missing signoffs: ${missingRoles.join(', ')}`);
        score += Math.floor((10 * presentRoles.length) / requiredRoles.length);
      }

      // Timeline Analysis
      const now = new Date();
      const deadlines = pm.timeline.deadlines;
      let onTime = true;
      let overdueDays = 0;
      const violations: string[] = [];

      if (pm.status === 'draft') {
        const draftDue = new Date(deadlines.draftDue);
        if (now > draftDue) {
          onTime = false;
          overdueDays = Math.ceil((now.getTime() - draftDue.getTime()) / (24 * 60 * 60 * 1000));
          violations.push(`Draft overdue by ${overdueDays} days`);
        }
      } else if (pm.status === 'review') {
        const reviewDue = new Date(deadlines.reviewDue);
        if (now > reviewDue) {
          onTime = false;
          overdueDays = Math.ceil((now.getTime() - reviewDue.getTime()) / (24 * 60 * 60 * 1000));
          violations.push(`Review overdue by ${overdueDays} days`);
        }
      } else if (pm.status === 'pending_signoff') {
        const pubDue = new Date(deadlines.publicationDue);
        if (now > pubDue) {
          onTime = false;
          overdueDays = Math.ceil((now.getTime() - pubDue.getTime()) / (24 * 60 * 60 * 1000));
          violations.push(`Publication overdue by ${overdueDays} days`);
        }
      }

      maxScore += 10;
      if (onTime) {
        score += 10;
      } else {
        errors.push(...violations);
      }

      return {
        postmortemId,
        valid: errors.length === 0,
        score,
        maxScore,
        sectionAnalysis,
        actionItemsAnalysis: {
          total: aiTotal,
          withOwner: aiWithOwner,
          withDeadline: aiWithDeadline,
          valid: aiValid,
        },
        signoffAnalysis: {
          required: [...requiredRoles],
          present: presentRoles,
          complete: signoffComplete,
        },
        timelineAnalysis: {
          onTime,
          overdueDays,
          violations,
        },
        errors,
        warnings,
      };
    },

    // Queries
    getPostmortemsByGameDay(gameDayId: string): readonly Postmortem[] {
      return [...postmortems.values()].filter(p => p.gameDayId === gameDayId);
    },

    getPostmortemsByStatus(status: PostmortemStatus): readonly Postmortem[] {
      return [...postmortems.values()].filter(p => p.status === status);
    },

    getRequiredSections(): readonly { name: string; minimumWords: number }[] {
      return [...requiredSections];
    },

    getSignoffRequirements(severity: SeverityLevel): readonly string[] {
      return signoffRequirements[severity];
    },

    getTimelineRequirements(severity: SeverityLevel): {
      draft: number;
      review: number;
      publish: number;
    } {
      return timelineRequirements[severity];
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XIX: Postmortem Quality Contracts', () => {
  let service: ReturnType<typeof createMockPostmortemService>;
  const author = 'sha256:author_123' as OperatorId;
  const reviewer = 'sha256:reviewer_456' as OperatorId;
  const stakeholder = 'sha256:stakeholder_789' as OperatorId;
  const executive = 'sha256:executive_abc' as OperatorId;
  const incidentId = 'sha256:incident_001' as IncidentId;

  beforeEach(() => {
    service = createMockPostmortemService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate postmortem IDs with sha256: prefix', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      assert.ok(pm.id.startsWith('sha256:'));
    });

    it('should generate action item IDs with sha256: prefix', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      const action = service.addActionItem(
        pm.id,
        'Add monitoring',
        'Improve alerting',
        reviewer,
        '2024-02-01T00:00:00Z',
        'high'
      );
      assert.ok(action!.id.startsWith('sha256:'));
    });

    it('should generate signoff IDs with sha256: prefix', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev4',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      service.submitForReview(pm.id);
      service.requestSignoff(pm.id);
      const signoff = service.addSignoff(pm.id, author, 'author');
      assert.ok(signoff!.id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Required Section Tests
  // ==========================================================================

  describe('Required Sections', () => {
    it('should list 8 required sections', () => {
      const sections = service.getRequiredSections();
      assert.strictEqual(sections.length, 8);
    });

    it('should require summary section', () => {
      const sections = service.getRequiredSections();
      assert.ok(sections.some(s => s.name === 'summary'));
    });

    it('should require root_cause section', () => {
      const sections = service.getRequiredSections();
      assert.ok(sections.some(s => s.name === 'root_cause'));
    });

    it('should require lessons_learned section', () => {
      const sections = service.getRequiredSections();
      assert.ok(sections.some(s => s.name === 'lessons_learned'));
    });

    it('should have minimum word requirements', () => {
      const sections = service.getRequiredSections();
      for (const section of sections) {
        assert.ok(section.minimumWords > 0, `Section ${section.name} should have min words`);
      }
    });

    it('should allow updating sections', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      const content =
        'This is a detailed summary of the incident that occurred during the game day exercise.';
      service.updateSection(pm.id, 'summary', content);
      assert.strictEqual(service.getSection(pm.id, 'summary'), content);
    });

    it('should not allow section updates after publication', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev4',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );

      // Complete all required sections
      const sections = service.getRequiredSections();
      for (const section of sections) {
        const content = 'a '.repeat(section.minimumWords);
        service.updateSection(pm.id, section.name, content);
      }

      service.addActionItem(pm.id, 'Task', 'Description', reviewer, '2024-02-01Z', 'high');
      service.submitForReview(pm.id);
      service.requestSignoff(pm.id);
      service.addSignoff(pm.id, author, 'author');
      service.publish(pm.id);

      const result = service.updateSection(pm.id, 'summary', 'New content');
      assert.strictEqual(result, null);
    });
  });

  // ==========================================================================
  // Action Item Tests
  // ==========================================================================

  describe('Action Items', () => {
    it('should add action items', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      const action = service.addActionItem(
        pm.id,
        'Add monitoring',
        'Add alerting for API latency',
        reviewer,
        '2024-02-01T00:00:00Z',
        'high'
      );
      assert.ok(action);
      assert.strictEqual(action!.title, 'Add monitoring');
    });

    it('should require owner for action items', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      const action = service.addActionItem(
        pm.id,
        'Task',
        'Description',
        reviewer,
        '2024-02-01Z',
        'high'
      );
      assert.ok(action!.owner);
    });

    it('should require deadline for action items', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      const action = service.addActionItem(
        pm.id,
        'Task',
        'Description',
        reviewer,
        '2024-02-01Z',
        'high'
      );
      assert.ok(action!.deadline);
    });

    it('should track action item status', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      const action = service.addActionItem(
        pm.id,
        'Task',
        'Description',
        reviewer,
        '2024-02-01Z',
        'high'
      );
      assert.strictEqual(action!.status, 'open');

      service.updateActionItem(pm.id, action!.id, { status: 'completed' });
      const items = service.getActionItems(pm.id);
      const updated = items.find(a => a.id === action!.id);
      assert.strictEqual(updated!.status, 'completed');
      assert.ok(updated!.completedAt);
    });

    it('should flag missing action items in quality report', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      const report = service.analyzeQuality(pm.id);
      assert.ok(report!.errors.some(e => e.includes('No action items')));
      assert.strictEqual(report!.actionItemsAnalysis.valid, false);
    });
  });

  // ==========================================================================
  // Signoff Workflow Tests
  // ==========================================================================

  describe('Signoff Workflow', () => {
    it('should require author signoff for sev4', () => {
      const required = service.getSignoffRequirements('sev4');
      assert.deepStrictEqual([...required], ['author']);
    });

    it('should require author and reviewer for sev3', () => {
      const required = service.getSignoffRequirements('sev3');
      assert.deepStrictEqual([...required], ['author', 'reviewer']);
    });

    it('should require three signoffs for sev2', () => {
      const required = service.getSignoffRequirements('sev2');
      assert.strictEqual(required.length, 3);
      assert.ok(required.includes('author'));
      assert.ok(required.includes('reviewer'));
      assert.ok(required.includes('stakeholder'));
    });

    it('should require four signoffs for sev1', () => {
      const required = service.getSignoffRequirements('sev1');
      assert.strictEqual(required.length, 4);
      assert.ok(required.includes('executive'));
    });

    it('should add signoff', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev4',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      service.submitForReview(pm.id);
      service.requestSignoff(pm.id);
      const signoff = service.addSignoff(pm.id, author, 'author', 'Approved');
      assert.ok(signoff);
      assert.strictEqual(signoff!.role, 'author');
    });

    it('should prevent duplicate signoffs', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev4',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      service.submitForReview(pm.id);
      service.requestSignoff(pm.id);
      service.addSignoff(pm.id, author, 'author');
      const duplicate = service.addSignoff(pm.id, author, 'author');
      assert.strictEqual(duplicate, null);
    });

    it('should require all signoffs before publish', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      service.submitForReview(pm.id);
      service.requestSignoff(pm.id);
      service.addSignoff(pm.id, author, 'author');
      // Missing reviewer and stakeholder
      const result = service.publish(pm.id);
      assert.strictEqual(result, null);
    });

    it('should publish with all required signoffs', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      service.submitForReview(pm.id);
      service.requestSignoff(pm.id);
      service.addSignoff(pm.id, author, 'author');
      service.addSignoff(pm.id, reviewer, 'reviewer');
      service.addSignoff(pm.id, stakeholder, 'stakeholder');
      const result = service.publish(pm.id);
      assert.ok(result);
      assert.strictEqual(result!.status, 'published');
    });
  });

  // ==========================================================================
  // Timeline Tests
  // ==========================================================================

  describe('Timeline Compliance', () => {
    it('should set draft deadline based on severity', () => {
      const sev1Req = service.getTimelineRequirements('sev1');
      const sev4Req = service.getTimelineRequirements('sev4');
      assert.ok(sev1Req.draft < sev4Req.draft); // Sev1 has tighter deadline
    });

    it('should calculate deadlines from incident end', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T12:00:00Z'
      );
      assert.ok(pm.timeline.deadlines.draftDue);
      assert.ok(pm.timeline.deadlines.reviewDue);
      assert.ok(pm.timeline.deadlines.publicationDue);
    });

    it('should record incident start and end', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T12:00:00Z'
      );
      assert.strictEqual(pm.timeline.incidentStart, '2024-01-01T10:00:00Z');
      assert.strictEqual(pm.timeline.incidentEnd, '2024-01-01T12:00:00Z');
    });

    it('should record workflow timestamps', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev4',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      assert.ok(pm.timeline.draftCreated);

      service.submitForReview(pm.id);
      let updated = service.getPostmortem(pm.id);
      assert.ok(updated!.timeline.reviewRequested);

      service.requestSignoff(pm.id);
      updated = service.getPostmortem(pm.id);
      assert.ok(updated!.timeline.signoffRequested);

      service.addSignoff(pm.id, author, 'author');
      service.publish(pm.id);
      updated = service.getPostmortem(pm.id);
      assert.ok(updated!.timeline.published);
    });
  });

  // ==========================================================================
  // Quality Analysis Tests
  // ==========================================================================

  describe('Quality Analysis', () => {
    it('should calculate quality score', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      const report = service.analyzeQuality(pm.id);
      assert.ok(report!.score >= 0);
      assert.ok(report!.maxScore > 0);
    });

    it('should analyze all required sections', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      const report = service.analyzeQuality(pm.id);
      const requiredSections = service.getRequiredSections();
      assert.strictEqual(report!.sectionAnalysis.length, requiredSections.length);
    });

    it('should report missing sections as errors', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      const report = service.analyzeQuality(pm.id);
      assert.ok(report!.errors.some(e => e.includes('Missing required section')));
    });

    it('should warn about below-minimum sections', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      // Add section with too few words
      service.updateSection(pm.id, 'summary', 'Too short.');
      const report = service.analyzeQuality(pm.id);
      assert.ok(report!.warnings.some(w => w.includes('summary') && w.includes('below minimum')));
    });

    it('should report action item issues', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      const report = service.analyzeQuality(pm.id);
      assert.strictEqual(report!.actionItemsAnalysis.total, 0);
      assert.strictEqual(report!.actionItemsAnalysis.valid, false);
    });

    it('should analyze signoff completeness', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      const report = service.analyzeQuality(pm.id);
      assert.strictEqual(report!.signoffAnalysis.complete, false);
      assert.strictEqual(report!.signoffAnalysis.required.length, 3);
    });
  });

  // ==========================================================================
  // Workflow State Tests
  // ==========================================================================

  describe('Workflow State Machine', () => {
    it('should start in draft status', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      assert.strictEqual(pm.status, 'draft');
    });

    it('should transition draft → review', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      const result = service.submitForReview(pm.id);
      assert.strictEqual(result!.status, 'review');
    });

    it('should transition review → pending_signoff', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      service.submitForReview(pm.id);
      const result = service.requestSignoff(pm.id);
      assert.strictEqual(result!.status, 'pending_signoff');
    });

    it('should transition pending_signoff → published', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev4',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      service.submitForReview(pm.id);
      service.requestSignoff(pm.id);
      service.addSignoff(pm.id, author, 'author');
      const result = service.publish(pm.id);
      assert.strictEqual(result!.status, 'published');
    });

    it('should transition published → archived', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev4',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      service.submitForReview(pm.id);
      service.requestSignoff(pm.id);
      service.addSignoff(pm.id, author, 'author');
      service.publish(pm.id);
      const result = service.archive(pm.id);
      assert.strictEqual(result!.status, 'archived');
    });

    it('should allow review rejection back to draft', () => {
      const pm = service.createPostmortem(
        incidentId,
        'gameday-1',
        'API Outage',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      service.submitForReview(pm.id);
      const result = service.rejectReview(pm.id, 'Needs more detail');
      assert.strictEqual(result!.status, 'draft');
    });
  });

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('Query Operations', () => {
    it('should get postmortems by game day', () => {
      service.createPostmortem(
        incidentId,
        'gameday-1',
        'Incident 1',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      service.createPostmortem(
        'sha256:incident_002' as IncidentId,
        'gameday-1',
        'Incident 2',
        'sev3',
        author,
        '2024-01-01T12:00:00Z',
        '2024-01-01T13:00:00Z'
      );
      service.createPostmortem(
        'sha256:incident_003' as IncidentId,
        'gameday-2',
        'Incident 3',
        'sev4',
        author,
        '2024-01-01T14:00:00Z',
        '2024-01-01T15:00:00Z'
      );

      assert.strictEqual(service.getPostmortemsByGameDay('gameday-1').length, 2);
      assert.strictEqual(service.getPostmortemsByGameDay('gameday-2').length, 1);
    });

    it('should get postmortems by status', () => {
      const pm1 = service.createPostmortem(
        incidentId,
        'gameday-1',
        'Incident 1',
        'sev2',
        author,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );
      service.createPostmortem(
        'sha256:incident_002' as IncidentId,
        'gameday-1',
        'Incident 2',
        'sev3',
        author,
        '2024-01-01T12:00:00Z',
        '2024-01-01T13:00:00Z'
      );
      service.submitForReview(pm1.id);

      assert.strictEqual(service.getPostmortemsByStatus('draft').length, 1);
      assert.strictEqual(service.getPostmortemsByStatus('review').length, 1);
    });
  });
});
