import type { FreshData } from '../../lib/freshData'
import type { SwarmStatus } from '../../hooks/useSwarmLive'
import type { AssessmentSourceHealth } from '../../hooks/useAssessmentSourceStatus'
import type { AppealsQueueSummary } from '../../hooks/useAppealsQueue'
import type { WorkloadSummary } from '../../hooks/useWorkloadSummary'
import { SwarmStatusCard } from './cards/SwarmStatusCard'
import { AssessmentSourceStatusCard } from './cards/AssessmentSourceStatusCard'
import { AppealsQueueCard } from './cards/AppealsQueueCard'
import { WorkloadCard } from './cards/WorkloadCard'

/**
 * Props accept the new `assessmentSource` name (no-vendor-names rule) and
 * the legacy `pacs` name (callers and contract tests written before the
 * rename). Either one is valid; `assessmentSource` wins when both are
 * supplied.
 */
export interface MorningBriefingStripProps {
  swarm:             FreshData<SwarmStatus>
  assessmentSource?: FreshData<AssessmentSourceHealth>
  /** @deprecated Legacy alias for `assessmentSource`. */
  pacs?:             FreshData<AssessmentSourceHealth>
  appeals:           FreshData<AppealsQueueSummary>
  workload:          FreshData<WorkloadSummary>
}

export function MorningBriefingStrip({ swarm, assessmentSource, pacs, appeals, workload }: MorningBriefingStripProps) {
  const sourceFeed = assessmentSource ?? pacs
  if (!sourceFeed) {
    throw new Error('MorningBriefingStrip requires either `assessmentSource` or `pacs` prop.')
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="morning-briefing-strip">
      <SwarmStatusCard swarm={swarm} />
      <AssessmentSourceStatusCard assessmentSource={sourceFeed} />
      <AppealsQueueCard appeals={appeals} />
      <WorkloadCard workload={workload} />
    </div>
  )
}
