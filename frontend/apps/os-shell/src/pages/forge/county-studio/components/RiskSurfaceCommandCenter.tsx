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

const riskFilters: LedgerFilter[] = ['All', 'Critical', 'High', 'Medium', 'Low'];

const sortLabels: Record<LedgerSort, string> = {
  priority: 'Priority',
  risk: 'Risk',
  exposure: 'Exposure',
  type: 'Type',
};

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
  const segments = useCountyStudioStore((state) => state.segments);
  const selectedSegmentId = useCountyStudioStore((state) => state.selectedSegmentId);
  const focusRiskSurfaceMapObject = useCountyStudioStore((state) => state.focusRiskSurfaceMapObject);
  const drillToRiskSurfaceNeighborhood = useCountyStudioStore((state) => state.drillToRiskSurfaceNeighborhood);
  const commandCenter = useMemo(() => buildRiskSurfaceCommandCenter(segments), [segments]);

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
        <EmbeddedAtlasGisWorkspace onViewportChange={onAtlasViewportChange} />
      </div>

      <div
        data-testid="county-studio-bottom-analytics"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(360px, 1.05fr) minmax(360px, 0.95fr)',
          alignItems: 'stretch',
          minHeight: 260,
          borderBottom: '1px solid hsl(var(--tf-border))',
        }}
      >
        <div style={{ minHeight: 0, overflow: 'auto', borderRight: '1px solid hsl(var(--tf-border))' }}>
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
            gridTemplateRows: 'minmax(150px, 1fr) auto',
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
