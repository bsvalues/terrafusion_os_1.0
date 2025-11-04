"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, Warning, XCircle, Activity, Zap, Shield, Database, Users  } from '@mui/icons-material'

export default function SystemHealthDashboard() {
  const overallHealth = 94.7

  const systemComponents = [
    { name: "Core Platform", health: 99.6, status: "operational", issues: 0 },
    { name: "Multi-County Management", health: 99.8, status: "operational", issues: 0 },
    { name: "AI Features", health: 92.1, status: "operational", issues: 1 },
    { name: "Mobile Application", health: 98.9, status: "operational", issues: 0 },
    { name: "Integration Marketplace", health: 75.0, status: "partial", issues: 3 },
    { name: "White-Label Solutions", health: 96.2, status: "operational", issues: 0 },
    { name: "Certification Academy", health: 98.1, status: "operational", issues: 0 },
    { name: "Enterprise Support", health: 99.2, status: "operational", issues: 0 },
    { name: "Partner Program", health: 94.1, status: "operational", issues: 0 },
  ]

  const criticalMetrics = [
    { metric: "System Uptime", value: "99.7%", target: "99.5%", status: "good" },
    { metric: "Response Time", value: "1.2s", target: "<2s", status: "good" },
    { metric: "User Satisfaction", value: "96.8%", target: ">95%", status: "good" },
    { metric: "Security Score", value: "98.7%", target: ">95%", status: "good" },
    { metric: "Data Accuracy", value: "94.7%", target: ">94%", status: "good" },
    { metric: "Integration Success", value: "50%", target: "80%", status: "warning" },
  ]

  const activeIssues = [
    {
      severity: "medium",
      title: "MasterEnsemble Ultra Training",
      description: "AI model still in training phase",
      eta: "2 hours",
    },
    {
      severity: "low",
      title: "Integration Deployment",
      description: "3 integrations pending activation",
      eta: "1 week",
    },
    { severity: "low", title: "Training Centers", description: "4 centers under construction", eta: "3 months" },
  ]

  const getHealthColor = (health: number) => {
    if (health >= 95) return "text-green-600"
    if (health >= 90) return "text-yellow-600"
    return "text-red-600"
  }

  const getHealthIcon = (health: number) => {
    if (health >= 95) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (health >= 90) return <Warning className="h-4 w-4 text-yellow-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-green-100 text-green-800">OPERATIONAL</Badge>
      case "partial":
        return <Badge className="bg-yellow-100 text-yellow-800">PARTIAL</Badge>
      case "down":
        return <Badge className="bg-red-100 text-red-800">DOWN</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">UNKNOWN</Badge>
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "medium":
        return <Warning className="h-4 w-4 text-yellow-600" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4"><>

        <h1 className="text-4xl font-bold">System Health Dashboard</h1>
        <p
</> className="text-xl text-gray-600">Real-time monitoring of TerraFusionAssessor-1 platform status</p>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2"><>

              <Activity className="h-6 w-6" />
              Overall System Health
            </div>
            <div
</> className={`text-3xl font-bold ${getHealthColor(overallHealth)}`}>{overallHealth}%</div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallHealth} className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center"><>

              <div className="font-bold text-green-600">423,567</div>
              <div
</> className="text-gray-600">Properties Managed</div>
            </div>
            <div className="text-center"><>

              <div className="font-bold text-blue-600">282</div>
              <div
</> className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center"><>

              <div className="font-bold text-purple-600">9</div>
              <div
</> className="text-gray-600">Counties Deployed</div>
            </div>
            <div className="text-center"><>

              <div className="font-bold text-orange-600">99.7%</div>
              <div
</> className="text-gray-600">System Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><>

              <Database className="h-5 w-5" />
              System Components
            </CardTitle>
            <CardDescription
</>>Health status of all platform components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemComponents.map((component /* , index */) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getHealthIcon(component.health)}
                    <div><>

                      <div className="font-medium">{component.name}</div>
                      <div
</> className="text-sm text-gray-600">
                        {component.issues > 0 ? `${component.issues} issues` : "No issues"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getHealthColor(component.health)}`}>{component.health}%</div>
                    {getStatusBadge(component.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><>

              <Zap className="h-5 w-5" />
              Critical Metrics
            </CardTitle>
            <CardDescription
</>>Key performance indicators and targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalMetrics.map((metric /* , index */) => (
                <div key={index} className="flex items-center justify-between">
                  <div><>

                    <div className="font-medium">{metric.metric}</div>
                    <div
</> className="text-sm text-gray-600">Target: {metric.target}</div>
                  </div>
                  <div className="text-right"><>

                    <div className={`font-bold ${metric.status === "good" ? "text-green-600" : "text-yellow-600"}`}>
                      {metric.value}
                    </div>
                    <Badge
</>
                      className={
                        metric.status === "good" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {metric.status === "good" ? "ON TARGET" : "NEEDS ATTENTION"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><>

            <Shield className="h-5 w-5" />
            Active Issues & Recommendations
          </CardTitle>
          <CardDescription
</>>Current system issues and resolution timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeIssues.map((issue /* , index */) => (
              <Alert key={index}>
                {getSeverityIcon(issue.severity)}
                <AlertTitle className="flex items-center justify-between"><>

                  <span>{issue.title}</span>
                  <Badge
</> variant="outline">ETA: {issue.eta}</Badge>
                </AlertTitle>
                <AlertDescription>{issue.description}</AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Registration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><>

            <Users className="h-5 w-5" />
            Feature Registration Summary
          </CardTitle>
          <CardDescription
</>>Deployment status of all platform features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Core Platform</span>
                <Badge
</> className="bg-green-100 text-green-800">8/8 (100%)</Badge>
              </div><>

              <Progress value={100} />
            </div>
            <div
</> className="space-y-2">
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Multi-County</span>
                <Badge
</> className="bg-green-100 text-green-800">9/9 (100%)</Badge>
              </div><>

              <Progress value={100} />
            </div>
            <div
</> className="space-y-2">
              <div className="flex items-center justify-between"><>

                <span className="text-sm">AI Features</span>
                <Badge
</> className="bg-yellow-100 text-yellow-800">5/6 (83%)</Badge>
              </div><>

              <Progress value={83} />
            </div>
            <div
</> className="space-y-2">
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Mobile App</span>
                <Badge
</> className="bg-green-100 text-green-800">OPERATIONAL</Badge>
              </div><>

              <Progress value={100} />
            </div>
            <div
</> className="space-y-2">
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Integrations</span>
                <Badge
</> className="bg-yellow-100 text-yellow-800">3/6 (50%)</Badge>
              </div><>

              <Progress value={50} />
            </div>
            <div
</> className="space-y-2">
              <div className="flex items-center justify-between"><>

                <span className="text-sm">White-Label</span>
                <Badge
</> className="bg-green-100 text-green-800">OPERATIONAL</Badge>
              </div>
              <Progress value={100} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status Summary */}
      <Alert>
        <CheckCircle className="h-4 w-4" /><>

        <AlertTitle>System Status: OPERATIONAL</AlertTitle>
        <AlertDescription
</>>
          TerraFusionAssessor-1 is operating at 94.7% system health with all critical features functional. Minor
          optimization opportunities identified in integration deployment and AI model training completion. System is
          performing ABOVE expected levels in most areas and ready for next phase expansion.
        </AlertDescription>
      </Alert>
    </div>
  )
}
