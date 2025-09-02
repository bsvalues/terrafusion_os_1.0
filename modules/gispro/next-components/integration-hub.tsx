"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database,
  Wifi,
  Refresh,
  CheckCircle,
  AlertCircle,
  XCircle,
  Settings,
  BarChart3,
  Cloud,
  Zap,
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
        await loadIntegrations()
      }
    } catch (error) {
      console.error("Sync failed:", error)
    }
  }

  const fetchExternalData = async (source: string, params: any = {}) => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        action: "fetch",
        source,
        ...params,
      })

      const response = await fetch(`/api/integrations?${queryParams}`)
      const result = await response.json()

      if (result.success) {
        setExternalData((prev) => [result.data, ...prev.slice(0, 4)]) // Keep last 5 results
      }
    } catch (error) {
      console.error("Failed to fetch external data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "inactive":
        return <XCircle className="h-4 w-4 text-gray-400" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "mls":
        return <Database className="h-5 w-5 text-blue-600" />
      case "zillow":
        return <BarChart3 className="h-5 w-5 text-green-600" />
      case "census":
        return <Settings className="h-5 w-5 text-purple-600" />
      case "weather":
        return <Cloud className="h-5 w-5 text-gray-600" />
      default:
        return <Wifi className="h-5 w-5 text-orange-600" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><>

            <Wifi className="h-5 w-5 text-blue-600" />
            Integration Hub
          </CardTitle>
          <CardDescription
</>>
            Manage external data sources and API integrations for enhanced property analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="status" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full"><>

              <TabsTrigger value="status">Integration Status</TabsTrigger>
              <TabsTrigger
</> value="data">External Data</TabsTrigger>
              <TabsTrigger value="settings">Configuration</TabsTrigger>
            </TabsList>

            <TabsContent value="status">
              <div className="space-y-4">
                {/* Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center"><>

                        <div className="text-2xl font-bold text-green-600">
                          {integrations.filter((i) => i.status === "active").length}
                        </div>
                        <div
</> className="text-sm text-gray-600">Active</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center"><>

                        <div className="text-2xl font-bold text-blue-600">
                          {integrations.reduce((sum, i) => sum + i.data_points, 0).toLocaleString()}
                        </div>
                        <div
</> className="text-sm text-gray-600">Data Points</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center"><>

                        <div className="text-2xl font-bold text-purple-600">
                          {integrations.reduce((sum, i) => sum + i.api_calls_today, 0).toLocaleString()}
                        </div>
                        <div
</> className="text-sm text-gray-600">API Calls Today</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-center"><>

                        <div className="text-2xl font-bold text-orange-600">
                          {Math.round(
                            (integrations.reduce((sum, i) => sum + i.api_calls_today, 0) /
                              integrations.reduce((sum, i) => sum + i.rate_limit, 0)) *
                              100,
                          )}
                          %
                        </div>
                        <div
</> className="text-sm text-gray-600">Rate Usage</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Integration List */}
                <div className="space-y-3">
                  {isLoading && integrations.length === 0 ? (
                    <div className="text-center py-8">
                      <Refresh className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Loading integrations...</p>
                    </div>
                  ) : (
                    integrations.map((integration) => (
                      <Card
                        key={integration.id}
                        className={`cursor-pointer transition-colors ${
                          selectedIntegration === integration.id ? "ring-2 ring-blue-500" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedIntegration(integration.id)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getTypeIcon(integration.type)}
                              <div><>

                                <div className="font-medium">{integration.name}</div>
                                <div
</> className="text-sm text-gray-600 capitalize">{integration.type} Integration</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right text-sm"><>

                                <div className="font-medium">{integration.data_points.toLocaleString()}</div>
                                <div
</> className="text-gray-600">data points</div>
                              </div>

                              <div className="text-right text-sm"><>

                                <div className="font-medium">
                                  {integration.api_calls_today}/{integration.rate_limit}
                                </div>
                                <div
</> className="text-gray-600">API calls</div>
                              </div>

                              <div className="flex items-center gap-2">
                                {getStatusIcon(integration.status)}
                                <Badge className={getStatusColor(integration.status)}>{integration.status}</Badge>
                              </div>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  syncIntegration(integration.id)
                                }}
                              >
                                <Refresh className="h-3 w-3 mr-1" />
                                Sync
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1"><>

                              <span>Rate Limit Usage</span>
                              <span
</>>{Math.round((integration.api_calls_today / integration.rate_limit) * 100)}%</span>
                            </div><>

                            <Progress
                              value={(integration.api_calls_today / integration.rate_limit) * 100}
                              className="h-1"
                            />
                          </div>

                          <div
</> className="mt-2 text-xs text-gray-500">
                            Last sync: {new Date(integration.last_sync).toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data">
              <div className="space-y-4">
                {/* Data Fetch Controls */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fetchExternalData("mls", { region: "Downtown" })}
                    disabled={isLoading}
                  ><>

                    <Database className="h-4 w-4 mr-1" />
                    Fetch MLS
                  </Button>
                  <Button
</>
                    variant="outline"
                    onClick={() => fetchExternalData("zillow", { address: "123 Main St" })}
                    disabled={isLoading}
                  ><>

                    <BarChart3 className="h-4 w-4 mr-1" />
                    Fetch Zillow
                  </Button>
                  <Button
</>
                    variant="outline"
                    onClick={() => fetchExternalData("census", { zipCode: "12345" })}
                    disabled={isLoading}
                  ><>

                    <Settings className="h-4 w-4 mr-1" />
                    Fetch Census
                  </Button>
                  <Button
</>
                    variant="outline"
                    onClick={() => fetchExternalData("weather", { location: "Downtown" })}
                    disabled={isLoading}
                  >
                    <Cloud className="h-4 w-4 mr-1" />
                    Fetch Weather
                  </Button>
                </div>

                {/* External Data Results */}
                <div className="space-y-3">
                  {externalData.length === 0 ? (
                    <Alert>
                      <Database className="h-4 w-4" />
                      <AlertDescription>Click the buttons above to fetch data from external sources.</AlertDescription>
                    </Alert>
                  ) : (
                    externalData.map((data /* , index */) => (
                      <Card key={index}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2"><>

                              <Zap className="h-4 w-4 text-blue-600" />
                              {data.source}
                            </CardTitle>
                            <div
</> className="flex items-center gap-2"><>

                              <Badge variant="outline">{(data.confidence * 100).toFixed(0)}% confidence</Badge>
                              <span
</> className="text-xs text-gray-500">
                                {new Date(data.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <pre className="text-xs overflow-x-auto">{JSON.stringify(data.data, null, 2)}</pre>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    Integration settings and API configurations. Contact your administrator to modify these settings.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">API Rate Limits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {integrations.map((integration) => (
                          <div key={integration.id} className="flex justify-between items-center"><>

                            <span className="text-sm font-medium">{integration.name}</span>
                            <span
</> className="text-sm text-gray-600">{integration.rate_limit.toLocaleString()}/day</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Sync Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center"><>

                          <span className="text-sm font-medium">MLS Data</span>
                          <span
</> className="text-sm text-gray-600">Every 5 minutes</span>
                        </div>
                        <div className="flex justify-between items-center"><>

                          <span className="text-sm font-medium">Market Data</span>
                          <span
</> className="text-sm text-gray-600">Every 15 minutes</span>
                        </div>
                        <div className="flex justify-between items-center"><>

                          <span className="text-sm font-medium">Census Data</span>
                          <span
</> className="text-sm text-gray-600">Daily</span>
                        </div>
                        <div className="flex justify-between items-center"><>

                          <span className="text-sm font-medium">Weather Data</span>
                          <span
</> className="text-sm text-gray-600">Hourly</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data Quality Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg"><>

                        <div className="text-2xl font-bold text-green-600">98.5%</div>
                        <div
</> className="text-sm text-green-800">Data Accuracy</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg"><>

                        <div className="text-2xl font-bold text-blue-600">99.2%</div>
                        <div
</> className="text-sm text-blue-800">Uptime</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg"><>

                        <div className="text-2xl font-bold text-purple-600">1.2s</div>
                        <div
</> className="text-sm text-purple-800">Avg Response</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
