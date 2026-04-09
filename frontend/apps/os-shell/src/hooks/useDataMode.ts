/**
 * TerraFusion OS — useDataMode Hook
 *
 * Returns the current data mode, reason, and connection status derived
 * directly from the DataProvider singleton — the single source of truth
 * for which data backend is active.
 *
 * IMPORTANT: Previously this hook polled /health/live independently, which
 * caused it to report 'live' even when VITE_DATA_MODE=snapshot was active.
 * The provider is now the authoritative source to prevent this divergence.
 */

import { getDataProvider, getDataProviderDiagnostics } from '../services/dataProvider';
import type { DataMode, DataModeReason } from '../services/dataProvider';

export interface DataModeState {
  /** Actual data mode the provider is using. */
  mode: DataMode;
  /** Why this mode was selected. */
  reason: DataModeReason | null;
  /** True only when mode is 'live'. */
  connected: boolean;
  /** When the provider singleton was initialized. Null if not yet accessed. */
  lastHealthCheck: Date | null;
  /** Always false — mode is derived synchronously from the provider singleton. */
  checking: false;
}

/**
 * Returns the current data mode state derived from the DataProvider singleton.
 *
 * Calling this hook ensures the provider is initialized (if not already).
 * The returned values are stable for the lifetime of the singleton.
 */
export function useDataMode(): DataModeState {
  // Ensure the singleton is initialized so diagnostics are populated
  getDataProvider();
  const diagnostics = getDataProviderDiagnostics();

  return {
    mode: diagnostics.mode,
    reason: diagnostics.reason,
    connected: diagnostics.mode === 'live',
    lastHealthCheck: diagnostics.initializedAt,
    checking: false,
  };
}
