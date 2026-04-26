// frontend/apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx
import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { scenarioApi } from '../countyStudyApi';
import type { AdjustmentType, CountyScenarioDto, ScenarioImpactPreviewDto } from '../types/countyStudio.types';

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

const ADJUSTMENT_TYPES: AdjustmentType[] = [
  'PercentageIncrease', 'PercentageDecrease',
  'FlatDollarIncrease', 'FlatDollarDecrease',
];

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
  const { activeStudy, cohorts, scenarios, setScenarios, setScenarioPreview } = useCountyStudioStore();
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('PercentageIncrease');
  const [magnitude, setMagnitude] = useState('');
  const [rationale, setRationale] = useState('');
  const [selectedCohortId, setSelectedCohortId] = useState('');

  const [draftScenario, setDraftScenario] = useState<CountyScenarioDto | null>(null);
  const [preview, setPreview] = useState<ScenarioImpactPreviewDto | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null); // scenarioId in-flight
  const [promoteSuccess, setPromoteSuccess] = useState<string | null>(null); // confirmation msg
  const [error, setError] = useState<string | null>(null);

  const canPreview = !!activeStudy && !!selectedCohortId && magnitude !== '' && rationale.length > 0;
  const canSave = !!draftScenario && !!preview;

  const handlePreview = async () => {
    if (!activeStudy || !selectedCohortId) return;
    setPreviewing(true);
    setError(null);
    setDraftScenario(null);
    setPreview(null);
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
      handleDiscard();
    } catch {
      setError('Failed to save scenario.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setAdjustmentType('PercentageIncrease');
    setMagnitude('');
    setRationale('');
    setSelectedCohortId('');
    setDraftScenario(null);
    setPreview(null);
    setError(null);
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

      <div>
        <label htmlFor="cs-cohort" style={labelStyle}>Cohort</label>
        <select id="cs-cohort" aria-label="Cohort" value={selectedCohortId}
          onChange={(e) => { setSelectedCohortId(e.target.value); setDraftScenario(null); setPreview(null); }}
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
          onChange={(e) => { setAdjustmentType(e.target.value as AdjustmentType); setDraftScenario(null); setPreview(null); }}
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
          onChange={(e) => { setMagnitude(e.target.value); setDraftScenario(null); setPreview(null); }}
          placeholder={adjustmentType.includes('Percentage') ? 'e.g. 4.0' : 'e.g. 5000'}
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="cs-rationale" style={labelStyle}>Rationale</label>
        <textarea
          id="cs-rationale" aria-label="Rationale"
          value={rationale}
          onChange={(e) => { setRationale(e.target.value); setDraftScenario(null); setPreview(null); }}
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
          <div>{preview.totalParcelsAffected.toLocaleString()} parcels affected</div>
          <div>
            Median ratio: {preview.estimatedMedianRatioDelta >= 0 ? '+' : ''}{preview.estimatedMedianRatioDelta.toFixed(3)}
            {' · '}COD: {preview.estimatedCodDelta >= 0 ? '+' : ''}{preview.estimatedCodDelta.toFixed(1)}
            {' · '}PRD: {preview.estimatedPrdDelta >= 0 ? '+' : ''}{preview.estimatedPrdDelta.toFixed(3)}
          </div>
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
