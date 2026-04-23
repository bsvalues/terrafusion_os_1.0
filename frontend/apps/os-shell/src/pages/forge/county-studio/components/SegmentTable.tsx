import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountySegmentDto } from '../types/countyStudio.types';

type SortKey = keyof Pick<
  CountySegmentDto,
  'name' | 'parcelCount' | 'medianRatio' | 'cod' | 'prd' | 'stabilityScore' | 'riskScore' | 'exceptionCount'
>;

type SortDir = 'asc' | 'desc';

function stabilityColor(score: number): { bg: string; severity: string } {
  if (score < 60) return { bg: '#ef4444', severity: 'critical' };
  if (score < 80) return { bg: '#f59e0b', severity: 'warning' };
  return { bg: '#22c55e', severity: 'ok' };
}

function codColor(cod: number): string {
  if (cod > 20) return '#ef4444';
  if (cod > 15) return '#f59e0b';
  return '#22c55e';
}

function ratioColor(ratio: number): string {
  const delta = Math.abs(ratio - 1.0);
  if (delta > 0.1) return '#ef4444';
  if (delta > 0.05) return '#f59e0b';
  return 'hsl(var(--tf-fg))';
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
      padding: '6px 8px',
      fontSize: 11,
      fontWeight: 600,
      textAlign: 'left',
      color: 'hsl(var(--tf-muted))',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      background: 'hsl(var(--tf-bg))',
      borderBottom: '1px solid hsl(var(--tf-border))',
      userSelect: 'none',
    }}
  >
    {label}
    {currentSort === sortKey ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
  </th>
);

export function SegmentTable({ filter }: { filter?: (seg: CountySegmentDto) => boolean } = {}) {
  const { segments, selectedSegmentId, selectSegment, loadStatus, loadErrors } = useCountyStudioStore();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Loading skeleton — 6 shimmer rows while the segments request is in flight.
  // Distinguishes "still fetching" from "no data" so the user doesn't read
  // an empty state as a negative answer.
  if (loadStatus.segments === 'loading') {
    return (
      <div
        data-testid="segment-table-loading"
        role="status"
        aria-live="polite"
        aria-label="Loading segments"
        style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 22,
              borderRadius: 4,
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

  // Error state — show the captured error + let the user know how to recover.
  if (loadStatus.segments === 'error') {
    return (
      <div
        data-testid="segment-table-error"
        role="alert"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: '#ef4444', fontSize: 13, padding: 16, textAlign: 'center', gap: 8,
        }}
      >
        <div>Couldn't load segments.</div>
        <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          {loadErrors.segments ?? 'Unknown error'}
        </div>
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'hsl(var(--tf-muted))',
          fontSize: 13,
        }}
      >
        No segments loaded — open a study to begin.
      </div>
    );
  }

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...segments]
    .filter(filter ?? (() => true))
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const cols: { label: string; key: SortKey }[] = [
    { label: 'Segment', key: 'name' },
    { label: 'Parcels', key: 'parcelCount' },
    { label: 'Median Ratio', key: 'medianRatio' },
    { label: 'COD', key: 'cod' },
    { label: 'PRD', key: 'prd' },
    { label: 'Stability', key: 'stabilityScore' },
    { label: 'Exceptions', key: 'exceptionCount' },
    { label: 'Risk', key: 'riskScore' },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
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
          </tr>
        </thead>
        <tbody>
          {sorted.map((seg) => {
            const isSelected = seg.segmentId === selectedSegmentId;
            const { bg: stabBg, severity } = stabilityColor(seg.stabilityScore);

            return (
              <tr
                key={seg.segmentId}
                onClick={() => selectSegment(seg.segmentId)}
                style={{
                  background: isSelected ? 'hsl(var(--tf-surface))' : 'transparent',
                  cursor: 'pointer',
                  borderBottom: '1px solid hsl(var(--tf-border))',
                }}
              >
                <td style={{ padding: '7px 8px', fontWeight: isSelected ? 600 : 400 }}>
                  {seg.name}
                </td>
                <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>
                  {seg.parcelCount.toLocaleString()}
                </td>
                <td style={{ padding: '7px 8px', color: ratioColor(seg.medianRatio) }}>
                  {seg.medianRatio.toFixed(3)}
                </td>
                <td style={{ padding: '7px 8px', color: codColor(seg.cod) }}>
                  {seg.cod.toFixed(1)}
                </td>
                <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>
                  {seg.prd.toFixed(3)}
                </td>
                <td style={{ padding: '7px 8px' }}>
                  <span
                    data-testid="stability-chip"
                    data-severity={severity}
                    style={{
                      display: 'inline-block',
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: stabBg + '33',
                      color: stabBg,
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    {seg.stabilityScore}
                  </span>
                </td>
                <td style={{ padding: '7px 8px', color: seg.exceptionCount > 0 ? '#f59e0b' : 'hsl(var(--tf-muted))' }}>
                  {seg.exceptionCount}
                </td>
                <td style={{ padding: '7px 8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: seg.riskScore > 60 ? '#ef444433' : '#6b728033',
                      color: seg.riskScore > 60 ? '#ef4444' : 'hsl(var(--tf-muted))',
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    {seg.riskScore}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
