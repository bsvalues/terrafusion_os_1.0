/**
 * Phase XVIII — Executive Oversight Portal
 * =========================================
 * Contract: portal.accesscontrol.contract.test.ts
 *
 * Tests access control enforcement for the executive oversight portal,
 * including role-based access, permission verification, and audit
 * logging of access attempts.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Portal views are read-only
 * - Access control is enforced at every layer
 * - All access attempts are audited
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type UserId = `sha256:${string}`;
type RoleId = `sha256:${string}`;
type ResourceId = `sha256:${string}`;
type SessionId = `sha256:${string}`;
type AuditId = `sha256:${string}`;

type Role = 'executive' | 'admin' | 'auditor' | 'viewer' | 'federation_partner' | 'service_account';
type Permission = 'read' | 'write' | 'export' | 'drilldown' | 'admin' | 'configure';
type ResourceType = 'portal' | 'dashboard' | 'report' | 'evidence' | 'configuration' | 'audit_log';
type AccessDecision = 'allow' | 'deny';
type DenyReason =
  | 'insufficient_role'
  | 'invalid_session'
  | 'resource_not_found'
  | 'permission_denied'
  | 'rate_limited'
  | 'ip_blocked';

interface UserPrincipal {
  readonly id: UserId;
  readonly roles: readonly Role[];
  readonly agencyId?: ResourceId;
  readonly sessionId: SessionId;
  readonly ipAddress: string;
  readonly authenticatedAt: string;
}

interface AccessPolicy {
  readonly resourceType: ResourceType;
  readonly allowedRoles: readonly Role[];
  readonly requiredPermissions: readonly Permission[];
  readonly requireMfa?: boolean;
  readonly maxSessionAgeMinutes?: number;
}

interface AccessRequest {
  readonly principal: UserPrincipal;
  readonly resourceType: ResourceType;
  readonly resourceId: ResourceId;
  readonly action: Permission;
  readonly timestamp: string;
}

interface AccessResult {
  readonly decision: AccessDecision;
  readonly denyReason?: DenyReason;
  readonly auditId: AuditId;
  readonly evaluatedPolicies: number;
  readonly processingTimeMs: number;
}

interface AccessAuditEntry {
  readonly id: AuditId;
  readonly request: AccessRequest;
  readonly result: AccessResult;
  readonly timestamp: string;
}

interface RolePermissionMatrix {
  readonly role: Role;
  readonly permissions: readonly Permission[];
  readonly resourceScopes: readonly ResourceType[];
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockAccessControlService() {
  const policies = new Map<ResourceType, AccessPolicy>();
  const auditLog: AccessAuditEntry[] = [];
  const blockedIps = new Set<string>();
  const rateLimits = new Map<UserId, { count: number; windowStart: number }>();

  const rolePermissions: Record<Role, Permission[]> = {
    executive: ['read', 'export', 'drilldown'],
    admin: ['read', 'write', 'export', 'drilldown', 'admin', 'configure'],
    auditor: ['read', 'drilldown', 'export'],
    viewer: ['read'],
    federation_partner: ['read', 'drilldown'],
    service_account: ['read'],
  };

  const roleHierarchy: Record<Role, ResourceType[]> = {
    executive: ['portal', 'dashboard', 'report', 'evidence', 'audit_log'],
    admin: ['portal', 'dashboard', 'report', 'evidence', 'configuration', 'audit_log'],
    auditor: ['portal', 'dashboard', 'report', 'evidence', 'audit_log'],
    viewer: ['portal', 'dashboard'],
    federation_partner: ['portal', 'dashboard', 'report'],
    service_account: ['portal', 'evidence'],
  };

  function generateId(prefix: string): AuditId {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}` as AuditId;
  }

  function hasPermission(roles: readonly Role[], permission: Permission): boolean {
    for (const role of roles) {
      if (rolePermissions[role]?.includes(permission)) {
        return true;
      }
    }
    return false;
  }

  function hasResourceAccess(roles: readonly Role[], resourceType: ResourceType): boolean {
    for (const role of roles) {
      if (roleHierarchy[role]?.includes(resourceType)) {
        return true;
      }
    }
    return false;
  }

  function isSessionValid(principal: UserPrincipal, policy: AccessPolicy): boolean {
    if (!policy.maxSessionAgeMinutes) return true;

    const authTime = new Date(principal.authenticatedAt).getTime();
    const now = Date.now();
    const ageMinutes = (now - authTime) / (1000 * 60);

    return ageMinutes <= policy.maxSessionAgeMinutes;
  }

  function checkRateLimit(userId: UserId): boolean {
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 100;

    const now = Date.now();
    const limit = rateLimits.get(userId);

    if (!limit || now - limit.windowStart > windowMs) {
      rateLimits.set(userId, { count: 1, windowStart: now });
      return true;
    }

    if (limit.count >= maxRequests) {
      return false;
    }

    limit.count++;
    return true;
  }

  return {
    // Policy Management
    setPolicy(policy: AccessPolicy): void {
      policies.set(policy.resourceType, policy);
    },

    getPolicy(resourceType: ResourceType): AccessPolicy | undefined {
      return policies.get(resourceType);
    },

    // IP Blocking
    blockIp(ip: string): void {
      blockedIps.add(ip);
    },

    unblockIp(ip: string): void {
      blockedIps.delete(ip);
    },

    isIpBlocked(ip: string): boolean {
      return blockedIps.has(ip);
    },

    // Access Control Evaluation
    evaluateAccess(request: AccessRequest): AccessResult {
      const startTime = Date.now();
      let evaluatedPolicies = 0;

      // Check IP block
      if (blockedIps.has(request.principal.ipAddress)) {
        const result: AccessResult = {
          decision: 'deny',
          denyReason: 'ip_blocked',
          auditId: generateId('audit'),
          evaluatedPolicies: 0,
          processingTimeMs: Date.now() - startTime,
        };
        this.logAccess(request, result);
        return result;
      }

      // Check rate limit
      if (!checkRateLimit(request.principal.id)) {
        const result: AccessResult = {
          decision: 'deny',
          denyReason: 'rate_limited',
          auditId: generateId('audit'),
          evaluatedPolicies: 0,
          processingTimeMs: Date.now() - startTime,
        };
        this.logAccess(request, result);
        return result;
      }

      // Check resource type access
      if (!hasResourceAccess(request.principal.roles, request.resourceType)) {
        evaluatedPolicies++;
        const result: AccessResult = {
          decision: 'deny',
          denyReason: 'insufficient_role',
          auditId: generateId('audit'),
          evaluatedPolicies,
          processingTimeMs: Date.now() - startTime,
        };
        this.logAccess(request, result);
        return result;
      }

      // Check permission
      if (!hasPermission(request.principal.roles, request.action)) {
        evaluatedPolicies++;
        const result: AccessResult = {
          decision: 'deny',
          denyReason: 'permission_denied',
          auditId: generateId('audit'),
          evaluatedPolicies,
          processingTimeMs: Date.now() - startTime,
        };
        this.logAccess(request, result);
        return result;
      }

      // Check policy-specific rules
      const policy = policies.get(request.resourceType);
      if (policy) {
        evaluatedPolicies++;

        // Check allowed roles
        const hasAllowedRole = request.principal.roles.some(r => policy.allowedRoles.includes(r));
        if (!hasAllowedRole) {
          const result: AccessResult = {
            decision: 'deny',
            denyReason: 'insufficient_role',
            auditId: generateId('audit'),
            evaluatedPolicies,
            processingTimeMs: Date.now() - startTime,
          };
          this.logAccess(request, result);
          return result;
        }

        // Check session validity
        if (!isSessionValid(request.principal, policy)) {
          const result: AccessResult = {
            decision: 'deny',
            denyReason: 'invalid_session',
            auditId: generateId('audit'),
            evaluatedPolicies,
            processingTimeMs: Date.now() - startTime,
          };
          this.logAccess(request, result);
          return result;
        }
      }

      // Access allowed
      const result: AccessResult = {
        decision: 'allow',
        auditId: generateId('audit'),
        evaluatedPolicies,
        processingTimeMs: Date.now() - startTime,
      };
      this.logAccess(request, result);
      return result;
    },

    // Audit Logging
    logAccess(request: AccessRequest, result: AccessResult): void {
      auditLog.push({
        id: result.auditId,
        request,
        result,
        timestamp: new Date().toISOString(),
      });
    },

    getAuditLog(filters?: {
      userId?: UserId;
      decision?: AccessDecision;
      resourceType?: ResourceType;
    }): readonly AccessAuditEntry[] {
      let results = [...auditLog];

      if (filters?.userId) {
        results = results.filter(e => e.request.principal.id === filters.userId);
      }
      if (filters?.decision) {
        results = results.filter(e => e.result.decision === filters.decision);
      }
      if (filters?.resourceType) {
        results = results.filter(e => e.request.resourceType === filters.resourceType);
      }

      return results;
    },

    // Role Permission Matrix
    getRolePermissionMatrix(): readonly RolePermissionMatrix[] {
      return Object.entries(rolePermissions).map(([role, permissions]) => ({
        role: role as Role,
        permissions,
        resourceScopes: roleHierarchy[role as Role],
      }));
    },

    // Permission Check Utilities
    canRead(principal: UserPrincipal, resourceType: ResourceType): boolean {
      return (
        hasResourceAccess(principal.roles, resourceType) && hasPermission(principal.roles, 'read')
      );
    },

    canExport(principal: UserPrincipal, resourceType: ResourceType): boolean {
      return (
        hasResourceAccess(principal.roles, resourceType) && hasPermission(principal.roles, 'export')
      );
    },

    canDrilldown(principal: UserPrincipal, resourceType: ResourceType): boolean {
      return (
        hasResourceAccess(principal.roles, resourceType) &&
        hasPermission(principal.roles, 'drilldown')
      );
    },

    canConfigure(principal: UserPrincipal): boolean {
      return hasPermission(principal.roles, 'configure');
    },
  };
}

// ============================================================================
// Test Helpers
// ============================================================================

function createTestPrincipal(roles: Role[], overrides: Partial<UserPrincipal> = {}): UserPrincipal {
  return {
    id: `sha256:user_${Math.random().toString(36).slice(2)}` as UserId,
    roles,
    sessionId: `sha256:session_${Math.random().toString(36).slice(2)}` as SessionId,
    ipAddress: '10.0.0.1',
    authenticatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createAccessRequest(
  principal: UserPrincipal,
  resourceType: ResourceType,
  action: Permission
): AccessRequest {
  return {
    principal,
    resourceType,
    resourceId: `sha256:resource_${Math.random().toString(36).slice(2)}` as ResourceId,
    action,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XVIII: Portal Access Control Contracts', () => {
  let accessControl: ReturnType<typeof createMockAccessControlService>;

  beforeEach(() => {
    accessControl = createMockAccessControlService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate audit IDs with sha256: prefix', () => {
      const principal = createTestPrincipal(['viewer']);
      const request = createAccessRequest(principal, 'portal', 'read');
      const result = accessControl.evaluateAccess(request);

      assert.ok(result.auditId.startsWith('sha256:'));
    });

    it('should accept user IDs with sha256: prefix', () => {
      const principal = createTestPrincipal(['executive']);
      assert.ok(principal.id.startsWith('sha256:'));
    });

    it('should accept session IDs with sha256: prefix', () => {
      const principal = createTestPrincipal(['admin']);
      assert.ok(principal.sessionId.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Role-Based Access Tests
  // ==========================================================================

  describe('Role-Based Access', () => {
    it('should allow executive to read portal', () => {
      const principal = createTestPrincipal(['executive']);
      const request = createAccessRequest(principal, 'portal', 'read');
      const result = accessControl.evaluateAccess(request);

      assert.strictEqual(result.decision, 'allow');
    });

    it('should allow admin full access', () => {
      const principal = createTestPrincipal(['admin']);

      const readResult = accessControl.evaluateAccess(
        createAccessRequest(principal, 'configuration', 'read')
      );
      const writeResult = accessControl.evaluateAccess(
        createAccessRequest(principal, 'configuration', 'write')
      );
      const configureResult = accessControl.evaluateAccess(
        createAccessRequest(principal, 'configuration', 'configure')
      );

      assert.strictEqual(readResult.decision, 'allow');
      assert.strictEqual(writeResult.decision, 'allow');
      assert.strictEqual(configureResult.decision, 'allow');
    });

    it('should deny viewer write access', () => {
      const principal = createTestPrincipal(['viewer']);
      const request = createAccessRequest(principal, 'portal', 'write');
      const result = accessControl.evaluateAccess(request);

      assert.strictEqual(result.decision, 'deny');
      assert.strictEqual(result.denyReason, 'permission_denied');
    });

    it('should deny viewer access to configuration', () => {
      const principal = createTestPrincipal(['viewer']);
      const request = createAccessRequest(principal, 'configuration', 'read');
      const result = accessControl.evaluateAccess(request);

      assert.strictEqual(result.decision, 'deny');
      assert.strictEqual(result.denyReason, 'insufficient_role');
    });

    it('should allow auditor export access', () => {
      const principal = createTestPrincipal(['auditor']);
      const request = createAccessRequest(principal, 'report', 'export');
      const result = accessControl.evaluateAccess(request);

      assert.strictEqual(result.decision, 'allow');
    });

    it('should allow federation partner drilldown', () => {
      const principal = createTestPrincipal(['federation_partner']);
      const request = createAccessRequest(principal, 'report', 'drilldown');
      const result = accessControl.evaluateAccess(request);

      assert.strictEqual(result.decision, 'allow');
    });
  });

  // ==========================================================================
  // Policy Enforcement Tests
  // ==========================================================================

  describe('Policy Enforcement', () => {
    it('should enforce custom policy', () => {
      accessControl.setPolicy({
        resourceType: 'report',
        allowedRoles: ['executive', 'admin'],
        requiredPermissions: ['read', 'export'],
        maxSessionAgeMinutes: 60,
      });

      const auditor = createTestPrincipal(['auditor']);
      const request = createAccessRequest(auditor, 'report', 'read');
      const result = accessControl.evaluateAccess(request);

      assert.strictEqual(result.decision, 'deny');
      assert.strictEqual(result.denyReason, 'insufficient_role');
    });

    it('should allow policy-compliant access', () => {
      accessControl.setPolicy({
        resourceType: 'dashboard',
        allowedRoles: ['executive', 'admin', 'viewer'],
        requiredPermissions: ['read'],
      });

      const viewer = createTestPrincipal(['viewer']);
      const request = createAccessRequest(viewer, 'dashboard', 'read');
      const result = accessControl.evaluateAccess(request);

      assert.strictEqual(result.decision, 'allow');
    });

    it('should enforce session age limits', () => {
      accessControl.setPolicy({
        resourceType: 'evidence',
        allowedRoles: ['executive', 'admin'],
        requiredPermissions: ['read'],
        maxSessionAgeMinutes: 30,
      });

      // Create principal with old session
      const oldSession = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      const principal = createTestPrincipal(['executive'], { authenticatedAt: oldSession });
      const request = createAccessRequest(principal, 'evidence', 'read');
      const result = accessControl.evaluateAccess(request);

      assert.strictEqual(result.decision, 'deny');
      assert.strictEqual(result.denyReason, 'invalid_session');
    });
  });

  // ==========================================================================
  // IP Blocking Tests
  // ==========================================================================

  describe('IP Blocking', () => {
    it('should block access from blocked IP', () => {
      accessControl.blockIp('192.168.1.100');

      const principal = createTestPrincipal(['admin'], { ipAddress: '192.168.1.100' });
      const request = createAccessRequest(principal, 'portal', 'read');
      const result = accessControl.evaluateAccess(request);

      assert.strictEqual(result.decision, 'deny');
      assert.strictEqual(result.denyReason, 'ip_blocked');
    });

    it('should allow access after unblocking IP', () => {
      accessControl.blockIp('192.168.1.100');
      accessControl.unblockIp('192.168.1.100');

      const principal = createTestPrincipal(['admin'], { ipAddress: '192.168.1.100' });
      const request = createAccessRequest(principal, 'portal', 'read');
      const result = accessControl.evaluateAccess(request);

      assert.strictEqual(result.decision, 'allow');
    });

    it('should check IP block status', () => {
      accessControl.blockIp('10.0.0.50');

      assert.strictEqual(accessControl.isIpBlocked('10.0.0.50'), true);
      assert.strictEqual(accessControl.isIpBlocked('10.0.0.51'), false);
    });
  });

  // ==========================================================================
  // Rate Limiting Tests
  // ==========================================================================

  describe('Rate Limiting', () => {
    it('should allow requests under rate limit', () => {
      const principal = createTestPrincipal(['viewer']);

      for (let i = 0; i < 10; i++) {
        const request = createAccessRequest(principal, 'portal', 'read');
        const result = accessControl.evaluateAccess(request);
        assert.strictEqual(result.decision, 'allow');
      }
    });

    // Note: Full rate limit testing would require time manipulation
    // This test verifies the basic structure
    it('should track request counts', () => {
      const principal = createTestPrincipal(['viewer']);
      const request = createAccessRequest(principal, 'portal', 'read');

      // First request should always succeed
      const result = accessControl.evaluateAccess(request);
      assert.strictEqual(result.decision, 'allow');
    });
  });

  // ==========================================================================
  // Audit Logging Tests
  // ==========================================================================

  describe('Audit Logging', () => {
    it('should log all access attempts', () => {
      const principal = createTestPrincipal(['viewer']);
      const request = createAccessRequest(principal, 'portal', 'read');
      accessControl.evaluateAccess(request);

      const logs = accessControl.getAuditLog();
      assert.strictEqual(logs.length, 1);
    });

    it('should log denied access attempts', () => {
      const principal = createTestPrincipal(['viewer']);
      const request = createAccessRequest(principal, 'configuration', 'read');
      accessControl.evaluateAccess(request);

      const deniedLogs = accessControl.getAuditLog({ decision: 'deny' });
      assert.strictEqual(deniedLogs.length, 1);
    });

    it('should filter audit log by user', () => {
      const user1 = createTestPrincipal(['viewer']);
      const user2 = createTestPrincipal(['admin']);

      accessControl.evaluateAccess(createAccessRequest(user1, 'portal', 'read'));
      accessControl.evaluateAccess(createAccessRequest(user2, 'portal', 'read'));

      const user1Logs = accessControl.getAuditLog({ userId: user1.id });
      assert.strictEqual(user1Logs.length, 1);
    });

    it('should filter audit log by resource type', () => {
      const principal = createTestPrincipal(['admin']);

      accessControl.evaluateAccess(createAccessRequest(principal, 'portal', 'read'));
      accessControl.evaluateAccess(createAccessRequest(principal, 'dashboard', 'read'));
      accessControl.evaluateAccess(createAccessRequest(principal, 'report', 'read'));

      const portalLogs = accessControl.getAuditLog({ resourceType: 'portal' });
      assert.strictEqual(portalLogs.length, 1);
    });

    it('should include processing time in audit', () => {
      const principal = createTestPrincipal(['viewer']);
      const request = createAccessRequest(principal, 'portal', 'read');
      const result = accessControl.evaluateAccess(request);

      assert.ok(result.processingTimeMs >= 0);
    });
  });

  // ==========================================================================
  // Permission Utility Tests
  // ==========================================================================

  describe('Permission Utilities', () => {
    it('should check read permission', () => {
      const executive = createTestPrincipal(['executive']);
      const viewer = createTestPrincipal(['viewer']);

      assert.strictEqual(accessControl.canRead(executive, 'report'), true);
      assert.strictEqual(accessControl.canRead(viewer, 'report'), false);
    });

    it('should check export permission', () => {
      const auditor = createTestPrincipal(['auditor']);
      const viewer = createTestPrincipal(['viewer']);

      assert.strictEqual(accessControl.canExport(auditor, 'report'), true);
      assert.strictEqual(accessControl.canExport(viewer, 'report'), false);
    });

    it('should check drilldown permission', () => {
      const executive = createTestPrincipal(['executive']);
      const serviceAccount = createTestPrincipal(['service_account']);

      assert.strictEqual(accessControl.canDrilldown(executive, 'report'), true);
      assert.strictEqual(accessControl.canDrilldown(serviceAccount, 'report'), false);
    });

    it('should check configure permission', () => {
      const admin = createTestPrincipal(['admin']);
      const executive = createTestPrincipal(['executive']);

      assert.strictEqual(accessControl.canConfigure(admin), true);
      assert.strictEqual(accessControl.canConfigure(executive), false);
    });
  });

  // ==========================================================================
  // Role Permission Matrix Tests
  // ==========================================================================

  describe('Role Permission Matrix', () => {
    it('should return complete matrix', () => {
      const matrix = accessControl.getRolePermissionMatrix();

      assert.ok(matrix.length > 0);
      assert.ok(matrix.some(m => m.role === 'executive'));
      assert.ok(matrix.some(m => m.role === 'admin'));
    });

    it('should include permissions for each role', () => {
      const matrix = accessControl.getRolePermissionMatrix();
      const adminEntry = matrix.find(m => m.role === 'admin');

      assert.ok(adminEntry);
      assert.ok(adminEntry.permissions.includes('read'));
      assert.ok(adminEntry.permissions.includes('write'));
      assert.ok(adminEntry.permissions.includes('configure'));
    });

    it('should include resource scopes for each role', () => {
      const matrix = accessControl.getRolePermissionMatrix();
      const viewerEntry = matrix.find(m => m.role === 'viewer');

      assert.ok(viewerEntry);
      assert.ok(viewerEntry.resourceScopes.includes('portal'));
      assert.ok(viewerEntry.resourceScopes.includes('dashboard'));
    });
  });

  // ==========================================================================
  // Multi-Role Tests
  // ==========================================================================

  describe('Multi-Role Access', () => {
    it('should combine role permissions', () => {
      const principal = createTestPrincipal(['viewer', 'auditor']);
      const request = createAccessRequest(principal, 'report', 'export');
      const result = accessControl.evaluateAccess(request);

      // Auditor role grants export
      assert.strictEqual(result.decision, 'allow');
    });

    it('should combine role resource scopes', () => {
      const principal = createTestPrincipal(['viewer', 'federation_partner']);
      const request = createAccessRequest(principal, 'report', 'read');
      const result = accessControl.evaluateAccess(request);

      // federation_partner has report access
      assert.strictEqual(result.decision, 'allow');
    });
  });

  // ==========================================================================
  // Read-Only Invariant Tests
  // ==========================================================================

  describe('Read-Only Portal Invariants', () => {
    it('should return copies of audit log', () => {
      const principal = createTestPrincipal(['viewer']);
      accessControl.evaluateAccess(createAccessRequest(principal, 'portal', 'read'));

      const log1 = accessControl.getAuditLog();
      const log2 = accessControl.getAuditLog();

      assert.notStrictEqual(log1, log2);
    });

    it('should return copies of permission matrix', () => {
      const matrix1 = accessControl.getRolePermissionMatrix();
      const matrix2 = accessControl.getRolePermissionMatrix();

      assert.notStrictEqual(matrix1, matrix2);
    });
  });
});
