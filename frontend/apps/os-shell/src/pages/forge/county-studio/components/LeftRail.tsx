// frontend/apps/os-shell/src/pages/forge/county-studio/components/LeftRail.tsx
import React from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

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

export function LeftRail() {
  const {
    activeStudy, cohorts, scenarios, activeCohortId, activeScenario,
    setActiveCohort, setActiveScenario,
    loadStatus, loadErrors,
  } = useCountyStudioStore();

  return (
    <div style={{ padding: '8px 0' }}>
      <style>{`@keyframes tf-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      <SectionHeader label="Studies" />
      {activeStudy ? (
        <NavItem
          label={`${activeStudy.taxYear} ${activeStudy.studyType}`}
          sub={activeStudy.status}
          active
        />
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

      <SectionHeader label="Snapshots" />
      <div style={{ padding: '4px 12px', fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
        None saved
      </div>
    </div>
  );
}
