import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSwarmLive } from '../../hooks/useSwarmLive'
import { DAIS_REFRESH } from '../../config/daisRefresh.config'

// Captured callbacks from mock
let onHandlers: Record<string, (payload: unknown) => void> = {}
let closeCb: (() => void) | null = null
let reconnectingCb: (() => void) | null = null
let reconnectedCb: (() => void) | null = null
let startResolve: (() => void) | null = null
let startReject: ((e: Error) => void) | null = null

const mockConnection = {
  on: vi.fn((event: string, cb: (payload: unknown) => void) => {
    onHandlers[event] = cb
  }),
  onclose: vi.fn((cb: () => void) => { closeCb = cb }),
  onreconnecting: vi.fn((cb: () => void) => { reconnectingCb = cb }),
  onreconnected: vi.fn((cb: () => void) => { reconnectedCb = cb }),
  start: vi.fn(() => new Promise<void>((res, rej) => { startResolve = res; startReject = rej })),
  stop: vi.fn().mockResolvedValue(undefined),
}

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: vi.fn(() => ({
    withUrl: vi.fn().mockReturnThis(),
    withAutomaticReconnect: vi.fn().mockReturnThis(),
    configureLogging: vi.fn().mockReturnThis(),
    build: vi.fn(() => mockConnection),
  })),
  LogLevel: { Warning: 1 },
}))

describe('useSwarmLive', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    onHandlers = {}; closeCb = null; reconnectingCb = null
    reconnectedCb = null; startResolve = null; startReject = null
    vi.clearAllMocks()
    mockConnection.on.mockImplementation((event, cb) => { onHandlers[event] = cb })
    mockConnection.onclose.mockImplementation(cb => { closeCb = cb })
    mockConnection.onreconnecting.mockImplementation(cb => { reconnectingCb = cb })
    mockConnection.onreconnected.mockImplementation(cb => { reconnectedCb = cb })
    mockConnection.start.mockImplementation(() =>
      new Promise<void>((res, rej) => { startResolve = res; startReject = rej }))
  })
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

  it('sets source:live and stamps lastUpdated on SwarmStatusUpdate message', async () => {
    const { result } = renderHook(() => useSwarmLive())
    act(() => { startResolve?.() })
    act(() => {
      onHandlers['SwarmStatusUpdate']?.({
        totalAgents: 2016, healthyAgents: 1980, overallStatus: 'degraded'
      })
    })
    await waitFor(() => expect(result.current.source).toBe('live'))
    expect(result.current.data?.totalAgents).toBe(2016)
    expect(result.current.data?.connectionState).toBe('connected')
    expect(result.current.lastUpdated).toBeTypeOf('number')
    expect(result.current.isStale).toBe(false)
  })

  it('sets isStale:true after swarmStaleAfterMs with no new message', async () => {
    const { result } = renderHook(() => useSwarmLive())
    act(() => { startResolve?.() })
    act(() => {
      onHandlers['SwarmStatusUpdate']?.({
        totalAgents: 2016, healthyAgents: 1980, overallStatus: 'degraded'
      })
    })
    await waitFor(() => expect(result.current.source).toBe('live'))
    act(() => { vi.advanceTimersByTime(DAIS_REFRESH.swarmStaleAfterMs + 1000) })
    await waitFor(() => expect(result.current.isStale).toBe(true))
  })

  it('sets source:fallback and isStale:true on disconnect with prior data', async () => {
    const { result } = renderHook(() => useSwarmLive())
    act(() => { startResolve?.() })
    act(() => {
      onHandlers['SwarmStatusUpdate']?.({
        totalAgents: 2016, healthyAgents: 1980, overallStatus: 'degraded'
      })
    })
    await waitFor(() => expect(result.current.source).toBe('live'))
    act(() => { closeCb?.() })
    await waitFor(() => expect(result.current.source).toBe('fallback'))
    expect(result.current.isStale).toBe(true)
    expect(result.current.lastUpdated).toBeNull()  // spec: reset to null on disconnect so isStale is immediately true
    expect(result.current.data?.totalAgents).toBe(2016)
    expect(result.current.isLoading).toBe(false)
  })

  it('sets source:unavailable when connection fails before any data', async () => {
    const { result } = renderHook(() => useSwarmLive())
    act(() => { startReject?.(new Error('connection refused')) })
    await waitFor(() => expect(result.current.source).toBe('unavailable'))
    expect(result.current.data).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('clears isStale and sets source:live after reconnect delivers a new message', async () => {
    const { result } = renderHook(() => useSwarmLive())
    act(() => { startResolve?.() })
    act(() => { onHandlers['SwarmStatusUpdate']?.({ totalAgents: 2016, healthyAgents: 1980, overallStatus: 'degraded' }) })
    await waitFor(() => expect(result.current.source).toBe('live'))
    act(() => { closeCb?.() })
    await waitFor(() => expect(result.current.source).toBe('fallback'))
    // Reconnect delivers new message
    act(() => { onHandlers['SwarmStatusUpdate']?.({ totalAgents: 2016, healthyAgents: 1980, overallStatus: 'healthy' }) })
    await waitFor(() => expect(result.current.source).toBe('live'))
    expect(result.current.isStale).toBe(false)
  })
})
