/**
 * TerraNotice Ops Console — sandbox fixtures.
 *
 * HONESTY CONTRACT: every value here is demonstration data for the
 * "County Sandbox" environment. It is NOT live Benton County notice data and
 * is NOT connected to any county production system. The console surfaces this
 * through a persistent sandbox ribbon and `source: 'sandbox'`. When a real
 * TerraNotice backend exists, replace `getNoticeConsoleSnapshot` with a fetch
 * against it and flip `source` to 'live' (or 'unavailable' on error) — the
 * screens are agnostic to where the snapshot comes from.
 *
 * @module pages/notice/fixtures/sandboxData
 */

import type { NoticeConsoleSnapshot } from '../types';

export const SANDBOX_SNAPSHOT: NoticeConsoleSnapshot = {
  source: 'sandbox',

  county: {
    countyName: 'Benton County',
    program: 'Valuation Notice Program',
    taxYear: 2026,
    environment: 'County Sandbox',
    brandingLocked: true,
    approvalChain: ['Operations Staff', 'Legal / Compliance', 'Assessor / Admin'],
    languageDefaults: ['English (en-US)', 'Spanish (es-US)'],
    accessibilityDefaults: ['WCAG 2.1 AA', 'Large-print on request', 'Plain-language summary'],
    deliveryRules: [
      { label: 'Release timing', value: 'Statutory window — WA-2026.1' },
      { label: 'Certified-mail escalation', value: 'Value change > 25%' },
      { label: 'Holiday adjustment', value: 'Next business day' },
      { label: 'Release waves', value: '3 waves, 48h apart' },
    ],
    vendorMappings: [
      { channel: 'mail', vendor: 'Print Vendor Contract', status: 'active' },
      { channel: 'certified', vendor: 'USPS Certified', status: 'active' },
      { channel: 'print', vendor: 'County Print Shop (fallback)', status: 'inactive' },
    ],
    runtimeOverrides: [
      { label: 'Branding', value: 'County seal + assessor signature', withinBounds: true },
      { label: 'Release waves', value: 'Override: 3 → 2 waves', withinBounds: true },
      { label: 'Accessibility default', value: 'Add audio summary', withinBounds: true },
      { label: 'Approval chain', value: 'Skip legal (requested)', withinBounds: false },
    ],
  },

  kpis: {
    activeBatches: 4,
    activeBatchesNote: '1 awaiting legal approval',
    noticesPrepared: 38421,
    validationPassRate: 0.992,
    openExceptions: 127,
    highRiskExceptions: 23,
    auditReadiness: 0.96,
    auditReadinessNote: 'Missing 2 approval attestations',
  },

  batches: [
    { batchId: 'BN-VAL-2026-W1', status: 'validated', notices: 12840, policyVersion: 'WA-2026.1', templateVersion: 'VAL-3.4', program: 'Valuation Notice' },
    { batchId: 'BN-VAL-2026-W2', status: 'legal-review', notices: 9210, policyVersion: 'WA-2026.1', templateVersion: 'VAL-3.4', program: 'Valuation Notice' },
    { batchId: 'BN-EXM-2026-A', status: 'draft', notices: 2144, policyVersion: 'WA-2026.1', templateVersion: 'EXM-1.8', program: 'Exemption Notice' },
    { batchId: 'BN-VAL-2026-W3', status: 'draft', notices: 14227, policyVersion: 'WA-2026.1', templateVersion: 'VAL-3.4', program: 'Valuation Notice' },
  ],

  timeline: [
    { label: 'Policy pack selected', state: 'done', at: '08:12' },
    { label: 'Template version locked', state: 'done', at: '08:18' },
    { label: 'Parcel snapshot created', state: 'done', at: '08:31' },
    { label: 'Legal approval', state: 'active', at: 'Now' },
    { label: 'Freeze snapshot', state: 'pending', at: '—' },
    { label: 'Vendor dispatch', state: 'pending', at: '—' },
  ],

  policyPacks: [
    {
      packId: 'WA-2026.1',
      label: 'Washington State Baseline 2026.1',
      approval: 'approved',
      effectiveDate: '2026-01-01',
      rules: [
        { ruleId: 'WA-APP-WIN', title: 'Appeal window (60 days from notice date)', source: 'state-baseline', effectiveDate: '2026-01-01', testStatus: 'pass', approval: 'approved' },
        { ruleId: 'WA-REL-TIME', title: 'Release timing within statutory window', source: 'state-baseline', effectiveDate: '2026-01-01', testStatus: 'pass', approval: 'approved' },
        { ruleId: 'WA-HOL-ADJ', title: 'Holiday adjustment rule', source: 'state-baseline', effectiveDate: '2026-01-01', testStatus: 'pass', approval: 'approved' },
        { ruleId: 'BN-CERT-ESC', title: 'Certified-mail escalation on value change > 25%', source: 'county-override', effectiveDate: '2026-02-01', testStatus: 'pass', approval: 'approved' },
        { ruleId: 'BN-WAVE', title: 'Release wave override (county-bounded)', source: 'county-override', effectiveDate: '2026-02-01', testStatus: 'untested', approval: 'pending' },
      ],
    },
  ],

  templateBlocks: [
    { blockId: 'BLK-HDR', name: 'Header / County seal', kind: 'layout', legalControlled: false, lifecycle: 'approved' },
    { blockId: 'BLK-LEGAL', name: 'Legal disclosure', kind: 'legal', legalControlled: true, lifecycle: 'approved' },
    { blockId: 'BLK-VALUE', name: 'Value summary', kind: 'layout', legalControlled: false, lifecycle: 'approved' },
    { blockId: 'BLK-APPEAL', name: 'Appeal rights', kind: 'legal', legalControlled: true, lifecycle: 'approved' },
    { blockId: 'BLK-QR', name: 'QR portal block', kind: 'layout', legalControlled: false, lifecycle: 'approved' },
    { blockId: 'BLK-FOOT', name: 'Footer metadata', kind: 'metadata', legalControlled: false, lifecycle: 'approved' },
    { blockId: 'BLK-PLAIN', name: 'Plain-language explanation', kind: 'plain-language', legalControlled: false, lifecycle: 'in-review' },
  ],

  templateAssemblies: [
    {
      templateId: 'VAL',
      version: '3.4',
      lifecycle: 'approved',
      legalApproval: 'approved',
      blocks: ['Header / County seal', 'Legal disclosure', 'Value summary', 'Appeal rights', 'QR portal block', 'Footer metadata'],
      previousVersion: '3.3',
    },
    {
      templateId: 'VAL',
      version: '3.5-draft',
      lifecycle: 'in-review',
      legalApproval: 'pending',
      blocks: ['Header / County seal', 'Legal disclosure', 'Value summary', 'Appeal rights', 'QR portal block', 'Plain-language explanation', 'Footer metadata'],
      previousVersion: '3.4',
    },
    {
      templateId: 'EXM',
      version: '1.8',
      lifecycle: 'approved',
      legalApproval: 'approved',
      blocks: ['Header / County seal', 'Legal disclosure', 'Appeal rights', 'Footer metadata'],
      previousVersion: '1.7',
    },
  ],

  freezeSnapshots: [
    {
      snapshotId: 'SNAP-BN-VAL-2026-W1',
      batchId: 'BN-VAL-2026-W1',
      parcelCount: 12840,
      legalTextVersion: 'LEGAL-WA-2026.1',
      templateVersion: 'VAL-3.4',
      policyVersion: 'WA-2026.1',
      countyConfigVersion: 'BN-CFG-2026.02',
      artifactHash: 'sha256:9f2a…c41e',
      frozenAt: '2026-06-12 08:31 PT',
      frozenBy: 'operations.staff@benton.example',
    },
  ],

  dispatches: [
    { bundleId: 'BNDL-W1-MAIL', batchId: 'BN-VAL-2026-W1', provider: 'Print Vendor Contract', channel: 'mail', mailingClass: 'First-Class', status: 'ready', itemCount: 12840, receiptsImported: 0, failures: 0 },
    { bundleId: 'BNDL-W1-CERT', batchId: 'BN-VAL-2026-W1', provider: 'USPS Certified', channel: 'certified', mailingClass: 'Certified', status: 'queued', itemCount: 318, receiptsImported: 0, failures: 0 },
  ],

  exceptions: [
    { category: 'invalid-address', label: 'Invalid Address', count: 44, action: 'Address confirmation queue', highRisk: false },
    { category: 'vendor-rejection', label: 'Vendor Rejection', count: 8, action: 'Re-export required', highRisk: true },
    { category: 'certified-mismatch', label: 'Certified Mismatch', count: 3, action: 'Compliance review', highRisk: true },
    { category: 'missing-insert', label: 'Missing Insert', count: 0, action: 'Insert package check', highRisk: false },
    { category: 'policy-template-conflict', label: 'Policy / Template Conflict', count: 0, action: 'Governance review', highRisk: false },
    { category: 'citizen-followup', label: 'Citizen Follow-up', count: 72, action: 'Staff task queue', highRisk: false },
  ],

  telemetry: [
    { key: 'issued', label: 'Notices issued', value: 38421, delta: '+38,421' },
    { key: 'delivered', label: 'Delivered', value: 0, delta: 'pending dispatch' },
    { key: 'returned', label: 'Returned', value: 0 },
    { key: 'reissued', label: 'Reissued', value: 0 },
    { key: 'call-surge', label: 'Call-surge proxy', value: 0, unit: 'index' },
    { key: 'qr-scans', label: 'QR scans', value: 0 },
    { key: 'portal-engagement', label: 'Portal engagement', value: 0, unit: '%' },
    { key: 'exception-time', label: 'Exception handling time', value: 0, unit: 'h avg' },
  ],

  auditBundles: [
    {
      bundleId: 'EV-BN-VAL-2026-W1',
      batchId: 'BN-VAL-2026-W1',
      sealed: false,
      bindings: [
        { label: 'Template version', value: 'VAL-3.4' },
        { label: 'Policy version', value: 'WA-2026.1' },
        { label: 'County config version', value: 'BN-CFG-2026.02' },
        { label: 'Parcel / data snapshot', value: 'SNAP-BN-VAL-2026-W1' },
        { label: 'Artifact hash', value: 'sha256:9f2a…c41e' },
        { label: 'Approval trace', value: '2 of 3 attestations' },
        { label: 'Dispatch receipt', value: 'pending' },
      ],
    },
  ],

  releases: [
    {
      releaseId: 'REL-2026.06',
      environment: 'County Sandbox',
      health: 'degraded',
      policyPack: 'WA-2026.1',
      templateSet: 'VAL-3.4 / EXM-1.8',
      attestationsComplete: 4,
      attestationsRequired: 6,
      deployedAt: '2026-06-12 07:55 PT',
    },
  ],
};

/**
 * Returns the console snapshot. Today this is synchronous sandbox data; the
 * async signature is intentional so a backend fetch can slot in unchanged.
 */
export async function getNoticeConsoleSnapshot(): Promise<NoticeConsoleSnapshot> {
  return SANDBOX_SNAPSHOT;
}
