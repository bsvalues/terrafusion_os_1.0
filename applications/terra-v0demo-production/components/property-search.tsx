"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MapPin, Building, DollarSign, Calendar, FileText, Eye, Edit, Filter  } from '@mui/icons-material'

interface Property {
  id: string
  parcelNumber: string
  address: string
  ownerName: string
  propertyType: string
  assessedValue: number
  marketValue: number
  lastAssessment: string
  status: string
  appeals: number
}

export default function PropertySearch() {
  const [properties, setProperties] = useState<Property[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [propertyType, setPropertyType] = useState("all")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const mockProperties: Property[] = [
      {
        id: "1",
        parcelNumber: "362301-100045",
        address: "123 Wine Country Rd, Prosser, WA 99350",
        ownerName: "John & Mary Smith",
        propertyType: "Residential",
        assessedValue: 485000,
        marketValue: 485000,
        lastAssessment: "2025-01-01",
        status: "Approved",
        appeals: 1,
      },
      {
        id: "2",
        parcelNumber: "362301-200078",
        address: "456 River View Dr, Richland, WA 99354",
        ownerName: "Robert Johnson",
        propertyType: "Residential",
        assessedValue: 325000,
        marketValue: 325000,
        lastAssessment: "2025-01-01",
        status: "Approved",
        appeals: 0,
      },
      {
        id: "3",
        parcelNumber: "362301-150032",
        address: "789 Agricultural Way, Kennewick, WA 99337",
        ownerName: "Columbia Valley Farms LLC",
        propertyType: "Agricultural",
        assessedValue: 583000,
        marketValue: 583000,
        lastAssessment: "2025-01-01",
        status: "Under Review",
        appeals: 1,
      },
      {
        id: "4",
        parcelNumber: "362301-300012",
        address: "321 Commerce Blvd, Richland, WA 99352",
        ownerName: "Tri-Cities Business Center",
        propertyType: "Commercial",
        assessedValue: 700000,
        marketValue: 700000,
        lastAssessment: "2025-01-01",
        status: "Approved",
        appeals: 0,
      },
      {
        id: "5",
        parcelNumber: "362301-400089",
        address: "654 Industrial Park Dr, Pasco, WA 99301",
        ownerName: "Pacific Northwest Manufacturing",
        propertyType: "Industrial",
        assessedValue: 1100000,
        marketValue: 1100000,
        lastAssessment: "2025-01-01",
        status: "Approved",
        appeals: 0,
      },
    ]
    setProperties(mockProperties)
  }, [])

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.parcelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.ownerName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = propertyType === "all" || property.propertyType.toLowerCase() === propertyType.toLowerCase()

    return matchesSearch && matchesType
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "under review":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-blue-100 text-blue-800"
      case "appealed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-3xl font-bold">Property Search</h1>
          <p
</> className="text-gray-600">Search and manage property assessments</p>
        </div>
        <Button>
          <Building className="h-4 w-4 mr-2" />
          Add New Property
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><>

              <label className="text-sm font-medium">Search</label>
              <Input
</>
                placeholder="Parcel number, address, or owner name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2"><>

              <label className="text-sm font-medium">Property Type</label>
              <Select
</> value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger><>

                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent
</>><>

                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem
</> value="residential">Residential</SelectItem><>

                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem
</> value="industrial">Industrial</SelectItem>
                  <SelectItem value="agricultural">Agricultural</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><>

              <label className="text-sm font-medium">Actions</label>
              <div
</> className="flex gap-2">
                <Button variant="outline" size="sm"><>

                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
                <Button
</> variant="outline" size="sm">
                  Export Results
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{filteredProperties.length}</div>
                <div
</> className="text-sm text-gray-600">Properties Found</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">
                  {formatCurrency(filteredProperties.reduce((sum, prop) => sum + prop.assessedValue, 0) / 1000000)}M
                </div>
                <div
</> className="text-sm text-gray-600">Total Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">
                  {filteredProperties.reduce((sum, prop) => sum + prop.appeals, 0)}
                </div>
                <div
</> className="text-sm text-gray-600">Active Appeals</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">
                  {formatCurrency(
                    filteredProperties.reduce((sum, prop) => sum + prop.assessedValue, 0) / filteredProperties.length ||
                      0,
                  )}
                </div>
                <div
</> className="text-sm text-gray-600">Avg Assessment</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property Results Table */}
      <Card>
        <CardHeader><>

          <CardTitle>Property Results</CardTitle>
          <CardDescription
</>>
            Showing {filteredProperties.length} properties matching your search criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><>

                <TableHead>Parcel Number</TableHead>
                <TableHead
</>>Address</TableHead><>

                <TableHead>Owner</TableHead>
                <TableHead
</>>Type</TableHead><>

                <TableHead>Assessed Value</TableHead>
                <TableHead
</>>Status</TableHead><>

                <TableHead>Appeals</TableHead>
                <TableHead
</>>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProperties.map((property) => (
                <TableRow key={property.id}><>

                  <TableCell className="font-medium">{property.parcelNumber}</TableCell>
                  <TableCell
</>>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {property.address}
                    </div>
                  </TableCell><>

                  <TableCell>{property.ownerName}</TableCell>
                  <TableCell
</>>
                    <Badge variant="outline">{property.propertyType}</Badge>
                  </TableCell><>

                  <TableCell className="font-medium">{formatCurrency(property.assessedValue)}</TableCell>
                  <TableCell
</>>
                    <Badge className={getStatusColor(property.status)}>{property.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {property.appeals > 0 ? (
                      <Badge variant="destructive">{property.appeals}</Badge>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm"><>

                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
</> variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
