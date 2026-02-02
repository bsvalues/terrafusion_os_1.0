/**
 * Phase 4N29 – Autonomy Circuit Breaker Contract Tests
 * =====================================================
 *
 * Contract tests for pause/resume governor.
 * Tests: fail-closed, TTL enforcement, determinism, ledger visibility.
 */

import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  AUTONOMY_STATE_SCHEMA_VERSION,
  checkAutonomyAllowed,
  checkFreezeAuthorization,
  DEFAULT_FREEZE_POLICY,
  DEFAULT_FREEZE_STATE,
  freezeAutonomy,
  generateFreezeEvidence,
  generateStateEvidence,
  isFreezeExpired,
  isPauseExpired,
  loadAutonomyState,
  parseDuration,
  pauseAutonomy,
  resumeAutonomy,
  saveAutonomyState,
  unfreezeAutonomy,
  type AutonomyContext,
  type AutonomyDecision,
  type AutonomyState
} from '../src/autonomy-state.js';

// ============================================================================
// Test Fixtures
// ============================================================================

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'autonomy-state-test-'));
}

function createTempStateFile(dir: string, state: AutonomyState): string {
  const filePath = path.join(dir, 'AUTONOMY_STATE.json');
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
  return filePath;
}

function createValidState(overrides?: Partial<AutonomyState>): AutonomyState {
  return {
    schemaVersion: AUTONOMY_STATE_SCHEMA_VERSION,
    state: 'active',
    updatedAt: '2025-01-31T00:00:00.000Z',
    updatedBy: 'test',
    reason: null,
    expiresAt: null,
    policy: {
      failClosedOnMissing: true,
      failClosedOnInvalid: true,
      allowIncidentPublisherWhenPaused: true,
    },
    history: [],
    ...overrides,
  };
}

// ============================================================================
// Schema Version Tests
// ============================================================================

describe('Phase 4N29/4N39: Autonomy State Schema', () => {
  it('should have schema version 1.1.0 (freeze capability)', () => {
    assert.strictEqual(AUTONOMY_STATE_SCHEMA_VERSION, '1.1.0');
  });
});

// ============================================================================
// Load/Save Tests
// ============================================================================

describe('Phase 4N29: State File Load/Save', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should load valid state file', () => {
    const state = createValidState();
    const filePath = createTempStateFile(tempDir, state);

    const loaded = loadAutonomyState(filePath);

    assert.ok(loaded, 'Should load state');
    assert.strictEqual(loaded.state, 'active');
    assert.strictEqual(loaded.schemaVersion, AUTONOMY_STATE_SCHEMA_VERSION);
  });

  it('should return null for missing file', () => {
    const filePath = path.join(tempDir, 'does-not-exist.json');

    const loaded = loadAutonomyState(filePath);

    assert.strictEqual(loaded, null);
  });

  it('should return null for invalid JSON', () => {
    const filePath = path.join(tempDir, 'invalid.json');
    fs.writeFileSync(filePath, 'not valid json {{{', 'utf-8');

    const loaded = loadAutonomyState(filePath);

    assert.strictEqual(loaded, null);
  });

  it('should return null for invalid schema', () => {
    const filePath = path.join(tempDir, 'bad-schema.json');
    fs.writeFileSync(filePath, JSON.stringify({ foo: 'bar' }), 'utf-8');

    const loaded = loadAutonomyState(filePath);

    assert.strictEqual(loaded, null);
  });

  it('should save and reload state', () => {
    const filePath = path.join(tempDir, 'test-state.json');
    const state = createValidState({ state: 'paused', reason: 'test pause' });

    saveAutonomyState(state, filePath);
    const loaded = loadAutonomyState(filePath);

    assert.ok(loaded);
    assert.strictEqual(loaded.state, 'paused');
    assert.strictEqual(loaded.reason, 'test pause');
  });
});

// ============================================================================
// Fail-Closed Tests (Non-Negotiable Invariant)
// ============================================================================

describe('Phase 4N29: Fail-Closed Behavior', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should fail-closed when state file is missing', () => {
    const filePath = path.join(tempDir, 'missing.json');
    const context: AutonomyContext = { actor: 'pr-lane' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.source, 'fail-closed-missing');
    assert.strictEqual(decision.state, 'paused');
  });

  it('should fail-closed when state file is invalid', () => {
    const filePath = path.join(tempDir, 'invalid.json');
    fs.writeFileSync(filePath, '{ invalid json }', 'utf-8');
    const context: AutonomyContext = { actor: 'pr-lane' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.source, 'fail-closed-invalid');
    assert.strictEqual(decision.state, 'paused');
  });

  it('should report correct reason for missing file', () => {
    const filePath = path.join(tempDir, 'nope.json');
    const context: AutonomyContext = { actor: 'pr-lane' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.strictEqual(decision.reason, 'State file missing');
  });

  it('should report correct reason for invalid file', () => {
    const filePath = path.join(tempDir, 'bad.json');
    fs.writeFileSync(filePath, 'garbage', 'utf-8');
    const context: AutonomyContext = { actor: 'pr-lane' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.strictEqual(decision.reason, 'State file invalid');
  });
});

// ============================================================================
// Active State Tests
// ============================================================================

describe('Phase 4N29: Active State', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should allow PR lane when active', () => {
    const state = createValidState({ state: 'active' });
    const filePath = createTempStateFile(tempDir, state);
    const context: AutonomyContext = { actor: 'pr-lane' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.strictEqual(decision.allowed, true);
    assert.strictEqual(decision.state, 'active');
    assert.strictEqual(decision.source, 'file');
  });

  it('should allow evidence publisher when active', () => {
    const state = createValidState({ state: 'active' });
    const filePath = createTempStateFile(tempDir, state);
    const context: AutonomyContext = { actor: 'evidence-publisher' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.strictEqual(decision.allowed, true);
    assert.strictEqual(decision.state, 'active');
  });

  it('should allow incident publisher when active', () => {
    const state = createValidState({ state: 'active' });
    const filePath = createTempStateFile(tempDir, state);
    const context: AutonomyContext = { actor: 'incident-publisher' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.strictEqual(decision.allowed, true);
  });
});

// ============================================================================
// Paused State Tests
// ============================================================================

describe('Phase 4N29: Paused State', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should block PR lane when paused', () => {
    const state = createValidState({ state: 'paused', reason: 'incident response' });
    const filePath = createTempStateFile(tempDir, state);
    const context: AutonomyContext = { actor: 'pr-lane' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.state, 'paused');
    assert.strictEqual(decision.reason, 'incident response');
  });

  it('should block evidence publisher when paused', () => {
    const state = createValidState({ state: 'paused', reason: 'maintenance' });
    const filePath = createTempStateFile(tempDir, state);
    const context: AutonomyContext = { actor: 'evidence-publisher' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.strictEqual(decision.allowed, false);
  });

  it('should allow incident publisher when paused (policy governs)', () => {
    const state = createValidState({
      state: 'paused',
      reason: 'system maintenance',
      policy: {
        failClosedOnMissing: true,
        failClosedOnInvalid: true,
        allowIncidentPublisherWhenPaused: true,
      },
    });
    const filePath = createTempStateFile(tempDir, state);
    const context: AutonomyContext = { actor: 'incident-publisher' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.strictEqual(decision.allowed, true, 'Incident publisher should be allowed when paused');
    assert.strictEqual(decision.state, 'paused', 'State should still report as paused');
  });

  it('should block incident publisher when policy disallows', () => {
    const state = createValidState({
      state: 'paused',
      reason: 'lockdown',
      policy: {
        failClosedOnMissing: true,
        failClosedOnInvalid: true,
        allowIncidentPublisherWhenPaused: false,
      },
    });
    const filePath = createTempStateFile(tempDir, state);
    const context: AutonomyContext = { actor: 'incident-publisher' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.strictEqual(decision.allowed, false);
  });
});

// ============================================================================
// TTL Enforcement Tests
// ============================================================================

describe('Phase 4N29: TTL Enforcement', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should detect expired pause', () => {
    const pastTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const expired = isPauseExpired(pastTime);

    assert.strictEqual(expired, true);
  });

  it('should detect non-expired pause', () => {
    const futureTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
    const expired = isPauseExpired(futureTime);

    assert.strictEqual(expired, false);
  });

  it('should return false for null expiresAt', () => {
    const expired = isPauseExpired(null);

    assert.strictEqual(expired, false);
  });

  it('should auto-resume when pause expires', () => {
    const pastTime = new Date(Date.now() - 3600000).toISOString();
    const state = createValidState({
      state: 'paused',
      reason: 'scheduled maintenance',
      expiresAt: pastTime,
    });
    const filePath = createTempStateFile(tempDir, state);
    const context: AutonomyContext = { actor: 'pr-lane' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.strictEqual(decision.allowed, true, 'Should auto-resume when expired');
    assert.strictEqual(decision.expired, true);
    assert.strictEqual(decision.state, 'active');
    assert.strictEqual(decision.source, 'fail-closed-expired');
  });

  it('should remain paused when not expired', () => {
    const futureTime = new Date(Date.now() + 3600000).toISOString();
    const state = createValidState({
      state: 'paused',
      reason: 'ongoing incident',
      expiresAt: futureTime,
    });
    const filePath = createTempStateFile(tempDir, state);
    const context: AutonomyContext = { actor: 'pr-lane' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.expired, false);
    assert.strictEqual(decision.expiresAt, futureTime);
  });
});

// ============================================================================
// Duration Parsing Tests
// ============================================================================

describe('Phase 4N29: Duration Parsing', () => {
  it('should parse minutes', () => {
    assert.strictEqual(parseDuration('30m'), 30 * 60 * 1000);
  });

  it('should parse hours', () => {
    assert.strictEqual(parseDuration('1h'), 60 * 60 * 1000);
    assert.strictEqual(parseDuration('24h'), 24 * 60 * 60 * 1000);
  });

  it('should parse days', () => {
    assert.strictEqual(parseDuration('1d'), 24 * 60 * 60 * 1000);
    assert.strictEqual(parseDuration('7d'), 7 * 24 * 60 * 60 * 1000);
  });

  it('should return null for invalid duration', () => {
    assert.strictEqual(parseDuration('invalid'), null);
    assert.strictEqual(parseDuration('30'), null);
    assert.strictEqual(parseDuration('h'), null);
    assert.strictEqual(parseDuration(''), null);
  });
});

// ============================================================================
// Pause/Resume Mutation Tests
// ============================================================================

describe('Phase 4N29: Pause/Resume Operations', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should pause autonomy with reason', () => {
    const state = createValidState({ state: 'active' });
    const filePath = createTempStateFile(tempDir, state);

    const paused = pauseAutonomy({ reason: 'incident response', updatedBy: 'test-user' }, filePath);

    assert.strictEqual(paused.state, 'paused');
    assert.strictEqual(paused.reason, 'incident response');
    assert.strictEqual(paused.updatedBy, 'test-user');
    assert.strictEqual(paused.history.length, 1);
  });

  it('should pause with duration', () => {
    const state = createValidState({ state: 'active' });
    const filePath = createTempStateFile(tempDir, state);

    const paused = pauseAutonomy(
      { reason: 'maintenance', duration: '1h', updatedBy: 'test-user' },
      filePath
    );

    assert.strictEqual(paused.state, 'paused');
    assert.ok(paused.expiresAt, 'Should have expiry');

    const expiry = new Date(paused.expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();

    // Should be approximately 1 hour (allow 5 sec tolerance)
    assert.ok(diffMs > 3595000 && diffMs < 3605000, `Expected ~1h, got ${diffMs}ms`);
  });

  it('should resume autonomy', () => {
    const state = createValidState({
      state: 'paused',
      reason: 'incident',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
    const filePath = createTempStateFile(tempDir, state);

    const resumed = resumeAutonomy('test-user', filePath);

    assert.strictEqual(resumed.state, 'active');
    assert.strictEqual(resumed.reason, null);
    assert.strictEqual(resumed.expiresAt, null);
    assert.strictEqual(resumed.updatedBy, 'test-user');
    assert.strictEqual(resumed.history.length, 1);
  });

  it('should preserve history on pause/resume', () => {
    const filePath = path.join(tempDir, 'history-test.json');
    const initial = createValidState({ state: 'active' });
    saveAutonomyState(initial, filePath);

    pauseAutonomy({ reason: 'pause 1', updatedBy: 'user1' }, filePath);
    resumeAutonomy('user2', filePath);
    pauseAutonomy({ reason: 'pause 2', updatedBy: 'user3' }, filePath);

    const final = loadAutonomyState(filePath);

    assert.ok(final);
    assert.strictEqual(final.history.length, 3, 'Should have 3 history entries');
    assert.strictEqual(final.state, 'paused');
    assert.strictEqual(final.reason, 'pause 2');
  });
});

// ============================================================================
// Determinism Tests
// ============================================================================

describe('Phase 4N29: Determinism', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should produce identical decisions for same state', () => {
    const state = createValidState({ state: 'paused', reason: 'test' });
    const filePath = createTempStateFile(tempDir, state);
    const context: AutonomyContext = { actor: 'pr-lane' };
    const now = new Date('2025-01-31T12:00:00.000Z');

    const decision1 = checkAutonomyAllowed(context, filePath, now);
    const decision2 = checkAutonomyAllowed(context, filePath, now);

    assert.strictEqual(decision1.allowed, decision2.allowed);
    assert.strictEqual(decision1.state, decision2.state);
    assert.strictEqual(decision1.reason, decision2.reason);
    assert.strictEqual(decision1.timestamp, decision2.timestamp);
  });

  it('should include filePath in decision for audit', () => {
    const state = createValidState({ state: 'active' });
    const filePath = createTempStateFile(tempDir, state);
    const context: AutonomyContext = { actor: 'pr-lane' };

    const decision = checkAutonomyAllowed(context, filePath);

    assert.ok(decision.filePath.includes('AUTONOMY_STATE.json'));
  });
});

// ============================================================================
// Evidence Generation Tests
// ============================================================================

describe('Phase 4N29: Evidence Generation', () => {
  it('should generate valid evidence record', () => {
    const decision: AutonomyDecision = {
      allowed: false,
      state: 'paused',
      reason: 'incident response',
      expiresAt: '2025-01-31T14:00:00.000Z',
      expired: false,
      source: 'file',
      timestamp: '2025-01-31T12:00:00.000Z',
      filePath: '/test/AUTONOMY_STATE.json',
    };

    const evidence = generateStateEvidence(decision);

    assert.strictEqual(evidence.schema, 'terrafusion.autonomy.state.v1');
    assert.strictEqual(evidence.toolVersion, '4N39.1'); // Updated for freeze capability
    assert.deepStrictEqual(evidence.decision, decision);
    assert.ok(evidence.generatedAt);
  });

  it('should include all decision fields in evidence', () => {
    const decision: AutonomyDecision = {
      allowed: true,
      state: 'active',
      reason: null,
      expiresAt: null,
      expired: false,
      source: 'file',
      timestamp: '2025-01-31T12:00:00.000Z',
      filePath: '/test/state.json',
    };

    const evidence = generateStateEvidence(decision);

    assert.strictEqual(evidence.decision.allowed, true);
    assert.strictEqual(evidence.decision.state, 'active');
    assert.strictEqual(evidence.decision.source, 'file');
  });
});

// ============================================================================
// Actor Context Tests
// ============================================================================

describe('Phase 4N29: Actor Context', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should differentiate between actor types', () => {
    const state = createValidState({ state: 'paused', reason: 'test' });
    const filePath = createTempStateFile(tempDir, state);

    const prLane = checkAutonomyAllowed({ actor: 'pr-lane' }, filePath);
    const evidencePub = checkAutonomyAllowed({ actor: 'evidence-publisher' }, filePath);
    const incidentPub = checkAutonomyAllowed({ actor: 'incident-publisher' }, filePath);

    // PR lane and evidence publisher should be blocked
    assert.strictEqual(prLane.allowed, false);
    assert.strictEqual(evidencePub.allowed, false);

    // Incident publisher allowed by default policy
    assert.strictEqual(incidentPub.allowed, true);
  });
});

// ============================================================================
// Phase 4N39: Freeze Gate Contract Tests
// ============================================================================

describe('Phase 4N39: Freeze Policy Types', () => {
  it('should have default freeze policy with category roles', () => {
    assert.ok(DEFAULT_FREEZE_POLICY);
    assert.deepStrictEqual(DEFAULT_FREEZE_POLICY.categoryRoles.audit, ['cio', 'security']);
    assert.deepStrictEqual(DEFAULT_FREEZE_POLICY.categoryRoles.election, ['cio']);
    assert.deepStrictEqual(DEFAULT_FREEZE_POLICY.categoryRoles.incident, [
      'security',
      'engineering',
    ]);
    assert.deepStrictEqual(DEFAULT_FREEZE_POLICY.categoryRoles.compliance, ['cio', 'security']);
  });

  it('should have default freeze policy with duration limits', () => {
    assert.strictEqual(DEFAULT_FREEZE_POLICY.maxDurationHours, 168); // 7 days
    assert.strictEqual(DEFAULT_FREEZE_POLICY.defaultDurationHours, 72); // 3 days
    assert.strictEqual(DEFAULT_FREEZE_POLICY.failClosedOnInvalidFreeze, true);
  });

  it('should have default freeze state as inactive', () => {
    assert.ok(DEFAULT_FREEZE_STATE);
    assert.strictEqual(DEFAULT_FREEZE_STATE.active, false);
    assert.strictEqual(DEFAULT_FREEZE_STATE.category, null);
    assert.strictEqual(DEFAULT_FREEZE_STATE.reason, null);
  });
});

describe('Phase 4N39: Freeze Authorization', () => {
  it('should authorize cio for audit freeze', () => {
    const result = checkFreezeAuthorization('audit', 'cio');
    assert.strictEqual(result.authorized, true);
    assert.strictEqual(result.error, undefined);
  });

  it('should authorize security for audit freeze', () => {
    const result = checkFreezeAuthorization('audit', 'security');
    assert.strictEqual(result.authorized, true);
  });

  it('should deny engineering for audit freeze', () => {
    const result = checkFreezeAuthorization('audit', 'engineering');
    assert.strictEqual(result.authorized, false);
    assert.ok(result.error?.includes('engineering'));
  });

  it('should only authorize cio for election freeze', () => {
    const cio = checkFreezeAuthorization('election', 'cio');
    const security = checkFreezeAuthorization('election', 'security');
    const engineering = checkFreezeAuthorization('election', 'engineering');

    assert.strictEqual(cio.authorized, true);
    assert.strictEqual(security.authorized, false);
    assert.strictEqual(engineering.authorized, false);
  });

  it('should authorize security and engineering for incident freeze', () => {
    const security = checkFreezeAuthorization('incident', 'security');
    const engineering = checkFreezeAuthorization('incident', 'engineering');
    const cio = checkFreezeAuthorization('incident', 'cio');

    assert.strictEqual(security.authorized, true);
    assert.strictEqual(engineering.authorized, true);
    assert.strictEqual(cio.authorized, false);
  });

  it('should return required roles in result', () => {
    const result = checkFreezeAuthorization('audit', 'engineering');
    assert.deepStrictEqual(result.requiredRoles, ['cio', 'security']);
  });
});

describe('Phase 4N39: Freeze/Unfreeze Operations', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should freeze autonomy with authorized role', () => {
    const state = createValidState();
    const filePath = createTempStateFile(tempDir, state);

    const result = freezeAutonomy(
      {
        category: 'audit',
        reason: 'Q2 audit week',
        actor: 'test-cio',
        actorRole: 'cio',
        ticketId: 'AUDIT-2026-Q2',
        duration: '72h',
      },
      filePath
    );

    assert.strictEqual(result.authorized, true);
    assert.ok(result.state.freeze?.active);
    assert.strictEqual(result.state.freeze?.category, 'audit');
    assert.strictEqual(result.state.freeze?.reason, 'Q2 audit week');
    assert.strictEqual(result.state.freeze?.setBy, 'test-cio');
    assert.strictEqual(result.state.freeze?.setByRole, 'cio');
    assert.strictEqual(result.state.freeze?.ticketId, 'AUDIT-2026-Q2');
    assert.ok(result.state.freeze?.expiresAt);
  });

  it('should deny freeze with unauthorized role', () => {
    const state = createValidState();
    const filePath = createTempStateFile(tempDir, state);

    const result = freezeAutonomy(
      {
        category: 'audit',
        reason: 'Unauthorized attempt',
        actor: 'rogue-engineer',
        actorRole: 'engineering',
      },
      filePath
    );

    assert.strictEqual(result.authorized, false);
    assert.ok(result.error?.includes('engineering'));
    // State should not be modified
    const reloaded = loadAutonomyState(filePath);
    assert.strictEqual(reloaded?.freeze?.active, undefined);
  });

  it('should add freeze event to history', () => {
    const state = createValidState();
    const filePath = createTempStateFile(tempDir, state);

    freezeAutonomy(
      {
        category: 'incident',
        reason: 'Major incident',
        actor: 'security-lead',
        actorRole: 'security',
      },
      filePath
    );

    const reloaded = loadAutonomyState(filePath);
    assert.ok(reloaded?.freezeHistory);
    assert.strictEqual(reloaded?.freezeHistory?.length, 1);
    assert.strictEqual(reloaded?.freezeHistory?.[0].action, 'freeze');
  });

  it('should unfreeze with authorized role', () => {
    const state = createValidState({
      freeze: {
        active: true,
        category: 'incident',
        reason: 'Major incident',
        setBy: 'security-lead',
        setByRole: 'security',
        setAt: new Date().toISOString(),
        expiresAt: null,
        ticketId: 'INC-123',
      },
      freezeHistory: [],
    });
    const filePath = createTempStateFile(tempDir, state);

    const result = unfreezeAutonomy(
      {
        actor: 'eng-lead',
        actorRole: 'engineering', // engineering can unfreeze incident
        reason: 'Incident resolved',
      },
      filePath
    );

    assert.strictEqual(result.authorized, true);
    assert.strictEqual(result.state.freeze?.active, false);
  });

  it('should deny unfreeze with unauthorized role', () => {
    const state = createValidState({
      freeze: {
        active: true,
        category: 'audit', // Only cio/security can unfreeze audit
        reason: 'Audit week',
        setBy: 'cio',
        setByRole: 'cio',
        setAt: new Date().toISOString(),
        expiresAt: null,
        ticketId: 'AUDIT-2026',
      },
      freezeHistory: [],
    });
    const filePath = createTempStateFile(tempDir, state);

    const result = unfreezeAutonomy(
      {
        actor: 'eng-lead',
        actorRole: 'engineering', // engineering cannot unfreeze audit
      },
      filePath
    );

    assert.strictEqual(result.authorized, false);
    assert.ok(result.error?.includes('engineering'));
    // State should remain frozen
    const reloaded = loadAutonomyState(filePath);
    assert.strictEqual(reloaded?.freeze?.active, true);
  });
});

describe('Phase 4N39: Freeze Blocks ALL Actors', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should block pr-lane when frozen', () => {
    const state = createValidState({
      state: 'active',
      freeze: {
        active: true,
        category: 'audit',
        reason: 'Audit freeze',
        setBy: 'cio',
        setByRole: 'cio',
        setAt: new Date().toISOString(),
        expiresAt: null,
        ticketId: null,
      },
    });
    const filePath = createTempStateFile(tempDir, state);

    const decision = checkAutonomyAllowed({ actor: 'pr-lane' }, filePath);

    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.source, 'frozen');
    assert.ok(decision.freeze?.active);
  });

  it('should block evidence-publisher when frozen', () => {
    const state = createValidState({
      state: 'active',
      freeze: {
        active: true,
        category: 'election',
        reason: 'Election week',
        setBy: 'cio',
        setByRole: 'cio',
        setAt: new Date().toISOString(),
        expiresAt: null,
        ticketId: 'ELEC-2026',
      },
    });
    const filePath = createTempStateFile(tempDir, state);

    const decision = checkAutonomyAllowed({ actor: 'evidence-publisher' }, filePath);

    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.source, 'frozen');
  });

  it('should block incident-publisher when frozen (unlike pause)', () => {
    const state = createValidState({
      state: 'active',
      freeze: {
        active: true,
        category: 'compliance',
        reason: 'Regulatory hold',
        setBy: 'security-lead',
        setByRole: 'security',
        setAt: new Date().toISOString(),
        expiresAt: null,
        ticketId: 'REG-2026-001',
      },
    });
    const filePath = createTempStateFile(tempDir, state);

    const decision = checkAutonomyAllowed({ actor: 'incident-publisher' }, filePath);

    // This is the key difference from pause: incident-publisher is ALSO blocked
    assert.strictEqual(decision.allowed, false);
    assert.strictEqual(decision.source, 'frozen');
  });

  it('should include freeze details in decision', () => {
    const state = createValidState({
      freeze: {
        active: true,
        category: 'audit',
        reason: 'Q2 audit',
        setBy: 'cio',
        setByRole: 'cio',
        setAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        ticketId: 'AUDIT-2026-Q2',
      },
    });
    const filePath = createTempStateFile(tempDir, state);

    const decision = checkAutonomyAllowed({ actor: 'pr-lane' }, filePath);

    assert.ok(decision.freeze);
    assert.strictEqual(decision.freeze.category, 'audit');
    assert.strictEqual(decision.freeze.reason, 'Q2 audit');
    assert.strictEqual(decision.freeze.setBy, 'cio');
    assert.strictEqual(decision.freeze.ticketId, 'AUDIT-2026-Q2');
    assert.ok(decision.freeze.expiresAt);
  });
});

describe('Phase 4N39: Freeze TTL Auto-Expiry', () => {
  it('should detect expired freeze', () => {
    const pastTime = new Date(Date.now() - 3600000).toISOString();
    assert.strictEqual(isFreezeExpired(pastTime), true);
  });

  it('should detect non-expired freeze', () => {
    const futureTime = new Date(Date.now() + 3600000).toISOString();
    assert.strictEqual(isFreezeExpired(futureTime), false);
  });

  it('should treat null expiresAt as never expires', () => {
    assert.strictEqual(isFreezeExpired(null), false);
  });

  it('should auto-unfreeze when TTL expires', () => {
    const tempDir = createTempDir();
    try {
      const state = createValidState({
        state: 'active',
        freeze: {
          active: true,
          category: 'incident',
          reason: 'Temporary freeze',
          setBy: 'security',
          setByRole: 'security',
          setAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() - 1000).toISOString(), // Already expired
          ticketId: null,
        },
      });
      const filePath = createTempStateFile(tempDir, state);

      const decision = checkAutonomyAllowed({ actor: 'pr-lane' }, filePath);

      // Should be allowed because freeze expired
      assert.strictEqual(decision.allowed, true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe('Phase 4N39: Freeze Evidence', () => {
  it('should generate freeze evidence', () => {
    const evidence = generateFreezeEvidence('freeze', {
      actor: 'cio',
      actorRole: 'cio',
      category: 'audit',
      reason: 'Q2 audit',
      ticketId: 'AUDIT-2026-Q2',
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      authorized: true,
    });

    assert.strictEqual(evidence.schema, 'terrafusion.autonomy.freeze.v1');
    assert.strictEqual(evidence.toolVersion, '4N39.1');
    assert.strictEqual(evidence.action, 'freeze');
    assert.strictEqual(evidence.actor, 'cio');
    assert.strictEqual(evidence.category, 'audit');
    assert.strictEqual(evidence.authorized, true);
    assert.ok(evidence.timestamp);
  });

  it('should generate unfreeze evidence', () => {
    const evidence = generateFreezeEvidence('unfreeze', {
      actor: 'security-lead',
      actorRole: 'security',
      category: null,
      reason: 'Audit complete',
      ticketId: 'AUDIT-2026-Q2',
      expiresAt: null,
      authorized: true,
    });

    assert.strictEqual(evidence.action, 'unfreeze');
    assert.strictEqual(evidence.actor, 'security-lead');
    assert.strictEqual(evidence.authorized, true);
  });
});

describe('Phase 4N39: Freeze Duration Enforcement', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should apply default duration when none specified', () => {
    const state = createValidState();
    const filePath = createTempStateFile(tempDir, state);

    const result = freezeAutonomy(
      {
        category: 'incident',
        reason: 'Test freeze',
        actor: 'security',
        actorRole: 'security',
      },
      filePath
    );

    assert.ok(result.state.freeze?.expiresAt);
    // Should expire in ~72 hours (default)
    const expires = new Date(result.state.freeze!.expiresAt!);
    const now = new Date();
    const hoursUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);
    assert.ok(hoursUntilExpiry > 71 && hoursUntilExpiry < 73);
  });

  it('should enforce max duration limit', () => {
    const state = createValidState();
    const filePath = createTempStateFile(tempDir, state);

    const result = freezeAutonomy(
      {
        category: 'incident',
        reason: 'Test freeze',
        actor: 'security',
        actorRole: 'security',
        duration: '30d', // 30 days - exceeds 7 day max
      },
      filePath
    );

    // Should be capped at 7 days
    const expires = new Date(result.state.freeze!.expiresAt!);
    const now = new Date();
    const hoursUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);
    assert.ok(hoursUntilExpiry <= 168); // 7 days = 168 hours
  });
});
