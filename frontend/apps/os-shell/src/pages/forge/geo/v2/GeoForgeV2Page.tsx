// GeoForge v2 — Statistical Studio
// 3-column desktop layout: LeftPanel | Map | Analysis Panel
// No embedded copilot. No floating overlays. Map is the substrate.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GeoForgeV2Map } from './GeoForgeV2Map';
import {
  fetchAuditRanked,
  fetchNbhdOutlines,
  fetchParcelTiles,
  type AuditRankedRow,
  type ParcelTileProps,
  type SimulateResult,
} from './v2Api';
import { LeftPanel, type V2LayerId }   from './LeftPanel';
import { StatusBar }                    from './StatusBar';
import { SimulatePanel }               from './SimulatePanel';
import { useMapCtx }                   from './mapContext';
import { apiFetchJson }                from '@/lib/apiBase';
import { useGeoForgeStore }            from '@/stores/geoForgeStore';
import type { NeighborhoodStat, SalePoint } from '../types/geoforge.types';

// ── All analytics panels ──────────────────────────────────────────────────
import { CountyHealthPanel }           from '../panels/CountyHealthPanel';
import { NeighborhoodRankingPanel }    from '../panels/NeighborhoodRankingPanel';
import { AssessmentRollPanel }         from '../panels/AssessmentRollPanel';
import { LevyParityPanel }             from '../panels/LevyParityPanel';
import { YearTrendPanel }              from '../panels/YearTrendPanel';
import { StratificationPanel }         from '../panels/StratificationPanel';
import { DispersionPanel }             from '../panels/DispersionPanel';
import { WeightedMeanPanel }           from '../panels/WeightedMeanPanel';
import { MonthlyRatioPanel }           from '../panels/MonthlyRatioPanel';
import { TimeAdjustPanel }             from '../panels/TimeAdjustPanel';
import { SalesDrillDownPanel }         from '../panels/SalesDrillDownPanel';
import { MoranPanel }                  from '../panels/MoranPanel';
import { ClusteringPanel }             from '../panels/ClusteringPanel';
import { RatioCliffPanel }             from '../panels/RatioCliffPanel';
import { ValueStrataPanel }            from '../panels/ValueStrataPanel';
import { NeighborhoodDetailPanel }     from '../panels/NeighborhoodDetailPanel';
import { NeighborhoodScorecardPanel }  from '../panels/NeighborhoodScorecardPanel';
import { OutlierReviewPanel }          from '../panels/OutlierReviewPanel';
import { DiagnosisPanel }              from '../panels/DiagnosisPanel';
import { SaleInfluencePanel }          from '../panels/SaleInfluencePanel';
import { DataQualityPanel }            from '../panels/DataQualityPanel';
import { CompsPanel }                  from '../panels/CompsPanel';
import { AdjustmentWorkbenchPanel }    from '../panels/AdjustmentWorkbenchPanel';
import { QualDecisionPanel }           from '../panels/QualDecisionPanel';
import { CompAdjGridPanel }            from '../panels/CompAdjGridPanel';
import { RemedyQueuePanel }            from '../panels/RemedyQueuePanel';
import { CertificationChecklistPanel } from '../panels/CertificationChecklistPanel';
import { CertificationPanel }          from '../panels/CertificationPanel';
import { DorMemoPanel }                from '../panels/DorMemoPanel';
import { ExportPanel }                 from '../panels/ExportPanel';

import './geoforge-v2.css';

// ═══════════════════════════════════════════════════════════════
// Section + panel registry
// ═══════════════════════════════════════════════════════════════

type SectionKey = 'county' | 'ratio' | 'spatial' | 'neighborhood' | 'adjust' | 'comply';

interface PanelDef {
  id: string;
  label: string;
  component?: React.ComponentType;
  requiresNbhd?: boolean;
}

const SECTIONS: Record<SectionKey, { label: string; panels: PanelDef[] }> = {
  county: {
    label: 'County',
    panels: [
      { id: 'county-health',  label: 'County Health',    component: CountyHealthPanel },
      { id: 'nbhd-ranking',   label: 'Nbhd Ranking',     component: NeighborhoodRankingPanel },
      { id: 'assess-roll',    label: 'Assessment Roll',  component: AssessmentRollPanel },
      { id: 'levy-parity',    label: 'Levy Parity',      component: LevyParityPanel },
    ],
  },
  ratio: {
    label: 'Ratio Study',
    panels: [
      { id: 'year-trend',     label: '5-Year Trend',     component: YearTrendPanel },
      { id: 'stratification', label: 'Stratification',   component: StratificationPanel },
      { id: 'dispersion',     label: 'Dispersion',       component: DispersionPanel },
      { id: 'weighted-mean',  label: 'Weighted Mean',    component: WeightedMeanPanel },
      { id: 'monthly-ratio',  label: 'Monthly Ratio',    component: MonthlyRatioPanel },
      { id: 'time-adjust',    label: 'Time Adjustment',  component: TimeAdjustPanel },
      { id: 'sales-drill',    label: 'Sales Drilldown',  component: SalesDrillDownPanel },
    ],
  },
  spatial: {
    label: 'Spatial',
    panels: [
      { id: 'moran',          label: "Moran's I",        component: MoranPanel },
      { id: 'clustering',     label: 'Clustering',       component: ClusteringPanel },
      { id: 'ratio-cliff',    label: 'Ratio Cliffs',     component: RatioCliffPanel },
      { id: 'value-strata',   label: 'Value Strata',     component: ValueStrataPanel },
    ],
  },
  neighborhood: {
    label: 'Neighborhood',
    panels: [
      { id: 'nbhd-detail',    label: 'Detail',           component: NeighborhoodDetailPanel,    requiresNbhd: true },
      { id: 'scorecard',      label: 'Scorecard',        component: NeighborhoodScorecardPanel, requiresNbhd: true },
      { id: 'outlier-review', label: 'Outlier Review',   component: OutlierReviewPanel,         requiresNbhd: true },
      { id: 'diagnosis',      label: 'AI Diagnosis',     component: DiagnosisPanel,             requiresNbhd: true },
      { id: 'sale-influence', label: 'Sale Influence',   component: SaleInfluencePanel,         requiresNbhd: true },
      { id: 'data-quality',   label: 'Data Quality',     component: DataQualityPanel },
      { id: 'comps',          label: 'Comps Grid',       component: CompsPanel },
    ],
  },
  adjust: {
    label: 'Adjustments',
    panels: [
      { id: 'simulate',       label: 'Simulate' },   // no component — rendered specially below
      { id: 'adj-workbench',  label: 'Workbench',        component: AdjustmentWorkbenchPanel, requiresNbhd: true },
      { id: 'qual-decisions', label: 'Qual Decisions',   component: QualDecisionPanel },
      { id: 'comp-adj-grid',  label: 'Comp Grid',        component: CompAdjGridPanel },
      { id: 'remedy-queue',   label: 'Remedy Queue',     component: RemedyQueuePanel },
    ],
  },
  comply: {
    label: 'Compliance',
    panels: [
      { id: 'cert-checklist', label: 'DOR Checklist',    component: CertificationChecklistPanel },
      { id: 'certification',  label: 'Certification',    component: CertificationPanel },
      { id: 'dor-memo',       label: 'DOR Memo',         component: DorMemoPanel },
      { id: 'export',         label: 'Export',           component: ExportPanel },
    ],
  },
};

const SECTION_KEYS = Object.keys(SECTIONS) as SectionKey[];

// ═══════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════

export function GeoForgeV2Page() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [taxYear]              = useState(currentYear);
  const [selectedNbhd, setSelectedNbhd] = useState<string | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelTileProps | null>(null);
  const [bbox, setBbox]        = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom]        = useState<number>(10);
  const [wbSection, setWbSection] = useState<SectionKey>('county');
  const [wbPanel, setWbPanel]  = useState<string>('county-health');
  const [simResult, setSimResult] = useState<SimulateResult | null>(null);
  const [visibleLayers, setVisibleLayers] = useState<Set<V2LayerId>>(
    new Set(['nbhd', 'parcels', 'outliers']),
  );

  const mapCtxPayload = useMapCtx((s) => s.payload);
  const resetMapCtx   = useMapCtx((s) => s.reset);

  // ── geoForgeStore bridge — v1 panels read from here ──────────
  const {
    setFilter,
    setNeighborhoodStats,
    setSalePoints,
    setLoadingStats,
    setLoadingSales,
    selectNeighborhood,
  } = useGeoForgeStore();

  // ── Data queries ──────────────────────────────────────────────
  const outlinesQ = useQuery({
    queryKey: ['gf2-outlines', taxYear],
    queryFn: ({ signal }) => fetchNbhdOutlines(taxYear, signal),
    staleTime: 1000 * 60 * 10,
  });

  const auditQ = useQuery({
    queryKey: ['gf2-audit', taxYear],
    queryFn: ({ signal }) => fetchAuditRanked(taxYear, 500, signal),
    staleTime: 1000 * 60 * 5,
  });

  const parcelsQ = useQuery({
    queryKey: ['gf2-parcels', taxYear, bbox?.join(','), selectedNbhd],
    queryFn: ({ signal }) =>
      fetchParcelTiles({ taxYear, bbox: bbox ?? undefined, neighborhoodCode: selectedNbhd, limit: 3000, signal }),
    enabled: zoom >= 12,
    staleTime: 1000 * 30,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<NeighborhoodStat[]>({
    queryKey: ['gf2-nbhd-stats', taxYear],
    queryFn: () => apiFetchJson<NeighborhoodStat[]>(`/geoforge/ratio-study/neighborhood-stats?taxYear=${taxYear}`),
    staleTime: 1000 * 60 * 5,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery<SalePoint[]>({
    queryKey: ['gf2-sales', taxYear],
    queryFn: () => apiFetchJson<SalePoint[]>(`/geoforge/ratio-study/sales?taxYear=${taxYear}`),
    staleTime: 1000 * 60 * 10,
  });

  // ── Sync store ────────────────────────────────────────────────
  useEffect(() => { setFilter({ taxYear }); }, [taxYear, setFilter]);
  useEffect(() => { setLoadingStats(statsLoading); }, [statsLoading, setLoadingStats]);
  useEffect(() => { setLoadingSales(salesLoading); }, [salesLoading, setLoadingSales]);
  useEffect(() => { if (statsData) setNeighborhoodStats(statsData); }, [statsData, setNeighborhoodStats]);
  useEffect(() => { if (salesData) setSalePoints(salesData); }, [salesData, setSalePoints]);
  useEffect(() => { selectNeighborhood(selectedNbhd, 'neighborhood-detail'); }, [selectedNbhd, selectNeighborhood]);

  // Auto-advance to neighborhood section when a neighborhood is selected
  useEffect(() => {
    if (selectedNbhd && wbSection === 'county') {
      setWbSection('neighborhood');
      setWbPanel('nbhd-detail');
    }
  }, [selectedNbhd]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived metrics ───────────────────────────────────────────
  const countyMission = useMemo(() => {
    const auditRows = auditQ.data?.filter((r) => r.grade !== 'N') ?? [];
    const totalSales = statsData?.reduce((s, r) => s + (r.saleCount ?? 0), 0)
      ?? auditQ.data?.reduce((s, r) => s + r.saleCount, 0) ?? 0;
    if (auditRows.length === 0) return { totalSales, wMedRatio: 0, wCod: 0, failing: 0 };
    const wt = auditRows.reduce((s, r) => s + r.saleCount, 0);
    const wMedRatio = wt > 0 ? auditRows.reduce((s, r) => s + r.medianRatio * r.saleCount, 0) / wt : 0;
    const wCod      = wt > 0 ? auditRows.reduce((s, r) => s + r.cod * r.saleCount, 0) / wt : 0;
    const failing   = auditRows.filter((r) => ['D', 'F'].includes(r.grade)).length;
    return { totalSales, wMedRatio, wCod, failing };
  }, [auditQ.data, statsData]);

  const selectedAudit: AuditRankedRow | null = useMemo(() =>
    selectedNbhd ? (auditQ.data?.find((r) => r.neighborhoodCode === selectedNbhd) ?? null) : null,
    [selectedNbhd, auditQ.data],
  );

  // ── Handlers ──────────────────────────────────────────────────
  const handleNbhdSelect = useCallback((code: string) => {
    setSelectedNbhd(code);
    setSimResult(null);
    resetMapCtx();
  }, [resetMapCtx]);

  const handleLayerToggle = useCallback((id: V2LayerId) => {
    setVisibleLayers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleViewport = useCallback((b: [number, number, number, number], z: number) => {
    setBbox(b); setZoom(z);
  }, []);

  const handleSectionChange = (s: SectionKey) => {
    setWbSection(s);
    setWbPanel(SECTIONS[s].panels[0].id);
  };

  // ── Active panel resolution ───────────────────────────────────
  const currentPanelDef = useMemo(() => {
    for (const s of SECTION_KEYS) {
      const found = SECTIONS[s].panels.find((p) => p.id === wbPanel);
      if (found) return found;
    }
    return SECTIONS.county.panels[0];
  }, [wbPanel]);


  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="gf2-root bg-slate-950 text-slate-200">

      {/* Section tab bar — 40px, spans full width */}
      <nav className="gf2-tabs flex items-center gap-1 px-3 bg-slate-950 border-b border-slate-700/60">
        {SECTION_KEYS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleSectionChange(s)}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors
              ${wbSection === s
                ? 'bg-slate-700/80 text-cyan-400'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
          >
            {SECTIONS[s].label}
          </button>
        ))}
        <span className="ml-auto text-[10px] font-mono text-slate-600">{taxYear} · Benton County</span>
      </nav>

      {/* Left panel — layers + queue */}
      <div className="gf2-left overflow-hidden">
        <LeftPanel
          auditRows={auditQ.data ?? []}
          auditLoading={auditQ.isLoading}
          selectedNbhd={selectedNbhd}
          onNbhdSelect={handleNbhdSelect}
          visibleLayers={visibleLayers}
          onLayerToggle={handleLayerToggle}
        />
      </div>

      {/* Map — always the substrate */}
      <div className="gf2-map">
        <GeoForgeV2Map
          outlines={outlinesQ.data ?? null}
          parcels={zoom >= 12 ? parcelsQ.data ?? null : null}
          selectedNeighborhoodCode={selectedNbhd}
          mapCtx={mapCtxPayload}
          visibleLayers={visibleLayers}
          onNeighborhoodClick={handleNbhdSelect}
          onParcelClick={(p) => setSelectedParcel(p)}
          onViewportChange={handleViewport}
          initialViewport={{ center: [-119.3, 46.25], zoom: 10 }}
        />
        {selectedParcel && (
          <ParcelCard parcel={selectedParcel} onClose={() => setSelectedParcel(null)} />
        )}
        {zoom < 13 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-slate-900/80 backdrop-blur rounded px-3 py-1 text-[11px] text-slate-500 pointer-events-none">
            Zoom in to reveal parcels
          </div>
        )}
      </div>

      {/* Right analysis panel */}
      <div className="gf2-panel flex flex-col bg-slate-950 border-l border-slate-700/60 overflow-hidden">
        {/* Neighborhood context strip */}
        {selectedNbhd && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/60 border-b border-slate-700/40 flex-shrink-0">
            <span className="text-xs font-semibold text-slate-300">
              NBH-{selectedNbhd}
              {selectedAudit && (
                <span className={`ml-2 text-[10px] font-bold
                  ${['A','B'].includes(selectedAudit.grade) ? 'text-emerald-400'
                    : selectedAudit.grade === 'C' ? 'text-amber-400' : 'text-red-400'}`}>
                  Grade {selectedAudit.grade}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => { setSelectedNbhd(null); setSimResult(null); resetMapCtx(); }}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              clear ✕
            </button>
          </div>
        )}

        {/* Panel nav within section */}
        <div className="flex flex-wrap gap-1 px-2 py-1.5 border-b border-slate-700/40 bg-slate-900/30 flex-shrink-0">
          {SECTIONS[wbSection].panels.map((p) => {
            const disabled = !!p.requiresNbhd && !selectedNbhd;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => !disabled && setWbPanel(p.id)}
                title={disabled ? 'Select a neighborhood first' : p.label}
                className={`px-2 py-0.5 text-[11px] rounded transition-colors
                  ${wbPanel === p.id ? 'bg-slate-700 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}
                  ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-auto">
          {currentPanelDef.requiresNbhd && !selectedNbhd ? (
            <div className="flex items-center justify-center h-32 text-sm text-slate-600 text-center px-4">
              Select a neighborhood from the queue to open this panel.
            </div>
          ) : currentPanelDef.id === 'simulate' ? (
            <SimulatePanel onResult={setSimResult} />
          ) : currentPanelDef.component ? (
            (() => {
              const PanelComponent = currentPanelDef.component!;
              return <PanelComponent />;
            })()
          ) : null}
        </div>
      </div>

      {/* Status bar — 28px bottom strip */}
      <div className="gf2-status">
        <StatusBar
          totalSales={countyMission.totalSales}
          selectedNbhd={selectedNbhd}
          selectedGrade={selectedAudit?.grade ?? null}
          medianRatio={selectedAudit?.medianRatio ?? (countyMission.wMedRatio || null)}
          cod={selectedAudit?.cod ?? (countyMission.wCod || null)}
          simActive={!!simResult}
          failingNbhds={countyMission.failing}
        />
      </div>
    </div>
  );
}

// ── Parcel audit card (floating on map) ───────────────────────────────────

function StatLine({ label, value, tone }: { label: string; value: string; tone?: 'pass' | 'risk' | 'fail' }) {
  const cls = tone === 'pass' ? 'text-cyan-400' : tone === 'risk' ? 'text-amber-400' : tone === 'fail' ? 'text-red-400' : 'text-slate-300';
  return (
    <div className="flex justify-between items-baseline gap-3">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={`text-[12px] font-mono font-semibold ${cls}`}>{value}</span>
    </div>
  );
}

function ParcelCard({ parcel, onClose }: { parcel: ParcelTileProps; onClose: () => void }) {
  const ratioTone: 'pass' | 'risk' | 'fail' | undefined =
    parcel.ratio == null ? undefined
    : parcel.ratio >= 0.95 && parcel.ratio <= 1.05 ? 'pass'
    : parcel.ratio >= 0.90 && parcel.ratio <= 1.10 ? 'risk'
    : 'fail';

  return (
    <div className="absolute top-3 right-3 z-20 w-64 bg-slate-900/95 backdrop-blur rounded-lg border border-slate-700/60 p-3 shadow-xl space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Parcel Audit</div>
          <div className="text-xs font-mono text-slate-200 mt-0.5">{parcel.parcelId}</div>
          {parcel.situsAddress && <div className="text-[11px] text-slate-400 mt-0.5">{parcel.situsAddress}</div>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close parcel card"
          className="text-slate-500 hover:text-slate-300 flex-shrink-0 mt-0.5"
        >
          ×
        </button>
      </div>

      <div className="border-t border-slate-700/40 pt-2 space-y-1">
        <StatLine label="Assessed Value" value={`$${Math.round(parcel.assessedValue).toLocaleString()}`} />
        <StatLine label="Class" value={parcel.propertyClass ?? '—'} />
        <StatLine label="Nbhd" value={parcel.neighborhoodCode ?? '—'} />
        <StatLine label="Year Built" value={String(parcel.yearBuilt ?? '—')} />
        {parcel.saleDate && <StatLine label="Last Sale" value={new Date(parcel.saleDate).toLocaleDateString()} />}
        {parcel.salePrice > 0 && <StatLine label="Sale Price" value={`$${Math.round(parcel.salePrice).toLocaleString()}`} />}
      </div>

      {parcel.ratio != null && (
        <div className="border-t border-slate-700/40 pt-2 space-y-1">
          <StatLine label="Ratio" value={parcel.ratio.toFixed(4)} tone={ratioTone} />
          <StatLine label="Nbhd Median" value={parcel.nbhdMedianRatio?.toFixed(4) ?? '—'} />
          <StatLine
            label="Deviation"
            value={parcel.ratioDeviation ? (parcel.ratioDeviation >= 0 ? '+' : '') + parcel.ratioDeviation.toFixed(4) : '—'}
            tone={parcel.isOutlier ? 'fail' : undefined}
          />
          {parcel.isOutlier && (
            <div className="text-[10px] text-amber-400 font-semibold">⚑ Flagged outlier</div>
          )}
        </div>
      )}
    </div>
  );
}
