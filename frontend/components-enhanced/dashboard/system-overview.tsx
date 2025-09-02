"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useModuleRegistry } from "@/components/modules/module-registry"
import { Activity, Users, FileText, DollarSign, TrendingUp, Shield, Zap  } from '@mui/icons-material'

export function SystemOverview() {
  const { activeModules, modules } = useModuleRegistry()

  const stats = [
    {
      title: "Active Modules",
      value: activeModules.length,
      total: modules.length,
      icon: Activity,
      color: "tf-primary",
      change: "+2 this week",
    },
    {
      title: "Daily Transactions",
      value: "12,847",
      icon: FileText,
      color: "tf-accent",
      change: "+18% from yesterday",
    },
    {
      title: "Active Users",
      value: "1,247",
      icon: Users,
      color: "tf-success",
      change: "+5% this month",
    },
    {
      title: "Revenue Processed",
      value: "$2.4M",
      icon: DollarSign,
      color: "tf-warning",
      change: "+12% this quarter",
    },
  ]

  const systemHealth = [
    { name: "API Response Time", value: 98, status: "excellent" },
    { name: "Database Performance", value: 95, status: "excellent" },
    { name: "Security Score", value: 100, status: "perfect" },
    { name: "User Satisfaction", value: 94, status: "excellent" },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-heading font-bold">
          Welcome back to <span className="text-tf-primary">Terrafusion</span>
        </h2>
        <p className="text-muted-foreground">Your path to clarity begins here. All systems transcended.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat /* , index */) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="transcend-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div><>

                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <div
</> className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">
                        {typeof stat.value === "number" && "total" in stat ? `${stat.value}/${stat.total}` : stat.value}
                      </p>
                      {"total" in stat && <Progress value={(stat.value / stat.total) * 100} className="w-16 h-2" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-${stat.color}/10 border border-${stat.color}/20`}>
                    <Icon className={`w-6 h-6 text-${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* System Health */}
      <Card className="transcend-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-tf-success" />
            System Health Overview
            <Badge variant="secondary" className="bg-tf-success/10 text-tf-success border-tf-success/20">
              Transcendence Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {systemHealth.map((metric /* , index */) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between"><>

                  <span className="text-sm font-medium">{metric.name}</span>
                  <span
</> className="text-sm text-muted-foreground">{metric.value}%</span>
                </div>
                <Progress value={metric.value} className="h-2" />
                <div className="flex items-center gap-1">
                  {metric.status === "perfect" && <Zap className="w-3 h-3 text-tf-transcend" />}
                  {metric.status === "excellent" && <TrendingUp className="w-3 h-3 text-tf-success" />}
                  <span className="text-xs text-muted-foreground capitalize">{metric.status}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
