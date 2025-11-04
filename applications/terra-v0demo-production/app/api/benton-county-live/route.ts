import { type NextRequest, NextResponse } from "next/server"
import data from "@/public/benton-county-data.json" // Import the large dataset

export const dynamic = "force-dynamic"

// The full dataset is imported from the JSON file.
const allProperties: any[] = data

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
