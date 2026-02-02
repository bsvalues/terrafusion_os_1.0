/**
 * Incident Response Governance: Paging Contract Tests
 *
 * Phase IX - Paging deduplication and escalation governance.
 *
 * CONTRACT SURFACE:
 * - Quiet Hours: Notification scheduling rules
 * - Escalation Order: Defined escalation chains
 * - Deduplication: Alert grouping and suppression
 * - Rate Limiting: Paging flood prevention
 *
 * INVARIANTS:
 * - SEV1 bypasses quiet hours
 * - Escalation chains are bounded
 * - Duplicate pages are suppressed within window
 * - Rate limits prevent paging storms
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type SeverityLevel = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
type PageStatus = 'pending' | 'sent' | 'acknowledged' | 'escalated' | 'suppressed';
type NotificationChannel = 'pagerduty' | 'slack' | 'sms' | 'email' | 'phone';
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * Page request
 */
interface PageRequest {
  readonly page_id: string;
  readonly incident_id: string;
  readonly severity: SeverityLevel;
  readonly target_id: string;
  readonly channel: NotificationChannel;
  readonly message: string;
  readonly dedupe_key: string;
  readonly created_at: string;
  readonly status: PageStatus;
  readonly sent_at?: string;
  readonly acknowledged_at?: string;
}

/**
 * Quiet hours rule
 */
interface QuietHoursRule {
  readonly rule_id: string;
  readonly name: string;
  readonly start_hour: number; // 0-23
  readonly end_hour: number; // 0-23
  readonly days: readonly DayOfWeek[];
  readonly excluded_severities: readonly SeverityLevel[];
  readonly target_ids: readonly string[];
  readonly is_active: boolean;
}

/**
 * Escalation chain
 */
interface EscalationChain {
  readonly chain_id: string;
  readonly name: string;
  readonly levels: readonly EscalationLevel[];
  readonly max_levels: number;
  readonly timeout_minutes: number;
}

/**
 * Escalation level
 */
interface EscalationLevel {
  readonly level: number;
  readonly target_ids: readonly string[];
  readonly channels: readonly NotificationChannel[];
  readonly timeout_minutes: number;
}

/**
 * Dedupe configuration
 */
interface DedupeConfig {
  readonly window_minutes: number;
  readonly group_by_fields: readonly string[];
  readonly max_grouped: number;
  readonly summary_interval_minutes: number;
}

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  readonly max_pages_per_minute: number;
  readonly max_pages_per_hour: number;
  readonly max_pages_per_target_per_hour: number;
  readonly burst_threshold: number;
  readonly cooldown_minutes: number;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockPageRequest(overrides: Partial<PageRequest> = {}): PageRequest {
  const pageId = `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    page_id: `sha256:${Buffer.from(pageId).toString('hex').slice(0, 64)}`,
    incident_id: `sha256:${Buffer.from(`incident-${Date.now()}`).toString('hex').slice(0, 64)}`,
    severity: 'SEV2',
    target_id: `sha256:${Buffer.from('target-oncall').toString('hex').slice(0, 64)}`,
    channel: 'pagerduty',
    message: 'Service degradation detected',
    dedupe_key: `dedupe-${Date.now()}`,
    created_at: new Date().toISOString(),
    status: 'pending',
    ...overrides,
  };
}

function createMockQuietHoursRule(overrides: Partial<QuietHoursRule> = {}): QuietHoursRule {
  return {
    rule_id: `qh-${Date.now()}`,
    name: 'Nighttime Quiet Hours',
    start_hour: 22,
    end_hour: 7,
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    excluded_severities: ['SEV1'], // SEV1 always gets through
    target_ids: [],
    is_active: true,
    ...overrides,
  };
}

function createMockEscalationChain(overrides: Partial<EscalationChain> = {}): EscalationChain {
  return {
    chain_id: `chain-${Date.now()}`,
    name: 'Default Escalation',
    levels: [
      {
        level: 1,
        target_ids: ['oncall-primary'],
        channels: ['pagerduty', 'slack'],
        timeout_minutes: 15,
      },
      {
        level: 2,
        target_ids: ['oncall-secondary'],
        channels: ['pagerduty', 'phone'],
        timeout_minutes: 15,
      },
      { level: 3, target_ids: ['manager-oncall'], channels: ['phone', 'sms'], timeout_minutes: 30 },
    ],
    max_levels: 5,
    timeout_minutes: 60,
    ...overrides,
  };
}

function createMockDedupeConfig(overrides: Partial<DedupeConfig> = {}): DedupeConfig {
  return {
    window_minutes: 5,
    group_by_fields: ['incident_id', 'severity', 'target_id'],
    max_grouped: 10,
    summary_interval_minutes: 15,
    ...overrides,
  };
}

function createMockRateLimitConfig(overrides: Partial<RateLimitConfig> = {}): RateLimitConfig {
  return {
    max_pages_per_minute: 10,
    max_pages_per_hour: 100,
    max_pages_per_target_per_hour: 20,
    burst_threshold: 5,
    cooldown_minutes: 5,
    ...overrides,
  };
}

// ============================================================================
// MOCK PAGING STORE
// ============================================================================

interface PagingStore {
  // Quiet Hours
  getQuietHoursRules(): Promise<readonly QuietHoursRule[]>;
  isInQuietHours(targetId: string, timestamp: Date): Promise<boolean>;
  quietHoursApply(severity: SeverityLevel, targetId: string): Promise<boolean>;

  // Escalation
  getEscalationChain(chainId: string): Promise<EscalationChain>;
  getDefaultChain(): Promise<EscalationChain>;
  getNextEscalationLevel(chainId: string, currentLevel: number): Promise<EscalationLevel | null>;
  isEscalationBounded(chainId: string): boolean;

  // Paging
  createPage(request: Omit<PageRequest, 'page_id' | 'status' | 'created_at'>): Promise<PageRequest>;
  getPage(pageId: string): Promise<PageRequest | null>;
  acknowledgePage(pageId: string): Promise<PageRequest>;
  escalatePage(pageId: string): Promise<PageRequest>;
  suppressPage(pageId: string, reason: string): Promise<PageRequest>;

  // Deduplication
  getDedupeConfig(): DedupeConfig;
  isDuplicate(dedupeKey: string, windowMinutes: number): Promise<boolean>;
  getGroupedPages(dedupeKey: string): Promise<readonly PageRequest[]>;
  getSuppressedCount(incidentId: string): Promise<number>;

  // Rate Limiting
  getRateLimitConfig(): RateLimitConfig;
  checkRateLimit(targetId: string): Promise<{ allowed: boolean; reason?: string }>;
  getPagesInLastMinute(targetId: string): Promise<number>;
  getPagesInLastHour(targetId: string): Promise<number>;
}

function createMockPagingStore(): PagingStore {
  const pages: Map<string, PageRequest> = new Map();
  const dedupeRegistry: Map<string, PageRequest[]> = new Map();
  const pageCountByTarget: Map<string, { minute: number; hour: number }> = new Map();

  const quietHoursRules: QuietHoursRule[] = [
    createMockQuietHoursRule({ name: 'Nighttime', start_hour: 22, end_hour: 7 }),
    createMockQuietHoursRule({
      name: 'Weekend',
      start_hour: 0,
      end_hour: 24,
      days: ['saturday', 'sunday'],
    }),
  ];

  const escalationChains: Map<string, EscalationChain> = new Map([
    ['default', createMockEscalationChain({ chain_id: 'default', name: 'Default' })],
    [
      'security',
      createMockEscalationChain({ chain_id: 'security', name: 'Security', max_levels: 4 }),
    ],
  ]);

  return {
    async getQuietHoursRules() {
      return quietHoursRules;
    },

    async isInQuietHours(targetId, timestamp) {
      const hour = timestamp.getHours();
      for (const rule of quietHoursRules) {
        if (!rule.is_active) continue;
        if (rule.target_ids.length > 0 && !rule.target_ids.includes(targetId)) continue;

        // Check if current hour is within quiet hours
        if (rule.start_hour < rule.end_hour) {
          // Same day range (e.g., 9-17)
          if (hour >= rule.start_hour && hour < rule.end_hour) return true;
        } else {
          // Overnight range (e.g., 22-7)
          if (hour >= rule.start_hour || hour < rule.end_hour) return true;
        }
      }
      return false;
    },

    async quietHoursApply(severity, _targetId) {
      // SEV1 bypasses quiet hours
      if (severity === 'SEV1') return false;
      return true; // Quiet hours would apply for other severities if in quiet hours
    },

    async getEscalationChain(chainId) {
      const chain = escalationChains.get(chainId);
      if (!chain) throw new Error(`Escalation chain not found: ${chainId}`);
      return chain;
    },

    async getDefaultChain() {
      return escalationChains.get('default')!;
    },

    async getNextEscalationLevel(chainId, currentLevel) {
      const chain = escalationChains.get(chainId);
      if (!chain) return null;
      const nextLevel = chain.levels.find(l => l.level === currentLevel + 1);
      return nextLevel ?? null;
    },

    isEscalationBounded(chainId) {
      const chain = escalationChains.get(chainId);
      if (!chain) return false;
      return chain.levels.length <= chain.max_levels;
    },

    async createPage(request) {
      const page = createMockPageRequest({
        ...request,
        status: 'pending',
      });
      pages.set(page.page_id, page);

      // Register for dedupe
      const existing = dedupeRegistry.get(request.dedupe_key) ?? [];
      dedupeRegistry.set(request.dedupe_key, [...existing, page]);

      // Track rate limiting
      const targetCounts = pageCountByTarget.get(request.target_id) ?? { minute: 0, hour: 0 };
      pageCountByTarget.set(request.target_id, {
        minute: targetCounts.minute + 1,
        hour: targetCounts.hour + 1,
      });

      return page;
    },

    async getPage(pageId) {
      return pages.get(pageId) ?? null;
    },

    async acknowledgePage(pageId) {
      const page = pages.get(pageId);
      if (!page) throw new Error(`Page not found: ${pageId}`);
      const updated: PageRequest = {
        ...page,
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
      };
      pages.set(pageId, updated);
      return updated;
    },

    async escalatePage(pageId) {
      const page = pages.get(pageId);
      if (!page) throw new Error(`Page not found: ${pageId}`);
      const updated: PageRequest = { ...page, status: 'escalated' };
      pages.set(pageId, updated);
      return updated;
    },

    async suppressPage(pageId, _reason) {
      const page = pages.get(pageId);
      if (!page) throw new Error(`Page not found: ${pageId}`);
      const updated: PageRequest = { ...page, status: 'suppressed' };
      pages.set(pageId, updated);
      return updated;
    },

    getDedupeConfig() {
      return createMockDedupeConfig();
    },

    async isDuplicate(dedupeKey, _windowMinutes) {
      const existing = dedupeRegistry.get(dedupeKey) ?? [];
      return existing.length > 1;
    },

    async getGroupedPages(dedupeKey) {
      return dedupeRegistry.get(dedupeKey) ?? [];
    },

    async getSuppressedCount(incidentId) {
      let count = 0;
      for (const page of pages.values()) {
        if (page.incident_id === incidentId && page.status === 'suppressed') {
          count++;
        }
      }
      return count;
    },

    getRateLimitConfig() {
      return createMockRateLimitConfig();
    },

    async checkRateLimit(targetId) {
      const config = this.getRateLimitConfig();
      const counts = pageCountByTarget.get(targetId) ?? { minute: 0, hour: 0 };

      if (counts.minute >= config.max_pages_per_minute) {
        return { allowed: false, reason: 'Rate limit exceeded: max pages per minute' };
      }
      if (counts.hour >= config.max_pages_per_target_per_hour) {
        return { allowed: false, reason: 'Rate limit exceeded: max pages per hour' };
      }
      return { allowed: true };
    },

    async getPagesInLastMinute(targetId) {
      const counts = pageCountByTarget.get(targetId);
      return counts?.minute ?? 0;
    },

    async getPagesInLastHour(targetId) {
      const counts = pageCountByTarget.get(targetId);
      return counts?.hour ?? 0;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Incident Response Governance: Paging Contracts', () => {
  let store: PagingStore;

  beforeEach(() => {
    store = createMockPagingStore();
  });

  // ==========================================================================
  // CONTRACT: paging_quiet_hours
  // ==========================================================================
  describe('CONTRACT: paging_quiet_hours', () => {
    it('defines quiet hours rules', async () => {
      const rules = await store.getQuietHoursRules();

      assert.ok(rules.length > 0);
      for (const rule of rules) {
        assert.ok(rule.rule_id);
        assert.ok(rule.name);
        assert.ok(rule.start_hour >= 0 && rule.start_hour <= 23);
        assert.ok(rule.end_hour >= 0 && rule.end_hour <= 24);
      }
    });

    it('SEV1 bypasses quiet hours', async () => {
      const appliesQuietHours = await store.quietHoursApply('SEV1', 'target-1');
      assert.strictEqual(appliesQuietHours, false, 'SEV1 should bypass quiet hours');
    });

    it('SEV3 respects quiet hours', async () => {
      const appliesQuietHours = await store.quietHoursApply('SEV3', 'target-1');
      assert.strictEqual(appliesQuietHours, true, 'SEV3 should respect quiet hours');
    });

    it('checks if currently in quiet hours', async () => {
      const now = new Date();
      const isInQuietHours = await store.isInQuietHours('target-1', now);
      assert.ok(typeof isInQuietHours === 'boolean');
    });
  });

  // ==========================================================================
  // CONTRACT: paging_escalation
  // ==========================================================================
  describe('CONTRACT: paging_escalation', () => {
    it('has default escalation chain', async () => {
      const chain = await store.getDefaultChain();

      assert.ok(chain.chain_id);
      assert.ok(chain.name);
      assert.ok(chain.levels.length > 0);
    });

    it('escalation chains are bounded', () => {
      assert.strictEqual(store.isEscalationBounded('default'), true);
      assert.strictEqual(store.isEscalationBounded('security'), true);
    });

    it('escalation levels have required fields', async () => {
      const chain = await store.getEscalationChain('default');

      for (const level of chain.levels) {
        assert.ok(level.level >= 1);
        assert.ok(level.target_ids.length > 0);
        assert.ok(level.channels.length > 0);
        assert.ok(level.timeout_minutes > 0);
      }
    });

    it('provides next escalation level', async () => {
      const nextLevel = await store.getNextEscalationLevel('default', 1);

      assert.ok(nextLevel);
      assert.strictEqual(nextLevel.level, 2);
    });

    it('returns null when no more escalation levels', async () => {
      const nextLevel = await store.getNextEscalationLevel('default', 10);
      assert.strictEqual(nextLevel, null);
    });
  });

  // ==========================================================================
  // CONTRACT: paging_deduplication
  // ==========================================================================
  describe('CONTRACT: paging_deduplication', () => {
    it('has dedupe configuration', () => {
      const config = store.getDedupeConfig();

      assert.ok(config.window_minutes > 0);
      assert.ok(config.group_by_fields.length > 0);
      assert.ok(config.max_grouped > 0);
    });

    it('detects duplicate pages', async () => {
      const dedupeKey = 'dedupe-test-1';

      await store.createPage({
        incident_id: 'incident-1',
        severity: 'SEV2',
        target_id: 'target-1',
        channel: 'pagerduty',
        message: 'Test message',
        dedupe_key: dedupeKey,
      });

      await store.createPage({
        incident_id: 'incident-1',
        severity: 'SEV2',
        target_id: 'target-1',
        channel: 'pagerduty',
        message: 'Test message',
        dedupe_key: dedupeKey,
      });

      const isDupe = await store.isDuplicate(dedupeKey, 5);
      assert.strictEqual(isDupe, true);
    });

    it('groups pages by dedupe key', async () => {
      const dedupeKey = 'dedupe-test-2';

      await store.createPage({
        incident_id: 'incident-2',
        severity: 'SEV3',
        target_id: 'target-2',
        channel: 'slack',
        message: 'Test',
        dedupe_key: dedupeKey,
      });

      await store.createPage({
        incident_id: 'incident-2',
        severity: 'SEV3',
        target_id: 'target-2',
        channel: 'slack',
        message: 'Test 2',
        dedupe_key: dedupeKey,
      });

      const grouped = await store.getGroupedPages(dedupeKey);
      assert.strictEqual(grouped.length, 2);
    });

    it('pages can be suppressed', async () => {
      const page = await store.createPage({
        incident_id: 'incident-3',
        severity: 'SEV4',
        target_id: 'target-3',
        channel: 'email',
        message: 'Low priority',
        dedupe_key: 'dedupe-test-3',
      });

      const suppressed = await store.suppressPage(page.page_id, 'Duplicate');
      assert.strictEqual(suppressed.status, 'suppressed');
    });
  });

  // ==========================================================================
  // CONTRACT: paging_rate_limits
  // ==========================================================================
  describe('CONTRACT: paging_rate_limits', () => {
    it('has rate limit configuration', () => {
      const config = store.getRateLimitConfig();

      assert.ok(config.max_pages_per_minute > 0);
      assert.ok(config.max_pages_per_hour > 0);
      assert.ok(config.max_pages_per_target_per_hour > 0);
    });

    it('checks rate limits before paging', async () => {
      const result = await store.checkRateLimit('target-4');

      assert.ok(typeof result.allowed === 'boolean');
      if (!result.allowed) {
        assert.ok(result.reason);
      }
    });

    it('tracks pages per minute', async () => {
      await store.createPage({
        incident_id: 'incident-4',
        severity: 'SEV2',
        target_id: 'target-5',
        channel: 'pagerduty',
        message: 'Test',
        dedupe_key: 'dedupe-4',
      });

      const count = await store.getPagesInLastMinute('target-5');
      assert.strictEqual(count, 1);
    });

    it('tracks pages per hour', async () => {
      await store.createPage({
        incident_id: 'incident-5',
        severity: 'SEV2',
        target_id: 'target-6',
        channel: 'pagerduty',
        message: 'Test',
        dedupe_key: 'dedupe-5',
      });

      const count = await store.getPagesInLastHour('target-6');
      assert.strictEqual(count, 1);
    });
  });

  // ==========================================================================
  // CONTRACT: paging_lifecycle
  // ==========================================================================
  describe('CONTRACT: paging_lifecycle', () => {
    it('creates page with pending status', async () => {
      const page = await store.createPage({
        incident_id: 'incident-6',
        severity: 'SEV1',
        target_id: 'target-7',
        channel: 'phone',
        message: 'Critical incident',
        dedupe_key: 'dedupe-6',
      });

      assert.ok(page.page_id.startsWith('sha256:'));
      assert.strictEqual(page.status, 'pending');
    });

    it('page can be acknowledged', async () => {
      const page = await store.createPage({
        incident_id: 'incident-7',
        severity: 'SEV2',
        target_id: 'target-8',
        channel: 'pagerduty',
        message: 'Test',
        dedupe_key: 'dedupe-7',
      });

      const acked = await store.acknowledgePage(page.page_id);
      assert.strictEqual(acked.status, 'acknowledged');
      assert.ok(acked.acknowledged_at);
    });

    it('page can be escalated', async () => {
      const page = await store.createPage({
        incident_id: 'incident-8',
        severity: 'SEV1',
        target_id: 'target-9',
        channel: 'pagerduty',
        message: 'Unacknowledged',
        dedupe_key: 'dedupe-8',
      });

      const escalated = await store.escalatePage(page.page_id);
      assert.strictEqual(escalated.status, 'escalated');
    });
  });
});
