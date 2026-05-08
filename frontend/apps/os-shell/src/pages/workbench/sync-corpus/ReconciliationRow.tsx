/**
 * SYNC-UX-1C: single reconciliation row.
 *
 * Investigate rows are highlighted (red background) so the operator
 * can scan a 6-row table in <2s and find the lane that needs them.
 */

import React from 'react';
import type {
  FullCorpusReconciliationResponse,
  ReconciliationStatus,
} from '@/api/syncCorpus';

export default function ReconciliationRow({
  row,
}: {
  row: FullCorpusReconciliationResponse;
}): React.ReactElement {
  const isInvestigate = row.reconciliationStatus === 'Investigate';
  return (
    <tr
      data-testid={`recon-row-${row.lane}`}
      data-recon-status={row.reconciliationStatus}
      className={isInvestigate ? 'tf-status-error' : undefined}
      style={{ borderTop: '1px solid hsl(var(--tf-border))' }}
    >
      <td className='tf-text font-medium' style={{ padding: '6px 8px' }}>
        <code>{row.lane}</code>
      </td>
      <td className='tf-text-secondary' style={{ padding: '6px 8px' }}>
        <code>{row.expectedBasis}</code>
      </td>
      <td
        className='tf-text'
        style={{
          padding: '6px 8px',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {row.pacsSourceCount.toLocaleString()}
      </td>
      <td
        className='tf-text'
        style={{
          padding: '6px 8px',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {row.tfCanonicalCount.toLocaleString()}
      </td>
      <td
        className='tf-text'
        style={{
          padding: '6px 8px',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatSigned(row.delta)}
      </td>
      <td
        className='tf-text-secondary'
        style={{
          padding: '6px 8px',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {row.deltaPct.toFixed(2)}%
      </td>
      <td
        className='tf-text-secondary'
        style={{
          padding: '6px 8px',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {row.tolerancePct.toFixed(2)}%
      </td>
      <td style={{ padding: '6px 8px' }}>
        <span className={reconStatusClass(row.reconciliationStatus)} style={{ padding: '2px 6px', borderRadius: 3 }}>
          <code>{row.reconciliationStatus}</code>
        </span>
      </td>
      <td
        className='tf-text-secondary'
        style={{
          padding: '6px 8px',
          maxWidth: 280,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={row.notes ?? ''}
      >
        {row.notes ?? '—'}
      </td>
    </tr>
  );
}

function reconStatusClass(s: ReconciliationStatus): string {
  switch (s) {
    case 'Match':
      return 'tf-status-success';
    case 'AcceptableDelta':
      return 'tf-status-info';
    case 'Investigate':
    default:
      return 'tf-status-error';
  }
}

function formatSigned(n: number): string {
  if (n > 0) return `+${n.toLocaleString()}`;
  return n.toLocaleString();
}
