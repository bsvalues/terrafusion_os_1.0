import React, { useMemo, useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import {
  buildRiskSurfaceCommandCenter,
  type RiskLevel,
  type RiskSurfaceRow,
  type UnifiedRiskLedgerRow,
} from '../utils/riskSurfaces';
import { EmbeddedAtlasGisWorkspace, type CountyStudioAtlasViewport } from './EmbeddedAtlasGisWorkspace';
import { BottomDeck } from './BottomDeck';
import { CountyHealthPanel } from './CountyHealthPanel';

const riskColor: Record<RiskLevel, string> = {
  Critical: 'hsl(var(--tf-danger, 0 84% 60%))',
  High: 'hsl(var(--tf-warning, 38 92% 50%))',
  Medium: 'hsl(var(--tf-accent, 217 91% 60%))',
  Low: 'hsl(var(--tf-success, 142 71% 45%))',
};

type LedgerFilter = 'All' | RiskLevel;
type LedgerSort = 'priority' | 'risk' | 'exposure' | 'type';
type PrometheusOperationalLensKey =
  | 'rollReadiness'
  | 'equityRisk'
  | 'modelDrift'
  | 'salesSupport'
  | 'spatialIntegrity'
  | 'appealExposure'
  | 'certificationRisk';

export interface PrometheusOperationalLens {
  key: PrometheusOperationalLensKey;
  label: string;
  mapLens: string;
  command: string;
  queueEmphasis: string;
  posture: string;
}

const riskFilters: LedgerFilter[] = ['All', 'Critical', 'High', 'Medium', 'Low'];

const sortLabels: Record<LedgerSort, string> = {
  priority: 'Priority',
  risk: 'Risk',
  exposure: 'Exposure',
  type: 'Type',
};

const PROMETHEUS_OPERATIONAL_LENSES: PrometheusOperationalLens[] = [
  {
    key: 'rollReadiness',
    label: 'Roll Readiness',
    mapLens: 'Roll Readiness',
    command: 'Roll posture, priority blockers, and defensibility',
    queueEmphasis: 'roll readiness and certification posture',
    posture: 'Benton County valuation health is being operated here.',
  },
  {
    key: 'equityRisk',
    label: 'Equity Risk',
    mapLens: 'Equity Risk',
    command: 'Horizontal equity, vertical equity, regressivity, and value-tier risk',
    queueEmphasis: 'equity failures and defensibility risk',
    posture: 'Find inequity before it reaches certification or appeal.',
  },
  {
    key: 'modelDrift',
    label: 'Model Drift',
    mapLens: 'Model Drift',
    command: 'Model groups, calibration drift, and stale valuation logic',
    queueEmphasis: 'model calibration and drift',
    posture: 'Route weak calibration before it becomes roll risk.',
  },
  {
    key: 'salesSupport',
    label: 'Sales Support',
    mapLens: 'Sales Support',
    command: 'Valid-sale support, sales deserts, and suspicious ratio clusters',
    queueEmphasis: 'sales support gaps and sales-validity concerns',
    posture: 'Separate valuation signal from weak or suspicious sale evidence.',
  },
  {
    key: 'spatialIntegrity',
    label: 'Spatial Integrity',
    mapLens: 'Spatial Integrity',
    command: 'Layer health, geometry confidence, joins, and map feed posture',
    queueEmphasis: 'spatial truth and layer health',
    posture: 'Validate spatial truth while TerraAtlas remains the GIS authority.',
  },
  {
    key: 'appealExposure',
    label: 'Appeal Exposure',
    mapLens: 'Appeal Exposure',
    command: 'Appeal concentration, public impact, and evidence readiness',
    queueEmphasis: 'appeal exposure and public-risk posture',
    posture: 'Identify where the county is exposed before taxpayers do.',
  },
  {
    key: 'certificationRisk',
    label: 'Certification Risk',
    mapLens: 'Certification Risk',
    command: 'Certification blockers, audit risk, and roll defensibility',
    queueEmphasis: 'certification blockers and evidence posture',
    posture: 'Decide whether the roll is defensible today.',
  },
];

function formatNumber(value: number | null, digits = 2): string {
  return value === null ? 'n/a' : value.toFixed(digits);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function BoardTable({ title, rows, empty }: { title: string; rows: RiskSurfaceRow[]; empty: string }) {
  return (
    <section
      data-testid={`risk-board-${slug(title.replace(' Risk', ''))}`}
      style={{
        minWidth: 0,
        overflowX: 'auto',
        borderTop: '1px solid hsl(var(--tf-border))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          borderBottom: '1px solid hsl(var(--tf-border))',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800 }}>{title}</h3>
        <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>{rows.length} objects</span>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '14px 10px', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>{empty}</div>
      ) : (
        <table style={{ width: '100%', minWidth: 520, borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ color: 'hsl(var(--tf-muted))', textAlign: 'left' }}>
              <th style={{ padding: '6px 10px', fontWeight: 700 }}>Object</th>
              <th style={{ padding: '6px 8px', fontWeight: 700 }}>Risk</th>
              <th style={{ padding: '6px 8px', fontWeight: 700 }}>COD</th>
              <th style={{ padding: '6px 8px', fontWeight: 700 }}>PRD</th>
              <th style={{ padding: '6px 8px', fontWeight: 700 }}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 4).map((row) => (
              <tr key={`${row.type}:${row.key}`} style={{ borderTop: '1px solid hsl(var(--tf-border))' }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>{row.label}</td>
                <td style={{ padding: '7px 8px', color: riskColor[row.riskLevel], fontWeight: 800 }}>
                  {row.riskLevel}
                </td>
                <td style={{ padding: '7px 8px' }}>{formatNumber(row.cod, 1)}</td>
                <td style={{ padding: '7px 8px' }}>{formatNumber(row.prd, 3)}</td>
                <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>{row.primaryReason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function UnifiedRiskLedger({
  rows,
  focusedSegmentId,
  onFocusMap,
  onOpenEvidence,
}: {
  rows: UnifiedRiskLedgerRow[];
  focusedSegmentId: string | null;
  onFocusMap: (row: UnifiedRiskLedgerRow) => void;
  onOpenEvidence: (row: UnifiedRiskLedgerRow) => void;
}) {
  const [filter, setFilter] = useState<LedgerFilter>('All');
  const [sort, setSort] = useState<LedgerSort>('priority');

  const visibleRows = useMemo(() => {
    const filtered = filter === 'All' ? rows : rows.filter((row) => row.riskLevel === filter);
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'risk':
          return b.riskScore - a.riskScore || a.rank - b.rank;
        case 'exposure':
          return b.parcelCount - a.parcelCount || b.riskScore - a.riskScore || a.rank - b.rank;
        case 'type':
          return a.type.localeCompare(b.type) || a.rank - b.rank;
        case 'priority':
        default:
          return a.rank - b.rank;
      }
    });
  }, [filter, rows, sort]);

  return (
    <section
      data-testid="unified-risk-ledger"
      style={{ minWidth: 0, overflowX: 'auto', borderTop: '1px solid hsl(var(--tf-border))' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          borderBottom: '1px solid hsl(var(--tf-border))',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800 }}>Unified Risk Ledger</h3>
        <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>county command queue</span>
      </div>
      {rows.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 8,
            padding: '8px 10px',
            borderBottom: '1px solid hsl(var(--tf-border))',
          }}
        >
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {riskFilters.map((item) => (
              <button
                key={item}
                type="button"
                data-testid={`risk-ledger-filter-${item.toLowerCase()}`}
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
                style={{
                  padding: '3px 7px',
                  border: '1px solid hsl(var(--tf-border))',
                  borderRadius: 4,
                  background: filter === item ? 'hsl(var(--tf-surface))' : 'transparent',
                  color: filter === item ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(Object.keys(sortLabels) as LedgerSort[]).map((item) => (
              <button
                key={item}
                type="button"
                data-testid={`risk-ledger-sort-${item}`}
                aria-pressed={sort === item}
                onClick={() => setSort(item)}
                style={{
                  padding: '3px 7px',
                  border: '1px solid hsl(var(--tf-border))',
                  borderRadius: 4,
                  background: sort === item ? 'hsl(var(--tf-surface))' : 'transparent',
                  color: sort === item ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {sortLabels[item]}
              </button>
            ))}
          </div>
        </div>
      )}
      {rows.length === 0 ? (
        <div style={{ padding: '14px 10px', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          No active segment risk evidence yet. Derive segment metrics to populate the county command queue.
        </div>
      ) : (
        <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ color: 'hsl(var(--tf-muted))', textAlign: 'left' }}>
              <th style={{ padding: '6px 10px', width: 44, fontWeight: 700 }}>Rank</th>
              <th style={{ padding: '6px 8px', fontWeight: 700 }}>Object</th>
              <th style={{ padding: '6px 8px', fontWeight: 700 }}>Type</th>
              <th style={{ padding: '6px 8px', fontWeight: 700 }}>Risk</th>
              <th style={{ padding: '6px 8px', fontWeight: 700 }}>Reason</th>
              <th style={{ padding: '6px 8px', fontWeight: 700 }}>Next Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={`${row.type}:${row.key}`}
                data-testid="risk-ledger-row"
                data-focused={row.evidenceSegmentId === focusedSegmentId ? 'true' : 'false'}
                onClick={() => onFocusMap(row)}
                style={{
                  borderTop: '1px solid hsl(var(--tf-border))',
                  cursor: 'pointer',
                  background: row.evidenceSegmentId === focusedSegmentId ? 'hsl(var(--tf-surface))' : 'transparent',
                }}
              >
                <td style={{ padding: '7px 10px', fontWeight: 800 }}>{row.rank}</td>
                <td data-testid="risk-ledger-object" style={{ padding: '7px 8px', fontWeight: 700 }}>{row.label}</td>
                <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>{row.type}</td>
                <td style={{ padding: '7px 8px', color: riskColor[row.riskLevel], fontWeight: 800 }}>
                  {row.riskLevel}
                </td>
                <td style={{ padding: '7px 8px' }}>{row.primaryReason}</td>
                <td style={{ padding: '7px 8px' }}>
                  <button
                    type="button"
                    aria-label={`${row.nextAction} for ${row.label}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenEvidence(row);
                    }}
                    style={{
                      padding: 0,
                      border: 0,
                      background: 'transparent',
                      color: 'hsl(var(--tf-accent))',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {row.nextAction}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

interface RiskSurfaceCommandCenterProps {
  onAtlasViewportChange?: (viewport: CountyStudioAtlasViewport) => void;
}

export function RiskSurfaceCommandCenter({ onAtlasViewportChange }: RiskSurfaceCommandCenterProps = {}) {
  const [activeLensKey, setActiveLensKey] = useState<PrometheusOperationalLensKey>('rollReadiness');
  const activeStudy = useCountyStudioStore((state) => state.activeStudy);
  const segments = useCountyStudioStore((state) => state.segments);
  const selectedSegmentId = useCountyStudioStore((state) => state.selectedSegmentId);
  const focusRiskSurfaceMapObject = useCountyStudioStore((state) => state.focusRiskSurfaceMapObject);
  const drillToRiskSurfaceNeighborhood = useCountyStudioStore((state) => state.drillToRiskSurfaceNeighborhood);
  const commandCenter = useMemo(() => buildRiskSurfaceCommandCenter(segments), [segments]);
  const activeLens = PROMETHEUS_OPERATIONAL_LENSES.find((lens) => lens.key === activeLensKey) ?? PROMETHEUS_OPERATIONAL_LENSES[0];

  const focusLedgerRow = (row: UnifiedRiskLedgerRow) => {
    const evidenceSegment = row.evidenceSegmentId
      ? segments.find((segment) => segment.segmentId === row.evidenceSegmentId) ?? null
      : null;
    const neighborhood = row.context.neighborhood ?? evidenceSegment?.geographyRef ?? null;
    focusRiskSurfaceMapObject(
      neighborhood,
      row.evidenceSegmentId,
      evidenceSegment?.revalArea ?? null,
    );
  };

  const openLedgerRow = (row: UnifiedRiskLedgerRow) => {
    const evidenceSegment = row.evidenceSegmentId
      ? segments.find((segment) => segment.segmentId === row.evidenceSegmentId) ?? null
      : null;
    const neighborhood = row.context.neighborhood ?? evidenceSegment?.geographyRef ?? null;
    if (!neighborhood) return;
    drillToRiskSurfaceNeighborhood(
      neighborhood,
      evidenceSegment?.revalArea ?? null,
      row.evidenceSegmentId,
    );
  };

  if (!activeStudy && segments.length === 0) {
    return (
      <div
        data-testid="prometheus-empty-study-state"
        style={{
          padding: 18,
          borderBottom: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-bg))',
          color: 'hsl(var(--tf-fg))',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 900 }}>Open a County Studio study</h2>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'hsl(var(--tf-muted))', lineHeight: 1.45 }}>
          County Studio does not present an operational map without a study. Open or create a study to load Benton
          valuation risk, Atlas geometry, ledger evidence, and downstream workbench context.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="risk-surface-command-center" style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-surface))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 900 }}>County Health Risk Surfaces</h2>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
              Organized by how valuation decisions are made, corrected, and defended.
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
            <div>{segments.length} segments</div>
            <div>{commandCenter.ledger.length} risk objects</div>
          </div>
        </div>
        <div
          data-testid="prometheus-operational-lens-selector"
          role="toolbar"
          aria-label="County Studio operational risk lens"
          style={{ marginTop: 10, display: 'flex', alignItems: 'stretch', gap: 6, flexWrap: 'wrap' }}
        >
          {PROMETHEUS_OPERATIONAL_LENSES.map((lens) => (
            <button
              key={lens.key}
              type="button"
              aria-label={`${lens.label} lens`}
              aria-pressed={activeLens.key === lens.key}
              onClick={() => setActiveLensKey(lens.key)}
              style={{
                padding: '6px 9px',
                border: '1px solid hsl(var(--tf-border))',
                borderRadius: 4,
                background: activeLens.key === lens.key ? 'hsl(var(--tf-accent, 217 91% 60%) / 0.16)' : 'transparent',
                color: activeLens.key === lens.key ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {lens.label}
            </button>
          ))}
          <div
            data-testid="prometheus-active-lens"
            style={{
              flex: '1 1 260px',
              minWidth: 240,
              padding: '6px 9px',
              border: '1px solid hsl(var(--tf-border))',
              borderRadius: 4,
              fontSize: 11,
              color: 'hsl(var(--tf-muted))',
              background: 'hsl(var(--tf-bg))',
            }}
          >
            <strong style={{ color: 'hsl(var(--tf-fg))' }}>{activeLens.label}</strong> · {activeLens.command}
          </div>
        </div>
        {commandCenter.contractGaps.length > 0 && (
          <div
            data-testid="risk-surface-contract-gaps"
            style={{
              marginTop: 8,
              padding: '7px 8px',
              border: '1px solid hsl(var(--tf-warning, 38 92% 50%) / 0.42)',
              background: 'hsl(var(--tf-warning, 38 92% 50%) / 0.14)',
              color: 'hsl(var(--tf-warning, 38 92% 50%))',
              fontSize: 11,
            }}
          >
            {commandCenter.contractGaps.join(' ')}
          </div>
        )}
      </div>

      <div
        data-testid="county-studio-gis-stage"
        style={{
          minHeight: 0,
          overflow: 'hidden',
          flexShrink: 0,
          borderBottom: '1px solid hsl(var(--tf-border))',
        }}
      >
        <EmbeddedAtlasGisWorkspace onViewportChange={onAtlasViewportChange} roleLens={activeLens} />
      </div>

      <div
        data-testid="county-studio-bottom-analytics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(360px, 1.05fr) minmax(360px, 0.95fr)',
          alignItems: 'stretch',
          minHeight: 154,
          maxHeight: 174,
          borderBottom: '1px solid hsl(var(--tf-border))',
        }}
      >
        <div style={{ minHeight: 0, overflow: 'auto', borderRight: '1px solid hsl(var(--tf-border))' }}>
          <div
            data-testid="prometheus-command-queue"
            style={{
              padding: '8px 10px',
              borderTop: '1px solid hsl(var(--tf-border))',
              borderBottom: '1px solid hsl(var(--tf-border))',
              background: 'hsl(var(--tf-surface))',
              fontSize: 11,
              color: 'hsl(var(--tf-muted))',
            }}
          >
            <strong style={{ color: 'hsl(var(--tf-fg))' }}>{activeLens.label} command queue:</strong>{' '}
            Unified Risk Ledger tuned to {activeLens.queueEmphasis}. {activeLens.posture}
            <div style={{ display: 'grid', gap: 4, marginTop: 6 }}>
              {commandCenter.ledger.slice(0, 2).map((row) => (
                <button
                  key={`${row.type}:${row.key}:queue`}
                  type="button"
                  data-testid="prometheus-command-queue-item"
                  onClick={() => focusLedgerRow(row)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '76px minmax(120px, 1fr) minmax(130px, 1fr)',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 7px',
                    border: '1px solid hsl(var(--tf-border))',
                    borderRadius: 4,
                    background: 'hsl(var(--tf-bg))',
                    color: 'hsl(var(--tf-fg))',
                    fontSize: 10,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ color: riskColor[row.riskLevel], fontWeight: 900 }}>{row.riskLevel}</span>
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 800 }}>
                    {row.label}
                  </span>
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'hsl(var(--tf-muted))' }}>
                    {row.primaryReason} · {row.nextAction}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <UnifiedRiskLedger
            rows={commandCenter.ledger}
            focusedSegmentId={selectedSegmentId}
            onFocusMap={focusLedgerRow}
            onOpenEvidence={openLedgerRow}
          />
        </div>
        <div
          data-testid="county-studio-bottom-deck"
          style={{
            minHeight: 0,
            display: 'grid',
            gridTemplateRows: 'minmax(92px, 1fr) auto',
            overflow: 'hidden',
          }}
        >
          <BottomDeck />
        </div>
      </div>

      <div
        data-testid="county-operational-scope-note"
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid hsl(var(--tf-border))',
          background: 'hsl(var(--tf-bg))',
          fontSize: 11,
          color: 'hsl(var(--tf-muted))',
        }}
      >
        County Studio opens by how valuation decisions are made and defended: reval cycles, neighborhoods, model groups, districts, value tiers, and parcel evidence.
      </div>

      <CountyHealthPanel />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          alignItems: 'start',
        }}
      >
        <BoardTable
          title="Revaluation Cycle Risk"
          rows={commandCenter.boards.revaluationCycles}
          empty="No revaluation-cycle metadata is available on active segments."
        />
        <BoardTable
          title="Neighborhood Risk"
          rows={commandCenter.boards.neighborhoods}
          empty="No neighborhood evidence is available on active segments."
        />
        <BoardTable
          title="Model Group Risk"
          rows={commandCenter.boards.modelGroups}
          empty="No model group or building-type evidence is available on active segments."
        />
        <BoardTable
          title="Taxing District Exposure"
          rows={commandCenter.boards.districtExposure}
          empty="No taxing district field is available on active segments."
        />
        <BoardTable
          title="Value Tier Equity"
          rows={commandCenter.boards.valueTiers}
          empty="No value tier field is available on active segments."
        />
      </div>
    </div>
  );
}
