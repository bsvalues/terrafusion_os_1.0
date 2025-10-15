"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Activity, TrendingUp, TrendingDown, Refresh, Zap, DollarSign, Home, Users  } from '@mui/icons-material'

interface MarketData {
  region: string
  average_price: number
  price_change: number
  market_energy: number
  active_listings: number
  days_on_market: number
  absorption_rate: number
  trend: "rising" | "stable" | "declining"
  insights: string[]
  trends?: Array<{
    month: string
    price: number
    volume: number
    energy: number
  }>
}

export function RealTimeDashboard() {
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [selectedRegion, setSelectedRegion] = useState("Downtown")
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const regions = ["Downtown", "Suburbs", "Waterfront", "Historic District", "Tech Corridor"]

  useEffect(() => {
    fetchMarketData()
  }, [selectedRegion])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchMarketData()
      }, 30000) // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, selectedRegion])

  const fetchMarketData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/market?region=${selectedRegion}&trends=true`)
      const result = await response.json()

      if (result.success) {
        setMarketData(result.data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Failed to fetch market data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "rising":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-blue-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "rising":
        return "text-green-600"
      case "declining":
        return "text-red-600"
      default:
        return "text-blue-600"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><>

                <Zap className="h-5 w-5 text-yellow-600" />
                Real-Time Market Dashboard
              </CardTitle>
              <CardDescription
</>
</>>Live market data with AI-powered insights and sacred geometry analysis</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? "bg-green-50 border-green-200" : ""}
              ><>

                <Refresh className={`h-4 w-4 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
                {autoRefresh ? "Auto" : "Manual"}
              </Button>
              <Button
</>
variant="outline" size="sm" onClick={fetchMarketData} disabled={isLoading}>
                <Refresh className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Region Selection */}
          <div className="mb-6"><>

            <h3 className="font-medium mb-3">Market Region</h3>
            <div
</>
className="flex flex-wrap gap-2">
              {regions.map((region) => (
                <Button
                  key={region}
                  variant={selectedRegion === region ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRegion(region)}
                  disabled={isLoading}
                >
                  {region}
                </Button>
              ))}
            </div>
          </div>

          {isLoading && !marketData ? (
            <div className="space-y-4">
              <Progress value={66} />
              <p className="text-center text-sm text-gray-600">Loading real-time market data...</p>
            </div>
          ) : marketData ? (
            <div className="space-y-6">
              {/* Status Bar */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2"><>

                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span
</>
className="text-sm font-medium">Live Data</span>
                  <Badge variant="outline">{selectedRegion}</Badge>
                </div>
                {lastUpdated && (
                  <span className="text-xs text-gray-500">Updated: {lastUpdated.toLocaleTimeString()}</span>
                )}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-gray-600">Avg Price</span>
                    </div><>

                    <div className="font-bold text-lg">${(marketData.average_price / 1000).toFixed(0)}K</div>
                    <div
</>
className={`text-xs flex items-center gap-1 ${getTrendColor(marketData.trend)}`}>
                      {getTrendIcon(marketData.trend)}
                      {marketData.price_change > 0 ? "+" : ""}
                      {marketData.price_change.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-gray-600">Market Energy</span>
                    </div><>

                    <div className="font-bold text-lg">{marketData.market_energy}</div>
                    <Progress
</>
value={marketData.market_energy} className="h-1" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="h-4 w-4 text-purple-600" />
                      <span className="text-xs text-gray-600">Active Listings</span>
                    </div><>

                    <div className="font-bold text-lg">{marketData.active_listings}</div>
                    <div
</>
className="text-xs text-gray-500">properties</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-orange-600" />
                      <span className="text-xs text-gray-600">Days on Market</span>
                    </div><>

                    <div className="font-bold text-lg">{marketData.days_on_market}</div>
                    <div
</>
className="text-xs text-gray-500">average</div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              {marketData.trends && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Price Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={marketData.trends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Price"]} />
                          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Market Energy Flow</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={marketData.trends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="energy" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    AI Market Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketData.insights.map((insight /* , index */) => (
                      <Alert key={index}>
                        <Activity className="h-4 w-4" />
                        <AlertDescription>{insight}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Market Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Market Status Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg"><>

                      <div className="font-medium text-blue-900">Market Trend</div>
                      <div
</>
className="flex items-center justify-center gap-1 mt-1">
                        {getTrendIcon(marketData.trend)}
                        <span className={`font-bold capitalize ${getTrendColor(marketData.trend)}`}>
                          {marketData.trend}
                        </span>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-green-50 rounded-lg"><>

                      <div className="font-medium text-green-900">Absorption Rate</div>
                      <div
</>
className="font-bold text-green-700 mt-1">{marketData.absorption_rate}%</div><>

                      <Progress value={marketData.absorption_rate} className="mt-2 h-1" />
                    </div>

                    <div
</>
className="text-center p-4 bg-purple-50 rounded-lg"><>

                      <div className="font-medium text-purple-900">Market Health</div>
                      <div
</>
className="font-bold text-purple-700 mt-1">
                        {marketData.market_energy > 70
                          ? "Excellent"
                          : marketData.market_energy > 50
                            ? "Good"
                            : marketData.market_energy > 30
                              ? "Fair"
                              : "Poor"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>Click refresh to load real-time market data for {selectedRegion}.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
