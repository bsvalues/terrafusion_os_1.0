/**
 * SYNC-UX-1A: route + dismiss mutation hooks.
 *
 * Wraps the bulk fan-out helpers from @/api/syncQuarantine so the
 * page can submit a single decision or N decisions through the
 * same surface. Each individual call surfaces its own outcome
 * record (ok/error) so the modal can render per-row status without
 * short-circuiting on the first failure.
 */

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  bulkDismissQuarantineImprvAttr,
  bulkRouteQuarantineImprvAttr,
  type BulkOutcome,
  type DismissDecisionPayload,
  type DismissRequestBody,
  type RouteDecisionPayload,
  type RouteRequestBody,
} from '@/api/syncQuarantine';

export interface BulkMutationState<TPayload> {
  isRunning: boolean;
  completed: number;
  total: number;
  results: BulkOutcome<TPayload>[];
  error: Error | null;
}

const idle = <T>(): BulkMutationState<T> => ({
  isRunning: false,
  completed: 0,
  total: 0,
  results: [],
  error: null,
});

export function useRouteQuarantineMutation() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BulkMutationState<RouteDecisionPayload>>(idle());

  const submit = useCallback(
    async (
      ids: readonly string[],
      body: RouteRequestBody,
    ): Promise<BulkOutcome<RouteDecisionPayload>[]> => {
      setState({ isRunning: true, completed: 0, total: ids.length, results: [], error: null });
      try {
        // The bulk helper resolves all outcomes — even partial errors
        // come back as `{ status: 'error' }` records, not throws.
        const results = await bulkRouteQuarantineImprvAttr(ids, body);
        setState({
          isRunning: false,
          completed: results.length,
          total: ids.length,
          results,
          error: null,
        });
        // Invalidate the list query — visible row triageStatus changes.
        await queryClient.invalidateQueries({ queryKey: ['sync-quarantine-imprv-attr'] });
        return results;
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        setState({
          isRunning: false,
          completed: 0,
          total: ids.length,
          results: [],
          error,
        });
        throw error;
      }
    },
    [queryClient],
  );

  const reset = useCallback(() => setState(idle()), []);

  return { ...state, submit, reset };
}

export function useDismissQuarantineMutation() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BulkMutationState<DismissDecisionPayload>>(idle());

  const submit = useCallback(
    async (
      ids: readonly string[],
      body: DismissRequestBody,
    ): Promise<BulkOutcome<DismissDecisionPayload>[]> => {
      setState({ isRunning: true, completed: 0, total: ids.length, results: [], error: null });
      try {
        const results = await bulkDismissQuarantineImprvAttr(ids, body);
        setState({
          isRunning: false,
          completed: results.length,
          total: ids.length,
          results,
          error: null,
        });
        await queryClient.invalidateQueries({ queryKey: ['sync-quarantine-imprv-attr'] });
        return results;
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        setState({
          isRunning: false,
          completed: 0,
          total: ids.length,
          results: [],
          error,
        });
        throw error;
      }
    },
    [queryClient],
  );

  const reset = useCallback(() => setState(idle()), []);

  return { ...state, submit, reset };
}
