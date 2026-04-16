/**
 * TerraAtlas Suite Home -- Geographic Intelligence & Mapping
 * ===================================================================
 * Constitutional Suite: atlas (Article II)
 * Layer 3: Domain router + cross-parcel operational workspace
 *
 * Shows: county stats, module launcher grid, recent parcel queue.
 * Does NOT host parcel execution — that lives in the Property Workbench.
 */

import { useCallback, useState } from 'react';
import { invokeTool } from '../../api/pilotApi';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import { SuiteModuleGrid, type SuiteModuleDef } from '../../components/suites/SuiteModuleGrid';
import { OperationalQueue } from '../../components/suites/OperationalQueue';
import { useCountyStats } from '../../hooks/useCountyStats';
import {
  Map,
  Search,
  Layers,
  Crosshair,
  Printer,
  Download,
  Database,
  BarChart2,
  Globe,
} from 'lucide-react';

const ATLAS_MODULES: SuiteModuleDef[] = [
  // Workbench-mode (parcel-scoped, opens Property Workbench)
  { id: 'gis', label: 'TerraGIS', icon: Map, description: 'Full GIS viewer with parcel boundaries, aerial imagery, and overlays', launchMode: 'workbench', workbenchTab: 'atlas' },
  { id: 'parcel-lens', label: 'ParcelLens', icon: Search, description: 'Detailed parcel inspection with measurement tools', launchMode: 'workbench', workbenchTab: 'atlas' },
  { id: 'layer-works', label: 'LayerWorks', icon: Layers, description: 'Advanced layer management and spatial analysis', launchMode: 'workbench', workbenchTab: 'atlas' },
  { id: 'terra-sketch', label: 'TerraSketch', icon: Crosshair, description: 'Parcel sketch and geometry editing tools', launchMode: 'workbench', workbenchTab: 'atlas' },
  { id: 'terra-print', label: 'TerraPrint', icon: Printer, description: 'Map printing and PDF export for field work', launchMode: 'workbench', workbenchTab: 'atlas' },
  { id: 'terra-export', label: 'TerraExport', icon: Download, description: 'GIS data export (Shapefile, GeoJSON, KML)', launchMode: 'workbench', workbenchTab: 'atlas' },
  { id: 'terra-query', label: 'TerraQuery', icon: Database, description: 'SQL-like spatial queries across county data', launchMode: 'workbench', workbenchTab: 'atlas' },
  // Standalone-mode (county-wide, opens standalone window)
  { id: 'terra-gis-pro', label: 'TerraGIS Pro', icon: Map, description: 'Full county-wide GIS platform — advanced cartography & spatial analysis', launchMode: 'standalone', moduleId: 'terra-gis', truthState: 'queued' },
  { id: 'geo-equity-dashboard', label: 'Geo Equity', icon: BarChart2, description: 'Geographic equity analysis — market-value equity by area, district, and property class', launchMode: 'standalone', moduleId: 'geo-equity-dashboard', truthState: 'queued' },
  { id: 'mass-appraisal-gis', label: 'Appraisal GIS', icon: Globe, description: 'Mass appraisal spatial visualization — value heat maps, sale ratio overlays, and cluster analysis', launchMode: 'standalone', moduleId: 'mass-appraisal-gis', truthState: 'queued' },
];

const fmtNum = (n: number | undefined | null) => (n != null ? n.toLocaleString() : '—');

interface SpatialFindingSummary {
  finding: {
    findingType: string;
    severity: string;
    confidence: number;
    recommendedAction: string;
  };
  hotspotCount: number;
  narrative: string;
  recommendedTool: string;
}

function getSourceDisclosure(source: 'snapshot' | 'fixtures' | 'live' | null): string | null {
  if (source === 'snapshot') {
    return 'Snapshot-backed county aggregates: TerraAtlas stats are using bundled county snapshot data, not live backend metrics.';
  }
  if (source === 'fixtures') {
    return 'Fixture-backed county aggregates: TerraAtlas stats are using test fixture data, not live backend metrics.';
  }
  return null;
}

export default function AtlasSuiteHome() {
  const { stats, loading, error, source } = useCountyStats();
  const sourceDisclosure = getSourceDisclosure(source);
  const [metric, setMetric] = useState<'residual_cluster' | 'prd' | 'prb' | 'cod'>('residual_cluster');
  const [geographyId, setGeographyId] = useState('BENTON-COUNTY');
  const [spatialAuditState, setSpatialAuditState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    result?: SpatialFindingSummary;
    correlationId?: string;
    error?: string;
  }>({ status: 'idle' });

  const parseToolOutput = <T,>(output: unknown, fallback: T): T => {
    try {
      return typeof output === 'string' ? JSON.parse(output) as T : output as T;
    } catch {
      return fallback;
    }
  };

  const handleSpatialAudit = useCallback(async () => {
    setSpatialAuditState({ status: 'loading' });
    try {
      const response = await invokeTool({
        toolId: 'explain_spatial_anomaly',
        params: {
          county: 'benton',
          taxYear: 2026,
          metric,
          geographyId: geographyId.trim() || undefined,
        },
      });

      if (response.success && response.result) {
        const parsed = parseToolOutput<SpatialFindingSummary>(response.result.output, {
          finding: {
            findingType: 'SPATIAL_PROBLEM',
            severity: 'medium',
            confidence: 0,
            recommendedAction: 'Review Atlas workbench evidence.',
          },
          hotspotCount: 0,
          narrative: 'No governed spatial narrative was returned.',
          recommendedTool: 'atlas',
        });
        setSpatialAuditState({
          status: 'success',
          result: parsed,
          correlationId: response.correlationId,
        });
      } else {
        setSpatialAuditState({
          status: 'error',
          correlationId: response.correlationId,
          error: response.error?.message || 'Failed to explain spatial anomaly.',
        });
      }
    } catch (toolError) {
      setSpatialAuditState({
        status: 'error',
        correlationId: `net-${crypto.randomUUID().slice(0, 8)}`,
        error: toolError instanceof Error ? toolError.message : 'Failed to explain spatial anomaly.',
      });
    }
  }, [geographyId, metric]);

  return (
    <div data-testid="suite-atlas-root" className="h-full flex flex-col" style={{ background: 'hsl(var(--tf-bg))' }}>
      <ParcelContextBanner suiteTabId="atlas" />

      {/* Source disclosure — only when not live */}
      {stats && sourceDisclosure && (
        <div
          data-testid="atlas-source-disclosure"
          role="status"
          className="px-6 py-2 text-xs"
          style={{
            color: 'hsl(var(--tf-warning))',
            background: 'hsl(var(--tf-warning) / 0.10)',
            borderBottom: '1px solid hsl(var(--tf-warning) / 0.2)',
          }}
        >
          {sourceDisclosure}
        </div>
      )}

      {loading && !stats && (
        <div data-testid="atlas-loading" role="status" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Loading stats...</div>
      )}
      {error && (
        <div data-testid="atlas-error" role="alert" className="px-6 py-3 text-sm" style={{ color: 'hsl(var(--tf-suite-atlas))' }}>{error}</div>
      )}

      {/* Stats Strip */}
      {stats && (
        <div data-testid="atlas-stats" className="shrink-0 px-6 py-3 flex gap-6 overflow-x-auto" style={{ borderBottom: '1px solid hsl(var(--tf-border) / 0.15)', background: 'hsl(var(--tf-card-bg) / 0.3)' }}>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Total Parcels</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.totalParcels)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>By City</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{Object.keys(stats.parcelsByCity).length} cities</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Property Types</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{Object.keys(stats.parcelsByType).length} types</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Residential</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.parcelsByType.residential ?? 0)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Commercial</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(stats.parcelsByType.commercial ?? 0)}</span></div>
        </div>
      )}

      {/* Header */}
      <header
        style={{ borderBottom: '1px solid hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.5)' }}
        className="backdrop-blur-xl shrink-0"
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-4">
          <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--tf-suite-atlas) / 0.15)' }}>
            <Map size={24} style={{ color: 'hsl(var(--tf-suite-atlas))' }} />
          </div>
          <div>
            <h1 className="text-xl font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>TerraAtlas</h1>
            <p className="text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Geographic Intelligence & Spatial Analysis</p>
          </div>
        </div>
      </header>

      {/* Breadth posture disclosure — always visible; breadth modules are queued pending implementation */}
      <div
        data-testid="atlas-breadth-posture-note"
        role="note"
        className="px-6 py-2 text-xs shrink-0"
        style={{
          color: 'hsl(var(--tf-muted))',
          background: 'hsl(var(--tf-card-bg) / 0.25)',
          borderBottom: '1px solid hsl(var(--tf-border) / 0.10)',
        }}
      >
        TerraGIS Pro, Geo Equity, and Appraisal GIS are queued — these modules open placeholder surfaces and do not reflect live county data.
      </div>

      {/* Module Grid + Operational Queue */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <section data-testid="atlas-evidence-plane" className="px-6 pt-5">
          <div
            className="rounded-xl border p-5"
            style={{
              borderColor: 'hsl(var(--tf-border))',
              background: 'hsl(var(--tf-card-bg) / 0.5)',
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'hsl(var(--tf-muted))' }}>
                  Evidence Plane
                </p>
                <h2 className="mt-2 text-lg font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>
                  County Spatial Audit Posture
                </h2>
                <p className="mt-2 max-w-3xl text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
                  Run governed county anomaly review for Benton County, convert hotspot patterns into a defensible finding, and route the next step into the right Atlas or Forge lane without implying queued breadth modules are live.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: 'hsl(var(--tf-suite-atlas) / 0.12)', color: 'hsl(var(--tf-suite-atlas))' }}
                >
                  {fmtNum(stats?.totalParcels)} parcels
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: 'hsl(var(--tf-border) / 0.2)', color: 'hsl(var(--tf-fg))' }}
                >
                  {Object.keys(stats?.parcelsByCity ?? {}).length} cities in view
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
              <div
                className="rounded-lg border p-4"
                style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg) / 0.35)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>Spatial Anomaly Review</div>
                    <div className="mt-1 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>Explain a county residual or ratio issue before it becomes a calibration or parcel-fix decision.</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSpatialAudit}
                    disabled={spatialAuditState.status === 'loading'}
                    className="rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-opacity disabled:opacity-50"
                    style={{
                      borderColor: 'hsl(var(--tf-suite-atlas) / 0.35)',
                      background: 'hsl(var(--tf-suite-atlas) / 0.12)',
                      color: 'hsl(var(--tf-suite-atlas))',
                    }}
                  >
                    {spatialAuditState.status === 'loading' ? 'Auditing…' : 'Run Spatial Audit'}
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  <select
                    value={metric}
                    onChange={(event) => setMetric(event.target.value as 'residual_cluster' | 'prd' | 'prb' | 'cod')}
                    className="rounded-md border px-3 py-2 text-sm"
                    style={{
                      borderColor: 'hsl(var(--tf-border))',
                      background: 'hsl(var(--tf-card-bg) / 0.4)',
                      color: 'hsl(var(--tf-fg))',
                    }}
                  >
                    <option value="residual_cluster">Residual Cluster</option>
                    <option value="prd">PRD</option>
                    <option value="prb">PRB</option>
                    <option value="cod">COD</option>
                  </select>
                  <input
                    value={geographyId}
                    onChange={(event) => setGeographyId(event.target.value)}
                    className="rounded-md border px-3 py-2 text-sm"
                    style={{
                      borderColor: 'hsl(var(--tf-border))',
                      background: 'hsl(var(--tf-card-bg) / 0.4)',
                      color: 'hsl(var(--tf-fg))',
                    }}
                  />
                </div>

                {spatialAuditState.status === 'success' && spatialAuditState.result && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>
                          {spatialAuditState.result.finding.findingType}
                        </div>
                        <div className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                          {spatialAuditState.result.hotspotCount} hotspot{spatialAuditState.result.hotspotCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <p className="mt-2 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
                        {spatialAuditState.result.narrative}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}>
                          Severity: {spatialAuditState.result.finding.severity}
                        </span>
                        <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}>
                          Confidence: {(spatialAuditState.result.finding.confidence * 100).toFixed(0)}%
                        </span>
                        <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-fg))' }}>
                          Route: {spatialAuditState.result.recommendedTool}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-lg border p-3 text-xs" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg) / 0.3)', color: 'hsl(var(--tf-muted))' }}>
                      Recommended action: {spatialAuditState.result.finding.recommendedAction}
                      {spatialAuditState.correlationId ? `  •  Ref ${spatialAuditState.correlationId}` : ''}
                    </div>
                  </div>
                )}

                {spatialAuditState.status === 'error' && (
                  <div className="mt-4 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'hsl(var(--tf-suite-atlas) / 0.24)', background: 'hsl(var(--tf-suite-atlas) / 0.08)', color: 'hsl(var(--tf-suite-atlas))' }}>
                    {spatialAuditState.error}
                  </div>
                )}
              </div>

              <div
                className="rounded-lg border p-4"
                style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg) / 0.35)' }}
              >
                <div className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>Routing Discipline</div>
                <div className="mt-1 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
                  County spatial review happens here. Parcel geometry edits, live layer inspection, and sketch work stay in the Atlas workbench.
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--tf-muted))' }}>Workbench Lane</div>
                    <div className="mt-1 text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>TerraGIS, ParcelLens, LayerWorks, TerraSketch</div>
                    <div className="mt-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                      Use the parcel-scoped workbench modules below for geometry repair, layer inspection, map export, and parcel drill-down.
                    </div>
                  </div>
                  <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--tf-muted))' }}>Queued Breadth</div>
                    <div className="mt-1 text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>TerraGIS Pro, Geo Equity, Appraisal GIS</div>
                    <div className="mt-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                      These county-wide breadth surfaces remain queued and should not be treated as live operational systems until they are backed by authoritative Benton evidence.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div data-testid="atlas-modules"><SuiteModuleGrid modules={ATLAS_MODULES} accentVar="--tf-suite-atlas" /></div>
        <div data-testid="atlas-queue"><OperationalQueue title="Recent Parcels" accentVar="--tf-suite-atlas" emptyMessage="No recent parcel activity" /></div>
      </main>
    </div>
  );
}
