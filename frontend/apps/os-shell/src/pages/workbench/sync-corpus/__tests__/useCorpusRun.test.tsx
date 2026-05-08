/**
 * SYNC-UX-1C: useCorpusRun auto-refresh policy.
 *
 * Verifies the status-aware refetchInterval: poll only while the
 * run is active (Queued | Running | Resumed); never poll once the
 * run terminates.
 */

import { describe, it, expect } from 'vitest';
import { isActiveStatus } from '../useCorpusRun';

describe('useCorpusRun · status-aware refetch', () => {
  it('treats Queued, Running, and Resumed as active', () => {
    expect(isActiveStatus('Queued')).toBe(true);
    expect(isActiveStatus('Running')).toBe(true);
    expect(isActiveStatus('Resumed')).toBe(true);
  });

  it('treats Completed, Failed, and Interrupted as inactive', () => {
    expect(isActiveStatus('Completed')).toBe(false);
    expect(isActiveStatus('Failed')).toBe(false);
    expect(isActiveStatus('Interrupted')).toBe(false);
  });

  it('treats undefined as inactive', () => {
    expect(isActiveStatus(undefined)).toBe(false);
  });
});
