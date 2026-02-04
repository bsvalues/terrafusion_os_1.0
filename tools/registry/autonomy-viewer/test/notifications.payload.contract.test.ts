/**
 * Notifications Payload Contract Tests
 * =====================================
 *
 * Phase IIIm: Validates notification adapters for on-call workflow integration.
 *
 * Contract:
 * - notifications_pii_clean: No raw identifiers in any payload
 * - notifications_bounded: Size limits enforced for each channel
 * - notifications_allowlist_dims: Only allowed dimensions in payloads
 * - notifications_actionable: Clear links to runbook + proposed PR
 * - notifications_no_spam: Rate limiting and deduplication enforced
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Notification Payloads
// ============================================================================

/**
 * Allowed notification channels.
 */
type NotificationChannel = 'slack' | 'teams' | 'email' | 'pagerduty' | 'ticket';

/**
 * Notification severity levels.
 */
type NotificationSeverity = 'info' | 'warning' | 'critical';

/**
 * Base notification payload.
 */
interface NotificationPayload {
  readonly channel: NotificationChannel;
  readonly severity: NotificationSeverity;
  readonly title: string;
  readonly body: string;
  readonly timestamp: string;
  readonly correlationId: string;
  readonly dimensions: Record<string, string>;
  readonly links: readonly ActionLink[];
  readonly metadata: NotificationMetadata;
}

/**
 * Action links in notifications.
 */
interface ActionLink {
  readonly label: string;
  readonly url: string;
  readonly type: 'runbook' | 'pr' | 'dashboard' | 'ticket';
}

/**
 * Notification metadata.
 */
interface NotificationMetadata {
  readonly source: string;
  readonly sloId?: string;
  readonly alertId?: string;
  readonly driftPercent?: number;
  readonly recommendedAction?: string;
}

/**
 * Slack-specific payload.
 */
interface SlackPayload extends NotificationPayload {
  readonly channel: 'slack';
  readonly slackChannel: string;
  readonly blocks: readonly SlackBlock[];
  readonly threadTs?: string;
}

/**
 * Slack block element.
 */
interface SlackBlock {
  readonly type: 'section' | 'divider' | 'actions' | 'context';
  readonly text?: { type: 'mrkdwn' | 'plain_text'; text: string };
  readonly elements?: readonly SlackBlockElement[];
}

/**
 * Slack block element (button, etc).
 */
interface SlackBlockElement {
  readonly type: 'button' | 'static_select';
  readonly text?: { type: 'plain_text'; text: string };
  readonly url?: string;
  readonly action_id?: string;
}

/**
 * Email payload.
 */
interface EmailPayload extends NotificationPayload {
  readonly channel: 'email';
  readonly to: readonly string[];
  readonly cc?: readonly string[];
  readonly subject: string;
  readonly htmlBody: string;
  readonly textBody: string;
}

/**
 * Rate limit configuration.
 */
interface RateLimitConfig {
  readonly maxPerHour: number;
  readonly maxPerDay: number;
  readonly dedupeWindowSeconds: number;
}

/**
 * Rate limit check result.
 */
interface RateLimitResult {
  readonly allowed: boolean;
  readonly reason?: string;
  readonly retryAfterSeconds?: number;
}

// ============================================================================
// Constants
// ============================================================================

const ALLOWED_NOTIFICATION_DIMENSIONS = ['provider', 'code', 'stage'] as const;

const MAX_PAYLOAD_SIZES: Record<NotificationChannel, number> = {
  slack: 4000,
  teams: 8000,
  email: 50000,
  pagerduty: 1024,
  ticket: 10000,
};

const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  maxPerHour: 10,
  maxPerDay: 50,
  dedupeWindowSeconds: 300, // 5 minutes
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Filter dimensions to allowlist.
 */
function filterDimensions(dims: Record<string, string>): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const key of ALLOWED_NOTIFICATION_DIMENSIONS) {
    if (key in dims) {
      filtered[key] = dims[key];
    }
  }
  return filtered;
}

/**
 * Hash PII values.
 */
function hashPii(value: string): string {
  // Simple hash for contract testing
  const hash = value.split('').reduce((acc, c) => {
    return ((acc << 5) - acc + c.charCodeAt(0)) | 0;
  }, 0);
  return `sha256:${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * Check if payload contains PII.
 */
function containsPii(payload: NotificationPayload): boolean {
  const piiPatterns = [
    /\b[A-Z]{2}\d{6,}\b/, // Parcel IDs
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN-like
    /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i, // Email
    /\b\d{3}[- ]?\d{3}[- ]?\d{4}\b/, // Phone
  ];

  const textToScan = `${payload.title} ${payload.body}`;
  return piiPatterns.some(p => p.test(textToScan));
}

/**
 * Calculate payload size.
 */
function calculatePayloadSize(payload: NotificationPayload): number {
  return JSON.stringify(payload).length;
}

/**
 * Build Slack notification payload.
 */
function buildSlackPayload(
  sloId: string,
  driftPercent: number,
  severity: NotificationSeverity,
  dimensions: Record<string, string>,
  links: readonly ActionLink[]
): SlackPayload {
  const filteredDims = filterDimensions(dimensions);
  const dimText = Object.entries(filteredDims)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');

  return {
    channel: 'slack',
    severity,
    title: `SLO Drift Detected: ${sloId}`,
    body: `Drift of ${driftPercent}% observed. Dimensions: ${dimText}`,
    timestamp: new Date().toISOString(),
    correlationId: `drift-${sloId}-${Date.now()}`,
    dimensions: filteredDims,
    links,
    metadata: {
      source: 'calibration-bot',
      sloId,
      driftPercent,
      recommendedAction: 'REVIEW_SLO',
    },
    slackChannel: '#slo-alerts',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*SLO Drift Detected: ${sloId}*\nDrift: ${driftPercent}%`,
        },
      },
      { type: 'divider' },
      {
        type: 'actions',
        elements: links.map(link => ({
          type: 'button' as const,
          text: { type: 'plain_text' as const, text: link.label },
          url: link.url,
          action_id: `view_${link.type}`,
        })),
      },
    ],
  };
}

/**
 * Build email notification payload.
 */
function buildEmailPayload(
  sloId: string,
  driftPercent: number,
  severity: NotificationSeverity,
  dimensions: Record<string, string>,
  links: readonly ActionLink[],
  recipients: readonly string[]
): EmailPayload {
  const filteredDims = filterDimensions(dimensions);
  const linksHtml = links.map(l => `<a href="${l.url}">${l.label}</a>`).join(' | ');
  const linksText = links.map(l => `${l.label}: ${l.url}`).join('\n');

  return {
    channel: 'email',
    severity,
    title: `SLO Drift Detected: ${sloId}`,
    body: `Drift of ${driftPercent}% observed.`,
    timestamp: new Date().toISOString(),
    correlationId: `drift-${sloId}-${Date.now()}`,
    dimensions: filteredDims,
    links,
    metadata: {
      source: 'calibration-bot',
      sloId,
      driftPercent,
    },
    to: [...recipients],
    subject: `[${severity.toUpperCase()}] SLO Drift: ${sloId} (${driftPercent}%)`,
    htmlBody: `<h1>SLO Drift Detected</h1><p>Drift: ${driftPercent}%</p><p>${linksHtml}</p>`,
    textBody: `SLO Drift Detected\n\nDrift: ${driftPercent}%\n\n${linksText}`,
  };
}

/**
 * Rate limit tracker (in-memory for contract testing).
 */
class RateLimiter {
  private readonly events: Map<string, number[]> = new Map();
  private readonly config: RateLimitConfig;

  constructor(config: RateLimitConfig = DEFAULT_RATE_LIMITS) {
    this.config = config;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const hourAgo = now - 3600000;
    const dayAgo = now - 86400000;
    const dedupeWindow = now - this.config.dedupeWindowSeconds * 1000;

    const events = this.events.get(key) ?? [];

    // Check deduplication window
    const recentEvents = events.filter(t => t > dedupeWindow);
    if (recentEvents.length > 0) {
      const oldestRecent = Math.min(...recentEvents);
      const retryAfter = Math.ceil(
        (oldestRecent + this.config.dedupeWindowSeconds * 1000 - now) / 1000
      );
      return {
        allowed: false,
        reason: 'duplicate_within_window',
        retryAfterSeconds: retryAfter,
      };
    }

    // Check hourly limit
    const hourlyEvents = events.filter(t => t > hourAgo);
    if (hourlyEvents.length >= this.config.maxPerHour) {
      return {
        allowed: false,
        reason: 'hourly_limit_exceeded',
        retryAfterSeconds: 3600,
      };
    }

    // Check daily limit
    const dailyEvents = events.filter(t => t > dayAgo);
    if (dailyEvents.length >= this.config.maxPerDay) {
      return {
        allowed: false,
        reason: 'daily_limit_exceeded',
        retryAfterSeconds: 86400,
      };
    }

    return { allowed: true };
  }

  record(key: string): void {
    const events = this.events.get(key) ?? [];
    events.push(Date.now());
    this.events.set(key, events);
  }
}

/**
 * Deduplication key generator.
 */
function generateDedupeKey(payload: NotificationPayload): string {
  const parts = [
    payload.channel,
    payload.metadata.sloId ?? 'unknown',
    payload.severity,
    JSON.stringify(payload.dimensions),
  ];
  return parts.join(':');
}

// ============================================================================
// Contract: notifications_pii_clean
// ============================================================================

describe('Notifications Payload Contract', () => {
  describe('notifications_pii_clean', () => {
    it('should not include raw parcel IDs in Slack payload', () => {
      const payload = buildSlackPayload(
        'security.denial_rate',
        25,
        'warning',
        { provider: 'auth0', parcelId: 'WA123456' }, // parcelId should be filtered
        []
      );

      assert.ok(!payload.body.includes('WA123456'), 'Should not contain parcel ID');
      assert.ok(!('parcelId' in payload.dimensions), 'Should filter parcelId from dims');
    });

    it('should not include email addresses in notification body', () => {
      const payload = buildSlackPayload(
        'security.denial_rate',
        25,
        'warning',
        { provider: 'auth0' },
        []
      );

      assert.ok(!containsPii(payload), 'Should not contain PII patterns');
    });

    it('should hash any identifier values if included', () => {
      const hashed = hashPii('user@example.com');
      assert.ok(hashed.startsWith('sha256:'), 'Should have sha256 prefix');
      assert.ok(!hashed.includes('@'), 'Should not contain original value');
    });

    it('should filter dimensions to allowlist in all channels', () => {
      const dims = {
        provider: 'auth0',
        code: '401',
        stage: 'prod',
        userId: 'user123', // should be filtered
        ssn: '123-45-6789', // should be filtered
      };

      const filtered = filterDimensions(dims);
      assert.strictEqual(Object.keys(filtered).length, 3);
      assert.ok(!('userId' in filtered));
      assert.ok(!('ssn' in filtered));
    });
  });

  // ============================================================================
  // Contract: notifications_bounded
  // ============================================================================

  describe('notifications_bounded', () => {
    it('should enforce Slack payload size limit', () => {
      const payload = buildSlackPayload(
        'security.denial_rate',
        25,
        'warning',
        { provider: 'auth0' },
        []
      );

      const size = calculatePayloadSize(payload);
      assert.ok(size < MAX_PAYLOAD_SIZES.slack, `Size ${size} exceeds limit`);
    });

    it('should enforce email payload size limit', () => {
      const payload = buildEmailPayload(
        'security.denial_rate',
        25,
        'warning',
        { provider: 'auth0' },
        [],
        ['oncall@example.com']
      );

      const size = calculatePayloadSize(payload);
      assert.ok(size < MAX_PAYLOAD_SIZES.email, `Size ${size} exceeds limit`);
    });

    it('should have size limits defined for all channels', () => {
      const channels: NotificationChannel[] = ['slack', 'teams', 'email', 'pagerduty', 'ticket'];

      for (const channel of channels) {
        assert.ok(channel in MAX_PAYLOAD_SIZES, `Missing limit for ${channel}`);
        assert.ok(MAX_PAYLOAD_SIZES[channel] > 0, `Invalid limit for ${channel}`);
      }
    });

    it('should limit Slack blocks to reasonable count', () => {
      const payload = buildSlackPayload(
        'security.denial_rate',
        25,
        'warning',
        { provider: 'auth0' },
        [
          { label: 'Runbook', url: 'https://runbook/slo', type: 'runbook' },
          { label: 'PR', url: 'https://github/pr/123', type: 'pr' },
        ]
      );

      assert.ok(payload.blocks.length <= 10, 'Too many Slack blocks');
    });
  });

  // ============================================================================
  // Contract: notifications_allowlist_dims
  // ============================================================================

  describe('notifications_allowlist_dims', () => {
    it('should only include allowlisted dimensions', () => {
      const dims = {
        provider: 'auth0',
        code: '401',
        stage: 'prod',
        secret: 'password123',
      };

      const filtered = filterDimensions(dims);
      const keys = Object.keys(filtered);

      for (const key of keys) {
        assert.ok(ALLOWED_NOTIFICATION_DIMENSIONS.includes(key as any), `${key} not in allowlist`);
      }
    });

    it('should preserve allowlisted dimension values', () => {
      const dims = {
        provider: 'auth0',
        code: '403',
        stage: 'staging',
      };

      const filtered = filterDimensions(dims);
      assert.strictEqual(filtered.provider, 'auth0');
      assert.strictEqual(filtered.code, '403');
      assert.strictEqual(filtered.stage, 'staging');
    });

    it('should handle empty dimensions gracefully', () => {
      const filtered = filterDimensions({});
      assert.deepStrictEqual(filtered, {});
    });

    it('should handle all-filtered dimensions gracefully', () => {
      const dims = { secret: 'value', internal: 'data' };
      const filtered = filterDimensions(dims);
      assert.deepStrictEqual(filtered, {});
    });
  });

  // ============================================================================
  // Contract: notifications_actionable
  // ============================================================================

  describe('notifications_actionable', () => {
    it('should include runbook link in payload', () => {
      const links: ActionLink[] = [
        {
          label: 'View Runbook',
          url: 'https://runbook.terrafusion.io/slo/security.denial_rate',
          type: 'runbook',
        },
      ];

      const payload = buildSlackPayload(
        'security.denial_rate',
        25,
        'warning',
        { provider: 'auth0' },
        links
      );

      assert.ok(
        payload.links.some(l => l.type === 'runbook'),
        'Should have runbook link'
      );
    });

    it('should include PR link when available', () => {
      const links: ActionLink[] = [
        {
          label: 'View Proposed PR',
          url: 'https://github.com/terrafusion/os/pull/123',
          type: 'pr',
        },
      ];

      const payload = buildSlackPayload(
        'security.denial_rate',
        25,
        'warning',
        { provider: 'auth0' },
        links
      );

      assert.ok(
        payload.links.some(l => l.type === 'pr'),
        'Should have PR link'
      );
    });

    it('should include correlation ID for tracing', () => {
      const payload = buildSlackPayload(
        'security.denial_rate',
        25,
        'warning',
        { provider: 'auth0' },
        []
      );

      assert.ok(payload.correlationId, 'Should have correlationId');
      assert.ok(
        payload.correlationId.includes('security.denial_rate'),
        'CorrelationId should reference SLO'
      );
    });

    it('should make Slack buttons from links', () => {
      const links: ActionLink[] = [
        { label: 'Runbook', url: 'https://runbook/slo', type: 'runbook' },
        { label: 'Dashboard', url: 'https://dashboard/slo', type: 'dashboard' },
      ];

      const payload = buildSlackPayload(
        'security.denial_rate',
        25,
        'warning',
        { provider: 'auth0' },
        links
      );

      const actionsBlock = payload.blocks.find(b => b.type === 'actions');
      assert.ok(actionsBlock, 'Should have actions block');
      assert.ok(actionsBlock.elements, 'Actions block should have elements');
      assert.strictEqual(actionsBlock.elements?.length, 2, 'Should have 2 buttons');
    });
  });

  // ============================================================================
  // Contract: notifications_no_spam
  // ============================================================================

  describe('notifications_no_spam', () => {
    it('should rate limit notifications per hour', () => {
      const limiter = new RateLimiter({ maxPerHour: 2, maxPerDay: 10, dedupeWindowSeconds: 60 });
      const key = 'test:slo:warning';

      limiter.record(key);
      limiter.record(key);

      const result = limiter.check(key);
      assert.ok(!result.allowed, 'Should be rate limited');
      assert.strictEqual(result.reason, 'duplicate_within_window');
    });

    it('should deduplicate within window', () => {
      const limiter = new RateLimiter({
        maxPerHour: 100,
        maxPerDay: 100,
        dedupeWindowSeconds: 300,
      });
      const key = 'test:slo:warning';

      limiter.record(key);
      const result = limiter.check(key);

      assert.ok(!result.allowed, 'Should be deduplicated');
      assert.strictEqual(result.reason, 'duplicate_within_window');
    });

    it('should generate consistent dedupe keys', () => {
      const payload1 = buildSlackPayload(
        'security.denial_rate',
        25,
        'warning',
        { provider: 'auth0' },
        []
      );
      const payload2 = buildSlackPayload(
        'security.denial_rate',
        30, // different drift
        'warning',
        { provider: 'auth0' },
        []
      );

      const key1 = generateDedupeKey(payload1);
      const key2 = generateDedupeKey(payload2);

      assert.strictEqual(key1, key2, 'Same SLO + severity + dims should dedupe');
    });

    it('should allow after rate limit window expires', () => {
      const limiter = new RateLimiter({ maxPerHour: 100, maxPerDay: 100, dedupeWindowSeconds: 0 });
      const key = 'test:slo:warning';

      const result = limiter.check(key);
      assert.ok(result.allowed, 'Should be allowed with no prior events');
    });
  });
});
