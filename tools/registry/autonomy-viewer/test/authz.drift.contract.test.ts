/**
 * Authorization Drift Contract Tests
 * ====================================
 *
 * Phase V: Validates semantic drift detection for authorization artifacts.
 *
 * Contract:
 * - drift_detects_role_changes: role definition additions/removals/modifications
 * - drift_detects_binding_changes: principal-to-role binding changes
 * - drift_detects_abac_changes: ABAC predicate semantic diffs
 * - drift_classifies_severity: risk-tier based severity (warn/critical)
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Authorization Drift
// ============================================================================

/**
 * Risk tier for authorization artifacts.
 */
type RiskTier = 'critical' | 'high' | 'medium' | 'low';

/**
 * Drift severity.
 */
type DriftSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Drift direction.
 */
type DriftDirection = 'expansion' | 'contraction' | 'modification';

/**
 * Permission action.
 */
type PermissionAction = 'read' | 'write' | 'delete' | 'admin' | 'export' | 'execute';

/**
 * Change type.
 */
type ChangeType = 'added' | 'removed' | 'modified';

/**
 * Permission reference.
 */
interface PermissionRef {
  readonly permissionId: string;
  readonly resource: string;
  readonly actions: readonly PermissionAction[];
}

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
 * Role binding.
 */
interface RoleBinding {
  readonly bindingId: string;
  readonly roleId: string;
  readonly principalType: 'user' | 'group' | 'service_principal';
  readonly principalId: string;
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
 * Role drift item.
 */
interface RoleDriftItem {
  readonly changeType: ChangeType;
  readonly roleId: string;
  readonly baseline?: RoleDefinition;
  readonly current?: RoleDefinition;
  readonly permissionsDelta: PermissionDelta;
  readonly direction: DriftDirection;
  readonly severity: DriftSeverity;
}

/**
 * Permission delta.
 */
interface PermissionDelta {
  readonly added: readonly PermissionRef[];
  readonly removed: readonly PermissionRef[];
  readonly modified: readonly { before: PermissionRef; after: PermissionRef }[];
}

/**
 * Binding drift item.
 */
interface BindingDriftItem {
  readonly changeType: ChangeType;
  readonly bindingId: string;
  readonly baseline?: RoleBinding;
  readonly current?: RoleBinding;
  readonly affectedRole: string;
  readonly direction: DriftDirection;
  readonly severity: DriftSeverity;
}

/**
 * ABAC drift item.
 */
interface ABACDriftItem {
  readonly changeType: ChangeType;
  readonly ruleId: string;
  readonly baseline?: ABACRule;
  readonly current?: ABACRule;
  readonly conditionsDelta: ConditionDelta;
  readonly direction: DriftDirection;
  readonly severity: DriftSeverity;
}

/**
 * Condition delta.
 */
interface ConditionDelta {
  readonly added: readonly ABACCondition[];
  readonly removed: readonly ABACCondition[];
  readonly modified: readonly { before: ABACCondition; after: ABACCondition }[];
}

/**
 * Authorization drift result.
 */
interface AuthZDriftResult {
  readonly driftDetected: boolean;
  readonly roleDrifts: readonly RoleDriftItem[];
  readonly bindingDrifts: readonly BindingDriftItem[];
  readonly abacDrifts: readonly ABACDriftItem[];
  readonly overallSeverity: DriftSeverity;
  readonly detectedAt: string;
  readonly correlationId: string;
  readonly summary: DriftSummary;
}

/**
 * Drift summary.
 */
interface DriftSummary {
  readonly totalChanges: number;
  readonly criticalChanges: number;
  readonly highRiskChanges: number;
  readonly expansions: number;
  readonly contractions: number;
}

// ============================================================================
// Constants
// ============================================================================

const HIGH_RISK_ACTIONS: readonly PermissionAction[] = ['admin', 'write', 'delete', 'export'];

const SEVERITY_BY_RISK_TIER: Record<RiskTier, DriftSeverity> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Determine drift direction from permission changes.
 */
function determineDriftDirection(delta: PermissionDelta): DriftDirection {
  const hasAdded = delta.added.length > 0;
  const hasRemoved = delta.removed.length > 0;

  if (hasAdded && !hasRemoved) return 'expansion';
  if (hasRemoved && !hasAdded) return 'contraction';
  return 'modification';
}

/**
 * Check if action is high-risk.
 */
function isHighRiskAction(action: PermissionAction): boolean {
  return HIGH_RISK_ACTIONS.includes(action);
}

/**
 * Calculate severity for role drift.
 */
function calculateRoleDriftSeverity(drift: {
  roleId: string;
  baseline?: RoleDefinition;
  current?: RoleDefinition;
  delta: PermissionDelta;
}): DriftSeverity {
  const role = drift.current ?? drift.baseline;
  if (!role) return 'low';

  // Escalate if high-risk actions added
  const addedHighRisk = drift.delta.added.some(p => p.actions.some(isHighRiskAction));
  if (addedHighRisk) return 'critical';

  // Use role's risk tier as base
  return SEVERITY_BY_RISK_TIER[role.riskTier];
}

/**
 * Calculate severity for binding drift.
 */
function calculateBindingDriftSeverity(
  drift: { roleId: string; changeType: ChangeType },
  roleRiskTier: RiskTier
): DriftSeverity {
  // Adding binding to critical role is critical
  if (drift.changeType === 'added' && roleRiskTier === 'critical') {
    return 'critical';
  }
  // Removing binding from critical role is high (potential access loss)
  if (drift.changeType === 'removed' && roleRiskTier === 'critical') {
    return 'high';
  }
  return SEVERITY_BY_RISK_TIER[roleRiskTier];
}

/**
 * Calculate severity for ABAC drift.
 */
function calculateABACDriftSeverity(drift: {
  baseline?: ABACRule;
  current?: ABACRule;
  conditionsDelta: ConditionDelta;
}): DriftSeverity {
  const rule = drift.current ?? drift.baseline;
  if (!rule) return 'low';

  // Removing deny conditions is critical (potential bypass)
  if (rule.effect === 'deny' && drift.conditionsDelta.removed.length > 0) {
    return 'critical';
  }
  // Adding allow conditions expands access
  if (rule.effect === 'allow' && drift.conditionsDelta.added.length > 0) {
    return 'high';
  }
  return 'medium';
}

/**
 * Compare permission refs.
 */
function comparePermissionRefs(a: PermissionRef, b: PermissionRef): boolean {
  if (a.permissionId !== b.permissionId) return false;
  if (a.resource !== b.resource) return false;
  if (a.actions.length !== b.actions.length) return false;
  const sortedA = [...a.actions].sort();
  const sortedB = [...b.actions].sort();
  return sortedA.every((action, i) => action === sortedB[i]);
}

/**
 * Calculate permission delta.
 */
function calculatePermissionDelta(
  baseline: readonly PermissionRef[],
  current: readonly PermissionRef[]
): PermissionDelta {
  const baselineMap = new Map(baseline.map(p => [p.permissionId, p]));
  const currentMap = new Map(current.map(p => [p.permissionId, p]));

  const added: PermissionRef[] = [];
  const removed: PermissionRef[] = [];
  const modified: { before: PermissionRef; after: PermissionRef }[] = [];

  // Find added and modified
  for (const [id, curr] of currentMap) {
    const base = baselineMap.get(id);
    if (!base) {
      added.push(curr);
    } else if (!comparePermissionRefs(base, curr)) {
      modified.push({ before: base, after: curr });
    }
  }

  // Find removed
  for (const [id, base] of baselineMap) {
    if (!currentMap.has(id)) {
      removed.push(base);
    }
  }

  return { added, removed, modified };
}

/**
 * Compare ABAC conditions.
 */
function compareABACConditions(a: ABACCondition, b: ABACCondition): boolean {
  if (a.attribute !== b.attribute) return false;
  if (a.operator !== b.operator) return false;
  const aVal = Array.isArray(a.value) ? [...a.value].sort().join(',') : a.value;
  const bVal = Array.isArray(b.value) ? [...b.value].sort().join(',') : b.value;
  return aVal === bVal;
}

/**
 * Calculate condition delta.
 */
function calculateConditionDelta(
  baseline: readonly ABACCondition[],
  current: readonly ABACCondition[]
): ConditionDelta {
  const added: ABACCondition[] = [];
  const removed: ABACCondition[] = [];
  const modified: { before: ABACCondition; after: ABACCondition }[] = [];

  // Simple comparison by attribute
  const baselineByAttr = new Map(baseline.map(c => [c.attribute, c]));
  const currentByAttr = new Map(current.map(c => [c.attribute, c]));

  for (const [attr, curr] of currentByAttr) {
    const base = baselineByAttr.get(attr);
    if (!base) {
      added.push(curr);
    } else if (!compareABACConditions(base, curr)) {
      modified.push({ before: base, after: curr });
    }
  }

  for (const [attr, base] of baselineByAttr) {
    if (!currentByAttr.has(attr)) {
      removed.push(base);
    }
  }

  return { added, removed, modified };
}

/**
 * Detect role drifts.
 */
function detectRoleDrifts(
  baseline: readonly RoleDefinition[],
  current: readonly RoleDefinition[]
): RoleDriftItem[] {
  const drifts: RoleDriftItem[] = [];
  const baselineMap = new Map(baseline.map(r => [r.roleId, r]));
  const currentMap = new Map(current.map(r => [r.roleId, r]));

  // Check added and modified
  for (const [roleId, curr] of currentMap) {
    const base = baselineMap.get(roleId);
    if (!base) {
      const delta = calculatePermissionDelta([], curr.permissions);
      drifts.push({
        changeType: 'added',
        roleId,
        current: curr,
        permissionsDelta: delta,
        direction: 'expansion',
        severity: calculateRoleDriftSeverity({ roleId, current: curr, delta }),
      });
    } else if (base.hash !== curr.hash) {
      const delta = calculatePermissionDelta(base.permissions, curr.permissions);
      drifts.push({
        changeType: 'modified',
        roleId,
        baseline: base,
        current: curr,
        permissionsDelta: delta,
        direction: determineDriftDirection(delta),
        severity: calculateRoleDriftSeverity({ roleId, baseline: base, current: curr, delta }),
      });
    }
  }

  // Check removed
  for (const [roleId, base] of baselineMap) {
    if (!currentMap.has(roleId)) {
      const delta = calculatePermissionDelta(base.permissions, []);
      drifts.push({
        changeType: 'removed',
        roleId,
        baseline: base,
        permissionsDelta: delta,
        direction: 'contraction',
        severity: SEVERITY_BY_RISK_TIER[base.riskTier],
      });
    }
  }

  return drifts;
}

/**
 * Detect binding drifts.
 */
function detectBindingDrifts(
  baseline: readonly RoleBinding[],
  current: readonly RoleBinding[],
  roleRiskTiers: Map<string, RiskTier>
): BindingDriftItem[] {
  const drifts: BindingDriftItem[] = [];
  const baselineMap = new Map(baseline.map(b => [b.bindingId, b]));
  const currentMap = new Map(current.map(b => [b.bindingId, b]));

  for (const [bindingId, curr] of currentMap) {
    const base = baselineMap.get(bindingId);
    const riskTier = roleRiskTiers.get(curr.roleId) ?? 'low';

    if (!base) {
      drifts.push({
        changeType: 'added',
        bindingId,
        current: curr,
        affectedRole: curr.roleId,
        direction: 'expansion',
        severity: calculateBindingDriftSeverity(
          { roleId: curr.roleId, changeType: 'added' },
          riskTier
        ),
      });
    } else if (base.hash !== curr.hash) {
      drifts.push({
        changeType: 'modified',
        bindingId,
        baseline: base,
        current: curr,
        affectedRole: curr.roleId,
        direction: 'modification',
        severity: calculateBindingDriftSeverity(
          { roleId: curr.roleId, changeType: 'modified' },
          riskTier
        ),
      });
    }
  }

  for (const [bindingId, base] of baselineMap) {
    if (!currentMap.has(bindingId)) {
      const riskTier = roleRiskTiers.get(base.roleId) ?? 'low';
      drifts.push({
        changeType: 'removed',
        bindingId,
        baseline: base,
        affectedRole: base.roleId,
        direction: 'contraction',
        severity: calculateBindingDriftSeverity(
          { roleId: base.roleId, changeType: 'removed' },
          riskTier
        ),
      });
    }
  }

  return drifts;
}

/**
 * Detect ABAC drifts.
 */
function detectABACDrifts(
  baseline: readonly ABACRule[],
  current: readonly ABACRule[]
): ABACDriftItem[] {
  const drifts: ABACDriftItem[] = [];
  const baselineMap = new Map(baseline.map(r => [r.ruleId, r]));
  const currentMap = new Map(current.map(r => [r.ruleId, r]));

  for (const [ruleId, curr] of currentMap) {
    const base = baselineMap.get(ruleId);

    if (!base) {
      const conditionsDelta = calculateConditionDelta([], curr.conditions);
      drifts.push({
        changeType: 'added',
        ruleId,
        current: curr,
        conditionsDelta,
        direction: curr.effect === 'allow' ? 'expansion' : 'contraction',
        severity: calculateABACDriftSeverity({ current: curr, conditionsDelta }),
      });
    } else if (base.hash !== curr.hash) {
      const conditionsDelta = calculateConditionDelta(base.conditions, curr.conditions);
      drifts.push({
        changeType: 'modified',
        ruleId,
        baseline: base,
        current: curr,
        conditionsDelta,
        direction: 'modification',
        severity: calculateABACDriftSeverity({ baseline: base, current: curr, conditionsDelta }),
      });
    }
  }

  for (const [ruleId, base] of baselineMap) {
    if (!currentMap.has(ruleId)) {
      const conditionsDelta = calculateConditionDelta(base.conditions, []);
      drifts.push({
        changeType: 'removed',
        ruleId,
        baseline: base,
        conditionsDelta,
        direction: base.effect === 'deny' ? 'expansion' : 'contraction', // Removing deny = expansion
        severity: base.effect === 'deny' ? 'critical' : 'medium',
      });
    }
  }

  return drifts;
}

/**
 * Calculate overall severity.
 */
function calculateOverallSeverity(drifts: { severity: DriftSeverity }[]): DriftSeverity {
  if (drifts.some(d => d.severity === 'critical')) return 'critical';
  if (drifts.some(d => d.severity === 'high')) return 'high';
  if (drifts.some(d => d.severity === 'medium')) return 'medium';
  return 'low';
}

/**
 * Create drift summary.
 */
function createDriftSummary(
  roleDrifts: readonly RoleDriftItem[],
  bindingDrifts: readonly BindingDriftItem[],
  abacDrifts: readonly ABACDriftItem[]
): DriftSummary {
  const allDrifts = [...roleDrifts, ...bindingDrifts, ...abacDrifts];

  return {
    totalChanges: allDrifts.length,
    criticalChanges: allDrifts.filter(d => d.severity === 'critical').length,
    highRiskChanges: allDrifts.filter(d => d.severity === 'high').length,
    expansions: allDrifts.filter(d => d.direction === 'expansion').length,
    contractions: allDrifts.filter(d => d.direction === 'contraction').length,
  };
}

// ============================================================================
// Test Data Factories
// ============================================================================

function createBaselineRoles(): RoleDefinition[] {
  return [
    {
      roleId: 'ROLE-ADMIN',
      name: 'Administrator',
      permissions: [
        { permissionId: 'PERM-ALL', resource: '*', actions: ['admin', 'read', 'write'] },
      ],
      riskTier: 'critical',
      builtIn: true,
      hash: 'sha256:admin-v1',
    },
    {
      roleId: 'ROLE-READER',
      name: 'Reader',
      permissions: [{ permissionId: 'PERM-READ', resource: '*', actions: ['read'] }],
      riskTier: 'low',
      builtIn: true,
      hash: 'sha256:reader-v1',
    },
  ];
}

function createBaselineBindings(): RoleBinding[] {
  return [
    {
      bindingId: 'BIND-001',
      roleId: 'ROLE-ADMIN',
      principalType: 'group',
      principalId: 'GRP-admins',
      scope: '/',
      hash: 'sha256:bind-001',
    },
  ];
}

function createBaselineABACRules(): ABACRule[] {
  return [
    {
      ruleId: 'ABAC-001',
      name: 'DenyExternal',
      effect: 'deny',
      conditions: [{ attribute: 'network', operator: 'not_equals', value: 'internal' }],
      priority: 100,
      hash: 'sha256:abac-001',
    },
  ];
}

// ============================================================================
// Contract: drift_detects_role_changes
// ============================================================================

describe('Authorization Drift Contract', () => {
  describe('drift_detects_role_changes', () => {
    it('should detect added role', () => {
      const baseline = createBaselineRoles();
      const current = [
        ...baseline,
        {
          roleId: 'ROLE-NEW',
          name: 'New Role',
          permissions: [
            { permissionId: 'P1', resource: 'docs/*', actions: ['read'] as PermissionAction[] },
          ],
          riskTier: 'low' as RiskTier,
          builtIn: false,
          hash: 'sha256:new',
        },
      ];

      const drifts = detectRoleDrifts(baseline, current);

      assert.strictEqual(drifts.length, 1);
      assert.strictEqual(drifts[0].changeType, 'added');
      assert.strictEqual(drifts[0].roleId, 'ROLE-NEW');
      assert.strictEqual(drifts[0].direction, 'expansion');
    });

    it('should detect removed role', () => {
      const baseline = createBaselineRoles();
      const current = baseline.slice(0, 1); // Remove ROLE-READER

      const drifts = detectRoleDrifts(baseline, current);

      assert.strictEqual(drifts.length, 1);
      assert.strictEqual(drifts[0].changeType, 'removed');
      assert.strictEqual(drifts[0].roleId, 'ROLE-READER');
      assert.strictEqual(drifts[0].direction, 'contraction');
    });

    it('should detect modified role permissions', () => {
      const baseline = createBaselineRoles();
      const current = baseline.map(r =>
        r.roleId === 'ROLE-ADMIN'
          ? {
              ...r,
              permissions: [
                ...r.permissions,
                {
                  permissionId: 'PERM-EXPORT',
                  resource: '*',
                  actions: ['export'] as PermissionAction[],
                },
              ],
              hash: 'sha256:admin-v2',
            }
          : r
      );

      const drifts = detectRoleDrifts(baseline, current);

      assert.strictEqual(drifts.length, 1);
      assert.strictEqual(drifts[0].changeType, 'modified');
      assert.strictEqual(drifts[0].permissionsDelta.added.length, 1);
    });

    it('should calculate permission delta correctly', () => {
      const baseline: PermissionRef[] = [
        { permissionId: 'P1', resource: 'a', actions: ['read'] },
        { permissionId: 'P2', resource: 'b', actions: ['read', 'write'] },
      ];
      const current: PermissionRef[] = [
        { permissionId: 'P1', resource: 'a', actions: ['read', 'write'] }, // Modified
        { permissionId: 'P3', resource: 'c', actions: ['read'] }, // Added
        // P2 removed
      ];

      const delta = calculatePermissionDelta(baseline, current);

      assert.strictEqual(delta.added.length, 1);
      assert.strictEqual(delta.removed.length, 1);
      assert.strictEqual(delta.modified.length, 1);
    });

    it('should detect no drift when unchanged', () => {
      const baseline = createBaselineRoles();
      const current = [...baseline]; // Same

      const drifts = detectRoleDrifts(baseline, current);

      assert.strictEqual(drifts.length, 0);
    });
  });

  // ============================================================================
  // Contract: drift_detects_binding_changes
  // ============================================================================

  describe('drift_detects_binding_changes', () => {
    it('should detect added binding', () => {
      const baseline = createBaselineBindings();
      const roleRiskTiers = new Map([
        ['ROLE-ADMIN', 'critical' as RiskTier],
        ['ROLE-READER', 'low' as RiskTier],
      ]);
      const current = [
        ...baseline,
        {
          bindingId: 'BIND-002',
          roleId: 'ROLE-READER',
          principalType: 'group' as const,
          principalId: 'GRP-readers',
          scope: '/public',
          hash: 'sha256:bind-002',
        },
      ];

      const drifts = detectBindingDrifts(baseline, current, roleRiskTiers);

      assert.strictEqual(drifts.length, 1);
      assert.strictEqual(drifts[0].changeType, 'added');
      assert.strictEqual(drifts[0].direction, 'expansion');
    });

    it('should detect removed binding', () => {
      const baseline = createBaselineBindings();
      const roleRiskTiers = new Map([['ROLE-ADMIN', 'critical' as RiskTier]]);
      const current: RoleBinding[] = [];

      const drifts = detectBindingDrifts(baseline, current, roleRiskTiers);

      assert.strictEqual(drifts.length, 1);
      assert.strictEqual(drifts[0].changeType, 'removed');
      assert.strictEqual(drifts[0].direction, 'contraction');
    });

    it('should escalate severity for critical role bindings', () => {
      const baseline: RoleBinding[] = [];
      const roleRiskTiers = new Map([['ROLE-ADMIN', 'critical' as RiskTier]]);
      const current: RoleBinding[] = [
        {
          bindingId: 'BIND-NEW',
          roleId: 'ROLE-ADMIN',
          principalType: 'group',
          principalId: 'GRP-new',
          scope: '/',
          hash: 'sha256:new',
        },
      ];

      const drifts = detectBindingDrifts(baseline, current, roleRiskTiers);

      assert.strictEqual(drifts[0].severity, 'critical');
    });

    it('should track affected role', () => {
      const baseline = createBaselineBindings();
      const roleRiskTiers = new Map([['ROLE-ADMIN', 'critical' as RiskTier]]);
      const current: RoleBinding[] = [];

      const drifts = detectBindingDrifts(baseline, current, roleRiskTiers);

      assert.strictEqual(drifts[0].affectedRole, 'ROLE-ADMIN');
    });
  });

  // ============================================================================
  // Contract: drift_detects_abac_changes
  // ============================================================================

  describe('drift_detects_abac_changes', () => {
    it('should detect added ABAC rule', () => {
      const baseline = createBaselineABACRules();
      const current = [
        ...baseline,
        {
          ruleId: 'ABAC-002',
          name: 'AllowInternal',
          effect: 'allow' as const,
          conditions: [{ attribute: 'network', operator: 'equals' as const, value: 'internal' }],
          priority: 50,
          hash: 'sha256:abac-002',
        },
      ];

      const drifts = detectABACDrifts(baseline, current);

      assert.strictEqual(drifts.length, 1);
      assert.strictEqual(drifts[0].changeType, 'added');
    });

    it('should detect removed deny rule as critical', () => {
      const baseline = createBaselineABACRules();
      const current: ABACRule[] = [];

      const drifts = detectABACDrifts(baseline, current);

      assert.strictEqual(drifts.length, 1);
      assert.strictEqual(drifts[0].changeType, 'removed');
      assert.strictEqual(drifts[0].severity, 'critical');
      assert.strictEqual(drifts[0].direction, 'expansion'); // Removing deny expands access
    });

    it('should detect condition changes', () => {
      const baseline = createBaselineABACRules();
      const current = baseline.map(r => ({
        ...r,
        conditions: [{ attribute: 'network', operator: 'equals' as const, value: 'vpn' }], // Changed
        hash: 'sha256:abac-001-v2',
      }));

      const drifts = detectABACDrifts(baseline, current);

      assert.strictEqual(drifts.length, 1);
      assert.strictEqual(drifts[0].changeType, 'modified');
      assert.ok(
        drifts[0].conditionsDelta.modified.length > 0 || drifts[0].conditionsDelta.added.length > 0
      );
    });

    it('should calculate condition delta', () => {
      const baseline: ABACCondition[] = [
        { attribute: 'network', operator: 'equals', value: 'internal' },
        { attribute: 'time', operator: 'in', value: ['9-17'] },
      ];
      const current: ABACCondition[] = [
        { attribute: 'network', operator: 'equals', value: 'vpn' }, // Modified
        { attribute: 'department', operator: 'equals', value: 'engineering' }, // Added
        // time removed
      ];

      const delta = calculateConditionDelta(baseline, current);

      assert.strictEqual(delta.added.length, 1);
      assert.strictEqual(delta.removed.length, 1);
      assert.strictEqual(delta.modified.length, 1);
    });
  });

  // ============================================================================
  // Contract: drift_classifies_severity
  // ============================================================================

  describe('drift_classifies_severity', () => {
    it('should classify high-risk action additions as critical', () => {
      const delta: PermissionDelta = {
        added: [{ permissionId: 'P1', resource: '*', actions: ['admin', 'export'] }],
        removed: [],
        modified: [],
      };
      const severity = calculateRoleDriftSeverity({
        roleId: 'R1',
        current: {
          roleId: 'R1',
          name: 'Test',
          permissions: [],
          riskTier: 'medium',
          builtIn: false,
          hash: 'x',
        },
        delta,
      });

      assert.strictEqual(severity, 'critical');
    });

    it('should use role risk tier as base severity', () => {
      const delta: PermissionDelta = { added: [], removed: [], modified: [] };

      const criticalSeverity = calculateRoleDriftSeverity({
        roleId: 'R1',
        current: {
          roleId: 'R1',
          name: 'Test',
          permissions: [],
          riskTier: 'critical',
          builtIn: false,
          hash: 'x',
        },
        delta,
      });

      const lowSeverity = calculateRoleDriftSeverity({
        roleId: 'R2',
        current: {
          roleId: 'R2',
          name: 'Test2',
          permissions: [],
          riskTier: 'low',
          builtIn: false,
          hash: 'y',
        },
        delta,
      });

      assert.strictEqual(criticalSeverity, 'critical');
      assert.strictEqual(lowSeverity, 'low');
    });

    it('should calculate overall severity from all drifts', () => {
      const drifts = [
        { severity: 'low' as DriftSeverity },
        { severity: 'medium' as DriftSeverity },
        { severity: 'high' as DriftSeverity },
      ];

      const overall = calculateOverallSeverity(drifts);
      assert.strictEqual(overall, 'high');

      const withCritical = [...drifts, { severity: 'critical' as DriftSeverity }];
      assert.strictEqual(calculateOverallSeverity(withCritical), 'critical');
    });

    it('should create accurate drift summary', () => {
      const roleDrifts: RoleDriftItem[] = [
        {
          changeType: 'added',
          roleId: 'R1',
          permissionsDelta: { added: [], removed: [], modified: [] },
          direction: 'expansion',
          severity: 'critical',
        },
      ];
      const bindingDrifts: BindingDriftItem[] = [
        {
          changeType: 'removed',
          bindingId: 'B1',
          affectedRole: 'R1',
          direction: 'contraction',
          severity: 'high',
        },
      ];
      const abacDrifts: ABACDriftItem[] = [];

      const summary = createDriftSummary(roleDrifts, bindingDrifts, abacDrifts);

      assert.strictEqual(summary.totalChanges, 2);
      assert.strictEqual(summary.criticalChanges, 1);
      assert.strictEqual(summary.highRiskChanges, 1);
      assert.strictEqual(summary.expansions, 1);
      assert.strictEqual(summary.contractions, 1);
    });
  });
});
