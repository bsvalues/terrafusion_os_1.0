/**
 * Telemetry Barrel Export
 *
 * Phase 6.3: Legacy UI telemetry functions.
 */

export {
  emitLegacyUiHit,
  getLegacyUiMetrics,
  resetLegacyUiMetrics,
} from './legacyUiTelemetry';

export type { LegacyUiHitPayload, MetricsEntry } from './legacyUiTelemetry';
