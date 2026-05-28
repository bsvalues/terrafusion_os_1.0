import React, { useMemo } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import {
  buildRiskSurfaceCommandCenter,
  type RiskLevel,
  type RiskSurfaceRow,
  type UnifiedRiskLedgerRow,
} from '../utils/riskSurfaces';

const riskColor: Record<RiskLevel, string> = {
  Critical: '#ef4444',
  High: '#f59e0b',
  Moderate: '#3b82f6',
  Healthy: '#22c55e',
};

function formatNumber(value: number | null, digits = 2): string {
  return value === null ? 'n/a' : value.toFixed(digits);
}

function BoardTable({ title, rows, empty }: { title: string; rows: RiskSurfaceRow[]; empty: string }) {
  return (
    <section
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
  onOpenEvidence,
}: {
  rows: UnifiedRiskLedgerRow[];
  onOpenEvidence: (row: UnifiedRiskLedgerRow) => void;
}) {
  return (
    <section style={{ minWidth: 0, overflowX: 'auto', borderTop: '1px solid hsl(var(--tf-border))' }}>
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
            {rows.slice(0, 8).map((row) => (
              <tr key={`${row.type}:${row.key}`} style={{ borderTop: '1px solid hsl(var(--tf-border))' }}>
                <td style={{ padding: '7px 10px', fontWeight: 800 }}>{row.rank}</td>
                <td style={{ padding: '7px 8px', fontWeight: 700 }}>{row.label}</td>
                <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>{row.type}</td>
                <td style={{ padding: '7px 8px', color: riskColor[row.riskLevel], fontWeight: 800 }}>
                  {row.riskLevel}
                </td>
                <td style={{ padding: '7px 8px' }}>{row.primaryReason}</td>
                <td style={{ padding: '7px 8px' }}>
                  <button
                    type="button"
                    aria-label={`${row.nextAction} for ${row.label}`}
                    onClick={() => onOpenEvidence(row)}
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

export function RiskSurfaceCommandCenter() {
  const segments = useCountyStudioStore((state) => state.segments);
  const drillToRiskSurfaceNeighborhood = useCountyStudioStore((state) => state.drillToRiskSurfaceNeighborhood);
  const commandCenter = useMemo(() => buildRiskSurfaceCommandCenter(segments), [segments]);

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
              border: '1px solid #f59e0b66',
              background: '#f59e0b14',
              color: '#f59e0b',
              fontSize: 11,
            }}
          >
            {commandCenter.contractGaps.join(' ')}
          </div>
        )}
      </div>

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
        <UnifiedRiskLedger rows={commandCenter.ledger} onOpenEvidence={openLedgerRow} />
      </div>
    </div>
  );
}
