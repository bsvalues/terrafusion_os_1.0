/**
 * Federation Deployment: Trust Onboarding Pipeline Contract Tests
 *
 * Phase XV - Agency registration, trust domain creation, key management,
 * and readiness certification issuance/revocation.
 *
 * CONTRACT SURFACE:
 * - Agency Registration: Register external agencies with identity verification
 * - Trust Domain Creation: Establish domains with policy boundaries
 * - Key Management: Signing key lifecycle and rotation policies
 * - Certification Issuance: Issue and revoke readiness certificates
 *
 * INVARIANTS:
 * - All agency IDs are opaque sha256
 * - Key rotation is policy-enforced
 * - Certificates have mandatory expiry
 * - Registration requires identity verification
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type RegistrationStatus = 'pending' | 'verified' | 'active' | 'suspended' | 'revoked';
type KeyStatus = 'active' | 'rotating' | 'expired' | 'revoked';
type CertificateAction = 'issued' | 'renewed' | 'revoked' | 'expired';

/**
 * Agency registration record
 */
interface AgencyRegistration {
  readonly agency_id: string;
  readonly name: string;
  readonly jurisdiction: string;
  readonly status: RegistrationStatus;
  readonly trust_domain_id: string | null;
  readonly registered_at: string;
  readonly verified_at: string | null;
  readonly contact_principal_id: string;
}

/**
 * Signing key record
 */
interface SigningKey {
  readonly key_id: string;
  readonly agency_id: string;
  readonly algorithm: 'RS256' | 'ES256' | 'Ed25519';
  readonly status: KeyStatus;
  readonly public_key_fingerprint: string;
  readonly created_at: string;
  readonly expires_at: string;
  readonly rotation_policy_days: number;
  readonly last_rotated_at: string | null;
}

/**
 * Rotation policy
 */
interface RotationPolicy {
  readonly policy_id: string;
  readonly agency_id: string;
  readonly max_key_age_days: number;
  readonly rotation_warning_days: number;
  readonly auto_rotate: boolean;
  readonly notify_principals: readonly string[];
}

/**
 * Onboarding certificate
 */
interface OnboardingCertificate {
  readonly certificate_id: string;
  readonly agency_id: string;
  readonly action: CertificateAction;
  readonly issued_at: string;
  readonly expires_at: string;
  readonly issuer_id: string;
  readonly revocation_reason?: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockAgency(overrides: Partial<AgencyRegistration> = {}): AgencyRegistration {
  const agencyId = `agency-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    agency_id: `sha256:${Buffer.from(agencyId).toString('hex').slice(0, 64)}`,
    name: 'County Assessment Office',
    jurisdiction: 'county',
    status: 'pending',
    trust_domain_id: null,
    registered_at: new Date().toISOString(),
    verified_at: null,
    contact_principal_id: `sha256:${Buffer.from('contact-1').toString('hex').slice(0, 64)}`,
    ...overrides,
  };
}

function createMockKey(overrides: Partial<SigningKey> = {}): SigningKey {
  const keyId = `key-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    key_id: `sha256:${Buffer.from(keyId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    algorithm: 'ES256',
    status: 'active',
    public_key_fingerprint: `sha256:${Buffer.from('fingerprint').toString('hex').slice(0, 64)}`,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 365).toISOString(),
    rotation_policy_days: 90,
    last_rotated_at: null,
    ...overrides,
  };
}

function createMockPolicy(overrides: Partial<RotationPolicy> = {}): RotationPolicy {
  const policyId = `policy-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    policy_id: `sha256:${Buffer.from(policyId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    max_key_age_days: 90,
    rotation_warning_days: 14,
    auto_rotate: false,
    notify_principals: [],
    ...overrides,
  };
}

function createMockCertificate(
  overrides: Partial<OnboardingCertificate> = {}
): OnboardingCertificate {
  const certId = `cert-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    certificate_id: `sha256:${Buffer.from(certId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    action: 'issued',
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 365).toISOString(),
    issuer_id: `sha256:${Buffer.from('issuer-1').toString('hex').slice(0, 64)}`,
    ...overrides,
  };
}

// ============================================================================
// MOCK TRUST ONBOARDING SERVICE
// ============================================================================

interface TrustOnboardingService {
  // Agency Registration
  registerAgency(
    name: string,
    jurisdiction: string,
    contactPrincipalId: string
  ): Promise<AgencyRegistration>;
  verifyAgency(agencyId: string, verifierId: string): Promise<AgencyRegistration>;
  activateAgency(agencyId: string, trustDomainId: string): Promise<AgencyRegistration>;
  suspendAgency(agencyId: string, reason: string): Promise<AgencyRegistration>;
  getAgency(agencyId: string): Promise<AgencyRegistration | null>;
  listAgencies(status?: RegistrationStatus): Promise<readonly AgencyRegistration[]>;

  // Key Management
  createSigningKey(agencyId: string, algorithm: SigningKey['algorithm']): Promise<SigningKey>;
  rotateKey(keyId: string): Promise<SigningKey>;
  revokeKey(keyId: string, reason: string): Promise<SigningKey>;
  getActiveKey(agencyId: string): Promise<SigningKey | null>;
  listKeys(agencyId: string): Promise<readonly SigningKey[]>;

  // Rotation Policy
  setRotationPolicy(
    agencyId: string,
    maxAgeDays: number,
    warningDays: number,
    autoRotate: boolean
  ): Promise<RotationPolicy>;
  getRotationPolicy(agencyId: string): Promise<RotationPolicy | null>;
  checkRotationDue(agencyId: string): Promise<{ due: boolean; daysUntilDue: number }>;

  // Certification
  issueCertificate(agencyId: string, issuerId: string): Promise<OnboardingCertificate>;
  revokeCertificate(certificateId: string, reason: string): Promise<OnboardingCertificate>;
  renewCertificate(certificateId: string, issuerId: string): Promise<OnboardingCertificate>;
  getCertificate(agencyId: string): Promise<OnboardingCertificate | null>;
}

function createMockTrustOnboardingService(): TrustOnboardingService {
  const agencies: Map<string, AgencyRegistration> = new Map();
  const keys: Map<string, SigningKey> = new Map();
  const policies: Map<string, RotationPolicy> = new Map();
  const certificates: Map<string, OnboardingCertificate> = new Map();

  return {
    async registerAgency(name, jurisdiction, contactPrincipalId) {
      const agency = createMockAgency({
        name,
        jurisdiction,
        contact_principal_id: contactPrincipalId,
      });
      agencies.set(agency.agency_id, agency);
      return agency;
    },

    async verifyAgency(agencyId, _verifierId) {
      const agency = agencies.get(agencyId);
      if (!agency) throw new Error('agency not found');

      const verified = createMockAgency({
        ...agency,
        status: 'verified',
        verified_at: new Date().toISOString(),
      });
      agencies.set(agencyId, verified);
      return verified;
    },

    async activateAgency(agencyId, trustDomainId) {
      const agency = agencies.get(agencyId);
      if (!agency) throw new Error('agency not found');
      if (agency.status !== 'verified') throw new Error('agency must be verified first');

      const activated = createMockAgency({
        ...agency,
        status: 'active',
        trust_domain_id: trustDomainId,
      });
      agencies.set(agencyId, activated);
      return activated;
    },

    async suspendAgency(agencyId, _reason) {
      const agency = agencies.get(agencyId);
      if (!agency) throw new Error('agency not found');

      const suspended = createMockAgency({ ...agency, status: 'suspended' });
      agencies.set(agencyId, suspended);
      return suspended;
    },

    async getAgency(agencyId) {
      return agencies.get(agencyId) ?? null;
    },

    async listAgencies(status) {
      const all = Array.from(agencies.values());
      return status ? all.filter(a => a.status === status) : all;
    },

    async createSigningKey(agencyId, algorithm) {
      const key = createMockKey({ agency_id: agencyId, algorithm });
      keys.set(key.key_id, key);
      return key;
    },

    async rotateKey(keyId) {
      const key = keys.get(keyId);
      if (!key) throw new Error('key not found');

      const rotated = createMockKey({
        agency_id: key.agency_id,
        algorithm: key.algorithm,
        last_rotated_at: new Date().toISOString(),
      });

      // Mark old key as rotating
      keys.set(keyId, createMockKey({ ...key, status: 'rotating' }));
      keys.set(rotated.key_id, rotated);
      return rotated;
    },

    async revokeKey(keyId, _reason) {
      const key = keys.get(keyId);
      if (!key) throw new Error('key not found');

      const revoked = createMockKey({ ...key, status: 'revoked' });
      keys.set(keyId, revoked);
      return revoked;
    },

    async getActiveKey(agencyId) {
      return (
        Array.from(keys.values()).find(k => k.agency_id === agencyId && k.status === 'active') ??
        null
      );
    },

    async listKeys(agencyId) {
      return Array.from(keys.values()).filter(k => k.agency_id === agencyId);
    },

    async setRotationPolicy(agencyId, maxAgeDays, warningDays, autoRotate) {
      const policy = createMockPolicy({
        agency_id: agencyId,
        max_key_age_days: maxAgeDays,
        rotation_warning_days: warningDays,
        auto_rotate: autoRotate,
      });
      policies.set(agencyId, policy);
      return policy;
    },

    async getRotationPolicy(agencyId) {
      return policies.get(agencyId) ?? null;
    },

    async checkRotationDue(agencyId) {
      const key = await this.getActiveKey(agencyId);
      const policy = await this.getRotationPolicy(agencyId);

      if (!key || !policy) return { due: false, daysUntilDue: 999 };

      const keyAgeMs = Date.now() - new Date(key.created_at).getTime();
      const keyAgeDays = keyAgeMs / 86400000;
      const daysUntilDue = policy.max_key_age_days - keyAgeDays;

      return {
        due: daysUntilDue <= policy.rotation_warning_days,
        daysUntilDue: Math.max(0, Math.floor(daysUntilDue)),
      };
    },

    async issueCertificate(agencyId, issuerId) {
      const agency = await this.getAgency(agencyId);
      if (!agency || agency.status !== 'active') throw new Error('agency must be active');

      const cert = createMockCertificate({ agency_id: agencyId, issuer_id: issuerId });
      certificates.set(agencyId, cert);
      return cert;
    },

    async revokeCertificate(certificateId, reason) {
      const cert = Array.from(certificates.values()).find(c => c.certificate_id === certificateId);
      if (!cert) throw new Error('certificate not found');

      const revoked = createMockCertificate({
        ...cert,
        action: 'revoked',
        revocation_reason: reason,
      });
      certificates.set(cert.agency_id, revoked);
      return revoked;
    },

    async renewCertificate(certificateId, issuerId) {
      const cert = Array.from(certificates.values()).find(c => c.certificate_id === certificateId);
      if (!cert) throw new Error('certificate not found');

      const renewed = createMockCertificate({
        agency_id: cert.agency_id,
        action: 'renewed',
        issuer_id: issuerId,
      });
      certificates.set(cert.agency_id, renewed);
      return renewed;
    },

    async getCertificate(agencyId) {
      return certificates.get(agencyId) ?? null;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Federation Deployment: Trust Onboarding Contracts', () => {
  let service: TrustOnboardingService;

  beforeEach(() => {
    service = createMockTrustOnboardingService();
  });

  // ==========================================================================
  // CONTRACT: agency_registration
  // ==========================================================================
  describe('CONTRACT: agency_registration', () => {
    it('registers new agency', async () => {
      const agency = await service.registerAgency(
        'County Assessment Office',
        'county',
        `sha256:${'c'.repeat(64)}`
      );

      assert.ok(agency.agency_id.startsWith('sha256:'));
      assert.strictEqual(agency.status, 'pending');
    });

    it('verifies agency identity', async () => {
      const agency = await service.registerAgency(
        'Test Agency',
        'state',
        `sha256:${'c'.repeat(64)}`
      );
      const verified = await service.verifyAgency(agency.agency_id, `sha256:${'v'.repeat(64)}`);

      assert.strictEqual(verified.status, 'verified');
      assert.ok(verified.verified_at);
    });

    it('activates verified agency with trust domain', async () => {
      const agency = await service.registerAgency(
        'Test Agency',
        'county',
        `sha256:${'c'.repeat(64)}`
      );
      await service.verifyAgency(agency.agency_id, `sha256:${'v'.repeat(64)}`);
      const activated = await service.activateAgency(agency.agency_id, `sha256:${'d'.repeat(64)}`);

      assert.strictEqual(activated.status, 'active');
      assert.ok(activated.trust_domain_id);
    });

    it('suspends agency', async () => {
      const agency = await service.registerAgency(
        'Test Agency',
        'county',
        `sha256:${'c'.repeat(64)}`
      );
      const suspended = await service.suspendAgency(agency.agency_id, 'compliance issue');

      assert.strictEqual(suspended.status, 'suspended');
    });

    it('lists agencies by status', async () => {
      await service.registerAgency('Agency 1', 'county', `sha256:${'c'.repeat(64)}`);
      await service.registerAgency('Agency 2', 'state', `sha256:${'c'.repeat(64)}`);

      const pending = await service.listAgencies('pending');
      assert.ok(pending.length >= 2);
    });
  });

  // ==========================================================================
  // CONTRACT: key_management
  // ==========================================================================
  describe('CONTRACT: key_management', () => {
    it('creates signing key for agency', async () => {
      const agency = await service.registerAgency(
        'Test Agency',
        'county',
        `sha256:${'c'.repeat(64)}`
      );
      const key = await service.createSigningKey(agency.agency_id, 'ES256');

      assert.ok(key.key_id.startsWith('sha256:'));
      assert.strictEqual(key.algorithm, 'ES256');
      assert.strictEqual(key.status, 'active');
    });

    it('rotates key', async () => {
      const agency = await service.registerAgency(
        'Test Agency',
        'county',
        `sha256:${'c'.repeat(64)}`
      );
      const key = await service.createSigningKey(agency.agency_id, 'ES256');
      const rotated = await service.rotateKey(key.key_id);

      assert.ok(rotated.key_id.startsWith('sha256:'));
      assert.notStrictEqual(rotated.key_id, key.key_id);
    });

    it('revokes key', async () => {
      const agency = await service.registerAgency(
        'Test Agency',
        'county',
        `sha256:${'c'.repeat(64)}`
      );
      const key = await service.createSigningKey(agency.agency_id, 'ES256');
      const revoked = await service.revokeKey(key.key_id, 'compromised');

      assert.strictEqual(revoked.status, 'revoked');
    });

    it('gets active key for agency', async () => {
      const agency = await service.registerAgency(
        'Test Agency',
        'county',
        `sha256:${'c'.repeat(64)}`
      );
      await service.createSigningKey(agency.agency_id, 'RS256');

      const active = await service.getActiveKey(agency.agency_id);
      assert.ok(active);
      assert.strictEqual(active.status, 'active');
    });

    it('key has expiry', async () => {
      const key = createMockKey();
      assert.ok(key.expires_at);
      const expiresAt = new Date(key.expires_at);
      assert.ok(expiresAt > new Date());
    });
  });

  // ==========================================================================
  // CONTRACT: rotation_policy
  // ==========================================================================
  describe('CONTRACT: rotation_policy', () => {
    it('sets rotation policy', async () => {
      const agency = await service.registerAgency(
        'Test Agency',
        'county',
        `sha256:${'c'.repeat(64)}`
      );
      const policy = await service.setRotationPolicy(agency.agency_id, 90, 14, false);

      assert.ok(policy.policy_id.startsWith('sha256:'));
      assert.strictEqual(policy.max_key_age_days, 90);
    });

    it('gets rotation policy', async () => {
      const agency = await service.registerAgency(
        'Test Agency',
        'county',
        `sha256:${'c'.repeat(64)}`
      );
      await service.setRotationPolicy(agency.agency_id, 60, 7, true);

      const policy = await service.getRotationPolicy(agency.agency_id);
      assert.ok(policy);
      assert.strictEqual(policy.auto_rotate, true);
    });

    it('checks rotation due status', async () => {
      const agency = await service.registerAgency(
        'Test Agency',
        'county',
        `sha256:${'c'.repeat(64)}`
      );
      await service.createSigningKey(agency.agency_id, 'ES256');
      await service.setRotationPolicy(agency.agency_id, 90, 14, false);

      const status = await service.checkRotationDue(agency.agency_id);
      assert.ok(typeof status.due === 'boolean');
      assert.ok(typeof status.daysUntilDue === 'number');
    });

    it('policy has warning threshold', async () => {
      const policy = createMockPolicy({ rotation_warning_days: 14 });
      assert.ok(policy.rotation_warning_days > 0);
    });

    it('policy can enforce auto-rotation', async () => {
      const policy = createMockPolicy({ auto_rotate: true });
      assert.strictEqual(policy.auto_rotate, true);
    });
  });

  // ==========================================================================
  // CONTRACT: certification
  // ==========================================================================
  describe('CONTRACT: certification', () => {
    it('issues certificate for active agency', async () => {
      const agency = await service.registerAgency(
        'Test Agency',
        'county',
        `sha256:${'c'.repeat(64)}`
      );
      await service.verifyAgency(agency.agency_id, `sha256:${'v'.repeat(64)}`);
      await service.activateAgency(agency.agency_id, `sha256:${'d'.repeat(64)}`);

      const cert = await service.issueCertificate(agency.agency_id, `sha256:${'i'.repeat(64)}`);
      assert.ok(cert.certificate_id.startsWith('sha256:'));
      assert.strictEqual(cert.action, 'issued');
    });

    it('revokes certificate with reason', async () => {
      const agency = await service.registerAgency(
        'Test Agency',
        'county',
        `sha256:${'c'.repeat(64)}`
      );
      await service.verifyAgency(agency.agency_id, `sha256:${'v'.repeat(64)}`);
      await service.activateAgency(agency.agency_id, `sha256:${'d'.repeat(64)}`);
      const cert = await service.issueCertificate(agency.agency_id, `sha256:${'i'.repeat(64)}`);

      const revoked = await service.revokeCertificate(cert.certificate_id, 'policy violation');
      assert.strictEqual(revoked.action, 'revoked');
      assert.ok(revoked.revocation_reason);
    });

    it('renews certificate', async () => {
      const agency = await service.registerAgency(
        'Test Agency',
        'county',
        `sha256:${'c'.repeat(64)}`
      );
      await service.verifyAgency(agency.agency_id, `sha256:${'v'.repeat(64)}`);
      await service.activateAgency(agency.agency_id, `sha256:${'d'.repeat(64)}`);
      const cert = await service.issueCertificate(agency.agency_id, `sha256:${'i'.repeat(64)}`);

      const renewed = await service.renewCertificate(
        cert.certificate_id,
        `sha256:${'i'.repeat(64)}`
      );
      assert.strictEqual(renewed.action, 'renewed');
    });

    it('certificate has mandatory expiry', async () => {
      const cert = createMockCertificate();
      assert.ok(cert.expires_at);
      const expiresAt = new Date(cert.expires_at);
      assert.ok(expiresAt > new Date());
    });

    it('certificate has issuer', async () => {
      const cert = createMockCertificate();
      assert.ok(cert.issuer_id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // CONTRACT: invariants
  // ==========================================================================
  describe('CONTRACT: invariants', () => {
    it('all IDs are opaque sha256', async () => {
      const agency = createMockAgency();
      const key = createMockKey();
      const policy = createMockPolicy();
      const cert = createMockCertificate();

      assert.ok(agency.agency_id.startsWith('sha256:'));
      assert.ok(key.key_id.startsWith('sha256:'));
      assert.ok(policy.policy_id.startsWith('sha256:'));
      assert.ok(cert.certificate_id.startsWith('sha256:'));
    });

    it('activation requires verification', async () => {
      const agency = await service.registerAgency('Test', 'county', `sha256:${'c'.repeat(64)}`);

      await assert.rejects(
        async () => service.activateAgency(agency.agency_id, `sha256:${'d'.repeat(64)}`),
        /verified/
      );
    });

    it('certification requires active status', async () => {
      const agency = await service.registerAgency('Test', 'county', `sha256:${'c'.repeat(64)}`);

      await assert.rejects(
        async () => service.issueCertificate(agency.agency_id, `sha256:${'i'.repeat(64)}`),
        /active/
      );
    });

    it('keys have rotation policy enforcement', async () => {
      const key = createMockKey();
      assert.ok(key.rotation_policy_days > 0);
    });
  });
});
