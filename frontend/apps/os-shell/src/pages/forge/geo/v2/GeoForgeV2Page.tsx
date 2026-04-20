// GeoForge v2 — Assessor Audit Command Center.
//
// Tri-pane workspace: Audit Queue (left) + Map (center) + Context Panel (right).
// Bottom: AI Copilot NL bar.
// Lumin Bridge palette — warm linen + terracotta + sage, Liquid Glass chrome.
// No hotkey panels. Selection drives the context pane.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GeoForgeV2Map } from './GeoForgeV2Map';
import {
  fetchAuditRanked,
  fetchNbhdOutlines,
  fetchParcelTiles,
  type AuditRankedRow,
  type ParcelTileProps,
} from './v2Api';
import './geoforge-v2.css';

type TabKey = 'mission' | 'ratio' | 'outliers' | 'adjust' | 'memo';

export function GeoForgeV2Page() {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [taxYear] = useState(currentYear);
  const [selectedNbhd, setSelectedNbhd] = useState<string | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelTileProps | null>(null);
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState<number>(10);
  const [tab, setTab] = useState<TabKey>('mission');
  const [copilotText, setCopilotText] = useState('');

  // ── Data queries ──────────────────────────────────────────
  const outlinesQ = useQuery({
    queryKey: ['gf2-outlines', taxYear],
    queryFn: ({ signal }) => fetchNbhdOutlines(taxYear, signal),
    staleTime: 1000 * 60 * 10,
  });

  const auditQ = useQuery({
    queryKey: ['gf2-audit', taxYear],
    queryFn: ({ signal }) => fetchAuditRanked(taxYear, 50, signal),
    staleTime: 1000 * 60 * 5,
  });

  const parcelsQ = useQuery({
    queryKey: ['gf2-parcels', taxYear, bbox?.join(','), selectedNbhd],
    queryFn: ({ signal }) =>
      fetchParcelTiles({
        taxYear,
        bbox: bbox ?? undefined,
        neighborhoodCode: selectedNbhd,
        limit: 3000,
        signal,
      }),
    enabled: zoom >= 12,  // only fetch when zoomed in enough
    staleTime: 1000 * 30,
  });

  // ── Derived: county-wide mission metrics ──────────────────
  const countyMission = useMemo(() => {
    const rows = auditQ.data ?? [];
    if (rows.length === 0) return null;
    const totalSales = rows.reduce((s, r) => s + r.saleCount, 0);
    const wMedRatio = totalSales > 0
      ? rows.reduce((s, r) => s + r.medianRatio * r.saleCount, 0) / totalSales
      : 0;
    const wCod = totalSales > 0
      ? rows.reduce((s, r) => s + r.cod * r.saleCount, 0) / totalSales
      : 0;
    const passing = rows.filter(r => r.grade === 'A' || r.grade === 'B' || r.grade === 'C').length;
    const failing = rows.filter(r => r.grade === 'D' || r.grade === 'F').length;
    return { totalSales, wMedRatio, wCod, passing, failing, total: rows.length };
  }, [auditQ.data]);

  // ── Selected audit row for context ────────────────────────
  const selectedAudit: AuditRankedRow | null = useMemo(() => {
    if (!selectedNbhd || !auditQ.data) return null;
    return auditQ.data.find(r => r.neighborhoodCode === selectedNbhd) ?? null;
  }, [selectedNbhd, auditQ.data]);

  // Auto-switch to ratio tab when a neighborhood is selected
  useEffect(() => {
    if (selectedNbhd && tab === 'mission') setTab('ratio');
    if (!selectedNbhd && tab !== 'mission') setTab('mission');
  }, [selectedNbhd]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewport = useCallback(
    (b: [number, number, number, number], z: number) => {
      setBbox(b); setZoom(z);
    },
    [],
  );

  const handleCopilotSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotText.trim()) return;
    // NL query stub — v2.1 will route via /v2/nl/query. For v2 we echo intent.
    console.info('[copilot] query:', copilotText);
    setCopilotText('');
  }, [copilotText]);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="geoforge-v2">
      {/* Top mission control bar */}
      <div className="gf2-topbar">
        <div className="gf2-topbar__brand">
          <span>GeoForge</span>
          <span className="gf2-topbar__brand-sub">Audit Command · Benton {taxYear}</span>
        </div>
        <div className="gf2-topbar__metrics">
          <Metric label="Neighborhoods" value={countyMission ? String(countyMission.total) : '—'} />
          <Metric label="Qualified Sales" value={countyMission ? countyMission.totalSales.toLocaleString() : '—'} />
          <Metric
            label="Countywide Median"
            value={countyMission ? countyMission.wMedRatio.toFixed(4) : '—'}
            tone={countyMission && countyMission.wMedRatio >= 0.90 && countyMission.wMedRatio <= 1.10 ? 'pass' : 'fail'}
          />
          <Metric
            label="Countywide COD"
            value={countyMission ? countyMission.wCod.toFixed(2) : '—'}
            tone={countyMission && countyMission.wCod <= 20 ? 'pass' : 'risk'}
          />
          <Metric
            label="Failing"
            value={countyMission ? String(countyMission.failing) : '—'}
            tone={countyMission && countyMission.failing > 0 ? 'fail' : 'pass'}
          />
        </div>
      </div>

      {/* Left rail: Audit Queue */}
      <div className="gf2-queue">
        <div className="gf2-queue__header">
          <div className="gf2-queue__eyebrow">Audit Queue</div>
          <div className="gf2-queue__title">AI-ranked</div>
          <div className="gf2-queue__hint">Impact × severity · click to audit</div>
        </div>
        <div className="gf2-queue__list">
          {auditQ.isLoading && <div className="gf2-loading">Scoring {taxYear} neighborhoods…</div>}
          {auditQ.data?.map((row) => (
            <AuditQueueRow
              key={row.neighborhoodCode}
              row={row}
              selected={row.neighborhoodCode === selectedNbhd}
              onClick={() => setSelectedNbhd(row.neighborhoodCode)}
            />
          ))}
          {auditQ.data && auditQ.data.length === 0 && (
            <div className="gf2-empty">No audit findings yet.</div>
          )}
        </div>
      </div>

      {/* Center: Map */}
      <div className="gf2-map">
        <GeoForgeV2Map
          outlines={outlinesQ.data ?? null}
          parcels={zoom >= 12 ? parcelsQ.data ?? null : null}
          selectedNeighborhoodCode={selectedNbhd}
          onNeighborhoodClick={(code) => setSelectedNbhd(code)}
          onParcelClick={(p) => setSelectedParcel(p)}
          onViewportChange={handleViewport}
        />

        {zoom < 13 && (
          <div className="gf2-map__zoomhint">Zoom in to reveal parcels</div>
        )}

        <MapLegend />

        {selectedParcel && (
          <ParcelAuditCard
            parcel={selectedParcel}
            onClose={() => setSelectedParcel(null)}
          />
        )}
      </div>

      {/* Right: Context Panel */}
      <div className="gf2-panel">
        <div className="gf2-panel__header">
          <div className="gf2-panel__eyebrow">
            {selectedNbhd ? `Neighborhood ${selectedNbhd}` : 'Mission Control'}
          </div>
          <div className="gf2-panel__title">
            {selectedNbhd
              ? (selectedAudit?.primaryCause === 'within_bounds' ? 'Compliant' : 'Requires audit')
              : 'Benton County Equity'}
          </div>
        </div>

        <div className="gf2-panel__tabs">
          {(['mission', 'ratio', 'outliers', 'adjust', 'memo'] as TabKey[]).map(t => (
            <button
              key={t}
              className={`gf2-panel__tab ${tab === t ? 'gf2-panel__tab--active' : ''}`}
              onClick={() => setTab(t)}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="gf2-panel__body">
          {tab === 'mission' && <MissionTab mission={countyMission} audit={auditQ.data ?? []} onPick={setSelectedNbhd} />}
          {tab === 'ratio' && <RatioTab audit={selectedAudit} />}
          {tab === 'outliers' && <OutlierTab audit={selectedAudit} />}
          {tab === 'adjust' && <AdjustTab audit={selectedAudit} />}
          {tab === 'memo' && <MemoTab audit={selectedAudit} mission={countyMission} />}
        </div>
      </div>

      {/* Bottom: AI Copilot */}
      <form className="gf2-copilot" onSubmit={handleCopilotSubmit}>
        <span className="gf2-copilot__prompt">AI&nbsp;Copilot&nbsp;&gt;</span>
        <input
          className="gf2-copilot__input"
          value={copilotText}
          onChange={(e) => setCopilotText(e.target.value)}
          placeholder="show me SFR sales last 90 days with ratio below 0.80…"
        />
        <span className="gf2-copilot__hint">v2.1</span>
      </form>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════

const TAB_LABELS: Record<TabKey, string> = {
  mission:  'Mission',
  ratio:    'Ratio',
  outliers: 'Outliers',
  adjust:   'Adjust',
  memo:     'DOR Memo',
};

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'pass' | 'risk' | 'fail' }) {
  const cls = tone === 'pass' ? 'gf2-metric__value--pass'
    : tone === 'risk' ? 'gf2-metric__value--risk'
    : tone === 'fail' ? 'gf2-metric__value--fail' : '';
  return (
    <div className="gf2-metric">
      <span className="gf2-metric__label">{label}</span>
      <span className={`gf2-metric__value ${cls}`}>{value}</span>
    </div>
  );
}

function AuditQueueRow({ row, selected, onClick }:
  { row: AuditRankedRow; selected: boolean; onClick: () => void }) {
  return (
    <div
      className={`gf2-queue__row ${selected ? 'gf2-queue__row--selected' : ''}`}
      onClick={onClick}
    >
      <div className={`gf2-grade-chip gf2-grade-chip--${row.grade}`}>{row.grade}</div>
      <div>
        <div className="gf2-queue__row-code">{row.neighborhoodCode}</div>
        <div className="gf2-queue__row-stats">
          <span>med {row.medianRatio.toFixed(3)}</span>
          <span>cod {row.cod.toFixed(1)}</span>
          <span>n={row.saleCount}</span>
        </div>
        <div className="gf2-queue__row-cause">{row.primaryCause.replace(/_/g, ' ')}</div>
        <div className="gf2-queue__row-diag">{row.actionLine}</div>
      </div>
    </div>
  );
}

function MapLegend() {
  return (
    <div className="gf2-map__legend">
      <div className="gf2-legend__title">Parcel ratio</div>
      {[
        { sw: 'hsl(140, 22%, 42%)', label: 'deep under (< −10%)' },
        { sw: 'hsl(140, 28%, 58%)', label: 'under (−5 to −10%)' },
        { sw: 'hsl(44, 16%, 92%)',  label: 'parity (±5%)' },
        { sw: 'hsl(16, 55%, 66%)',  label: 'over (+5 to +10%)' },
        { sw: 'hsl(16, 62%, 48%)',  label: 'deep over (> +10%)' },
        { sw: 'hsl(42, 18%, 88%)',  label: 'no sale' },
      ].map((r) => (
        <div key={r.label} className="gf2-legend__row">
          <span className="gf2-legend__sw" style={{ background: r.sw }} />
          <span>{r.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────────

function MissionTab({
  mission,
  audit,
  onPick,
}: {
  mission: { totalSales: number; wMedRatio: number; wCod: number; passing: number; failing: number; total: number } | null;
  audit: AuditRankedRow[];
  onPick: (code: string) => void;
}) {
  if (!mission) return <div className="gf2-loading">Loading…</div>;

  const pct = mission.total > 0 ? (mission.passing / mission.total) * 100 : 0;
  const cwPass = mission.wMedRatio >= 0.90 && mission.wMedRatio <= 1.10 && mission.wCod <= 20;
  const top = audit.slice(0, 5);

  return (
    <>
      <div className="gf2-stat-row">
        <Stat label="DOR Cert" value={cwPass ? 'ACHIEVABLE' : 'AT RISK'} tone={cwPass ? 'pass' : 'fail'} />
        <Stat label="Pass rate" value={`${pct.toFixed(0)}%`} tone={pct >= 70 ? 'pass' : pct >= 50 ? 'risk' : 'fail'} />
        <Stat label="Failing" value={String(mission.failing)} tone={mission.failing === 0 ? 'pass' : 'fail'} />
      </div>

      <div className="gf2-kv"><span className="gf2-kv__label">Total nbhds</span><span className="gf2-kv__value">{mission.total}</span></div>
      <div className="gf2-kv"><span className="gf2-kv__label">Qualified sales</span><span className="gf2-kv__value">{mission.totalSales.toLocaleString()}</span></div>
      <div className="gf2-kv"><span className="gf2-kv__label">Median ratio</span><span className="gf2-kv__value">{mission.wMedRatio.toFixed(4)}</span></div>
      <div className="gf2-kv"><span className="gf2-kv__label">COD</span><span className="gf2-kv__value">{mission.wCod.toFixed(2)}</span></div>

      <h4 style={{ marginTop: 20, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'hsl(var(--tf-muted))' }}>
        Top 5 to audit
      </h4>
      {top.map((r, i) => (
        <div
          key={r.neighborhoodCode}
          onClick={() => onPick(r.neighborhoodCode)}
          style={{ padding: '8px 0', borderBottom: '1px solid hsl(var(--tf-border) / 0.3)', cursor: 'pointer', fontSize: 11 }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', color: 'hsl(var(--tf-text))' }}>
            #{i + 1}  {r.neighborhoodCode} · grade {r.grade} · med {r.medianRatio.toFixed(3)}
          </div>
          <div style={{ color: 'hsl(var(--tf-muted))', fontSize: 10, marginTop: 2 }}>{r.actionLine}</div>
        </div>
      ))}
    </>
  );
}

function RatioTab({ audit }: { audit: AuditRankedRow | null }) {
  if (!audit) return <div className="gf2-empty">Select a neighborhood from the audit queue or the map.</div>;

  const medTone: 'pass' | 'risk' | 'fail' = audit.medianRatio >= 0.95 && audit.medianRatio <= 1.05 ? 'pass'
    : audit.medianRatio >= 0.90 && audit.medianRatio <= 1.10 ? 'risk' : 'fail';
  const codTone: 'pass' | 'risk' | 'fail' = audit.cod <= 15 ? 'pass' : audit.cod <= 20 ? 'risk' : 'fail';

  const primary = audit.hypotheses[0];

  return (
    <>
      <div className="gf2-stat-row">
        <Stat label="Median" value={audit.medianRatio.toFixed(4)} tone={medTone} />
        <Stat label="COD" value={audit.cod.toFixed(2)} tone={codTone} />
        <Stat label="Sales" value={String(audit.saleCount)} />
      </div>

      {primary && (
        <div className="gf2-ai">
          <div className="gf2-ai__eyebrow">AI Root Cause</div>
          <div className="gf2-ai__cause">{primary.cause.replace(/_/g, ' ')}</div>
          <div className="gf2-ai__evidence">{primary.evidence}</div>
          <div className="gf2-ai__action">→ {primary.action}</div>
          {audit.hypotheses.slice(1).map((h, i) => (
            <div key={i} className="gf2-ai__hypothesis">
              <span className="gf2-ai__hypothesis-tag">{h.cause.replace(/_/g, ' ')}</span>
              {h.evidence}
            </div>
          ))}
        </div>
      )}

      <div className="gf2-kv"><span className="gf2-kv__label">Grade</span><span className="gf2-kv__value">{audit.grade}</span></div>
      <div className="gf2-kv"><span className="gf2-kv__label">Deviation</span><span className="gf2-kv__value">{audit.deviation >= 0 ? '+' : ''}{audit.deviation.toFixed(4)}</span></div>
      <div className="gf2-kv"><span className="gf2-kv__label">Impact score</span><span className="gf2-kv__value">{audit.impact.toFixed(3)}</span></div>
    </>
  );
}

function OutlierTab({ audit }: { audit: AuditRankedRow | null }) {
  if (!audit) return <div className="gf2-empty">Select a neighborhood.</div>;
  const h = audit.hypotheses.find(x => x.cause === 'high_cod_dispersion');
  return (
    <>
      <div className="gf2-stat-row">
        <Stat label="COD" value={audit.cod.toFixed(2)} tone={audit.cod <= 20 ? 'pass' : 'fail'} />
        <Stat label="IAAO bound" value="≤ 20" />
        <Stat label="Deviation" value={h ? 'yes' : 'ok'} tone={h ? 'fail' : 'pass'} />
      </div>
      <p style={{ fontSize: 11, color: 'hsl(var(--tf-muted))', marginTop: 6 }}>
        Outlier-level drilldown renders in the map (amber-glow stroke on parcels) when zoom ≥ 13.
      </p>
      {h && (
        <div className="gf2-ai">
          <div className="gf2-ai__eyebrow">Uniformity Check</div>
          <div className="gf2-ai__cause">High COD dispersion</div>
          <div className="gf2-ai__evidence">{h.evidence}</div>
          <div className="gf2-ai__action">→ {h.action}</div>
        </div>
      )}
    </>
  );
}

function AdjustTab({ audit }: { audit: AuditRankedRow | null }) {
  if (!audit) return <div className="gf2-empty">Select a neighborhood.</div>;
  const target = ((1.0 - audit.medianRatio) / audit.medianRatio) * 100;
  const tone = Math.abs(target) > 10 ? 'fail' : Math.abs(target) > 5 ? 'risk' : 'pass';
  return (
    <>
      <div className="gf2-ai">
        <div className="gf2-ai__eyebrow">Adjustment Sandbox</div>
        <div className="gf2-ai__cause">Required shift</div>
        <div className="gf2-ai__evidence">
          Current median {audit.medianRatio.toFixed(4)} — targeting parity (1.000) requires
          multiplying AVs by {(1 / audit.medianRatio).toFixed(4)}, or applying +{target.toFixed(2)}%.
        </div>
        <div className="gf2-ai__action">→ Simulate (v2.1) will preview COD/PRD impact before commit.</div>
      </div>
      <div className="gf2-stat-row">
        <Stat label="Target %" value={`${target >= 0 ? '+' : ''}${target.toFixed(2)}%`} tone={tone} />
        <Stat label="Factor" value={(1 / audit.medianRatio).toFixed(4)} />
        <Stat label="Sales" value={String(audit.saleCount)} />
      </div>
    </>
  );
}

function MemoTab({ audit, mission }:
  { audit: AuditRankedRow | null; mission: { wMedRatio: number; wCod: number; failing: number; total: number } | null }) {
  const date = new Date().toLocaleDateString();
  if (!mission) return <div className="gf2-loading">Loading…</div>;

  const body = audit
    ? `Neighborhood ${audit.neighborhoodCode} shows median ratio ${audit.medianRatio.toFixed(4)} with COD ${audit.cod.toFixed(2)} (n=${audit.saleCount}). Primary finding: ${audit.primaryCause.replace(/_/g, ' ')}. ${audit.hypotheses[0]?.evidence ?? ''} Recommended action: ${audit.actionLine}`
    : `Countywide median ratio ${mission.wMedRatio.toFixed(4)} with weighted COD ${mission.wCod.toFixed(2)}. ${mission.failing} of ${mission.total} neighborhoods grade D/F and require remediation prior to DOR certification.`;

  return (
    <>
      <div className="gf2-ai">
        <div className="gf2-ai__eyebrow">DOR Memo · WAC 458-53A · {date}</div>
        <div className="gf2-ai__cause">{audit ? `${audit.neighborhoodCode} narrative` : 'Countywide narrative'}</div>
        <div className="gf2-ai__evidence" style={{ lineHeight: 1.6 }}>{body}</div>
      </div>
      <p style={{ fontSize: 10, color: 'hsl(var(--tf-muted))', marginTop: 12 }}>
        v2.1 will auto-draft from the full hypothesis chain and attach all commit proposals from the adjustment log.
      </p>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'pass' | 'risk' | 'fail' }) {
  const cls = tone === 'pass' ? 'gf2-stat__value--pass'
    : tone === 'risk' ? 'gf2-stat__value--risk'
    : tone === 'fail' ? 'gf2-stat__value--fail' : '';
  return (
    <div className="gf2-stat">
      <div className="gf2-stat__label">{label}</div>
      <div className={`gf2-stat__value ${cls}`}>{value}</div>
    </div>
  );
}

// ── Floating parcel audit card ─────────────────────────────────────────

function ParcelAuditCard({ parcel, onClose }: { parcel: ParcelTileProps; onClose: () => void }) {
  const ratioTone: 'pass' | 'risk' | 'fail' | undefined =
    parcel.ratio == null ? undefined
    : parcel.ratio >= 0.95 && parcel.ratio <= 1.05 ? 'pass'
    : parcel.ratio >= 0.90 && parcel.ratio <= 1.10 ? 'risk' : 'fail';

  return (
    <div className="gf2-parcel-card">
      <button className="gf2-parcel-card__close" onClick={onClose} aria-label="close">×</button>
      <div className="gf2-parcel-card__eyebrow">Parcel Audit</div>
      <div className="gf2-parcel-card__id">{parcel.parcelId}</div>
      {parcel.situsAddress && <div className="gf2-parcel-card__addr">{parcel.situsAddress}</div>}

      <div className="gf2-stat-row">
        <Stat label="AV" value={`$${Math.round(parcel.assessedValue).toLocaleString()}`} />
        <Stat label="Class" value={parcel.propertyClass ?? '—'} />
        <Stat label="Nbhd" value={parcel.neighborhoodCode ?? '—'} />
      </div>

      <div className="gf2-kv"><span className="gf2-kv__label">Year built</span><span className="gf2-kv__value">{parcel.yearBuilt ?? '—'}</span></div>
      <div className="gf2-kv"><span className="gf2-kv__label">Area (ac)</span><span className="gf2-kv__value">{parcel.areaAcres ? parcel.areaAcres.toFixed(2) : '—'}</span></div>
      <div className="gf2-kv"><span className="gf2-kv__label">Last sale</span><span className="gf2-kv__value">{parcel.saleDate ? new Date(parcel.saleDate).toLocaleDateString() : '—'}</span></div>
      <div className="gf2-kv"><span className="gf2-kv__label">Price</span><span className="gf2-kv__value">{parcel.salePrice > 0 ? `$${Math.round(parcel.salePrice).toLocaleString()}` : '—'}</span></div>

      {parcel.ratio != null && (
        <div className="gf2-ai">
          <div className="gf2-ai__eyebrow">Ratio vs Nbhd</div>
          <div className={`gf2-stat__value ${ratioTone === 'pass' ? 'gf2-stat__value--pass' : ratioTone === 'fail' ? 'gf2-stat__value--fail' : 'gf2-stat__value--risk'}`}>
            {parcel.ratio.toFixed(4)}
          </div>
          <div className="gf2-ai__evidence">
            nbhd median {parcel.nbhdMedianRatio?.toFixed(4) ?? '—'}, deviation {parcel.ratioDeviation ? (parcel.ratioDeviation >= 0 ? '+' : '') + parcel.ratioDeviation.toFixed(4) : '—'}
          </div>
          {parcel.isOutlier && <div className="gf2-ai__action">⚑ Flagged outlier — candidate for review.</div>}
        </div>
      )}
    </div>
  );
}
