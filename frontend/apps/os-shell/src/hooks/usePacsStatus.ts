import { useState, useEffect, useRef, useCallback } from 'react'
import type { FreshData } from '../lib/freshData'
import { DAIS_REFRESH } from '../config/daisRefresh.config'

export interface PacsHealth {
  contractValid: boolean
  reachable: boolean
  latencyMs: number | null
  lastProofUtc: string | null
}

const INITIAL: FreshData<PacsHealth> = {
  data: null,
  isLoading: true,
  error: null,
  lastUpdated: null,
  source: 'unavailable',
  isStale: false,
}

function computeIsStale(lastUpdated: number | null): boolean {
  if (lastUpdated === null) return false
  return Date.now() - lastUpdated > DAIS_REFRESH.pacsStaleAfterMs
}

async function fetchPacsHealth(): Promise<PacsHealth> {
  const res = await fetch('/ops/pacs/proof')
  if (!res.ok) throw new Error(`PACS probe failed: ${res.status}`)
  const json = await res.json()
  return {
    contractValid: json.contractValid ?? false,
    reachable: json.healthCheckExecution === 'passed',
    latencyMs: json.latencyMs ?? null,
    lastProofUtc: json.lastVerifiedUtc ?? null,
  }
}

export function usePacsStatus(): FreshData<PacsHealth> {
  const [state, setState] = useState<FreshData<PacsHealth>>(INITIAL)
  const lastUpdatedRef = useRef<number | null>(null)
  const lastDataRef = useRef<PacsHealth | null>(null)

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await fetchPacsHealth()
        const lastUpdated = Date.now()
        lastUpdatedRef.current = lastUpdated
        lastDataRef.current = data
        setState({
          data,
          isLoading: false,
          error: null,
          lastUpdated,
          source: 'polled',
          isStale: false,
        })
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error'
        const lastUpdated = lastUpdatedRef.current

        if (lastDataRef.current !== null) {
          // Keep prior data; do NOT set isLoading:true
          setState({
            data: lastDataRef.current,
            isLoading: false,
            error: errMsg,
            lastUpdated,
            source: 'fallback',
            isStale: computeIsStale(lastUpdated),
          })
        } else {
          setState({
            data: null,
            isLoading: false,
            error: errMsg,
            lastUpdated: null,
            source: 'unavailable',
            isStale: false,
          })
        }
      }
    }

    poll()
    const id = setInterval(poll, DAIS_REFRESH.pacsStatusMs)
    return () => clearInterval(id)
  }, [])

  return state
}
