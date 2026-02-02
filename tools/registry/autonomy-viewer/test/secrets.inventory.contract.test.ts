/**
 * Secrets Inventory Contract Tests
 * ==================================
 *
 * Phase VI: Validates secrets inventory enumeration and schema validation.
 *
 * Contract:
 * - inventory_enumerates_secrets: all secret refs enumerated (no values ever)
 * - inventory_uses_environment_adapter: env-agnostic source abstraction
 * - inventory_validates_schema: rejects malformed, requires id/class/store
 * - inventory_normalizes_canonically: deterministic sorting + stable hashing
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Secrets Inventory
// ============================================================================

/**
 * Secret class (risk tier).
 */
type SecretClass = 'critical' | 'high' | 'medium' | 'low';

/**
 * Secret store type.
 */
type SecretStoreType =
  | 'vault'
  | 'aws_secrets_manager'
  | 'azure_keyvault'
  | 'gcp_secret_manager'
  | 'k8s_secret';

/**
 * Access level.
 */
type AccessLevel = 'read' | 'write' | 'admin';

/**
 * Principal type.
 */
type PrincipalType = 'user' | 'group' | 'service_principal' | 'workload_identity';

/**
 * Secret reference (NEVER contains actual secret value).
 */
interface SecretRef {
  readonly secretId: string; // Opaque ID (sha256: prefix)
  readonly name: string; // Logical name (e.g., "db-password", not the value)
  readonly secretClass: SecretClass;
  readonly storeType: SecretStoreType;
  readonly storeId: string;
  readonly environment: string;
  readonly createdAt: string;
  readonly lastRotatedAt: string | null;
  readonly rotationPolicyDays: number | null;
  readonly tags: Record<string, string>;
}

/**
 * Access binding for a secret (who can access).
 */
interface SecretAccessBinding {
  readonly bindingId: string;
  readonly secretId: string;
  readonly principalType: PrincipalType;
  readonly principalId: string; // Opaque ID (sha256: prefix)
  readonly accessLevel: AccessLevel;
  readonly scope: string;
  readonly grantedAt: string;
  readonly expiresAt: string | null;
}

/**
 * Secrets inventory.
 */
interface SecretsInventory {
  readonly inventoryId: string;
  readonly collectedAt: string;
  readonly environment: string;
  readonly secrets: readonly SecretRef[];
  readonly accessBindings: readonly SecretAccessBinding[];
  readonly stores: readonly SecretStoreInfo[];
  readonly summary: InventorySummary;
  readonly inventoryHash: string;
}

/**
 * Secret store info.
 */
interface SecretStoreInfo {
  readonly storeId: string;
  readonly storeType: SecretStoreType;
  readonly environment: string;
  readonly secretCount: number;
  readonly supportedFeatures: readonly string[];
}

/**
 * Inventory summary.
 */
interface InventorySummary {
  readonly totalSecrets: number;
  readonly totalBindings: number;
  readonly totalStores: number;
  readonly byClass: Record<SecretClass, number>;
  readonly byStoreType: Record<SecretStoreType, number>;
  readonly byEnvironment: Record<string, number>;
}

/**
 * Secrets source interface (env-agnostic).
 */
interface SecretsSource {
  readonly sourceType: string;
  readonly environment: string;
  listSecrets(): Promise<readonly SecretRef[]>;
  listAccessBindings(): Promise<readonly SecretAccessBinding[]>;
  listStores(): Promise<readonly SecretStoreInfo[]>;
}

/**
 * Schema validation result.
 */
interface SchemaValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

// ============================================================================
// Constants
// ============================================================================

const VALID_SECRET_CLASSES: readonly SecretClass[] = ['critical', 'high', 'medium', 'low'];
const VALID_STORE_TYPES: readonly SecretStoreType[] = [
  'vault',
  'aws_secrets_manager',
  'azure_keyvault',
  'gcp_secret_manager',
  'k8s_secret',
];
const VALID_ACCESS_LEVELS: readonly AccessLevel[] = ['read', 'write', 'admin'];

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Validate secret ref schema.
 */
function validateSecretRef(secret: Partial<SecretRef>): SchemaValidationResult {
  const errors: string[] = [];

  if (!secret.secretId || !secret.secretId.startsWith('sha256:')) {
    errors.push('secretId must be opaque (sha256: prefix)');
  }
  if (!secret.name || typeof secret.name !== 'string') {
    errors.push('name is required');
  }
  if (!secret.secretClass || !VALID_SECRET_CLASSES.includes(secret.secretClass)) {
    errors.push('secretClass must be one of: critical, high, medium, low');
  }
  if (!secret.storeType || !VALID_STORE_TYPES.includes(secret.storeType)) {
    errors.push('storeType must be valid');
  }
  if (!secret.storeId) {
    errors.push('storeId is required');
  }
  if (!secret.environment) {
    errors.push('environment is required');
  }

  // Ensure no actual secret value is present
  if ('value' in secret || 'secretValue' in secret || 'password' in secret) {
    errors.push('Secret value must NEVER be included in inventory');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate access binding schema.
 */
function validateAccessBinding(binding: Partial<SecretAccessBinding>): SchemaValidationResult {
  const errors: string[] = [];

  if (!binding.bindingId) {
    errors.push('bindingId is required');
  }
  if (!binding.secretId || !binding.secretId.startsWith('sha256:')) {
    errors.push('secretId must be opaque');
  }
  if (!binding.principalId || !binding.principalId.startsWith('sha256:')) {
    errors.push('principalId must be opaque');
  }
  if (!binding.accessLevel || !VALID_ACCESS_LEVELS.includes(binding.accessLevel)) {
    errors.push('accessLevel must be read, write, or admin');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Normalize secret for canonical representation.
 */
function normalizeSecret(secret: SecretRef): SecretRef {
  return {
    ...secret,
    tags: Object.fromEntries(Object.entries(secret.tags).sort(([a], [b]) => a.localeCompare(b))),
  };
}

/**
 * Compute inventory hash.
 */
function computeInventoryHash(
  secrets: readonly SecretRef[],
  bindings: readonly SecretAccessBinding[]
): string {
  const normalized = secrets
    .map(normalizeSecret)
    .sort((a, b) => a.secretId.localeCompare(b.secretId));
  const bindingsSorted = [...bindings].sort((a, b) => a.bindingId.localeCompare(b.bindingId));
  const input = JSON.stringify({ secrets: normalized, bindings: bindingsSorted });
  // Simulated hash
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash = hash & hash;
  }
  return `sha256:${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

/**
 * Create mock secrets source.
 */
function createMockSecretsSource(environment: string, secrets: SecretRef[]): SecretsSource {
  return {
    sourceType: 'mock',
    environment,
    async listSecrets() {
      return secrets;
    },
    async listAccessBindings() {
      return secrets.map(s => ({
        bindingId: `BND-${s.secretId.slice(7, 15)}`,
        secretId: s.secretId,
        principalType: 'service_principal' as PrincipalType,
        principalId: `sha256:principal-${s.secretId.slice(7, 15)}`,
        accessLevel: 'read' as AccessLevel,
        scope: '/',
        grantedAt: new Date().toISOString(),
        expiresAt: null,
      }));
    },
    async listStores() {
      const storeMap = new Map<string, SecretStoreInfo>();
      for (const s of secrets) {
        if (!storeMap.has(s.storeId)) {
          storeMap.set(s.storeId, {
            storeId: s.storeId,
            storeType: s.storeType,
            environment,
            secretCount: 0,
            supportedFeatures: ['rotation', 'versioning'],
          });
        }
        const store = storeMap.get(s.storeId)!;
        storeMap.set(s.storeId, { ...store, secretCount: store.secretCount + 1 });
      }
      return Array.from(storeMap.values());
    },
  };
}

/**
 * Create sample secret.
 */
function createSampleSecret(
  options: {
    id?: string;
    name?: string;
    secretClass?: SecretClass;
    storeType?: SecretStoreType;
    environment?: string;
    rotationPolicyDays?: number | null;
  } = {}
): SecretRef {
  const id = options.id ?? `sha256:secret-${Date.now()}`;
  return {
    secretId: id,
    name: options.name ?? 'db-password',
    secretClass: options.secretClass ?? 'high',
    storeType: options.storeType ?? 'vault',
    storeId: 'STORE-VAULT-PROD',
    environment: options.environment ?? 'production',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastRotatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    rotationPolicyDays: options.rotationPolicyDays ?? 90,
    tags: { team: 'platform', service: 'api' },
  };
}

/**
 * Collect inventory from source.
 */
async function collectInventory(source: SecretsSource): Promise<SecretsInventory> {
  const secrets = await source.listSecrets();
  const bindings = await source.listAccessBindings();
  const stores = await source.listStores();

  const byClass: Record<SecretClass, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  const byStoreType: Record<string, number> = {};
  const byEnvironment: Record<string, number> = {};

  for (const s of secrets) {
    byClass[s.secretClass]++;
    byStoreType[s.storeType] = (byStoreType[s.storeType] ?? 0) + 1;
    byEnvironment[s.environment] = (byEnvironment[s.environment] ?? 0) + 1;
  }

  return {
    inventoryId: `INV-${Date.now()}`,
    collectedAt: new Date().toISOString(),
    environment: source.environment,
    secrets,
    accessBindings: bindings,
    stores,
    summary: {
      totalSecrets: secrets.length,
      totalBindings: bindings.length,
      totalStores: stores.length,
      byClass,
      byStoreType: byStoreType as Record<SecretStoreType, number>,
      byEnvironment,
    },
    inventoryHash: computeInventoryHash(secrets, bindings),
  };
}

// ============================================================================
// Contract: inventory_enumerates_secrets
// ============================================================================

describe('Secrets Inventory Contract', () => {
  describe('inventory_enumerates_secrets', () => {
    it('should enumerate all secrets without values', async () => {
      const secrets = [
        createSampleSecret({ id: 'sha256:s1', name: 'db-password' }),
        createSampleSecret({ id: 'sha256:s2', name: 'api-key' }),
        createSampleSecret({ id: 'sha256:s3', name: 'jwt-secret' }),
      ];
      const source = createMockSecretsSource('production', secrets);
      const inventory = await collectInventory(source);

      assert.strictEqual(inventory.secrets.length, 3);
      assert.strictEqual(inventory.summary.totalSecrets, 3);
    });

    it('should never include secret values', async () => {
      const secrets = [createSampleSecret()];
      const source = createMockSecretsSource('production', secrets);
      const inventory = await collectInventory(source);

      for (const secret of inventory.secrets) {
        assert.ok(!('value' in secret));
        assert.ok(!('secretValue' in secret));
        assert.ok(!('password' in secret));
      }
    });

    it('should use opaque IDs for secrets', async () => {
      const secrets = [createSampleSecret()];
      const source = createMockSecretsSource('production', secrets);
      const inventory = await collectInventory(source);

      for (const secret of inventory.secrets) {
        assert.ok(secret.secretId.startsWith('sha256:'));
      }
    });

    it('should enumerate access bindings', async () => {
      const secrets = [createSampleSecret(), createSampleSecret({ id: 'sha256:s2' })];
      const source = createMockSecretsSource('production', secrets);
      const inventory = await collectInventory(source);

      assert.strictEqual(inventory.accessBindings.length, 2);
      assert.strictEqual(inventory.summary.totalBindings, 2);
    });

    it('should enumerate stores', async () => {
      const secrets = [createSampleSecret({ storeType: 'vault' })];
      const source = createMockSecretsSource('production', secrets);
      const inventory = await collectInventory(source);

      assert.ok(inventory.stores.length >= 1);
    });
  });

  // ============================================================================
  // Contract: inventory_uses_environment_adapter
  // ============================================================================

  describe('inventory_uses_environment_adapter', () => {
    it('should work with mock source', async () => {
      const source = createMockSecretsSource('staging', [createSampleSecret()]);

      assert.strictEqual(source.sourceType, 'mock');
      assert.strictEqual(source.environment, 'staging');
    });

    it('should support multiple environments', async () => {
      const prodSource = createMockSecretsSource('production', [createSampleSecret()]);
      const stagingSource = createMockSecretsSource('staging', [createSampleSecret()]);

      const prodInv = await collectInventory(prodSource);
      const stagingInv = await collectInventory(stagingSource);

      assert.strictEqual(prodInv.environment, 'production');
      assert.strictEqual(stagingInv.environment, 'staging');
    });

    it('should include environment in summary', async () => {
      const secrets = [
        createSampleSecret({ environment: 'production' }),
        createSampleSecret({ id: 'sha256:s2', environment: 'production' }),
      ];
      const source = createMockSecretsSource('production', secrets);
      const inventory = await collectInventory(source);

      assert.strictEqual(inventory.summary.byEnvironment['production'], 2);
    });

    it('should collect from source interface', async () => {
      const source = createMockSecretsSource('production', [createSampleSecret()]);
      const secrets = await source.listSecrets();

      assert.ok(Array.isArray(secrets));
      assert.ok(secrets.length > 0);
    });
  });

  // ============================================================================
  // Contract: inventory_validates_schema
  // ============================================================================

  describe('inventory_validates_schema', () => {
    it('should validate valid secret', () => {
      const secret = createSampleSecret();
      const result = validateSecretRef(secret);

      assert.ok(result.valid);
    });

    it('should reject secret without opaque ID', () => {
      const result = validateSecretRef({
        secretId: 'plain-id',
        name: 'test',
        secretClass: 'high',
        storeType: 'vault',
        storeId: 'S1',
        environment: 'prod',
      });

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('opaque')));
    });

    it('should reject secret with value present', () => {
      const result = validateSecretRef({
        secretId: 'sha256:test',
        name: 'test',
        secretClass: 'high',
        storeType: 'vault',
        storeId: 'S1',
        environment: 'prod',
        value: 'super-secret-password', // VIOLATION!
      } as unknown as Partial<SecretRef>);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('NEVER')));
    });

    it('should reject binding with non-opaque principal', () => {
      const result = validateAccessBinding({
        bindingId: 'B1',
        secretId: 'sha256:s1',
        principalId: 'user@example.com', // VIOLATION!
        accessLevel: 'read',
      });

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.includes('opaque')));
    });

    it('should validate valid access binding', () => {
      const result = validateAccessBinding({
        bindingId: 'B1',
        secretId: 'sha256:s1',
        principalId: 'sha256:p1',
        accessLevel: 'read',
      });

      assert.ok(result.valid);
    });
  });

  // ============================================================================
  // Contract: inventory_normalizes_canonically
  // ============================================================================

  describe('inventory_normalizes_canonically', () => {
    it('should sort tags deterministically', () => {
      const secret = createSampleSecret();
      secret.tags['zebra'] = 'last';
      secret.tags['alpha'] = 'first';

      const normalized = normalizeSecret(secret);
      const keys = Object.keys(normalized.tags);

      assert.ok(keys.indexOf('alpha') < keys.indexOf('zebra'));
    });

    it('should compute stable inventory hash', async () => {
      const secrets = [
        createSampleSecret({ id: 'sha256:s1' }),
        createSampleSecret({ id: 'sha256:s2' }),
      ];
      const source = createMockSecretsSource('production', secrets);
      const inv1 = await collectInventory(source);
      const inv2 = await collectInventory(source);

      assert.strictEqual(inv1.inventoryHash, inv2.inventoryHash);
    });

    it('should produce different hash for different secrets', async () => {
      const source1 = createMockSecretsSource('production', [
        createSampleSecret({ id: 'sha256:a' }),
      ]);
      const source2 = createMockSecretsSource('production', [
        createSampleSecret({ id: 'sha256:b' }),
      ]);

      const inv1 = await collectInventory(source1);
      const inv2 = await collectInventory(source2);

      assert.notStrictEqual(inv1.inventoryHash, inv2.inventoryHash);
    });

    it('should include hash in inventory', async () => {
      const source = createMockSecretsSource('production', [createSampleSecret()]);
      const inventory = await collectInventory(source);

      assert.ok(inventory.inventoryHash.startsWith('sha256:'));
    });
  });
});
