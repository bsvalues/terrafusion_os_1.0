import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Database, Cog, TestTube, Rocket  } from '@mui/icons-material'

export function TechnicalWorkflow() {
  const steps = [
    {
      step: "Data Extraction",
      icon: Database,
      duration: "4-6 hours",
      status: "Automated",
      description: "Extract all parcel data, assessments, and metadata from existing systems",
    },
    {
      step: "Data Transformation",
      icon: Cog,
      duration: "8-12 hours",
      status: "Automated",
      description: "Transform data to Terrafusion format, validate integrity, apply business rules",
    },
    {
      step: "System Testing",
      icon: TestTube,
      duration: "4-8 hours",
      status: "Automated",
      description: "Comprehensive testing of all functions, performance validation, user acceptance",
    },
    {
      step: "Go-Live Deployment",
      icon: Rocket,
      duration: "2-4 hours",
      status: "Monitored",
      description: "Final cutover, DNS updates, user notifications, success verification",
    },
  ]

  return (
    <Card className="bg-dark-800/50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-white">Technical Migration Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step /* , index */) => (
            <div key={index} className="relative">
              <div className="flex items-center gap-4 p-4 bg-dark-700/30 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-lg"><>

                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <div
</> className="flex-1">
                  <div className="flex items-center justify-between mb-2"><>

                    <h3 className="text-white font-semibold">{step.step}</h3>
                    <div
</> className="flex items-center gap-2"><>

                      <Badge variant="secondary" className="bg-accent/20 text-accent">
                        {step.status}
                      </Badge>
                      <span
</> className="text-sm text-gray-400">{step.duration}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
