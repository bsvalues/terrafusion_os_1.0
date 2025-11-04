"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Smartphone, Camera, MapPin, Ruler, Home, Upload, Wifi, WifiOff, CheckCircle, Clock  } from '@mui/icons-material'

export default function MobileFieldApp() {
  const [isOnline, setIsOnline] = useState(true)
  const [currentProperty, setCurrentProperty] = useState({
    parcelId: "362301-100045",
    address: "123 Wine Country Rd, Prosser, WA",
    ownerName: "John & Mary Smith",
    propertyType: "Residential",
    lastAssessment: 485000,
  })

  const [fieldData, setFieldData] = useState({
    exteriorCondition: "",
    roofCondition: "",
    foundationCondition: "",
    notes: "",
    photos: [] as string[],
    measurements: {
      length: "",
      width: "",
      stories: "",
    },
  })

  const [syncStatus, setSyncStatus] = useState({
    pendingUploads: 3,
    lastSync: "2025-01-10 14:30:00",
    totalAssessments: 12,
  })

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Mobile Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            <span className="font-bold">Terrafusion Mobile</span>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-5 w-5 text-green-300" /> : <WifiOff className="h-5 w-5 text-red-300" />}
            <Badge className="bg-white text-blue-600">Field Mode</Badge>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>Last sync: {syncStatus.lastSync}</span>
          </div>
          <div className="flex items-center gap-2">
            {syncStatus.pendingUploads > 0 ? (
              <Badge className="bg-orange-100 text-orange-800">{syncStatus.pendingUploads} pending</Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Synced
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="property" className="w-full">
        <TabsList className="grid w-full grid-cols-4 text-xs">
<>

          <TabsTrigger value="property">Property</TabsTrigger>
          <TabsTrigger
</>

value="photos">Photos</TabsTrigger>
<>

          <TabsTrigger value="measure">Measure</TabsTrigger>
          <TabsTrigger
</>

value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="property" className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="h-5 w-5" />
                Current Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
<>

                <div className="text-sm font-medium">Parcel ID</div>
                <div
</>

className="text-lg font-bold">{currentProperty.parcelId}</div>
              </div>
              <div>
<>

                <div className="text-sm font-medium">Address</div>
                <div
</>

className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{currentProperty.address}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
<>

                  <div className="text-sm font-medium">Owner</div>
                  <div
</>

</>>{currentProperty.ownerName}</div>
                </div>
                <div>
<>

                  <div className="text-sm font-medium">Type</div>
                  <div
</>

</>>{currentProperty.propertyType}</div>
                </div>
              </div>
              <div>
<>

                <div className="text-sm font-medium">Last Assessment</div>
                <div
</>

className="text-lg font-bold text-green-600">
                  ${currentProperty.lastAssessment.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Property Condition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
<>

                <label className="text-sm font-medium">Exterior Condition</label>
                <select
</>

                  className="w-full mt-1 p-2 border rounded-md"
                  value={fieldData.exteriorCondition}
                  onChange={(e) => setFieldData({ ...fieldData, exteriorCondition: e.target.value })}
                >
<>

                  <option value="">Select condition</option>
                  <option
</>

value="excellent">Excellent</option>
<>

                  <option value="good">Good</option>
                  <option
</>

value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
<>

                <label className="text-sm font-medium">Roof Condition</label>
                <select
</>

                  className="w-full mt-1 p-2 border rounded-md"
                  value={fieldData.roofCondition}
                  onChange={(e) => setFieldData({ ...fieldData, roofCondition: e.target.value })}
                >
<>

                  <option value="">Select condition</option>
                  <option
</>

value="excellent">Excellent</option>
<>

                  <option value="good">Good</option>
                  <option
</>

value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
<>

                <label className="text-sm font-medium">Foundation</label>
                <select
</>

                  className="w-full mt-1 p-2 border rounded-md"
                  value={fieldData.foundationCondition}
                  onChange={(e) => setFieldData({ ...fieldData, foundationCondition: e.target.value })}
                >
<>

                  <option value="">Select condition</option>
                  <option
</>

value="excellent">Excellent</option>
<>

                  <option value="good">Good</option>
                  <option
</>

value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Property Photos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button className="h-24 flex flex-col items-center justify-center gap-2">
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">Front View</span>
                </Button>
                <Button className="h-24 flex flex-col items-center justify-center gap-2" variant="outline">
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">Rear View</span>
                </Button>
                <Button className="h-24 flex flex-col items-center justify-center gap-2" variant="outline">
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">Left Side</span>
                </Button>
                <Button className="h-24 flex flex-col items-center justify-center gap-2" variant="outline">
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">Right Side</span>
                </Button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <div className="text-sm text-gray-600">Tap camera buttons above or drag photos here</div>
              </div>

              <div className="text-xs text-gray-500">
                Photos will be automatically geotagged and uploaded when online
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measure" className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Measurements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
<>

                  <label className="text-sm font-medium">Length (ft)</label>
                  <Input
</>

                    type="number"
                    placeholder="0"
                    value={fieldData.measurements.length}
                    onChange={(e) =>
                      setFieldData({
                        ...fieldData,
                        measurements: { ...fieldData.measurements, length: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
<>

                  <label className="text-sm font-medium">Width (ft)</label>
                  <Input
</>

                    type="number"
                    placeholder="0"
                    value={fieldData.measurements.width}
                    onChange={(e) =>
                      setFieldData({
                        ...fieldData,
                        measurements: { ...fieldData.measurements, width: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div>
<>

                <label className="text-sm font-medium">Stories</label>
                <select
</>

                  className="w-full mt-1 p-2 border rounded-md"
                  value={fieldData.measurements.stories}
                  onChange={(e) =>
                    setFieldData({
                      ...fieldData,
                      measurements: { ...fieldData.measurements, stories: e.target.value },
                    })
                  }
                >
<>

                  <option value="">Select stories</option>
                  <option
</>

value="1">1 Story</option>
<>

                  <option value="1.5">1.5 Stories</option>
                  <option
</>

value="2">2 Stories</option>
<>

                  <option value="2.5">2.5 Stories</option>
                  <option
</>

value="3">3+ Stories</option>
                </select>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
<>

                <div className="text-sm font-medium text-blue-800">Calculated Area</div>
                <div
</>

className="text-lg font-bold text-blue-600">
                  {fieldData.measurements.length && fieldData.measurements.width
                    ? `${(
                        Number.parseInt(fieldData.measurements.length) * Number.parseInt(fieldData.measurements.width)
                      ).toLocaleString()} sq ft`
                    : "Enter measurements"}
                </div>
              </div>

              <Button className="w-full">
                <Ruler className="h-4 w-4 mr-2" />
                Use AR Measuring Tool
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Assessment Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter field observations, property improvements, or other relevant notes..."
                value={fieldData.notes}
                onChange={(e) => setFieldData({ ...fieldData, notes: e.target.value })}
                rows={6}
              />

              <div className="space-y-2">
<>

                <div className="text-sm font-medium">Quick Notes</div>
                <div
</>

className="grid grid-cols-2 gap-2">
<>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFieldData({
                        ...fieldData,
                        notes: fieldData.notes + "New construction. ",
                      })
                    }
                  >
                    New Construction
                  </Button>
                  <Button
</>

                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFieldData({
                        ...fieldData,
                        notes: fieldData.notes + "Recent renovation. ",
                      })
                    }
                  >
                    Recent Renovation
                  </Button>
<>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFieldData({
                        ...fieldData,
                        notes: fieldData.notes + "Needs maintenance. ",
                      })
                    }
                  >
                    Needs Maintenance
                  </Button>
                  <Button
</>

                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFieldData({
                        ...fieldData,
                        notes: fieldData.notes + "Pool/spa present. ",
                      })
                    }
                  >
                    Pool/Spa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-md mx-auto flex gap-3">
<>

          <Button variant="outline" className="flex-1">
            Save Draft
          </Button>
          <Button
</>

className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete Assessment
          </Button>
        </div>
      </div>
    </div>
  )
}
