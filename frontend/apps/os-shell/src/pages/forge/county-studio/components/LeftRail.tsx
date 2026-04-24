// frontend/apps/os-shell/src/pages/forge/county-studio/components/LeftRail.tsx
import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { segmentSetApi, studyApi } from '../countyStudyApi';
import { useStudyData } from '../hooks/useStudyData';

const SectionHeader = ({ label }: { label: string }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
    color: 'hsl(var(--tf-muted))', padding: '12px 12px 4px', textTransform: 'uppercase',
  }}>
    {label}
  </div>
);

const NavItem = ({
  label, sub, active, onClick,
}: {
  label: string; sub?: string; active?: boolean; onClick?: () => void;
}) => (
  <button
    data-active={active ? 'true' : 'false'}
    onClick={onClick}
    style={{
      display: 'block', width: '100%', textAlign: 'left',
      padding: '6px 12px', border: 'none',
      background: active ? 'hsl(var(--tf-surface))' : 'transparent',
      color: active ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))',
      fontSize: 12, cursor: 'pointer', borderRadius: 0,
    }}
  >
    <div style={{ fontWeight: active ? 600 : 400 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>{sub}</div>}
  </button>
);

/** Shimmer row for loading state — matches NavItem height (~30px). */
const SkeletonRow = ({ width = '80%' }: { width?: string }) => (
  <div
    aria-hidden="true"
    style={{
      margin: '4px 12px',
      height: 20,
      width,
      borderRadius: 3,
      background: 'linear-gradient(90deg, hsl(var(--tf-surface)) 0%, hsl(var(--tf-border)) 50%, hsl(var(--tf-surface)) 100%)',
      backgroundSize: '200% 100%',
      animation: 'tf-shimmer 1.4s ease-in-out infinite',
    }}
  />
);

const InlineError = ({ message }: { message: string }) => (
  <div
    role="alert"
    style={{ padding: '4px 12px', fontSize: 11, color: '#ef4444', lineHeight: 1.4 }}
    title={message}
  >
    ⚠ Couldn't load
  </div>
);

/** Local state machine for the Derive Segment Metrics action. */
type DeriveState =
  | { kind: 'idle' }
  | { kind: 'deriving' }
  | { kind: 'success'; segmentCount: number; segmentsWithRatios: number }
  | { kind: 'error'; message: string };

export function LeftRail() {
  const {
    activeStudy, cohorts, scenarios, activeCohortId, activeScenario,
    setActiveCohort, setActiveScenario, setStudy,
    loadStatus, loadErrors,
  } = useCountyStudioStore();

  const { retrySegments, retryCityRollup, retryNeighborhoodRollup, retryHealthSummary } = useStudyData();
  const [derive, setDerive] = useState<DeriveState>({ kind: 'idle' });

  const handleDerive = async () => {
    if (!activeStudy || derive.kind === 'deriving') return;
    setDerive({ kind: 'deriving' });
    try {
      const result = await segmentSetApi.derive(activeStudy.studyId);
      // Refresh the study so activeSegmentSetId reflects the new baseline set.
      try {
        const refreshed = await studyApi.get(activeStudy.studyId);
        setStudy(refreshed);
      } catch {
        // Non-fatal: retrySegments below falls back to the first baseline set.
      }
      // Refetch the segment list and every rollup / health surface so the
      // center panel, RightRail, and CountyHealthPanel all reflect the newly
      // derived set without a manual reload.
      await Promise.all([
        retrySegments(),
        retryCityRollup(),
        retryNeighborhoodRollup(),
        retryHealthSummary(),
      ]);
      setDerive({
        kind: 'success',
        segmentCount: result.segmentCount,
        segmentsWithRatios: result.segmentsWithRatios,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Derivation failed';
      setDerive({ kind: 'error', message });
    }
  };

  const deriveLabel = (() => {
    switch (derive.kind) {
      case 'deriving': return 'Deriving…';
      case 'success':  return 'Derive again';
      case 'error':    return 'Retry derive';
      default:         return 'Derive Segment Metrics';
    }
  })();

  const deriveDisabled = !activeStudy || derive.kind === 'deriving';

  return (
    <div style={{ padding: '8px 0' }}>
      <style>{`@keyframes tf-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      @keyframes tf-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      <SectionHeader label="Studies" />
      {activeStudy ? (
        <>
          <NavItem
            label={`${activeStudy.taxYear} ${activeStudy.studyType}`}
            sub={activeStudy.status}
            active
          />
          <div style={{ padding: '6px 12px 4px' }}>
            <button
              data-testid="derive-segments-btn"
              onClick={handleDerive}
              disabled={deriveDisabled}
              aria-busy={derive.kind === 'deriving'}
              aria-label="Derive Segment Metrics"
              style={{
                width: '100%', padding: '6px 10px',
                border: '1px solid hsl(var(--tf-border))',
                borderRadius: 3,
                background: derive.kind === 'deriving' ? 'hsl(var(--tf-surface))' : 'transparent',
                color: deriveDisabled ? 'hsl(var(--tf-muted))' : 'hsl(var(--tf-fg))',
                fontSize: 11, fontWeight: 600,
                cursor: deriveDisabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {derive.kind === 'deriving' && (
                <span
                  aria-hidden="true"
                  data-testid="derive-spinner"
                  style={{
                    width: 10, height: 10, borderRadius: '50%',
                    border: '2px solid hsl(var(--tf-muted))',
                    borderTopColor: 'transparent',
                    animation: 'tf-spin 0.8s linear infinite',
                  }}
                />
              )}
              {deriveLabel}
            </button>
            {derive.kind === 'success' && (
              <div
                data-testid="derive-success"
                role="status"
                style={{ marginTop: 4, padding: '2px 2px', fontSize: 10, color: 'hsl(var(--tf-muted))' }}
              >
                Wrote {derive.segmentCount} segments · {derive.segmentsWithRatios} with ratios
              </div>
            )}
            {derive.kind === 'error' && (
              <div
                data-testid="derive-error"
                role="alert"
                title={derive.message}
                style={{ marginTop: 4, padding: '2px 2px', fontSize: 10, color: '#ef4444' }}
              >
                ⚠ {derive.message}
              </div>
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: '4px 12px', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          No study open
        </div>
      )}

      <SectionHeader label="Cohorts" />
      {loadStatus.cohorts === 'loading' ? (
        <div
          data-testid="left-rail-cohorts-loading"
          role="status"
          aria-live="polite"
          aria-label="Loading cohorts"
        >
          <SkeletonRow width="70%" />
          <SkeletonRow width="85%" />
          <SkeletonRow width="60%" />
        </div>
      ) : loadStatus.cohorts === 'error' ? (
        <InlineError message={loadErrors.cohorts ?? 'Unknown error'} />
      ) : cohorts.length === 0 ? (
        <div style={{ padding: '4px 12px', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          None yet
        </div>
      ) : (
        cohorts.map((c) => (
          <NavItem
            key={c.cohortId}
            label={c.name}
            sub={`${c.parcelCount.toLocaleString()} parcels · ${c.selectionType}`}
            active={activeCohortId === c.cohortId}
            onClick={() => setActiveCohort(c.cohortId)}
          />
        ))
      )}

      <SectionHeader label="Scenarios" />
      {loadStatus.scenarios === 'loading' ? (
        <div
          data-testid="left-rail-scenarios-loading"
          role="status"
          aria-live="polite"
          aria-label="Loading scenarios"
        >
          <SkeletonRow width="75%" />
          <SkeletonRow width="65%" />
        </div>
      ) : loadStatus.scenarios === 'error' ? (
        <InlineError message={loadErrors.scenarios ?? 'Unknown error'} />
      ) : scenarios.length === 0 ? (
        <div style={{ padding: '4px 12px', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
          None yet
        </div>
      ) : (
        scenarios.map((s) => (
          <NavItem
            key={s.scenarioId}
            label={s.adjustmentType}
            sub={s.status}
            active={activeScenario?.scenarioId === s.scenarioId}
            onClick={() => setActiveScenario(s)}
          />
        ))
      )}
    </div>
  );
}
