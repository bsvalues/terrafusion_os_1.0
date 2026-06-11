/**
 * TerraAtlas Suite Home -- Geographic Intelligence & Mapping
 * ===================================================================
 * Constitutional Suite: atlas (Article II)
 * Layer 3: TerraAtlas Suite workspace
 *
 * Shows: suite app truth, GIS API proof, module launcher grid, recent parcel queue.
 */

import { useCallback, useState } from 'react';
import { invokeTool } from '../../api/pilotApi';
import { SuiteModuleGrid, type SuiteModuleDef } from '../../components/suites/SuiteModuleGrid';
import { OperationalQueue } from '../../components/suites/OperationalQueue';
import { useCountyStats } from '../../hooks/useCountyStats';
import { useParcelGis } from '../../hooks/useAtlasGis';
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

const PROOF_PARCEL_ID = '119802030006001';
const GIS_GEOMETRIES_AVAILABLE = 80084;
const RING_JSON_GEOMETRIES_AVAILABLE = 80083;

const ATLAS_MODULES: SuiteModuleDef[] = [
  { id: 'gis', label: 'TerraGIS', icon: Map, description: 'Partial GIS surface backed by live Benton parcel boundary data', launchMode: 'standalone', moduleId: 'atlas' },
  { id: 'parcel-lens', label: 'ParcelLens', icon: Search, description: 'Partial parcel detail surface for the canonical Benton proof parcel', launchMode: 'standalone', moduleId: 'atlas' },
  { id: 'layer-works', label: 'LayerWorks', icon: Layers, description: 'Partial layer truth for tax area, land class, flood, and zoning status', launchMode: 'standalone', moduleId: 'atlas' },
  { id: 'terra-query', label: 'TerraQuery', icon: Database, description: 'Read-only query posture; no mutation or export pipeline is claimed', launchMode: 'standalone', moduleId: 'atlas', truthState: 'unavailable' },
  { id: 'terra-sketch', label: 'TerraSketch', icon: Crosshair, description: 'Geometry editing is not implemented in this Suite runtime proof', launchMode: 'standalone', moduleId: 'atlas', truthState: 'queued' },
  { id: 'terra-print', label: 'TerraPrint', icon: Printer, description: 'Print pipeline is not implemented in this Suite runtime proof', launchMode: 'standalone', moduleId: 'atlas', truthState: 'queued' },
  { id: 'terra-export', label: 'TerraExport', icon: Download, description: 'GIS export pipeline is not implemented in this Suite runtime proof', launchMode: 'standalone', moduleId: 'atlas', truthState: 'queued' },
  { id: 'terra-gis-pro', label: 'TerraGIS Pro', icon: Map, description: 'Advanced county GIS is queued pending a dedicated implementation', launchMode: 'standalone', moduleId: 'atlas', truthState: 'queued' },
  { id: 'geo-equity-dashboard', label: 'Geo Equity', icon: BarChart2, description: 'Equity analytics are queued pending authoritative model proof', launchMode: 'standalone', moduleId: 'atlas', truthState: 'queued' },
  { id: 'mass-appraisal-gis', label: 'Appraisal GIS', icon: Globe, description: 'Queued until appraisal-specific GIS workflow proof exists', launchMode: 'standalone', moduleId: 'atlas', truthState: 'queued' },
];

const fmtNum = (n: number | undefined | null) => (n != null ? n.toLocaleString() : '—');

type AtlasAppStatus =
  | 'LIVE'
  | 'PARTIAL'
  | 'READ_ONLY'
  | 'DISABLED'
  | 'QUEUED'
  | 'NOT_IMPLEMENTED'
  | 'EXTERNAL_REQUIRED';

interface AtlasAppTruth {
  app: string;
  status: AtlasAppStatus;
  proof: string;
}

const APP_TRUTH_MATRIX: AtlasAppTruth[] = [
  { app: 'TerraGIS', status: 'PARTIAL', proof: 'Uses the live Atlas GIS parcel endpoint; Mapbox token remains external.' },
  { app: 'ParcelLens', status: 'PARTIAL', proof: 'Shows owner, situs, centroid, area, and RingJson presence for the proof parcel.' },
  { app: 'LayerWorks', status: 'PARTIAL', proof: 'Shows tax area, land class, flood external enrichment, and zoning null from the layers response.' },
  { app: 'TerraQuery', status: 'READ_ONLY', proof: 'Read-only posture only; no spatial mutation or export is claimed.' },
  { app: 'TerraSketch', status: 'NOT_IMPLEMENTED', proof: 'No geometry editing is exposed or claimed.' },
  { app: 'TerraPrint', status: 'NOT_IMPLEMENTED', proof: 'No print pipeline is exposed or claimed.' },
  { app: 'TerraExport', status: 'NOT_IMPLEMENTED', proof: 'No Shapefile, GeoJSON, or KML export is exposed or claimed.' },
  { app: 'TerraGIS Pro', status: 'QUEUED', proof: 'Advanced GIS remains queued.' },
  { app: 'Geo Equity', status: 'QUEUED', proof: 'Equity analytics remain queued.' },
  { app: 'Appraisal GIS', status: 'QUEUED', proof: 'Appraisal GIS workflow proof remains queued.' },
];

function getRingPointCount(ringJson: string | null | undefined): number | null {
  if (!ringJson) return null;
  try {
    const parsed = JSON.parse(ringJson);
    return Array.isArray(parsed) ? parsed.length : null;
  } catch {
    return null;
  }
}

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
    return 'Non-live county aggregate mode is active; TerraAtlas stats are not live backend metrics.';
  }
  return null;
}

export default function AtlasSuiteHome() {
  const { stats, loading, error, source } = useCountyStats();
  const { boundary, layers } = useParcelGis(PROOF_PARCEL_ID);
  const ringPointCount = getRingPointCount(boundary.data?.ringJson);
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
            recommendedAction: 'Review the TerraAtlas Suite evidence.',
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
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>GIS geometry rows</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(GIS_GEOMETRIES_AVAILABLE)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>RingJson geometries</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{fmtNum(RING_JSON_GEOMETRIES_AVAILABLE)}</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Active parcel count</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>Not verified</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>PACS rows</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>Hidden from Suite UI</span></div>
          <div><span className="text-xs block" style={{ color: 'hsl(var(--tf-muted))' }}>Proof parcel</span><span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{PROOF_PARCEL_ID}</span></div>
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
        TerraGIS, ParcelLens, and LayerWorks are partial live Suite surfaces for the canonical Benton proof parcel. TerraSketch, TerraPrint, TerraExport, TerraGIS Pro, Geo Equity, and Appraisal GIS are not claimed as production app implementations.
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
                  {fmtNum(GIS_GEOMETRIES_AVAILABLE)} GIS rows
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: 'hsl(var(--tf-border) / 0.2)', color: 'hsl(var(--tf-fg))' }}
                >
                  Active parcel count not verified
                </span>
              </div>
            </div>

            <div data-testid="atlas-suite-app-proof" className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
              <div
                className="rounded-lg border p-4"
                style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg) / 0.35)' }}
              >
                <div className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>TerraAtlas App Runtime Truth</div>
                <div className="mt-1 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
                  Canonical proof parcel {PROOF_PARCEL_ID} is loaded through the Atlas GIS combined endpoint.
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--tf-muted))' }}>TerraGIS · PARTIAL</div>
                    <div className="mt-2 text-sm" style={{ color: 'hsl(var(--tf-fg))' }}>Boundary source: {boundary.loading ? 'loading' : boundary.data?.source ?? boundary.source}</div>
                    <div className="mt-1 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Map tiles require external Mapbox configuration; boundary data is still shown honestly.</div>
                  </div>
                  <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--tf-muted))' }}>ParcelLens · PARTIAL</div>
                    <div className="mt-2 text-sm" style={{ color: 'hsl(var(--tf-fg))' }}>{boundary.data?.ownerName ?? 'Owner loading'}</div>
                    <div className="mt-1 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{boundary.data?.situsDisplay ?? 'Situs loading'}</div>
                    <div className="mt-1 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Centroid {boundary.data?.centroid ? `${boundary.data.centroid.lat.toFixed(6)}, ${boundary.data.centroid.lng.toFixed(6)}` : 'loading'} · Area {boundary.data?.areaAcres ?? '—'} ac · RingJson {ringPointCount ?? '—'} points</div>
                  </div>
                  <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--tf-muted))' }}>LayerWorks · PARTIAL</div>
                    <div className="mt-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Tax area {layers.data?.taxArea?.taxAreaNumber ?? '—'} · {layers.data?.taxArea?.source ?? 'loading'}</div>
                    <div className="mt-1 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Land class {layers.data?.landClass?.primaryUseCd ?? '—'} · {layers.data?.landClass?.source ?? 'loading'}</div>
                    <div className="mt-1 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>Flood {layers.data?.flood?.source ?? 'loading'} · Zoning {layers.data?.zoning ? layers.data.zoning.zoneCode ?? 'configured' : 'null/not configured'}</div>
                  </div>
                  <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--tf-muted))' }}>TerraQuery · READ_ONLY</div>
                    <div className="mt-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>This WO proves read-only API consumption only. No spatial mutation, export, or autonomous action is exposed.</div>
                  </div>
                </div>
                {boundary.error && (
                  <div className="mt-4 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: 'hsl(var(--tf-warning) / 0.24)', background: 'hsl(var(--tf-warning) / 0.08)', color: 'hsl(var(--tf-warning))' }}>
                    Atlas GIS proof unavailable: {boundary.error}
                  </div>
                )}
              </div>

              <div
                className="rounded-lg border p-4"
                style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-bg) / 0.35)' }}
              >
                <div className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>App Status Matrix</div>
                <div className="mt-3 grid gap-2">
                  {APP_TRUTH_MATRIX.map((item) => (
                    <div key={item.app} className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{item.app}</span>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'hsl(var(--tf-suite-atlas) / 0.12)', color: 'hsl(var(--tf-suite-atlas))' }}>{item.status}</span>
                      </div>
                      <div className="mt-1 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{item.proof}</div>
                    </div>
                  ))}
                </div>
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
                  County spatial review happens here. Geometry editing, print, export, pro GIS, equity analytics, and appraisal GIS are not claimed unless they are backed by dedicated Suite runtime proof.
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--tf-muted))' }}>Partial Live Suite Apps</div>
                    <div className="mt-1 text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>TerraGIS, ParcelLens, LayerWorks</div>
                    <div className="mt-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                      These surfaces consume the existing Atlas GIS API for the canonical Benton proof parcel.
                    </div>
                  </div>
                  <div className="rounded-lg border p-3" style={{ borderColor: 'hsl(var(--tf-border))', background: 'hsl(var(--tf-card-bg) / 0.35)' }}>
                    <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--tf-muted))' }}>Queued Or Not Implemented</div>
                    <div className="mt-1 text-sm font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>TerraSketch, TerraPrint, TerraExport, TerraGIS Pro, Geo Equity, Appraisal GIS</div>
                    <div className="mt-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                      These surfaces are labeled honestly until separate runtime proof exists.
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
