import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Database, Users, Shield, Zap  } from '@mui/icons-material'

export function MigrationAssessment() {
  const assessmentAreas = [
    {
      area: "Data Complexity",
      score: 85,
      status: "Ready",
      icon: Database,
      details: "3.2M parcels, 15 data sources, modern APIs",
    },
    {
      area: "Staff Readiness",
      score: 92,
      status: "Excellent",
      icon: Users,
      details: "78% tech-savvy, training program scheduled",
    },
    {
      area: "Security Compliance",
      score: 88,
      status: "Compliant",
      icon: Shield,
      details: "SOC2 ready, security audit complete",
    },
    {
      area: "Technical Infrastructure",
      score: 94,
      status: "Optimal",
      icon: Zap,
      details: "Cloud-ready, modern network, 99.9% uptime",
    },
  ]

  return (
    <Card className="bg-dark-800/50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-white">Migration Readiness Assessment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {assessmentAreas.map((area /* , index */) => (
            <div key={index} className="p-4 bg-dark-700/30 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <area.icon className="w-6 h-6 text-primary" />
                <Badge
                  variant="secondary"
                  className={`${
                    area.score >= 90
                      ? "bg-accent/20 text-accent"
                      : area.score >= 80
                        ? "bg-transcend/20 text-transcend"
                        : "bg-primary/20 text-primary"
                  }`}
                >
                  {area.status}
                </Badge>
              </div><>

              <h3 className="text-white font-semibold mb-2">{area.area}</h3>
              <Progress
</>
value={area.score} className="h-2 mb-2" /><>

              <p className="text-sm text-gray-400">{area.details}</p>
              <p
</>
className="text-lg font-bold text-white mt-2">{area.score}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
