import { useState, useEffect, useRef } from 'react'
import type { FreshData } from '../lib/freshData'
import { DAIS_REFRESH } from '../config/daisRefresh.config'

export interface WorkloadSummary {
  totalParcels: number
  parcelsReviewed: number
  parcelsRemaining: number
  appraisersActive: number
  utilizationPct: number | null
}

const INITIAL: FreshData<WorkloadSummary> = {
  data: null, isLoading: true, error: null,
  lastUpdated: null, source: 'unavailable', isStale: false,
}

function computeIsStale(lastUpdated: number | null): boolean {
  if (lastUpdated === null) return false
  return Date.now() - lastUpdated > DAIS_REFRESH.workloadStaleAfterMs
}

async function fetchWorkload(): Promise<WorkloadSummary> {
  const res = await fetch('/api/dais/queue')
  if (!res.ok) throw new Error(`Workload fetch failed: ${res.status}`)
  const json = await res.json()
  return {
    totalParcels: json.totalParcels ?? 0,
    parcelsReviewed: json.parcelsReviewed ?? 0,
    parcelsRemaining: json.parcelsRemaining ?? 0,
    appraisersActive: json.appraisersActive ?? 0,
    utilizationPct: json.utilizationPct ?? null,
  }
}

export function useWorkloadSummary(): FreshData<WorkloadSummary> {
  const [state, setState] = useState<FreshData<WorkloadSummary>>(INITIAL)
  const lastUpdatedRef = useRef<number | null>(null)
  const lastDataRef = useRef<WorkloadSummary | null>(null)

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await fetchWorkload()
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

    poll()
    const id = setInterval(poll, DAIS_REFRESH.workloadMs)
    return () => clearInterval(id)
  }, [])

  return state
}
