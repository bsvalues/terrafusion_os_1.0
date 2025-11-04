"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts"
import { TrendingUp, TrendingDown, Activity, MapPin, DollarSign, Users  } from '@mui/icons-material'

interface MarketData {
  month: string
  price: number
  volume: number
  energy: number
  trend: number
}

interface MarketMetrics {
  averagePrice: number
  priceChange: number
  marketEnergy: number
  activeListings: number
  daysOnMarket: number
  absorption: number
}

export function MarketAnalysis() {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [metrics, setMetrics] = useState<MarketMetrics | null>(null)
  const [selectedRegion, setSelectedRegion] = useState("Downtown")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    generateMarketData()
  }, [selectedRegion])

  const generateMarketData = () => {
    setIsLoading(true)

    // Simulate market data generation
    setTimeout(() => {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const basePrice = selectedRegion === "Downtown" ? 450000 : selectedRegion === "Suburbs" ? 320000 : 280000

      const data = months.map((month /* , index */) => {
        const seasonalFactor = 1 + 0.1 * Math.sin((index / 12) * 2 * Math.PI)
        const trendFactor = 1 + index * 0.02 // 2% monthly growth
        const randomFactor = 0.95 + Math.random() * 0.1

        return {
          month,
          price: Math.round(basePrice * seasonalFactor * trendFactor * randomFactor),
          volume: Math.round(50 + Math.random() * 100),
          energy: Math.round(60 + Math.random() * 40),
          trend: Math.round((trendFactor - 1) * 100),
        }
      })

      setMarketData(data)

      // Calculate metrics
      const currentPrice = data[data.length - 1].price
      const previousPrice = data[data.length - 2].price
      const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100

      setMetrics({
        averagePrice: currentPrice,
        priceChange,
        marketEnergy: Math.round(70 + Math.random() * 20),
        activeListings: Math.round(200 + Math.random() * 100),
        daysOnMarket: Math.round(25 + Math.random() * 20),
        absorption: Math.round(60 + Math.random() * 30),
      })

      setIsLoading(false)
    }, 1000)
  }

  const regions = ["Downtown", "Suburbs", "Waterfront", "Historic District"]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Real-time Market Analysis
          </CardTitle>
          <CardDescription>
            Dynamic visualization of market forces and property flows using advanced analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Region Selection */}
          <div className="mb-6">
            <h3 className="font-medium mb-3">Select Market Region</h3>
            <div className="flex gap-2">
              {regions.map((region) => (
                <Button
                  key={region}
                  variant={selectedRegion === region ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRegion(region)}
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  {region}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Progress value={66} />
              <p className="text-center text-sm text-gray-600">Analyzing market data for {selectedRegion}...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Metrics */}
              {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-gray-600">Avg Price</span>
                      </div>
<>

                      <div className="font-bold text-lg">${(metrics.averagePrice / 1000).toFixed(0)}K</div>
                      <div
                        className={`text-xs flex items-center gap-1 ${
                          metrics.priceChange >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {metrics.priceChange >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(metrics.priceChange).toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-xs text-gray-600">Market Energy</span>
                      </div>
<>

                      <div className="font-bold text-lg">{metrics.marketEnergy}</div>
                      <Progress value={metrics.marketEnergy} className="h-1" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="text-xs text-gray-600">Active Listings</span>
                      </div>
<>

                      <div className="font-bold text-lg">{metrics.activeListings}</div>
                      <div className="text-xs text-gray-500">properties</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs text-gray-600 mb-1">Days on Market</div>
                      <div className="font-bold text-lg">{metrics.daysOnMarket}</div>
                      <div className="text-xs text-gray-500">average</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs text-gray-600 mb-1">Absorption Rate</div>
                      <div className="font-bold text-lg">{metrics.absorption}%</div>
                      <Progress value={metrics.absorption} className="h-1" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-xs text-gray-600 mb-1">Market Status</div>
                      <Badge variant={metrics.marketEnergy > 75 ? "default" : "secondary"}>
                        {metrics.marketEnergy > 75 ? "Hot" : metrics.marketEnergy > 50 ? "Balanced" : "Cool"}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Price Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Price Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={marketData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Price"]} />
                        <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Market Energy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Market Energy Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={marketData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="energy" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Volume Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Transaction Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={marketData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="volume" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Market Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Market Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium text-sm">Strong Buyer Demand</div>
                          <div className="text-xs text-gray-600">
                            Market energy indicates high buyer activity in {selectedRegion}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium text-sm">Price Appreciation</div>
                          <div className="text-xs text-gray-600">Consistent upward trend in property values</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium text-sm">Inventory Levels</div>
                          <div className="text-xs text-gray-600">
                            Balanced supply-demand ratio for sustainable growth
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium text-sm">Investment Opportunity</div>
                          <div className="text-xs text-gray-600">Favorable conditions for property investment</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
