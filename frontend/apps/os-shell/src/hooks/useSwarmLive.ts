import { useEffect, useRef, useState } from 'react'
import { useAuthContextOptional } from '../auth/useAuthContext'
import { getToken } from '../auth/authStorage'
import { getApiBase } from '../lib/apiBase'
import type { FreshData, SwarmConnectionState } from '../lib/freshData'
import { DAIS_REFRESH } from '../config/daisRefresh.config'

export interface SwarmStatus {
  connectionState: SwarmConnectionState
  countyId: string
  activeAgents: number
  swarmActivity: string
  accuracyScore: number
}

interface AssistantSwarmStatusResponse {
  countyId: string
  activeAgents: number
  swarmActivity: string
  accuracyScore: number
}

const INITIAL: FreshData<SwarmStatus> = {
  data: null, isLoading: false, error: null,
  lastUpdated: null, source: 'unavailable', isStale: false,
}

function parseSwarmPayload(payload: unknown): Omit<SwarmStatus, 'connectionState'> {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Governed swarm status response was not an object')
  }

  const data = payload as Partial<AssistantSwarmStatusResponse>
  if (
    typeof data.countyId !== 'string' ||
    typeof data.activeAgents !== 'number' ||
    typeof data.swarmActivity !== 'string' ||
    typeof data.accuracyScore !== 'number'
  ) {
    throw new Error('Governed swarm status response was missing required fields')
  }

  return {
    countyId: data.countyId,
    activeAgents: data.activeAgents,
    swarmActivity: data.swarmActivity,
    accuracyScore: data.accuracyScore,
  }
}

export function useSwarmLive(): FreshData<SwarmStatus> {
  const auth = useAuthContextOptional()
  const countyId = auth?.countyId ?? null
  const token = auth?.token ?? (typeof window !== 'undefined' ? getToken() : null)

  const [state, setState] = useState<FreshData<SwarmStatus>>(INITIAL)
  const lastDataRef = useRef<SwarmStatus | null>(null)
  const lastUpdatedRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!countyId || !token) {
      lastDataRef.current = null
      lastUpdatedRef.current = null
      setState({
        data: null,
        isLoading: false,
        error: 'Governed county swarm status requires an authenticated county session',
        lastUpdated: null,
        source: 'unavailable',
        isStale: false,
      })
      return () => { cancelled = true }
    }

    const fetchSwarmStatus = async () => {
      try {
        setState(prev => ({
          ...prev,
          isLoading: prev.data === null,
          error: null,
        }))

        const response = await fetch(
          `${getApiBase()}/AIAssistant/swarm-status/${encodeURIComponent(countyId)}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`Governed swarm status returned HTTP ${response.status}`)
        }

        const payload = await response.json()
        const parsed = parseSwarmPayload(payload)
        const lastUpdated = Date.now()
        const data: SwarmStatus = {
          connectionState: 'connected',
          ...parsed,
        }

        if (cancelled) return

        lastDataRef.current = data
        lastUpdatedRef.current = lastUpdated
        setState({
          data,
          isLoading: false,
          error: null,
          lastUpdated,
          source: 'polled',
          isStale: false,
        })
      } catch (error) {
        if (cancelled) return

        const message = error instanceof Error ? error.message : 'Failed to load governed swarm status'

        if (lastDataRef.current) {
          lastUpdatedRef.current = null
          setState({
            data: { ...lastDataRef.current, connectionState: 'degraded' },
            isLoading: false,
            error: message,
            lastUpdated: null,
            source: 'fallback',
            isStale: true,
          })
          return
        }

        setState({
          data: null,
          isLoading: false,
          error: message,
          lastUpdated: null,
          source: 'unavailable',
          isStale: false,
        })
      }
    }

    void fetchSwarmStatus()

    const pollId = window.setInterval(() => {
      void fetchSwarmStatus()
    }, DAIS_REFRESH.swarmMs)

    const staleId = window.setInterval(() => {
      setState(prev => {
        if (prev.isLoading) return prev
        const lu = lastUpdatedRef.current
        const nowStale = lu === null || Date.now() - lu > DAIS_REFRESH.swarmStaleAfterMs
        if (nowStale && !prev.isStale) return { ...prev, isStale: true }
        return prev
      })
    }, 1000)

    return () => {
      cancelled = true
      window.clearInterval(pollId)
      window.clearInterval(staleId)
    }
  }, [countyId, token])

  return state
}
