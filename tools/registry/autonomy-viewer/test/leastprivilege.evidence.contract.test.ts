/**
 * Least-Privilege Evidence Contract Tests
 * =========================================
 *
 * Phase V: Validates PII-clean evidence packs for authorization posture.
 *
 * Contract:
 * - evidence_is_pii_clean: no user identity leakage in any artifact
 * - evidence_is_bounded: size and cardinality limits enforced
 * - evidence_shows_effective_access: aggregated access summaries without PII
 * - evidence_highlights_high_risk: admin/write/export expansions flagged
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Least-Privilege Evidence
// ============================================================================

/**
 * Evidence pack period.
 */
type EvidencePackPeriod = 'weekly' | 'monthly' | 'quarterly';

/**
 * Permission action.
 */
type PermissionAction = 'read' | 'write' | 'delete' | 'admin' | 'export' | 'execute';

/**
 * Risk tier.
 */
type RiskTier = 'critical' | 'high' | 'medium' | 'low';

/**
 * Allowed dimension for aggregation.
 */
type AllowedDimension =
  | 'environment'
  | 'role'
  | 'resource_type'
  | 'action_type'
  | 'risk_tier'
  | 'principal_type';

/**
 * Permission ref.
 */
interface PermissionRef {
  readonly permissionId: string;
  readonly resource: string;
  readonly actions: readonly PermissionAction[];
}

/**
 * Role summary (PII-clean).
 */
interface RoleSummary {
  readonly roleId: string;
  readonly roleName: string;
  readonly riskTier: RiskTier;
  readonly permissionCount: number;
  readonly hasHighRiskActions: boolean;
  readonly highRiskActions: readonly PermissionAction[];
  readonly resourcePatterns: readonly string[];
}

/**
 * Binding summary (PII-clean - aggregated counts only).
 */
interface BindingSummary {
  readonly roleId: string;
  readonly principalType: 'user' | 'group' | 'service_principal';
  readonly bindingCount: number; // Count, not individual IDs
  readonly scopes: readonly string[];
}

/**
 * Effective access summary (aggregated, no user identity).
 */
interface EffectiveAccessSummary {
  readonly resourcePattern: string;
  readonly actionsByRiskTier: Record<RiskTier, readonly PermissionAction[]>;
  readonly bindingCountByPrincipalType: Record<string, number>;
  readonly totalEffectivePrincipals: number; // Aggregated count
}

/**
 * Permission delta record.
 */
interface PermissionDeltaRecord {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly roleId: string;
  readonly roleName: string;
  readonly added: readonly PermissionSummary[];
  readonly removed: readonly PermissionSummary[];
  readonly netChange: 'expansion' | 'contraction' | 'neutral';
}

/**
 * Permission summary.
 */
interface PermissionSummary {
  readonly permissionId: string;
  readonly resource: string;
  readonly actions: readonly PermissionAction[];
  readonly isHighRisk: boolean;
}

/**
 * High-risk expansion record.
 */
interface HighRiskExpansion {
  readonly detectedAt: string;
  readonly roleId: string;
  readonly roleName: string;
  readonly riskTier: RiskTier;
  readonly expansionType: 'new_role' | 'permission_added' | 'binding_added';
  readonly highRiskActions: readonly PermissionAction[];
  readonly resourcePatterns: readonly string[];
  readonly severity: 'critical' | 'high';
}

/**
 * Least-privilege evidence pack.
 */
interface LeastPrivilegeEvidencePack {
  readonly packId: string;
  readonly period: EvidencePackPeriod;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly generatedAt: string;
  readonly environment: string;
  readonly roleSummaries: readonly RoleSummary[];
  readonly bindingSummaries: readonly BindingSummary[];
  readonly effectiveAccessSummaries: readonly EffectiveAccessSummary[];
  readonly permissionDeltas: readonly PermissionDeltaRecord[];
  readonly highRiskExpansions: readonly HighRiskExpansion[];
  readonly metadata: EvidencePackMetadata;
}

/**
 * Evidence pack metadata.
 */
interface EvidencePackMetadata {
  readonly version: string;
  readonly generator: string;
  readonly sizeBytes: number;
  readonly dimensionsUsed: readonly AllowedDimension[];
  readonly piiClean: boolean;
  readonly checksum: string;
  readonly roleCoverage: number;
  readonly bindingCoverage: number;
}

/**
 * PII detection result.
 */
interface PIIDetectionResult {
  readonly clean: boolean;
  readonly violations: readonly PIIViolation[];
}

/**
 * PII violation.
 */
interface PIIViolation {
  readonly section: string;
  readonly field: string;
  readonly violationType: 'email' | 'name' | 'user_id' | 'other';
}

// ============================================================================
// Constants
// ============================================================================

const HIGH_RISK_ACTIONS: readonly PermissionAction[] = ['admin', 'write', 'delete', 'export'];

const ALLOWED_DIMENSIONS: readonly AllowedDimension[] = [
  'environment',
  'role',
  'resource_type',
  'action_type',
  'risk_tier',
  'principal_type',
];

const MAX_PACK_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const MAX_ROLES_PER_PACK = 500;
const MAX_BINDINGS_PER_PACK = 1000;

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Check if action is high-risk.
 */
function isHighRiskAction(action: PermissionAction): boolean {
  return HIGH_RISK_ACTIONS.includes(action);
}

/**
 * Create role summary from role definition.
 */
function createRoleSummary(role: {
  roleId: string;
  name: string;
  permissions: readonly PermissionRef[];
  riskTier: RiskTier;
}): RoleSummary {
  const allActions = role.permissions.flatMap(p => p.actions);
  const highRiskActions = [...new Set(allActions.filter(isHighRiskAction))];
  const resourcePatterns = [...new Set(role.permissions.map(p => p.resource))];

  return {
    roleId: role.roleId,
    roleName: role.name,
    riskTier: role.riskTier,
    permissionCount: role.permissions.length,
    hasHighRiskActions: highRiskActions.length > 0,
    highRiskActions,
    resourcePatterns,
  };
}

/**
 * Create binding summary (aggregated, PII-clean).
 */
function createBindingSummary(
  bindings: readonly {
    roleId: string;
    principalType: 'user' | 'group' | 'service_principal';
    scope: string;
  }[]
): BindingSummary[] {
  // Aggregate by roleId + principalType
  const grouped = new Map<
    string,
    {
      roleId: string;
      principalType: 'user' | 'group' | 'service_principal';
      count: number;
      scopes: Set<string>;
    }
  >();

  for (const binding of bindings) {
    const key = `${binding.roleId}:${binding.principalType}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.count++;
      existing.scopes.add(binding.scope);
    } else {
      grouped.set(key, {
        roleId: binding.roleId,
        principalType: binding.principalType,
        count: 1,
        scopes: new Set([binding.scope]),
      });
    }
  }

  return Array.from(grouped.values()).map(g => ({
    roleId: g.roleId,
    principalType: g.principalType,
    bindingCount: g.count,
    scopes: Array.from(g.scopes),
  }));
}

/**
 * Create effective access summary (aggregated).
 */
function createEffectiveAccessSummary(
  resourcePattern: string,
  roles: readonly RoleSummary[],
  bindings: readonly BindingSummary[]
): EffectiveAccessSummary {
  // Aggregate actions by risk tier
  const actionsByRiskTier: Record<RiskTier, Set<PermissionAction>> = {
    critical: new Set(),
    high: new Set(),
    medium: new Set(),
    low: new Set(),
  };

  for (const role of roles) {
    if (role.resourcePatterns.includes(resourcePattern) || role.resourcePatterns.includes('*')) {
      for (const action of role.highRiskActions) {
        actionsByRiskTier[role.riskTier].add(action);
      }
    }
  }

  // Aggregate binding counts by principal type
  const bindingCountByPrincipalType: Record<string, number> = {};
  let totalPrincipals = 0;

  for (const binding of bindings) {
    bindingCountByPrincipalType[binding.principalType] =
      (bindingCountByPrincipalType[binding.principalType] ?? 0) + binding.bindingCount;
    totalPrincipals += binding.bindingCount;
  }

  return {
    resourcePattern,
    actionsByRiskTier: {
      critical: Array.from(actionsByRiskTier.critical),
      high: Array.from(actionsByRiskTier.high),
      medium: Array.from(actionsByRiskTier.medium),
      low: Array.from(actionsByRiskTier.low),
    },
    bindingCountByPrincipalType,
    totalEffectivePrincipals: totalPrincipals,
  };
}

/**
 * Detect PII in evidence pack.
 */
function detectPII(pack: LeastPrivilegeEvidencePack): PIIDetectionResult {
  const violations: PIIViolation[] = [];

  // Check for email patterns
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const namePattern = /^[A-Z][a-z]+ [A-Z][a-z]+$/;
  const userIdPattern = /^(user|usr|u)[-_]?\d+$/i;

  // Check role summaries
  for (const role of pack.roleSummaries) {
    if (emailPattern.test(role.roleId) || emailPattern.test(role.roleName)) {
      violations.push({
        section: 'roleSummaries',
        field: 'roleId/roleName',
        violationType: 'email',
      });
    }
    if (namePattern.test(role.roleName)) {
      violations.push({ section: 'roleSummaries', field: 'roleName', violationType: 'name' });
    }
  }

  // Binding summaries should NOT contain individual principal IDs
  for (const binding of pack.bindingSummaries) {
    // Only counts and aggregates allowed - no principalId field
    if ('principalId' in binding) {
      violations.push({
        section: 'bindingSummaries',
        field: 'principalId',
        violationType: 'user_id',
      });
    }
  }

  // Effective access should be aggregated counts only
  for (const access of pack.effectiveAccessSummaries) {
    if ('principalIds' in access) {
      violations.push({
        section: 'effectiveAccessSummaries',
        field: 'principalIds',
        violationType: 'user_id',
      });
    }
  }

  return { clean: violations.length === 0, violations };
}

/**
 * Validate dimensions used.
 */
function validateDimensions(dimensions: readonly string[]): { valid: boolean; invalid: string[] } {
  const invalid = dimensions.filter(d => !ALLOWED_DIMENSIONS.includes(d as AllowedDimension));
  return { valid: invalid.length === 0, invalid };
}

/**
 * Check if pack is bounded.
 */
function isPackBounded(pack: LeastPrivilegeEvidencePack): {
  bounded: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  if (pack.metadata.sizeBytes > MAX_PACK_SIZE_BYTES) {
    violations.push(`Pack size ${pack.metadata.sizeBytes} exceeds max ${MAX_PACK_SIZE_BYTES}`);
  }
  if (pack.roleSummaries.length > MAX_ROLES_PER_PACK) {
    violations.push(`Role count ${pack.roleSummaries.length} exceeds max ${MAX_ROLES_PER_PACK}`);
  }
  if (pack.bindingSummaries.length > MAX_BINDINGS_PER_PACK) {
    violations.push(
      `Binding count ${pack.bindingSummaries.length} exceeds max ${MAX_BINDINGS_PER_PACK}`
    );
  }

  return { bounded: violations.length === 0, violations };
}

/**
 * Create high-risk expansion record.
 */
function createHighRiskExpansion(
  roleId: string,
  roleName: string,
  riskTier: RiskTier,
  expansionType: 'new_role' | 'permission_added' | 'binding_added',
  highRiskActions: readonly PermissionAction[],
  resourcePatterns: readonly string[]
): HighRiskExpansion {
  return {
    detectedAt: new Date().toISOString(),
    roleId,
    roleName,
    riskTier,
    expansionType,
    highRiskActions,
    resourcePatterns,
    severity: riskTier === 'critical' || highRiskActions.includes('admin') ? 'critical' : 'high',
  };
}

/**
 * Generate sample evidence pack.
 */
function generateSamplePack(
  options: {
    period?: EvidencePackPeriod;
    includePII?: boolean;
    oversized?: boolean;
    includeHighRisk?: boolean;
  } = {}
): LeastPrivilegeEvidencePack {
  const {
    period = 'monthly',
    includePII = false,
    oversized = false,
    includeHighRisk = true,
  } = options;

  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setMonth(periodStart.getMonth() - 1);

  const roleSummaries: RoleSummary[] = [
    {
      roleId: 'ROLE-ADMIN',
      roleName: 'Administrator',
      riskTier: 'critical',
      permissionCount: 5,
      hasHighRiskActions: true,
      highRiskActions: ['admin', 'write', 'delete', 'export'],
      resourcePatterns: ['*'],
    },
    {
      roleId: 'ROLE-READER',
      roleName: 'Reader',
      riskTier: 'low',
      permissionCount: 1,
      hasHighRiskActions: false,
      highRiskActions: [],
      resourcePatterns: ['*'],
    },
  ];

  // Add PII violation if requested
  if (includePII) {
    roleSummaries.push({
      roleId: 'john.doe@example.com', // PII violation!
      roleName: 'John Doe', // PII violation!
      riskTier: 'low',
      permissionCount: 1,
      hasHighRiskActions: false,
      highRiskActions: [],
      resourcePatterns: ['docs/*'],
    });
  }

  const bindingSummaries: BindingSummary[] = [
    { roleId: 'ROLE-ADMIN', principalType: 'group', bindingCount: 2, scopes: ['/'] },
    { roleId: 'ROLE-READER', principalType: 'group', bindingCount: 5, scopes: ['/', '/public'] },
    {
      roleId: 'ROLE-READER',
      principalType: 'service_principal',
      bindingCount: 3,
      scopes: ['/api'],
    },
  ];

  const effectiveAccessSummaries: EffectiveAccessSummary[] = [
    {
      resourcePattern: '*',
      actionsByRiskTier: {
        critical: ['admin', 'write', 'delete', 'export'],
        high: [],
        medium: [],
        low: ['read'],
      },
      bindingCountByPrincipalType: { group: 7, service_principal: 3 },
      totalEffectivePrincipals: 10,
    },
  ];

  const highRiskExpansions: HighRiskExpansion[] = includeHighRisk
    ? [
        {
          detectedAt: new Date().toISOString(),
          roleId: 'ROLE-NEW-ADMIN',
          roleName: 'New Admin Role',
          riskTier: 'critical',
          expansionType: 'new_role',
          highRiskActions: ['admin', 'write'],
          resourcePatterns: ['*'],
          severity: 'critical',
        },
      ]
    : [];

  return {
    packId: `PACK-${period.toUpperCase()}-${Date.now()}`,
    period,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    generatedAt: new Date().toISOString(),
    environment: 'production',
    roleSummaries,
    bindingSummaries,
    effectiveAccessSummaries,
    permissionDeltas: [],
    highRiskExpansions,
    metadata: {
      version: '1.0.0',
      generator: 'leastprivilege-evidence-builder',
      sizeBytes: oversized ? MAX_PACK_SIZE_BYTES + 1000 : 50000,
      dimensionsUsed: ['environment', 'role', 'risk_tier', 'principal_type'],
      piiClean: !includePII,
      checksum: 'sha256:pack-checksum',
      roleCoverage: 1.0,
      bindingCoverage: 1.0,
    },
  };
}

// ============================================================================
// Contract: evidence_is_pii_clean
// ============================================================================

describe('Least-Privilege Evidence Contract', () => {
  describe('evidence_is_pii_clean', () => {
    it('should pass PII check for clean pack', () => {
      const pack = generateSamplePack();
      const result = detectPII(pack);

      assert.ok(result.clean);
      assert.strictEqual(result.violations.length, 0);
    });

    it('should detect email in role ID', () => {
      const pack = generateSamplePack({ includePII: true });
      const result = detectPII(pack);

      assert.ok(!result.clean);
      assert.ok(result.violations.some(v => v.violationType === 'email'));
    });

    it('should detect name patterns', () => {
      const pack = generateSamplePack({ includePII: true });
      const result = detectPII(pack);

      assert.ok(!result.clean);
      assert.ok(result.violations.some(v => v.violationType === 'name'));
    });

    it('should use opaque IDs only', () => {
      const pack = generateSamplePack();

      for (const role of pack.roleSummaries) {
        assert.ok(role.roleId.startsWith('ROLE-'));
      }
    });

    it('should aggregate bindings (no individual principal IDs)', () => {
      const pack = generateSamplePack();

      for (const binding of pack.bindingSummaries) {
        assert.ok(typeof binding.bindingCount === 'number');
        assert.ok(!('principalId' in binding));
      }
    });

    it('should mark metadata.piiClean correctly', () => {
      const cleanPack = generateSamplePack();
      const dirtyPack = generateSamplePack({ includePII: true });

      assert.ok(cleanPack.metadata.piiClean);
      assert.ok(!dirtyPack.metadata.piiClean);
    });
  });

  // ============================================================================
  // Contract: evidence_is_bounded
  // ============================================================================

  describe('evidence_is_bounded', () => {
    it('should respect size limit', () => {
      const pack = generateSamplePack();
      const result = isPackBounded(pack);

      assert.ok(result.bounded);
    });

    it('should detect oversized packs', () => {
      const pack = generateSamplePack({ oversized: true });
      const result = isPackBounded(pack);

      assert.ok(!result.bounded);
      assert.ok(result.violations.some(v => v.includes('size')));
    });

    it('should use only allowed dimensions', () => {
      const pack = generateSamplePack();
      const result = validateDimensions(pack.metadata.dimensionsUsed);

      assert.ok(result.valid);
    });

    it('should reject forbidden dimensions', () => {
      const result = validateDimensions(['user_email', 'principal_name']);

      assert.ok(!result.valid);
      assert.ok(result.invalid.includes('user_email'));
    });

    it('should enforce role count limits', () => {
      const pack = generateSamplePack();
      assert.ok(pack.roleSummaries.length <= MAX_ROLES_PER_PACK);
    });

    it('should enforce binding count limits', () => {
      const pack = generateSamplePack();
      assert.ok(pack.bindingSummaries.length <= MAX_BINDINGS_PER_PACK);
    });
  });

  // ============================================================================
  // Contract: evidence_shows_effective_access
  // ============================================================================

  describe('evidence_shows_effective_access', () => {
    it('should include effective access summaries', () => {
      const pack = generateSamplePack();

      assert.ok(pack.effectiveAccessSummaries.length > 0);
    });

    it('should aggregate actions by risk tier', () => {
      const pack = generateSamplePack();
      const summary = pack.effectiveAccessSummaries[0];

      assert.ok('critical' in summary.actionsByRiskTier);
      assert.ok('high' in summary.actionsByRiskTier);
      assert.ok('medium' in summary.actionsByRiskTier);
      assert.ok('low' in summary.actionsByRiskTier);
    });

    it('should aggregate binding counts by principal type', () => {
      const pack = generateSamplePack();
      const summary = pack.effectiveAccessSummaries[0];

      assert.ok(typeof summary.bindingCountByPrincipalType === 'object');
      assert.ok(typeof summary.totalEffectivePrincipals === 'number');
    });

    it('should include resource patterns', () => {
      const pack = generateSamplePack();
      const summary = pack.effectiveAccessSummaries[0];

      assert.ok(typeof summary.resourcePattern === 'string');
    });

    it('should create correct role summary', () => {
      const role = {
        roleId: 'R1',
        name: 'Test Role',
        permissions: [
          {
            permissionId: 'P1',
            resource: 'docs/*',
            actions: ['read', 'write'] as PermissionAction[],
          },
          { permissionId: 'P2', resource: 'api/*', actions: ['admin'] as PermissionAction[] },
        ],
        riskTier: 'high' as RiskTier,
      };

      const summary = createRoleSummary(role);

      assert.strictEqual(summary.roleId, 'R1');
      assert.strictEqual(summary.permissionCount, 2);
      assert.ok(summary.hasHighRiskActions);
      assert.ok(summary.highRiskActions.includes('write'));
      assert.ok(summary.highRiskActions.includes('admin'));
    });
  });

  // ============================================================================
  // Contract: evidence_highlights_high_risk
  // ============================================================================

  describe('evidence_highlights_high_risk', () => {
    it('should include high-risk expansions section', () => {
      const pack = generateSamplePack({ includeHighRisk: true });

      assert.ok(pack.highRiskExpansions.length > 0);
    });

    it('should classify expansion severity', () => {
      const pack = generateSamplePack({ includeHighRisk: true });
      const expansion = pack.highRiskExpansions[0];

      assert.ok(['critical', 'high'].includes(expansion.severity));
    });

    it('should identify high-risk actions', () => {
      const pack = generateSamplePack({ includeHighRisk: true });
      const expansion = pack.highRiskExpansions[0];

      assert.ok(expansion.highRiskActions.length > 0);
      assert.ok(expansion.highRiskActions.every(a => HIGH_RISK_ACTIONS.includes(a)));
    });

    it('should identify expansion type', () => {
      const pack = generateSamplePack({ includeHighRisk: true });
      const expansion = pack.highRiskExpansions[0];

      assert.ok(
        ['new_role', 'permission_added', 'binding_added'].includes(expansion.expansionType)
      );
    });

    it('should mark admin expansions as critical', () => {
      const expansion = createHighRiskExpansion(
        'R1',
        'New Admin',
        'high',
        'new_role',
        ['admin'],
        ['*']
      );

      assert.strictEqual(expansion.severity, 'critical');
    });

    it('should include resource patterns for context', () => {
      const pack = generateSamplePack({ includeHighRisk: true });
      const expansion = pack.highRiskExpansions[0];

      assert.ok(Array.isArray(expansion.resourcePatterns));
      assert.ok(expansion.resourcePatterns.length > 0);
    });
  });
});
