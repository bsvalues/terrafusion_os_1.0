"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Shield,
  Zap,
  Droplets,
  Car,
  Building,
  Warning,
  CheckCircle,
  XCircle,
  Activity,
  Users,
  MapPin,
  Clock,
  TrendingUp,
  Bell,
 } from '@mui/icons-material'

interface InfrastructureStatus {
  id: string
  name: string
  type: "power" | "water" | "traffic" | "emergency" | "building"
  status: "operational" | "warning" | "critical" | "maintenance"
  uptime: number
  lastUpdate: string
  metrics: {
    current: number
    capacity: number
    efficiency: number
  }
  location: {
    lat: number
    lng: number
    address: string
  }
}

interface CriticalAlert {
  id: string
  severity: "high" | "medium" | "low"
  type: string
  message: string
  location: string
  timestamp: string
  acknowledged: boolean
}

export default function MunicipalCommandCenter() {
  const [infrastructureData, setInfrastructureData] = useState<InfrastructureStatus[]>([])
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([])
  const [systemHealth, setSystemHealth] = useState({
    overall: 98.7,
    power: 99.2,
    water: 97.8,
    traffic: 98.9,
    emergency: 99.9,
  })

  useEffect(() => {
    const mockInfrastructure: InfrastructureStatus[] = [
      {
        id: "pwr-001",
        name: "Central Power Grid",
        type: "power",
        status: "operational",
        uptime: 99.2,
        lastUpdate: new Date().toISOString(),
        metrics: { current: 850, capacity: 1000, efficiency: 94.2 },
        location: { lat: 40.7128, lng: -74.006, address: "Manhattan Power Station" },
      },
      {
        id: "wtr-001",
        name: "Water Treatment Plant A",
        type: "water",
        status: "warning",
        uptime: 97.8,
        lastUpdate: new Date().toISOString(),
        metrics: { current: 780, capacity: 800, efficiency: 89.1 },
        location: { lat: 40.7589, lng: -73.9851, address: "Bronx Water Facility" },
      },
      {
        id: "trf-001",
        name: "Traffic Control System",
        type: "traffic",
        status: "operational",
        uptime: 98.9,
        lastUpdate: new Date().toISOString(),
        metrics: { current: 1200, capacity: 1500, efficiency: 92.3 },
        location: { lat: 40.7505, lng: -73.9934, address: "Times Square Hub" },
      },
      {
        id: "emr-001",
        name: "Emergency Response Network",
        type: "emergency",
        status: "operational",
        uptime: 99.9,
        lastUpdate: new Date().toISOString(),
        metrics: { current: 45, capacity: 50, efficiency: 98.7 },
        location: { lat: 40.7282, lng: -74.0776, address: "Emergency Command" },
      },
    ]

    const mockAlerts: CriticalAlert[] = [
      {
        id: "alert-001",
        severity: "high",
        type: "Water Pressure",
        message: "Water pressure dropping in Sector 7 - immediate attention required",
        location: "Bronx Water Facility",
        timestamp: new Date(Date.now() - 300000).toISOString(),
        acknowledged: false,
      },
      {
        id: "alert-002",
        severity: "medium",
        type: "Traffic Congestion",
        message: "Heavy traffic detected on Bridge Route 12",
        location: "Brooklyn Bridge",
        timestamp: new Date(Date.now() - 600000).toISOString(),
        acknowledged: true,
      },
    ]

    setInfrastructureData(mockInfrastructure)
    setCriticalAlerts(mockAlerts)

    const interval = setInterval(() => {
      setInfrastructureData((prev) =>
        prev.map((item) => ({
          ...item,
          metrics: {
            ...item.metrics,
            current: Math.max(0, item.metrics.current + (Math.random() - 0.5) * 20),
            efficiency: Math.max(80, Math.min(100, item.metrics.efficiency + (Math.random() - 0.5) * 2)),
          },
          lastUpdate: new Date().toISOString(),
        })),
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <Warning className="h-5 w-5 text-yellow-500" />
      case "critical":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "maintenance":
        return <Clock className="h-5 w-5 text-blue-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "power":
        return <Zap className="h-6 w-6" />
      case "water":
        return <Droplets className="h-6 w-6" />
      case "traffic":
        return <Car className="h-6 w-6" />
      case "emergency":
        return <Shield className="h-6 w-6" />
      case "building":
        return <Building className="h-6 w-6" />
      default:
        return <Activity className="h-6 w-6" />
    }
  }

  const acknowledgeAlert = (alertId: string) => {
    setCriticalAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)))
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div><>

            <h1 className="text-3xl font-bold text-gray-900">TerraFusionPro-1</h1>
            <p
</> className="text-gray-600">Municipal Infrastructure Command Center</p>
          </div>
          <div className="flex items-center gap-4"><>

            <Badge className="bg-green-100 text-green-800">System Health: {systemHealth.overall}%</Badge>
            <Button
</> variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Alerts ({criticalAlerts.filter((a) => !a.acknowledged).length})
            </Button>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalAlerts.filter((alert) => !alert.acknowledged).length > 0 && (
          <div className="space-y-2">
            {criticalAlerts
              .filter((alert) => !alert.acknowledged)
              .map((alert) => (
                <Alert
                  key={alert.id}
                  className={`border-l-4 ${
                    alert.severity === "high"
                      ? "border-red-500 bg-red-50"
                      : alert.severity === "medium"
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-blue-500 bg-blue-50"
                  }`}
                >
                  <Warning className="h-4 w-4" />
                  <AlertTitle className="flex justify-between items-center"><>

                    <span>
                      {alert.type} - {alert.severity.toUpperCase()}
                    </span>
                    <Button
</> size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                      Acknowledge
                    </Button>
                  </AlertTitle>
                  <AlertDescription>
                    {alert.message}
                    <div className="text-xs text-gray-500 mt-1">
                      {alert.location} • {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
          </div>
        )}

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { name: "Overall", value: systemHealth.overall, icon: Activity },
            { name: "Power Grid", value: systemHealth.power, icon: Zap },
            { name: "Water Systems", value: systemHealth.water, icon: Droplets },
            { name: "Traffic Control", value: systemHealth.traffic, icon: Car },
            { name: "Emergency Services", value: systemHealth.emergency, icon: Shield },
          ].map((system /* , index */) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <system.icon className="h-8 w-8 text-blue-600" />
                  <div className="text-right"><>

                    <div className="text-2xl font-bold">{system.value}%</div>
                    <div
</> className="text-sm text-gray-600">{system.name}</div>
                  </div>
                </div>
                <Progress value={system.value} className="mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Infrastructure Status */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4"><>

            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger
</> value="monitoring">Real-time Monitoring</TabsTrigger><>

            <TabsTrigger value="analytics">Predictive Analytics</TabsTrigger>
            <TabsTrigger
</> value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {infrastructureData.map((infrastructure) => (
                <Card key={infrastructure.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(infrastructure.type)}
                        {infrastructure.name}
                      </div>
                      {getStatusIcon(infrastructure.status)}
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {infrastructure.location.address}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div><>

                          <div className="font-medium">Uptime</div>
                          <div
</> className="text-2xl font-bold text-green-600">{infrastructure.uptime}%</div>
                        </div>
                        <div><>

                          <div className="font-medium">Load</div>
                          <div
</> className="text-2xl font-bold">
                            {Math.round((infrastructure.metrics.current / infrastructure.metrics.capacity) * 100)}%
                          </div>
                        </div>
                        <div><>

                          <div className="font-medium">Efficiency</div>
                          <div
</> className="text-2xl font-bold text-blue-600">
                            {infrastructure.metrics.efficiency.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1"><>

                          <span>Current Load</span>
                          <span
</>>
                            {infrastructure.metrics.current.toFixed(0)} / {infrastructure.metrics.capacity}
                          </span>
                        </div><>

                        <Progress
                          value={(infrastructure.metrics.current / infrastructure.metrics.capacity) * 100}
                          className="h-2"
                        />
                      </div>

                      <div
</> className="text-xs text-gray-500">
                        Last updated: {new Date(infrastructure.lastUpdate).toLocaleTimeString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <Card>
              <CardHeader><>

                <CardTitle>Real-time Infrastructure Monitoring</CardTitle>
                <CardDescription
</>>Live data streams from municipal sensors and systems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" /><>

                    <div className="text-2xl font-bold">2,847</div>
                    <div
</> className="text-sm text-gray-600">Active Sensors</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" /><>

                    <div className="text-2xl font-bold">156/sec</div>
                    <div
</> className="text-sm text-gray-600">Data Points</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" /><>

                    <div className="text-2xl font-bold">98.7%</div>
                    <div
</> className="text-sm text-gray-600">Accuracy Rate</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" /><>

                    <div className="text-2xl font-bold">47ms</div>
                    <div
</> className="text-sm text-gray-600">Avg Response</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader><>

                <CardTitle>Predictive Analytics Dashboard</CardTitle>
                <CardDescription
</>>AI-powered insights for infrastructure maintenance and optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <TrendingUp className="h-4 w-4" /><>

                    <AlertTitle>Maintenance Prediction</AlertTitle>
                    <AlertDescription
</>>
                      Water Treatment Plant A requires maintenance in 14 days based on efficiency trends. Recommended
                      action: Schedule preventive maintenance during low-demand period.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Activity className="h-4 w-4" /><>

                    <AlertTitle>Load Optimization</AlertTitle>
                    <AlertDescription
</>>
                      Power grid load can be optimized by 12% through smart distribution adjustments. Estimated savings:
                      $45,000/month in operational costs.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader><>

                <CardTitle>Maintenance Schedule</CardTitle>
                <CardDescription
</>>Planned and predictive maintenance activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { system: "Power Grid Transformer 7", date: "2025-01-15", type: "Preventive", priority: "Medium" },
                    { system: "Water Pump Station B", date: "2025-01-18", type: "Predictive", priority: "High" },
                    { system: "Traffic Signal Array 12", date: "2025-01-22", type: "Scheduled", priority: "Low" },
                  ].map((item /* , index */) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div><>

                        <div className="font-medium">{item.system}</div>
                        <div
</> className="text-sm text-gray-600">{item.type} Maintenance</div>
                      </div>
                      <div className="text-right"><>

                        <div className="text-sm font-medium">{item.date}</div>
                        <Badge
</>
                          variant={
                            item.priority === "High"
                              ? "destructive"
                              : item.priority === "Medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {item.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
