export const MUTATION_BOUNDARY_BINS = [
  'accreditation-packet.mjs',
  'airgap-bundle.mjs',
  'bootstrap.mjs',
  'closeout-proof.mjs',
  'county-kit.mjs',
  'drills.mjs',
  'fleet-enroll.mjs',
  'mirror-publish.mjs',
] as const;

export const NON_MUTATION_BINS = [
  'accreditation-verify.mjs',
  'hints.mjs',
  'ops-status.mjs',
  'slo-gate.mjs',
] as const;

export const EXTERNAL_MUTATOR_PATHS = ['scripts/prepare-accreditation-release.mjs'] as const;

export type MutationBoundaryBin = (typeof MUTATION_BOUNDARY_BINS)[number];

export type RbacActionId =
  | 'autonomy.bootstrap.write'
  | 'autonomy.drills.write'
  | 'autonomy.county_kit.write'
  | 'autonomy.accreditation.packet.write'
  | 'autonomy.fleet_enroll.write'
  | 'autonomy.airgap.bundle.write'
  | 'autonomy.mirror.publish.write'
  | 'autonomy.closeout.proof.write';

export interface ActionDefinition {
  readonly actionId: RbacActionId;
  readonly description: string;
  readonly breakGlassAction?: 'rollback_from_proof' | 'republish_evidence' | 'pause_autonomy_lane';
}

export const ACTION_MAP: Record<MutationBoundaryBin, ActionDefinition> = {
  'accreditation-packet.mjs': {
    actionId: 'autonomy.accreditation.packet.write',
    description: 'Generate accreditation packet artifacts',
  },
  'airgap-bundle.mjs': {
    actionId: 'autonomy.airgap.bundle.write',
    description: 'Generate air-gap bundle artifacts',
  },
  'bootstrap.mjs': {
    actionId: 'autonomy.bootstrap.write',
    description: 'Generate bootstrap artifacts',
  },
  'closeout-proof.mjs': {
    actionId: 'autonomy.closeout.proof.write',
    description: 'Generate FISMA closeout proof artifacts',
  },
  'county-kit.mjs': {
    actionId: 'autonomy.county_kit.write',
    description: 'Generate county kit artifacts',
  },
  'drills.mjs': {
    actionId: 'autonomy.drills.write',
    description: 'Generate drill artifacts',
  },
  'fleet-enroll.mjs': {
    actionId: 'autonomy.fleet_enroll.write',
    description: 'Generate fleet enrollment artifacts',
  },
  'mirror-publish.mjs': {
    actionId: 'autonomy.mirror.publish.write',
    description: 'Publish artifacts to mirror targets',
    breakGlassAction: 'republish_evidence',
  },
} as const;

export const ACTION_IDS = Object.values(ACTION_MAP).map(entry => entry.actionId);

export const MUTATION_BOUNDARY_ACTION_IDS = MUTATION_BOUNDARY_BINS.map(
  bin => ACTION_MAP[bin].actionId
);
