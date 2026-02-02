/**
 * Pipeline Promotion Contract Tests
 * ===================================
 *
 * Phase IVc: Validates CI/CD pipeline promotion wiring.
 *
 * Contract:
 * - promotion_requires_passing_acceptance_evaluation: no deploy without green gates
 * - promotion_requires_operator_signoff_artifact: signed approval required
 * - promotion_dry_run_validates_without_execution: CI preview mode
 * - promotion_emits_deployment_event_with_correlation: audit trail
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ============================================================================
// Types for Pipeline Promotion
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
 * Acceptance evaluation result.
 */
interface AcceptanceEvaluation {
  readonly passed: boolean;
  readonly environment: DeploymentEnvironment;
  readonly currentStage: PipelineStage;
  readonly targetStage: PipelineStage;
  readonly sloAttainment: {
    readonly notificationSuccess: number;
    readonly auditDrainP95Ms: number;
    readonly dedupeEffectiveness: number;
    readonly suppressionSuccess: number;
  };
  readonly observationWindow: {
    readonly effectiveDays: number;
    readonly sampleCount: number;
    readonly confidence: number;
  };
  readonly blockers: readonly string[];
  readonly evaluatedAt: string;
}

/**
 * Operator sign-off artifact.
 */
interface SignoffArtifact {
  readonly id: string;
  readonly reportId: string;
  readonly operatorIdHash: string; // sha256 only
  readonly decision: 'approved' | 'rejected' | 'deferred';
  readonly timestamp: string;
  readonly environment: DeploymentEnvironment;
  readonly targetStage: PipelineStage;
  readonly conditions?: readonly string[];
  readonly expiresAt: string;
  readonly checksumSha256: string;
}

/**
 * Pipeline promotion request.
 */
interface PromotionRequest {
  readonly environment: DeploymentEnvironment;
  readonly currentStage: PipelineStage;
  readonly targetStage: PipelineStage;
  readonly correlationId: string;
  readonly dryRun: boolean;
  readonly acceptanceEvaluation: AcceptanceEvaluation;
  readonly signoffArtifact?: SignoffArtifact;
  readonly triggeredBy: 'ci' | 'operator' | 'scheduled';
}

/**
 * Pipeline promotion result.
 */
interface PromotionResult {
  readonly success: boolean;
  readonly dryRun: boolean;
  readonly previousStage: PipelineStage;
  readonly currentStage: PipelineStage;
  readonly correlationId: string;
  readonly deploymentId?: string;
  readonly blockedReasons?: readonly string[];
  readonly timestamp: string;
}

/**
 * Deployment event.
 */
interface DeploymentEvent {
  readonly eventId: string;
  readonly eventType: 'promotion_started' | 'promotion_completed' | 'promotion_blocked' | 'promotion_dry_run';
  readonly correlationId: string;
  readonly environment: DeploymentEnvironment;
  readonly previousStage: PipelineStage;
  readonly targetStage: PipelineStage;
  readonly triggeredBy: string;
  readonly timestamp: string;
  readonly dryRun: boolean;
  readonly outcome: 'success' | 'blocked' | 'failed';
  readonly blockedReasons?: readonly string[];
}

// ============================================================================
// Constants
// ============================================================================

const STAGE_ORDER: PipelineStage[] = ['silent', 'log_only', 'ticket_on_high', 'page_on_critical', 'full_paging'];

const SLO_TARGETS = {
  notificationSuccess: 0.99,
  auditDrainP95Ms: 5000,
  dedupeEffectiveness: 0.8,
  suppressionSuccess: 0.995,
} as const;

const SIGNOFF_EXPIRY_HOURS = {
  development: 168, // 7 days
  staging: 72, // 3 days
  production: 24, // 1 day
} as const;

// ============================================================================
// Mock Implementations
// ============================================================================

const deploymentEvents: DeploymentEvent[] = [];

/**
 * Reset mocks.
 */
function resetMocks(): void {
  deploymentEvents.length = 0;
}

/**
 * Get stage index.
 */
function getStageIndex(stage: PipelineStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/**
 * Check if promotion is valid (monotonic forward).
 */
function isValidPromotion(current: PipelineStage, target: PipelineStage): boolean {
  const currentIdx = getStageIndex(current);
  const targetIdx = getStageIndex(target);
  return targetIdx === currentIdx + 1; // Only one-step promotion
}

/**
 * Validate acceptance evaluation.
 */
function validateAcceptanceEvaluation(eval_: AcceptanceEvaluation): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (eval_.sloAttainment.notificationSuccess < SLO_TARGETS.notificationSuccess) {
    issues.push(`Notification success ${(eval_.sloAttainment.notificationSuccess * 100).toFixed(1)}% < ${(SLO_TARGETS.notificationSuccess * 100).toFixed(1)}%`);
  }
  if (eval_.sloAttainment.auditDrainP95Ms > SLO_TARGETS.auditDrainP95Ms) {
    issues.push(`Audit drain p95 ${eval_.sloAttainment.auditDrainP95Ms}ms > ${SLO_TARGETS.auditDrainP95Ms}ms`);
  }
  if (eval_.sloAttainment.dedupeEffectiveness < SLO_TARGETS.dedupeEffectiveness) {
    issues.push(`Dedupe effectiveness ${(eval_.sloAttainment.dedupeEffectiveness * 100).toFixed(1)}% < ${(SLO_TARGETS.dedupeEffectiveness * 100).toFixed(1)}%`);
  }
  if (eval_.sloAttainment.suppressionSuccess < SLO_TARGETS.suppressionSuccess) {
    issues.push(`Suppression success ${(eval_.sloAttainment.suppressionSuccess * 100).toFixed(1)}% < ${(SLO_TARGETS.suppressionSuccess * 100).toFixed(1)}%`);
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Validate sign-off artifact.
 */
function validateSignoffArtifact(
  artifact: SignoffArtifact | undefined,
  targetStage: PipelineStage,
  environment: DeploymentEnvironment,
  now: Date = new Date()
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!artifact) {
    issues.push('Sign-off artifact required');
    return { valid: false, issues };
  }

  if (artifact.decision !== 'approved') {
    issues.push(`Sign-off decision is '${artifact.decision}', not 'approved'`);
  }

  if (artifact.targetStage !== targetStage) {
    issues.push(`Sign-off for stage '${artifact.targetStage}' does not match target '${targetStage}'`);
  }

  if (artifact.environment !== environment) {
    issues.push(`Sign-off for environment '${artifact.environment}' does not match '${environment}'`);
  }

  const expiresAt = new Date(artifact.expiresAt);
  if (expiresAt < now) {
    issues.push(`Sign-off expired at ${artifact.expiresAt}`);
  }

  if (!artifact.operatorIdHash.startsWith('sha256:')) {
    issues.push('Operator ID must be sha256 hash');
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Check if high-stage requires extended observation.
 */
function requiresObservationWindow(stage: PipelineStage): boolean {
  return getStageIndex(stage) >= getStageIndex('page_on_critical');
}

/**
 * Execute pipeline promotion.
 */
function executePromotion(request: PromotionRequest): PromotionResult {
  const blockedReasons: string[] = [];

  // Validate monotonic progression
  if (!isValidPromotion(request.currentStage, request.targetStage)) {
    blockedReasons.push(`Invalid promotion: ${request.currentStage} -> ${request.targetStage}`);
  }

  // Validate acceptance evaluation
  if (!request.acceptanceEvaluation.passed) {
    blockedReasons.push('Acceptance evaluation failed');
    blockedReasons.push(...request.acceptanceEvaluation.blockers);
  }

  const evalResult = validateAcceptanceEvaluation(request.acceptanceEvaluation);
  if (!evalResult.valid) {
    blockedReasons.push(...evalResult.issues);
  }

  // Validate sign-off for production and high stages
  if (request.environment === 'production' || requiresObservationWindow(request.targetStage)) {
    const signoffResult = validateSignoffArtifact(
      request.signoffArtifact,
      request.targetStage,
      request.environment
    );
    if (!signoffResult.valid) {
      blockedReasons.push(...signoffResult.issues);
    }
  }

  // Validate observation window for high stages
  if (requiresObservationWindow(request.targetStage)) {
    if (request.acceptanceEvaluation.observationWindow.effectiveDays < 7) {
      blockedReasons.push(`Observation window ${request.acceptanceEvaluation.observationWindow.effectiveDays}d < 7d required`);
    }
  }

  const success = blockedReasons.length === 0;
  const eventType: DeploymentEvent['eventType'] = request.dryRun
    ? 'promotion_dry_run'
    : success
      ? 'promotion_completed'
      : 'promotion_blocked';

  const event: DeploymentEvent = {
    eventId: `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventType,
    correlationId: request.correlationId,
    environment: request.environment,
    previousStage: request.currentStage,
    targetStage: request.targetStage,
    triggeredBy: request.triggeredBy,
    timestamp: new Date().toISOString(),
    dryRun: request.dryRun,
    outcome: success ? 'success' : 'blocked',
    blockedReasons: blockedReasons.length > 0 ? blockedReasons : undefined,
  };

  deploymentEvents.push(event);

  return {
    success: request.dryRun ? true : success, // Dry runs always "succeed" (they validate)
    dryRun: request.dryRun,
    previousStage: request.currentStage,
    currentStage: request.dryRun || !success ? request.currentStage : request.targetStage,
    correlationId: request.correlationId,
    deploymentId: success && !request.dryRun ? event.eventId : undefined,
    blockedReasons: blockedReasons.length > 0 ? blockedReasons : undefined,
    timestamp: event.timestamp,
  };
}

/**
 * Get deployment events by correlation ID.
 */
function getDeploymentEventsByCorrelation(correlationId: string): readonly DeploymentEvent[] {
  return deploymentEvents.filter((e) => e.correlationId === correlationId);
}

/**
 * Generate valid correlation ID.
 */
function generateCorrelationId(): string {
  const hexPart = () => Math.random().toString(16).slice(2, 10).padEnd(8, '0');
  return `${hexPart()}-${hexPart().slice(0, 4)}-${hexPart().slice(0, 4)}-${hexPart().slice(0, 4)}-${hexPart()}${hexPart().slice(0, 4)}`;
}

/**
 * Create passing acceptance evaluation.
 */
function createPassingEvaluation(
  environment: DeploymentEnvironment,
  currentStage: PipelineStage,
  targetStage: PipelineStage,
  observationDays: number = 10
): AcceptanceEvaluation {
  return {
    passed: true,
    environment,
    currentStage,
    targetStage,
    sloAttainment: {
      notificationSuccess: 0.995,
      auditDrainP95Ms: 2000,
      dedupeEffectiveness: 0.85,
      suppressionSuccess: 0.998,
    },
    observationWindow: {
      effectiveDays: observationDays,
      sampleCount: 500,
      confidence: 0.95,
    },
    blockers: [],
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Create failing acceptance evaluation.
 */
function createFailingEvaluation(
  environment: DeploymentEnvironment,
  currentStage: PipelineStage,
  targetStage: PipelineStage
): AcceptanceEvaluation {
  return {
    passed: false,
    environment,
    currentStage,
    targetStage,
    sloAttainment: {
      notificationSuccess: 0.97, // Below target
      auditDrainP95Ms: 6000, // Above target
      dedupeEffectiveness: 0.75, // Below target
      suppressionSuccess: 0.998,
    },
    observationWindow: {
      effectiveDays: 5, // Insufficient
      sampleCount: 100,
      confidence: 0.8,
    },
    blockers: ['SLO targets not met', 'Observation window insufficient'],
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Create valid sign-off artifact.
 */
function createValidSignoff(
  environment: DeploymentEnvironment,
  targetStage: PipelineStage
): SignoffArtifact {
  const expiryHours = SIGNOFF_EXPIRY_HOURS[environment];
  return {
    id: `signoff-${Date.now()}`,
    reportId: `report-${Date.now()}`,
    operatorIdHash: 'sha256:abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
    decision: 'approved',
    timestamp: new Date().toISOString(),
    environment,
    targetStage,
    expiresAt: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
    checksumSha256: 'sha256:checksum1234567890',
  };
}

/**
 * Create expired sign-off artifact.
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
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Expired yesterday
    checksumSha256: 'sha256:checksum1234567890',
  };
}

// ============================================================================
// Contract: promotion_requires_passing_acceptance_evaluation
// ============================================================================

describe('Pipeline Promotion Contract', () => {
  describe('promotion_requires_passing_acceptance_evaluation', () => {
    it('should allow promotion with passing evaluation', () => {
      resetMocks();

      const request: PromotionRequest = {
        environment: 'staging',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId: generateCorrelationId(),
        dryRun: false,
        acceptanceEvaluation: createPassingEvaluation('staging', 'log_only', 'ticket_on_high'),
        triggeredBy: 'ci',
      };

      const result = executePromotion(request);

      assert.ok(result.success);
      assert.equal(result.currentStage, 'ticket_on_high');
    });

    it('should block promotion with failing evaluation', () => {
      resetMocks();

      const request: PromotionRequest = {
        environment: 'staging',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId: generateCorrelationId(),
        dryRun: false,
        acceptanceEvaluation: createFailingEvaluation('staging', 'log_only', 'ticket_on_high'),
        triggeredBy: 'ci',
      };

      const result = executePromotion(request);

      assert.ok(!result.success);
      assert.ok(result.blockedReasons && result.blockedReasons.length > 0);
      assert.equal(result.currentStage, 'log_only');
    });

    it('should validate all SLO targets', () => {
      const passingEval = createPassingEvaluation('staging', 'log_only', 'ticket_on_high');
      const result = validateAcceptanceEvaluation(passingEval);

      assert.ok(result.valid);
      assert.equal(result.issues.length, 0);
    });

    it('should detect SLO violations', () => {
      const failingEval = createFailingEvaluation('staging', 'log_only', 'ticket_on_high');
      const result = validateAcceptanceEvaluation(failingEval);

      assert.ok(!result.valid);
      assert.ok(result.issues.length > 0);
    });

    it('should block non-monotonic promotion', () => {
      resetMocks();

      const request: PromotionRequest = {
        environment: 'staging',
        currentStage: 'log_only',
        targetStage: 'full_paging', // Skipping stages
        correlationId: generateCorrelationId(),
        dryRun: false,
        acceptanceEvaluation: createPassingEvaluation('staging', 'log_only', 'full_paging'),
        triggeredBy: 'ci',
      };

      const result = executePromotion(request);

      assert.ok(!result.success);
      assert.ok(result.blockedReasons?.some((r) => r.includes('Invalid promotion')));
    });
  });

  // ============================================================================
  // Contract: promotion_requires_operator_signoff_artifact
  // ============================================================================

  describe('promotion_requires_operator_signoff_artifact', () => {
    it('should require sign-off for production', () => {
      resetMocks();

      const request: PromotionRequest = {
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId: generateCorrelationId(),
        dryRun: false,
        acceptanceEvaluation: createPassingEvaluation('production', 'log_only', 'ticket_on_high'),
        triggeredBy: 'ci',
        // Missing signoffArtifact
      };

      const result = executePromotion(request);

      assert.ok(!result.success);
      assert.ok(result.blockedReasons?.some((r) => r.includes('Sign-off')));
    });

    it('should allow production with valid sign-off', () => {
      resetMocks();

      const request: PromotionRequest = {
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId: generateCorrelationId(),
        dryRun: false,
        acceptanceEvaluation: createPassingEvaluation('production', 'log_only', 'ticket_on_high'),
        signoffArtifact: createValidSignoff('production', 'ticket_on_high'),
        triggeredBy: 'operator',
      };

      const result = executePromotion(request);

      assert.ok(result.success);
    });

    it('should reject expired sign-off', () => {
      resetMocks();

      const request: PromotionRequest = {
        environment: 'production',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId: generateCorrelationId(),
        dryRun: false,
        acceptanceEvaluation: createPassingEvaluation('production', 'log_only', 'ticket_on_high'),
        signoffArtifact: createExpiredSignoff('production', 'ticket_on_high'),
        triggeredBy: 'operator',
      };

      const result = executePromotion(request);

      assert.ok(!result.success);
      assert.ok(result.blockedReasons?.some((r) => r.includes('expired')));
    });

    it('should require sign-off for high stages', () => {
      resetMocks();

      const request: PromotionRequest = {
        environment: 'staging',
        currentStage: 'ticket_on_high',
        targetStage: 'page_on_critical',
        correlationId: generateCorrelationId(),
        dryRun: false,
        acceptanceEvaluation: createPassingEvaluation('staging', 'ticket_on_high', 'page_on_critical'),
        triggeredBy: 'ci',
        // Missing signoffArtifact
      };

      const result = executePromotion(request);

      assert.ok(!result.success);
      assert.ok(result.blockedReasons?.some((r) => r.includes('Sign-off')));
    });

    it('should validate sign-off matches target', () => {
      const artifact = createValidSignoff('production', 'ticket_on_high');
      const result = validateSignoffArtifact(artifact, 'page_on_critical', 'production');

      assert.ok(!result.valid);
      assert.ok(result.issues.some((i) => i.includes('does not match')));
    });
  });

  // ============================================================================
  // Contract: promotion_dry_run_validates_without_execution
  // ============================================================================

  describe('promotion_dry_run_validates_without_execution', () => {
    it('should return success for valid dry run', () => {
      resetMocks();

      const request: PromotionRequest = {
        environment: 'staging',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId: generateCorrelationId(),
        dryRun: true,
        acceptanceEvaluation: createPassingEvaluation('staging', 'log_only', 'ticket_on_high'),
        triggeredBy: 'ci',
      };

      const result = executePromotion(request);

      assert.ok(result.success);
      assert.ok(result.dryRun);
      assert.equal(result.currentStage, 'log_only'); // Stage unchanged
    });

    it('should not create deploymentId for dry run', () => {
      resetMocks();

      const request: PromotionRequest = {
        environment: 'staging',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId: generateCorrelationId(),
        dryRun: true,
        acceptanceEvaluation: createPassingEvaluation('staging', 'log_only', 'ticket_on_high'),
        triggeredBy: 'ci',
      };

      const result = executePromotion(request);

      assert.equal(result.deploymentId, undefined);
    });

    it('should emit dry run event', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const request: PromotionRequest = {
        environment: 'staging',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId,
        dryRun: true,
        acceptanceEvaluation: createPassingEvaluation('staging', 'log_only', 'ticket_on_high'),
        triggeredBy: 'ci',
      };

      executePromotion(request);

      const events = getDeploymentEventsByCorrelation(correlationId);
      assert.ok(events.some((e) => e.eventType === 'promotion_dry_run'));
    });

    it('should report blockers in dry run', () => {
      resetMocks();

      const request: PromotionRequest = {
        environment: 'staging',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId: generateCorrelationId(),
        dryRun: true,
        acceptanceEvaluation: createFailingEvaluation('staging', 'log_only', 'ticket_on_high'),
        triggeredBy: 'ci',
      };

      const result = executePromotion(request);

      assert.ok(result.success); // Dry run succeeded (in running validation)
      assert.ok(result.blockedReasons && result.blockedReasons.length > 0);
    });
  });

  // ============================================================================
  // Contract: promotion_emits_deployment_event_with_correlation
  // ============================================================================

  describe('promotion_emits_deployment_event_with_correlation', () => {
    it('should emit event with correlation ID', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const request: PromotionRequest = {
        environment: 'staging',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId,
        dryRun: false,
        acceptanceEvaluation: createPassingEvaluation('staging', 'log_only', 'ticket_on_high'),
        triggeredBy: 'ci',
      };

      executePromotion(request);

      const events = getDeploymentEventsByCorrelation(correlationId);
      assert.ok(events.length > 0);
      assert.ok(events.every((e) => e.correlationId === correlationId));
    });

    it('should include all required fields in event', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const request: PromotionRequest = {
        environment: 'staging',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId,
        dryRun: false,
        acceptanceEvaluation: createPassingEvaluation('staging', 'log_only', 'ticket_on_high'),
        triggeredBy: 'operator',
      };

      executePromotion(request);

      const events = getDeploymentEventsByCorrelation(correlationId);
      const event = events[0];

      assert.ok(event.eventId);
      assert.ok(event.eventType);
      assert.ok(event.correlationId);
      assert.ok(event.environment);
      assert.ok(event.previousStage);
      assert.ok(event.targetStage);
      assert.ok(event.triggeredBy);
      assert.ok(event.timestamp);
      assert.ok(typeof event.dryRun === 'boolean');
      assert.ok(event.outcome);
    });

    it('should record blocked promotions', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const request: PromotionRequest = {
        environment: 'staging',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId,
        dryRun: false,
        acceptanceEvaluation: createFailingEvaluation('staging', 'log_only', 'ticket_on_high'),
        triggeredBy: 'ci',
      };

      executePromotion(request);

      const events = getDeploymentEventsByCorrelation(correlationId);
      assert.ok(events.some((e) => e.eventType === 'promotion_blocked'));
      assert.ok(events.some((e) => e.outcome === 'blocked'));
    });

    it('should include blocked reasons in event', () => {
      resetMocks();

      const correlationId = generateCorrelationId();
      const request: PromotionRequest = {
        environment: 'staging',
        currentStage: 'log_only',
        targetStage: 'ticket_on_high',
        correlationId,
        dryRun: false,
        acceptanceEvaluation: createFailingEvaluation('staging', 'log_only', 'ticket_on_high'),
        triggeredBy: 'ci',
      };

      executePromotion(request);

      const events = getDeploymentEventsByCorrelation(correlationId);
      const blockedEvent = events.find((e) => e.eventType === 'promotion_blocked');
      assert.ok(blockedEvent?.blockedReasons && blockedEvent.blockedReasons.length > 0);
    });
  });
});
