/**
 * Phase XXIII — Global Program Synthesis + Go-Live Playbook
 * ==========================================================
 * Contract: golive.operational-checklist.contract.test.ts
 *
 * Tests operational checklists: key/cert rotation, DR pass criteria,
 * drill cadence, exception burn-down with stop-condition triggers.
 *
 * Invariants:
 * - All IDs are opaque sha256: prefixed (PII-clean)
 * - Stop conditions trigger automatic pause
 * - Checklists are operator-consumable
 * - Gates must be satisfied before go-live
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// Type Definitions
// ============================================================================

type ChecklistId = `sha256:${string}`;
type ChecklistItemId = `sha256:${string}`;
type AgencyId = `sha256:${string}`;
type CohortId = `sha256:${string}`;

type ChecklistCategory = 'security' | 'infrastructure' | 'compliance' | 'operations' | 'training';
type ItemStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'waived';
type ChecklistStatus = 'draft' | 'active' | 'completed' | 'paused' | 'failed';
type Severity = 'critical' | 'high' | 'medium' | 'low';

interface ChecklistItem {
  readonly id: ChecklistItemId;
  readonly category: ChecklistCategory;
  readonly title: string;
  readonly description: string;
  readonly severity: Severity;
  readonly status: ItemStatus;
  readonly dueDate: string;
  readonly completedAt: string | null;
  readonly completedBy: string | null;
  readonly prerequisiteIds: readonly ChecklistItemId[];
  readonly evidenceRefs: readonly `sha256:${string}`[];
  readonly blockedReason: string | null;
  readonly waiverApproval: string | null;
}

interface RotationRequirement {
  readonly itemId: ChecklistItemId;
  readonly assetType: 'key' | 'certificate' | 'credential' | 'token';
  readonly assetId: string;
  readonly lastRotated: string;
  readonly nextRotation: string;
  readonly maxAgeHours: number;
  readonly rotated: boolean;
}

interface DrRequirement {
  readonly itemId: ChecklistItemId;
  readonly drType: 'failover' | 'backup_restore' | 'data_recovery' | 'site_failover';
  readonly lastPassed: string | null;
  readonly rtoTarget: number;
  readonly rpoTarget: number;
  readonly passCriteria: readonly string[];
  readonly passed: boolean;
}

interface DrillRequirement {
  readonly itemId: ChecklistItemId;
  readonly drillType: 'tabletop' | 'technical' | 'full_scale';
  readonly cadenceDays: number;
  readonly lastCompleted: string | null;
  readonly nextDue: string;
  readonly participantRoles: readonly string[];
  readonly completed: boolean;
}

interface ExceptionItem {
  readonly id: `sha256:${string}`;
  readonly itemId: ChecklistItemId;
  readonly description: string;
  readonly raisedAt: string;
  readonly severity: Severity;
  readonly status: 'open' | 'in_remediation' | 'resolved' | 'accepted_risk';
  readonly targetResolution: string;
  readonly resolvedAt: string | null;
}

interface StopConditionTrigger {
  readonly triggerId: `sha256:${string}`;
  readonly condition: string;
  readonly triggered: boolean;
  readonly triggeredAt: string | null;
  readonly reason: string | null;
}

interface OperationalChecklist {
  readonly id: ChecklistId;
  readonly agencyId: AgencyId;
  readonly cohortId: CohortId;
  readonly name: string;
  readonly version: string;
  readonly status: ChecklistStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly items: readonly ChecklistItem[];
  readonly rotations: readonly RotationRequirement[];
  readonly drRequirements: readonly DrRequirement[];
  readonly drills: readonly DrillRequirement[];
  readonly exceptions: readonly ExceptionItem[];
  readonly stopConditions: readonly StopConditionTrigger[];
  readonly completionPercentage: number;
  readonly criticalItemsComplete: boolean;
  readonly readyForGoLive: boolean;
}

// ============================================================================
// Mock Service Implementation
// ============================================================================

function createMockOperationalChecklistService() {
  const checklists = new Map<ChecklistId, OperationalChecklist>();

  function generateId(prefix: string): `sha256:${string}` {
    const hash = Math.random().toString(36).slice(2) + Date.now().toString(36);
    return `sha256:${prefix}_${hash}`;
  }

  function isRotationCurrent(req: RotationRequirement): boolean {
    const nextDate = new Date(req.nextRotation);
    return nextDate > new Date();
  }

  function isDrPassed(req: DrRequirement): boolean {
    if (!req.lastPassed) return false;
    // Consider DR passed if completed within last 30 days
    const lastDate = new Date(req.lastPassed);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastDate >= thirtyDaysAgo;
  }

  function isDrillCurrent(req: DrillRequirement): boolean {
    const dueDate = new Date(req.nextDue);
    return dueDate > new Date();
  }

  return {
    // Checklist Creation
    createChecklist(agencyId: AgencyId, cohortId: CohortId, name: string): OperationalChecklist {
      const checklist: OperationalChecklist = {
        id: generateId('checklist') as ChecklistId,
        agencyId,
        cohortId,
        name,
        version: '1.0.0',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
        rotations: [],
        drRequirements: [],
        drills: [],
        exceptions: [],
        stopConditions: [],
        completionPercentage: 0,
        criticalItemsComplete: false,
        readyForGoLive: false,
      };

      checklists.set(checklist.id, checklist);
      return checklist;
    },

    // Item Management
    addItem(
      checklistId: ChecklistId,
      category: ChecklistCategory,
      title: string,
      description: string,
      severity: Severity,
      dueDate: string,
      prerequisites: readonly ChecklistItemId[] = []
    ): ChecklistItem | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const item: ChecklistItem = {
        id: generateId('item') as ChecklistItemId,
        category,
        title,
        description,
        severity,
        status: 'not_started',
        dueDate,
        completedAt: null,
        completedBy: null,
        prerequisiteIds: prerequisites,
        evidenceRefs: [],
        blockedReason: null,
        waiverApproval: null,
      };

      const updated: OperationalChecklist = {
        ...checklist,
        items: [...checklist.items, item],
        updatedAt: new Date().toISOString(),
      };
      checklists.set(checklistId, this.recalculateStatus(updated));

      return item;
    },

    completeItem(
      checklistId: ChecklistId,
      itemId: ChecklistItemId,
      completedBy: string,
      evidenceRefs: readonly `sha256:${string}`[]
    ): ChecklistItem | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const itemIndex = checklist.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return null;

      const item = checklist.items[itemIndex];

      // Check prerequisites
      for (const prereqId of item.prerequisiteIds) {
        const prereq = checklist.items.find(i => i.id === prereqId);
        if (!prereq || prereq.status !== 'completed') {
          return null; // Prerequisites not met
        }
      }

      const completed: ChecklistItem = {
        ...item,
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedBy,
        evidenceRefs,
      };

      const items = [...checklist.items];
      items[itemIndex] = completed;

      const updated: OperationalChecklist = {
        ...checklist,
        items,
        updatedAt: new Date().toISOString(),
      };
      checklists.set(checklistId, this.recalculateStatus(updated));

      return completed;
    },

    blockItem(
      checklistId: ChecklistId,
      itemId: ChecklistItemId,
      reason: string
    ): ChecklistItem | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const itemIndex = checklist.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return null;

      const blocked: ChecklistItem = {
        ...checklist.items[itemIndex],
        status: 'blocked',
        blockedReason: reason,
      };

      const items = [...checklist.items];
      items[itemIndex] = blocked;

      const updated: OperationalChecklist = {
        ...checklist,
        items,
        updatedAt: new Date().toISOString(),
      };
      checklists.set(checklistId, this.recalculateStatus(updated));

      return blocked;
    },

    waiveItem(
      checklistId: ChecklistId,
      itemId: ChecklistItemId,
      approval: string
    ): ChecklistItem | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const itemIndex = checklist.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return null;

      const item = checklist.items[itemIndex];
      if (item.severity === 'critical') return null; // Cannot waive critical items

      const waived: ChecklistItem = {
        ...item,
        status: 'waived',
        waiverApproval: approval,
      };

      const items = [...checklist.items];
      items[itemIndex] = waived;

      const updated: OperationalChecklist = {
        ...checklist,
        items,
        updatedAt: new Date().toISOString(),
      };
      checklists.set(checklistId, this.recalculateStatus(updated));

      return waived;
    },

    // Rotation Management
    addRotationRequirement(
      checklistId: ChecklistId,
      assetType: 'key' | 'certificate' | 'credential' | 'token',
      assetId: string,
      maxAgeHours: number
    ): RotationRequirement | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const item = this.addItem(
        checklistId,
        'security',
        `Rotate ${assetType}: ${assetId}`,
        `Ensure ${assetType} is rotated within ${maxAgeHours} hours`,
        'critical',
        new Date(Date.now() + maxAgeHours * 60 * 60 * 1000).toISOString()
      );
      if (!item) return null;

      const now = new Date();
      const nextRotation = new Date(now.getTime() + maxAgeHours * 60 * 60 * 1000);

      const rotation: RotationRequirement = {
        itemId: item.id,
        assetType,
        assetId,
        lastRotated: now.toISOString(),
        nextRotation: nextRotation.toISOString(),
        maxAgeHours,
        rotated: false,
      };

      const updatedChecklist = checklists.get(checklistId)!;
      const updated: OperationalChecklist = {
        ...updatedChecklist,
        rotations: [...updatedChecklist.rotations, rotation],
      };
      checklists.set(checklistId, updated);

      return rotation;
    },

    recordRotation(
      checklistId: ChecklistId,
      itemId: ChecklistItemId,
      rotatedBy: string
    ): RotationRequirement | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const rotationIndex = checklist.rotations.findIndex(r => r.itemId === itemId);
      if (rotationIndex === -1) return null;

      const rotation = checklist.rotations[rotationIndex];
      const now = new Date();
      const nextRotation = new Date(now.getTime() + rotation.maxAgeHours * 60 * 60 * 1000);

      const updated: RotationRequirement = {
        ...rotation,
        lastRotated: now.toISOString(),
        nextRotation: nextRotation.toISOString(),
        rotated: true,
      };

      const rotations = [...checklist.rotations];
      rotations[rotationIndex] = updated;

      // Also complete the item
      this.completeItem(checklistId, itemId, rotatedBy, []);

      const updatedChecklist = checklists.get(checklistId)!;
      const final: OperationalChecklist = {
        ...updatedChecklist,
        rotations,
      };
      checklists.set(checklistId, final);

      return updated;
    },

    // DR Requirements
    addDrRequirement(
      checklistId: ChecklistId,
      drType: 'failover' | 'backup_restore' | 'data_recovery' | 'site_failover',
      rtoTarget: number,
      rpoTarget: number,
      passCriteria: readonly string[]
    ): DrRequirement | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const item = this.addItem(
        checklistId,
        'infrastructure',
        `DR Test: ${drType}`,
        `Complete ${drType} test with RTO=${rtoTarget}min, RPO=${rpoTarget}min`,
        'critical',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      );
      if (!item) return null;

      const dr: DrRequirement = {
        itemId: item.id,
        drType,
        lastPassed: null,
        rtoTarget,
        rpoTarget,
        passCriteria,
        passed: false,
      };

      const updatedChecklist = checklists.get(checklistId)!;
      const updated: OperationalChecklist = {
        ...updatedChecklist,
        drRequirements: [...updatedChecklist.drRequirements, dr],
      };
      checklists.set(checklistId, updated);

      return dr;
    },

    recordDrPass(
      checklistId: ChecklistId,
      itemId: ChecklistItemId,
      completedBy: string,
      evidenceRef: `sha256:${string}`
    ): DrRequirement | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const drIndex = checklist.drRequirements.findIndex(d => d.itemId === itemId);
      if (drIndex === -1) return null;

      const updated: DrRequirement = {
        ...checklist.drRequirements[drIndex],
        lastPassed: new Date().toISOString(),
        passed: true,
      };

      const drRequirements = [...checklist.drRequirements];
      drRequirements[drIndex] = updated;

      this.completeItem(checklistId, itemId, completedBy, [evidenceRef]);

      const updatedChecklist = checklists.get(checklistId)!;
      const final: OperationalChecklist = {
        ...updatedChecklist,
        drRequirements,
      };
      checklists.set(checklistId, final);

      return updated;
    },

    // Drill Requirements
    addDrillRequirement(
      checklistId: ChecklistId,
      drillType: 'tabletop' | 'technical' | 'full_scale',
      cadenceDays: number,
      participantRoles: readonly string[]
    ): DrillRequirement | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const item = this.addItem(
        checklistId,
        'training',
        `Complete ${drillType} drill`,
        `Execute ${drillType} drill with required participants`,
        drillType === 'full_scale' ? 'critical' : 'high',
        new Date(Date.now() + cadenceDays * 24 * 60 * 60 * 1000).toISOString()
      );
      if (!item) return null;

      const drill: DrillRequirement = {
        itemId: item.id,
        drillType,
        cadenceDays,
        lastCompleted: null,
        nextDue: new Date(Date.now() + cadenceDays * 24 * 60 * 60 * 1000).toISOString(),
        participantRoles,
        completed: false,
      };

      const updatedChecklist = checklists.get(checklistId)!;
      const updated: OperationalChecklist = {
        ...updatedChecklist,
        drills: [...updatedChecklist.drills, drill],
      };
      checklists.set(checklistId, updated);

      return drill;
    },

    completeDrill(
      checklistId: ChecklistId,
      itemId: ChecklistItemId,
      completedBy: string,
      evidenceRef: `sha256:${string}`
    ): DrillRequirement | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const drillIndex = checklist.drills.findIndex(d => d.itemId === itemId);
      if (drillIndex === -1) return null;

      const drill = checklist.drills[drillIndex];
      const now = new Date();
      const nextDue = new Date(now.getTime() + drill.cadenceDays * 24 * 60 * 60 * 1000);

      const updated: DrillRequirement = {
        ...drill,
        lastCompleted: now.toISOString(),
        nextDue: nextDue.toISOString(),
        completed: true,
      };

      const drills = [...checklist.drills];
      drills[drillIndex] = updated;

      this.completeItem(checklistId, itemId, completedBy, [evidenceRef]);

      const updatedChecklist = checklists.get(checklistId)!;
      const final: OperationalChecklist = {
        ...updatedChecklist,
        drills,
      };
      checklists.set(checklistId, final);

      return updated;
    },

    // Exception Management
    raiseException(
      checklistId: ChecklistId,
      itemId: ChecklistItemId,
      description: string,
      severity: Severity,
      targetResolution: string
    ): ExceptionItem | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const exception: ExceptionItem = {
        id: generateId('exception'),
        itemId,
        description,
        raisedAt: new Date().toISOString(),
        severity,
        status: 'open',
        targetResolution,
        resolvedAt: null,
      };

      const updated: OperationalChecklist = {
        ...checklist,
        exceptions: [...checklist.exceptions, exception],
        updatedAt: new Date().toISOString(),
      };
      checklists.set(checklistId, this.recalculateStatus(updated));

      return exception;
    },

    resolveException(
      checklistId: ChecklistId,
      exceptionId: `sha256:${string}`
    ): ExceptionItem | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const excIndex = checklist.exceptions.findIndex(e => e.id === exceptionId);
      if (excIndex === -1) return null;

      const resolved: ExceptionItem = {
        ...checklist.exceptions[excIndex],
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      };

      const exceptions = [...checklist.exceptions];
      exceptions[excIndex] = resolved;

      const updated: OperationalChecklist = {
        ...checklist,
        exceptions,
        updatedAt: new Date().toISOString(),
      };
      checklists.set(checklistId, this.recalculateStatus(updated));

      return resolved;
    },

    getOpenExceptions(checklistId: ChecklistId): readonly ExceptionItem[] {
      const checklist = checklists.get(checklistId);
      if (!checklist) return [];
      return [
        ...checklist.exceptions.filter(e => e.status === 'open' || e.status === 'in_remediation'),
      ];
    },

    getCriticalOpenExceptions(checklistId: ChecklistId): readonly ExceptionItem[] {
      const checklist = checklists.get(checklistId);
      if (!checklist) return [];
      return [
        ...checklist.exceptions.filter(
          e => (e.status === 'open' || e.status === 'in_remediation') && e.severity === 'critical'
        ),
      ];
    },

    // Stop Condition Management
    addStopCondition(checklistId: ChecklistId, condition: string): StopConditionTrigger | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const trigger: StopConditionTrigger = {
        triggerId: generateId('stop'),
        condition,
        triggered: false,
        triggeredAt: null,
        reason: null,
      };

      const updated: OperationalChecklist = {
        ...checklist,
        stopConditions: [...checklist.stopConditions, trigger],
      };
      checklists.set(checklistId, updated);

      return trigger;
    },

    triggerStopCondition(
      checklistId: ChecklistId,
      triggerId: `sha256:${string}`,
      reason: string
    ): { checklist: OperationalChecklist; trigger: StopConditionTrigger } | null {
      const checklist = checklists.get(checklistId);
      if (!checklist) return null;

      const triggerIndex = checklist.stopConditions.findIndex(t => t.triggerId === triggerId);
      if (triggerIndex === -1) return null;

      const triggered: StopConditionTrigger = {
        ...checklist.stopConditions[triggerIndex],
        triggered: true,
        triggeredAt: new Date().toISOString(),
        reason,
      };

      const stopConditions = [...checklist.stopConditions];
      stopConditions[triggerIndex] = triggered;

      // Auto-pause the checklist
      const updated: OperationalChecklist = {
        ...checklist,
        status: 'paused',
        stopConditions,
        readyForGoLive: false,
        updatedAt: new Date().toISOString(),
      };
      checklists.set(checklistId, updated);

      return { checklist: updated, trigger: triggered };
    },

    // Status Calculation
    recalculateStatus(checklist: OperationalChecklist): OperationalChecklist {
      const total = checklist.items.length;
      const completed = checklist.items.filter(
        i => i.status === 'completed' || i.status === 'waived'
      ).length;
      const criticalItems = checklist.items.filter(i => i.severity === 'critical');
      const criticalComplete = criticalItems.every(i => i.status === 'completed');

      const completion = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Check all gates
      const rotationsOk = checklist.rotations.every(r => isRotationCurrent(r));
      const drOk = checklist.drRequirements.every(r => isDrPassed(r));
      const drillsOk = checklist.drills.every(d => isDrillCurrent(d));
      const noCriticalExceptions =
        checklist.exceptions.filter(
          e => (e.status === 'open' || e.status === 'in_remediation') && e.severity === 'critical'
        ).length === 0;
      const noTriggeredStops = checklist.stopConditions.every(s => !s.triggered);

      const readyForGoLive =
        criticalComplete &&
        rotationsOk &&
        drOk &&
        drillsOk &&
        noCriticalExceptions &&
        noTriggeredStops;

      let status: ChecklistStatus = checklist.status;
      // No auto-activation - explicit activateChecklist() required
      if (completion === 100 && readyForGoLive) {
        status = 'completed';
      }
      if (!noTriggeredStops && status !== 'paused') {
        status = 'paused';
      }

      return {
        ...checklist,
        completionPercentage: completion,
        criticalItemsComplete: criticalComplete,
        readyForGoLive,
        status,
      };
    },

    // Retrieval
    getChecklist(id: ChecklistId): OperationalChecklist | null {
      return checklists.get(id) ?? null;
    },

    getChecklistItems(id: ChecklistId): readonly ChecklistItem[] {
      const checklist = checklists.get(id);
      if (!checklist) return [];
      return [...checklist.items];
    },

    getItemsByCategory(id: ChecklistId, category: ChecklistCategory): readonly ChecklistItem[] {
      const checklist = checklists.get(id);
      if (!checklist) return [];
      return [...checklist.items.filter(i => i.category === category)];
    },

    getBlockedItems(id: ChecklistId): readonly ChecklistItem[] {
      const checklist = checklists.get(id);
      if (!checklist) return [];
      return [...checklist.items.filter(i => i.status === 'blocked')];
    },

    getOverdueItems(id: ChecklistId): readonly ChecklistItem[] {
      const checklist = checklists.get(id);
      if (!checklist) return [];
      const now = new Date();
      return [
        ...checklist.items.filter(
          i => i.status !== 'completed' && i.status !== 'waived' && new Date(i.dueDate) < now
        ),
      ];
    },

    activateChecklist(id: ChecklistId): OperationalChecklist | null {
      const checklist = checklists.get(id);
      if (!checklist || checklist.status !== 'draft') return null;

      const updated: OperationalChecklist = {
        ...checklist,
        status: 'active',
        updatedAt: new Date().toISOString(),
      };
      checklists.set(id, updated);
      return updated;
    },

    resumeChecklist(id: ChecklistId): OperationalChecklist | null {
      const checklist = checklists.get(id);
      if (!checklist || checklist.status !== 'paused') return null;

      // Check all stop conditions are cleared
      if (checklist.stopConditions.some(s => s.triggered)) return null;

      const updated: OperationalChecklist = {
        ...checklist,
        status: 'active',
        updatedAt: new Date().toISOString(),
      };
      checklists.set(id, this.recalculateStatus(updated));
      return checklists.get(id)!;
    },
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXIII: Operational Checklist Contracts', () => {
  let checklistService: ReturnType<typeof createMockOperationalChecklistService>;
  const agencyA = 'sha256:agency_alpha' as AgencyId;
  const cohortA = 'sha256:cohort_1' as CohortId;

  beforeEach(() => {
    checklistService = createMockOperationalChecklistService();
  });

  // ==========================================================================
  // ID Format Tests
  // ==========================================================================

  describe('ID Format Invariants', () => {
    it('should generate checklist IDs with sha256: prefix', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live Checklist');
      assert.ok(checklist.id.startsWith('sha256:'));
    });

    it('should generate item IDs with sha256: prefix', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Test');
      const item = checklistService.addItem(
        checklist.id,
        'security',
        'Test Item',
        'Description',
        'high',
        '2026-03-01'
      );
      assert.ok(item?.id.startsWith('sha256:'));
    });
  });

  // ==========================================================================
  // Checklist Lifecycle Tests
  // ==========================================================================

  describe('Checklist Lifecycle', () => {
    it('should create checklist in draft status', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      assert.strictEqual(checklist.status, 'draft');
    });

    it('should activate checklist', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      checklistService.addItem(
        checklist.id,
        'operations',
        'Item 1',
        'Desc',
        'medium',
        '2026-03-01'
      );
      const activated = checklistService.activateChecklist(checklist.id);
      assert.strictEqual(activated?.status, 'active');
    });

    it('should track completion percentage', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const item = checklistService.addItem(
        checklist.id,
        'operations',
        'Item 1',
        'Desc',
        'medium',
        '2026-03-01'
      );
      checklistService.completeItem(checklist.id, item!.id, 'operator', []);

      const updated = checklistService.getChecklist(checklist.id);
      assert.strictEqual(updated?.completionPercentage, 100);
    });
  });

  // ==========================================================================
  // Item Management Tests
  // ==========================================================================

  describe('Item Management', () => {
    it('should add items to checklist', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      checklistService.addItem(
        checklist.id,
        'security',
        'Security Review',
        'Desc',
        'critical',
        '2026-03-01'
      );
      checklistService.addItem(
        checklist.id,
        'compliance',
        'Compliance Check',
        'Desc',
        'high',
        '2026-03-01'
      );

      const items = checklistService.getChecklistItems(checklist.id);
      assert.strictEqual(items.length, 2);
    });

    it('should complete item with evidence', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const item = checklistService.addItem(
        checklist.id,
        'security',
        'Item',
        'Desc',
        'high',
        '2026-03-01'
      );

      const completed = checklistService.completeItem(checklist.id, item!.id, 'operator', [
        'sha256:evidence_1',
      ]);

      assert.strictEqual(completed?.status, 'completed');
      assert.strictEqual(completed?.evidenceRefs.length, 1);
    });

    it('should block item with reason', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const item = checklistService.addItem(
        checklist.id,
        'infrastructure',
        'Item',
        'Desc',
        'medium',
        '2026-03-01'
      );

      const blocked = checklistService.blockItem(checklist.id, item!.id, 'Waiting for vendor');
      assert.strictEqual(blocked?.status, 'blocked');
      assert.strictEqual(blocked?.blockedReason, 'Waiting for vendor');
    });

    it('should waive non-critical items', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const item = checklistService.addItem(
        checklist.id,
        'operations',
        'Item',
        'Desc',
        'low',
        '2026-03-01'
      );

      const waived = checklistService.waiveItem(checklist.id, item!.id, 'CEO approval');
      assert.strictEqual(waived?.status, 'waived');
    });

    it('should not waive critical items', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const item = checklistService.addItem(
        checklist.id,
        'security',
        'Critical Item',
        'Desc',
        'critical',
        '2026-03-01'
      );

      const waived = checklistService.waiveItem(checklist.id, item!.id, 'CEO');
      assert.strictEqual(waived, null);
    });

    it('should enforce prerequisites', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const prereq = checklistService.addItem(
        checklist.id,
        'security',
        'Prereq',
        'Desc',
        'high',
        '2026-03-01'
      );
      const dependent = checklistService.addItem(
        checklist.id,
        'security',
        'Dependent',
        'Desc',
        'high',
        '2026-03-01',
        [prereq!.id]
      );

      // Should fail - prereq not complete
      const completed = checklistService.completeItem(checklist.id, dependent!.id, 'op', []);
      assert.strictEqual(completed, null);

      // Complete prereq first
      checklistService.completeItem(checklist.id, prereq!.id, 'op', []);
      const completed2 = checklistService.completeItem(checklist.id, dependent!.id, 'op', []);
      assert.strictEqual(completed2?.status, 'completed');
    });
  });

  // ==========================================================================
  // Rotation Requirements Tests
  // ==========================================================================

  describe('Key/Cert Rotation', () => {
    it('should add rotation requirement', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const rotation = checklistService.addRotationRequirement(
        checklist.id,
        'certificate',
        'api-cert',
        720 // 30 days
      );

      assert.ok(rotation);
      assert.strictEqual(rotation.assetType, 'certificate');
    });

    it('should record rotation', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const rotation = checklistService.addRotationRequirement(checklist.id, 'key', 'api-key', 168);

      const recorded = checklistService.recordRotation(checklist.id, rotation!.itemId, 'admin');
      assert.strictEqual(recorded?.rotated, true);
    });

    it('should track rotation due dates', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const rotation = checklistService.addRotationRequirement(
        checklist.id,
        'token',
        'access-token',
        24
      );

      assert.ok(new Date(rotation!.nextRotation) > new Date());
    });
  });

  // ==========================================================================
  // DR Requirements Tests
  // ==========================================================================

  describe('DR Requirements', () => {
    it('should add DR requirement', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const dr = checklistService.addDrRequirement(
        checklist.id,
        'failover',
        15, // RTO
        5, // RPO
        ['Primary fails over', 'Data intact', 'Services restored']
      );

      assert.ok(dr);
      assert.strictEqual(dr.drType, 'failover');
      assert.strictEqual(dr.rtoTarget, 15);
    });

    it('should record DR pass', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const dr = checklistService.addDrRequirement(checklist.id, 'backup_restore', 60, 30, [
        'Backup restored',
      ]);

      const passed = checklistService.recordDrPass(
        checklist.id,
        dr!.itemId,
        'ops',
        'sha256:dr_report'
      );
      assert.strictEqual(passed?.passed, true);
      assert.ok(passed?.lastPassed);
    });
  });

  // ==========================================================================
  // Drill Requirements Tests
  // ==========================================================================

  describe('Drill Cadence', () => {
    it('should add drill requirement', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const drill = checklistService.addDrillRequirement(checklist.id, 'tabletop', 30, [
        'incident_commander',
        'security_lead',
        'ops_lead',
      ]);

      assert.ok(drill);
      assert.strictEqual(drill.drillType, 'tabletop');
    });

    it('should complete drill and schedule next', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const drill = checklistService.addDrillRequirement(checklist.id, 'technical', 14, ['sre']);

      const completed = checklistService.completeDrill(
        checklist.id,
        drill!.itemId,
        'sr_eng',
        'sha256:drill_report'
      );
      assert.strictEqual(completed?.completed, true);
      // nextDue should be approximately 14 days from now (when completed)
      const expectedNextDue = Date.now() + 14 * 24 * 60 * 60 * 1000;
      const actualNextDue = new Date(completed!.nextDue).getTime();
      // Allow 10 second tolerance for test execution time
      assert.ok(Math.abs(actualNextDue - expectedNextDue) < 10000);
    });
  });

  // ==========================================================================
  // Exception Management Tests
  // ==========================================================================

  describe('Exception Burn-Down', () => {
    it('should raise exception', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const item = checklistService.addItem(
        checklist.id,
        'security',
        'Item',
        'Desc',
        'high',
        '2026-03-01'
      );

      const exception = checklistService.raiseException(
        checklist.id,
        item!.id,
        'Configuration drift detected',
        'high',
        '2026-02-15'
      );

      assert.ok(exception);
      assert.strictEqual(exception.status, 'open');
    });

    it('should resolve exception', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const item = checklistService.addItem(
        checklist.id,
        'security',
        'Item',
        'Desc',
        'medium',
        '2026-03-01'
      );
      const exception = checklistService.raiseException(
        checklist.id,
        item!.id,
        'Issue',
        'medium',
        '2026-02-15'
      );

      const resolved = checklistService.resolveException(checklist.id, exception!.id);
      assert.strictEqual(resolved?.status, 'resolved');
      assert.ok(resolved?.resolvedAt);
    });

    it('should track open exceptions', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const item = checklistService.addItem(
        checklist.id,
        'security',
        'Item',
        'Desc',
        'high',
        '2026-03-01'
      );
      checklistService.raiseException(checklist.id, item!.id, 'Issue 1', 'high', '2026-02-15');
      checklistService.raiseException(checklist.id, item!.id, 'Issue 2', 'medium', '2026-02-15');

      const open = checklistService.getOpenExceptions(checklist.id);
      assert.strictEqual(open.length, 2);
    });

    it('should filter critical open exceptions', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const item = checklistService.addItem(
        checklist.id,
        'security',
        'Item',
        'Desc',
        'critical',
        '2026-03-01'
      );
      checklistService.raiseException(
        checklist.id,
        item!.id,
        'Critical Issue',
        'critical',
        '2026-02-15'
      );
      checklistService.raiseException(
        checklist.id,
        item!.id,
        'Medium Issue',
        'medium',
        '2026-02-15'
      );

      const critical = checklistService.getCriticalOpenExceptions(checklist.id);
      assert.strictEqual(critical.length, 1);
    });
  });

  // ==========================================================================
  // Stop Condition Tests
  // ==========================================================================

  describe('Stop Conditions', () => {
    it('should add stop condition', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const stop = checklistService.addStopCondition(checklist.id, 'MTTR > 4 hours');

      assert.ok(stop);
      assert.strictEqual(stop.triggered, false);
    });

    it('should trigger stop condition and pause checklist', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      checklistService.addItem(checklist.id, 'operations', 'Item', 'Desc', 'medium', '2026-03-01');
      const stop = checklistService.addStopCondition(checklist.id, 'Rollback failure');

      const result = checklistService.triggerStopCondition(
        checklist.id,
        stop!.triggerId,
        'Rollback failed in production'
      );

      assert.strictEqual(result?.trigger.triggered, true);
      assert.strictEqual(result?.checklist.status, 'paused');
      assert.strictEqual(result?.checklist.readyForGoLive, false);
    });

    it('should not resume with triggered stop condition', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      checklistService.addItem(checklist.id, 'operations', 'Item', 'Desc', 'medium', '2026-03-01');
      const stop = checklistService.addStopCondition(checklist.id, 'DR failure');
      checklistService.triggerStopCondition(checklist.id, stop!.triggerId, 'DR test failed');

      const resumed = checklistService.resumeChecklist(checklist.id);
      assert.strictEqual(resumed, null);
    });
  });

  // ==========================================================================
  // Go-Live Readiness Tests
  // ==========================================================================

  describe('Go-Live Readiness Gates', () => {
    it('should require critical items complete', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      checklistService.addItem(
        checklist.id,
        'security',
        'Critical Item',
        'Desc',
        'critical',
        '2026-03-01'
      );

      const current = checklistService.getChecklist(checklist.id);
      assert.strictEqual(current?.criticalItemsComplete, false);
      assert.strictEqual(current?.readyForGoLive, false);
    });

    it('should track critical items complete', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const item = checklistService.addItem(
        checklist.id,
        'security',
        'Critical Item',
        'Desc',
        'critical',
        '2026-03-01'
      );
      checklistService.completeItem(checklist.id, item!.id, 'operator', ['sha256:evidence']);

      const current = checklistService.getChecklist(checklist.id);
      assert.strictEqual(current?.criticalItemsComplete, true);
    });

    it('should not be ready with open critical exceptions', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const item = checklistService.addItem(
        checklist.id,
        'security',
        'Item',
        'Desc',
        'high',
        '2026-03-01'
      );
      checklistService.completeItem(checklist.id, item!.id, 'op', []);
      checklistService.raiseException(
        checklist.id,
        item!.id,
        'Critical issue',
        'critical',
        '2026-02-15'
      );

      const current = checklistService.getChecklist(checklist.id);
      assert.strictEqual(current?.readyForGoLive, false);
    });
  });

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('Item Queries', () => {
    it('should get items by category', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      checklistService.addItem(checklist.id, 'security', 'Sec 1', 'Desc', 'high', '2026-03-01');
      checklistService.addItem(checklist.id, 'security', 'Sec 2', 'Desc', 'medium', '2026-03-01');
      checklistService.addItem(checklist.id, 'operations', 'Ops 1', 'Desc', 'low', '2026-03-01');

      const security = checklistService.getItemsByCategory(checklist.id, 'security');
      assert.strictEqual(security.length, 2);
    });

    it('should get blocked items', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const item1 = checklistService.addItem(
        checklist.id,
        'infrastructure',
        'Item 1',
        'Desc',
        'medium',
        '2026-03-01'
      );
      checklistService.addItem(
        checklist.id,
        'infrastructure',
        'Item 2',
        'Desc',
        'medium',
        '2026-03-01'
      );
      checklistService.blockItem(checklist.id, item1!.id, 'Waiting');

      const blocked = checklistService.getBlockedItems(checklist.id);
      assert.strictEqual(blocked.length, 1);
    });

    it('should get overdue items', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      checklistService.addItem(
        checklist.id,
        'operations',
        'Overdue',
        'Desc',
        'medium',
        '2020-01-01'
      );

      const overdue = checklistService.getOverdueItems(checklist.id);
      assert.strictEqual(overdue.length, 1);
    });
  });

  // ==========================================================================
  // Read-Only Invariants
  // ==========================================================================

  describe('Read-Only Invariants', () => {
    it('should return copies of items', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      checklistService.addItem(checklist.id, 'operations', 'Item', 'Desc', 'medium', '2026-03-01');

      const items1 = checklistService.getChecklistItems(checklist.id);
      const items2 = checklistService.getChecklistItems(checklist.id);
      assert.ok(items1 !== items2);
    });

    it('should return copies of exceptions', () => {
      const checklist = checklistService.createChecklist(agencyA, cohortA, 'Go-Live');
      const item = checklistService.addItem(
        checklist.id,
        'security',
        'Item',
        'Desc',
        'high',
        '2026-03-01'
      );
      checklistService.raiseException(checklist.id, item!.id, 'Issue', 'medium', '2026-02-15');

      const exc1 = checklistService.getOpenExceptions(checklist.id);
      const exc2 = checklistService.getOpenExceptions(checklist.id);
      assert.ok(exc1 !== exc2);
    });
  });
});
