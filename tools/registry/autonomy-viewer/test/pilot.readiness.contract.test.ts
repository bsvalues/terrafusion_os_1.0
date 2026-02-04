/**
 * Phase XXIV-A — Pilot Readiness Contract Tests
 * ==============================================
 * Executable specification for pilot documentation completeness.
 *
 * These tests validate that:
 * 1. Pilot selection doc contains all required sections
 * 2. War room cadence doc contains all required sections
 * 3. Exit criteria doc contains all required sections
 * 4. Constants align with stop-condition contract tests
 * 5. All ID references use sha256: prefix (PII-clean)
 * 6. Dual-approval requirements are documented
 * 7. KPI thresholds are present and valid
 *
 * Docs:
 *   - docs/ops/PILOT_WAVE_0_SELECTION.md
 *   - docs/ops/WAR_ROOM_CADENCE.md
 *   - docs/ops/PILOT_EXIT_CRITERIA.md
 */

import * as assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Constants (Must align with stop-condition contract tests)
// ============================================================================

const REQUIRED_APPROVALS = 2;
const MAX_PAUSE_LATENCY_MS = 5000;
const STOP_CONDITION_CODES = [
  'MTTR_REGRESSION',
  'ROLLBACK_FAILURE',
  'DR_DRILL_FAILURE',
  'AUDIT_INTEGRITY_ALERT',
];

// KPI Thresholds
const KPI_THRESHOLDS = {
  kpiWindowDays: 14,
  mttrMinutes: 30,
  rollbackSuccessPercent: 95,
  availabilityPercent: 99.5,
  drFreshnessDays: 90,
  incidentResponseMinutes: 15,
};

// ============================================================================
// Document Paths
// ============================================================================

function getDocsPath(): string {
  // Navigate from test file to docs/ops
  return join(__dirname, '..', '..', '..', '..', 'docs', 'ops');
}

function readDocIfExists(filename: string): string | null {
  const docsPath = getDocsPath();
  const filePath = join(docsPath, filename);
  if (!existsSync(filePath)) {
    return null;
  }
  return readFileSync(filePath, 'utf-8');
}

// ============================================================================
// Section Detection Helpers
// ============================================================================

function hasSection(content: string, sectionPattern: RegExp): boolean {
  return sectionPattern.test(content);
}

function hasSha256Refs(content: string): boolean {
  // Check if doc contains sha256: references
  return /sha256:[a-zA-Z0-9_]+/.test(content);
}

function extractSha256Refs(content: string): string[] {
  const matches = content.match(/sha256:[a-zA-Z0-9_]+/g);
  return matches ?? [];
}

function countTableRows(content: string, tableHeaderPattern: RegExp): number {
  const lines = content.split('\n');
  let inTable = false;
  let rowCount = 0;

  for (const line of lines) {
    if (tableHeaderPattern.test(line)) {
      inTable = true;
      continue;
    }
    if (inTable) {
      if (line.trim().startsWith('|') && !line.includes('---')) {
        rowCount++;
      } else if (line.trim() === '' || !line.trim().startsWith('|')) {
        inTable = false;
      }
    }
  }

  return rowCount;
}

// ============================================================================
// Mock Service for Pilot Readiness Validation
// ============================================================================

interface PilotSelection {
  agencyId: `sha256:${string}` | null;
  services: readonly { id: `sha256:${string}`; name: string }[];
  operators: readonly { id: `sha256:${string}`; role: string; certId: `sha256:${string}` | null }[];
  approvers: readonly { id: `sha256:${string}`; role: string }[];
  hasBlackoutWindows: boolean;
  hasPreconditionsChecklist: boolean;
}

interface WarRoomCadence {
  hasDailyAgenda: boolean;
  hasDashboardList: boolean;
  hasExceptionBurnDown: boolean;
  hasStopConditionWatch: boolean;
  hasDecisionLogTemplate: boolean;
  hasEvidenceCaptureChecklist: boolean;
  stopConditionCodesDocumented: readonly string[];
}

interface ExitCriteria {
  kpiWindowDays: number | null;
  mttrThreshold: number | null;
  rollbackThreshold: number | null;
  availabilityThreshold: number | null;
  drFreshnessThreshold: number | null;
  hasExceptionPolicy: boolean;
  hasDualApprovalBlock: boolean;
  requiredApprovals: number | null;
  hasGateSummary: boolean;
  gateCount: number;
}

function parsePilotSelection(content: string): PilotSelection {
  const agencyMatch = content.match(/Agency ID[^|]*\|[^`]*`(sha256:[^`]+)`/);
  const agencyId = agencyMatch ? (agencyMatch[1] as `sha256:${string}`) : null;

  // Count service rows in Selected Services table
  const serviceCount = countTableRows(content, /\| # \| Service ID/);
  const services: { id: `sha256:${string}`; name: string }[] = [];
  for (let i = 0; i < Math.min(serviceCount, 3); i++) {
    services.push({ id: `sha256:svc_placeholder_${i}`, name: `Service ${i + 1}` });
  }

  // Count operator rows
  const operatorCount = countTableRows(content, /\| # \| Operator ID/);
  const operators: { id: `sha256:${string}`; role: string; certId: `sha256:${string}` | null }[] =
    [];
  for (let i = 0; i < operatorCount; i++) {
    operators.push({
      id: `sha256:op_placeholder_${i}`,
      role: i === 0 ? 'Primary Operator' : 'Backup Operator',
      certId: `sha256:cert_placeholder_${i}`,
    });
  }

  // Count approver rows
  const approverCount = countTableRows(content, /\| # \| Approver ID/);
  const approvers: { id: `sha256:${string}`; role: string }[] = [];
  for (let i = 0; i < approverCount; i++) {
    approvers.push({
      id: `sha256:appr_placeholder_${i}`,
      role: i === 0 ? 'Incident Commander' : 'Security Lead',
    });
  }

  const hasBlackoutWindows = hasSection(content, /## 5\. Blackout Windows/);
  const hasPreconditionsChecklist = hasSection(content, /## 6\. Preconditions Checklist/);

  return {
    agencyId,
    services,
    operators,
    approvers,
    hasBlackoutWindows,
    hasPreconditionsChecklist,
  };
}

function parseWarRoomCadence(content: string): WarRoomCadence {
  const hasDailyAgenda = hasSection(content, /## 2\. Daily Agenda/);
  const hasDashboardList =
    hasSection(content, /## 3\. Dashboard Reference/) ||
    hasSection(content, /### 3\.1 Primary Dashboards/);
  const hasExceptionBurnDown =
    hasSection(content, /### 2\.3 Exception Ledger Review/) ||
    content.includes('Burn-Down Template');
  const hasStopConditionWatch = hasSection(content, /### 2\.4 Stop-Condition Watch/);
  const hasDecisionLogTemplate = hasSection(content, /### 2\.6 Decision Log/);
  const hasEvidenceCaptureChecklist = hasSection(content, /## 6\. Evidence Capture Checklist/);

  // Extract stop condition codes mentioned
  const stopConditionCodesDocumented = STOP_CONDITION_CODES.filter(code => content.includes(code));

  return {
    hasDailyAgenda,
    hasDashboardList,
    hasExceptionBurnDown,
    hasStopConditionWatch,
    hasDecisionLogTemplate,
    hasEvidenceCaptureChecklist,
    stopConditionCodesDocumented,
  };
}

function parseExitCriteria(content: string): ExitCriteria {
  // Extract KPI window
  const kpiWindowMatch = content.match(/Duration[^|]*\|[^*]*\*\*(\d+) days\*\*/);
  const kpiWindowDays = kpiWindowMatch ? parseInt(kpiWindowMatch[1], 10) : null;

  // Extract MTTR threshold
  const mttrMatch = content.match(/MTTR[^|]*\|[^≤]*≤[^*]*\*\*(\d+) minutes?\*\*/);
  const mttrThreshold = mttrMatch ? parseInt(mttrMatch[1], 10) : null;

  // Extract rollback threshold
  const rollbackMatch = content.match(/Rollback Success Rate[^|]*\|[^≥]*≥[^*]*\*\*(\d+)%\*\*/);
  const rollbackThreshold = rollbackMatch ? parseInt(rollbackMatch[1], 10) : null;

  // Extract availability threshold
  const availMatch = content.match(/Service Availability[^|]*\|[^≥]*≥[^*]*\*\*(\d+\.?\d*)%\*\*/);
  const availabilityThreshold = availMatch ? parseFloat(availMatch[1]) : null;

  // Extract DR freshness threshold
  const drMatch = content.match(/Last DR drill[^|]*\|[^≤]*≤[^*]*\*\*(\d+) days\*\*/);
  const drFreshnessThreshold = drMatch ? parseInt(drMatch[1], 10) : null;

  const hasExceptionPolicy = hasSection(content, /## 3\. Exception Policy/);
  const hasDualApprovalBlock =
    hasSection(content, /### 9\.2 Dual-Approval Block/) ||
    content.includes('REQUIRED_APPROVALS = 2');

  // Extract required approvals
  const approvalsMatch = content.match(/REQUIRED_APPROVALS\s*=\s*(\d+)/);
  const requiredApprovals = approvalsMatch ? parseInt(approvalsMatch[1], 10) : null;

  const hasGateSummary = hasSection(content, /## 8\. Exit Gate Summary/);

  // Count gates in summary
  const gateCount = countTableRows(content, /\| # \| Gate \|/);

  return {
    kpiWindowDays,
    mttrThreshold,
    rollbackThreshold,
    availabilityThreshold,
    drFreshnessThreshold,
    hasExceptionPolicy,
    hasDualApprovalBlock,
    requiredApprovals,
    hasGateSummary,
    gateCount,
  };
}

// ============================================================================
// Contract Tests
// ============================================================================

describe('Phase XXIV-A: Pilot Readiness Document Contracts', () => {
  let pilotSelectionContent: string | null;
  let warRoomContent: string | null;
  let exitCriteriaContent: string | null;

  beforeEach(() => {
    pilotSelectionContent = readDocIfExists('PILOT_WAVE_0_SELECTION.md');
    warRoomContent = readDocIfExists('WAR_ROOM_CADENCE.md');
    exitCriteriaContent = readDocIfExists('PILOT_EXIT_CRITERIA.md');
  });

  // ==========================================================================
  // Document Existence
  // ==========================================================================

  describe('Document Existence', () => {
    it('should have PILOT_WAVE_0_SELECTION.md', () => {
      assert.ok(pilotSelectionContent !== null, 'PILOT_WAVE_0_SELECTION.md must exist');
    });

    it('should have WAR_ROOM_CADENCE.md', () => {
      assert.ok(warRoomContent !== null, 'WAR_ROOM_CADENCE.md must exist');
    });

    it('should have PILOT_EXIT_CRITERIA.md', () => {
      assert.ok(exitCriteriaContent !== null, 'PILOT_EXIT_CRITERIA.md must exist');
    });
  });

  // ==========================================================================
  // Pilot Selection Document Structure
  // ==========================================================================

  describe('Pilot Selection Document Structure', () => {
    it('should have Pilot Scope section', () => {
      assert.ok(pilotSelectionContent);
      assert.ok(hasSection(pilotSelectionContent, /## 1\. Pilot Scope/));
    });

    it('should have Operator Roster section', () => {
      assert.ok(pilotSelectionContent);
      assert.ok(hasSection(pilotSelectionContent, /## 2\. Operator Roster/));
    });

    it('should have Approvers section with dual-approval', () => {
      assert.ok(pilotSelectionContent);
      assert.ok(hasSection(pilotSelectionContent, /## 3\. Approvers \(Dual-Approval\)/));
    });

    it('should have Escalation Bridge section', () => {
      assert.ok(pilotSelectionContent);
      assert.ok(hasSection(pilotSelectionContent, /## 4\. Escalation Bridge/));
    });

    it('should have Blackout Windows section', () => {
      assert.ok(pilotSelectionContent);
      const parsed = parsePilotSelection(pilotSelectionContent);
      assert.ok(parsed.hasBlackoutWindows);
    });

    it('should have Preconditions Checklist section', () => {
      assert.ok(pilotSelectionContent);
      const parsed = parsePilotSelection(pilotSelectionContent);
      assert.ok(parsed.hasPreconditionsChecklist);
    });

    it('should have Go-Live Authorization section', () => {
      assert.ok(pilotSelectionContent);
      assert.ok(hasSection(pilotSelectionContent, /## 7\. Go-Live Authorization/));
    });

    it('should use sha256: references for IDs', () => {
      assert.ok(pilotSelectionContent);
      const refs = extractSha256Refs(pilotSelectionContent);
      assert.ok(refs.length > 0, 'Should contain sha256: references');
    });

    it('should define at least 2 approvers', () => {
      assert.ok(pilotSelectionContent);
      const parsed = parsePilotSelection(pilotSelectionContent);
      assert.ok(parsed.approvers.length >= REQUIRED_APPROVALS);
    });
  });

  // ==========================================================================
  // War Room Cadence Document Structure
  // ==========================================================================

  describe('War Room Cadence Document Structure', () => {
    it('should have Meeting Structure section', () => {
      assert.ok(warRoomContent);
      assert.ok(hasSection(warRoomContent, /## 1\. Meeting Structure/));
    });

    it('should have Daily Agenda section', () => {
      assert.ok(warRoomContent);
      const parsed = parseWarRoomCadence(warRoomContent);
      assert.ok(parsed.hasDailyAgenda);
    });

    it('should have Dashboard Reference section', () => {
      assert.ok(warRoomContent);
      const parsed = parseWarRoomCadence(warRoomContent);
      assert.ok(parsed.hasDashboardList);
    });

    it('should have Exception Burn-Down template', () => {
      assert.ok(warRoomContent);
      const parsed = parseWarRoomCadence(warRoomContent);
      assert.ok(parsed.hasExceptionBurnDown);
    });

    it('should have Stop-Condition Watch section', () => {
      assert.ok(warRoomContent);
      const parsed = parseWarRoomCadence(warRoomContent);
      assert.ok(parsed.hasStopConditionWatch);
    });

    it('should have Decision Log template', () => {
      assert.ok(warRoomContent);
      const parsed = parseWarRoomCadence(warRoomContent);
      assert.ok(parsed.hasDecisionLogTemplate);
    });

    it('should have Evidence Capture Checklist', () => {
      assert.ok(warRoomContent);
      const parsed = parseWarRoomCadence(warRoomContent);
      assert.ok(parsed.hasEvidenceCaptureChecklist);
    });

    it('should document all stop condition codes', () => {
      assert.ok(warRoomContent);
      const parsed = parseWarRoomCadence(warRoomContent);
      assert.deepStrictEqual(
        [...parsed.stopConditionCodesDocumented].sort(),
        [...STOP_CONDITION_CODES].sort(),
        'All stop condition codes must be documented'
      );
    });

    it('should reference MAX_PAUSE_LATENCY_MS constant', () => {
      assert.ok(warRoomContent);
      assert.ok(
        warRoomContent.includes('5000') || warRoomContent.includes('5 seconds'),
        'Should reference max pause latency'
      );
    });

    it('should reference REQUIRED_APPROVALS constant', () => {
      assert.ok(warRoomContent);
      assert.ok(
        warRoomContent.includes('REQUIRED_APPROVALS=2') ||
          warRoomContent.includes('REQUIRED_APPROVALS = 2') ||
          warRoomContent.includes('2 distinct approvers'),
        'Should reference required approvals'
      );
    });
  });

  // ==========================================================================
  // Exit Criteria Document Structure
  // ==========================================================================

  describe('Exit Criteria Document Structure', () => {
    it('should have KPI Window Definition section', () => {
      assert.ok(exitCriteriaContent);
      assert.ok(hasSection(exitCriteriaContent, /## 2\. KPI Window Definition/));
    });

    it('should define KPI window duration', () => {
      assert.ok(exitCriteriaContent);
      const parsed = parseExitCriteria(exitCriteriaContent);
      assert.ok(parsed.kpiWindowDays !== null);
      assert.strictEqual(parsed.kpiWindowDays, KPI_THRESHOLDS.kpiWindowDays);
    });

    it('should define MTTR threshold', () => {
      assert.ok(exitCriteriaContent);
      const parsed = parseExitCriteria(exitCriteriaContent);
      assert.ok(parsed.mttrThreshold !== null);
      assert.strictEqual(parsed.mttrThreshold, KPI_THRESHOLDS.mttrMinutes);
    });

    it('should define rollback success threshold', () => {
      assert.ok(exitCriteriaContent);
      const parsed = parseExitCriteria(exitCriteriaContent);
      assert.ok(parsed.rollbackThreshold !== null);
      assert.strictEqual(parsed.rollbackThreshold, KPI_THRESHOLDS.rollbackSuccessPercent);
    });

    it('should define availability threshold', () => {
      assert.ok(exitCriteriaContent);
      const parsed = parseExitCriteria(exitCriteriaContent);
      assert.ok(parsed.availabilityThreshold !== null);
      assert.strictEqual(parsed.availabilityThreshold, KPI_THRESHOLDS.availabilityPercent);
    });

    it('should define DR freshness threshold', () => {
      assert.ok(exitCriteriaContent);
      const parsed = parseExitCriteria(exitCriteriaContent);
      assert.ok(parsed.drFreshnessThreshold !== null);
      assert.strictEqual(parsed.drFreshnessThreshold, KPI_THRESHOLDS.drFreshnessDays);
    });

    it('should have Exception Policy section', () => {
      assert.ok(exitCriteriaContent);
      const parsed = parseExitCriteria(exitCriteriaContent);
      assert.ok(parsed.hasExceptionPolicy);
    });

    it('should have DR & Game-Day section', () => {
      assert.ok(exitCriteriaContent);
      assert.ok(hasSection(exitCriteriaContent, /## 4\. DR & Game-Day Freshness/));
    });

    it('should have Audit Packet section', () => {
      assert.ok(exitCriteriaContent);
      assert.ok(hasSection(exitCriteriaContent, /## 5\. Audit Packet & Narrative/));
    });

    it('should have Training & Certification section', () => {
      assert.ok(exitCriteriaContent);
      assert.ok(hasSection(exitCriteriaContent, /## 6\. Training & Certification/));
    });

    it('should have Exit Gate Summary section', () => {
      assert.ok(exitCriteriaContent);
      const parsed = parseExitCriteria(exitCriteriaContent);
      assert.ok(parsed.hasGateSummary);
    });

    it('should have Dual-Approval Block for exit decision', () => {
      assert.ok(exitCriteriaContent);
      const parsed = parseExitCriteria(exitCriteriaContent);
      assert.ok(parsed.hasDualApprovalBlock);
    });

    it('should require 2 approvals for exit decision', () => {
      assert.ok(exitCriteriaContent);
      const parsed = parseExitCriteria(exitCriteriaContent);
      assert.strictEqual(parsed.requiredApprovals, REQUIRED_APPROVALS);
    });

    it('should have at least 10 exit gates', () => {
      assert.ok(exitCriteriaContent);
      const parsed = parseExitCriteria(exitCriteriaContent);
      assert.ok(parsed.gateCount >= 10, `Expected at least 10 gates, found ${parsed.gateCount}`);
    });
  });

  // ==========================================================================
  // Cross-Document Consistency
  // ==========================================================================

  describe('Cross-Document Consistency', () => {
    it('all docs should use sha256: ID format', () => {
      assert.ok(pilotSelectionContent);
      assert.ok(warRoomContent);
      assert.ok(exitCriteriaContent);

      assert.ok(hasSha256Refs(pilotSelectionContent));
      assert.ok(hasSha256Refs(warRoomContent));
      assert.ok(hasSha256Refs(exitCriteriaContent));
    });

    it('all docs should cross-reference each other', () => {
      assert.ok(pilotSelectionContent);
      assert.ok(warRoomContent);
      assert.ok(exitCriteriaContent);

      // Pilot selection references others
      assert.ok(pilotSelectionContent.includes('WAR_ROOM_CADENCE.md'));
      assert.ok(pilotSelectionContent.includes('PILOT_EXIT_CRITERIA.md'));

      // War room references others
      assert.ok(warRoomContent.includes('PILOT_WAVE_0_SELECTION.md'));
      assert.ok(warRoomContent.includes('PILOT_EXIT_CRITERIA.md'));

      // Exit criteria references others
      assert.ok(exitCriteriaContent.includes('PILOT_WAVE_0_SELECTION.md'));
      assert.ok(exitCriteriaContent.includes('WAR_ROOM_CADENCE.md'));
    });

    it('all docs should reference stop-condition runbook', () => {
      assert.ok(pilotSelectionContent);
      assert.ok(warRoomContent);
      assert.ok(exitCriteriaContent);

      assert.ok(pilotSelectionContent.includes('STOP_CONDITION_REHEARSAL_RUNBOOK.md'));
      assert.ok(warRoomContent.includes('STOP_CONDITION_REHEARSAL_RUNBOOK.md'));
      assert.ok(exitCriteriaContent.includes('STOP_CONDITION_REHEARSAL_RUNBOOK.md'));
    });

    it('all docs should reference contract test file', () => {
      assert.ok(pilotSelectionContent);
      assert.ok(warRoomContent);
      assert.ok(exitCriteriaContent);

      assert.ok(pilotSelectionContent.includes('pilot.readiness.contract.test.ts'));
      assert.ok(warRoomContent.includes('pilot.readiness.contract.test.ts'));
      assert.ok(exitCriteriaContent.includes('pilot.readiness.contract.test.ts'));
    });
  });

  // ==========================================================================
  // Constant Alignment
  // ==========================================================================

  describe('Constant Alignment with Stop-Condition Tests', () => {
    it('should align REQUIRED_APPROVALS across all docs', () => {
      assert.ok(pilotSelectionContent);
      assert.ok(warRoomContent);
      assert.ok(exitCriteriaContent);

      // Check all docs mention the constant
      const allDocs = pilotSelectionContent + warRoomContent + exitCriteriaContent;
      const matches = allDocs.match(/REQUIRED_APPROVALS\s*=\s*(\d+)/g) ?? [];

      for (const match of matches) {
        const value = parseInt(match.replace(/\D/g, ''), 10);
        assert.strictEqual(value, REQUIRED_APPROVALS);
      }
    });

    it('should reference correct max pause latency', () => {
      assert.ok(warRoomContent);
      // Either mentions 5000ms or 5 seconds
      const mentionsPauseLatency =
        warRoomContent.includes('5000') ||
        warRoomContent.includes('5 seconds') ||
        warRoomContent.includes('< 5 seconds');
      assert.ok(mentionsPauseLatency);
    });
  });

  // ==========================================================================
  // PII-Clean Validation
  // ==========================================================================

  describe('PII-Clean Validation', () => {
    it('pilot selection should not contain obvious PII patterns', () => {
      assert.ok(pilotSelectionContent);
      // Check for email patterns
      const hasEmail = /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(pilotSelectionContent);
      assert.ok(!hasEmail, 'Should not contain email addresses');
    });

    it('war room doc should not contain obvious PII patterns', () => {
      assert.ok(warRoomContent);
      const hasEmail = /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(warRoomContent);
      assert.ok(!hasEmail, 'Should not contain email addresses');
    });

    it('exit criteria should not contain obvious PII patterns', () => {
      assert.ok(exitCriteriaContent);
      const hasEmail = /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(exitCriteriaContent);
      assert.ok(!hasEmail, 'Should not contain email addresses');
    });
  });
});
