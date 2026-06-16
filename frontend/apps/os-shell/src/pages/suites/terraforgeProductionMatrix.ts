import {
  TERRAFORGE_CANONICAL_INVENTORY,
  type TerraForgeCapabilityTier,
  type TerraForgeProofSurface,
} from './terraforgeCanonicalInventory';
import {
  TERRAFORGE_RUNTIME_AUDIT,
  type TerraForgeRuntimeAuditStatus,
  type TerraForgeRuntimeSurface,
} from './terraforgeRuntimeAudit';

export type TerraForgeProductionProofMode =
  | 'authenticated-public-browser-smoke'
  | 'support-or-deferred-disclosure';

export type TerraForgeProductionProofStatus =
  | 'requires-public-smoke'
  | 'not-primary-proof';

export interface TerraForgeProductionMatrixEntry {
  id: string;
  label: string;
  tier: TerraForgeCapabilityTier;
  proofSurface: TerraForgeProofSurface;
  route: string;
  moduleId?: string;
  runtimeAuditStatus: TerraForgeRuntimeAuditStatus;
  runtimeSurface: TerraForgeRuntimeSurface;
  launchableFromSuite: boolean;
  runtimePaths: readonly string[];
  proofMode: TerraForgeProductionProofMode;
  proofStatus: TerraForgeProductionProofStatus;
  endpointOnlyProofAllowed: false;
  workbenchProofAllowed: false;
  requiredEvidence: readonly string[];
}

const auditById = new Map(TERRAFORGE_RUNTIME_AUDIT.map((entry) => [entry.id, entry]));

export const TERRAFORGE_PRODUCTION_MATRIX: readonly TerraForgeProductionMatrixEntry[] =
  TERRAFORGE_CANONICAL_INVENTORY.map((capability) => {
    const audit = auditById.get(capability.id);
    if (!audit) {
      throw new Error(`Missing TerraForge runtime audit entry: ${capability.id}`);
    }

    const isPrimary = capability.tier === 'primary';

    return {
      id: capability.id,
      label: capability.label,
      tier: capability.tier,
      proofSurface: capability.proofSurface,
      route: capability.route ?? '/forge',
      moduleId: capability.moduleId,
      runtimeAuditStatus: audit.auditStatus,
      runtimeSurface: audit.runtimeSurface,
      launchableFromSuite: audit.launchableFromSuite,
      runtimePaths: audit.runtimePaths,
      proofMode: isPrimary ? 'authenticated-public-browser-smoke' : 'support-or-deferred-disclosure',
      proofStatus: isPrimary ? 'requires-public-smoke' : 'not-primary-proof',
      endpointOnlyProofAllowed: false,
      workbenchProofAllowed: false,
      requiredEvidence: isPrimary
        ? [
            'authenticated public production session',
            '/forge TerraForge Suite surface loaded from the release SHA under test',
            'canonical primary capability card visible in the primary suite section',
            'capability is launchable through the suite module registry',
            'runtime-backed API or service path disclosed by the matrix',
          ]
        : [
            'capability appears only in support/deferred section',
            'capability is not counted as primary TerraForge production proof',
          ],
    };
  });

export function getTerraForgeProductionMatrix(): readonly TerraForgeProductionMatrixEntry[] {
  return TERRAFORGE_PRODUCTION_MATRIX;
}
