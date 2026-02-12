"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export function CommandCenterDashboard() {
  const [metrics, setMetrics] = useState({
    totalCounties: 27,
    citizensImpacted: 20.3,
    parcelsMigrated: 1.2,
    propertyValue: 487,
    processingSpeed: "379M×",
    annualRevenue: 15.2,
  })

  const [floridaProgress, setFloridaProgress] = useState(33)
  const [washingtonProgress, setWashingtonProgress] = useState(25)

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        parcelsMigrated: prev.parcelsMigrated + Math.random() * 0.01,
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const simulateMigration = () => {
    // Animate Florida progress
    const floridaInterval = setInterval(() => {
      setFloridaProgress((prev) => {
        if (prev < 67) {
          return prev + 2
        } else {
          clearInterval(floridaInterval)
          return prev
        }
      })
    }, 100)

    // Animate Washington progress
    const washingtonInterval = setInterval(() => {
      setWashingtonProgress((prev) => {
        if (prev < 50) {
          return prev + 2
        } else {
          clearInterval(washingtonInterval)
          return prev
        }
      })
    }, 120)

    // Update metrics after animation
    setTimeout(() => {
      setMetrics((prev) => ({
        ...prev,
        citizensImpacted: 22.5,
        parcelsMigrated: 2.8,
        propertyValue: 892,
        annualRevenue: 28.4,
      }))
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Command Header */}
      <div className="bg-gradient-to-r from-dark-blue via-primary/20 to-dark-blue p-8 text-center border-b-2 border-transcend relative"><>

        <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-transcend via-accent to-primary bg-clip-text text-transparent transcend-glow">
          Terrafusion National Command Center
        </h1>
        <p
</>
className="text-xl text-white/80">Real-Time County Migration Status</p>

        <div className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent rounded-full">
          <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
          <span className="text-accent font-bold">LIVE</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 max-w-7xl mx-auto">
        <Card className="bg-black/80 border-transcend/20 hover:border-transcend transition-all duration-300 hover:shadow-lg hover:shadow-transcend/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium text-white/70 uppercase tracking-wide">Total Counties</CardTitle>
            <span
</>
className="text-2xl">🏛️</span>
          </CardHeader>
          <CardContent><>

            <div className="text-4xl font-black text-transcend mb-1">{metrics.totalCounties}</div>
            <p
</>
className="text-sm text-accent">↑ 2 this week</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-primary/20 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium text-white/70 uppercase tracking-wide">
              Citizens Impacted
            </CardTitle>
            <span
</>
className="text-2xl">👥</span>
          </CardHeader>
          <CardContent><>

            <div className="text-4xl font-black text-primary mb-1">{metrics.citizensImpacted.toFixed(1)}M</div>
            <p
</>
className="text-sm text-accent">↑ 2.7M this month</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-accent/20 hover:border-accent transition-all duration-300 hover:shadow-lg hover:shadow-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium text-white/70 uppercase tracking-wide">
              Parcels Migrated
            </CardTitle>
            <span
</>
className="text-2xl">📍</span>
          </CardHeader>
          <CardContent><>

            <div className="text-4xl font-black text-accent mb-1">{metrics.parcelsMigrated.toFixed(1)}M</div>
            <p
</>
className="text-sm text-accent">↑ 385K today</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-transcend/20 hover:border-transcend transition-all duration-300 hover:shadow-lg hover:shadow-transcend/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium text-white/70 uppercase tracking-wide">Property Value</CardTitle>
            <span
</>
className="text-2xl">💰</span>
          </CardHeader>
          <CardContent><>

            <div className="text-4xl font-black text-transcend mb-1">${metrics.propertyValue}B</div>
            <p
</>
className="text-sm text-accent">↑ $125B this week</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-primary/20 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium text-white/70 uppercase tracking-wide">
              Processing Speed
            </CardTitle>
            <span
</>
className="text-2xl">⚡</span>
          </CardHeader>
          <CardContent><>

            <div className="text-4xl font-black text-primary mb-1">{metrics.processingSpeed}</div>
            <p
</>
className="text-sm text-accent">Verified & Proven</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-accent/20 hover:border-accent transition-all duration-300 hover:shadow-lg hover:shadow-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium text-white/70 uppercase tracking-wide">Annual Revenue</CardTitle>
            <span
</>
className="text-2xl">📈</span>
          </CardHeader>
          <CardContent><>

            <div className="text-4xl font-black text-accent mb-1">${metrics.annualRevenue.toFixed(1)}M</div>
            <p
</>
className="text-sm text-accent">↑ On track for $50M</p>
          </CardContent>
        </Card>
      </div>

      {/* State Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 max-w-7xl mx-auto">
        <Card className="bg-gradient-to-br from-black/90 to-orange-900/20 border-2 border-orange-500/30">
          <CardHeader>
            <div className="flex justify-between items-center"><>

              <CardTitle className="text-2xl font-bold text-orange-400">🌴 Florida</CardTitle>
              <Badge
</>
className="bg-orange-500/20 text-orange-400 border-orange-500/30">ACTIVE</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2"><>

                <span className="text-white/80">Counties Progress</span>
                <span
</>
className="text-orange-400 font-bold">{Math.floor(floridaProgress / 6.67)} of 15 Live</span>
              </div>
              <Progress value={floridaProgress} className="h-6 bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-transcend transition-all duration-300"
                  style={{ width: `${floridaProgress}%` }}
                />
              </Progress>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-black/50 rounded-lg"><>

                <div className="text-2xl font-bold text-orange-400">14.5M</div>
                <div
</>
className="text-sm text-white/60">Population</div>
              </div>
              <div className="text-center p-4 bg-black/50 rounded-lg"><>

                <div className="text-2xl font-bold text-orange-400">2.1M</div>
                <div
</>
className="text-sm text-white/60">Parcels</div>
              </div>
              <div className="text-center p-4 bg-black/50 rounded-lg"><>

                <div className="text-2xl font-bold text-orange-400">$685B</div>
                <div
</>
className="text-sm text-white/60">Value</div>
              </div>
            </div>

            <div><>

              <p className="text-orange-400 font-bold mb-2">Live Counties:</p>
              <p
</>
className="text-white/80 text-sm mb-3">✓ Miami-Dade | ✓ Broward | ✓ Palm Beach | ✓ Pinellas | ✓ Lee</p><>

              <p className="text-orange-400 font-bold">Next Up:</p>
              <p
</>
className="text-white/80 text-sm">Orange, Hillsborough, Duval</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-black/90 to-green-900/20 border-2 border-green-500/30">
          <CardHeader>
            <div className="flex justify-between items-center"><>

              <CardTitle className="text-2xl font-bold text-green-400">🌲 Washington</CardTitle>
              <Badge
</>
className="bg-green-500/20 text-green-400 border-green-500/30">LAUNCHING</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2"><>

                <span className="text-white/80">Counties Progress</span>
                <span
</>
className="text-green-400 font-bold">{Math.floor(washingtonProgress / 8.33)} of 12 Live</span>
              </div>
              <Progress value={washingtonProgress} className="h-6 bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-transcend transition-all duration-300"
                  style={{ width: `${washingtonProgress}%` }}
                />
              </Progress>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-black/50 rounded-lg"><>

                <div className="text-2xl font-bold text-green-400">5.2M</div>
                <div
</>
className="text-sm text-white/60">Population</div>
              </div>
              <div className="text-center p-4 bg-black/50 rounded-lg"><>

                <div className="text-2xl font-bold text-green-400">1.1M</div>
                <div
</>
className="text-sm text-white/60">Parcels</div>
              </div>
              <div className="text-center p-4 bg-black/50 rounded-lg"><>

                <div className="text-2xl font-bold text-green-400">$425B</div>
                <div
</>
className="text-sm text-white/60">Value</div>
              </div>
            </div>

            <div><>

              <p className="text-green-400 font-bold mb-2">Live Counties:</p>
              <p
</>
className="text-white/80 text-sm mb-3">✓ Island | ✓ Franklin | ✓ Cowlitz</p><>

              <p className="text-green-400 font-bold">Next Up:</p>
              <p
</>
className="text-white/80 text-sm">King, Pierce, Snohomish</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mission Control Panel */}
      <div className="fixed bottom-8 right-8 bg-black/90 backdrop-blur-xl border border-transcend/30 rounded-2xl p-6 min-w-80"><>

        <h3 className="text-transcend font-bold uppercase tracking-wide mb-4">Mission Control</h3>
        <div
</>
className="space-y-3"><>

          <Button
            onClick={simulateMigration}
            className="w-full bg-gradient-to-r from-transcend to-accent hover:from-transcend/80 hover:to-accent/80 text-black font-bold"
          >
            Simulate Migration
          </Button>
          <Button
</>

            onClick={() =>
              alert(
                "2025 PROJECTIONS:\n\nQ1: $15M ARR | 50 Counties\nQ2: $30M ARR | 100 Counties\nQ3: $40M ARR | 150 Counties\nQ4: $50M ARR | 200 Counties\n\nTotal: $50M ARR by EOY 2025",
              )
            }
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white font-bold"
          >
            2025 Projections
          </Button>
          <Button
            onClick={() =>
              alert(
                "NATIONAL EXPANSION INITIATED!\n\nTarget States:\n• California (LA, San Diego, Orange)\n• Texas (Harris, Dallas, Bexar)\n• New York (NYC Counties)\n• Illinois (Cook County)\n\nTimeline: Q3 2025\nRevenue: $200M ARR by 2026\n\nTHE TRANSCENDENCE CONTINUES!",
              )
            }
            className="w-full bg-gradient-to-r from-accent to-transcend hover:from-accent/80 hover:to-transcend/80 text-black font-bold"
          >
            Launch National
          </Button>
        </div>
      </div>
    </div>
  )
}
