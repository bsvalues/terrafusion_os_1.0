"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ExpansionRoadmap() {
  const roadmapPhases = [
    {
      year: "2025",
      title: "Coastal Domination",
      status: "ACTIVE",
      counties: 50,
      revenue: "$50M ARR",
      states: ["Florida ✓", "Washington ✓", "California (partial)"],
      color: "from-primary to-accent",
      borderColor: "border-primary/30",
    },
    {
      year: "2026",
      title: "Major Metros",
      status: "PLANNED",
      counties: 150,
      revenue: "$125M ARR",
      states: ["Texas", "New York", "Illinois", "Georgia"],
      color: "from-accent to-transcend",
      borderColor: "border-accent/30",
    },
    {
      year: "2027",
      title: "Regional Expansion",
      status: "ROADMAP",
      counties: 300,
      revenue: "$250M ARR",
      states: ["Full Southeast", "Full West Coast", "Northeast Corridor"],
      color: "from-transcend to-primary",
      borderColor: "border-transcend/30",
    },
    {
      year: "2028",
      title: "Midwest & Mountains",
      status: "VISION",
      counties: 500,
      revenue: "$500M ARR",
      states: ["Ohio, Michigan, Wisconsin", "Colorado, Arizona, Nevada"],
      color: "from-primary to-transcend",
      borderColor: "border-primary/30",
    },
    {
      year: "2029",
      title: "Total Coverage",
      status: "TARGET",
      counties: 1000,
      revenue: "$1B ARR",
      states: ["All 50 states", "Federal engagement", "International expansion"],
      color: "from-transcend via-accent to-primary",
      borderColor: "border-transcend/30",
    },
  ]

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16"><>

          <Badge className="mb-6 bg-transcend/20 text-transcend border-transcend/30 px-6 py-2 text-lg">
            🗺️ 5-YEAR CONQUEST MAP
          </Badge>
          <h2
</>
className="text-5xl font-black mb-6 bg-gradient-to-r from-primary via-accent to-transcend bg-clip-text text-transparent">
            THE EXPANSION ROADMAP
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            From 27 counties to 1000+ counties. From $15M to $1B ARR. The systematic conquest of American government
            technology.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {roadmapPhases.map((phase /* , index */) => (
            <Card
              key={phase.year}
              className={`bg-black/60 backdrop-blur-xl ${phase.borderColor} border-2 hover:scale-105 transition-all duration-300`}
            >
              <CardHeader className="text-center">
                <div className="flex justify-between items-center mb-4"><>

                  <CardTitle className="text-3xl font-black text-white">{phase.year}</CardTitle>
                  <Badge
</>
className={`bg-gradient-to-r ${phase.color} text-black font-bold`}>{phase.status}</Badge>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{phase.title}</h3>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-black/40 rounded-lg"><>

                  <div
                    className={`text-3xl font-black bg-gradient-to-r ${phase.color} bg-clip-text text-transparent mb-1`}
                  >
                    {phase.counties}
                  </div>
                  <div
</>
className="text-sm text-white/60">Counties</div>
                </div>

                <div className="text-center p-4 bg-black/40 rounded-lg"><>

                  <div
                    className={`text-2xl font-black bg-gradient-to-r ${phase.color} bg-clip-text text-transparent mb-1`}
                  >
                    {phase.revenue}
                  </div>
                  <div
</>
className="text-sm text-white/60">Revenue</div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white/80 uppercase tracking-wide">Target States:</h4>
                  {phase.states.map((state, stateIndex) => (
                    <div key={stateIndex} className="text-sm text-white/70 bg-black/30 rounded px-3 py-1">
                      {state}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Financial Trajectory */}
        <div className="mt-16 p-8 bg-gradient-to-r from-black/80 via-primary/10 to-black/80 rounded-2xl border border-transcend/20"><>

          <h3 className="text-3xl font-black text-center mb-8 text-transcend">Financial Trajectory</h3>
          <div
</>
className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center">
            <div className="p-4"><>

              <div className="text-2xl font-black text-primary mb-2">Year 1</div>
              <div
</>
className="text-xl text-white">$50M ARR</div>
              <div className="text-sm text-white/60">(50 counties)</div>
            </div>
            <div className="p-4"><>

              <div className="text-2xl font-black text-accent mb-2">Year 2</div>
              <div
</>
className="text-xl text-white">$125M ARR</div>
              <div className="text-sm text-white/60">(150 counties)</div>
            </div>
            <div className="p-4"><>

              <div className="text-2xl font-black text-transcend mb-2">Year 3</div>
              <div
</>
className="text-xl text-white">$250M ARR</div>
              <div className="text-sm text-white/60">(300 counties)</div>
            </div>
            <div className="p-4"><>

              <div className="text-2xl font-black text-primary mb-2">Year 4</div>
              <div
</>
className="text-xl text-white">$500M ARR</div>
              <div className="text-sm text-white/60">(500 counties)</div>
            </div>
            <div className="p-4"><>

              <div className="text-2xl font-black text-transcend mb-2 transcend-glow">Year 5</div>
              <div
</>
className="text-2xl font-black text-transcend">$1B ARR</div>
              <div className="text-sm text-white/60">(1000+ counties)</div>
            </div>
          </div>
          <div className="text-center mt-6">
            <div className="text-3xl font-black text-transcend transcend-glow">$2B+ Total Cumulative Revenue</div>
          </div>
        </div>
      </div>
    </section>
  )
}
