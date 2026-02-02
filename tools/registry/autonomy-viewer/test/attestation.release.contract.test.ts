/**
 * Compliance Automation: Release Attestation Contract Tests
 *
 * Phase X - Release attestation gates for deployments.
 *
 * CONTRACT SURFACE:
 * - Release Gates: Attestation required before deployment
 * - Signed Attestations: Cryptographic signatures on releases
 * - Control Validation: All controls validated at release time
 * - Deployment Binding: Attestation tied to specific deployment
 *
 * INVARIANTS:
 * - No deployment without signed attestation
 * - Attestation binds to specific commit SHA
 * - All required controls must pass
 * - Attestation is immutable once signed
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ReleaseEnvironment = 'development' | 'staging' | 'production' | 'dr';
type AttestationStatus = 'pending' | 'validated' | 'signed' | 'deployed' | 'revoked';
type ControlStatus = 'passed' | 'failed' | 'skipped' | 'waived';
type SignatureAlgorithm = 'ECDSA-P256' | 'ECDSA-P384' | 'RSA-PSS-2048' | 'Ed25519';

/**
 * Release attestation
 */
interface ReleaseAttestation {
  readonly attestation_id: string;
  readonly release_id: string;
  readonly commit_sha: string;
  readonly environment: ReleaseEnvironment;
  readonly status: AttestationStatus;
  readonly controls_validated: readonly ControlValidation[];
  readonly created_at: string;
  readonly signed_at?: string;
  readonly deployed_at?: string;
  readonly signature?: AttestationSignature;
  readonly attestation_pack_id: string;
  readonly checksum: string;
}

/**
 * Control validation result
 */
interface ControlValidation {
  readonly control_id: string;
  readonly control_name: string;
  readonly status: ControlStatus;
  readonly evidence_ref: string;
  readonly validated_at: string;
  readonly waiver_ref?: string;
}

/**
 * Attestation signature
 */
interface AttestationSignature {
  readonly signature_id: string;
  readonly algorithm: SignatureAlgorithm;
  readonly public_key_ref: string;
  readonly signature_value: string;
  readonly signed_by: string;
  readonly signed_at: string;
}

/**
 * Deployment record
 */
interface DeploymentRecord {
  readonly deployment_id: string;
  readonly attestation_id: string;
  readonly environment: ReleaseEnvironment;
  readonly deployed_at: string;
  readonly deployed_by: string;
  readonly rollback_of?: string;
}

/**
 * Release gate result
 */
interface ReleaseGateResult {
  readonly release_id: string;
  readonly can_deploy: boolean;
  readonly blocking_controls: readonly string[];
  readonly warnings: readonly string[];
  readonly attestation_required: boolean;
  readonly evaluated_at: string;
}

/**
 * Waiver record
 */
interface WaiverRecord {
  readonly waiver_id: string;
  readonly control_id: string;
  readonly reason: string;
  readonly approved_by: string;
  readonly expires_at: string;
  readonly created_at: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockReleaseAttestation(
  overrides: Partial<ReleaseAttestation> = {}
): ReleaseAttestation {
  const attestationId = `attest-${Date.now()}`;
  return {
    attestation_id: `sha256:${Buffer.from(attestationId).toString('hex').slice(0, 64)}`,
    release_id: `release-${Date.now()}`,
    commit_sha: '47949675b',
    environment: 'staging',
    status: 'pending',
    controls_validated: [],
    created_at: new Date().toISOString(),
    attestation_pack_id: `sha256:${Buffer.from('pack-1').toString('hex').slice(0, 64)}`,
    checksum: `sha256:${Buffer.from(`checksum-${attestationId}`).toString('hex').slice(0, 64)}`,
    ...overrides,
  };
}

function createMockControlValidation(
  overrides: Partial<ControlValidation> = {}
): ControlValidation {
  return {
    control_id: `ctrl-${Date.now()}`,
    control_name: 'Identity Verification',
    status: 'passed',
    evidence_ref: `sha256:${Buffer.from('evidence-1').toString('hex').slice(0, 64)}`,
    validated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockAttestationSignature(
  overrides: Partial<AttestationSignature> = {}
): AttestationSignature {
  return {
    signature_id: `sig-${Date.now()}`,
    algorithm: 'ECDSA-P256',
    public_key_ref: 'keys/release-signing/public.pem',
    signature_value: Buffer.from(`signature-${Date.now()}`).toString('base64'),
    signed_by: `sha256:${Buffer.from('release-signer').toString('hex').slice(0, 64)}`,
    signed_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockDeploymentRecord(overrides: Partial<DeploymentRecord> = {}): DeploymentRecord {
  return {
    deployment_id: `deploy-${Date.now()}`,
    attestation_id: `sha256:${Buffer.from('attest-1').toString('hex').slice(0, 64)}`,
    environment: 'staging',
    deployed_at: new Date().toISOString(),
    deployed_by: `sha256:${Buffer.from('deployer-1').toString('hex').slice(0, 64)}`,
    ...overrides,
  };
}

function createMockWaiverRecord(overrides: Partial<WaiverRecord> = {}): WaiverRecord {
  return {
    waiver_id: `waiver-${Date.now()}`,
    control_id: 'ctrl-1',
    reason: 'Temporary exemption pending fix',
    approved_by: `sha256:${Buffer.from('approver-1').toString('hex').slice(0, 64)}`,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// MOCK RELEASE ATTESTATION STORE
// ============================================================================

interface ReleaseAttestationStore {
  // Attestation Lifecycle
  createAttestation(
    releaseId: string,
    commitSha: string,
    environment: ReleaseEnvironment
  ): Promise<ReleaseAttestation>;
  getAttestation(attestationId: string): Promise<ReleaseAttestation | null>;
  getAttestationByRelease(releaseId: string): Promise<ReleaseAttestation | null>;
  validateControls(attestationId: string): Promise<ReleaseAttestation>;
  signAttestation(attestationId: string, signerId: string): Promise<ReleaseAttestation>;

  // Release Gates
  evaluateReleaseGate(
    releaseId: string,
    environment: ReleaseEnvironment
  ): Promise<ReleaseGateResult>;
  canDeploy(attestationId: string): Promise<boolean>;
  getRequiredControls(environment: ReleaseEnvironment): Promise<readonly string[]>;

  // Deployment Binding
  recordDeployment(attestationId: string, deployerId: string): Promise<DeploymentRecord>;
  getDeploymentRecord(deploymentId: string): Promise<DeploymentRecord | null>;
  getDeploymentsForAttestation(attestationId: string): Promise<readonly DeploymentRecord[]>;

  // Waivers
  createWaiver(
    controlId: string,
    reason: string,
    approverId: string,
    expiresAt: Date
  ): Promise<WaiverRecord>;
  getActiveWaiver(controlId: string): Promise<WaiverRecord | null>;
  isControlWaived(controlId: string): Promise<boolean>;

  // Revocation
  revokeAttestation(attestationId: string, reason: string): Promise<ReleaseAttestation>;
  isRevoked(attestationId: string): Promise<boolean>;
}

function createMockReleaseAttestationStore(): ReleaseAttestationStore {
  const attestations: Map<string, ReleaseAttestation> = new Map();
  const releaseToAttestation: Map<string, string> = new Map();
  const deployments: Map<string, DeploymentRecord> = new Map();
  const attestationToDeployments: Map<string, string[]> = new Map();
  const waivers: Map<string, WaiverRecord> = new Map();

  const requiredControlsByEnv: Map<ReleaseEnvironment, string[]> = new Map([
    ['development', ['ctrl-basic-auth']],
    ['staging', ['ctrl-identity', 'ctrl-authz', 'ctrl-secrets']],
    ['production', ['ctrl-identity', 'ctrl-authz', 'ctrl-secrets', 'ctrl-data', 'ctrl-incident']],
    [
      'dr',
      [
        'ctrl-identity',
        'ctrl-authz',
        'ctrl-secrets',
        'ctrl-data',
        'ctrl-incident',
        'ctrl-failover',
      ],
    ],
  ]);

  return {
    async createAttestation(releaseId, commitSha, environment) {
      const attestation = createMockReleaseAttestation({
        release_id: releaseId,
        commit_sha: commitSha,
        environment,
        status: 'pending',
      });
      attestations.set(attestation.attestation_id, attestation);
      releaseToAttestation.set(releaseId, attestation.attestation_id);
      return attestation;
    },

    async getAttestation(attestationId) {
      return attestations.get(attestationId) ?? null;
    },

    async getAttestationByRelease(releaseId) {
      const attestationId = releaseToAttestation.get(releaseId);
      if (!attestationId) return null;
      return attestations.get(attestationId) ?? null;
    },

    async validateControls(attestationId) {
      const attestation = attestations.get(attestationId);
      if (!attestation) throw new Error(`Attestation not found: ${attestationId}`);

      const requiredControls = requiredControlsByEnv.get(attestation.environment) ?? [];
      const validations = requiredControls.map(controlId =>
        createMockControlValidation({ control_id: controlId, status: 'passed' })
      );

      const updated: ReleaseAttestation = {
        ...attestation,
        status: 'validated',
        controls_validated: validations,
      };
      attestations.set(attestationId, updated);
      return updated;
    },

    async signAttestation(attestationId, signerId) {
      const attestation = attestations.get(attestationId);
      if (!attestation) throw new Error(`Attestation not found: ${attestationId}`);

      const signature = createMockAttestationSignature({
        signed_by: `sha256:${Buffer.from(signerId).toString('hex').slice(0, 64)}`,
      });

      const updated: ReleaseAttestation = {
        ...attestation,
        status: 'signed',
        signed_at: new Date().toISOString(),
        signature,
      };
      attestations.set(attestationId, updated);
      return updated;
    },

    async evaluateReleaseGate(releaseId, environment) {
      const requiredControls = requiredControlsByEnv.get(environment) ?? [];
      const attestation = await this.getAttestationByRelease(releaseId);

      if (!attestation) {
        return {
          release_id: releaseId,
          can_deploy: false,
          blocking_controls: requiredControls,
          warnings: ['No attestation found for release'],
          attestation_required: true,
          evaluated_at: new Date().toISOString(),
        };
      }

      const passedControls = new Set(
        attestation.controls_validated
          .filter(c => c.status === 'passed' || c.status === 'waived')
          .map(c => c.control_id)
      );

      const blockingControls = requiredControls.filter(c => !passedControls.has(c));
      const canDeploy = blockingControls.length === 0 && attestation.status === 'signed';

      return {
        release_id: releaseId,
        can_deploy: canDeploy,
        blocking_controls: blockingControls,
        warnings: attestation.status !== 'signed' ? ['Attestation not signed'] : [],
        attestation_required: true,
        evaluated_at: new Date().toISOString(),
      };
    },

    async canDeploy(attestationId) {
      const attestation = attestations.get(attestationId);
      if (!attestation) return false;

      // Must be signed and have all controls passed
      if (attestation.status !== 'signed') return false;

      const failedControls = attestation.controls_validated.filter(c => c.status === 'failed');
      return failedControls.length === 0;
    },

    async getRequiredControls(environment) {
      return requiredControlsByEnv.get(environment) ?? [];
    },

    async recordDeployment(attestationId, deployerId) {
      const attestation = attestations.get(attestationId);
      if (!attestation) throw new Error(`Attestation not found: ${attestationId}`);

      const deployment = createMockDeploymentRecord({
        attestation_id: attestationId,
        environment: attestation.environment,
        deployed_by: `sha256:${Buffer.from(deployerId).toString('hex').slice(0, 64)}`,
      });
      deployments.set(deployment.deployment_id, deployment);

      const existing = attestationToDeployments.get(attestationId) ?? [];
      attestationToDeployments.set(attestationId, [...existing, deployment.deployment_id]);

      const updated: ReleaseAttestation = {
        ...attestation,
        status: 'deployed',
        deployed_at: new Date().toISOString(),
      };
      attestations.set(attestationId, updated);

      return deployment;
    },

    async getDeploymentRecord(deploymentId) {
      return deployments.get(deploymentId) ?? null;
    },

    async getDeploymentsForAttestation(attestationId) {
      const deploymentIds = attestationToDeployments.get(attestationId) ?? [];
      return deploymentIds
        .map(id => deployments.get(id))
        .filter((d): d is DeploymentRecord => d !== undefined);
    },

    async createWaiver(controlId, reason, approverId, expiresAt) {
      const waiver = createMockWaiverRecord({
        control_id: controlId,
        reason,
        approved_by: `sha256:${Buffer.from(approverId).toString('hex').slice(0, 64)}`,
        expires_at: expiresAt.toISOString(),
      });
      waivers.set(controlId, waiver);
      return waiver;
    },

    async getActiveWaiver(controlId) {
      const waiver = waivers.get(controlId);
      if (!waiver) return null;
      if (new Date(waiver.expires_at) < new Date()) return null;
      return waiver;
    },

    async isControlWaived(controlId) {
      const waiver = await this.getActiveWaiver(controlId);
      return waiver !== null;
    },

    async revokeAttestation(attestationId, _reason) {
      const attestation = attestations.get(attestationId);
      if (!attestation) throw new Error(`Attestation not found: ${attestationId}`);

      const updated: ReleaseAttestation = { ...attestation, status: 'revoked' };
      attestations.set(attestationId, updated);
      return updated;
    },

    async isRevoked(attestationId) {
      const attestation = attestations.get(attestationId);
      return attestation?.status === 'revoked';
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Compliance Automation: Release Attestation Contracts', () => {
  let store: ReleaseAttestationStore;

  beforeEach(() => {
    store = createMockReleaseAttestationStore();
  });

  // ==========================================================================
  // CONTRACT: release_attestation_lifecycle
  // ==========================================================================
  describe('CONTRACT: release_attestation_lifecycle', () => {
    it('creates attestation for release', async () => {
      const attestation = await store.createAttestation('release-1', '47949675b', 'staging');

      assert.ok(attestation.attestation_id.startsWith('sha256:'));
      assert.strictEqual(attestation.release_id, 'release-1');
      assert.strictEqual(attestation.commit_sha, '47949675b');
      assert.strictEqual(attestation.status, 'pending');
    });

    it('validates controls for attestation', async () => {
      const attestation = await store.createAttestation('release-2', 'abc123', 'staging');
      const validated = await store.validateControls(attestation.attestation_id);

      assert.strictEqual(validated.status, 'validated');
      assert.ok(validated.controls_validated.length > 0);
    });

    it('signs validated attestation', async () => {
      const attestation = await store.createAttestation('release-3', 'def456', 'production');
      await store.validateControls(attestation.attestation_id);
      const signed = await store.signAttestation(attestation.attestation_id, 'release-signer');

      assert.strictEqual(signed.status, 'signed');
      assert.ok(signed.signature);
      assert.ok(signed.signed_at);
    });

    it('attestation has checksum', async () => {
      const attestation = await store.createAttestation('release-4', 'ghi789', 'staging');

      assert.ok(attestation.checksum.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // CONTRACT: release_gate
  // ==========================================================================
  describe('CONTRACT: release_gate', () => {
    it('blocks deployment without attestation', async () => {
      const result = await store.evaluateReleaseGate('release-no-attest', 'production');

      assert.strictEqual(result.can_deploy, false);
      assert.ok(result.blocking_controls.length > 0);
    });

    it('blocks deployment without signature', async () => {
      const attestation = await store.createAttestation('release-5', 'jkl012', 'staging');
      await store.validateControls(attestation.attestation_id);
      // Not signed

      const result = await store.evaluateReleaseGate('release-5', 'staging');

      assert.strictEqual(result.can_deploy, false);
      assert.ok(result.warnings.some(w => w.includes('not signed')));
    });

    it('allows deployment with signed attestation', async () => {
      const attestation = await store.createAttestation('release-6', 'mno345', 'staging');
      await store.validateControls(attestation.attestation_id);
      await store.signAttestation(attestation.attestation_id, 'signer');

      const result = await store.evaluateReleaseGate('release-6', 'staging');

      assert.strictEqual(result.can_deploy, true);
      assert.strictEqual(result.blocking_controls.length, 0);
    });

    it('production requires more controls', async () => {
      const stagingControls = await store.getRequiredControls('staging');
      const prodControls = await store.getRequiredControls('production');

      assert.ok(prodControls.length > stagingControls.length);
    });
  });

  // ==========================================================================
  // CONTRACT: deployment_binding
  // ==========================================================================
  describe('CONTRACT: deployment_binding', () => {
    it('records deployment with attestation', async () => {
      const attestation = await store.createAttestation('release-7', 'pqr678', 'staging');
      await store.validateControls(attestation.attestation_id);
      await store.signAttestation(attestation.attestation_id, 'signer');

      const deployment = await store.recordDeployment(attestation.attestation_id, 'deployer-1');

      assert.ok(deployment.deployment_id);
      assert.strictEqual(deployment.attestation_id, attestation.attestation_id);
    });

    it('deployment updates attestation status', async () => {
      const attestation = await store.createAttestation('release-8', 'stu901', 'staging');
      await store.validateControls(attestation.attestation_id);
      await store.signAttestation(attestation.attestation_id, 'signer');
      await store.recordDeployment(attestation.attestation_id, 'deployer-2');

      const updated = await store.getAttestation(attestation.attestation_id);

      assert.strictEqual(updated?.status, 'deployed');
      assert.ok(updated?.deployed_at);
    });

    it('retrieves deployments for attestation', async () => {
      const attestation = await store.createAttestation('release-9', 'vwx234', 'staging');
      await store.validateControls(attestation.attestation_id);
      await store.signAttestation(attestation.attestation_id, 'signer');
      await store.recordDeployment(attestation.attestation_id, 'deployer-3');

      const deployments = await store.getDeploymentsForAttestation(attestation.attestation_id);

      assert.strictEqual(deployments.length, 1);
    });

    it('deployer ID is opaque', async () => {
      const attestation = await store.createAttestation('release-10', 'yza567', 'staging');
      await store.validateControls(attestation.attestation_id);
      await store.signAttestation(attestation.attestation_id, 'signer');
      const deployment = await store.recordDeployment(attestation.attestation_id, 'deployer-4');

      assert.ok(deployment.deployed_by.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // CONTRACT: waivers
  // ==========================================================================
  describe('CONTRACT: waivers', () => {
    it('creates waiver for control', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const waiver = await store.createWaiver(
        'ctrl-1',
        'Temporary exemption',
        'approver',
        expiresAt
      );

      assert.ok(waiver.waiver_id);
      assert.strictEqual(waiver.control_id, 'ctrl-1');
      assert.ok(waiver.approved_by.startsWith('sha256:'));
    });

    it('checks if control is waived', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await store.createWaiver('ctrl-waived', 'Exemption', 'approver', expiresAt);

      const isWaived = await store.isControlWaived('ctrl-waived');
      assert.strictEqual(isWaived, true);
    });

    it('non-waived control returns false', async () => {
      const isWaived = await store.isControlWaived('ctrl-not-waived');
      assert.strictEqual(isWaived, false);
    });

    it('expired waiver is not active', async () => {
      const expiredAt = new Date(Date.now() - 1000); // Already expired
      await store.createWaiver('ctrl-expired', 'Expired', 'approver', expiredAt);

      const isWaived = await store.isControlWaived('ctrl-expired');
      assert.strictEqual(isWaived, false);
    });
  });

  // ==========================================================================
  // CONTRACT: revocation
  // ==========================================================================
  describe('CONTRACT: revocation', () => {
    it('revokes attestation', async () => {
      const attestation = await store.createAttestation('release-11', 'bcd890', 'staging');
      await store.validateControls(attestation.attestation_id);
      await store.signAttestation(attestation.attestation_id, 'signer');

      const revoked = await store.revokeAttestation(
        attestation.attestation_id,
        'Security issue found'
      );

      assert.strictEqual(revoked.status, 'revoked');
    });

    it('checks revocation status', async () => {
      const attestation = await store.createAttestation('release-12', 'efg123', 'production');
      await store.validateControls(attestation.attestation_id);
      await store.signAttestation(attestation.attestation_id, 'signer');
      await store.revokeAttestation(attestation.attestation_id, 'Policy violation');

      const isRevoked = await store.isRevoked(attestation.attestation_id);
      assert.strictEqual(isRevoked, true);
    });

    it('revoked attestation cannot deploy', async () => {
      const attestation = await store.createAttestation('release-13', 'hij456', 'staging');
      await store.validateControls(attestation.attestation_id);
      await store.signAttestation(attestation.attestation_id, 'signer');
      await store.revokeAttestation(attestation.attestation_id, 'Revoked');

      const canDeploy = await store.canDeploy(attestation.attestation_id);
      assert.strictEqual(canDeploy, false);
    });
  });
});
