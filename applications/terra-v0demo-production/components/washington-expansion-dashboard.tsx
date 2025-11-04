"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building,
  MapPin,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  Layers,
 } from '@mui/icons-material'

interface WashingtonCounty {
  id: string
  name: string
  status: "planning" | "contract_signed" | "data_migration" | "configuration" | "training" | "testing" | "live"
  progress: number
  population: number
  parcels: number
  assessedValue: number
  goLiveDate: string
  assessor: string
  keyFeatures: string[]
  challenges: string[]
  contractValue: number
  annualRevenue: number
  teamMembers: number
  nextMilestone: {
    name: string
    date: string
  }
}

export default function WashingtonExpansionDashboard() {
  const [counties, setCounties] = useState<WashingtonCounty[]>([])
  const [selectedCounty, setSelectedCounty] = useState<string>("all")
  const [totalMetrics, setTotalMetrics] = useState({
    totalCounties: 0,
    totalParcels: 0,
    totalAssessedValue: 0,
    totalContractValue: 0,
    totalAnnualRevenue: 0,
  })

  useEffect(() => {
    // Mock data for Washington counties
    const mockCounties: WashingtonCounty[] = [
      {
        id: "benton",
        name: "Benton County",
        status: "live",
        progress: 100,
        population: 205700,
        parcels: 89247,
        assessedValue: 12847392000,
        goLiveDate: "2025-01-15",
        assessor: "Jennifer Martinez",
        keyFeatures: ["Flagship implementation", "Tri-Cities metro area", "Mixed urban/agricultural"],
        challenges: ["First implementation", "Data migration complexity", "Staff training"],
        contractValue: 450000,
        annualRevenue: 125000,
        teamMembers: 5,
        nextMilestone: {
          name: "Quarterly Review",
          date: "2025-04-15",
        },
      },
      {
        id: "yakima",
        name: "Yakima County",
        status: "data_migration",
        progress: 65,
        population: 256728,
        parcels: 156789,
        assessedValue: 18234567000,
        goLiveDate: "2025-03-01",
        assessor: "David Thompson",
        keyFeatures: ["Agricultural focus", "Large parcel volume", "Hop farming valuation"],
        challenges: ["Complex agricultural valuations", "GIS integration", "Seasonal workforce"],
        contractValue: 525000,
        annualRevenue: 145000,
        teamMembers: 5,
        nextMilestone: {
          name: "Data Migration Completion",
          date: "2025-01-31",
        },
      },
      {
        id: "walla-walla",
        name: "Walla Walla County",
        status: "contract_signed",
        progress: 15,
        population: 62584,
        parcels: 32450,
        assessedValue: 7856000000,
        goLiveDate: "2025-04-15",
        assessor: "Michael Johnson",
        keyFeatures: ["Wine country", "College properties", "Historic district valuations"],
        challenges: ["Vineyard valuation models", "Limited IT staff", "Historic properties"],
        contractValue: 325000,
        annualRevenue: 90000,
        teamMembers: 4,
        nextMilestone: {
          name: "Kickoff Meeting",
          date: "2025-01-22",
        },
      },
      {
        id: "asotin",
        name: "Asotin County",
        status: "planning",
        progress: 5,
        population: 22285,
        parcels: 12850,
        assessedValue: 1950000000,
        goLiveDate: "2025-05-01",
        assessor: "Sarah Williams",
        keyFeatures: ["Small county", "Border county", "Rural focus"],
        challenges: ["Limited IT resources", "Budget constraints", "Staff training"],
        contractValue: 275000,
        annualRevenue: 75000,
        teamMembers: 3,
        nextMilestone: {
          name: "Contract Signing",
          date: "2025-02-01",
        },
      },
      {
        id: "klickitat",
        name: "Klickitat County",
        status: "planning",
        progress: 10,
        population: 22425,
        parcels: 18750,
        assessedValue: 3250000000,
        goLiveDate: "2025-05-15",
        assessor: "Robert Chen",
        keyFeatures: ["Renewable energy", "Wind farms", "Columbia River properties"],
        challenges: ["Wind farm valuations", "Remote implementation", "Energy infrastructure"],
        contractValue: 285000,
        annualRevenue: 80000,
        teamMembers: 3,
        nextMilestone: {
          name: "Contract Signing",
          date: "2025-02-15",
        },
      },
      {
        id: "grant",
        name: "Grant County",
        status: "planning",
        progress: 8,
        population: 97733,
        parcels: 65400,
        assessedValue: 9850000000,
        goLiveDate: "2025-06-01",
        assessor: "Lisa Rodriguez",
        keyFeatures: ["Columbia Basin Project", "Irrigation districts", "Data centers"],
        challenges: ["Water rights valuations", "Irrigation districts", "Agricultural properties"],
        contractValue: 375000,
        annualRevenue: 105000,
        teamMembers: 4,
        nextMilestone: {
          name: "Contract Signing",
          date: "2025-03-01",
        },
      },
      {
        id: "cowlitz",
        name: "Cowlitz County",
        status: "planning",
        progress: 3,
        population: 110730,
        parcels: 58750,
        assessedValue: 12450000000,
        goLiveDate: "2025-06-15",
        assessor: "Thomas Wilson",
        keyFeatures: ["Industrial properties", "Timber lands", "Port properties"],
        challenges: ["Industrial valuations", "Timber assessment", "Environmental impacts"],
        contractValue: 385000,
        annualRevenue: 110000,
        teamMembers: 4,
        nextMilestone: {
          name: "Contract Signing",
          date: "2025-03-15",
        },
      },
      {
        id: "san-juan",
        name: "San Juan County",
        status: "planning",
        progress: 2,
        population: 17788,
        parcels: 19850,
        assessedValue: 14750000000,
        goLiveDate: "2025-07-01",
        assessor: "Emily Parker",
        keyFeatures: ["Island properties", "High-value waterfront", "Vacation homes"],
        challenges: ["Island logistics", "Seasonal population", "Premium valuations"],
        contractValue: 295000,
        annualRevenue: 85000,
        teamMembers: 3,
        nextMilestone: {
          name: "Contract Signing",
          date: "2025-04-01",
        },
      },
      {
        id: "island",
        name: "Island County",
        status: "planning",
        progress: 1,
        population: 86280,
        parcels: 47500,
        assessedValue: 16850000000,
        goLiveDate: "2025-07-15",
        assessor: "Daniel Kim",
        keyFeatures: ["Naval Air Station", "Waterfront", "Military housing"],
        challenges: ["Military impact zones", "Noise contours", "Waterfront assessment"],
        contractValue: 365000,
        annualRevenue: 100000,
        teamMembers: 4,
        nextMilestone: {
          name: "Contract Signing",
          date: "2025-04-15",
        },
      },
    ]

    setCounties(mockCounties)

    // Calculate total metrics
    const totalParcels = mockCounties.reduce((sum, county) => sum + county.parcels, 0)
    const totalAssessedValue = mockCounties.reduce((sum, county) => sum + county.assessedValue, 0)
    const totalContractValue = mockCounties.reduce((sum, county) => sum + county.contractValue, 0)
    const totalAnnualRevenue = mockCounties.reduce((sum, county) => sum + county.annualRevenue, 0)

    setTotalMetrics({
      totalCounties: mockCounties.length,
      totalParcels,
      totalAssessedValue,
      totalContractValue,
      totalAnnualRevenue,
    })
  }, [])

  const filteredCounties = selectedCounty === "all" ? counties : counties.filter((c) => c.id === selectedCounty)

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
      case "live":
        return "bg-green-100 text-green-800"
      case "testing":
        return "bg-purple-100 text-purple-800"
      case "training":
        return "bg-blue-100 text-blue-800"
      case "configuration":
        return "bg-indigo-100 text-indigo-800"
      case "data_migration":
        return "bg-yellow-100 text-yellow-800"
      case "contract_signed":
        return "bg-orange-100 text-orange-800"
      case "planning":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "live":
        return <CheckCircle className="h-4 w-4" />
      case "testing":
        return <FileText className="h-4 w-4" />
      case "training":
        return <Users className="h-4 w-4" />
      case "configuration":
        return <Layers className="h-4 w-4" />
      case "data_migration":
        return <BarChart3 className="h-4 w-4" />
      case "contract_signed":
        return <FileText className="h-4 w-4" />
      case "planning":
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    return status.replace("_", " ").toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-3xl font-bold">Washington State Expansion</h1>
          <p
</> className="text-gray-600">TerraFusionAssessor-1 Washington County Implementation Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-blue-100 text-blue-800"><>

            <MapPin className="h-4 w-4 mr-1" />
            Washington Phase 1
          </Badge>
          <Button
</>>
            <Calendar className="h-4 w-4 mr-2" />
            Implementation Calendar
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">{totalMetrics.totalCounties}</div>
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

                <div className="text-2xl font-bold">{(totalMetrics.totalParcels / 1000).toFixed(1)}K</div>
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

                <div className="text-2xl font-bold">${(totalMetrics.totalAssessedValue / 1000000000).toFixed(1)}B</div>
                <div
</> className="text-sm text-gray-600">Assessed Value</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">${(totalMetrics.totalContractValue / 1000000).toFixed(2)}M</div>
                <div
</> className="text-sm text-gray-600">Contract Value</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-red-600" />
              <div className="text-right"><>

                <div className="text-2xl font-bold">${(totalMetrics.totalAnnualRevenue / 1000000).toFixed(2)}M</div>
                <div
</> className="text-sm text-gray-600">Annual Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Timeline */}
      <Card>
        <CardHeader><>

          <CardTitle>Implementation Timeline</CardTitle>
          <CardDescription
</>>Washington counties go-live schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative"><>

            <div className="absolute top-0 bottom-0 left-[7.5%] w-0.5 bg-gray-200"></div>

            <div
</> className="space-y-8 relative">
              {/* January */}
              <div className="flex"><>

                <div className="flex-none w-[15%] pt-1 font-medium">January 2025</div>
                <div
</> className="flex-grow pl-8 relative"><>

                  <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-blue-600"></div>
                  <div
</> className="border rounded-lg p-3"><>

                    <div className="font-medium">Benton County Go-Live (Jan 15)</div>
                    <div
</> className="text-sm text-gray-600">First production deployment</div>
                  </div>
                  <div className="mt-4 border rounded-lg p-3"><>

                    <div className="font-medium">Walla Walla County Contract Signed (Jan 15)</div>
                    <div
</> className="text-sm text-gray-600">Implementation kickoff scheduled for Jan 22</div>
                  </div>
                </div>
              </div>

              {/* February */}
              <div className="flex"><>

                <div className="flex-none w-[15%] pt-1 font-medium">February 2025</div>
                <div
</> className="flex-grow pl-8 relative"><>

                  <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-blue-600"></div>
                  <div
</> className="border rounded-lg p-3"><>

                    <div className="font-medium">Asotin County Contract Signing (Feb 1)</div>
                    <div
</> className="text-sm text-gray-600">Small county implementation begins</div>
                  </div>
                  <div className="mt-4 border rounded-lg p-3"><>

                    <div className="font-medium">Klickitat County Contract Signing (Feb 15)</div>
                    <div
</> className="text-sm text-gray-600">Renewable energy specialization focus</div>
                  </div>
                </div>
              </div>

              {/* March */}
              <div className="flex"><>

                <div className="flex-none w-[15%] pt-1 font-medium">March 2025</div>
                <div
</> className="flex-grow pl-8 relative"><>

                  <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-green-600"></div>
                  <div
</> className="border rounded-lg p-3 border-green-200 bg-green-50"><>

                    <div className="font-medium">Yakima County Go-Live (Mar 1)</div>
                    <div
</> className="text-sm text-gray-600">Second county production deployment</div>
                  </div>
                  <div className="mt-4 border rounded-lg p-3"><>

                    <div className="font-medium">Grant & Cowlitz Counties Contract Signing</div>
                    <div
</> className="text-sm text-gray-600">Implementation begins for both counties</div>
                  </div>
                </div>
              </div>

              {/* April */}
              <div className="flex"><>

                <div className="flex-none w-[15%] pt-1 font-medium">April 2025</div>
                <div
</> className="flex-grow pl-8 relative"><>

                  <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-green-600"></div>
                  <div
</> className="border rounded-lg p-3 border-green-200 bg-green-50"><>

                    <div className="font-medium">Walla Walla County Go-Live (Apr 15)</div>
                    <div
</> className="text-sm text-gray-600">Wine country implementation complete</div>
                  </div>
                  <div className="mt-4 border rounded-lg p-3"><>

                    <div className="font-medium">San Juan & Island Counties Contract Signing</div>
                    <div
</> className="text-sm text-gray-600">Island county implementations begin</div>
                  </div>
                </div>
              </div>

              {/* May */}
              <div className="flex"><>

                <div className="flex-none w-[15%] pt-1 font-medium">May 2025</div>
                <div
</> className="flex-grow pl-8 relative"><>

                  <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-green-600"></div>
                  <div
</> className="border rounded-lg p-3 border-green-200 bg-green-50"><>

                    <div className="font-medium">Asotin County Go-Live (May 1)</div>
                    <div
</> className="text-sm text-gray-600">Small county implementation complete</div>
                  </div>
                  <div className="mt-4 border rounded-lg p-3 border-green-200 bg-green-50"><>

                    <div className="font-medium">Klickitat County Go-Live (May 15)</div>
                    <div
</> className="text-sm text-gray-600">Renewable energy implementation complete</div>
                  </div>
                </div>
              </div>

              {/* June */}
              <div className="flex"><>

                <div className="flex-none w-[15%] pt-1 font-medium">June 2025</div>
                <div
</> className="flex-grow pl-8 relative"><>

                  <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-green-600"></div>
                  <div
</> className="border rounded-lg p-3 border-green-200 bg-green-50"><>

                    <div className="font-medium">Grant County Go-Live (Jun 1)</div>
                    <div
</> className="text-sm text-gray-600">Agricultural implementation complete</div>
                  </div>
                  <div className="mt-4 border rounded-lg p-3 border-green-200 bg-green-50"><>

                    <div className="font-medium">Cowlitz County Go-Live (Jun 15)</div>
                    <div
</> className="text-sm text-gray-600">Industrial/timber implementation complete</div>
                  </div>
                </div>
              </div>

              {/* July */}
              <div className="flex"><>

                <div className="flex-none w-[15%] pt-1 font-medium">July 2025</div>
                <div
</> className="flex-grow pl-8 relative"><>

                  <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-green-600"></div>
                  <div
</> className="border rounded-lg p-3 border-green-200 bg-green-50"><>

                    <div className="font-medium">San Juan County Go-Live (Jul 1)</div>
                    <div
</> className="text-sm text-gray-600">Island properties implementation complete</div>
                  </div>
                  <div className="mt-4 border rounded-lg p-3 border-green-200 bg-green-50"><>

                    <div className="font-medium">Island County Go-Live (Jul 15)</div>
                    <div
</> className="text-sm text-gray-600">Phase 1 Washington expansion complete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* County Status Table */}
      <Card>
        <CardHeader><>

          <CardTitle>County Implementation Status</CardTitle>
          <CardDescription
</>>Current status of all Washington counties</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow><>

                <TableHead>County</TableHead>
                <TableHead
</>>Status</TableHead><>

                <TableHead>Progress</TableHead>
                <TableHead
</>>Parcels</TableHead><>

                <TableHead>Go-Live Date</TableHead>
                <TableHead
</>>Next Milestone</TableHead>
                <TableHead>Contract Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {counties.map((county) => (
                <TableRow key={county.id}><>

                  <TableCell className="font-medium">{county.name}</TableCell>
                  <TableCell
</>>
                    <Badge className={getStatusColor(county.status)}>
                      {getStatusIcon(county.status)}
                      <span className="ml-1">{getStatusText(county.status)}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={county.progress} className="w-24" />
                      <span className="text-sm">{county.progress}%</span>
                    </div>
                  </TableCell><>

                  <TableCell>{county.parcels.toLocaleString()}</TableCell>
                  <TableCell
</>>{county.goLiveDate}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {county.nextMilestone.name}
                      <div className="text-xs text-gray-500">{county.nextMilestone.date}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(county.contractValue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Tabs defaultValue="resources" className="w-full">
        <TabsList className="grid w-full grid-cols-3"><>

          <TabsTrigger value="resources">Resource Allocation</TabsTrigger>
          <TabsTrigger
</> value="risks">Implementation Risks</TabsTrigger>
          <TabsTrigger value="financials">Financial Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Resource Allocation</CardTitle>
              <CardDescription
</>>Team allocation across Washington counties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div><>

                  <h4 className="font-semibold mb-3">Project Management Team</h4>
                  <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4"><>

                      <div className="font-medium">Jessica Martinez</div>
                      <div
</> className="text-sm text-gray-600">Senior Project Manager</div>
                      <div className="mt-2 text-sm"><>

                        <div>Primary: Yakima, Walla Walla Counties</div>
                        <div
</>>Secondary: Asotin, Klickitat Counties</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4"><>

                      <div className="font-medium">Michael Brown</div>
                      <div
</> className="text-sm text-gray-600">Senior Project Manager</div>
                      <div className="mt-2 text-sm"><>

                        <div>Primary: Grant, Cowlitz Counties</div>
                        <div
</>>Secondary: San Juan, Island Counties</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div><>

                  <h4 className="font-semibold mb-3">Technical Implementation Team</h4>
                  <div
</> className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4"><>

                      <div className="font-medium">David Chen</div>
                      <div
</> className="text-sm text-gray-600">Data Migration Specialist</div>
                      <div className="mt-2 text-sm"><>

                        <div>Current: Yakima County</div>
                        <div
</>>Next: Walla Walla County</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4"><>

                      <div className="font-medium">Alex Thompson</div>
                      <div
</> className="text-sm text-gray-600">Data Migration Specialist</div>
                      <div className="mt-2 text-sm"><>

                        <div>Current: Walla Walla County</div>
                        <div
</>>Next: Asotin County</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4"><>

                      <div className="font-medium">Samantha Wilson</div>
                      <div
</> className="text-sm text-gray-600">Configuration Specialist</div>
                      <div className="mt-2 text-sm"><>

                        <div>Current: Yakima County</div>
                        <div
</>>Next: Walla Walla County</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div><>

                  <h4 className="font-semibold mb-3">Training & Support Team</h4>
                  <div
</> className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4"><>

                      <div className="font-medium">Robert Johnson</div>
                      <div
</> className="text-sm text-gray-600">Lead Trainer</div>
                      <div className="mt-2 text-sm"><>

                        <div>Current: Yakima County</div>
                        <div
</>>Next: Walla Walla County</div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 border-yellow-100 bg-yellow-50"><>

                      <div className="font-medium">OPEN POSITION</div>
                      <div
</> className="text-sm text-yellow-600">Support Specialist</div>
                      <div className="mt-2 text-sm"><>

                        <div>Needed by: February 15, 2025</div>
                        <div
</>>For: Asotin & Klickitat Counties</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Implementation Risks & Mitigations</CardTitle>
              <CardDescription
</>>Key risks and mitigation strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 border-red-100 bg-red-50">
                  <div className="flex justify-between"><>

                    <div className="font-medium">Resource Constraints</div>
                    <Badge
</> className="bg-red-100 text-red-800">HIGH</Badge>
                  </div><>

                  <div className="text-sm mt-1">
                    Parallel implementation of 8 counties will strain existing staff resources.
                  </div>
                  <div
</> className="mt-2"><>

                    <div className="text-sm font-medium">Mitigation:</div>
                    <div
</> className="text-sm">
                      • Immediate hiring of 5 additional implementation specialists
                      <br />
                      • Staggered implementation schedule to balance workload
                      <br />• Cross-training existing staff for multiple roles
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 border-yellow-100 bg-yellow-50">
                  <div className="flex justify-between"><>

                    <div className="font-medium">Data Migration Complexity</div>
                    <Badge
</> className="bg-yellow-100 text-yellow-800">MEDIUM</Badge>
                  </div>
                  <div className="text-sm mt-1">
                    Each county has unique legacy systems with varying data quality and formats.
                  </div>\
                </div>
