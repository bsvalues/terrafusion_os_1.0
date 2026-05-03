/**
 * Reference & Compliance Tab
 *
 * Surfaces F1 (IPD), F3 (Lid Lifts), F4 (State School), F5 (Refund Fund),
 * F7 (Retention), F8 (Attestation), F9 (TCA) in a single read-only panel.
 *
 * Most sections are honestly "specialist-gated" — they render the schema and
 * statutory references but show an operator-visible banner when no
 * authoritative data has been ingested. No synthesised values.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getIpdRates,
  getLidLifts,
  getStateSchoolLevy,
  getRefundFund,
  getTaxCodeAreas,
  getRetentionPolicy,
  attestCalculation,
  type IpdRatesEnvelope,
  type LidLiftsEnvelope,
  type StateSchoolEnvelope,
  type RefundFundEnvelope,
  type TaxCodeAreasEnvelope,
  type RetentionPolicyEnvelope,
  type AttestationEnvelope,
} from '../../services/levyService';

const T = {
  bg: 'hsl(var(--tf-bg))',
  cyan: 'hsl(var(--tf-accent))',
  textMuted: 'hsl(var(--tf-fg) / 0.65)',
  success: 'hsl(var(--tf-success))',
  warning: 'hsl(var(--tf-warning))',
  border: 'hsl(var(--tf-fg) / 0.1)',
};

function SectionCard(props: { title: string; rcw?: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'hsl(var(--tf-card))',
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.cyan }}>{props.title}</h3>
        {props.rcw && (
          <span style={{ fontSize: 11, color: T.textMuted, fontFamily: 'monospace' }}>{props.rcw}</span>
        )}
      </header>
      {props.children}
    </section>
  );
}

function GateBanner(props: { gated: boolean; note: string | null | undefined }) {
  if (!props.gated) return null;
  return (
    <div
      style={{
        fontSize: 12,
        padding: '8px 10px',
        borderRadius: 4,
        background: 'hsl(var(--tf-warning) / 0.1)',
        border: '1px solid hsl(var(--tf-warning) / 0.3)',
        color: 'hsl(var(--tf-warning))',
        marginBottom: 10,
      }}
    >
      <strong>Specialist-gated:</strong> {props.note ?? 'Authoritative data has not been ingested.'}
    </div>
  );
}

export default function ReferenceComplianceTab() {
  const [ipd, setIpd] = useState<IpdRatesEnvelope | null>(null);
  const [lifts, setLifts] = useState<LidLiftsEnvelope | null>(null);
  const [stateSchool, setStateSchool] = useState<StateSchoolEnvelope | null>(null);
  const [refund, setRefund] = useState<RefundFundEnvelope | null>(null);
  const [tcas, setTcas] = useState<TaxCodeAreasEnvelope | null>(null);
  const [retention, setRetention] = useState<RetentionPolicyEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [a, b, c, d, e, f] = await Promise.all([
          getIpdRates(),
          getLidLifts(),
          getStateSchoolLevy(),
          getRefundFund(),
          getTaxCodeAreas(25),
          getRetentionPolicy(),
        ]);
        if (cancelled) return;
        setIpd(a);
        setLifts(b);
        setStateSchool(c);
        setRefund(d);
        setTcas(e);
        setRetention(f);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const referencePacketSummary = useMemo(() => ({
    ipd: ipd
      ? {
          source: ipd.source,
          count: ipd.count,
          specialistGated: ipd.specialistGated,
          specialistGateNote: ipd.specialistGateNote,
          rcwReference: ipd.rcwReference,
        }
      : null,
    lidLifts: lifts
      ? {
          source: lifts.source,
          count: lifts.count,
          specialistGated: lifts.specialistGated,
          specialistGateNote: lifts.specialistGateNote,
          rcwReference: lifts.rcwReference,
        }
      : null,
    stateSchool: stateSchool
      ? {
          source: stateSchool.source,
          specialistGated: stateSchool.specialistGated,
          specialistGateNote: stateSchool.specialistGateNote,
          partCount: stateSchool.parts.length,
        }
      : null,
    refundFund: refund
      ? {
          source: refund.source,
          specialistGated: refund.specialistGated,
          specialistGateNote: refund.specialistGateNote,
          outsideAggregateCap: refund.outsideAggregateCap,
        }
      : null,
    taxCodeAreas: tcas
      ? {
          source: tcas.source,
          count: tcas.count,
          rcwReference: tcas.rcwReference,
          annexationModelingDeferred: tcas.annexationModelingDeferred,
          deferralNote: tcas.deferralNote,
        }
      : null,
    retention: retention
      ? {
          source: retention.source,
          count: retention.count,
          rcwReference: retention.rcwReference,
          perRecordStampingDeferred: retention.perRecordStampingDeferred,
          deferralNote: retention.deferralNote,
        }
      : null,
  }), [ipd, lifts, stateSchool, refund, tcas, retention]);

  // ── F8 — reference packet attestation ────────────────────────────────
  const [attestResult, setAttestResult] = useState<AttestationEnvelope | null>(null);
  const [attestError, setAttestError] = useState<string | null>(null);
  const [attestBusy, setAttestBusy] = useState(false);
  const runAttest = useCallback(async () => {
    setAttestBusy(true);
    setAttestError(null);
    try {
      const env = await attestCalculation({
        subject: 'TerraLevy.ReferencePacket',
        payload: {
          capturedAt: new Date().toISOString(),
          packet: referencePacketSummary,
        },
      });
      setAttestResult(env);
    } catch (err) {
      setAttestError(err instanceof Error ? err.message : String(err));
    } finally {
      setAttestBusy(false);
    }
  }, [referencePacketSummary]);

  if (loading) return <div style={{ color: T.textMuted, padding: 16 }}>Loading reference data…</div>;
  if (error) return <div style={{ color: 'red', padding: 16 }}>Error: {error}</div>;

  return (
    <div>
      <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 16px' }}>
        Read-only statutory reference surfaces. Values shown are authoritative only when
        imported from the cited source; specialist-gated sections show the schema and
        citation but honestly disclose that no values have been ingested.
      </p>

      {/* F1 — IPD */}
      {ipd && (
        <SectionCard title="F1 · IPD Annual Rate (Limit Factor)" rcw={ipd.rcwReference}>
          <GateBanner gated={ipd.specialistGated} note={ipd.specialistGateNote} />
          <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
            <strong>Formula:</strong> Limit Factor = min(1.01, 1 + IPD%). Source:{' '}
            <span style={{ color: T.cyan }}>{ipd.source}</span>
          </p>
          <p style={{ fontSize: 12, color: T.textMuted, margin: '4px 0 0' }}>{ipd.description}</p>
          {ipd.count === 0 && (
            <p style={{ fontSize: 12, color: T.textMuted, marginTop: 8 }}>
              <em>No IPD rows imported.</em>
            </p>
          )}
        </SectionCard>
      )}

      {/* F3 — Lid Lifts */}
      {lifts && (
        <SectionCard title="F3 · Lid Lifts (voter-approved)" rcw={lifts.rcwReference}>
          <GateBanner gated={lifts.specialistGated} note={lifts.specialistGateNote} />
          <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
            Source: {lifts.source}. {lifts.count} proposition(s) imported.
          </p>
        </SectionCard>
      )}

      {/* F4 — State School */}
      {stateSchool && (
        <SectionCard title="F4 · State School Levy (Parts 1 & 2)">
          <GateBanner gated={stateSchool.specialistGated} note={stateSchool.specialistGateNote} />
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: T.textMuted, textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Part</th>
                <th style={{ padding: '6px 8px' }}>RCW</th>
                <th style={{ padding: '6px 8px' }}>Rate / $1,000 AV</th>
                <th style={{ padding: '6px 8px' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {stateSchool.parts.map(p => (
                <tr key={p.part} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>{p.part}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{p.rcwReference}</td>
                  <td style={{ padding: '6px 8px' }}>
                    {p.ratePerThousandAV == null ? <em style={{ color: T.warning }}>pending import</em> : p.ratePerThousandAV.toFixed(4)}
                  </td>
                  <td style={{ padding: '6px 8px', color: T.textMuted }}>{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {/* F5 — Refund Fund */}
      {refund && (
        <SectionCard title="F5 · Refund Fund" rcw={refund.rcwReference}>
          <GateBanner gated={refund.specialistGated} note={refund.specialistGateNote} />
          <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{refund.description}</p>
          <p style={{ fontSize: 12, color: T.cyan, margin: '4px 0 0' }}>
            Outside aggregate cap: <strong>{refund.outsideAggregateCap ? 'yes' : 'no'}</strong>
          </p>
        </SectionCard>
      )}

      {/* F9 — Tax Code Areas */}
      {tcas && (
        <SectionCard title="F9 · Tax Code Areas (PACS mirror)" rcw={tcas.rcwReference}>
          {tcas.annexationModelingDeferred && (
            <div
              style={{
                fontSize: 12,
                padding: '8px 10px',
                borderRadius: 4,
                background: 'hsl(var(--tf-accent) / 0.08)',
                border: `1px solid ${T.border}`,
                color: T.textMuted,
                marginBottom: 10,
              }}
            >
              <strong>Deferred:</strong> {tcas.deferralNote}
            </div>
          )}
          <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 8px' }}>
            Source: {tcas.source}. {tcas.count} TCA(s) shown.
          </p>
          {tcas.count > 0 ? (
            <div style={{ maxHeight: 220, overflow: 'auto', border: `1px solid ${T.border}`, borderRadius: 4 }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, background: 'hsl(var(--tf-card))', color: T.textMuted, textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Tax Area #</th>
                    <th style={{ padding: '6px 8px' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {tcas.taxCodeAreas.map(t => (
                    <tr key={t.taxAreaNumber} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{t.taxAreaNumber}</td>
                      <td style={{ padding: '6px 8px', color: T.textMuted }}>{t.description ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: T.textMuted }}>
              <em>No TCAs in mirror; PACS sync has not populated the table.</em>
            </p>
          )}
        </SectionCard>
      )}

      {/* F7 — Retention */}
      {retention && (
        <SectionCard title="F7 · Retention / PRA Policy" rcw={retention.rcwReference}>
          <div
            style={{
              fontSize: 12,
              padding: '8px 10px',
              borderRadius: 4,
              background: 'hsl(var(--tf-accent) / 0.08)',
              border: `1px solid ${T.border}`,
              color: T.textMuted,
              marginBottom: 10,
            }}
          >
            <strong>Deferred:</strong> {retention.deferralNote}
          </div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: T.textMuted, textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Record Type</th>
                <th style={{ padding: '6px 8px' }}>Class</th>
                <th style={{ padding: '6px 8px' }}>Min Yrs</th>
                <th style={{ padding: '6px 8px' }}>Disposition</th>
              </tr>
            </thead>
            <tbody>
              {retention.policies.map(p => (
                <tr key={p.recordType} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: '6px 8px' }}>{p.recordType}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{p.retentionClass}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>{p.minimumRetentionYears}</td>
                  <td style={{ padding: '6px 8px', color: T.textMuted }}>{p.disposition}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {/* F8 — Attestation */}
      <SectionCard title="F8 · Attestation (SHA-256)">
        <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 10px' }}>
          Produces a stateless attestation envelope over the currently loaded
          reference packet summary: canonical hash, signer, correlationId.
          Persistence of envelopes is deferred (see LEV-145).
        </p>
        <button
          onClick={runAttest}
          disabled={attestBusy}
          style={{
            padding: '6px 14px',
            fontSize: 12,
            borderRadius: 4,
            border: `1px solid ${T.cyan}`,
            background: 'transparent',
            color: T.cyan,
            cursor: attestBusy ? 'wait' : 'pointer',
          }}
        >
          {attestBusy ? 'Attesting…' : 'Attest current reference packet'}
        </button>
        {attestError && (
          <p style={{ fontSize: 12, color: 'red', marginTop: 8 }}>{attestError}</p>
        )}
        {attestResult && (
          <pre
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 4,
              background: 'hsl(var(--tf-bg))',
              border: `1px solid ${T.border}`,
              fontSize: 11,
              fontFamily: 'monospace',
              color: T.textMuted,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {JSON.stringify(attestResult, null, 2)}
          </pre>
        )}
      </SectionCard>
    </div>
  );
}
