import React, { useState } from 'react';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { cohortApi } from '../countyStudyApi';
import { SUPPORTED_SELECTION_TYPES } from '../countyStudioCreationSupport';
import type { SelectionType } from '../types/countyStudio.types';

export function CohortCreationDialog() {
  const { pendingSelection, activeStudy, cohorts, setCohorts, setPendingSelection } = useCountyStudioStore();
  const [name, setName] = useState('');
  const [selectionType, setSelectionType] = useState<SelectionType>('Visual');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!pendingSelection || !activeStudy) return null;

  const canCreate = name.trim().length > 0;
  const selectionLabels: Record<SelectionType, string> = {
    Visual: 'Visual (lasso / polygon)',
    RuleBased: 'Rule-Based',
    Hybrid: 'Hybrid',
    Manual: 'Manual parcel list',
  };

  const handleCancel = () => {
    setPendingSelection(null);
    setName('');
    setError(null);
  };

  const handleCreate = async () => {
    if (!canCreate) return;
    setCreating(true);
    setError(null);
    try {
      const created = await cohortApi.create({
        studyId: activeStudy.studyId,
        name: name.trim(),
        selectionType,
        definition: JSON.stringify({
          source: pendingSelection.source,
          geometry: pendingSelection.geometry ?? null,
        }),
        parcelCount: pendingSelection.parcelCount,
        isHybrid: false,
      });
      setCohorts([...cohorts, created]);
      setPendingSelection(null);
      setName('');
    } catch {
      setError('Failed to create cohort. Try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 100,
        }}
        onClick={handleCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create Cohort"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'hsl(var(--tf-bg))',
          border: '1px solid hsl(var(--tf-border))',
          borderRadius: 8,
          padding: 24,
          width: 400,
          zIndex: 101,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>Create Cohort</h2>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: 'hsl(var(--tf-muted))' }}>
          {pendingSelection.parcelCount} parcels selected via {pendingSelection.source}.
          {pendingSelection.areaEstimate
            ? ` Estimated area: ${pendingSelection.areaEstimate.toFixed(1)} sq mi.`
            : ''}
        </p>

        <div style={{ marginBottom: 12 }}>
          <label
            htmlFor="cohort-name"
            style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'hsl(var(--tf-muted))', marginBottom: 4 }}
          >
            Cohort Name
          </label>
          <input
            id="cohort-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. West Richland R1 – Underassessed"
            autoFocus
            style={{
              width: '100%',
              padding: '7px 10px',
              background: 'hsl(var(--tf-surface))',
              border: '1px solid hsl(var(--tf-border))',
              borderRadius: 4,
              color: 'hsl(var(--tf-fg))',
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="cohort-type"
            style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'hsl(var(--tf-muted))', marginBottom: 4 }}
          >
            Selection Type
          </label>
          <select
            id="cohort-type"
            value={selectionType}
            onChange={(e) => setSelectionType(e.target.value as SelectionType)}
            style={{
              width: '100%',
              padding: '7px 10px',
              background: 'hsl(var(--tf-surface))',
              border: '1px solid hsl(var(--tf-border))',
              borderRadius: 4,
              color: 'hsl(var(--tf-fg))',
              fontSize: 13,
              boxSizing: 'border-box',
            }}
          >
            {SUPPORTED_SELECTION_TYPES.map((type) => (
              <option key={type} value={type}>{selectionLabels[type]}</option>
            ))}
          </select>
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: 11, marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            aria-label="Cancel"
            onClick={handleCancel}
            style={{
              padding: '7px 16px',
              border: '1px solid hsl(var(--tf-border))',
              borderRadius: 4,
              background: 'transparent',
              color: 'hsl(var(--tf-muted))',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            aria-label="Create Cohort"
            onClick={handleCreate}
            disabled={!canCreate || creating}
            style={{
              padding: '7px 16px',
              border: 'none',
              borderRadius: 4,
              background: canCreate ? 'hsl(var(--tf-accent))' : 'hsl(var(--tf-surface))',
              color: canCreate ? '#000' : 'hsl(var(--tf-muted))',
              fontSize: 13,
              fontWeight: 600,
              cursor: canCreate && !creating ? 'pointer' : 'not-allowed',
            }}
          >
            {creating ? 'Creating…' : 'Create Cohort'}
          </button>
        </div>
      </div>
    </>
  );
}
