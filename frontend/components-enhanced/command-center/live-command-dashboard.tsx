"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Activity, 
  Target, 
  TrendingUp, 
  MapPin, 
  Users, 
  DollarSign,
  Zap,
  Shield,
  Brain,
  Rocket
 } from '@mui/icons-material'

const realTimeMetrics = {
  conquest: {
    countiesActive: 3,
    countiesTargeted: 3142,
    percentComplete: 0.095,
    currentRevenue: "2.8M",
    projectedARR: "1.2B"
  },
  performance: {
    avgResponseTime: "0.47ms",
    systemUptime: "99.99%",
    aiAgentsActive: 1008,
    propertiesManaged: 94149
  },
  expansion: {
    floridaReadiness: 96,
    washingtonProgress: 87,
    nextCountyETA: "72 hours",
    pipelineValue: "156M"
  }
}

const liveAlerts = [
  { id: 1, type: "success", message: "Benton County: 500th valuation completed (0.43ms)", timestamp: "2 min ago" },
  { id: 2, type: "info", message: "Florida reconnaissance swarm: 15 counties analyzed", timestamp: "8 min ago" },
  { id: 3, type: "warning", message: "Spokane County expressing interest - sales team alerted", timestamp: "12 min ago" },
  { id: 4, type: "success", message: "AI Swarm optimization: 12% performance increase", timestamp: "18 min ago" }
]

const countiesPipeline = [
  { name: "Pierce County, WA", status: "negotiation", probability: 85, value: "45M", eta: "Q1 2025" },
  { name: "King County, WA", status: "demo", probability: 72, value: "128M", eta: "Q2 2025" },
  { name: "Miami-Dade, FL", status: "reconnaissance", probability: 64, value: "89M", eta: "Q2 2025" },
  { name: "Broward County, FL", status: "initial", probability: 45, value: "67M", eta: "Q3 2025" }
]

export function LiveCommandDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedView, setSelectedView] = useState("overview")

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-tf-dark via-tf-dark-lighter to-tf-dark p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div><>

            <h1 className="text-4xl font-black text-tf-transcend mb-2 transcend-glow">
              ⚡ TERRAFUSION COMMAND CENTER ⚡
            </h1>
            <p
</> className="text-tf-light/80">Real-time nationwide conquest monitoring</p>
          </div>
          <div className="text-right"><>

            <div className="text-2xl font-mono text-tf-primary">
              {currentTime.toLocaleTimeString()}
            </div>
            <div
</> className="text-sm text-tf-accent">
              {currentTime.toLocaleDateString()}
            </div>
          </div>
        </div>
        
        {/* Status Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-tf-dark-lighter/50 border-tf-success/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="w-8 h-8 text-tf-success" />
              <div><>

                <div className="text-sm text-tf-success">System Status</div>
                <div
</> className="font-bold text-tf-light">OPERATIONAL</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-tf-dark-lighter/50 border-tf-transcend/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Brain className="w-8 h-8 text-tf-transcend" />
              <div><>

                <div className="text-sm text-tf-transcend">AI Swarm</div>
                <div
</> className="font-bold text-tf-light">1,008 ACTIVE</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-tf-dark-lighter/50 border-tf-primary/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Activity className="w-8 h-8 text-tf-primary" />
              <div><>

                <div className="text-sm text-tf-primary">Response Time</div>
                <div
</> className="font-bold text-tf-light">0.47ms</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-tf-dark-lighter/50 border-tf-accent/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Rocket className="w-8 h-8 text-tf-accent" />
              <div><>

                <div className="text-sm text-tf-accent">Conquest Rate</div>
                <div
</> className="font-bold text-tf-light">ACCELERATING</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-6">
        <div className="flex gap-2">
          {["overview", "conquest", "performance", "pipeline"].map((view) => (
            <Button
              key={view}
              variant={selectedView === view ? "default" : "outline"}
              onClick={() => setSelectedView(view)}
              className={selectedView === view 
                ? "bg-tf-primary text-white" 
                : "border-tf-primary/30 text-tf-primary hover:bg-tf-primary/10"
              }
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Primary Metrics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Conquest Progress */}
          <Card className="bg-tf-dark-lighter/30 border-tf-transcend/20">
            <CardHeader>
              <CardTitle className="text-2xl text-tf-transcend flex items-center gap-2">
                <Target className="w-6 h-6" />
                NATIONAL CONQUEST PROGRESS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center"><>

                  <div className="text-4xl font-black text-tf-transcend mb-2">3</div>
                  <div
</> className="text-sm text-tf-light/70">Counties Active</div><>

                  <Progress value={0.095} className="mt-2" />
                </div>
                <div
</> className="text-center"><>

                  <div className="text-4xl font-black text-tf-primary mb-2">3,142</div>
                  <div
</> className="text-sm text-tf-light/70">Total Target</div>
                  <div className="text-xs text-tf-accent mt-1">0.095% Complete</div>
                </div>
                <div className="text-center"><>

                  <div className="text-4xl font-black text-tf-accent mb-2">$2.8M</div>
                  <div
</> className="text-sm text-tf-light/70">Current ARR</div>
                  <div className="text-xs text-tf-transcend mt-1">→ $1.2B Projected</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="bg-tf-dark-lighter/30 border-tf-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl text-tf-primary flex items-center gap-2">
                <Zap className="w-6 h-6" />
                SYSTEM PERFORMANCE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-tf-dark/30 rounded-lg"><>

                  <div className="text-2xl font-bold text-tf-transcend">0.47ms</div>
                  <div
</> className="text-xs text-tf-light/70">Avg Response</div>
                </div>
                <div className="text-center p-4 bg-tf-dark/30 rounded-lg"><>

                  <div className="text-2xl font-bold text-tf-success">99.99%</div>
                  <div
</> className="text-xs text-tf-light/70">Uptime</div>
                </div>
                <div className="text-center p-4 bg-tf-dark/30 rounded-lg"><>

                  <div className="text-2xl font-bold text-tf-accent">1,008</div>
                  <div
</> className="text-xs text-tf-light/70">AI Agents</div>
                </div>
                <div className="text-center p-4 bg-tf-dark/30 rounded-lg"><>

                  <div className="text-2xl font-bold text-tf-primary">94,149</div>
                  <div
</> className="text-xs text-tf-light/70">Properties</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Counties Pipeline */}
          <Card className="bg-tf-dark-lighter/30 border-tf-accent/20">
            <CardHeader>
              <CardTitle className="text-2xl text-tf-accent flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                COUNTIES PIPELINE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {countiesPipeline.map((county /* , index */) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-tf-dark/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-tf-primary" />
                      <div><>

                        <div className="font-semibold text-tf-light">{county.name}</div>
                        <div
</> className="text-xs text-tf-light/70">{county.eta}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right"><>

                        <div className="text-sm font-semibold text-tf-transcend">{county.value}</div>
                        <div
</> className="text-xs text-tf-light/70">{county.probability}% prob</div>
                      </div>
                      <Badge 
                        variant={county.status === "negotiation" ? "default" : "secondary"}
                        className={county.status === "negotiation" ? "bg-tf-success/20 text-tf-success" : ""}
                      >
                        {county.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Live Feed */}
        <div className="space-y-6">
          
          {/* Live Alerts */}
          <Card className="bg-tf-dark-lighter/30 border-tf-warning/20">
            <CardHeader>
              <CardTitle className="text-xl text-tf-warning">🔔 LIVE ALERTS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {liveAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 bg-tf-dark/30 rounded-lg border-l-4 border-tf-transcend/50"><>

                    <div className="text-sm text-tf-light">{alert.message}</div>
                    <div
</> className="text-xs text-tf-light/50 mt-1">{alert.timestamp}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-tf-dark-lighter/30 border-tf-primary/20">
            <CardHeader>
              <CardTitle className="text-xl text-tf-primary">⚡ QUICK ACTIONS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3"><>

                <Button className="w-full bg-gradient-to-r from-tf-primary to-tf-transcend hover:scale-105 transition-transform">
                  🎯 Deploy Florida Blitz
                </Button>
                <Button
</> variant="outline" className="w-full border-tf-accent text-tf-accent hover:bg-tf-accent/10">
                  📊 Generate Revenue Report
                </Button><>

                <Button variant="outline" className="w-full border-tf-success text-tf-success hover:bg-tf-success/10">
                  🤖 Scale AI Swarm
                </Button>
                <Button
</> variant="outline" className="w-full border-tf-warning text-tf-warning hover:bg-tf-warning/10">
                  🚨 Emergency Protocols
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Vitals */}
          <Card className="bg-tf-dark-lighter/30 border-tf-transcend/20">
            <CardHeader>
              <CardTitle className="text-xl text-tf-transcend">💓 SYSTEM VITALS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1"><>

                    <span className="text-tf-light/70">CPU Usage</span>
                    <span
</> className="text-tf-transcend">23%</span>
                  </div><>

                  <Progress value={23} className="h-2" />
                </div>
                <div
</>>
                  <div className="flex justify-between text-sm mb-1"><>

                    <span className="text-tf-light/70">Memory</span>
                    <span
</> className="text-tf-primary">67%</span>
                  </div><>

                  <Progress value={67} className="h-2" />
                </div>
                <div
</>>
                  <div className="flex justify-between text-sm mb-1"><>

                    <span className="text-tf-light/70">Network I/O</span>
                    <span
</> className="text-tf-accent">45%</span>
                  </div><>

                  <Progress value={45} className="h-2" />
                </div>
                <div
</>>
                  <div className="flex justify-between text-sm mb-1"><>

                    <span className="text-tf-light/70">AI Load</span>
                    <span
</> className="text-tf-success">89%</span>
                  </div>
                  <Progress value={89} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}