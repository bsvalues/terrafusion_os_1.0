import type { FreshData } from '../../lib/freshData'
import type { SwarmStatus } from '../../hooks/useSwarmLive'
import type { PacsHealth } from '../../hooks/usePacsStatus'
import type { AppealsQueueSummary } from '../../hooks/useAppealsQueue'
import type { WorkloadSummary } from '../../hooks/useWorkloadSummary'
import { SwarmStatusCard } from './cards/SwarmStatusCard'
import { PacsStatusCard } from './cards/PacsStatusCard'
import { AppealsQueueCard } from './cards/AppealsQueueCard'
import { WorkloadCard } from './cards/WorkloadCard'

export interface MorningBriefingStripProps {
  swarm:    FreshData<SwarmStatus>
  pacs:     FreshData<PacsHealth>
  appeals:  FreshData<AppealsQueueSummary>
  workload: FreshData<WorkloadSummary>
}

export function MorningBriefingStrip({ swarm, pacs, appeals, workload }: MorningBriefingStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="morning-briefing-strip">
      <SwarmStatusCard swarm={swarm} />
      <PacsStatusCard pacs={pacs} />
      <AppealsQueueCard appeals={appeals} />
      <WorkloadCard workload={workload} />
    </div>
  )
}
