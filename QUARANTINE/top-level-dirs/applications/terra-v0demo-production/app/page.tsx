"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain,
  Zap,
  Shield,
  Globe,
  Rocket,
  Star,
  TrendingUp,
  Users,
  Building,
  MapPin,
  Activity,
  CheckCircle,
  Warning,
  Clock,
  Target,
  Cpu,
  Database,
  Eye,
  Smartphone,
 } from '@mui/icons-material'

export default function TerraFusionDashboard() {
  const [selectedMetric, setSelectedMetric] = useState("overview")

  // System metrics with safe defaults
  const systemMetrics = {
    totalCounties: 9,
    totalParcels: 2847392,
    totalValue: 847392000000,
    systemHealth: 94.7,
    aiAccuracy: 96.1,
    userSatisfaction: 98.3,
    uptime: 99.9,
    processingSpeed: 1.2,
  }

  const recentAchievements = [
    {
      title: "West Coast Expansion Activated",
      description: "9 new counties targeted across CA, OR, NV",
      impact: "$11.3M contract pipeline",
      date: "2025-01-10",
      status: "active",
    },
    {
      title: "MasterEnsemble Ultra AI Deployed",
      description: "96.1% accuracy achieved in property valuation",
      impact: "40% improvement in assessment precision",
      date: "2025-01-09",
      status: "completed",
    },
    {
      title: "AR Field Assessment Launched",
      description: "Augmented reality mobile app for field assessors",
      impact: "75% reduction in assessment time",
      date: "2025-01-08",
      status: "active",
    },
    {
      title: "Satellite Integration Active",
      description: "Real-time property change detection from space",
      impact: "$2.1M in detected property improvements",
      date: "2025-01-07",
      status: "active",
    },
  ]

  const platformFeatures = [
    {
      category: "AI & Machine Learning",
      icon: Brain,
      features: [
        "Computer Vision Property Analysis",
        "Satellite Imagery Integration",
        "Predictive Market Modeling",
        "Multi-modal AI Fusion",
      ],
      status: "operational",
      accuracy: 96.1,
    },
    {
      category: "Mobile & Field",
      icon: Smartphone,
      features: ["AR Field Assessment", "Voice Documentation", "Offline Synchronization", "Real-time Collaboration"],
      status: "operational",
      accuracy: 94.8,
    },
    {
      category: "Infrastructure",
      icon: Zap,
      features: ["Edge Computing", "Advanced Caching", "Real-time Processing", "Auto-scaling"],
      status: "operational",
      accuracy: 99.2,
    },
    {
      category: "Security",
      icon: Shield,
      features: ["Zero-Trust Framework", "Behavioral Analytics", "Quantum Encryption", "Threat Detection"],
      status: "operational",
      accuracy: 98.7,
    },
  ]

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount.toLocaleString()}`
  }

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || ""
    switch (statusLower) {
      case "operational":
      case "active":
      case "completed":
        return "bg-green-100 text-green-800"
      case "warning":
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "critical":
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    const statusLower = status?.toLowerCase() || ""
    switch (statusLower) {
      case "operational":
      case "active":
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "warning":
      case "pending":
        return <Clock className="h-4 w-4" />
      case "critical":
      case "error":
        return <Warning className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"><>

              <Brain className="h-8 w-8 text-white" />
            </div>
            <div
</> className="text-left"><>

              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TerraFusionAssessor-1
              </h1>
              <p
</> className="text-xl text-gray-600">Civil Infrastructure Brain • ICSF Secure Kernel</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="text-center"><>

              <div className="text-3xl font-bold text-blue-600">{systemMetrics.totalCounties}</div>
              <div
</> className="text-sm text-gray-600">Counties Deployed</div>
            </div>
            <div className="text-center"><>

              <div className="text-3xl font-bold text-green-600">
                {(systemMetrics.totalParcels / 1000000).toFixed(1)}M
              </div>
              <div
</> className="text-sm text-gray-600">Properties Managed</div>
            </div>
            <div className="text-center"><>

              <div className="text-3xl font-bold text-purple-600">{formatCurrency(systemMetrics.totalValue)}</div>
              <div
</> className="text-sm text-gray-600">Total Value</div>
            </div>
            <div className="text-center"><>

              <div className="text-3xl font-bold text-orange-600">{systemMetrics.systemHealth}%</div>
              <div
</> className="text-sm text-gray-600">System Health</div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><>

              <CheckCircle className="h-6 w-6 text-green-600" />
              System Status: OPERATIONAL EXCELLENCE
            </CardTitle>
            <CardDescription
</>>
              All systems performing above expected levels • Ready for Phase 3 expansion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center"><>

                <div className="text-2xl font-bold text-green-600">{systemMetrics.aiAccuracy}%</div>
                <div
</> className="text-sm text-gray-600">AI Accuracy</div>
              </div>
              <div className="text-center"><>

                <div className="text-2xl font-bold text-blue-600">{systemMetrics.userSatisfaction}%</div>
                <div
</> className="text-sm text-gray-600">User Satisfaction</div>
              </div>
              <div className="text-center"><>

                <div className="text-2xl font-bold text-purple-600">{systemMetrics.uptime}%</div>
                <div
</> className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center"><>

                <div className="text-2xl font-bold text-orange-600">{systemMetrics.processingSpeed}s</div>
                <div
</> className="text-sm text-gray-600">Avg Response</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3"><>

              <Star className="h-6 w-6 text-yellow-500" />
              Recent Achievements
            </CardTitle>
            <CardDescription
</>>Latest milestones and system improvements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAchievements.map((achievement /* , index */) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg"><>

                  <div className="mt-1">{getStatusIcon(achievement.status)}</div>
                  <div
</> className="flex-1">
                    <div className="flex items-center justify-between mb-2"><>

                      <h4 className="font-semibold">{achievement.title}</h4>
                      <div
</> className="flex items-center gap-2"><>

                        <Badge className={getStatusColor(achievement.status)}>
                          {achievement.status?.toUpperCase() || "UNKNOWN"}
                        </Badge>
                        <span
</> className="text-sm text-gray-500">{new Date(achievement.date).toLocaleDateString()}</span>
                      </div>
                    </div><>

                    <p className="text-sm text-gray-700 mb-2">{achievement.description}</p>
                    <div
</> className="text-sm font-medium text-blue-600">{achievement.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Features */}
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="w-full">
          <TabsList className="grid w-full grid-cols-4"><>

            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger
</> value="ai">AI Systems</TabsTrigger><>

            <TabsTrigger value="mobile">Mobile Tech</TabsTrigger>
            <TabsTrigger
</> value="infrastructure">Infrastructure</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {platformFeatures.map((feature /* , index */) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3"><>

                      <feature.icon className="h-6 w-6" />
                      {feature.category}
                    </CardTitle>
                    <CardDescription
</>>
                      <Badge className={getStatusColor(feature.status)}>
                        {feature.status?.toUpperCase() || "UNKNOWN"}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center"><>

                        <div className="text-2xl font-bold text-green-600">{feature.accuracy}%</div>
                        <div
</> className="text-sm text-gray-600">Performance Score</div><>

                        <Progress value={feature.accuracy} className="mt-2" />
                      </div>
                      <div
</>><>

                        <div className="text-sm font-medium mb-2">Key Features:</div>
                        <ul
</> className="text-sm space-y-1">
                          {feature.features.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Computer Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center"><>

                    <div className="text-3xl font-bold text-purple-600">94.7%</div>
                    <div
</> className="text-sm text-gray-600">Accuracy Rate</div>
                    <div className="mt-2 text-xs text-gray-500">1,247 images analyzed today</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Satellite AI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center"><>

                    <div className="text-3xl font-bold text-blue-600">96.1%</div>
                    <div
</> className="text-sm text-gray-600">Detection Rate</div>
                    <div className="mt-2 text-xs text-gray-500">23 changes detected today</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Predictive Models
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center"><>

                    <div className="text-3xl font-bold text-green-600">92.3%</div>
                    <div
</> className="text-sm text-gray-600">Forecast Accuracy</div>
                    <div className="mt-2 text-xs text-gray-500">$2.1M savings identified</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    AR Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center"><>

                      <div className="text-2xl font-bold text-purple-600">98.2%</div>
                      <div
</> className="text-sm text-gray-600">Measurement Accuracy</div>
                    </div>
                    <div className="text-sm"><>

                      <div className="font-medium mb-1">Active Features:</div>
                      <ul
</> className="space-y-1"><>

                        <li>• 3D Property Scanning</li>
                            <li
</>>• Real-time Measurements</li><>

                        <li>• Spatial Annotations</li>
                            <li
</>>• Damage Detection</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Voice Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center"><>

                      <div className="text-2xl font-bold text-green-600">94.2%</div>
                      <div
</> className="text-sm text-gray-600">Transcription Accuracy</div>
                    </div>
                    <div className="text-sm"><>

                      <div className="font-medium mb-1">Capabilities:</div>
                      <ul
</> className="space-y-1"><>

                        <li>• Real-time Speech-to-Text</li>
                            <li
</>>• Auto-categorization</li><>

                        <li>• Voice Commands</li>
                            <li
</>>• Offline Processing</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5" />
                    Edge Computing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center"><>

                    <div className="text-3xl font-bold text-blue-600">1.2s</div>
                    <div
</> className="text-sm text-gray-600">Avg Response Time</div>
                    <div className="mt-2 text-xs text-gray-500">47ms edge latency</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Processing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center"><>

                    <div className="text-3xl font-bold text-purple-600">1,250</div>
                    <div
</> className="text-sm text-gray-600">Parcels/min</div>
                    <div className="mt-2 text-xs text-gray-500">Real-time processing</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center"><>

                    <div className="text-3xl font-bold text-green-600">98.7%</div>
                    <div
</> className="text-sm text-gray-600">Security Rating</div>
                    <div className="mt-2 text-xs text-gray-500">Zero-trust framework</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Rocket className="h-6 w-6 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 flex flex-col items-center justify-center gap-2">
                <MapPin className="h-6 w-6" />
                <span className="text-sm">View Map</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Building className="h-6 w-6" />
                <span className="text-sm">Properties</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Analytics</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Multi-County</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
