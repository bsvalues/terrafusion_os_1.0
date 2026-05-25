/**
 * W5D — Honesty Sweep Contract Tests
 *
 * Static source-file inspection (no rendering, no mocking).
 * Verifies provenance disclosure for governed hot paths:
 *   - useTodaysWork exposes explicit live/unavailable read state
 *   - useBudgetData exposes an explicit live-data gap instead of sample fallback
 *   - CostManual renders governed live/unavailable states instead of fixture fallback
 *   - BatchCostRun renders live API provenance without fixture fallback
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
// Gate 1 — useTodaysWork: API-first with explicit unavailable state
// ============================================================================

describe('Gate 1 — useTodaysWork exposes explicit unavailable state', () => {
  const src = readSrc('hooks/useTodaysWork.ts');

  it('does not expose sample fallback state', () => {
    expect(src).not.toContain('isSampleData');
    expect(src).not.toContain('SAMPLE_TASKS');
  });

  it('reads live queue tasks from queueService', () => {
    expect(src).toContain("import { getQueueItems } from '../services/suites/queueService'");
    expect(src).toContain('getQueueItems({ throwOnError: true })');
  });

  it('returns tasks, loading, error, and readState in hook signature', () => {
    expect(src).toContain('tasks:');
    expect(src).toContain('loading:');
    expect(src).toContain('error:');
    expect(src).toContain('readState:');
  });

  it('tracks live and unavailable read states', () => {
    expect(src).toContain("setReadState('live')");
    expect(src).toContain("setReadState('unavailable')");
  });
});

// ============================================================================
// Gate 2 — useBudgetData: API-first with explicit live-data gap
// ============================================================================

describe('Gate 2 — useBudgetData exposes governed unavailable state', () => {
  const src = readSrc('applications/terra-levy/hooks/useBudgetData.ts');

  it('does not expose sample fallback state', () => {
    expect(src).not.toContain('isSampleData');
  });

  it('uses the governed API client for levy budget reads', () => {
    expect(src).toMatch(/import\s+api\s+from\s+['"]@\/services\/api['"]/);
    expect(src).toContain('/levy/dashboard/summary');
    expect(src).toContain('/levy/budget/scenarios');
    expect(src).toContain('/levy/budget/visualization');
  });

  it('returns an explicit live-data gap when no certified categories exist', () => {
    expect(src).toContain('Live levy budget endpoints returned no certified budget-category data.');
  });

  it('refreshData and updateBudgetCategory remain exposed to consumers', () => {
    expect(src).toContain('refreshData');
    expect(src).toContain('updateBudgetCategory');
  });
});

// ============================================================================
// Gate 3 — CostManual: live schedule path with explicit unavailable state
// ============================================================================

describe('Gate 3 — CostManual renders governed live/unavailable state', () => {
  const src = readSrc('pages/forge/cost/CostManual.tsx');

  it('does not import DemoDataBanner or define SAMPLE fixtures', () => {
    expect(src).not.toContain('DemoDataBanner');
    expect(src).not.toContain('SAMPLE_COST_SCHEDULES');
  });

  it('tracks explicit loading/live/unavailable read states', () => {
    expect(src).toContain("type CostManualReadState = 'loading' | 'live' | 'unavailable'");
    expect(src).toContain("setReadState('loading')");
    expect(src).toContain("setReadState('live')");
    expect(src).toContain("setReadState('unavailable')");
  });

  it('declares a governed unavailable state instead of sample replacement', () => {
    expect(src).toContain('data-testid="cost-manual-unavailable"');
    expect(src).toContain('Live cost schedule unavailable.');
    expect(src).toContain('not being replaced with sample data');
  });

  it('uses the live schedule API with backend-aligned quality classes', () => {
    expect(src).toContain('getCostSchedule');
    expect(src).toContain("{ value: 'ECONOMY', label: 'Economy' }");
    expect(src).toContain("{ value: 'STANDARD', label: 'Standard' }");
    expect(src).toContain("{ value: 'CUSTOM', label: 'Custom' }");
    expect(src).toContain("{ value: 'PREMIUM', label: 'Premium' }");
    expect(src).toContain("{ value: 'LUXURY', label: 'Luxury' }");
  });
});

// ============================================================================
// Gate 4 — BatchCostRun: live API provenance
// ============================================================================

describe('Gate 4 — BatchCostRun: live API-backed module', () => {
  const src = readSrc('pages/forge/batch/BatchCostRun.tsx');
  const store = readSrc('pages/forge/batch/batchCostRunStore.ts');

  it('does not import DemoDataBanner or define fixture history', () => {
    expect(src).not.toContain('DemoDataBanner');
    expect(src).not.toContain('FIXTURE_HISTORY');
    expect(store).not.toContain('FIXTURE_HISTORY');
  });

  it('declares the live module landmark and source badge', () => {
    expect(src).toContain('data-testid="batch-cost-run"');
    expect(src).toContain('Live API');
  });

  it('consumes governed CostForge endpoints through the store', () => {
    expect(src).toContain('useBatchCostRunStore');
    expect(store).toContain('/forge/cost/batch/preview');
    expect(store).toContain('/forge/cost/batch/history');
    expect(store).toContain('/costforge/cost-matrix/benton');
    expect(store).toContain('/costforge/depreciation-schedule');
    expect(store).toContain('/costforge/cost-estimate');
  });

  it('does not keep the old governed unavailable posture', () => {
    expect(src).not.toContain('data-testid="batch-cost-run-unavailable"');
    expect(src).not.toContain('Governed batch cost run unavailable.');
    expect(src).not.toContain('Governed batch engine unavailable');
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

  it('SegmentDiscoveryDashboard keeps explicit unavailable disclosure (W4B)', () => {
    const src = readSrc('pages/forge/calibration/SegmentDiscoveryDashboard.tsx');
    expect(src).toContain('segment-discovery-unavailable');
    expect(src).toContain('Segment discovery unavailable.');
    expect(src).not.toContain('DemoDataBanner');
  });

  it('GeoEquityDashboard keeps explicit unavailable disclosure instead of DemoDataBanner (W5B)', () => {
    const src = readSrc('pages/atlas/GeoEquityDashboard.tsx');
    expect(src).toContain('geo-equity-unavailable');
    expect(src).toContain('GeoEquityReadState');
    expect(src).not.toContain('DemoDataBanner');
    expect(src).not.toContain('isFixture');
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

// ============================================================================
// Gate 6 — StageZeroState: Today's Work panel stays honest without demo banner
// ============================================================================

describe('Gate 6 — StageZeroState surfaces explicit unavailable state without demo banner', () => {
  const src = readSrc('shell/desktop/StageZeroState.tsx');

  it('does not import DemoDataBanner or use isSampleData', () => {
    expect(src).not.toMatch(/from\s+['"].*governance\/DemoDataBanner['"]/);
    expect(src).not.toContain('isSampleData');
  });

  it('renders explicit TerraDais unavailable text for failed reads', () => {
    expect(src).toContain("Today's work unavailable from TerraDais.");
  });
});

// ============================================================================
// Gate 7 — ValueAuditModule: explicit unavailable state, no demo rows
// ============================================================================

describe('Gate 7 — ValueAuditModule renders explicit unavailable state without demo rows', () => {
  const src = readSrc('pages/suites/modules/ValueAuditModule.tsx');

  it('does not import DemoDataBanner or define DEMO_ENTRIES', () => {
    expect(src).not.toContain('DemoDataBanner');
    expect(src).not.toContain('DEMO_ENTRIES');
  });

  it('renders explicit unavailable disclosure for missing TerraTrace feed', () => {
    expect(src).toContain('Value audit entries unavailable.');
    expect(src).toContain('governed TerraTrace audit feed');
  });

  it('does not append test entries or clear synthetic user rows', () => {
    expect(src).not.toContain('appendAuditEntry');
    expect(src).not.toContain('clearAuditEntries');
    expect(src).not.toContain('+ Test Entry');
  });
});

// ============================================================================
// Gate 8 — MassAppraisalGIS: live Atlas query with no demo parcel fallback
// ============================================================================

describe('Gate 8 — MassAppraisalGIS uses live Atlas geometry without demo fallback', () => {
  const src = readSrc('pages/atlas/MassAppraisalGIS.tsx');

  it('does not import DemoDataBanner', () => {
    expect(src).not.toContain('DemoDataBanner');
  });

  it('does not define DEMO_PARCELS', () => {
    expect(src).not.toContain('DEMO_PARCELS');
  });

  it('loads the live mass appraisal parcel slice from atlasService', () => {
    expect(src).toContain('searchMassAppraisalParcels');
  });

  it('renders an explicit live-state disclosure', () => {
    expect(src).toContain('data-testid="mass-appraisal-live-state"');
  });
});
