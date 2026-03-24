import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePacsStatus } from '../../hooks/usePacsStatus'
import { DAIS_REFRESH } from '../../config/daisRefresh.config'

const ok = { contractValid: true, healthCheckExecution: 'passed', latencyMs: 120, lastVerifiedUtc: '2026-03-22T03:00:00Z' }

function mockFetch(response: object | null, fail = false) {
  if (fail) return vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true, json: async () => response,
  } as Response)
}

describe('usePacsStatus', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

  it('starts with isLoading:true and source:unavailable', () => {
    mockFetch(ok)
    const { result } = renderHook(() => usePacsStatus())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.source).toBe('unavailable')
    expect(result.current.data).toBeNull()
  })

  it('sets source:polled and stamps lastUpdated on success', async () => {
    mockFetch(ok)
    const { result } = renderHook(() => usePacsStatus())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.source).toBe('polled')
    expect(result.current.data?.contractValid).toBe(true)
    expect(result.current.data?.reachable).toBe(true)
    expect(result.current.lastUpdated).toBeTypeOf('number')
    expect(result.current.isStale).toBe(false)
  })

  it('sets source:unavailable on first-load failure', async () => {
    mockFetch(null, true)
    const { result } = renderHook(() => usePacsStatus())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.source).toBe('unavailable')
    expect(result.current.data).toBeNull()
    expect(result.current.error).toContain('Network error')
  })

  it('sets source:fallback and preserves data on poll failure after success', async () => {
    const spy = vi.spyOn(global, 'fetch')
    spy.mockResolvedValueOnce({ ok: true, json: async () => ok } as Response)
    spy.mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => usePacsStatus())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.source).toBe('polled')
    await act(async () => {
      vi.advanceTimersByTime(DAIS_REFRESH.pacsStatusMs)
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.source).toBe('fallback')
    expect(result.current.data?.contractValid).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it('does not set isLoading:true on re-poll when prior data exists', async () => {
    mockFetch(ok)
    const { result } = renderHook(() => usePacsStatus())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.source).toBe('polled')
    await act(async () => {
      vi.advanceTimersByTime(DAIS_REFRESH.pacsStatusMs)
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).not.toBeNull()
  })

  it('sets isStale:true after pacsStaleAfterMs elapses in fallback', async () => {
    const spy = vi.spyOn(global, 'fetch')
    spy.mockResolvedValueOnce({ ok: true, json: async () => ok } as Response)
    spy.mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => usePacsStatus())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.source).toBe('polled')
    await act(async () => {
      vi.advanceTimersByTime(DAIS_REFRESH.pacsStaleAfterMs + DAIS_REFRESH.pacsStatusMs)
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(result.current.isStale).toBe(true)
    expect(result.current.source).toBe('fallback')
  })
})
