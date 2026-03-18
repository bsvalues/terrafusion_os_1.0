/**
 * BatchCostRun.tsx (Tranche 1D → 1E audit-proof)
 *
 * Standalone Forge module: Batch Cost Model Runs.
 * Provides run configuration with strata/neighborhood/class filters,
 * dry-run summary preview, and run history. Fixture-backed.
 *
 * Write lane: Forge (cross-parcel, no parcelId routing).
 * Preview-safe: dry-run produces summary without persisting values.
 *
 * 1E additions: ForgeApplyMode lifecycle, backend-capability gate,
 * blocker display, and audit event emission on every interaction.
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DemoDataBanner } from '@/components/governance/DemoDataBanner';

// ---------------------------------------------------------------------------
// 1E: Apply-mode types & audit event emitter
// ---------------------------------------------------------------------------

type ForgeApplyMode = 'preview_only' | 'apply_pending_backend' | 'apply_executed';

interface AuditEvent {
  eventId: string;
  requestId: string;
  suite: 'forge';
  writeLane: 'forge' | 'none';
  mode: ForgeApplyMode;
  outcome: 'preview_generated' | 'apply_accepted' | 'apply_blocked' | 'apply_executed';
  timestamp: string;
}

/** Backend capability flag — false until real backend is wired */
const BACKEND_APPLY_CAPABLE = false;

let _auditSeq = 0;
function emitAuditEvent(
  mode: ForgeApplyMode,
  outcome: AuditEvent['outcome'],
): AuditEvent {
  const evt: AuditEvent = {
    eventId: `bcr-audit-${++_auditSeq}`,
    requestId: `bcr-req-${Date.now()}`,
    suite: 'forge',
    writeLane: mode === 'preview_only' ? 'none' : 'forge',
    mode,
    outcome,
    timestamp: new Date().toISOString(),
  };
  // In production this would be sent to TerraTrace; for now log to console
  // eslint-disable-next-line no-console
  console.info('[TerraTrace] BatchCostRun audit event:', evt);
  return evt;
}

// ---------------------------------------------------------------------------
// Fixture data (Benton County)
// ---------------------------------------------------------------------------

interface BatchFilter {
  strata: string[];
  neighborhoods: string[];
  propertyClasses: string[];
}

interface RunSummary {
  totalParcels: number;
  increasedCount: number;
  decreasedCount: number;
  unchangedCount: number;
  meanChange: number;
  medianChange: number;
  meanPctChange: number;
}

interface RunRecord {
  id: string;
  label: string;
  modelYear: number;
  costTableVersion: string;
  filter: BatchFilter;
  dryRun: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  summary: RunSummary | null;
  createdAt: string;
  completedAt: string | null;
}

const STRATA_OPTIONS = ['residential', 'commercial', 'industrial', 'agricultural', 'exempt'] as const;
const NEIGHBORHOOD_OPTIONS = ['N01-Kennewick Core', 'N02-Richland South', 'N03-West Richland', 'N04-Prosser', 'N05-Benton City', 'N06-Rural East'] as const;
const CLASS_OPTIONS = ['R1-SFR', 'R2-MultiFamily', 'C1-Retail', 'C2-Office', 'I1-Light Industrial', 'A1-Irrigated', 'A2-Dryland'] as const;

const FIXTURE_HISTORY: RunRecord[] = [
  {
    id: 'bcr-001', label: '2025 Residential Full', modelYear: 2025, costTableVersion: 'CT-2025.1',
    filter: { strata: ['residential'], neighborhoods: [], propertyClasses: ['R1-SFR', 'R2-MultiFamily'] },
    dryRun: false, status: 'completed',
    summary: { totalParcels: 28_450, increasedCount: 18_200, decreasedCount: 6_100, unchangedCount: 4_150, meanChange: 12_340, medianChange: 8_900, meanPctChange: 4.2 },
    createdAt: '2025-01-15T09:30:00Z', completedAt: '2025-01-15T09:47:00Z',
  },
  {
    id: 'bcr-002', label: '2025 Commercial Preview', modelYear: 2025, costTableVersion: 'CT-2025.1',
    filter: { strata: ['commercial'], neighborhoods: [], propertyClasses: ['C1-Retail', 'C2-Office'] },
    dryRun: true, status: 'completed',
    summary: { totalParcels: 3_820, increasedCount: 2_100, decreasedCount: 1_400, unchangedCount: 320, meanChange: 34_500, medianChange: 22_100, meanPctChange: 6.8 },
    createdAt: '2025-02-01T14:00:00Z', completedAt: '2025-02-01T14:03:00Z',
  },
  {
    id: 'bcr-003', label: '2025 Kennewick Core Residential', modelYear: 2025, costTableVersion: 'CT-2025.2',
    filter: { strata: ['residential'], neighborhoods: ['N01-Kennewick Core'], propertyClasses: ['R1-SFR'] },
    dryRun: true, status: 'completed',
    summary: { totalParcels: 6_120, increasedCount: 4_500, decreasedCount: 1_200, unchangedCount: 420, meanChange: 15_600, medianChange: 11_200, meanPctChange: 5.1 },
    createdAt: '2025-02-10T10:15:00Z', completedAt: '2025-02-10T10:17:00Z',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type View = 'configure' | 'history';

export function BatchCostRun() {
  const [view, setView] = useState<View>('configure');
  const [history] = useState<RunRecord[]>(FIXTURE_HISTORY);

  // Config form state
  const [label, setLabel] = useState('');
  const [modelYear, setModelYear] = useState(2025);
  const [costTableVersion, setCostTableVersion] = useState('CT-2025.2');
  const [selectedStrata, setSelectedStrata] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [dryRunResult, setDryRunResult] = useState<RunSummary | null>(null);

  // 1E: Apply mode lifecycle
  const [applyMode, setApplyMode] = useState<ForgeApplyMode>('preview_only');
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);

  const toggleItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  };

  const handleDryRun = useCallback(() => {
    // Fixture response — preview-safe, no real API call
    setDryRunResult({
      totalParcels: 12_430,
      increasedCount: 8_200,
      decreasedCount: 3_100,
      unchangedCount: 1_130,
      meanChange: 9_870,
      medianChange: 7_200,
      meanPctChange: 3.6,
    });
    setApplyMode('preview_only');
    const evt = emitAuditEvent('preview_only', 'preview_generated');
    setAuditLog((prev) => [...prev, evt]);
  }, []);

  const handleApplyRequest = useCallback(() => {
    if (BACKEND_APPLY_CAPABLE) {
      // Real backend path — would send to API
      setApplyMode('apply_executed');
      const evt = emitAuditEvent('apply_executed', 'apply_executed');
      setAuditLog((prev) => [...prev, evt]);
    } else {
      // No backend — record the blocked attempt honestly
      setApplyMode('apply_pending_backend');
      const evt = emitAuditEvent('apply_pending_backend', 'apply_blocked');
      setAuditLog((prev) => [...prev, evt]);
    }
  }, []);

  const fmtNum = (n: number) => n.toLocaleString();
  const fmtCurrency = (n: number) => `$${n.toLocaleString()}`;

  const statusVariant = (s: string) => {
    switch (s) {
      case 'completed': return 'secondary';
      case 'running': return 'default';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div data-testid="batch-cost-run" className="space-y-4 p-4">
      <DemoDataBanner module="Batch Cost Run" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--tf-fg))' }}>Batch Cost Model Runs</h1>
        <div className="flex gap-2">
          <Button variant={view === 'configure' ? 'default' : 'outline'} size="sm" onClick={() => setView('configure')}>
            Configure Run
          </Button>
          <Button variant={view === 'history' ? 'default' : 'outline'} size="sm" onClick={() => setView('history')}>
            Run History
          </Button>
        </div>
      </div>

      {/* VIEW: Configure */}
      {view === 'configure' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Config Form */}
          <Card>
            <CardHeader><CardTitle>Run Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'hsl(var(--tf-muted))' }}>Run Label</label>
                <input
                  data-testid="batch-label"
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. 2025 Residential Full"
                  className="w-full px-3 py-2 rounded border text-sm"
                  style={{ background: 'hsl(var(--tf-card-bg) / 0.5)', borderColor: 'hsl(var(--tf-border) / 0.3)', color: 'hsl(var(--tf-fg))' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'hsl(var(--tf-muted))' }}>Model Year</label>
                  <input
                    data-testid="batch-year"
                    type="number"
                    value={modelYear}
                    onChange={(e) => setModelYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded border text-sm"
                    style={{ background: 'hsl(var(--tf-card-bg) / 0.5)', borderColor: 'hsl(var(--tf-border) / 0.3)', color: 'hsl(var(--tf-fg))' }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'hsl(var(--tf-muted))' }}>Cost Table Version</label>
                  <input
                    data-testid="batch-cost-table"
                    type="text"
                    value={costTableVersion}
                    onChange={(e) => setCostTableVersion(e.target.value)}
                    className="w-full px-3 py-2 rounded border text-sm"
                    style={{ background: 'hsl(var(--tf-card-bg) / 0.5)', borderColor: 'hsl(var(--tf-border) / 0.3)', color: 'hsl(var(--tf-fg))' }}
                  />
                </div>
              </div>

              {/* Strata filter */}
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'hsl(var(--tf-muted))' }}>Strata</label>
                <div className="flex flex-wrap gap-1">
                  {STRATA_OPTIONS.map((s) => (
                    <Badge
                      key={s}
                      variant={selectedStrata.includes(s) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleItem(selectedStrata, s, setSelectedStrata)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Neighborhood filter */}
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'hsl(var(--tf-muted))' }}>Neighborhoods</label>
                <div className="flex flex-wrap gap-1">
                  {NEIGHBORHOOD_OPTIONS.map((n) => (
                    <Badge
                      key={n}
                      variant={selectedNeighborhoods.includes(n) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleItem(selectedNeighborhoods, n, setSelectedNeighborhoods)}
                    >
                      {n}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Property class filter */}
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'hsl(var(--tf-muted))' }}>Property Classes</label>
                <div className="flex flex-wrap gap-1">
                  {CLASS_OPTIONS.map((c) => (
                    <Badge
                      key={c}
                      variant={selectedClasses.includes(c) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleItem(selectedClasses, c, setSelectedClasses)}
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button data-testid="batch-dry-run-btn" onClick={handleDryRun} className="w-full">
                Preview (Dry Run)
              </Button>

              {/* 1E: Apply Request — only visible after a preview */}
              {dryRunResult && (
                <div className="space-y-2 pt-2">
                  <Button
                    data-testid="batch-apply-btn"
                    variant={applyMode === 'apply_executed' ? 'default' : 'outline'}
                    onClick={handleApplyRequest}
                    disabled={applyMode === 'apply_executed'}
                    className="w-full"
                  >
                    {applyMode === 'apply_executed'
                      ? 'Applied'
                      : applyMode === 'apply_pending_backend'
                        ? 'Retry Apply'
                        : 'Request Apply'}
                  </Button>

                  {/* 1E: Apply mode banner */}
                  <div data-testid="batch-apply-mode" className="text-xs px-2 py-1 rounded" style={{
                    background: applyMode === 'preview_only'
                      ? 'hsl(200 60% 30% / 0.2)'
                      : applyMode === 'apply_pending_backend'
                        ? 'hsl(40 80% 40% / 0.2)'
                        : 'hsl(120 50% 35% / 0.2)',
                    color: applyMode === 'preview_only'
                      ? 'hsl(200 60% 70%)'
                      : applyMode === 'apply_pending_backend'
                        ? 'hsl(40 80% 70%)'
                        : 'hsl(120 60% 60%)',
                  }}>
                    {applyMode === 'preview_only' && 'Mode: Preview Only — no values persisted'}
                    {applyMode === 'apply_pending_backend' && 'Mode: Apply Blocked — backend capability not available. Request recorded.'}
                    {applyMode === 'apply_executed' && 'Mode: Applied — values persisted to cost tables'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Dry-Run Summary */}
          <Card>
            <CardHeader><CardTitle>Dry-Run Summary</CardTitle></CardHeader>
            <CardContent>
              {!dryRunResult ? (
                <div className="flex items-center justify-center py-16" style={{ color: 'hsl(var(--tf-muted))' }}>
                  Configure filters and run a preview to see projected impact.
                </div>
              ) : (
                <div data-testid="batch-dry-run-summary" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded" style={{ background: 'hsl(var(--tf-card-bg) / 0.4)' }}>
                      <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Total Parcels</div>
                      <div className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(dryRunResult.totalParcels)}</div>
                    </div>
                    <div className="p-3 rounded" style={{ background: 'hsl(var(--tf-card-bg) / 0.4)' }}>
                      <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Mean % Change</div>
                      <div className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-suite-forge))' }}>{dryRunResult.meanPctChange.toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded text-center" style={{ background: 'hsl(120 40% 30% / 0.2)' }}>
                      <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Increased</div>
                      <div className="font-semibold" style={{ color: 'hsl(120 60% 60%)' }}>{fmtNum(dryRunResult.increasedCount)}</div>
                    </div>
                    <div className="p-2 rounded text-center" style={{ background: 'hsl(0 40% 30% / 0.2)' }}>
                      <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Decreased</div>
                      <div className="font-semibold" style={{ color: 'hsl(0 60% 60%)' }}>{fmtNum(dryRunResult.decreasedCount)}</div>
                    </div>
                    <div className="p-2 rounded text-center" style={{ background: 'hsl(var(--tf-card-bg) / 0.4)' }}>
                      <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Unchanged</div>
                      <div className="font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(dryRunResult.unchangedCount)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded" style={{ background: 'hsl(var(--tf-card-bg) / 0.4)' }}>
                      <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Mean Change</div>
                      <div className="font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtCurrency(dryRunResult.meanChange)}</div>
                    </div>
                    <div className="p-3 rounded" style={{ background: 'hsl(var(--tf-card-bg) / 0.4)' }}>
                      <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Median Change</div>
                      <div className="font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtCurrency(dryRunResult.medianChange)}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW: Run History */}
      {view === 'history' && (
        <Card>
          <CardHeader><CardTitle>Run History</CardTitle></CardHeader>
          <CardContent>
            <table data-testid="batch-run-history" className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.2)' }}>
                  <th className="text-left py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Label</th>
                  <th className="text-left py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Year</th>
                  <th className="text-left py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Cost Table</th>
                  <th className="text-right py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Parcels</th>
                  <th className="text-right py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Mean Δ%</th>
                  <th className="text-left py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Type</th>
                  <th className="text-left py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Status</th>
                  <th className="text-left py-2" style={{ color: 'hsl(var(--tf-muted))' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {history.map((run) => (
                  <tr key={run.id} style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.1)' }}>
                    <td className="py-2" style={{ color: 'hsl(var(--tf-fg))' }}>{run.label}</td>
                    <td className="py-2" style={{ color: 'hsl(var(--tf-fg))' }}>{run.modelYear}</td>
                    <td className="py-2 font-mono text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{run.costTableVersion}</td>
                    <td className="py-2 text-right font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>
                      {run.summary ? fmtNum(run.summary.totalParcels) : '—'}
                    </td>
                    <td className="py-2 text-right font-mono" style={{ color: 'hsl(var(--tf-suite-forge))' }}>
                      {run.summary ? `${run.summary.meanPctChange.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2">
                      <Badge variant={run.dryRun ? 'outline' : 'secondary'}>{run.dryRun ? 'Dry Run' : 'Live'}</Badge>
                    </td>
                    <td className="py-2">
                      <Badge variant={statusVariant(run.status) as any}>{run.status}</Badge>
                    </td>
                    <td className="py-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                      {new Date(run.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 1E: Audit Trail */}
      {auditLog.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Audit Trail</CardTitle></CardHeader>
          <CardContent>
            <div data-testid="batch-audit-trail" className="space-y-1">
              {auditLog.map((evt) => (
                <div key={evt.eventId} className="flex items-center gap-2 text-xs py-1" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.1)' }}>
                  <Badge variant="outline" className="shrink-0">{evt.outcome}</Badge>
                  <span className="font-mono" style={{ color: 'hsl(var(--tf-muted))' }}>{evt.mode}</span>
                  <span className="font-mono" style={{ color: 'hsl(var(--tf-muted))' }}>lane:{evt.writeLane}</span>
                  <span className="ml-auto font-mono" style={{ color: 'hsl(var(--tf-muted))' }}>
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BatchCostRun;
