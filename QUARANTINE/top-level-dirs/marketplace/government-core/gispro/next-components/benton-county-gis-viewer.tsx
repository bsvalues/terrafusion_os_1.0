"use client"

import { useState, useEffect, useMemo, Fragment } from "react" // Added Fragment
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MapPin, Layers, Loader2, Warning, Columns, ListFilter, Search  } from '@mui/icons-material'

interface Feature {
  attributes: Record<string, any>
}

interface FieldDefinition {
  name: string
  alias: string
  type: string
}

interface ArcGISResponse {
  features?: Feature[]
  fields?: FieldDefinition[]
  error?: any
}

// Helper component to highlight matches
const HighlightMatch = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) {
    return <>{text}</>
  }
  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  const parts = String(text).split(regex)

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-300 dark:bg-yellow-500 px-0.5 rounded-sm">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  )
}

const bentonCountyServices = [
  { name: "16th Section Lines", value: "16thSectionLines" },
  { name: "2015 Permits", value: "2015_Permits" },
  { name: "2016 Road Approaches", value: "2016_Road_Approaches" },
  { name: "2020 Census Blocks", value: "2020_Census_Blocks" },
  { name: "2024 Benton HVTargets", value: "2024_Benton_HVTargets" },
  { name: "Access Easement", value: "Access_Easement" },
  { name: "Address", value: "Address" },
  { name: "All Weather Roads", value: "AllWeatherRoads" },
  { name: "Analysis Feature", value: "AnalysisFeature" },
  { name: "Annexations", value: "Annexations" },
  { name: "Archived Parcels", value: "ArchivedParcels" },
  { name: "Assessor Prop Val", value: "AssessorPropVal" },
  { name: "AVA", value: "AVA" },
  { name: "Badger Mt Survey Newpano1 ImageLocations", value: "BadgerMtSurvey_Newpano1_ImageLocations" },
  { name: "BC 100yrFlood", value: "BC_100yrFlood" },
  { name: "BC Address", value: "BC_Address" },
  { name: "BC BikeLane", value: "BC_BikeLane" },
  { name: "BC BikeWalkingPath", value: "BC_BikeWalkingPath" },
  { name: "BC ForceMains", value: "BC_ForceMains" },
  { name: "BC Land Use", value: "BC_Land_Use" },
  { name: "BC Zoning", value: "BC_Zoning" },
  { name: "BCSOzones", value: "BCSOzones" },
  { name: "BeaconMeterData", value: "BeaconMeterData" },
  { name: "BenFrankPublicTransitBenefitArea", value: "BenFrankPublicTransitBenefitArea" },
  { name: "Benton City Roads", value: "Benton_City_Roads" },
  { name: "Benton City Zoning", value: "Benton_City_Zoning" },
  { name: "Benton County Bridge and Tunnel", value: "Benton_County_Bridge_and_Tunnel" },
  { name: "Benton County Slope Map", value: "Benton_County_Slope_Map" },
  { name: "Benton County Irrigation District", value: "Benton_County_Irrigation_District" },
  { name: "BentonPUDBoundary", value: "BentonPUDBoundary" },
  { name: "BentonREABoundary", value: "BentonREABoundary" },
]

const MAX_DEFAULT_COLUMNS = 7

export function BentonCountyGisViewer() {
  const [selectedService, setSelectedService] = useState<string>(bentonCountyServices[0].value)
  const [features, setFeatures] = useState<Feature[]>([])
  const [allAvailableFields, setAllAvailableFields] = useState<FieldDefinition[]>([])
  const [selectedColumnNames, setSelectedColumnNames] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recordCount, setRecordCount] = useState<string>("10")
  const [searchTerm, setSearchTerm] = useState<string>("")

  const fetchGisData = async (service: string, count: string) => {
    setIsLoading(true)
    setError(null)
    setFeatures([])
    setAllAvailableFields([])
    setSearchTerm("")

    try {
      const response = await fetch(`/api/arcgis?service=${service}&recordCount=${count}`)
      const result = await response.json()

      if (result.success && result.data) {
        if (result.data.error) {
          setError(
            `Error from ArcGIS Service: ${result.data.error.message || JSON.stringify(result.data.error.details)}`,
          )
        } else {
          const fetchedFeatures = result.data.features || []
          const fetchedFields = result.data.fields || []

          setFeatures(fetchedFeatures)

          let availableFields: FieldDefinition[] = []
          if (fetchedFields.length > 0) {
            availableFields = fetchedFields
          } else if (fetchedFeatures.length > 0 && fetchedFeatures[0].attributes) {
            availableFields = Object.keys(fetchedFeatures[0].attributes).map((key) => ({
              name: key,
              alias: key,
              type: "unknown",
            }))
          }
          setAllAvailableFields(availableFields)
          setSelectedColumnNames(availableFields.slice(0, MAX_DEFAULT_COLUMNS).map((f) => f.name))

          if (fetchedFeatures.length === 0 && !result.data.error) {
            setError("No features found for the selected layer.")
          }
        }
      } else {
        setError(result.error || "Failed to fetch GIS data.")
      }
    } catch (e: any) {
      setError(`An error occurred: ${e.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedService) {
      fetchGisData(selectedService, recordCount)
    }
  }, [selectedService, recordCount])

  const handleServiceChange = (value: string) => {
    setSelectedService(value)
  }

  const handleRecordCountChange = (value: string) => {
    setRecordCount(value)
  }

  const handleColumnSelectionChange = (fieldName: string) => {
    setSelectedColumnNames((prev) =>
      prev.includes(fieldName) ? prev.filter((name) => name !== fieldName) : [...prev, fieldName],
    )
  }

  const displayedTableColumns = useMemo(() => {
    return allAvailableFields.filter((field) => selectedColumnNames.includes(field.name))
  }, [allAvailableFields, selectedColumnNames])

  const filteredFeatures = useMemo(() => {
    if (!searchTerm.trim()) {
      return features
    }
    const lowerSearchTerm = searchTerm.toLowerCase()
    return features.filter((feature) => {
      return displayedTableColumns.some((column) => {
        const value = feature.attributes[column.name]
        return String(value).toLowerCase().includes(lowerSearchTerm)
      })
    })
  }, [features, searchTerm, displayedTableColumns])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" />
          Benton County GIS Data Viewer
        </CardTitle>
        <CardDescription>
          Explore various GIS layers for Benton County, Washington. Data sourced from ArcGIS REST Services.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-grow w-full sm:w-auto">
            <label htmlFor="gis-layer-select" className="text-sm font-medium mb-1 block">
              Select GIS Layer
            </label>
            <Select             <Select value={selectedService} onValueChange={handleServiceChange}>
              <SelectTrigger id="gis-layer-select">
                <SelectValue placeholder="Select a GIS Layer" />
              </SelectTrigger>
              <SelectContent>
                {bentonCountyServices.map((service) => (
                  <SelectItem key={service.value} value={service.value}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[120px]">
            <label htmlFor="record-count-select" className="text-sm font-medium mb-1 block">
              Records
            </label>
            <Select             <Select value={recordCount} onValueChange={handleRecordCountChange}>
              <SelectTrigger id="record-count-select">
                <SelectValue placeholder="Count" />
              </SelectTrigger>
              <SelectContent>
<>

                <SelectItem value="5">5</SelectItem>
                <SelectItem
</>
value="10">10</SelectItem>
<>

                <SelectItem value="25">25</SelectItem>
                <SelectItem
</>
value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {allAvailableFields.length > 0 && (
            <div className="w-full sm:w-auto">
              <label className="text-sm font-medium mb-1 block opacity-0 sm:opacity-100 hidden sm:block">Columns</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Columns className="h-4 w-4 mr-2" />
                    Columns ({selectedColumnNames.length}/{allAvailableFields.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-96 overflow-y-auto">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allAvailableFields.map((field) => (
                    <DropdownMenuCheckboxItem
                      key={field.name}
                      checked={selectedColumnNames.includes(field.name)}
                      onCheckedChange={() => handleColumnSelectionChange(field.name)}
                    >
                      {field.alias || field.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <Button
            onClick={() => fetchGisData(selectedService, recordCount)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Layers className="h-4 w-4 mr-2" />}
            Fetch Data
          </Button>
        </div>

        {features.length > 0 && displayedTableColumns.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search across visible columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full"
            />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <Warning className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && !error && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="ml-2 text-gray-600">Loading GIS data...</p>
          </div>
        )}

        {!isLoading && !error && features.length > 0 && filteredFeatures.length === 0 && searchTerm && (
          <Alert>
            <ListFilter className="h-4 w-4" />
            <AlertDescription>
              No records match your search term "{searchTerm}". Try a different search.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && features.length === 0 && allAvailableFields.length > 0 && !searchTerm && (
          <Alert>
            <ListFilter className="h-4 w-4" />
            <AlertDescription>
              No features found for this layer, or your current filter/query returned no results.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && features.length > 0 && displayedTableColumns.length === 0 && (
          <Alert variant="default">
            <Columns className="h-4 w-4" />
            <AlertDescription>
              No columns selected. Please select columns to display using the "Columns" button.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && filteredFeatures.length > 0 && displayedTableColumns.length > 0 && (
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {displayedTableColumns.map((field) => (
                    <TableHead key={field.name} className="whitespace-nowrap">
                      {field.alias || field.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeatures.map((feature, index) => (
                  <TableRow key={index}>
                    {displayedTableColumns.map((field) => (
                      <TableCell key={field.name} className="whitespace-nowrap">
                        {searchTerm ? (
                          <HighlightMatch
                            text={String(feature.attributes[field.name] ?? "N/A")}
                            highlight={searchTerm}
                          />
                        ) : (
                          String(feature.attributes[field.name] ?? "N/A")
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-sm text-gray-500 mt-2 p-2">
              Showing {filteredFeatures.length} of {features.length} records. Displaying {displayedTableColumns.length}{" "}
              of {allAvailableFields.length} available attributes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
