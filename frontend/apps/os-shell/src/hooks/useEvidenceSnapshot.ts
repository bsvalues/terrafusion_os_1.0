/**
 * useEvidenceSnapshot — Fetch CX-25 evidence snapshot for a parcel.
 *
 * Returns the snapshot data, loading/error state, and refetch capability.
 * The hook does NOT auto-fetch on mount — call `fetch()` explicitly.
 * This is intentional: evidence snapshots are point-in-time and should
 * only be generated when the operator requests one.
 */

import { useCallback, useState } from 'react';
import { dossierService } from '../services/dossierService';
import type { EvidenceSnapshot } from '../services/dossierService';

export interface EvidenceSnapshotState {
  snapshot: EvidenceSnapshot | null;
  headerCorrelationId: string | null;
  loading: boolean;
  error: string | null;
  /** HTTP status code from a failed request (null if no error or network error) */
  httpStatus: number | null;
}

export function useEvidenceSnapshot(parcelId: string) {
  const [state, setState] = useState<EvidenceSnapshotState>({
    snapshot: null,
    headerCorrelationId: null,
    loading: false,
    error: null,
    httpStatus: null,
  });

  const fetchSnapshot = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null, httpStatus: null }));
    try {
      const result = await dossierService.getEvidenceSnapshot(parcelId);
      setState({
        snapshot: result.snapshot,
        headerCorrelationId: result.headerCorrelationId,
        loading: false,
        error: null,
        httpStatus: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      // Extract HTTP status from error message pattern "Dossier API error: NNN ..."
      const statusMatch = message.match(/Dossier API error: (\d+)/);
      const httpStatus = statusMatch ? parseInt(statusMatch[1], 10) : null;
      setState({
        snapshot: null,
        headerCorrelationId: null,
        loading: false,
        error: message,
        httpStatus,
      });
    }
  }, [parcelId]);

  return { ...state, fetch: fetchSnapshot };
}
