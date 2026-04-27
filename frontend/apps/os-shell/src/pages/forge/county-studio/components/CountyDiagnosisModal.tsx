// frontend/apps/os-shell/src/pages/forge/county-studio/components/CountyDiagnosisModal.tsx
//
// Task E (Fix #6) — county-level diagnosis side-drawer.
//
// Triggered by the "Run County Diagnosis" button in CountyHealthPanel. On
// open it fetches GET /api/county-study/studies/:id/diagnosis once per
// session (cache in local state). Not auto-triggered — the full per-
// segment traversal is expensive (hundreds of segments) and the user
// should be in control.
//
// Layout, top to bottom:
//   - Narrative card (service output, 2–4 sentences).
//   - Classification banner (OverallClass + confidence).
//   - Patterns list.
//   - TopProblems grid — mini segment cards; click to drill.

import React, { useCallback, useState } from 'react';
import { diagnosisApi } from '../countyStudyApi';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type {
  CountyDiagnosisDto,
  CountyPattern,
  ProblemClass,
  SegmentDiagnosisDto,
} from '../types/countyStudio.types';
import { parseSegmentIdentity } from '../utils/segmentIdentity';

const CLASS_BAR: Record<ProblemClass, string> = {
  Data:     '#ef4444',
  Model:    '#f97316',
  Workflow: '#a855f7',
  Market:   '#f59e0b',
  Healthy:  '#22c55e',
};

// ── Pattern row ───────────────────────────────────────────────────────────

const PatternRow = ({ pattern }: { pattern: CountyPattern }) => {
  const pct = Math.round(pattern.severity * 100);
  return (
    <div
      data-testid={`diagnosis-pattern-${pattern.patternCode}`}
      style={{
        padding: '8px 10px',
        borderBottom: '1px solid hsl(var(--tf-border))',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
            textTransform: 'uppercase',
            padding: '2px 6px', borderRadius: 3,
            background: 'hsl(var(--tf-surface))',
            border: '1px solid hsl(var(--tf-border))',
            color: 'hsl(var(--tf-fg))',
          }}
        >
          {pattern.patternCode.replace(/_/g, ' ')}
        </span>
        <span style={{
          fontSize: 10, color: 'hsl(var(--tf-muted))', marginLeft: 'auto',
          fontFeatureSettings: '"tnum"',
        }}>
          {pattern.affectedSegmentCount} segments
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'hsl(var(--tf-fg))' }}>
        {pattern.summary}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          role="presentation"
          aria-label="pattern severity"
          style={{
            flex: 1, height: 4,
            background: 'hsl(var(--tf-bg))',
            border: '1px solid hsl(var(--tf-border))',
            borderRadius: 2, position: 'relative',
          }}
        >
          <div
            data-testid={`diagnosis-pattern-severity-${pattern.patternCode}`}
            style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              width: `${pct}%`, background: '#ef4444',
            }}
          />
        </div>
        <span
          style={{
            fontSize: 10, color: 'hsl(var(--tf-muted))',
            fontFeatureSettings: '"tnum"', minWidth: 36, textAlign: 'right',
          }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
};

// ── Top-problem card ──────────────────────────────────────────────────────

const TopProblemCard = ({
  dx, onDrill,
}: { dx: SegmentDiagnosisDto; onDrill: (dx: SegmentDiagnosisDto) => void }) => {
  const bar = CLASS_BAR[dx.primaryClass];
  const topFinding = dx.findings[0];
  const primaryAction = dx.recommendedActions[0];
  return (
    <button
      type="button"
      data-testid={`diagnosis-top-problem-${dx.segmentId}`}
      onClick={() => onDrill(dx)}
      style={{
        textAlign: 'left', padding: '8px 10px',
        borderLeft: `3px solid ${bar}`,
        border: '1px solid hsl(var(--tf-border))',
        borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: bar,
        background: 'hsl(var(--tf-surface))',
        color: 'hsl(var(--tf-fg))',
        cursor: 'pointer', borderRadius: 4,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
            textTransform: 'uppercase', padding: '2px 6px', borderRadius: 10,
            background: `${bar}22`, color: bar,
          }}
        >
          {dx.primaryClass}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>{dx.segmentName}</span>
      </div>
      <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
        {dx.city ?? 'Unincorporated'} · {dx.parcelCount.toLocaleString()} parcels
      </div>
      {topFinding && (
        <div style={{ fontSize: 10, color: 'hsl(var(--tf-fg))' }}>
          {topFinding.summary}
        </div>
      )}
      {primaryAction && (
        <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
          → {primaryAction.summary}
        </div>
      )}
    </button>
  );
};

// ── Main component ────────────────────────────────────────────────────────

export interface CountyDiagnosisModalProps {
  studyId: string;
  open: boolean;
  onClose: () => void;
}

export function CountyDiagnosisModal({ studyId, open, onClose }: CountyDiagnosisModalProps) {
  const [diagnosis, setDiagnosis] = useState<CountyDiagnosisDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { drillToSegment } = useCountyStudioStore();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dto = await diagnosisApi.county(studyId);
      setDiagnosis(dto);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  // Trigger load on open, once per mount-with-open. Include `error` in the
  // gate so a fetch that already failed isn't re-fired on the next render
  // (which would clobber the error state via setError(null) in load()).
  // The Retry button is the explicit re-fire path.
  React.useEffect(() => {
    if (open && !diagnosis && !loading && !error) {
      void load();
    }
  }, [open, diagnosis, loading, error, load]);

  if (!open) return null;

  return (
    <div
      data-testid="county-diagnosis-modal"
      role="dialog"
      aria-label="County Diagnosis"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'hsla(0, 0%, 0%, 0.5)',
        display: 'flex', justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '520px', maxWidth: '100vw',
          background: 'hsl(var(--tf-bg))',
          borderLeft: '1px solid hsl(var(--tf-border))',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid hsl(var(--tf-border))',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--tf-fg))' }}>
            County Diagnosis
          </div>
          <button
            type="button"
            data-testid="county-diagnosis-modal-close"
            onClick={onClose}
            aria-label="Close diagnosis modal"
            style={{
              marginLeft: 'auto', padding: '3px 10px', borderRadius: 3,
              border: '1px solid hsl(var(--tf-border))',
              background: 'transparent', color: 'hsl(var(--tf-fg))',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Close
          </button>
        </header>

        <div style={{
          padding: '12px 16px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {loading && !diagnosis && (
            <div
              data-testid="county-diagnosis-loading"
              style={{ fontSize: 12, color: 'hsl(var(--tf-muted))' }}
            >
              Running deterministic diagnosis across every segment…
            </div>
          )}
          {error && (
            <div
              data-testid="county-diagnosis-error"
              role="alert"
              style={{ fontSize: 12, color: '#ef4444' }}
            >
              Diagnosis unavailable.{' '}
              <button type="button" onClick={load} style={{
                marginLeft: 8, padding: '3px 10px', borderRadius: 3,
                border: '1px solid hsl(var(--tf-border))',
                background: 'transparent', color: 'hsl(var(--tf-fg))',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>
                Retry
              </button>
            </div>
          )}

          {diagnosis && (
            <>
              <section
                data-testid="county-diagnosis-narrative"
                style={{
                  padding: '10px 12px',
                  border: '1px solid hsl(var(--tf-border))',
                  background: 'hsl(var(--tf-surface))',
                  borderRadius: 4,
                  fontSize: 11, lineHeight: 1.45,
                  color: 'hsl(var(--tf-fg))',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {diagnosis.narrative}
              </section>

              <div
                data-testid="county-diagnosis-banner"
                data-class={diagnosis.overallClass}
                style={{
                  padding: '10px 12px',
                  borderLeft: `3px solid ${CLASS_BAR[diagnosis.overallClass]}`,
                  background: 'hsl(var(--tf-surface))',
                  borderRadius: 4,
                }}
              >
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: CLASS_BAR[diagnosis.overallClass],
                }}>
                  {diagnosis.countyName} {diagnosis.taxYear} · {diagnosis.overallClass} · {Math.round(diagnosis.overallConfidence * 100)}% confidence
                </div>
                <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
                  {diagnosis.problemSegmentCount.toLocaleString()} problem · {diagnosis.healthySegmentCount.toLocaleString()} healthy
                </div>
              </div>

              {diagnosis.patterns.length > 0 && (
                <section
                  data-testid="county-diagnosis-patterns-section"
                  style={{
                    border: '1px solid hsl(var(--tf-border))',
                    background: 'hsl(var(--tf-surface))',
                    borderRadius: 4,
                  }}
                >
                  <header style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1,
                    textTransform: 'uppercase', color: 'hsl(var(--tf-muted))',
                    padding: '6px 10px',
                    borderBottom: '1px solid hsl(var(--tf-border))',
                  }}>
                    Patterns ({diagnosis.patterns.length})
                  </header>
                  {diagnosis.patterns.map((p) => (
                    <PatternRow key={p.patternCode + p.affectedSegmentCount} pattern={p} />
                  ))}
                </section>
              )}

              {diagnosis.topProblems.length > 0 && (
                <section
                  data-testid="county-diagnosis-top-problems-section"
                  style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 1,
                    textTransform: 'uppercase', color: 'hsl(var(--tf-muted))',
                  }}>
                    Top problems ({diagnosis.topProblems.length})
                  </div>
                  {diagnosis.topProblems.map((dx) => (
                    <TopProblemCard
                      key={dx.segmentId}
                      dx={dx}
                      onDrill={(target) => {
                        const identity = parseSegmentIdentity(target.segmentName, {
                          neighborhoodCode: target.neighborhoodCode,
                        });
                        drillToSegment(
                          target.city ?? 'Unincorporated',
                          target.neighborhoodCode ?? 'UNKNOWN',
                          target.segmentId,
                          identity.revalArea ? Number(identity.revalArea) : null,
                        );
                        onClose();
                      }}
                    />
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
