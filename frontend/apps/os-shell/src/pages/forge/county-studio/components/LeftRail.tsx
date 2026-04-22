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

export function LeftRail() {
  const {
    activeStudy, cohorts, scenarios, activeCohortId, activeScenario,
    setActiveCohort, setActiveScenario,
  } = useCountyStudioStore();

  return (
    <div style={{ padding: '8px 0' }}>
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
      {cohorts.length === 0 ? (
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
      {scenarios.length === 0 ? (
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
