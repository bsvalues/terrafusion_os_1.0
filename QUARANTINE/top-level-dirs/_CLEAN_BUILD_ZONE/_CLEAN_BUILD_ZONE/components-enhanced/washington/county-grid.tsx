"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const counties = [
  {
    name: "King County",
    population: "2,269,675",
    parcels: "750,000+",
    budget: "$7.2B",
    system: "Enterprise GIS",
    integrationScore: 98,
    priority: "CRITICAL",
    message: "Seattle-Grade Innovation",
    hook: "Where Microsoft and Amazon transformed business, Terrafusion transforms government",
    savings: "$15M+",
    timeline: "6 months to 1 week",
    color: "from-red-500 to-red-600",
  },
  {
    name: "Pierce County",
    population: "927,380",
    parcels: "385,000+",
    budget: "$2.1B",
    system: "ArcGIS REST API",
    integrationScore: 95,
    priority: "HIGH",
    message: "Tacoma Transcendence",
    hook: "From Mount Rainier to Puget Sound, modernize every parcel",
    savings: "$4.8M",
    timeline: "72-hour transition",
    color: "from-primary to-transcend",
  },
  {
    name: "Snohomish County",
    population: "827,957",
    parcels: "320,000+",
    budget: "$1.8B",
    system: "GIS Open Data",
    integrationScore: 94,
    priority: "HIGH",
    message: "Boeing-Speed Efficiency",
    hook: "Aerospace precision for government operations",
    savings: "$3.2M",
    timeline: "Weekend deployment",
    color: "from-primary to-transcend",
  },
  {
    name: "Clark County",
    population: "503,311",
    parcels: "195,000+",
    budget: "$680M",
    system: "ArcGIS Hub",
    integrationScore: 96,
    priority: "HIGH",
    message: "Bridge to Innovation",
    hook: "No state income tax, no government inefficiency",
    savings: "$1.8M",
    timeline: "48-hour migration",
    color: "from-primary to-transcend",
  },
  {
    name: "Yakima County",
    population: "256,728",
    parcels: "115,000+",
    budget: "$320M",
    system: "ArcGIS Open Data",
    integrationScore: 92,
    priority: "HIGH",
    message: "From Farms to Future",
    hook: "Managing agricultural and urban parcels with equal precision",
    savings: "$850K",
    timeline: "1 week",
    color: "from-primary to-transcend",
  },
  {
    name: "Whatcom County",
    population: "226,847",
    parcels: "105,000+",
    budget: "$285M",
    system: "Traditional GIS",
    integrationScore: 82,
    priority: "HIGH",
    message: "Northern Excellence",
    hook: "From Bellingham to the border, unified efficiency",
    savings: "$720K",
    timeline: "90 days phased",
    color: "from-primary to-transcend",
  },
  {
    name: "Cowlitz County",
    population: "110,730",
    parcels: "68,000+",
    budget: "$180M",
    system: "Custom REST",
    integrationScore: 88,
    priority: "MEDIUM",
    message: "Right-Sized Revolution",
    hook: "Big county capabilities, tailored for Cowlitz",
    savings: "$380K",
    timeline: "48-hour migration",
    color: "from-accent to-green-500",
  },
  {
    name: "Grant County",
    population: "99,123",
    parcels: "58,000+",
    budget: "$125M",
    system: "ArcGIS Open Data",
    integrationScore: 87,
    priority: "MEDIUM",
    message: "Data Center of Agriculture",
    hook: "Where data centers meet farmland, efficiency grows",
    savings: "$320K",
    timeline: "Weekend deployment",
    color: "from-accent to-green-500",
  },
  {
    name: "Island County",
    population: "86,857",
    parcels: "45,000+",
    budget: "$98M",
    system: "ArcGIS Open Data",
    integrationScore: 90,
    priority: "MEDIUM",
    message: "Connected Islands",
    hook: "Whidbey to Camano, unified and efficient",
    savings: "$280K",
    timeline: "Weekend deployment",
    color: "from-accent to-green-500",
  },
  {
    name: "Franklin County",
    population: "96,749",
    parcels: "42,000+",
    budget: "$115M",
    system: "ArcGIS Online",
    integrationScore: 91,
    priority: "MEDIUM",
    message: "Tri-Cities Transformation",
    hook: "Pasco progress, powered by Terrafusion",
    savings: "$290K",
    timeline: "Cloud-to-cloud",
    color: "from-accent to-green-500",
  },
  {
    name: "Stevens County",
    population: "46,445",
    parcels: "35,000+",
    budget: "$45M",
    system: "Traditional GIS",
    integrationScore: 72,
    priority: "LOW",
    message: "Small County, Big Impact",
    hook: "Zero IT team needed, infinite capability",
    savings: "$180K",
    timeline: "Turnkey solution",
    color: "from-yellow-500 to-orange-500",
  },
  {
    name: "San Juan County",
    population: "17,788",
    parcels: "18,000+",
    budget: "$38M",
    system: "Parcel Search Only",
    integrationScore: 68,
    priority: "LOW",
    message: "Island Time to Real-Time",
    hook: "From Friday Harbor to Lopez, instant access",
    savings: "$150K",
    timeline: "Complete replacement",
    color: "from-yellow-500 to-orange-500",
  },
]

export function CountyGrid() {
  const [filter, setFilter] = useState("all")
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null)

  const filteredCounties = counties.filter((county) => {
    if (filter === "all") return true
    if (filter === "critical") return county.priority === "CRITICAL"
    if (filter === "high") return county.priority === "HIGH"
    if (filter === "ready") return county.integrationScore >= 90
    if (filter === "arcgis") return county.system.includes("ArcGIS")
    return true
  })

  const handleMigration = (countyName: string) => {
    console.log(`Initiating Terrafusion migration for ${countyName}`)
    // Migration logic would go here
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          {[
            { key: "all", label: "All Counties" },
            { key: "critical", label: "Critical" },
            { key: "high", label: "High Priority" },
            { key: "ready", label: "Migration Ready" },
            { key: "arcgis", label: "ArcGIS Systems" },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              onClick={() => setFilter(key)}
              className={
                filter === key
                  ? "bg-gradient-to-r from-primary to-transcend"
                  : "border-transcend/30 text-transcend hover:bg-transcend/10"
              }
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCounties.map((county /* , index */) => (
            <div
              key={index}
              className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-transcend/30 transition-all duration-300 hover:transform hover:-translate-y-2"
            >
              <div className="flex justify-between items-start mb-4"><>

                <h3 className="text-xl font-bold text-white">{county.name}</h3>
                <Badge
</>
className={`bg-gradient-to-r ${county.color} text-white`}>{county.priority}</Badge>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between"><>

                  <span className="text-white/60">Population</span>
                  <span
</>
className="text-white">{county.population}</span>
                </div>
                <div className="flex justify-between"><>

                  <span className="text-white/60">Parcels</span>
                  <span
</>
className="text-white">{county.parcels}</span>
                </div>
                <div className="flex justify-between"><>

                  <span className="text-white/60">Budget</span>
                  <span
</>
className="text-white">{county.budget}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2"><>

                  <span className="text-sm text-white/60">Integration Score</span>
                  <span
</>
className="text-sm font-semibold text-transcend">{county.integrationScore}%</span>
                </div><>

                <Progress value={county.integrationScore} className="h-2" />
              </div>

              <div
</>
className="bg-black/30 rounded-lg p-3 mb-4"><>

                <div className="text-sm font-semibold text-transcend mb-1">{county.message}</div>
                <div
</>
className="text-xs text-white/70 italic">"{county.hook}"</div>
              </div>

              <div className="flex justify-between text-xs text-white/60 mb-4"><>

                <span>Savings: {county.savings}</span>
                <span
</>
</>>Timeline: {county.timeline}</span>
              </div>

              <div className="flex gap-2"><>

                <Button
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-primary to-transcend hover:from-primary/80 hover:to-transcend/80"
                  onClick={() => handleMigration(county.name)}
                >
                  Start Migration
                </Button>
                <Button
</>

                  size="sm"
                  variant="outline"
                  className="border-transcend/30 text-transcend hover:bg-transcend/10 bg-transparent"
                  onClick={() => setSelectedCounty(county.name)}
                >
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
