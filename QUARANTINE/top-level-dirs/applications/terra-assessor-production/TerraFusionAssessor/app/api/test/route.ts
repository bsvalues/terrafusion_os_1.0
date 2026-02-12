import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface APITestResult {
  endpoint: string
  status: "success" | "error"
  responseTime: number
  statusCode: number
  error?: string
}

export async function GET(request: NextRequest) {
  const testResults: APITestResult[] = []
  const baseUrl = request.headers.get('host') || 'localhost:5008'
  const protocol = request.headers.get('x-forwarded-proto') || 'http'

  const endpoints = [
    '/api/health',
    '/api/properties?operation=health',
    '/api/benton-county-live?page=1&limit=5',
    '/api/quantum-scaling',
    '/api/ai/valuation?parcel=1140000010',
    '/api/market/intelligence?region=Benton County, WA',
    '/api/portfolio/analytics?portfolio=default',
    '/api/risk/assessment?subject=test&type=Property'
  ]

  for (const endpoint of endpoints) {
    const startTime = Date.now()
    try {
      const response = await fetch(`${protocol}://${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const responseTime = Date.now() - startTime
      const data = await response.json()
      
      testResults.push({
        endpoint,
        status: response.ok ? "success" : "error",
        responseTime,
        statusCode: response.status,
        error: response.ok ? undefined : data.error || 'Unknown error'
      })
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      testResults.push({
        endpoint,
        status: "error",
        responseTime,
        statusCode: 0,
        error: error.message
      })
    }
  }

  const successCount = testResults.filter(r => r.status === "success").length
  const totalCount = testResults.length
  const successRate = (successCount / totalCount) * 100

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    summary: {
      totalEndpoints: totalCount,
      successfulEndpoints: successCount,
      failedEndpoints: totalCount - successCount,
      successRate: `${successRate.toFixed(1)}%`,
      averageResponseTime: Math.round(
        testResults.reduce((sum, r) => sum + r.responseTime, 0) / totalCount
      )
    },
    results: testResults,
    systemStatus: successRate >= 90 ? "Healthy" : successRate >= 70 ? "Warning" : "Critical"
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testType = "full" } = body

    if (testType === "performance") {
      return performanceTest(request)
    } else if (testType === "load") {
      return loadTest(request)
    } else {
      return GET(request)
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to process test request", details: error.message },
      { status: 500 }
    )
  }
}

async function performanceTest(request: NextRequest) {
  const baseUrl = request.headers.get('host') || 'localhost:5008'
  const protocol = request.headers.get('x-forwarded-proto') || 'http'
  
  const performanceResults = []
  const testEndpoint = '/api/ai/valuation?parcel=1140000010'
  
  // Run 10 requests to measure performance
  for (let i = 0; i < 10; i++) {
    const startTime = Date.now()
    try {
      const response = await fetch(`${protocol}://${baseUrl}${testEndpoint}`)
      const responseTime = Date.now() - startTime
      await response.json()
      
      performanceResults.push({
        iteration: i + 1,
        responseTime,
        success: response.ok
      })
    } catch (error) {
      performanceResults.push({
        iteration: i + 1,
        responseTime: Date.now() - startTime,
        success: false
      })
    }
  }

  const successfulRequests = performanceResults.filter(r => r.success)
  const averageResponseTime = successfulRequests.length > 0 
    ? successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length
    : 0

  return NextResponse.json({
    success: true,
    testType: "performance",
    timestamp: new Date().toISOString(),
    results: {
      totalRequests: performanceResults.length,
      successfulRequests: successfulRequests.length,
      averageResponseTime: Math.round(averageResponseTime),
      minResponseTime: Math.min(...successfulRequests.map(r => r.responseTime)),
      maxResponseTime: Math.max(...successfulRequests.map(r => r.responseTime)),
      details: performanceResults
    }
  })
}

async function loadTest(request: NextRequest) {
  return NextResponse.json({
    success: true,
    testType: "load",
    timestamp: new Date().toISOString(),
    message: "Load testing requires external tools like Artillery or k6",
    recommendation: "Use 'npm run test:load' for comprehensive load testing"
  })
} 