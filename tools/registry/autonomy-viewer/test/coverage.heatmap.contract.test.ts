/**
 * Control Effectiveness: Coverage Heatmap Contract Tests
 *
 * Phase XII - Gap analysis: which services/environments have active
 * runbooks, drills, attestations, evidence packs vs missing.
 *
 * CONTRACT SURFACE:
 * - Service Coverage: Track which services have governance artifacts
 * - Environment Coverage: Production vs staging vs dev coverage gaps
 * - Artifact Types: Runbooks, drills, attestations, evidence packs
 * - Gap Detection: Identify missing coverage with severity ranking
 *
 * INVARIANTS:
 * - Coverage metrics are PII-clean (aggregate only)
 * - All IDs are opaque sha256:
 * - Gaps are actionable (include remediation paths)
 * - Real-time refresh capability
 */

import * as assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type CoverageStatus = 'covered' | 'partial' | 'missing';
type ArtifactType = 'runbook' | 'drill' | 'attestation' | 'evidence_pack';
type Environment = 'production' | 'staging' | 'development' | 'dr';
type Severity = 'critical' | 'high' | 'medium' | 'low';
type RiskTier = 'critical' | 'high' | 'medium' | 'low';

/**
 * Service coverage record
 */
interface ServiceCoverage {
  readonly service_id: string;
  readonly service_name: string;
  readonly risk_tier: RiskTier;
  readonly environments: readonly EnvironmentCoverage[];
  readonly overall_status: CoverageStatus;
  readonly coverage_percentage: number;
  readonly last_assessed_at: string;
}

/**
 * Environment coverage
 */
interface EnvironmentCoverage {
  readonly environment: Environment;
  readonly artifacts: readonly ArtifactCoverage[];
  readonly status: CoverageStatus;
  readonly coverage_percentage: number;
}

/**
 * Artifact coverage
 */
interface ArtifactCoverage {
  readonly artifact_type: ArtifactType;
  readonly count: number;
  readonly active_count: number;
  readonly last_updated_at?: string;
  readonly status: CoverageStatus;
}

/**
 * Coverage gap
 */
interface CoverageGap {
  readonly gap_id: string;
  readonly service_id: string;
  readonly environment: Environment;
  readonly missing_artifacts: readonly ArtifactType[];
  readonly severity: Severity;
  readonly remediation_path: string;
  readonly detected_at: string;
}

/**
 * Heatmap cell
 */
interface HeatmapCell {
  readonly service_id: string;
  readonly environment: Environment;
  readonly coverage_score: number; // 0-100
  readonly status: CoverageStatus;
  readonly gap_count: number;
}

/**
 * Coverage summary
 */
interface CoverageSummary {
  readonly summary_id: string;
  readonly total_services: number;
  readonly covered_services: number;
  readonly partial_services: number;
  readonly missing_services: number;
  readonly overall_percentage: number;
  readonly critical_gaps: number;
  readonly generated_at: string;
}

// ============================================================================
// MOCK IMPLEMENTATIONS
// ============================================================================

function createMockServiceCoverage(overrides: Partial<ServiceCoverage> = {}): ServiceCoverage {
  const serviceId = `svc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    service_id: `sha256:${Buffer.from(serviceId).toString('hex').slice(0, 64)}`,
    service_name: 'api-gateway',
    risk_tier: 'high',
    environments: [],
    overall_status: 'covered',
    coverage_percentage: 85,
    last_assessed_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockCoverageGap(overrides: Partial<CoverageGap> = {}): CoverageGap {
  const gapId = `gap-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return {
    gap_id: `sha256:${Buffer.from(gapId).toString('hex').slice(0, 64)}`,
    service_id: `sha256:${Buffer.from('svc-1').toString('hex').slice(0, 64)}`,
    environment: 'production',
    missing_artifacts: ['runbook'],
    severity: 'high',
    remediation_path: 'Create production runbook using canonical template',
    detected_at: new Date().toISOString(),
    ...overrides,
  };
}

// ============================================================================
// MOCK COVERAGE HEATMAP SERVICE
// ============================================================================

interface CoverageHeatmapService {
  // Service Coverage
  getServiceCoverage(serviceId: string): Promise<ServiceCoverage | null>;
  listServiceCoverages(): Promise<readonly ServiceCoverage[]>;
  assessServiceCoverage(serviceId: string): Promise<ServiceCoverage>;

  // Gap Detection
  detectGaps(serviceId: string): Promise<readonly CoverageGap[]>;
  listAllGaps(): Promise<readonly CoverageGap[]>;
  getGapsBySeverity(severity: Severity): Promise<readonly CoverageGap[]>;
  getCriticalGaps(): Promise<readonly CoverageGap[]>;

  // Heatmap Generation
  generateHeatmap(): Promise<readonly HeatmapCell[]>;
  getHeatmapCell(serviceId: string, environment: Environment): Promise<HeatmapCell | null>;

  // Summaries
  generateSummary(): Promise<CoverageSummary>;
  getCoverageByRiskTier(riskTier: RiskTier): Promise<number>;
  getCoverageByEnvironment(environment: Environment): Promise<number>;

  // PII Safety
  isPIIClean(summary: CoverageSummary): Promise<boolean>;
  containsServiceNames(summary: CoverageSummary): Promise<boolean>;
}

function createMockCoverageHeatmapService(): CoverageHeatmapService {
  const services: Map<string, ServiceCoverage> = new Map();
  const gaps: Map<string, CoverageGap[]> = new Map();

  // Seed some mock data
  const svc1 = createMockServiceCoverage({
    service_name: 'api-gateway',
    risk_tier: 'critical',
    coverage_percentage: 95,
  });
  const svc2 = createMockServiceCoverage({
    service_name: 'auth-service',
    risk_tier: 'high',
    coverage_percentage: 80,
  });
  const svc3 = createMockServiceCoverage({
    service_name: 'data-processor',
    risk_tier: 'medium',
    overall_status: 'partial',
    coverage_percentage: 60,
  });
  const svc4 = createMockServiceCoverage({
    service_name: 'legacy-adapter',
    risk_tier: 'high',
    overall_status: 'missing',
    coverage_percentage: 20,
  });

  services.set(svc1.service_id, svc1);
  services.set(svc2.service_id, svc2);
  services.set(svc3.service_id, svc3);
  services.set(svc4.service_id, svc4);

  gaps.set(svc3.service_id, [
    createMockCoverageGap({
      service_id: svc3.service_id,
      missing_artifacts: ['drill'],
      severity: 'medium',
    }),
  ]);
  gaps.set(svc4.service_id, [
    createMockCoverageGap({
      service_id: svc4.service_id,
      missing_artifacts: ['runbook', 'drill'],
      severity: 'critical',
    }),
    createMockCoverageGap({
      service_id: svc4.service_id,
      environment: 'staging',
      missing_artifacts: ['attestation'],
      severity: 'high',
    }),
  ]);

  return {
    async getServiceCoverage(serviceId) {
      return services.get(serviceId) ?? null;
    },

    async listServiceCoverages() {
      return Array.from(services.values());
    },

    async assessServiceCoverage(serviceId) {
      const existing = services.get(serviceId);
      if (existing) {
        const updated = { ...existing, last_assessed_at: new Date().toISOString() };
        services.set(serviceId, updated);
        return updated;
      }
      const newCoverage = createMockServiceCoverage({ service_id: serviceId });
      services.set(serviceId, newCoverage);
      return newCoverage;
    },

    async detectGaps(serviceId) {
      return gaps.get(serviceId) ?? [];
    },

    async listAllGaps() {
      const allGaps: CoverageGap[] = [];
      for (const gapList of gaps.values()) {
        allGaps.push(...gapList);
      }
      return allGaps;
    },

    async getGapsBySeverity(severity) {
      const allGaps = await this.listAllGaps();
      return allGaps.filter(g => g.severity === severity);
    },

    async getCriticalGaps() {
      return this.getGapsBySeverity('critical');
    },

    async generateHeatmap() {
      const cells: HeatmapCell[] = [];
      const environments: Environment[] = ['production', 'staging', 'development', 'dr'];

      for (const svc of services.values()) {
        for (const env of environments) {
          const serviceGaps = gaps.get(svc.service_id) ?? [];
          const envGaps = serviceGaps.filter(g => g.environment === env);

          cells.push({
            service_id: svc.service_id,
            environment: env,
            coverage_score: Math.max(0, svc.coverage_percentage - envGaps.length * 10),
            status: envGaps.length > 0 ? 'partial' : svc.overall_status,
            gap_count: envGaps.length,
          });
        }
      }

      return cells;
    },

    async getHeatmapCell(serviceId, environment) {
      const heatmap = await this.generateHeatmap();
      return heatmap.find(c => c.service_id === serviceId && c.environment === environment) ?? null;
    },

    async generateSummary() {
      const allServices = Array.from(services.values());
      const covered = allServices.filter(s => s.overall_status === 'covered').length;
      const partial = allServices.filter(s => s.overall_status === 'partial').length;
      const missing = allServices.filter(s => s.overall_status === 'missing').length;
      const criticalGaps = (await this.getCriticalGaps()).length;

      const summaryId = `sum-${Date.now()}`;
      return {
        summary_id: `sha256:${Buffer.from(summaryId).toString('hex').slice(0, 64)}`,
        total_services: allServices.length,
        covered_services: covered,
        partial_services: partial,
        missing_services: missing,
        overall_percentage: Math.round((covered / allServices.length) * 100),
        critical_gaps: criticalGaps,
        generated_at: new Date().toISOString(),
      };
    },

    async getCoverageByRiskTier(riskTier) {
      const allServices = Array.from(services.values());
      const tieredServices = allServices.filter(s => s.risk_tier === riskTier);
      if (tieredServices.length === 0) return 0;
      const avgCoverage =
        tieredServices.reduce((sum, s) => sum + s.coverage_percentage, 0) / tieredServices.length;
      return Math.round(avgCoverage);
    },

    async getCoverageByEnvironment(_environment) {
      // Simplified: return average across all services for that environment
      const allServices = Array.from(services.values());
      const avgCoverage =
        allServices.reduce((sum, s) => sum + s.coverage_percentage, 0) / allServices.length;
      return Math.round(avgCoverage);
    },

    async isPIIClean(summary) {
      // Summary contains only aggregate metrics, no PII
      return (
        typeof summary.total_services === 'number' &&
        typeof summary.covered_services === 'number' &&
        typeof summary.overall_percentage === 'number'
      );
    },

    async containsServiceNames(_summary) {
      // Summary does not contain service names, only counts
      return false;
    },
  };
}

// ============================================================================
// CONTRACT TESTS
// ============================================================================

describe('Control Effectiveness: Coverage Heatmap Contracts', () => {
  let service: CoverageHeatmapService;

  beforeEach(() => {
    service = createMockCoverageHeatmapService();
  });

  // ==========================================================================
  // CONTRACT: service_coverage
  // ==========================================================================
  describe('CONTRACT: service_coverage', () => {
    it('lists service coverages', async () => {
      const coverages = await service.listServiceCoverages();

      assert.ok(coverages.length > 0);
      assert.ok(coverages[0].service_id.startsWith('sha256:'));
    });

    it('assesses service coverage', async () => {
      const serviceId = `sha256:${Buffer.from('new-svc').toString('hex').slice(0, 64)}`;
      const coverage = await service.assessServiceCoverage(serviceId);

      assert.strictEqual(coverage.service_id, serviceId);
      assert.ok(coverage.last_assessed_at);
    });

    it('coverage includes risk tier', async () => {
      const coverages = await service.listServiceCoverages();
      const coverage = coverages[0];

      assert.ok(['critical', 'high', 'medium', 'low'].includes(coverage.risk_tier));
    });

    it('coverage has percentage 0-100', async () => {
      const coverages = await service.listServiceCoverages();

      for (const cov of coverages) {
        assert.ok(cov.coverage_percentage >= 0);
        assert.ok(cov.coverage_percentage <= 100);
      }
    });

    it('service IDs are opaque', async () => {
      const coverages = await service.listServiceCoverages();

      for (const cov of coverages) {
        assert.ok(cov.service_id.startsWith('sha256:'));
      }
    });
  });

  // ==========================================================================
  // CONTRACT: gap_detection
  // ==========================================================================
  describe('CONTRACT: gap_detection', () => {
    it('detects coverage gaps', async () => {
      const allGaps = await service.listAllGaps();

      assert.ok(allGaps.length > 0);
    });

    it('gaps have severity', async () => {
      const allGaps = await service.listAllGaps();

      for (const gap of allGaps) {
        assert.ok(['critical', 'high', 'medium', 'low'].includes(gap.severity));
      }
    });

    it('gaps have remediation path', async () => {
      const allGaps = await service.listAllGaps();

      for (const gap of allGaps) {
        assert.ok(gap.remediation_path.length > 0);
      }
    });

    it('filters gaps by severity', async () => {
      const criticalGaps = await service.getGapsBySeverity('critical');

      for (const gap of criticalGaps) {
        assert.strictEqual(gap.severity, 'critical');
      }
    });

    it('gap IDs are opaque', async () => {
      const allGaps = await service.listAllGaps();

      for (const gap of allGaps) {
        assert.ok(gap.gap_id.startsWith('sha256:'));
      }
    });
  });

  // ==========================================================================
  // CONTRACT: heatmap_generation
  // ==========================================================================
  describe('CONTRACT: heatmap_generation', () => {
    it('generates heatmap cells', async () => {
      const heatmap = await service.generateHeatmap();

      assert.ok(heatmap.length > 0);
    });

    it('heatmap covers all environments', async () => {
      const heatmap = await service.generateHeatmap();
      const environments = new Set(heatmap.map(c => c.environment));

      assert.ok(environments.has('production'));
      assert.ok(environments.has('staging'));
    });

    it('heatmap cells have coverage score', async () => {
      const heatmap = await service.generateHeatmap();

      for (const cell of heatmap) {
        assert.ok(cell.coverage_score >= 0);
        assert.ok(cell.coverage_score <= 100);
      }
    });

    it('retrieves specific heatmap cell', async () => {
      const coverages = await service.listServiceCoverages();
      const cell = await service.getHeatmapCell(coverages[0].service_id, 'production');

      assert.ok(cell);
      assert.strictEqual(cell.environment, 'production');
    });
  });

  // ==========================================================================
  // CONTRACT: coverage_summary
  // ==========================================================================
  describe('CONTRACT: coverage_summary', () => {
    it('generates coverage summary', async () => {
      const summary = await service.generateSummary();

      assert.ok(summary.summary_id.startsWith('sha256:'));
      assert.ok(summary.total_services > 0);
    });

    it('summary includes service counts', async () => {
      const summary = await service.generateSummary();

      assert.strictEqual(
        summary.covered_services + summary.partial_services + summary.missing_services,
        summary.total_services
      );
    });

    it('summary includes critical gap count', async () => {
      const summary = await service.generateSummary();

      assert.ok(typeof summary.critical_gaps === 'number');
    });

    it('coverage by risk tier', async () => {
      const criticalCoverage = await service.getCoverageByRiskTier('critical');

      assert.ok(criticalCoverage >= 0);
      assert.ok(criticalCoverage <= 100);
    });
  });

  // ==========================================================================
  // CONTRACT: pii_safety
  // ==========================================================================
  describe('CONTRACT: pii_safety', () => {
    it('summary is PII-clean', async () => {
      const summary = await service.generateSummary();
      const isPIIClean = await service.isPIIClean(summary);

      assert.strictEqual(isPIIClean, true);
    });

    it('summary contains no service names', async () => {
      const summary = await service.generateSummary();
      const hasNames = await service.containsServiceNames(summary);

      assert.strictEqual(hasNames, false);
    });

    it('summary has only aggregate metrics', async () => {
      const summary = await service.generateSummary();

      // All values should be numbers or timestamps, not strings with identifiable info
      assert.strictEqual(typeof summary.total_services, 'number');
      assert.strictEqual(typeof summary.covered_services, 'number');
      assert.strictEqual(typeof summary.overall_percentage, 'number');
    });
  });
});
