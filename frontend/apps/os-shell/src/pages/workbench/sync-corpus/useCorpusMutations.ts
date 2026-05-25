/**
 * SYNC-UX-1C: TanStack Query mutations for start + resume.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  postCorpusStart,
  postCorpusResume,
  type CorpusStartOrResumeResponse,
  type ResumeOutcome,
  type StartCorpusRequest,
} from '@/api/syncCorpus';

export function useStartCorpusRun() {
  const qc = useQueryClient();
  return useMutation<CorpusStartOrResumeResponse, Error, StartCorpusRequest>({
    mutationFn: (req) => postCorpusStart(req),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['sync-corpus-run', data.runId] });
      void qc.invalidateQueries({ queryKey: ['sync-corpus-runs'] });
    },
  });
}

export function useResumeCorpusRun() {
  const qc = useQueryClient();
  return useMutation<ResumeOutcome, Error, string>({
    mutationFn: (runId) => postCorpusResume(runId),
    onSuccess: (outcome, runId) => {
      if (outcome.kind === 'ok') {
        void qc.invalidateQueries({ queryKey: ['sync-corpus-run', runId] });
      }
    },
  });
}
