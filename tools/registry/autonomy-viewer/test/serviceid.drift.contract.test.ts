/**
 * Service Identity Drift Contract Tests
 * ======================================
 *
 * Phase VII: Validates drift detection for service identity posture.
 *
 * Contract:
 * - drift_detects_issuer_changes: new/removed CAs, chain changes
 * - drift_detects_san_eku_changes: certificate attribute drift
 * - drift_detects_policy_changes: mTLS policy/cipher changes
 * - drift_detects_spiffe_changes: trust domain/workload ID drift
 * - drift_is_bounded: governance-grade, not SIEM replacement
 */

import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Service Identity Drift
// ============================================================================

/**
 * Environment type.
 */
type Environment = 'production' | 'staging' | 'development' | 'test';

/**
 * Service tier.
 */
type ServiceTier = 'critical' | 'high' | 'standard' | 'internal';

/**
 * Drift type.
 */
type DriftType =
  | 'issuer_added'
  | 'issuer_removed'
  | 'issuer_chain_changed'
  | 'san_added'
  | 'san_removed'
  | 'eku_added'
  | 'eku_removed'
  | 'cipher_policy_changed'
  | 'mtls_mode_changed'
  | 'spiffe_trust_domain_changed'
  | 'spiffe_workload_pattern_changed'
  | 'svid_ttl_changed';

/**
 * Drift severity.
 */
type DriftSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Issuer snapshot.
 */
interface IssuerSnapshot {
  readonly issuerId: string; // Opaque
  readonly issuerCN: string; // May be hashed
  readonly issuerTier: 'public_ca' | 'private_ca' | 'self_signed' | 'spiffe';
  readonly chainDepth: number;
  readonly rootFingerprint: string;
}

/**
 * Certificate attributes snapshot.
 */
interface CertAttributesSnapshot {
  readonly certId: string;
  readonly sans: readonly string[];
  readonly ekus: readonly string[];
  readonly signatureAlgorithm: string;
  readonly publicKeyAlgorithm: string;
  readonly publicKeyBits: number;
}

/**
 * mTLS policy snapshot.
 */
interface MTLSPolicySnapshot {
  readonly policyId: string;
  readonly mode: 'strict' | 'permissive' | 'disabled';
  readonly minTlsVersion: string;
  readonly cipherSuites: readonly string[];
  readonly requireClientCert: boolean;
}

/**
 * SPIFFE posture snapshot.
 */
interface SPIFFEPostureSnapshot {
  readonly trustDomain: string;
  readonly workloadIdPatterns: readonly string[];
  readonly svidTtlSeconds: number;
  readonly federatedDomains: readonly string[];
}

/**
 * Identity posture baseline.
 */
interface IdentityPostureBaseline {
  readonly baselineId: string;
  readonly capturedAt: string;
  readonly environment: Environment;
  readonly issuers: readonly IssuerSnapshot[];
  readonly certAttributes: readonly CertAttributesSnapshot[];
  readonly mtlsPolicy: MTLSPolicySnapshot;
  readonly spiffePosture?: SPIFFEPostureSnapshot;
}

/**
 * Drift event.
 */
interface DriftEvent {
  readonly driftId: string;
  readonly detectedAt: string;
  readonly driftType: DriftType;
  readonly severity: DriftSeverity;
  readonly environment: Environment;
  readonly serviceTier?: ServiceTier;
  readonly description: string;
  readonly affectedArtifactId: string; // Opaque
  readonly baseline: {
    readonly value: string | number | readonly string[];
    readonly capturedAt: string;
  };
  readonly current: {
    readonly value: string | number | readonly string[];
    readonly observedAt: string;
  };
}

/**
 * Drift detection result.
 */
interface DriftDetectionResult {
  readonly resultId: string;
  readonly generatedAt: string;
  readonly environment: Environment;
  readonly baselineId: string;
  readonly driftEvents: readonly DriftEvent[];
  readonly summary: DriftSummary;
}

/**
 * Drift summary.
 */
interface DriftSummary {
  readonly totalDriftEvents: number;
  readonly byType: Partial<Record<DriftType, number>>;
  readonly bySeverity: Record<DriftSeverity, number>;
  readonly criticalCount: number;
  readonly highCount: number;
}

// ============================================================================
// Constants
// ============================================================================

const DRIFT_TYPE_SEVERITY: Record<DriftType, DriftSeverity> = {
  issuer_added: 'high',
  issuer_removed: 'critical',
  issuer_chain_changed: 'critical',
  san_added: 'medium',
  san_removed: 'high',
  eku_added: 'medium',
  eku_removed: 'high',
  cipher_policy_changed: 'high',
  mtls_mode_changed: 'critical',
  spiffe_trust_domain_changed: 'critical',
  spiffe_workload_pattern_changed: 'high',
  svid_ttl_changed: 'medium',
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Compute opaque ID.
 */
function computeOpaqueId(input: string): string {
  return `sha256:${crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)}`;
}

/**
 * Detect issuer drift.
 */
function detectIssuerDrift(
  baseline: readonly IssuerSnapshot[],
  current: readonly IssuerSnapshot[],
  environment: Environment
): DriftEvent[] {
  const events: DriftEvent[] = [];
  const baselineIds = new Set(baseline.map(i => i.issuerId));
  const currentIds = new Set(current.map(i => i.issuerId));

  // New issuers
  for (const issuer of current) {
    if (!baselineIds.has(issuer.issuerId)) {
      events.push({
        driftId: computeOpaqueId(`drift-issuer-add-${issuer.issuerId}`),
        detectedAt: new Date().toISOString(),
        driftType: 'issuer_added',
        severity: DRIFT_TYPE_SEVERITY['issuer_added'],
        environment,
        description: `New issuer detected: ${issuer.issuerTier}`,
        affectedArtifactId: issuer.issuerId,
        baseline: { value: 'not_present', capturedAt: '' },
        current: { value: issuer.issuerTier, observedAt: new Date().toISOString() },
      });
    }
  }

  // Removed issuers
  for (const issuer of baseline) {
    if (!currentIds.has(issuer.issuerId)) {
      events.push({
        driftId: computeOpaqueId(`drift-issuer-rm-${issuer.issuerId}`),
        detectedAt: new Date().toISOString(),
        driftType: 'issuer_removed',
        severity: DRIFT_TYPE_SEVERITY['issuer_removed'],
        environment,
        description: `Issuer removed: ${issuer.issuerTier}`,
        affectedArtifactId: issuer.issuerId,
        baseline: { value: issuer.issuerTier, capturedAt: '' },
        current: { value: 'removed', observedAt: new Date().toISOString() },
      });
    }
  }

  // Chain changes
  for (const baseIssuer of baseline) {
    const currIssuer = current.find(i => i.issuerId === baseIssuer.issuerId);
    if (currIssuer && currIssuer.chainDepth !== baseIssuer.chainDepth) {
      events.push({
        driftId: computeOpaqueId(`drift-chain-${baseIssuer.issuerId}`),
        detectedAt: new Date().toISOString(),
        driftType: 'issuer_chain_changed',
        severity: DRIFT_TYPE_SEVERITY['issuer_chain_changed'],
        environment,
        description: `Chain depth changed from ${baseIssuer.chainDepth} to ${currIssuer.chainDepth}`,
        affectedArtifactId: baseIssuer.issuerId,
        baseline: { value: baseIssuer.chainDepth, capturedAt: '' },
        current: { value: currIssuer.chainDepth, observedAt: new Date().toISOString() },
      });
    }
  }

  return events;
}

/**
 * Detect SAN/EKU drift.
 */
function detectAttributeDrift(
  baseline: CertAttributesSnapshot,
  current: CertAttributesSnapshot,
  environment: Environment
): DriftEvent[] {
  const events: DriftEvent[] = [];

  // SAN changes
  const baselineSans = new Set(baseline.sans);
  const currentSans = new Set(current.sans);

  for (const san of current.sans) {
    if (!baselineSans.has(san)) {
      events.push({
        driftId: computeOpaqueId(`drift-san-add-${san}`),
        detectedAt: new Date().toISOString(),
        driftType: 'san_added',
        severity: DRIFT_TYPE_SEVERITY['san_added'],
        environment,
        description: 'New SAN added to certificate',
        affectedArtifactId: current.certId,
        baseline: { value: [...baseline.sans], capturedAt: '' },
        current: { value: [...current.sans], observedAt: new Date().toISOString() },
      });
      break; // One event per cert for SANs
    }
  }

  for (const san of baseline.sans) {
    if (!currentSans.has(san)) {
      events.push({
        driftId: computeOpaqueId(`drift-san-rm-${san}`),
        detectedAt: new Date().toISOString(),
        driftType: 'san_removed',
        severity: DRIFT_TYPE_SEVERITY['san_removed'],
        environment,
        description: 'SAN removed from certificate',
        affectedArtifactId: current.certId,
        baseline: { value: [...baseline.sans], capturedAt: '' },
        current: { value: [...current.sans], observedAt: new Date().toISOString() },
      });
      break;
    }
  }

  // EKU changes
  const baselineEkus = new Set(baseline.ekus);
  const currentEkus = new Set(current.ekus);

  for (const eku of current.ekus) {
    if (!baselineEkus.has(eku)) {
      events.push({
        driftId: computeOpaqueId(`drift-eku-add-${eku}`),
        detectedAt: new Date().toISOString(),
        driftType: 'eku_added',
        severity: DRIFT_TYPE_SEVERITY['eku_added'],
        environment,
        description: `New EKU added: ${eku}`,
        affectedArtifactId: current.certId,
        baseline: { value: [...baseline.ekus], capturedAt: '' },
        current: { value: [...current.ekus], observedAt: new Date().toISOString() },
      });
      break;
    }
  }

  for (const eku of baseline.ekus) {
    if (!currentEkus.has(eku)) {
      events.push({
        driftId: computeOpaqueId(`drift-eku-rm-${eku}`),
        detectedAt: new Date().toISOString(),
        driftType: 'eku_removed',
        severity: DRIFT_TYPE_SEVERITY['eku_removed'],
        environment,
        description: `EKU removed: ${eku}`,
        affectedArtifactId: current.certId,
        baseline: { value: [...baseline.ekus], capturedAt: '' },
        current: { value: [...current.ekus], observedAt: new Date().toISOString() },
      });
      break;
    }
  }

  return events;
}

/**
 * Detect mTLS policy drift.
 */
function detectPolicyDrift(
  baseline: MTLSPolicySnapshot,
  current: MTLSPolicySnapshot,
  environment: Environment
): DriftEvent[] {
  const events: DriftEvent[] = [];

  if (baseline.mode !== current.mode) {
    events.push({
      driftId: computeOpaqueId(`drift-mtls-mode`),
      detectedAt: new Date().toISOString(),
      driftType: 'mtls_mode_changed',
      severity: DRIFT_TYPE_SEVERITY['mtls_mode_changed'],
      environment,
      description: `mTLS mode changed from ${baseline.mode} to ${current.mode}`,
      affectedArtifactId: current.policyId,
      baseline: { value: baseline.mode, capturedAt: '' },
      current: { value: current.mode, observedAt: new Date().toISOString() },
    });
  }

  const baselineCiphers = new Set(baseline.cipherSuites);
  const currentCiphers = new Set(current.cipherSuites);
  const cipherDiff =
    [...currentCiphers].filter(c => !baselineCiphers.has(c)).length +
    [...baselineCiphers].filter(c => !currentCiphers.has(c)).length;

  if (cipherDiff > 0) {
    events.push({
      driftId: computeOpaqueId(`drift-cipher-policy`),
      detectedAt: new Date().toISOString(),
      driftType: 'cipher_policy_changed',
      severity: DRIFT_TYPE_SEVERITY['cipher_policy_changed'],
      environment,
      description: `Cipher suite configuration changed`,
      affectedArtifactId: current.policyId,
      baseline: { value: [...baseline.cipherSuites], capturedAt: '' },
      current: { value: [...current.cipherSuites], observedAt: new Date().toISOString() },
    });
  }

  return events;
}

/**
 * Detect SPIFFE posture drift.
 */
function detectSpiffeDrift(
  baseline: SPIFFEPostureSnapshot | undefined,
  current: SPIFFEPostureSnapshot | undefined,
  environment: Environment
): DriftEvent[] {
  const events: DriftEvent[] = [];

  if (!baseline || !current) return events;

  if (baseline.trustDomain !== current.trustDomain) {
    events.push({
      driftId: computeOpaqueId(`drift-spiffe-domain`),
      detectedAt: new Date().toISOString(),
      driftType: 'spiffe_trust_domain_changed',
      severity: DRIFT_TYPE_SEVERITY['spiffe_trust_domain_changed'],
      environment,
      description: `SPIFFE trust domain changed`,
      affectedArtifactId: computeOpaqueId(current.trustDomain),
      baseline: { value: baseline.trustDomain, capturedAt: '' },
      current: { value: current.trustDomain, observedAt: new Date().toISOString() },
    });
  }

  const baselinePatterns = new Set(baseline.workloadIdPatterns);
  const currentPatterns = new Set(current.workloadIdPatterns);
  const patternDiff =
    [...currentPatterns].filter(p => !baselinePatterns.has(p)).length +
    [...baselinePatterns].filter(p => !currentPatterns.has(p)).length;

  if (patternDiff > 0) {
    events.push({
      driftId: computeOpaqueId(`drift-spiffe-patterns`),
      detectedAt: new Date().toISOString(),
      driftType: 'spiffe_workload_pattern_changed',
      severity: DRIFT_TYPE_SEVERITY['spiffe_workload_pattern_changed'],
      environment,
      description: `SPIFFE workload ID patterns changed`,
      affectedArtifactId: computeOpaqueId(current.trustDomain),
      baseline: { value: [...baseline.workloadIdPatterns], capturedAt: '' },
      current: { value: [...current.workloadIdPatterns], observedAt: new Date().toISOString() },
    });
  }

  if (baseline.svidTtlSeconds !== current.svidTtlSeconds) {
    events.push({
      driftId: computeOpaqueId(`drift-svid-ttl`),
      detectedAt: new Date().toISOString(),
      driftType: 'svid_ttl_changed',
      severity: DRIFT_TYPE_SEVERITY['svid_ttl_changed'],
      environment,
      description: `SVID TTL changed from ${baseline.svidTtlSeconds}s to ${current.svidTtlSeconds}s`,
      affectedArtifactId: computeOpaqueId(current.trustDomain),
      baseline: { value: baseline.svidTtlSeconds, capturedAt: '' },
      current: { value: current.svidTtlSeconds, observedAt: new Date().toISOString() },
    });
  }

  return events;
}

/**
 * Compute drift summary.
 */
function computeDriftSummary(events: readonly DriftEvent[]): DriftSummary {
  const byType: Partial<Record<DriftType, number>> = {};
  const bySeverity: Record<DriftSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const event of events) {
    byType[event.driftType] = (byType[event.driftType] || 0) + 1;
    bySeverity[event.severity]++;
  }

  return {
    totalDriftEvents: events.length,
    byType,
    bySeverity,
    criticalCount: bySeverity.critical,
    highCount: bySeverity.high,
  };
}

// ============================================================================
// Contract: drift_detects_issuer_changes
// ============================================================================

describe('Service Identity Drift Contract', () => {
  describe('drift_detects_issuer_changes', () => {
    it('should detect new issuer', () => {
      const baseline: IssuerSnapshot[] = [];
      const current: IssuerSnapshot[] = [
        {
          issuerId: 'sha256:issuer1',
          issuerCN: 'CA1',
          issuerTier: 'private_ca',
          chainDepth: 2,
          rootFingerprint: 'abc',
        },
      ];

      const events = detectIssuerDrift(baseline, current, 'production');

      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].driftType, 'issuer_added');
    });

    it('should detect removed issuer', () => {
      const baseline: IssuerSnapshot[] = [
        {
          issuerId: 'sha256:issuer1',
          issuerCN: 'CA1',
          issuerTier: 'private_ca',
          chainDepth: 2,
          rootFingerprint: 'abc',
        },
      ];
      const current: IssuerSnapshot[] = [];

      const events = detectIssuerDrift(baseline, current, 'production');

      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].driftType, 'issuer_removed');
      assert.strictEqual(events[0].severity, 'critical');
    });

    it('should detect chain depth change', () => {
      const baseline: IssuerSnapshot[] = [
        {
          issuerId: 'sha256:issuer1',
          issuerCN: 'CA1',
          issuerTier: 'private_ca',
          chainDepth: 2,
          rootFingerprint: 'abc',
        },
      ];
      const current: IssuerSnapshot[] = [
        {
          issuerId: 'sha256:issuer1',
          issuerCN: 'CA1',
          issuerTier: 'private_ca',
          chainDepth: 3,
          rootFingerprint: 'abc',
        },
      ];

      const events = detectIssuerDrift(baseline, current, 'production');

      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].driftType, 'issuer_chain_changed');
    });

    it('should not flag unchanged issuers', () => {
      const issuer: IssuerSnapshot = {
        issuerId: 'sha256:issuer1',
        issuerCN: 'CA1',
        issuerTier: 'private_ca',
        chainDepth: 2,
        rootFingerprint: 'abc',
      };

      const events = detectIssuerDrift([issuer], [issuer], 'production');

      assert.strictEqual(events.length, 0);
    });
  });

  // ============================================================================
  // Contract: drift_detects_san_eku_changes
  // ============================================================================

  describe('drift_detects_san_eku_changes', () => {
    it('should detect SAN added', () => {
      const baseline: CertAttributesSnapshot = {
        certId: 'sha256:cert1',
        sans: ['svc.internal'],
        ekus: ['serverAuth'],
        signatureAlgorithm: 'SHA256withRSA',
        publicKeyAlgorithm: 'RSA',
        publicKeyBits: 2048,
      };
      const current: CertAttributesSnapshot = {
        ...baseline,
        sans: ['svc.internal', 'new.svc.internal'],
      };

      const events = detectAttributeDrift(baseline, current, 'production');

      assert.ok(events.some(e => e.driftType === 'san_added'));
    });

    it('should detect SAN removed', () => {
      const baseline: CertAttributesSnapshot = {
        certId: 'sha256:cert1',
        sans: ['svc.internal', 'old.svc.internal'],
        ekus: ['serverAuth'],
        signatureAlgorithm: 'SHA256withRSA',
        publicKeyAlgorithm: 'RSA',
        publicKeyBits: 2048,
      };
      const current: CertAttributesSnapshot = {
        ...baseline,
        sans: ['svc.internal'],
      };

      const events = detectAttributeDrift(baseline, current, 'production');

      assert.ok(events.some(e => e.driftType === 'san_removed'));
    });

    it('should detect EKU added', () => {
      const baseline: CertAttributesSnapshot = {
        certId: 'sha256:cert1',
        sans: ['svc.internal'],
        ekus: ['serverAuth'],
        signatureAlgorithm: 'SHA256withRSA',
        publicKeyAlgorithm: 'RSA',
        publicKeyBits: 2048,
      };
      const current: CertAttributesSnapshot = {
        ...baseline,
        ekus: ['serverAuth', 'codeSigning'],
      };

      const events = detectAttributeDrift(baseline, current, 'production');

      assert.ok(events.some(e => e.driftType === 'eku_added'));
    });

    it('should detect EKU removed', () => {
      const baseline: CertAttributesSnapshot = {
        certId: 'sha256:cert1',
        sans: ['svc.internal'],
        ekus: ['serverAuth', 'clientAuth'],
        signatureAlgorithm: 'SHA256withRSA',
        publicKeyAlgorithm: 'RSA',
        publicKeyBits: 2048,
      };
      const current: CertAttributesSnapshot = {
        ...baseline,
        ekus: ['serverAuth'],
      };

      const events = detectAttributeDrift(baseline, current, 'production');

      assert.ok(events.some(e => e.driftType === 'eku_removed'));
    });
  });

  // ============================================================================
  // Contract: drift_detects_policy_changes
  // ============================================================================

  describe('drift_detects_policy_changes', () => {
    it('should detect mTLS mode change', () => {
      const baseline: MTLSPolicySnapshot = {
        policyId: 'sha256:policy1',
        mode: 'strict',
        minTlsVersion: '1.3',
        cipherSuites: ['TLS_AES_256_GCM_SHA384'],
        requireClientCert: true,
      };
      const current: MTLSPolicySnapshot = {
        ...baseline,
        mode: 'permissive',
      };

      const events = detectPolicyDrift(baseline, current, 'production');

      assert.ok(events.some(e => e.driftType === 'mtls_mode_changed'));
      assert.strictEqual(events[0].severity, 'critical');
    });

    it('should detect cipher suite change', () => {
      const baseline: MTLSPolicySnapshot = {
        policyId: 'sha256:policy1',
        mode: 'strict',
        minTlsVersion: '1.3',
        cipherSuites: ['TLS_AES_256_GCM_SHA384'],
        requireClientCert: true,
      };
      const current: MTLSPolicySnapshot = {
        ...baseline,
        cipherSuites: ['TLS_AES_128_GCM_SHA256'],
      };

      const events = detectPolicyDrift(baseline, current, 'production');

      assert.ok(events.some(e => e.driftType === 'cipher_policy_changed'));
    });

    it('should not flag unchanged policy', () => {
      const policy: MTLSPolicySnapshot = {
        policyId: 'sha256:policy1',
        mode: 'strict',
        minTlsVersion: '1.3',
        cipherSuites: ['TLS_AES_256_GCM_SHA384'],
        requireClientCert: true,
      };

      const events = detectPolicyDrift(policy, policy, 'production');

      assert.strictEqual(events.length, 0);
    });
  });

  // ============================================================================
  // Contract: drift_detects_spiffe_changes
  // ============================================================================

  describe('drift_detects_spiffe_changes', () => {
    it('should detect trust domain change', () => {
      const baseline: SPIFFEPostureSnapshot = {
        trustDomain: 'spiffe://prod.example.com',
        workloadIdPatterns: ['/ns/*/sa/*'],
        svidTtlSeconds: 3600,
        federatedDomains: [],
      };
      const current: SPIFFEPostureSnapshot = {
        ...baseline,
        trustDomain: 'spiffe://new.example.com',
      };

      const events = detectSpiffeDrift(baseline, current, 'production');

      assert.ok(events.some(e => e.driftType === 'spiffe_trust_domain_changed'));
      assert.strictEqual(events[0].severity, 'critical');
    });

    it('should detect workload pattern change', () => {
      const baseline: SPIFFEPostureSnapshot = {
        trustDomain: 'spiffe://prod.example.com',
        workloadIdPatterns: ['/ns/*/sa/*'],
        svidTtlSeconds: 3600,
        federatedDomains: [],
      };
      const current: SPIFFEPostureSnapshot = {
        ...baseline,
        workloadIdPatterns: ['/ns/*/sa/*', '/external/*'],
      };

      const events = detectSpiffeDrift(baseline, current, 'production');

      assert.ok(events.some(e => e.driftType === 'spiffe_workload_pattern_changed'));
    });

    it('should detect SVID TTL change', () => {
      const baseline: SPIFFEPostureSnapshot = {
        trustDomain: 'spiffe://prod.example.com',
        workloadIdPatterns: ['/ns/*/sa/*'],
        svidTtlSeconds: 3600,
        federatedDomains: [],
      };
      const current: SPIFFEPostureSnapshot = {
        ...baseline,
        svidTtlSeconds: 7200,
      };

      const events = detectSpiffeDrift(baseline, current, 'production');

      assert.ok(events.some(e => e.driftType === 'svid_ttl_changed'));
    });

    it('should handle missing SPIFFE posture', () => {
      const events = detectSpiffeDrift(undefined, undefined, 'production');

      assert.strictEqual(events.length, 0);
    });
  });

  // ============================================================================
  // Contract: drift_is_bounded
  // ============================================================================

  describe('drift_is_bounded', () => {
    it('should use bounded drift types', () => {
      const validTypes: DriftType[] = [
        'issuer_added',
        'issuer_removed',
        'issuer_chain_changed',
        'san_added',
        'san_removed',
        'eku_added',
        'eku_removed',
        'cipher_policy_changed',
        'mtls_mode_changed',
        'spiffe_trust_domain_changed',
        'spiffe_workload_pattern_changed',
        'svid_ttl_changed',
      ];

      assert.strictEqual(Object.keys(DRIFT_TYPE_SEVERITY).length, validTypes.length);
    });

    it('should compute summary with counts', () => {
      const events: DriftEvent[] = [
        {
          driftId: 'sha256:d1',
          detectedAt: '',
          driftType: 'issuer_added',
          severity: 'high',
          environment: 'production',
          description: '',
          affectedArtifactId: 'sha256:a1',
          baseline: { value: '', capturedAt: '' },
          current: { value: '', observedAt: '' },
        },
        {
          driftId: 'sha256:d2',
          detectedAt: '',
          driftType: 'mtls_mode_changed',
          severity: 'critical',
          environment: 'production',
          description: '',
          affectedArtifactId: 'sha256:a2',
          baseline: { value: '', capturedAt: '' },
          current: { value: '', observedAt: '' },
        },
      ];

      const summary = computeDriftSummary(events);

      assert.strictEqual(summary.totalDriftEvents, 2);
      assert.strictEqual(summary.criticalCount, 1);
      assert.strictEqual(summary.highCount, 1);
    });

    it('should use opaque artifact IDs', () => {
      const baseline: IssuerSnapshot[] = [];
      const current: IssuerSnapshot[] = [
        {
          issuerId: 'sha256:issuer1',
          issuerCN: 'CA1',
          issuerTier: 'private_ca',
          chainDepth: 2,
          rootFingerprint: 'abc',
        },
      ];

      const events = detectIssuerDrift(baseline, current, 'production');

      assert.ok(events[0].driftId.startsWith('sha256:'));
      assert.ok(events[0].affectedArtifactId.startsWith('sha256:'));
    });

    it('should include environment context', () => {
      const baseline: IssuerSnapshot[] = [];
      const current: IssuerSnapshot[] = [
        {
          issuerId: 'sha256:issuer1',
          issuerCN: 'CA1',
          issuerTier: 'private_ca',
          chainDepth: 2,
          rootFingerprint: 'abc',
        },
      ];

      const events = detectIssuerDrift(baseline, current, 'staging');

      assert.strictEqual(events[0].environment, 'staging');
    });
  });
});
