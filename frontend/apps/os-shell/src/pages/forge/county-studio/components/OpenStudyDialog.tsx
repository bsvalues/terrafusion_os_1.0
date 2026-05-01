import React, { useEffect, useState } from 'react';
import { studyApi } from '../countyStudyApi';
import { getCountyStudyScope } from '../countyStudyScope';
import { SUPPORTED_STUDY_TYPES } from '../countyStudioCreationSupport';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import type { CountyStudySessionDto, StudyType } from '../types/countyStudio.types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};

const dialogStyle: React.CSSProperties = {
  background: 'hsl(var(--tf-bg, 220 13% 9%))',
  border: '1px solid hsl(var(--tf-border, 220 13% 20%))',
  borderRadius: 8, padding: 24, width: 480, maxHeight: '80vh',
  display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', boxSizing: 'border-box',
  background: 'hsl(var(--tf-surface, 220 13% 14%))',
  border: '1px solid hsl(var(--tf-border, 220 13% 20%))',
  borderRadius: 4, color: 'hsl(var(--tf-fg, 0 0% 95%))', fontSize: 12,
};

const btnStyle = (primary: boolean): React.CSSProperties => ({
  padding: '6px 16px', borderRadius: 4, border: 'none', cursor: 'pointer',
  fontSize: 12, fontWeight: 600,
  background: primary ? 'hsl(var(--tf-accent, 195 100% 50%))' : 'transparent',
  color: primary ? '#000' : 'hsl(var(--tf-muted, 220 13% 50%))',
});

const STUDY_TYPES: readonly StudyType[] = SUPPORTED_STUDY_TYPES;

export function OpenStudyDialog({ open, onClose }: Props) {
  const { setStudy } = useCountyStudioStore();
  const countyScope = getCountyStudyScope();
  const [studies, setStudies] = useState<CountyStudySessionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'create'>('list');

  // Create form state
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [studyType, setStudyType] = useState<StudyType>('RatioStudy');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!countyScope.isolated) {
      setStudies([]);
      setLoading(false);
      setError('County scope required before County Studio can load studies.');
      return;
    }
    setLoading(true);
    setError(null);
    studyApi.list()
      .then(setStudies)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load studies.'))
      .finally(() => setLoading(false));
  }, [open, countyScope.isolated]);

  const handleSelect = (study: CountyStudySessionDto) => {
    setStudy(study);
    onClose();
  };

  const handleCreate = async () => {
    if (!countyScope.isolated || !countyScope.countyId) {
      setError('County scope required before County Studio can create a study.');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await studyApi.create({
        countyId: countyScope.countyId,
        taxYear,
        studyType,
        name: `${taxYear} ${studyType}`,
      });
      setStudy(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create study.');
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Open Study</div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnStyle(mode === 'list')} onClick={() => setMode('list')}>Existing Studies</button>
          <button style={btnStyle(mode === 'create')} onClick={() => setMode('create')}>New Study</button>
        </div>

        {mode === 'list' && (
          <>
            {loading && <div style={{ fontSize: 12, color: 'hsl(var(--tf-muted))' }}>Loading…</div>}
            {error && <div style={{ fontSize: 11, color: '#ef4444' }}>{error}</div>}
            {!loading && studies.length === 0 && (
              <div style={{ fontSize: 12, color: 'hsl(var(--tf-muted))' }}>
                No studies found. Create one to begin.
              </div>
            )}
            {studies.map((s) => (
              <button
                key={s.studyId}
                onClick={() => handleSelect(s)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  background: 'hsl(var(--tf-surface, 220 13% 14%))',
                  border: '1px solid hsl(var(--tf-border, 220 13% 20%))',
                  borderRadius: 6, cursor: 'pointer', color: 'hsl(var(--tf-fg, 0 0% 95%))',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {s.taxYear} {s.studyType}
                </div>
                <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
                  {s.status} · {s.countyName ?? s.countyId}
                </div>
              </button>
            ))}
          </>
        )}

        {mode === 'create' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'hsl(var(--tf-muted))', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                Tax Year
              </label>
              <input
                type="number"
                value={taxYear}
                onChange={(e) => setTaxYear(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'hsl(var(--tf-muted))', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                Study Type
              </label>
              <select value={studyType} onChange={(e) => setStudyType(e.target.value as StudyType)} style={inputStyle}>
                {STUDY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {error && <div style={{ fontSize: 11, color: '#ef4444' }}>{error}</div>}
            <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
              Active county scope: {countyScope.countyId ?? 'Unavailable'}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={btnStyle(false)} onClick={onClose}>Cancel</button>
              <button style={btnStyle(true)} onClick={handleCreate} disabled={creating || !countyScope.isolated}>
                {creating ? 'Creating…' : 'Create Study'}
              </button>
            </div>
          </>
        )}

        {mode === 'list' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={btnStyle(false)} onClick={onClose}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
