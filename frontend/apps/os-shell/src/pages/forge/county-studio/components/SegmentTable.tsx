import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountySegmentDto } from '../types/countyStudio.types';
import {
  formatOperationalDescriptor,
  formatOperationalPrimary,
  parseSegmentIdentity,
} from '../utils/segmentIdentity';

type SortKey = keyof Pick<
  CountySegmentDto,
  | 'name'
  | 'parcelCount'
  | 'ratioCount'
  | 'medianRatio'
  | 'cod'
  | 'prd'
  | 'prb'
  | 'weightedMeanRatio'
  | 'yoyMedianRatioDelta'
  | 'stabilityScore'
  | 'riskScore'
  | 'exceptionCount'
>;

type SortDir = 'asc' | 'desc';

function stabilityColor(score: number): { bg: string; severity: string } {
  if (score < 60) return { bg: '#ef4444', severity: 'critical' };
  if (score < 80) return { bg: '#f59e0b', severity: 'warning' };
  return { bg: '#22c55e', severity: 'ok' };
}

function codColor(cod: number | null): string {
  if (cod === null) return 'hsl(var(--tf-muted))';
  if (cod > 20) return '#ef4444';
  if (cod > 15) return '#f59e0b';
  return '#22c55e';
}

function ratioColor(ratio: number | null): string {
  if (ratio === null) return 'hsl(var(--tf-muted))';
  const delta = Math.abs(ratio - 1.0);
  if (delta > 0.1) return '#ef4444';
  if (delta > 0.05) return '#f59e0b';
  return 'hsl(var(--tf-fg))';
}

function prbColor(prb: number | null | undefined): string {
  if (prb === null || prb === undefined) return 'hsl(var(--tf-muted))';
  const abs = Math.abs(prb);
  if (abs > 0.1) return '#ef4444';
  if (abs > 0.05) return '#f59e0b';
  return '#22c55e';
}

function yoyColor(delta: number | null | undefined): string {
  if (delta === null || delta === undefined) return 'hsl(var(--tf-muted))';
  const abs = Math.abs(delta);
  if (abs > 0.05) return '#ef4444';
  if (abs > 0.03) return '#f59e0b';
  return '#22c55e';
}

function sampleHealth(seg: CountySegmentDto): { label: string; severity: 'ok' | 'thin' | 'none' } {
  const sample = seg.ratioCount ?? seg.salesCount ?? 0;
  if (sample >= 30) return { label: 'Healthy', severity: 'ok' };
  if (sample > 0) return { label: 'Thin', severity: 'thin' };
  return { label: 'No sales', severity: 'none' };
}

/** Safe numeric formatter — renders em-dash for null/undefined. */
function fmt(value: number | null | undefined, digits: number): string {
  if (value === null || value === undefined) return '—';
  return value.toFixed(digits);
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
  const {
    activeStudy,
    segments,
    selectedSegmentId,
    selectSegment,
    loadStatus,
    loadErrors,
  } = useCountyStudioStore();
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
    const needsDerive = !!activeStudy && !activeStudy.activeSegmentSetId;
    const emptyMessage = !activeStudy
      ? 'No segments loaded — open a study to begin.'
      : needsDerive
        ? 'No active segment set yet — use Derive Segment Metrics in the left rail.'
        : 'The active segment set returned no rows for this scope.';
    return (
      <div
        data-testid={needsDerive ? 'segment-table-empty-derive' : 'segment-table-empty'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'hsl(var(--tf-muted))',
          fontSize: 13,
          padding: 16,
          textAlign: 'center',
        }}
      >
        {emptyMessage}
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
      // Null/undefined sort to the end regardless of direction so sparse-sample
      // segments don't collide with real values at the top of the column.
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const cols: { label: string; key: SortKey }[] = [
    { label: 'Segment (Reval / Neighborhood)', key: 'name' },
    { label: 'Parcels', key: 'parcelCount' },
    { label: 'Sales', key: 'ratioCount' },
    { label: 'Median Ratio', key: 'medianRatio' },
    { label: 'COD', key: 'cod' },
    { label: 'PRD', key: 'prd' },
    { label: 'PRB', key: 'prb' },
    { label: 'Wtd Mean', key: 'weightedMeanRatio' },
    { label: 'YoY Δ', key: 'yoyMedianRatioDelta' },
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
            const identity = parseSegmentIdentity(seg.name, {
              neighborhoodCode: seg.geographyRef,
              revalArea: seg.revalArea,
              buildingType: seg.buildingType,
              qualityGrade: seg.qualityGrade,
            });
            const scopeLabel = formatOperationalPrimary(identity);
            const descriptor = formatOperationalDescriptor(identity);
            const sample = sampleHealth(seg);
            const sampleColor =
              sample.severity === 'ok' ? '#22c55e' :
              sample.severity === 'thin' ? '#f59e0b' :
              '#ef4444';

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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ color: 'hsl(var(--tf-fg))' }}>
                      {scopeLabel}
                    </span>
                    <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
                      {seg.segmentType}
                      {descriptor ? ` · ${descriptor}` : ''}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>
                  {seg.parcelCount.toLocaleString()}
                </td>
                <td style={{ padding: '7px 8px' }}>
                  <span
                    data-testid="sample-health-chip"
                    data-severity={sample.severity}
                    title={`${seg.ratioCount ?? seg.salesCount ?? 0} qualified sale-ratio observations`}
                    style={{
                      display: 'inline-block',
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: sampleColor + '33',
                      color: sampleColor,
                      fontWeight: 600,
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {(seg.ratioCount ?? seg.salesCount ?? 0).toLocaleString()} · {sample.label}
                  </span>
                </td>
                <td style={{ padding: '7px 8px', color: ratioColor(seg.medianRatio) }}>
                  {fmt(seg.medianRatio, 3)}
                </td>
                <td style={{ padding: '7px 8px', color: codColor(seg.cod) }}>
                  {fmt(seg.cod, 1)}
                </td>
                <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>
                  {fmt(seg.prd, 3)}
                </td>
                <td style={{ padding: '7px 8px', color: prbColor(seg.prb) }}>
                  {fmt(seg.prb, 3)}
                </td>
                <td style={{ padding: '7px 8px', color: 'hsl(var(--tf-muted))' }}>
                  {fmt(seg.weightedMeanRatio, 3)}
                </td>
                <td style={{ padding: '7px 8px', color: yoyColor(seg.yoyMedianRatioDelta) }}>
                  {seg.yoyMedianRatioDelta == null
                    ? '—'
                    : `${seg.yoyMedianRatioDelta >= 0 ? '+' : ''}${seg.yoyMedianRatioDelta.toFixed(3)}`}
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
