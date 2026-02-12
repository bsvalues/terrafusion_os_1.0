"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Layers, ZoomIn, ZoomOut, RotateCcw, Download, Home, Building2  } from '@mui/icons-material'

export default function MapViewer() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [opacity, setOpacity] = useState([75])
  const [zoom, setZoom] = useState(12)
  const [center, setCenter] = useState({ lat: 46.2619, lng: -119.2706 }) // Benton County, WA
  const [mapStyle, setMapStyle] = useState("satellite")
  const [layersVisible, setLayersVisible] = useState({
    parcels: true,
    buildings: true,
    roads: false,
    utilities: false,
    zoning: true,
    floodZones: false,
  })

  const [properties] = useState([
    { id: 1, lat: 46.2619, lng: -119.2706, address: "123 Main St", value: "$450,000", type: "Residential" },
    { id: 2, lat: 46.265, lng: -119.275, address: "456 Oak Ave", value: "$320,000", type: "Residential" },
    { id: 3, lat: 46.258, lng: -119.268, address: "789 Pine St", value: "$680,000", type: "Commercial" },
    { id: 4, lat: 46.27, lng: -119.28, address: "321 Elm Dr", value: "$520,000", type: "Residential" },
    { id: 5, lat: 46.255, lng: -119.265, address: "654 Cedar Ln", value: "$890,000", type: "Industrial" },
  ])

  const [selectedProperty, setSelectedProperty] = useState<any>(null)

  useEffect(() => {
    // Initialize map (in a real implementation, this would use Leaflet, Mapbox, or Google Maps)
    console.log("Map initialized with center:", center, "zoom:", zoom)
  }, [center, zoom])

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 1, 18))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 1, 1))
  const handleReset = () => {
    setZoom(12)
    setCenter({ lat: 46.2619, lng: -119.2706 })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-screen p-6">
      {/* Map Area */}
      <div className="lg:col-span-3">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2"><>

                <Layers className="h-5 w-5" />
                Terrafusion GIS Map - Benton County, WA
              </CardTitle>
              <div
</> className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleZoomIn}><>

                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
</> size="sm" variant="outline" onClick={handleZoomOut}><>

                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
</> size="sm" variant="outline" onClick={handleReset}><>

                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
</> size="sm" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600"><>

              <span>Zoom: {zoom}</span>
              <span
</>>
                Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
              </span>
              <Badge variant="outline">Live Data</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-full pb-6">
            <div
              ref={mapRef}
              className="w-full h-full bg-gradient-to-br from-green-100 via-blue-100 to-gray-100 rounded-lg relative overflow-hidden border-2 border-gray-200"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                opacity: 0.3,
              }}
            >
              {/* Simulated road network */}
              <div className="absolute inset-0">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-400/60 transform -translate-y-1/2" />
                <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-gray-400/60 transform -translate-x-1/2" />
                <div className="absolute top-1/4 left-1/4 right-1/4 h-0.5 bg-gray-300/60" />
                <div className="absolute top-3/4 left-1/4 right-1/4 h-0.5 bg-gray-300/60" />
              </div>

              {/* Property markers */}
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    left: `${((property.lng + 119.3) * 1000) % 100}%`,
                    top: `${((property.lat - 46.2) * 1000) % 100}%`,
                  }}
                  onClick={() => setSelectedProperty(property)}
                >
                  {property.type === "Commercial" ? (
                    <Building2 className="h-6 w-6 text-blue-600 drop-shadow-lg" />
                  ) : property.type === "Industrial" ? (
                    <Building2 className="h-6 w-6 text-purple-600 drop-shadow-lg" />
                  ) : (
                    <Home className="h-6 w-6 text-green-600 drop-shadow-lg" />
                  )}
                </div>
              ))}

              {/* Parcel boundaries (simulated) */}
              {layersVisible.parcels && (
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute top-1/4 left-1/4 w-32 h-24 border-2 border-red-400 bg-red-100/20" />
                  <div className="absolute top-1/2 left-1/3 w-28 h-20 border-2 border-blue-400 bg-blue-100/20" />
                  <div className="absolute top-2/3 left-1/2 w-36 h-28 border-2 border-green-400 bg-green-100/20" />
                </div>
              )}

              {/* Zoning overlay */}
              {layersVisible.zoning && (
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-yellow-200/40 border border-yellow-400" />
                  <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-200/40 border border-blue-400" />
                  <div className="absolute bottom-0 left-0 w-full h-1/2 bg-green-200/40 border border-green-400" />
                </div>
              )}

              {/* Property info popup */}
              {selectedProperty && (
                <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-xs">
                  <div className="flex justify-between items-start mb-2"><>

                    <h3 className="font-semibold">{selectedProperty.address}</h3>
                    <Button
</> size="sm" variant="ghost" onClick={() => setSelectedProperty(null)} className="h-6 w-6 p-0">
                      ×
                    </Button>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Type:</strong> {selectedProperty.type}
                    </p>
                    <p>
                      <strong>Assessed Value:</strong> {selectedProperty.value}
                    </p>
                    <p>
                      <strong>Coordinates:</strong> {selectedProperty.lat.toFixed(4)}, {selectedProperty.lng.toFixed(4)}
                    </p>
                  </div>
                  <div className="mt-3 flex gap-2"><>

                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button
</> size="sm">Assess Property</Button>
                  </div>
                </div>
              )}

              {/* Map legend */}
              <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-lg"><>

                <h4 className="font-semibold text-sm mb-2">Legend</h4>
                <div
</> className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-green-600" />
                    <span>Residential</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span>Commercial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                    <span>Industrial</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Map Style</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={mapStyle} onValueChange={setMapStyle}>
              <SelectTrigger><>

                <SelectValue />
              </SelectTrigger>
              <SelectContent
</>><>

                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem
</> value="terrain">Terrain</SelectItem><>

                <SelectItem value="street">Street Map</SelectItem>
                <SelectItem
</> value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Layer Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(layersVisible).map(([layer, visible]) => (
              <div key={layer} className="flex items-center justify-between"><>

                <Label htmlFor={layer} className="capitalize text-sm">
                  {layer.replace(/([A-Z])/g, " $1").trim()}
                </Label>
                <Switch
</>
                  id={layer}
                  checked={visible}
                  onCheckedChange={(checked) => setLayersVisible((prev) => ({ ...prev, [layer]: checked }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Layer Opacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3"><>

              <Label className="text-sm">Overlay Opacity: {opacity[0]}%</Label>
              <Slider
</> value={opacity} onValueChange={setOpacity} max={100} min={0} step={5} className="w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center text-sm"><>

              <span>Total Properties</span>
              <Badge
</> variant="outline">{properties.length}</Badge>
            </div>
            <div className="flex justify-between items-center text-sm"><>

              <span>Residential</span>
              <Badge
</> variant="outline">{properties.filter((p) => p.type === "Residential").length}</Badge>
            </div>
            <div className="flex justify-between items-center text-sm"><>

              <span>Commercial</span>
              <Badge
</> variant="outline">{properties.filter((p) => p.type === "Commercial").length}</Badge>
            </div>
            <div className="flex justify-between items-center text-sm"><>

              <span>Industrial</span>
              <Badge
</> variant="outline">{properties.filter((p) => p.type === "Industrial").length}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2"><>

            <Button variant="outline" size="sm" className="w-full">
              Export Map (PNG)
            </Button>
            <Button
</> variant="outline" size="sm" className="w-full">
              Export Data (GeoJSON)
            </Button>
            <Button variant="outline" size="sm" className="w-full">
              Generate Assessment Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
