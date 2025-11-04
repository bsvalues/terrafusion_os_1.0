import { type NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"

// Sample property data for development
const allProperties: any[] = [
  {
    parcel_number: "1140000010",
    property_address: "123 Main St, Kennewick, WA 99336",
    owner_name: "SMITH, JOHN & MARY",
    land_value: 85000,
    improvement_value: 245000,
    assessed_value: 330000,
    property_type: "Residential",
    year_built: 2005,
    square_feet: 2100,
    lot_size: 0.25,
    city: "Kennewick",
    zip_code: "99336"
  },
  {
    parcel_number: "1140000020",
    property_address: "456 Oak Ave, Kennewick, WA 99337",
    owner_name: "JOHNSON, ROBERT L",
    land_value: 75000,
    improvement_value: 185000,
    assessed_value: 260000,
    property_type: "Residential",
    year_built: 1998,
    square_feet: 1850,
    lot_size: 0.22,
    city: "Kennewick",
    zip_code: "99337"
  },
  {
    parcel_number: "1140000030",
    property_address: "789 Pine St, Pasco, WA 99301",
    owner_name: "WILLIAMS, SARAH M",
    land_value: 65000,
    improvement_value: 195000,
    assessed_value: 260000,
    property_type: "Residential",
    year_built: 2001,
    square_feet: 1950,
    lot_size: 0.20,
    city: "Pasco",
    zip_code: "99301"
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1", 10)
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    const paginatedProperties = allProperties.slice(startIndex, endIndex)
    const totalProperties = allProperties.length
    const totalPages = Math.ceil(totalProperties / limit)

    // Simulate fetching related data for the paginated properties
    const assessments = paginatedProperties.map((p) => ({
      parcelNumber: p.parcel_number,
      taxYear: 2024,
      assessmentDate: "2024-01-01",
      landValue: p.land_value,
      improvementValue: p.improvement_value,
      totalAssessedValue: p.assessed_value,
      marketValue: p.assessed_value,
      assessmentMethod: "Generated Model",
      assessor: "Terrafusion AI",
      status: "Final",
    }))

    const sales = paginatedProperties.slice(0, 5).map((p) => ({
      // Simulate a few sales
      parcelNumber: p.parcel_number,
      saleDate: `2024-0${getRandomInt(1, 9)}-${getRandomInt(10, 28)}`,
      salePrice: p.assessed_value * getRandomFloat(0.95, 1.1, 2),
      buyer: "INVESTMENT GROUP LLC",
      seller: "PREVIOUS OWNER",
      saleType: "Arms Length",
      verified: true,
      deedType: "Warranty Deed",
    }))

    const totalAssessedValue = allProperties.reduce((sum, p) => sum + p.assessed_value, 0)

    const gis = {
      countyBounds: { north: 46.4167, south: 45.9167, east: -119.0833, west: -119.8333 },
      totalParcels: totalProperties,
      totalAssessedValue: totalAssessedValue,
      averageAssessedValue: totalProperties > 0 ? totalAssessedValue / totalProperties : 0,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalProperties,
        itemsPerPage: limit,
      },
      data: {
        properties: paginatedProperties,
        assessments: assessments,
        sales: sales,
        gis: gis,
        metadata: {
          totalParcels: totalProperties,
          lastUpdated: new Date().toISOString(),
          dataSource: "Terrafusion Generated Database (10k Records)",
        },
      },
    })
  } catch (error: any) {
    console.error("API Error fetching Benton County data:", error)
    return NextResponse.json({ error: "Failed to fetch data", details: error.message }, { status: 500 })
  }
}

// Helper functions to be used within the API route
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const getRandomFloat = (min: number, max: number, decimals: number) =>
  Number.parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
