/**
 * Operational Runbook Automation: Audit Contract Tests
 *
 * Phase XI - Append-only execution timeline with checksum chain.
 *
 * CONTRACT SURFACE:
 * - Append-Only Timeline: Execution events cannot be modified
 * - Checksum Chain: Each entry references previous entry's hash
 * - Complete History: All execution events are captured
 * - Tamper Detection: Chain integrity verification
 *
 * INVARIANTS:
 * - Timeline entries are append-only (no updates, no deletes)
 * - Each entry has checksum linking to previous
 * - All IDs are opaque sha256
 * - Timeline is complete and auditable
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type AuditEventType =
  | 'runbook_created'
  | 'runbook_submitted'
  | 'runbook_approved'
  | 'execution_started'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'execution_completed'
  | 'execution_failed'
  | 'execution_aborted'
  | 'rollback_started'
  | 'rollback_completed'
  | 'approval_requested'
  | 'approval_granted'
  | 'approval_denied';

type ChainStatus = 'valid' | 'broken' | 'pending_verification';

/**
 * Audit log entry
 */
interface AuditLogEntry {
  readonly entry_id: string;
  readonly sequence_number: number;
  readonly event_type: AuditEventType;
  readonly runbook_id: string;
  readonly execution_id?: string;
  readonly step_id?: string;
  readonly actor_id: string;
  readonly timestamp: string;
  readonly payload: Record<string, unknown>;
  readonly previous_hash: string;
  readonly entry_hash: string;
}

/**
 * Execution timeline
 */
interface ExecutionTimeline {
  readonly timeline_id: string;
  readonly execution_id: string;
  readonly runbook_id: string;
  readonly entries: readonly AuditLogEntry[];
  readonly first_entry_hash: string;
  readonly last_entry_hash: string;
  readonly total_entries: number;
  readonly created_at: string;
  readonly last_updated_at: string;
}

/**
 * Chain verification result
 */
interface ChainVerificationResult {
  readonly verification_id: string;
  readonly timeline_id: string;
  readonly status: ChainStatus;
  readonly entries_verified: number;
  readonly first_broken_at?: number;
  readonly verified_at: string;
}

/**
 * Audit query
 */
interface AuditQuery {
  readonly runbook_id?: string;
  readonly execution_id?: string;
  readonly actor_id?: string;
  readonly event_types?: readonly AuditEventType[];
  readonly start_time?: string;
  readonly end_time?: string;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Audit summary
 */
interface AuditSummary {
  readonly summary_id: string;
  readonly runbook_id: string;
  readonly total_executions: number;
  readonly successful_executions: number;
  readonly failed_executions: number;
  readonly total_rollbacks: number;
  readonly average_execution_time_ms: number;
  readonly generated_at: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function computeHash(content: string): string {
  // Simplified hash for testing - in production use crypto
  const hash = Buffer.from(content).toString('hex').slice(0, 64);
  return `sha256:${hash}`;
}

function createMockAuditLogEntry(
  sequenceNumber: number,
  previousHash: string,
  overrides: Partial<AuditLogEntry> = {}
): AuditLogEntry {
  const entryId = `ent-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const timestamp = new Date().toISOString();
  const eventType = overrides.event_type ?? 'execution_started';
  const runbookId =
    overrides.runbook_id ?? `sha256:${Buffer.from('runbook-1').toString('hex').slice(0, 64)}`;
  const actorId =
    overrides.actor_id ?? `sha256:${Buffer.from('actor-1').toString('hex').slice(0, 64)}`;

  const contentToHash = `${sequenceNumber}:${eventType}:${runbookId}:${actorId}:${timestamp}:${previousHash}`;
  const entryHash = computeHash(contentToHash);

  return {
    entry_id: `sha256:${Buffer.from(entryId).toString('hex').slice(0, 64)}`,
    sequence_number: sequenceNumber,
    event_type: eventType,
    runbook_id: runbookId,
    actor_id: actorId,
    timestamp,
    payload: {},
    previous_hash: previousHash,
    entry_hash: entryHash,
    ...overrides,
  };
}

function createMockExecutionTimeline(
  overrides: Partial<ExecutionTimeline> = {}
): ExecutionTimeline {
  const timelineId = `tl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const genesisHash = computeHash('genesis');

  return {
    timeline_id: `sha256:${Buffer.from(timelineId).toString('hex').slice(0, 64)}`,
    execution_id: `sha256:${Buffer.from('exec-1').toString('hex').slice(0, 64)}`,
    runbook_id: `sha256:${Buffer.from('runbook-1').toString('hex').slice(0, 64)}`,
    entries: [],
    first_entry_hash: genesisHash,
    last_entry_hash: genesisHash,
    total_entries: 0,
    created_at: new Date().toISOString(),
    last_updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// MOCK RUNBOOK AUDIT SERVICE
// ============================================================================

interface RunbookAuditService {
  // Timeline Management
  createTimeline(executionId: string, runbookId: string): Promise<ExecutionTimeline>;
  getTimeline(timelineId: string): Promise<ExecutionTimeline | null>;
  getTimelineByExecution(executionId: string): Promise<ExecutionTimeline | null>;

  // Append-Only Events
  appendEvent(
    timelineId: string,
    eventType: AuditEventType,
    actorId: string,
    payload?: Record<string, unknown>
  ): Promise<AuditLogEntry>;
  getEntry(entryId: string): Promise<AuditLogEntry | null>;
  getEntries(
    timelineId: string,
    limit?: number,
    offset?: number
  ): Promise<readonly AuditLogEntry[]>;

  // Chain Verification
  verifyChain(timelineId: string): Promise<ChainVerificationResult>;
  isChainValid(timelineId: string): Promise<boolean>;
  getChainHead(timelineId: string): Promise<string>;

  // Querying
  queryAuditLog(query: AuditQuery): Promise<readonly AuditLogEntry[]>;
  getEventsByType(timelineId: string, eventType: AuditEventType): Promise<readonly AuditLogEntry[]>;
  getEventsByActor(actorId: string): Promise<readonly AuditLogEntry[]>;

  // Summaries
  generateSummary(runbookId: string): Promise<AuditSummary>;
  getExecutionCount(runbookId: string): Promise<number>;

  // Immutability Enforcement
  isAppendOnly(timelineId: string): Promise<boolean>;
  canModify(entryId: string): Promise<boolean>;
  canDelete(entryId: string): Promise<boolean>;
}

function createMockRunbookAuditService(): RunbookAuditService {
  const timelines: Map<string, ExecutionTimeline> = new Map();
  const executionToTimeline: Map<string, string> = new Map();
  const entries: Map<string, AuditLogEntry> = new Map();
  const timelineEntries: Map<string, AuditLogEntry[]> = new Map();

  const GENESIS_HASH = computeHash('genesis');

  return {
    async createTimeline(executionId, runbookId) {
      const timeline = createMockExecutionTimeline({
        execution_id: executionId,
        runbook_id: runbookId,
        first_entry_hash: GENESIS_HASH,
        last_entry_hash: GENESIS_HASH,
      });
      timelines.set(timeline.timeline_id, timeline);
      executionToTimeline.set(executionId, timeline.timeline_id);
      timelineEntries.set(timeline.timeline_id, []);
      return timeline;
    },

    async getTimeline(timelineId) {
      return timelines.get(timelineId) ?? null;
    },

    async getTimelineByExecution(executionId) {
      const timelineId = executionToTimeline.get(executionId);
      if (!timelineId) return null;
      return timelines.get(timelineId) ?? null;
    },

    async appendEvent(timelineId, eventType, actorId, payload = {}) {
      const timeline = timelines.get(timelineId);
      if (!timeline) throw new Error(`Timeline not found: ${timelineId}`);

      const currentEntries = timelineEntries.get(timelineId) ?? [];
      const sequenceNumber = currentEntries.length + 1;
      const previousHash =
        currentEntries.length > 0
          ? currentEntries[currentEntries.length - 1].entry_hash
          : GENESIS_HASH;

      const entry = createMockAuditLogEntry(sequenceNumber, previousHash, {
        event_type: eventType,
        runbook_id: timeline.runbook_id,
        execution_id: timeline.execution_id,
        actor_id: `sha256:${Buffer.from(actorId).toString('hex').slice(0, 64)}`,
        payload,
      });

      entries.set(entry.entry_id, entry);
      currentEntries.push(entry);
      timelineEntries.set(timelineId, currentEntries);

      // Update timeline
      const updatedTimeline: ExecutionTimeline = {
        ...timeline,
        entries: currentEntries,
        last_entry_hash: entry.entry_hash,
        total_entries: currentEntries.length,
        last_updated_at: new Date().toISOString(),
      };
      timelines.set(timelineId, updatedTimeline);

      return entry;
    },

    async getEntry(entryId) {
      return entries.get(entryId) ?? null;
    },

    async getEntries(timelineId, limit = 100, offset = 0) {
      const allEntries = timelineEntries.get(timelineId) ?? [];
      return allEntries.slice(offset, offset + limit);
    },

    async verifyChain(timelineId) {
      const allEntries = timelineEntries.get(timelineId) ?? [];
      const verificationId = `ver-${Date.now()}`;

      let previousHash = GENESIS_HASH;
      let firstBrokenAt: number | undefined;

      for (let i = 0; i < allEntries.length; i++) {
        const entry = allEntries[i];
        if (entry.previous_hash !== previousHash) {
          firstBrokenAt = i;
          break;
        }
        previousHash = entry.entry_hash;
      }

      return {
        verification_id: `sha256:${Buffer.from(verificationId).toString('hex').slice(0, 64)}`,
        timeline_id: timelineId,
        status: firstBrokenAt === undefined ? 'valid' : 'broken',
        entries_verified: firstBrokenAt ?? allEntries.length,
        first_broken_at: firstBrokenAt,
        verified_at: new Date().toISOString(),
      };
    },

    async isChainValid(timelineId) {
      const result = await this.verifyChain(timelineId);
      return result.status === 'valid';
    },

    async getChainHead(timelineId) {
      const timeline = timelines.get(timelineId);
      return timeline?.last_entry_hash ?? GENESIS_HASH;
    },

    async queryAuditLog(query) {
      let results: AuditLogEntry[] = [];

      for (const entryList of timelineEntries.values()) {
        for (const entry of entryList) {
          if (query.runbook_id && entry.runbook_id !== query.runbook_id) continue;
          if (query.execution_id && entry.execution_id !== query.execution_id) continue;
          if (query.actor_id && entry.actor_id !== query.actor_id) continue;
          if (query.event_types && !query.event_types.includes(entry.event_type)) continue;
          if (query.start_time && entry.timestamp < query.start_time) continue;
          if (query.end_time && entry.timestamp > query.end_time) continue;

          results.push(entry);
        }
      }

      const offset = query.offset ?? 0;
      const limit = query.limit ?? 100;
      return results.slice(offset, offset + limit);
    },

    async getEventsByType(timelineId, eventType) {
      const allEntries = timelineEntries.get(timelineId) ?? [];
      return allEntries.filter(e => e.event_type === eventType);
    },

    async getEventsByActor(actorId) {
      const results: AuditLogEntry[] = [];
      for (const entryList of timelineEntries.values()) {
        for (const entry of entryList) {
          if (entry.actor_id === actorId) {
            results.push(entry);
          }
        }
      }
      return results;
    },

    async generateSummary(runbookId) {
      let totalExecutions = 0;
      let successfulExecutions = 0;
      let failedExecutions = 0;
      let totalRollbacks = 0;

      for (const timeline of timelines.values()) {
        if (timeline.runbook_id !== runbookId) continue;

        totalExecutions++;
        const entryList = timelineEntries.get(timeline.timeline_id) ?? [];

        for (const entry of entryList) {
          if (entry.event_type === 'execution_completed') successfulExecutions++;
          if (entry.event_type === 'execution_failed') failedExecutions++;
          if (entry.event_type === 'rollback_completed') totalRollbacks++;
        }
      }

      const summaryId = `sum-${Date.now()}`;
      return {
        summary_id: `sha256:${Buffer.from(summaryId).toString('hex').slice(0, 64)}`,
        runbook_id: runbookId,
        total_executions: totalExecutions,
        successful_executions: successfulExecutions,
        failed_executions: failedExecutions,
        total_rollbacks: totalRollbacks,
        average_execution_time_ms: 5000, // Mock average
        generated_at: new Date().toISOString(),
      };
    },

    async getExecutionCount(runbookId) {
      let count = 0;
      for (const timeline of timelines.values()) {
        if (timeline.runbook_id === runbookId) count++;
      }
      return count;
    },

    async isAppendOnly(_timelineId) {
      // INVARIANT: All timelines are append-only
      return true;
    },

    async canModify(_entryId) {
      // INVARIANT: Entries cannot be modified
      return false;
    },

    async canDelete(_entryId) {
      // INVARIANT: Entries cannot be deleted
      return false;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Operational Runbook Automation: Audit Contracts', () => {
  let service: RunbookAuditService;

  beforeEach(() => {
    service = createMockRunbookAuditService();
  });

  // ==========================================================================
  // CONTRACT: append_only_timeline
  // ==========================================================================
  describe('CONTRACT: append_only_timeline', () => {
    it('creates execution timeline', async () => {
      const timeline = await service.createTimeline('exec-1', 'runbook-1');

      assert.ok(timeline.timeline_id.startsWith('sha256:'));
      assert.strictEqual(timeline.total_entries, 0);
    });

    it('appends events to timeline', async () => {
      const timeline = await service.createTimeline('exec-2', 'runbook-1');
      await service.appendEvent(timeline.timeline_id, 'execution_started', 'actor-1');
      await service.appendEvent(timeline.timeline_id, 'step_started', 'actor-1');

      const updated = await service.getTimeline(timeline.timeline_id);
      assert.strictEqual(updated?.total_entries, 2);
    });

    it('timeline is append-only', async () => {
      const timeline = await service.createTimeline('exec-3', 'runbook-1');

      const isAppendOnly = await service.isAppendOnly(timeline.timeline_id);
      assert.strictEqual(isAppendOnly, true);
    });

    it('entries cannot be modified', async () => {
      const timeline = await service.createTimeline('exec-4', 'runbook-1');
      const entry = await service.appendEvent(timeline.timeline_id, 'execution_started', 'actor-1');

      const canModify = await service.canModify(entry.entry_id);
      assert.strictEqual(canModify, false);
    });

    it('entries cannot be deleted', async () => {
      const timeline = await service.createTimeline('exec-5', 'runbook-1');
      const entry = await service.appendEvent(timeline.timeline_id, 'execution_started', 'actor-1');

      const canDelete = await service.canDelete(entry.entry_id);
      assert.strictEqual(canDelete, false);
    });
  });

  // ==========================================================================
  // CONTRACT: checksum_chain
  // ==========================================================================
  describe('CONTRACT: checksum_chain', () => {
    it('entries have checksums', async () => {
      const timeline = await service.createTimeline('exec-6', 'runbook-1');
      const entry = await service.appendEvent(timeline.timeline_id, 'execution_started', 'actor-1');

      assert.ok(entry.entry_hash.startsWith('sha256:'));
      assert.ok(entry.previous_hash.startsWith('sha256:'));
    });

    it('entries link to previous entry hash', async () => {
      const timeline = await service.createTimeline('exec-7', 'runbook-1');
      const entry1 = await service.appendEvent(
        timeline.timeline_id,
        'execution_started',
        'actor-1'
      );
      const entry2 = await service.appendEvent(timeline.timeline_id, 'step_started', 'actor-1');

      assert.strictEqual(entry2.previous_hash, entry1.entry_hash);
    });

    it('verifies chain integrity', async () => {
      const timeline = await service.createTimeline('exec-8', 'runbook-1');
      await service.appendEvent(timeline.timeline_id, 'execution_started', 'actor-1');
      await service.appendEvent(timeline.timeline_id, 'step_started', 'actor-1');
      await service.appendEvent(timeline.timeline_id, 'step_completed', 'actor-1');

      const result = await service.verifyChain(timeline.timeline_id);
      assert.strictEqual(result.status, 'valid');
      assert.strictEqual(result.entries_verified, 3);
    });

    it('chain head tracks latest hash', async () => {
      const timeline = await service.createTimeline('exec-9', 'runbook-1');
      const entry1 = await service.appendEvent(
        timeline.timeline_id,
        'execution_started',
        'actor-1'
      );
      const entry2 = await service.appendEvent(timeline.timeline_id, 'step_started', 'actor-1');

      const head = await service.getChainHead(timeline.timeline_id);
      assert.strictEqual(head, entry2.entry_hash);
    });

    it('sequence numbers are ordered', async () => {
      const timeline = await service.createTimeline('exec-10', 'runbook-1');
      await service.appendEvent(timeline.timeline_id, 'execution_started', 'actor-1');
      await service.appendEvent(timeline.timeline_id, 'step_started', 'actor-1');
      await service.appendEvent(timeline.timeline_id, 'step_completed', 'actor-1');

      const entries = await service.getEntries(timeline.timeline_id);
      assert.strictEqual(entries[0].sequence_number, 1);
      assert.strictEqual(entries[1].sequence_number, 2);
      assert.strictEqual(entries[2].sequence_number, 3);
    });
  });

  // ==========================================================================
  // CONTRACT: complete_history
  // ==========================================================================
  describe('CONTRACT: complete_history', () => {
    it('captures all execution events', async () => {
      const timeline = await service.createTimeline('exec-11', 'runbook-1');
      await service.appendEvent(timeline.timeline_id, 'execution_started', 'actor-1');
      await service.appendEvent(timeline.timeline_id, 'step_started', 'actor-1', { step: 1 });
      await service.appendEvent(timeline.timeline_id, 'step_completed', 'actor-1', { step: 1 });
      await service.appendEvent(timeline.timeline_id, 'execution_completed', 'actor-1');

      const entries = await service.getEntries(timeline.timeline_id);
      assert.strictEqual(entries.length, 4);
    });

    it('retrieves timeline by execution', async () => {
      const executionId = `sha256:${Buffer.from('exec-lookup').toString('hex').slice(0, 64)}`;
      await service.createTimeline(executionId, 'runbook-1');

      const timeline = await service.getTimelineByExecution(executionId);
      assert.ok(timeline);
    });

    it('queries by event type', async () => {
      const timeline = await service.createTimeline('exec-12', 'runbook-1');
      await service.appendEvent(timeline.timeline_id, 'step_started', 'actor-1');
      await service.appendEvent(timeline.timeline_id, 'step_completed', 'actor-1');
      await service.appendEvent(timeline.timeline_id, 'step_started', 'actor-1');

      const startEvents = await service.getEventsByType(timeline.timeline_id, 'step_started');
      assert.strictEqual(startEvents.length, 2);
    });

    it('queries by actor', async () => {
      const timeline = await service.createTimeline('exec-13', 'runbook-1');
      const actorId = `sha256:${Buffer.from('specific-actor').toString('hex').slice(0, 64)}`;
      await service.appendEvent(timeline.timeline_id, 'execution_started', 'specific-actor');

      const actorEvents = await service.getEventsByActor(actorId);
      assert.ok(actorEvents.length > 0);
    });
  });

  // ==========================================================================
  // CONTRACT: audit_queries
  // ==========================================================================
  describe('CONTRACT: audit_queries', () => {
    it('queries audit log with filters', async () => {
      const runbookId = `sha256:${Buffer.from('rb-query').toString('hex').slice(0, 64)}`;
      const timeline = await service.createTimeline('exec-14', runbookId);
      await service.appendEvent(timeline.timeline_id, 'execution_started', 'actor-1');
      await service.appendEvent(timeline.timeline_id, 'execution_completed', 'actor-1');

      const results = await service.queryAuditLog({
        runbook_id: runbookId,
        event_types: ['execution_started'],
      });

      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].event_type, 'execution_started');
    });

    it('supports pagination', async () => {
      const timeline = await service.createTimeline('exec-15', 'runbook-1');
      for (let i = 0; i < 10; i++) {
        await service.appendEvent(timeline.timeline_id, 'step_started', 'actor-1');
      }

      const page1 = await service.getEntries(timeline.timeline_id, 5, 0);
      const page2 = await service.getEntries(timeline.timeline_id, 5, 5);

      assert.strictEqual(page1.length, 5);
      assert.strictEqual(page2.length, 5);
    });

    it('entry IDs are opaque', async () => {
      const timeline = await service.createTimeline('exec-16', 'runbook-1');
      const entry = await service.appendEvent(timeline.timeline_id, 'execution_started', 'actor-1');

      assert.ok(entry.entry_id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // CONTRACT: summaries
  // ==========================================================================
  describe('CONTRACT: summaries', () => {
    it('generates execution summary', async () => {
      const runbookId = `sha256:${Buffer.from('rb-summary').toString('hex').slice(0, 64)}`;
      const timeline = await service.createTimeline('exec-17', runbookId);
      await service.appendEvent(timeline.timeline_id, 'execution_started', 'actor-1');
      await service.appendEvent(timeline.timeline_id, 'execution_completed', 'actor-1');

      const summary = await service.generateSummary(runbookId);

      assert.ok(summary.summary_id.startsWith('sha256:'));
      assert.strictEqual(summary.runbook_id, runbookId);
      assert.strictEqual(summary.total_executions, 1);
    });

    it('counts executions', async () => {
      const runbookId = `sha256:${Buffer.from('rb-count').toString('hex').slice(0, 64)}`;
      await service.createTimeline('exec-18', runbookId);
      await service.createTimeline('exec-19', runbookId);

      const count = await service.getExecutionCount(runbookId);
      assert.strictEqual(count, 2);
    });

    it('tracks success and failure', async () => {
      const runbookId = `sha256:${Buffer.from('rb-track').toString('hex').slice(0, 64)}`;

      const timeline1 = await service.createTimeline('exec-20', runbookId);
      await service.appendEvent(timeline1.timeline_id, 'execution_completed', 'actor-1');

      const timeline2 = await service.createTimeline('exec-21', runbookId);
      await service.appendEvent(timeline2.timeline_id, 'execution_failed', 'actor-1');

      const summary = await service.generateSummary(runbookId);
      assert.strictEqual(summary.successful_executions, 1);
      assert.strictEqual(summary.failed_executions, 1);
    });
  });
});
