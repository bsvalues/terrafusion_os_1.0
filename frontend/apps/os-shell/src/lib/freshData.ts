export type SwarmConnectionState = 'connecting' | 'connected' | 'degraded' | 'disconnected'

export interface FreshData<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  lastUpdated: number | null  // epoch ms
  source: 'live' | 'polled' | 'fallback' | 'unavailable'
  isStale: boolean
}

export const hasData = <T>(f: FreshData<T>): boolean => f.data !== null

// canRender: true when settled data is present and ready to display.
// For skeleton vs empty branching: (!hasData(f) && f.isLoading) → skeleton; source==='unavailable' → empty chip.
export const canRender = <T>(f: FreshData<T>): boolean => hasData(f) && !f.isLoading

// isFresh: false when stale or unavailable. Used by cards for source-badge rendering.
// Note: fallback with isStale===false is still isFresh (recent last-known data).
export const isFresh = <T>(f: FreshData<T>): boolean =>
  !f.isStale && f.source !== 'unavailable'

// showLiveBadge: SwarmStatusCard only. HTTP-polling cards never have source==='live'.
export const showLiveBadge = (
  f: FreshData<unknown>,
  conn?: SwarmConnectionState
): boolean => f.source === 'live' && conn === 'connected' && !f.isStale
