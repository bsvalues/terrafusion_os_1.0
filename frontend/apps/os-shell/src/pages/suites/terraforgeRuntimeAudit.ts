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
    auditStatus: 'fail',
    runtimeSurface: 'standalone-module',
    launchableFromSuite: false,
    componentPath: 'frontend/apps/os-shell/src/pages/forge/income/IncomeForge.tsx',
    runtimePaths: [
      '/costforge/income-approach/cap-rates',
      '/costforge/income-approach/market-data',
      '/costforge/income-approach/valuation',
    ],
    blocker: 'IncomeForge component exists, but moduleId income-forge is not registered in the shell module registry.',
  }),
  auditEntry('reconciliation', {
    auditStatus: 'not-exposed',
    runtimeSurface: 'suite-card-only',
    launchableFromSuite: false,
    componentPath: 'frontend/apps/os-shell/src/pages/suites/modules/ReconciliationModule.tsx',
    runtimePaths: [],
    blocker: 'Reconciliation is canonical primary, but it is not exposed as an independent /forge runtime module.',
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
    auditStatus: 'not-exposed',
    runtimeSurface: 'suite-card-only',
    launchableFromSuite: false,
    runtimePaths: [],
    blocker: 'CAMA characteristics are required as a TerraFusion data lane, but no /forge runtime surface is exposed yet.',
  }),
  auditEntry('valuation-notes-defensibility', {
    auditStatus: 'not-exposed',
    runtimeSurface: 'suite-card-only',
    launchableFromSuite: false,
    runtimePaths: [],
    blocker: 'Valuation notes and defensibility support are canonical primary, but no standalone /forge runtime surface is exposed yet.',
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
