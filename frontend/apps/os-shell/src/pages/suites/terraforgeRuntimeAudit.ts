import {
  TERRAFORGE_CANONICAL_INVENTORY,
  type TerraForgeCapabilityStatus,
  type TerraForgeCapabilityTier,
  type TerraForgeProofSurface,
} from './terraforgeCanonicalInventory';

export type TerraForgeRuntimeAuditStatus = 'runtime-backed' | 'not-exposed' | 'deferred' | 'fail';
export type TerraForgeRuntimeSurface =
  | 'standalone-module'
  | 'shared-module'
  | 'support-module'
  | 'suite-card-only';

export interface TerraForgeRuntimeAuditEntry {
  id: string;
  label: string;
  tier: TerraForgeCapabilityTier;
  canonicalStatus: TerraForgeCapabilityStatus;
  auditStatus: TerraForgeRuntimeAuditStatus;
  proofSurface: TerraForgeProofSurface;
  runtimeSurface: TerraForgeRuntimeSurface;
  route: string;
  launchableFromSuite: boolean;
  moduleId?: string;
  componentPath?: string;
  runtimePaths: readonly string[];
  blocker?: string;
}

const capabilityById = new Map(TERRAFORGE_CANONICAL_INVENTORY.map((capability) => [capability.id, capability]));

function capability(id: string) {
  const found = capabilityById.get(id);
  if (!found) {
    throw new Error(`Missing TerraForge canonical capability: ${id}`);
  }
  return found;
}

function auditEntry(
  id: string,
  details: Omit<TerraForgeRuntimeAuditEntry, 'id' | 'label' | 'tier' | 'canonicalStatus' | 'proofSurface' | 'route' | 'moduleId'> & {
    moduleId?: string;
  },
): TerraForgeRuntimeAuditEntry {
  const canonical = capability(id);
  return {
    id,
    label: canonical.label,
    tier: canonical.tier,
    canonicalStatus: canonical.status,
    proofSurface: canonical.proofSurface,
    route: canonical.route ?? '/forge',
    moduleId: details.moduleId ?? canonical.moduleId,
    ...details,
  };
}

export const TERRAFORGE_RUNTIME_AUDIT: readonly TerraForgeRuntimeAuditEntry[] = [
  auditEntry('costforge', {
    auditStatus: 'runtime-backed',
    runtimeSurface: 'standalone-module',
    launchableFromSuite: true,
    componentPath: 'frontend/apps/os-shell/src/pages/forge/cost/CostForge.tsx',
    runtimePaths: [
      '/costforge/dashboard-stats',
      '/costforge/cost-matrix/benton',
      '/costforge/calculate',
    ],
  }),
  auditEntry('compsforge', {
    auditStatus: 'runtime-backed',
    runtimeSurface: 'standalone-module',
    launchableFromSuite: true,
    componentPath: 'frontend/apps/os-shell/src/pages/suites/modules/CompsForgeModule.tsx',
    runtimePaths: [
      '/terraforge/comps-pool',
      '/terraforge/comps/sets/{id}/detail',
    ],
  }),
  auditEntry('salesforge', {
    auditStatus: 'runtime-backed',
    runtimeSurface: 'standalone-module',
    launchableFromSuite: true,
    componentPath: 'frontend/apps/os-shell/src/pages/forge/sales/SalesForge.tsx',
    runtimePaths: [
      '/terraforge/sale-qualification',
      '/terraforge/sales/{saleId}/detail',
      '/terraforge/sales/running-stats',
    ],
  }),
  auditEntry('incomeforge', {
    auditStatus: 'runtime-backed',
    runtimeSurface: 'standalone-module',
    launchableFromSuite: true,
    componentPath: 'frontend/apps/os-shell/src/pages/forge/income/IncomeForge.tsx',
    runtimePaths: [
      '/costforge/income-approach/cap-rates',
      '/costforge/income-approach/market-data',
      '/costforge/income-approach/valuation',
    ],
  }),
  auditEntry('reconciliation', {
    auditStatus: 'runtime-backed',
    runtimeSurface: 'standalone-module',
    launchableFromSuite: true,
    componentPath: 'frontend/apps/os-shell/src/pages/suites/modules/ReconciliationModule.tsx',
    runtimePaths: [
      'pilot:assemble_boe_packet',
      '/dossier/boe/{caseId}/packet',
    ],
  }),
  auditEntry('calibration-qc', {
    auditStatus: 'runtime-backed',
    runtimeSurface: 'shared-module',
    launchableFromSuite: true,
    componentPath: 'frontend/apps/os-shell/src/pages/forge/cost/tabs/CalibrationWorkbenchTab.tsx',
    runtimePaths: [
      '/costforge/dashboard-stats',
      '/terraforge/county-diagnostics',
      '/terraforge/calibration-memo',
    ],
  }),
  auditEntry('cama-characteristics', {
    auditStatus: 'runtime-backed',
    runtimeSurface: 'standalone-module',
    launchableFromSuite: true,
    componentPath: 'frontend/apps/os-shell/src/pages/forge/cama/CamaCharacteristicsModule.tsx',
    runtimePaths: [
      '/Properties/parcel/{parcelNumber}',
    ],
  }),
  auditEntry('valuation-notes-defensibility', {
    auditStatus: 'runtime-backed',
    runtimeSurface: 'standalone-module',
    launchableFromSuite: true,
    componentPath: 'frontend/apps/os-shell/src/pages/forge/valuation/ValuationDefensibilityModule.tsx',
    runtimePaths: [
      '/dossier/parcels/{parcelId}/details?include=valuation,notes',
    ],
  }),
  auditEntry('batch-cost-runs', {
    auditStatus: 'deferred',
    runtimeSurface: 'support-module',
    launchableFromSuite: false,
    componentPath: 'frontend/apps/os-shell/src/pages/forge/batch/BatchCostRun.tsx',
    runtimePaths: [],
  }),
  auditEntry('regression-studio', {
    auditStatus: 'deferred',
    runtimeSurface: 'support-module',
    launchableFromSuite: false,
    componentPath: 'frontend/apps/os-shell/src/pages/forge/regression/RegressionStudio.tsx',
    runtimePaths: [],
  }),
  auditEntry('county-studio', {
    auditStatus: 'runtime-backed',
    runtimeSurface: 'support-module',
    launchableFromSuite: true,
    componentPath: 'frontend/apps/os-shell/src/pages/forge/county-studio/CountyStudyPage.tsx',
    runtimePaths: [
      '/api/forge/county-studies',
      '/api/forge/county-studies/{studyId}/segments',
    ],
  }),
  auditEntry('coefficient-preview', {
    auditStatus: 'deferred',
    runtimeSurface: 'support-module',
    launchableFromSuite: false,
    componentPath: 'frontend/apps/os-shell/src/pages/forge/batch/CoefficientPreview.tsx',
    runtimePaths: [],
  }),
  auditEntry('current-use-support', {
    auditStatus: 'deferred',
    runtimeSurface: 'support-module',
    launchableFromSuite: false,
    runtimePaths: [],
  }),
] as const;

export function getTerraForgeRuntimeAudit(): readonly TerraForgeRuntimeAuditEntry[] {
  return TERRAFORGE_RUNTIME_AUDIT;
}
