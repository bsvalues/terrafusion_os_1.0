import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { adjustmentSetApi, exceptionApi, scenarioApi, type CountyExceptionSetDto } from '../countyStudyApi';
import type { CountyAdjustmentSetDto } from '../types/countyStudio.types';
import { ExportPacketModal } from './ExportPacketModal';
import { describeOperationalScope, parseSegmentIdentity } from '../utils/segmentIdentity';
import { ContractLineage } from './ContractLineage';

interface CorrectionDefensePanelProps {
  onOpenScenario: () => void;
  onOpenCompare: () => void;
  onOpenGovernance: () => void;
}

type ReadinessState = 'ready' | 'watch' | 'blocked';

interface DefenseActionItem {
  label: string;
  state: ReadinessState;
  detail: string;
  action: string;
}

const tone: Record<ReadinessState, { color: string; bg: string; label: string }> = {
  ready: { color: 'hsl(var(--tf-success, 142 71% 45%))', bg: 'hsl(var(--tf-success, 142 71% 45%) / 0.14)', label: 'Ready' },
  watch: { color: 'hsl(var(--tf-warning, 38 92% 50%))', bg: 'hsl(var(--tf-warning, 38 92% 50%) / 0.14)', label: 'Watch' },
  blocked: { color: 'hsl(var(--tf-danger, 0 84% 60%))', bg: 'hsl(var(--tf-danger, 0 84% 60%) / 0.14)', label: 'Blocked' },
};

function StatusPill({ state }: { state: ReadinessState }) {
  const t = tone[state];
  return (
    <span
      data-state={state}
      style={{
        padding: '2px 7px',
        borderRadius: 999,
        background: t.bg,
        color: t.color,
        fontSize: 10,
        fontWeight: 800,
        textTransform: 'uppercase',
      }}
    >
      {t.label}
    </span>
  );
}

function ReadinessRow({
  label,
  detail,
  state,
}: {
  label: string;
  detail: string;
  state: ReadinessState;
}) {
  return (
    <div
      data-testid={`defense-readiness-${label.toLowerCase().replace(/\s+/g, '-')}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '96px 72px 1fr',
        gap: 8,
        alignItems: 'center',
        padding: '7px 0',
        borderBottom: '1px solid hsl(var(--tf-border))',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700 }}>{label}</span>
      <StatusPill state={state} />
      <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>{detail}</span>
    </div>
  );
}

function DefenseActionRow({ item, index }: { item: DefenseActionItem; index: number }) {
  return (
    <div
      data-testid={`defense-action-${index + 1}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '24px 72px 1fr',
        gap: 8,
        alignItems: 'start',
        padding: '7px 0',
        borderBottom: '1px solid hsl(var(--tf-border))',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--tf-muted))' }}>
        {index + 1}
      </span>
      <StatusPill state={item.state} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 800 }}>{item.label}</span>
        <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>{item.detail}</span>
        <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>Next: {item.action}</span>
      </div>
    </div>
  );
}

function actionButton(label: string, disabled: boolean, onClick: () => void): React.ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 10px',
        borderRadius: 4,
        border: '1px solid hsl(var(--tf-border))',
        background: disabled ? 'hsl(var(--tf-surface))' : 'hsl(var(--tf-accent, 217 91% 60%) / 0.14)',
        color: disabled ? 'hsl(var(--tf-muted))' : 'hsl(var(--tf-accent, 217 91% 60%))',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {label}
    </button>
  );
}

export function CorrectionDefensePanel({
  onOpenScenario,
  onOpenCompare,
  onOpenGovernance,
}: CorrectionDefensePanelProps) {
  const {
    activeStudy,
    activeScenario,
    cohorts,
    healthSummary,
    scenarioPreview,
    scenarios,
    segments,
    selectedSegmentId,
  } = useCountyStudioStore();

  const [adjustmentSets, setAdjustmentSets] = useState<CountyAdjustmentSetDto[]>([]);
  const [exceptions, setExceptions] = useState<CountyExceptionSetDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promotionMessage, setPromotionMessage] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const studyId = activeStudy?.studyId ?? null;

  const load = useCallback(async () => {
    if (!studyId) {
      setAdjustmentSets([]);
      setExceptions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [sets, exceptionRows] = await Promise.all([
        adjustmentSetApi.list(studyId),
        exceptionApi.list(studyId),
      ]);
      setAdjustmentSets(sets);
      setExceptions(exceptionRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load correction defense state.');
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedSegment = useMemo(
    () => segments.find((segment) => segment.segmentId === selectedSegmentId) ?? null,
    [segments, selectedSegmentId],
  );
  const selectedScopeLabel = selectedSegment
    ? describeOperationalScope(parseSegmentIdentity(selectedSegment.name, {
        neighborhoodCode: selectedSegment.geographyRef,
        revalArea: selectedSegment.revalArea,
        buildingType: selectedSegment.buildingType,
        qualityGrade: selectedSegment.qualityGrade,
      }))
    : 'No segment selected';

  const savedScenarioCount = scenarios.filter((scenario) => scenario.status !== 'Draft').length;
  const promotedCount = adjustmentSets.length;
  const promotedScenarioIds = useMemo(
    () => new Set(adjustmentSets.map((set) => set.scenarioId)),
    [adjustmentSets],
  );
  const promotableScenario = useMemo(
    () => {
      const candidates = scenarios.filter((scenario) =>
        (scenario.status === 'Saved' || scenario.status === 'Reviewed') &&
        !promotedScenarioIds.has(scenario.scenarioId));
      if (activeScenario && candidates.some((scenario) => scenario.scenarioId === activeScenario.scenarioId))
        return activeScenario;
      return candidates[0] ?? null;
    },
    [activeScenario, promotedScenarioIds, scenarios],
  );
  const proposedCount = adjustmentSets.filter((set) => set.approvalState === 'Proposed').length;
  const readyForApprovalCount = adjustmentSets.filter((set) => set.approvalState === 'ReadyForApproval').length;
  const approvedCount = adjustmentSets.filter((set) => set.approvalState === 'Approved').length;
  const openExceptionCount = exceptions.filter((row) => row.status !== 'Resolved').length;

  const defenseActionItems = useMemo<DefenseActionItem[]>(() => [
    {
      label: 'Metrics derived',
      state: healthSummary ? 'ready' : 'blocked',
      detail: healthSummary
        ? `${healthSummary.ratioCount.toLocaleString()} ratio-bearing records are available.`
        : 'No health summary is available for defense.',
      action: healthSummary ? 'Keep metrics current' : 'Derive segment metrics',
    },
    {
      label: 'Cohort anchored',
      state: cohorts.length > 0 ? 'ready' : 'blocked',
      detail: cohorts.length > 0
        ? `${cohorts.length} cohort${cohorts.length === 1 ? '' : 's'} can anchor corrective scope.`
        : 'No cohort exists for corrective scope.',
      action: cohorts.length > 0 ? 'Use cohort scope' : 'Create cohort',
    },
    {
      label: 'Scenario saved',
      state: savedScenarioCount > 0 ? 'ready' : scenarioPreview ? 'watch' : 'blocked',
      detail: savedScenarioCount > 0
        ? `${savedScenarioCount} saved scenario${savedScenarioCount === 1 ? '' : 's'} can be promoted.`
        : scenarioPreview
          ? 'A preview exists but has not been saved.'
          : 'No saved correction scenario exists.',
      action: savedScenarioCount > 0 ? 'Compare or promote scenario' : 'Draft and save scenario',
    },
    {
      label: 'Adjustment promoted',
      state: promotedCount > 0 ? 'ready' : savedScenarioCount > 0 ? 'watch' : 'blocked',
      detail: promotedCount > 0
        ? `${promotedCount} adjustment set${promotedCount === 1 ? '' : 's'} entered governance.`
        : 'No scenario has been promoted into approval.',
      action: promotedCount > 0 ? 'Review approval state' : 'Promote saved scenario',
    },
    {
      label: 'Approval posture',
      state: approvedCount > 0 ? 'ready' : promotedCount > 0 ? 'watch' : 'blocked',
      detail: promotedCount > 0
        ? `${proposedCount} proposed, ${readyForApprovalCount} ready, ${approvedCount} approved.`
        : 'No approval record exists.',
      action: approvedCount > 0 ? 'Preserve approval evidence' : 'Advance approval workflow',
    },
    {
      label: 'Exceptions resolved',
      state: openExceptionCount === 0 ? 'ready' : 'watch',
      detail: `${openExceptionCount} open exception${openExceptionCount === 1 ? '' : 's'} remain.`
        + (openExceptionCount > 0 ? ' Packet export remains available but should disclose them.' : ''),
      action: openExceptionCount === 0 ? 'Export defense packet' : 'Resolve or disclose exceptions',
    },
  ], [
    approvedCount,
    cohorts.length,
    healthSummary,
    openExceptionCount,
    promotedCount,
    proposedCount,
    readyForApprovalCount,
    savedScenarioCount,
    scenarioPreview,
  ]);

  const nextDefenseAction = defenseActionItems.find((item) => item.state !== 'ready') ?? {
    label: 'Defense packet ready',
    state: 'ready' as ReadinessState,
    detail: 'All current defense lifecycle gates are ready.',
    action: 'Export defense packet',
  };

  const defenseMemoLines = useMemo(() => {
    const countyLabel = activeStudy?.countyName ?? activeStudy?.countyId ?? 'Selected county';
    const studyLabel = activeStudy ? `${countyLabel} ${activeStudy.taxYear}` : countyLabel;
    const contractLabel = healthSummary?.correctionPriorityContractId ?? 'terraforge_correction_priority_v1 unavailable';
    const scenarioLabel = activeScenario
      ? `${activeScenario.adjustmentType} scenario is ${activeScenario.status}`
      : 'No active scenario is selected';
    const approvalLabel = approvedCount > 0
      ? `${approvedCount} adjustment set${approvedCount === 1 ? '' : 's'} approved`
      : promotedCount > 0
        ? `${promotedCount} promoted adjustment set${promotedCount === 1 ? '' : 's'} pending approval closure`
        : 'No promoted adjustment set exists';

    return [
      `${studyLabel} is ${healthSummary?.complianceStatus ?? 'not yet classified'} under ${contractLabel}.`,
      `Scope: ${selectedScopeLabel}.`,
      `Scenario posture: ${scenarioLabel}.`,
      `Approval posture: ${approvalLabel}.`,
      `Exception posture: ${openExceptionCount} open exception${openExceptionCount === 1 ? '' : 's'}.`,
    ];
  }, [
    activeScenario,
    activeStudy,
    approvedCount,
    healthSummary,
    openExceptionCount,
    promotedCount,
    selectedScopeLabel,
  ]);

  const handlePromoteScenario = useCallback(async () => {
    if (!promotableScenario)
      return;
    setPromoting(true);
    setPromotionMessage(null);
    setError(null);
    try {
      const promoted = await scenarioApi.promote({
        scenarioId: promotableScenario.scenarioId,
        effectiveScope: JSON.stringify({ cohortId: promotableScenario.cohortId }),
      });
      setAdjustmentSets((prev) => [promoted, ...prev]);
      useCountyStudioStore.getState().setLastPromotion();
      setPromotionMessage('Scenario promoted into the governed approval workflow.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to promote scenario.');
    } finally {
      setPromoting(false);
    }
  }, [promotableScenario]);

  if (!activeStudy) {
    return (
      <div
        data-testid="defense-panel-no-study"
        style={{ padding: 16, color: 'hsl(var(--tf-muted))', fontSize: 12 }}
      >
        Open a study to build a correction and defense chain.
      </div>
    );
  }

  return (
    <div data-testid="correction-defense-panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'hsl(var(--tf-fg))' }}>
          Correction & Defense Chain
        </div>
        <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))', marginTop: 3 }}>
          {activeStudy.countyName ?? activeStudy.countyId} · {activeStudy.taxYear}. This panel does not commit values; it shows whether the study has enough governed evidence to defend a correction.
        </div>
      </div>

      {error && (
        <div data-testid="defense-panel-error" role="alert" style={{ color: 'hsl(var(--tf-danger, 0 84% 60%))', fontSize: 11 }}>
          {error}
        </div>
      )}
      {promotionMessage && (
        <div data-testid="defense-promotion-success" role="status" style={{ color: 'hsl(var(--tf-success, 142 71% 45%))', fontSize: 11 }}>
          {promotionMessage}
        </div>
      )}

      <section
        data-testid="defense-readiness-chain"
        style={{
          border: '1px solid hsl(var(--tf-border))',
          borderRadius: 4,
          background: 'hsl(var(--tf-surface))',
          padding: '2px 10px',
        }}
      >
        <ReadinessRow
          label="Study"
          state="ready"
          detail={`${activeStudy.studyType} is ${activeStudy.status}.`}
        />
        <ReadinessRow
          label="Metrics"
          state={healthSummary ? 'ready' : 'blocked'}
          detail={healthSummary ? `${healthSummary.ratioCount.toLocaleString()} ratios · ${healthSummary.complianceStatus}.` : 'Derive/load segment metrics before defense.'}
        />
        <ReadinessRow
          label="Cohort"
          state={cohorts.length > 0 ? 'ready' : 'blocked'}
          detail={cohorts.length > 0 ? `${cohorts.length} real cohort${cohorts.length === 1 ? '' : 's'} available.` : 'Create a cohort from a selected segment or staged map selection.'}
        />
        <ReadinessRow
          label="Scenario"
          state={savedScenarioCount > 0 ? 'ready' : scenarioPreview ? 'watch' : 'blocked'}
          detail={savedScenarioCount > 0 ? `${savedScenarioCount} saved scenario${savedScenarioCount === 1 ? '' : 's'} in the study.` : scenarioPreview ? 'Preview exists but is not saved.' : 'Preview and save a scenario before promotion.'}
        />
        <ReadinessRow
          label="Approval"
          state={approvedCount > 0 ? 'ready' : promotedCount > 0 ? 'watch' : 'blocked'}
          detail={promotedCount > 0 ? `${promotedCount} promoted; ${proposedCount} proposed / ${readyForApprovalCount} ready / ${approvedCount} approved.` : 'Promote a saved scenario to create an approval record.'}
        />
        <ReadinessRow
          label="Evidence"
          state={healthSummary ? (openExceptionCount > 0 ? 'watch' : 'ready') : 'blocked'}
          detail={healthSummary ? `${openExceptionCount} open exception${openExceptionCount === 1 ? '' : 's'}; packet can be exported with current evidence.` : 'Health metrics are required for a defensible packet.'}
        />
      </section>

      <section
        data-testid="defense-action-lifecycle"
        style={{
          border: '1px solid hsl(var(--tf-border))',
          borderRadius: 4,
          background: 'hsl(var(--tf-surface))',
          padding: '2px 10px',
        }}
      >
        <div style={{ padding: '8px 0 4px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--tf-muted))', textTransform: 'uppercase', letterSpacing: 0 }}>
            Defense action lifecycle
          </span>
          <span data-testid="defense-next-action" style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
            Current next action: <strong style={{ color: 'hsl(var(--tf-fg))' }}>{nextDefenseAction.action}</strong>
          </span>
        </div>
        {defenseActionItems.map((item, index) => (
          <DefenseActionRow key={item.label} item={item} index={index} />
        ))}
      </section>

      <section
        data-testid="defense-memo-draft"
        style={{
          border: '1px solid hsl(var(--tf-border))',
          borderRadius: 4,
          background: 'hsl(var(--tf-bg))',
          padding: 10,
          fontSize: 11,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--tf-muted))', textTransform: 'uppercase', letterSpacing: 0 }}>
          Defense memo draft
        </div>
        {defenseMemoLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </section>

      <section
        data-testid="defense-current-anchors"
        style={{
          border: '1px solid hsl(var(--tf-border))',
          borderRadius: 4,
          background: 'hsl(var(--tf-bg))',
          padding: 10,
          fontSize: 11,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 800, color: 'hsl(var(--tf-muted))', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Current anchors
        </div>
        <div><strong>Study:</strong> {activeStudy.countyName ?? activeStudy.countyId} · {activeStudy.taxYear}</div>
        <div><strong>Scope:</strong> {selectedScopeLabel}</div>
        <div><strong>Active scenario:</strong> {activeScenario ? `${activeScenario.adjustmentType} · ${activeScenario.status}` : 'None selected'}</div>
        <div><strong>Corrections:</strong> {promotedCount} adjustment set{promotedCount === 1 ? '' : 's'} · {openExceptionCount} open exception{openExceptionCount === 1 ? '' : 's'}</div>
        <div><strong>County posture:</strong> {healthSummary ? `${healthSummary.complianceStatus} · median ${healthSummary.medianRatio?.toFixed(3) ?? 'n/a'} · COD ${healthSummary.cod?.toFixed(1) ?? 'n/a'} · PRD ${healthSummary.prd?.toFixed(3) ?? 'n/a'}` : 'No health summary loaded'}</div>
        <ContractLineage
          operationalContractId={healthSummary?.contractId}
          correctionContractId={healthSummary?.correctionPriorityContractId}
          countyName={activeStudy.countyName}
          countyId={activeStudy.countyId}
          compact
        />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {actionButton('Draft / Save Scenario', false, onOpenScenario)}
        {actionButton('Promote Saved Scenario', !promotableScenario || promoting, handlePromoteScenario)}
        {actionButton('Compare Scenarios', scenarios.length < 2, onOpenCompare)}
        {actionButton('Open Approval Workflow', promotedCount === 0, onOpenGovernance)}
        {actionButton('Export Evidence Packet', !healthSummary || loading, () => setExportOpen(true))}
      </section>

      {loading && (
        <div data-testid="defense-panel-loading" style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
          Loading correction workflow state...
        </div>
      )}

      {exportOpen && (
        <ExportPacketModal
          studyId={activeStudy.studyId}
          scenarioId={activeScenario?.scenarioId}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}
