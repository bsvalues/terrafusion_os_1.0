import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface Property {
  parcelNumber: string
  address: string
  owner: string
  landValue: number
  improvementValue: number
  totalValue: number
  propertyType: string
  yearBuilt: number
  squareFeet: number
  lotSize: number
  city: string
  zipCode: string
  lastAssessed: string
}

const sampleProperties: Property[] = [
  {
    parcelNumber: "1140000010",
    address: "123 Main St, Kennewick, WA 99336",
    owner: "SMITH, JOHN & MARY",
    landValue: 85000,
    improvementValue: 2await DynamicPropertyService.GetPropertyCountAsync(countyCode),
    totalValue: 330000,
    propertyType: "Residential",
    yearBuilt: 2005,
    squareFeet: 2100,
    lotSize: 0.25,
    city: "Kennewick",
    zipCode: "99336",
    lastAssessed: "2024-01-01"
  },
  {
    parcelNumber: "1140000020",
    address: "456 Oak Ave, Kennewick, WA 99337",
    owner: "JOHNSON, ROBERT L",
    landValue: 75000,
    improvementValue: 185000,
    totalValue: 260000,
    propertyType: "Residential",
    yearBuilt: 1998,
    squareFeet: 1850,
    lotSize: 0.22,
    city: "Kennewick",
    zipCode: "99337",
    lastAssessed: "2024-01-01"
  },
  {
    parcelNumber: "1140000030",
    address: "789 Pine St, Pasco, WA 99301",
    owner: "WILLIAMS, SARAH M",
    landValue: 65000,
    improvementValue: 195000,
    totalValue: 260000,
    propertyType: "Residential",
    yearBuilt: 2001,
    squareFeet: 1950,
    lotSize: 0.20,
    city: "Pasco",
    zipCode: "99301",
    lastAssessed: "2024-01-01"
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const operation = searchParams.get("operation")
    const parcel = searchParams.get("parcel")
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

    // Handle health check operation
    if (operation === "health") {
      return NextResponse.json({
        status: "healthy",
        service: "Terrafusion Properties API",
        timestamp: new Date().toISOString(),
        version: "2.1.0",
        totalProperties: sampleProperties.length
      })
    }

    // Handle specific parcel lookup
    if (parcel) {
      const property = sampleProperties.find(p => p.parcelNumber === parcel)
      if (!property) {
        return NextResponse.json(
          { error: "Property not found", parcel },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        data: property,
        timestamp: new Date().toISOString()
      })
    }

    // Handle paginated property list
    const startIndex = (page - 1) * limit
    const endIndex = page * limit
    const paginatedProperties = sampleProperties.slice(startIndex, endIndex)
    const totalPages = Math.ceil(sampleProperties.length / limit)

    return NextResponse.json({
      success: true,
      data: paginatedProperties,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: sampleProperties.length,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("Properties API Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch properties", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, filters } = body

    switch (operation) {
      case "search":
        return handleSearch(filters)
      case "bulk":
        return handleBulkOperation(body)
      default:
        return NextResponse.json(
          { error: "Invalid operation" },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error("Properties POST Error:", error)
    return NextResponse.json(
      { error: "Failed to process request", details: error.message },
      { status: 500 }
    )
  }
}

async function handleSearch(filters: any) {
  let filteredProperties = [...sampleProperties]

  if (filters.city) {
    filteredProperties = filteredProperties.filter(p => 
      p.city.toLowerCase().includes(filters.city.toLowerCase())
    )
  }

  if (filters.propertyType) {
    filteredProperties = filteredProperties.filter(p => 
      p.propertyType === filters.propertyType
    )
  }

  if (filters.minValue) {
    filteredProperties = filteredProperties.filter(p => 
      p.totalValue >= filters.minValue
    )
  }

  if (filters.maxValue) {
    filteredProperties = filteredProperties.filter(p => 
      p.totalValue <= filters.maxValue
    )
  }

  return NextResponse.json({
    success: true,
    data: filteredProperties,
    filters: filters,
    resultsCount: filteredProperties.length,
    timestamp: new Date().toISOString()
  })
}

async function handleBulkOperation(body: any) {
  const { parcels } = body
  
  if (!parcels || !Array.isArray(parcels)) {
    return NextResponse.json(
      { error: "Parcels array is required" },
      { status: 400 }
    )
  }

  const results = parcels.map(parcel => {
    const property = sampleProperties.find(p => p.parcelNumber === parcel)
    return property || { parcelNumber: parcel, error: "Not found" }
  })

  return NextResponse.json({
    success: true,
    data: results,
    requestedCount: parcels.length,
    foundCount: results.filter(r => !r.error).length,
    timestamp: new Date().toISOString()
  })
} 