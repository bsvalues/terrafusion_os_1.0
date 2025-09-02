import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, Users, Clock, Video  } from '@mui/icons-material'

export function TrainingSchedule() {
  const trainingSessions = [
    {
      session: "Executive Overview",
      audience: "Leadership Team",
      duration: "1 hour",
      format: "Presentation",
      timing: "Week -2",
      icon: GraduationCap,
    },
    {
      session: "Administrator Training",
      audience: "IT Staff & Dept Heads",
      duration: "4 hours",
      format: "Hands-on Workshop",
      timing: "Week -1",
      icon: Users,
    },
    {
      session: "Power User Certification",
      audience: "Key Staff Members",
      duration: "6 hours",
      format: "Interactive Training",
      timing: "Migration Weekend",
      icon: Clock,
    },
    {
      session: "End User Orientation",
      audience: "All Staff",
      duration: "2 hours",
      format: "Video + Q&A",
      timing: "Week +1",
      icon: Video,
    },
  ]

  return (
    <Card className="bg-dark-800/50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Training Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {trainingSessions.map((session /* , index */) => (
          <div key={index} className="p-4 bg-dark-700/30 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <session.icon className="w-5 h-5 text-primary" />
                <h3 className="text-white font-semibold">{session.session}</h3>
              </div>
              <Badge variant="secondary" className="bg-transcend/20 text-transcend">
                {session.timing}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <div><>

                <span className="text-gray-400">Audience: </span>
                <span
</> className="text-white">{session.audience}</span>
              </div>
              <div><>

                <span className="text-gray-400">Duration: </span>
                <span
</> className="text-accent">{session.duration}</span>
              </div>
              <div><>

                <span className="text-gray-400">Format: </span>
                <span
</> className="text-gray-300">{session.format}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
