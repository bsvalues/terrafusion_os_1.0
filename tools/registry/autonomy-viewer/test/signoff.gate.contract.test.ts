/**
 * Sign-off Gate Contract Tests
 * ==============================
 *
 * Phase IVc: Validates CI/CD sign-off gating integration.
 *
 * Contract:
 * - gate_blocks_without_valid_signoff: CI fails if signoff missing/invalid
 * - gate_validates_signoff_freshness: expired signoffs rejected
 * - gate_validates_signoff_scope_match: signoff must match target
 * - gate_emits_audit_event_on_decision: all gate decisions are auditable
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// Types for Sign-off Gate
// ============================================================================

/**
 * Deployment environment.
 */
type DeploymentEnvironment = 'development' | 'staging' | 'production';

/**
 * Pipeline stage.
 */
type PipelineStage = 'silent' | 'log_only' | 'ticket_on_high' | 'page_on_critical' | 'full_paging';

/**
 * Sign-off artifact.
 */
interface SignoffArtifact {
  readonly id: string;
  readonly reportId: string;
  readonly operatorIdHash: string;
  readonly decision: 'approved' | 'rejected' | 'deferred';
  readonly timestamp: string;
  readonly environment: DeploymentEnvironment;
  readonly targetStage: PipelineStage;
  readonly conditions?: readonly string[];
  readonly expiresAt: string;
  readonly checksumSha256: string;
}

/**
 * Gate request.
 */
interface GateRequest {
  readonly pipelineId: string;
  readonly environment: DeploymentEnvironment;
  readonly currentStage: PipelineStage;
  readonly targetStage: PipelineStage;
  readonly signoffArtifact?: SignoffArtifact;
  readonly correlationId: string;
  readonly requestedAt: string;
}

/**
 * Gate result.
 */
interface GateResult {
  readonly allowed: boolean;
  readonly pipelineId: string;
  readonly correlationId: string;
  readonly decision: 'pass' | 'fail';
  readonly reasons: readonly string[];
  readonly validatedAt: string;
  readonly signoffId?: string;
}

/**
 * Gate audit event.
 */
interface GateAuditEvent {
  readonly eventId: string;
  readonly eventType: 'gate_check_started' | 'gate_check_passed' | 'gate_check_failed';
  readonly pipelineId: string;
  readonly correlationId: string;
  readonly environment: DeploymentEnvironment;
  readonly targetStage: PipelineStage;
  readonly decision: 'pass' | 'fail';
  readonly reasons: readonly string[];
  readonly signoffId?: string;
  readonly timestamp: string;
}

/**
 * Freshness config.
 */
interface FreshnessConfig {
  readonly maxAgeHours: Record<DeploymentEnvironment, number>;
  readonly strictMode: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_FRESHNESS_CONFIG: FreshnessConfig = {
  maxAgeHours: {
    development: 168, // 7 days
    staging: 72, // 3 days
    production: 24, // 1 day
  },
  strictMode: true,
};

const STAGES_REQUIRING_SIGNOFF: PipelineStage[] = ['page_on_critical', 'full_paging'];

// ============================================================================
// Mock Implementations
// ============================================================================

const gateAuditEvents: GateAuditEvent[] = [];

/**
 * Reset mocks.
 */
function resetMocks(): void {
  gateAuditEvents.length = 0;
}

/**
 * Check if stage requires signoff.
 */
function requiresSignoff(targetStage: PipelineStage, environment: DeploymentEnvironment): boolean {
  if (environment === 'production') return true;
  return STAGES_REQUIRING_SIGNOFF.includes(targetStage);
}

/**
 * Validate signoff freshness.
 */
function validateFreshness(
  artifact: SignoffArtifact,
  config: FreshnessConfig,
  now: Date = new Date()
): { fresh: boolean; ageHours: number; maxHours: number } {
  const createdAt = new Date(artifact.timestamp);
  const ageMs = now.getTime() - createdAt.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const maxHours = config.maxAgeHours[artifact.environment];

  return {
    fresh: ageHours <= maxHours,
    ageHours: Math.round(ageHours * 10) / 10,
    maxHours,
  };
}

/**
 * Validate signoff expiry.
 */
function validateExpiry(artifact: SignoffArtifact, now: Date = new Date()): { valid: boolean; expiredAgo?: string } {
  const expiresAt = new Date(artifact.expiresAt);
  if (expiresAt > now) {
    return { valid: true };
  }

  const expiredMs = now.getTime() - expiresAt.getTime();
  const expiredHours = Math.round((expiredMs / (1000 * 60 * 60)) * 10) / 10;
  return { valid: false, expiredAgo: `${expiredHours}h ago` };
}

/**
 * Validate signoff scope.
 */
function validateScope(
  artifact: SignoffArtifact,
  targetStage: PipelineStage,
  environment: DeploymentEnvironment
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (artifact.environment !== environment) {
    issues.push(`Signoff for ${artifact.environment} does not match ${environment}`);
  }

  if (artifact.targetStage !== targetStage) {
    issues.push(`Signoff for stage ${artifact.targetStage} does not match ${targetStage}`);
  }

  if (artifact.decision !== 'approved') {
    issues.push(`Signoff decision is ${artifact.decision}, not approved`);
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Validate operator ID format.
 */
function validateOperatorId(operatorIdHash: string): boolean {
  return operatorIdHash.startsWith('sha256:') && operatorIdHash.length === 71;
}

/**
 * Validate checksum format.
 */
function validateChecksum(checksum: string): boolean {
  return checksum.startsWith('sha256:') && checksum.length >= 20;
}

/**
 * Evaluate gate.
 */
function evaluateGate(
  request: GateRequest,
  freshnessConfig: FreshnessConfig = DEFAULT_FRESHNESS_CONFIG
): GateResult {
  const reasons: string[] = [];
  const now = new Date();

  // Emit started event
  gateAuditEvents.push({
    eventId: `gate-start-${Date.now()}`,
    eventType: 'gate_check_started',
    pipelineId: request.pipelineId,
    correlationId: request.correlationId,
    environment: request.environment,
    targetStage: request.targetStage,
    decision: 'pass', // Placeholder
    reasons: [],
    timestamp: now.toISOString(),
  });

  // Check if signoff required
  if (!requiresSignoff(request.targetStage, request.environment)) {
    const result: GateResult = {
      allowed: true,
      pipelineId: request.pipelineId,
      correlationId: request.correlationId,
      decision: 'pass',
      reasons: ['Signoff not required for this stage/environment'],
      validatedAt: now.toISOString(),
    };

    gateAuditEvents.push({
      eventId: `gate-pass-${Date.now()}`,
      eventType: 'gate_check_passed',
      pipelineId: request.pipelineId,
      correlationId: request.correlationId,
      environment: request.environment,
      targetStage: request.targetStage,
      decision: 'pass',
      reasons: result.reasons,
      timestamp: now.toISOString(),
    });

    return result;
  }

  // Check signoff exists
  if (!request.signoffArtifact) {
    reasons.push('Signoff artifact required but not provided');

    const result: GateResult = {
      allowed: false,
      pipelineId: request.pipelineId,
      correlationId: request.correlationId,
      decision: 'fail',
      reasons,
      validatedAt: now.toISOString(),
    };

    gateAuditEvents.push({
      eventId: `gate-fail-${Date.now()}`,
      eventType: 'gate_check_failed',
      pipelineId: request.pipelineId,
      correlationId: request.correlationId,
      environment: request.environment,
      targetStage: request.targetStage,
      decision: 'fail',
      reasons,
      timestamp: now.toISOString(),
    });

    return result;
  }

  const artifact = request.signoffArtifact;

  // Validate operator ID
  if (!validateOperatorId(artifact.operatorIdHash)) {
    reasons.push('Invalid operator ID format (must be sha256 hash)');
  }

  // Validate checksum
  if (!validateChecksum(artifact.checksumSha256)) {
    reasons.push('Invalid checksum format');
  }

  // Validate scope
  const scopeResult = validateScope(artifact, request.targetStage, request.environment);
  if (!scopeResult.valid) {
    reasons.push(...scopeResult.issues);
  }

  // Validate expiry
  const expiryResult = validateExpiry(artifact, now);
  if (!expiryResult.valid) {
    reasons.push(`Signoff expired ${expiryResult.expiredAgo}`);
  }

  // Validate freshness
  const freshnessResult = validateFreshness(artifact, freshnessConfig, now);
  if (!freshnessResult.fresh) {
    reasons.push(`Signoff too old: ${freshnessResult.ageHours}h > max ${freshnessResult.maxHours}h`);
  }

  const allowed = reasons.length === 0;
  const decision = allowed ? 'pass' : 'fail';

  const result: GateResult = {
    allowed,
    pipelineId: request.pipelineId,
    correlationId: request.correlationId,
    decision,
    reasons: allowed ? ['All validations passed'] : reasons,
    validatedAt: now.toISOString(),
    signoffId: artifact.id,
  };

  gateAuditEvents.push({
    eventId: `gate-${decision}-${Date.now()}`,
    eventType: allowed ? 'gate_check_passed' : 'gate_check_failed',
    pipelineId: request.pipelineId,
    correlationId: request.correlationId,
    environment: request.environment,
    targetStage: request.targetStage,
    decision,
    reasons: result.reasons,
    signoffId: artifact.id,
    timestamp: now.toISOString(),
  });

  return result;
}

/**
 * Get gate audit events by correlation ID.
 */
function getGateEventsByCorrelation(correlationId: string): readonly GateAuditEvent[] {
  return gateAuditEvents.filter((e) => e.correlationId === correlationId);
}

/**
 * Generate valid correlation ID.
 */
function generateCorrelationId(): string {
  const hexPart = () => Math.random().toString(16).slice(2, 10).padEnd(8, '0');
  return `${hexPart()}-${hexPart().slice(0, 4)}-${hexPart().slice(0, 4)}-${hexPart().slice(0, 4)}-${hexPart()}${hexPart().slice(0, 4)}`;
}

/**
 * Create valid signoff artifact.
 */
function createValidSignoff(
  environment: DeploymentEnvironment,
  targetStage: PipelineStage
): SignoffArtifact {
  const expiryHours = DEFAULT_FRESHNESS_CONFIG.maxAgeHours[environment];
  return {
    id: `signoff-${Date.now()}`,
    reportId: `report-${Date.now()}`,
    operatorIdHash: 'sha256:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
    decision: 'approved',
    timestamp: new Date().toISOString(),
    environment,
    targetStage,
    expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
    checksumSha256: 'sha256:checksum1234567890abcdef',
  };
}

/**
 * Create expired signoff artifact.
 */
function createExpiredSignoff(
  environment: DeploymentEnvironment,
  targetStage: PipelineStage
): SignoffArtifact {
  return {
    id: `signoff-${Date.now()}`,
    reportId: `report-${Date.now()}`,
    operatorIdHash: 'sha256:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
    decision: 'approved',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    environment,
    targetStage,
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    checksumSha256: 'sha256:checksum1234567890abcdef',
  };
}

/**
 * Create stale signoff artifact.
 */
function createStaleSignoff(
  environment: DeploymentEnvironment,
  targetStage: PipelineStage
): SignoffArtifact {
  const maxHours = DEFAULT_FRESHNESS_CONFIG.maxAgeHours[environment];
  const staleHours = maxHours + 24; // Older than max

  return {
    id: `signoff-${Date.now()}`,
    reportId: `report-${Date.now()}`,
    operatorIdHash: 'sha256:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
    decision: 'approved',
    timestamp: new Date(Date.now() - staleHours * 60 * 60 * 1000).toISOString(),
    environment,
    targetStage,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Not expired but stale
    checksumSha256: 'sha256:checksum1234567890abcdef',
  };
}

// ============================================================================
// Contract: gate_blocks_without_valid_signoff
// ============================================================================

describe('Sign-off Gate Contract', () => {
  describe('gate_blocks_without_valid_signoff', () => {
    it('should block production without signoff', () => {
      resetMocks();

      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId: generateCorrelationId(),
        requestedAt: new Date().toISOString(),
        // No signoffArtifact
      };

      const result = evaluateGate(request);

      assert.ok(!result.allowed);
      assert.equal(result.decision, 'fail');
      assert.ok(result.reasons.some((r) => r.includes('required')));
    });

    it('should allow production with valid signoff', () => {
      resetMocks();

      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        signoffArtifact: createValidSignoff('production', 'ticket_on_high'),
        correlationId: generateCorrelationId(),
        requestedAt: new Date().toISOString(),
      };

      const result = evaluateGate(request);

      assert.ok(result.allowed);
      assert.equal(result.decision, 'pass');
    });

    it('should allow staging low stages without signoff', () => {
      resetMocks();

      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'staging',
        currentStage: 'silent',
        targetStage: 'log_only',
        correlationId: generateCorrelationId(),
        requestedAt: new Date().toISOString(),
        // No signoffArtifact, but not required for low stages
      };

      const result = evaluateGate(request);

      assert.ok(result.allowed);
    });

    it('should block staging high stages without signoff', () => {
      resetMocks();

      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'staging',
        currentStage: 'ticket_on_high',
        targetStage: 'page_on_critical',
        correlationId: generateCorrelationId(),
        requestedAt: new Date().toISOString(),
        // No signoffArtifact
      };

      const result = evaluateGate(request);

      assert.ok(!result.allowed);
    });

    it('should reject non-approved signoff', () => {
      resetMocks();

      const signoff = createValidSignoff('production', 'ticket_on_high');
      // @ts-expect-error - Modifying readonly for test
      signoff.decision = 'deferred';

      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        signoffArtifact: signoff,
        correlationId: generateCorrelationId(),
        requestedAt: new Date().toISOString(),
      };

      const result = evaluateGate(request);

      assert.ok(!result.allowed);
      assert.ok(result.reasons.some((r) => r.includes('decision')));
    });
  });

  // ============================================================================
  // Contract: gate_validates_signoff_freshness
  // ============================================================================

  describe('gate_validates_signoff_freshness', () => {
    it('should reject expired signoff', () => {
      resetMocks();

      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        signoffArtifact: createExpiredSignoff('production', 'ticket_on_high'),
        correlationId: generateCorrelationId(),
        requestedAt: new Date().toISOString(),
      };

      const result = evaluateGate(request);

      assert.ok(!result.allowed);
      assert.ok(result.reasons.some((r) => r.includes('expired')));
    });

    it('should reject stale signoff', () => {
      resetMocks();

      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        signoffArtifact: createStaleSignoff('production', 'ticket_on_high'),
        correlationId: generateCorrelationId(),
        requestedAt: new Date().toISOString(),
      };

      const result = evaluateGate(request);

      assert.ok(!result.allowed);
      assert.ok(result.reasons.some((r) => r.includes('too old')));
    });

    it('should have stricter freshness for production', () => {
      assert.ok(
        DEFAULT_FRESHNESS_CONFIG.maxAgeHours.production <
          DEFAULT_FRESHNESS_CONFIG.maxAgeHours.staging
      );
      assert.ok(
        DEFAULT_FRESHNESS_CONFIG.maxAgeHours.staging <
          DEFAULT_FRESHNESS_CONFIG.maxAgeHours.development
      );
    });

    it('should validate freshness correctly', () => {
      const existingArtifact = createValidSignoff('production', 'ticket_on_high');
      const freshnessResult = validateFreshness(existingArtifact, DEFAULT_FRESHNESS_CONFIG);

      assert.ok(freshnessResult.fresh);
      assert.ok(freshnessResult.ageHours < freshnessResult.maxHours);
    });
  });

  // ============================================================================
  // Contract: gate_validates_signoff_scope_match
  // ============================================================================

  describe('gate_validates_signoff_scope_match', () => {
    it('should reject signoff for wrong environment', () => {
      resetMocks();

      const stagingSignoff = createValidSignoff('staging', 'ticket_on_high');

      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'production', // Different from signoff
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        signoffArtifact: stagingSignoff,
        correlationId: generateCorrelationId(),
        requestedAt: new Date().toISOString(),
      };

      const result = evaluateGate(request);

      assert.ok(!result.allowed);
      assert.ok(result.reasons.some((r) => r.includes('does not match')));
    });

    it('should reject signoff for wrong stage', () => {
      resetMocks();

      const wrongStageSignoff = createValidSignoff('production', 'page_on_critical');

      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high', // Different from signoff
        signoffArtifact: wrongStageSignoff,
        correlationId: generateCorrelationId(),
        requestedAt: new Date().toISOString(),
      };

      const result = evaluateGate(request);

      assert.ok(!result.allowed);
      assert.ok(result.reasons.some((r) => r.includes('stage')));
    });

    it('should validate scope correctly', () => {
      const artifact = createValidSignoff('production', 'ticket_on_high');
      const scopeResult = validateScope(artifact, 'ticket_on_high', 'production');

      assert.ok(scopeResult.valid);
      assert.equal(scopeResult.issues.length, 0);
    });

    it('should require sha256 operator ID', () => {
      const artifact = createValidSignoff('production', 'ticket_on_high');
      assert.ok(validateOperatorId(artifact.operatorIdHash));
      assert.ok(!validateOperatorId('user_12345'));
      assert.ok(!validateOperatorId('plain-id'));
    });
  });

  // ============================================================================
  // Contract: gate_emits_audit_event_on_decision
  // ============================================================================

  describe('gate_emits_audit_event_on_decision', () => {
    it('should emit audit events with correlation ID', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        signoffArtifact: createValidSignoff('production', 'ticket_on_high'),
        correlationId,
        requestedAt: new Date().toISOString(),
      };

      evaluateGate(request);

      const events = getGateEventsByCorrelation(correlationId);
      assert.ok(events.length > 0);
      assert.ok(events.every((e) => e.correlationId === correlationId));
    });

    it('should emit started and passed/failed events', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        signoffArtifact: createValidSignoff('production', 'ticket_on_high'),
        correlationId,
        requestedAt: new Date().toISOString(),
      };

      evaluateGate(request);

      const events = getGateEventsByCorrelation(correlationId);
      const types = events.map((e) => e.eventType);

      assert.ok(types.includes('gate_check_started'));
      assert.ok(types.includes('gate_check_passed'));
    });

    it('should emit failed event on rejection', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId,
        requestedAt: new Date().toISOString(),
        // No signoff
      };

      evaluateGate(request);

      const events = getGateEventsByCorrelation(correlationId);
      assert.ok(events.some((e) => e.eventType === 'gate_check_failed'));
    });

    it('should include signoff ID in audit event', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const signoff = createValidSignoff('production', 'ticket_on_high');

      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        signoffArtifact: signoff,
        correlationId,
        requestedAt: new Date().toISOString(),
      };

      evaluateGate(request);

      const events = getGateEventsByCorrelation(correlationId);
      assert.ok(events.some((e) => e.signoffId === signoff.id));
    });

    it('should include rejection reasons in audit event', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const request: GateRequest = {
        pipelineId: 'pipeline-123',
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId,
        requestedAt: new Date().toISOString(),
        // No signoff
      };

      evaluateGate(request);

      const events = getGateEventsByCorrelation(correlationId);
      const failedEvent = events.find((e) => e.eventType === 'gate_check_failed');

      assert.ok(failedEvent);
      assert.ok(failedEvent.reasons.length > 0);
    });
  });
});
