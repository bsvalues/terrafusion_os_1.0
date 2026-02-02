/**
 * Data Access Inventory Contract Tests
 * =====================================
 *
 * Phase VIII: Validates governed dataset enumeration and access surface discovery.
 *
 * Contract:
 * - inventory_enumerates_datasets: discovers datasets by environment, tier, classification
 * - inventory_enumerates_access_surfaces: query entry points, services, BI tools
 * - inventory_enumerates_export_paths: downloads, reports, API exports
 * - inventory_normalizes_artifacts: canonical model with opaque IDs
 * - inventory_is_pii_clean: no raw identifiers, no query text
 */

import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { describe, it } from 'node:test';

// ============================================================================
// Types for Data Access Inventory
// ============================================================================

/**
 * Environment.
 */
type Environment = 'production' | 'staging' | 'development' | 'test';

/**
 * Dataset risk tier.
 */
type DatasetRiskTier = 'critical' | 'high' | 'medium' | 'low';

/**
 * Data classification.
 */
type DataClassification = 'pii' | 'phi' | 'pci' | 'confidential' | 'internal' | 'public';

/**
 * Access mode.
 */
type AccessMode = 'read' | 'write' | 'export' | 'admin';

/**
 * Principal type.
 */
type PrincipalType = 'user' | 'service' | 'job' | 'bi_tool' | 'api_client';

/**
 * Export path type.
 */
type ExportPathType = 'download' | 'report' | 'api_export' | 'etl_pipeline' | 'backup';

/**
 * Dataset artifact (canonical model).
 */
interface DatasetArtifact {
  readonly datasetId: string; // opaque sha256:
  readonly environment: Environment;
  readonly riskTier: DatasetRiskTier;
  readonly classifications: readonly DataClassification[];
  readonly ownerId: string; // opaque sha256:
  readonly accessSurfaceCount: number;
  readonly exportPathCount: number;
  readonly lastAccessed?: string;
  readonly createdAt: string;
}

/**
 * Access surface (query entry point).
 */
interface AccessSurface {
  readonly surfaceId: string; // opaque sha256:
  readonly datasetId: string; // opaque sha256:
  readonly environment: Environment;
  readonly surfaceType: 'service' | 'job' | 'bi_tool' | 'direct_query';
  readonly principalType: PrincipalType;
  readonly accessModes: readonly AccessMode[];
  readonly enabled: boolean;
}

/**
 * Export path.
 */
interface ExportPath {
  readonly pathId: string; // opaque sha256:
  readonly datasetId: string; // opaque sha256:
  readonly environment: Environment;
  readonly pathType: ExportPathType;
  readonly riskTier: DatasetRiskTier;
  readonly allowedPrincipalTypes: readonly PrincipalType[];
  readonly requiresApproval: boolean;
  readonly maxExportSizeBytes?: number;
}

/**
 * Data inventory source.
 */
interface DataInventorySource {
  listDatasets: (environment?: Environment) => readonly DatasetArtifact[];
  listAccessSurfaces: (datasetId?: string) => readonly AccessSurface[];
  listExportPaths: (datasetId?: string) => readonly ExportPath[];
  getDataset: (datasetId: string) => DatasetArtifact | null;
}

/**
 * Inventory summary.
 */
interface DataInventorySummary {
  readonly totalDatasets: number;
  readonly totalAccessSurfaces: number;
  readonly totalExportPaths: number;
  readonly byEnvironment: Record<Environment, number>;
  readonly byRiskTier: Record<DatasetRiskTier, number>;
  readonly byClassification: Record<DataClassification, number>;
  readonly highRiskExportPaths: number;
}

// ============================================================================
// Mock Implementations
// ============================================================================

/**
 * Compute opaque ID.
 */
function computeOpaqueId(input: string): string {
  return `sha256:${crypto.createHash('sha256').update(input).digest('hex').slice(0, 16)}`;
}

/**
 * Create sample dataset.
 */
function createSampleDataset(options: Partial<DatasetArtifact> = {}): DatasetArtifact {
  return {
    datasetId: options.datasetId ?? computeOpaqueId(`dataset-${Date.now()}`),
    environment: options.environment ?? 'production',
    riskTier: options.riskTier ?? 'high',
    classifications: options.classifications ?? ['pii', 'confidential'],
    ownerId: options.ownerId ?? computeOpaqueId('owner-sample'),
    accessSurfaceCount: options.accessSurfaceCount ?? 5,
    exportPathCount: options.exportPathCount ?? 2,
    lastAccessed: options.lastAccessed,
    createdAt: options.createdAt ?? new Date().toISOString(),
  };
}

/**
 * Create sample access surface.
 */
function createSampleAccessSurface(options: Partial<AccessSurface> = {}): AccessSurface {
  return {
    surfaceId: options.surfaceId ?? computeOpaqueId(`surface-${Date.now()}`),
    datasetId: options.datasetId ?? computeOpaqueId('dataset-sample'),
    environment: options.environment ?? 'production',
    surfaceType: options.surfaceType ?? 'service',
    principalType: options.principalType ?? 'service',
    accessModes: options.accessModes ?? ['read'],
    enabled: options.enabled ?? true,
  };
}

/**
 * Create sample export path.
 */
function createSampleExportPath(options: Partial<ExportPath> = {}): ExportPath {
  return {
    pathId: options.pathId ?? computeOpaqueId(`export-${Date.now()}`),
    datasetId: options.datasetId ?? computeOpaqueId('dataset-sample'),
    environment: options.environment ?? 'production',
    pathType: options.pathType ?? 'api_export',
    riskTier: options.riskTier ?? 'high',
    allowedPrincipalTypes: options.allowedPrincipalTypes ?? ['service'],
    requiresApproval: options.requiresApproval ?? true,
    maxExportSizeBytes: options.maxExportSizeBytes,
  };
}

/**
 * Create mock inventory source.
 */
function createMockInventorySource(datasets: DatasetArtifact[] = []): DataInventorySource {
  const surfaces: AccessSurface[] = datasets.flatMap(d =>
    Array.from({ length: d.accessSurfaceCount }, (_, i) =>
      createSampleAccessSurface({
        datasetId: d.datasetId,
        surfaceId: computeOpaqueId(`surface-${d.datasetId}-${i}`),
      })
    )
  );

  const paths: ExportPath[] = datasets.flatMap(d =>
    Array.from({ length: d.exportPathCount }, (_, i) =>
      createSampleExportPath({
        datasetId: d.datasetId,
        pathId: computeOpaqueId(`path-${d.datasetId}-${i}`),
        riskTier: d.riskTier,
      })
    )
  );

  return {
    listDatasets(environment) {
      if (environment) {
        return datasets.filter(d => d.environment === environment);
      }
      return datasets;
    },
    listAccessSurfaces(datasetId) {
      if (datasetId) {
        return surfaces.filter(s => s.datasetId === datasetId);
      }
      return surfaces;
    },
    listExportPaths(datasetId) {
      if (datasetId) {
        return paths.filter(p => p.datasetId === datasetId);
      }
      return paths;
    },
    getDataset(datasetId) {
      return datasets.find(d => d.datasetId === datasetId) ?? null;
    },
  };
}

/**
 * Compute inventory summary.
 */
function computeInventorySummary(source: DataInventorySource): DataInventorySummary {
  const datasets = source.listDatasets();
  const surfaces = source.listAccessSurfaces();
  const paths = source.listExportPaths();

  const byEnvironment: Record<Environment, number> = {
    production: 0,
    staging: 0,
    development: 0,
    test: 0,
  };
  const byRiskTier: Record<DatasetRiskTier, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  const byClassification: Record<DataClassification, number> = {
    pii: 0,
    phi: 0,
    pci: 0,
    confidential: 0,
    internal: 0,
    public: 0,
  };

  for (const d of datasets) {
    byEnvironment[d.environment]++;
    byRiskTier[d.riskTier]++;
    for (const c of d.classifications) {
      byClassification[c]++;
    }
  }

  const highRiskExportPaths = paths.filter(
    p => p.riskTier === 'critical' || p.riskTier === 'high'
  ).length;

  return {
    totalDatasets: datasets.length,
    totalAccessSurfaces: surfaces.length,
    totalExportPaths: paths.length,
    byEnvironment,
    byRiskTier,
    byClassification,
    highRiskExportPaths,
  };
}

// ============================================================================
// Contract: inventory_enumerates_datasets
// ============================================================================

describe('Data Access Inventory Contract', () => {
  describe('inventory_enumerates_datasets', () => {
    it('should list all datasets', () => {
      const datasets = [
        createSampleDataset({ datasetId: computeOpaqueId('ds1') }),
        createSampleDataset({ datasetId: computeOpaqueId('ds2') }),
      ];
      const source = createMockInventorySource(datasets);

      const result = source.listDatasets();

      assert.strictEqual(result.length, 2);
    });

    it('should filter by environment', () => {
      const datasets = [
        createSampleDataset({ environment: 'production' }),
        createSampleDataset({ environment: 'staging' }),
        createSampleDataset({ environment: 'production' }),
      ];
      const source = createMockInventorySource(datasets);

      const result = source.listDatasets('production');

      assert.strictEqual(result.length, 2);
      assert.ok(result.every(d => d.environment === 'production'));
    });

    it('should include risk tier', () => {
      const dataset = createSampleDataset({ riskTier: 'critical' });
      const source = createMockInventorySource([dataset]);

      const result = source.listDatasets();

      assert.strictEqual(result[0].riskTier, 'critical');
    });

    it('should include classifications', () => {
      const dataset = createSampleDataset({ classifications: ['pii', 'phi'] });
      const source = createMockInventorySource([dataset]);

      const result = source.listDatasets();

      assert.deepStrictEqual(result[0].classifications, ['pii', 'phi']);
    });

    it('should get dataset by ID', () => {
      const datasetId = computeOpaqueId('target-ds');
      const datasets = [
        createSampleDataset({ datasetId }),
        createSampleDataset({ datasetId: computeOpaqueId('other') }),
      ];
      const source = createMockInventorySource(datasets);

      const result = source.getDataset(datasetId);

      assert.ok(result);
      assert.strictEqual(result.datasetId, datasetId);
    });
  });

  // ============================================================================
  // Contract: inventory_enumerates_access_surfaces
  // ============================================================================

  describe('inventory_enumerates_access_surfaces', () => {
    it('should list all access surfaces', () => {
      const datasets = [createSampleDataset({ accessSurfaceCount: 3 })];
      const source = createMockInventorySource(datasets);

      const surfaces = source.listAccessSurfaces();

      assert.strictEqual(surfaces.length, 3);
    });

    it('should filter by dataset', () => {
      const dsId = computeOpaqueId('target-ds');
      const datasets = [
        createSampleDataset({ datasetId: dsId, accessSurfaceCount: 2 }),
        createSampleDataset({ datasetId: computeOpaqueId('other'), accessSurfaceCount: 3 }),
      ];
      const source = createMockInventorySource(datasets);

      const surfaces = source.listAccessSurfaces(dsId);

      assert.strictEqual(surfaces.length, 2);
      assert.ok(surfaces.every(s => s.datasetId === dsId));
    });

    it('should include surface type', () => {
      const surface = createSampleAccessSurface({ surfaceType: 'bi_tool' });

      assert.strictEqual(surface.surfaceType, 'bi_tool');
    });

    it('should include access modes', () => {
      const surface = createSampleAccessSurface({ accessModes: ['read', 'export'] });

      assert.deepStrictEqual(surface.accessModes, ['read', 'export']);
    });

    it('should include principal type', () => {
      const surface = createSampleAccessSurface({ principalType: 'job' });

      assert.strictEqual(surface.principalType, 'job');
    });
  });

  // ============================================================================
  // Contract: inventory_enumerates_export_paths
  // ============================================================================

  describe('inventory_enumerates_export_paths', () => {
    it('should list all export paths', () => {
      const datasets = [createSampleDataset({ exportPathCount: 4 })];
      const source = createMockInventorySource(datasets);

      const paths = source.listExportPaths();

      assert.strictEqual(paths.length, 4);
    });

    it('should filter by dataset', () => {
      const dsId = computeOpaqueId('target-ds');
      const datasets = [
        createSampleDataset({ datasetId: dsId, exportPathCount: 2 }),
        createSampleDataset({ datasetId: computeOpaqueId('other'), exportPathCount: 3 }),
      ];
      const source = createMockInventorySource(datasets);

      const paths = source.listExportPaths(dsId);

      assert.strictEqual(paths.length, 2);
    });

    it('should include path type', () => {
      const path = createSampleExportPath({ pathType: 'etl_pipeline' });

      assert.strictEqual(path.pathType, 'etl_pipeline');
    });

    it('should include approval requirement', () => {
      const path = createSampleExportPath({ requiresApproval: true });

      assert.strictEqual(path.requiresApproval, true);
    });

    it('should include allowed principal types', () => {
      const path = createSampleExportPath({ allowedPrincipalTypes: ['user', 'service'] });

      assert.deepStrictEqual(path.allowedPrincipalTypes, ['user', 'service']);
    });
  });

  // ============================================================================
  // Contract: inventory_normalizes_artifacts
  // ============================================================================

  describe('inventory_normalizes_artifacts', () => {
    it('should compute inventory summary', () => {
      const datasets = [
        createSampleDataset({ environment: 'production', riskTier: 'critical' }),
        createSampleDataset({ environment: 'production', riskTier: 'high' }),
        createSampleDataset({ environment: 'staging', riskTier: 'medium' }),
      ];
      const source = createMockInventorySource(datasets);

      const summary = computeInventorySummary(source);

      assert.strictEqual(summary.totalDatasets, 3);
      assert.strictEqual(summary.byEnvironment.production, 2);
      assert.strictEqual(summary.byRiskTier.critical, 1);
    });

    it('should count high-risk export paths', () => {
      const datasets = [
        createSampleDataset({ riskTier: 'critical', exportPathCount: 2 }),
        createSampleDataset({ riskTier: 'low', exportPathCount: 3 }),
      ];
      const source = createMockInventorySource(datasets);

      const summary = computeInventorySummary(source);

      assert.strictEqual(summary.highRiskExportPaths, 2);
    });

    it('should aggregate classifications', () => {
      const datasets = [
        createSampleDataset({ classifications: ['pii', 'confidential'] }),
        createSampleDataset({ classifications: ['pii', 'phi'] }),
      ];
      const source = createMockInventorySource(datasets);

      const summary = computeInventorySummary(source);

      assert.strictEqual(summary.byClassification.pii, 2);
      assert.strictEqual(summary.byClassification.phi, 1);
    });
  });

  // ============================================================================
  // Contract: inventory_is_pii_clean
  // ============================================================================

  describe('inventory_is_pii_clean', () => {
    it('should use opaque dataset IDs', () => {
      const dataset = createSampleDataset();

      assert.ok(dataset.datasetId.startsWith('sha256:'));
    });

    it('should use opaque owner IDs', () => {
      const dataset = createSampleDataset();

      assert.ok(dataset.ownerId.startsWith('sha256:'));
    });

    it('should use opaque surface IDs', () => {
      const surface = createSampleAccessSurface();

      assert.ok(surface.surfaceId.startsWith('sha256:'));
    });

    it('should use opaque path IDs', () => {
      const path = createSampleExportPath();

      assert.ok(path.pathId.startsWith('sha256:'));
    });

    it('should not expose raw table names', () => {
      const dataset = createSampleDataset();

      // datasetId should be opaque, not a raw table name
      assert.ok(!dataset.datasetId.includes('customer'));
      assert.ok(!dataset.datasetId.includes('users'));
    });
  });
});
