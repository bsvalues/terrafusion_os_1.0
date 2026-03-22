import { useState, useEffect, useRef, useCallback } from 'react'
import * as signalR from '@microsoft/signalr'
import type { FreshData, SwarmConnectionState } from '../lib/freshData'
import { DAIS_REFRESH } from '../config/daisRefresh.config'

export interface SwarmStatus {
  connectionState: SwarmConnectionState
  totalAgents: number
  healthyAgents: number
  overallStatus: string
}

// Initial state: not loading (isLoading:false) so that a connection failure
// caught via .catch() can be distinguished from "still connecting".
// `isLoading:true` is never set; consumers see `source:'unavailable'` until
// a live message arrives. This matches the test contract for the unavailable case.
const INITIAL: FreshData<SwarmStatus> = {
  data: null, isLoading: false, error: null,
  lastUpdated: null, source: 'unavailable', isStale: false,
}

interface SwarmPayload { totalAgents: number; healthyAgents: number; overallStatus: string }

export function useSwarmLive(): FreshData<SwarmStatus> {
  const [state, setState] = useState<FreshData<SwarmStatus>>(INITIAL)
  const lastDataRef = useRef<SwarmStatus | null>(null)
  const lastUpdatedRef = useRef<number | null>(null)

  const handleMessage = useCallback((payload: SwarmPayload) => {
    const lastUpdated = Date.now()
    lastUpdatedRef.current = lastUpdated
    const data: SwarmStatus = { connectionState: 'connected', ...payload }
    lastDataRef.current = data
    setState({ data, isLoading: false, error: null, lastUpdated, source: 'live', isStale: false })
  }, [])

  const handleDisconnect = useCallback(() => {
    // Reset lastUpdated to null so isStale resolves true immediately
    lastUpdatedRef.current = null
    setState({
      data: lastDataRef.current,
      isLoading: false,
      error: 'Swarm hub disconnected',
      lastUpdated: null,
      source: lastDataRef.current !== null ? 'fallback' : 'unavailable',
      isStale: true,
    })
  }, [])

  useEffect(() => {
    const url = (import.meta.env.VITE_CONSCIOUSNESS_URL as string | undefined) ?? 'http://localhost:3004'
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${url}/hubs/swarm`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    conn.on('SwarmStatusUpdate', handleMessage as (payload: unknown) => void)
    conn.onreconnecting(() => {
      setState(prev => prev.data
        ? { ...prev, data: { ...prev.data, connectionState: 'connecting' } }
        : prev)
    })
    conn.onreconnected(() => {
      setState(prev => prev.data
        ? { ...prev, data: { ...prev.data, connectionState: 'connected' } }
        : prev)
    })
    conn.onclose(handleDisconnect)

    // Stale detection interval — marks isStale between messages.
    // Only fires when we are in a settled (non-loading) state to avoid
    // marking the initial loading state as stale before connection resolves.
    const staleId = setInterval(() => {
      setState(prev => {
        if (prev.isLoading) return prev
        const lu = lastUpdatedRef.current
        const nowStale = lu === null || Date.now() - lu > DAIS_REFRESH.swarmStaleAfterMs
        if (nowStale && !prev.isStale) return { ...prev, isStale: true }
        return prev
      })
    }, 1000)

    conn.start().catch(() => {
      setState({ data: null, isLoading: false, error: 'Failed to connect to swarm hub',
        lastUpdated: null, source: 'unavailable', isStale: false })
    })

    return () => {
      clearInterval(staleId)
      conn.stop()
    }
  }, [handleMessage, handleDisconnect])

  return state
}
