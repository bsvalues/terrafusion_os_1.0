export type TerraForgeCapabilityStatus = 'active' | 'honest-unavailable' | 'deferred' | 'fail';
export type TerraForgeCapabilityTier = 'primary' | 'support' | 'deferred';
export type TerraForgeProofSurface = 'suite' | 'support' | 'none';

export interface TerraForgeCanonicalCapability {
  id: string;
  label: string;
  description: string;
  tier: TerraForgeCapabilityTier;
  status: TerraForgeCapabilityStatus;
  proofSurface: TerraForgeProofSurface;
  moduleId?: string;
  route?: string;
  chipLabel: string;
}

export const TERRAFORGE_CANONICAL_INVENTORY: readonly TerraForgeCanonicalCapability[] = [
  {
    id: 'costforge',
    label: 'CostForge',
    description:
      'Cost and land valuation lane for replacement cost schedules, depreciation, land schedules, and RCNLD review.',
    tier: 'primary',
    status: 'active',
    proofSurface: 'suite',
    moduleId: 'costforge',
    route: '/forge',
    chipLabel: 'Cost + land valuation',
  },
  {
    id: 'compsforge',
    label: 'CompsForge',
    description:
      'Sales comparison and comparable selection lane for adjustment grids, paired-sales analysis, and market-derived trends.',
    tier: 'primary',
    status: 'active',
    proofSurface: 'suite',
    moduleId: 'comps-forge',
    route: '/forge',
    chipLabel: 'Sales comparison + comps',
  },
  {
    id: 'salesforge',
    label: 'SalesForge',
    description:
      'Sales qualification and ratio audit lane for sale review, WAC audit posture, IAAO statistics, and study export support.',
    tier: 'primary',
    status: 'active',
    proofSurface: 'suite',
    moduleId: 'sales-forge',
    route: '/forge',
    chipLabel: 'Qualification + ratio audit',
  },
  {
    id: 'incomeforge',
    label: 'IncomeForge',
    description:
      'Income approach lane for cap rates, NOI modeling, and rent schedule review where commercial income data is available.',
    tier: 'primary',
    status: 'active',
    proofSurface: 'suite',
    moduleId: 'income-forge',
    route: '/forge',
    chipLabel: 'Income approach runtime',
  },
  {
    id: 'reconciliation',
    label: 'Reconciliation',
    description:
      'Cross-approach value reconciliation lane for final value opinion support across cost, sales, and income indications.',
    tier: 'primary',
    status: 'active',
    proofSurface: 'suite',
    moduleId: 'reconciliation',
    route: '/forge',
    chipLabel: 'Reconciliation runtime',
  },
  {
    id: 'calibration-qc',
    label: 'Calibration / QC',
    description:
      'Calibration and quality-control lane for COD, PRD, segment review, and governed adjustment posture.',
    tier: 'primary',
    status: 'active',
    proofSurface: 'suite',
    moduleId: 'costforge',
    route: '/forge',
    chipLabel: 'Calibration + QC',
  },
  {
    id: 'cama-characteristics',
    label: 'CAMA Characteristics',
    description:
      'Runtime lane for CAMA characteristics used by valuation workflows. Canonical dependency is TerraFusion data, not a legacy system-facing UI.',
    tier: 'primary',
    status: 'active',
    proofSurface: 'suite',
    moduleId: 'cama-characteristics',
    route: '/forge',
    chipLabel: 'CAMA characteristics',
  },
  {
    id: 'valuation-notes-defensibility',
    label: 'Valuation Notes / Defensibility',
    description:
      'Defensibility support lane for valuation notes, rationale, and evidence packet handoff through governed dossier details.',
    tier: 'primary',
    status: 'active',
    proofSurface: 'suite',
    moduleId: 'valuation-notes-defensibility',
    route: '/forge',
    chipLabel: 'Defensibility runtime',
  },
  {
    id: 'batch-cost-runs',
    label: 'Batch Cost Runs',
    description: 'Batch execution support for county-wide cost model runs with strata, neighborhood, and class filters.',
    tier: 'deferred',
    status: 'deferred',
    proofSurface: 'support',
    moduleId: 'batch-cost-run',
    route: '/forge',
    chipLabel: 'Deferred',
  },
  {
    id: 'regression-studio',
    label: 'Regression Studio',
    description: 'Modeling support for MRA regression and coefficient diagnostics. Not primary TerraForge proof.',
    tier: 'deferred',
    status: 'deferred',
    proofSurface: 'support',
    moduleId: 'regression-studio',
    route: '/forge',
    chipLabel: 'Deferred',
  },
  {
    id: 'county-studio',
    label: 'County Studio',
    description:
      'Countywide support workspace for study sessions, scenario review, segment work, and downstream evidence handoff.',
    tier: 'support',
    status: 'active',
    proofSurface: 'support',
    moduleId: 'county-studio',
    route: '/forge',
    chipLabel: 'Support tool',
  },
  {
    id: 'coefficient-preview',
    label: 'Coefficient Preview',
    description: 'Preview support for adjustment coefficients before table publication. Not primary TerraForge proof.',
    tier: 'deferred',
    status: 'deferred',
    proofSurface: 'support',
    moduleId: 'coefficient-preview',
    route: '/forge',
    chipLabel: 'Deferred',
  },
  {
    id: 'current-use-support',
    label: 'Current-use Support',
    description:
      'Current-use support for DFL/CUFA/CUOS/CUTL enrollment, rollback calculations, interest rates, and removals.',
    tier: 'support',
    status: 'deferred',
    proofSurface: 'support',
    route: '/forge',
    chipLabel: 'Deferred',
  },
] as const;

export function getTerraForgeCanonicalInventory(): readonly TerraForgeCanonicalCapability[] {
  return TERRAFORGE_CANONICAL_INVENTORY;
}
