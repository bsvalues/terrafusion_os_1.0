import { describe, it, expect } from 'vitest'
import type { FreshData } from '../../lib/freshData'
import { hasData, canRender, isFresh, showLiveBadge } from '../../lib/freshData'

const base: FreshData<string> = {
  data: null, isLoading: false, error: null,
  lastUpdated: null, source: 'unavailable', isStale: false,
}

describe('hasData', () => {
  it('returns false when data is null', () => {
    expect(hasData({ ...base, data: null })).toBe(false)
  })
  it('returns true when data is present', () => {
    expect(hasData({ ...base, data: 'value' })).toBe(true)
  })
})

describe('canRender', () => {
  it('returns false when data is null', () => {
    expect(canRender({ ...base, data: null })).toBe(false)
  })
  it('returns false when isLoading even with data', () => {
    expect(canRender({ ...base, data: 'v', isLoading: true })).toBe(false)
  })
  it('returns true when data present and not loading', () => {
    expect(canRender({ ...base, data: 'v', isLoading: false })).toBe(true)
  })
})

describe('isFresh', () => {
  it('returns false when source is unavailable', () => {
    expect(isFresh({ ...base, source: 'unavailable', isStale: false })).toBe(false)
  })
  it('returns false when isStale is true', () => {
    expect(isFresh({ ...base, source: 'polled', data: 'v', isStale: true })).toBe(false)
  })
  it('returns true when polled and not stale', () => {
    expect(isFresh({ ...base, source: 'polled', data: 'v', isStale: false })).toBe(true)
  })
  it('returns true when fallback and not stale (recent fallback is still fresh)', () => {
    expect(isFresh({ ...base, source: 'fallback', data: 'v', isStale: false })).toBe(true)
  })
})

describe('showLiveBadge', () => {
  it('returns false when source is not live', () => {
    expect(showLiveBadge({ ...base, source: 'polled' }, 'connected')).toBe(false)
  })
  it('returns false when connectionState is not connected', () => {
    expect(showLiveBadge({ ...base, source: 'live', isStale: false }, 'degraded')).toBe(false)
  })
  it('returns false when isStale', () => {
    expect(showLiveBadge({ ...base, source: 'live', isStale: true }, 'connected')).toBe(false)
  })
  it('returns true when live, connected, and not stale', () => {
    expect(showLiveBadge({ ...base, source: 'live', isStale: false }, 'connected')).toBe(true)
  })
  it('returns false when conn is omitted (HTTP cards never pass conn)', () => {
    expect(showLiveBadge({ ...base, source: 'live', isStale: false })).toBe(false)
  })
})
