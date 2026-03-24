import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWorkloadSummary } from '../../hooks/useWorkloadSummary'
import { DAIS_REFRESH } from '../../config/daisRefresh.config'

const ok = { totalParcels: 89247, parcelsReviewed: 12000, parcelsRemaining: 77247, appraisersActive: 8, utilizationPct: 72 }

describe('useWorkloadSummary', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }) })
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

  it('starts with isLoading:true and source:unavailable', () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ok } as Response)
    const { result } = renderHook(() => useWorkloadSummary())
    expect(result.current.isLoading).toBe(true)
    expect(result.current.source).toBe('unavailable')
  })

  it('sets source:polled on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ok } as Response)
    const { result } = renderHook(() => useWorkloadSummary())
    await waitFor(() => expect(result.current.source).toBe('polled'), { timeout: 1000 })
    expect(result.current.data?.totalParcels).toBe(89247)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isStale).toBe(false)
  })

  it('sets source:unavailable on first-load failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useWorkloadSummary())
    await waitFor(() => expect(result.current.source).toBe('unavailable'), { timeout: 1000 })
    expect(result.current.data).toBeNull()
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 1000 })
  })

  it('sets source:fallback and preserves data on poll failure after success', async () => {
    const spy = vi.spyOn(global, 'fetch')
    spy.mockResolvedValueOnce({ ok: true, json: async () => ok } as Response)
    spy.mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useWorkloadSummary())
    await waitFor(() => expect(result.current.source).toBe('polled'), { timeout: 1000 })
    vi.advanceTimersByTime(DAIS_REFRESH.workloadMs)
    await waitFor(() => expect(result.current.source).toBe('fallback'), { timeout: 1000 })
    expect(result.current.data?.totalParcels).toBe(89247)
    expect(result.current.isLoading).toBe(false)
  })

  it('does not set isLoading:true on re-poll when prior data exists', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ok } as Response)
    const { result } = renderHook(() => useWorkloadSummary())
    await waitFor(() => expect(result.current.source).toBe('polled'), { timeout: 1000 })
    vi.advanceTimersByTime(DAIS_REFRESH.workloadMs)
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 1000 })
  })

  it('sets isStale:true after workloadStaleAfterMs elapses in fallback', async () => {
    const spy = vi.spyOn(global, 'fetch')
    spy.mockResolvedValueOnce({ ok: true, json: async () => ok } as Response)
    spy.mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useWorkloadSummary())
    await waitFor(() => expect(result.current.source).toBe('polled'), { timeout: 1000 })
    vi.advanceTimersByTime(DAIS_REFRESH.workloadStaleAfterMs + DAIS_REFRESH.workloadMs)
    await waitFor(() => expect(result.current.isStale).toBe(true), { timeout: 1000 })
  })
})
