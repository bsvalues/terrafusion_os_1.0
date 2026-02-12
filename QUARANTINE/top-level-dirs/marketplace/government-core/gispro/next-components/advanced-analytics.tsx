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
import { Brain, TrendingUp, Target, Zap, BarChart3, Download, Refresh } from '@mui/icons-material'

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
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  // Mock analytics data
  const mockData: AnalyticsData = {
    predictive_models: {
      price_forecast: [
        { month: "Jan", predicted: 325000, confidence: 0.89 },
        { month: "Feb", predicted: 332000, confidence: 0.85 },
        { month: "Mar", predicted: 340000, confidence: 0.82 },
        { month: "Apr", predicted: 348000, confidence: 0.78 },
        { month: "May", predicted: 355000, confidence: 0.75 },
        { month: "Jun", predicted: 362000, confidence: 0.72 }
      ],
      market_cycles: [
        { phase: "Recovery", duration: 8, impact: 0.15 },
        { phase: "Expansion", duration: 12, impact: 0.35 },
        { phase: "Peak", duration: 4, impact: 0.05 },
        { phase: "Contraction", duration: 6, impact: -0.25 }
      ],
      risk_indicators: [
        { factor: "Interest Rates", weight: 0.35, trend: "rising" },
        { factor: "Employment", weight: 0.25, trend: "stable" },
        { factor: "Population Growth", weight: 0.20, trend: "increasing" },
        { factor: "Construction Permits", weight: 0.20, trend: "declining" }
      ]
    },
    performance_metrics: {
      model_accuracy: 94.2,
      prediction_confidence: 87.5,
      data_quality_score: 96.8,
      processing_speed: 1247
    },
    market_intelligence: {
      sentiment_analysis: { positive: 62, neutral: 28, negative: 10 },
      competitive_landscape: [
        { region: "Downtown", competition_level: 8.5, opportunity_score: 6.2 },
        { region: "Suburbs", competition_level: 6.8, opportunity_score: 8.1 },
        { region: "Waterfront", competition_level: 9.2, opportunity_score: 4.5 },
        { region: "Industrial", competition_level: 4.3, opportunity_score: 7.8 }
      ],
      emerging_trends: [
        { trend: "Smart Home Integration", impact_score: 8.7, adoption_rate: 0.42 },
        { trend: "Sustainable Building", impact_score: 9.1, adoption_rate: 0.38 },
        { trend: "Remote Work Spaces", impact_score: 7.8, adoption_rate: 0.55 },
        { trend: "EV Charging Stations", impact_score: 6.9, adoption_rate: 0.29 }
      ]
    },
    geometry_insights: {
      fibonacci_correlation: 0.73,
      golden_ratio_premium: 0.168,
      pattern_recognition: [
        { pattern: "Golden Rectangle", frequency: 23, value_impact: 0.12 },
        { pattern: "Fibonacci Sequence", frequency: 17, value_impact: 0.08 },
        { pattern: "Sacred Geometry", frequency: 11, value_impact: 0.15 },
        { pattern: "Natural Ratios", frequency: 31, value_impact: 0.09 }
      ]
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [refreshCounter])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      setData(mockData)
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshCounter(prev => prev + 1)
  }

  const handleExport = () => {
    if (!data) return
    
    const exportData = {
      timestamp: new Date().toISOString(),
      analytics: data
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const pieColors = ['#8884d8', '#82ca9d', '#ffc658']

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span>Loading advanced analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Failed to load analytics data</p>
              <Button onClick={handleRefresh}>
                <Refresh className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered predictive insights and market intelligence
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <Refresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Model Accuracy</p>
                <p className="text-2xl font-bold">{data.performance_metrics.model_accuracy}%</p>
                <Progress value={data.performance_metrics.model_accuracy} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Prediction Confidence</p>
                <p className="text-2xl font-bold">{data.performance_metrics.prediction_confidence}%</p>
                <Progress value={data.performance_metrics.prediction_confidence} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Data Quality</p>
                <p className="text-2xl font-bold">{data.performance_metrics.data_quality_score}%</p>
                <Progress value={data.performance_metrics.data_quality_score} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Processing Speed</p>
                <p className="text-2xl font-bold">{data.performance_metrics.processing_speed}</p>
                <p className="text-xs text-muted-foreground">records/sec</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predictive" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictive">Predictive Models</TabsTrigger>
          <TabsTrigger value="market">Market Intelligence</TabsTrigger>
          <TabsTrigger value="geometry">Geometry Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Predictive Models Tab */}
        <TabsContent value="predictive" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Price Forecast</CardTitle>
                <CardDescription>6-month property value predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.predictive_models.price_forecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `$${Number(value).toLocaleString()}`,
                        name === 'predicted' ? 'Predicted Price' : name
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market Cycles</CardTitle>
                <CardDescription>Economic phase analysis and impact</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.predictive_models.market_cycles}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="phase" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="duration" fill="#82ca9d" name="Duration (months)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Risk Indicators</CardTitle>
              <CardDescription>Weighted risk factors affecting market predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.predictive_models.risk_indicators.map((indicator, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{indicator.factor}</p>
                        <p className="text-sm text-muted-foreground">
                          Weight: {(indicator.weight * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={
                          indicator.trend === 'rising' ? 'bg-red-100 text-red-800' :
                          indicator.trend === 'stable' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }
                      >
                        {indicator.trend}
                      </Badge>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Intelligence Tab */}
        <TabsContent value="market" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Sentiment</CardTitle>
                <CardDescription>AI-analyzed market sentiment distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Positive', value: data.market_intelligence.sentiment_analysis.positive },
                        { name: 'Neutral', value: data.market_intelligence.sentiment_analysis.neutral },
                        { name: 'Negative', value: data.market_intelligence.sentiment_analysis.negative }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieColors.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competitive Landscape</CardTitle>
                <CardDescription>Competition vs opportunity by region</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={data.market_intelligence.competitive_landscape}>
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="competition_level" 
                      name="Competition Level"
                      domain={[0, 10]}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="opportunity_score" 
                      name="Opportunity Score"
                      domain={[0, 10]}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label) => `Region: ${label}`}
                    />
                    <Scatter dataKey="opportunity_score" fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Emerging Trends</CardTitle>
              <CardDescription>Market trends with impact and adoption metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.market_intelligence.emerging_trends.map((trend, index) => (
                  <div key={index} className="p-4 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{trend.trend}</h3>
                      <Badge>Impact: {trend.impact_score}/10</Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Adoption Rate</span>
                          <span>{(trend.adoption_rate * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={trend.adoption_rate * 100} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geometry Insights Tab */}
        <TabsContent value="geometry" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sacred Geometry Metrics</CardTitle>
                <CardDescription>Mathematical harmony in property valuations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">Fibonacci Correlation</span>
                  <div className="flex items-center gap-2">
                    <Progress value={data.geometry_insights.fibonacci_correlation * 100} className="w-24" />
                    <span className="text-sm font-medium">
                      {(data.geometry_insights.fibonacci_correlation * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">Golden Ratio Premium</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      +{(data.geometry_insights.golden_ratio_premium * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pattern Recognition</CardTitle>
                <CardDescription>Geometric patterns and their value impact</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.geometry_insights.pattern_recognition}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="pattern" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="frequency" fill="#8884d8" name="Frequency" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pattern Analysis Details</CardTitle>
              <CardDescription>Detailed breakdown of geometric pattern impacts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.geometry_insights.pattern_recognition.map((pattern, index) => (
                  <div key={index} className="p-3 border rounded">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{pattern.pattern}</h4>
                      <Badge variant="outline">
                        {pattern.frequency} occurrences
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Value Impact:</span>
                        <span className="font-medium">
                          +{(pattern.value_impact * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={pattern.value_impact * 100} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Metrics</CardTitle>
                <CardDescription>AI model accuracy and reliability indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Model Accuracy</span>
                      <span className="text-sm">{data.performance_metrics.model_accuracy}%</span>
                    </div>
                    <Progress value={data.performance_metrics.model_accuracy} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Prediction Confidence</span>
                      <span className="text-sm">{data.performance_metrics.prediction_confidence}%</span>
                    </div>
                    <Progress value={data.performance_metrics.prediction_confidence} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Data Quality Score</span>
                      <span className="text-sm">{data.performance_metrics.data_quality_score}%</span>
                    </div>
                    <Progress value={data.performance_metrics.data_quality_score} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Real-time processing and system health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {data.performance_metrics.processing_speed}
                  </div>
                  <p className="text-sm text-muted-foreground">Records processed per second</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-xl font-semibold">99.8%</div>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold">12ms</div>
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Analytics Summary</CardTitle>
              <CardDescription>Key insights and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-800">High Accuracy</h4>
                  </div>
                  <p className="text-sm text-green-700">
                    Model accuracy exceeds 94%, indicating reliable predictions
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-800">Strong Confidence</h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    87.5% prediction confidence suggests robust model performance
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <h4 className="font-medium text-purple-800">Positive Trends</h4>
                  </div>
                  <p className="text-sm text-purple-700">
                    Market sentiment 62% positive with emerging opportunities
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
