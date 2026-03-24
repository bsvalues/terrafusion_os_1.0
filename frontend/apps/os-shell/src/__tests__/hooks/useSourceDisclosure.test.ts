import { describe, expect, it } from 'vitest';
import { useSourceDisclosure } from '../../hooks/useSourceDisclosure';
import type { FreshData } from '../../lib/freshData';

function makeFresh<T>(overrides: Partial<FreshData<T>> = {}): FreshData<T> {
  return {
    data: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
    source: 'unavailable',
    isStale: false,
    ...overrides,
  };
}

describe('useSourceDisclosure', () => {
  it('returns unavailable when data is null', () => {
    const result = useSourceDisclosure(null);
    expect(result.source).toBe('unavailable');
    expect(result.label).toBe('Unavailable');
    expect(result.variant).toBe('muted');
  });

  it('returns unavailable when FreshData source is unavailable', () => {
    const result = useSourceDisclosure(makeFresh({ source: 'unavailable' }));
    expect(result.source).toBe('unavailable');
    expect(result.variant).toBe('muted');
  });

  it('returns live when source is live and not stale', () => {
    const result = useSourceDisclosure(makeFresh({ source: 'live', isStale: false, data: {} }));
    expect(result.source).toBe('live');
    expect(result.label).toBe('Live');
    expect(result.variant).toBe('success');
  });

  it('returns live when source is polled and not stale', () => {
    const result = useSourceDisclosure(makeFresh({ source: 'polled', isStale: false, data: {} }));
    expect(result.source).toBe('live');
    expect(result.label).toBe('Live');
  });

  it('returns fallback when source is live but isStale', () => {
    const result = useSourceDisclosure(makeFresh({ source: 'live', isStale: true, data: {} }));
    expect(result.source).toBe('fallback');
    expect(result.label).toBe('Demo data');
    expect(result.variant).toBe('warning');
  });

  it('returns fallback when source is fallback', () => {
    const result = useSourceDisclosure(makeFresh({ source: 'fallback', data: {} }));
    expect(result.source).toBe('fallback');
    expect(result.label).toBe('Demo data');
    expect(result.variant).toBe('warning');
  });

  it('returns partial when live and liveFields < totalFields', () => {
    const result = useSourceDisclosure(
      makeFresh({ source: 'live', isStale: false, data: {} }),
      { liveFields: 3, totalFields: 8 },
    );
    expect(result.source).toBe('partial');
    expect(result.label).toBe('Partial — 3 of 8 fields live');
    expect(result.variant).toBe('warning');
  });

  it('returns live (not partial) when liveFields equals totalFields', () => {
    const result = useSourceDisclosure(
      makeFresh({ source: 'live', isStale: false, data: {} }),
      { liveFields: 5, totalFields: 5 },
    );
    expect(result.source).toBe('live');
  });
});
