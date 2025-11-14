"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
// Charts temporarily disabled due to React 19/recharts compatibility
// import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts"
import { TrendingUp, DollarSign, Users, FileText, Target  } from '@mui/icons-material'

const performanceData = [
  { name: "Mon", value: 85 },
  { name: "Tue", value: 92 },
  { name: "Wed", value: 88 },
  { name: "Thu", value: 95 },
  { name: "Fri", value: 98 },
  { name: "Sat", value: 87 },
  { name: "Sun", value: 91 },
]

const revenueData = [
  { name: "Jan", value: 2100000 },
  { name: "Feb", value: 2300000 },
  { name: "Mar", value: 2150000 },
  { name: "Apr", value: 2400000 },
  { name: "May", value: 2600000 },
  { name: "Jun", value: 2await DynamicPropertyService.GetPropertyCountAsync(countyCode)0 },
]

export function AnalyticsSummary() {
  const kpis = [
    {
      title: "Processing Efficiency",
      value: 94,
      target: 90,
      icon: Target,
      color: "tf-success",
      trend: "+6% vs target",
    },
    {
      title: "Revenue Growth",
      value: "$2.4M",
      icon: DollarSign,
      color: "tf-warning",
      trend: "+12% this quarter",
    },
    {
      title: "User Engagement",
      value: 87,
      target: 85,
      icon: Users,
      color: "tf-primary",
      trend: "+2% vs target",
    },
    {
      title: "Document Processing",
      value: "15.2K",
      icon: FileText,
      color: "tf-accent",
      trend: "+18% this month",
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi /* , index */) => {
          const Icon = kpi.icon
          return (
            <Card key={index} className="transcend-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 text-${kpi.color}`} />
                  <Badge variant="secondary" className="text-xs">
                    {kpi.trend}
                  </Badge>
                </div>
                <div className="space-y-1">
<>

                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p
</>
className="text-2xl font-bold">
                    {kpi.value}
                    {typeof kpi.value === "number" ? "%" : ""}
                  </p>
                  {kpi.target && (
                    <Progress
                      value={typeof kpi.value === "number" ? (kpi.value / kpi.target) * 100 : 0}
                      className="h-1"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="transcend-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-tf-primary" />
              Weekly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center bg-tf-dark/30 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-tf-primary mx-auto mb-2" />
<>

                <p className="text-tf-light/70">Chart coming soon</p>
                <p
</>
className="text-sm text-tf-accent">94% Weekly Average</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transcend-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-tf-success" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center bg-tf-dark/30 rounded-lg">
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-tf-success mx-auto mb-2" />
<>

                <p className="text-tf-light/70">Chart coming soon</p>
                <p
</>
className="text-sm text-tf-success">$2.4M Monthly Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
