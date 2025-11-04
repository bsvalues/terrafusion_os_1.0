"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Wifi,
  Thermometer,
  Droplets,
  Zap,
  Wind,
  Activity,
  MapPin,
  Battery,
  Signal,
  Warning,
  CheckCircle,
  TrendingUp,
  Gauge,
  Radio,
  Satellite,
 } from '@mui/icons-material'

interface IoTSensor {
  id: string
  name: string
  type: "temperature" | "humidity" | "air_quality" | "noise" | "vibration" | "motion" | "water" | "energy"
  location: {
    lat: number
    lng: number
    address: string
    building?: string
    floor?: string
    room?: string
  }
  status: "online" | "offline" | "maintenance" | "low_battery" | "error"
  batteryLevel: number
  signalStrength: number
  lastReading: {
    value: number
    unit: string
    timestamp: string
    quality: "excellent" | "good" | "fair" | "poor"
  }
  thresholds: {
    min: number
    max: number
    critical: number
  }
  connectivity: "wifi" | "lora" | "cellular" | "satellite"
  firmware: string
  installDate: string
}

interface SensorReading {
  sensorId: string
  timestamp: string
  value: number
  unit: string
  quality: number
  anomaly?: boolean
}

interface NetworkStats {
  totalSensors: number
  onlineSensors: number
  dataPoints: number
  coverage: number
  avgBattery: number
  avgSignal: number
}

export default function IoTSensorNetwork() {
  const [sensors, setSensors] = useState<IoTSensor[]>([])
  const [recentReadings, setRecentReadings] = useState<SensorReading[]>([])
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalSensors: 0,
    onlineSensors: 0,
    dataPoints: 0,
    coverage: 0,
    avgBattery: 0,
    avgSignal: 0,
  })

  useEffect(() => {
    const mockSensors: IoTSensor[] = [
      {
        id: "sensor-001",
        name: "Building A - HVAC Monitor",
        type: "temperature",
        location: {
          lat: 46.2042,
          lng: -119.7411,
          address: "123 Wine Country Rd, Prosser, WA",
          building: "Building A",
          floor: "2nd Floor",
          room: "HVAC Room",
        },
        status: "online",
        batteryLevel: 87,
        signalStrength: 92,
        lastReading: {
          value: 72.5,
          unit: "°F",
          timestamp: "2025-01-10 14:32:15",
          quality: "excellent",
        },
        thresholds: {
          min: 65,
          max: 78,
          critical: 85,
        },
        connectivity: "wifi",
        firmware: "v2.1.3",
        installDate: "2024-12-15",
      },
      {
        id: "sensor-002",
        name: "Outdoor Weather Station",
        type: "humidity",
        location: {
          lat: 46.2851,
          lng: -119.2944,
          address: "456 River View Dr, Richland, WA",
          building: "Outdoor",
        },
        status: "online",
        batteryLevel: 94,
        signalStrength: 78,
        lastReading: {
          value: 45.2,
          unit: "%RH",
          timestamp: "2025-01-10 14:31:45",
          quality: "good",
        },
        thresholds: {
          min: 30,
          max: 70,
          critical: 85,
        },
        connectivity: "lora",
        firmware: "v1.8.2",
        installDate: "2024-11-20",
      },
      {
        id: "sensor-003",
        name: "Air Quality Monitor",
        type: "air_quality",
        location: {
          lat: 46.2851,
          lng: -119.2944,
          address: "789 Commerce Blvd, Richland, WA",
          building: "Office Complex",
          floor: "1st Floor",
          room: "Lobby",
        },
        status: "online",
        batteryLevel: 76,
        signalStrength: 85,
        lastReading: {
          value: 42,
          unit: "AQI",
          timestamp: "2025-01-10 14:30:22",
          quality: "good",
        },
        thresholds: {
          min: 0,
          max: 50,
          critical: 100,
        },
        connectivity: "wifi",
        firmware: "v3.0.1",
        installDate: "2024-12-01",
      },
      {
        id: "sensor-004",
        name: "Noise Level Monitor",
        type: "noise",
        location: {
          lat: 46.2042,
          lng: -119.7411,
          address: "123 Wine Country Rd, Prosser, WA",
          building: "Building B",
          floor: "Ground Floor",
        },
        status: "low_battery",
        batteryLevel: 15,
        signalStrength: 67,
        lastReading: {
          value: 55.8,
          unit: "dB",
          timestamp: "2025-01-10 14:29:18",
          quality: "fair",
        },
        thresholds: {
          min: 30,
          max: 65,
          critical: 85,
        },
        connectivity: "cellular",
        firmware: "v2.0.5",
        installDate: "2024-10-15",
      },
      {
        id: "sensor-005",
        name: "Vibration Sensor",
        type: "vibration",
        location: {
          lat: 46.2851,
          lng: -119.2944,
          address: "321 Industrial Way, Richland, WA",
          building: "Factory Floor",
        },
        status: "online",
        batteryLevel: 91,
        signalStrength: 88,
        lastReading: {
          value: 2.3,
          unit: "mm/s",
          timestamp: "2025-01-10 14:32:05",
          quality: "excellent",
        },
        thresholds: {
          min: 0,
          max: 5,
          critical: 10,
        },
        connectivity: "lora",
        firmware: "v1.9.4",
        installDate: "2024-09-30",
      },
      {
        id: "sensor-006",
        name: "Water Level Monitor",
        type: "water",
        location: {
          lat: 46.2042,
          lng: -119.7411,
          address: "Water Treatment Plant, Prosser, WA",
          building: "Treatment Facility",
        },
        status: "online",
        batteryLevel: 82,
        signalStrength: 95,
        lastReading: {
          value: 8.7,
          unit: "ft",
          timestamp: "2025-01-10 14:31:30",
          quality: "excellent",
        },
        thresholds: {
          min: 5,
          max: 12,
          critical: 15,
        },
        connectivity: "satellite",
        firmware: "v2.2.1",
        installDate: "2024-08-20",
      },
    ]

    const mockReadings: SensorReading[] = [
      {
        sensorId: "sensor-001",
        timestamp: "2025-01-10 14:32:15",
        value: 72.5,
        unit: "°F",
        quality: 98.5,
      },
      {
        sensorId: "sensor-002",
        timestamp: "2025-01-10 14:31:45",
        value: 45.2,
        unit: "%RH",
        quality: 94.2,
      },
      {
        sensorId: "sensor-003",
        timestamp: "2025-01-10 14:30:22",
        value: 42,
        unit: "AQI",
        quality: 91.8,
        anomaly: false,
      },
      {
        sensorId: "sensor-004",
        timestamp: "2025-01-10 14:29:18",
        value: 55.8,
        unit: "dB",
        quality: 87.3,
      },
      {
        sensorId: "sensor-005",
        timestamp: "2025-01-10 14:32:05",
        value: 2.3,
        unit: "mm/s",
        quality: 96.7,
      },
    ]

    setSensors(mockSensors)
    setRecentReadings(mockReadings)

    const onlineSensors = mockSensors.filter((s) => s.status === "online").length
    const totalDataPoints = mockReadings.length * 24 * 30 // Simulate monthly data
    const avgBattery = mockSensors.reduce((sum, s) => sum + s.batteryLevel, 0) / mockSensors.length
    const avgSignal = mockSensors.reduce((sum, s) => sum + s.signalStrength, 0) / mockSensors.length

    setNetworkStats({
      totalSensors: mockSensors.length,
      onlineSensors,
      dataPoints: totalDataPoints,
      coverage: 94.7,
      avgBattery,
      avgSignal,
    })
  }, [])

  const getSensorIcon = (type: string) => {
    switch (type) {
      case "temperature":
        return <Thermometer className="h-5 w-5" />
      case "humidity":
        return <Droplets className="h-5 w-5" />
      case "air_quality":
        return <Wind className="h-5 w-5" />
      case "noise":
        return <Radio className="h-5 w-5" />
      case "vibration":
        return <Activity className="h-5 w-5" />
      case "water":
        return <Droplets className="h-5 w-5" />
      case "energy":
        return <Zap className="h-5 w-5" />
      case "motion":
        return <Gauge className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800"
      case "offline":
        return "bg-red-100 text-red-800"
      case "maintenance":
        return "bg-blue-100 text-blue-800"
      case "low_battery":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4" />
      case "offline":
      case "error":
        return <Warning className="h-4 w-4" />
      case "maintenance":
        return <Activity className="h-4 w-4" />
      case "low_battery":
        return <Battery className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getConnectivityIcon = (connectivity: string) => {
    switch (connectivity) {
      case "wifi":
        return <Wifi className="h-4 w-4" />
      case "lora":
        return <Radio className="h-4 w-4" />
      case "cellular":
        return <Signal className="h-4 w-4" />
      case "satellite":
        return <Satellite className="h-4 w-4" />
      default:
        return <Wifi className="h-4 w-4" />
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "text-green-600"
      case "good":
        return "text-blue-600"
      case "fair":
        return "text-yellow-600"
      case "poor":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getBatteryColor = (level: number) => {
    if (level > 50) return "text-green-600"
    if (level > 20) return "text-yellow-600"
    return "text-red-600"
  }

  const getSignalColor = (strength: number) => {
    if (strength > 80) return "text-green-600"
    if (strength > 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-3xl font-bold">IoT Sensor Network</h1>
          <p
</> className="text-gray-600">Real-time environmental and infrastructure monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-green-100 text-green-800"><>

            <Activity className="h-4 w-4 mr-1" />
            Network: ACTIVE
          </Badge>
          <Button
</>>
            <MapPin className="h-4 w-4 mr-2" />
            Add Sensor
          </Button>
        </div>
      </div>

      {/* Network Overview */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4" /><>

        <AlertTitle>IoT Network Status: OPERATIONAL</AlertTitle>
        <AlertDescription
</>>
          {networkStats.onlineSensors} of {networkStats.totalSensors} sensors online • {networkStats.coverage}% coverage
          • {networkStats.dataPoints.toLocaleString()} data points collected this month
        </AlertDescription>
      </Alert>

      {/* Network Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{networkStats.totalSensors}</div>
                <div
</> className="text-sm text-gray-600">Total Sensors</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{networkStats.onlineSensors}</div>
                <div
</> className="text-sm text-gray-600">Online</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{(networkStats.dataPoints / 1000).toFixed(1)}K</div>
                <div
</> className="text-sm text-gray-600">Data Points</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MapPin className="h-8 w-8 text-orange-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{networkStats.coverage}%</div>
                <div
</> className="text-sm text-gray-600">Coverage</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Battery className="h-8 w-8 text-yellow-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{networkStats.avgBattery.toFixed(0)}%</div>
                <div
</> className="text-sm text-gray-600">Avg Battery</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Signal className="h-8 w-8 text-red-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{networkStats.avgSignal.toFixed(0)}%</div>
                <div
</> className="text-sm text-gray-600">Avg Signal</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sensors" className="w-full">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="sensors">Sensor Status</TabsTrigger>
          <TabsTrigger
</> value="readings">Live Readings</TabsTrigger><>

          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger
</> value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="sensors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sensors.map((sensor) => (
              <Card key={sensor.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between"><>

                    <div className="flex items-center gap-3">
                      {getSensorIcon(sensor.type)}
                      {sensor.name}
                    </div>
                    <Badge
</> className={getStatusColor(sensor.status)}>
                      {getStatusIcon(sensor.status)}
                      <span className="ml-1">{sensor.status.replace("_", " ").toUpperCase()}</span>
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {sensor.location.address}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><>

                        <div className="text-sm font-medium">Current Reading</div>
                        <div
</> className="text-2xl font-bold text-blue-600">
                          {sensor.lastReading.value} {sensor.lastReading.unit}
                        </div>
                        <div className={`text-xs ${getQualityColor(sensor.lastReading.quality)}`}>
                          {sensor.lastReading.quality.toUpperCase()}
                        </div>
                      </div>
                      <div><>

                        <div className="text-sm font-medium">Last Update</div>
                        <div
</> className="text-sm">{new Date(sensor.lastReading.timestamp).toLocaleTimeString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(sensor.lastReading.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1"><>

                          <span>Battery</span>
                          <span
</> className={getBatteryColor(sensor.batteryLevel)}>{sensor.batteryLevel}%</span>
                        </div><>

                        <Progress value={sensor.batteryLevel} />
                      </div>
                      <div
</>>
                        <div className="flex justify-between text-sm mb-1"><>

                          <span>Signal</span>
                          <span
</> className={getSignalColor(sensor.signalStrength)}>{sensor.signalStrength}%</span>
                        </div>
                        <Progress value={sensor.signalStrength} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><>

                        <span className="text-gray-600">Connectivity:</span>
                        <div
</> className="flex items-center gap-1 mt-1">
                          {getConnectivityIcon(sensor.connectivity)}
                          <span className="capitalize">{sensor.connectivity}</span>
                        </div>
                      </div>
                      <div><>

                        <span className="text-gray-600">Firmware:</span>
                        <div
</> className="mt-1">{sensor.firmware}</div>
                      </div>
                      <div><>

                        <span className="text-gray-600">Installed:</span>
                        <div
</> className="mt-1">{new Date(sensor.installDate).toLocaleDateString()}</div>
                      </div>
                      <div><>

                        <span className="text-gray-600">Location:</span>
                        <div
</> className="mt-1">
                          {sensor.location.building}
                          {sensor.location.floor && `, ${sensor.location.floor}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2"><>

                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button
</> size="sm" variant="outline">
                        Configure
                      </Button>
                      {sensor.status === "low_battery" && (
                        <Button size="sm" variant="outline">
                          Schedule Maintenance
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="readings" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Real-time Sensor Readings</CardTitle>
              <CardDescription
</>>Live data from all active sensors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReadings.map((reading /* , index */) => {
                  const sensor = sensors.find((s) => s.id === reading.sensorId)
                  return (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {sensor && getSensorIcon(sensor.type)}
                        <div><>

                          <div className="font-medium">{sensor?.name}</div>
                          <div
</> className="text-sm text-gray-600">
                            {new Date(reading.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right"><>

                        <div className="text-2xl font-bold text-blue-600">
                          {reading.value} {reading.unit}
                        </div>
                        <div
</> className="text-sm text-gray-600">Quality: {reading.quality.toFixed(1)}%</div>
                        {reading.anomaly && <Badge className="bg-red-100 text-red-800">ANOMALY</Badge>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><>

                <CardTitle>Sensor Performance</CardTitle>
                <CardDescription
</>>Network performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg"><>

                      <div className="text-2xl font-bold text-green-600">99.7%</div>
                      <div
</> className="text-sm text-gray-600">Uptime</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg"><>

                      <div className="text-2xl font-bold text-blue-600">1.2s</div>
                      <div
</> className="text-sm text-gray-600">Avg Latency</div>
                    </div>
                  </div>

                  <div><>

                    <div className="text-sm font-medium mb-2">Data Quality Distribution</div>
                    <div
</> className="space-y-2">
                      <div className="flex justify-between text-sm"><>

                        <span>Excellent</span>
                        <span
</>>78.5%</span>
                      </div>
                      <Progress value={78.5} />
                      <div className="flex justify-between text-sm"><>

                        <span>Good</span>
                        <span
</>>18.2%</span>
                      </div>
                      <Progress value={18.2} />
                      <div className="flex justify-between text-sm"><>

                        <span>Fair</span>
                        <span
</>>3.1%</span>
                      </div>
                      <Progress value={3.1} />
                      <div className="flex justify-between text-sm"><>

                        <span>Poor</span>
                        <span
</>>0.2%</span>
                      </div>
                      <Progress value={0.2} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><>

                <CardTitle>Environmental Trends</CardTitle>
                <CardDescription
</>>24-hour environmental data summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: "Temperature", avg: "72.3°F", trend: "+1.2°F", status: "normal" },
                    { type: "Humidity", avg: "45.8%", trend: "-2.1%", status: "normal" },
                    { type: "Air Quality", avg: "42 AQI", trend: "+3 AQI", status: "good" },
                    { type: "Noise Level", avg: "55.2 dB", trend: "+1.8 dB", status: "normal" },
                  ].map((metric /* , index */) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div><>

                        <div className="font-medium">{metric.type}</div>
                        <div
</> className="text-sm text-gray-600">{metric.status}</div>
                      </div>
                      <div className="text-right"><>

                        <div className="font-bold">{metric.avg}</div>
                        <div
</> className="text-sm text-gray-600">{metric.trend}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><>

                  <Warning className="h-5 w-5" />
                  Maintenance Alerts
                </CardTitle>
                <CardDescription
</>>Sensors requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sensors
                    .filter((s) => s.status === "low_battery" || s.batteryLevel < 20)
                    .map((sensor) => (
                      <div key={sensor.id} className="border rounded-lg p-3 border-yellow-200 bg-yellow-50">
                        <div className="flex justify-between items-start">
                          <div><>

                            <div className="font-medium">{sensor.name}</div>
                            <div
</> className="text-sm text-gray-600">{sensor.location.address}</div>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">LOW BATTERY</Badge>
                        </div><>

                        <div className="mt-2 text-sm">
                          Battery: {sensor.batteryLevel}% • Estimated time remaining: 2-3 days
                        </div>
                        <Button
</> size="sm" className="mt-2">
                          Schedule Replacement
                        </Button>
                      </div>
                    ))}

                  {sensors.filter((s) => s.status === "low_battery" || s.batteryLevel < 20).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" /><>

                      <div>No maintenance alerts</div>
                      <div
</> className="text-sm">All sensors operating normally</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><>

                <CardTitle>Maintenance Schedule</CardTitle>
                <CardDescription
</>>Upcoming maintenance activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      sensor: "Building A - HVAC Monitor",
                      task: "Firmware Update",
                      date: "2025-01-15",
                      priority: "medium",
                    },
                    {
                      sensor: "Noise Level Monitor",
                      task: "Battery Replacement",
                      date: "2025-01-12",
                      priority: "high",
                    },
                    {
                      sensor: "Air Quality Monitor",
                      task: "Calibration Check",
                      date: "2025-01-20",
                      priority: "low",
                    },
                  ].map((item /* , index */) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div><>

                        <div className="font-medium">{item.sensor}</div>
                        <div
</> className="text-sm text-gray-600">{item.task}</div>
                      </div>
                      <div className="text-right"><>

                        <div className="text-sm font-medium">{item.date}</div>
                        <Badge
</>
                          className={
                            item.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : item.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                          }
                        >
                          {item.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Activity className="h-4 w-4" /><>

            <AlertTitle>Predictive Maintenance</AlertTitle>
            <AlertDescription
</>>
              TerraFusionAssessor-1 uses AI-powered predictive analytics to forecast sensor maintenance needs, optimize
              battery life, and prevent network downtime. Maintenance schedules are automatically generated based on
              usage patterns and environmental conditions.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}
