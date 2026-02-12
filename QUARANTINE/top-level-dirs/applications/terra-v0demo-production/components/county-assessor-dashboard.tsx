"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Building,
  Calculator,
  MapPin,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  Warning,
  CheckCircle,
  Home,
 } from '@mui/icons-material'

interface AssessmentMetrics {
  totalParcels: number
  totalAssessedValue: number
  averageAssessedValue: number
  pendingAppeals: number
  completedAssessments: number
  assessmentProgress: number
  taxRollDeadline: string
  daysUntilDeadline: number
}

interface PropertyAlert {
  id: string
  parcelId: string
  type: "appeal" | "exemption" | "review" | "deadline"
  priority: "high" | "medium" | "low"
  message: string
  dueDate: string
}

interface RecentActivity {
  id: string
  type: "assessment" | "appeal" | "exemption" | "sale"
  description: string
  timestamp: string
  user: string
}

export default function CountyAssessorDashboard() {
  const [metrics, setMetrics] = useState<AssessmentMetrics>({
    totalParcels: await DynamicPropertyService.GetPropertyCountAsync("benton"),
    totalAssessedValue: 12847392000,
    averageAssessedValue: 143890,
    pendingAppeals: 127,
    completedAssessments: 85623,
    assessmentProgress: 95.9,
    taxRollDeadline: "2025-05-31",
    daysUntilDeadline: 142,
  })

  const [alerts, setAlerts] = useState<PropertyAlert[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    const mockAlerts: PropertyAlert[] = [
      {
        id: "alert-001",
        parcelId: "362301-100045",
        type: "appeal",
        priority: "high",
        message: "Property appeal hearing scheduled for January 15, 2025",
        dueDate: "2025-01-15",
      },
      {
        id: "alert-002",
        parcelId: "362301-200078",
        type: "exemption",
        priority: "medium",
        message: "Senior exemption application requires review",
        dueDate: "2025-01-20",
      },
      {
        id: "alert-003",
        parcelId: "362301-150032",
        type: "review",
        priority: "medium",
        message: "Agricultural land use classification needs annual review",
        dueDate: "2025-01-25",
      },
    ]

    const mockActivity: RecentActivity[] = [
      {
        id: "act-001",
        type: "assessment",
        description: "Completed assessment for 123 Wine Country Rd - $485,000",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        user: "Sarah Johnson",
      },
      {
        id: "act-002",
        type: "sale",
        description: "New sale recorded: 456 River View Dr - $325,000",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user: "System Import",
      },
      {
        id: "act-003",
        type: "appeal",
        description: "Appeal filed for parcel 362301-100045",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        user: "Michael Chen",
      },
    ]

    setAlerts(mockAlerts)
    setRecentActivity(mockActivity)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "assessment":
        return <Calculator className="h-4 w-4" />
      case "appeal":
        return <FileText className="h-4 w-4" />
      case "exemption":
        return <CheckCircle className="h-4 w-4" />
      case "sale":
        return <DollarSign className="h-4 w-4" />
      default:
        return <Building className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
<>

            <h1 className="text-3xl font-bold text-gray-900">Benton County Assessor Dashboard</h1>
            <p
</> className="text-gray-600">Property Assessment & Tax Administration</p>
          </div>
          <div className="flex items-center gap-4">
<>

            <Badge className="bg-green-100 text-green-800">Assessment Progress: {metrics.assessmentProgress}%</Badge>
            <Badge
</> className="bg-blue-100 text-blue-800">
              <Calendar className="h-4 w-4 mr-1" />
              {metrics.daysUntilDeadline} days to tax roll deadline
            </Badge>
          </div>
        </div>

        {/* Critical Alerts */}
        {alerts.filter((alert) => alert.priority === "high").length > 0 && (
          <div className="space-y-2">
            {alerts
              .filter((alert) => alert.priority === "high")
              .map((alert) => (
                <Alert key={alert.id} className="border-l-4 border-red-500 bg-red-50">
                  <Warning className="h-4 w-4" />
                  <AlertTitle className="flex justify-between items-center">
<>

                    <span>High Priority: {alert.type.toUpperCase()}</span>
                    <Badge
</> className={getPriorityColor(alert.priority)}>{alert.priority.toUpperCase()}</Badge>
                  </AlertTitle>
                  <AlertDescription>
                    {alert.message}
                    <div className="text-xs text-gray-500 mt-1">
                      Parcel: {alert.parcelId} • Due: {new Date(alert.dueDate).toLocaleDateString()}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Building className="h-8 w-8 text-blue-600" />
                <div className="text-right">
<>

                  <div className="text-2xl font-bold">{metrics.totalParcels.toLocaleString()}</div>
                  <div
</> className="text-sm text-gray-600">Total Parcels</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="text-right">
<>

                  <div className="text-2xl font-bold">{formatCurrency(metrics.totalAssessedValue / 1000000)}M</div>
                  <div
</> className="text-sm text-gray-600">Total Assessed Value</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Calculator className="h-8 w-8 text-purple-600" />
                <div className="text-right">
<>

                  <div className="text-2xl font-bold">{formatCurrency(metrics.averageAssessedValue)}</div>
                  <div
</> className="text-sm text-gray-600">Average Assessment</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <FileText className="h-8 w-8 text-orange-600" />
                <div className="text-right">
<>

                  <div className="text-2xl font-bold">{metrics.pendingAppeals}</div>
                  <div
</> className="text-sm text-gray-600">Pending Appeals</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
<>

              <TrendingUp className="h-5 w-5" />
              2025 Assessment Progress
            </CardTitle>
            <CardDescription
</>>Current status of property assessments for tax year 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
<>

                <span className="text-sm font-medium">Completed Assessments</span>
                <span
</> className="text-sm text-gray-600">
                  {metrics.completedAssessments.toLocaleString()} / {metrics.totalParcels.toLocaleString()}
                </span>
              </div>
              <Progress value={metrics.assessmentProgress} className="h-3" />
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
<>

                  <div className="font-bold text-green-600">
                    {((metrics.completedAssessments / metrics.totalParcels) * 100).toFixed(1)}%
                  </div>
                  <div
</> className="text-gray-600">Residential</div>
                </div>
                <div className="text-center">
<>

                  <div className="font-bold text-blue-600">94.2%</div>
                  <div
</> className="text-gray-600">Commercial</div>
                </div>
                <div className="text-center">
<>

                  <div className="font-bold text-purple-600">97.8%</div>
                  <div
</> className="text-gray-600">Agricultural</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
<>

            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger
</> value="assessments">Assessments</TabsTrigger>
<>

            <TabsTrigger value="appeals">Appeals & Exemptions</TabsTrigger>
            <TabsTrigger
</> value="analytics">Market Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
<>

                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription
</>>Latest assessments, appeals, and system updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
<>

                        <div className="mt-1">{getActivityIcon(activity.type)}</div>
                        <div
</> className="flex-1">
<>

                          <div className="text-sm font-medium">{activity.description}</div>
                          <div
</> className="text-xs text-gray-500">
                            {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
<>

                  <CardTitle>Upcoming Deadlines</CardTitle>
                  <CardDescription
</>>Important dates and milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
<>

                        <div className="font-medium">Tax Roll Certification</div>
                        <div
</> className="text-sm text-gray-600">Submit final tax roll to state</div>
                      </div>
                      <div className="text-right">
<>

                        <div className="font-bold">May 31, 2025</div>
                        <div
</> className="text-sm text-orange-600">{metrics.daysUntilDeadline} days</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
<>

                        <div className="font-medium">Appeal Hearing Period</div>
                        <div
</> className="text-sm text-gray-600">Board of Equalization hearings</div>
                      </div>
                      <div className="text-right">
<>

                        <div className="font-bold">July 1-15, 2025</div>
                        <div
</> className="text-sm text-blue-600">183 days</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
<>

                        <div className="font-medium">Agricultural Land Review</div>
                        <div
</> className="text-sm text-gray-600">Annual agricultural classification review</div>
                      </div>
                      <div className="text-right">
<>

                        <div className="font-bold">March 1, 2025</div>
                        <div
</> className="text-sm text-green-600">51 days</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Residential Properties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
<>

                      <span>Total Parcels</span>
                      <span
</> className="font-bold">67,845</span>
                    </div>
                    <div className="flex justify-between">
<>

                      <span>Avg. Assessment</span>
                      <span
</> className="font-bold">$285,400</span>
                    </div>
                    <div className="flex justify-between">
<>

                      <span>Completed</span>
                      <span
</> className="font-bold text-green-600">95.8%</span>
                    </div>
                    <Progress value={95.8} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Commercial Properties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
<>

                      <span>Total Parcels</span>
                      <span
</> className="font-bold">12,847</span>
                    </div>
                    <div className="flex justify-between">
<>

                      <span>Avg. Assessment</span>
                      <span
</> className="font-bold">$485,200</span>
                    </div>
                    <div className="flex justify-between">
<>

                      <span>Completed</span>
                      <span
</> className="font-bold text-yellow-600">94.2%</span>
                    </div>
                    <Progress value={94.2} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Agricultural Land
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
<>

                      <span>Total Parcels</span>
                      <span
</> className="font-bold">8,555</span>
                    </div>
                    <div className="flex justify-between">
<>

                      <span>Avg. Assessment</span>
                      <span
</> className="font-bold">$125,800</span>
                    </div>
                    <div className="flex justify-between">
<>

                      <span>Completed</span>
                      <span
</> className="font-bold text-green-600">97.8%</span>
                    </div>
                    <Progress value={97.8} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appeals" className="space-y-4">
            <Card>
              <CardHeader>
<>

                <CardTitle>Active Appeals & Exemptions</CardTitle>
                <CardDescription
</>>Current appeals and exemption applications requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
<>

                        <div className="font-medium">Parcel {alert.parcelId}</div>
                        <div
</> className="text-sm text-gray-600">{alert.message}</div>
                      </div>
                      <div className="text-right">
<>

                        <Badge className={getPriorityColor(alert.priority)}>{alert.priority.toUpperCase()}</Badge>
                        <div
</> className="text-sm text-gray-500 mt-1">
                          Due: {new Date(alert.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
<>

                  <CardTitle>Market Trends</CardTitle>
                  <CardDescription
</>>Benton County property market analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
<>

                      <span>Median Home Value</span>
                      <span
</> className="font-bold text-green-600">$425,000 (+8.2%)</span>
                    </div>
                    <div className="flex justify-between items-center">
<>

                      <span>Commercial Sq Ft Value</span>
                      <span
</> className="font-bold text-blue-600">$185/sq ft (+5.1%)</span>
                    </div>
                    <div className="flex justify-between items-center">
<>

                      <span>Agricultural Land Value</span>
                      <span
</> className="font-bold text-purple-600">$12,500/acre (+3.8%)</span>
                    </div>
                    <div className="flex justify-between items-center">
<>

                      <span>Sales Volume (YTD)</span>
                      <span
</> className="font-bold">2,847 transactions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
<>

                  <CardTitle>Assessment Accuracy</CardTitle>
                  <CardDescription
</>>Ratio studies and assessment quality metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
<>

                      <span>Assessment Ratio</span>
                      <span
</> className="font-bold text-green-600">98.7%</span>
                    </div>
                    <div className="flex justify-between items-center">
<>

                      <span>Coefficient of Dispersion</span>
                      <span
</> className="font-bold text-green-600">8.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
<>

                      <span>Price-Related Differential</span>
                      <span
</> className="font-bold text-green-600">1.02</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-4">
                      All metrics within IAAO standards for assessment quality
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
