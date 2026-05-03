/**
 * QualDecisionButtons — Decision buttons + research notes for a single sale.
 */

import { useState } from 'react';
import { useSalesForgeStore } from '../salesForgeStore';

interface Props {
  saleId: string;
  compact?: boolean;  // Compact mode: no notes textarea (for use in table rows)
}

export function QualDecisionButtons({ saleId, compact = false }: Props) {
  const [notes, setNotes] = useState('');
  const patchDecision = useSalesForgeStore((s) => s.patchDecision);
  const patchState    = useSalesForgeStore((s) => s.patchState[saleId]);

  const isWorking = patchState === 'working';

  const decide = (decision: string) => {
    void patchDecision(saleId, decision, notes, 'staff', 'StaffConfirmed');
    setNotes('');
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          type="button"
          className="sf-btn sf-btn--success"
          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
          onClick={(e) => { e.stopPropagation(); decide('qualified'); }}
          disabled={isWorking}
        >
          {isWorking ? '…' : '✓ Qual'}
        </button>
        <button
          type="button"
          className="sf-btn sf-btn--danger"
          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
          onClick={(e) => { e.stopPropagation(); decide('non-arms-length'); }}
          disabled={isWorking}
        >
          {isWorking ? '…' : '✗ Non-AL'}
        </button>
      </div>
    );
  }

  return (
    <div className="sf-decision-area">
      <textarea
        className="sf-decision-notes"
        placeholder="Research notes (optional — required for appraiser-level overrides)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={1}
        aria-label="Research notes"
      />
      <div className="sf-decision-buttons">
        <button
          type="button"
          className="sf-btn sf-btn--success"
          onClick={() => decide('qualified')}
          disabled={isWorking}
        >
          {isWorking ? 'Saving…' : '✓ Qualified'}
        </button>
        <button
          type="button"
          className="sf-btn sf-btn--danger"
          onClick={() => decide('non-arms-length')}
          disabled={isWorking}
        >
          Non-arms-length
        </button>
        <button
          type="button"
          className="sf-btn sf-btn--ghost"
          onClick={() => decide('foreclosure')}
          disabled={isWorking}
        >
          Foreclosure
        </button>
        <button
          type="button"
          className="sf-btn sf-btn--ghost"
          onClick={() => decide('estate')}
          disabled={isWorking}
        >
          Estate
        </button>
        <button
          type="button"
          className="sf-btn sf-btn--ghost"
          onClick={() => decide('excluded')}
          disabled={isWorking}
        >
          Excluded
        </button>
        <button
          type="button"
          className="sf-btn sf-btn--ghost"
          onClick={() => decide('exempt')}
          disabled={isWorking}
        >
          Exempt
        </button>
      </div>
      {patchState === 'done' && (
        <span style={{ fontSize: '0.75rem', color: 'var(--sf-success)', alignSelf: 'center' }}>Saved ✓</span>
      )}
      {patchState === 'error' && (
        <span style={{ fontSize: '0.75rem', color: 'var(--sf-danger)', alignSelf: 'center' }}>Save failed</span>
      )}
    </div>
  );
}
