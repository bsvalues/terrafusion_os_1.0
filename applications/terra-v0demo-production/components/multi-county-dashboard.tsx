"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building,
  MapPin,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Warning,
  Globe,
 } from '@mui/icons-material'

interface County {
  id: string
  name: string
  state: string
  status: "active" | "implementation" | "planning" | "demo"
  assessor: string
  totalParcels: number
  assessedValue: number
  goLiveDate: string
  implementation: {
    progress: number
    phase: string
    nextMilestone: string
  }
}

interface SystemMetrics {
  totalCounties: number
  totalParcels: number
  totalAssessedValue: number
  activeUsers: number
  systemUptime: number
  avgResponseTime: number
}

export default function MultiCountyDashboard() {
  const [selectedCounty, setSelectedCounty] = useState("all")
  const [counties, setCounties] = useState<County[]>([])
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalCounties: 0,
    totalParcels: 0,
    totalAssessedValue: 0,
    activeUsers: 0,
    systemUptime: 99.9,
    avgResponseTime: 145,
  })

  useEffect(() => {
    const mockCounties: County[] = [
      {
        id: "benton-wa",
        name: "Benton County",
        state: "WA",
        status: "active",
        assessor: "Jennifer Martinez",
        totalParcels: 89247,
        assessedValue: 12847392000,
        goLiveDate: "2025-01-15",
        implementation: {
          progress: 100,
          phase: "Production",
          nextMilestone: "Q1 Review - Feb 15, 2025",
        },
      },
      {
        id: "yakima-wa",
        name: "Yakima County",
        state: "WA",
        status: "implementation",
        assessor: "David Thompson",
        totalParcels: 156789,
        assessedValue: 18234567000,
        goLiveDate: "2025-03-01",
        implementation: {
          progress: 65,
          phase: "Data Migration",
          nextMilestone: "User Training - Feb 1, 2025",
        },
      },
      {
        id: "franklin-wa",
        name: "Franklin County",
        state: "WA",
        status: "planning",
        assessor: "Maria Rodriguez",
        totalParcels: 45623,
        assessedValue: 8456789000,
        goLiveDate: "2025-05-15",
        implementation: {
          progress: 25,
          phase: "Requirements Gathering",
          nextMilestone: "Contract Signing - Jan 30, 2025",
        },
      },
      {
        id: "king-wa",
        name: "King County",
        state: "WA",
        status: "demo",
        assessor: "Sarah Chen",
        totalParcels: 789456,
        assessedValue: 245678901000,
        goLiveDate: "TBD",
        implementation: {
          progress: 5,
          phase: "Initial Demo",
          nextMilestone: "Executive Presentation - Feb 10, 2025",
        },
      },
      {
        id: "orange-ca",
        name: "Orange County",
        state: "CA",
        status: "demo",
        assessor: "Michael Johnson",
        totalParcels: 1234567,
        assessedValue: 456789012000,
        goLiveDate: "TBD",
        implementation: {
          progress: 10,
          phase: "Pilot Program",
          nextMilestone: "Pilot Results Review - Mar 1, 2025",
        },
      },
    ]

    setCounties(mockCounties)

    // Calculate metrics
    const activeCounties = mockCounties.filter((c) => c.status === "active")
    const totalParcels = mockCounties.reduce((sum, c) => sum + c.totalParcels, 0)
    const totalValue = mockCounties.reduce((sum, c) => sum + c.assessedValue, 0)

    setMetrics({
      totalCounties: mockCounties.length,
      totalParcels,
      totalAssessedValue: totalValue,
      activeUsers: activeCounties.length * 15, // Estimate 15 users per active county
      systemUptime: 99.9,
      avgResponseTime: 145,
    })
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "implementation":
        return "bg-blue-100 text-blue-800"
      case "planning":
        return "bg-yellow-100 text-yellow-800"
      case "demo":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />
      case "implementation":
        return <Clock className="h-4 w-4" />
      case "planning":
        return <Calendar className="h-4 w-4" />
      case "demo":
        return <Warning className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const filteredCounties = selectedCounty === "all" ? counties : counties.filter((c) => c.id === selectedCounty)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-3xl font-bold">TerraFusionAssessor Multi-County Dashboard</h1>
          <p
</> className="text-gray-600">National property assessment platform management</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-100 text-blue-800"><>

            <Globe className="h-4 w-4 mr-1" />
            {counties.filter((c) => c.status === "active").length} Counties Live
          </Badge>
          <Button
</>>Add New County</Button>
        </div>
      </div>

      {/* System Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{metrics.totalCounties}</div>
                <div
</> className="text-sm text-gray-600">Total Counties</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <MapPin className="h-8 w-8 text-green-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{(metrics.totalParcels / 1000000).toFixed(1)}M</div>
                <div
</> className="text-sm text-gray-600">Total Parcels</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">${(metrics.totalAssessedValue / 1000000000).toFixed(0)}B</div>
                <div
</> className="text-sm text-gray-600">Total Assessed Value</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{metrics.activeUsers}</div>
                <div
</> className="text-sm text-gray-600">Active Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* County Filter */}
      <Card>
        <CardHeader><>

          <CardTitle>County Selection</CardTitle>
          <CardDescription
</>>View details for specific counties or all counties</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger className="w-64"><>

              <SelectValue placeholder="Select a county" />
            </SelectTrigger>
            <SelectContent
</>>
              <SelectItem value="all">All Counties</SelectItem>
              {counties.map((county) => (
                <SelectItem key={county.id} value={county.id}>
                  {county.name}, {county.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="overview">County Overview</TabsTrigger>
          <TabsTrigger
</> value="implementation">Implementation Status</TabsTrigger><>

          <TabsTrigger value="performance">System Performance</TabsTrigger>
          <TabsTrigger
</> value="expansion">Expansion Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCounties.map((county) => (
              <Card key={county.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><>

                      <Building className="h-6 w-6" />
                      {county.name}, {county.state}
                    </div>
                    <Badge
</> className={getStatusColor(county.status)}>
                      {getStatusIcon(county.status)}
                      <span className="ml-1">{county.status.toUpperCase()}</span>
                    </Badge>
                  </CardTitle>
                  <CardDescription>County Assessor: {county.assessor}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><>

                        <div className="font-medium">Total Parcels</div>
                        <div
</> className="text-2xl font-bold">{county.totalParcels.toLocaleString()}</div>
                      </div>
                      <div><>

                        <div className="font-medium">Assessed Value</div>
                        <div
</> className="text-2xl font-bold">{formatCurrency(county.assessedValue / 1000000)}M</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><>

                        <span>Implementation Progress</span>
                        <span
</>>{county.implementation.progress}%</span>
                      </div>
                      <Progress value={county.implementation.progress} />
                      <div className="text-xs text-gray-600">Current Phase: {county.implementation.phase}</div>
                    </div>

                    <div className="text-sm"><>

                      <div className="font-medium">Next Milestone:</div>
                      <div
</> className="text-gray-600">{county.implementation.nextMilestone}</div>
                    </div>

                    {county.status === "active" && (
                      <div className="flex gap-2"><>

                        <Button size="sm" variant="outline">
                          View Dashboard
                        </Button>
                        <Button
</> size="sm" variant="outline">
                          System Health
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="implementation" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Implementation Pipeline</CardTitle>
              <CardDescription
</>>Current status of county implementations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {counties.map((county) => (
                  <div key={county.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div><>

                        <h4 className="font-semibold">
                          {county.name}, {county.state}
                        </h4>
                        <p
</> className="text-sm text-gray-600">Assessor: {county.assessor}</p>
                      </div>
                      <Badge className={getStatusColor(county.status)}>{county.status.toUpperCase()}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><>

                        <span>Progress: {county.implementation.phase}</span>
                        <span
</>>{county.implementation.progress}%</span>
                      </div><>

                      <Progress value={county.implementation.progress} />
                    </div>

                    <div
</> className="mt-3 text-sm">
                      <div className="flex justify-between"><>

                        <span>Go-Live Date:</span>
                        <span
</> className="font-medium">
                          {county.goLiveDate === "TBD" ? "To Be Determined" : county.goLiveDate}
                        </span>
                      </div>
                      <div className="flex justify-between mt-1"><>

                        <span>Next Milestone:</span>
                        <span
</> className="font-medium">{county.implementation.nextMilestone}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  System Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><>

                    <span>System Uptime</span>
                    <span
</> className="font-bold text-green-600">{metrics.systemUptime}%</span>
                  </div>
                  <div className="flex justify-between items-center"><>

                    <span>Average Response Time</span>
                    <span
</> className="font-bold">{metrics.avgResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between items-center"><>

                    <span>Active Users</span>
                    <span
</> className="font-bold">{metrics.activeUsers}</span>
                  </div>
                  <div className="flex justify-between items-center"><>

                    <span>Data Processing Rate</span>
                    <span
</> className="font-bold">1,250 parcels/min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>County Status Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      status: "active",
                      count: counties.filter((c) => c.status === "active").length,
                      color: "text-green-600",
                    },
                    {
                      status: "implementation",
                      count: counties.filter((c) => c.status === "implementation").length,
                      color: "text-blue-600",
                    },
                    {
                      status: "planning",
                      count: counties.filter((c) => c.status === "planning").length,
                      color: "text-yellow-600",
                    },
                    {
                      status: "demo",
                      count: counties.filter((c) => c.status === "demo").length,
                      color: "text-purple-600",
                    },
                  ].map((item) => (
                    <div key={item.status} className="flex justify-between items-center"><>

                      <span className="capitalize">{item.status}</span>
                      <span
</> className={`font-bold ${item.color}`}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="expansion" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Expansion Strategy</CardTitle>
              <CardDescription
</>>National growth plan and target markets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div><>

                  <h4 className="font-semibold mb-3">Phase 1: Washington State Completion (2025)</h4>
                  <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><>

                      <div className="text-sm font-medium">Target Counties:</div>
                      <ul
</> className="text-sm text-gray-600 space-y-1"><>

                        <li>• Yakima County (In Progress)</li>
                            <li
</>>• Franklin County (Planning)</li><>

                        <li>• Walla Walla County (Q2 2025)</li>
                            <li
</>>• Spokane County (Q3 2025)</li>
                      </ul>
                    </div>
                    <div className="space-y-2"><>

                      <div className="text-sm font-medium">Expected Impact:</div>
                      <ul
</> className="text-sm text-gray-600 space-y-1"><>

                        <li>• 500,000+ additional parcels</li>
                            <li
</>>• $75B+ assessed value</li><>

                        <li>• 60+ new users</li>
                            <li
</>>• Market leadership in WA</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div><>

                  <h4 className="font-semibold mb-3">Phase 2: West Coast Expansion (2025-2026)</h4>
                  <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><>

                      <div className="text-sm font-medium">Target States:</div>
                      <ul
</> className="text-sm text-gray-600 space-y-1"><>

                        <li>• California (Orange, Riverside Counties)</li>
                            <li
</>>• Oregon (Multnomah, Washington Counties)</li>
                        <li>• Nevada (Clark, Washoe Counties)</li>
                      </ul>
                    </div>
                    <div className="space-y-2"><>

                      <div className="text-sm font-medium">Market Opportunity:</div>
                      <ul
</> className="text-sm text-gray-600 space-y-1"><>

                        <li>• 2M+ parcels potential</li>
                            <li
</>>• $500B+ assessed value</li><>

                        <li>• High-value property markets</li>
                            <li
</>>• Technology-forward counties</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div><>

                  <h4 className="font-semibold mb-3">Phase 3: National Rollout (2026+)</h4>
                  <div
</> className="text-sm text-gray-600">
                    Target major metropolitan counties across Texas, Florida, New York, and other high-growth markets.
                    Focus on counties with 100,000+ parcels and progressive technology adoption.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
