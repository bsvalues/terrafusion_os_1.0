/**
 * CertificationStatusTab — P4.1 / P4.2 / P4.3
 *
 * Displays per-district levy certification status and provides an inline form
 * to create/update certifications.
 *
 * Honesty notes:
 * - Certification data is from TerraFusionDbContext.LevyCertifications.
 *   In dev mode (SQLite), the table is empty unless manually seeded — the
 *   component shows a "No records" message when empty.
 * - Export (P4.3) triggers a browser download via anchor href to
 *   GET /api/levy/certifications/export?year={year}.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  getCertifications,
  upsertCertification,
  certificationExportUrl,
  LevyCertificationItem,
  LevyCertificationListResponse,
  LevyCertificationUpsertRequest,
} from '../../services/levyService';

// ── Design tokens (mirror TerraLevyDashboard.tsx) ─────────────────────────
const T = {
  cyan: 'var(--terra-cyan, hsl(var(--tf-accent)))',
  blue: 'var(--terra-blue, hsl(var(--tf-accent)))',
  midnight: 'var(--terra-midnight, hsl(var(--tf-bg)))',
  slate: 'var(--terra-slate, hsl(var(--tf-surface)))',
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

// ── Status helpers ─────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  certified: 'Certified',
  rejected: 'Rejected',
};

const STATUS_COLOR: Record<string, string> = {
  draft: T.textMuted,
  pending_review: T.warning,
  certified: T.success,
  rejected: T.danger,
};

const STATUS_DOT: Record<string, string> = {
  draft: '⚪',
  pending_review: '🟡',
  certified: '🟢',
  rejected: '🔴',
};

function statusLabel(s: string) {
  return STATUS_LABEL[s] ?? s;
}
function statusColor(s: string) {
  return STATUS_COLOR[s] ?? T.textMuted;
}
function statusDot(s: string) {
  return STATUS_DOT[s] ?? '⚫';
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Props {
  /** Defaults to current calendar year. */
  year?: number;
}

// ── Component ──────────────────────────────────────────────────────────────

const CertificationStatusTab: React.FC<Props> = ({ year }) => {
  const effectiveYear = year ?? new Date().getFullYear();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LevyCertificationListResponse | null>(null);

  // Inline review panel
  const [reviewTarget, setReviewTarget] = useState<LevyCertificationItem | null>(null);
  const [reviewNewTarget, setReviewNewTarget] = useState<string | null>(null); // district code for new cert

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCertifications(effectiveYear);
      setData(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load certifications';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [effectiveYear]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div style={{ color: T.textPrimary, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Summary header */}
      <div
        style={{
          background: T.cyanBgAlpha,
          border: T.cyanBorderAlpha,
          borderRadius: 8,
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Certification Status — {effectiveYear}
          </div>
          {data ? (
            <div style={{ fontSize: 22, fontWeight: 700, color: T.cyan }}>
              {data.certifiedCount} / {data.totalDistricts} districts certified
              <span style={{ fontSize: 13, fontWeight: 400, color: T.textMuted, marginLeft: 10 }}>
                ({data.readyForDor} ready for DOR submission)
              </span>
            </div>
          ) : loading ? (
            <div style={{ fontSize: 14, color: T.textMuted }}>Loading…</div>
          ) : null}
        </div>

        {/* Export button (P4.3) */}
        <a
          href={certificationExportUrl(effectiveYear)}
          download
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: T.cyanBgAlpha,
            border: T.cyanBorderAlpha,
            borderRadius: 6,
            color: T.cyan,
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          ⬇ Export Evidence Packet (CSV)
        </a>
      </div>

      {/* Errors */}
      {error && (
        <div
          style={{
            background: 'hsl(var(--tf-destructive) / 0.12)',
            border: '1px solid hsl(var(--tf-destructive) / 0.3)',
            borderRadius: 8,
            padding: '12px 16px',
            color: T.danger,
            fontSize: 13,
          }}
        >
          <strong>Error:</strong> {error}
          <button
            onClick={load}
            style={{ marginLeft: 12, color: T.cyan, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && data && data.totalDistricts === 0 && (
        <div
          style={{
            background: T.cardBg,
            border: T.cardBorder,
            borderRadius: 8,
            padding: 32,
            textAlign: 'center',
            color: T.textMuted,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 15, marginBottom: 4 }}>No certification records for {effectiveYear}</div>
          <div style={{ fontSize: 12, color: T.textDim }}>
            In dev mode (SQLite), this table is empty until seeded.
            Use the "Add Certification" form below to create the first record.
          </div>
        </div>
      )}

      {/* District table */}
      {data && data.items.length > 0 && (
        <div
          style={{
            background: T.cardBg,
            border: T.cardBorder,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 90px 110px 80px 80px 110px',
              padding: '8px 16px',
              fontSize: 11,
              color: T.textDim,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              borderBottom: T.cardBorder,
            }}
          >
            <span>District</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Rate</span>
            <span style={{ textAlign: 'right' }}>Levy Amount</span>
            <span style={{ textAlign: 'center' }}>Const.</span>
            <span style={{ textAlign: 'center' }}>Agg.</span>
            <span style={{ textAlign: 'center' }}>Actions</span>
          </div>

          {data.items.map((cert) => (
            <DistrictRow
              key={cert.id}
              cert={cert}
              isSelected={reviewTarget?.id === cert.id}
              onReview={() => {
                setReviewNewTarget(null);
                setReviewTarget(prev => (prev?.id === cert.id ? null : cert));
              }}
            />
          ))}
        </div>
      )}

      {/* Inline review panel (P4.2) */}
      {reviewTarget && (
        <CertificationActionPanel
          key={reviewTarget.id}
          existing={reviewTarget}
          onDone={() => {
            setReviewTarget(null);
            load();
          }}
          onCancel={() => setReviewTarget(null)}
        />
      )}

      {/* Add New Certification ─────────────────────────────────── */}
      <div>
        {reviewNewTarget === null ? (
          <button
            onClick={() => { setReviewTarget(null); setReviewNewTarget(''); }}
            style={{
              padding: '8px 16px',
              background: 'none',
              border: T.cyanBorderAlpha,
              borderRadius: 6,
              color: T.cyan,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            + Add Certification Record
          </button>
        ) : (
          <CertificationActionPanel
            key="new"
            defaultYear={effectiveYear}
            onDone={() => {
              setReviewNewTarget(null);
              load();
            }}
            onCancel={() => setReviewNewTarget(null)}
          />
        )}
      </div>

    </div>
  );
};

// ── DistrictRow ────────────────────────────────────────────────────────────

const DistrictRow: React.FC<{
  cert: LevyCertificationItem;
  isSelected: boolean;
  onReview: () => void;
}> = ({ cert, isSelected, onReview }) => {
  const T_local = {
    cyan: 'var(--terra-cyan, hsl(var(--tf-accent)))',
    textPrimary: 'var(--levy-text-primary, hsl(var(--tf-fg)))',
    textMuted: 'var(--levy-text-muted, hsl(var(--tf-fg) / 0.6))',
    success: 'var(--levy-success, hsl(var(--tf-success)))',
    danger: 'var(--levy-danger, hsl(var(--tf-destructive)))',
    cardBorder: '1px solid hsl(var(--tf-fg) / 0.08)',
    cyanBgAlpha: 'hsl(var(--tf-accent) / 0.06)',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 120px 90px 110px 80px 80px 110px',
        padding: '10px 16px',
        borderBottom: T_local.cardBorder,
        background: isSelected ? T_local.cyanBgAlpha : 'transparent',
        alignItems: 'center',
        fontSize: 13,
      }}
    >
      <div>
        <div style={{ fontWeight: 500, color: T_local.textPrimary }}>{cert.districtName || cert.districtCode}</div>
        <div style={{ fontSize: 11, color: T_local.textMuted }}>{cert.districtCode}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span>{statusDot(cert.status)}</span>
        <span style={{ color: statusColor(cert.status) }}>{statusLabel(cert.status)}</span>
      </div>

      <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: T_local.textPrimary }}>
        {cert.levyRate.toFixed(4)}
      </div>

      <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: T_local.textPrimary }}>
        ${cert.leviedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
      </div>

      <div style={{ textAlign: 'center' }}>
        {cert.withinConstitutionalLimit ? (
          <span style={{ color: T_local.success }}>✓</span>
        ) : (
          <span style={{ color: T_local.danger }}>✗</span>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        {cert.withinAggregateLimit ? (
          <span style={{ color: T_local.success }}>✓</span>
        ) : (
          <span style={{ color: T_local.danger }}>✗</span>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onReview}
          style={{
            padding: '4px 10px',
            background: 'none',
            border: `1px solid ${T_local.cyan}`,
            borderRadius: 4,
            color: T_local.cyan,
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          {isSelected ? 'Close' : 'Review'}
        </button>
      </div>
    </div>
  );
};

// ── CertificationActionPanel — P4.2 ───────────────────────────────────────

interface ActionPanelProps {
  /** Existing cert to update. Null = new cert. */
  existing?: LevyCertificationItem;
  /** Pre-fill year for new cert. */
  defaultYear?: number;
  onDone: () => void;
  onCancel: () => void;
}

const CertificationActionPanel: React.FC<ActionPanelProps> = ({
  existing,
  defaultYear,
  onDone,
  onCancel,
}) => {
  const [districtCode, setDistrictCode] = useState(existing?.districtCode ?? '');
  const [districtName, setDistrictName] = useState(existing?.districtName ?? '');
  const [taxYear, setTaxYear] = useState(existing?.taxYear ?? defaultYear ?? new Date().getFullYear());
  const [status, setStatus] = useState(existing?.status ?? 'draft');
  const [leviedAmount, setLeviedAmount] = useState<string>(existing ? existing.leviedAmount.toFixed(2) : '');
  const [levyRate, setLevyRate] = useState<string>(existing ? existing.levyRate.toFixed(6) : '');
  const [reviewedBy, setReviewedBy] = useState(existing?.reviewedBy ?? '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!districtCode.trim()) { setSaveError('District code is required.'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const req: LevyCertificationUpsertRequest = {
        districtCode: districtCode.trim(),
        districtName: districtName.trim() || undefined,
        taxYear,
        status,
        leviedAmount: leviedAmount ? parseFloat(leviedAmount) : undefined,
        levyRate: levyRate ? parseFloat(levyRate) : undefined,
        reviewedBy: reviewedBy.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      await upsertCertification(req);
      onDone();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'hsl(var(--tf-fg) / 0.06)',
    border: '1px solid hsl(var(--tf-fg) / 0.15)',
    borderRadius: 5,
    padding: '6px 10px',
    color: T.textPrimary,
    fontSize: 13,
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: T.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    display: 'block',
    marginBottom: 4,
  };

  return (
    <div
      style={{
        background: T.cardBg,
        border: T.cyanBorderAlpha,
        borderRadius: 8,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: T.cyan }}>
        {existing ? `Update Certification — ${existing.districtName || existing.districtCode}` : 'Add Certification Record'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>District Code *</label>
          <input
            style={inputStyle}
            value={districtCode}
            onChange={e => setDistrictCode(e.target.value)}
            placeholder="e.g. BC-REG"
            disabled={!!existing}
          />
        </div>
        <div>
          <label style={labelStyle}>District Name</label>
          <input
            style={inputStyle}
            value={districtName}
            onChange={e => setDistrictName(e.target.value)}
            placeholder="e.g. Benton County Regular"
          />
        </div>
        <div>
          <label style={labelStyle}>Tax Year *</label>
          <input
            style={inputStyle}
            type="number"
            value={taxYear}
            onChange={e => setTaxYear(Number(e.target.value))}
            disabled={!!existing}
          />
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select
            style={{ ...inputStyle, appearance: 'none' as const }}
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="certified">Certified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Levied Amount ($)</label>
          <input
            style={inputStyle}
            type="number"
            step="0.01"
            value={leviedAmount}
            onChange={e => setLeviedAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <label style={labelStyle}>Levy Rate (per $1,000 AV)</label>
          <input
            style={inputStyle}
            type="number"
            step="0.000001"
            value={levyRate}
            onChange={e => setLevyRate(e.target.value)}
            placeholder="0.000000"
          />
        </div>
        <div>
          <label style={labelStyle}>Reviewed By</label>
          <input
            style={inputStyle}
            value={reviewedBy}
            onChange={e => setReviewedBy(e.target.value)}
            placeholder="Specialist name"
          />
        </div>
        <div>
          <label style={labelStyle}>Notes</label>
          <input
            style={inputStyle}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      {saveError && (
        <div style={{ color: T.danger, fontSize: 12, padding: '6px 0' }}>
          ✗ {saveError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '7px 16px',
            background: 'none',
            border: T.cardBorder,
            borderRadius: 5,
            color: T.textMuted,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '7px 16px',
            background: T.cyanBgAlpha,
            border: T.cyanBorderAlpha,
            borderRadius: 5,
            color: T.cyan,
            cursor: saving ? 'wait' : 'pointer',
            fontSize: 13,
            fontWeight: 500,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save Certification'}
        </button>
      </div>
    </div>
  );
};

export { CertificationActionPanel };
export default CertificationStatusTab;
