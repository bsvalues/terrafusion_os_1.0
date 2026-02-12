"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Smartphone, Camera, Ruler, Eye, Zap, MapPin, Layers, Target, Scan, Compass, Wifi, Battery  } from '@mui/icons-material'

interface ARMeasurement {
  id: string
  type: "length" | "width" | "height" | "area" | "volume"
  value: number
  unit: string
  accuracy: number
  timestamp: string
}

interface ARAnnotation {
  id: string
  type: "damage" | "feature" | "measurement" | "note"
  position: { x: number; y: number; z: number }
  content: string
  severity?: "low" | "medium" | "high" | "critical"
}

export default function ARFieldAssessment() {
  const [isARActive, setIsARActive] = useState(false)
  const [measurements, setMeasurements] = useState<ARMeasurement[]>([])
  const [annotations, setAnnotations] = useState<ARAnnotation[]>([])
  const [deviceStatus, setDeviceStatus] = useState({
    battery: 87,
    gps: true,
    camera: true,
    sensors: true,
    network: "4G",
  })

  const mockMeasurements: ARMeasurement[] = [
    {
      id: "ar-m-001",
      type: "length",
      value: 42.5,
      unit: "ft",
      accuracy: 98.2,
      timestamp: "2025-01-10 14:32:15",
    },
    {
      id: "ar-m-002",
      type: "width",
      value: 28.0,
      unit: "ft",
      accuracy: 97.8,
      timestamp: "2025-01-10 14:32:45",
    },
    {
      id: "ar-m-003",
      type: "height",
      value: 12.5,
      unit: "ft",
      accuracy: 96.1,
      timestamp: "2025-01-10 14:33:12",
    },
  ]

  const mockAnnotations: ARAnnotation[] = [
    {
      id: "ar-a-001",
      type: "damage",
      position: { x: 10.2, y: 8.5, z: 2.1 },
      content: "Roof shingle damage - approximately 15 sq ft affected",
      severity: "medium",
    },
    {
      id: "ar-a-002",
      type: "feature",
      position: { x: 5.8, y: 12.3, z: 0.0 },
      content: "New deck addition - cedar construction, good condition",
    },
  ]

  const startARSession = () => {
    setIsARActive(true)
    setMeasurements(mockMeasurements)
    setAnnotations(mockAnnotations)
  }

  const stopARSession = () => {
    setIsARActive(false)
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
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

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Mobile Header */}
      <div className="bg-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-6 w-6" />
            <span className="font-bold">AR Field Assessment</span>
          </div>
          <div className="flex items-center gap-2">
            <Battery className="h-4 w-4" /><>

            <span className="text-sm">{deviceStatus.battery}%</span>
            <Badge
</> className={isARActive ? "bg-green-500" : "bg-gray-500"}>
              {isARActive ? "AR ACTIVE" : "AR READY"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Device Status */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <MapPin className={`h-3 w-3 ${deviceStatus.gps ? "text-green-500" : "text-red-500"}`} />
            <span>GPS</span>
          </div>
          <div className="flex items-center gap-1">
            <Camera className={`h-3 w-3 ${deviceStatus.camera ? "text-green-500" : "text-red-500"}`} />
            <span>Camera</span>
          </div>
          <div className="flex items-center gap-1">
            <Compass className={`h-3 w-3 ${deviceStatus.sensors ? "text-green-500" : "text-red-500"}`} />
            <span>Sensors</span>
          </div>
          <div className="flex items-center gap-1">
            <Wifi className="h-3 w-3 text-blue-500" />
            <span>{deviceStatus.network}</span>
          </div>
        </div>
      </div>

      {/* AR Camera View */}
      {isARActive && (
        <div className="relative bg-black h-64 flex items-center justify-center">
          <div className="text-white text-center">
            <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" /><>

            <div className="text-sm">AR Camera View</div>
            <div
</> className="text-xs opacity-75">Point camera at property features</div>
          </div>

          {/* AR Overlays */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs"><>

            <Ruler className="h-3 w-3 inline mr-1" />
            42.5 ft
          </div>
          <div
</> className="absolute bottom-4 right-4 bg-red-500 bg-opacity-75 text-white px-2 py-1 rounded text-xs"><>

            <Target className="h-3 w-3 inline mr-1" />
            Damage Detected
          </div>
          <div
</> className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="measure" className="w-full">
        <TabsList className="grid w-full grid-cols-4 text-xs"><>

          <TabsTrigger value="measure">Measure</TabsTrigger>
          <TabsTrigger
</> value="annotate">Annotate</TabsTrigger><>

          <TabsTrigger value="scan">3D Scan</TabsTrigger>
          <TabsTrigger
</> value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="measure" className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                AR Measurements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isARActive ? (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" /><>

                  <div className="text-lg font-medium mb-2">Start AR Session</div>
                  <div
</> className="text-sm text-gray-600 mb-4">
                    Use augmented reality to measure property features accurately
                  </div>
                  <Button onClick={startARSession} className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Activate AR Camera
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><>

                    <span className="text-sm font-medium">AR Session Active</span>
                    <Button
</> size="sm" variant="outline" onClick={stopARSession}>
                      Stop AR
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button className="h-16 flex flex-col items-center justify-center gap-1">
                      <Ruler className="h-5 w-5" />
                      <span className="text-xs">Length</span>
                    </Button>
                    <Button className="h-16 flex flex-col items-center justify-center gap-1" variant="outline">
                      <Ruler className="h-5 w-5" />
                      <span className="text-xs">Width</span>
                    </Button>
                    <Button className="h-16 flex flex-col items-center justify-center gap-1" variant="outline">
                      <Ruler className="h-5 w-5" />
                      <span className="text-xs">Height</span>
                    </Button>
                    <Button className="h-16 flex flex-col items-center justify-center gap-1" variant="outline">
                      <Layers className="h-5 w-5" />
                      <span className="text-xs">Area</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Recent Measurements</div>
                    {measurements.map((measurement) => (
                      <div key={measurement.id} className="flex justify-between items-center p-2 border rounded">
                        <div><>

                          <div className="font-medium">
                            {measurement.type.charAt(0).toUpperCase() + measurement.type.slice(1)}
                          </div>
                          <div
</> className="text-xs text-gray-600">{measurement.accuracy}% accuracy</div>
                        </div>
                        <div className="text-right"><>

                          <div className="font-bold">
                            {measurement.value} {measurement.unit}
                          </div>
                          <div
</> className="text-xs text-gray-600">
                            {new Date(measurement.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="annotate" className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                AR Annotations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isARActive ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="h-16 flex flex-col items-center justify-center gap-1">
                      <Target className="h-5 w-5" />
                      <span className="text-xs">Mark Damage</span>
                    </Button>
                    <Button className="h-16 flex flex-col items-center justify-center gap-1" variant="outline">
                      <Eye className="h-5 w-5" />
                      <span className="text-xs">Add Feature</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Active Annotations</div>
                    {annotations.map((annotation) => (
                      <div key={annotation.id} className="border rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium capitalize">{annotation.type}</div>
                          {annotation.severity && (
                            <Badge className={getSeverityColor(annotation.severity)}>
                              {annotation.severity.toUpperCase()}
                            </Badge>
                          )}
                        </div><>

                        <div className="text-sm text-gray-700 mb-2">{annotation.content}</div>
                        <div
</> className="text-xs text-gray-500">
                          Position: ({annotation.position.x.toFixed(1)}, {annotation.position.y.toFixed(1)},{" "}
                          {annotation.position.z.toFixed(1)})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" /><>

                  <div className="text-lg font-medium mb-2">Start AR Session</div>
                  <div
</> className="text-sm text-gray-600 mb-4">
                    Activate AR mode to add spatial annotations to property features
                  </div>
                  <Button onClick={startARSession} className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Activate AR Camera
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scan" className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Scan className="h-5 w-5" />
                3D Property Scan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isARActive ? (
                <div className="space-y-4">
                  <Alert>
                    <Scan className="h-4 w-4" /><>

                    <AlertTitle>3D Scanning Mode</AlertTitle>
                    <AlertDescription
</>>
                      Move your device slowly around the property to capture a complete 3D model
                    </AlertDescription>
                  </Alert>

                  <div className="text-center py-4"><>

                    <div className="text-3xl font-bold text-blue-600">73%</div>
                    <div
</> className="text-sm text-gray-600">Scan Progress</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "73%" }}></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 border rounded"><>

                      <div className="font-bold">2,847</div>
                      <div
</> className="text-gray-600">Points Captured</div>
                    </div>
                    <div className="text-center p-3 border rounded"><>

                      <div className="font-bold">94.2%</div>
                      <div
</> className="text-gray-600">Accuracy</div>
                    </div>
                  </div>

                  <Button className="w-full">
                    <Scan className="h-4 w-4 mr-2" />
                    Complete 3D Scan
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Scan className="h-12 w-12 mx-auto text-gray-400 mb-4" /><>

                  <div className="text-lg font-medium mb-2">3D Property Scanning</div>
                  <div
</> className="text-sm text-gray-600 mb-4">
                    Create detailed 3D models of property structures using AR technology
                  </div>
                  <Button onClick={startARSession} className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Start 3D Scan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Session Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded"><>

                  <div className="text-2xl font-bold text-green-600">{measurements.length}</div>
                  <div
</> className="text-sm text-gray-600">Measurements</div>
                </div>
                <div className="text-center p-3 border rounded"><>

                  <div className="text-2xl font-bold text-blue-600">{annotations.length}</div>
                  <div
</> className="text-sm text-gray-600">Annotations</div>
                </div>
              </div>

              <div className="space-y-2"><>

                <div className="text-sm font-medium">Export Options</div>
                <div
</> className="grid grid-cols-1 gap-2"><>

                  <Button variant="outline" size="sm">
                    Export to PDF Report
                  </Button>
                  <Button
</> variant="outline" size="sm">
                    Save 3D Model
                  </Button>
                  <Button variant="outline" size="sm">
                    Sync to Cloud
                  </Button>
                </div>
              </div>

              <Alert>
                <Smartphone className="h-4 w-4" /><>

                <AlertTitle>Data Sync Status</AlertTitle>
                <AlertDescription
</>>
                  All measurements and annotations are automatically saved locally and will sync when connected to WiFi.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-md mx-auto">
          {!isARActive ? (
            <Button onClick={startARSession} className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              Start AR Assessment
            </Button>
          ) : (
            <div className="flex gap-3"><>

              <Button variant="outline" className="flex-1" onClick={stopARSession}>
                Stop AR
              </Button>
              <Button
</> className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
