import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle  } from '@mui/icons-material'

export function TimelinePlanner() {
  const phases = [
    {
      phase: "Pre-Migration",
      duration: "Week -2 to -1",
      status: "Planning",
      tasks: [
        "Data assessment complete",
        "Staff training scheduled",
        "Backup systems verified",
        "Go-live date confirmed",
      ],
    },
    {
      phase: "Migration Weekend",
      duration: "Friday 6PM - Sunday 6PM",
      status: "Execution",
      tasks: [
        "Data extraction (Friday night)",
        "System transformation (Saturday)",
        "Testing & validation (Sunday AM)",
        "Go-live preparation (Sunday PM)",
      ],
    },
    {
      phase: "Post-Migration",
      duration: "Week +1 to +4",
      status: "Stabilization",
      tasks: [
        "User acceptance testing",
        "Performance optimization",
        "Staff support & training",
        "Success metrics review",
      ],
    },
  ]

  return (
    <Card className="bg-dark-800/50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Migration Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {phases.map((phase /* , index */) => (
          <div key={index} className="p-4 bg-dark-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-3"><>

              <h3 className="text-white font-semibold">{phase.phase}</h3>
              <Badge
</> variant="secondary" className="bg-primary/20 text-primary">
                {phase.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">{phase.duration}</span>
            </div>
            <ul className="space-y-2">
              {phase.tasks.map((task, taskIndex) => (
                <li key={taskIndex} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span className="text-gray-300">{task}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
