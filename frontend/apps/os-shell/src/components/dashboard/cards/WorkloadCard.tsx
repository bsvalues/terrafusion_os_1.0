import { cn } from '@/lib/utils'
import type { FreshData } from '../../../lib/freshData'
import { canRender } from '../../../lib/freshData'
import type { WorkloadSummary } from '../../../hooks/useWorkloadSummary'

interface WorkloadCardProps {
  workload: FreshData<WorkloadSummary>
}

export function WorkloadCard({ workload }: WorkloadCardProps) {
  if (workload.source === 'unavailable') {
    return (
      <div className="rounded-lg border border-red-900/40 bg-terra-midnight p-4 flex flex-col gap-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Workload</p>
        <span className="text-xs text-red-400 font-medium">Unavailable</span>
      </div>
    )
  }

  if (!canRender(workload)) {
    return (
      <div className="rounded-lg border border-white/10 bg-terra-midnight p-4 animate-pulse">
        <div className="h-3 w-16 bg-white/10 rounded mb-2" />
        <div className="h-5 w-24 bg-white/10 rounded" />
      </div>
    )
  }

  const { data } = workload
  const pct = data ? Math.round((data.parcelsReviewed / Math.max(data.totalParcels, 1)) * 100) : 0

  return (
    <div className={cn(
      'rounded-lg border p-4 flex flex-col gap-1',
      workload.isStale ? 'border-amber-800/40 bg-terra-midnight' : 'border-white/10 bg-terra-midnight'
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Workload</p>
        {workload.source === 'fallback' && <span className="text-xs text-amber-400">Last known</span>}
        {workload.isStale && workload.source !== 'fallback' && <span className="text-xs text-amber-400">Stale</span>}
      </div>
      {data && (
        <>
          <p className="text-2xl font-bold text-white mt-1">{pct}%</p>
          <p className="text-xs text-gray-400">
            {data.parcelsReviewed.toLocaleString()} / {data.totalParcels.toLocaleString()} parcels
          </p>
          <p className="text-xs text-gray-500">{data.appraisersActive} appraisers active</p>
        </>
      )}
    </div>
  )
}
