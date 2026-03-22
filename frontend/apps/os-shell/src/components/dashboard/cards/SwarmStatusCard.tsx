import { cn } from '@/lib/utils'
import type { FreshData, SwarmConnectionState } from '../../../lib/freshData'
import { canRender, showLiveBadge } from '../../../lib/freshData'
import type { SwarmStatus } from '../../../hooks/useSwarmLive'

interface SwarmStatusCardProps {
  swarm: FreshData<SwarmStatus>
}

function ConnectionPip({ state }: { state: SwarmConnectionState }) {
  const colors: Record<SwarmConnectionState, string> = {
    connected:    'bg-emerald-400',
    connecting:   'bg-amber-400 animate-pulse',
    degraded:     'bg-amber-500',
    disconnected: 'bg-red-500',
  }
  return <span className={cn('inline-block h-2 w-2 rounded-full mr-1', colors[state])} />
}

export function SwarmStatusCard({ swarm }: SwarmStatusCardProps) {
  // Priority 1: unavailable
  if (swarm.source === 'unavailable') {
    return (
      <div className="rounded-lg border border-red-900/40 bg-terra-midnight p-4 flex flex-col gap-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">AI Swarm</p>
        <span className="text-xs text-red-400 font-medium">Unavailable</span>
      </div>
    )
  }

  // Priority 2: first-load skeleton
  if (!canRender(swarm)) {
    return (
      <div className="rounded-lg border border-white/10 bg-terra-midnight p-4 animate-pulse">
        <div className="h-3 w-16 bg-white/10 rounded mb-2" />
        <div className="h-5 w-24 bg-white/10 rounded" />
      </div>
    )
  }

  const { data } = swarm
  const isLive = showLiveBadge(swarm, data?.connectionState)

  return (
    <div className={cn(
      'rounded-lg border p-4 flex flex-col gap-1',
      swarm.isStale ? 'border-amber-800/40 bg-terra-midnight' : 'border-white/10 bg-terra-midnight'
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-wide">AI Swarm</p>
        {swarm.source === 'fallback' && (
          <span className="text-xs text-amber-400">Last known</span>
        )}
        {swarm.isStale && swarm.source !== 'fallback' && (
          <span className="text-xs text-amber-400">Stale</span>
        )}
        {isLive && (
          <span className="text-xs text-emerald-400 flex items-center">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
            Live
          </span>
        )}
      </div>
      {data && (
        <>
          <div className="flex items-center gap-1 mt-1">
            <ConnectionPip state={data.connectionState} />
            <span className="text-sm font-medium text-white capitalize">{data.connectionState}</span>
          </div>
          <p className="text-xs text-gray-400">
            {data.healthyAgents.toLocaleString()} / {data.totalAgents.toLocaleString()} agents healthy
          </p>
          <p className="text-xs text-gray-500 capitalize">{data.overallStatus}</p>
        </>
      )}
    </div>
  )
}
