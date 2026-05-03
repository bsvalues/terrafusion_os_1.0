// evidencePacketMarkdown.ts
// Converts EvidencePacketDto → a DOR-ready markdown string.
// Pure function — no side effects, no React, testable.

import type { EvidencePacketDto } from '../countyStudyApi';

function fmt(n: number | null | undefined, decimals = 3): string {
  if (n == null) return 'N/A';
  return n.toFixed(decimals);
}

function cell(value: string | number | null | undefined): string {
  if (value == null || value === '') return 'N/A';
  return String(value).replace(/\|/g, '/');
}

function iaaoStatus(status: string): string {
  if (status === 'IaaoCompliant') return '✅ COMPLIANT';
  if (status === 'MarginalCompliance') return '⚠️  MARGINAL';
  if (status === 'InsufficientData') return 'INSUFFICIENT DATA';
  if (status === 'Compliant') return '✅ COMPLIANT';
  if (status === 'Marginal') return '⚠️  MARGINAL';
  if (status === 'NonCompliant') return '❌ NON-COMPLIANT';
  return status;
}

function plural(count: number, singular: string, pluralLabel = `${singular}s`): string {
  return `${count.toLocaleString()} ${count === 1 ? singular : pluralLabel}`;
}

export function evidencePacketToMarkdown(p: EvidencePacketDto): string {
  const lines: string[] = [];

  lines.push(`# IAAO Evidence Packet — ${p.countyName}`);
  lines.push(`**Tax Year:** ${p.taxYear}  |  **Study Type:** ${p.studyType}  |  **Study Status:** ${p.studyStatus}`);
  lines.push(`**Correction Priority Contract:** \`${p.correctionPriorityContractId}\``);
  lines.push(`**Exported:** ${new Date(p.exportedAt).toLocaleString()} by ${p.exportedBy}`);
  lines.push('');
  lines.push('---');

  // IAAO Metrics
  lines.push('## IAAO Compliance Metrics');
  lines.push(`| Metric | Value | IAAO Threshold | Status |`);
  lines.push(`|--------|-------|----------------|--------|`);
  lines.push(`| Median Assessment Ratio | ${fmt(p.medianRatio)} | 0.90 – 1.10 | ${p.medianRatio != null && p.medianRatio >= 0.90 && p.medianRatio <= 1.10 ? '✅ Pass' : '❌ Fail'} |`);
  lines.push(`| COD | ${fmt(p.cod, 1)} | ≤ 20.0 | ${p.cod != null && p.cod <= 20 ? '✅ Pass' : '❌ Fail'} |`);
  lines.push(`| PRD | ${fmt(p.prd)} | 0.98 – 1.03 | ${p.prd != null && p.prd >= 0.98 && p.prd <= 1.03 ? '✅ Pass' : '❌ Fail'} |`);
  lines.push('');
  lines.push(`**Overall Compliance:** ${iaaoStatus(p.complianceStatus)}`);
  lines.push(`**Sample:** ${p.parcelCount.toLocaleString()} parcels, ${p.ratioCount.toLocaleString()} ratios`);
  lines.push(`**Segments:** ${p.criticalSegments} critical / ${p.warningSegments} warning / ${p.healthySegments} healthy`);
  lines.push('');

  // Scenario Decision
  lines.push('## Adjustment Decision');
  if (p.primaryScenario) {
    const s = p.primaryScenario;
    lines.push(`**Adjustment Type:** ${s.adjustmentType}`);
    lines.push(`**Parameters:** \`${s.parameters}\``);
    lines.push(`**Rationale:** ${s.rationale}`);
    lines.push(`**Status:** ${s.status}`);
    lines.push(`**Created by:** ${s.createdBy} on ${new Date(s.createdAt).toLocaleDateString()}`);
  } else {
    lines.push('_No scenario selected for this packet._');
  }
  lines.push('');

  // Defense Memo
  lines.push('## Defense Memo');
  lines.push(
    `County Studio defense posture: ${p.countyName} ${p.taxYear} is ${iaaoStatus(p.complianceStatus)} under \`${p.correctionPriorityContractId}\`.`,
  );
  lines.push(
    `Evidence basis: ${plural(p.parcelCount, 'parcel')} / ${plural(p.ratioCount, 'ratio')} with ${plural(p.criticalSegments, 'critical segment')} and ${plural(p.warningSegments, 'warning segment')}.`,
  );
  if (p.primaryScenario) {
    lines.push(
      `Primary scenario: ${p.primaryScenario.adjustmentType} is ${p.primaryScenario.status}; rationale: ${p.primaryScenario.rationale}.`,
    );
  } else {
    lines.push('Primary scenario: no scenario is attached to this packet.');
  }
  lines.push(
    `Defense risk posture: ${plural(p.topRiskSegments.length, 'top-risk segment signal')} and ${plural(p.exceptions.length, 'exception set')} included for disclosure.`,
  );
  lines.push('');

  // AI Diagnosis
  lines.push('## AI Diagnostic Summary');
  if (p.aiDiagnosis) {
    const d = p.aiDiagnosis;
    lines.push(`**Overall Classification:** ${d.overallClass} (confidence: ${(d.overallConfidence * 100).toFixed(0)}%)`);
    lines.push(`**Segments:** ${d.healthySegmentCount} healthy, ${d.problemSegmentCount} with problems`);
    lines.push('');
    lines.push(`> ${d.narrative}`);
    lines.push('');
    if (d.topFindings.length > 0) {
      lines.push('**Top Findings:**');
      d.topFindings.forEach((f, i) => {
        lines.push(`${i + 1}. [${f.category}] **${f.code}** — ${f.summary} _(strength: ${f.evidenceStrength.toFixed(2)})_`);
      });
    }
  } else {
    lines.push('_AI diagnosis not available (no active segment set or derivation not yet run)._');
  }
  lines.push('');

  // Top-risk segment signals
  lines.push('## Top Risk Segment Signals');
  if (p.topRiskSegments.length === 0) {
    lines.push('_No top-risk segment signals were included in this packet._');
  } else {
    lines.push('| # | Segment | Scope | Parcels | Ratios | Median | COD | PRD | PRB | Weighted Mean | Risk | Exceptions |');
    lines.push('|---|---------|-------|---------|--------|--------|-----|-----|-----|---------------|------|------------|');
    p.topRiskSegments.forEach((segment, i) => {
      const scope = [
        segment.neighborhoodCode ? `Neighborhood ${segment.neighborhoodCode}` : null,
        segment.revalArea != null ? `Reval ${segment.revalArea}` : null,
      ].filter(Boolean).join(' / ') || 'N/A';
      lines.push(
        `| ${i + 1} | ${cell(segment.segmentName)} | ${cell(scope)} | ${segment.parcelCount.toLocaleString()} | ${segment.ratioCount?.toLocaleString() ?? 'N/A'} | ${fmt(segment.medianRatio)} | ${fmt(segment.cod, 1)} | ${fmt(segment.prd)} | ${fmt(segment.prb)} | ${fmt(segment.weightedMeanRatio)} | ${fmt(segment.riskScore, 1)} | ${segment.exceptionCount} |`,
      );
    });
  }
  lines.push('');

  // Exception Log
  lines.push('## Exception Log');
  if (p.exceptions.length === 0) {
    lines.push('_No exception sets recorded for this study._');
  } else {
    lines.push(`| # | Reason | Parcels | Destination | Status | Assigned To | Age |`);
    lines.push(`|---|--------|---------|-------------|--------|-------------|-----|`);
    p.exceptions.forEach((e, i) => {
      const age = Math.floor((Date.now() - new Date(e.createdAt).getTime()) / 86_400_000);
      lines.push(`| ${i + 1} | ${e.reasonCode} | ${e.parcelCount} | ${e.destination} | ${e.status} | ${e.assignedTo ?? '—'} | ${age}d |`);
    });
    if (p.exceptions.some(e => e.notes)) {
      lines.push('');
      lines.push('**Exception Notes:**');
      p.exceptions.filter(e => e.notes).forEach((e, i) => {
        lines.push(`- **Exception ${i + 1} (${e.reasonCode}):** ${e.notes}`);
      });
    }
  }
  lines.push('');
  lines.push('---');
  lines.push(`_Generated by TerraFusion County Studio — Study ${p.studyId}_`);

  return lines.join('\n');
}
