export const currentUseAlphaFlags = {
  /** Core workbench tab is available for all parcels */
  coreWorkbench: true,
  /** Rollback calculator UI is enabled */
  rollbackCalculator: true,
  /** Show policy version badge in UI */
  showPolicyVersion: true,
  /** Enable PDF export of rollback result (Beta) */
  pdfExport: false,
  /** Enable interest schedule breakdown (Beta) */
  interestSchedule: false,
} as const;
