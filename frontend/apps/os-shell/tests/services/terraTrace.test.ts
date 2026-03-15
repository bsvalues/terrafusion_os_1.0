/**
 * TFR-078: TerraTrace Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeDiff, emitTraceEvent, initTraceContext } from '../../src/services/terraTrace';

// ---------------------------------------------------------------------------
// computeDiff
// ---------------------------------------------------------------------------

describe('computeDiff', () => {
  it('returns empty array when both inputs are undefined', () => {
    expect(computeDiff(undefined, undefined)).toEqual([]);
  });

  it('returns all fields as additions when before is undefined', () => {
    const after = { name: 'Smith', value: 100 };
    const diffs = computeDiff(undefined, after);
    expect(diffs).toHaveLength(2);
    expect(diffs).toContainEqual({ field: 'name', before: undefined, after: 'Smith' });
    expect(diffs).toContainEqual({ field: 'value', before: undefined, after: 100 });
  });

  it('returns all fields as removals when after is undefined', () => {
    const before = { name: 'Smith' };
    const diffs = computeDiff(before, undefined);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({ field: 'name', before: 'Smith', after: undefined });
  });

  it('detects changed fields', () => {
    const before = { name: 'Smith', value: 100 };
    const after = { name: 'Smith', value: 200 };
    const diffs = computeDiff(before, after);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({ field: 'value', before: 100, after: 200 });
  });

  it('detects added fields', () => {
    const before = { name: 'Smith' };
    const after = { name: 'Smith', value: 200 };
    const diffs = computeDiff(before, after);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({ field: 'value', before: undefined, after: 200 });
  });

  it('detects removed fields', () => {
    const before = { name: 'Smith', value: 100 };
    const after = { name: 'Smith' };
    const diffs = computeDiff(before, after);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({ field: 'value', before: 100, after: undefined });
  });

  it('returns empty when objects are equal', () => {
    const obj = { a: 1, b: 'two' };
    expect(computeDiff(obj, { ...obj })).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// emitTraceEvent
// ---------------------------------------------------------------------------

describe('emitTraceEvent', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    initTraceContext('benton', 'testuser');
  });

  it('fires a POST to /api/trace/events without blocking', () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());

    emitTraceEvent('update', 'parcel', 'P001', { value: 100 }, { value: 200 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/trace/events');
    expect(opts?.method).toBe('POST');

    const body = JSON.parse(opts?.body as string);
    expect(body.action).toBe('update');
    expect(body.entityType).toBe('parcel');
    expect(body.entityId).toBe('P001');
    expect(body.countyId).toBe('benton');
    expect(body.actor).toBe('testuser');
    expect(body.diffs).toHaveLength(1);
  });

  it('swallows fetch errors silently', () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    // Should not throw
    expect(() => {
      emitTraceEvent('delete', 'parcel', 'P002');
    }).not.toThrow();
  });
});
