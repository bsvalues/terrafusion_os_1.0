/**
 * Actions & Recommendations Contract Tests
 * ==========================================
 *
 * Phase IIIl: Validates recommendation engine and action payload generation.
 *
 * Contract:
 * - recommendations_are_suggestions: Actions are suggestions, not mutations
 * - output_is_pii_clean: No PII or forbidden dimensions in payloads
 * - output_is_bounded: Payloads are size-bounded for downstream consumption
 * - runbook_linkage_complete: All recommendations link to runbook sections
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ALLOWED_SLO_DIMENSIONS } from '../src/security/ops/slo/catalog.js';

// ============================================================================
// Types for Actions
// ============================================================================

/**
 * Drift result summary (from IIIk).
 */
interface DriftSummary {
  readonly sloId: string;
  readonly sloName: string;
  readonly observedValue: number;
  readonly targetValue: number;
  readonly driftPercent: number;
  readonly severity: 'ok' | 'warning' | 'critical';
  readonly direction: 'within' | 'above_target' | 'below_target';
  readonly dimensions: Record<string, string>;
}

/**
 * Runbook section reference.
 */
interface RunbookRef {
  readonly sectionId: string;
  readonly title: string;
  readonly url?: string;
}

/**
 * Action type.
 */
type ActionType = 'investigate' | 'tune_target' | 'review_clients' | 'check_upstream';

/**
 * Recommendation payload.
 */
interface Recommendation {
  readonly id: string;
  readonly actionType: ActionType;
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
  readonly title: string;
  readonly description: string;
  readonly sloId: string;
  readonly dimensions: Record<string, string>;
  readonly runbook: RunbookRef;
  readonly metadata: {
    readonly generatedAt: string;
    readonly driftPercent: number;
    readonly severity: string;
  };
}

/**
 * Ticket payload for downstream systems.
 */
interface TicketPayload {
  readonly type: 'ticket';
  readonly title: string;
  readonly body: string;
  readonly priority: string;
  readonly labels: readonly string[];
  readonly assignee?: string;
  readonly metadata: Record<string, string>;
}

/**
 * Slack message payload.
 */
interface SlackPayload {
  readonly type: 'slack';
  readonly channel: string;
  readonly text: string;
  readonly blocks?: readonly Record<string, unknown>[];
}

/**
 * Action output union.
 */
type ActionOutput = TicketPayload | SlackPayload;

/**
 * Action output options.
 */
interface ActionOptions {
  readonly maxBodyLength?: number;
  readonly includeMetadata?: boolean;
  readonly hashIdentifiers?: boolean;
}

const DEFAULT_MAX_BODY_LENGTH = 4000;

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Map severity to priority.
 */
function severityToPriority(severity: DriftSummary['severity']): Recommendation['priority'] {
  switch (severity) {
    case 'critical':
      return 'critical';
    case 'warning':
      return 'high';
    default:
      return 'medium';
  }
}

/**
 * Determine action type from drift context.
 */
function determineActionType(drift: DriftSummary): ActionType {
  if (drift.sloId.includes('jwks')) {
    return 'check_upstream';
  }
  if (drift.sloId.includes('token')) {
    return 'review_clients';
  }
  if (drift.severity === 'warning' && drift.direction !== 'within') {
    return 'tune_target';
  }
  return 'investigate';
}

/**
 * Get runbook reference for an SLO.
 */
function getRunbookRef(sloId: string): RunbookRef {
  const sections: Record<string, RunbookRef> = {
    'security.denial_rate': {
      sectionId: 'sec-denial-rate',
      title: 'Denial Rate Investigation',
      url: '/runbook/security#denial-rate',
    },
    'security.jwks_refresh_failure': {
      sectionId: 'sec-jwks-refresh',
      title: 'JWKS Refresh Troubleshooting',
      url: '/runbook/security#jwks',
    },
    'security.jwks_cache_hit': {
      sectionId: 'sec-jwks-cache',
      title: 'JWKS Cache Optimization',
      url: '/runbook/security#jwks-cache',
    },
    'security.provider_error_rate': {
      sectionId: 'sec-provider-errors',
      title: 'Provider Error Analysis',
      url: '/runbook/security#providers',
    },
    'security.token_error_rate': {
      sectionId: 'sec-token-errors',
      title: 'Token Validation Errors',
      url: '/runbook/security#tokens',
    },
  };

  return (
    sections[sloId] ?? {
      sectionId: 'sec-general',
      title: 'General Security Investigation',
      url: '/runbook/security',
    }
  );
}

/**
 * Filter dimensions to allowlist.
 */
function filterDimensions(dimensions: Record<string, string>): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(dimensions)) {
    if (ALLOWED_SLO_DIMENSIONS.includes(key as never)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

/**
 * Generate recommendation from drift.
 */
function generateRecommendation(drift: DriftSummary): Recommendation {
  const actionType = determineActionType(drift);
  const runbook = getRunbookRef(drift.sloId);
  const priority = severityToPriority(drift.severity);

  const descriptions: Record<ActionType, string> = {
    investigate: `Investigate ${drift.sloName} - currently ${Math.abs(drift.driftPercent).toFixed(1)}% ${drift.direction === 'above_target' ? 'above' : 'below'} target`,
    tune_target: `Consider adjusting ${drift.sloName} target if baseline has shifted`,
    review_clients: `Review client configurations for ${drift.sloName} issues`,
    check_upstream: `Check upstream service health for ${drift.sloName}`,
  };

  return {
    id: `rec-${drift.sloId}-${Date.now()}`,
    actionType,
    priority,
    title: `${drift.severity.toUpperCase()}: ${drift.sloName} drift detected`,
    description: descriptions[actionType],
    sloId: drift.sloId,
    dimensions: filterDimensions(drift.dimensions),
    runbook,
    metadata: {
      generatedAt: new Date().toISOString(),
      driftPercent: drift.driftPercent,
      severity: drift.severity,
    },
  };
}

/**
 * Generate ticket payload from recommendation.
 */
function generateTicketPayload(rec: Recommendation, options: ActionOptions = {}): TicketPayload {
  const { maxBodyLength = DEFAULT_MAX_BODY_LENGTH } = options;

  let body = `## ${rec.title}\n\n${rec.description}\n\n`;
  body += `**SLO:** ${rec.sloId}\n`;
  body += `**Priority:** ${rec.priority}\n`;
  body += `**Drift:** ${rec.metadata.driftPercent.toFixed(1)}%\n\n`;
  body += `### Runbook\n[${rec.runbook.title}](${rec.runbook.url})\n\n`;

  if (Object.keys(rec.dimensions).length > 0) {
    body += `### Dimensions\n`;
    for (const [k, v] of Object.entries(rec.dimensions)) {
      body += `- ${k}: ${v}\n`;
    }
  }

  // Bound body length
  if (body.length > maxBodyLength) {
    body = body.slice(0, maxBodyLength - 3) + '...';
  }

  const labels = ['security', 'slo-drift', rec.priority];
  if (rec.severity === 'critical') {
    labels.push('urgent');
  }

  return {
    type: 'ticket',
    title: rec.title,
    body,
    priority: rec.priority,
    labels,
    metadata: {
      sloId: rec.sloId,
      generatedAt: rec.metadata.generatedAt,
    },
  };
}

/**
 * Generate Slack payload from recommendation.
 */
function generateSlackPayload(rec: Recommendation, channel: string): SlackPayload {
  const emoji = rec.priority === 'critical' ? '🔴' : rec.priority === 'high' ? '🟠' : '🟡';

  return {
    type: 'slack',
    channel,
    text: `${emoji} *${rec.title}*\n${rec.description}\n<${rec.runbook.url}|${rec.runbook.title}>`,
  };
}

// ============================================================================
// Contract: recommendations_are_suggestions
// ============================================================================

describe('Actions & Recommendations Contract', () => {
  describe('recommendations_are_suggestions', () => {
    it('should generate recommendation from drift summary', () => {
      const drift: DriftSummary = {
        sloId: 'security.denial_rate',
        sloName: 'Auth Denial Rate',
        observedValue: 0.08,
        targetValue: 0.05,
        driftPercent: 60,
        severity: 'critical',
        direction: 'above_target',
        dimensions: { provider: 'entra' },
      };

      const rec = generateRecommendation(drift);
      assert.ok(rec.id, 'Should have ID');
      assert.ok(rec.title, 'Should have title');
      assert.ok(rec.description, 'Should have description');
      assert.ok(rec.runbook, 'Should have runbook reference');
    });

    it('should map severity to priority correctly', () => {
      assert.equal(severityToPriority('critical'), 'critical');
      assert.equal(severityToPriority('warning'), 'high');
      assert.equal(severityToPriority('ok'), 'medium');
    });

    it('should determine action type from context', () => {
      const jwksDrift: DriftSummary = {
        sloId: 'security.jwks_refresh_failure',
        sloName: 'JWKS Refresh',
        observedValue: 0.05,
        targetValue: 0.01,
        driftPercent: 400,
        severity: 'critical',
        direction: 'above_target',
        dimensions: {},
      };

      const actionType = determineActionType(jwksDrift);
      assert.equal(actionType, 'check_upstream', 'JWKS issues should check upstream');
    });

    it('should include metadata in recommendation', () => {
      const drift: DriftSummary = {
        sloId: 'security.denial_rate',
        sloName: 'Auth Denial Rate',
        observedValue: 0.08,
        targetValue: 0.05,
        driftPercent: 60,
        severity: 'critical',
        direction: 'above_target',
        dimensions: {},
      };

      const rec = generateRecommendation(drift);
      assert.ok(rec.metadata.generatedAt, 'Should have generated timestamp');
      assert.equal(rec.metadata.driftPercent, 60);
      assert.equal(rec.metadata.severity, 'critical');
    });
  });

  // ============================================================================
  // Contract: output_is_pii_clean
  // ============================================================================

  describe('output_is_pii_clean', () => {
    it('should filter dimensions to allowlist in recommendations', () => {
      const drift: DriftSummary = {
        sloId: 'security.denial_rate',
        sloName: 'Auth Denial Rate',
        observedValue: 0.08,
        targetValue: 0.05,
        driftPercent: 60,
        severity: 'critical',
        direction: 'above_target',
        dimensions: {
          provider: 'entra',
          userId: 'user@example.com', // PII
          email: 'test@test.com', // PII
        },
      };

      const rec = generateRecommendation(drift);
      assert.ok(rec.dimensions.provider, 'Should keep provider');
      assert.strictEqual(rec.dimensions.userId, undefined, 'Should filter userId');
      assert.strictEqual(rec.dimensions.email, undefined, 'Should filter email');
    });

    it('should not include raw identifiers in ticket body', () => {
      const drift: DriftSummary = {
        sloId: 'security.denial_rate',
        sloName: 'Auth Denial Rate',
        observedValue: 0.08,
        targetValue: 0.05,
        driftPercent: 60,
        severity: 'critical',
        direction: 'above_target',
        dimensions: {
          provider: 'entra',
          userId: 'user@example.com',
        },
      };

      const rec = generateRecommendation(drift);
      const ticket = generateTicketPayload(rec);

      assert.ok(!ticket.body.includes('user@example.com'), 'Should not include userId');
      assert.ok(!ticket.body.includes('userId'), 'Should not reference userId field');
    });

    it('should only include allowed labels in ticket', () => {
      const drift: DriftSummary = {
        sloId: 'security.denial_rate',
        sloName: 'Auth Denial Rate',
        observedValue: 0.08,
        targetValue: 0.05,
        driftPercent: 60,
        severity: 'critical',
        direction: 'above_target',
        dimensions: {},
      };

      const rec = generateRecommendation(drift);
      const ticket = generateTicketPayload(rec);

      const allowedLabels = [
        'security',
        'slo-drift',
        'critical',
        'high',
        'medium',
        'low',
        'urgent',
      ];
      for (const label of ticket.labels) {
        assert.ok(allowedLabels.includes(label), `Label ${label} should be in allowed set`);
      }
    });
  });

  // ============================================================================
  // Contract: output_is_bounded
  // ============================================================================

  describe('output_is_bounded', () => {
    it('should bound ticket body length', () => {
      const drift: DriftSummary = {
        sloId: 'security.denial_rate',
        sloName: 'Auth Denial Rate',
        observedValue: 0.08,
        targetValue: 0.05,
        driftPercent: 60,
        severity: 'critical',
        direction: 'above_target',
        dimensions: {},
      };

      const rec = generateRecommendation(drift);
      const ticket = generateTicketPayload(rec, { maxBodyLength: 100 });

      assert.ok(ticket.body.length <= 100, 'Body should be bounded');
      assert.ok(ticket.body.endsWith('...'), 'Should indicate truncation');
    });

    it('should have default body length limit', () => {
      assert.equal(DEFAULT_MAX_BODY_LENGTH, 4000, 'Default limit should be 4000');
    });

    it('should produce compact Slack payloads', () => {
      const drift: DriftSummary = {
        sloId: 'security.denial_rate',
        sloName: 'Auth Denial Rate',
        observedValue: 0.08,
        targetValue: 0.05,
        driftPercent: 60,
        severity: 'critical',
        direction: 'above_target',
        dimensions: {},
      };

      const rec = generateRecommendation(drift);
      const slack = generateSlackPayload(rec, '#security-alerts');

      assert.ok(slack.text.length < 500, 'Slack text should be compact');
      assert.equal(slack.channel, '#security-alerts');
    });

    it('should limit metadata fields in ticket', () => {
      const drift: DriftSummary = {
        sloId: 'security.denial_rate',
        sloName: 'Auth Denial Rate',
        observedValue: 0.08,
        targetValue: 0.05,
        driftPercent: 60,
        severity: 'critical',
        direction: 'above_target',
        dimensions: {},
      };

      const rec = generateRecommendation(drift);
      const ticket = generateTicketPayload(rec);

      const metadataKeys = Object.keys(ticket.metadata);
      assert.ok(metadataKeys.length <= 5, 'Metadata should be bounded');
    });
  });

  // ============================================================================
  // Contract: runbook_linkage_complete
  // ============================================================================

  describe('runbook_linkage_complete', () => {
    it('should provide runbook ref for known SLOs', () => {
      const knownSlos = [
        'security.denial_rate',
        'security.jwks_refresh_failure',
        'security.jwks_cache_hit',
        'security.provider_error_rate',
        'security.token_error_rate',
      ];

      for (const sloId of knownSlos) {
        const ref = getRunbookRef(sloId);
        assert.ok(ref.sectionId, `${sloId} should have sectionId`);
        assert.ok(ref.title, `${sloId} should have title`);
        assert.ok(ref.url, `${sloId} should have URL`);
      }
    });

    it('should provide fallback for unknown SLOs', () => {
      const ref = getRunbookRef('unknown.slo');
      assert.ok(ref.sectionId, 'Should have fallback sectionId');
      assert.ok(ref.title, 'Should have fallback title');
    });

    it('should include runbook in recommendation', () => {
      const drift: DriftSummary = {
        sloId: 'security.denial_rate',
        sloName: 'Auth Denial Rate',
        observedValue: 0.08,
        targetValue: 0.05,
        driftPercent: 60,
        severity: 'critical',
        direction: 'above_target',
        dimensions: {},
      };

      const rec = generateRecommendation(drift);
      assert.ok(rec.runbook.sectionId);
      assert.ok(rec.runbook.title);
      assert.ok(rec.runbook.url);
    });

    it('should include runbook link in ticket body', () => {
      const drift: DriftSummary = {
        sloId: 'security.denial_rate',
        sloName: 'Auth Denial Rate',
        observedValue: 0.08,
        targetValue: 0.05,
        driftPercent: 60,
        severity: 'critical',
        direction: 'above_target',
        dimensions: {},
      };

      const rec = generateRecommendation(drift);
      const ticket = generateTicketPayload(rec);

      assert.ok(ticket.body.includes('Runbook'), 'Should mention runbook');
      assert.ok(ticket.body.includes(rec.runbook.title), 'Should include runbook title');
    });
  });
});
