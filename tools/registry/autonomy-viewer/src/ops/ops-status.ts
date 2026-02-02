/**
 * Phase 4N50 — Ops Status
 * ========================
 *
 * Unified operational status snapshot.
 *
 * Features:
 *   - Reports last verification, oracle health, DR reconstitution
 *   - Deterministic output given same inputs
 *   - PII-safe (only hashes/IDs, no raw payloads)
 *   - Includes "what to do next" if degraded
 *   - Fails-closed on missing state
 *
 * @module ops/ops-status
 * @version 4N50.1
 */

// ─────────────────────────────────────────────────────────────────────────────
// Schema & Version
// ─────────────────────────────────────────────────────────────────────────────

export const OPS_STATUS_SCHEMA = 'terrafusion.autonomy.ops-status.v1';
export const OPS_STATUS_VERSION = '4N50.1';

// ─────────────────────────────────────────────────────────────────────────────
// Types: Input
// ─────────────────────────────────────────────────────────────────────────────

export interface VerificationStatus {
  ok: boolean;
  verifiedAt: string;
  bundleName: string;
  manifestSha256: string;
  errors: readonly string[];
}

export interface OracleHealthStatus {
  ok: boolean;
  checkedAt: string;
  healthScore: number;
  warnings: readonly string[];
}

export interface DrReconstitutionStatus {
  ok: boolean;
  reconstitutedAt: string;
  ledgerHeadSha256: string;
  chunksRecovered: number;
  durationMs: number;
}

export interface SignerEpochStatus {
  epochId: number;
  keyId: string;
  revocationState: 'active' | 'retired' | 'revoked';
  createdAt: string;
}

export interface RetentionStatus {
  pending: number;
  executed: number;
  blocked: number;
}

export interface OpsStatusInput {
  readonly profile: string;
  lastVerification: VerificationStatus;
  lastOracleHealth: OracleHealthStatus;
  lastDrReconstitution: DrReconstitutionStatus;
  signerEpoch: SignerEpochStatus;
  retentionStatus: RetentionStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types: Output
// ─────────────────────────────────────────────────────────────────────────────

export interface RunbookHint {
  readonly subsystem: string;
  readonly severity: 'critical' | 'warning' | 'info';
  readonly action: string;
  readonly runbookPath: string;
}

export interface OpsStatusResult {
  readonly $schema: typeof OPS_STATUS_SCHEMA;
  readonly version: typeof OPS_STATUS_VERSION;
  readonly profile: string;
  readonly generatedAt: string;
  readonly overall: {
    readonly ok: boolean;
    readonly degraded: boolean;
    readonly degradedSubsystems: readonly string[];
  };
  readonly verification: VerificationStatus;
  readonly oracleHealth: OracleHealthStatus;
  readonly drReconstitution: DrReconstitutionStatus;
  readonly signerEpoch: SignerEpochStatus;
  readonly retention: RetentionStatus;
  readonly runbookHints: readonly RunbookHint[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Runbook Paths
// ─────────────────────────────────────────────────────────────────────────────

const RUNBOOK_PATHS: Record<string, string> = {
  verification: 'runbooks/verification-failure.md',
  oracleHealth: 'runbooks/oracle-health-degraded.md',
  drReconstitution: 'runbooks/dr-reconstitution-failure.md',
  signerEpoch: 'runbooks/signer-revocation.md',
  retention: 'runbooks/retention-blocked.md',
};

// ─────────────────────────────────────────────────────────────────────────────
// computeOpsStatus
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default empty status for missing state (fail-closed).
 */
function createMissingVerification(): VerificationStatus {
  return {
    ok: false,
    verifiedAt: '',
    bundleName: '',
    manifestSha256: '0'.repeat(64),
    errors: ['VERIFICATION_STATE_MISSING'],
  };
}

function createMissingOracleHealth(): OracleHealthStatus {
  return {
    ok: false,
    checkedAt: '',
    healthScore: 0,
    warnings: ['ORACLE_STATE_MISSING'],
  };
}

function createMissingDrReconstitution(): DrReconstitutionStatus {
  return {
    ok: false,
    reconstitutedAt: '',
    ledgerHeadSha256: '0'.repeat(64),
    chunksRecovered: 0,
    durationMs: 0,
  };
}

/**
 * Compute unified operational status from subsystem states.
 * Fails-closed on missing state.
 */
export function computeOpsStatus(input: OpsStatusInput): OpsStatusResult {
  const degradedSubsystems: string[] = [];
  const runbookHints: RunbookHint[] = [];

  // Handle missing state (fail-closed)
  const verification = input.lastVerification ?? createMissingVerification();
  const oracleHealth = input.lastOracleHealth ?? createMissingOracleHealth();
  const drReconstitution = input.lastDrReconstitution ?? createMissingDrReconstitution();

  // Check verification
  if (!verification.ok) {
    degradedSubsystems.push('verification');
    runbookHints.push({
      subsystem: 'verification',
      severity: 'critical',
      action: 'Investigate verification failure; check casefile integrity',
      runbookPath: RUNBOOK_PATHS.verification,
    });
  }
  if (!input.lastVerification) {
    degradedSubsystems.push('verification');
  }

  // Check oracle health
  if (!oracleHealth.ok) {
    degradedSubsystems.push('oracleHealth');
    runbookHints.push({
      subsystem: 'oracleHealth',
      severity: 'critical',
      action: 'Run oracle health check; validate external dependencies',
      runbookPath: RUNBOOK_PATHS.oracleHealth,
    });
  }
  if (!input.lastOracleHealth) {
    degradedSubsystems.push('oracleHealth');
  }

  // Check DR reconstitution
  if (!drReconstitution.ok) {
    degradedSubsystems.push('drReconstitution');
    runbookHints.push({
      subsystem: 'drReconstitution',
      severity: 'critical',
      action: 'Check DR artifacts; verify chunk availability',
      runbookPath: RUNBOOK_PATHS.drReconstitution,
    });
  }
  if (!input.lastDrReconstitution) {
    degradedSubsystems.push('drReconstitution');
  }

  // Check signer epoch
  if (input.signerEpoch?.revocationState === 'revoked') {
    degradedSubsystems.push('signerEpoch');
    runbookHints.push({
      subsystem: 'signerEpoch',
      severity: 'critical',
      action: 'Signer is revoked; rotate to new epoch',
      runbookPath: RUNBOOK_PATHS.signerEpoch,
    });
  }

  // Check retention
  if (input.retentionStatus?.blocked > 0) {
    degradedSubsystems.push('retention');
    runbookHints.push({
      subsystem: 'retention',
      severity: 'warning',
      action: 'Retention actions blocked; investigate blockers',
      runbookPath: RUNBOOK_PATHS.retention,
    });
  }

  // Deduplicate degraded subsystems
  const uniqueDegraded = [...new Set(degradedSubsystems)];

  const overallOk = uniqueDegraded.length === 0;

  return {
    $schema: OPS_STATUS_SCHEMA,
    version: OPS_STATUS_VERSION,
    profile: input.profile,
    generatedAt: new Date().toISOString(),
    overall: {
      ok: overallOk,
      degraded: !overallOk,
      degradedSubsystems: uniqueDegraded,
    },
    verification,
    oracleHealth,
    drReconstitution,
    signerEpoch: input.signerEpoch,
    retention: input.retentionStatus,
    runbookHints,
  };
}
