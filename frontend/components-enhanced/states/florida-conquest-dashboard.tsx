"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const floridaMetrics = [
  { label: "Total Counties", value: "67", subtext: "15+ Priority Targets" },
  { label: "Market Value", value: "$2.1T", subtext: "Property Portfolio" },
  { label: "Total Parcels", value: "5.8M", subtext: "Statewide Coverage" },
  { label: "GIS Readiness", value: "94%", subtext: "Integration Ready" },
  { label: "Migration Time", value: "48hrs", subtext: "Hurricane Speed" },
  { label: "Annual Savings", value: "$156M", subtext: "Combined Counties" },
]

const priorityRegions = [
  {
    name: "South Florida Powerhouse",
    counties: ["Miami-Dade", "Broward", "Palm Beach"],
    population: "5.2M",
    value: "$1.3T",
    status: "CRITICAL",
    readiness: 96,
  },
  {
    name: "Central Florida Tourism",
    counties: ["Orange", "Hillsborough", "Pinellas"],
    population: "3.9M",
    value: "$725B",
    status: "READY",
    readiness: 93,
  },
  {
    name: "Growth Corridor",
    counties: ["Lee", "Polk", "Brevard"],
    population: "2.1M",
    value: "$305B",
    status: "HIGH-GROWTH",
    readiness: 91,
  },
]

export function FloridaConquestDashboard() {
  const [selectedRegion, setSelectedRegion] = useState(0)

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {floridaMetrics.map((metric /* , index */) => (
          <Card
            key={index}
            className="bg-dark-blue/20 border-primary/30 hover:border-transcend/50 transition-all duration-300 hover:scale-105"
          >
            <CardContent className="p-4 text-center"><>

              <div className="text-2xl font-black text-transcend mb-1">{metric.value}</div>
              <div
</> className="text-sm text-primary font-medium mb-1">{metric.label}</div>
              <div className="text-xs text-accent">{metric.subtext}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Regional Strategy */}
      <Card className="bg-dark-blue/20 border-transcend/30 mb-8">
        <CardHeader>
          <CardTitle className="text-2xl text-transcend font-bold">🌴 FLORIDA REGIONAL CONQUEST STRATEGY</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {priorityRegions.map((region /* , index */) => (
              <Card
                key={index}
                className={`cursor-pointer transition-all duration-300 ${
                  selectedRegion === index
                    ? "bg-transcend/20 border-transcend scale-105"
                    : "bg-primary/10 border-primary/30 hover:border-transcend/50"
                }`}
                onClick={() => setSelectedRegion(index)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3"><>

                    <h3 className="font-bold text-white">{region.name}</h3>
                    <Badge
</>
                      variant={
                        region.status === "CRITICAL"
                          ? "destructive"
                          : region.status === "READY"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {region.status}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm"><>

                    <div className="text-transcend">Population: {region.population}</div>
                    <div
</> className="text-accent">Property Value: {region.value}</div><>

                    <div className="text-primary">Readiness: {region.readiness}%</div>
                    <div
</> className="text-xs text-gray-300">Counties: {region.counties.join(", ")}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Hurricane Preparedness Feature */}
          <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-orange-500/30">
            <CardContent className="p-6"><>

              <h3 className="text-xl font-bold text-orange-400 mb-4">🌪️ HURRICANE RESILIENCE ADVANTAGE</h3>
              <div
</> className="grid md:grid-cols-3 gap-4">
                <div className="text-center"><>

                  <div className="text-2xl font-bold text-transcend">75%</div>
                  <div
</> className="text-sm text-orange-300">Faster Response Time</div>
                </div>
                <div className="text-center"><>

                  <div className="text-2xl font-bold text-transcend">90%</div>
                  <div
</> className="text-sm text-orange-300">Insurance Processing Speed</div>
                </div>
                <div className="text-center"><>

                  <div className="text-2xl font-bold text-transcend">24hrs</div>
                  <div
</> className="text-sm text-orange-300">Damage Assessment</div>
                </div>
              </div>
              <p className="text-orange-200 text-sm mt-4 text-center italic">
                "When the next hurricane hits, Florida will be ready with Terrafusion"
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Action Panel */}
      <Card className="bg-gradient-to-r from-transcend/20 to-accent/20 border-transcend">
        <CardContent className="p-8 text-center"><>

          <h2 className="text-2xl font-bold text-transcend mb-4">INITIATE FLORIDA CONQUEST</h2>
          <div
</> className="flex flex-wrap gap-4 justify-center"><>

            <Button className="bg-gradient-to-r from-primary to-transcend hover:scale-105 transition-transform">
              LAUNCH SOUTH FLORIDA BLITZ
            </Button>
            <Button
</> variant="outline" className="border-transcend text-transcend hover:bg-transcend/20 bg-transparent">
              ACTIVATE HURRICANE MODE
            </Button>
            <Button variant="outline" className="border-accent text-accent hover:bg-accent/20 bg-transparent">
              TOURISM OPTIMIZATION
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
