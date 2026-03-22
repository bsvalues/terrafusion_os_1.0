import { cn } from '@/lib/utils'
import type { FreshData } from '../../../lib/freshData'
import { canRender } from '../../../lib/freshData'
import type { PacsHealth } from '../../../hooks/usePacsStatus'

interface PacsStatusCardProps {
  pacs: FreshData<PacsHealth>
}

export function PacsStatusCard({ pacs }: PacsStatusCardProps) {
  if (pacs.source === 'unavailable') {
    return (
      <div className="rounded-lg border border-red-900/40 bg-terra-midnight p-4 flex flex-col gap-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">PACS</p>
        <span className="text-xs text-red-400 font-medium">Unavailable</span>
      </div>
    )
  }

  if (!canRender(pacs)) {
    return (
      <div className="rounded-lg border border-white/10 bg-terra-midnight p-4 animate-pulse">
        <div className="h-3 w-16 bg-white/10 rounded mb-2" />
        <div className="h-5 w-24 bg-white/10 rounded" />
      </div>
    )
  }

  const { data } = pacs

  return (
    <div className={cn(
      'rounded-lg border p-4 flex flex-col gap-1',
      pacs.isStale ? 'border-amber-800/40 bg-terra-midnight' : 'border-white/10 bg-terra-midnight'
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-wide">PACS</p>
        {pacs.source === 'fallback' && <span className="text-xs text-amber-400">Last known</span>}
        {pacs.isStale && pacs.source !== 'fallback' && <span className="text-xs text-amber-400">Stale</span>}
      </div>
      {data && (
        <>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'inline-block h-2 w-2 rounded-full',
              data.reachable ? 'bg-emerald-400' : 'bg-red-500'
            )} />
            <span className="text-sm font-medium text-white">
              {data.reachable ? 'Reachable' : 'Unreachable'}
            </span>
          </div>
          {data.contractValid
            ? <p className="text-xs text-emerald-400">Contract valid</p>
            : <p className="text-xs text-red-400">Contract invalid</p>}
          {data.latencyMs != null && (
            <p className="text-xs text-gray-500">{data.latencyMs}ms</p>
          )}
        </>
      )}
    </div>
  )
}
