/**
 * DataQualityTab.tsx
 *
 * PACS data quality scanner for the cost approach.
 * Calls /costforge/analytics/data-quality/assess and surfaces:
 * - completeness score (missing fields)
 * - accuracy score (values out of expected range)
 * - consistency score (cross-field conflicts)
 * - outlier detection (IQR flagged records)
 *
 * Each issue shown with count and actionable description.
 */
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/apiBase';
import { useCostForgeWorkspaceStore } from '../costForgeWorkspaceStore';

interface DataQualityResult {
  completenessScore: number;
  accuracyScore: number;
  consistencyScore: number;
  outlierDetection: {
    flaggedCount: number;
    method: string;
  };
  issues: Array<{
    category: string;
    field: string;
    affectedCount: number;
    description: string;
    severity: 'critical' | 'warning' | 'info';
  }>;
  assessedAt: string;
}

function ScoreGauge({ label, score }: { label: string; score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 90 ? 'var(--cf-success)' : pct >= 70 ? 'var(--cf-warn)' : 'var(--cf-danger)';
  return (
    <div style={{
      padding: '12px 14px',
      background: 'var(--cf-surface)',
      border: '1px solid var(--cf-border)',
      borderRadius: 6,
      flex: 1,
      minWidth: 140,
    }}>
      <div style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
        {pct}%
      </div>
      <div className="cf-progress-track" style={{ marginTop: 8 }}>
        <div
          className="cf-progress-fill"
          style={{ width: `${pct}%`, background: color, transition: 'width 0.5s ease' }}
        />
      </div>
    </div>
  );
}

function SeverityDot({ severity }: { severity: 'critical' | 'warning' | 'info' }) {
  const color = severity === 'critical'
    ? 'var(--cf-danger)'
    : severity === 'warning'
    ? 'var(--cf-warn)'
    : 'var(--cf-info)';
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 6, flexShrink: 0 }} />
  );
}

export function DataQualityTab() {
  const taxYear = useCostForgeWorkspaceStore((s) => s.taxYear);
  const [result, setResult]   = useState<DataQualityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function runAssessment() {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    apiFetch<DataQualityResult>('/costforge/analytics/data-quality/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taxYear }),
      signal: abortRef.current.signal,
    })
      .then((d) => { setResult(d); setLoading(false); })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Assessment failed');
        setLoading(false);
      });
  }

  useEffect(() => {
    runAssessment();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxYear]);

  return (
    <div>
      <div className="cf-action-bar">
        <span style={{ fontSize: '0.8125rem', color: 'var(--cf-muted)' }}>
          PACS data quality — {taxYear} cost approach records
        </span>
        <div className="cf-action-bar__spacer" />
        <button type="button" className="cf-btn cf-btn--ghost" onClick={runAssessment} disabled={loading}>
          {loading ? 'Scanning…' : 'Re-scan'}
        </button>
      </div>

      {error && <div className="cf-state cf-state--error">{error}</div>}
      {loading && <div className="cf-state">Scanning PACS data quality…</div>}

      {result && (
        <>
          {/* Score gauges */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <ScoreGauge label="Completeness" score={result.completenessScore} />
            <ScoreGauge label="Accuracy" score={result.accuracyScore} />
            <ScoreGauge label="Consistency" score={result.consistencyScore} />
            <div style={{
              padding: '12px 14px',
              background: 'var(--cf-surface)',
              border: '1px solid var(--cf-border)',
              borderRadius: 6,
              flex: 1,
              minWidth: 140,
            }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--cf-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                Outliers Flagged
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: result.outlierDetection.flaggedCount > 0 ? 'var(--cf-warn)' : 'var(--cf-success)', fontVariantNumeric: 'tabular-nums' }}>
                {result.outlierDetection.flaggedCount.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--cf-subtle)', marginTop: 4 }}>
                via {result.outlierDetection.method}
              </div>
            </div>
          </div>

          {/* Issues list */}
          {result.issues.length === 0 ? (
            <div style={{ padding: '16px', color: 'var(--cf-success)', fontSize: '0.875rem' }}>
              ✓ No data quality issues found.
            </div>
          ) : (
            <div>
              {result.issues
                .sort((a, b) => {
                  const order = { critical: 0, warning: 1, info: 2 };
                  return order[a.severity] - order[b.severity];
                })
                .map((issue, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--cf-border)',
                    fontSize: '0.8125rem',
                  }}>
                    <SeverityDot severity={issue.severity} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        {issue.category} — <code style={{ fontSize: '0.8rem' }}>{issue.field}</code>
                      </div>
                      <div style={{ color: 'var(--cf-muted)' }}>{issue.description}</div>
                    </div>
                    <div style={{
                      flexShrink: 0,
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 600,
                      color: issue.severity === 'critical' ? 'var(--cf-danger)' : issue.severity === 'warning' ? 'var(--cf-warn)' : 'var(--cf-muted)',
                    }}>
                      {issue.affectedCount.toLocaleString()} records
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div style={{ padding: '10px 0', fontSize: '0.75rem', color: 'var(--cf-subtle)' }}>
            Assessed: {new Date(result.assessedAt).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}
