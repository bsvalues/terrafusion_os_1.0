"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Home, MapPin, DollarSign, Calendar, Bed, Bath, Square  } from '@mui/icons-material'

interface Property {
  id: string
  address: string
  size_sqft: number
  bedrooms: number
  bathrooms: number
  year_built: number
  location_type: string
  price?: number
  status?: string
}

interface SearchFilters {
  location: string
  minPrice: string
  maxPrice: string
  minBedrooms: string
  maxBedrooms: string
}

export function PropertySearch() {
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [filters, setFilters] = useState<SearchFilters>({
    location: "",
    minPrice: "",
    maxPrice: "",
    minBedrooms: "",
    maxBedrooms: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    fetchProperties()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [properties, filters])

  const fetchProperties = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/properties")
      const result = await response.json()

      if (result.success) {
        setProperties(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = properties

    if (filters.location) {
      filtered = filtered.filter(
        (p) =>
          p.location_type.toLowerCase().includes(filters.location.toLowerCase()) ||
          p.address.toLowerCase().includes(filters.location.toLowerCase()),
      )
    }

    if (filters.minPrice) {
      filtered = filtered.filter((p) => (p.price || 0) >= Number.parseInt(filters.minPrice))
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((p) => (p.price || 0) <= Number.parseInt(filters.maxPrice))
    }

    if (filters.minBedrooms) {
      filtered = filtered.filter((p) => p.bedrooms >= Number.parseInt(filters.minBedrooms))
    }

    if (filters.maxBedrooms) {
      filtered = filtered.filter((p) => p.bedrooms <= Number.parseInt(filters.maxBedrooms))
    }

    setFilteredProperties(filtered)
  }

  const analyzeProperty = async (property: Property) => {
    setSelectedProperty(property)
    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      // --- THIS IS THE KEY CHANGE ---
      // Instead of fetch, call the function exposed on the window object by preload.js
      // Note: You'll need to declare `window.electronAPI` in a .d.ts file for TypeScript
      const result = await (window as any).electronAPI.runAnalysis({
        property_id: property.id,
        address: property.address,
        size_sqft: property.size_sqft,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        year_built: property.year_built,
        location_type: property.location_type,
        lot_size_sqft: 8000 + Math.random() * 4000,
      })
      // --- END OF CHANGE ---

      if (result.success) {
        setAnalysisResult(result.data)
      }
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      location: "",
      minPrice: "",
      maxPrice: "",
      minBedrooms: "",
      maxBedrooms: "",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "sold":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Property Search & Analysis
          </CardTitle>
          <CardDescription>Search properties and get AI-powered analysis with sacred geometry insights</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Filters */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter location or address"
                  value={filters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="minPrice">Min Price</Label>
                <Input
                  id="minPrice"
                  type="number"
                  placeholder="Min price"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maxPrice">Max Price</Label>
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="Max price"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minBedrooms">Min Bedrooms</Label>
                <Input
                  id="minBedrooms"
                  type="number"
                  placeholder="Min bedrooms"
                  value={filters.minBedrooms}
                  onChange={(e) => handleFilterChange("minBedrooms", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maxBedrooms">Max Bedrooms</Label>
                <Input
                  id="maxBedrooms"
                  type="number"
                  placeholder="Max bedrooms"
                  value={filters.maxBedrooms}
                  onChange={(e) => handleFilterChange("maxBedrooms", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={fetchProperties} disabled={isLoading}>
                <Search className="h-4 w-4 mr-1" />
                Search
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Property List */}
            <div className="space-y-4">
              <h3 className="font-medium">Properties Found ({filteredProperties.length})</h3>

              {isLoading ? (
                <div className="text-center py-8">
<>

                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p
</> className="text-sm text-gray-600 mt-2">Loading properties...</p>
                </div>
              ) : filteredProperties.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredProperties.map((property) => (
                    <Card
                      key={property.id}
                      className={`cursor-pointer transition-colors ${
                        selectedProperty?.id === property.id ? "ring-2 ring-blue-500" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedProperty(property)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium flex items-center gap-2">
<>

                              <Home className="h-4 w-4 text-blue-600" />
                              {property.address}
                            </div>
                            <div
</> className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {property.location_type}
                            </div>
                          </div>
                          {property.status && (
                            <Badge className={getStatusColor(property.status)}>{property.status}</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-1">
<>

                            <Square className="h-3 w-3 text-gray-500" />
                            {property.size_sqft.toLocaleString()} sq ft
                          </div>
                          <div
</> className="flex items-center gap-1">
<>

                            <Bed className="h-3 w-3 text-gray-500" />
                            {property.bedrooms} bed
                          </div>
                          <div
</> className="flex items-center gap-1">
<>

                            <Bath className="h-3 w-3 text-gray-500" />
                            {property.bathrooms} bath
                          </div>
                          <div
</> className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-500" />
                            Built {property.year_built}
                          </div>
                        </div>

                        {property.price && (
                          <div className="flex items-center gap-1 mt-2 font-bold text-green-600">
                            <DollarSign className="h-4 w-4" />${property.price.toLocaleString()}
                          </div>
                        )}

                        <Button
                          size="sm"
                          className="w-full mt-3"
                          onClick={(e) => {
                            e.stopPropagation()
                            analyzeProperty(property)
                          }}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing && selectedProperty?.id === property.id ? "Analyzing..." : "AI Analysis"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Search className="h-4 w-4" />
                  <AlertDescription>
                    No properties found matching your criteria. Try adjusting your filters.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Analysis Results */}
            <div className="space-y-4">
              <h3 className="font-medium">AI Analysis Results</h3>

              {selectedProperty ? (
                <Card>
                  <CardHeader>
<>

                    <CardTitle className="text-base">{selectedProperty.address}</CardTitle>
                    <CardDescription
</>>GAMA AI Analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isAnalyzing ? (
                      <div className="text-center py-8">
<>

                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p
</> className="text-sm text-gray-600 mt-2">Running AI analysis...</p>
                      </div>
                    ) : analysisResult ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
<>

                            <div className="text-sm text-gray-600">Estimated Value</div>
                            <div
</> className="font-bold text-lg text-green-600">
                              ${analysisResult.estimated_value.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
<>

                            <div className="text-sm text-gray-600">Confidence</div>
                            <div
</> className="font-bold text-lg text-blue-600">
                              {(analysisResult.confidence_score * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
<>

                            <span>Geometry Factor:</span>
                            <span
</> className="font-medium">{analysisResult.geometry_factor}</span>
                          </div>
                          <div className="flex justify-between text-sm">
<>

                            <span>Market Factor:</span>
                            <span
</> className="font-medium">{analysisResult.market_factor}</span>
                          </div>
                          <div className="flex justify-between text-sm">
<>

                            <span>Risk Level:</span>
                            <Badge
</>
                              variant={analysisResult.risk_assessment.risk_level === "Low" ? "default" : "secondary"}
                            >
                              {analysisResult.risk_assessment.risk_level}
                            </Badge>
                          </div>
                        </div>

                        <div>
<>

                          <h4 className="font-medium mb-2">AI Recommendations</h4>
                          <ul
</> className="space-y-1">
                            {analysisResult.recommendations.map((rec: string /* , index */: number) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <Alert>
                        <Search className="h-4 w-4" />
                        <AlertDescription>Click "AI Analysis" on a property to get detailed insights.</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Alert>
                  <Home className="h-4 w-4" />
                  <AlertDescription>Select a property from the list to view analysis results.</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
