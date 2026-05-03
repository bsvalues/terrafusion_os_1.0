/**
 * DailyDigestPanel — P6.3
 *
 * Displays the top-N rule-based risk recommendations from the native data-quality endpoint.
 * Called "Today's Attention List" to be honest about what it is:
 * a ranked list from rules-based heuristics, NOT ML or AI inference.
 *
 * Endpoint: GET /api/levy/v1/data-quality/ai-recommendations
 * Data basis: LevyRates + LevyCertifications + analyzed anomaly scores.
 * Uncertainty: Rules engine only. Thresholds are statutory / policy-documented.
 *
 * @module applications/terra-levy/DailyDigestPanel
 */
import React, { useCallback, useEffect, useState } from 'react';
import { getDataQualityRecommendations, type AiRecommendation } from '../../services/levyService';

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  cyan: 'var(--terra-cyan, hsl(var(--tf-accent)))',
  textPrimary: 'var(--levy-text-primary, hsl(var(--tf-fg)))',
  textMuted: 'var(--levy-text-muted, hsl(var(--tf-fg) / 0.6))',
  textDim: 'var(--levy-text-dim, hsl(var(--tf-fg) / 0.4))',
  success: 'var(--levy-success, hsl(var(--tf-success)))',
  warning: 'var(--levy-warning, hsl(var(--tf-warning)))',
  danger: 'var(--levy-danger, hsl(var(--tf-destructive)))',
  cardBg: 'hsl(var(--tf-fg) / 0.03)',
  cardBorder: '1px solid hsl(var(--tf-fg) / 0.08)',
  cyanBorderAlpha: '1px solid hsl(var(--tf-accent) / 0.15)',
  cyanBgAlpha: 'hsl(var(--tf-accent) / 0.1)',
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  year?: number;
  /** Number of recommendations to show. Default 5. */
  top?: number;
  /** Called when user clicks "Open Calculator" for a district. */
  onOpenCalculator?: (districtId: string) => void;
  /** Called when user clicks "Certify" for a district. */
  onOpenCertification?: () => void;
}

type DigestState =
  | { status: 'loading' }
  | { status: 'ok'; items: AiRecommendation[]; critical: number; warn: number }
  | { status: 'empty' }
  | { status: 'error'; message: string };

// ── Component ──────────────────────────────────────────────────────────────

const DailyDigestPanel: React.FC<Props> = ({
  top = 5,
  onOpenCalculator,
  onOpenCertification,
}) => {
  const [state, setState] = useState<DigestState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const response = await getDataQualityRecommendations();
      const recommendations = Array.isArray(response.recommendations)
        ? response.recommendations
        : [];
      const topItems = recommendations
        .sort((a, b) => {
          const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
          return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
        })
        .slice(0, top);
      if (topItems.length === 0) {
        setState({ status: 'empty' });
        return;
      }
      const critical = topItems.filter(r => r.priority === 'high').length;
      const warn = topItems.filter(r => r.priority === 'medium').length;
      setState({ status: 'ok', items: topItems, critical, warn });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load recommendations';
      setState({ status: 'error', message: msg });
    }
  }, [top]);

  useEffect(() => { load(); }, [load]);

  return (
    <div
      style={{
        background: T.cardBg,
        border: T.cardBorder,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: T.cardBorder,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.cyan, letterSpacing: 0.5 }}>
            TODAY'S ATTENTION LIST
          </div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>
            Rules-based heuristic — not ML ·
            Source: GET /api/levy/v1/data-quality/ai-recommendations
          </div>
        </div>
        {state.status === 'ok' && (
          <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
            {state.critical > 0 && (
              <span style={{ color: T.danger }}>🔴 {state.critical} high</span>
            )}
            {state.warn > 0 && (
              <span style={{ color: T.warning }}>🟡 {state.warn} medium</span>
            )}
            {state.critical === 0 && state.warn === 0 && (
              <span style={{ color: T.success }}>🟢 All clear</span>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {state.status === 'loading' && (
        <div style={{ padding: '20px 16px', color: T.textMuted, fontSize: 13 }}>
          Loading attention list…
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && (
        <div style={{ padding: '16px', color: T.danger, fontSize: 13 }}>
          ✗ {state.message}
          <button
            onClick={load}
            style={{ marginLeft: 10, color: T.cyan, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {state.status === 'empty' && (
        <div style={{ padding: '20px 16px', color: T.textMuted, fontSize: 13, textAlign: 'center' }}>
          <div style={{ marginBottom: 4 }}>🟢 No items flagged</div>
          <div style={{ fontSize: 11, color: T.textDim }}>
            All districts within thresholds, or no certification records found.
          </div>
        </div>
      )}

      {/* Recommendations list */}
      {state.status === 'ok' && state.items.map((rec, i) => (
        <DigestCard
          key={i}
          rec={rec}
          onOpenCalculator={onOpenCalculator}
          onOpenCertification={onOpenCertification}
        />
      ))}

      {/* Footer */}
      {state.status === 'ok' && state.items.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            borderTop: T.cardBorder,
            fontSize: 11,
            color: T.textDim,
          }}
        >
          Showing top {state.items.length} items. Data basis: LevyRates + LevyCertifications.
        </div>
      )}
    </div>
  );
};

// ── DigestCard ─────────────────────────────────────────────────────────────

function priorityIcon(p: string): string {
  if (p === 'high') return '🔴';
  if (p === 'medium') return '🟡';
  return '🟢';
}

const DigestCard: React.FC<{
  rec: AiRecommendation;
  onOpenCalculator?: (districtId: string) => void;
  onOpenCertification?: () => void;
}> = ({ rec, onOpenCalculator, onOpenCertification }) => {
  return (
    <div
      style={{
        borderBottom: '1px solid hsl(var(--tf-fg) / 0.06)',
        padding: '12px 16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 14, lineHeight: '20px', flexShrink: 0 }}>
          {priorityIcon(rec.priority)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--levy-text-primary, hsl(var(--tf-fg)))', lineHeight: '18px' }}>
            {rec.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--levy-text-muted, hsl(var(--tf-fg) / 0.6))', marginTop: 3, lineHeight: 1.5 }}>
            {rec.description}
          </div>
          {rec.affectedArea && (
            <div style={{ fontSize: 11, color: 'var(--levy-text-dim, hsl(var(--tf-fg) / 0.4))', marginTop: 4 }}>
              Area: {rec.affectedArea}
              {rec.estimatedImpact ? ` · Impact: ${rec.estimatedImpact}` : ''}
            </div>
          )}
          {rec.action && (
            <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
              {onOpenCalculator && (
                <button
                  onClick={() => onOpenCalculator(rec.affectedArea ?? '')}
                  style={{
                    padding: '4px 10px', background: 'none',
                    border: '1px solid var(--terra-cyan, hsl(var(--tf-accent)))',
                    borderRadius: 4, color: 'var(--terra-cyan, hsl(var(--tf-accent)))',
                    cursor: 'pointer', fontSize: 11,
                  }}
                >
                  🧮 Calculator
                </button>
              )}
              {onOpenCertification && (
                <button
                  onClick={onOpenCertification}
                  style={{
                    padding: '4px 10px', background: 'none',
                    border: '1px solid hsl(var(--tf-fg) / 0.2)',
                    borderRadius: 4, color: 'var(--levy-text-muted, hsl(var(--tf-fg) / 0.6))',
                    cursor: 'pointer', fontSize: 11,
                  }}
                >
                  📋 Certification
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyDigestPanel;
