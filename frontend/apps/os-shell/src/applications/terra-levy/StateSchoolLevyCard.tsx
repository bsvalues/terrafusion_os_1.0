/**
 * StateSchoolLevyCard — LEV-140
 *
 * Displays WA state school levy Parts 1 & 2 from the backend reference endpoint.
 * Rates are DOR-published annually; displayed as gated until imported.
 *
 * RCW 84.52.065 (Part 1 — original state levy)
 * RCW 84.52.068 (Part 2 — McCleary supplemental)
 */
import React, { useState, useEffect } from 'react';
import { getStateSchoolLevy, type StateSchoolEnvelope } from '../../services/levyService';

const T = {
  cyan: 'var(--terra-cyan, hsl(var(--tf-accent)))',
  warning: 'var(--levy-warning, hsl(var(--tf-warning)))',
  textPrimary: 'var(--levy-text-primary, hsl(var(--tf-fg)))',
  textMuted: 'var(--levy-text-muted, hsl(var(--tf-fg) / 0.6))',
  textDim: 'var(--levy-text-dim, hsl(var(--tf-fg) / 0.4))',
  cardBg: 'hsl(var(--tf-fg) / 0.03)',
  cardBorder: '1px solid hsl(var(--tf-fg) / 0.08)',
} as const;

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; data: StateSchoolEnvelope }
  | { status: 'error'; message: string };

export default function StateSchoolLevyCard() {
  const [state, setState] = useState<LoadState>({ status: 'idle' });

  useEffect(() => {
    setState({ status: 'loading' });
    getStateSchoolLevy()
      .then(data => setState({ status: 'ok', data }))
      .catch(err => setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Could not fetch state school levy data.',
      }));
  }, []);

  return (
    <div style={{ padding: 20, borderRadius: 12, background: T.cardBg, border: T.cardBorder, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🏫</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.cyan }}>State School Levy</div>
          <div style={{ fontSize: 11, color: T.textMuted }}>RCW 84.52.065 (Part 1) · RCW 84.52.068 (Part 2 — McCleary)</div>
        </div>
      </div>

      {state.status === 'loading' && (
        <div style={{ fontSize: 12, color: T.textDim }}>Loading…</div>
      )}

      {state.status === 'error' && (
        <div style={{ fontSize: 12, color: T.warning }}>{state.message}</div>
      )}

      {state.status === 'ok' && (
        <>
          {state.data.specialistGated && (
            <div style={{
              padding: '8px 12px', borderRadius: 6,
              background: 'hsl(var(--tf-warning) / 0.07)',
              border: '1px solid hsl(var(--tf-warning) / 0.25)',
              fontSize: 11, color: T.warning,
            }}>
              ⚠ {state.data.specialistGateNote ?? 'State school rates not yet imported. Import from DOR annual certification.'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {state.data.parts.map(part => (
              <div key={part.part} style={{
                padding: '12px 14px', borderRadius: 8,
                background: 'hsl(var(--tf-fg) / 0.02)',
                border: '1px solid hsl(var(--tf-fg) / 0.1)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>{part.part}</span>
                  <span style={{ fontSize: 13, fontFamily: 'monospace', color: T.cyan }}>
                    {part.ratePerThousandAV != null
                      ? `${part.ratePerThousandAV.toFixed(6)} / $1,000 AV`
                      : '—  (not imported)'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{part.description}</div>
                <div style={{ fontSize: 10, color: T.textDim }}>
                  {part.rcwReference}{part.sourceNote ? ` · ${part.sourceNote}` : ''}
                  {part.levyYear != null && ` · Year: ${part.levyYear}`}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: T.textDim }}>
            Source: {state.data.source}
          </div>
        </>
      )}
    </div>
  );
}
