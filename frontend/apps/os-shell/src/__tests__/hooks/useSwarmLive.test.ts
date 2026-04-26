import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSwarmLive } from '../../hooks/useSwarmLive'
import { DAIS_REFRESH } from '../../config/daisRefresh.config'

const fetchMock = vi.fn()

vi.mock('../../auth/useAuthContext', () => ({
  useAuthContextOptional: () => ({
    countyId: 'benton',
    token: 'test-token',
    isAuthenticated: true,
    userId: 'test-user',
    roles: ['assessor'],
  }),
}))

vi.mock('../../auth/authStorage', () => ({
  getToken: () => 'test-token',
}))

describe('useSwarmLive', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.clearAllMocks()
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('sets source:polled and stamps lastUpdated on governed swarm status success', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        countyId: 'benton',
        activeAgents: 2016,
        swarmActivity: 'Medium',
        accuracyScore: 0.982,
      }),
    })

    const { result } = renderHook(() => useSwarmLive())

    await waitFor(() => expect(result.current.source).toBe('polled'), { timeout: 1000 })
    expect(result.current.data?.activeAgents).toBe(2016)
    expect(result.current.data?.connectionState).toBe('connected')
    expect(result.current.lastUpdated).toBeTypeOf('number')
    expect(result.current.isStale).toBe(false)
  })

  it('sets isStale:true after swarmStaleAfterMs with no new poll response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        countyId: 'benton',
        activeAgents: 2016,
        swarmActivity: 'Medium',
        accuracyScore: 0.982,
      }),
    })

    const { result } = renderHook(() => useSwarmLive())

    await waitFor(() => expect(result.current.source).toBe('polled'), { timeout: 1000 })
    act(() => { vi.advanceTimersByTime(DAIS_REFRESH.swarmStaleAfterMs + 1000) })
    await waitFor(() => expect(result.current.isStale).toBe(true), { timeout: 1000 })
  })

  it('sets source:fallback and isStale:true on poll failure with prior data', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          countyId: 'benton',
          activeAgents: 2016,
          swarmActivity: 'Medium',
          accuracyScore: 0.982,
        }),
      })
      .mockRejectedValueOnce(new Error('connection refused'))

    const { result } = renderHook(() => useSwarmLive())

    await waitFor(() => expect(result.current.source).toBe('polled'), { timeout: 1000 })

    act(() => { vi.advanceTimersByTime(DAIS_REFRESH.swarmMs + 1000) })

    await waitFor(() => expect(result.current.source).toBe('fallback'), { timeout: 1000 })
    expect(result.current.isStale).toBe(true)
    expect(result.current.lastUpdated).toBeNull()
    expect(result.current.data?.activeAgents).toBe(2016)
    expect(result.current.data?.connectionState).toBe('degraded')
    expect(result.current.isLoading).toBe(false)
  })

  it('sets source:unavailable when initial fetch fails before any data', async () => {
    fetchMock.mockRejectedValue(new Error('connection refused'))

    const { result } = renderHook(() => useSwarmLive())

    await waitFor(() => expect(result.current.source).toBe('unavailable'), { timeout: 1000 })
    expect(result.current.data).toBeNull()
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 1000 })
  })

  it('clears isStale and sets source:polled after a successful retry', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          countyId: 'benton',
          activeAgents: 2016,
          swarmActivity: 'Medium',
          accuracyScore: 0.982,
        }),
      })
      .mockRejectedValueOnce(new Error('connection refused'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          countyId: 'benton',
          activeAgents: 2024,
          swarmActivity: 'High',
          accuracyScore: 0.989,
        }),
      })

    const { result } = renderHook(() => useSwarmLive())

    await waitFor(() => expect(result.current.source).toBe('polled'), { timeout: 1000 })
    act(() => { vi.advanceTimersByTime(DAIS_REFRESH.swarmMs + 1000) })
    await waitFor(() => expect(result.current.source).toBe('fallback'), { timeout: 1000 })

    act(() => { vi.advanceTimersByTime(DAIS_REFRESH.swarmMs + 1000) })
    await waitFor(() => expect(result.current.source).toBe('polled'), { timeout: 1000 })
    expect(result.current.isStale).toBe(false)
    expect(result.current.data?.activeAgents).toBe(2024)
    expect(result.current.data?.connectionState).toBe('connected')
  })
})
