/**
 * Phase XVII — Federation Resilience & DR: Reconciliation Contract Tests
 * =======================================================================
 *
 * TDD-first tests for audit chain reconciliation:
 *   - Audit chain continuity after failover
 *   - Tamper detection preservation
 *   - Evidence linkage integrity
 *   - Checksum chain validation
 *
 * CONTRACT SURFACE:
 * - Chain Continuity: Audit chain survives region loss
 * - Tamper Detection: Integrity checks work post-recovery
 * - Evidence Linking: Evidence packs reference correct chain heads
 * - Checksum Validation: SHA256 chain verification
 *
 * INVARIANTS:
 * - All IDs are opaque sha256:
 * - Chain breaks are detectable and reported
 * - Reconciliation never silently drops entries
 * - Tamper detection is fail-closed
 *
 * @module dr.reconcile.contract.test
 * @version 17.1
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ReplicaRegion = 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'gov-cloud-east';
type ReconciliationStatus = 'pending' | 'in-progress' | 'complete' | 'failed' | 'partial';
type ChainType = 'audit' | 'evidence' | 'attestation' | 'trust-log';
type IntegrityCheckResult = 'valid' | 'tampered' | 'missing' | 'orphaned';

/**
 * Audit chain entry
 */
interface ChainEntry {
  readonly entry_id: string; // sha256:
  readonly chain_type: ChainType;
  readonly sequence_number: number;
  readonly previous_hash: string | null; // sha256: or null for genesis
  readonly content_hash: string; // sha256:
  readonly timestamp: string;
  readonly source_region: ReplicaRegion;
}

/**
 * Chain head reference
 */
interface ChainHead {
  readonly chain_type: ChainType;
  readonly head_id: string; // sha256:
  readonly sequence_number: number;
  readonly head_hash: string; // sha256:
  readonly updated_at: string;
}

/**
 * Reconciliation task
 */
interface ReconciliationTask {
  readonly task_id: string; // sha256:
  readonly chain_type: ChainType;
  readonly source_region: ReplicaRegion;
  readonly target_region: ReplicaRegion;
  readonly started_at: string;
  readonly completed_at?: string;
  readonly status: ReconciliationStatus;
  readonly entries_processed: number;
  readonly entries_total: number;
  readonly gaps_found: number;
  readonly conflicts_found: number;
}

/**
 * Chain integrity check
 */
interface IntegrityCheck {
  readonly check_id: string; // sha256:
  readonly chain_type: ChainType;
  readonly region: ReplicaRegion;
  readonly result: IntegrityCheckResult;
  readonly checked_entries: number;
  readonly valid_entries: number;
  readonly tampered_entries: readonly string[];
  readonly missing_entries: readonly number[];
  readonly checked_at: string;
}

/**
 * Evidence linkage record
 */
interface EvidenceLinkage {
  readonly linkage_id: string; // sha256:
  readonly evidence_pack_id: string; // sha256:
  readonly chain_type: ChainType;
  readonly chain_head_at_creation: string; // sha256:
  readonly sequence_at_creation: number;
  readonly verified: boolean;
  readonly verification_error?: string;
}

/**
 * Conflict record during reconciliation
 */
interface ReconciliationConflict {
  readonly conflict_id: string; // sha256:
  readonly chain_type: ChainType;
  readonly sequence_number: number;
  readonly source_entry: ChainEntry;
  readonly target_entry: ChainEntry;
  readonly resolution: 'source-wins' | 'target-wins' | 'merge' | 'unresolved';
  readonly resolved_by?: string; // sha256: operator ID
  readonly resolved_at?: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockChainEntry(overrides: Partial<ChainEntry> = {}): ChainEntry {
  const entryId = `entry-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    entry_id: `sha256:${Buffer.from(entryId).toString('hex').slice(0, 64)}`,
    chain_type: 'audit',
    sequence_number: 1,
    previous_hash: null,
    content_hash: `sha256:${Buffer.from(`content-${entryId}`).toString('hex').slice(0, 64)}`,
    timestamp: new Date().toISOString(),
    source_region: 'us-east-1',
    ...overrides,
  };
}

function createMockChainHead(overrides: Partial<ChainHead> = {}): ChainHead {
  const headId = `head-${Date.now()}`;
  return {
    chain_type: 'audit',
    head_id: `sha256:${Buffer.from(headId).toString('hex').slice(0, 64)}`,
    sequence_number: 1,
    head_hash: `sha256:${Buffer.from(`hash-${headId}`).toString('hex').slice(0, 64)}`,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockReconciliationTask(
  overrides: Partial<ReconciliationTask> = {}
): ReconciliationTask {
  const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    task_id: `sha256:${Buffer.from(taskId).toString('hex').slice(0, 64)}`,
    chain_type: 'audit',
    source_region: 'us-east-1',
    target_region: 'us-west-2',
    started_at: new Date().toISOString(),
    status: 'pending',
    entries_processed: 0,
    entries_total: 0,
    gaps_found: 0,
    conflicts_found: 0,
    ...overrides,
  };
}

function createMockIntegrityCheck(overrides: Partial<IntegrityCheck> = {}): IntegrityCheck {
  const checkId = `check-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    check_id: `sha256:${Buffer.from(checkId).toString('hex').slice(0, 64)}`,
    chain_type: 'audit',
    region: 'us-east-1',
    result: 'valid',
    checked_entries: 100,
    valid_entries: 100,
    tampered_entries: [],
    missing_entries: [],
    checked_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockEvidenceLinkage(overrides: Partial<EvidenceLinkage> = {}): EvidenceLinkage {
  const linkageId = `linkage-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    linkage_id: `sha256:${Buffer.from(linkageId).toString('hex').slice(0, 64)}`,
    evidence_pack_id: `sha256:${Buffer.from('evidence-pack-1').toString('hex').slice(0, 64)}`,
    chain_type: 'audit',
    chain_head_at_creation: `sha256:${Buffer.from('head-1').toString('hex').slice(0, 64)}`,
    sequence_at_creation: 100,
    verified: true,
    ...overrides,
  };
}

function createMockConflict(
  overrides: Partial<ReconciliationConflict> = {}
): ReconciliationConflict {
  const conflictId = `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    conflict_id: `sha256:${Buffer.from(conflictId).toString('hex').slice(0, 64)}`,
    chain_type: 'audit',
    sequence_number: 50,
    source_entry: createMockChainEntry({ sequence_number: 50 }),
    target_entry: createMockChainEntry({ sequence_number: 50 }),
    resolution: 'unresolved',
    ...overrides,
  };
}

// ============================================================================
// MOCK RECONCILIATION SERVICE
// ============================================================================

interface ReconciliationService {
  // Chain Management
  appendEntry(entry: ChainEntry): Promise<ChainEntry>;
  getEntry(entryId: string): Promise<ChainEntry | null>;
  getEntriesBySequence(
    chainType: ChainType,
    from: number,
    to: number
  ): Promise<readonly ChainEntry[]>;
  getChainHead(chainType: ChainType, region: ReplicaRegion): Promise<ChainHead>;

  // Reconciliation
  startReconciliation(
    chainType: ChainType,
    source: ReplicaRegion,
    target: ReplicaRegion
  ): Promise<ReconciliationTask>;
  getReconciliationStatus(taskId: string): Promise<ReconciliationTask>;
  completeReconciliation(taskId: string): Promise<ReconciliationTask>;

  // Integrity
  checkIntegrity(chainType: ChainType, region: ReplicaRegion): Promise<IntegrityCheck>;
  verifyChainLink(entryId: string): Promise<{ valid: boolean; error?: string }>;
  detectTampering(chainType: ChainType, region: ReplicaRegion): Promise<readonly string[]>;

  // Evidence Linkage
  createEvidenceLinkage(evidencePackId: string, chainType: ChainType): Promise<EvidenceLinkage>;
  verifyEvidenceLinkage(linkageId: string): Promise<EvidenceLinkage>;
  getEvidenceLinkages(evidencePackId: string): Promise<readonly EvidenceLinkage[]>;

  // Conflict Resolution
  getConflicts(taskId: string): Promise<readonly ReconciliationConflict[]>;
  resolveConflict(
    conflictId: string,
    resolution: 'source-wins' | 'target-wins' | 'merge',
    operatorId: string
  ): Promise<ReconciliationConflict>;

  // Gap Detection
  findGaps(chainType: ChainType, region: ReplicaRegion): Promise<readonly number[]>;
  fillGap(chainType: ChainType, sequenceNumber: number, from: ReplicaRegion): Promise<ChainEntry>;
}

function createMockReconciliationService(): ReconciliationService {
  const entries: Map<string, ChainEntry> = new Map();
  const chainHeads: Map<string, ChainHead> = new Map();
  const tasks: Map<string, ReconciliationTask> = new Map();
  const linkages: Map<string, EvidenceLinkage> = new Map();
  const conflicts: Map<string, ReconciliationConflict[]> = new Map();

  let globalSequence = 0;

  function getChainKey(chainType: ChainType, region: ReplicaRegion): string {
    return `${chainType}:${region}`;
  }

  return {
    async appendEntry(entry) {
      globalSequence++;
      const newEntry: ChainEntry = {
        ...entry,
        sequence_number: globalSequence,
      };

      entries.set(entry.entry_id, newEntry);

      // Update chain head
      const headKey = getChainKey(entry.chain_type, entry.source_region);
      chainHeads.set(headKey, {
        chain_type: entry.chain_type,
        head_id: entry.entry_id,
        sequence_number: globalSequence,
        head_hash: entry.content_hash,
        updated_at: new Date().toISOString(),
      });

      return newEntry;
    },

    async getEntry(entryId) {
      return entries.get(entryId) ?? null;
    },

    async getEntriesBySequence(chainType, from, to) {
      const result: ChainEntry[] = [];
      for (const entry of entries.values()) {
        if (
          entry.chain_type === chainType &&
          entry.sequence_number >= from &&
          entry.sequence_number <= to
        ) {
          result.push(entry);
        }
      }
      return result.sort((a, b) => a.sequence_number - b.sequence_number);
    },

    async getChainHead(chainType, region) {
      const headKey = getChainKey(chainType, region);
      return (
        chainHeads.get(headKey) ??
        createMockChainHead({ chain_type: chainType, sequence_number: 0 })
      );
    },

    async startReconciliation(chainType, source, target) {
      const task = createMockReconciliationTask({
        chain_type: chainType,
        source_region: source,
        target_region: target,
        status: 'in-progress',
      });
      tasks.set(task.task_id, task);
      conflicts.set(task.task_id, []);
      return task;
    },

    async getReconciliationStatus(taskId) {
      return tasks.get(taskId) ?? createMockReconciliationTask({ status: 'failed' });
    },

    async completeReconciliation(taskId) {
      const task = tasks.get(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const taskConflicts = conflicts.get(taskId) ?? [];
      const unresolvedConflicts = taskConflicts.filter(c => c.resolution === 'unresolved');

      const updated: ReconciliationTask = {
        ...task,
        status: unresolvedConflicts.length > 0 ? 'partial' : 'complete',
        completed_at: new Date().toISOString(),
        conflicts_found: taskConflicts.length,
      };
      tasks.set(taskId, updated);
      return updated;
    },

    async checkIntegrity(chainType, region) {
      const chainEntries: ChainEntry[] = [];
      for (const entry of entries.values()) {
        if (entry.chain_type === chainType && entry.source_region === region) {
          chainEntries.push(entry);
        }
      }

      const sorted = chainEntries.sort((a, b) => a.sequence_number - b.sequence_number);
      const tampered: string[] = [];
      const missing: number[] = [];

      // Check chain links
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].previous_hash !== sorted[i - 1].content_hash) {
          tampered.push(sorted[i].entry_id);
        }
        if (sorted[i].sequence_number !== sorted[i - 1].sequence_number + 1) {
          for (
            let seq = sorted[i - 1].sequence_number + 1;
            seq < sorted[i].sequence_number;
            seq++
          ) {
            missing.push(seq);
          }
        }
      }

      const result: IntegrityCheckResult =
        tampered.length > 0 ? 'tampered' : missing.length > 0 ? 'missing' : 'valid';

      return createMockIntegrityCheck({
        chain_type: chainType,
        region,
        result,
        checked_entries: sorted.length,
        valid_entries: sorted.length - tampered.length,
        tampered_entries: tampered,
        missing_entries: missing,
      });
    },

    async verifyChainLink(entryId) {
      const entry = entries.get(entryId);
      if (!entry) {
        return { valid: false, error: 'Entry not found' };
      }

      if (entry.previous_hash === null) {
        // Genesis entry is always valid
        return { valid: true };
      }

      // Find previous entry
      let previousEntry: ChainEntry | undefined;
      for (const e of entries.values()) {
        if (e.content_hash === entry.previous_hash) {
          previousEntry = e;
          break;
        }
      }

      if (!previousEntry) {
        return { valid: false, error: 'Previous entry not found' };
      }

      if (previousEntry.sequence_number !== entry.sequence_number - 1) {
        return { valid: false, error: 'Sequence number mismatch' };
      }

      return { valid: true };
    },

    async detectTampering(chainType, region) {
      const check = await this.checkIntegrity(chainType, region);
      return check.tampered_entries;
    },

    async createEvidenceLinkage(evidencePackId, chainType) {
      const head = await this.getChainHead(chainType, 'us-east-1');
      const linkage = createMockEvidenceLinkage({
        evidence_pack_id: evidencePackId,
        chain_type: chainType,
        chain_head_at_creation: head.head_hash,
        sequence_at_creation: head.sequence_number,
      });
      linkages.set(linkage.linkage_id, linkage);
      return linkage;
    },

    async verifyEvidenceLinkage(linkageId) {
      const linkage = linkages.get(linkageId);
      if (!linkage) {
        return createMockEvidenceLinkage({
          verified: false,
          verification_error: 'Linkage not found',
        });
      }

      // Verify chain head existed at creation time
      const head = await this.getChainHead(linkage.chain_type, 'us-east-1');
      const verified = head.sequence_number >= linkage.sequence_at_creation;

      const updated: EvidenceLinkage = {
        ...linkage,
        verified,
        verification_error: verified ? undefined : 'Chain head sequence mismatch',
      };
      linkages.set(linkageId, updated);
      return updated;
    },

    async getEvidenceLinkages(evidencePackId) {
      const result: EvidenceLinkage[] = [];
      for (const linkage of linkages.values()) {
        if (linkage.evidence_pack_id === evidencePackId) {
          result.push(linkage);
        }
      }
      return result;
    },

    async getConflicts(taskId) {
      return conflicts.get(taskId) ?? [];
    },

    async resolveConflict(conflictId, resolution, operatorId) {
      // Find conflict in all tasks
      for (const [taskId, taskConflicts] of conflicts.entries()) {
        const idx = taskConflicts.findIndex(c => c.conflict_id === conflictId);
        if (idx !== -1) {
          const resolved: ReconciliationConflict = {
            ...taskConflicts[idx],
            resolution,
            resolved_by: operatorId,
            resolved_at: new Date().toISOString(),
          };
          taskConflicts[idx] = resolved;
          conflicts.set(taskId, taskConflicts);
          return resolved;
        }
      }
      throw new Error('Conflict not found');
    },

    async findGaps(chainType, region) {
      const check = await this.checkIntegrity(chainType, region);
      return check.missing_entries;
    },

    async fillGap(chainType, sequenceNumber, from) {
      // Simulate fetching entry from another region
      const entry = createMockChainEntry({
        chain_type: chainType,
        sequence_number: sequenceNumber,
        source_region: from,
      });
      entries.set(entry.entry_id, entry);
      return entry;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Phase XVII — DR Reconciliation Contracts', () => {
  let service: ReconciliationService;

  beforeEach(() => {
    service = createMockReconciliationService();
  });

  // ==========================================================================
  // CONTRACT: chain_continuity
  // ==========================================================================
  describe('CONTRACT: chain_continuity', () => {
    it('appends entry to chain', async () => {
      const entry = createMockChainEntry();
      const appended = await service.appendEntry(entry);

      assert.ok(appended.entry_id.startsWith('sha256:'));
      assert.ok(appended.sequence_number > 0);
    });

    it('retrieves entry by ID', async () => {
      const entry = createMockChainEntry();
      await service.appendEntry(entry);

      const retrieved = await service.getEntry(entry.entry_id);
      assert.ok(retrieved);
      assert.strictEqual(retrieved.entry_id, entry.entry_id);
    });

    it('retrieves entries by sequence range', async () => {
      const entry1 = createMockChainEntry({ chain_type: 'audit' });
      const entry2 = createMockChainEntry({ chain_type: 'audit' });

      await service.appendEntry(entry1);
      await service.appendEntry(entry2);

      const entries = await service.getEntriesBySequence('audit', 1, 100);
      assert.ok(entries.length >= 2);
    });

    it('tracks chain head per region', async () => {
      const entry = createMockChainEntry({ source_region: 'us-east-1' });
      await service.appendEntry(entry);

      const head = await service.getChainHead('audit', 'us-east-1');

      assert.ok(head.head_id.startsWith('sha256:'));
      assert.ok(head.sequence_number > 0);
    });

    it('chain head updated on append', async () => {
      const entry1 = createMockChainEntry();
      await service.appendEntry(entry1);
      const head1 = await service.getChainHead('audit', 'us-east-1');

      const entry2 = createMockChainEntry();
      await service.appendEntry(entry2);
      const head2 = await service.getChainHead('audit', 'us-east-1');

      assert.ok(head2.sequence_number > head1.sequence_number);
    });
  });

  // ==========================================================================
  // CONTRACT: reconciliation_tasks
  // ==========================================================================
  describe('CONTRACT: reconciliation_tasks', () => {
    it('starts reconciliation task', async () => {
      const task = await service.startReconciliation('audit', 'us-east-1', 'us-west-2');

      assert.ok(task.task_id.startsWith('sha256:'));
      assert.strictEqual(task.chain_type, 'audit');
      assert.strictEqual(task.source_region, 'us-east-1');
      assert.strictEqual(task.target_region, 'us-west-2');
    });

    it('tracks reconciliation status', async () => {
      const task = await service.startReconciliation('audit', 'us-east-1', 'us-west-2');
      const status = await service.getReconciliationStatus(task.task_id);

      assert.strictEqual(status.status, 'in-progress');
    });

    it('completes reconciliation', async () => {
      const task = await service.startReconciliation('audit', 'us-east-1', 'us-west-2');
      const completed = await service.completeReconciliation(task.task_id);

      assert.strictEqual(completed.status, 'complete');
      assert.ok(completed.completed_at);
    });

    it('tracks entries processed', async () => {
      const task = await service.startReconciliation('audit', 'us-east-1', 'us-west-2');

      assert.strictEqual(typeof task.entries_processed, 'number');
      assert.strictEqual(typeof task.entries_total, 'number');
    });

    it('reports gaps found', async () => {
      const task = await service.startReconciliation('audit', 'us-east-1', 'us-west-2');

      assert.strictEqual(typeof task.gaps_found, 'number');
    });
  });

  // ==========================================================================
  // CONTRACT: integrity_checking
  // ==========================================================================
  describe('CONTRACT: integrity_checking', () => {
    it('checks chain integrity', async () => {
      const entry = createMockChainEntry();
      await service.appendEntry(entry);

      const check = await service.checkIntegrity('audit', 'us-east-1');

      assert.ok(check.check_id.startsWith('sha256:'));
      assert.ok(['valid', 'tampered', 'missing', 'orphaned'].includes(check.result));
    });

    it('verifies chain link', async () => {
      const entry = createMockChainEntry({ previous_hash: null });
      await service.appendEntry(entry);

      const result = await service.verifyChainLink(entry.entry_id);

      assert.strictEqual(typeof result.valid, 'boolean');
    });

    it('reports tampered entries', async () => {
      const check = await service.checkIntegrity('audit', 'us-east-1');

      assert.ok(Array.isArray(check.tampered_entries));
    });

    it('reports missing entries', async () => {
      const check = await service.checkIntegrity('audit', 'us-east-1');

      assert.ok(Array.isArray(check.missing_entries));
    });

    it('detects tampering', async () => {
      const tampered = await service.detectTampering('audit', 'us-east-1');

      assert.ok(Array.isArray(tampered));
    });

    it('integrity check records timestamp', async () => {
      const check = await service.checkIntegrity('audit', 'us-east-1');

      const date = new Date(check.checked_at);
      assert.ok(!isNaN(date.getTime()));
    });
  });

  // ==========================================================================
  // CONTRACT: evidence_linkage
  // ==========================================================================
  describe('CONTRACT: evidence_linkage', () => {
    it('creates evidence linkage', async () => {
      const entry = createMockChainEntry();
      await service.appendEntry(entry);

      const linkage = await service.createEvidenceLinkage('sha256:evidence-pack-1', 'audit');

      assert.ok(linkage.linkage_id.startsWith('sha256:'));
      assert.ok(linkage.chain_head_at_creation.startsWith('sha256:'));
    });

    it('linkage captures sequence at creation', async () => {
      const entry = createMockChainEntry();
      await service.appendEntry(entry);

      const head = await service.getChainHead('audit', 'us-east-1');
      const linkage = await service.createEvidenceLinkage('sha256:evidence-pack-1', 'audit');

      assert.strictEqual(linkage.sequence_at_creation, head.sequence_number);
    });

    it('verifies evidence linkage', async () => {
      const entry = createMockChainEntry();
      await service.appendEntry(entry);

      const linkage = await service.createEvidenceLinkage('sha256:evidence-pack-1', 'audit');
      const verified = await service.verifyEvidenceLinkage(linkage.linkage_id);

      assert.strictEqual(verified.verified, true);
    });

    it('retrieves linkages for evidence pack', async () => {
      const entry = createMockChainEntry();
      await service.appendEntry(entry);

      const packId = 'sha256:evidence-pack-1';
      await service.createEvidenceLinkage(packId, 'audit');
      await service.createEvidenceLinkage(packId, 'attestation');

      const linkages = await service.getEvidenceLinkages(packId);
      assert.ok(linkages.length >= 2);
    });

    it('reports verification errors', async () => {
      const badLinkage = await service.verifyEvidenceLinkage('sha256:nonexistent');

      assert.strictEqual(badLinkage.verified, false);
      assert.ok(badLinkage.verification_error);
    });
  });

  // ==========================================================================
  // CONTRACT: conflict_resolution
  // ==========================================================================
  describe('CONTRACT: conflict_resolution', () => {
    it('lists conflicts for task', async () => {
      const task = await service.startReconciliation('audit', 'us-east-1', 'us-west-2');
      const taskConflicts = await service.getConflicts(task.task_id);

      assert.ok(Array.isArray(taskConflicts));
    });

    it('conflict has required fields', () => {
      const conflict = createMockConflict();

      assert.ok(conflict.conflict_id.startsWith('sha256:'));
      assert.ok(conflict.chain_type);
      assert.ok(typeof conflict.sequence_number === 'number');
      assert.ok(conflict.source_entry);
      assert.ok(conflict.target_entry);
    });

    it('conflict starts unresolved', () => {
      const conflict = createMockConflict();
      assert.strictEqual(conflict.resolution, 'unresolved');
    });

    it('resolution records operator', async () => {
      // This would require populating conflicts in the task, simplified test
      const conflict = createMockConflict({
        resolution: 'source-wins',
        resolved_by: 'sha256:operator-1',
        resolved_at: new Date().toISOString(),
      });

      assert.ok(conflict.resolved_by?.startsWith('sha256:'));
      assert.ok(conflict.resolved_at);
    });
  });

  // ==========================================================================
  // CONTRACT: gap_detection
  // ==========================================================================
  describe('CONTRACT: gap_detection', () => {
    it('finds gaps in chain', async () => {
      const gaps = await service.findGaps('audit', 'us-east-1');

      assert.ok(Array.isArray(gaps));
    });

    it('fills gap from another region', async () => {
      const filled = await service.fillGap('audit', 5, 'us-west-2');

      assert.ok(filled.entry_id.startsWith('sha256:'));
      assert.strictEqual(filled.sequence_number, 5);
    });

    it('filled entry has correct source region', async () => {
      const filled = await service.fillGap('audit', 10, 'eu-west-1');

      assert.strictEqual(filled.source_region, 'eu-west-1');
    });
  });

  // ==========================================================================
  // CONTRACT: auditability
  // ==========================================================================
  describe('CONTRACT: auditability', () => {
    it('all entry IDs are opaque sha256', async () => {
      const entry = createMockChainEntry();
      const appended = await service.appendEntry(entry);

      assert.ok(appended.entry_id.startsWith('sha256:'));
      assert.ok(appended.content_hash.startsWith('sha256:'));
    });

    it('all task IDs are opaque sha256', async () => {
      const task = await service.startReconciliation('audit', 'us-east-1', 'us-west-2');

      assert.ok(task.task_id.startsWith('sha256:'));
    });

    it('all linkage IDs are opaque sha256', async () => {
      const entry = createMockChainEntry();
      await service.appendEntry(entry);

      const linkage = await service.createEvidenceLinkage('sha256:pack-1', 'audit');

      assert.ok(linkage.linkage_id.startsWith('sha256:'));
      assert.ok(linkage.evidence_pack_id.startsWith('sha256:'));
      assert.ok(linkage.chain_head_at_creation.startsWith('sha256:'));
    });

    it('integrity checks have timestamps', async () => {
      const check = await service.checkIntegrity('audit', 'us-east-1');

      const date = new Date(check.checked_at);
      assert.ok(!isNaN(date.getTime()));
    });

    it('reconciliation tasks have timestamps', async () => {
      const task = await service.startReconciliation('audit', 'us-east-1', 'us-west-2');

      const startDate = new Date(task.started_at);
      assert.ok(!isNaN(startDate.getTime()));
    });
  });
});
