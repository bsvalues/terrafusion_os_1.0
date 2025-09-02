import { MigrationAssessment } from "./migration-assessment"
import { TimelinePlanner } from "./timeline-planner"
import { ResourcePlanning } from "./resource-planning"
import { RiskAssessment } from "./risk-assessment"
import { TechnicalWorkflow } from "./technical-workflow"
import { TrainingSchedule } from "./training-schedule"

export function MigrationPlanningDashboard() {
  return (
    <div className="space-y-8">
      <MigrationAssessment />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TimelinePlanner /><>

        <ResourcePlanning />
      </div>
      <RiskAssessment
</>
/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TechnicalWorkflow />
        <TrainingSchedule />
      </div>
    </div>
  )
}
