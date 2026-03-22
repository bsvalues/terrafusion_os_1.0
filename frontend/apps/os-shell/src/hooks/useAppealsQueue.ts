import { useState, useEffect, useRef } from 'react'
import type { FreshData } from '../lib/freshData'
import { DAIS_REFRESH } from '../config/daisRefresh.config'

export interface AppealsQueueSummary {
  total: number
  openCount: number
  pendingHearingCount: number
  closedThisCycleCount: number
}

const INITIAL: FreshData<AppealsQueueSummary> = {
  data: null, isLoading: true, error: null,
  lastUpdated: null, source: 'unavailable', isStale: false,
}

function computeIsStale(lastUpdated: number | null): boolean {
  if (lastUpdated === null) return false
  return Date.now() - lastUpdated > DAIS_REFRESH.appealsStaleAfterMs
}

async function fetchAppeals(): Promise<AppealsQueueSummary> {
  const res = await fetch('/api/dais/appeals')
  if (!res.ok) throw new Error(`Appeals fetch failed: ${res.status}`)
  const json = await res.json()
  // Normalize — adjust field names if the actual API shape differs
  return {
    total: json.total ?? json.length ?? 0,
    openCount: json.openCount ?? 0,
    pendingHearingCount: json.pendingHearingCount ?? 0,
    closedThisCycleCount: json.closedThisCycleCount ?? 0,
  }
}

export function useAppealsQueue(): FreshData<AppealsQueueSummary> {
  const [state, setState] = useState<FreshData<AppealsQueueSummary>>(INITIAL)
  const lastUpdatedRef = useRef<number | null>(null)
  const lastDataRef = useRef<AppealsQueueSummary | null>(null)
  const isInitialRef = useRef(true)

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await fetchAppeals()
        const lastUpdated = Date.now()
        lastUpdatedRef.current = lastUpdated
        lastDataRef.current = data
        setState({ data, isLoading: false, error: null, lastUpdated, source: 'polled', isStale: false })
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error'
        const lastUpdated = lastUpdatedRef.current
        if (lastDataRef.current !== null) {
          setState({ data: lastDataRef.current, isLoading: false, error: errMsg,
            lastUpdated, source: 'fallback', isStale: computeIsStale(lastUpdated) })
        } else {
          setState({ data: null, isLoading: false, error: errMsg,
            lastUpdated: null, source: 'unavailable', isStale: false })
        }
      }
    }

    if (isInitialRef.current) {
      isInitialRef.current = false
      poll()
    }

    const id = setInterval(poll, DAIS_REFRESH.appealsQueueMs)
    return () => clearInterval(id)
  }, [])

  return state
}
