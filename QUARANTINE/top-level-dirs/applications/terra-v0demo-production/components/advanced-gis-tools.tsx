"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ruler, Calculator, Search, MapPin, Layers, Download, Upload, Settings, BarChart3  } from '@mui/icons-material'

export default function AdvancedGISTools() {
  const [measurementMode, setMeasurementMode] = useState<"distance" | "area" | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [measurements] = useState([
    { id: 1, type: "Distance", value: "245.7 ft", coordinates: "46.2619, -119.2706" },
    { id: 2, type: "Area", value: "0.85 acres", coordinates: "46.2650, -119.2750" },
    { id: 3, type: "Perimeter", value: "387.2 ft", coordinates: "46.2580, -119.2680" },
  ])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced GIS Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="measure" className="w-full">
            <TabsList className="grid w-full grid-cols-4"><>

              <TabsTrigger value="measure">Measure</TabsTrigger>
              <TabsTrigger
</> value="search">Search</TabsTrigger><>

              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger
</> value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="measure" className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={measurementMode === "distance" ? "default" : "outline"}
                  onClick={() => setMeasurementMode(measurementMode === "distance" ? null : "distance")}
                  className="flex items-center gap-2"
                ><>

                  <Ruler className="h-4 w-4" />
                  Distance
                </Button>
                <Button
</>
                  variant={measurementMode === "area" ? "default" : "outline"}
                  onClick={() => setMeasurementMode(measurementMode === "area" ? null : "area")}
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Area
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Recent Measurements</Label>
                {measurements.map((measurement) => (
                  <div key={measurement.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div><>

                      <span className="font-medium text-sm">
                        {measurement.type}: {measurement.value}
                      </span>
                      <p
</> className="text-xs text-gray-600">{measurement.coordinates}</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-4">
              <div className="space-y-2"><>

                <Label htmlFor="search">Search Properties</Label>
                <div
</> className="flex gap-2">
                  <Input
                    id="search"
                    placeholder="Enter address, parcel ID, or coordinates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2"><>

                <Label className="text-sm font-medium">Quick Searches</Label>
                <div
</> className="grid grid-cols-2 gap-2"><>

                  <Button variant="outline" size="sm">
                    High Value Properties
                  </Button>
                  <Button
</> variant="outline" size="sm">
                    Recent Sales
                  </Button><>

                  <Button variant="outline" size="sm">
                    Vacant Lots
                  </Button>
                  <Button
</> variant="outline" size="sm">
                    Commercial Zones
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4" />
                      <span className="font-medium text-sm">Property Density</span>
                    </div><>

                    <p className="text-2xl font-bold">2.3/acre</p>
                    <p
</> className="text-xs text-gray-600">Current view area</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4" />
                      <span className="font-medium text-sm">Avg. Value</span>
                    </div><>

                    <p className="text-2xl font-bold">$574K</p>
                    <p
</> className="text-xs text-gray-600">Per property</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start"><>

                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Market Analysis
                </Button>
                <Button
</> variant="outline" className="w-full justify-start"><>

                  <MapPin className="h-4 w-4 mr-2" />
                  Proximity Analysis
                </Button>
                <Button
</> variant="outline" className="w-full justify-start">
                  <Layers className="h-4 w-4 mr-2" />
                  Zoning Compliance Check
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <div className="space-y-2"><>

                <Label className="text-sm font-medium">Export Current View</Label>
                <div
</> className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm"><>

                    <Download className="h-4 w-4 mr-2" />
                    PNG Image
                  </Button>
                  <Button
</> variant="outline" size="sm"><>

                    <Download className="h-4 w-4 mr-2" />
                    PDF Report
                  </Button>
                  <Button
</> variant="outline" size="sm"><>

                    <Download className="h-4 w-4 mr-2" />
                    GeoJSON Data
                  </Button>
                  <Button
</> variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Shapefile
                  </Button>
                </div>
              </div>

              <div className="space-y-2"><>

                <Label className="text-sm font-medium">Import Data</Label>
                <Button
</> variant="outline" className="w-full justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Parcel Data
                </Button>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Pro Tip:</strong> Use the measurement tools before exporting to include precise calculations
                  in your reports.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
