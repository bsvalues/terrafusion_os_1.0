import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { scenarioApi } from '../countyStudyApi';
import type { AdjustmentType } from '../types/countyStudio.types';

const ADJUSTMENT_TYPES: AdjustmentType[] = [
  'PercentageIncrease',
  'PercentageDecrease',
  'FlatDollarIncrease',
  'FlatDollarDecrease',
  'CustomFormula',
];

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 700,
  color: 'hsl(var(--tf-muted))',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: 'hsl(var(--tf-surface))',
  border: '1px solid hsl(var(--tf-border))',
  borderRadius: 4,
  color: 'hsl(var(--tf-fg))',
  fontSize: 12,
  boxSizing: 'border-box',
};

export function ScenarioWorksheet() {
  const { activeStudy, cohorts, setScenarios, scenarios } = useCountyStudioStore();
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('PercentageIncrease');
  const [magnitude, setMagnitude] = useState('');
  const [rationale, setRationale] = useState('');
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = !!activeStudy && !!selectedCohortId && magnitude !== '' && rationale.length > 0;

  const handleSave = async () => {
    if (!activeStudy || !selectedCohortId) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await scenarioApi.create({
        studyId: activeStudy.studyId,
        countyId: activeStudy.countyId,
        cohortId: selectedCohortId,
        name: `${adjustmentType} ${magnitude}`,
        adjustmentType,
        parametersJson: JSON.stringify({ magnitude: parseFloat(magnitude) }),
      });
      setScenarios([...scenarios, saved]);
      setMagnitude('');
      setRationale('');
    } catch {
      setError('Failed to save scenario. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setAdjustmentType('PercentageIncrease');
    setMagnitude('');
    setRationale('');
    setSelectedCohortId('');
    setError(null);
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: 'hsl(var(--tf-fg))' }}>
        New Scenario
      </div>

      <div>
        <label htmlFor="cs-cohort" style={labelStyle}>Cohort</label>
        <select
          id="cs-cohort"
          value={selectedCohortId}
          onChange={(e) => setSelectedCohortId(e.target.value)}
          style={inputStyle}
        >
          <option value="">— select cohort —</option>
          {cohorts.map((c) => (
            <option key={c.cohortId} value={c.cohortId}>
              {c.name} ({c.parcelCount} parcels)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cs-adj-type" style={labelStyle}>Adjustment Type</label>
        <select
          id="cs-adj-type"
          value={adjustmentType}
          onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}
          style={inputStyle}
        >
          {ADJUSTMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cs-magnitude" style={labelStyle}>
          Magnitude {adjustmentType.includes('Percentage') ? '(%)' : '($)'}
        </label>
        <input
          id="cs-magnitude"
          type="number"
          step="0.1"
          value={magnitude}
          onChange={(e) => setMagnitude(e.target.value)}
          placeholder={adjustmentType.includes('Percentage') ? 'e.g. 4.0' : 'e.g. 5000'}
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="cs-rationale" style={labelStyle}>Rationale</label>
        <textarea
          id="cs-rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Describe the basis for this adjustment..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {error && (
        <div style={{ color: '#ef4444', fontSize: 11, padding: '4px 0' }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleDiscard}
          style={{
            flex: 1,
            padding: '6px 0',
            border: '1px solid hsl(var(--tf-border))',
            borderRadius: 4,
            background: 'transparent',
            color: 'hsl(var(--tf-muted))',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Discard
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          aria-label="Save Scenario"
          style={{
            flex: 1,
            padding: '6px 0',
            border: 'none',
            borderRadius: 4,
            background: canSave ? 'hsl(var(--tf-accent))' : 'hsl(var(--tf-surface))',
            color: canSave ? '#000' : 'hsl(var(--tf-muted))',
            fontSize: 12,
            fontWeight: 600,
            cursor: canSave ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Saving…' : 'Save Scenario'}
        </button>
      </div>
    </div>
  );
}
