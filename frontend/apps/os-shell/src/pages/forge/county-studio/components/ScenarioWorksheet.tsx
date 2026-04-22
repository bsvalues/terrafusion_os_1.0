// frontend/apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx
import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { scenarioApi } from '../countyStudyApi';
import type { AdjustmentType, CountyScenarioDto, ScenarioImpactPreviewDto } from '../types/countyStudio.types';

const ADJUSTMENT_TYPES: AdjustmentType[] = [
  'PercentageIncrease', 'PercentageDecrease',
  'FlatDollarIncrease', 'FlatDollarDecrease', 'CustomFormula',
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

      {error && <div style={{ color: '#ef4444', fontSize: 11 }}>{error}</div>}

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
    </div>
  );
}
