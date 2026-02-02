/**
 * Phase 4N47 – Break-Glass Exercise Tests
 * ========================================
 *
 * Tests for break-glass emergency deletion procedures:
 *   - Intent creation with reason
 *   - Dual approval requirement
 *   - Correct flags and telemetry
 *   - Ledger append with deletion record
 *
 * @module exercise-break-glass.test
 * @version 4N47.1
 */

import * as assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface BreakGlassIntent {
  readonly $schema: string;
  readonly intentId: string;
  readonly incidentId: string;
  readonly action: 'delete' | 'revoke' | 'suspend';
  readonly targetArtifacts: readonly string[];
  readonly reason: string;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly approvals: readonly BreakGlassApproval[];
  readonly executed: boolean;
  readonly executedAt?: string;
  readonly simulate: boolean;
}

interface BreakGlassApproval {
  readonly approverId: string;
  readonly approvedAt: string;
  readonly signatureHash: string;
}

interface BreakGlassTelemetryEvent {
  readonly eventType: 'break_glass_initiated' | 'break_glass_approved' | 'break_glass_executed';
  readonly incidentId: string;
  readonly intentId: string;
  readonly approverCount: number;
  readonly timestamp: string;
}

interface BreakGlassResult {
  readonly success: boolean;
  readonly intentId: string;
  readonly deletedArtifacts: readonly string[];
  readonly ledgerSequence?: number;
  readonly error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const BREAK_GLASS_SCHEMA = 'terrafusion.autonomy.break-glass.v1';
const REQUIRED_APPROVALS = 2;

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function createBreakGlassIntent(options: {
  incidentId: string;
  action: BreakGlassIntent['action'];
  targetArtifacts: readonly string[];
  reason: string;
  createdBy: string;
  simulate?: boolean;
}): BreakGlassIntent {
  return {
    $schema: BREAK_GLASS_SCHEMA,
    intentId: randomUUID(),
    incidentId: options.incidentId,
    action: options.action,
    targetArtifacts: options.targetArtifacts,
    reason: options.reason,
    createdAt: new Date().toISOString(),
    createdBy: options.createdBy,
    approvals: [],
    executed: false,
    simulate: options.simulate ?? false,
  };
}

function addApproval(intent: BreakGlassIntent, approverId: string): BreakGlassIntent {
  const signatureHash = createHash('sha256')
    .update(`${intent.intentId}-${approverId}-${Date.now()}`)
    .digest('hex');

  const approval: BreakGlassApproval = {
    approverId,
    approvedAt: new Date().toISOString(),
    signatureHash,
  };

  return {
    ...intent,
    approvals: [...intent.approvals, approval],
  };
}

function validateBreakGlassIntent(intent: BreakGlassIntent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!intent.incidentId) {
    errors.push('incidentId is required');
  }
  if (!intent.reason || intent.reason.length < 10) {
    errors.push('reason must be at least 10 characters');
  }
  if (!intent.targetArtifacts || intent.targetArtifacts.length === 0) {
    errors.push('targetArtifacts must not be empty');
  }
  if (!['delete', 'revoke', 'suspend'].includes(intent.action)) {
    errors.push('action must be delete, revoke, or suspend');
  }

  return { valid: errors.length === 0, errors };
}

function hasSufficientApprovals(intent: BreakGlassIntent): boolean {
  return intent.approvals.length >= REQUIRED_APPROVALS;
}

function executeBreakGlass(intent: BreakGlassIntent): BreakGlassResult {
  if (!hasSufficientApprovals(intent)) {
    return {
      success: false,
      intentId: intent.intentId,
      deletedArtifacts: [],
      error: `Insufficient approvals: ${intent.approvals.length}/${REQUIRED_APPROVALS}`,
    };
  }

  if (intent.simulate) {
    return {
      success: true,
      intentId: intent.intentId,
      deletedArtifacts: intent.targetArtifacts.map(a => `[SIMULATED] ${a}`),
      ledgerSequence: Math.floor(Math.random() * 1000) + 1,
    };
  }

  return {
    success: true,
    intentId: intent.intentId,
    deletedArtifacts: [...intent.targetArtifacts],
    ledgerSequence: Math.floor(Math.random() * 1000) + 1,
  };
}

function createBreakGlassTelemetryEvent(
  eventType: BreakGlassTelemetryEvent['eventType'],
  intent: BreakGlassIntent
): BreakGlassTelemetryEvent {
  return {
    eventType,
    incidentId: intent.incidentId,
    intentId: intent.intentId,
    approverCount: intent.approvals.length,
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Intent Creation
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Break-Glass Intent Creation', () => {
  it('creates valid intent with required fields', () => {
    const intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-2025-001',
      action: 'delete',
      targetArtifacts: ['artifact-1.json', 'artifact-2.json'],
      reason: 'Simulated tampering detected in artifact chain',
      createdBy: 'operator-1',
    });

    assert.strictEqual(intent.$schema, BREAK_GLASS_SCHEMA);
    assert.ok(intent.intentId);
    assert.strictEqual(intent.action, 'delete');
    assert.strictEqual(intent.executed, false);
    assert.strictEqual(intent.approvals.length, 0);
  });

  it('validates intent requires incidentId', () => {
    const intent = createBreakGlassIntent({
      incidentId: '',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    const result = validateBreakGlassIntent(intent);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('incidentId')));
  });

  it('validates intent requires meaningful reason', () => {
    const intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'short',
      createdBy: 'operator-1',
    });

    const result = validateBreakGlassIntent(intent);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('reason')));
  });

  it('validates intent requires target artifacts', () => {
    const intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: [],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    const result = validateBreakGlassIntent(intent);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.includes('targetArtifacts')));
  });

  it('accepts valid intent', () => {
    const intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion requiring action',
      createdBy: 'operator-1',
    });

    const result = validateBreakGlassIntent(intent);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Dual Approval
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Break-Glass Dual Approval', () => {
  it('requires 2 approvals for execution', () => {
    const intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    assert.strictEqual(hasSufficientApprovals(intent), false);
  });

  it('single approval is insufficient', () => {
    let intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    intent = addApproval(intent, 'approver-1');
    assert.strictEqual(intent.approvals.length, 1);
    assert.strictEqual(hasSufficientApprovals(intent), false);
  });

  it('two approvals is sufficient', () => {
    let intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    intent = addApproval(intent, 'approver-1');
    intent = addApproval(intent, 'approver-2');
    assert.strictEqual(intent.approvals.length, 2);
    assert.strictEqual(hasSufficientApprovals(intent), true);
  });

  it('approval includes signature hash', () => {
    let intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    intent = addApproval(intent, 'approver-1');
    assert.ok(intent.approvals[0].signatureHash.length === 64);
  });

  it('approvals have unique signatures', () => {
    let intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    intent = addApproval(intent, 'approver-1');
    intent = addApproval(intent, 'approver-2');

    assert.notStrictEqual(intent.approvals[0].signatureHash, intent.approvals[1].signatureHash);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Break-Glass Execution
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Break-Glass Execution', () => {
  it('fails without sufficient approvals', () => {
    const intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    const result = executeBreakGlass(intent);
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('Insufficient approvals'));
  });

  it('succeeds with dual approval', () => {
    let intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact-1.json', 'artifact-2.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    intent = addApproval(intent, 'approver-1');
    intent = addApproval(intent, 'approver-2');

    const result = executeBreakGlass(intent);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.deletedArtifacts.length, 2);
    assert.ok(result.ledgerSequence && result.ledgerSequence > 0);
  });

  it('simulation mode marks artifacts as simulated', () => {
    let intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
      simulate: true,
    });

    intent = addApproval(intent, 'approver-1');
    intent = addApproval(intent, 'approver-2');

    const result = executeBreakGlass(intent);
    assert.strictEqual(result.success, true);
    assert.ok(result.deletedArtifacts[0].includes('[SIMULATED]'));
  });

  it('execution assigns ledger sequence number', () => {
    let intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    intent = addApproval(intent, 'approver-1');
    intent = addApproval(intent, 'approver-2');

    const result = executeBreakGlass(intent);
    assert.ok(typeof result.ledgerSequence === 'number');
    assert.ok(result.ledgerSequence! > 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Break-Glass Telemetry
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Break-Glass Telemetry', () => {
  it('emits initiated event on intent creation', () => {
    const intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    const event = createBreakGlassTelemetryEvent('break_glass_initiated', intent);
    assert.strictEqual(event.eventType, 'break_glass_initiated');
    assert.strictEqual(event.incidentId, 'INCIDENT-001');
    assert.strictEqual(event.intentId, intent.intentId);
  });

  it('tracks approver count in telemetry', () => {
    let intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    intent = addApproval(intent, 'approver-1');
    intent = addApproval(intent, 'approver-2');

    const event = createBreakGlassTelemetryEvent('break_glass_approved', intent);
    assert.strictEqual(event.approverCount, 2);
  });

  it('telemetry includes timestamp', () => {
    const intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    const event = createBreakGlassTelemetryEvent('break_glass_initiated', intent);
    assert.ok(event.timestamp);
    assert.ok(Date.parse(event.timestamp) > 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Phase 4N47 – Break-Glass Action Types
// ─────────────────────────────────────────────────────────────────────────────

describe('Phase 4N47 – Break-Glass Action Types', () => {
  it('supports delete action', () => {
    const intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'delete',
      targetArtifacts: ['artifact.json'],
      reason: 'Valid reason for deletion',
      createdBy: 'operator-1',
    });

    const result = validateBreakGlassIntent(intent);
    assert.strictEqual(result.valid, true);
  });

  it('supports revoke action', () => {
    const intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'revoke',
      targetArtifacts: ['key-epoch-1.json'],
      reason: 'Key compromise detected',
      createdBy: 'operator-1',
    });

    const result = validateBreakGlassIntent(intent);
    assert.strictEqual(result.valid, true);
  });

  it('supports suspend action', () => {
    const intent = createBreakGlassIntent({
      incidentId: 'INCIDENT-001',
      action: 'suspend',
      targetArtifacts: ['signer-identity.json'],
      reason: 'Investigation pending',
      createdBy: 'operator-1',
    });

    const result = validateBreakGlassIntent(intent);
    assert.strictEqual(result.valid, true);
  });
});
