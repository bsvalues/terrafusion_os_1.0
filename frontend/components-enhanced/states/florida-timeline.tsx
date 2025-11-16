"use client"

import { Card, CardContent } from "@/components/ui/card"

const timelinePhases = [
  {
    phase: "WEEK 1-4: SOUTH FLORIDA BLITZ",
    title: "Miami-Dade, Broward, Palm Beach",
    description: "Hurricane-speed deployment across the tri-county powerhouse",
    actions: [
      "Miami-Dade ArcGIS Open Data integration (24hr)",
      "Broward GeoHub migration (48hr)",
      "Palm Beach Open Data conversion (48hr)",
      "Unified South Florida dashboard launch",
    ],
    revenue: "$30.4M/year combined",
    population: "6.2M citizens",
  },
  {
    phase: "WEEK 5-8: CENTRAL FLORIDA EXPANSION",
    title: "Orange, Hillsborough, Pinellas",
    description: "Tourism and sports corridor optimization",
    actions: [
      "Orange County OCGIS integration",
      "Tampa Bay regional coordination",
      "Theme park property specialization",
      "Sports venue management integration",
    ],
    revenue: "$18.1M/year combined",
    population: "3.9M citizens",
  },
  {
    phase: "WEEK 9-12: STATEWIDE ROLLOUT",
    title: "Growth Counties & Coastal Regions",
    description: "Complete Florida coverage with specialized features",
    actions: [
      "Lee County post-hurricane optimization",
      "Space Coast (Brevard) tech integration",
      "Capital region (Leon) political showcase",
      "Statewide hurricane preparedness activation",
    ],
    revenue: "$12.8M/year combined",
    population: "2.1M citizens",
  },
]

export function FloridaTimeline() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12"><>

        <h2 className="text-3xl font-bold text-transcend mb-4">FLORIDA CONQUEST TIMELINE</h2>
        <p
</>
className="text-primary">From the Panhandle to the Keys in 90 days</p>
      </div>

      <div className="relative">
        {/* Timeline Line */}<>

        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-transcend to-accent"></div>

        <div
</>
className="space-y-8">
          {timelinePhases.map((phase /* , index */) => (
            <div key={index} className="relative flex items-start">
              {/* Timeline Dot */}
              <div className="absolute left-6 w-4 h-4 bg-transcend rounded-full border-4 border-dark shadow-lg shadow-transcend/50"></div>

              {/* Content */}
              <div className="ml-16 flex-1">
                <Card className="bg-dark-blue/20 border-transcend/30 hover:border-transcend/60 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                      <div><>

                        <div className="text-accent font-bold text-sm mb-1">{phase.phase}</div>
                        <h3
</>
className="text-xl font-bold text-white mb-2">{phase.title}</h3>
                        <p className="text-transcend text-sm">{phase.description}</p>
                      </div>
                      <div className="lg:text-right mt-4 lg:mt-0"><>

                        <div className="text-2xl font-black text-accent">{phase.revenue}</div>
                        <div
</>
className="text-sm text-primary">{phase.population}</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div><>

                        <h4 className="font-semibold text-transcend mb-2">Key Actions:</h4>
                        <ul
</>
className="space-y-1">
                          {phase.actions.map((action, idx) => (
                            <li key={idx} className="text-sm text-gray-300 flex items-start">
                              <span className="text-accent mr-2">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="text-center p-4 bg-transcend/10 rounded-lg border border-transcend/30"><>

                          <div className="text-lg font-bold text-transcend">Phase {index + 1}</div>
                          <div
</>
className="text-sm text-primary">Strategic Priority</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Vision */}
      <Card className="mt-12 bg-gradient-to-r from-transcend/20 to-accent/20 border-transcend">
        <CardContent className="p-8 text-center"><>

          <h3 className="text-2xl font-bold text-transcend mb-4">🌟 THE FLORIDA VISION</h3>
          <p
</>
className="text-lg text-white mb-6 italic">
            "By Q2 2025, Florida becomes the first fully-digital state, managing $2.1T in property value with
            hurricane-speed efficiency and tourism-grade excellence."
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center"><>

              <div className="text-3xl font-black text-accent">15+</div>
              <div
</>
className="text-sm text-transcend">Counties Conquered</div>
            </div>
            <div className="text-center"><>

              <div className="text-3xl font-black text-accent">5.8M</div>
              <div
</>
className="text-sm text-transcend">Parcels Managed</div>
            </div>
            <div className="text-center"><>

              <div className="text-3xl font-black text-accent">$156M</div>
              <div
</>
className="text-sm text-transcend">Annual Savings</div>
            </div>
            <div className="text-center"><>

              <div className="text-3xl font-black text-accent">100%</div>
              <div
</>
className="text-sm text-transcend">Hurricane Ready</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
