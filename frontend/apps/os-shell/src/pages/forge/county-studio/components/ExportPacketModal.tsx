// ExportPacketModal.tsx
// Shows a preview of the evidence packet + download/copy buttons.
// Triggered by "Export Evidence Packet" button in CountyHealthPanel.
import React, { useState, useEffect } from 'react';
import { evidencePacketApi, type EvidencePacketDto } from '../countyStudyApi';
import { evidencePacketToMarkdown } from '../utils/evidencePacketMarkdown';

interface Props {
  studyId: string;
  scenarioId?: string;
  onClose: () => void;
}

const CITY_PRIMARY_KEYS = new Set(['city', 'cityName', 'selectedCity']);

function stripCityPrimaryKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripCityPrimaryKeys);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key, item]) => !CITY_PRIMARY_KEYS.has(key) && !(key === 'rollupScope' && item === 'city'))
        .map(([key, item]) => [key, stripCityPrimaryKeys(item)]),
    );
  }
  return value;
}

function sanitizeEvidencePacketForExport(packet: EvidencePacketDto): EvidencePacketDto {
  return stripCityPrimaryKeys(packet) as EvidencePacketDto;
}

export function ExportPacketModal({ studyId, scenarioId, onClose }: Props) {
  const [packet, setPacket] = useState<EvidencePacketDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    evidencePacketApi.get(studyId, scenarioId)
      .then(setPacket)
      .catch(() => setError('Failed to generate evidence packet.'))
      .finally(() => setLoading(false));
  }, [studyId, scenarioId]);

  const handleDownloadJson = () => {
    if (!packet) return;
    const blob = new Blob([JSON.stringify(sanitizeEvidencePacketForExport(packet), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence-packet-${packet.taxYear}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = async () => {
    if (!packet) return;
    const md = evidencePacketToMarkdown(sanitizeEvidencePacketForExport(packet));
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatMetric = (value: number | null | undefined, decimals = 3) =>
    value == null ? 'N/A' : value.toFixed(decimals);

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
  };

  const modal: React.CSSProperties = {
    background: 'hsl(var(--tf-surface))', border: '1px solid hsl(var(--tf-border))',
    borderRadius: 8, width: 680, maxHeight: '85vh',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
  };

  return (
    <div data-testid="export-packet-overlay" style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--tf-border))', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>Evidence Packet Export</span>
          {packet && (
            <>
              <button data-testid="export-download-json" onClick={handleDownloadJson} style={btnStyle('#3b82f6')}>
                Download JSON
              </button>
              <button data-testid="export-copy-markdown" onClick={handleCopyMarkdown} style={btnStyle('#22c55e')}>
                {copied ? '✓ Copied!' : 'Copy Markdown'}
              </button>
            </>
          )}
          <button data-testid="export-close" onClick={onClose} style={{ ...btnStyle('#6b7280'), padding: '3px 8px' }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, fontSize: 12 }}>
          {loading && <div data-testid="export-loading" style={{ color: 'hsl(var(--tf-muted))', textAlign: 'center', paddingTop: 40 }}>Generating packet…</div>}
          {error && <div data-testid="export-error" style={{ color: '#ef4444' }}>{error}</div>}
          {packet && (
            <div data-testid="export-packet-content" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Header section */}
              <section>
                <h3 style={sectionTitle}>Study Header</h3>
                <table style={tableStyle}>
                  <tbody>
                    <tr><td style={tdLabel}>County</td><td style={tdValue}>{packet.countyName}</td></tr>
                    <tr><td style={tdLabel}>Tax Year</td><td style={tdValue}>{packet.taxYear}</td></tr>
                    <tr><td style={tdLabel}>Study Type</td><td style={tdValue}>{packet.studyType}</td></tr>
                    <tr><td style={tdLabel}>Status</td><td style={tdValue}>{packet.studyStatus}</td></tr>
                    <tr><td style={tdLabel}>Correction Contract</td><td style={tdValue}><code>{packet.correctionPriorityContractId}</code></td></tr>
                    <tr><td style={tdLabel}>Exported</td><td style={tdValue}>{new Date(packet.exportedAt).toLocaleString()} by {packet.exportedBy}</td></tr>
                  </tbody>
                </table>
              </section>

              {/* IAAO metrics */}
              <section>
                <h3 style={sectionTitle}>IAAO Compliance — {complianceBadge(packet.complianceStatus)}</h3>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={th}>Metric</th>
                      <th style={th}>Value</th>
                      <th style={th}>IAAO Threshold</th>
                      <th style={th}>Pass?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={tdLabel}>Median Ratio</td>
                      <td style={tdValue}>{packet.medianRatio?.toFixed(3) ?? 'N/A'}</td>
                      <td style={tdValue}>0.90 – 1.10</td>
                      <td style={tdValue}>{packet.medianRatio != null && packet.medianRatio >= 0.9 && packet.medianRatio <= 1.1 ? '✅' : packet.medianRatio != null ? '❌' : '—'}</td>
                    </tr>
                    <tr>
                      <td style={tdLabel}>COD</td>
                      <td style={tdValue}>{packet.cod?.toFixed(1) ?? 'N/A'}</td>
                      <td style={tdValue}>≤ 20.0</td>
                      <td style={tdValue}>{packet.cod != null && packet.cod <= 20 ? '✅' : packet.cod != null ? '❌' : '—'}</td>
                    </tr>
                    <tr>
                      <td style={tdLabel}>PRD</td>
                      <td style={tdValue}>{packet.prd?.toFixed(3) ?? 'N/A'}</td>
                      <td style={tdValue}>0.98 – 1.03</td>
                      <td style={tdValue}>{packet.prd != null && packet.prd >= 0.98 && packet.prd <= 1.03 ? '✅' : packet.prd != null ? '❌' : '—'}</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 6, fontSize: 11, color: 'hsl(var(--tf-muted))' }}>
                  {packet.parcelCount.toLocaleString()} parcels · {packet.ratioCount.toLocaleString()} ratios · {packet.criticalSegments} critical / {packet.warningSegments} warning / {packet.healthySegments} healthy segments
                </div>
              </section>

              {/* Scenario */}
              <section>
                <h3 style={sectionTitle}>Adjustment Decision</h3>
                {packet.primaryScenario ? (
                  <table style={tableStyle}>
                    <tbody>
                      <tr><td style={tdLabel}>Type</td><td style={tdValue}>{packet.primaryScenario.adjustmentType}</td></tr>
                      <tr><td style={tdLabel}>Parameters</td><td style={tdValue}><code>{packet.primaryScenario.parameters}</code></td></tr>
                      <tr><td style={tdLabel}>Rationale</td><td style={tdValue}>{packet.primaryScenario.rationale}</td></tr>
                      <tr><td style={tdLabel}>Status</td><td style={tdValue}>{packet.primaryScenario.status}</td></tr>
                      <tr><td style={tdLabel}>By</td><td style={tdValue}>{packet.primaryScenario.createdBy}</td></tr>
                    </tbody>
                  </table>
                ) : (
                  <div style={{ color: 'hsl(var(--tf-muted))', fontSize: 11 }}>No scenario selected.</div>
                )}
              </section>

              {/* AI Diagnosis */}
              <section>
                <h3 style={sectionTitle}>AI Diagnostic Summary</h3>
                {packet.aiDiagnosis ? (
                  <>
                    <div style={{ marginBottom: 6 }}>
                      <strong>{packet.aiDiagnosis.overallClass}</strong> ({(packet.aiDiagnosis.overallConfidence * 100).toFixed(0)}% confidence) — {packet.aiDiagnosis.healthySegmentCount} healthy, {packet.aiDiagnosis.problemSegmentCount} problem segments
                    </div>
                    <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))', marginBottom: 8, fontStyle: 'italic' }}>
                      {packet.aiDiagnosis.narrative}
                    </div>
                    {packet.aiDiagnosis.topFindings.map((f, i) => (
                      <div key={i} style={{ fontSize: 11, marginBottom: 3 }}>
                        <strong>[{f.category}] {f.code}</strong> — {f.summary}
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ color: 'hsl(var(--tf-muted))', fontSize: 11 }}>Not available — derive segments first.</div>
                )}
              </section>

              {/* Top-risk segment signals */}
              <section>
                <h3 style={sectionTitle}>Top Risk Segment Signals ({packet.topRiskSegments.length})</h3>
                {packet.topRiskSegments.length === 0 ? (
                  <div style={{ color: 'hsl(var(--tf-muted))', fontSize: 11 }}>
                    No segment signals available — derive segment metrics before exporting defense evidence.
                  </div>
                ) : (
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={th}>Segment</th>
                        <th style={th}>Scope</th>
                        <th style={th}>Parcels</th>
                        <th style={th}>Ratios</th>
                        <th style={th}>Median / COD / PRD</th>
                        <th style={th}>Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packet.topRiskSegments.map((segment) => (
                        <tr key={segment.segmentId}>
                          <td style={tdLabel}>{segment.segmentName}</td>
                          <td style={tdValue}>
                            {segment.neighborhoodCode ?? 'N/A'}
                            {segment.revalArea != null ? ` / Reval ${segment.revalArea}` : ''}
                          </td>
                          <td style={tdValue}>{segment.parcelCount.toLocaleString()}</td>
                          <td style={tdValue}>{segment.ratioCount?.toLocaleString() ?? 'N/A'}</td>
                          <td style={tdValue}>
                            {formatMetric(segment.medianRatio)} / {formatMetric(segment.cod, 1)} / {formatMetric(segment.prd)}
                          </td>
                          <td style={tdValue}>
                            {segment.riskScore.toFixed(1)} · {segment.exceptionCount} exception{segment.exceptionCount === 1 ? '' : 's'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              {/* Exceptions */}
              <section>
                <h3 style={sectionTitle}>Exception Log ({packet.exceptions.length})</h3>
                {packet.exceptions.length === 0 ? (
                  <div style={{ color: 'hsl(var(--tf-muted))', fontSize: 11 }}>No exceptions recorded.</div>
                ) : (
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={th}>Reason</th>
                        <th style={th}>Parcels</th>
                        <th style={th}>Destination</th>
                        <th style={th}>Status</th>
                        <th style={th}>Assigned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packet.exceptions.map(e => (
                        <tr key={e.exceptionSetId}>
                          <td style={tdLabel}>{e.reasonCode}</td>
                          <td style={tdValue}>{e.parcelCount}</td>
                          <td style={tdValue}>{e.destination}</td>
                          <td style={tdValue}>{e.status}</td>
                          <td style={tdValue}>{e.assignedTo ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const btnStyle = (color: string): React.CSSProperties => ({
  padding: '4px 10px', borderRadius: 4, border: 'none', fontSize: 11, fontWeight: 600,
  background: `${color}22`, color, cursor: 'pointer',
});

const complianceBadge = (status: string) => {
  const colors: Record<string, string> = {
    IaaoCompliant:      '#22c55e',
    MarginalCompliance: '#f59e0b',
    NonCompliant:       '#ef4444',
    InsufficientData:   '#6b7280',
  };
  const c = colors[status] ?? '#6b7280';
  return (
    <span
      data-compliance={status}
      data-compliance-color={c}
      style={{
        padding: '1px 8px', borderRadius: 10,
        background: `${c}22`, color: c, fontWeight: 700, fontSize: 11,
      }}
    >
      {status}
    </span>
  );
};

const sectionTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8,
  color: 'hsl(var(--tf-muted))', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8,
};
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const tdLabel: React.CSSProperties = { padding: '3px 8px', fontSize: 11, fontWeight: 600, color: 'hsl(var(--tf-muted))', width: 140 };
const tdValue: React.CSSProperties = { padding: '3px 8px', fontSize: 11, color: 'hsl(var(--tf-fg))', borderBottom: '1px solid hsl(var(--tf-border))' };
const th: React.CSSProperties = { ...tdLabel, borderBottom: '1px solid hsl(var(--tf-border))', textAlign: 'left' };
