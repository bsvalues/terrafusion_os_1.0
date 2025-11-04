"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Satellite,
  MapPin,
  Calendar,
  Zap,
  Warning,
  TrendingUp,
  Home,
  TreePine,
  Building,
  Waves,
  Mountain,
 } from '@mui/icons-material'

interface ChangeDetection {
  id: string
  parcelId: string
  address: string
  changeType: "construction" | "demolition" | "addition" | "landscaping" | "pool" | "outbuilding"
  confidence: number
  detectedDate: string
  impactLevel: "low" | "medium" | "high" | "critical"
  estimatedValue: number
  description: string
  beforeImage: string
  afterImage: string
  coordinates: { lat: number; lng: number }
}

interface SatelliteData {
  provider: string
  resolution: string
  captureDate: string
  cloudCover: number
  quality: "excellent" | "good" | "fair" | "poor"
}

export default function SatelliteImageryIntegration() {
  const [detections, setDetections] = useState<ChangeDetection[]>([])
  const [satelliteData, setSatelliteData] = useState<SatelliteData[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)

  useEffect(() => {
    const mockDetections: ChangeDetection[] = [
      {
        id: "sat-001",
        parcelId: "362301-100045",
        address: "123 Wine Country Rd, Prosser, WA",
        changeType: "addition",
        confidence: 92.4,
        detectedDate: "2025-01-08",
        impactLevel: "high",
        estimatedValue: 85000,
        description: "New residential addition detected on east side of property",
        beforeImage: "/placeholder.svg?height=200&width=300",
        afterImage: "/placeholder.svg?height=200&width=300",
        coordinates: { lat: 46.2042, lng: -119.7411 },
      },
      {
        id: "sat-002",
        parcelId: "362301-200078",
        address: "456 River View Dr, Richland, WA",
        changeType: "pool",
        confidence: 89.7,
        detectedDate: "2025-01-05",
        impactLevel: "medium",
        estimatedValue: 45000,
        description: "In-ground swimming pool installation detected in backyard",
        beforeImage: "/placeholder.svg?height=200&width=300",
        afterImage: "/placeholder.svg?height=200&width=300",
        coordinates: { lat: 46.2851, lng: -119.2944 },
      },
      {
        id: "sat-003",
        parcelId: "362301-300012",
        address: "789 Commerce Blvd, Richland, WA",
        changeType: "construction",
        confidence: 96.1,
        detectedDate: "2025-01-03",
        impactLevel: "critical",
        estimatedValue: 250000,
        description: "New commercial building construction in progress",
        beforeImage: "/placeholder.svg?height=200&width=300",
        afterImage: "/placeholder.svg?height=200&width=300",
        coordinates: { lat: 46.2851, lng: -119.2944 },
      },
    ]

    const mockSatelliteData: SatelliteData[] = [
      {
        provider: "Maxar WorldView-3",
        resolution: "0.31m",
        captureDate: "2025-01-10",
        cloudCover: 5,
        quality: "excellent",
      },
      {
        provider: "Planet SkySat",
        resolution: "0.50m",
        captureDate: "2025-01-09",
        cloudCover: 15,
        quality: "good",
      },
      {
        provider: "Sentinel-2",
        resolution: "10m",
        captureDate: "2025-01-08",
        cloudCover: 8,
        quality: "good",
      },
    ]

    setDetections(mockDetections)
    setSatelliteData(mockSatelliteData)
  }, [])

  const startScan = () => {
    setIsScanning(true)
    setScanProgress(0)

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsScanning(false)
          return 100
        }
        return prev + 8
      })
    }, 400)
  }

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case "construction":
        return <Building className="h-4 w-4" />
      case "addition":
        return <Home className="h-4 w-4" />
      case "pool":
        return <Waves className="h-4 w-4" />
      case "landscaping":
        return <TreePine className="h-4 w-4" />
      case "outbuilding":
        return <Home className="h-4 w-4" />
      case "demolition":
        return <Warning className="h-4 w-4" />
      default:
        return <Mountain className="h-4 w-4" />
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
<>

          <h1 className="text-3xl font-bold">Satellite Imagery Integration</h1>
          <p
</>

className="text-gray-600">Real-time property change detection from space</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-green-100 text-green-800">
<>

            <Satellite className="h-4 w-4 mr-1" />
            Live Monitoring: ACTIVE
          </Badge>
          <Button
</>

onClick={startScan} disabled={isScanning}>
            <Zap className="h-4 w-4 mr-2" />
            {isScanning ? "Scanning..." : "Start Area Scan"}
          </Button>
        </div>
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Satellite className="h-6 w-6 text-green-600 animate-pulse" />
                <div>
<>

                  <div className="font-medium">Satellite Analysis in Progress</div>
                  <div
</>

className="text-sm text-gray-600">Scanning Benton County for property changes</div>
                </div>
              </div>
              <Progress value={scanProgress} className="w-full" />
              <div className="grid grid-cols-4 gap-4 text-sm">
<>

                <div className={scanProgress >= 25 ? "text-green-600" : "text-gray-400"}>✓ Image acquisition</div>
                <div
</>

className={scanProgress >= 50 ? "text-green-600" : "text-gray-400"}>✓ Change detection</div>
<>

                <div className={scanProgress >= 75 ? "text-green-600" : "text-gray-400"}>✓ Impact analysis</div>
                <div
</>

className={scanProgress >= 100 ? "text-green-600" : "text-gray-400"}>✓ Report generation</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="detections" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
<>

          <TabsTrigger value="detections">Change Detections</TabsTrigger>
          <TabsTrigger
</>

value="monitoring">Live Monitoring</TabsTrigger>
<>

          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger
</>

value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="detections" className="space-y-4">
          {detections.map((detection) => (
            <Card key={detection.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getChangeTypeIcon(detection.changeType)}
                    <div>
<>

                      <div>{detection.changeType.charAt(0).toUpperCase() + detection.changeType.slice(1)} Detected</div>
                      <div
</>

className="text-sm font-normal text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {detection.address}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
<>

                    <Badge className={getImpactColor(detection.impactLevel)}>
                      {detection.impactLevel.toUpperCase()}
                    </Badge>
                    <Badge
</>

variant="outline">{detection.confidence}% Confidence</Badge>
                  </div>
                </CardTitle>
                <CardDescription>
                  Parcel: {detection.parcelId} • Detected: {new Date(detection.detectedDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Before/After Images */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
<>

                        <div className="text-sm font-medium mb-2">Before</div>
                        <img
</>

                          src={detection.beforeImage || "/placeholder.svg"}
                          alt="Before satellite image"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                      <div>
<>

                        <div className="text-sm font-medium mb-2">After</div>
                        <img
</>

                          src={detection.afterImage || "/placeholder.svg"}
                          alt="After satellite image"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{detection.description}</p>
                  </div>

                  {/* Detection Details */}
                  <div className="space-y-4">
                    <div className="text-center p-4 border rounded-lg">
<>

                      <div className="text-2xl font-bold text-green-600">
                        ${detection.estimatedValue.toLocaleString()}
                      </div>
                      <div
</>

className="text-sm text-gray-600">Estimated Value Impact</div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
<>

                        <span>Coordinates:</span>
                        <span
</>

className="font-mono">
                          {detection.coordinates.lat.toFixed(4)}, {detection.coordinates.lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
<>

                        <span>Detection Date:</span>
                        <span
</>

</>>{new Date(detection.detectedDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
<>

                        <span>Confidence:</span>
                        <span
</>

className="font-medium">{detection.confidence}%</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button size="sm">
<>

                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Inspection
                      </Button>
                      <Button
</>

size="sm" variant="outline">
<>

                        <TrendingUp className="h-4 w-4 mr-2" />
                        Update Assessment
                      </Button>
                      <Button
</>

size="sm" variant="outline">
                        <MapPin className="h-4 w-4 mr-2" />
                        View on Map
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
<>

                    <div className="text-3xl font-bold text-green-600">2,847</div>
                    <div
</>

className="text-sm text-gray-600">Properties Monitored</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 border rounded">
<>

                      <div className="font-bold text-blue-600">23</div>
                      <div
</>

className="text-gray-600">Changes Today</div>
                    </div>
                    <div className="text-center p-2 border rounded">
<>

                      <div className="font-bold text-orange-600">156</div>
                      <div
</>

className="text-gray-600">This Week</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detection Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { type: "Construction", count: 45, icon: Building },
                    { type: "Additions", count: 32, icon: Home },
                    { type: "Pools", count: 18, icon: Waves },
                    { type: "Landscaping", count: 61, icon: TreePine },
                  ].map((item /* , index */) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">{item.type}</span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coverage Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
<>

                      <span>Benton County</span>
                      <span
</>

</>>100%</span>
                    </div>
<>

                    <Progress value={100} />
                  </div>
                  <div
</>

</>>
                    <div className="flex justify-between text-sm mb-1">
<>

                      <span>Yakima County</span>
                      <span
</>

</>>87%</span>
                    </div>
<>

                    <Progress value={87} />
                  </div>
                  <div
</>

</>>
                    <div className="flex justify-between text-sm mb-1">
<>

                      <span>Walla Walla County</span>
                      <span
</>

</>>92%</span>
                    </div>
                    <Progress value={92} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
<>

              <CardTitle>Real-time Monitoring Dashboard</CardTitle>
              <CardDescription
</>

</>>Live satellite feed and change detection status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
<>

                  <h4 className="font-semibold">Recent Activity</h4>
                  <div
</>

className="space-y-2">
                    {[
                      { time: "14:32", event: "New construction detected - Parcel 362301-400123" },
                      { time: "13:45", event: "Pool installation confirmed - Parcel 362301-200089" },
                      { time: "12:18", event: "Building addition verified - Parcel 362301-150067" },
                      { time: "11:52", event: "Landscaping change detected - Parcel 362301-300045" },
                    ].map((activity /* , index */) => (
                      <div key={index} className="flex gap-3 p-2 border rounded text-sm">
<>

                        <span className="text-gray-500 font-mono">{activity.time}</span>
                        <span
</>

</>>{activity.event}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
<>

                  <h4 className="font-semibold">System Status</h4>
                  <div
</>

className="space-y-3">
                    <div className="flex justify-between items-center">
<>

                      <span className="text-sm">Satellite Connection</span>
                      <Badge
</>

className="bg-green-100 text-green-800">ONLINE</Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>

                      <span className="text-sm">Change Detection AI</span>
                      <Badge
</>

className="bg-green-100 text-green-800">ACTIVE</Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>

                      <span className="text-sm">Data Processing</span>
                      <Badge
</>

className="bg-blue-100 text-blue-800">PROCESSING</Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>

                      <span className="text-sm">Alert System</span>
                      <Badge
</>

className="bg-green-100 text-green-800">READY</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
<>

                <CardTitle>Satellite Data Providers</CardTitle>
                <CardDescription
</>

</>>Current imagery sources and specifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {satelliteData.map((source /* , index */) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
<>

                        <div className="font-medium">{source.provider}</div>
                        <Badge
</>

className={`${getQualityColor(source.quality)} bg-opacity-10`}>
                          {source.quality.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
<>

                          <span className="text-gray-600">Resolution:</span>
                          <div
</>

className="font-medium">{source.resolution}</div>
                        </div>
                        <div>
<>

                          <span className="text-gray-600">Capture Date:</span>
                          <div
</>

className="font-medium">{new Date(source.captureDate).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
<>

                          <span className="text-gray-600">Cloud Cover</span>
                          <span
</>

</>>{source.cloudCover}%</span>
                        </div>
                        <Progress value={100 - source.cloudCover} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
<>

                <CardTitle>Data Acquisition Schedule</CardTitle>
                <CardDescription
</>

</>>Planned satellite imagery updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: "2025-01-12", provider: "Maxar WorldView-3", coverage: "Full County" },
                    { date: "2025-01-15", provider: "Planet SkySat", coverage: "Urban Areas" },
                    { date: "2025-01-18", provider: "Sentinel-2", coverage: "Agricultural Zones" },
                    { date: "2025-01-22", provider: "Maxar WorldView-3", coverage: "Full County" },
                  ].map((schedule /* , index */) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
<>

                        <div className="font-medium">{new Date(schedule.date).toLocaleDateString()}</div>
                        <div
</>

className="text-sm text-gray-600">{schedule.provider}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{schedule.coverage}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detection Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
<>

                  <div className="text-3xl font-bold text-green-600">94.7%</div>
                  <div
</>

className="text-sm text-gray-600">Overall Accuracy</div>
                  <Progress value={94.7} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Value Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
<>

                  <div className="text-3xl font-bold text-blue-600">$2.1M</div>
                  <div
</>

className="text-sm text-gray-600">Total Value Detected</div>
                  <div className="text-xs text-gray-500 mt-1">This Month</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
<>

                  <div className="text-3xl font-bold text-purple-600">2.3</div>
                  <div
</>

className="text-sm text-gray-600">Days Average</div>
                  <div className="text-xs text-gray-500 mt-1">Detection to Alert</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
<>

              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription
</>

</>>Change detection patterns and seasonal analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
<>

                  <h4 className="font-semibold mb-3">Change Types by Month</h4>
                  <div
</>

className="space-y-2">
                    {[
                      { month: "December", construction: 12, additions: 8, pools: 2, landscaping: 15 },
                      { month: "January", construction: 18, additions: 12, pools: 1, landscaping: 8 },
                    ].map((month /* , index */) => (
                      <div key={index} className="border rounded p-3">
<>

                        <div className="font-medium mb-2">{month.month}</div>
                        <div
</>

className="grid grid-cols-4 gap-2 text-xs">
                          <div className="text-center">
<>

                            <div className="font-bold">{month.construction}</div>
                            <div
</>

className="text-gray-600">Construction</div>
                          </div>
                          <div className="text-center">
<>

                            <div className="font-bold">{month.additions}</div>
                            <div
</>

className="text-gray-600">Additions</div>
                          </div>
                          <div className="text-center">
<>

                            <div className="font-bold">{month.pools}</div>
                            <div
</>

className="text-gray-600">Pools</div>
                          </div>
                          <div className="text-center">
<>

                            <div className="font-bold">{month.landscaping}</div>
                            <div
</>

className="text-gray-600">Landscaping</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
<>

                  <h4 className="font-semibold mb-3">Performance Metrics</h4>
                  <div
</>

className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
<>

                        <span>Detection Rate</span>
                        <span
</>

</>>96.2%</span>
                      </div>
<>

                      <Progress value={96.2} />
                    </div>
                    <div
</>

</>>
                      <div className="flex justify-between text-sm mb-1">
<>

                        <span>False Positives</span>
                        <span
</>

</>>3.1%</span>
                      </div>
<>

                      <Progress value={3.1} />
                    </div>
                    <div
</>

</>>
                      <div className="flex justify-between text-sm mb-1">
<>

                        <span>Processing Speed</span>
                        <span
</>

</>>87%</span>
                      </div>
                      <Progress value={87} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
