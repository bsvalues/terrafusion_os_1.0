import { type NextRequest, NextResponse } from "next/server"

interface MarketData {
  region: string
  average_price: number
  price_change: number
  market_energy: number
  active_listings: number
  days_on_market: number
  absorption_rate: number
  trend: "rising" | "stable" | "declining"
  last_updated: string
}

interface MarketTrend {
  month: string
  price: number
  volume: number
  energy: number
}

class MarketAnalysisEngine {
  private regions = ["Downtown", "Suburbs", "Waterfront", "Historic District", "Tech Corridor"]

  generateMarketData(region: string): MarketData {
    const basePrice = this.getBasePriceForRegion(region)
    const priceChange = -5 + Math.random() * 15 // -5% to +10%
    const marketEnergy = 60 + Math.random() * 40

    return {
      region,
      average_price: Math.round(basePrice * (1 + Math.random() * 0.2 - 0.1)),
      price_change: Math.round(priceChange * 100) / 100,
      market_energy: Math.round(marketEnergy),
      active_listings: Math.round(150 + Math.random() * 200),
      days_on_market: Math.round(20 + Math.random() * 40),
      absorption_rate: Math.round(50 + Math.random() * 40),
      trend: priceChange > 3 ? "rising" : priceChange < -2 ? "declining" : "stable",
      last_updated: new Date().toISOString(),
    }
  }

  generateMarketTrends(region: string): MarketTrend[] {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const basePrice = this.getBasePriceForRegion(region)

    return months.map((month /* , index */) => {
      const seasonalFactor = 1 + 0.1 * Math.sin((index / 12) * 2 * Math.PI)
      const trendFactor = 1 + index * 0.015 // 1.5% monthly growth
      const randomFactor = 0.95 + Math.random() * 0.1

      return {
        month,
        price: Math.round(basePrice * seasonalFactor * trendFactor * randomFactor),
        volume: Math.round(40 + Math.random() * 80),
        energy: Math.round(50 + Math.random() * 50),
      }
    })
  }

  private getBasePriceForRegion(region: string): number {
    const basePrices = {
      Downtown: 650000,
      Suburbs: 450000,
      Waterfront: 850000,
      "Historic District": 550000,
      "Tech Corridor": 750000,
    }
    return basePrices[region as keyof typeof basePrices] || 500000
  }

  calculateMarketInsights(data: MarketData): string[] {
    const insights = []

    if (data.market_energy > 75) {
      insights.push(`Strong buyer demand detected in ${data.region}`)
    } else if (data.market_energy < 40) {
      insights.push(`Market cooling observed in ${data.region}`)
    }

    if (data.price_change > 5) {
      insights.push("Significant price appreciation trend")
    } else if (data.price_change < -3) {
      insights.push("Price correction in progress")
    }

    if (data.days_on_market < 25) {
      insights.push("Fast-moving market with quick sales")
    } else if (data.days_on_market > 45) {
      insights.push("Extended time on market indicates buyer selectivity")
    }

    if (data.absorption_rate > 70) {
      insights.push("High absorption rate suggests supply shortage")
    } else if (data.absorption_rate < 40) {
      insights.push("Low absorption rate indicates oversupply")
    }

    return insights
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get("region") || "Downtown"
  const includeTrends = searchParams.get("trends") === "true"

  const engine = new MarketAnalysisEngine()
  const marketData = engine.generateMarketData(region)
  const insights = engine.calculateMarketInsights(marketData)

  const response: any = {
    success: true,
    data: {
      ...marketData,
      insights,
    },
  }

  if (includeTrends) {
    response.data.trends = engine.generateMarketTrends(region)
  }

  return NextResponse.json(response)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { regions } = body

    if (!regions || !Array.isArray(regions)) {
      return NextResponse.json(
        {
          success: false,
          error: "Regions array is required",
        },
        { status: 400 },
      )
    }

    const engine = new MarketAnalysisEngine()
    const marketComparison = regions.map((region) => {
      const data = engine.generateMarketData(region)
      const insights = engine.calculateMarketInsights(data)
      return { ...data, insights }
    })

    return NextResponse.json({
      success: true,
      data: marketComparison,
      comparison_date: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Market analysis failed",
      },
      { status: 500 },
    )
  }
}
