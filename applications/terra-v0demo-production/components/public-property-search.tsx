"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Search, MapPin, Building, DollarSign, Info, Home, Phone, Mail, ExternalLink  } from '@mui/icons-material'

interface PublicProperty {
  parcelNumber: string
  address: string
  ownerName: string
  propertyType: string
  assessedValue: number
  landValue: number
  improvementValue: number
  taxYear: number
  lastAssessment: string
  lotSize: string
  yearBuilt: number
  bedrooms: number
  bathrooms: number
  sqft: number
  zoning: string
  schoolDistrict: string
  exemptions: string[]
}

export default function PublicPropertySearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<PublicProperty[]>([])
  const [selectedProperty, setSelectedProperty] = useState<PublicProperty | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      const mockResults: PublicProperty[] = [
        {
          parcelNumber: "362301-100045",
          address: "123 Wine Country Rd, Prosser, WA 99350",
          ownerName: "John & Mary Smith",
          propertyType: "Residential",
          assessedValue: 485000,
          landValue: 125000,
          improvementValue: 360000,
          taxYear: 2025,
          lastAssessment: "2025-01-01",
          lotSize: "2.5 acres",
          yearBuilt: 2018,
          bedrooms: 4,
          bathrooms: 3.5,
          sqft: 2850,
          zoning: "R-1",
          schoolDistrict: "Prosser School District",
          exemptions: [],
        },
        {
          parcelNumber: "362301-200078",
          address: "456 River View Dr, Richland, WA 99354",
          ownerName: "Robert Johnson",
          propertyType: "Residential",
          assessedValue: 325000,
          landValue: 85000,
          improvementValue: 240000,
          taxYear: 2025,
          lastAssessment: "2025-01-01",
          lotSize: "0.25 acres",
          yearBuilt: 2015,
          bedrooms: 3,
          bathrooms: 2.5,
          sqft: 2200,
          zoning: "R-2",
          schoolDistrict: "Richland School District",
          exemptions: ["Senior Exemption"],
        },
      ]

      const filtered = mockResults.filter(
        (property) =>
          property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.parcelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.ownerName.toLowerCase().includes(searchTerm.toLowerCase()),
      )

      setSearchResults(filtered)
      setLoading(false)
    }, 1000)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div><>

                <h1 className="text-2xl font-bold text-gray-900">Benton County Property Search</h1>
                <p
</> className="text-sm text-gray-600">Public Property Information Portal</p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-600"><>

              <div>Benton County Assessor's Office</div>
              <div
</>>Jennifer Martinez, County Assessor</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Welcome Message */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Info className="h-6 w-6 text-blue-600 mt-1" />
              <div><>

                <h3 className="font-semibold text-blue-900 mb-2">Welcome to Benton County Property Information</h3>
                <p
</> className="text-blue-800 text-sm">
                  Search for property information including assessed values, ownership details, and property
                  characteristics. This information is provided for informational purposes only. For official records or
                  questions about your assessment, please contact the Assessor's Office.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><>

              <Search className="h-5 w-5" />
              Property Search
            </CardTitle>
            <CardDescription
</>>Search by property address, parcel number, or owner name</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter address, parcel number, or owner name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardHeader><>

              <CardTitle>Search Results</CardTitle>
              <CardDescription
</>>Found {searchResults.length} property(ies) matching your search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((property) => (
                  <div
                    key={property.parcelNumber}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedProperty(property)}
                  >
                    <div className="flex justify-between items-start">
                      <div><>

                        <div className="font-medium text-lg">{property.address}</div>
                        <div
</> className="text-sm text-gray-600">
                          Parcel: {property.parcelNumber} • Owner: {property.ownerName}
                        </div>
                        <div className="flex gap-4 mt-2">
                          <Badge variant="outline">{property.propertyType}</Badge>
                          {property.exemptions.map((exemption) => (
                            <Badge key={exemption} className="bg-green-100 text-green-800">
                              {exemption}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right"><>

                        <div className="text-lg font-bold">{formatCurrency(property.assessedValue)}</div>
                        <div
</> className="text-sm text-gray-600">Assessed Value</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Property Details */}
        {selectedProperty && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <Home className="h-5 w-5" />
                Property Details
              </CardTitle>
              <CardDescription
</>>Detailed information for {selectedProperty.address}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="assessment" className="w-full">
                <TabsList className="grid w-full grid-cols-3"><>

                  <TabsTrigger value="assessment">Assessment</TabsTrigger>
                  <TabsTrigger
</> value="property">Property Details</TabsTrigger>
                  <TabsTrigger value="ownership">Ownership</TabsTrigger>
                </TabsList>

                <TabsContent value="assessment" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" /><>

                          <div className="text-2xl font-bold">{formatCurrency(selectedProperty.assessedValue)}</div>
                          <div
</> className="text-sm text-gray-600">Total Assessed Value</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-600" /><>

                          <div className="text-2xl font-bold">{formatCurrency(selectedProperty.landValue)}</div>
                          <div
</> className="text-sm text-gray-600">Land Value</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <Building className="h-8 w-8 mx-auto mb-2 text-purple-600" /><>

                          <div className="text-2xl font-bold">{formatCurrency(selectedProperty.improvementValue)}</div>
                          <div
</> className="text-sm text-gray-600">Improvement Value</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Tax Year:</span> {selectedProperty.taxYear}
                    </div>
                    <div>
                      <span className="font-medium">Last Assessment:</span>{" "}
                      {new Date(selectedProperty.lastAssessment).toLocaleDateString()}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="property" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg"><>

                      <div className="text-2xl font-bold">{selectedProperty.sqft.toLocaleString()}</div>
                      <div
</> className="text-sm text-gray-600">Square Feet</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg"><>

                      <div className="text-2xl font-bold">{selectedProperty.bedrooms}</div>
                      <div
</> className="text-sm text-gray-600">Bedrooms</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg"><>

                      <div className="text-2xl font-bold">{selectedProperty.bathrooms}</div>
                      <div
</> className="text-sm text-gray-600">Bathrooms</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg"><>

                      <div className="text-2xl font-bold">{selectedProperty.yearBuilt}</div>
                      <div
</> className="text-sm text-gray-600">Year Built</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Lot Size:</span> {selectedProperty.lotSize}
                    </div>
                    <div>
                      <span className="font-medium">Zoning:</span> {selectedProperty.zoning}
                    </div>
                    <div>
                      <span className="font-medium">Property Type:</span> {selectedProperty.propertyType}
                    </div>
                    <div>
                      <span className="font-medium">School District:</span> {selectedProperty.schoolDistrict}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="ownership" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <span className="font-medium">Owner Name:</span> {selectedProperty.ownerName}
                    </div>
                    <div>
                      <span className="font-medium">Parcel Number:</span> {selectedProperty.parcelNumber}
                    </div>
                    <div>
                      <span className="font-medium">Property Address:</span> {selectedProperty.address}
                    </div>
                    {selectedProperty.exemptions.length > 0 && (
                      <div><>

                        <span className="font-medium">Active Exemptions:</span>
                        <div
</> className="flex gap-2 mt-1">
                          {selectedProperty.exemptions.map((exemption) => (
                            <Badge key={exemption} className="bg-green-100 text-green-800">
                              {exemption}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><>

                <h4 className="font-semibold mb-2">Benton County Assessor's Office</h4>
                <div
</> className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><>

                    <Mail className="h-4 w-4" />
                    assessor@co.benton.wa.us
                  </div>
                  <div
</> className="flex items-center gap-2"><>

                    <Phone className="h-4 w-4" />
                    (509) 736-3085
                  </div>
                  <div
</> className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    7122 W Okanogan Pl, Kennewick, WA 99336
                  </div>
                </div>
              </div>
              <div><>

                <h4 className="font-semibold mb-2">Office Hours</h4>
                <div
</> className="space-y-1 text-sm"><>

                  <div>Monday - Friday: 8:00 AM - 5:00 PM</div>
                  <div
</>>Saturday - Sunday: Closed</div>
                </div>
                <Button variant="outline" size="sm" className="mt-3">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit County Website
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Alert>
          <Info className="h-4 w-4" /><>

          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription
</>>
            The information provided on this site is for informational purposes only and should not be relied upon for
            legal, financial, or other decisions. Property information is updated regularly but may not reflect the most
            current data. For official records or questions about your assessment, please contact the Benton County
            Assessor's Office directly.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
