// frontend/apps/os-shell/src/pages/forge/county-studio/components/CityRollupTable.tsx
//
// County → City rollup, rendered at drillLevel === 'county'. Visual language
// matches SegmentTable (same Th, color scales, stability chip) so the three
// tables in the drill lattice feel like one family.
//
// Clicking a row advances the drill to that city via drillToCity.
// Filter pills above the table narrow by IAAO ComplianceStatus.

import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CityRollupRowDto, RollupComplianceStatus } from '../types/countyStudio.types';
import {
  formatOperationalPrimary,
  parseSegmentIdentity,
} from '../utils/segmentIdentity';

type SortKey = keyof Pick<
  CityRollupRowDto,
  'city' | 'segmentCount' | 'parcelCount' | 'medianRatio' | 'cod' | 'prd' | 'exceptionCount' | 'exceptionRate'
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

export function CityRollupTable() {
  const { cityRollup, drillToCity, loadStatus, loadErrors } = useCountyStudioStore();
  const [sortKey, setSortKey] = useState<SortKey>('city');
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

  // Loading skeleton.
  if (loadStatus.cityRollup === 'loading') {
    return (
      <div
        data-testid="city-rollup-loading"
        role="status"
        aria-live="polite"
        aria-label="Loading city rollup"
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

  if (loadStatus.cityRollup === 'error') {
    return (
      <div
        data-testid="city-rollup-error"
        role="alert"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: '#ef4444', fontSize: 13, padding: 16, textAlign: 'center', gap: 8,
        }}
      >
        <div>Couldn't load city rollup.</div>
        <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          {loadErrors.cityRollup ?? 'Unknown error'}
        </div>
      </div>
    );
  }

  if (cityRollup.length === 0) {
    return (
      <div
        data-testid="city-rollup-empty"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: 'hsl(var(--tf-muted))', fontSize: 13, gap: 6, padding: 24, textAlign: 'center',
        }}
      >
        <div>No segments derived yet.</div>
        <div style={{ fontSize: 11 }}>
          Go to LeftRail → <strong>Derive Segment Metrics</strong> to populate the drill lattice.
        </div>
      </div>
    );
  }

  const filtered = cityRollup.filter((r) => filter === 'all' || r.complianceStatus === filter);
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
    { label: 'City',       key: 'city' },
    { label: 'Segments',   key: 'segmentCount' },
    { label: 'Parcels',    key: 'parcelCount' },
    { label: 'Median',     key: 'medianRatio' },
    { label: 'COD',        key: 'cod' },
    { label: 'PRD',        key: 'prd' },
    { label: 'Exceptions', key: 'exceptionCount' },
    { label: 'Exc. Rate',  key: 'exceptionRate' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Compliance filter row */}
      <div
        role="toolbar"
        aria-label="City rollup compliance filter"
        style={{
          display: 'flex', gap: 6, padding: '8px 12px', flexShrink: 0,
          borderBottom: '1px solid hsl(var(--tf-border))',
        }}
      >
        {PILLS.map((p) => (
          <button
            key={p.key}
            onClick={() => setFilter(p.key)}
            data-testid={`city-filter-${p.key}`}
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
              <th style={{ padding: '6px 8px', fontSize: 11, color: 'hsl(var(--tf-muted))', background: 'hsl(var(--tf-bg))', borderBottom: '1px solid hsl(var(--tf-border))' }}>
                Worst Segment (Reval / Neighborhood)
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const badge = complianceStyle(row.complianceStatus);
              const worstSegment = row.worstSegmentName
                ? parseSegmentIdentity(row.worstSegmentName, {
                    neighborhoodCode: row.worstSegmentNeighborhoodCode,
                    revalArea: row.worstSegmentRevalArea,
                    buildingType: row.worstSegmentBuildingType,
                    qualityGrade: row.worstSegmentQualityGrade,
                  })
                : null;
              const worstSegmentLabel = worstSegment ? formatOperationalPrimary(worstSegment) : row.worstSegmentName;
              return (
                <tr
                  key={row.city}
                  data-testid="city-rollup-row"
                  onClick={() => drillToCity(row.city)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid hsl(var(--tf-border))',
                  }}
                >
                  <td style={{ padding: '7px 8px', fontWeight: 600 }}>{row.city}</td>
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
                  <td style={{ padding: '7px 8px', color: row.exceptionCount > 0 ? '#f59e0b' : 'hsl(var(--tf-muted))' }}>
                    {row.exceptionCount}
                  </td>
                  <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>
                    {(row.exceptionRate * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '7px 8px' }}>
                    <span
                      data-testid="city-compliance-chip"
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
                  <td style={{ padding: '7px 8px', fontSize: 11, color: 'hsl(var(--tf-muted))', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.worstSegmentName ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ color: 'hsl(var(--tf-fg))' }}>
                          {worstSegmentLabel}
                        </span>
                        {row.worstSegmentMedianRatio !== null && (
                          <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
                            <span style={{ color: ratioColor(row.worstSegmentMedianRatio) }}>
                              ({row.worstSegmentMedianRatio.toFixed(3)})
                            </span>
                          </span>
                        )}
                      </div>
                    ) : '—'}
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
