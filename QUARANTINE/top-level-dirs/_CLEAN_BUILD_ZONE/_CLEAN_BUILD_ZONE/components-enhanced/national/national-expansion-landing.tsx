"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function NationalExpansionLanding() {
  const [currentMetric, setCurrentMetric] = useState(0)

  const metrics = [
    { label: "Target Counties", value: "3,142", suffix: "" },
    { label: "Total Market", value: "$1", suffix: "B ARR" },
    { label: "5-Year Revenue", value: "$2", suffix: "B+" },
    { label: "Citizens Impacted", value: "350", suffix: "M" },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMetric((prev) => (prev + 1) % metrics.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative py-20 px-4 text-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-transcend/10 animate-pulse" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-transcend/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float-delayed" />

      <div className="relative z-10 max-w-6xl mx-auto"><>

        <Badge className="mb-6 bg-transcend/20 text-transcend border-transcend/30 px-6 py-2 text-lg">
          🚀 NATIONAL EXPANSION INITIATED
        </Badge>

        <h1
</>
className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-primary via-accent to-transcend bg-clip-text text-transparent">
          TOTAL DOMINATION
        </h1><>

        <p className="text-2xl md:text-3xl text-white/80 mb-4 font-bold">From Two States to 50 States</p>

        <p
</>
className="text-xl text-white/60 mb-12 max-w-4xl mx-auto leading-relaxed">
          The path to $1 Billion ARR in 5 years. Starting with Florida's 15+ counties and Washington's 12 counties,
          Terrafusion will transform American government operations county by county, state by state, coast to coast.
        </p>

        {/* Dynamic Metrics Display */}
        <div className="mb-12 p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-transcend/20 max-w-2xl mx-auto">
          <div className="text-6xl font-black text-transcend mb-2 transcend-glow">
            {metrics[currentMetric].value}
            <span className="text-3xl ml-2">{metrics[currentMetric].suffix}</span>
          </div>
          <div className="text-xl text-white/70 uppercase tracking-wider">{metrics[currentMetric].label}</div>
        </div>

        {/* Key Numbers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="p-6 bg-black/30 backdrop-blur-xl rounded-xl border border-primary/20"><>

            <div className="text-3xl font-black text-primary mb-2">27</div>
            <div
</>
className="text-sm text-white/60 uppercase tracking-wide">Counties Ready</div>
          </div>
          <div className="p-6 bg-black/30 backdrop-blur-xl rounded-xl border border-accent/20"><>

            <div className="text-3xl font-black text-accent mb-2">20M+</div>
            <div
</>
className="text-sm text-white/60 uppercase tracking-wide">Citizens</div>
          </div>
          <div className="p-6 bg-black/30 backdrop-blur-xl rounded-xl border border-transcend/20"><>

            <div className="text-3xl font-black text-transcend mb-2">8.1M</div>
            <div
</>
className="text-sm text-white/60 uppercase tracking-wide">Parcels</div>
          </div>
          <div className="p-6 bg-black/30 backdrop-blur-xl rounded-xl border border-primary/20"><>

            <div className="text-3xl font-black text-primary mb-2">$3T</div>
            <div
</>
className="text-sm text-white/60 uppercase tracking-wide">Property Value</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/national/command-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white font-bold px-8 py-4 text-lg transcend-glow"
            >
              🎯 Command Center
            </Button>
          </Link>
          <Link href="/national/roadmap">
            <Button
              size="lg"
              variant="outline"
              className="border-transcend text-transcend hover:bg-transcend/10 font-bold px-8 py-4 text-lg bg-transparent"
            >
              📈 View Roadmap
            </Button>
          </Link>
          <Link href="/national/q1-playbook">
            <Button
              size="lg"
              variant="outline"
              className="border-accent text-accent hover:bg-accent/10 font-bold px-8 py-4 text-lg bg-transparent"
            >
              ⚡ Q1 Playbook
            </Button>
          </Link>
        </div>

        {/* Battle Cry */}
        <div className="mt-16 p-8 bg-gradient-to-r from-primary/20 via-accent/20 to-transcend/20 rounded-2xl border border-transcend/30"><>

          <p className="text-2xl font-bold text-white mb-4">
            "Every county we transform is millions of citizens whose lives get better."
          </p>
          <p
</>
className="text-lg text-white/80">The Transcendence Begins NOW. 🚀</p>
        </div>
      </div>
    </section>
  )
}
