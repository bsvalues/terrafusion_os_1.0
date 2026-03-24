import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuthContext, toOsActor } from '@/auth/useAuthContext';
import { ragAPI } from '@/services/ragAPI';
import type { RAGDataset, CreateDatasetRequest } from '@/services/ragAPI';
import { resolveGptActor } from '@/services/gptActorBridge';
import type { GptActorError, GptActorResult } from '@/services/gptActorBridge';

export function useRAGDatasets(): {
  datasets: RAGDataset[];
  actorError: GptActorError | null;
  isLoading: boolean;
  error: string | null;
  createDataset: (req: CreateDatasetRequest) => Promise<GptActorResult<RAGDataset>>;
  deleteDataset: (id: number) => Promise<GptActorResult<void>>;
  reindexDataset: (id: number) => Promise<GptActorResult<{ message: string; documentCount: number }>>;
  refresh: () => void;
} {
  const auth = useAuthContext();
  const actorResult = useMemo(() => resolveGptActor(toOsActor(auth)), [auth]);

  const cancelledRef = useRef(false);
  const [datasets, setDatasets] = useState<RAGDataset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const actorError: GptActorError | null = actorResult.ok ? null : actorResult.error;

  useEffect(() => {
    if (!actorResult.ok) return;
    cancelledRef.current = false;
    setIsLoading(true);
    setError(null);
    ragAPI.getDatasets()
      .then(data => { if (!cancelledRef.current) setDatasets(data); })
      .catch(err => { if (!cancelledRef.current) setError((err as { message?: string }).message ?? 'Failed to load datasets'); })
      .finally(() => { if (!cancelledRef.current) setIsLoading(false); });
    return () => { cancelledRef.current = true; };
  }, [actorResult.ok, refreshKey]);

  const createDataset = useCallback(async (req: CreateDatasetRequest): Promise<GptActorResult<RAGDataset>> => {
    if (!actorResult.ok) return { ok: false, error: actorResult.error };
    try {
      const ds = await ragAPI.createDataset(req);
      if (!cancelledRef.current) setDatasets(prev => [...prev, ds]);
      return { ok: true, data: ds };
    } catch (err: unknown) {
      const e = err as { code?: string; response?: { status: number; data?: { message?: string } } };
      if (e?.code === 'ECONNABORTED') return { ok: false, error: { kind: 'timeout' } };
      return { ok: false, error: { kind: 'api_error', status: e?.response?.status ?? 0, message: e?.response?.data?.message ?? 'Unknown error' } };
    }
  }, [actorResult]);

  const deleteDataset = useCallback(async (id: number): Promise<GptActorResult<void>> => {
    if (!actorResult.ok) return { ok: false, error: actorResult.error };
    try {
      await ragAPI.deleteDataset(id);
      if (!cancelledRef.current) setDatasets(prev => prev.filter(d => d.id !== id));
      return { ok: true, data: undefined };
    } catch (err: unknown) {
      const e = err as { code?: string; response?: { status: number; data?: { message?: string } } };
      if (e?.code === 'ECONNABORTED') return { ok: false, error: { kind: 'timeout' } };
      return { ok: false, error: { kind: 'api_error', status: e?.response?.status ?? 0, message: e?.response?.data?.message ?? 'Unknown error' } };
    }
  }, [actorResult]);

  const reindexDataset = useCallback(async (id: number): Promise<GptActorResult<{ message: string; documentCount: number }>> => {
    if (!actorResult.ok) return { ok: false, error: actorResult.error };
    try {
      const result = await ragAPI.reindexDataset(id);
      return { ok: true, data: result };
    } catch (err: unknown) {
      const e = err as { code?: string; response?: { status: number; data?: { message?: string } } };
      if (e?.code === 'ECONNABORTED') return { ok: false, error: { kind: 'timeout' } };
      return { ok: false, error: { kind: 'api_error', status: e?.response?.status ?? 0, message: e?.response?.data?.message ?? 'Unknown error' } };
    }
  }, [actorResult]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  return { datasets, actorError, isLoading, error, createDataset, deleteDataset, reindexDataset, refresh };
}
