/**
 * useParcelTrace.ts
 *
 * CP-10: Thin wrapper over usePilotTraceList that provides the
 * useParcelTrace(parcelId) contract required by R1 spec.
 *
 * Returns TraceEvent[] for the EvidenceRail.
 * Calls GET /pilot/traces filtered by parcelId (real backend, not mock).
 */

import type { PilotTraceEvent } from '../api/pilotApi';
import { usePilotTraceList, type TraceListPhase } from './usePilotTraceList';

export interface UseParcelTraceResult {
  phase: TraceListPhase;
  events: PilotTraceEvent[];
  error: string | null;
  refresh: () => void;
}

/**
 * Fetch real trace events for a parcel (replaces generateMockActivity).
 *
 * @param parcelId - Parcel to query trace events for. null = idle.
 * @param pollMs - Polling interval in ms. Default 5000.
 */
export function useParcelTrace(
  parcelId: string | null | undefined,
  pollMs = 5000,
): UseParcelTraceResult {
  return usePilotTraceList({ parcelId, pollMs });
}
