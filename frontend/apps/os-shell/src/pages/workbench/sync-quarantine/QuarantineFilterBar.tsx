/**
 * SYNC-UX-1A: sticky filter bar for the quarantine triage page.
 *
 * Four controls:
 *   - Reason (5 closed values + All)
 *   - Universe (7 universes + All)
 *   - PropId (numeric input, clearable)
 *   - Status (Open / Routed / Dismissed / All — client-only filter)
 *
 * Styling matches the doctrine console's ConfigBar: tf-* classes,
 * borders via --tf-border, no shadcn for now (the existing console
 * uses raw inputs and labels; matching that for visual consistency).
 */

import React from 'react';
import {
  DismissalReasons as _DismissalReasons,
  QuarantineReasons,
  TriageStatuses,
  UniverseCodes,
  type QuarantineReason,
  type TriageStatus,
  type UniverseCode,
} from '@/api/syncQuarantine';

void _DismissalReasons; // re-export anchor for any future expansion

export interface QuarantineFilterValue {
  reason: QuarantineReason | '';
  universe: UniverseCode | '';
  propId: number | null;
  status: TriageStatus | 'All';
}

interface QuarantineFilterBarProps {
  value: QuarantineFilterValue;
  onChange: (next: QuarantineFilterValue) => void;
  disabled?: boolean;
}

export default function QuarantineFilterBar({
  value,
  onChange,
  disabled,
}: QuarantineFilterBarProps): React.ReactElement {
  return (
    <div
      data-testid='quarantine-filter-bar'
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        padding: '8px 0',
        borderTop: '1px solid var(--tf-border)',
        borderBottom: '1px solid var(--tf-border)',
        background: 'var(--tf-bg, transparent)',
      }}
    >
      <label style={{ fontSize: '0.8rem' }} className='tf-text-secondary'>
        Reason
        <select
          aria-label='Filter by quarantine reason'
          data-testid='filter-reason'
          value={value.reason}
          onChange={(e) =>
            onChange({ ...value, reason: e.target.value as QuarantineReason | '' })
          }
          disabled={disabled}
          className='tf-text'
          style={{
            display: 'block',
            width: '100%',
            marginTop: 2,
            padding: '4px 6px',
            background: 'transparent',
            border: '1px solid var(--tf-border)',
            borderRadius: 3,
            fontSize: '0.85rem',
          }}
        >
          <option value=''>All reasons</option>
          {QuarantineReasons.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <label style={{ fontSize: '0.8rem' }} className='tf-text-secondary'>
        Universe
        <select
          aria-label='Filter by universe'
          data-testid='filter-universe'
          value={value.universe}
          onChange={(e) =>
            onChange({ ...value, universe: e.target.value as UniverseCode | '' })
          }
          disabled={disabled}
          className='tf-text'
          style={{
            display: 'block',
            width: '100%',
            marginTop: 2,
            padding: '4px 6px',
            background: 'transparent',
            border: '1px solid var(--tf-border)',
            borderRadius: 3,
            fontSize: '0.85rem',
          }}
        >
          <option value=''>All universes</option>
          {UniverseCodes.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>

      <label style={{ fontSize: '0.8rem' }} className='tf-text-secondary'>
        PropId
        <span style={{ display: 'flex', gap: 4, marginTop: 2 }}>
          <input
            type='number'
            aria-label='Filter by property id'
            data-testid='filter-propid'
            value={value.propId ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') {
                onChange({ ...value, propId: null });
              } else {
                const n = Number(v);
                onChange({ ...value, propId: Number.isNaN(n) ? null : n });
              }
            }}
            disabled={disabled}
            min={0}
            placeholder='any'
            className='tf-text'
            style={{
              flex: 1,
              padding: '4px 6px',
              background: 'transparent',
              border: '1px solid var(--tf-border)',
              borderRadius: 3,
              fontSize: '0.85rem',
            }}
          />
          {value.propId !== null && (
            <button
              type='button'
              aria-label='Clear property id filter'
              data-testid='filter-propid-clear'
              onClick={() => onChange({ ...value, propId: null })}
              disabled={disabled}
              className='tf-status-info'
              style={{
                padding: '0 8px',
                borderRadius: 3,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              X
            </button>
          )}
        </span>
      </label>

      <label style={{ fontSize: '0.8rem' }} className='tf-text-secondary'>
        Triage status
        <select
          aria-label='Filter by triage status'
          data-testid='filter-status'
          value={value.status}
          onChange={(e) =>
            onChange({ ...value, status: e.target.value as TriageStatus | 'All' })
          }
          disabled={disabled}
          className='tf-text'
          style={{
            display: 'block',
            width: '100%',
            marginTop: 2,
            padding: '4px 6px',
            background: 'transparent',
            border: '1px solid var(--tf-border)',
            borderRadius: 3,
            fontSize: '0.85rem',
          }}
        >
          <option value='Open'>Open</option>
          {TriageStatuses.filter((s) => s !== 'Open').map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          <option value='All'>All</option>
        </select>
      </label>
    </div>
  );
}
