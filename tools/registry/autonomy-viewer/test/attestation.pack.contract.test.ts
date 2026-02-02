/**
 * Compliance Automation: Attestation Pack Contract Tests
 *
 * Phase X - PII-clean attestation pack generation.
 *
 * CONTRACT SURFACE:
 * - Pack Generation: Control → evidence → test suite → commit SHA mapping
 * - PII Sanitization: No PII leaks in attestation packs
 * - Checksum Integrity: Pack contents are verifiable
 * - Temporal Scope: Attestation covers specific time windows
 *
 * INVARIANTS:
 * - Attestation packs are PII-clean
 * - Every control maps to evidence and test suites
 * - Pack checksums are deterministic for same inputs
 * - Packs are immutable once generated
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ControlDomain =
  | 'identity'
  | 'authz'
  | 'secrets'
  | 'service_identity'
  | 'data_access'
  | 'scaling'
  | 'incident_response';
type EvidenceType =
  | 'test_suite'
  | 'audit_log'
  | 'config_snapshot'
  | 'policy_document'
  | 'approval_record';
type PackStatus = 'generating' | 'complete' | 'verified' | 'signed';

/**
 * Control reference
 */
interface ControlReference {
  readonly control_id: string;
  readonly domain: ControlDomain;
  readonly name: string;
  readonly description: string;
  readonly test_suites: readonly string[];
  readonly evidence_refs: readonly string[];
}

/**
 * Evidence reference (PII-clean)
 */
interface EvidenceReference {
  readonly evidence_id: string;
  readonly type: EvidenceType;
  readonly control_ids: readonly string[];
  readonly timestamp: string;
  readonly checksum: string;
  readonly storage_ref: string;
  readonly is_pii_clean: boolean;
}

/**
 * Test suite reference
 */
interface TestSuiteReference {
  readonly suite_id: string;
  readonly name: string;
  readonly file_path: string;
  readonly test_count: number;
  readonly pass_count: number;
  readonly fail_count: number;
  readonly executed_at: string;
  readonly commit_sha: string;
}

/**
 * Attestation pack
 */
interface AttestationPack {
  readonly pack_id: string;
  readonly version: string;
  readonly generated_at: string;
  readonly time_window_start: string;
  readonly time_window_end: string;
  readonly status: PackStatus;
  readonly controls: readonly ControlReference[];
  readonly evidence: readonly EvidenceReference[];
  readonly test_suites: readonly TestSuiteReference[];
  readonly commit_sha: string;
  readonly pack_checksum: string;
  readonly is_pii_clean: boolean;
  readonly generator_version: string;
}

/**
 * Pack generation request
 */
interface PackGenerationRequest {
  readonly domains: readonly ControlDomain[];
  readonly time_window_start: string;
  readonly time_window_end: string;
  readonly include_test_results: boolean;
  readonly include_evidence_refs: boolean;
}

/**
 * Pack verification result
 */
interface PackVerificationResult {
  readonly pack_id: string;
  readonly is_valid: boolean;
  readonly checksum_verified: boolean;
  readonly pii_scan_passed: boolean;
  readonly control_coverage: number;
  readonly evidence_coverage: number;
  readonly verification_errors: readonly string[];
  readonly verified_at: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockControlReference(overrides: Partial<ControlReference> = {}): ControlReference {
  return {
    control_id: `ctrl-${Date.now()}`,
    domain: 'identity',
    name: 'Identity Verification',
    description: 'Ensures identity is verified before access',
    test_suites: ['identity.authz.contract.test.ts'],
    evidence_refs: [`sha256:${Buffer.from('evidence-1').toString('hex').slice(0, 64)}`],
    ...overrides,
  };
}

function createMockEvidenceReference(
  overrides: Partial<EvidenceReference> = {}
): EvidenceReference {
  const evidenceId = `evidence-${Date.now()}`;
  return {
    evidence_id: `sha256:${Buffer.from(evidenceId).toString('hex').slice(0, 64)}`,
    type: 'test_suite',
    control_ids: ['ctrl-identity-1'],
    timestamp: new Date().toISOString(),
    checksum: `sha256:${Buffer.from(`checksum-${evidenceId}`).toString('hex').slice(0, 64)}`,
    storage_ref: 's3://attestation-evidence/packs/',
    is_pii_clean: true,
    ...overrides,
  };
}

function createMockTestSuiteReference(
  overrides: Partial<TestSuiteReference> = {}
): TestSuiteReference {
  return {
    suite_id: `suite-${Date.now()}`,
    name: 'Identity AuthZ Contracts',
    file_path: 'tools/registry/autonomy-viewer/test/identity.authz.contract.test.ts',
    test_count: 20,
    pass_count: 20,
    fail_count: 0,
    executed_at: new Date().toISOString(),
    commit_sha: '47949675b',
    ...overrides,
  };
}

function createMockAttestationPack(overrides: Partial<AttestationPack> = {}): AttestationPack {
  const packId = `pack-${Date.now()}`;
  return {
    pack_id: `sha256:${Buffer.from(packId).toString('hex').slice(0, 64)}`,
    version: '1.0.0',
    generated_at: new Date().toISOString(),
    time_window_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    time_window_end: new Date().toISOString(),
    status: 'complete',
    controls: [],
    evidence: [],
    test_suites: [],
    commit_sha: '47949675b',
    pack_checksum: `sha256:${Buffer.from(`checksum-${packId}`).toString('hex').slice(0, 64)}`,
    is_pii_clean: true,
    generator_version: '1.0.0',
    ...overrides,
  };
}

// ============================================================================
// MOCK ATTESTATION STORE
// ============================================================================

interface AttestationPackStore {
  // Pack Generation
  generatePack(request: PackGenerationRequest): Promise<AttestationPack>;
  getPack(packId: string): Promise<AttestationPack | null>;
  getPacksByTimeWindow(start: Date, end: Date): Promise<readonly AttestationPack[]>;

  // Control Mapping
  getControlsForDomain(domain: ControlDomain): Promise<readonly ControlReference[]>;
  getControlById(controlId: string): Promise<ControlReference | null>;
  getAllControls(): Promise<readonly ControlReference[]>;

  // Evidence Mapping
  getEvidenceForControl(controlId: string): Promise<readonly EvidenceReference[]>;
  getEvidenceById(evidenceId: string): Promise<EvidenceReference | null>;

  // Test Suite Mapping
  getTestSuitesForControl(controlId: string): Promise<readonly TestSuiteReference[]>;
  getLatestTestResults(): Promise<readonly TestSuiteReference[]>;

  // Verification
  verifyPack(packId: string): Promise<PackVerificationResult>;
  scanForPii(packId: string): Promise<boolean>;
  computeChecksum(packId: string): Promise<string>;

  // Immutability
  isPackImmutable(packId: string): Promise<boolean>;
  sealPack(packId: string): Promise<AttestationPack>;
}

function createMockAttestationPackStore(): AttestationPackStore {
  const packs: Map<string, AttestationPack> = new Map();
  const sealedPacks: Set<string> = new Set();

  const controlsByDomain: Map<ControlDomain, ControlReference[]> = new Map([
    [
      'identity',
      [
        createMockControlReference({
          control_id: 'ctrl-identity-1',
          domain: 'identity',
          name: 'OIDC Authentication',
        }),
        createMockControlReference({
          control_id: 'ctrl-identity-2',
          domain: 'identity',
          name: 'Entra ID Integration',
        }),
      ],
    ],
    [
      'authz',
      [
        createMockControlReference({
          control_id: 'ctrl-authz-1',
          domain: 'authz',
          name: 'RBAC Enforcement',
        }),
        createMockControlReference({
          control_id: 'ctrl-authz-2',
          domain: 'authz',
          name: 'Permission Boundaries',
        }),
      ],
    ],
    [
      'secrets',
      [
        createMockControlReference({
          control_id: 'ctrl-secrets-1',
          domain: 'secrets',
          name: 'Secret Rotation',
        }),
        createMockControlReference({
          control_id: 'ctrl-secrets-2',
          domain: 'secrets',
          name: 'Vault Integration',
        }),
      ],
    ],
    [
      'service_identity',
      [
        createMockControlReference({
          control_id: 'ctrl-svcid-1',
          domain: 'service_identity',
          name: 'Service Authentication',
        }),
      ],
    ],
    [
      'data_access',
      [
        createMockControlReference({
          control_id: 'ctrl-data-1',
          domain: 'data_access',
          name: 'Data Classification',
        }),
      ],
    ],
    [
      'scaling',
      [
        createMockControlReference({
          control_id: 'ctrl-scale-1',
          domain: 'scaling',
          name: 'Isolation Boundaries',
        }),
      ],
    ],
    [
      'incident_response',
      [
        createMockControlReference({
          control_id: 'ctrl-ir-1',
          domain: 'incident_response',
          name: 'Incident Triage',
        }),
        createMockControlReference({
          control_id: 'ctrl-ir-2',
          domain: 'incident_response',
          name: 'Evidence Preservation',
        }),
      ],
    ],
  ]);

  return {
    async generatePack(request) {
      const controls: ControlReference[] = [];
      for (const domain of request.domains) {
        const domainControls = controlsByDomain.get(domain) ?? [];
        controls.push(...domainControls);
      }

      const evidence = request.include_evidence_refs
        ? controls.flatMap(c => [createMockEvidenceReference({ control_ids: [c.control_id] })])
        : [];

      const testSuites = request.include_test_results
        ? controls.flatMap(c =>
            c.test_suites.map(ts =>
              createMockTestSuiteReference({
                name: ts,
                file_path: `tools/registry/autonomy-viewer/test/${ts}`,
              })
            )
          )
        : [];

      const pack = createMockAttestationPack({
        time_window_start: request.time_window_start,
        time_window_end: request.time_window_end,
        controls,
        evidence,
        test_suites: testSuites,
        status: 'complete',
      });

      packs.set(pack.pack_id, pack);
      return pack;
    },

    async getPack(packId) {
      return packs.get(packId) ?? null;
    },

    async getPacksByTimeWindow(start, end) {
      return Array.from(packs.values()).filter(p => {
        const packStart = new Date(p.time_window_start);
        const packEnd = new Date(p.time_window_end);
        return packStart >= start && packEnd <= end;
      });
    },

    async getControlsForDomain(domain) {
      return controlsByDomain.get(domain) ?? [];
    },

    async getControlById(controlId) {
      for (const controls of controlsByDomain.values()) {
        const found = controls.find(c => c.control_id === controlId);
        if (found) return found;
      }
      return null;
    },

    async getAllControls() {
      const all: ControlReference[] = [];
      for (const controls of controlsByDomain.values()) {
        all.push(...controls);
      }
      return all;
    },

    async getEvidenceForControl(controlId) {
      return [createMockEvidenceReference({ control_ids: [controlId] })];
    },

    async getEvidenceById(evidenceId) {
      return createMockEvidenceReference({ evidence_id: evidenceId });
    },

    async getTestSuitesForControl(_controlId) {
      return [createMockTestSuiteReference()];
    },

    async getLatestTestResults() {
      return [
        createMockTestSuiteReference({
          name: 'Identity Contracts',
          test_count: 150,
          pass_count: 150,
        }),
        createMockTestSuiteReference({
          name: 'Secrets Contracts',
          test_count: 169,
          pass_count: 169,
        }),
        createMockTestSuiteReference({
          name: 'Incident Response Contracts',
          test_count: 116,
          pass_count: 116,
        }),
      ];
    },

    async verifyPack(packId) {
      const pack = packs.get(packId);
      if (!pack) {
        return {
          pack_id: packId,
          is_valid: false,
          checksum_verified: false,
          pii_scan_passed: false,
          control_coverage: 0,
          evidence_coverage: 0,
          verification_errors: ['Pack not found'],
          verified_at: new Date().toISOString(),
        };
      }

      return {
        pack_id: packId,
        is_valid: true,
        checksum_verified: true,
        pii_scan_passed: pack.is_pii_clean,
        control_coverage: 1.0,
        evidence_coverage: pack.evidence.length > 0 ? 1.0 : 0,
        verification_errors: [],
        verified_at: new Date().toISOString(),
      };
    },

    async scanForPii(packId) {
      const pack = packs.get(packId);
      return pack?.is_pii_clean ?? false;
    },

    async computeChecksum(packId) {
      const pack = packs.get(packId);
      return pack?.pack_checksum ?? '';
    },

    async isPackImmutable(packId) {
      return sealedPacks.has(packId);
    },

    async sealPack(packId) {
      const pack = packs.get(packId);
      if (!pack) throw new Error(`Pack not found: ${packId}`);
      sealedPacks.add(packId);
      const sealed: AttestationPack = { ...pack, status: 'signed' };
      packs.set(packId, sealed);
      return sealed;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Compliance Automation: Attestation Pack Contracts', () => {
  let store: AttestationPackStore;

  beforeEach(() => {
    store = createMockAttestationPackStore();
  });

  // ==========================================================================
  // CONTRACT: pack_generation
  // ==========================================================================
  describe('CONTRACT: pack_generation', () => {
    it('generates attestation pack for requested domains', async () => {
      const pack = await store.generatePack({
        domains: ['identity', 'authz'],
        time_window_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: true,
      });

      assert.ok(pack.pack_id.startsWith('sha256:'));
      assert.ok(pack.controls.length > 0);
      assert.strictEqual(pack.status, 'complete');
    });

    it('pack includes controls from all requested domains', async () => {
      const pack = await store.generatePack({
        domains: ['identity', 'secrets', 'incident_response'],
        time_window_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: true,
      });

      const domains = new Set(pack.controls.map(c => c.domain));
      assert.ok(domains.has('identity'));
      assert.ok(domains.has('secrets'));
      assert.ok(domains.has('incident_response'));
    });

    it('pack includes evidence references when requested', async () => {
      const pack = await store.generatePack({
        domains: ['data_access'],
        time_window_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: false,
        include_evidence_refs: true,
      });

      assert.ok(pack.evidence.length > 0);
    });

    it('pack includes test suite references when requested', async () => {
      const pack = await store.generatePack({
        domains: ['scaling'],
        time_window_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: false,
      });

      assert.ok(pack.test_suites.length > 0);
    });

    it('pack has commit SHA', async () => {
      const pack = await store.generatePack({
        domains: ['service_identity'],
        time_window_start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: true,
      });

      assert.ok(pack.commit_sha);
    });
  });

  // ==========================================================================
  // CONTRACT: pack_pii_clean
  // ==========================================================================
  describe('CONTRACT: pack_pii_clean', () => {
    it('attestation packs are PII-clean', async () => {
      const pack = await store.generatePack({
        domains: ['identity', 'authz'],
        time_window_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: true,
      });

      assert.strictEqual(pack.is_pii_clean, true);
    });

    it('evidence references are PII-clean', async () => {
      const pack = await store.generatePack({
        domains: ['secrets'],
        time_window_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: false,
        include_evidence_refs: true,
      });

      for (const evidence of pack.evidence) {
        assert.strictEqual(evidence.is_pii_clean, true);
      }
    });

    it('scans pack for PII', async () => {
      const pack = await store.generatePack({
        domains: ['incident_response'],
        time_window_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: true,
      });

      const isPiiClean = await store.scanForPii(pack.pack_id);
      assert.strictEqual(isPiiClean, true);
    });

    it('IDs are opaque (sha256 prefix)', async () => {
      const pack = await store.generatePack({
        domains: ['data_access'],
        time_window_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: true,
      });

      assert.ok(pack.pack_id.startsWith('sha256:'));
      for (const evidence of pack.evidence) {
        assert.ok(evidence.evidence_id.startsWith('sha256:'));
      }
    });
  });

  // ==========================================================================
  // CONTRACT: pack_checksum
  // ==========================================================================
  describe('CONTRACT: pack_checksum', () => {
    it('pack has checksum', async () => {
      const pack = await store.generatePack({
        domains: ['identity'],
        time_window_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: true,
      });

      assert.ok(pack.pack_checksum.startsWith('sha256:'));
    });

    it('can compute checksum', async () => {
      const pack = await store.generatePack({
        domains: ['authz'],
        time_window_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: true,
      });

      const checksum = await store.computeChecksum(pack.pack_id);
      assert.ok(checksum.startsWith('sha256:'));
    });

    it('evidence has checksums', async () => {
      const pack = await store.generatePack({
        domains: ['secrets'],
        time_window_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: false,
        include_evidence_refs: true,
      });

      for (const evidence of pack.evidence) {
        assert.ok(evidence.checksum.startsWith('sha256:'));
      }
    });
  });

  // ==========================================================================
  // CONTRACT: pack_verification
  // ==========================================================================
  describe('CONTRACT: pack_verification', () => {
    it('verifies valid pack', async () => {
      const pack = await store.generatePack({
        domains: ['identity', 'authz', 'secrets'],
        time_window_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: true,
      });

      const result = await store.verifyPack(pack.pack_id);

      assert.strictEqual(result.is_valid, true);
      assert.strictEqual(result.checksum_verified, true);
      assert.strictEqual(result.pii_scan_passed, true);
    });

    it('reports invalid pack', async () => {
      const result = await store.verifyPack('non-existent-pack');

      assert.strictEqual(result.is_valid, false);
      assert.ok(result.verification_errors.length > 0);
    });

    it('verification includes coverage metrics', async () => {
      const pack = await store.generatePack({
        domains: ['incident_response'],
        time_window_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: true,
      });

      const result = await store.verifyPack(pack.pack_id);

      assert.ok(result.control_coverage >= 0 && result.control_coverage <= 1);
      assert.ok(result.evidence_coverage >= 0 && result.evidence_coverage <= 1);
    });
  });

  // ==========================================================================
  // CONTRACT: pack_immutability
  // ==========================================================================
  describe('CONTRACT: pack_immutability', () => {
    it('pack can be sealed', async () => {
      const pack = await store.generatePack({
        domains: ['identity'],
        time_window_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: true,
      });

      const sealed = await store.sealPack(pack.pack_id);
      assert.strictEqual(sealed.status, 'signed');
    });

    it('sealed pack is immutable', async () => {
      const pack = await store.generatePack({
        domains: ['authz'],
        time_window_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: true,
      });

      await store.sealPack(pack.pack_id);
      const isImmutable = await store.isPackImmutable(pack.pack_id);

      assert.strictEqual(isImmutable, true);
    });

    it('unsealed pack is not immutable', async () => {
      const pack = await store.generatePack({
        domains: ['secrets'],
        time_window_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        time_window_end: new Date().toISOString(),
        include_test_results: true,
        include_evidence_refs: true,
      });

      const isImmutable = await store.isPackImmutable(pack.pack_id);
      assert.strictEqual(isImmutable, false);
    });
  });

  // ==========================================================================
  // CONTRACT: control_mapping
  // ==========================================================================
  describe('CONTRACT: control_mapping', () => {
    it('retrieves controls by domain', async () => {
      const controls = await store.getControlsForDomain('identity');

      assert.ok(controls.length > 0);
      for (const control of controls) {
        assert.strictEqual(control.domain, 'identity');
      }
    });

    it('controls map to test suites', async () => {
      const controls = await store.getControlsForDomain('authz');

      for (const control of controls) {
        assert.ok(control.test_suites.length > 0);
      }
    });

    it('controls map to evidence', async () => {
      const controls = await store.getAllControls();

      for (const control of controls) {
        const evidence = await store.getEvidenceForControl(control.control_id);
        assert.ok(evidence.length > 0);
      }
    });

    it('gets latest test results', async () => {
      const results = await store.getLatestTestResults();

      assert.ok(results.length > 0);
      for (const result of results) {
        assert.ok(result.test_count > 0);
        assert.ok(result.commit_sha);
      }
    });
  });
});
