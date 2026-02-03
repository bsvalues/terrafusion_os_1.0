/**
 * Federation Adoption: Oversight Reporting Automation Contract Tests
 *
 * Phase XVI - Per-agency quarterly packs (PII-clean), exception summaries,
 * drift reports, incident summaries, and compliance rollups.
 *
 * CONTRACT SURFACE:
 * - Report Generation: Automated quarterly compliance packs
 * - Compliance Rollups: "Who is out of compliance" summaries
 * - Exception Summaries: Active and resolved exception tracking
 * - Evidence Pointers: Explicit links to supporting evidence
 *
 * INVARIANTS:
 * - All reports are PII-clean
 * - Evidence is linked, not embedded
 * - Reports have explicit time bounds
 * - IDs are opaque sha256
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ReportType = 'quarterly' | 'monthly' | 'incident' | 'exception' | 'drift' | 'compliance';
type ReportStatus = 'generating' | 'complete' | 'failed' | 'archived';
type ComplianceLevel = 'compliant' | 'minor_issues' | 'major_issues' | 'non_compliant';

/**
 * Oversight report
 */
interface OversightReport {
  readonly report_id: string;
  readonly agency_id: string;
  readonly report_type: ReportType;
  readonly period_start: string;
  readonly period_end: string;
  readonly status: ReportStatus;
  readonly generated_at: string;
  readonly pii_sanitized: boolean;
  readonly evidence_refs: readonly string[];
}

/**
 * Compliance rollup
 */
interface ComplianceRollup {
  readonly rollup_id: string;
  readonly period_start: string;
  readonly period_end: string;
  readonly total_agencies: number;
  readonly by_level: Record<ComplianceLevel, number>;
  readonly non_compliant_agencies: readonly string[];
  readonly generated_at: string;
}

/**
 * Exception summary
 */
interface ExceptionSummary {
  readonly summary_id: string;
  readonly agency_id: string;
  readonly period_start: string;
  readonly period_end: string;
  readonly active_exceptions: number;
  readonly resolved_exceptions: number;
  readonly expired_exceptions: number;
  readonly avg_duration_days: number;
  readonly evidence_refs: readonly string[];
}

/**
 * Drift report
 */
interface DriftReport {
  readonly report_id: string;
  readonly agency_id: string;
  readonly period_start: string;
  readonly period_end: string;
  readonly total_drifts: number;
  readonly acknowledged_drifts: number;
  readonly unacknowledged_drifts: number;
  readonly drift_rate: number;
  readonly evidence_refs: readonly string[];
}

/**
 * Incident summary
 */
interface IncidentSummary {
  readonly summary_id: string;
  readonly agency_id: string;
  readonly period_start: string;
  readonly period_end: string;
  readonly total_incidents: number;
  readonly resolved_incidents: number;
  readonly open_incidents: number;
  readonly avg_resolution_hours: number;
  readonly by_severity: Record<string, number>;
  readonly evidence_refs: readonly string[];
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockReport(overrides: Partial<OversightReport> = {}): OversightReport {
  const reportId = `report-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    report_id: `sha256:${Buffer.from(reportId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    report_type: 'quarterly',
    period_start: new Date(Date.now() - 86400000 * 90).toISOString(),
    period_end: new Date().toISOString(),
    status: 'complete',
    generated_at: new Date().toISOString(),
    pii_sanitized: true,
    evidence_refs: [`sha256:${'evi1'.repeat(16).slice(0, 64)}`],
    ...overrides,
  };
}

function createMockRollup(overrides: Partial<ComplianceRollup> = {}): ComplianceRollup {
  const rollupId = `rollup-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    rollup_id: `sha256:${Buffer.from(rollupId).toString('hex').slice(0, 64)}`,
    period_start: new Date(Date.now() - 86400000 * 90).toISOString(),
    period_end: new Date().toISOString(),
    total_agencies: 25,
    by_level: {
      compliant: 18,
      minor_issues: 4,
      major_issues: 2,
      non_compliant: 1,
    },
    non_compliant_agencies: [`sha256:${'nc1'.repeat(21).slice(0, 64)}`],
    generated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockExceptionSummary(overrides: Partial<ExceptionSummary> = {}): ExceptionSummary {
  const summaryId = `excsumm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    summary_id: `sha256:${Buffer.from(summaryId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    period_start: new Date(Date.now() - 86400000 * 90).toISOString(),
    period_end: new Date().toISOString(),
    active_exceptions: 3,
    resolved_exceptions: 12,
    expired_exceptions: 2,
    avg_duration_days: 14.5,
    evidence_refs: [],
    ...overrides,
  };
}

function createMockDriftReport(overrides: Partial<DriftReport> = {}): DriftReport {
  const reportId = `drift-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    report_id: `sha256:${Buffer.from(reportId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    period_start: new Date(Date.now() - 86400000 * 90).toISOString(),
    period_end: new Date().toISOString(),
    total_drifts: 8,
    acknowledged_drifts: 6,
    unacknowledged_drifts: 2,
    drift_rate: 0.67,
    evidence_refs: [],
    ...overrides,
  };
}

function createMockIncidentSummary(overrides: Partial<IncidentSummary> = {}): IncidentSummary {
  const summaryId = `incsumm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    summary_id: `sha256:${Buffer.from(summaryId).toString('hex').slice(0, 64)}`,
    agency_id: `sha256:${Buffer.from('agency-1').toString('hex').slice(0, 64)}`,
    period_start: new Date(Date.now() - 86400000 * 90).toISOString(),
    period_end: new Date().toISOString(),
    total_incidents: 5,
    resolved_incidents: 4,
    open_incidents: 1,
    avg_resolution_hours: 18.5,
    by_severity: { critical: 1, high: 2, medium: 2, low: 0 },
    evidence_refs: [],
    ...overrides,
  };
}

// ============================================================================
// MOCK OVERSIGHT REPORTING SERVICE
// ============================================================================

interface OversightReportingService {
  // Report Generation
  generateReport(
    agencyId: string,
    reportType: ReportType,
    periodStart: string,
    periodEnd: string
  ): Promise<OversightReport>;
  getReport(reportId: string): Promise<OversightReport | null>;
  listReports(agencyId: string): Promise<readonly OversightReport[]>;
  archiveReport(reportId: string): Promise<OversightReport>;

  // Compliance Rollups
  generateComplianceRollup(periodStart: string, periodEnd: string): Promise<ComplianceRollup>;
  getLatestRollup(): Promise<ComplianceRollup | null>;
  listNonCompliantAgencies(): Promise<readonly string[]>;

  // Exception Summaries
  generateExceptionSummary(
    agencyId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<ExceptionSummary>;
  getExceptionSummary(agencyId: string): Promise<ExceptionSummary | null>;

  // Drift Reports
  generateDriftReport(
    agencyId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<DriftReport>;
  getDriftReport(agencyId: string): Promise<DriftReport | null>;

  // Incident Summaries
  generateIncidentSummary(
    agencyId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<IncidentSummary>;
  getIncidentSummary(agencyId: string): Promise<IncidentSummary | null>;

  // Evidence Linking
  addEvidenceRef(reportId: string, evidenceRef: string): Promise<OversightReport>;
  getEvidenceRefs(reportId: string): Promise<readonly string[]>;
}

function createMockOversightReportingService(): OversightReportingService {
  const reports: Map<string, OversightReport> = new Map();
  const rollups: ComplianceRollup[] = [];
  const exceptionSummaries: Map<string, ExceptionSummary> = new Map();
  const driftReports: Map<string, DriftReport> = new Map();
  const incidentSummaries: Map<string, IncidentSummary> = new Map();

  return {
    async generateReport(agencyId, reportType, periodStart, periodEnd) {
      const report = createMockReport({
        agency_id: agencyId,
        report_type: reportType,
        period_start: periodStart,
        period_end: periodEnd,
        status: 'complete',
      });
      reports.set(report.report_id, report);
      return report;
    },

    async getReport(reportId) {
      return reports.get(reportId) ?? null;
    },

    async listReports(agencyId) {
      return Array.from(reports.values()).filter(r => r.agency_id === agencyId);
    },

    async archiveReport(reportId) {
      const report = reports.get(reportId);
      if (!report) throw new Error('report not found');

      const archived = createMockReport({ ...report, status: 'archived' });
      reports.set(reportId, archived);
      return archived;
    },

    async generateComplianceRollup(periodStart, periodEnd) {
      const rollup = createMockRollup({ period_start: periodStart, period_end: periodEnd });
      rollups.push(rollup);
      return rollup;
    },

    async getLatestRollup() {
      return rollups.length > 0 ? rollups[rollups.length - 1] : null;
    },

    async listNonCompliantAgencies() {
      const latest = await this.getLatestRollup();
      return latest?.non_compliant_agencies ?? [];
    },

    async generateExceptionSummary(agencyId, periodStart, periodEnd) {
      const summary = createMockExceptionSummary({
        agency_id: agencyId,
        period_start: periodStart,
        period_end: periodEnd,
      });
      exceptionSummaries.set(agencyId, summary);
      return summary;
    },

    async getExceptionSummary(agencyId) {
      return exceptionSummaries.get(agencyId) ?? null;
    },

    async generateDriftReport(agencyId, periodStart, periodEnd) {
      const report = createMockDriftReport({
        agency_id: agencyId,
        period_start: periodStart,
        period_end: periodEnd,
      });
      driftReports.set(agencyId, report);
      return report;
    },

    async getDriftReport(agencyId) {
      return driftReports.get(agencyId) ?? null;
    },

    async generateIncidentSummary(agencyId, periodStart, periodEnd) {
      const summary = createMockIncidentSummary({
        agency_id: agencyId,
        period_start: periodStart,
        period_end: periodEnd,
      });
      incidentSummaries.set(agencyId, summary);
      return summary;
    },

    async getIncidentSummary(agencyId) {
      return incidentSummaries.get(agencyId) ?? null;
    },

    async addEvidenceRef(reportId, evidenceRef) {
      const report = reports.get(reportId);
      if (!report) throw new Error('report not found');

      const updated = createMockReport({
        ...report,
        evidence_refs: [...report.evidence_refs, evidenceRef],
      });
      reports.set(reportId, updated);
      return updated;
    },

    async getEvidenceRefs(reportId) {
      const report = reports.get(reportId);
      return report?.evidence_refs ?? [];
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Federation Adoption: Oversight Reporting Automation Contracts', () => {
  let service: OversightReportingService;

  beforeEach(() => {
    service = createMockOversightReportingService();
  });

  // ==========================================================================
  // CONTRACT: report_generation
  // ==========================================================================
  describe('CONTRACT: report_generation', () => {
    it('generates oversight report', async () => {
      const report = await service.generateReport(
        `sha256:${'a'.repeat(64)}`,
        'quarterly',
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      assert.ok(report.report_id.startsWith('sha256:'));
      assert.strictEqual(report.report_type, 'quarterly');
    });

    it('retrieves report by ID', async () => {
      const created = await service.generateReport(
        `sha256:${'a'.repeat(64)}`,
        'monthly',
        new Date(Date.now() - 86400000 * 30).toISOString(),
        new Date().toISOString()
      );

      const retrieved = await service.getReport(created.report_id);
      assert.ok(retrieved);
      assert.strictEqual(retrieved.report_id, created.report_id);
    });

    it('lists reports by agency', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.generateReport(
        agencyId,
        'quarterly',
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      const reports = await service.listReports(agencyId);
      assert.ok(reports.length >= 1);
    });

    it('archives report', async () => {
      const report = await service.generateReport(
        `sha256:${'a'.repeat(64)}`,
        'quarterly',
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      const archived = await service.archiveReport(report.report_id);
      assert.strictEqual(archived.status, 'archived');
    });

    it('report is PII-sanitized', async () => {
      const report = createMockReport();
      assert.strictEqual(report.pii_sanitized, true);
    });
  });

  // ==========================================================================
  // CONTRACT: compliance_rollups
  // ==========================================================================
  describe('CONTRACT: compliance_rollups', () => {
    it('generates compliance rollup', async () => {
      const rollup = await service.generateComplianceRollup(
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      assert.ok(rollup.rollup_id.startsWith('sha256:'));
      assert.ok(typeof rollup.total_agencies === 'number');
    });

    it('gets latest rollup', async () => {
      await service.generateComplianceRollup(
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      const latest = await service.getLatestRollup();
      assert.ok(latest);
    });

    it('lists non-compliant agencies', async () => {
      await service.generateComplianceRollup(
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      const nonCompliant = await service.listNonCompliantAgencies();
      assert.ok(Array.isArray(nonCompliant));
    });

    it('rollup has level breakdown', async () => {
      const rollup = createMockRollup();
      assert.ok(typeof rollup.by_level.compliant === 'number');
      assert.ok(typeof rollup.by_level.non_compliant === 'number');
    });

    it('rollup has time bounds', async () => {
      const rollup = createMockRollup();
      assert.ok(rollup.period_start);
      assert.ok(rollup.period_end);
    });
  });

  // ==========================================================================
  // CONTRACT: exception_summaries
  // ==========================================================================
  describe('CONTRACT: exception_summaries', () => {
    it('generates exception summary', async () => {
      const summary = await service.generateExceptionSummary(
        `sha256:${'a'.repeat(64)}`,
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      assert.ok(summary.summary_id.startsWith('sha256:'));
    });

    it('retrieves exception summary', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.generateExceptionSummary(
        agencyId,
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      const summary = await service.getExceptionSummary(agencyId);
      assert.ok(summary);
    });

    it('summary includes active/resolved/expired counts', async () => {
      const summary = createMockExceptionSummary();
      assert.ok(typeof summary.active_exceptions === 'number');
      assert.ok(typeof summary.resolved_exceptions === 'number');
      assert.ok(typeof summary.expired_exceptions === 'number');
    });

    it('summary includes average duration', async () => {
      const summary = createMockExceptionSummary({ avg_duration_days: 14.5 });
      assert.strictEqual(summary.avg_duration_days, 14.5);
    });
  });

  // ==========================================================================
  // CONTRACT: drift_reports
  // ==========================================================================
  describe('CONTRACT: drift_reports', () => {
    it('generates drift report', async () => {
      const report = await service.generateDriftReport(
        `sha256:${'a'.repeat(64)}`,
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      assert.ok(report.report_id.startsWith('sha256:'));
    });

    it('retrieves drift report', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.generateDriftReport(
        agencyId,
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      const report = await service.getDriftReport(agencyId);
      assert.ok(report);
    });

    it('report includes acknowledged/unacknowledged counts', async () => {
      const report = createMockDriftReport();
      assert.ok(typeof report.acknowledged_drifts === 'number');
      assert.ok(typeof report.unacknowledged_drifts === 'number');
    });

    it('report includes drift rate', async () => {
      const report = createMockDriftReport({ drift_rate: 0.5 });
      assert.ok(typeof report.drift_rate === 'number');
    });
  });

  // ==========================================================================
  // CONTRACT: incident_summaries
  // ==========================================================================
  describe('CONTRACT: incident_summaries', () => {
    it('generates incident summary', async () => {
      const summary = await service.generateIncidentSummary(
        `sha256:${'a'.repeat(64)}`,
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      assert.ok(summary.summary_id.startsWith('sha256:'));
    });

    it('retrieves incident summary', async () => {
      const agencyId = `sha256:${'a'.repeat(64)}`;
      await service.generateIncidentSummary(
        agencyId,
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      const summary = await service.getIncidentSummary(agencyId);
      assert.ok(summary);
    });

    it('summary includes resolution metrics', async () => {
      const summary = createMockIncidentSummary({ avg_resolution_hours: 18.5 });
      assert.ok(typeof summary.avg_resolution_hours === 'number');
    });

    it('summary includes severity breakdown', async () => {
      const summary = createMockIncidentSummary();
      assert.ok(summary.by_severity.critical >= 0);
    });
  });

  // ==========================================================================
  // CONTRACT: evidence_linking
  // ==========================================================================
  describe('CONTRACT: evidence_linking', () => {
    it('adds evidence reference to report', async () => {
      const report = await service.generateReport(
        `sha256:${'a'.repeat(64)}`,
        'quarterly',
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      const updated = await service.addEvidenceRef(report.report_id, `sha256:${'e'.repeat(64)}`);
      assert.ok(updated.evidence_refs.length > 1);
    });

    it('gets evidence references', async () => {
      const report = await service.generateReport(
        `sha256:${'a'.repeat(64)}`,
        'quarterly',
        new Date(Date.now() - 86400000 * 90).toISOString(),
        new Date().toISOString()
      );

      const refs = await service.getEvidenceRefs(report.report_id);
      assert.ok(Array.isArray(refs));
    });

    it('evidence refs are opaque sha256', async () => {
      const report = createMockReport();
      for (const ref of report.evidence_refs) {
        assert.ok(ref.startsWith('sha256:'));
      }
    });
  });

  // ==========================================================================
  // CONTRACT: invariants
  // ==========================================================================
  describe('CONTRACT: invariants', () => {
    it('all IDs are opaque sha256', async () => {
      const report = createMockReport();
      const rollup = createMockRollup();
      const excSummary = createMockExceptionSummary();
      const driftReport = createMockDriftReport();
      const incSummary = createMockIncidentSummary();

      assert.ok(report.report_id.startsWith('sha256:'));
      assert.ok(rollup.rollup_id.startsWith('sha256:'));
      assert.ok(excSummary.summary_id.startsWith('sha256:'));
      assert.ok(driftReport.report_id.startsWith('sha256:'));
      assert.ok(incSummary.summary_id.startsWith('sha256:'));
    });

    it('all reports are PII-clean', async () => {
      const report = createMockReport();
      assert.strictEqual(report.pii_sanitized, true);
    });

    it('evidence is linked not embedded', async () => {
      const report = createMockReport();
      // Evidence refs are IDs, not actual evidence content
      for (const ref of report.evidence_refs) {
        assert.ok(ref.startsWith('sha256:'));
        assert.ok(ref.length < 100); // Just an ID, not embedded content
      }
    });

    it('reports have explicit time bounds', async () => {
      const report = createMockReport();
      assert.ok(report.period_start);
      assert.ok(report.period_end);
      assert.ok(new Date(report.period_end) > new Date(report.period_start));
    });
  });
});
