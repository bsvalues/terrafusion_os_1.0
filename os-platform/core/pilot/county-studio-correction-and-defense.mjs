#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const evidenceDir = path.join(repoRoot, 'os-platform/core/pilot/evidence');

const files = {
  api: 'frontend/apps/os-shell/src/pages/forge/county-studio/countyStudyApi.ts',
  modal: 'frontend/apps/os-shell/src/pages/forge/county-studio/components/ExportPacketModal.tsx',
  markdown: 'frontend/apps/os-shell/src/pages/forge/county-studio/utils/evidencePacketMarkdown.ts',
  correctionPanel: 'frontend/apps/os-shell/src/pages/forge/county-studio/components/CorrectionDefensePanel.tsx',
  exceptionQueue: 'frontend/apps/os-shell/src/pages/forge/county-studio/components/ExceptionQueuePanel.tsx',
  scenarioWorksheet: 'frontend/apps/os-shell/src/pages/forge/county-studio/components/ScenarioWorksheet.tsx',
  adjustmentPanel: 'frontend/apps/os-shell/src/pages/forge/county-studio/components/AdjustmentSetPanel.tsx',
};

function read(relPath) {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

function lineOf(relPath, pattern) {
  const lines = read(relPath).split(/\r?\n/);
  const index = lines.findIndex((line) => pattern.test(line));
  return index >= 0 ? index + 1 : null;
}

function ref(relPath, pattern) {
  const line = lineOf(relPath, pattern);
  return line ? `${relPath}:${line}` : relPath;
}

function check(id, passed, proof, note) {
  return { id, passed, proof, note };
}

const api = read(files.api);
const modal = read(files.modal);
const markdown = read(files.markdown);
const correctionPanel = read(files.correctionPanel);
const exceptionQueue = read(files.exceptionQueue);
const scenarioWorksheet = read(files.scenarioWorksheet);
const adjustmentPanel = read(files.adjustmentPanel);

const checks = [
  check(
    'defense-packet-contract-carries-top-risk-segments',
    /export interface EvidenceSegmentSignal/.test(api)
      && /topRiskSegments: EvidenceSegmentSignal\[\]/.test(api),
    [
      ref(files.api, /export interface EvidenceSegmentSignal/),
      ref(files.api, /topRiskSegments: EvidenceSegmentSignal\[\]/),
    ],
    'Frontend evidence packet contract now matches the backend TopRiskSegments defense signal.',
  ),
  check(
    'export-modal-renders-top-risk-segment-signals',
    /Top Risk Segment Signals/.test(modal)
      && /packet\.topRiskSegments\.map/.test(modal)
      && /riskScore/.test(modal)
      && /exceptionCount/.test(modal),
    [
      ref(files.modal, /Top Risk Segment Signals/),
      ref(files.modal, /packet\.topRiskSegments\.map/),
    ],
    'Evidence export preview shows the segment-level correction evidence, not only headline county metrics.',
  ),
  check(
    'markdown-packet-renders-defense-trace',
    /## Top Risk Segment Signals/.test(markdown)
      && /weightedMeanRatio/.test(markdown)
      && /exceptionCount/.test(markdown)
      && /iaaoStatus/.test(markdown),
    [
      ref(files.markdown, /## Top Risk Segment Signals/),
      ref(files.markdown, /weightedMeanRatio/),
    ],
    'Copied markdown contains segment signal rows with ratio, PRB, weighted mean, risk, and exception evidence.',
  ),
  check(
    'correction-panel-still-anchors-governed-chain',
    /Correction & Defense Chain/.test(correctionPanel)
      && /Promote Saved Scenario/.test(correctionPanel)
      && /Export Evidence Packet/.test(correctionPanel)
      && /Open Approval Workflow/.test(correctionPanel),
    [
      ref(files.correctionPanel, /Correction & Defense Chain/),
      ref(files.correctionPanel, /Promote Saved Scenario/),
      ref(files.correctionPanel, /Export Evidence Packet/),
    ],
    'County Studio still presents scenario, approval, governance, and evidence as one correction chain.',
  ),
  check(
    'exception-queue-keeps-action-lifecycle',
    /Assign/.test(exceptionQueue)
      && /Dispatch/.test(exceptionQueue)
      && /Resolve/.test(exceptionQueue)
      && /Add Note|placeholder="Add note/.test(exceptionQueue),
    [
      ref(files.exceptionQueue, /Dispatch/),
      ref(files.exceptionQueue, /Resolve/),
      ref(files.exceptionQueue, /placeholder="Add note/),
    ],
    'Exception rows keep the assign, dispatch, resolve, and note lifecycle.',
  ),
  check(
    'scenario-path-still-promotes-into-approval',
    /Preview Impact/.test(scenarioWorksheet)
      && /Save Scenario/.test(scenarioWorksheet)
      && /scenarioApi\.promote/.test(scenarioWorksheet)
      && /setLastPromotion/.test(scenarioWorksheet)
      && /updateApprovalState/.test(adjustmentPanel),
    [
      ref(files.scenarioWorksheet, /Preview Impact/),
      ref(files.scenarioWorksheet, /scenarioApi\.promote/),
      ref(files.adjustmentPanel, /updateApprovalState/),
    ],
    'Scenario preview/save/promotion remains connected to the adjustment approval state machine.',
  ),
];

const failures = checks.filter((row) => !row.passed);
const report = {
  checkedAt: new Date().toISOString(),
  slice: 'county-studio-correction-and-defense',
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  decision:
    failures.length === 0
      ? 'DEFENSE_PACKET_CARRIES_SEGMENT_LEVEL_CORRECTION_TRACE'
      : 'CORRECTION_DEFENSE_TRACE_INCOMPLETE',
  checks,
  failures,
  evidenceContract: {
    packetFields: [
      'study metadata',
      'IAAO compliance metrics',
      'primary scenario',
      'AI diagnosis',
      'topRiskSegments',
      'exception log',
    ],
    topRiskSegmentFields: [
      'segmentId',
      'segmentName',
      'neighborhoodCode',
      'revalArea',
      'parcelCount',
      'medianRatio',
      'cod',
      'prd',
      'riskScore',
      'exceptionCount',
      'ratioCount',
      'salesCount',
      'prb',
      'weightedMeanRatio',
      'yoyMedianRatioDelta',
    ],
  },
};

function markdownReport() {
  const lines = [
    '# County Studio Correction And Defense',
    '',
    `Checked: ${report.checkedAt}`,
    `Status: ${report.status}`,
    `Decision: ${report.decision}`,
    '',
    '## Checks',
    '',
    '| Check | Result | Proof | Note |',
    '| --- | --- | --- | --- |',
    ...checks.map((row) =>
      `| ${row.id} | ${row.passed ? 'PASS' : 'FAIL'} | ${row.proof.map((item) => `\`${item}\``).join('<br>')} | ${row.note} |`,
    ),
    '',
    '## Evidence Contract',
    '',
    `- Packet fields: ${report.evidenceContract.packetFields.map((field) => `\`${field}\``).join(', ')}`,
    `- Top-risk segment fields: ${report.evidenceContract.topRiskSegmentFields.map((field) => `\`${field}\``).join(', ')}`,
    '',
  ];
  return `${lines.join('\n')}\n`;
}

mkdirSync(evidenceDir, { recursive: true });
writeFileSync(
  path.join(evidenceDir, 'county-studio-correction-and-defense.latest.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);
writeFileSync(
  path.join(evidenceDir, 'county-studio-correction-and-defense.latest.md'),
  markdownReport(),
);

console.log(JSON.stringify({
  status: report.status,
  decision: report.decision,
  failures: failures.length,
  evidence: [
    'os-platform/core/pilot/evidence/county-studio-correction-and-defense.latest.json',
    'os-platform/core/pilot/evidence/county-studio-correction-and-defense.latest.md',
  ],
}, null, 2));

if (failures.length > 0) process.exit(1);
