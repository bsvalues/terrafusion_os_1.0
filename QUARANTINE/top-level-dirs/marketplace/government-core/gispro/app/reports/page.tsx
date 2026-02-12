"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, Calendar, BarChart3, Home, Briefcase, TrendingUp, Clock  } from '@mui/icons-material'

interface Report {
  id: string
  title: string
  type: "market_analysis" | "property_valuation" | "portfolio_summary" | "risk_assessment"
  status: "generating" | "completed" | "failed"
  progress?: number
  generated_at?: string
  download_url?: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("market_analysis")
  const [reportParams, setReportParams] = useState({
    region: "Downtown",
    property_id: "PROP_001",
    portfolio_id: "PORT_001",
    date_range: {
      start: "2024-01-01",
      end: "2024-12-31",
    },
  })

  const generateReport = async (type: string) => {
    setIsGenerating(true)

    const newReport: Report = {
      id: `report_${Date.now()}`,
      title: getReportTitle(type),
      type: type as any,
      status: "generating",
      progress: 0,
    }

    setReports((prev) => [newReport, ...prev])

    try {
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        setReports((prev) => prev.map((r) => (r.id === newReport.id ? { ...r, progress: i } : r)))
      }

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          region: reportParams.region,
          property_id: reportParams.property_id,
          portfolio_id: reportParams.portfolio_id,
          date_range: reportParams.date_range,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === newReport.id
              ? {
                  ...r,
                  status: "completed",
                  generated_at: result.data.generated_at,
                  download_url: `/api/reports/download?id=${result.data.id}`,
                }
              : r,
          ),
        )
      } else {
        setReports((prev) => prev.map((r) => (r.id === newReport.id ? { ...r, status: "failed" } : r)))
      }
    } catch (error) {
      console.error("Report generation failed:", error)
      setReports((prev) => prev.map((r) => (r.id === newReport.id ? { ...r, status: "failed" } : r)))
    } finally {
      setIsGenerating(false)
    }
  }

  const getReportTitle = (type: string) => {
    switch (type) {
      case "market_analysis":
        return `Market Analysis Report - ${reportParams.region}`
      case "property_valuation":
        return `Property Valuation Report - ${reportParams.property_id}`
      case "portfolio_summary":
        return `Portfolio Summary Report - ${reportParams.portfolio_id}`
      case "risk_assessment":
        return "Risk Assessment Report"
      default:
        return "GAMA Report"
    }
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case "market_analysis":
        return <BarChart3 className="h-4 w-4 text-blue-600" />
      case "property_valuation":
        return <Home className="h-4 w-4 text-green-600" />
      case "portfolio_summary":
        return <Briefcase className="h-4 w-4 text-purple-600" />
      case "risk_assessment":
        return <TrendingUp className="h-4 w-4 text-orange-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "generating":
        return "bg-blue-100 text-blue-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8"><>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            GAMA Reports Center
          </h1>
          <p
</>
className="text-xl text-gray-600 mt-2">Generate comprehensive property and market analysis reports</p>
        </div>

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto"><>

            <TabsTrigger value="generate">Generate Reports</TabsTrigger>
            <TabsTrigger
</>
value="history">Report History</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Report Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><>

                    <FileText className="h-5 w-5 text-blue-600" />
                    Generate New Report
                  </CardTitle>
                  <CardDescription
</>
</>>
                    Create detailed analysis reports with AI-powered insights and sacred geometry analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Report Type Selection */}
                  <div className="space-y-3"><>

                    <Label>Report Type</Label>
                    <div
</>
className="grid grid-cols-2 gap-3">
                      <Button
                        variant={selectedType === "market_analysis" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType("market_analysis")}
                        className="justify-start"
                      ><>

                        <BarChart3 className="h-4 w-4 mr-2" />
                        Market Analysis
                      </Button>
                      <Button
</>

                        variant={selectedType === "property_valuation" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType("property_valuation")}
                        className="justify-start"
                      ><>

                        <Home className="h-4 w-4 mr-2" />
                        Property Valuation
                      </Button>
                      <Button
</>

                        variant={selectedType === "portfolio_summary" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType("portfolio_summary")}
                        className="justify-start"
                      ><>

                        <Briefcase className="h-4 w-4 mr-2" />
                        Portfolio Summary
                      </Button>
                      <Button
</>

                        variant={selectedType === "risk_assessment" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedType("risk_assessment")}
                        className="justify-start"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Risk Assessment
                      </Button>
                    </div>
                  </div>

                  {/* Parameters */}
                  <div className="space-y-4">
                    {selectedType === "market_analysis" && (
                      <div><>

                        <Label htmlFor="region">Region</Label>
                        <select
</>

                          id="region"
                          className="w-full p-2 border rounded-md"
                          value={reportParams.region}
                          onChange={(e) => setReportParams((prev) => ({ ...prev, region: e.target.value }))}
                        ><>

                          <option value="Downtown">Downtown</option>
                          <option
</>
value="Suburbs">Suburbs</option><>

                          <option value="Waterfront">Waterfront</option>
                          <option
</>
value="Historic District">Historic District</option>
                        </select>
                      </div>
                    )}

                    {selectedType === "property_valuation" && (
                      <div><>

                        <Label htmlFor="property_id">Property ID</Label>
                        <Input
</>

                          id="property_id"
                          value={reportParams.property_id}
                          onChange={(e) => setReportParams((prev) => ({ ...prev, property_id: e.target.value }))}
                          placeholder="Enter property ID"
                        />
                      </div>
                    )}

                    {selectedType === "portfolio_summary" && (
                      <div><>

                        <Label htmlFor="portfolio_id">Portfolio ID</Label>
                        <Input
</>

                          id="portfolio_id"
                          value={reportParams.portfolio_id}
                          onChange={(e) => setReportParams((prev) => ({ ...prev, portfolio_id: e.target.value }))}
                          placeholder="Enter portfolio ID"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div><>

                        <Label htmlFor="start_date">Start Date</Label>
                        <Input
</>

                          id="start_date"
                          type="date"
                          value={reportParams.date_range.start}
                          onChange={(e) =>
                            setReportParams((prev) => ({
                              ...prev,
                              date_range: { ...prev.date_range, start: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div><>

                        <Label htmlFor="end_date">End Date</Label>
                        <Input
</>

                          id="end_date"
                          type="date"
                          value={reportParams.date_range.end}
                          onChange={(e) =>
                            setReportParams((prev) => ({
                              ...prev,
                              date_range: { ...prev.date_range, end: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => generateReport(selectedType)} disabled={isGenerating} className="w-full">
                    {isGenerating ? "Generating..." : "Generate Report"}
                  </Button>
                </CardContent>
              </Card>

              {/* Report Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><>

                    <Calendar className="h-5 w-5 text-purple-600" />
                    Report Preview
                  </CardTitle>
                  <CardDescription
</>
</>>Preview of the selected report type and parameters</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getReportIcon(selectedType)}
                        <span className="font-medium">{getReportTitle(selectedType)}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Type: {selectedType.replace("_", " ").toUpperCase()}</div>
                        {selectedType === "market_analysis" && <div>Region: {reportParams.region}</div>}
                        {selectedType === "property_valuation" && <div>Property: {reportParams.property_id}</div>}
                        {selectedType === "portfolio_summary" && <div>Portfolio: {reportParams.portfolio_id}</div>}
                        <div>
                          Period: {reportParams.date_range.start} to {reportParams.date_range.end}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2"><>

                      <h4 className="font-medium">Report Will Include:</h4>
                      <ul
</>
className="text-sm text-gray-600 space-y-1">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          AI-powered analysis and insights
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          Sacred geometry pattern analysis
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          Market trends and predictions
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          Risk assessment and recommendations
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          Comparative analysis and benchmarks
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><>

                  <Clock className="h-5 w-5 text-green-600" />
                  Report History
                </CardTitle>
                <CardDescription
</>
</>>View and download previously generated reports</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      No reports generated yet. Use the "Generate Reports" tab to create your first report.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <Card key={report.id} className="border">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getReportIcon(report.type)}
                              <div><>

                                <div className="font-medium">{report.title}</div>
                                <div
</>
className="text-sm text-gray-600">
                                  {report.generated_at
                                    ? `Generated: ${new Date(report.generated_at).toLocaleString()}`
                                    : "In progress..."}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(report.status)}>{report.status}</Badge>

                              {report.status === "generating" && typeof report.progress === "number" && (
                                <div className="w-24">
                                  <Progress value={report.progress} className="h-2" />
                                </div>
                              )}

                              {report.status === "completed" && (
                                <Button size="sm" variant="outline">
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
