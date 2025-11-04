"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, DollarSign, TrendingUp, Target, Building2, Calendar, Award  } from '@mui/icons-material'

export default function WestCoastExpansionDashboard() {
  const californiaTargets = [
    {
      name: "Riverside County",
      tier: "Tier 1 - Mega",
      population: 2418185,
      parcels: 890000,
      contractValue: 2500000,
      probability: 75,
      status: "planning",
      targetDate: "Jan 2026",
    },
    {
      name: "Fresno County",
      tier: "Tier 1 - Large",
      population: 1008654,
      parcels: 425000,
      contractValue: 1800000,
      probability: 80,
      status: "planning",
      targetDate: "Feb 2026",
    },
    {
      name: "Kern County",
      tier: "Tier 1 - Large",
      population: 909235,
      parcels: 380000,
      contractValue: 1600000,
      probability: 85,
      status: "planning",
      targetDate: "Mar 2026",
    },
    {
      name: "Imperial County",
      tier: "Tier 2 - Medium",
      population: 179702,
      parcels: 85000,
      contractValue: 900000,
      probability: 90,
      status: "planning",
      targetDate: "Apr 2026",
    },
  ]

  const oregonTargets = [
    {
      name: "Washington County",
      tier: "Tier 1 - Large",
      population: 695000,
      parcels: 285000,
      contractValue: 1500000,
      probability: 60,
      status: "planning",
      targetDate: "Apr 2026",
    },
    {
      name: "Marion County",
      tier: "Tier 2 - Medium",
      population: 384149,
      parcels: 165000,
      contractValue: 1100000,
      probability: 75,
      status: "planning",
      targetDate: "Jun 2026",
    },
    {
      name: "Lane County",
      tier: "Tier 2 - Medium",
      population: 382067,
      parcels: 195000,
      contractValue: 1000000,
      probability: 80,
      status: "planning",
      targetDate: "Jul 2026",
    },
  ]

  const nevadaTargets = [
    {
      name: "Carson City",
      tier: "Tier 3 - Small",
      population: 58639,
      parcels: 28000,
      contractValue: 450000,
      probability: 85,
      status: "planning",
      targetDate: "Jul 2026",
    },
    {
      name: "Douglas County",
      tier: "Tier 3 - Small",
      population: 48905,
      parcels: 35000,
      contractValue: 500000,
      probability: 80,
      status: "planning",
      targetDate: "Aug 2026",
    },
  ]

  const allTargets = [...californiaTargets, ...oregonTargets, ...nevadaTargets]
  const totalContractValue = allTargets.reduce((sum, county) => sum + county.contractValue, 0)
  const weightedValue = allTargets.reduce((sum, county) => sum + (county.contractValue * county.probability) / 100, 0)

  const getTierColor = (tier: string) => {
    if (tier.includes("Tier 1")) return "bg-red-100 text-red-800"
    if (tier.includes("Tier 2")) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-100 text-blue-800"
      case "negotiating":
        return "bg-orange-100 text-orange-800"
      case "signed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4"><>

          <h1 className="text-4xl font-bold text-gray-900">🌊 TerraFusionAssessor-1: West Coast Expansion</h1>
          <p
</> className="text-xl text-gray-600">Phase 2 - California, Oregon & Nevada Market Domination</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium">Target Counties</CardTitle>
              <MapPin
</> className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold">{allTargets.length}</div>
              <p
</> className="text-xs text-muted-foreground">Across 3 states</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium">Total Contract Value</CardTitle>
              <DollarSign
</> className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold">${(totalContractValue / 1000000).toFixed(1)}M</div>
              <p
</> className="text-xs text-muted-foreground">Maximum potential</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium">Weighted Value</CardTitle>
              <TrendingUp
</> className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold">${(weightedValue / 1000000).toFixed(1)}M</div>
              <p
</> className="text-xs text-muted-foreground">Probability adjusted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium">Avg Win Rate</CardTitle>
              <Target
</> className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold">
                {Math.round(allTargets.reduce((sum, county) => sum + county.probability, 0) / allTargets.length)}%
              </div>
              <p
</> className="text-xs text-muted-foreground">Across all targets</p>
            </CardContent>
          </Card>
        </div>

        {/* State Tabs */}
        <Tabs defaultValue="california" className="w-full">
          <TabsList className="grid w-full grid-cols-4"><>

            <TabsTrigger value="california">🏛️ California</TabsTrigger>
            <TabsTrigger
</> value="oregon">🌲 Oregon</TabsTrigger><>

            <TabsTrigger value="nevada">🎰 Nevada</TabsTrigger>
            <TabsTrigger
</> value="timeline">📅 Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="california" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><>

                  <Building2 className="h-5 w-5" />
                  California Targets - $6.8M Total Value
                </CardTitle>
                <CardDescription
</>>4 counties targeting agricultural and high-growth markets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {californiaTargets.map((county) => (
                    <div key={county.name} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between"><>

                        <h3 className="font-semibold text-lg">{county.name}</h3>
                        <div
</> className="flex gap-2"><>

                          <Badge className={getTierColor(county.tier)}>{county.tier}</Badge>
                          <Badge
</> className={getStatusColor(county.status)}>{county.status}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><>

                          <div className="text-muted-foreground">Population</div>
                          <div
</> className="font-medium">{county.population.toLocaleString()}</div>
                        </div>
                        <div><>

                          <div className="text-muted-foreground">Parcels</div>
                          <div
</> className="font-medium">{county.parcels.toLocaleString()}</div>
                        </div>
                        <div><>

                          <div className="text-muted-foreground">Contract Value</div>
                          <div
</> className="font-medium">${(county.contractValue / 1000000).toFixed(1)}M</div>
                        </div>
                        <div><>

                          <div className="text-muted-foreground">Target Date</div>
                          <div
</> className="font-medium">{county.targetDate}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><>

                          <span>Win Probability</span>
                          <span
</>>{county.probability}%</span>
                        </div>
                        <Progress value={county.probability} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="oregon" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><>

                  <Building2 className="h-5 w-5" />
                  Oregon Targets - $3.6M Total Value
                </CardTitle>
                <CardDescription
</>>3 counties focusing on tech corridor and agricultural markets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {oregonTargets.map((county) => (
                    <div key={county.name} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between"><>

                        <h3 className="font-semibold text-lg">{county.name}</h3>
                        <div
</> className="flex gap-2"><>

                          <Badge className={getTierColor(county.tier)}>{county.tier}</Badge>
                          <Badge
</> className={getStatusColor(county.status)}>{county.status}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><>

                          <div className="text-muted-foreground">Population</div>
                          <div
</> className="font-medium">{county.population.toLocaleString()}</div>
                        </div>
                        <div><>

                          <div className="text-muted-foreground">Parcels</div>
                          <div
</> className="font-medium">{county.parcels.toLocaleString()}</div>
                        </div>
                        <div><>

                          <div className="text-muted-foreground">Contract Value</div>
                          <div
</> className="font-medium">${(county.contractValue / 1000000).toFixed(1)}M</div>
                        </div>
                        <div><>

                          <div className="text-muted-foreground">Target Date</div>
                          <div
</> className="font-medium">{county.targetDate}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><>

                          <span>Win Probability</span>
                          <span
</>>{county.probability}%</span>
                        </div>
                        <Progress value={county.probability} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nevada" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><>

                  <Building2 className="h-5 w-5" />
                  Nevada Targets - $950K Total Value
                </CardTitle>
                <CardDescription
</>>2 counties targeting gaming and luxury property markets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {nevadaTargets.map((county) => (
                    <div key={county.name} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between"><>

                        <h3 className="font-semibold text-lg">{county.name}</h3>
                        <div
</> className="flex gap-2"><>

                          <Badge className={getTierColor(county.tier)}>{county.tier}</Badge>
                          <Badge
</> className={getStatusColor(county.status)}>{county.status}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><>

                          <div className="text-muted-foreground">Population</div>
                          <div
</> className="font-medium">{county.population.toLocaleString()}</div>
                        </div>
                        <div><>

                          <div className="text-muted-foreground">Parcels</div>
                          <div
</> className="font-medium">{county.parcels.toLocaleString()}</div>
                        </div>
                        <div><>

                          <div className="text-muted-foreground">Contract Value</div>
                          <div
</> className="font-medium">${(county.contractValue / 1000000).toFixed(1)}M</div>
                        </div>
                        <div><>

                          <div className="text-muted-foreground">Target Date</div>
                          <div
</> className="font-medium">{county.targetDate}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><>

                          <span>Win Probability</span>
                          <span
</>>{county.probability}%</span>
                        </div>
                        <Progress value={county.probability} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><>

                  <Calendar className="h-5 w-5" />
                  West Coast Expansion Timeline
                </CardTitle>
                <CardDescription
</>>18-month implementation roadmap across 3 states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-4"><>

                    <h3 className="font-semibold text-blue-700">Q3 2025 - Market Entry</h3>
                    <ul
</> className="mt-2 space-y-1 text-sm text-gray-600"><>

                      <li>• Establish California sales office</li>
                            <li
</>>• Hire West Coast sales team (3 reps)</li><>

                      <li>• Begin relationship building campaigns</li>
                            <li
</>>• Attend state assessor conferences</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-4"><>

                    <h3 className="font-semibold text-orange-700">Q4 2025 - Contract Negotiations</h3>
                    <ul
</> className="mt-2 space-y-1 text-sm text-gray-600"><>

                      <li>• Riverside County RFP response</li>
                            <li
</>>• Fresno County competitive bidding</li><>

                      <li>• Carson City direct negotiation</li>
                            <li
</>>• Kern County proposal development</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4"><>

                    <h3 className="font-semibold text-green-700">Q1 2026 - Implementation Wave 1</h3>
                    <ul
</> className="mt-2 space-y-1 text-sm text-gray-600"><>

                      <li>• Riverside County project kickoff</li>
                            <li
</>>• Fresno County data migration start</li><>

                      <li>• Kern County planning phase</li>
                            <li
</>>• Imperial County contract signing</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4"><>

                    <h3 className="font-semibold text-purple-700">Q2-Q3 2026 - Full Deployment</h3>
                    <ul
</> className="mt-2 space-y-1 text-sm text-gray-600"><>

                      <li>• All 9 counties in active implementation</li>
                            <li
</>>• Regional support centers operational</li><>

                      <li>• Parallel project management</li>
                            <li
</>>• Go-live celebrations across West Coast</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Success Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              West Coast Expansion Success Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center"><>

                <div className="text-3xl font-bold text-green-600">70%+</div>
                <div
</> className="text-sm text-muted-foreground">Target Win Rate</div>
              </div>
              <div className="text-center"><>

                <div className="text-3xl font-bold text-blue-600">$8M+</div>
                <div
</> className="text-sm text-muted-foreground">New Contract Value</div>
              </div>
              <div className="text-center"><>

                <div className="text-3xl font-bold text-purple-600">340%</div>
                <div
</> className="text-sm text-muted-foreground">5-Year ROI</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
