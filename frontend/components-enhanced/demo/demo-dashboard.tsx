"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DemoTour } from "./demo-tour"
import { Activity,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Zap,
  Calculator,
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  Play,
  Pause,
 } from '@mui/icons-material'

export function DemoDashboard() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [animatedValues, setAnimatedValues] = useState({
    activeModules: 0,
    dailyTransactions: 0,
    activeUsers: 0,
    revenueProcessed: 0,
  })

  const demoSteps = [
    {
      title: "Welcome to Madison County",
      description: "This is your Terrafusion OS dashboard showing real-time county operations.",
      target: "header",
    },
    {
      title: "System Overview",
      description: "See key metrics updating in real-time as county operations continue.",
      target: "metrics",
    },
    {
      title: "Active Modules",
      description: "All 14 government modules are running and processing data automatically.",
      target: "modules",
    },
    {
      title: "Live Activity Feed",
      description: "Watch real county employees completing tasks across all departments.",
      target: "activity",
    },
    {
      title: "Performance Analytics",
      description: "Real-time analytics show the efficiency gains from Terrafusion OS.",
      target: "analytics",
    },
  ]

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setAnimatedValues((prev) => ({
          activeModules: Math.min(14, prev.activeModules + 1),
          dailyTransactions: Math.min(12847, prev.dailyTransactions + 500),
          activeUsers: Math.min(1247, prev.activeUsers + 50),
          revenueProcessed: Math.min(2400000, prev.revenueProcessed + 100000),
        }))
      }, 200)

      return () => clearInterval(interval)
    }
  }, [isPlaying])

  const formatCurrency = (value: number) => {
    return `$${(value / 1000000).toFixed(1)}M`
  }

  const demoModules = [
    { name: "CostForge AI", icon: Calculator, status: "processing", color: "tf-accent" },
    { name: "PermitFlow", icon: FileText, status: "active", color: "tf-primary" },
    { name: "GeoIntel", icon: MapPin, status: "active", color: "tf-transcend" },
    { name: "CitizenConnect", icon: Users, status: "active", color: "tf-success" },
  ]

  const recentActivity = [
    {
      user: "Sarah Chen",
      action: "completed 847 property valuations",
      time: "2 minutes ago",
      avatar: "/asian-woman-professional.png",
      status: "success",
    },
    {
      user: "Mike Rodriguez",
      action: "approved building permit BP-2024-0156",
      time: "3 minutes ago",
      avatar: "/hispanic-professional-man.png",
      status: "success",
    },
    {
      user: "AI Assistant",
      action: "detected revenue optimization opportunity",
      time: "5 minutes ago",
      avatar: "/ai-brain-icon.png",
      status: "info",
    },
    {
      user: "Jennifer Park",
      action: "updated zoning analysis for District 7",
      time: "7 minutes ago",
      avatar: "/asian-gis-analyst.png",
      status: "success",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-tf-clarity/5 to-background">
      {/* Demo Controls */}
      <div className="fixed top-4 right-4 z-50">
        <Card className="bg-tf-dark text-tf-light border-tf-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3"><>

              <Badge variant="secondary" className="bg-tf-transcend/20 text-tf-transcend border-tf-transcend/30">
                DEMO MODE
              </Badge>
              <Button
</>

                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className={isPlaying ? "bg-tf-error hover:bg-tf-error/80" : "bg-tf-success hover:bg-tf-success/80"}
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? "Pause" : "Start"} Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <header id="header" className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg clarity-gradient flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TF</span>
                </div>
                <div><>

                  <h1 className="font-heading font-bold text-lg">Madison County Dashboard</h1>
                  <p
</>
className="text-xs text-muted-foreground">Government. Transcended.</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-tf-success/10 text-tf-success border-tf-success/20">
                <Activity className="w-3 h-3 mr-1" />
                All Systems Operational
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/county-administrator.png" />
                <AvatarFallback>CA</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-right"><>

                <p className="text-sm font-medium">County Administrator</p>
                <p
</>
className="text-xs text-muted-foreground">Madison County</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* System Metrics */}
        <div id="metrics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="transcend-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><>

                  <p className="text-sm font-medium text-muted-foreground">Active Modules</p>
                  <p
</>
className="text-2xl font-bold">{animatedValues.activeModules}/14</p><>

                  <Progress value={(animatedValues.activeModules / 14) * 100} className="w-16 h-2 mt-2" />
                </div>
                <div
</>
className="p-3 rounded-full bg-tf-primary/10 border border-tf-primary/20">
                  <Activity className="w-6 h-6 text-tf-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transcend-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><>

                  <p className="text-sm font-medium text-muted-foreground">Daily Transactions</p>
                  <p
</>
className="text-2xl font-bold">{animatedValues.dailyTransactions.toLocaleString()}</p>
                  <p className="text-xs text-tf-success mt-1">+18% from yesterday</p>
                </div>
                <div className="p-3 rounded-full bg-tf-accent/10 border border-tf-accent/20">
                  <FileText className="w-6 h-6 text-tf-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transcend-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><>

                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p
</>
className="text-2xl font-bold">{animatedValues.activeUsers.toLocaleString()}</p>
                  <p className="text-xs text-tf-success mt-1">+5% this month</p>
                </div>
                <div className="p-3 rounded-full bg-tf-success/10 border border-tf-success/20">
                  <Users className="w-6 h-6 text-tf-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transcend-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><>

                  <p className="text-sm font-medium text-muted-foreground">Revenue Processed</p>
                  <p
</>
className="text-2xl font-bold">{formatCurrency(animatedValues.revenueProcessed)}</p>
                  <p className="text-xs text-tf-success mt-1">+12% this quarter</p>
                </div>
                <div className="p-3 rounded-full bg-tf-warning/10 border border-tf-warning/20">
                  <DollarSign className="w-6 h-6 text-tf-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Modules */}
          <div id="modules" className="lg:col-span-2">
            <Card className="transcend-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-tf-primary" />
                  Active Modules
                  <Badge variant="secondary" className="bg-tf-primary/10 text-tf-primary border-tf-primary/20">
                    {animatedValues.activeModules} Running
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {demoModules.map((module /* , index */) => {
                    const Icon = module.icon
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className={`p-2 rounded-lg bg-${module.color}/10 border border-${module.color}/20`}><>

                          <Icon className={`w-4 h-4 text-${module.color}`} />
                        </div>
                        <div
</>
className="flex-1"><>

                          <p className="font-medium text-sm">{module.name}</p>
                          <div
</>
className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full bg-${module.color} animate-pulse`} />
                            <span className="text-xs text-muted-foreground capitalize">{module.status}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-tf-primary hover:bg-tf-primary/10">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div id="activity">
            <Card className="transcend-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-tf-primary" />
                  Live Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity /* , index */) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={activity.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {activity.user
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0"><>

                      <p className="text-sm font-medium">{activity.user}</p>
                      <p
</>
className="text-sm text-muted-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-tf-success mt-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Performance Analytics */}
        <div id="analytics">
          <Card className="transcend-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-tf-success" />
                Performance Analytics
                <Badge variant="secondary" className="bg-tf-success/10 text-tf-success border-tf-success/20">
                  Real-time
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><>

                    <span className="text-sm font-medium">Processing Efficiency</span>
                    <span
</>
className="text-sm text-muted-foreground">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                  <p className="text-xs text-tf-success">+6% vs target</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between"><>

                    <span className="text-sm font-medium">User Satisfaction</span>
                    <span
</>
className="text-sm text-muted-foreground">98%</span>
                  </div>
                  <Progress value={98} className="h-2" />
                  <p className="text-xs text-tf-success">+13% vs target</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between"><>

                    <span className="text-sm font-medium">System Uptime</span>
                    <span
</>
className="text-sm text-muted-foreground">99.9%</span>
                  </div>
                  <Progress value={99.9} className="h-2" />
                  <p className="text-xs text-tf-success">Exceeds SLA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Demo Tour */}
      <DemoTour steps={demoSteps} currentStep={currentStep} onStepChange={setCurrentStep} isActive={isPlaying} />
    </div>
  )
}
