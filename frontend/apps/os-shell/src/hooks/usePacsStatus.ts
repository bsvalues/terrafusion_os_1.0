/**
 * usePacsStatus — legacy alias for useAssessmentSourceStatus.
 *
 * Older callers (ManagementDashboard, dashboard contract tests) imported
 * the source-system status hook by its vendor-named handle. The canonical
 * hook is now `useAssessmentSourceStatus` (no-vendor-names rule), so this
 * file is a thin re-export shim that keeps stale imports compiling.
 *
 * Type aliases are also re-exported so existing call sites can continue
 * to type their props as `PacsHealth`.
 */

export {
  useAssessmentSourceStatus as usePacsStatus,
} from './useAssessmentSourceStatus';

export type {
  AssessmentSourceHealth as PacsHealth,
} from './useAssessmentSourceStatus';
