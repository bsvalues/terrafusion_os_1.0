// frontend/apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { scenarioApi } from '../countyStudyApi';
import { SUPPORTED_ADJUSTMENT_TYPES } from '../countyStudioCreationSupport';
import type { AdjustmentType, CountyScenarioDto, ScenarioImpactPreviewDto } from '../types/countyStudio.types';
import { describeOperationalScope, parseSegmentIdentity } from '../utils/segmentIdentity';

// ── Saved-scenario row with Promote CTA ──────────────────────────────────────

function SavedScenarioRow({
  scenario,
  onPromote,
  busy,
}: {
  scenario: CountyScenarioDto;
  onPromote: (s: CountyScenarioDto) => void;
  busy: boolean;
}) {
  const canPromote = scenario.status === 'Saved' || scenario.status === 'Reviewed';
  return (
    <div
      data-testid={`saved-scenario-row-${scenario.scenarioId}`}
      style={{
        padding: '6px 8px',
        borderBottom: '1px solid hsl(var(--tf-border))',
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {scenario.adjustmentType}
        </div>
        <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
          {scenario.status} · {new Date(scenario.createdAt).toLocaleDateString()}
        </div>
      </div>
      {canPromote && (
        <button
          data-testid={`promote-btn-${scenario.scenarioId}`}
          disabled={busy}
          onClick={() => onPromote(scenario)}
          style={{
            fontSize: 10, padding: '3px 9px', borderRadius: 4,
            border: '1px solid hsl(var(--tf-border))',
            background: '#22c55e22', color: '#22c55e',
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.5 : 1, flexShrink: 0,
            fontWeight: 600,
          }}
        >
          {busy ? '…' : 'Promote →'}
        </button>
      )}
    </div>
  );
}

const ADJUSTMENT_TYPES: readonly AdjustmentType[] = SUPPORTED_ADJUSTMENT_TYPES;

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700,
  color: 'hsl(var(--tf-muted))', textTransform: 'uppercase',
  letterSpacing: 0.8, marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px',
  background: 'hsl(var(--tf-surface))', border: '1px solid hsl(var(--tf-border))',
  borderRadius: 4, color: 'hsl(var(--tf-fg))', fontSize: 12, boxSizing: 'border-box',
};

export function ScenarioWorksheet() {
  const {
    activeStudy,
    activeCohortId,
    activeScenario,
    cohorts,
    drillLevel,
    healthSummary,
    scenarios,
    segments,
    selectedCity,
    selectedNeighborhood,
    selectedNeighborhoodRevalArea,
    selectedSegmentId,
    setActiveCohort,
    setActiveScenario,
    setScenarios,
    setScenarioPreview,
  } = useCountyStudioStore();
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('PercentageIncrease');
  const [magnitude, setMagnitude] = useState('');
  const [rationale, setRationale] = useState('');
  const [selectedCohortId, setSelectedCohortId] = useState(activeCohortId ?? '');

  const [draftScenario, setDraftScenario] = useState<CountyScenarioDto | null>(null);
  const [preview, setPreview] = useState<ScenarioImpactPreviewDto | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null); // scenarioId in-flight
  const [promoteSuccess, setPromoteSuccess] = useState<string | null>(null); // confirmation msg
  const [error, setError] = useState<string | null>(null);

  const canPreview = !!activeStudy && !!selectedCohortId && magnitude !== '' && rationale.length > 0;
  const canSave = !!draftScenario && !!preview;
  const selectedCohort = cohorts.find((cohort) => cohort.cohortId === selectedCohortId) ?? null;
  const selectedSegment = useMemo(
    () => segments.find((segment) => segment.segmentId === selectedSegmentId) ?? null,
    [segments, selectedSegmentId],
  );
  const activeScopeLabel = useMemo(() => {
    if (selectedSegment) {
      return describeOperationalScope(
        parseSegmentIdentity(selectedSegment.name, {
          neighborhoodCode: selectedSegment.geographyRef,
          revalArea: selectedSegment.revalArea,
          buildingType: selectedSegment.buildingType,
          qualityGrade: selectedSegment.qualityGrade,
        }),
      );
    }
    if (drillLevel === 'neighborhood' && selectedNeighborhood) {
      return describeOperationalScope(
        parseSegmentIdentity(selectedNeighborhood, {
          neighborhoodCode: selectedNeighborhood,
          revalArea: selectedNeighborhoodRevalArea,
        }),
      );
    }
    if (drillLevel === 'city' && selectedCity) {
      return `City overview: ${selectedCity}`;
    }
    return activeStudy?.countyName ?? activeStudy?.countyId ?? 'No study open';
  }, [activeStudy?.countyId, activeStudy?.countyName, drillLevel, selectedCity, selectedNeighborhood, selectedNeighborhoodRevalArea, selectedSegment]);
  const scopeGuidance = selectedSegment
    ? 'Segment selected: preview still executes against the chosen cohort, then routes parcel work downstream after save/promotion.'
    : drillLevel === 'neighborhood'
      ? 'Neighborhood plus reval area is the operative rollup. Preview the cohort here before routing corrections downstream.'
      : drillLevel === 'city'
        ? 'City remains overview-only. Use cohorts to narrow into neighborhood and reval-area work before saving.'
        : 'Countywide preview. Target the cohort, preview impact, then save only when the projected county metrics improve.';
  const previewSummary = useMemo(() => {
    if (!preview || !healthSummary) return null;
    const nextMedian = healthSummary.medianRatio != null
      ? healthSummary.medianRatio + preview.estimatedMedianRatioDelta
      : null;
    const nextCod = healthSummary.cod != null
      ? healthSummary.cod + preview.estimatedCodDelta
      : null;
    const nextPrd = healthSummary.prd != null
      ? healthSummary.prd + preview.estimatedPrdDelta
      : null;
    const affectedShare = healthSummary.parcelCount > 0
      ? (preview.totalParcelsAffected / healthSummary.parcelCount) * 100
      : null;
    return {
      nextMedian,
      nextCod,
      nextPrd,
      affectedShare,
      topDeltas: preview.deltas.slice(0, 5),
    };
  }, [healthSummary, preview]);

  useEffect(() => {
    setSelectedCohortId(activeCohortId ?? '');
  }, [activeCohortId]);

  const clearPreviewState = () => {
    setDraftScenario(null);
    setPreview(null);
    setScenarioPreview(null);
  };

  const resetDraft = ({ clearActiveScenario = true }: { clearActiveScenario?: boolean } = {}) => {
    setAdjustmentType('PercentageIncrease');
    setMagnitude('');
    setRationale('');
    setSelectedCohortId('');
    clearPreviewState();
    setError(null);
    if (clearActiveScenario) {
      setActiveScenario(null);
    }
  };

  const handlePreview = async () => {
    if (!activeStudy || !selectedCohortId) return;
    setPreviewing(true);
    setError(null);
    clearPreviewState();
    try {
      const draft = await scenarioApi.create({
        studyId: activeStudy.studyId,
        countyId: activeStudy.countyId,
        cohortId: selectedCohortId,
        name: `${adjustmentType} ${magnitude}`,
        adjustmentType,
        parametersJson: JSON.stringify({ magnitude: parseFloat(magnitude) }),
        rationale,
      });
      setDraftScenario(draft);
      setActiveScenario(draft);
      const result = await scenarioApi.preview(draft.scenarioId);
      setPreview(result);
      setScenarioPreview(result);
    } catch {
      setError('Preview failed. Check your selections and try again.');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!draftScenario) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await scenarioApi.save(draftScenario.scenarioId);
      setScenarios([...scenarios, saved]);
      setActiveScenario(saved);
      resetDraft({ clearActiveScenario: false });
    } catch {
      setError('Failed to save scenario.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    resetDraft();
  };

  const handlePromote = async (scenario: CountyScenarioDto) => {
    if (!activeStudy) return;
    setPromoting(scenario.scenarioId);
    setPromoteSuccess(null);
    setError(null);
    try {
      await scenarioApi.promote({
        scenarioId:     scenario.scenarioId,
        effectiveScope: JSON.stringify({
          cohortId: scenario.cohortId,
        }),
      });
      setPromoteSuccess('Promoted — see Govnc tab for approval workflow.');
      useCountyStudioStore.getState().setLastPromotion();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Promote failed.');
    } finally {
      setPromoting(null);
    }
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: 'hsl(var(--tf-fg))' }}>New Scenario</div>

      {activeStudy && (
        <div
          data-testid="scenario-worksheet-context"
          style={{
            padding: '8px 10px',
            borderRadius: 4,
            border: '1px solid hsl(var(--tf-border))',
            background: 'hsl(var(--tf-surface))',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'hsl(var(--tf-fg))' }}>
            {activeStudy.countyName ?? activeStudy.countyId} · {activeStudy.taxYear} · {activeStudy.studyType}
          </div>
          <div data-testid="scenario-worksheet-scope" style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
            Active scope: {activeScopeLabel}
          </div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
            {selectedCohort
              ? `Selected cohort: ${selectedCohort.name} (${selectedCohort.parcelCount.toLocaleString()} parcels)`
              : 'Select a cohort, then draft and preview impact before saving.'}
          </div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
            {scopeGuidance}
          </div>
          <div style={{ fontSize: 10, color: preview ? '#3b82f6' : 'hsl(var(--tf-muted))' }}>
            {preview
              ? 'Preview is transient command state. Save to preserve it or discard to clear it.'
              : 'No active preview yet.'}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="cs-cohort" style={labelStyle}>Cohort</label>
        <select id="cs-cohort" aria-label="Cohort" value={selectedCohortId}
          onChange={(e) => {
            setSelectedCohortId(e.target.value);
            setActiveCohort(e.target.value || null);
            clearPreviewState();
          }}
          style={inputStyle}>
          <option value="">— select cohort —</option>
          {cohorts.map((c) => (
            <option key={c.cohortId} value={c.cohortId}>{c.name} ({c.parcelCount} parcels)</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cs-adj-type" style={labelStyle}>Adjustment Type</label>
        <select id="cs-adj-type" value={adjustmentType}
          onChange={(e) => { setAdjustmentType(e.target.value as AdjustmentType); clearPreviewState(); }}
          style={inputStyle}>
          {ADJUSTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="cs-magnitude" style={labelStyle}>
          Magnitude {adjustmentType.includes('Percentage') ? '(%)' : '($)'}
        </label>
        <input
          id="cs-magnitude" aria-label="Magnitude" type="number" step="0.1"
          value={magnitude}
          onChange={(e) => { setMagnitude(e.target.value); clearPreviewState(); }}
          placeholder={adjustmentType.includes('Percentage') ? 'e.g. 4.0' : 'e.g. 5000'}
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="cs-rationale" style={labelStyle}>Rationale</label>
        <textarea
          id="cs-rationale" aria-label="Rationale"
          value={rationale}
          onChange={(e) => { setRationale(e.target.value); clearPreviewState(); }}
          placeholder="Describe the basis for this adjustment..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Preview Result */}
      {preview && (
        <div style={{
          padding: '10px 12px', borderRadius: 6,
          background: 'hsl(var(--tf-surface))',
          border: '1px solid hsl(var(--tf-border))',
          fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 2 }}>Impact Preview</div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
            Draft preview only — review impact here, then save to keep it in the study record.
          </div>
          <div>{preview.totalParcelsAffected.toLocaleString()} parcels affected</div>
          <div>
            Median ratio: {preview.estimatedMedianRatioDelta >= 0 ? '+' : ''}{preview.estimatedMedianRatioDelta.toFixed(3)}
            {' · '}COD: {preview.estimatedCodDelta >= 0 ? '+' : ''}{preview.estimatedCodDelta.toFixed(1)}
            {' · '}PRD: {preview.estimatedPrdDelta >= 0 ? '+' : ''}{preview.estimatedPrdDelta.toFixed(3)}
          </div>
          {previewSummary && (
            <div
              data-testid="scenario-preview-county-impact"
              style={{
                marginTop: 6,
                paddingTop: 6,
                borderTop: '1px solid hsl(var(--tf-border))',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 10, color: 'hsl(var(--tf-muted))', textTransform: 'uppercase', letterSpacing: 0.7 }}>
                Countywide projected effect
              </div>
              {previewSummary.affectedShare != null && (
                <div>
                  Affected share: {preview.totalParcelsAffected.toLocaleString()} parcels ({previewSummary.affectedShare.toFixed(1)}% of county)
                </div>
              )}
              <div>
                Median ratio: {healthSummary?.medianRatio?.toFixed(3) ?? 'n/a'} → {previewSummary.nextMedian?.toFixed(3) ?? 'n/a'}
              </div>
              <div>
                COD: {healthSummary?.cod?.toFixed(1) ?? 'n/a'} → {previewSummary.nextCod?.toFixed(1) ?? 'n/a'}
              </div>
              <div>
                PRD: {healthSummary?.prd?.toFixed(3) ?? 'n/a'} → {previewSummary.nextPrd?.toFixed(3) ?? 'n/a'}
              </div>
              {previewSummary.topDeltas.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
                  <div style={{ fontWeight: 700, fontSize: 10, color: 'hsl(var(--tf-muted))', textTransform: 'uppercase', letterSpacing: 0.7 }}>
                    Top impacted segments
                  </div>
                  {previewSummary.topDeltas.map((delta) => (
                    <div
                      key={delta.segmentId}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 4,
                        background: 'hsl(var(--tf-bg))',
                        border: '1px solid hsl(var(--tf-border))',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {describeOperationalScope(parseSegmentIdentity(delta.segmentName))}
                      </div>
                      <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
                        Ratio {delta.beforeRatio.toFixed(3)} → {delta.afterRatio.toFixed(3)}
                        {' · '}COD {delta.beforeCod.toFixed(1)} → {delta.afterCod.toFixed(1)}
                        {' · '}Delta {delta.deltaPercent >= 0 ? '+' : ''}{delta.deltaPercent.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && <div style={{ color: '#ef4444', fontSize: 11 }} data-testid="sw-error">{error}</div>}
      {promoteSuccess && (
        <div data-testid="sw-promote-success" style={{ color: '#22c55e', fontSize: 11 }}>
          ✓ {promoteSuccess}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleDiscard} style={{
          flex: 1, padding: '6px 0', border: '1px solid hsl(var(--tf-border))',
          borderRadius: 4, background: 'transparent', color: 'hsl(var(--tf-muted))',
          fontSize: 12, cursor: 'pointer',
        }}>
          Discard
        </button>

        {!preview ? (
          <button
            aria-label="Preview Impact"
            onClick={handlePreview}
            disabled={!canPreview || previewing}
            style={{
              flex: 1, padding: '6px 0', border: 'none', borderRadius: 4,
              background: canPreview ? '#3b82f6' : 'hsl(var(--tf-surface))',
              color: canPreview ? '#fff' : 'hsl(var(--tf-muted))',
              fontSize: 12, fontWeight: 600,
              cursor: canPreview ? 'pointer' : 'not-allowed',
            }}
          >
            {previewing ? 'Previewing…' : 'Preview Impact'}
          </button>
        ) : null}

        <button
          aria-label="Save Scenario"
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            flex: 1, padding: '6px 0', border: 'none', borderRadius: 4,
            background: canSave ? 'hsl(var(--tf-accent))' : 'hsl(var(--tf-surface))',
            color: canSave ? '#000' : 'hsl(var(--tf-muted))',
            fontSize: 12, fontWeight: 600,
            cursor: canSave ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Saving…' : 'Save Scenario'}
        </button>
      </div>

      {/* Saved scenarios list — promote eligible ones to governance workflow */}
      {scenarios.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ ...labelStyle, marginBottom: 6 }}>Saved Scenarios</div>
          <div style={{ border: '1px solid hsl(var(--tf-border))', borderRadius: 4, overflow: 'hidden' }}>
            {scenarios.map((s) => (
              <SavedScenarioRow
                key={s.scenarioId}
                scenario={s}
                onPromote={handlePromote}
                busy={promoting === s.scenarioId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
