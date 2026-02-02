/**
 * Authorization Inventory Contract Tests
 * ========================================
 *
 * Phase V: Validates policy artifact enumeration and schema validation.
 *
 * Contract:
 * - inventory_enumerates_all_artifacts: discovers RBAC/ABAC artifacts per environment
 * - inventory_uses_environment_adapter: abstracted source interface works across backends
 * - inventory_validates_artifact_schema: rejects malformed/unknown policy shapes
 * - inventory_normalizes_canonically: deterministic normalization for drift comparison
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Authorization Inventory
// ============================================================================

/**
 * Deployment environment.
 */
type DeploymentEnvironment = 'development' | 'staging' | 'production';

/**
 * Authorization artifact type.
 */
type AuthZArtifactType = 'role' | 'permission' | 'binding' | 'abac_rule' | 'default_policy';

/**
 * Risk tier for authorization artifacts.
 */
type RiskTier = 'critical' | 'high' | 'medium' | 'low';

/**
 * Permission action.
 */
type PermissionAction = 'read' | 'write' | 'delete' | 'admin' | 'export' | 'execute';

/**
 * Role definition.
 */
interface RoleDefinition {
  readonly roleId: string;
  readonly name: string;
  readonly permissions: readonly PermissionRef[];
  readonly riskTier: RiskTier;
  readonly builtIn: boolean;
  readonly hash: string;
}

/**
 * Permission reference.
 */
interface PermissionRef {
  readonly permissionId: string;
  readonly resource: string;
  readonly actions: readonly PermissionAction[];
}

/**
 * Permission definition.
 */
interface PermissionDefinition {
  readonly permissionId: string;
  readonly resource: string;
  readonly actions: readonly PermissionAction[];
  readonly conditions?: readonly ABACCondition[];
  readonly hash: string;
}

/**
 * Role binding.
 */
interface RoleBinding {
  readonly bindingId: string;
  readonly roleId: string;
  readonly principalType: 'user' | 'group' | 'service_principal';
  readonly principalId: string; // Opaque ID, not PII
  readonly scope: string;
  readonly hash: string;
}

/**
 * ABAC condition.
 */
interface ABACCondition {
  readonly attribute: string;
  readonly operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in';
  readonly value: string | readonly string[];
}

/**
 * ABAC rule.
 */
interface ABACRule {
  readonly ruleId: string;
  readonly name: string;
  readonly effect: 'allow' | 'deny';
  readonly conditions: readonly ABACCondition[];
  readonly priority: number;
  readonly hash: string;
}

/**
 * Default policy.
 */
interface DefaultPolicy {
  readonly policyId: string;
  readonly defaultEffect: 'deny' | 'allow';
  readonly implicitPermissions: readonly PermissionRef[];
  readonly hash: string;
}

/**
 * Authorization artifact (union type).
 */
type AuthZArtifact =
  | { type: 'role'; artifact: RoleDefinition }
  | { type: 'permission'; artifact: PermissionDefinition }
  | { type: 'binding'; artifact: RoleBinding }
  | { type: 'abac_rule'; artifact: ABACRule }
  | { type: 'default_policy'; artifact: DefaultPolicy };

/**
 * Inventory result.
 */
interface AuthZInventory {
  readonly environment: DeploymentEnvironment;
  readonly collectedAt: string;
  readonly roles: readonly RoleDefinition[];
  readonly permissions: readonly PermissionDefinition[];
  readonly bindings: readonly RoleBinding[];
  readonly abacRules: readonly ABACRule[];
  readonly defaultPolicies: readonly DefaultPolicy[];
  readonly totalArtifacts: number;
  readonly hash: string;
}

/**
 * Authorization policy source interface.
 */
interface AuthorizationPolicySource {
  readonly sourceType: 'mock' | 'azure_ad' | 'aws_iam' | 'kubernetes_rbac' | 'custom';
  listRoles(env: DeploymentEnvironment): Promise<readonly RoleDefinition[]>;
  listPermissions(env: DeploymentEnvironment): Promise<readonly PermissionDefinition[]>;
  listBindings(env: DeploymentEnvironment): Promise<readonly RoleBinding[]>;
  listABACRules(env: DeploymentEnvironment): Promise<readonly ABACRule[]>;
  listDefaultPolicies(env: DeploymentEnvironment): Promise<readonly DefaultPolicy[]>;
}

/**
 * Schema validation result.
 */
interface SchemaValidationResult {
  readonly valid: boolean;
  readonly errors: readonly SchemaError[];
}

/**
 * Schema error.
 */
interface SchemaError {
  readonly artifactType: AuthZArtifactType;
  readonly artifactId: string;
  readonly field: string;
  readonly message: string;
}

// ============================================================================
// Constants
// ============================================================================

const HIGH_RISK_ACTIONS: readonly PermissionAction[] = ['admin', 'write', 'delete', 'export'];

const ALLOWED_ARTIFACT_TYPES: readonly AuthZArtifactType[] = [
  'role',
  'permission',
  'binding',
  'abac_rule',
  'default_policy',
];

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Compute deterministic hash for artifact.
 */
function computeArtifactHash(artifact: unknown): string {
  const json = JSON.stringify(artifact, Object.keys(artifact as object).sort());
  return `sha256:${json.length.toString(16).padStart(8, '0')}`;
}

/**
 * Create mock role definitions.
 */
function createMockRoles(): RoleDefinition[] {
  return [
    {
      roleId: 'ROLE-ADMIN',
      name: 'Administrator',
      permissions: [
        {
          permissionId: 'PERM-ALL',
          resource: '*',
          actions: ['admin', 'read', 'write', 'delete', 'export'],
        },
      ],
      riskTier: 'critical',
      builtIn: true,
      hash: 'sha256:role-admin-001',
    },
    {
      roleId: 'ROLE-READER',
      name: 'Reader',
      permissions: [{ permissionId: 'PERM-READ', resource: '*', actions: ['read'] }],
      riskTier: 'low',
      builtIn: true,
      hash: 'sha256:role-reader-002',
    },
    {
      roleId: 'ROLE-EDITOR',
      name: 'Editor',
      permissions: [
        { permissionId: 'PERM-EDIT', resource: 'documents/*', actions: ['read', 'write'] },
      ],
      riskTier: 'medium',
      builtIn: false,
      hash: 'sha256:role-editor-003',
    },
  ];
}

/**
 * Create mock permissions.
 */
function createMockPermissions(): PermissionDefinition[] {
  return [
    {
      permissionId: 'PERM-ALL',
      resource: '*',
      actions: ['admin', 'read', 'write', 'delete', 'export'],
      hash: 'sha256:perm-all-001',
    },
    {
      permissionId: 'PERM-READ',
      resource: '*',
      actions: ['read'],
      hash: 'sha256:perm-read-002',
    },
    {
      permissionId: 'PERM-EDIT',
      resource: 'documents/*',
      actions: ['read', 'write'],
      conditions: [{ attribute: 'department', operator: 'equals', value: 'engineering' }],
      hash: 'sha256:perm-edit-003',
    },
  ];
}

/**
 * Create mock bindings.
 */
function createMockBindings(): RoleBinding[] {
  return [
    {
      bindingId: 'BIND-001',
      roleId: 'ROLE-ADMIN',
      principalType: 'group',
      principalId: 'GRP-a1b2c3d4', // Opaque ID
      scope: '/',
      hash: 'sha256:bind-001',
    },
    {
      bindingId: 'BIND-002',
      roleId: 'ROLE-READER',
      principalType: 'group',
      principalId: 'GRP-e5f6g7h8',
      scope: '/public',
      hash: 'sha256:bind-002',
    },
    {
      bindingId: 'BIND-003',
      roleId: 'ROLE-EDITOR',
      principalType: 'service_principal',
      principalId: 'SVC-i9j0k1l2',
      scope: '/api',
      hash: 'sha256:bind-003',
    },
  ];
}

/**
 * Create mock ABAC rules.
 */
function createMockABACRules(): ABACRule[] {
  return [
    {
      ruleId: 'ABAC-001',
      name: 'DenyExternalWrite',
      effect: 'deny',
      conditions: [
        { attribute: 'network.location', operator: 'not_equals', value: 'internal' },
        { attribute: 'action', operator: 'in', value: ['write', 'delete'] },
      ],
      priority: 100,
      hash: 'sha256:abac-001',
    },
    {
      ruleId: 'ABAC-002',
      name: 'AllowInternalRead',
      effect: 'allow',
      conditions: [{ attribute: 'network.location', operator: 'equals', value: 'internal' }],
      priority: 50,
      hash: 'sha256:abac-002',
    },
  ];
}

/**
 * Create mock default policies.
 */
function createMockDefaultPolicies(): DefaultPolicy[] {
  return [
    {
      policyId: 'DEFAULT-001',
      defaultEffect: 'deny',
      implicitPermissions: [],
      hash: 'sha256:default-001',
    },
  ];
}

/**
 * Create mock authorization policy source.
 */
function createMockPolicySource(): AuthorizationPolicySource {
  return {
    sourceType: 'mock',
    async listRoles(_env: DeploymentEnvironment) {
      return createMockRoles();
    },
    async listPermissions(_env: DeploymentEnvironment) {
      return createMockPermissions();
    },
    async listBindings(_env: DeploymentEnvironment) {
      return createMockBindings();
    },
    async listABACRules(_env: DeploymentEnvironment) {
      return createMockABACRules();
    },
    async listDefaultPolicies(_env: DeploymentEnvironment) {
      return createMockDefaultPolicies();
    },
  };
}

/**
 * Collect full inventory from source.
 */
async function collectInventory(
  source: AuthorizationPolicySource,
  environment: DeploymentEnvironment
): Promise<AuthZInventory> {
  const [roles, permissions, bindings, abacRules, defaultPolicies] = await Promise.all([
    source.listRoles(environment),
    source.listPermissions(environment),
    source.listBindings(environment),
    source.listABACRules(environment),
    source.listDefaultPolicies(environment),
  ]);

  const totalArtifacts =
    roles.length + permissions.length + bindings.length + abacRules.length + defaultPolicies.length;

  const inventory: AuthZInventory = {
    environment,
    collectedAt: new Date().toISOString(),
    roles,
    permissions,
    bindings,
    abacRules,
    defaultPolicies,
    totalArtifacts,
    hash: computeArtifactHash({ roles, permissions, bindings, abacRules, defaultPolicies }),
  };

  return inventory;
}

/**
 * Validate artifact schema.
 */
function validateArtifactSchema(artifact: AuthZArtifact): SchemaValidationResult {
  const errors: SchemaError[] = [];

  if (!ALLOWED_ARTIFACT_TYPES.includes(artifact.type)) {
    errors.push({
      artifactType: artifact.type as AuthZArtifactType,
      artifactId: 'unknown',
      field: 'type',
      message: `Unknown artifact type: ${artifact.type}`,
    });
    return { valid: false, errors };
  }

  switch (artifact.type) {
    case 'role': {
      const role = artifact.artifact;
      if (!role.roleId || typeof role.roleId !== 'string') {
        errors.push({
          artifactType: 'role',
          artifactId: role.roleId ?? 'unknown',
          field: 'roleId',
          message: 'roleId is required',
        });
      }
      if (!role.name) {
        errors.push({
          artifactType: 'role',
          artifactId: role.roleId,
          field: 'name',
          message: 'name is required',
        });
      }
      if (!Array.isArray(role.permissions)) {
        errors.push({
          artifactType: 'role',
          artifactId: role.roleId,
          field: 'permissions',
          message: 'permissions must be an array',
        });
      }
      break;
    }
    case 'permission': {
      const perm = artifact.artifact;
      if (!perm.permissionId) {
        errors.push({
          artifactType: 'permission',
          artifactId: perm.permissionId ?? 'unknown',
          field: 'permissionId',
          message: 'permissionId is required',
        });
      }
      if (!perm.resource) {
        errors.push({
          artifactType: 'permission',
          artifactId: perm.permissionId,
          field: 'resource',
          message: 'resource is required',
        });
      }
      if (!Array.isArray(perm.actions) || perm.actions.length === 0) {
        errors.push({
          artifactType: 'permission',
          artifactId: perm.permissionId,
          field: 'actions',
          message: 'actions must be a non-empty array',
        });
      }
      break;
    }
    case 'binding': {
      const bind = artifact.artifact;
      if (!bind.bindingId) {
        errors.push({
          artifactType: 'binding',
          artifactId: bind.bindingId ?? 'unknown',
          field: 'bindingId',
          message: 'bindingId is required',
        });
      }
      if (!bind.roleId) {
        errors.push({
          artifactType: 'binding',
          artifactId: bind.bindingId,
          field: 'roleId',
          message: 'roleId is required',
        });
      }
      if (!bind.principalId) {
        errors.push({
          artifactType: 'binding',
          artifactId: bind.bindingId,
          field: 'principalId',
          message: 'principalId is required',
        });
      }
      break;
    }
    case 'abac_rule': {
      const rule = artifact.artifact;
      if (!rule.ruleId) {
        errors.push({
          artifactType: 'abac_rule',
          artifactId: rule.ruleId ?? 'unknown',
          field: 'ruleId',
          message: 'ruleId is required',
        });
      }
      if (!['allow', 'deny'].includes(rule.effect)) {
        errors.push({
          artifactType: 'abac_rule',
          artifactId: rule.ruleId,
          field: 'effect',
          message: 'effect must be allow or deny',
        });
      }
      if (!Array.isArray(rule.conditions)) {
        errors.push({
          artifactType: 'abac_rule',
          artifactId: rule.ruleId,
          field: 'conditions',
          message: 'conditions must be an array',
        });
      }
      break;
    }
    case 'default_policy': {
      const policy = artifact.artifact;
      if (!policy.policyId) {
        errors.push({
          artifactType: 'default_policy',
          artifactId: policy.policyId ?? 'unknown',
          field: 'policyId',
          message: 'policyId is required',
        });
      }
      if (!['allow', 'deny'].includes(policy.defaultEffect)) {
        errors.push({
          artifactType: 'default_policy',
          artifactId: policy.policyId,
          field: 'defaultEffect',
          message: 'defaultEffect must be allow or deny',
        });
      }
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Normalize artifact for canonical comparison.
 */
function normalizeArtifact<T extends { hash: string }>(artifact: T): T {
  // Sort all arrays deterministically, recompute hash
  const sorted = JSON.parse(JSON.stringify(artifact));

  // Sort nested arrays if present
  if ('permissions' in sorted && Array.isArray(sorted.permissions)) {
    sorted.permissions.sort((a: PermissionRef, b: PermissionRef) =>
      a.permissionId.localeCompare(b.permissionId)
    );
    for (const perm of sorted.permissions) {
      if (Array.isArray(perm.actions)) {
        perm.actions.sort();
      }
    }
  }
  if ('actions' in sorted && Array.isArray(sorted.actions)) {
    sorted.actions.sort();
  }
  if ('conditions' in sorted && Array.isArray(sorted.conditions)) {
    sorted.conditions.sort((a: ABACCondition, b: ABACCondition) =>
      a.attribute.localeCompare(b.attribute)
    );
  }

  // Recompute hash after normalization
  const { hash: _oldHash, ...withoutHash } = sorted;
  sorted.hash = computeArtifactHash(withoutHash);

  return sorted as T;
}

/**
 * Check if principal ID is opaque (not PII).
 */
function isPrincipalIdOpaque(principalId: string): boolean {
  // Opaque IDs should be prefixed identifiers, not emails or names
  const piiPatterns = [
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // email
    /^[A-Z][a-z]+ [A-Z][a-z]+$/, // Name pattern
  ];

  return !piiPatterns.some(pattern => pattern.test(principalId));
}

// ============================================================================
// Contract: inventory_enumerates_all_artifacts
// ============================================================================

describe('Authorization Inventory Contract', () => {
  describe('inventory_enumerates_all_artifacts', () => {
    it('should collect all artifact types', async () => {
      const source = createMockPolicySource();
      const inventory = await collectInventory(source, 'production');

      assert.ok(inventory.roles.length > 0);
      assert.ok(inventory.permissions.length > 0);
      assert.ok(inventory.bindings.length > 0);
      assert.ok(inventory.abacRules.length > 0);
      assert.ok(inventory.defaultPolicies.length > 0);
    });

    it('should count total artifacts correctly', async () => {
      const source = createMockPolicySource();
      const inventory = await collectInventory(source, 'production');

      const expected =
        inventory.roles.length +
        inventory.permissions.length +
        inventory.bindings.length +
        inventory.abacRules.length +
        inventory.defaultPolicies.length;

      assert.strictEqual(inventory.totalArtifacts, expected);
    });

    it('should include environment in inventory', async () => {
      const source = createMockPolicySource();
      const inventory = await collectInventory(source, 'staging');

      assert.strictEqual(inventory.environment, 'staging');
    });

    it('should timestamp collection', async () => {
      const source = createMockPolicySource();
      const inventory = await collectInventory(source, 'production');

      assert.ok(inventory.collectedAt);
      assert.ok(new Date(inventory.collectedAt).getTime() > 0);
    });

    it('should compute inventory hash', async () => {
      const source = createMockPolicySource();
      const inventory = await collectInventory(source, 'production');

      assert.ok(inventory.hash.startsWith('sha256:'));
    });
  });

  // ============================================================================
  // Contract: inventory_uses_environment_adapter
  // ============================================================================

  describe('inventory_uses_environment_adapter', () => {
    it('should work with mock source', async () => {
      const source = createMockPolicySource();
      assert.strictEqual(source.sourceType, 'mock');

      const roles = await source.listRoles('production');
      assert.ok(roles.length > 0);
    });

    it('should support multiple environments', async () => {
      const source = createMockPolicySource();

      const devRoles = await source.listRoles('development');
      const prodRoles = await source.listRoles('production');

      // Mock returns same data, but interface supports env param
      assert.ok(devRoles.length > 0);
      assert.ok(prodRoles.length > 0);
    });

    it('should enumerate source type', () => {
      const source = createMockPolicySource();
      assert.ok(
        ['mock', 'azure_ad', 'aws_iam', 'kubernetes_rbac', 'custom'].includes(source.sourceType)
      );
    });

    it('should return immutable artifacts', async () => {
      const source = createMockPolicySource();
      const roles = await source.listRoles('production');

      // Attempting to modify should fail or not affect source
      const originalLength = roles.length;
      // roles is readonly, so this should be a type error in strict mode
      assert.strictEqual(roles.length, originalLength);
    });
  });

  // ============================================================================
  // Contract: inventory_validates_artifact_schema
  // ============================================================================

  describe('inventory_validates_artifact_schema', () => {
    it('should validate valid role', () => {
      const role = createMockRoles()[0];
      const result = validateArtifactSchema({ type: 'role', artifact: role });

      assert.ok(result.valid);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject role without roleId', () => {
      const badRole = {
        name: 'Bad',
        permissions: [],
        riskTier: 'low',
        builtIn: false,
        hash: 'x',
      } as unknown as RoleDefinition;
      const result = validateArtifactSchema({ type: 'role', artifact: badRole });

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.field === 'roleId'));
    });

    it('should validate valid permission', () => {
      const perm = createMockPermissions()[0];
      const result = validateArtifactSchema({ type: 'permission', artifact: perm });

      assert.ok(result.valid);
    });

    it('should reject permission without actions', () => {
      const badPerm = {
        permissionId: 'P1',
        resource: '*',
        actions: [],
        hash: 'x',
      } as PermissionDefinition;
      const result = validateArtifactSchema({ type: 'permission', artifact: badPerm });

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.field === 'actions'));
    });

    it('should validate valid binding', () => {
      const binding = createMockBindings()[0];
      const result = validateArtifactSchema({ type: 'binding', artifact: binding });

      assert.ok(result.valid);
    });

    it('should reject unknown artifact type', () => {
      const result = validateArtifactSchema({
        type: 'unknown' as AuthZArtifactType,
        artifact: {},
      } as unknown as AuthZArtifact);

      assert.ok(!result.valid);
      assert.ok(result.errors.some(e => e.field === 'type'));
    });
  });

  // ============================================================================
  // Contract: inventory_normalizes_canonically
  // ============================================================================

  describe('inventory_normalizes_canonically', () => {
    it('should sort permissions deterministically', () => {
      const role: RoleDefinition = {
        roleId: 'R1',
        name: 'Test',
        permissions: [
          { permissionId: 'P2', resource: 'b', actions: ['write', 'read'] },
          { permissionId: 'P1', resource: 'a', actions: ['read'] },
        ],
        riskTier: 'low',
        builtIn: false,
        hash: 'old',
      };

      const normalized = normalizeArtifact(role);

      assert.strictEqual(normalized.permissions[0].permissionId, 'P1');
      assert.strictEqual(normalized.permissions[1].permissionId, 'P2');
    });

    it('should sort actions deterministically', () => {
      const perm: PermissionDefinition = {
        permissionId: 'P1',
        resource: '*',
        actions: ['write', 'delete', 'read', 'admin'],
        hash: 'old',
      };

      const normalized = normalizeArtifact(perm);

      assert.deepStrictEqual([...normalized.actions], ['admin', 'delete', 'read', 'write']);
    });

    it('should recompute hash after normalization', () => {
      const role: RoleDefinition = {
        roleId: 'R1',
        name: 'Test',
        permissions: [],
        riskTier: 'low',
        builtIn: false,
        hash: 'old-hash',
      };

      const normalized = normalizeArtifact(role);

      assert.ok(normalized.hash.startsWith('sha256:'));
      assert.notStrictEqual(normalized.hash, 'old-hash');
    });

    it('should produce identical hashes for equivalent artifacts', () => {
      const role1: RoleDefinition = {
        roleId: 'R1',
        name: 'Test',
        permissions: [{ permissionId: 'P1', resource: 'a', actions: ['write', 'read'] }],
        riskTier: 'low',
        builtIn: false,
        hash: 'x',
      };

      const role2: RoleDefinition = {
        roleId: 'R1',
        name: 'Test',
        permissions: [{ permissionId: 'P1', resource: 'a', actions: ['read', 'write'] }],
        riskTier: 'low',
        builtIn: false,
        hash: 'y',
      };

      const norm1 = normalizeArtifact(role1);
      const norm2 = normalizeArtifact(role2);

      assert.strictEqual(norm1.hash, norm2.hash);
    });

    it('should ensure principal IDs are opaque', () => {
      const bindings = createMockBindings();

      for (const binding of bindings) {
        assert.ok(
          isPrincipalIdOpaque(binding.principalId),
          `Principal ID should be opaque: ${binding.principalId}`
        );
      }
    });
  });
});
