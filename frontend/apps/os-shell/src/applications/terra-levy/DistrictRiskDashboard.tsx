/**
 * DistrictRiskDashboard — P2.1 / P2.2
 *
 * District-centric risk triage surface for TerraLevy.
 * - Fetches GET /api/levy/dashboard/district-risk-summary
 * - Renders a sortable risk table (critical → warn → ok)
 * - Opens DistrictDetailPanel as a right-side split pane when a row is clicked
 *
 * Honesty: backend returns empty districts when LevyCertifications is not seeded
 * (SQLite dev mode). Component renders an informative empty state in that case.
 *
 * @module applications/terra-levy/DistrictRiskDashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  getDistrictRiskScores,
  getBankedCapacity,
  type BankedCapacityResponse,
  type DistrictRiskRecord,
  type RiskFlag,
} from '../../services/levyService';

// ── Design tokens (no inline color values — use CSS custom properties only) ──

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
} as const;

// ── Risk styling helpers ──────────────────────────────────────────────────

type RiskStyle = {
  color: string;
  bg: string;
  border: string;
  label: string;
  icon: string;
};

function riskStyle(flag: RiskFlag): RiskStyle {
  switch (flag) {
    case 'critical':
      return {
        color: T.danger,
        bg: 'hsl(var(--tf-destructive) / 0.08)',
        border: '1px solid hsl(var(--tf-destructive) / 0.25)',
        label: 'Critical',
        icon: '🔴',
      };
    case 'warn':
      return {
        color: T.warning,
        bg: 'hsl(var(--tf-warning) / 0.08)',
        border: '1px solid hsl(var(--tf-warning) / 0.25)',
        label: 'Warning',
        icon: '🟡',
      };
    default:
      return {
        color: T.success,
        bg: 'hsl(var(--tf-success) / 0.08)',
        border: '1px solid hsl(var(--tf-success) / 0.25)',
        label: 'OK',
        icon: '🟢',
      };
  }
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

function formatRate(n: number): string {
  return n === 0 ? '—' : n.toFixed(4);
}

function yoyArrow(delta: number): string {
  if (delta === 0) return '→';
  return delta > 0 ? '▲' : '▼';
}

// ── State ──────────────────────────────────────────────────────────────────

type RiskState =
  | { status: 'loading' }
  | { status: 'empty'; taxYear: number }
  | { status: 'error'; error: string }
  | { status: 'ok'; taxYear: number; districts: DistrictRiskRecord[]; provenanceNote?: string; generatedAt?: string };

// ── DistrictDetailPanel (P2.2) ─────────────────────────────────────────────

function DistrictDetailPanel({
  district,
  onClose,
  onNavigateToLevies,
  onOpenCalculator,
}: {
  district: DistrictRiskRecord;
  onClose: () => void;
  onNavigateToLevies?: (districtCode: string) => void;
  onOpenCalculator?: (districtId: string) => void;
}) {
  const rs = riskStyle(district.riskFlag);
  const [banked, setBanked] = useState<BankedCapacityResponse | null>(null);
  const [bankLoading, setBankLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBankLoading(true);
    getBankedCapacity(district.districtId, new Date().getFullYear())
      .then(r => { if (!cancelled) setBanked(r); })
      .catch(() => { if (!cancelled) setBanked(null); })
      .finally(() => { if (!cancelled) setBankLoading(false); });
    return () => { cancelled = true; };
  }, [district.districtId]);

  return (
    <div
      style={{
        width: 360,
        minWidth: 320,
        borderLeft: '1px solid hsl(var(--tf-fg) / 0.1)',
        background: 'hsl(var(--tf-bg) / 0.95)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid hsl(var(--tf-fg) / 0.08)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: T.textDim, marginBottom: 4 }}>
            District Detail
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, lineHeight: 1.3 }}>
            {district.districtName || district.districtId}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
            Code: {district.districtId}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: T.textMuted,
            cursor: 'pointer',
            fontSize: 18,
            padding: '0 4px',
            lineHeight: 1,
            flexShrink: 0,
          }}
          aria-label="Close detail panel"
        >
          ×
        </button>
      </div>

      {/* Risk badge */}
      <div style={{ padding: '12px 20px', borderBottom: T.cardBorder }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 20,
            background: rs.bg,
            border: rs.border,
            color: rs.color,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {rs.icon} {rs.label} Risk
        </div>
      </div>

      {/* Calculation chain */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
          Calculation Chain
        </div>

        <DetailRow label="Current Rate" value={`${formatRate(district.currentRate)} per $1,000 AV`} />
        <WhyDisclosure lines={[
          'Formula: LevyAmount ÷ AssessedValue × 1,000',
          'Source: LevyCertifications table (current tax year)',
          'Ref: RCW 84.52.010 — levy rate computation',
        ]} />
        <DetailRow label="Constitutional Limit" value={`${formatRate(district.statutoryLimit)} per $1,000 AV`} />
        <WhyDisclosure lines={[
          'RCW 84.52.043: county regular levy capped at $3.60/$1,000 AV; city at $3.375/$1,000 AV',
          'Constitutional aggregate maximum: $10.00/$1,000 AV (Art. VII § 2, WA State Constitution)',
          'Value shown is the district-level statutory limit from LevyDashboardController',
        ]} />
        <DetailRow
          label="Utilization"
          value={formatPct(district.utilizationPct)}
          highlight={district.utilizationPct > 95 ? 'danger' : district.utilizationPct > 85 ? 'warn' : 'ok'}
        />
        <WhyDisclosure lines={[
          'Formula: currentRate ÷ statutoryLimit × 100',
          'Threshold: >95% = Critical (levy near legal ceiling), >85% = Warn, ≤85% = OK',
          'Source: LevyDashboardController.GetDistrictRiskSummary',
        ]} />
        <DetailRow label="Prior Year Rate" value={district.priorYearRate > 0 ? formatRate(district.priorYearRate) : '—'} />
        <DetailRow
          label="YoY Change"
          value={district.priorYearRate > 0 ? `${yoyArrow(district.yoyDelta)} ${formatPct(Math.abs(district.yoyDelta))}` : '—'}
          highlight={Math.abs(district.yoyDelta) > 10 ? 'danger' : Math.abs(district.yoyDelta) > 5 ? 'warn' : 'ok'}
        />
        <DetailRow
          label="Certification Status"
          value={district.certificationStatus || 'unknown'}
          highlight={district.certificationStatus === 'certified' ? 'ok' : 'warn'}
        />
        {/* LEV-137: Banked Capacity */}
        <DetailRow
          label="Banked Capacity"
          value={
            bankLoading
              ? 'Loading…'
              : banked === null
                ? '—'
                : banked.specialistGated
                  ? 'No election on record'
                  : `$${banked.availableCapacity.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
          }
        />
        {banked && !banked.specialistGated && (
          <WhyDisclosure lines={[
            `Available = closingBalance (${banked.ledgerEntry?.closingBalance?.toFixed(2) ?? '—'}) − usedThisYear (${banked.ledgerEntry?.usedThisYear?.toFixed(2) ?? '—'})`,
            'RCW 84.55.092: district may bank unused levy capacity for future years.',
            'Requires RCW 84.55.0101 election resolution. Source: BankedCapacities table.',
          ]} />
        )}
        {banked?.specialistGated && (
          <div style={{ fontSize: 10, color: T.textDim, padding: '2px 0 8px 2px' }}>
            No RCW 84.55.0101 election found (LEV-137). Source: BankedCapacities table.
          </div>
        )}
      </div>

      {/* Risk reasons */}
      {district.riskReasons.length > 0 && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Risk Factors
          </div>
          <div
            style={{
              borderRadius: 8,
              background: rs.bg,
              border: rs.border,
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {district.riskReasons.map((r, i) => (
              <div key={i} style={{ fontSize: 12, color: rs.color, display: 'flex', gap: 6 }}>
                <span style={{ flexShrink: 0 }}>•</span>
                <span>{r}</span>
              </div>
            ))}
          </div>

          {/* P6.4 — What would make this green? */}
          {district.riskFlag !== 'ok' && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                borderRadius: 6,
                background: 'hsl(var(--tf-success) / 0.06)',
                border: '1px solid hsl(var(--tf-success) / 0.15)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: T.success, marginBottom: 4 }}>What would make this green?</div>
              {district.utilizationPct > 95 ? (
                <div style={{ fontSize: 11, color: T.textMuted }}>
                  Reduce rate to ≤ {formatRate(district.statutoryLimit * 0.95)} per $1,000 AV
                  {' '}(≤ 85% of ${formatRate(district.statutoryLimit)} limit).
                  Current: {formatRate(district.currentRate)} · Target: {formatRate(district.statutoryLimit * 0.85)} or below.
                </div>
              ) : (
                <div style={{ fontSize: 11, color: T.textMuted }}>
                  Reduce rate to ≤ {formatRate(district.statutoryLimit * 0.85)} per $1,000 AV
                  {' '}(≤ 85% of ${formatRate(district.statutoryLimit)} limit).
                  Current: {formatRate(district.currentRate)} · Margin: {formatRate(district.statutoryLimit * 0.85 - district.currentRate)} remaining.
                </div>
              )}
              {district.certificationStatus !== 'certified' && (
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                  Also: certification status is "{district.certificationStatus || 'unknown'}" — must reach "certified".
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Evidence note */}
      <div style={{ padding: '0 20px 16px' }}>
        <div
          style={{
            borderRadius: 8,
            background: T.cardBg,
            border: T.cardBorder,
            padding: '10px 14px',
            fontSize: 12,
            color: T.textDim,
          }}
        >
          Evidence: Certification records from LevyCertifications table.
          Parcel-level breakdown and 5-year sparkline require seeded production
          data — not available in SQLite dev mode.
        </div>
      </div>

      {/* Navigate to levies link */}
      {onNavigateToLevies && (
        <div style={{ padding: '0 20px 12px' }}>
          <button
            onClick={() => onNavigateToLevies(district.districtId)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 8,
              background: 'hsl(var(--tf-accent) / 0.12)',
              border: '1px solid hsl(var(--tf-accent) / 0.25)',
              color: T.cyan,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            View Levies for {district.districtId} →
          </button>
        </div>
      )}

      {/* Open Calculator button (P3.1) */}
      {onOpenCalculator && (
        <div style={{ padding: '0 20px 20px' }}>
          <button
            onClick={() => onOpenCalculator(district.districtId)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid hsl(var(--tf-fg) / 0.15)',
              color: T.textMuted,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            🧮 Open Rate Calculator
          </button>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'ok' | 'warn' | 'danger';
}) {
  const color =
    highlight === 'danger'
      ? T.danger
      : highlight === 'warn'
        ? T.warning
        : highlight === 'ok'
          ? T.success
          : T.textPrimary;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '5px 0',
        borderBottom: '1px solid hsl(var(--tf-fg) / 0.05)',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 12, color: T.textMuted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

/**
 * P6.4 — Expandable "Why is this number this way?" disclosure.
 * Shows statutory reference, data source, and formula without scrolling away
 * from the value it annotates.
 */
function WhyDisclosure({ lines }: { lines: string[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ marginTop: -1, marginBottom: 4 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: 'none',
          border: 'none',
          color: T.textDim,
          cursor: 'pointer',
          fontSize: 10,
          padding: '1px 0',
          textDecoration: 'underline dotted',
          letterSpacing: 0.3,
        }}
      >
        {open ? '▲ hide' : '▿ why?'}
      </button>
      {open && (
        <div
          style={{
            marginTop: 4,
            marginBottom: 6,
            padding: '8px 10px',
            borderRadius: 5,
            background: 'hsl(var(--tf-fg) / 0.04)',
            border: '1px solid hsl(var(--tf-fg) / 0.08)',
          }}
        >
          {lines.map((line, i) => (
            <div key={i} style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Summary stat cards ─────────────────────────────────────────────────────

function RiskSummaryCards({ districts }: { districts: DistrictRiskRecord[] }) {
  const critical = districts.filter(d => d.riskFlag === 'critical').length;
  const warn = districts.filter(d => d.riskFlag === 'warn').length;
  const ok = districts.filter(d => d.riskFlag === 'ok').length;
  const total = districts.length;

  const cards = [
    { label: 'Critical', count: critical, color: T.danger, bg: 'hsl(var(--tf-destructive) / 0.08)', border: 'hsl(var(--tf-destructive) / 0.25)', icon: '🔴' },
    { label: 'Warning', count: warn, color: T.warning, bg: 'hsl(var(--tf-warning) / 0.08)', border: 'hsl(var(--tf-warning) / 0.25)', icon: '🟡' },
    { label: 'OK', count: ok, color: T.success, bg: 'hsl(var(--tf-success) / 0.08)', border: 'hsl(var(--tf-success) / 0.25)', icon: '🟢' },
    { label: 'Total', count: total, color: T.textPrimary, bg: T.cardBg, border: 'hsl(var(--tf-fg) / 0.12)', icon: '📋' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
      {cards.map(c => (
        <div
          key={c.label}
          style={{
            borderRadius: 10,
            background: c.bg,
            border: `1px solid ${c.border}`,
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 20 }}>{c.icon}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: c.color }}>{c.count}</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function DistrictRiskDashboard({
  onNavigateToLevies,
  onOpenCalculator,
}: {
  onNavigateToLevies?: (districtCode: string) => void;
  /** Called when user clicks "Open Calculator" in the detail panel (P3.1) */
  onOpenCalculator?: (districtId: string) => void;
}) {
  const [state, setState] = useState<RiskState>({ status: 'loading' });
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictRiskRecord | null>(null);

  const load = useCallback(() => {
    setState({ status: 'loading' });
    getDistrictRiskScores()
      .then(res => {
        if (res.districts.length === 0) {
          setState({ status: 'empty', taxYear: res.taxYear });
        } else {
          setState({ status: 'ok', taxYear: res.taxYear, districts: res.districts, provenanceNote: res.provenanceNote, generatedAt: res.generatedAt });
        }
      })
      .catch((err: unknown) => {
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (state.status === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: T.textDim }}>
        <p style={{ fontSize: 14 }}>Loading district risk summary…</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (state.status === 'error') {
    return (
      <div
        style={{
          padding: 20, borderRadius: 12,
          background: 'hsl(var(--tf-destructive) / 0.08)',
          border: '1px solid hsl(var(--tf-destructive) / 0.3)',
          color: T.danger,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          Unable to load district risk summary
        </div>
        <div style={{ fontSize: 12, color: T.textDim, fontFamily: 'monospace' }}>
          {state.error}
        </div>
        <button
          onClick={load}
          style={{
            marginTop: 12, padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
            background: 'transparent', border: '1px solid hsl(var(--tf-destructive) / 0.4)',
            color: T.danger, fontSize: 12, fontWeight: 600,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────

  if (state.status === 'empty') {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: T.textDim }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.textMuted, marginBottom: 8 }}>
          No certification records for {state.taxYear}
        </div>
        <div style={{ fontSize: 13, color: T.textDim, maxWidth: 400, margin: '0 auto' }}>
          Risk analysis requires <code>LevyCertifications</code> rows. In SQLite dev
          mode, no certification data is seeded. Connect to a PostgreSQL instance
          with production data to see district risk triage.
        </div>
      </div>
    );
  }

  // ── OK ────────────────────────────────────────────────────────────────────

  const { taxYear, districts, provenanceNote, generatedAt } = state as { taxYear: number; districts: DistrictRiskRecord[]; provenanceNote?: string; generatedAt?: string; status: 'ok' };

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* Left: table */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
              District Risk Summary
            </h2>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 3 }}>
              Tax Year {taxYear} · {districts.length} districts · Sorted by risk tier then utilization
            </div>
          </div>
          <button
            onClick={load}
            style={{
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
              background: 'transparent', border: T.cardBorder,
              color: T.textMuted, fontSize: 12,
            }}
          >
            Refresh
          </button>
        </div>

        {/* Summary cards */}
        <RiskSummaryCards districts={districts} />

        {/* Risk table */}
        <div
          style={{
            borderRadius: 10,
            border: T.cardBorder,
            overflow: 'hidden',
            background: T.cardBg,
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
              padding: '10px 16px',
              borderBottom: T.cardBorder,
              fontSize: 11,
              fontWeight: 700,
              color: T.textDim,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <span>District</span>
            <span>Risk</span>
            <span>Rate</span>
            <span>Utilization</span>
            <span>YoY Δ</span>
            <span>Certification</span>
            <span>Confidence</span>
          </div>

          {/* Table rows */}
          {districts.map(d => {
            const rs = riskStyle(d.riskFlag);
            const isSelected = selectedDistrict?.districtId === d.districtId;

            return (
              <div
                key={d.districtId}
                onClick={() => setSelectedDistrict(isSelected ? null : d)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
                  padding: '12px 16px',
                  borderBottom: T.cardBorder,
                  cursor: 'pointer',
                  background: isSelected
                    ? 'hsl(var(--tf-accent) / 0.06)'
                    : 'transparent',
                  transition: 'background 0.1s ease',
                }}
              >
                {/* District name */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
                    {d.districtName || d.districtId}
                  </div>
                  <div style={{ fontSize: 11, color: T.textDim }}>{d.districtId}</div>
                </div>

                {/* Risk badge */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px',
                      borderRadius: 10, background: rs.bg, border: rs.border, color: rs.color,
                    }}
                  >
                    {rs.icon} {rs.label}
                  </span>
                </div>

                {/* Rate */}
                <div style={{ fontSize: 13, color: T.textPrimary, display: 'flex', alignItems: 'center' }}>
                  {formatRate(d.currentRate)}
                </div>

                {/* Utilization */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center' }}>
                  <span
                    style={{
                      fontSize: 13, fontWeight: 600,
                      color: d.utilizationPct > 95 ? T.danger : d.utilizationPct > 85 ? T.warning : T.success,
                    }}
                  >
                    {formatPct(d.utilizationPct)}
                  </span>
                  {/* Mini utilization bar */}
                  <div style={{ height: 3, width: 60, background: 'hsl(var(--tf-fg) / 0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(d.utilizationPct, 100)}%`,
                        background: d.utilizationPct > 95 ? 'hsl(var(--tf-destructive))' : d.utilizationPct > 85 ? 'hsl(var(--tf-warning))' : 'hsl(var(--tf-success))',
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>

                {/* YoY */}
                <div
                  style={{
                    fontSize: 13,
                    color: d.priorYearRate > 0
                      ? (Math.abs(d.yoyDelta) > 10 ? T.danger : Math.abs(d.yoyDelta) > 5 ? T.warning : T.textPrimary)
                      : T.textDim,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {d.priorYearRate > 0
                    ? `${yoyArrow(d.yoyDelta)} ${formatPct(Math.abs(d.yoyDelta))}`
                    : '—'}
                </div>

                {/* Cert status */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10,
                      background: d.certificationStatus === 'certified'
                        ? 'hsl(var(--tf-success) / 0.08)'
                        : 'hsl(var(--tf-fg) / 0.05)',
                      border: d.certificationStatus === 'certified'
                        ? '1px solid hsl(var(--tf-success) / 0.3)'
                        : T.cardBorder,
                      color: d.certificationStatus === 'certified' ? T.success : T.textMuted,
                    }}
                  >
                    {d.certificationStatus || 'unknown'}
                  </span>
                </div>

                {/* Confidence — data completeness from rules engine */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    title="Proportion of LevyRate key fields (Rate, AV, LevyAmount) that are non-zero. Not a trained model score."
                    style={{
                      fontSize: 11,
                      color: (d.confidence ?? 1) < 0.8 ? T.warning : T.textMuted,
                    }}
                  >
                    {d.confidence != null ? `${Math.round(d.confidence * 100)}%` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Provenance note */}
        <div style={{ fontSize: 11, color: T.textDim, marginTop: 12 }}>
          {provenanceNote
            ? provenanceNote
            : 'Source: canonical-levy-risk-engine-rules-v1 \u00b7 GET /api/levy/v1/data-quality/district-risk-summary'}
          {generatedAt && (
            <> &middot; Generated {new Date(generatedAt).toLocaleTimeString()}</>
          )}
        </div>
      </div>

      {/* Right: detail panel */}
      {selectedDistrict && (
        <DistrictDetailPanel
          district={selectedDistrict}
          onClose={() => setSelectedDistrict(null)}
          onNavigateToLevies={onNavigateToLevies}
          onOpenCalculator={onOpenCalculator}
        />
      )}
    </div>
  );
}
