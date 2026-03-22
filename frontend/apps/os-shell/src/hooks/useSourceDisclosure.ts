import type { FreshData } from '../lib/freshData';

export type DisclosureSource = 'live' | 'partial' | 'fallback' | 'unavailable';

export interface DisclosureResult {
  source: DisclosureSource;
  label: string;
  /** Design-system badge severity.
   *  live → success, partial → warning, fallback → warning, unavailable → muted */
  variant: 'success' | 'warning' | 'muted';
}

const UNAVAILABLE: DisclosureResult = {
  source: 'unavailable',
  label: 'Unavailable',
  variant: 'muted',
};

export function useSourceDisclosure(
  data: FreshData<unknown> | null,
  opts?: { liveFields?: number; totalFields?: number },
): DisclosureResult {
  if (data === null) return UNAVAILABLE;

  const { source, isStale } = data;

  if (source === 'unavailable') return UNAVAILABLE;

  if (source === 'live' || source === 'polled') {
    if (isStale) {
      return { source: 'fallback', label: 'Demo data', variant: 'warning' };
    }
    const { liveFields, totalFields } = opts ?? {};
    if (liveFields != null && totalFields != null && liveFields < totalFields) {
      return {
        source: 'partial',
        label: `Partial — ${liveFields} of ${totalFields} fields live`,
        variant: 'warning',
      };
    }
    return { source: 'live', label: 'Live', variant: 'success' };
  }

  // source === 'fallback'
  return { source: 'fallback', label: 'Demo data', variant: 'warning' };
}
