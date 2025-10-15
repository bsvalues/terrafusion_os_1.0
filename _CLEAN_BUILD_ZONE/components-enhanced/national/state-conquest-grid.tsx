"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function StateConquestGrid() {
  const stateTargets = [
    {
      name: "California",
      emoji: "🌴",
      status: "NEXT TARGET",
      priority: "HIGH",
      counties: ["Los Angeles", "San Diego", "Orange"],
      population: "39.5M",
      revenue: "$26M ARR",
      timeline: "Q2 2025",
      color: "from-yellow-500 to-orange-500",
      borderColor: "border-yellow-500/30",
    },
    {
      name: "Texas",
      emoji: "🤠",
      status: "SCOUTING",
      priority: "HIGH",
      counties: ["Harris", "Dallas", "Bexar"],
      population: "30.0M",
      revenue: "$18M ARR",
      timeline: "Q3 2025",
      color: "from-red-500 to-orange-500",
      borderColor: "border-red-500/30",
    },
    {
      name: "New York",
      emoji: "🗽",
      status: "RESEARCH",
      priority: "MEDIUM",
      counties: ["NYC Boroughs", "Nassau", "Suffolk"],
      population: "19.5M",
      revenue: "$32M ARR",
      timeline: "Q4 2025",
      color: "from-blue-500 to-purple-500",
      borderColor: "border-blue-500/30",
    },
    {
      name: "Illinois",
      emoji: "🏙️",
      status: "IDENTIFIED",
      priority: "MEDIUM",
      counties: ["Cook", "DuPage", "Lake"],
      population: "12.6M",
      revenue: "$19M ARR",
      timeline: "Q1 2026",
      color: "from-purple-500 to-pink-500",
      borderColor: "border-purple-500/30",
    },
    {
      name: "Georgia",
      emoji: "🍑",
      status: "MONITORING",
      priority: "MEDIUM",
      counties: ["Fulton", "DeKalb", "Gwinnett"],
      population: "10.8M",
      revenue: "$16M ARR",
      timeline: "Q2 2026",
      color: "from-green-500 to-teal-500",
      borderColor: "border-green-500/30",
    },
    {
      name: "Arizona",
      emoji: "🌵",
      status: "FUTURE",
      priority: "LOW",
      counties: ["Maricopa", "Pima"],
      population: "7.4M",
      revenue: "$12M ARR",
      timeline: "Q3 2026",
      color: "from-orange-500 to-red-500",
      borderColor: "border-orange-500/30",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "LOW":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16"><>

          <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 px-6 py-2 text-lg">
            🎯 STATE CONQUEST TARGETS
          </Badge>
          <h2
</>
className="text-5xl font-black mb-6 bg-gradient-to-r from-accent via-transcend to-primary bg-clip-text text-transparent">
            NEXT BATTLEGROUNDS
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Strategic targets for national expansion. Each state represents millions of citizens and billions in
            property value.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stateTargets.map((state /* , index */) => (
            <Card
              key={state.name}
              className={`bg-black/60 backdrop-blur-xl ${state.borderColor} border-2 hover:scale-105 transition-all duration-300 group`}
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3"><>

                    <span className="text-4xl">{state.emoji}</span>
                    <div
</>
</>><>

                      <CardTitle className="text-2xl font-black text-white">{state.name}</CardTitle>
                      <Badge
</>
className={getPriorityColor(state.priority)}>{state.priority} PRIORITY</Badge>
                    </div>
                  </div>
                  <Badge className={`bg-gradient-to-r ${state.color} text-black font-bold`}>{state.status}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-black/40 rounded-lg"><>

                    <div className={`text-xl font-black bg-gradient-to-r ${state.color} bg-clip-text text-transparent`}>
                      {state.population}
                    </div>
                    <div
</>
className="text-xs text-white/60">Population</div>
                  </div>
                  <div className="text-center p-3 bg-black/40 rounded-lg"><>

                    <div className={`text-xl font-black bg-gradient-to-r ${state.color} bg-clip-text text-transparent`}>
                      {state.revenue}
                    </div>
                    <div
</>
className="text-xs text-white/60">Revenue</div>
                  </div>
                </div>

                {/* Target Counties */}
                <div><>

                  <h4 className="text-sm font-bold text-white/80 uppercase tracking-wide mb-3">Target Counties:</h4>
                  <div
</>
className="space-y-2">
                    {state.counties.map((county, countyIndex) => (
                      <div
                        key={countyIndex}
                        className="text-sm text-white/70 bg-black/30 rounded px-3 py-2 flex justify-between items-center"
                      ><>

                        <span>{county}</span>
                        <span
</>
className="text-xs text-white/50">County</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="text-center p-4 bg-gradient-to-r from-black/60 to-black/40 rounded-lg border border-white/10"><>

                  <div className="text-sm text-white/60 mb-1">Target Timeline</div>
                  <div
</>
className={`text-lg font-bold bg-gradient-to-r ${state.color} bg-clip-text text-transparent`}>
                    {state.timeline}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className={`w-full bg-gradient-to-r ${state.color} hover:opacity-80 text-black font-bold transition-all duration-300 group-hover:scale-105`}
                  disabled={state.status === "FUTURE" || state.status === "MONITORING"}
                >
                  {state.status === "NEXT TARGET"
                    ? "🚀 Begin Conquest"
                    : state.status === "SCOUTING"
                      ? "🔍 View Intel"
                      : state.status === "RESEARCH"
                        ? "📊 Research Data"
                        : state.status === "IDENTIFIED"
                          ? "📋 Review Plan"
                          : "⏳ Coming Soon"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Battle Strategy Summary */}
        <div className="mt-16 p-8 bg-gradient-to-r from-primary/10 via-accent/10 to-transcend/10 rounded-2xl border border-transcend/20"><>

          <h3 className="text-3xl font-black text-center mb-8 text-transcend">The Conquest Strategy</h3>
          <div
</>
className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-black/40 rounded-xl"><>

              <div className="text-4xl mb-4">🎯</div>
              <h4
</>
className="text-xl font-bold text-primary mb-2">Target Selection</h4>
              <p className="text-white/70">
                High-population counties with modern GIS systems and tech-forward leadership
              </p>
            </div>
            <div className="p-6 bg-black/40 rounded-xl"><>

              <div className="text-4xl mb-4">⚡</div>
              <h4
</>
className="text-xl font-bold text-accent mb-2">Rapid Deployment</h4>
              <p className="text-white/70">48-72 hour migrations with zero downtime and complete staff training</p>
            </div>
            <div className="p-6 bg-black/40 rounded-xl"><>

              <div className="text-4xl mb-4">🏆</div>
              <h4
</>
className="text-xl font-bold text-transcend mb-2">Proven Success</h4>
              <p className="text-white/70">379,000,000× performance improvement with guaranteed ROI</p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/national/command-center">
              <Button className="bg-gradient-to-r from-transcend to-accent hover:from-transcend/80 hover:to-accent/80 text-black font-bold px-8 py-4 text-lg transcend-glow">
                🎮 Access Command Center
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
