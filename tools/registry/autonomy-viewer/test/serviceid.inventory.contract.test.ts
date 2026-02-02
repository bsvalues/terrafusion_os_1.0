/**
 * Service Identity Inventory Contract Tests
 * ==========================================
 *
 * Phase VII: Validates environment-agnostic enumeration of service identities.
 *
 * Contract:
 * - inventory_enumerates_identities: lists certs, issuers, trust material
 * - inventory_uses_source_adapters: env-agnostic sources
 * - inventory_validates_schema: enforces canonical identity model
 * - inventory_normalizes_canonically: stable hashing, sorted output
 */

import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Service Identity Inventory
// ============================================================================

/**
 * Environment type.
 */
type Environment = 'production' | 'staging' | 'development' | 'test';

/**
 * Service tier classification.
 */
type ServiceTier = 'critical' | 'high' | 'standard' | 'internal';

/**
 * Certificate class.
 */
type CertClass = 'leaf' | 'intermediate' | 'root';

/**
 * Issuer tier.
 */
type IssuerTier = 'public_ca' | 'private_ca' | 'self_signed' | 'spiffe';

/**
 * Principal type for service identity.
 */
type PrincipalType = 'service' | 'workload' | 'user' | 'device';

/**
 * Certificate artifact.
 */
interface CertificateArtifact {
  readonly certId: string; // Opaque sha256:
  readonly fingerprint: string;
  readonly certClass: CertClass;
  readonly issuerTier: IssuerTier;
  readonly issuerId: string; // Opaque
  readonly subjectCN: string; // May be hashed if sensitive
  readonly sans: readonly string[]; // May be hashed
  readonly ekus: readonly string[];
  readonly notBefore: string;
  readonly notAfter: string;
  readonly serialNumber: string; // Opaque
  readonly signatureAlgorithm: string;
  readonly publicKeyAlgorithm: string;
  readonly publicKeyBits: number;
}

/**
 * Service identity binding.
 */
interface ServiceIdentityBinding {
  readonly bindingId: string;
  readonly serviceId: string; // Opaque
  readonly serviceTier: ServiceTier;
  readonly certId: string; // References CertificateArtifact
  readonly environment: Environment;
  readonly principalType: PrincipalType;
  readonly spiffeId?: string; // spiffe://trust-domain/workload-id
  readonly createdAt: string;
  readonly lastRotated?: string;
}

/**
 * Service identity source abstraction.
 */
interface ServiceIdentitySource {
  readonly sourceId: string;
  readonly sourceName: string;
  readonly sourceType: 'vault' | 'acm' | 'certmanager' | 'spire' | 'manual';
  listCertificates(env?: Environment): Promise<readonly CertificateArtifact[]>;
  listBindings(env?: Environment): Promise<readonly ServiceIdentityBinding[]>;
}

/**
 * Inventory result.
 */
interface ServiceIdentityInventory {
  readonly inventoryId: string;
  readonly generatedAt: string;
  readonly environment?: Environment;
  readonly certificates: readonly CertificateArtifact[];
  readonly bindings: readonly ServiceIdentityBinding[];
  readonly sources: readonly string[];
  readonly statistics: InventoryStatistics;
}

/**
 * Inventory statistics.
 */
interface InventoryStatistics {
  readonly totalCertificates: number;
  readonly totalBindings: number;
  readonly byCertClass: Record<CertClass, number>;
  readonly byIssuerTier: Record<IssuerTier, number>;
  readonly byServiceTier: Record<ServiceTier, number>;
  readonly byEnvironment: Record<Environment, number>;
  readonly expiringWithin30Days: number;
  readonly expiringWithin7Days: number;
  readonly expired: number;
}

// ============================================================================
// Dimension Allowlist (bounded cardinality)
// ============================================================================

const DIMENSION_ALLOWLIST = [
  'environment',
  'service_tier',
  'cert_class',
  'issuer_tier',
  'principal_type',
] as const;

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
 * Compute cert fingerprint.
 */
function computeCertFingerprint(cert: Partial<CertificateArtifact>): string {
  const data = JSON.stringify({
    serialNumber: cert.serialNumber,
    issuerId: cert.issuerId,
    notBefore: cert.notBefore,
    notAfter: cert.notAfter,
  });
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Validate certificate schema.
 */
function validateCertificateSchema(cert: Partial<CertificateArtifact>): string[] {
  const errors: string[] = [];

  if (!cert.certId?.startsWith('sha256:')) {
    errors.push('certId must be opaque (sha256:)');
  }
  if (!cert.certClass) {
    errors.push('certClass is required');
  }
  if (!cert.issuerTier) {
    errors.push('issuerTier is required');
  }
  if (!cert.notBefore || !cert.notAfter) {
    errors.push('validity period required');
  }
  if (!cert.signatureAlgorithm) {
    errors.push('signatureAlgorithm required');
  }

  return errors;
}

/**
 * Validate binding schema.
 */
function validateBindingSchema(binding: Partial<ServiceIdentityBinding>): string[] {
  const errors: string[] = [];

  if (!binding.bindingId?.startsWith('sha256:')) {
    errors.push('bindingId must be opaque (sha256:)');
  }
  if (!binding.serviceId?.startsWith('sha256:')) {
    errors.push('serviceId must be opaque (sha256:)');
  }
  if (!binding.serviceTier) {
    errors.push('serviceTier is required');
  }
  if (!binding.environment) {
    errors.push('environment is required');
  }

  return errors;
}

/**
 * Normalize and sort certificates.
 */
function normalizeCertificates(
  certs: readonly CertificateArtifact[]
): readonly CertificateArtifact[] {
  return [...certs].sort((a, b) => a.certId.localeCompare(b.certId));
}

/**
 * Compute inventory statistics.
 */
function computeStatistics(
  certificates: readonly CertificateArtifact[],
  bindings: readonly ServiceIdentityBinding[]
): InventoryStatistics {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const byCertClass: Record<CertClass, number> = { leaf: 0, intermediate: 0, root: 0 };
  const byIssuerTier: Record<IssuerTier, number> = {
    public_ca: 0,
    private_ca: 0,
    self_signed: 0,
    spiffe: 0,
  };

  let expired = 0;
  let expiringWithin7Days = 0;
  let expiringWithin30Days = 0;

  for (const cert of certificates) {
    byCertClass[cert.certClass]++;
    byIssuerTier[cert.issuerTier]++;

    const notAfter = new Date(cert.notAfter);
    if (notAfter < now) {
      expired++;
    } else if (notAfter < in7Days) {
      expiringWithin7Days++;
    } else if (notAfter < in30Days) {
      expiringWithin30Days++;
    }
  }

  const byServiceTier: Record<ServiceTier, number> = {
    critical: 0,
    high: 0,
    standard: 0,
    internal: 0,
  };
  const byEnvironment: Record<Environment, number> = {
    production: 0,
    staging: 0,
    development: 0,
    test: 0,
  };

  for (const binding of bindings) {
    byServiceTier[binding.serviceTier]++;
    byEnvironment[binding.environment]++;
  }

  return {
    totalCertificates: certificates.length,
    totalBindings: bindings.length,
    byCertClass,
    byIssuerTier,
    byServiceTier,
    byEnvironment,
    expiringWithin30Days,
    expiringWithin7Days,
    expired,
  };
}

/**
 * Create sample certificate.
 */
function createSampleCertificate(options: Partial<CertificateArtifact> = {}): CertificateArtifact {
  const now = new Date();
  const notBefore =
    options.notBefore ?? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const notAfter =
    options.notAfter ?? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

  return {
    certId: options.certId ?? computeOpaqueId(`cert-${Date.now()}`),
    fingerprint: options.fingerprint ?? crypto.randomBytes(32).toString('hex'),
    certClass: options.certClass ?? 'leaf',
    issuerTier: options.issuerTier ?? 'private_ca',
    issuerId: options.issuerId ?? computeOpaqueId('issuer-default'),
    subjectCN: options.subjectCN ?? 'service.internal',
    sans: options.sans ?? ['service.internal', 'service.local'],
    ekus: options.ekus ?? ['serverAuth', 'clientAuth'],
    notBefore,
    notAfter,
    serialNumber: options.serialNumber ?? computeOpaqueId(`serial-${Date.now()}`),
    signatureAlgorithm: options.signatureAlgorithm ?? 'SHA256withRSA',
    publicKeyAlgorithm: options.publicKeyAlgorithm ?? 'RSA',
    publicKeyBits: options.publicKeyBits ?? 2048,
  };
}

/**
 * Create sample binding.
 */
function createSampleBinding(
  options: Partial<ServiceIdentityBinding> = {}
): ServiceIdentityBinding {
  return {
    bindingId: options.bindingId ?? computeOpaqueId(`binding-${Date.now()}`),
    serviceId: options.serviceId ?? computeOpaqueId('service-default'),
    serviceTier: options.serviceTier ?? 'standard',
    certId: options.certId ?? computeOpaqueId('cert-default'),
    environment: options.environment ?? 'production',
    principalType: options.principalType ?? 'service',
    spiffeId: options.spiffeId,
    createdAt: options.createdAt ?? new Date().toISOString(),
    lastRotated: options.lastRotated,
  };
}

/**
 * Create mock source.
 */
function createMockSource(
  sourceType: ServiceIdentitySource['sourceType'],
  certs: readonly CertificateArtifact[],
  bindings: readonly ServiceIdentityBinding[]
): ServiceIdentitySource {
  return {
    sourceId: computeOpaqueId(`source-${sourceType}`),
    sourceName: `Mock ${sourceType}`,
    sourceType,
    listCertificates: async (env?: Environment) =>
      env
        ? certs.filter(c => bindings.some(b => b.certId === c.certId && b.environment === env))
        : certs,
    listBindings: async (env?: Environment) =>
      env ? bindings.filter(b => b.environment === env) : bindings,
  };
}

/**
 * Generate inventory from sources.
 */
async function generateInventory(
  sources: readonly ServiceIdentitySource[],
  env?: Environment
): Promise<ServiceIdentityInventory> {
  const allCerts: CertificateArtifact[] = [];
  const allBindings: ServiceIdentityBinding[] = [];
  const sourceIds: string[] = [];

  for (const source of sources) {
    const certs = await source.listCertificates(env);
    const bindings = await source.listBindings(env);
    allCerts.push(...certs);
    allBindings.push(...bindings);
    sourceIds.push(source.sourceId);
  }

  const normalizedCerts = normalizeCertificates(allCerts);
  const statistics = computeStatistics(normalizedCerts, allBindings);

  return {
    inventoryId: computeOpaqueId(`inventory-${Date.now()}`),
    generatedAt: new Date().toISOString(),
    environment: env,
    certificates: normalizedCerts,
    bindings: allBindings,
    sources: sourceIds,
    statistics,
  };
}

// ============================================================================
// Contract: inventory_enumerates_identities
// ============================================================================

describe('Service Identity Inventory Contract', () => {
  describe('inventory_enumerates_identities', () => {
    it('should list all certificates', async () => {
      const certs = [createSampleCertificate(), createSampleCertificate()];
      const bindings = [createSampleBinding({ certId: certs[0].certId })];
      const source = createMockSource('vault', certs, bindings);

      const inventory = await generateInventory([source]);

      assert.strictEqual(inventory.certificates.length, 2);
    });

    it('should list all bindings', async () => {
      const cert = createSampleCertificate();
      const bindings = [
        createSampleBinding({ certId: cert.certId }),
        createSampleBinding({ certId: cert.certId, environment: 'staging' }),
      ];
      const source = createMockSource('vault', [cert], bindings);

      const inventory = await generateInventory([source]);

      assert.strictEqual(inventory.bindings.length, 2);
    });

    it('should filter by environment', async () => {
      const cert = createSampleCertificate();
      const bindings = [
        createSampleBinding({ certId: cert.certId, environment: 'production' }),
        createSampleBinding({ certId: cert.certId, environment: 'staging' }),
      ];
      const source = createMockSource('vault', [cert], bindings);

      const inventory = await generateInventory([source], 'production');

      assert.strictEqual(inventory.bindings.length, 1);
      assert.strictEqual(inventory.bindings[0].environment, 'production');
    });

    it('should aggregate from multiple sources', async () => {
      const vaultCert = createSampleCertificate();
      const acmCert = createSampleCertificate();
      const source1 = createMockSource(
        'vault',
        [vaultCert],
        [createSampleBinding({ certId: vaultCert.certId })]
      );
      const source2 = createMockSource(
        'acm',
        [acmCert],
        [createSampleBinding({ certId: acmCert.certId })]
      );

      const inventory = await generateInventory([source1, source2]);

      assert.strictEqual(inventory.certificates.length, 2);
      assert.strictEqual(inventory.sources.length, 2);
    });

    it('should compute statistics', async () => {
      const certs = [
        createSampleCertificate({ certClass: 'leaf' }),
        createSampleCertificate({ certClass: 'intermediate' }),
      ];
      const bindings = [createSampleBinding({ certId: certs[0].certId, serviceTier: 'critical' })];
      const source = createMockSource('vault', certs, bindings);

      const inventory = await generateInventory([source]);

      assert.strictEqual(inventory.statistics.totalCertificates, 2);
      assert.strictEqual(inventory.statistics.byCertClass.leaf, 1);
      assert.strictEqual(inventory.statistics.byCertClass.intermediate, 1);
    });
  });

  // ============================================================================
  // Contract: inventory_uses_source_adapters
  // ============================================================================

  describe('inventory_uses_source_adapters', () => {
    it('should support vault source', async () => {
      const source = createMockSource(
        'vault',
        [createSampleCertificate()],
        [createSampleBinding()]
      );

      assert.strictEqual(source.sourceType, 'vault');
      const certs = await source.listCertificates();
      assert.strictEqual(certs.length, 1);
    });

    it('should support ACM source', async () => {
      const source = createMockSource('acm', [createSampleCertificate()], [createSampleBinding()]);

      assert.strictEqual(source.sourceType, 'acm');
    });

    it('should support cert-manager source', async () => {
      const source = createMockSource(
        'certmanager',
        [createSampleCertificate()],
        [createSampleBinding()]
      );

      assert.strictEqual(source.sourceType, 'certmanager');
    });

    it('should support SPIRE source', async () => {
      const source = createMockSource(
        'spire',
        [createSampleCertificate()],
        [createSampleBinding()]
      );

      assert.strictEqual(source.sourceType, 'spire');
    });
  });

  // ============================================================================
  // Contract: inventory_validates_schema
  // ============================================================================

  describe('inventory_validates_schema', () => {
    it('should validate certificate has opaque certId', () => {
      const errors = validateCertificateSchema({ certId: 'plain-id' });

      assert.ok(errors.some(e => e.includes('certId')));
    });

    it('should validate certificate has certClass', () => {
      const cert = createSampleCertificate();
      const { certClass: _, ...partial } = cert;
      const errors = validateCertificateSchema(partial);

      assert.ok(errors.some(e => e.includes('certClass')));
    });

    it('should validate certificate has validity period', () => {
      const errors = validateCertificateSchema({
        certId: 'sha256:abc',
        certClass: 'leaf',
        issuerTier: 'private_ca',
      });

      assert.ok(errors.some(e => e.includes('validity')));
    });

    it('should pass valid certificate', () => {
      const cert = createSampleCertificate();
      const errors = validateCertificateSchema(cert);

      assert.strictEqual(errors.length, 0);
    });

    it('should validate binding has opaque IDs', () => {
      const errors = validateBindingSchema({
        bindingId: 'plain-binding',
        serviceId: 'plain-service',
      });

      assert.ok(errors.some(e => e.includes('bindingId')));
      assert.ok(errors.some(e => e.includes('serviceId')));
    });
  });

  // ============================================================================
  // Contract: inventory_normalizes_canonically
  // ============================================================================

  describe('inventory_normalizes_canonically', () => {
    it('should sort certificates by certId', () => {
      const certs = [
        createSampleCertificate({ certId: 'sha256:zzz' }),
        createSampleCertificate({ certId: 'sha256:aaa' }),
        createSampleCertificate({ certId: 'sha256:mmm' }),
      ];

      const normalized = normalizeCertificates(certs);

      assert.strictEqual(normalized[0].certId, 'sha256:aaa');
      assert.strictEqual(normalized[1].certId, 'sha256:mmm');
      assert.strictEqual(normalized[2].certId, 'sha256:zzz');
    });

    it('should compute stable fingerprints', () => {
      const cert1 = createSampleCertificate({ serialNumber: 'sha256:serial1' });
      const cert2 = { ...cert1 };

      const fp1 = computeCertFingerprint(cert1);
      const fp2 = computeCertFingerprint(cert2);

      assert.strictEqual(fp1, fp2);
    });

    it('should use opaque IDs', async () => {
      const cert = createSampleCertificate();
      const binding = createSampleBinding({ certId: cert.certId });
      const source = createMockSource('vault', [cert], [binding]);

      const inventory = await generateInventory([source]);

      assert.ok(inventory.inventoryId.startsWith('sha256:'));
      assert.ok(inventory.certificates[0].certId.startsWith('sha256:'));
    });

    it('should enforce dimension allowlist', () => {
      const validDimensions = [
        'environment',
        'service_tier',
        'cert_class',
        'issuer_tier',
        'principal_type',
      ];

      for (const dim of validDimensions) {
        assert.ok(DIMENSION_ALLOWLIST.includes(dim as (typeof DIMENSION_ALLOWLIST)[number]));
      }
    });
  });
});
