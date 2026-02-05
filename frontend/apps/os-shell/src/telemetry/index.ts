/**
 * Telemetry Barrel Export
 *
 * Phase 6.3: Legacy UI telemetry functions.
 * Phase 7: Added readAll and clearAll for dev viewer.
 */

export {
  emitLegacyUiHit,
  getLegacyUiMetrics,
  resetLegacyUiMetrics,
  readAllLegacyMetrics,
  clearAllLegacyMetrics,
} from './legacyUiTelemetry';

export type { LegacyUiHitPayload, MetricsEntry } from './legacyUiTelemetry';
