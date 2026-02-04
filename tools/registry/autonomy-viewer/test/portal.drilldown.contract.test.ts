/**
 * Phase XVIII — Executive Oversight Portal
 * =========================================
 * Contract: portal.drilldown.contract.test.ts
 *
 * Tests audit drilldown views for the executive oversight portal,
 * including click-through to evidence references with sha256: links only.
 * No embedded evidence - all references are opaque hashes.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Portal views are read-only
 * - Evidence is referenced, never embedded
 * - Drilldown paths are traceable
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type EntityId = `sha256:${string}`;
type EvidenceRef = `sha256:${string}`;
type PackRef = `sha256:${string}`;
type AuditTrailId = `sha256:${string}`;

type EntityType = 'service' | 'control' | 'agency' | 'incident' | 'drill' | 'attestation';
type DrilldownLevel = 'summary' | 'detail' | 'evidence' | 'timeline';
type ActionType = 'view' | 'drilldown' | 'export' | 'filter';

interface EvidenceLink {
  readonly ref: EvidenceRef;
  readonly type:
    | 'attestation_pack'
    | 'dr_proof'
    | 'audit_log'
    | 'metric_snapshot'
    | 'incident_report';
  readonly label: string;
  readonly createdAt: string;
}

interface DrilldownNode {
  readonly id: EntityId;
  readonly entityType: EntityType;
  readonly displayLabel: string;
  readonly level: DrilldownLevel;
  readonly parentId?: EntityId;
  readonly evidenceLinks: readonly EvidenceLink[];
  readonly childCount: number;
}

interface DrilldownPath {
  readonly nodes: readonly DrilldownNode[];
  readonly currentLevel: DrilldownLevel;
  readonly depth: number;
}

interface AuditAction {
  readonly id: AuditTrailId;
  readonly userId: EntityId;
  readonly action: ActionType;
  readonly targetId: EntityId;
  readonly targetType: EntityType;
  readonly timestamp: string;
  readonly details: Record<string, string>;
}

interface DrilldownResult {
  readonly node: DrilldownNode;
  readonly path: DrilldownPath;
  readonly children: readonly DrilldownNode[];
  readonly auditAction: AuditAction;
}

interface EvidenceMetadata {
  readonly ref: EvidenceRef;
  readonly type: string;
  readonly sizeBytes: number;
  readonly createdAt: string;
  readonly expiresAt?: string;
  readonly checksumValid: boolean;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockDrilldownPortalService() {
  const nodes = new Map<EntityId, DrilldownNode>();
  const evidenceRegistry = new Map<EvidenceRef, EvidenceMetadata>();
  const auditTrail: AuditAction[] = [];

  function generateId(prefix: string): EntityId {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}` as EntityId;
  }

  function generateEvidenceRef(type: string): EvidenceRef {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${type}_${hash}` as EvidenceRef;
  }

  return {
    // Node Registration
    registerNode(
      entityType: EntityType,
      displayLabel: string,
      level: DrilldownLevel,
      parentId?: EntityId,
      evidenceLinks: EvidenceLink[] = []
    ): DrilldownNode {
      const id = generateId(entityType);
      const node: DrilldownNode = {
        id,
        entityType,
        displayLabel,
        level,
        parentId,
        evidenceLinks,
        childCount: 0,
      };
      nodes.set(id, node);

      // Update parent's child count
      if (parentId) {
        const parent = nodes.get(parentId);
        if (parent) {
          nodes.set(parentId, { ...parent, childCount: parent.childCount + 1 });
        }
      }

      return node;
    },

    getNode(id: EntityId): DrilldownNode | undefined {
      return nodes.get(id);
    },

    // Evidence Registration
    registerEvidence(type: string, sizeBytes: number, expiresAt?: string): EvidenceMetadata {
      const ref = generateEvidenceRef(type);
      const metadata: EvidenceMetadata = {
        ref,
        type,
        sizeBytes,
        createdAt: new Date().toISOString(),
        expiresAt,
        checksumValid: true,
      };
      evidenceRegistry.set(ref, metadata);
      return metadata;
    },

    getEvidenceMetadata(ref: EvidenceRef): EvidenceMetadata | undefined {
      return evidenceRegistry.get(ref);
    },

    // Evidence Link Creation
    createEvidenceLink(ref: EvidenceRef, type: EvidenceLink['type'], label: string): EvidenceLink {
      return {
        ref,
        type,
        label,
        createdAt: new Date().toISOString(),
      };
    },

    // Drilldown Operations
    drilldown(userId: EntityId, targetId: EntityId): DrilldownResult | null {
      const node = nodes.get(targetId);
      if (!node) return null;

      // Build path from root to current node
      const pathNodes: DrilldownNode[] = [];
      let current: DrilldownNode | undefined = node;
      while (current) {
        pathNodes.unshift(current);
        current = current.parentId ? nodes.get(current.parentId) : undefined;
      }

      const path: DrilldownPath = {
        nodes: pathNodes,
        currentLevel: node.level,
        depth: pathNodes.length,
      };

      // Get children
      const children: DrilldownNode[] = [];
      for (const [, n] of nodes) {
        if (n.parentId === targetId) {
          children.push(n);
        }
      }

      // Record audit action
      const auditId = generateId('audit') as AuditTrailId;
      const auditAction: AuditAction = {
        id: auditId,
        userId,
        action: 'drilldown',
        targetId,
        targetType: node.entityType,
        timestamp: new Date().toISOString(),
        details: {
          level: node.level,
          depth: String(path.depth),
        },
      };
      auditTrail.push(auditAction);

      return { node, path, children, auditAction };
    },

    // Path Validation
    validatePath(path: DrilldownPath): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      if (path.nodes.length === 0) {
        errors.push('Path cannot be empty');
        return { valid: false, errors };
      }

      // Validate each node exists
      for (const node of path.nodes) {
        if (!nodes.has(node.id)) {
          errors.push(`Node ${node.id} not found`);
        }
      }

      // Validate parent-child relationships
      for (let i = 1; i < path.nodes.length; i++) {
        const current = path.nodes[i];
        const parent = path.nodes[i - 1];
        if (current.parentId !== parent.id) {
          errors.push(`Node ${current.id} is not a child of ${parent.id}`);
        }
      }

      // Validate depth consistency
      if (path.depth !== path.nodes.length) {
        errors.push(`Depth mismatch: ${path.depth} vs ${path.nodes.length} nodes`);
      }

      return { valid: errors.length === 0, errors };
    },

    // Evidence Validation
    validateEvidenceLinks(links: readonly EvidenceLink[]): {
      valid: boolean;
      missing: EvidenceRef[];
    } {
      const missing: EvidenceRef[] = [];

      for (const link of links) {
        if (!evidenceRegistry.has(link.ref)) {
          missing.push(link.ref);
        }
      }

      return { valid: missing.length === 0, missing };
    },

    // Audit Trail
    recordAuditAction(
      userId: EntityId,
      action: ActionType,
      targetId: EntityId,
      targetType: EntityType,
      details: Record<string, string> = {}
    ): AuditAction {
      const id = generateId('audit') as AuditTrailId;
      const auditAction: AuditAction = {
        id,
        userId,
        action,
        targetId,
        targetType,
        timestamp: new Date().toISOString(),
        details,
      };
      auditTrail.push(auditAction);
      return auditAction;
    },

    getAuditTrail(filters?: {
      userId?: EntityId;
      action?: ActionType;
      targetType?: EntityType;
    }): readonly AuditAction[] {
      let results = [...auditTrail];

      if (filters?.userId) {
        results = results.filter(a => a.userId === filters.userId);
      }
      if (filters?.action) {
        results = results.filter(a => a.action === filters.action);
      }
      if (filters?.targetType) {
        results = results.filter(a => a.targetType === filters.targetType);
      }

      return results;
    },

    // Breadcrumb Generation
    getBreadcrumbs(nodeId: EntityId): readonly { id: EntityId; label: string }[] {
      const breadcrumbs: { id: EntityId; label: string }[] = [];
      let current = nodes.get(nodeId);

      while (current) {
        breadcrumbs.unshift({ id: current.id, label: current.displayLabel });
        current = current.parentId ? nodes.get(current.parentId) : undefined;
      }

      return breadcrumbs;
    },

    // Export Support
    exportNodeData(
      userId: EntityId,
      nodeId: EntityId,
      format: 'json' | 'csv'
    ): { success: boolean; exportRef?: EvidenceRef } {
      const node = nodes.get(nodeId);
      if (!node) return { success: false };

      // Record audit
      const exportRef = generateEvidenceRef('export');
      this.recordAuditAction(userId, 'export', nodeId, node.entityType, { format });

      return { success: true, exportRef };
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XVIII: Portal Drilldown Contracts', () => {
  let portal: ReturnType<typeof createMockDrilldownPortalService>;
  const testUserId = 'sha256:user_test_1' as EntityId;

  beforeEach(() => {
    portal = createMockDrilldownPortalService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate node IDs with sha256: prefix', () => {
      const node = portal.registerNode('service', 'Auth Service', 'summary');
      assert.ok(node.id.startsWith('sha256:'));
    });

    it('should generate evidence refs with sha256: prefix', () => {
      const evidence = portal.registerEvidence('attestation_pack', 1024);
      assert.ok(evidence.ref.startsWith('sha256:'));
    });

    it('should generate audit IDs with sha256: prefix', () => {
      const action = portal.recordAuditAction(
        testUserId,
        'view',
        'sha256:target_1' as EntityId,
        'service'
      );
      assert.ok(action.id.startsWith('sha256:'));
    });

    it('should create evidence links with sha256: refs', () => {
      const evidence = portal.registerEvidence('audit_log', 2048);
      const link = portal.createEvidenceLink(evidence.ref, 'audit_log', 'Access Log');
      assert.ok(link.ref.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Node Registration Tests
  // ==========================================================================

  describe('Node Registration', () => {
    it('should register root node', () => {
      const node = portal.registerNode('service', 'Core Platform', 'summary');
      assert.strictEqual(node.entityType, 'service');
      assert.strictEqual(node.level, 'summary');
      assert.strictEqual(node.parentId, undefined);
    });

    it('should register child node', () => {
      const parent = portal.registerNode('service', 'Core Platform', 'summary');
      const child = portal.registerNode('control', 'Access Control', 'detail', parent.id);

      assert.strictEqual(child.parentId, parent.id);
    });

    it('should update parent child count', () => {
      const parent = portal.registerNode('service', 'Core Platform', 'summary');
      portal.registerNode('control', 'Control 1', 'detail', parent.id);
      portal.registerNode('control', 'Control 2', 'detail', parent.id);

      const updated = portal.getNode(parent.id);
      assert.strictEqual(updated?.childCount, 2);
    });

    it('should register node with evidence links', () => {
      const evidence = portal.registerEvidence('attestation_pack', 1024);
      const link = portal.createEvidenceLink(evidence.ref, 'attestation_pack', 'Compliance Pack');
      const node = portal.registerNode('attestation', 'Q1 Attestation', 'evidence', undefined, [
        link,
      ]);

      assert.strictEqual(node.evidenceLinks.length, 1);
      assert.strictEqual(node.evidenceLinks[0].ref, evidence.ref);
    });
  });

  // ==========================================================================
  // Evidence Registration Tests
  // ==========================================================================

  describe('Evidence Registration', () => {
    it('should register evidence with metadata', () => {
      const evidence = portal.registerEvidence('dr_proof', 4096, '2027-01-01T00:00:00Z');

      assert.strictEqual(evidence.type, 'dr_proof');
      assert.strictEqual(evidence.sizeBytes, 4096);
      assert.strictEqual(evidence.checksumValid, true);
    });

    it('should retrieve evidence metadata', () => {
      const evidence = portal.registerEvidence('audit_log', 2048);
      const retrieved = portal.getEvidenceMetadata(evidence.ref);

      assert.strictEqual(retrieved?.ref, evidence.ref);
    });

    it('should track evidence expiration', () => {
      const expiry = '2027-01-01T00:00:00Z';
      const evidence = portal.registerEvidence('attestation_pack', 1024, expiry);

      assert.strictEqual(evidence.expiresAt, expiry);
    });
  });

  // ==========================================================================
  // Drilldown Operation Tests
  // ==========================================================================

  describe('Drilldown Operations', () => {
    it('should drilldown to node', () => {
      const node = portal.registerNode('service', 'Auth Service', 'summary');
      const result = portal.drilldown(testUserId, node.id);

      assert.ok(result);
      assert.strictEqual(result.node.id, node.id);
    });

    it('should build path from root', () => {
      const root = portal.registerNode('service', 'Platform', 'summary');
      const child = portal.registerNode('control', 'Access', 'detail', root.id);
      const grandchild = portal.registerNode('attestation', 'Audit', 'evidence', child.id);

      const result = portal.drilldown(testUserId, grandchild.id);

      assert.strictEqual(result?.path.depth, 3);
      assert.strictEqual(result?.path.nodes[0].id, root.id);
      assert.strictEqual(result?.path.nodes[2].id, grandchild.id);
    });

    it('should include children in drilldown', () => {
      const parent = portal.registerNode('service', 'Platform', 'summary');
      portal.registerNode('control', 'Control A', 'detail', parent.id);
      portal.registerNode('control', 'Control B', 'detail', parent.id);

      const result = portal.drilldown(testUserId, parent.id);

      assert.strictEqual(result?.children.length, 2);
    });

    it('should record audit action on drilldown', () => {
      const node = portal.registerNode('service', 'Auth Service', 'summary');
      const result = portal.drilldown(testUserId, node.id);

      assert.strictEqual(result?.auditAction.action, 'drilldown');
      assert.strictEqual(result?.auditAction.userId, testUserId);
    });

    it('should return null for unknown node', () => {
      const result = portal.drilldown(testUserId, 'sha256:unknown_node' as EntityId);
      assert.strictEqual(result, null);
    });
  });

  // ==========================================================================
  // Path Validation Tests
  // ==========================================================================

  describe('Path Validation', () => {
    it('should validate correct path', () => {
      const root = portal.registerNode('service', 'Platform', 'summary');
      const child = portal.registerNode('control', 'Access', 'detail', root.id);

      const result = portal.drilldown(testUserId, child.id);
      const validation = portal.validatePath(result!.path);

      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.errors.length, 0);
    });

    it('should reject empty path', () => {
      const emptyPath: DrilldownPath = {
        nodes: [],
        currentLevel: 'summary',
        depth: 0,
      };

      const validation = portal.validatePath(emptyPath);

      assert.strictEqual(validation.valid, false);
      assert.ok(validation.errors.includes('Path cannot be empty'));
    });

    it('should detect depth mismatch', () => {
      const root = portal.registerNode('service', 'Platform', 'summary');

      const invalidPath: DrilldownPath = {
        nodes: [root],
        currentLevel: 'summary',
        depth: 5, // Wrong depth
      };

      const validation = portal.validatePath(invalidPath);

      assert.strictEqual(validation.valid, false);
    });
  });

  // ==========================================================================
  // Evidence Link Validation Tests
  // ==========================================================================

  describe('Evidence Link Validation', () => {
    it('should validate existing evidence links', () => {
      const evidence = portal.registerEvidence('attestation_pack', 1024);
      const link = portal.createEvidenceLink(evidence.ref, 'attestation_pack', 'Pack 1');

      const validation = portal.validateEvidenceLinks([link]);

      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.missing.length, 0);
    });

    it('should detect missing evidence', () => {
      const fakeLink: EvidenceLink = {
        ref: 'sha256:missing_evidence_ref' as EvidenceRef,
        type: 'attestation_pack',
        label: 'Missing Pack',
        createdAt: new Date().toISOString(),
      };

      const validation = portal.validateEvidenceLinks([fakeLink]);

      assert.strictEqual(validation.valid, false);
      assert.strictEqual(validation.missing.length, 1);
    });

    it('should report all missing evidence refs', () => {
      const fakeLinks: EvidenceLink[] = [
        {
          ref: 'sha256:missing_1' as EvidenceRef,
          type: 'attestation_pack',
          label: 'M1',
          createdAt: new Date().toISOString(),
        },
        {
          ref: 'sha256:missing_2' as EvidenceRef,
          type: 'dr_proof',
          label: 'M2',
          createdAt: new Date().toISOString(),
        },
      ];

      const validation = portal.validateEvidenceLinks(fakeLinks);

      assert.strictEqual(validation.missing.length, 2);
    });
  });

  // ==========================================================================
  // Audit Trail Tests
  // ==========================================================================

  describe('Audit Trail', () => {
    it('should record audit actions', () => {
      portal.recordAuditAction(testUserId, 'view', 'sha256:target_1' as EntityId, 'service');
      const trail = portal.getAuditTrail();

      assert.strictEqual(trail.length, 1);
      assert.strictEqual(trail[0].action, 'view');
    });

    it('should filter by user', () => {
      const user1 = 'sha256:user_1' as EntityId;
      const user2 = 'sha256:user_2' as EntityId;

      portal.recordAuditAction(user1, 'view', 'sha256:t1' as EntityId, 'service');
      portal.recordAuditAction(user2, 'view', 'sha256:t2' as EntityId, 'service');

      const user1Trail = portal.getAuditTrail({ userId: user1 });

      assert.strictEqual(user1Trail.length, 1);
    });

    it('should filter by action type', () => {
      portal.recordAuditAction(testUserId, 'view', 'sha256:t1' as EntityId, 'service');
      portal.recordAuditAction(testUserId, 'export', 'sha256:t2' as EntityId, 'service');
      portal.recordAuditAction(testUserId, 'drilldown', 'sha256:t3' as EntityId, 'service');

      const exports = portal.getAuditTrail({ action: 'export' });

      assert.strictEqual(exports.length, 1);
    });

    it('should filter by target type', () => {
      portal.recordAuditAction(testUserId, 'view', 'sha256:t1' as EntityId, 'service');
      portal.recordAuditAction(testUserId, 'view', 'sha256:t2' as EntityId, 'control');
      portal.recordAuditAction(testUserId, 'view', 'sha256:t3' as EntityId, 'service');

      const serviceActions = portal.getAuditTrail({ targetType: 'service' });

      assert.strictEqual(serviceActions.length, 2);
    });

    it('should include details in audit', () => {
      portal.recordAuditAction(testUserId, 'filter', 'sha256:t1' as EntityId, 'service', {
        filterType: 'date_range',
        startDate: '2026-01-01',
      });

      const trail = portal.getAuditTrail();

      assert.strictEqual(trail[0].details.filterType, 'date_range');
    });
  });

  // ==========================================================================
  // Breadcrumb Tests
  // ==========================================================================

  describe('Breadcrumb Generation', () => {
    it('should generate breadcrumbs from root', () => {
      const root = portal.registerNode('service', 'Platform', 'summary');
      const child = portal.registerNode('control', 'Access Control', 'detail', root.id);
      const grandchild = portal.registerNode('attestation', 'Audit Log', 'evidence', child.id);

      const breadcrumbs = portal.getBreadcrumbs(grandchild.id);

      assert.strictEqual(breadcrumbs.length, 3);
      assert.strictEqual(breadcrumbs[0].label, 'Platform');
      assert.strictEqual(breadcrumbs[2].label, 'Audit Log');
    });

    it('should include node IDs in breadcrumbs', () => {
      const root = portal.registerNode('service', 'Platform', 'summary');
      const child = portal.registerNode('control', 'Access', 'detail', root.id);

      const breadcrumbs = portal.getBreadcrumbs(child.id);

      assert.strictEqual(breadcrumbs[0].id, root.id);
      assert.strictEqual(breadcrumbs[1].id, child.id);
    });

    it('should return single breadcrumb for root', () => {
      const root = portal.registerNode('service', 'Platform', 'summary');
      const breadcrumbs = portal.getBreadcrumbs(root.id);

      assert.strictEqual(breadcrumbs.length, 1);
    });
  });

  // ==========================================================================
  // Export Tests
  // ==========================================================================

  describe('Export Support', () => {
    it('should export node data', () => {
      const node = portal.registerNode('service', 'Auth Service', 'summary');
      const result = portal.exportNodeData(testUserId, node.id, 'json');

      assert.strictEqual(result.success, true);
      assert.ok(result.exportRef?.startsWith('sha256:'));
    });

    it('should record export in audit trail', () => {
      const node = portal.registerNode('service', 'Auth Service', 'summary');
      portal.exportNodeData(testUserId, node.id, 'csv');

      const exports = portal.getAuditTrail({ action: 'export' });

      assert.strictEqual(exports.length, 1);
      assert.strictEqual(exports[0].details.format, 'csv');
    });

    it('should fail export for unknown node', () => {
      const result = portal.exportNodeData(testUserId, 'sha256:unknown' as EntityId, 'json');
      assert.strictEqual(result.success, false);
    });
  });

  // ==========================================================================
  // Evidence Reference Only Tests
  // ==========================================================================

  describe('Evidence Reference Only (No Embedding)', () => {
    it('should only store evidence references, not content', () => {
      const evidence = portal.registerEvidence('attestation_pack', 1024);

      // Evidence metadata contains reference only
      assert.ok(evidence.ref);
      assert.ok(typeof evidence.ref === 'string');
      // No content property
      assert.strictEqual((evidence as any).content, undefined);
    });

    it('should create links with references only', () => {
      const evidence = portal.registerEvidence('audit_log', 2048);
      const link = portal.createEvidenceLink(evidence.ref, 'audit_log', 'Log File');

      // Link contains reference only
      assert.ok(link.ref);
      assert.strictEqual((link as any).content, undefined);
      assert.strictEqual((link as any).data, undefined);
    });

    it('should not embed evidence in nodes', () => {
      const evidence = portal.registerEvidence('dr_proof', 4096);
      const link = portal.createEvidenceLink(evidence.ref, 'dr_proof', 'DR Proof');
      const node = portal.registerNode('attestation', 'DR Attestation', 'evidence', undefined, [
        link,
      ]);

      // Node contains links, not embedded evidence
      for (const nodeLink of node.evidenceLinks) {
        assert.ok(nodeLink.ref.startsWith('sha256:'));
        assert.strictEqual((nodeLink as any).content, undefined);
      }
    });
  });

  // ==========================================================================
  // Read-Only Invariant Tests
  // ==========================================================================

  describe('Read-Only Portal Invariants', () => {
    it('should return copies of audit trail', () => {
      portal.recordAuditAction(testUserId, 'view', 'sha256:t1' as EntityId, 'service');
      const trail1 = portal.getAuditTrail();
      const trail2 = portal.getAuditTrail();

      assert.notStrictEqual(trail1, trail2);
    });

    it('should return copies of breadcrumbs', () => {
      const root = portal.registerNode('service', 'Platform', 'summary');
      const bc1 = portal.getBreadcrumbs(root.id);
      const bc2 = portal.getBreadcrumbs(root.id);

      assert.notStrictEqual(bc1, bc2);
    });
  });
});
