"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Brain,
  Zap,
  Droplets,
  Car,
  Building,
  Calendar,
  DollarSign,
  Clock,
 } from '@mui/icons-material'

interface PredictionData {
  id: string
  systemName: string
  systemType: "power" | "water" | "traffic" | "emergency"
  predictionType: string
  confidence: number
  predictedDate: string
  impact: "low" | "medium" | "high" | "critical"
  costSavings: number
  description: string
  recommendedAction: string
}

interface AnalyticsMetric {
  name: string
  value: string
  change: number
  trend: "up" | "down" | "stable"
  icon: any
}

export default function PredictiveAnalytics() {
  const [predictions, setPredictions] = useState<PredictionData[]>([])
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([])

  useEffect(() => {
    const mockPredictions: PredictionData[] = [
      {
        id: "pred-001",
        systemName: "Water Treatment Plant A",
        systemType: "water",
        predictionType: "Pump Failure",
        confidence: 87.5,
        predictedDate: "2025-01-25",
        impact: "high",
        costSavings: await DynamicPropertyService.GetPropertyCountAsync(countyCode),
        description: "Primary water pump showing signs of bearing wear and increased vibration",
        recommendedAction: "Schedule preventive maintenance within 14 days",
      },
      {
        id: "pred-002",
        systemName: "Manhattan Power Grid",
        systemType: "power",
        predictionType: "Load Optimization",
        confidence: 92.3,
        predictedDate: "2025-01-15",
        impact: "medium",
        costSavings: 12000,
        description: "Power distribution can be optimized during peak hours",
        recommendedAction: "Implement smart load balancing algorithm",
      },
      {
        id: "pred-003",
        systemName: "Traffic Control Hub",
        systemType: "traffic",
        predictionType: "Signal Malfunction",
        confidence: 76.8,
        predictedDate: "2025-02-08",
        impact: "medium",
        costSavings: 8500,
        description: "Traffic signal controller showing intermittent communication issues",
        recommendedAction: "Replace communication module before failure",
      },
      {
        id: "pred-004",
        systemName: "Emergency Response Network",
        systemType: "emergency",
        predictionType: "Capacity Optimization",
        confidence: 94.1,
        predictedDate: "2025-01-20",
        impact: "low",
        costSavings: 15000,
        description: "Response time can be improved by 15% with route optimization",
        recommendedAction: "Update emergency response routing algorithms",
      },
    ]

    const mockMetrics: AnalyticsMetric[] = [
      { name: "Prediction Accuracy", value: "94.2%", change: 2.1, trend: "up", icon: Brain },
      { name: "Cost Savings (Monthly)", value: "$127K", change: 8.5, trend: "up", icon: DollarSign },
      { name: "Prevented Failures", value: "23", change: -1, trend: "down", icon: CheckCircle },
      { name: "Avg Prediction Lead Time", value: "18 days", change: 3, trend: "up", icon: Clock },
    ]

    setPredictions(mockPredictions)
    setMetrics(mockMetrics)
  }, [])

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSystemIcon = (type: string) => {
    switch (type) {
      case "power":
        return <Zap className="h-5 w-5" />
      case "water":
        return <Droplets className="h-5 w-5" />
      case "traffic":
        return <Car className="h-5 w-5" />
      case "emergency":
        return <Building className="h-5 w-5" />
      default:
        return <Brain className="h-5 w-5" />
    }
  }

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === "up") {
      return <TrendingUp className={`h-4 w-4 ${change > 0 ? "text-green-500" : "text-red-500"}`} />
    } else if (trend === "down") {
      return <TrendingDown className={`h-4 w-4 ${change < 0 ? "text-red-500" : "text-green-500"}`} />
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
<>

          <h1 className="text-3xl font-bold">Predictive Analytics</h1>
          <p
</>

className="text-gray-600">AI-powered infrastructure insights and predictions</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          <Brain className="h-4 w-4 mr-1" />
          AI Engine: ACTIVE
        </Badge>
      </div>

      {/* Analytics Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((metric /* , index */) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <metric.icon className="h-8 w-8 text-blue-600" />
                <div className="text-right">
<>

                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div
</>

className="text-sm text-gray-600 flex items-center gap-1">
                    {getTrendIcon(metric.trend, metric.change)}
                    {Math.abs(metric.change)}% vs last month
                  </div>
                </div>
              </div>
              <div className="mt-2 text-sm font-medium">{metric.name}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
<>

          <TabsTrigger value="predictions">Active Predictions</TabsTrigger>
          <TabsTrigger
</>

value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {predictions.map((prediction) => (
              <Card key={prediction.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
<>

                    <div className="flex items-center gap-3">
                      {getSystemIcon(prediction.systemType)}
                      {prediction.systemName}
                    </div>
                    <Badge
</>

className={getImpactColor(prediction.impact)}>{prediction.impact.toUpperCase()}</Badge>
                  </CardTitle>
                  <CardDescription>{prediction.predictionType}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
<>

                        <div className="font-medium">Confidence</div>
                        <div
</>

className="text-2xl font-bold text-blue-600">{prediction.confidence}%</div>
<>

                        <Progress value={prediction.confidence} className="mt-1" />
                      </div>
                      <div
</>

</>>
<>

                        <div className="font-medium">Predicted Date</div>
                        <div
</>

className="text-lg font-bold flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(prediction.predictedDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div>
<>

                      <div className="font-medium text-sm mb-1">Description</div>
                      <p
</>

className="text-sm text-gray-600">{prediction.description}</p>
                    </div>

                    <Alert>
                      <Warning className="h-4 w-4" />
<>

                      <AlertTitle>Recommended Action</AlertTitle>
                      <AlertDescription
</>

</>>{prediction.recommendedAction}</AlertDescription>
                    </Alert>

                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-sm">
<>

                        <span className="font-medium">Potential Savings: </span>
                        <span
</>

className="text-green-600 font-bold">${prediction.costSavings.toLocaleString()}</span>
                      </div>
                      <Button size="sm">Schedule Action</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
<>

              <CardTitle>Infrastructure Performance Trends</CardTitle>
              <CardDescription
</>

</>>Historical analysis and future projections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">System Efficiency Trends</h4>
                  {[
                    { system: "Power Grid", efficiency: 94.2, trend: "up", change: 2.1 },
                    { system: "Water Systems", efficiency: 89.1, trend: "down", change: -1.5 },
                    { system: "Traffic Control", efficiency: 92.3, trend: "up", change: 0.8 },
                    { system: "Emergency Services", efficiency: 98.7, trend: "stable", change: 0.1 },
                  ].map((item /* , index */) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
<>

                        <div className="font-medium">{item.system}</div>
                        <div
</>

className="text-sm text-gray-600">Current: {item.efficiency}%</div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        {getTrendIcon(item.trend, item.change)}
                        <span className="text-sm">
                          {item.change > 0 ? "+" : ""}
                          {item.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
<>

                  <h4 className="font-semibold">Maintenance Predictions</h4>
                  <div
</>

className="space-y-2">
                    <div className="text-center p-4 border rounded-lg">
<>

                      <div className="text-2xl font-bold text-blue-600">14</div>
                      <div
</>

className="text-sm text-gray-600">Days Average Lead Time</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
<>

                      <div className="text-2xl font-bold text-green-600">87%</div>
                      <div
</>

className="text-sm text-gray-600">Prediction Accuracy</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
<>

                      <div className="text-2xl font-bold text-purple-600">$2.1M</div>
                      <div
</>

className="text-sm text-gray-600">Annual Savings</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
<>

              <CardTitle>System Optimization Opportunities</CardTitle>
              <CardDescription
</>

</>>AI-identified improvements for infrastructure efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "Power Grid Load Balancing",
                    description: "Optimize power distribution during peak hours",
                    impact: "12% efficiency improvement",
                    savings: "$45,000/month",
                    effort: "Medium",
                  },
                  {
                    title: "Water Pressure Optimization",
                    description: "Adjust pressure zones based on demand patterns",
                    impact: "8% water savings",
                    savings: "$28,000/month",
                    effort: "Low",
                  },
                  {
                    title: "Traffic Signal Timing",
                    description: "AI-optimized signal timing based on traffic patterns",
                    impact: "15% reduction in wait times",
                    savings: "$35,000/month",
                    effort: "High",
                  },
                ].map((opportunity /* , index */) => (
                  <Alert key={index}>
                    <TrendingUp className="h-4 w-4" />
                    <AlertTitle className="flex justify-between items-center">
<>

                      <span>{opportunity.title}</span>
                      <Badge
</>

variant="outline">{opportunity.effort} Effort</Badge>
                    </AlertTitle>
                    <AlertDescription>
                      <div className="mt-2">
<>

                        <p>{opportunity.description}</p>
                        <div
</>

className="grid grid-cols-2 gap-4 mt-3 text-sm">
                          <div>
<>

                            <span className="font-medium">Impact: </span>
                            <span
</>

className="text-blue-600">{opportunity.impact}</span>
                          </div>
                          <div>
<>

                            <span className="font-medium">Savings: </span>
                            <span
</>

className="text-green-600">{opportunity.savings}</span>
                          </div>
                        </div>
                        <Button size="sm" className="mt-3">
                          Implement Optimization
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
