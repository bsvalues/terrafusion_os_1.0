"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const floridaCounties = [
  {
    name: "Miami-Dade County",
    population: "2.7M",
    parcels: "950K+",
    propertyValue: "$520B",
    system: "ArcGIS Open Data Hub",
    readiness: 96,
    revenue: "$12.4M/yr",
    tier: "TIER 1",
    specialties: ["International Gateway", "Hurricane Hub", "Bilingual"],
  },
  {
    name: "Broward County",
    population: "2.0M",
    parcels: "685K+",
    propertyValue: "$385B",
    system: "GeoHub",
    readiness: 94,
    revenue: "$9.2M/yr",
    tier: "TIER 1",
    specialties: ["Port Everglades", "Cruise Capital", "Aviation"],
  },
  {
    name: "Palm Beach County",
    population: "1.5M",
    parcels: "625K+",
    propertyValue: "$410B",
    system: "Open Data Portal",
    readiness: 95,
    revenue: "$8.8M/yr",
    tier: "TIER 1",
    specialties: ["Ultra-Luxury", "Golf Courses", "Equestrian"],
  },
  {
    name: "Orange County",
    population: "1.4M",
    parcels: "485K+",
    propertyValue: "$285B",
    system: "OCGIS Data Hub",
    readiness: 93,
    revenue: "$7.1M/yr",
    tier: "TIER 2",
    specialties: ["Theme Parks", "Tourism", "Convention Center"],
  },
  {
    name: "Hillsborough County",
    population: "1.5M",
    parcels: "520K+",
    propertyValue: "$275B",
    system: "EPC GIS",
    readiness: 88,
    revenue: "$6.8M/yr",
    tier: "TIER 2",
    specialties: ["Tampa Bay", "Sports Complex", "Tech Corridor"],
  },
  {
    name: "Pinellas County",
    population: "975K",
    parcels: "435K+",
    propertyValue: "$165B",
    system: "Enterprise GIS",
    readiness: 97,
    revenue: "$4.2M/yr",
    tier: "TIER 2",
    specialties: ["Beach Communities", "Dense Urban", "Arts District"],
  },
]

export function FloridaCountyGrid() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-8"><>

        <h2 className="text-3xl font-bold text-transcend mb-4">PRIORITY COUNTY TARGETS</h2>
        <p
</> className="text-primary">Strategic conquest sequence for maximum impact</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {floridaCounties.map((county /* , index */) => (
          <Card
            key={index}
            className="bg-dark-blue/20 border-primary/30 hover:border-transcend/50 transition-all duration-300 hover:scale-105"
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4"><>

                <h3 className="font-bold text-white text-lg">{county.name}</h3>
                <Badge
</> variant={county.tier === "TIER 1" ? "destructive" : "default"}>{county.tier}</Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between"><>

                  <span className="text-gray-300">Population:</span>
                  <span
</> className="text-transcend font-semibold">{county.population}</span>
                </div>
                <div className="flex justify-between"><>

                  <span className="text-gray-300">Parcels:</span>
                  <span
</> className="text-transcend font-semibold">{county.parcels}</span>
                </div>
                <div className="flex justify-between"><>

                  <span className="text-gray-300">Property Value:</span>
                  <span
</> className="text-accent font-semibold">{county.propertyValue}</span>
                </div>
                <div className="flex justify-between"><>

                  <span className="text-gray-300">Current System:</span>
                  <span
</> className="text-primary text-sm">{county.system}</span>
                </div>
                <div className="flex justify-between"><>

                  <span className="text-gray-300">Readiness:</span>
                  <span
</> className="text-transcend font-bold">{county.readiness}%</span>
                </div>
              </div>

              <div className="border-t border-primary/30 pt-4">
                <div className="text-center mb-3"><>

                  <div className="text-2xl font-black text-accent">{county.revenue}</div>
                  <div
</> className="text-xs text-gray-400">Annual Revenue</div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {county.specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs border-transcend/50 text-transcend">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Florida Unique Features */}
      <Card className="mt-12 bg-gradient-to-r from-blue-500/10 to-green-500/10 border-blue-500/30">
        <CardContent className="p-8"><>

          <h3 className="text-2xl font-bold text-blue-400 mb-6 text-center">🏝️ FLORIDA-SPECIFIC ADVANTAGES</h3>
          <div
</> className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center"><>

              <div className="text-4xl mb-2">🌪️</div>
              <div
</> className="font-bold text-transcend">Hurricane Ready</div>
              <div className="text-sm text-blue-300">Real-time damage assessment</div>
            </div>
            <div className="text-center"><>

              <div className="text-4xl mb-2">🏖️</div>
              <div
</> className="font-bold text-transcend">Tourism Properties</div>
              <div className="text-sm text-blue-300">Short-term rental tracking</div>
            </div>
            <div className="text-center"><>

              <div className="text-4xl mb-2">🏌️</div>
              <div
</> className="font-bold text-transcend">Retirement Communities</div>
              <div className="text-sm text-blue-300">Age-restricted properties</div>
            </div>
            <div className="text-center"><>

              <div className="text-4xl mb-2">🌊</div>
              <div
</> className="font-bold text-transcend">Sea Level Rise</div>
              <div className="text-sm text-blue-300">Environmental modeling</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
