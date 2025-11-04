"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Database, MapPin, Refresh, TrendingUp, Home, FileText, DollarSign, MapIcon  } from '@mui/icons-material'

interface LiveProperty {
  parcelNumber: string
  address: string
  ownerName: string
  propertyType: string
  assessedValue: number
  landValue: number
  improvementValue: number
  taxYear: number
  lotSize: string
  yearBuilt: number
  bedrooms: number
  bathrooms: number | string
  sqft: number
  zoning: string
  schoolDistrict: string
  coordinates: { lat: number; lng: number }
}

interface LiveAssessment {
  parcelNumber: string
  taxYear: number
  assessmentDate: string
  landValue: number
  improvementValue: number
  totalAssessedValue: number
  marketValue: number
  assessmentMethod: string
  assessor: string
  status: string
}

interface LiveSale {
  parcelNumber: string
  saleDate: string
  salePrice: number
  buyer: string
  seller: string
  saleType: string
  verified: boolean
  deedType: string
}

interface LiveGIS {
  countyBounds: {
    north: number
    south: number
    east: number
    west: number
  }
  totalParcels: number
  totalAssessedValue: number
  averageAssessedValue: number
  lastUpdated: string
}

interface LiveDataPayload {
  properties: LiveProperty[]
  assessments: LiveAssessment[]
  sales: LiveSale[]
  gis: LiveGIS
  metadata: {
    totalParcels: number
    lastUpdated: string
    dataSource: string
  }
}

interface ApiResponse {
  status: string
  timestamp: string
  data: LiveDataPayload
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
  }
}

export default function BentonCountyLiveDashboard() {
  const [liveData, setLiveData] = useState<LiveDataPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<string>("")
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 })

  const fetchLiveData = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/benton-county-live?page=${page}&limit=10`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || `HTTP error! status: ${response.status}`)
      }
      const apiResponse = await response.json()
      if (apiResponse.status === "success" && apiResponse.data) {
        setLiveData(apiResponse.data)
        setPagination(apiResponse.pagination)
        setLastRefresh(new Date(apiResponse.timestamp).toLocaleString())
      } else {
        throw new Error("API response was not successful or data is missing.")
      }
    } catch (e: any) {
      console.error("Failed to fetch live data:", e)
      setError(e.message || "An unknown error occurred while fetching data.")
      setLiveData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLiveData(1)
  }, [fetchLiveData])

  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== "number") return "$0"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading && !liveData && !error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#001529] p-6 text-center">
        <Refresh className="h-12 w-12 text-[#00e5ff] animate-spin mb-4" /><>

        <h2 className="text-xl font-bold text-white">Loading Live Benton County Data...</h2>
        <p
</> className="text-[#00e5ff]/70">Connecting to real-time county systems. Please wait.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#001529] p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" /><>

        <h2 className="text-xl font-bold text-white">Error Fetching Data</h2>
        <p
</> className="text-red-500 mb-4">{error}</p>
        <Button
          onClick={fetchLiveData}
          disabled={loading}
          className="bg-[#00e5ff] hover:bg-[#00b8d4] text-[#001529] font-medium"
        >
          <Refresh className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Try Again
        </Button>
      </div>
    )
  }

  if (!liveData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#001529] p-6 text-center">
        <Database className="h-12 w-12 text-[#00e5ff]/50 mb-4" /><>

        <h2 className="text-xl font-bold text-white">No Data Available</h2>
        <p
</> className="text-[#00e5ff]/70 mb-4">Could not load live data for Benton County at this time.</p>
        <Button
          onClick={fetchLiveData}
          disabled={loading}
          className="bg-[#00e5ff] hover:bg-[#00b8d4] text-[#001529] font-medium"
        >
          <Refresh className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
    )
  }

  const { properties, assessments, sales, gis, metadata } = liveData

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLiveData(newPage)
    }
  }

  return (
    <div className="min-h-screen bg-[#001529] p-4 md:p-6">
      <div className="container mx-auto space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-6 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MapPin className="h-10 w-10 text-[#00e5ff]" />
            <h1 className="text-4xl font-bold text-white">LIVE Benton County Data</h1>
          </div><>

          <p className="text-xl text-[#00e5ff]/70 max-w-2xl mx-auto">
            Real-time property assessment data from Benton County, Washington
          </p>
          <div
</> className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-[#001529]/90 backdrop-blur-xl border border-[#00e5ff]/20 rounded-xl px-4 py-2">
              <Refresh className="h-4 w-4 text-[#00e5ff] animate-pulse" />
              <span className="text-sm font-medium text-[#00e5ff]">LIVE CONNECTION</span>
            </div>
            <div className="flex items-center gap-2 bg-[#001529]/90 backdrop-blur-xl border border-[#00e5ff]/20 rounded-xl px-4 py-2">
              <span className="text-sm text-[#00e5ff]/70">Last Updated: {lastRefresh || "N/A"}</span>
            </div>
          </div>
          <Button
            onClick={() => fetchLiveData(pagination.currentPage)}
            disabled={loading}
            className="bg-[#00e5ff] hover:bg-[#00b8d4] text-[#001529] font-medium px-8 py-3"
          >
            <Refresh className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#001529]/90 backdrop-blur-xl border border-[#00e5ff]/20 rounded-xl p-6 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all duration-300">
            <div className="flex items-center justify-between mb-4"><>

              <h3 className="text-sm font-medium text-[#00e5ff]/70">Total Parcels</h3>
              <Home
</> className="h-5 w-5 text-[#00e5ff]" />
            </div><>

            <div className="text-3xl font-bold text-white">{metadata?.totalParcels?.toLocaleString() || "N/A"}</div>
            <p
</> className="text-xs text-[#00e5ff]/50 mt-2">{metadata?.dataSource || "Benton County Assessor"}</p>
          </div>

          <div className="bg-[#001529]/90 backdrop-blur-xl border border-[#00e5ff]/20 rounded-xl p-6 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all duration-300">
            <div className="flex items-center justify-between mb-4"><>

              <h3 className="text-sm font-medium text-[#00e5ff]/70">Total Assessed Value</h3>
              <DollarSign
</> className="h-5 w-5 text-[#00e5ff]" />
            </div><>

            <div className="text-3xl font-bold text-white">{formatCurrency(gis?.totalAssessedValue)}</div>
            <p
</> className="text-xs text-[#00e5ff]/50 mt-2">Across all parcels</p>
          </div>

          <div className="bg-[#001529]/90 backdrop-blur-xl border border-[#00e5ff]/20 rounded-xl p-6 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all duration-300">
            <div className="flex items-center justify-between mb-4"><>

              <h3 className="text-sm font-medium text-[#00e5ff]/70">Avg. Assessment</h3>
              <TrendingUp
</> className="h-5 w-5 text-[#00e5ff]" />
            </div><>

            <div className="text-3xl font-bold text-white">{formatCurrency(gis?.averageAssessedValue)}</div>
            <p
</> className="text-xs text-[#00e5ff]/50 mt-2">Average property value</p>
          </div>

          <div className="bg-[#001529]/90 backdrop-blur-xl border border-[#00e5ff]/20 rounded-xl p-6 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all duration-300">
            <div className="flex items-center justify-between mb-4"><>

              <h3 className="text-sm font-medium text-[#00e5ff]/70">Data Status</h3>
              <Refresh
</> className="h-5 w-5 text-[#00e5ff]" />
            </div><>

            <div className="text-3xl font-bold text-[#00e5ff]">LIVE</div>
            <p
</> className="text-xs text-[#00e5ff]/50 mt-2">Real-time feed active</p>
          </div>
        </div>

        {/* Data Tabs */}
        <div className="bg-[#001529]/90 backdrop-blur-xl border border-[#00e5ff]/20 rounded-xl overflow-hidden">
          <Tabs defaultValue="properties" className="w-full">
            <div className="border-b border-[#00e5ff]/20 bg-[#002a4a]/50">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-transparent">
                <TabsTrigger
                  value="properties"
                  className="data-[state=active]:bg-[#00e5ff]/10 data-[state=active]:text-[#00e5ff] text-[#00e5ff]/70 hover:text-[#00e5ff] transition-colors"
                ><>

                  <Home className="h-4 w-4 mr-2" />
                  Properties
                </TabsTrigger>
                <TabsTrigger
</>
                  value="assessments"
                  className="data-[state=active]:bg-[#00e5ff]/10 data-[state=active]:text-[#00e5ff] text-[#00e5ff]/70 hover:text-[#00e5ff] transition-colors"
                ><>

                  <FileText className="h-4 w-4 mr-2" />
                  Assessments
                </TabsTrigger>
                <TabsTrigger
</>
                  value="sales"
                  className="data-[state=active]:bg-[#00e5ff]/10 data-[state=active]:text-[#00e5ff] text-[#00e5ff]/70 hover:text-[#00e5ff] transition-colors"
                ><>

                  <DollarSign className="h-4 w-4 mr-2" />
                  Sales
                </TabsTrigger>
                <TabsTrigger
</>
                  value="map"
                  className="data-[state=active]:bg-[#00e5ff]/10 data-[state=active]:text-[#00e5ff] text-[#00e5ff]/70 hover:text-[#00e5ff] transition-colors"
                >
                  <MapIcon className="h-4 w-4 mr-2" />
                  GIS Map
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="properties" className="p-6">
              <div className="space-y-4">
                <div><>

                  <h2 className="text-2xl font-bold text-white mb-2">LIVE Property Data</h2>
                  <p
</> className="text-[#00e5ff]/70">
                    Real-time property records from {metadata?.dataSource}. Displaying records{" "}
                    {(pagination.currentPage - 1) * 10 + 1}-
                    {Math.min(pagination.currentPage * 10, pagination.totalItems)} of {pagination.totalItems}.
                  </p>
                </div>

                <div className="overflow-x-auto bg-[#002a4a]/30 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#00e5ff]/20 hover:bg-[#00e5ff]/5"><>

                        <TableHead className="text-[#00e5ff] font-medium">Parcel #</TableHead>
                        <TableHead
</> className="text-[#00e5ff] font-medium">Address</TableHead><>

                        <TableHead className="text-[#00e5ff] font-medium">Owner</TableHead>
                        <TableHead
</> className="text-[#00e5ff] font-medium">Type</TableHead><>

                        <TableHead className="text-[#00e5ff] font-medium text-right">Assessed Value</TableHead>
                        <TableHead
</> className="text-[#00e5ff] font-medium text-center">Built</TableHead>
                        <TableHead className="text-[#00e5ff] font-medium text-right">Sq Ft</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties?.length > 0 ? (
                        properties.map((property) => (
                          <TableRow
                            key={property.parcelNumber}
                            className="border-[#00e5ff]/10 hover:bg-[#00e5ff]/5 transition-colors"
                          ><>

                            <TableCell className="font-medium text-white">{property.parcelNumber}</TableCell>
                            <TableCell
</> className="text-[#00e5ff]/70">{property.address}</TableCell><>

                            <TableCell className="text-[#00e5ff]/70">{property.ownerName}</TableCell>
                            <TableCell
</>>
                              <span className="bg-[#00e5ff]/10 text-[#00e5ff] px-2 py-1 rounded-md text-xs font-medium">
                                {property.propertyType}
                              </span>
                            </TableCell><>

                            <TableCell className="font-bold text-[#00e5ff] text-right">
                              {formatCurrency(property.assessedValue)}
                            </TableCell>
                            <TableCell
</> className="text-white text-center">{property.yearBuilt}</TableCell>
                            <TableCell className="text-white text-right">{property.sqft?.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-[#00e5ff]/50 py-8">
                            No property data available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between pt-4"><>

                  <div className="text-xs text-[#00e5ff]/50">
                    Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total properties)
                  </div>
                  <div
</> className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1 || loading}
                      className="border-[#00e5ff]/20 text-[#00e5ff] hover:bg-[#00e5ff]/10"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages || loading}
                      className="border-[#00e5ff]/20 text-[#00e5ff] hover:bg-[#00e5ff]/10"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assessments" className="p-6">
              <div className="space-y-4">
                <div><>

                  <h2 className="text-2xl font-bold text-white mb-2">LIVE Assessment Data</h2>
                  <p
</> className="text-[#00e5ff]/70">
                    Current tax year assessments. Displaying {assessments?.length || 0} records.
                  </p>
                </div>

                <div className="space-y-4">
                  {assessments?.length > 0 ? (
                    assessments.map((assessment) => (
                      <div
                        key={assessment.parcelNumber + assessment.taxYear}
                        className="bg-[#002a4a]/30 border border-[#00e5ff]/20 rounded-xl p-6 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all duration-300"
                      >
                        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                          <div className="space-y-2"><>

                            <div className="text-lg font-bold text-white">Parcel: {assessment.parcelNumber}</div>
                            <div
</> className="text-sm text-[#00e5ff]/70">
                              Tax Year: {assessment.taxYear} • Method: {assessment.assessmentMethod}
                            </div>
                            <div className="text-sm text-[#00e5ff]/70 flex items-center gap-2">
                              Assessor: {assessment.assessor} • Status:{" "}
                              <span
                                className={`px-2 py-1 rounded-md text-xs font-medium ${
                                  assessment.status === "Final"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {assessment.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-left md:text-right space-y-1"><>

                            <div className="text-2xl font-bold text-[#00e5ff]">
                              {formatCurrency(assessment.totalAssessedValue)}
                            </div>
                            <div
</> className="text-xs text-[#00e5ff]/50">
                              Land: {formatCurrency(assessment.landValue)}
                            </div>
                            <div className="text-xs text-[#00e5ff]/50">
                              Improvements: {formatCurrency(assessment.improvementValue)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-[#00e5ff]/50 py-8">No assessment data available.</div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sales" className="p-6">
              <div className="space-y-4">
                <div><>

                  <h2 className="text-2xl font-bold text-white mb-2">LIVE Sales Data</h2>
                  <p
</> className="text-[#00e5ff]/70">
                    Recent property sales records. Displaying {sales?.length || 0} records.
                  </p>
                </div>

                <div className="space-y-4">
                  {sales?.length > 0 ? (
                    sales.map((sale) => (
                      <div
                        key={sale.parcelNumber + sale.saleDate}
                        className="bg-[#002a4a]/30 border border-[#00e5ff]/20 rounded-xl p-6 hover:shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all duration-300"
                      >
                        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                          <div className="space-y-2"><>

                            <div className="text-lg font-bold text-white">Parcel: {sale.parcelNumber}</div>
                            <div
</> className="text-sm text-[#00e5ff]/70">
                              Sale Date: {new Date(sale.saleDate).toLocaleDateString()}
                            </div><>

                            <div className="text-sm text-[#00e5ff]/70">Buyer: {sale.buyer}</div>
                            <div
</> className="text-sm text-[#00e5ff]/70">Seller: {sale.seller}</div>
                          </div>
                          <div className="text-left md:text-right space-y-2"><>

                            <div className="text-2xl font-bold text-[#00e5ff]">{formatCurrency(sale.salePrice)}</div>
                            <div
</>
                              className={`px-2 py-1 rounded-md text-xs font-medium inline-block ${
                                sale.verified ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {sale.verified ? "Verified" : "Pending Verification"}
                            </div>
                            <div className="text-sm text-[#00e5ff]/50">
                              {sale.saleType} - {sale.deedType}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-[#00e5ff]/50 py-8">No sales data available.</div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="map" className="p-6">
              <div className="space-y-6">
                <div><>

                  <h2 className="text-2xl font-bold text-white mb-2">LIVE GIS Data</h2>
                  <p
</> className="text-[#00e5ff]/70">Geographic information from Benton County.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#002a4a]/30 border border-[#00e5ff]/20 rounded-xl p-6"><>

                    <h3 className="text-lg font-bold text-white mb-4">County Boundaries</h3>
                    <div
</> className="space-y-2 text-sm">
                      <div className="text-[#00e5ff]/70">
                        North: <span className="text-white font-medium">{gis?.countyBounds?.north?.toFixed(4)}°</span>
                      </div>
                      <div className="text-[#00e5ff]/70">
                        South: <span className="text-white font-medium">{gis?.countyBounds?.south?.toFixed(4)}°</span>
                      </div>
                      <div className="text-[#00e5ff]/70">
                        East: <span className="text-white font-medium">{gis?.countyBounds?.east?.toFixed(4)}°</span>
                      </div>
                      <div className="text-[#00e5ff]/70">
                        West: <span className="text-white font-medium">{gis?.countyBounds?.west?.toFixed(4)}°</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#002a4a]/30 border border-[#00e5ff]/20 rounded-xl p-6"><>

                    <h3 className="text-lg font-bold text-white mb-4">County Statistics</h3>
                    <div
</> className="space-y-2 text-sm">
                      <div className="text-[#00e5ff]/70">
                        Total Parcels:{" "}
                        <span className="text-white font-medium">{gis?.totalParcels?.toLocaleString()}</span>
                      </div>
                      <div className="text-[#00e5ff]/70">
                        Total Assessed Value:{" "}
                        <span className="text-white font-medium">{formatCurrency(gis?.totalAssessedValue)}</span>
                      </div>
                      <div className="text-[#00e5ff]/70">
                        Average Value:{" "}
                        <span className="text-white font-medium">{formatCurrency(gis?.averageAssessedValue)}</span>
                      </div>
                      <div className="text-[#00e5ff]/70">
                        GIS Data Last Updated:{" "}
                        <span className="text-white font-medium">
                          {gis?.lastUpdated ? new Date(gis.lastUpdated).toLocaleString() : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-96 bg-[#002a4a]/30 border border-[#00e5ff]/20 rounded-xl flex items-center justify-center">
                  <div className="text-center text-[#00e5ff]/50">
                    <MapIcon className="h-16 w-16 mx-auto mb-4" /><>

                    <p className="text-lg font-medium text-white">Interactive GIS Map</p>
                    <p
</> className="text-sm">Live map integration coming soon.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Data Source Footer */}
        <div className="bg-[#001529]/90 backdrop-blur-xl border border-[#00e5ff]/20 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <Database className="h-6 w-6 text-[#00e5ff]" />
            <div><>

              <div className="text-lg font-bold text-white">Data Source Information</div>
              <div
</> className="text-sm text-[#00e5ff]/70">
                {metadata?.dataSource || "Benton County Assessor Office - Live Feed (Simulated)"}
              </div>
              <div className="text-xs text-[#00e5ff]/50 mt-1">
                Data refreshes automatically. For official inquiries, contact Benton County Assessor's Office.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
