// GeoForge v2 — Statistical Studio.
//
// Studio surface: audit queue left rail (260px) + full-width analytics studio (right).
// Map is a toggled position:absolute overlay. AI Copilot is an active advisory panel.
//
// The Studio exposes all 30 analytics panels via indexed section navigation.
// Sections: COUNTY | RATIO | SPATIAL | NEIGHBORHOOD | ADJUSTMENTS | COMPLIANCE
// Panels pull live Benton data via useGeoForgeStore (same store as v1).

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
import { ActionBar }        from './ActionBar';
import { AICopilotPanel }   from './AICopilotPanel';
import { SimulationDrawer } from './SimulationDrawer';
import { apiFetchJson } from '@/lib/apiBase';
import { useGeoForgeStore } from '@/stores/geoForgeStore';
import type { NeighborhoodStat, SalePoint } from '../types/geoforge.types';

// ── All 30 analytics panels ───────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════
// Workbench panel registry
// ═══════════════════════════════════════════════════════════════════════════

type SectionKey = 'county' | 'ratio' | 'spatial' | 'neighborhood' | 'adjust' | 'comply';

interface PanelDef {
  id: string;
  label: string;
  abbr: string;
  component: React.ComponentType;
  requiresNbhd?: boolean;
}

const SECTIONS: Record<SectionKey, { label: string; panels: PanelDef[] }> = {
  county: {
    label: 'County',
    panels: [
      { id: 'county-health',  label: 'County Health',        abbr: 'CH',  component: CountyHealthPanel },
      { id: 'nbhd-ranking',   label: 'Neighborhood Ranking', abbr: 'NR',  component: NeighborhoodRankingPanel },
      { id: 'assess-roll',    label: 'Assessment Roll',      abbr: 'AR',  component: AssessmentRollPanel },
      { id: 'levy-parity',    label: 'Levy Parity',          abbr: 'LP',  component: LevyParityPanel },
    ],
  },
  ratio: {
    label: 'Ratio Study',
    panels: [
      { id: 'year-trend',     label: 'Year Trend · MCA',     abbr: 'YT',  component: YearTrendPanel },
      { id: 'stratification', label: 'Stratification · IAAO',abbr: 'ST',  component: StratificationPanel },
      { id: 'dispersion',     label: 'Dispersion · COD/CV',  abbr: 'DS',  component: DispersionPanel },
      { id: 'weighted-mean',  label: 'Weighted Mean · AV',   abbr: 'WM',  component: WeightedMeanPanel },
      { id: 'monthly-ratio',  label: 'Monthly Ratio',        abbr: 'MR',  component: MonthlyRatioPanel },
      { id: 'time-adjust',    label: 'Time Adjustment',      abbr: 'TA',  component: TimeAdjustPanel },
      { id: 'sales-drill',    label: 'Sales Drilldown',      abbr: 'SD',  component: SalesDrillDownPanel },
    ],
  },
  spatial: {
    label: 'Spatial',
    panels: [
      { id: 'moran',          label: "Moran's I · LISA",     abbr: 'MI',  component: MoranPanel },
      { id: 'clustering',     label: 'K-means Clustering',   abbr: 'KM',  component: ClusteringPanel },
      { id: 'ratio-cliff',    label: 'Ratio Cliff Detection', abbr:'RC',  component: RatioCliffPanel },
      { id: 'value-strata',   label: 'Value Strata · PRB',   abbr: 'VS',  component: ValueStrataPanel },
    ],
  },
  neighborhood: {
    label: 'Neighborhood',
    panels: [
      { id: 'nbhd-detail',    label: 'Neighborhood Detail',  abbr: 'ND',  component: NeighborhoodDetailPanel,    requiresNbhd: true },
      { id: 'scorecard',      label: 'Scorecard · WAC',      abbr: 'SC',  component: NeighborhoodScorecardPanel, requiresNbhd: true },
      { id: 'outlier-review', label: 'Outlier Review',       abbr: 'OR',  component: OutlierReviewPanel,         requiresNbhd: true },
      { id: 'diagnosis',      label: 'AI Diagnosis',         abbr: 'DX',  component: DiagnosisPanel,             requiresNbhd: true },
      { id: 'sale-influence', label: 'Sale Influence · LOO', abbr: 'SI',  component: SaleInfluencePanel,         requiresNbhd: true },
      { id: 'data-quality',   label: 'Data Quality',         abbr: 'DQ',  component: DataQualityPanel },
      { id: 'comps',          label: 'Comps Grid',           abbr: 'CG',  component: CompsPanel },
    ],
  },
  adjust: {
    label: 'Adjustments',
    panels: [
      { id: 'adj-workbench',  label: 'Adjustment Workbench', abbr: 'AW',  component: AdjustmentWorkbenchPanel, requiresNbhd: true },
      { id: 'qual-decisions', label: 'Qual Decisions',       abbr: 'QD',  component: QualDecisionPanel },
      { id: 'comp-adj-grid',  label: 'Comp Adj Grid',        abbr: 'CA',  component: CompAdjGridPanel },
      { id: 'remedy-queue',   label: 'Remedy Queue',         abbr: 'RQ',  component: RemedyQueuePanel },
    ],
  },
  comply: {
    label: 'Compliance',
    panels: [
      { id: 'cert-checklist', label: 'Cert Checklist · DOR', abbr: 'CC',  component: CertificationChecklistPanel },
      { id: 'certification',  label: 'Certification',        abbr: 'CF',  component: CertificationPanel },
      { id: 'dor-memo',       label: 'DOR Memo · WAC 458',   abbr: 'DM',  component: DorMemoPanel },
      { id: 'export',         label: 'Export · CSV/DOR',     abbr: 'EX',  component: ExportPanel },
    ],
  },
};

const SECTION_KEYS = Object.keys(SECTIONS) as SectionKey[];

// ═══════════════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════════════

export function GeoForgeV2Page() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [taxYear] = useState(currentYear);
  const [selectedNbhd, setSelectedNbhd] = useState<string | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelTileProps | null>(null);
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState<number>(10);
  const [wbSection, setWbSection] = useState<SectionKey>('county');
  const [wbPanel, setWbPanel] = useState<string>('county-health');
  const [mapVisible, setMapVisible]     = useState(false);
  const [simOpen, setSimOpen]           = useState(false);
  const [simResult, setSimResult]       = useState<SimulateResult | null>(null);
  const [simInitPct, setSimInitPct]     = useState(0);

  // ── geoForgeStore bridge — v1 panels read from here ─────────────
  const {
    setFilter,
    setNeighborhoodStats,
    setSalePoints,
    setLoadingStats,
    setLoadingSales,
    selectNeighborhood,
  } = useGeoForgeStore();

  // ── Data queries (v2 audit surface) ─────────────────────────────
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

  // ── Data queries (v1 panel store feed) ─────────────────────────
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

  // ── Sync store ──────────────────────────────────────────────────
  useEffect(() => { setFilter({ taxYear }); }, [taxYear, setFilter]);
  useEffect(() => { setLoadingStats(statsLoading); }, [statsLoading, setLoadingStats]);
  useEffect(() => { setLoadingSales(salesLoading); }, [salesLoading, setLoadingSales]);
  useEffect(() => { if (statsData) setNeighborhoodStats(statsData); }, [statsData, setNeighborhoodStats]);
  useEffect(() => { if (salesData) setSalePoints(salesData); }, [salesData, setSalePoints]);

  useEffect(() => {
    selectNeighborhood(selectedNbhd, 'neighborhood-detail');
  }, [selectedNbhd, selectNeighborhood]);

  // ── Derived county mission metrics ──────────────────────────────
  // Nbhd count + total sales from neighborhood-stats (all 400+ nbhds).
  // Ratio/COD/grade from audit ranked (only rankable nbhds, n>=3 sales).
  const countyMission = useMemo(() => {
    const auditRows = auditQ.data?.filter(r => r.grade !== 'N') ?? [];
    const totalNbhds = statsData?.length ?? auditQ.data?.length ?? 0;
    const totalSales = statsData?.reduce((s, r) => s + (r.saleCount ?? 0), 0)
      ?? auditQ.data?.reduce((s, r) => s + r.saleCount, 0) ?? 0;
    if (totalNbhds === 0) return null;
    const rankableSales = auditRows.reduce((s, r) => s + r.saleCount, 0);
    const wMedRatio = rankableSales > 0 ? auditRows.reduce((s, r) => s + r.medianRatio * r.saleCount, 0) / rankableSales : 0;
    const wCod = rankableSales > 0 ? auditRows.reduce((s, r) => s + r.cod * r.saleCount, 0) / rankableSales : 0;
    const rows = auditRows;
    const passing = rows.filter(r => ['A','B','C'].includes(r.grade)).length;
    const failing = rows.filter(r => ['D','F'].includes(r.grade)).length;
    return { totalSales, wMedRatio, wCod, passing, failing, total: totalNbhds };
  }, [auditQ.data, statsData]);

  const selectedAudit: AuditRankedRow | null = useMemo(() =>
    selectedNbhd ? (auditQ.data?.find(r => r.neighborhoodCode === selectedNbhd) ?? null) : null,
    [selectedNbhd, auditQ.data]);

  // Auto-switch workbench section when neighborhood selected
  useEffect(() => {
    if (selectedNbhd && wbSection === 'county') {
      setWbSection('neighborhood');
      setWbPanel('nbhd-detail');
    }
  }, [selectedNbhd]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewport = useCallback((b: [number, number, number, number], z: number) => {
    setBbox(b); setZoom(z);
  }, []);

  const handleSectionChange = (s: SectionKey) => {
    setWbSection(s);
    setWbPanel(SECTIONS[s].panels[0].id);
  };

  const handleSimulateRecommended = useCallback((pct: number) => {
    setSimInitPct(pct);
    setSimOpen(true);
  }, []);

  const handleCommit = useCallback(() => {
    setWbSection('comply');
    setWbPanel('dor-memo');
  }, []);

  const handleFlagOutlier = useCallback(() => {
    setWbSection('neighborhood');
    setWbPanel('outlier-review');
  }, []);

  const handleDraftMemo = useCallback(() => {
    setWbSection('comply');
    setWbPanel('dor-memo');
  }, []);

  const currentPanelDef = useMemo(() => {
    for (const s of SECTION_KEYS) {
      const found = SECTIONS[s].panels.find(p => p.id === wbPanel);
      if (found) return found;
    }
    return SECTIONS.county.panels[0];
  }, [wbPanel]);

  const ActivePanel = currentPanelDef.component;

  return (
    <div className="geoforge-v2">

      {/* ── Top mission-control bar ─── */}
      <div className="gf2-topbar">
        <div className="gf2-topbar__brand">
          <span>GeoForge</span>
          <span className="gf2-topbar__brand-sub">Statistical Studio · Benton {taxYear}</span>
        </div>
        <div className="gf2-topbar__metrics">
          <Metric label="Neighborhoods" value={countyMission ? String(countyMission.total) : '—'} />
          <Metric label="Sales" value={countyMission ? countyMission.totalSales.toLocaleString() : '—'} />
          <Metric
            label="Median Ratio"
            value={countyMission ? countyMission.wMedRatio.toFixed(4) : '—'}
            tone={countyMission && countyMission.wMedRatio >= 0.90 && countyMission.wMedRatio <= 1.10 ? 'pass' : 'fail'}
          />
          <Metric
            label="COD"
            value={countyMission ? countyMission.wCod.toFixed(2) : '—'}
            tone={countyMission && countyMission.wCod <= 20 ? 'pass' : 'risk'}
          />
          <Metric
            label="Failing Nbhds"
            value={countyMission ? String(countyMission.failing) : '—'}
            tone={countyMission && countyMission.failing > 0 ? 'fail' : 'pass'}
          />
        </div>
      </div>

      {/* ── Left rail: Audit Queue ─── */}
      <div className="gf2-queue">
        <div className="gf2-queue__header">
          <div className="gf2-queue__eyebrow">Audit Queue</div>
          <div className="gf2-queue__title">AI-ranked</div>
          <div className="gf2-queue__hint">Impact × severity · click to audit</div>
        </div>
        <div className="gf2-queue__list">
          {auditQ.isLoading && <div className="gf2-loading">Scoring {taxYear} neighborhoods…</div>}
          {auditQ.data?.map((row) => (
            <AuditQueueRow
              key={row.neighborhoodCode}
              row={row}
              selected={row.neighborhoodCode === selectedNbhd}
              onClick={() => {
                setSelectedNbhd(row.neighborhoodCode);
                setSimResult(null);
              }}
            />
          ))}
          {auditQ.data?.length === 0 && <div className="gf2-empty">No audit findings.</div>}
        </div>
      </div>

      {/* ── Main studio surface ─── */}
      <div className="gf2-studio">

        {/* Studio header */}
        <div className="gf2-wb__header">
          <div className="gf2-wb__eyebrow">Statistical Studio</div>
          <div className="gf2-wb__title">
            {selectedNbhd
              ? `Nbhd ${selectedNbhd} · ${selectedAudit ? `Grade ${selectedAudit.grade}` : '…'}`
              : 'Benton County · All Neighborhoods'}
          </div>
          {selectedNbhd && (
            <button type="button" className="gf2-wb__clear" onClick={() => { setSelectedNbhd(null); setSimResult(null); }}>
              ✕ clear
            </button>
          )}
          <button
            className={`gf2-wb__map-toggle ${mapVisible ? 'gf2-wb__map-toggle--active' : ''}`}
            onClick={() => setMapVisible(v => !v)}
            title={mapVisible ? 'Hide map' : 'Show spatial map overlay'}
            type="button"
          >
            {mapVisible ? '⊡ Hide Map' : '⊞ Map'}
          </button>
        </div>

        {/* Section tabs */}
        <div className="gf2-wb__sections">
          {SECTION_KEYS.map((s) => (
            <button
              key={s}
              type="button"
              className={`gf2-wb__section-tab ${wbSection === s ? 'gf2-wb__section-tab--active' : ''}`}
              onClick={() => handleSectionChange(s)}
            >
              {SECTIONS[s].label}
            </button>
          ))}
        </div>

        {/* Panel nav within section */}
        <div className="gf2-wb__nav">
          {SECTIONS[wbSection].panels.map((p) => {
            const disabled = p.requiresNbhd && !selectedNbhd;
            return (
              <button
                key={p.id}
                type="button"
                className={`gf2-wb__nav-btn ${wbPanel === p.id ? 'gf2-wb__nav-btn--active' : ''} ${disabled ? 'gf2-wb__nav-btn--dim' : ''}`}
                onClick={() => !disabled && setWbPanel(p.id)}
                title={disabled ? 'Select a neighborhood first' : p.label}
              >
                <span className="gf2-wb__nav-abbr">{p.abbr}</span>
                <span className="gf2-wb__nav-label">{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Panel body — full width, full height */}
        <div className="gf2-wb__body">
          {currentPanelDef.requiresNbhd && !selectedNbhd ? (
            <div className="gf2-wb__select-prompt">
              Select a neighborhood from the audit queue to open this panel.
            </div>
          ) : (
            <ActivePanel />
          )}
        </div>
      </div>

      {/* ── Map overlay (toggled) ─── */}
      <div className={`gf2-map-overlay ${mapVisible ? 'gf2-map-overlay--visible' : ''}`}>
        <GeoForgeV2Map
          outlines={outlinesQ.data ?? null}
          parcels={zoom >= 12 ? parcelsQ.data ?? null : null}
          selectedNeighborhoodCode={selectedNbhd}
          onNeighborhoodClick={(code) => {
            setSelectedNbhd(code);
            setSimResult(null);
            setMapVisible(false);
          }}
          onParcelClick={(p) => setSelectedParcel(p)}
          onViewportChange={handleViewport}
        />
        {zoom < 13 && <div className="gf2-map__zoomhint">Zoom in to reveal parcels</div>}
        <MapLegend />
        {selectedParcel && (
          <ParcelAuditCard parcel={selectedParcel} onClose={() => setSelectedParcel(null)} />
        )}
      </div>

      {/* ── Simulation drawer (slides in from right) ─── */}
      <SimulationDrawer
        open={simOpen}
        taxYear={taxYear}
        selectedNbhd={selectedNbhd}
        initialPct={simInitPct}
        onClose={() => setSimOpen(false)}
        onResult={(r) => { setSimResult(r); setSimOpen(false); }}
      />

      {/* ── Action bar ─── */}
      <ActionBar
        selectedNbhd={selectedNbhd}
        simResult={simResult}
        onSimulate={() => setSimOpen(true)}
        onCommit={handleCommit}
        onFlagOutlier={handleFlagOutlier}
        onDraftMemo={handleDraftMemo}
      />

      {/* ── AI Copilot — active advisory panel ─── */}
      <AICopilotPanel
        selectedNbhd={selectedNbhd}
        auditRow={selectedAudit}
        countyMedianRatio={countyMission?.wMedRatio ?? null}
        countyCod={countyMission?.wCod ?? null}
        onSimulate={handleSimulateRecommended}
      />

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'pass' | 'risk' | 'fail' }) {
  const cls = tone === 'pass' ? 'gf2-metric__value--pass'
    : tone === 'risk' ? 'gf2-metric__value--risk'
    : tone === 'fail' ? 'gf2-metric__value--fail' : '';
  return (
    <div className="gf2-metric">
      <span className="gf2-metric__label">{label}</span>
      <span className={`gf2-metric__value ${cls}`}>{value}</span>
    </div>
  );
}

function AuditQueueRow({ row, selected, onClick }:
  { row: AuditRankedRow; selected: boolean; onClick: () => void }) {
  return (
    <div
      className={`gf2-queue__row ${selected ? 'gf2-queue__row--selected' : ''}`}
      onClick={onClick}
    >
      <div className={`gf2-grade-chip gf2-grade-chip--${row.grade}`}>{row.grade}</div>
      <div>
        <div className="gf2-queue__row-code">{row.neighborhoodCode}</div>
        <div className="gf2-queue__row-stats">
          <span>med {row.medianRatio.toFixed(3)}</span>
          <span>cod {row.cod.toFixed(1)}</span>
          <span>n={row.saleCount}</span>
        </div>
        <div className="gf2-queue__row-cause">{row.primaryCause.replace(/_/g, ' ')}</div>
        <div className="gf2-queue__row-diag">{row.actionLine}</div>
      </div>
    </div>
  );
}

function MapLegend() {
  return (
    <div className="gf2-map__legend">
      <div className="gf2-legend__title">Parcel ratio</div>
      {[
        { sw: 'hsl(140, 22%, 42%)', label: 'deep under < −10%' },
        { sw: 'hsl(140, 28%, 58%)', label: 'under −5 to −10%' },
        { sw: 'hsl(44, 16%, 92%)',  label: 'parity ±5%' },
        { sw: 'hsl(16, 55%, 66%)',  label: 'over +5 to +10%' },
        { sw: 'hsl(16, 62%, 48%)',  label: 'deep over > +10%' },
        { sw: 'hsl(42, 18%, 88%)',  label: 'no sale' },
      ].map((r) => (
        <div key={r.label} className="gf2-legend__row">
          <span className="gf2-legend__sw" style={{ background: r.sw }} />
          <span>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'pass' | 'risk' | 'fail' }) {
  const cls = tone === 'pass' ? 'gf2-stat__value--pass'
    : tone === 'risk' ? 'gf2-stat__value--risk'
    : tone === 'fail' ? 'gf2-stat__value--fail' : '';
  return (
    <div className="gf2-stat">
      <div className="gf2-stat__label">{label}</div>
      <div className={`gf2-stat__value ${cls}`}>{value}</div>
    </div>
  );
}

function ParcelAuditCard({ parcel, onClose }: { parcel: ParcelTileProps; onClose: () => void }) {
  const ratioTone: 'pass' | 'risk' | 'fail' | undefined =
    parcel.ratio == null ? undefined
    : parcel.ratio >= 0.95 && parcel.ratio <= 1.05 ? 'pass'
    : parcel.ratio >= 0.90 && parcel.ratio <= 1.10 ? 'risk' : 'fail';

  return (
    <div className="gf2-parcel-card">
      <button className="gf2-parcel-card__close" onClick={onClose} aria-label="close">×</button>
      <div className="gf2-parcel-card__eyebrow">Parcel Audit</div>
      <div className="gf2-parcel-card__id">{parcel.parcelId}</div>
      {parcel.situsAddress && <div className="gf2-parcel-card__addr">{parcel.situsAddress}</div>}

      <div className="gf2-stat-row">
        <Stat label="AV" value={`$${Math.round(parcel.assessedValue).toLocaleString()}`} />
        <Stat label="Class" value={parcel.propertyClass ?? '—'} />
        <Stat label="Nbhd" value={parcel.neighborhoodCode ?? '—'} />
      </div>

      <div className="gf2-kv"><span className="gf2-kv__label">Year built</span><span className="gf2-kv__value">{parcel.yearBuilt ?? '—'}</span></div>
      <div className="gf2-kv"><span className="gf2-kv__label">Area (ac)</span><span className="gf2-kv__value">{parcel.areaAcres ? parcel.areaAcres.toFixed(2) : '—'}</span></div>
      <div className="gf2-kv"><span className="gf2-kv__label">Last sale</span><span className="gf2-kv__value">{parcel.saleDate ? new Date(parcel.saleDate).toLocaleDateString() : '—'}</span></div>
      <div className="gf2-kv"><span className="gf2-kv__label">Price</span><span className="gf2-kv__value">{parcel.salePrice > 0 ? `$${Math.round(parcel.salePrice).toLocaleString()}` : '—'}</span></div>

      {parcel.ratio != null && (
        <div className="gf2-ai">
          <div className="gf2-ai__eyebrow">Ratio vs Nbhd</div>
          <div className={`gf2-stat__value ${ratioTone === 'pass' ? 'gf2-stat__value--pass' : ratioTone === 'fail' ? 'gf2-stat__value--fail' : 'gf2-stat__value--risk'}`}>
            {parcel.ratio.toFixed(4)}
          </div>
          <div className="gf2-ai__evidence">
            nbhd median {parcel.nbhdMedianRatio?.toFixed(4) ?? '—'} · dev {parcel.ratioDeviation ? (parcel.ratioDeviation >= 0 ? '+' : '') + parcel.ratioDeviation.toFixed(4) : '—'}
          </div>
          {parcel.isOutlier && <div className="gf2-ai__action">⚑ Flagged outlier — review candidate.</div>}
        </div>
      )}
    </div>
  );
}
