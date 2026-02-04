/**
 * Phase XX — Live Adoption Rollout
 * =================================
 * Contract: adoption.feedbackloop.contract.test.ts
 *
 * Tests feedback loop for adoption: issue intake, template/golden-path
 * updates, versioning, and audit trail.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Feedback is tracked and auditable
 * - Golden path updates are versioned
 * - Time-to-compliance improvements are measurable
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type IssueId = `sha256:${string}`;
type TemplateId = `sha256:${string}`;
type GoldenPathId = `sha256:${string}`;
type VersionId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;

type IssueCategory =
  | 'friction'
  | 'unclear_docs'
  | 'tooling_gap'
  | 'process_blocker'
  | 'training_gap';
type IssuePriority = 'critical' | 'high' | 'medium' | 'low';
type IssueStatus = 'open' | 'triaged' | 'in_progress' | 'resolved' | 'wont_fix';
type TemplateType =
  | 'runbook'
  | 'onboarding'
  | 'exception_request'
  | 'drill_report'
  | 'compliance_checklist';

interface FrictionIssue {
  readonly id: IssueId;
  readonly category: IssueCategory;
  readonly priority: IssuePriority;
  readonly status: IssueStatus;
  readonly title: string;
  readonly description: string;
  readonly reportedBy: `sha256:${string}`;
  readonly agencyId: AgencyId;
  readonly createdAt: string;
  readonly triageAt?: string;
  readonly resolvedAt?: string;
  readonly resolutionNotes?: string;
  readonly linkedTemplateIds: readonly TemplateId[];
  readonly linkedGoldenPathIds: readonly GoldenPathId[];
  readonly timeToResolve?: number; // minutes
}

interface Template {
  readonly id: TemplateId;
  readonly name: string;
  readonly type: TemplateType;
  readonly currentVersion: string;
  readonly createdAt: string;
  readonly lastUpdatedAt: string;
  readonly usageCount: number;
  readonly feedbackScore: number;
}

interface TemplateVersion {
  readonly id: VersionId;
  readonly templateId: TemplateId;
  readonly version: string;
  readonly changelog: string;
  readonly linkedIssueIds: readonly IssueId[];
  readonly publishedAt: string;
  readonly publishedBy: `sha256:${string}`;
}

interface GoldenPath {
  readonly id: GoldenPathId;
  readonly name: string;
  readonly description: string;
  readonly currentVersion: string;
  readonly steps: readonly GoldenPathStep[];
  readonly estimatedMinutes: number;
  readonly createdAt: string;
  readonly lastUpdatedAt: string;
  readonly successRate: number;
}

interface GoldenPathStep {
  readonly order: number;
  readonly title: string;
  readonly description: string;
  readonly templateId?: TemplateId;
  readonly automatable: boolean;
}

interface TimeToComplianceMetrics {
  readonly avgDays: number;
  readonly medianDays: number;
  readonly p90Days: number;
  readonly trend: 'improving' | 'stable' | 'degrading';
  readonly periodStart: string;
  readonly periodEnd: string;
}

interface FeedbackLoopSummary {
  readonly generatedAt: string;
  readonly totalIssues: number;
  readonly openIssues: number;
  readonly resolvedIssues: number;
  readonly avgTimeToResolve: number;
  readonly byCategory: Record<IssueCategory, number>;
  readonly byPriority: Record<IssuePriority, number>;
  readonly templateUpdates: number;
  readonly goldenPathUpdates: number;
  readonly timeToComplianceImprovement: number;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockFeedbackLoopService() {
  const issues = new Map<IssueId, FrictionIssue>();
  const templates = new Map<TemplateId, Template>();
  const templateVersions: TemplateVersion[] = [];
  const goldenPaths = new Map<GoldenPathId, GoldenPath>();
  const complianceTimings: Array<{ agencyId: AgencyId; days: number; recordedAt: string }> = [];

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  return {
    // Issue Management
    createIssue(
      category: IssueCategory,
      priority: IssuePriority,
      title: string,
      description: string,
      reportedBy: `sha256:${string}`,
      agencyId: AgencyId
    ): FrictionIssue {
      const id = generateId('issue') as IssueId;
      const issue: FrictionIssue = {
        id,
        category,
        priority,
        status: 'open',
        title,
        description,
        reportedBy,
        agencyId,
        createdAt: new Date().toISOString(),
        linkedTemplateIds: [],
        linkedGoldenPathIds: [],
      };
      issues.set(id, issue);
      return issue;
    },

    getIssue(id: IssueId): FrictionIssue | null {
      return issues.get(id) ?? null;
    },

    triageIssue(id: IssueId, newPriority?: IssuePriority): FrictionIssue | null {
      const issue = issues.get(id);
      if (!issue || issue.status !== 'open') return null;

      const updated: FrictionIssue = {
        ...issue,
        status: 'triaged',
        priority: newPriority ?? issue.priority,
        triageAt: new Date().toISOString(),
      };
      issues.set(id, updated);
      return updated;
    },

    startProgress(id: IssueId): FrictionIssue | null {
      const issue = issues.get(id);
      if (!issue || issue.status !== 'triaged') return null;

      const updated: FrictionIssue = {
        ...issue,
        status: 'in_progress',
      };
      issues.set(id, updated);
      return updated;
    },

    resolveIssue(
      id: IssueId,
      resolutionNotes: string,
      linkedTemplateIds: readonly TemplateId[],
      linkedGoldenPathIds: readonly GoldenPathId[]
    ): FrictionIssue | null {
      const issue = issues.get(id);
      if (!issue || issue.status === 'resolved' || issue.status === 'wont_fix') return null;

      const resolvedAt = new Date();
      const createdAt = new Date(issue.createdAt);
      const timeToResolve = Math.round((resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60));

      const updated: FrictionIssue = {
        ...issue,
        status: 'resolved',
        resolvedAt: resolvedAt.toISOString(),
        resolutionNotes,
        linkedTemplateIds,
        linkedGoldenPathIds,
        timeToResolve,
      };
      issues.set(id, updated);
      return updated;
    },

    closeAsWontFix(id: IssueId, reason: string): FrictionIssue | null {
      const issue = issues.get(id);
      if (!issue || issue.status === 'resolved' || issue.status === 'wont_fix') return null;

      const updated: FrictionIssue = {
        ...issue,
        status: 'wont_fix',
        resolvedAt: new Date().toISOString(),
        resolutionNotes: reason,
      };
      issues.set(id, updated);
      return updated;
    },

    getIssuesByCategory(category: IssueCategory): readonly FrictionIssue[] {
      return [...issues.values()].filter(i => i.category === category);
    },

    getIssuesByStatus(status: IssueStatus): readonly FrictionIssue[] {
      return [...issues.values()].filter(i => i.status === status);
    },

    getIssuesByAgency(agencyId: AgencyId): readonly FrictionIssue[] {
      return [...issues.values()].filter(i => i.agencyId === agencyId);
    },

    getOpenIssues(): readonly FrictionIssue[] {
      return [...issues.values()].filter(
        i => i.status === 'open' || i.status === 'triaged' || i.status === 'in_progress'
      );
    },

    // Template Management
    createTemplate(name: string, type: TemplateType): Template {
      const id = generateId('template') as TemplateId;
      const template: Template = {
        id,
        name,
        type,
        currentVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        usageCount: 0,
        feedbackScore: 0,
      };
      templates.set(id, template);
      return template;
    },

    getTemplate(id: TemplateId): Template | null {
      return templates.get(id) ?? null;
    },

    updateTemplate(
      id: TemplateId,
      changelog: string,
      linkedIssueIds: readonly IssueId[],
      publishedBy: `sha256:${string}`
    ): TemplateVersion | null {
      const template = templates.get(id);
      if (!template) return null;

      const [major, minor, patch] = template.currentVersion.split('.').map(Number);
      const newVersion = `${major}.${minor}.${patch + 1}`;

      const versionId = generateId('version') as VersionId;
      const version: TemplateVersion = {
        id: versionId,
        templateId: id,
        version: newVersion,
        changelog,
        linkedIssueIds,
        publishedAt: new Date().toISOString(),
        publishedBy,
      };
      templateVersions.push(version);

      const updated: Template = {
        ...template,
        currentVersion: newVersion,
        lastUpdatedAt: new Date().toISOString(),
      };
      templates.set(id, updated);

      return version;
    },

    recordTemplateUsage(id: TemplateId): Template | null {
      const template = templates.get(id);
      if (!template) return null;

      const updated: Template = {
        ...template,
        usageCount: template.usageCount + 1,
      };
      templates.set(id, updated);
      return updated;
    },

    recordTemplateFeedback(id: TemplateId, score: number): Template | null {
      const template = templates.get(id);
      if (!template) return null;

      // Running average
      const newScore =
        template.usageCount > 0
          ? (template.feedbackScore * template.usageCount + score) / (template.usageCount + 1)
          : score;

      const updated: Template = {
        ...template,
        feedbackScore: Math.round(newScore * 10) / 10,
      };
      templates.set(id, updated);
      return updated;
    },

    getTemplateVersions(templateId: TemplateId): readonly TemplateVersion[] {
      return templateVersions.filter(v => v.templateId === templateId);
    },

    getTemplatesByType(type: TemplateType): readonly Template[] {
      return [...templates.values()].filter(t => t.type === type);
    },

    // Golden Path Management
    createGoldenPath(
      name: string,
      description: string,
      steps: readonly GoldenPathStep[],
      estimatedMinutes: number
    ): GoldenPath {
      const id = generateId('goldenpath') as GoldenPathId;
      const goldenPath: GoldenPath = {
        id,
        name,
        description,
        currentVersion: '1.0.0',
        steps,
        estimatedMinutes,
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        successRate: 0,
      };
      goldenPaths.set(id, goldenPath);
      return goldenPath;
    },

    getGoldenPath(id: GoldenPathId): GoldenPath | null {
      return goldenPaths.get(id) ?? null;
    },

    updateGoldenPath(
      id: GoldenPathId,
      steps: readonly GoldenPathStep[],
      estimatedMinutes: number
    ): GoldenPath | null {
      const goldenPath = goldenPaths.get(id);
      if (!goldenPath) return null;

      const [major, minor, patch] = goldenPath.currentVersion.split('.').map(Number);
      const updated: GoldenPath = {
        ...goldenPath,
        steps,
        estimatedMinutes,
        currentVersion: `${major}.${minor}.${patch + 1}`,
        lastUpdatedAt: new Date().toISOString(),
      };
      goldenPaths.set(id, updated);
      return updated;
    },

    recordGoldenPathOutcome(id: GoldenPathId, success: boolean): GoldenPath | null {
      const goldenPath = goldenPaths.get(id);
      if (!goldenPath) return null;

      // Simple success rate tracking
      const newRate = success ? goldenPath.successRate + 1 : goldenPath.successRate;
      const updated: GoldenPath = {
        ...goldenPath,
        successRate: newRate,
      };
      goldenPaths.set(id, updated);
      return updated;
    },

    getAllGoldenPaths(): readonly GoldenPath[] {
      return [...goldenPaths.values()];
    },

    // Time to Compliance Tracking
    recordComplianceTiming(agencyId: AgencyId, days: number): void {
      complianceTimings.push({
        agencyId,
        days,
        recordedAt: new Date().toISOString(),
      });
    },

    calculateTimeToCompliance(periodStart: string, periodEnd: string): TimeToComplianceMetrics {
      const periodTimings = complianceTimings.filter(
        t => t.recordedAt >= periodStart && t.recordedAt <= periodEnd
      );

      if (periodTimings.length === 0) {
        return {
          avgDays: 0,
          medianDays: 0,
          p90Days: 0,
          trend: 'stable',
          periodStart,
          periodEnd,
        };
      }

      const days = periodTimings.map(t => t.days).sort((a, b) => a - b);
      const avg = Math.round(days.reduce((a, b) => a + b, 0) / days.length);
      const median = days[Math.floor(days.length / 2)];
      const p90Index = Math.floor(days.length * 0.9);
      const p90 = days[p90Index] ?? days[days.length - 1];

      return {
        avgDays: avg,
        medianDays: median,
        p90Days: p90,
        trend: 'stable', // Would compare to previous period
        periodStart,
        periodEnd,
      };
    },

    // Issue-Template Linkage Analysis
    getIssuesLinkedToTemplate(templateId: TemplateId): readonly FrictionIssue[] {
      return [...issues.values()].filter(i => i.linkedTemplateIds.includes(templateId));
    },

    getTemplatesUpdatedFromIssue(issueId: IssueId): readonly TemplateVersion[] {
      return templateVersions.filter(v => v.linkedIssueIds.includes(issueId));
    },

    // Summary Generation
    generateFeedbackLoopSummary(): FeedbackLoopSummary {
      const allIssues = [...issues.values()];
      const resolved = allIssues.filter(i => i.status === 'resolved');
      const open = allIssues.filter(i => ['open', 'triaged', 'in_progress'].includes(i.status));

      const avgTimeToResolve =
        resolved.length > 0
          ? Math.round(
              resolved.reduce((sum, i) => sum + (i.timeToResolve ?? 0), 0) / resolved.length
            )
          : 0;

      const byCategory: Record<IssueCategory, number> = {
        friction: 0,
        unclear_docs: 0,
        tooling_gap: 0,
        process_blocker: 0,
        training_gap: 0,
      };
      for (const issue of allIssues) {
        byCategory[issue.category]++;
      }

      const byPriority: Record<IssuePriority, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      };
      for (const issue of allIssues) {
        byPriority[issue.priority]++;
      }

      // Count unique template updates
      const uniqueTemplateUpdates = new Set(templateVersions.map(v => v.templateId)).size;

      // Count golden path updates (versions > 1.0.0)
      const goldenPathUpdates = [...goldenPaths.values()].filter(
        g => g.currentVersion !== '1.0.0'
      ).length;

      return {
        generatedAt: new Date().toISOString(),
        totalIssues: allIssues.length,
        openIssues: open.length,
        resolvedIssues: resolved.length,
        avgTimeToResolve,
        byCategory,
        byPriority,
        templateUpdates: uniqueTemplateUpdates,
        goldenPathUpdates,
        timeToComplianceImprovement: 0, // Would calculate from historical data
      };
    },

    // Trend Analysis
    calculateResolutionTrend(weeks: number): {
      trend: 'improving' | 'stable' | 'degrading';
      avgResolutionTime: number[];
    } {
      const now = new Date();
      const avgResolutionTime: number[] = [];

      for (let i = 0; i < weeks; i++) {
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

        const weekIssues = [...issues.values()].filter(issue => {
          if (!issue.resolvedAt) return false;
          const resolved = new Date(issue.resolvedAt);
          return resolved >= weekStart && resolved < weekEnd;
        });

        const avg =
          weekIssues.length > 0
            ? weekIssues.reduce((sum, i) => sum + (i.timeToResolve ?? 0), 0) / weekIssues.length
            : 0;
        avgResolutionTime.unshift(avg);
      }

      // Determine trend
      let trend: 'improving' | 'stable' | 'degrading' = 'stable';
      if (avgResolutionTime.length >= 2) {
        const recent = avgResolutionTime[avgResolutionTime.length - 1];
        const previous = avgResolutionTime[0];
        const change = previous !== 0 ? (recent - previous) / previous : 0;

        if (change < -0.1) trend = 'improving';
        else if (change > 0.1) trend = 'degrading';
      }

      return { trend, avgResolutionTime };
    },

    // Category Analysis
    getMostCommonFrictionPoints(): readonly { category: IssueCategory; count: number }[] {
      const counts: Record<IssueCategory, number> = {
        friction: 0,
        unclear_docs: 0,
        tooling_gap: 0,
        process_blocker: 0,
        training_gap: 0,
      };

      for (const issue of issues.values()) {
        counts[issue.category]++;
      }

      return Object.entries(counts)
        .map(([category, count]) => ({ category: category as IssueCategory, count }))
        .sort((a, b) => b.count - a.count);
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XX: Adoption Feedback Loop Contracts', () => {
  let feedback: ReturnType<typeof createMockFeedbackLoopService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const reporter = 'sha256:reporter_001' as `sha256:${string}`;
  const publisher = 'sha256:publisher_001' as `sha256:${string}`;

  beforeEach(() => {
    feedback = createMockFeedbackLoopService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate issue IDs with sha256: prefix', () => {
      const issue = feedback.createIssue(
        'friction',
        'medium',
        'Test Issue',
        'Description',
        reporter,
        agencyA
      );
      assert.ok(issue.id.startsWith('sha256:'));
    });

    it('should generate template IDs with sha256: prefix', () => {
      const template = feedback.createTemplate('Test Template', 'runbook');
      assert.ok(template.id.startsWith('sha256:'));
    });

    it('should generate golden path IDs with sha256: prefix', () => {
      const gp = feedback.createGoldenPath('Test Path', 'Description', [], 30);
      assert.ok(gp.id.startsWith('sha256:'));
    });

    it('should generate version IDs with sha256: prefix', () => {
      const template = feedback.createTemplate('Test', 'runbook');
      const version = feedback.updateTemplate(template.id, 'Change', [], publisher);
      assert.ok(version?.id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Issue Lifecycle Tests
  // ==========================================================================

  describe('Issue Lifecycle', () => {
    it('should create issue in open status', () => {
      const issue = feedback.createIssue(
        'friction',
        'medium',
        'Confusing onboarding step',
        'Step 3 is unclear',
        reporter,
        agencyA
      );
      assert.strictEqual(issue.status, 'open');
    });

    it('should triage issue', () => {
      const issue = feedback.createIssue('friction', 'medium', 'Test', 'Desc', reporter, agencyA);
      const triaged = feedback.triageIssue(issue.id, 'high');
      assert.strictEqual(triaged?.status, 'triaged');
      assert.strictEqual(triaged?.priority, 'high');
      assert.ok(triaged?.triageAt);
    });

    it('should start progress on triaged issue', () => {
      const issue = feedback.createIssue('friction', 'medium', 'Test', 'Desc', reporter, agencyA);
      feedback.triageIssue(issue.id);
      const inProgress = feedback.startProgress(issue.id);
      assert.strictEqual(inProgress?.status, 'in_progress');
    });

    it('should resolve issue with linked artifacts', () => {
      const issue = feedback.createIssue('friction', 'medium', 'Test', 'Desc', reporter, agencyA);
      const template = feedback.createTemplate('Fix Template', 'runbook');
      feedback.triageIssue(issue.id);

      const resolved = feedback.resolveIssue(
        issue.id,
        'Updated template to clarify steps',
        [template.id],
        []
      );
      assert.strictEqual(resolved?.status, 'resolved');
      assert.ok(resolved?.resolvedAt);
      assert.ok(resolved?.timeToResolve !== undefined);
    });

    it('should close as wont fix', () => {
      const issue = feedback.createIssue('friction', 'low', 'Test', 'Desc', reporter, agencyA);
      const closed = feedback.closeAsWontFix(issue.id, 'Not actionable');
      assert.strictEqual(closed?.status, 'wont_fix');
    });

    it('should not resolve already resolved issue', () => {
      const issue = feedback.createIssue('friction', 'medium', 'Test', 'Desc', reporter, agencyA);
      feedback.triageIssue(issue.id);
      feedback.resolveIssue(issue.id, 'Fixed', [], []);
      const result = feedback.resolveIssue(issue.id, 'Fixed again', [], []);
      assert.strictEqual(result, null);
    });
  });

  // ==========================================================================
  // Issue Query Tests
  // ==========================================================================

  describe('Issue Queries', () => {
    it('should get issues by category', () => {
      feedback.createIssue('friction', 'medium', 'Friction 1', 'Desc', reporter, agencyA);
      feedback.createIssue('friction', 'high', 'Friction 2', 'Desc', reporter, agencyA);
      feedback.createIssue('tooling_gap', 'medium', 'Tool Gap', 'Desc', reporter, agencyA);

      const frictionIssues = feedback.getIssuesByCategory('friction');
      assert.strictEqual(frictionIssues.length, 2);
    });

    it('should get issues by status', () => {
      const issue1 = feedback.createIssue(
        'friction',
        'medium',
        'Test 1',
        'Desc',
        reporter,
        agencyA
      );
      feedback.createIssue('friction', 'medium', 'Test 2', 'Desc', reporter, agencyA);
      feedback.triageIssue(issue1.id);

      const openIssues = feedback.getIssuesByStatus('open');
      assert.strictEqual(openIssues.length, 1);

      const triagedIssues = feedback.getIssuesByStatus('triaged');
      assert.strictEqual(triagedIssues.length, 1);
    });

    it('should get issues by agency', () => {
      feedback.createIssue('friction', 'medium', 'Test', 'Desc', reporter, agencyA);
      feedback.createIssue(
        'friction',
        'medium',
        'Test 2',
        'Desc',
        reporter,
        'sha256:agency_beta' as AgencyId
      );

      const agencyIssues = feedback.getIssuesByAgency(agencyA);
      assert.strictEqual(agencyIssues.length, 1);
    });

    it('should get open issues', () => {
      const issue1 = feedback.createIssue('friction', 'medium', 'Open', 'Desc', reporter, agencyA);
      const issue2 = feedback.createIssue(
        'friction',
        'medium',
        'To Resolve',
        'Desc',
        reporter,
        agencyA
      );
      feedback.triageIssue(issue2.id);
      feedback.resolveIssue(issue2.id, 'Done', [], []);

      const open = feedback.getOpenIssues();
      assert.strictEqual(open.length, 1);
      assert.strictEqual(open[0].id, issue1.id);
    });
  });

  // ==========================================================================
  // Template Management Tests
  // ==========================================================================

  describe('Template Management', () => {
    it('should create template', () => {
      const template = feedback.createTemplate('Onboarding Checklist', 'onboarding');
      assert.strictEqual(template.type, 'onboarding');
      assert.strictEqual(template.currentVersion, '1.0.0');
    });

    it('should update template and increment version', () => {
      const template = feedback.createTemplate('Test', 'runbook');
      const version = feedback.updateTemplate(
        template.id,
        'Added step 3 clarification',
        [],
        publisher
      );
      assert.strictEqual(version?.version, '1.0.1');

      const updated = feedback.getTemplate(template.id);
      assert.strictEqual(updated?.currentVersion, '1.0.1');
    });

    it('should link issues to template update', () => {
      const issue = feedback.createIssue(
        'unclear_docs',
        'medium',
        'Unclear',
        'Desc',
        reporter,
        agencyA
      );
      const template = feedback.createTemplate('Test', 'runbook');
      const version = feedback.updateTemplate(
        template.id,
        'Fixed based on feedback',
        [issue.id],
        publisher
      );
      assert.strictEqual(version?.linkedIssueIds.length, 1);
    });

    it('should track template usage', () => {
      const template = feedback.createTemplate('Test', 'runbook');
      feedback.recordTemplateUsage(template.id);
      feedback.recordTemplateUsage(template.id);

      const updated = feedback.getTemplate(template.id);
      assert.strictEqual(updated?.usageCount, 2);
    });

    it('should track template feedback', () => {
      const template = feedback.createTemplate('Test', 'runbook');
      feedback.recordTemplateFeedback(template.id, 4);
      feedback.recordTemplateFeedback(template.id, 5);

      const updated = feedback.getTemplate(template.id);
      assert.ok(updated!.feedbackScore > 0);
    });

    it('should get template versions', () => {
      const template = feedback.createTemplate('Test', 'runbook');
      feedback.updateTemplate(template.id, 'Change 1', [], publisher);
      feedback.updateTemplate(template.id, 'Change 2', [], publisher);

      const versions = feedback.getTemplateVersions(template.id);
      assert.strictEqual(versions.length, 2);
    });

    it('should get templates by type', () => {
      feedback.createTemplate('Runbook 1', 'runbook');
      feedback.createTemplate('Runbook 2', 'runbook');
      feedback.createTemplate('Onboarding', 'onboarding');

      const runbooks = feedback.getTemplatesByType('runbook');
      assert.strictEqual(runbooks.length, 2);
    });
  });

  // ==========================================================================
  // Golden Path Tests
  // ==========================================================================

  describe('Golden Path Management', () => {
    it('should create golden path', () => {
      const steps: GoldenPathStep[] = [
        { order: 1, title: 'Step 1', description: 'First step', automatable: false },
        { order: 2, title: 'Step 2', description: 'Second step', automatable: true },
      ];
      const gp = feedback.createGoldenPath('Onboarding Path', 'Standard onboarding', steps, 60);
      assert.strictEqual(gp.steps.length, 2);
      assert.strictEqual(gp.estimatedMinutes, 60);
    });

    it('should update golden path', () => {
      const gp = feedback.createGoldenPath('Test', 'Desc', [], 30);
      const newSteps: GoldenPathStep[] = [
        { order: 1, title: 'New Step', description: 'Added', automatable: true },
      ];
      const updated = feedback.updateGoldenPath(gp.id, newSteps, 20);
      assert.strictEqual(updated?.currentVersion, '1.0.1');
      assert.strictEqual(updated?.steps.length, 1);
    });

    it('should record golden path outcomes', () => {
      const gp = feedback.createGoldenPath('Test', 'Desc', [], 30);
      feedback.recordGoldenPathOutcome(gp.id, true);
      feedback.recordGoldenPathOutcome(gp.id, true);
      feedback.recordGoldenPathOutcome(gp.id, false);

      const updated = feedback.getGoldenPath(gp.id);
      assert.strictEqual(updated?.successRate, 2);
    });

    it('should get all golden paths', () => {
      feedback.createGoldenPath('Path 1', 'Desc', [], 30);
      feedback.createGoldenPath('Path 2', 'Desc', [], 45);

      const all = feedback.getAllGoldenPaths();
      assert.strictEqual(all.length, 2);
    });
  });

  // ==========================================================================
  // Time to Compliance Tests
  // ==========================================================================

  describe('Time to Compliance', () => {
    it('should record compliance timing', () => {
      feedback.recordComplianceTiming(agencyA, 30);
      feedback.recordComplianceTiming(agencyA, 25);
      // No assertion needed, just verify no error
    });

    it('should calculate time to compliance metrics', () => {
      const now = new Date();
      const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const periodEnd = now.toISOString();

      feedback.recordComplianceTiming(agencyA, 30);
      feedback.recordComplianceTiming(agencyA, 25);
      feedback.recordComplianceTiming(agencyA, 35);

      const metrics = feedback.calculateTimeToCompliance(periodStart, periodEnd);
      assert.strictEqual(metrics.avgDays, 30);
      assert.ok(metrics.medianDays > 0);
    });

    it('should handle empty compliance data', () => {
      const metrics = feedback.calculateTimeToCompliance('2026-01-01', '2026-01-31');
      assert.strictEqual(metrics.avgDays, 0);
      assert.strictEqual(metrics.trend, 'stable');
    });
  });

  // ==========================================================================
  // Linkage Analysis Tests
  // ==========================================================================

  describe('Linkage Analysis', () => {
    it('should get issues linked to template', () => {
      const template = feedback.createTemplate('Test', 'runbook');
      const issue = feedback.createIssue('friction', 'medium', 'Test', 'Desc', reporter, agencyA);
      feedback.triageIssue(issue.id);
      feedback.resolveIssue(issue.id, 'Fixed', [template.id], []);

      const linked = feedback.getIssuesLinkedToTemplate(template.id);
      assert.strictEqual(linked.length, 1);
    });

    it('should get templates updated from issue', () => {
      const issue = feedback.createIssue('friction', 'medium', 'Test', 'Desc', reporter, agencyA);
      const template = feedback.createTemplate('Test', 'runbook');
      feedback.updateTemplate(template.id, 'Fixed issue', [issue.id], publisher);

      const versions = feedback.getTemplatesUpdatedFromIssue(issue.id);
      assert.strictEqual(versions.length, 1);
    });
  });

  // ==========================================================================
  // Summary Generation Tests
  // ==========================================================================

  describe('Summary Generation', () => {
    it('should generate feedback loop summary', () => {
      const summary = feedback.generateFeedbackLoopSummary();
      assert.ok(summary.generatedAt);
    });

    it('should count issues by category', () => {
      feedback.createIssue('friction', 'medium', 'Test 1', 'Desc', reporter, agencyA);
      feedback.createIssue('friction', 'medium', 'Test 2', 'Desc', reporter, agencyA);
      feedback.createIssue('tooling_gap', 'high', 'Test 3', 'Desc', reporter, agencyA);

      const summary = feedback.generateFeedbackLoopSummary();
      assert.strictEqual(summary.byCategory.friction, 2);
      assert.strictEqual(summary.byCategory.tooling_gap, 1);
    });

    it('should count issues by priority', () => {
      feedback.createIssue('friction', 'high', 'High 1', 'Desc', reporter, agencyA);
      feedback.createIssue('friction', 'medium', 'Medium 1', 'Desc', reporter, agencyA);

      const summary = feedback.generateFeedbackLoopSummary();
      assert.strictEqual(summary.byPriority.high, 1);
      assert.strictEqual(summary.byPriority.medium, 1);
    });

    it('should calculate avg time to resolve', () => {
      const issue = feedback.createIssue('friction', 'medium', 'Test', 'Desc', reporter, agencyA);
      feedback.triageIssue(issue.id);
      feedback.resolveIssue(issue.id, 'Done', [], []);

      const summary = feedback.generateFeedbackLoopSummary();
      assert.ok(summary.avgTimeToResolve >= 0);
    });

    it('should count template updates', () => {
      const t1 = feedback.createTemplate('T1', 'runbook');
      const t2 = feedback.createTemplate('T2', 'runbook');
      feedback.updateTemplate(t1.id, 'Change', [], publisher);
      feedback.updateTemplate(t2.id, 'Change', [], publisher);

      const summary = feedback.generateFeedbackLoopSummary();
      assert.strictEqual(summary.templateUpdates, 2);
    });

    it('should count golden path updates', () => {
      const gp = feedback.createGoldenPath('GP', 'Desc', [], 30);
      feedback.updateGoldenPath(gp.id, [], 25);

      const summary = feedback.generateFeedbackLoopSummary();
      assert.strictEqual(summary.goldenPathUpdates, 1);
    });
  });

  // ==========================================================================
  // Trend Analysis Tests
  // ==========================================================================

  describe('Trend Analysis', () => {
    it('should calculate resolution trend', () => {
      const trend = feedback.calculateResolutionTrend(4);
      assert.ok(['improving', 'stable', 'degrading'].includes(trend.trend));
    });

    it('should identify most common friction points', () => {
      feedback.createIssue('friction', 'medium', 'F1', 'Desc', reporter, agencyA);
      feedback.createIssue('friction', 'medium', 'F2', 'Desc', reporter, agencyA);
      feedback.createIssue('tooling_gap', 'medium', 'T1', 'Desc', reporter, agencyA);

      const points = feedback.getMostCommonFrictionPoints();
      assert.strictEqual(points[0].category, 'friction');
      assert.strictEqual(points[0].count, 2);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of golden paths', () => {
      feedback.createGoldenPath('Test', 'Desc', [], 30);
      const gp1 = feedback.getAllGoldenPaths();
      const gp2 = feedback.getAllGoldenPaths();
      assert.ok(gp1 !== gp2);
    });

    it('should generate fresh summary each call', () => {
      const s1 = feedback.generateFeedbackLoopSummary();
      const s2 = feedback.generateFeedbackLoopSummary();
      assert.ok(s1 !== s2);
    });
  });
});
