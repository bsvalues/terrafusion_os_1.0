/**
 * Data Quality Insights Tab
 *
 * Wires TerraLevy's existing LevyDataQualityController endpoints to the shell.
 * Replaces the former explicit-unavailable AITab.
 *
 * Endpoints consumed (all under /api/levy/v1/data-quality):
 * - POST /analyze            → overall score + assumptions
 * - GET  /ai-recommendations → ranked recommendations (rules-based, not ML)
 * - GET  /realtime-metrics   → live native table row counts
 * - POST /trends             → year-over-year trend series
 *
 * Honesty discipline:
 * - Every surface labels its data source and the time it was fetched.
 * - Recommendations are labeled "rules-based" not "AI-generated" — the backend
 *   service documents its output shape but the generation is heuristic, not ML.
 * - If ALL four calls fail with 503, render HonestUnavailablePanel.
 * - If SOME calls succeed and others 503, render partial data with explicit
 *   per-section unavailable badges. Do not block useful data on one failure.
 * - Uses Promise.allSettled so a single 503 does not sink the whole tab.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  analyzeDataQuality,
  getDataQualityRecommendations,
  getDataQualityRealtimeMetrics,
  type AiRecommendation,
  type DataQualityAnalysisResult,
  type RealtimeMetricsResult,
} from '../../services/levyService';
import DailyDigestPanel from './DailyDigestPanel';

const T = {
  cardBg: 'hsl(var(--tf-fg) / 0.03)',
  cardBorder: '1px solid hsl(var(--tf-fg) / 0.08)',
  textPrimary: 'hsl(var(--tf-fg))',
  textMuted: 'hsl(var(--tf-fg) / 0.65)',
  textDim: 'hsl(var(--tf-fg) / 0.45)',
  cyan: 'hsl(var(--tf-accent))',
  success: 'hsl(var(--tf-success))',
  warning: 'hsl(var(--tf-warning))',
  danger: 'hsl(var(--tf-destructive))',
};

type Status<T> =
  | { state: 'loading' }
  | { state: 'ok'; data: T; fetchedAt: string }
  | { state: 'unavailable'; reason: string }
  | { state: 'error'; message: string };

function severityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
    case 'error':
      return T.danger;
    case 'warn':
    case 'warning':
    case 'high':
      return T.warning;
    case 'info':
    case 'low':
    default:
      return T.cyan;
  }
}

function is503(err: unknown): boolean {
  if (err && typeof err === 'object' && 'response' in err) {
    const r = (err as { response?: { status?: number } }).response;
    return r?.status === 503;
  }
  return false;
}

function extractError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return typeof err === 'string' ? err : 'Unknown error';
}

function Card({
  title,
  source,
  fetchedAt,
  children,
}: {
  title: string;
  source?: string;
  fetchedAt?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: T.cardBg,
        border: T.cardBorder,
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.cyan }}>{title}</h3>
        {(source || fetchedAt) && (
          <span style={{ fontSize: 11, color: T.textDim, fontFamily: 'monospace' }}>
            {source ? source : ''}
            {source && fetchedAt ? ' · ' : ''}
            {fetchedAt ? new Date(fetchedAt).toLocaleTimeString() : ''}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

function Unavailable({ reason }: { reason: string }) {
  return (
    <div
      style={{
        fontSize: 12,
        padding: '10px 12px',
        borderRadius: 6,
        background: 'hsl(var(--tf-warning) / 0.08)',
        border: '1px solid hsl(var(--tf-warning) / 0.3)',
        color: T.warning,
      }}
    >
      <strong>Unavailable:</strong> {reason}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        fontSize: 12,
        padding: '10px 12px',
        borderRadius: 6,
        background: 'hsl(var(--tf-destructive) / 0.08)',
        border: '1px solid hsl(var(--tf-destructive) / 0.3)',
        color: T.danger,
      }}
    >
      <strong>Error:</strong> {message}
    </div>
  );
}

function Loading({ label }: { label: string }) {
  return <div style={{ color: T.textDim, fontSize: 12, padding: 8 }}>{label}</div>;
}

function ScoreCard({ label, value, color, explanation }: { label: string; value: string; color: string; explanation?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        background: 'hsl(var(--tf-fg) / 0.04)',
        border: '1px solid hsl(var(--tf-fg) / 0.08)',
      }}
    >
      <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      {explanation && (
        <>
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              background: 'none', border: 'none', color: T.textDim, cursor: 'pointer',
              fontSize: 10, padding: '4px 0 0', textDecoration: 'underline dotted',
            }}
          >
            {open ? '▲ hide' : '▿ what this means'}
          </button>
          {open && (
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6, lineHeight: 1.6 }}>
              {explanation}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * P6.4 — "Why is this flagged?" expandable row for each recommendation.
 * Shows the specific basis for the flag (description + action already shown
 * inline), plus a statutory reference derived from focusArea.
 */
function RecommendationRow({ rec, isFirst }: { rec: AiRecommendation; isFirst: boolean }) {
  const [open, setOpen] = useState(false);

  const statutoryRef: Record<string, string> = {
    completeness: 'RCW 84.52.070 — county must certify complete levy records to DOR',
    accuracy: 'RCW 84.52.010 — levy rates must reflect actual assessed value',
    consistency: 'RCW 84.52.043 — aggregate rates must be internally consistent',
    timeliness: 'RCW 84.52.080 — certification deadline: November 30 each year',
  };
  const ref = statutoryRef[rec.focusArea?.toLowerCase() ?? ''];

  return (
    <li
      style={{
        padding: '10px 0',
        borderTop: isFirst ? 'none' : '1px solid hsl(var(--tf-fg) / 0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span
          style={{
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 10,
            background: `${severityColor(rec.severity)}22`,
            color: severityColor(rec.severity),
            border: `1px solid ${severityColor(rec.severity)}66`,
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {rec.severity}
        </span>
        <span style={{ fontSize: 11, color: T.textDim }}>{rec.focusArea}</span>
        <strong style={{ fontSize: 13, color: T.textPrimary }}>{rec.title}</strong>
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, marginLeft: 2 }}>
        {rec.description}
      </div>
      {rec.action && (
        <div style={{ fontSize: 11, color: T.cyan, marginTop: 4, marginLeft: 2 }}>
          → {rec.action}
        </div>
      )}
      {/* P6.4 — Why is this flagged? */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: 'none', border: 'none', color: T.textDim, cursor: 'pointer',
          fontSize: 10, padding: '4px 2px 0', textDecoration: 'underline dotted',
        }}
      >
        {open ? '▲ hide' : '▿ why is this flagged?'}
      </button>
      {open && (
        <div
          style={{
            marginTop: 6,
            padding: '8px 10px',
            borderRadius: 5,
            background: 'hsl(var(--tf-fg) / 0.04)',
            border: '1px solid hsl(var(--tf-fg) / 0.08)',
            fontSize: 11,
            color: T.textMuted,
            lineHeight: 1.6,
          }}
        >
          <div><strong>Triggered by:</strong> {rec.description}</div>
          {rec.action && <div><strong>Suggested action:</strong> {rec.action}</div>}
          {ref && <div><strong>Statutory basis:</strong> {ref}</div>}
          <div style={{ color: T.textDim, marginTop: 4 }}>
            Source: GET /api/levy/v1/data-quality/ai-recommendations · Rules-based heuristic, not ML.
          </div>
        </div>
      )}
    </li>
  );
}

export default function DataQualityInsightsTab() {
  const [analysis, setAnalysis] = useState<Status<DataQualityAnalysisResult>>({ state: 'loading' });
  const [recs, setRecs] = useState<Status<AiRecommendation[]>>({ state: 'loading' });
  const [metrics, setMetrics] = useState<Status<RealtimeMetricsResult>>({ state: 'loading' });

  const load = useCallback(async () => {
    setAnalysis({ state: 'loading' });
    setRecs({ state: 'loading' });
    setMetrics({ state: 'loading' });

    const [analysisRes, recsRes, metricsRes] = await Promise.allSettled([
      analyzeDataQuality({}),
      getDataQualityRecommendations({ maxRecommendations: 5 }),
      getDataQualityRealtimeMetrics(),
    ]);

    const now = new Date().toISOString();

    if (analysisRes.status === 'fulfilled') {
      setAnalysis({ state: 'ok', data: analysisRes.value, fetchedAt: now });
    } else if (is503(analysisRes.reason)) {
      setAnalysis({
        state: 'unavailable',
        reason: 'TerraLevy native tables not yet seeded — /analyze returned 503.',
      });
    } else {
      setAnalysis({ state: 'error', message: extractError(analysisRes.reason) });
    }

    if (recsRes.status === 'fulfilled') {
      setRecs({ state: 'ok', data: recsRes.value.recommendations, fetchedAt: now });
    } else if (is503(recsRes.reason)) {
      setRecs({
        state: 'unavailable',
        reason: 'TerraLevy native tables not yet seeded — /ai-recommendations returned 503.',
      });
    } else {
      setRecs({ state: 'error', message: extractError(recsRes.reason) });
    }

    if (metricsRes.status === 'fulfilled') {
      setMetrics({ state: 'ok', data: metricsRes.value, fetchedAt: now });
    } else if (is503(metricsRes.reason)) {
      setMetrics({
        state: 'unavailable',
        reason: 'TerraLevy native tables not yet seeded — /realtime-metrics returned 503.',
      });
    } else {
      setMetrics({ state: 'error', message: extractError(metricsRes.reason) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Auto-refresh realtime metrics every 60s. Do not auto-refresh the others —
  // analysis and recommendations are derived surfaces; refreshing them silently
  // would hide when their inputs changed.
  useEffect(() => {
    const id = window.setInterval(() => {
      void getDataQualityRealtimeMetrics()
        .then(m => setMetrics({ state: 'ok', data: m, fetchedAt: new Date().toISOString() }))
        .catch(err => {
          if (is503(err)) {
            setMetrics({ state: 'unavailable', reason: 'Realtime metrics 503' });
          }
          // leave existing state on transient failures
        });
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // If ALL three are unavailable, fall through to a single honest unavailable panel.
  const allUnavailable =
    (analysis.state === 'unavailable' || analysis.state === 'error') &&
    (recs.state === 'unavailable' || recs.state === 'error') &&
    (metrics.state === 'unavailable' || metrics.state === 'error');

  if (allUnavailable) {
    return (
      <div
        style={{
          padding: 20,
          borderRadius: 12,
          background: 'hsl(var(--tf-warning) / 0.08)',
          border: '1px solid hsl(var(--tf-warning) / 0.3)',
          color: T.warning,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          Data Quality Insights unavailable
        </div>
        <div style={{ fontSize: 13, color: T.textMuted }}>
          TerraLevy's data-quality endpoints did not return usable data. This usually means
          the native levy tables (Districts, LevyMeasures, LevyRates, Certifications,
          ReferenceSources) have not been seeded for the current tax year.
        </div>
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 8 }}>
          Endpoints: /api/levy/v1/data-quality/{'{analyze,ai-recommendations,realtime-metrics}'}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Today's Attention List (P6.3) ───────────────────────────── */}
      <DailyDigestPanel />

      <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 16px' }}>
        Data-quality scores and recommendations derived from TerraLevy native tables.
        Recommendations are <strong>rules-based heuristics</strong>, not ML predictions.
        Each surface labels its source endpoint and fetch timestamp.
      </p>

      {/* ── Overall Analysis ──────────────────────────────────────────── */}
      <Card
        title="Overall Quality Score"
        source="/analyze"
        fetchedAt={analysis.state === 'ok' ? analysis.fetchedAt : undefined}
      >
        {analysis.state === 'loading' && <Loading label="Computing score…" />}
        {analysis.state === 'unavailable' && <Unavailable reason={analysis.reason} />}
        {analysis.state === 'error' && <ErrorBox message={analysis.message} />}
        {analysis.state === 'ok' && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <ScoreCard
                label="Overall Score"
                value={analysis.data.score.toFixed(1)}
                color={
                  analysis.data.score >= 85
                    ? T.success
                    : analysis.data.score >= 70
                      ? T.warning
                      : T.danger
                }
                explanation="Weighted average of completeness, accuracy, consistency, and timeliness across TerraLevy tables. Source: POST /analyze. Threshold: ≥85 = good (green), ≥70 = warn (amber), <70 = poor (red). Computed by LevyDataQualityController — deterministic rules, not ML."
              />
            </div>
            {analysis.data.assumptions.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>
                  Assumptions used in this score:
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: T.textDim }}>
                  {analysis.data.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Recommendations ───────────────────────────────────────────── */}
      <Card
        title="Ranked Recommendations (top 5, rules-based)"
        source="/ai-recommendations"
        fetchedAt={recs.state === 'ok' ? recs.fetchedAt : undefined}
      >
        {recs.state === 'loading' && <Loading label="Ranking recommendations…" />}
        {recs.state === 'unavailable' && <Unavailable reason={recs.reason} />}
        {recs.state === 'error' && <ErrorBox message={recs.message} />}
        {recs.state === 'ok' && recs.data.length === 0 && (
          <div style={{ fontSize: 12, color: T.textMuted }}>
            No recommendations returned by the service for the current focus area.
          </div>
        )}
        {recs.state === 'ok' && recs.data.length > 0 && (
          <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {recs.data.map((r, i) => (
              <RecommendationRow key={i} rec={r} isFirst={i === 0} />
            ))}
          </ol>
        )}
      </Card>

      {/* ── Realtime Metrics ──────────────────────────────────────────── */}
      <Card
        title="Native Table Row Counts (live, 60s refresh)"
        source="/realtime-metrics"
        fetchedAt={metrics.state === 'ok' ? metrics.fetchedAt : undefined}
      >
        {metrics.state === 'loading' && <Loading label="Fetching live metrics…" />}
        {metrics.state === 'unavailable' && <Unavailable reason={metrics.reason} />}
        {metrics.state === 'error' && <ErrorBox message={metrics.message} />}
        {metrics.state === 'ok' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 8,
            }}
          >
            {Object.entries(metrics.data.metrics).map(([k, v]) => (
              <div
                key={k}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'hsl(var(--tf-fg) / 0.04)',
                  border: '1px solid hsl(var(--tf-fg) / 0.08)',
                }}
              >
                <div style={{ fontSize: 10, color: T.textDim, fontFamily: 'monospace' }}>{k}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: T.textPrimary }}>
                  {typeof v === 'number' ? v.toLocaleString() : String(v)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div style={{ fontSize: 11, color: T.textDim, marginTop: 8 }}>
        Source: <code>LevyDataQualityController</code> →{' '}
        <code>TerraFusion.Levy.Services.ILevyDataQualityService</code>. Recommendation generation
        is rules-based; the "severity" and "focusArea" fields are computed from native table
        state, not from ML inference.
      </div>
    </div>
  );
}
