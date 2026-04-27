// frontend/apps/os-shell/src/pages/forge/county-studio/components/NeighborhoodRollupTable.tsx
//
// City → Neighborhood rollup, rendered at drillLevel === 'city'. Filtered to
// the store's selectedCity via client-side .filter() over the full
// neighborhoodRollup array. Row click drills to the neighborhood level.

import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { NeighborhoodRollupRowDto, RollupComplianceStatus } from '../types/countyStudio.types';

type SortKey = keyof Pick<
  NeighborhoodRollupRowDto,
  'neighborhoodCode' | 'segmentCount' | 'parcelCount' | 'medianRatio' | 'cod' | 'prd' | 'stabilityScore' | 'riskScore' | 'exceptionCount'
>;
type SortDir = 'asc' | 'desc';
type ComplianceFilter = 'all' | RollupComplianceStatus;

function ratioColor(ratio: number | null): string {
  if (ratio === null) return 'hsl(var(--tf-muted))';
  const delta = Math.abs(ratio - 1.0);
  if (delta > 0.1) return '#ef4444';
  if (delta > 0.05) return '#f59e0b';
  return 'hsl(var(--tf-fg))';
}

function codColor(cod: number | null): string {
  if (cod === null) return 'hsl(var(--tf-muted))';
  if (cod > 20) return '#ef4444';
  if (cod > 15) return '#f59e0b';
  return '#22c55e';
}

function stabilityColor(score: number): { bg: string; severity: string } {
  if (score < 60) return { bg: '#ef4444', severity: 'critical' };
  if (score < 80) return { bg: '#f59e0b', severity: 'warning' };
  return { bg: '#22c55e', severity: 'ok' };
}

function complianceStyle(status: RollupComplianceStatus): { bg: string; color: string; label: string } {
  switch (status) {
    case 'IaaoCompliant':      return { bg: '#22c55e33', color: '#22c55e', label: 'IAAO' };
    case 'MarginalCompliance': return { bg: '#f59e0b33', color: '#f59e0b', label: 'Marginal' };
    case 'NonCompliant':       return { bg: '#ef444433', color: '#ef4444', label: 'Non-compliant' };
  }
}

const Th = ({
  label,
  sortKey,
  currentSort,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) => (
  <th
    onClick={() => onSort(sortKey)}
    style={{
      padding: '6px 8px', fontSize: 11, fontWeight: 600, textAlign: 'left',
      color: 'hsl(var(--tf-muted))', cursor: 'pointer', whiteSpace: 'nowrap',
      background: 'hsl(var(--tf-bg))', borderBottom: '1px solid hsl(var(--tf-border))',
      userSelect: 'none',
    }}
  >
    {label}
    {currentSort === sortKey ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
  </th>
);

const PILLS: { key: ComplianceFilter; label: string }[] = [
  { key: 'all',                label: 'All' },
  { key: 'NonCompliant',       label: 'Non-compliant' },
  { key: 'MarginalCompliance', label: 'Marginal' },
  { key: 'IaaoCompliant',      label: 'Compliant' },
];

export function NeighborhoodRollupTable() {
  const { neighborhoodRollup, selectedCity, drillToNeighborhood, loadStatus, loadErrors } =
    useCountyStudioStore();
  const [sortKey, setSortKey] = useState<SortKey>('neighborhoodCode');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filter, setFilter] = useState<ComplianceFilter>('all');

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (loadStatus.neighborhoodRollup === 'loading') {
    return (
      <div
        data-testid="nbhd-rollup-loading"
        role="status"
        aria-live="polite"
        aria-label="Loading neighborhood rollup"
        style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 22, borderRadius: 4,
              background: 'linear-gradient(90deg, hsl(var(--tf-surface)) 0%, hsl(var(--tf-border)) 50%, hsl(var(--tf-surface)) 100%)',
              backgroundSize: '200% 100%',
              animation: 'tf-shimmer 1.4s ease-in-out infinite',
              opacity: 1 - i * 0.1,
            }}
          />
        ))}
        <style>{`@keyframes tf-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      </div>
    );
  }

  if (loadStatus.neighborhoodRollup === 'error') {
    return (
      <div
        data-testid="nbhd-rollup-error"
        role="alert"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: '#ef4444', fontSize: 13, padding: 16, textAlign: 'center', gap: 8,
        }}
      >
        <div>Couldn't load neighborhood rollup.</div>
        <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          {loadErrors.neighborhoodRollup ?? 'Unknown error'}
        </div>
      </div>
    );
  }

  const rowsForCity = selectedCity
    ? neighborhoodRollup.filter((r) => r.city === selectedCity)
    : neighborhoodRollup;

  if (rowsForCity.length === 0) {
    return (
      <div
        data-testid="nbhd-rollup-empty"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: 'hsl(var(--tf-muted))', fontSize: 13, gap: 6, padding: 24, textAlign: 'center',
        }}
      >
        <div>No neighborhoods for {selectedCity ?? 'this scope'}.</div>
        <div style={{ fontSize: 11 }}>
          Try deriving segment metrics (LeftRail → <strong>Derive Segment Metrics</strong>).
        </div>
      </div>
    );
  }

  const filtered = rowsForCity.filter((r) => filter === 'all' || r.complianceStatus === filter);
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const cols: { label: string; key: SortKey }[] = [
    { label: 'Neighborhood', key: 'neighborhoodCode' },
    { label: 'Segments',     key: 'segmentCount' },
    { label: 'Parcels',      key: 'parcelCount' },
    { label: 'Median',       key: 'medianRatio' },
    { label: 'COD',          key: 'cod' },
    { label: 'PRD',          key: 'prd' },
    { label: 'Stability',    key: 'stabilityScore' },
    { label: 'Risk',         key: 'riskScore' },
    { label: 'Exceptions',   key: 'exceptionCount' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        role="toolbar"
        aria-label="Neighborhood rollup compliance filter"
        style={{
          display: 'flex', gap: 6, padding: '8px 12px', flexShrink: 0,
          borderBottom: '1px solid hsl(var(--tf-border))',
        }}
      >
        {PILLS.map((p) => (
          <button
            key={p.key}
            onClick={() => setFilter(p.key)}
            data-testid={`nbhd-filter-${p.key}`}
            aria-pressed={filter === p.key}
            style={{
              fontSize: 11, padding: '3px 9px', borderRadius: 10,
              border: '1px solid hsl(var(--tf-border))',
              background: filter === p.key ? 'hsl(var(--tf-surface))' : 'transparent',
              color: filter === p.key ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
              fontWeight: filter === p.key ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              {cols.map((c) => (
                <Th
                  key={c.key}
                  label={c.label}
                  sortKey={c.key}
                  currentSort={sortKey}
                  dir={sortDir}
                  onSort={handleSort}
                />
              ))}
              <th style={{ padding: '6px 8px', fontSize: 11, color: 'hsl(var(--tf-muted))', background: 'hsl(var(--tf-bg))', borderBottom: '1px solid hsl(var(--tf-border))' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const badge = complianceStyle(row.complianceStatus);
              const { bg: stabBg, severity } = stabilityColor(row.stabilityScore);
              return (
                <tr
                  key={`${row.neighborhoodCode}:${row.revalArea ?? 'na'}`}
                  data-testid="nbhd-rollup-row"
                  onClick={() => drillToNeighborhood(row.city, row.neighborhoodCode, row.revalArea)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid hsl(var(--tf-border))',
                  }}
                >
                  <td style={{ padding: '7px 8px', fontWeight: 600 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ color: 'hsl(var(--tf-fg))' }}>
                        {row.neighborhoodName === row.neighborhoodCode
                          ? `Neighborhood ${row.neighborhoodCode}`
                          : row.neighborhoodName}
                      </span>
                      <span style={{ fontWeight: 400, fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
                        {row.city}
                        {row.revalArea !== null ? ` · Reval ${row.revalArea}` : ''}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>{row.segmentCount}</td>
                  <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>{row.parcelCount.toLocaleString()}</td>
                  <td style={{ padding: '7px 8px', color: ratioColor(row.medianRatio) }}>
                    {row.medianRatio === null ? '—' : row.medianRatio.toFixed(3)}
                  </td>
                  <td style={{ padding: '7px 8px', color: codColor(row.cod) }}>
                    {row.cod === null ? '—' : row.cod.toFixed(1)}
                  </td>
                  <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>
                    {row.prd === null ? '—' : row.prd.toFixed(3)}
                  </td>
                  <td style={{ padding: '7px 8px' }}>
                    <span
                      data-testid="nbhd-stability-chip"
                      data-severity={severity}
                      style={{
                        display: 'inline-block', padding: '1px 6px', borderRadius: 10,
                        background: stabBg + '33', color: stabBg,
                        fontWeight: 600, fontSize: 11,
                      }}
                    >
                      {row.stabilityScore.toFixed(0)}
                    </span>
                  </td>
                  <td style={{ padding: '7px 8px' }}>
                    <span
                      style={{
                        display: 'inline-block', padding: '1px 6px', borderRadius: 10,
                        background: row.riskScore > 60 ? '#ef444433' : '#6b728033',
                        color: row.riskScore > 60 ? '#ef4444' : 'hsl(var(--tf-muted))',
                        fontWeight: 600, fontSize: 11,
                      }}
                    >
                      {row.riskScore.toFixed(0)}
                    </span>
                  </td>
                  <td style={{ padding: '7px 8px', color: row.exceptionCount > 0 ? '#f59e0b' : 'hsl(var(--tf-muted))' }}>
                    {row.exceptionCount}
                  </td>
                  <td style={{ padding: '7px 8px' }}>
                    <span
                      data-testid="nbhd-compliance-chip"
                      data-status={row.complianceStatus}
                      style={{
                        display: 'inline-block', padding: '1px 6px', borderRadius: 10,
                        background: badge.bg, color: badge.color,
                        fontWeight: 600, fontSize: 11,
                      }}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
