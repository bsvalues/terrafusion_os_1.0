"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Brain, TrendingUp, Target, Zap, BarChart3, Download, Refresh  } from '@mui/icons-material'

interface AnalyticsData {
  predictive_models: {
    price_forecast: Array<{ month: string; predicted: number; confidence: number }>
    market_cycles: Array<{ phase: string; duration: number; impact: number }>
    risk_indicators: Array<{ factor: string; weight: number; trend: string }>
  }
  performance_metrics: {
    model_accuracy: number
    prediction_confidence: number
    data_quality_score: number
    processing_speed: number
  }
  market_intelligence: {
    sentiment_analysis: { positive: number; neutral: number; negative: number }
    competitive_landscape: Array<{ region: string; competition_level: number; opportunity_score: number }>
    emerging_trends: Array<{ trend: string; impact_score: number; adoption_rate: number }>
  }
  geometry_insights: {
    fibonacci_correlation: number
    golden_ratio_premium: number
    pattern_recognition: Array<{ pattern: string; frequency: number; value_impact: number }>
  }
}

export function AdvancedAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("price_forecast")
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    setIsLoading(true)

    // Simulate advanced analytics processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const mockData: AnalyticsData = {
      predictive_models: {
        price_forecast: [
          { month: "Jan", predicted: 485000, confidence: 0.89 },
          { month: "Feb", predicted: 492000, confidence: 0.87 },
          { month: "Mar", predicted: 498000, confidence: 0.85 },
          { month: "Apr", predicted: 505000, confidence: 0.83 },
          { month: "May", predicted: 512000, confidence: 0.81 },
          { month: "Jun", predicted: 518000, confidence: 0.79 },
        ],
        market_cycles: [
          { phase: "Growth", duration: 18, impact: 0.15 },
          { phase: "Peak", duration: 6, impact: 0.05 },
          { phase: "Decline", duration: 12, impact: -0.08 },
          { phase: "Recovery", duration: 9, impact: 0.12 },
        ],
        risk_indicators: [
          { factor: "Interest Rates", weight: 0.35, trend: "rising" },
          { factor: "Employment", weight: 0.25, trend: "stable" },
          { factor: "Supply/Demand", weight: 0.2, trend: "favorable" },
          { factor: "Economic Growth", weight: 0.2, trend: "positive" },
        ],
      },
      performance_metrics: {
        model_accuracy: 87.3,
        prediction_confidence: 84.7,
        data_quality_score: 92.1,
        processing_speed: 95.8,
      },
      market_intelligence: {
        sentiment_analysis: { positive: 65, neutral: 25, negative: 10 },
        competitive_landscape: [
          { region: "Downtown", competition_level: 85, opportunity_score: 72 },
          { region: "Suburbs", competition_level: 65, opportunity_score: 88 },
          { region: "Waterfront", competition_level: 95, opportunity_score: 45 },
        ],
        emerging_trends: [
          { trend: "Smart Home Integration", impact_score: 8.5, adoption_rate: 67 },
          { trend: "Sustainable Features", impact_score: 9.2, adoption_rate: 78 },
          { trend: "Remote Work Spaces", impact_score: 7.8, adoption_rate: 85 },
        ],
      },
      geometry_insights: {
        fibonacci_correlation: 0.73,
        golden_ratio_premium: 0.045,
        pattern_recognition: [
          { pattern: "Fibonacci Spiral", frequency: 23, value_impact: 0.032 },
          { pattern: "Golden Rectangle", frequency: 18, value_impact: 0.028 },
          { pattern: "Sacred Proportions", frequency: 31, value_impact: 0.041 },
        ],
      },
    }

    setAnalyticsData(mockData)
    setIsLoading(false)
  }

  const startAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
    } else {
      const interval = setInterval(loadAnalyticsData, 30000) // Refresh every 30 seconds
      setRefreshInterval(interval)
    }
  }

  const exportData = () => {
    if (!analyticsData) return

    const dataStr = JSON.stringify(analyticsData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `gama-analytics-${new Date().toISOString().split("T")[0]}.json`
    link.click()
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><>

                <Brain className="h-5 w-5 text-purple-600" />
                Advanced Analytics Engine
              </CardTitle>
              <CardDescription
</>>
                AI-powered predictive models and market intelligence with sacred geometry insights
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={startAutoRefresh}
                className={refreshInterval ? "bg-green-50 border-green-200" : ""}
              ><>

                <Refresh className={`h-4 w-4 mr-1 ${refreshInterval ? "animate-spin" : ""}`} />
                {refreshInterval ? "Auto" : "Manual"}
              </Button>
              <Button
</> variant="outline" size="sm" onClick={loadAnalyticsData} disabled={isLoading}><>

                <Refresh className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
</> variant="outline" size="sm" onClick={exportData} disabled={!analyticsData}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && !analyticsData ? (
            <div className="space-y-4">
              <Progress value={66} />
              <p className="text-center text-sm text-gray-600">Processing advanced analytics...</p>
            </div>
          ) : analyticsData ? (
            <Tabs defaultValue="predictive" className="space-y-6">
              <TabsList className="grid grid-cols-4 w-full"><>

                <TabsTrigger value="predictive">Predictive Models</TabsTrigger>
                <TabsTrigger
</> value="performance">Performance</TabsTrigger><>

                <TabsTrigger value="intelligence">Market Intelligence</TabsTrigger>
                <TabsTrigger
</> value="geometry">Sacred Geometry</TabsTrigger>
              </TabsList>

              <TabsContent value="predictive">
                <div className="space-y-6">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-gray-600">Model Accuracy</span>
                        </div><>

                        <div className="font-bold text-lg">{analyticsData.performance_metrics.model_accuracy}%</div>
                        <Progress
</> value={analyticsData.performance_metrics.model_accuracy} className="h-1" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-gray-600">Confidence</span>
                        </div><>

                        <div className="font-bold text-lg">
                          {analyticsData.performance_metrics.prediction_confidence}%
                        </div>
                        <Progress
</> value={analyticsData.performance_metrics.prediction_confidence} className="h-1" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 className="h-4 w-4 text-purple-600" />
                          <span className="text-xs text-gray-600">Data Quality</span>
                        </div><>

                        <div className="font-bold text-lg">{analyticsData.performance_metrics.data_quality_score}%</div>
                        <Progress
</> value={analyticsData.performance_metrics.data_quality_score} className="h-1" />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <span className="text-xs text-gray-600">Processing Speed</span>
                        </div><>

                        <div className="font-bold text-lg">{analyticsData.performance_metrics.processing_speed}%</div>
                        <Progress
</> value={analyticsData.performance_metrics.processing_speed} className="h-1" />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Price Forecast */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">6-Month Price Forecast</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsData.predictive_models.price_forecast}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip
                            formatter={(value, name) => [
                              name === "predicted" ? `$${Number(value).toLocaleString()}` : `${Number(value) * 100}%`,
                              name === "predicted" ? "Predicted Price" : "Confidence",
                            ]}
                          />
                          <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={3} />
                          <Line
                            type="monotone"
                            dataKey="confidence"
                            stroke="#10b981"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Market Cycles & Risk Indicators */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Market Cycle Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={analyticsData.predictive_models.market_cycles}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="phase" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="duration" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Risk Indicators</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analyticsData.predictive_models.risk_indicators.map((indicator /* , index */) => (
                            <div key={index} className="flex items-center justify-between"><>

                              <span className="text-sm font-medium">{indicator.factor}</span>
                              <div
</> className="flex items-center gap-2"><>

                                <Badge
                                  variant={
                                    indicator.trend === "positive" || indicator.trend === "favorable"
                                      ? "default"
                                      : indicator.trend === "stable"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                >
                                  {indicator.trend}
                                </Badge>
                                <span
</> className="text-sm text-gray-600">{(indicator.weight * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="performance">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Model Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(analyticsData.performance_metrics).map(([key, value]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between text-sm"><>

                              <span className="capitalize">{key.replace("_", " ")}</span>
                              <span
</> className="font-medium">{value}%</span>
                            </div>
                            <Progress value={value} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg"><>

                          <span className="font-medium text-green-900">AI Engine Status</span>
                          <Badge
</> className="bg-green-100 text-green-800">Optimal</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"><>

                          <span className="font-medium text-blue-900">Data Pipeline</span>
                          <Badge
</> className="bg-blue-100 text-blue-800">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"><>

                          <span className="font-medium text-purple-900">Geometry Engine</span>
                          <Badge
</> className="bg-purple-100 text-purple-800">Running</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"><>

                          <span className="font-medium text-yellow-900">Market Sync</span>
                          <Badge
</> className="bg-yellow-100 text-yellow-800">Real-time</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="intelligence">
                <div className="space-y-6">
                  {/* Market Sentiment */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Market Sentiment Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={[
                                {
                                  name: "Positive",
                                  value: analyticsData.market_intelligence.sentiment_analysis.positive,
                                },
                                {
                                  name: "Neutral",
                                  value: analyticsData.market_intelligence.sentiment_analysis.neutral,
                                },
                                {
                                  name: "Negative",
                                  value: analyticsData.market_intelligence.sentiment_analysis.negative,
                                },
                              ]}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                            >
                              {[
                                {
                                  name: "Positive",
                                  value: analyticsData.market_intelligence.sentiment_analysis.positive,
                                },
                                {
                                  name: "Neutral",
                                  value: analyticsData.market_intelligence.sentiment_analysis.neutral,
                                },
                                {
                                  name: "Negative",
                                  value: analyticsData.market_intelligence.sentiment_analysis.negative,
                                },
                              ].map((entry /* , index */) => (<>

                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
</> />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Competitive Landscape</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                          <ScatterChart data={analyticsData.market_intelligence.competitive_landscape}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="competition_level" name="Competition Level" />
                            <YAxis dataKey="opportunity_score" name="Opportunity Score" />
                            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                            <Scatter dataKey="opportunity_score" fill="#3b82f6" />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Emerging Trends */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Emerging Market Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.market_intelligence.emerging_trends.map((trend /* , index */) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div><>

                              <div className="font-medium">{trend.trend}</div>
                              <div
</> className="text-sm text-gray-600">Impact Score: {trend.impact_score}/10</div>
                            </div>
                            <div className="text-right"><>

                              <div className="font-medium">{trend.adoption_rate}%</div>
                              <div
</> className="text-sm text-gray-600">Adoption</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="geometry">
                <div className="space-y-6">
                  {/* Geometry Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center"><>

                          <div className="text-2xl font-bold text-purple-600">
                            {(analyticsData.geometry_insights.fibonacci_correlation * 100).toFixed(1)}%
                          </div>
                          <div
</> className="text-sm text-gray-600">Fibonacci Correlation</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center"><>

                          <div className="text-2xl font-bold text-gold-600">
                            {(analyticsData.geometry_insights.golden_ratio_premium * 100).toFixed(1)}%
                          </div>
                          <div
</> className="text-sm text-gray-600">Golden Ratio Premium</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center"><>

                          <div className="text-2xl font-bold text-blue-600">
                            {analyticsData.geometry_insights.pattern_recognition.length}
                          </div>
                          <div
</> className="text-sm text-gray-600">Patterns Detected</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pattern Recognition */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sacred Geometry Pattern Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.geometry_insights.pattern_recognition.map((pattern /* , index */) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between items-center"><>

                              <span className="font-medium">{pattern.pattern}</span>
                              <Badge
</> variant="outline">+{(pattern.value_impact * 100).toFixed(1)}% value impact</Badge>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600"><>

                              <span>Frequency: {pattern.frequency} properties</span>
                              <span
</>>Impact: {(pattern.value_impact * 100).toFixed(2)}%</span>
                            </div>
                            <Progress value={(pattern.frequency / 50) * 100} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Geometry Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sacred Geometry Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3"><>

                          <h4 className="font-medium">Key Findings</h4>
                          <ul
</> className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <span className="text-purple-600 mt-1">•</span>
                              Properties with Fibonacci proportions show 3.2% higher values on average
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-600 mt-1">•</span>
                              Golden ratio alignment correlates with faster sales (18% reduction in days on market)
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-purple-600 mt-1">•</span>
                              Sacred geometry patterns increase buyer interest by 24%
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-3"><>

                          <h4 className="font-medium">Recommendations</h4>
                          <ul
</> className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600 mt-1">•</span>
                              Highlight geometric features in property marketing
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600 mt-1">•</span>
                              Consider architectural modifications to enhance sacred proportions
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600 mt-1">•</span>
                              Price premium justified for geometrically aligned properties
                            </li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Click refresh to load advanced analytics data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
