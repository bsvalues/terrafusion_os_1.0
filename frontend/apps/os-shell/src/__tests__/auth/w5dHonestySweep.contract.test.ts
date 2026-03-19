/**
 * W5D — Honesty Sweep Contract Tests
 *
 * Static source-file inspection (no rendering, no mocking).
 * Verifies provenance disclosure for governed hot paths:
 *   - useTodaysWork exposes isSampleData flag
 *   - useBudgetData exposes isSampleData flag
 *   - CostManual renders DemoDataBanner for SAMPLE data
 *   - BatchCostRun renders DemoDataBanner + BACKEND_APPLY_CAPABLE gate
 *   - Sealed wave regression (W4A, W4B, W5B, W5C)
 */

import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const SRC_ROOT = path.resolve(__dirname, '../..');

function readSrc(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), 'utf-8');
}

// ============================================================================
// Gate 1 — useTodaysWork: API-first with fallback provenance
// ============================================================================

describe('Gate 1 — useTodaysWork exposes fallback provenance', () => {
  const src = readSrc('hooks/useTodaysWork.ts');

  it('returns isSampleData field', () => {
    expect(src).toContain('isSampleData');
  });

  it('defines SAMPLE_TASKS constant for bounded fallback', () => {
    expect(src).toContain('SAMPLE_TASKS');
  });

  it('reads live queue tasks before falling back', () => {
    expect(src).toContain("import { getQueueItems } from '../services/suites/queueService'");
    expect(src).toContain('getQueueItems({ throwOnError: true })');
  });

  it('returns tasks, loading, and isSampleData in hook signature', () => {
    expect(src).toContain('tasks:');
    expect(src).toContain('loading:');
    expect(src).toContain('isSampleData:');
  });

  it('tracks both live and fallback provenance states', () => {
    expect(src).toContain('setIsSampleData(false)');
    expect(src).toContain('setIsSampleData(true)');
  });
});

// ============================================================================
// Gate 2 — useBudgetData: API-first with fallback provenance
// ============================================================================

describe('Gate 2 — useBudgetData exposes fallback provenance', () => {
  const src = readSrc('applications/terra-levy/hooks/useBudgetData.ts');

  it('returns isSampleData field', () => {
    expect(src).toContain('isSampleData');
  });

  it('uses the governed API client for levy budget reads', () => {
    expect(src).toMatch(/import\s+api\s+from\s+['"]@\/services\/api['"]/);
    expect(src).toContain('/levy/dashboard/summary');
    expect(src).toContain('/levy/budget/scenarios');
    expect(src).toContain('/levy/budget/visualization');
  });

  it('tracks both live and fallback provenance states', () => {
    expect(src).toContain('setIsSampleData(false)');
    expect(src).toContain('setIsSampleData(true)');
  });

  it('refreshData and updateBudgetCategory remain exposed to consumers', () => {
    expect(src).toContain('refreshData');
    expect(src).toContain('updateBudgetCategory');
  });
});

// ============================================================================
// Gate 3 — CostManual: DemoDataBanner with SAMPLE data
// ============================================================================

describe('Gate 3 — CostManual renders DemoDataBanner for sample data', () => {
  const src = readSrc('pages/forge/cost/CostManual.tsx');

  it('imports DemoDataBanner from governance', () => {
    expect(src).toContain('DemoDataBanner');
    expect(src).toMatch(/from\s+['"]@\/components\/governance\/DemoDataBanner['"]/);
  });

  it('renders DemoDataBanner with module="Cost Manual"', () => {
    expect(src).toContain('module="Cost Manual"');
  });

  it('uses SAMPLE_COST_SCHEDULES (not named as live data)', () => {
    expect(src).toContain('SAMPLE_COST_SCHEDULES');
  });

  it('is API-first with explicit sample fallback', () => {
    expect(src).toContain('getCostSchedule');
    expect(src).toContain('setIsSampleData(true)');
    expect(src).toContain('setIsSampleData(false)');
  });
});

// ============================================================================
// Gate 4 — BatchCostRun: DemoDataBanner + BACKEND_APPLY_CAPABLE gate
// ============================================================================

describe('Gate 4 — BatchCostRun: disclosure + apply-capability gating', () => {
  const src = readSrc('pages/forge/batch/BatchCostRun.tsx');

  it('imports DemoDataBanner from governance', () => {
    expect(src).toContain('DemoDataBanner');
    expect(src).toMatch(/from\s+['"]@\/components\/governance\/DemoDataBanner['"]/);
  });

  it('renders DemoDataBanner with module="Batch Cost Run"', () => {
    expect(src).toContain('module="Batch Cost Run"');
  });

  it('defines BACKEND_APPLY_CAPABLE gate constant', () => {
    expect(src).toContain('BACKEND_APPLY_CAPABLE');
  });

  it('defines ForgeApplyMode type with all three states', () => {
    expect(src).toContain("'preview_only'");
    expect(src).toContain("'apply_pending_backend'");
    expect(src).toContain("'apply_executed'");
  });

  it('gates apply execution on BACKEND_APPLY_CAPABLE', () => {
    expect(src).toContain('BACKEND_APPLY_CAPABLE');
    expect(src).toContain('apply_pending_backend');
  });

  it('shows apply_pending_backend mode when backend not available', () => {
    expect(src).toContain('apply_pending_backend');
    expect(src).toContain('apply_blocked');
  });

  it('emits audit events for all apply mode transitions', () => {
    expect(src).toContain('emitAuditEvent');
    // At least 3 calls: preview_generated, apply_executed, apply_blocked
    const auditCalls = src.match(/emitAuditEvent\(/g);
    expect(auditCalls).not.toBeNull();
    expect(auditCalls!.length).toBeGreaterThanOrEqual(3);
  });

  it('uses FIXTURE_HISTORY (not named as live data)', () => {
    expect(src).toContain('FIXTURE_HISTORY');
  });

  it('emits canonical TerraTrace events for preview/apply lifecycle', () => {
    expect(src).toContain('emitToolInvoked');
    expect(src).toContain('emitToolSucceeded');
    expect(src).toContain('emitToolFailed');
  });

  it('has batch-apply-mode test id for apply state visibility', () => {
    expect(src).toContain('data-testid="batch-apply-mode"');
  });

  it('displays honest mode text for each apply state', () => {
    expect(src).toContain('Mode: Preview Only');
    expect(src).toContain('Mode: Apply Blocked');
    expect(src).toContain('Mode: Applied');
  });
});

// ============================================================================
// Gate 5 — Sealed wave regression (W4A, W4B, W5B, W5C)
// ============================================================================

describe('Gate 5 — sealed wave regression', () => {
  it('statisticsAPI still exports discoverSegments (W4B)', () => {
    const src = readSrc('services/forge/statisticsAPI.ts');
    expect(src).toContain('discoverSegments');
  });

  it('regressionAPI still exports getHistory (W4A)', () => {
    const src = readSrc('services/forge/regressionAPI.ts');
    expect(src).toContain('getHistory');
  });

  it('SegmentDiscoveryDashboard still has DemoDataBanner (W4B)', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toContain('isFixture');
  });

  it('GeoEquityDashboard still has DemoDataBanner (W5B)', () => {
    const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');
    expect(src).toContain('DemoDataBanner');
    expect(src).toContain('isFixture');
  });

  it('queueService has throwOnError option (W5C)', () => {
    const src = readSrc('services/suites/queueService.ts');
    expect(src).toContain('throwOnError');
    expect(src).toContain('QueueReadOptions');
  });

  it('ManagementDashboard passes throwOnError: true (W5C)', () => {
    const src = readSrc('pages/dais/ManagementDashboard.tsx');
    expect(src).toContain('throwOnError: true');
  });
});
