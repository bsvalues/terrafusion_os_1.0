"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Database,
  Wifi,
  Refresh,
  CheckCircle,
  AlertCircle,
  XCircle,
  Settings,
  BarChart3,
  Cloud,
  Zap
} from '@mui/icons-material'

interface Integration {
  id: string
  name: string
  type: "mls" | "zillow" | "redfin" | "census" | "weather" | "economic"
  status: "active" | "inactive" | "error"
  last_sync: string
  data_points: number
  api_calls_today: number
  rate_limit: number
}

interface ExternalData {
  source: string
  data: any
  timestamp: string
  confidence: number
}

export function IntegrationHub() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [externalData, setExternalData] = useState<ExternalData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/integrations?action=status")
      const result = await response.json()

      if (result.success) {
        setIntegrations(result.data)
      }
    } catch (error) {
      console.error("Failed to load integrations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const syncIntegration = async (integrationId: string) => {
    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "sync",
          integration_id: integrationId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        loadIntegrations()
      }
    } catch (error) {
      console.error("Failed to sync integration:", error)
    }
  }

  const mockIntegrations: Integration[] = [
    {
      id: "mls-1",
      name: "Dallas MLS",
      type: "mls",
      status: "active",
      last_sync: "2024-01-15T14:30:00Z",
      data_points: 15847,
      api_calls_today: 342,
      rate_limit: 1000
    },
    {
      id: "zillow-1",
      name: "Zillow API",
      type: "zillow",
      status: "active",
      last_sync: "2024-01-15T14:25:00Z",
      data_points: 8920,
      api_calls_today: 156,
      rate_limit: 500
    },
    {
      id: "census-1",
      name: "US Census Bureau",
      type: "census",
      status: "active",
      last_sync: "2024-01-15T12:00:00Z",
      data_points: 2847,
      api_calls_today: 23,
      rate_limit: 100
    },
    {
      id: "weather-1",
      name: "Weather API",
      type: "weather",
      status: "inactive",
      last_sync: "2024-01-14T18:00:00Z",
      data_points: 1205,
      api_calls_today: 0,
      rate_limit: 200
    },
    {
      id: "economic-1",
      name: "Economic Indicators",
      type: "economic",
      status: "error",
      last_sync: "2024-01-15T08:00:00Z",
      data_points: 456,
      api_calls_today: 5,
      rate_limit: 50
    }
  ]

  const mockExternalData: ExternalData[] = [
    {
      source: "Dallas MLS",
      data: {
        active_listings: 2847,
        avg_price: 485000,
        price_change: "+2.3%",
        days_on_market: 28
      },
      timestamp: "2024-01-15T14:30:00Z",
      confidence: 0.95
    },
    {
      source: "Zillow API",
      data: {
        zestimate_median: 465000,
        rent_estimate: 2850,
        appreciation: "+5.2%",
        forecast: "Moderate Growth"
      },
      timestamp: "2024-01-15T14:25:00Z",
      confidence: 0.88
    },
    {
      source: "US Census",
      data: {
        population: 1341075,
        median_income: 52580,
        unemployment: "3.2%",
        education: "32% College+"
      },
      timestamp: "2024-01-15T12:00:00Z",
      confidence: 0.98
    }
  ]

  useEffect(() => {
    if (integrations.length === 0) {
      setIntegrations(mockIntegrations)
      setExternalData(mockExternalData)
    }
  }, [integrations.length])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "inactive":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "mls":
        return <Database className="h-5 w-5 text-blue-600" />
      case "zillow":
      case "redfin":
        return <BarChart3 className="h-5 w-5 text-purple-600" />
      case "census":
        return <BarChart3 className="h-5 w-5 text-green-600" />
      case "weather":
        return <Cloud className="h-5 w-5 text-blue-400" />
      case "economic":
        return <Zap className="h-5 w-5 text-orange-600" />
      default:
        return <Database className="h-5 w-5 text-gray-600" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const calculateUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integration Hub</h1>
          <p className="text-muted-foreground">
            Manage external data sources and API integrations
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={loadIntegrations} variant="outline" disabled={isLoading}>
            <Refresh className="h-4 w-4 mr-2" />
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="data">External Data</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {integrations.filter(i => i.status === "active").length}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Integrations</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {integrations.reduce((sum, i) => sum + i.data_points, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Data Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {integrations.reduce((sum, i) => sum + i.api_calls_today, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">API Calls Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {integrations.filter(i => i.status === "error").length}
                    </div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
                <CardDescription>Current status of all integrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(integration.type)}
                        <div>
                          <div className="font-medium">{integration.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {integration.data_points.toLocaleString()} data points
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(integration.status)}
                        {getStatusIcon(integration.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest synchronization events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations
                    .sort((a, b) => new Date(b.last_sync).getTime() - new Date(a.last_sync).getTime())
                    .slice(0, 5)
                    .map((integration) => (
                      <div key={integration.id} className="flex items-center gap-3 p-3 border rounded">
                        {getTypeIcon(integration.type)}
                        <div className="flex-1">
                          <div className="font-medium">{integration.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Synced {formatTimestamp(integration.last_sync)}
                          </div>
                        </div>
                        {getStatusIcon(integration.status)}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {integrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(integration.type)}
                      <div>
                        <CardTitle>{integration.name}</CardTitle>
                        <CardDescription>
                          Last synced: {formatTimestamp(integration.last_sync)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(integration.status)}
                      <Button
                        size="sm"
                        onClick={() => syncIntegration(integration.id)}
                        disabled={isLoading}
                      >
                        <Refresh className="h-4 w-4 mr-2" />
                        Sync
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Data Points</div>
                      <div className="text-2xl font-bold">{integration.data_points.toLocaleString()}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1">API Usage Today</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{integration.api_calls_today}</span>
                          <span>{integration.rate_limit}</span>
                        </div>
                        <Progress 
                          value={calculateUsagePercentage(integration.api_calls_today, integration.rate_limit)} 
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1">Status</div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <span className="capitalize">{integration.status}</span>
                      </div>
                    </div>
                  </div>

                  {integration.status === "error" && (
                    <Alert className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Integration is experiencing issues. Check API credentials and rate limits.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {externalData.map((data, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{data.source}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {(data.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {formatTimestamp(data.timestamp)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(data.data).map(([key, value]) => (
                      <div key={key} className="p-3 border rounded">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-lg font-semibold">{value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Performance</CardTitle>
                <CardDescription>Success rates and response times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{integration.name}</span>
                        <span>{integration.status === "active" ? "99.9%" : "0%"} uptime</span>
                      </div>
                      <Progress 
                        value={integration.status === "active" ? 99.9 : 0} 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Freshness</CardTitle>
                <CardDescription>How recent is your external data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.map((integration) => {
                    const hoursAgo = Math.floor(
                      (Date.now() - new Date(integration.last_sync).getTime()) / (1000 * 60 * 60)
                    )
                    return (
                      <div key={integration.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(integration.type)}
                          <span className="font-medium">{integration.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {hoursAgo < 1 ? "< 1 hour ago" : `${hoursAgo} hours ago`}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>API Usage Trends</CardTitle>
              <CardDescription>Monitor your API consumption patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Total Calls Today</div>
                  <div className="text-2xl font-bold">
                    {integrations.reduce((sum, i) => sum + i.api_calls_today, 0)}
                  </div>
                  <div className="text-sm text-green-600 mt-1">+12% from yesterday</div>
                </div>
                
                <div className="p-4 border rounded">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Average Response Time</div>
                  <div className="text-2xl font-bold">145ms</div>
                  <div className="text-sm text-green-600 mt-1">-8ms improvement</div>
                </div>
                
                <div className="p-4 border rounded">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Success Rate</div>
                  <div className="text-2xl font-bold">99.2%</div>
                  <div className="text-sm text-yellow-600 mt-1">-0.3% from last week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
