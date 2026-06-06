// frontend/apps/os-shell/src/pages/forge/county-studio/components/ObjectInspector.tsx
//
// Task D — three-tab Inspector (Fix #4, #5, #8).
//
//   Metrics tab — IAAO core + equity-method row (PRB band / VEI bar /
//                 classification pill / Equity Score big number) +
//                 warnings list (same vocabulary as CountyHealthPanel).
//   Trend tab   — 3 sparklines (median / COD / exception rate) from the
//                 backend-supplied 5-year history. Empty-state copy when
//                 history has fewer than 2 points.
//   Action tab  — 5 handoff buttons (SalesForge / CostForge / CompsForge /
//                 Dais / Dossier) + the preserved Atlas + Workbench links
//                 in a "Spatial" group above. Any button whose backend
//                 DeeplinkQuery is null renders disabled with an honest
//                 tooltip — ui-honesty-pass.
//
// Data comes from two independent calls via the ../hooks/useInspectorData
// hook; each tab handles its own loading / error state so one failing
// endpoint does not black out the entire panel.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import activateModule from '@/orchestration/moduleActivation';
import { useInspectorData } from '../hooks/useInspectorData';
import { exceptionApi, type CountyDownstreamClosureReceiptDto } from '../countyStudyApi';
import { AiDiagnosisPanel } from './AiDiagnosisPanel';
import {
  useDownstreamClosureReceiptStore,
  type DownstreamClosureReceipt,
} from '@/pages/suites/downstreamClosureReceiptStore';
import type {
  CountySegmentDetailDto,
  EquityClassification,
  SegmentActionContextDto,
  SegmentYearPoint,
} from '../types/countyStudio.types';
import { sanitizeCountyStudioHandoffQuery } from '../utils/cityPrimarySanitizer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// ── Presentation atoms ────────────────────────────────────────────────────

const MetricRow = ({
  label, value, color,
}: { label: string; value: string; color?: string }) => (
  <div
    style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '5px 0', borderBottom: '1px solid hsl(var(--tf-border))',
    }}
  >
    <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}>{label}</span>
    <span style={{ fontSize: 12, fontWeight: 600, color: color ?? 'hsl(var(--tf-fg))' }}>{value}</span>
  </div>
);

const handoffBtnBaseStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '8px 10px', borderRadius: 4,
  border: '1px solid hsl(var(--tf-border))', background: 'transparent',
  color: 'hsl(var(--tf-fg))', fontSize: 11, fontWeight: 600, cursor: 'pointer',
  textAlign: 'left', marginBottom: 6,
};

const disabledBtnStyle: React.CSSProperties = {
  ...handoffBtnBaseStyle,
  opacity: 0.5, cursor: 'not-allowed',
};

// ── Colour helpers (shared scale with CountyHealthPanel) ─────────────────

function codColor(cod: number | null): string {
  if (cod === null) return 'hsl(var(--tf-muted))';
  if (cod > 20) return '#ef4444';
  if (cod > 15) return '#f59e0b';
  return '#22c55e';
}

function prdColor(prd: number | null): string {
  if (prd === null) return 'hsl(var(--tf-muted))';
  if (prd < 0.98 || prd > 1.03) return '#ef4444';
  if (prd < 0.99 || prd > 1.02) return '#f59e0b';
  return '#22c55e';
}

function ratioColor(r: number | null): string {
  if (r === null) return 'hsl(var(--tf-muted))';
  const d = Math.abs(r - 1.0);
  if (d > 0.1) return '#ef4444';
  if (d > 0.05) return '#f59e0b';
  return '#22c55e';
}

/**
 * PRB colour bands: |PRB| ≤ 0.05 green; ≤ 0.10 amber; else red.
 * Null / insufficient → muted. Matches the backend PRB fairness thresholds.
 */
function prbColor(prb: number | null): string {
  if (prb === null) return 'hsl(var(--tf-muted))';
  const abs = Math.abs(prb);
  if (abs <= 0.05) return '#22c55e';
  if (abs <= 0.10) return '#f59e0b';
  return '#ef4444';
}

/** Classification pill colour bucket. InsufficientData stays neutral. */
function classificationStyle(c: EquityClassification): { bg: string; color: string } {
  switch (c) {
    case 'Fair':             return { bg: '#22c55e22', color: '#22c55e' };
    case 'Progressive':      return { bg: '#f59e0b22', color: '#f59e0b' };
    case 'Regressive':       return { bg: '#ef444422', color: '#ef4444' };
    case 'InsufficientData': return { bg: 'hsl(var(--tf-border))', color: 'hsl(var(--tf-muted))' };
  }
}

// ── Equity-method row ─────────────────────────────────────────────────────

const LegacyEquityRow = ({ detail }: { detail: CountySegmentDetailDto }) => {
  const pill = classificationStyle(detail.equityClassification);
  // VEI bar min=0 max=100; clamp for sane rendering.
  const veiPct = detail.vei === null ? 0 : Math.max(0, Math.min(100, detail.vei));
  return (
    <div
      data-testid="inspector-equity-row"
      style={{
        marginTop: 12, padding: 10,
        border: '1px solid hsl(var(--tf-border))',
        background: 'hsl(var(--tf-surface))',
        borderRadius: 4,
      }}
    >
      <div
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          color: 'hsl(var(--tf-muted))', marginBottom: 6,
        }}
      >
        Equity Method
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>PRB</div>
          <div
            data-testid="inspector-prb-value"
            data-band={detail.prb === null ? 'none' : (Math.abs(detail.prb) <= 0.05 ? 'fair' : Math.abs(detail.prb) <= 0.10 ? 'marginal' : 'breach')}
            style={{
              fontSize: 16, fontWeight: 700, fontFeatureSettings: '"tnum"',
              color: prbColor(detail.prb),
            }}
          >
            {detail.prb === null ? '—' : detail.prb.toFixed(3)}
          </div>
          <div style={{ fontSize: 9, color: 'hsl(var(--tf-muted))' }}>|PRB| ≤ 0.05 fair</div>
        </div>

        <div>
          <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>Equity Score</div>
          <div
            data-testid="inspector-equity-score"
            style={{
              fontSize: 22, fontWeight: 700, fontFeatureSettings: '"tnum"',
              color: 'hsl(var(--tf-fg))',
            }}
          >
            {detail.equityScore === null ? '—' : detail.equityScore.toFixed(0)}
          </div>
          <div style={{ fontSize: 9, color: 'hsl(var(--tf-muted))' }}>0-100, higher = fairer</div>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>VEI (vertical equity, 0-100)</div>
        <div
          role="presentation"
          style={{
            position: 'relative', height: 8, marginTop: 4,
            background: 'hsl(var(--tf-bg))',
            border: '1px solid hsl(var(--tf-border))', borderRadius: 3,
          }}
        >
          <div
            data-testid="inspector-vei-bar"
            data-value={detail.vei ?? ''}
            style={{
              height: '100%', width: `${veiPct}%`,
              background: veiPct >= 80 ? '#22c55e' : veiPct >= 60 ? '#f59e0b' : '#ef4444',
              transition: 'width 120ms',
            }}
          />
        </div>
        <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
          {detail.vei === null ? 'insufficient data' : detail.vei.toFixed(1)}
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <span
          data-testid="inspector-classification-pill"
          data-classification={detail.equityClassification}
          style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 12,
            background: pill.bg, color: pill.color,
            fontWeight: 700, fontSize: 11,
          }}
        >
          {detail.equityClassification}
        </span>
      </div>
    </div>
  );
};

// ── Sparkline ─────────────────────────────────────────────────────────────

/** Single inline SVG sparkline for one metric across the YoY history. */
const Sparkline = ({
  points, selector, label, format, currentYear,
}: {
  points: SegmentYearPoint[];
  selector: (p: SegmentYearPoint) => number | null;
  label: string;
  format: (v: number) => string;
  currentYear: number;
}) => {
  const width = 240;
  const height = 40;
  const vals = points.map(selector);
  const present = vals.filter((v): v is number => v !== null);
  if (present.length < 2) {
    return (
      <div
        data-testid={`inspector-sparkline-${label.toLowerCase().replace(/\s/g, '-')}-empty`}
        style={{
          fontSize: 11, color: 'hsl(var(--tf-muted))', padding: '8px 0',
          borderBottom: '1px solid hsl(var(--tf-border))',
        }}
      >
        <strong style={{ color: 'hsl(var(--tf-fg))' }}>{label}</strong>: not enough history
      </div>
    );
  }
  const min = Math.min(...present);
  const max = Math.max(...present);
  const range = max - min || 1;
  const step = width / Math.max(points.length - 1, 1);

  const poly = points
    .map((p, i) => {
      const v = selector(p);
      if (v === null) return null;
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter((s): s is string => s !== null)
    .join(' ');

  return (
    <div
      data-testid={`inspector-sparkline-${label.toLowerCase().replace(/\s/g, '-')}`}
      style={{
        display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0',
        borderBottom: '1px solid hsl(var(--tf-border))',
      }}
    >
      <span style={{ fontSize: 11, color: 'hsl(var(--tf-muted))', width: 72, flexShrink: 0 }}>
        {label}
      </span>
      <svg
        width={width} height={height} viewBox={`0 0 ${width} ${height}`}
        style={{ flexShrink: 0 }}
        role="img"
        aria-label={`${label} trend across ${points.length} years`}
      >
        <polyline
          fill="none"
          stroke="hsl(var(--tf-fg))"
          strokeWidth={1.3}
          points={poly}
        />
        {points.map((p, i) => {
          const v = selector(p);
          if (v === null) return null;
          const x = i * step;
          const y = height - ((v - min) / range) * height;
          const current = p.taxYear === currentYear || p.isCurrentYear;
          return (
            <circle
              key={p.taxYear}
              cx={x}
              cy={y}
              r={current ? 3 : 2}
              fill={current ? '#22c55e' : 'hsl(var(--tf-fg))'}
              data-year={p.taxYear}
              data-current={current ? 'true' : 'false'}
            >
              <title>{`${p.taxYear}: ${format(v)}`}</title>
            </circle>
          );
        })}
      </svg>
      <span
        style={{
          fontSize: 11, fontWeight: 600, fontFeatureSettings: '"tnum"',
          color: 'hsl(var(--tf-fg))', width: 52, textAlign: 'right',
        }}
      >
        {format(present[present.length - 1])}
      </span>
    </div>
  );
};

// ── Handoff button ────────────────────────────────────────────────────────

const HandoffButton = ({
  label, subtitle, deeplinkQuery, disabledTooltip, onClick, testId, receiptLabel,
}: {
  label: string;
  subtitle: string;
  deeplinkQuery: string | null;
  disabledTooltip: string;
  onClick: () => void;
  testId: string;
  receiptLabel?: string;
}) => {
  const enabled = deeplinkQuery !== null;
  return (
    <button
      type="button"
      data-testid={testId}
      data-enabled={enabled ? 'true' : 'false'}
      aria-label={label}
      aria-disabled={!enabled}
      disabled={!enabled}
      title={enabled ? subtitle : disabledTooltip}
      onClick={() => { if (enabled) onClick(); }}
      style={enabled ? handoffBtnBaseStyle : disabledBtnStyle}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--tf-fg))' }}>{label}</div>
      <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
        {enabled ? subtitle : disabledTooltip}
      </div>
      {receiptLabel && (
        <div
          data-testid={`${testId}-receipt`}
          style={{ fontSize: 10, color: 'hsl(var(--tf-accent, 217 91% 60%))', marginTop: 3 }}
        >
          {receiptLabel}
        </div>
      )}
    </button>
  );
};

function toLocalReceipt(dto: CountyDownstreamClosureReceiptDto): DownstreamClosureReceipt {
  return {
    receiptId: dto.receiptId,
    exceptionSetId: dto.exceptionSetId,
    sourceType: dto.sourceType,
    destination: dto.destination,
    template: dto.template,
    segmentId: dto.segmentId,
    segmentLabel: dto.segmentLabel,
    status: dto.status,
    downstreamEntityId: dto.downstreamEntityId,
    evidenceRef: dto.evidenceRef,
    notes: dto.notes,
    draftedAt: dto.draftedAt,
    updatedAt: dto.updatedAt,
  };
}

// ── Tab panels ────────────────────────────────────────────────────────────

const MetricsPanel = ({
  detail, loading, error, onRetry,
}: {
  detail: CountySegmentDetailDto | null;
  loading: boolean; error: string | null; onRetry: () => void;
}) => {
  if (loading && !detail) {
    return (
      <div data-testid="inspector-metrics-loading"
        style={{ padding: 16, fontSize: 12, color: 'hsl(var(--tf-muted))' }}>
        Loading segment metrics…
      </div>
    );
  }
  if (error && !detail) {
    return (
      <div data-testid="inspector-metrics-error" role="alert"
        style={{ padding: 16, fontSize: 12, color: '#ef4444' }}>
        Unable to load segment detail. <button
          data-testid="inspector-metrics-retry"
          onClick={onRetry}
          style={{
            marginLeft: 8, padding: '3px 10px', borderRadius: 3,
            border: '1px solid hsl(var(--tf-border))',
            background: 'transparent', color: 'hsl(var(--tf-fg))',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}
        >Retry</button>
      </div>
    );
  }
  if (!detail) return null;

  return (
    <div>
      <MetricRow label="Median Ratio" value={detail.medianRatio === null ? '—' : detail.medianRatio.toFixed(3)} color={ratioColor(detail.medianRatio)} />
      <MetricRow label="COD" value={detail.cod === null ? '—' : detail.cod.toFixed(1)} color={codColor(detail.cod)} />
      <MetricRow label="PRD" value={detail.prd === null ? '—' : detail.prd.toFixed(3)} color={prdColor(detail.prd)} />
      <MetricRow label="Qualified Sales" value={detail.ratioCount.toLocaleString()} />
      <MetricRow label="Weighted Mean Ratio" value={detail.weightedMeanRatio == null ? '—' : detail.weightedMeanRatio.toFixed(3)} />
      <MetricRow label="Stability" value={detail.stabilityScore === null ? '—' : detail.stabilityScore.toFixed(0)} />
      <MetricRow label="Risk" value={detail.riskScore === null ? '—' : detail.riskScore.toFixed(0)} />
      <MetricRow label="Exceptions" value={String(detail.exceptionCount)} />
      <MetricRow label="Parcels" value={detail.parcelCount.toLocaleString()} />

      <LegacyEquityRow detail={detail} />

      <div style={{ marginTop: 12 }}>
        <div
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: 'hsl(var(--tf-muted))', marginBottom: 6,
          }}
        >
          Warnings
        </div>
        {detail.warnings.length === 0 ? (
          <div
            data-testid="inspector-no-warnings"
            style={{ fontSize: 11, color: 'hsl(var(--tf-muted))' }}
          >
            No warnings — this segment meets IAAO and equity fairness bands.
          </div>
        ) : (
          <ul
            data-testid="inspector-warnings"
            style={{
              listStyle: 'none', padding: 0, margin: 0,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}
          >
            {detail.warnings.map((w, idx) => (
              <li
                key={idx}
                style={{
                  padding: '6px 8px', borderRadius: 4,
                  background: '#f59e0b22', color: '#f59e0b',
                  fontSize: 11,
                }}
              >
                {w}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const TrendPanel = ({
  detail, loading, error, onRetry,
}: {
  detail: CountySegmentDetailDto | null;
  loading: boolean; error: string | null; onRetry: () => void;
}) => {
  if (loading && !detail) {
    return (
      <div data-testid="inspector-trend-loading"
        style={{ padding: 16, fontSize: 12, color: 'hsl(var(--tf-muted))' }}>
        Loading history…
      </div>
    );
  }
  if (error && !detail) {
    return (
      <div data-testid="inspector-trend-error" role="alert"
        style={{ padding: 16, fontSize: 12, color: '#ef4444' }}>
        Unable to load trend data.{' '}
        <button data-testid="inspector-trend-retry" onClick={onRetry}
          style={{
            marginLeft: 8, padding: '3px 10px', borderRadius: 3,
            border: '1px solid hsl(var(--tf-border))',
            background: 'transparent', color: 'hsl(var(--tf-fg))',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}
        >Retry</button>
      </div>
    );
  }
  if (!detail) return null;

  const history = detail.yearHistory;
  if (history.length < 2) {
    return (
      <div
        data-testid="inspector-trend-empty"
        style={{ padding: 16, fontSize: 12, color: 'hsl(var(--tf-muted))' }}
      >
        Not enough historical data yet — trend requires at least 2 tax years.
      </div>
    );
  }

  const currentYear = detail.taxYear;
  return (
    <div data-testid="inspector-trend-populated">
      <div
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          color: 'hsl(var(--tf-muted))', marginBottom: 4,
        }}
      >
        {history[0].taxYear} → {history[history.length - 1].taxYear}
      </div>
      <Sparkline
        points={history}
        selector={(p) => p.medianRatio}
        label="Median"
        format={(v) => v.toFixed(3)}
        currentYear={currentYear}
      />
      <Sparkline
        points={history}
        selector={(p) => p.cod}
        label="COD"
        format={(v) => v.toFixed(1)}
        currentYear={currentYear}
      />
      <Sparkline
        points={history}
        selector={(p) => p.prd}
        label="PRD"
        format={(v) => v.toFixed(3)}
        currentYear={currentYear}
      />
      <Sparkline
        points={history}
        selector={(p) => p.prb}
        label="PRB"
        format={(v) => v.toFixed(3)}
        currentYear={currentYear}
      />
      <Sparkline
        points={history}
        selector={(p) => (p.parcelCount > 0 ? (p.exceptionCount / p.parcelCount) * 100 : null)}
        label="Exc. rate"
        format={(v) => `${v.toFixed(1)}%`}
        currentYear={currentYear}
      />
    </div>
  );
};

const ActionPanel = ({
  context, loading, error, onRetry, onAtlas, onWorkbench, directReceipts, onReceiptCreated,
}: {
  context: SegmentActionContextDto | null;
  loading: boolean; error: string | null; onRetry: () => void;
  onAtlas: () => void; onWorkbench: () => void;
  directReceipts: DownstreamClosureReceipt[];
  onReceiptCreated: (receipt: CountyDownstreamClosureReceiptDto) => void;
}) => {
  const [handoffError, setHandoffError] = useState<string | null>(null);
  // Spatial handoffs — preserved from the original Inspector, always active.
  const spatial = (
    <div data-testid="inspector-action-spatial" style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          color: 'hsl(var(--tf-muted))', marginBottom: 4,
        }}
      >
        Spatial
      </div>
      <button
        type="button"
        data-testid="inspector-handoff-atlas"
        aria-label="Open in TerraAtlas"
        onClick={onAtlas}
        style={handoffBtnBaseStyle}
      >
        <div style={{ fontSize: 12, fontWeight: 700 }}>Open in TerraAtlas</div>
        <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
          Open deep spatial analysis with the same study and risk context
        </div>
      </button>
      <button
        type="button"
        data-testid="inspector-handoff-workbench"
        aria-label="Find Parcels in Workbench"
        onClick={onWorkbench}
        style={handoffBtnBaseStyle}
      >
        <div style={{ fontSize: 12, fontWeight: 700 }}>Find Parcels in Workbench</div>
        <div style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 2 }}>
          Open parcel-level table in Property Workbench
        </div>
      </button>
    </div>
  );

  if (loading && !context) {
    return (
      <>
        {spatial}
        <div data-testid="inspector-action-loading"
          style={{ padding: 16, fontSize: 12, color: 'hsl(var(--tf-muted))' }}>
          Loading handoff context…
        </div>
      </>
    );
  }
  if (error && !context) {
    return (
      <>
        {spatial}
        <div data-testid="inspector-action-error" role="alert"
          style={{ padding: 16, fontSize: 12, color: '#ef4444' }}>
          Unable to load handoff context.{' '}
          <button data-testid="inspector-action-retry" onClick={onRetry}
            style={{
              marginLeft: 8, padding: '3px 10px', borderRadius: 3,
              border: '1px solid hsl(var(--tf-border))',
              background: 'transparent', color: 'hsl(var(--tf-fg))',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}
          >Retry</button>
        </div>
      </>
    );
  }
  if (!context) return spatial;

  const fireModule = (moduleId: string, metadata: Record<string, unknown>) => {
    void activateModule(moduleId, { source: 'system', metadata });
  };
  const salesForgeDeeplinkQuery = sanitizeCountyStudioHandoffQuery(context.salesForge.deeplinkQuery);
  const costForgeDeeplinkQuery = sanitizeCountyStudioHandoffQuery(context.costForge.deeplinkQuery);
  const compsForgeDeeplinkQuery = sanitizeCountyStudioHandoffQuery(context.compsForge.deeplinkQuery);
  const daisDeeplinkQuery = sanitizeCountyStudioHandoffQuery(context.dais.deeplinkQuery);
  const dossierDeeplinkQuery = sanitizeCountyStudioHandoffQuery(context.dossier.deeplinkQuery);
  const findReceipt = (destination: 'Dais' | 'Dossier') =>
    directReceipts.find((receipt) =>
      receipt.sourceType === 'SegmentInspector'
      && receipt.destination === destination
      && receipt.segmentId === context.segmentId);
  const receiptLabel = (receipt: DownstreamClosureReceipt | undefined) =>
    receipt
      ? `Backend receipt: ${receipt.status} · updated ${new Date(receipt.updatedAt).toLocaleDateString()}`
      : undefined;
  const fireSegmentReceiptModule = async (
    moduleId: 'suite-dais' | 'suite-dossier',
    destination: 'Dais' | 'Dossier',
    template: 'SegmentReview' | 'SegmentEvidence',
    metadata: Record<string, unknown>,
  ) => {
    setHandoffError(null);
    try {
      const receipt = await exceptionApi.recordSegmentInspectorReceipt(context.segmentId, {
        studyId: context.studyId,
        destination,
        template,
        segmentLabel: context.neighborhoodCode ?? context.segmentId,
        status: 'Drafted',
      });
      onReceiptCreated(receipt);
      void activateModule(moduleId, {
        source: 'system',
        metadata: {
          ...metadata,
          downstreamReceiptId: receipt.receiptId,
        },
      });
    } catch (receiptError) {
      console.error(`Failed to persist ${destination} segment inspector handoff receipt`, receiptError);
      setHandoffError(
        `Could not create the ${destination} handoff receipt. County Studio did not open the downstream draft because no durable receipt was saved.`,
      );
    }
  };

  return (
    <>
      {spatial}
      <div
        data-testid="inspector-action-corrective"
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          color: 'hsl(var(--tf-muted))', marginBottom: 4,
        }}
      >
        Corrective
      </div>
      {handoffError && (
        <div
          role="alert"
          data-testid="inspector-handoff-error"
          style={{
            padding: '7px 9px',
            borderRadius: 4,
            border: '1px solid #ef444455',
            background: '#ef444422',
            color: '#ef4444',
            fontSize: 11,
            marginBottom: 8,
          }}
        >
          {handoffError}
        </div>
      )}
      <HandoffButton
        testId="inspector-handoff-salesforge"
        label="Reconcile sales in SalesForge"
        subtitle={`Open the ${context.salesForge.qualifiedSaleCount} qualified sales for stratum ${context.salesForge.stratumKey} in ${context.salesForge.taxYear}`}
        disabledTooltip="SalesForge integration not yet active."
        deeplinkQuery={salesForgeDeeplinkQuery}
        onClick={() => fireModule('sales-forge', {
          countyId:      context.countyId,
          deeplinkQuery: salesForgeDeeplinkQuery,
          stratumKey:    context.salesForge.stratumKey,
          taxYear:       context.salesForge.taxYear,
          segmentId:     context.segmentId,
        })}
      />
      <HandoffButton
        testId="inspector-handoff-costforge"
        label="Calibrate cost in CostForge"
        subtitle={`Open stratum ${context.costForge.stratumKey}, ${context.costForge.taxYear} cost review`}
        disabledTooltip="CostForge integration not yet active."
        deeplinkQuery={costForgeDeeplinkQuery}
        onClick={() => fireModule('costforge', {
          countyId:      context.countyId,
          deeplinkQuery: costForgeDeeplinkQuery,
          stratumKey:    context.costForge.stratumKey,
          taxYear:       context.costForge.taxYear,
          segmentId:     context.segmentId,
        })}
      />
      <HandoffButton
        testId="inspector-handoff-compsforge"
        label="Review comps in CompsForge"
        subtitle={`Open ${context.compsForge.sampleParcelIds.length} sample parcels for comparison`}
        disabledTooltip="CompsForge integration not yet active."
        deeplinkQuery={compsForgeDeeplinkQuery}
        onClick={() => fireModule('comps-forge', {
          countyId:        context.countyId,
          deeplinkQuery:   compsForgeDeeplinkQuery,
          sampleParcelIds: context.compsForge.sampleParcelIds,
          segmentId:       context.segmentId,
        })}
      />
      <HandoffButton
        testId="inspector-handoff-dais"
        label="Create Dais review packet"
        subtitle={`Dispatch ${context.dais.workflowTemplate} workflow with ${context.totalParcels.toLocaleString()} parcels`}
        disabledTooltip="Dais integration not yet active."
        deeplinkQuery={daisDeeplinkQuery}
        receiptLabel={receiptLabel(findReceipt('Dais'))}
        onClick={() => void fireSegmentReceiptModule('suite-dais', 'Dais', 'SegmentReview', {
          countyId:         context.countyId,
          deeplinkQuery:     daisDeeplinkQuery,
          workflowTemplate:  context.dais.workflowTemplate,
          segmentId:         context.segmentId,
          studyId:           context.studyId,
        })}
      />
      <HandoffButton
        testId="inspector-handoff-dossier"
        label="Generate Dossier evidence packet"
        subtitle={`Prepare ${context.dossier.packetTemplate} packet for this segment`}
        disabledTooltip="Dossier integration not yet active."
        deeplinkQuery={dossierDeeplinkQuery}
        receiptLabel={receiptLabel(findReceipt('Dossier'))}
        onClick={() => void fireSegmentReceiptModule('suite-dossier', 'Dossier', 'SegmentEvidence', {
          countyId:       context.countyId,
          deeplinkQuery:   dossierDeeplinkQuery,
          packetTemplate:  context.dossier.packetTemplate,
          segmentId:       context.segmentId,
          studyId:         context.studyId,
        })}
      />
      {context.truncated && (
        <div
          data-testid="inspector-action-truncated"
          style={{ marginTop: 6, fontSize: 10, color: 'hsl(var(--tf-muted))' }}
        >
          Parcel list truncated to first {context.parcelIds.length} of {context.totalParcels.toLocaleString()}.
        </div>
      )}
    </>
  );
};

// ── Main component ────────────────────────────────────────────────────────

export function ObjectInspector() {
  const { segments, selectedSegmentId, activeStudy } = useCountyStudioStore();
  const navigate = useNavigate();
  const seg = segments.find((s) => s.segmentId === selectedSegmentId);
  const receipts = useDownstreamClosureReceiptStore((s) => s.receipts);
  const ingestReceipt = useDownstreamClosureReceiptStore((s) => s.ingestReceipt);
  const ingestReceipts = useDownstreamClosureReceiptStore((s) => s.ingestReceipts);

  const {
    detail, detailLoading, detailError, retryDetail,
    context, contextLoading, contextError, retryContext,
  } = useInspectorData(selectedSegmentId);

  useEffect(() => {
    if (!activeStudy?.studyId) return;
    void exceptionApi.listDownstreamReceipts(activeStudy.studyId)
      .then((items) => ingestReceipts(items.map(toLocalReceipt)))
      .catch((receiptError) => console.error('Failed to load downstream handoff receipts', receiptError));
  }, [activeStudy?.studyId, ingestReceipts]);

  if (!seg) {
    return (
      <div style={{ padding: 16, fontSize: 12, color: 'hsl(var(--tf-muted))' }}>
        Select a segment to inspect.
      </div>
    );
  }

  const currentDetail = detail?.segmentId === seg.segmentId ? detail : null;
  const currentContext = context?.segmentId === seg.segmentId ? context : null;
  const segmentNeighborhoodCode = currentDetail?.neighborhoodCode ?? seg.geographyRef;
  const segmentRevalArea = currentDetail?.revalArea ?? seg.revalArea;
  const segmentBuildingType = currentDetail?.buildingType ?? seg.buildingType;
  const segmentQualityGrade = currentDetail?.qualityGrade ?? seg.qualityGrade;
  const segmentScopeLabel = [
    segmentNeighborhoodCode ? `Neighborhood ${segmentNeighborhoodCode}` : null,
    segmentRevalArea !== null && segmentRevalArea !== undefined ? `Reval ${segmentRevalArea}` : null,
  ].filter((value): value is string => !!value).join(' · ') || seg.name;

  const segmentDescriptor = [segmentBuildingType, segmentQualityGrade]
    .filter((value): value is string => !!value)
    .join(' · ');

  const handleOpenAtlas = () => {
    if (!activeStudy) return;
    const params = new URLSearchParams({
      studyId: activeStudy.studyId,
      segmentId: seg.segmentId,
      countyId: activeStudy.countyId,
      taxYear: String(activeStudy.taxYear),
    });
    if (activeStudy.countyName) {
      params.set('countyName', activeStudy.countyName);
    }
    if (segmentNeighborhoodCode) {
      params.set('neighborhoodCode', segmentNeighborhoodCode);
    }
    if (segmentRevalArea !== null && segmentRevalArea !== undefined) {
      params.set('revalArea', String(segmentRevalArea));
    }
    navigate(`/forge/atlas-live?${params.toString()}`);
  };
  const handleFindParcels = () => {
    void activateModule('property-workbench', {
      source: 'system',
      metadata: {
        segmentId: seg.segmentId,
        countyId: activeStudy?.countyId,
        studyId: activeStudy?.studyId,
        taxYear: activeStudy?.taxYear,
        neighborhoodCode: segmentNeighborhoodCode,
        revalArea: segmentRevalArea,
      },
    });
  };

  return (
    <div style={{ padding: '12px 16px' }} data-testid="object-inspector">
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{segmentScopeLabel}</div>
      <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))', marginBottom: 12 }}>
        {seg.segmentType} · {seg.parcelCount.toLocaleString()} parcels
        {segmentDescriptor ? ` · ${segmentDescriptor}` : ''}
      </div>

      <Tabs defaultValue="metrics">
        <TabsList
          style={{
            display: 'flex', gap: 0, width: '100%',
            background: 'hsl(var(--tf-surface))',
            border: '1px solid hsl(var(--tf-border))',
            borderRadius: 4, padding: 2, marginBottom: 8, height: 'auto',
          }}
        >
          <TabsTrigger value="metrics" data-testid="inspector-tab-metrics" style={{ flex: 1, fontSize: 11 }}>Metrics</TabsTrigger>
          <TabsTrigger value="trend" data-testid="inspector-tab-trend" style={{ flex: 1, fontSize: 11 }}>Trend</TabsTrigger>
          <TabsTrigger value="action" data-testid="inspector-tab-action" style={{ flex: 1, fontSize: 11 }}>Action</TabsTrigger>
          <TabsTrigger value="diagnosis" data-testid="inspector-tab-diagnosis" style={{ flex: 1, fontSize: 11 }}>Diagnosis</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" data-testid="inspector-panel-metrics">
          <MetricsPanel
            detail={currentDetail}
            loading={detailLoading}
            error={detailError}
            onRetry={retryDetail}
          />
        </TabsContent>

        <TabsContent value="trend" data-testid="inspector-panel-trend">
          <TrendPanel
            detail={currentDetail}
            loading={detailLoading}
            error={detailError}
            onRetry={retryDetail}
          />
        </TabsContent>

        <TabsContent value="action" data-testid="inspector-panel-action">
          <ActionPanel
            context={currentContext}
            loading={contextLoading}
            error={contextError}
            onRetry={retryContext}
            onAtlas={handleOpenAtlas}
            onWorkbench={handleFindParcels}
            directReceipts={Object.values(receipts).filter((receipt) =>
              receipt.sourceType === 'SegmentInspector'
              && receipt.segmentId === seg.segmentId)}
            onReceiptCreated={(receipt) => ingestReceipt(toLocalReceipt(receipt))}
          />
        </TabsContent>

        <TabsContent value="diagnosis" data-testid="inspector-panel-diagnosis">
          <AiDiagnosisPanel segmentId={seg.segmentId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
