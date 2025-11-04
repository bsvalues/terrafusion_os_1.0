"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Database, Globe, TrendingUp, Users, Zap  } from '@mui/icons-material'

export default function DataDashboard() {
  const metrics = [
    { name: "Active Connections", value: "1,247", change: "+12%", icon: Users },
    { name: "Data Processed", value: "2.4 TB", change: "+8%", icon: Database },
    { name: "API Requests", value: "45.2K", change: "+23%", icon: Activity },
    { name: "Global Coverage", value: "89%", change: "+2%", icon: Globe },
  ]

  const services = [
    { name: "MCP Server", status: "healthy", uptime: "99.9%", load: 45 },
    { name: "Prometheus", status: "healthy", uptime: "99.8%", load: 32 },
    { name: "Grafana", status: "healthy", uptime: "99.7%", load: 28 },
    { name: "Client Apps", status: "healthy", uptime: "99.9%", load: 67 },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-3xl font-bold">Terrafusion Dashboard</h1>
          <p
</> className="text-gray-600">System overview and performance metrics</p>
        </div>
        <Badge className="bg-green-100 text-green-800">All Systems Operational</Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric /* , index */) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              <metric
</>.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold">{metric.value}</div>
              <p
</> className="text-xs text-muted-foreground">
                <span className="text-green-600">{metric.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList><>

          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger
</> value="performance">Performance</TabsTrigger>
          <TabsTrigger value="data">Data Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Service Status</CardTitle>
              <CardDescription
</>>Current status of all Terrafusion services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service /* , index */) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          service.status === "healthy" ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <div><>

                        <h4 className="font-medium">{service.name}</h4>
                        <p
</> className="text-sm text-gray-600">Uptime: {service.uptime}</p>
                      </div>
                    </div>
                    <div className="text-right"><>

                      <div className="text-sm font-medium">{service.load}% Load</div>
                      <Progress
</> value={service.load} className="w-20 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between"><>

                    <span>API Average</span>
                    <span
</> className="font-medium">145ms</span>
                  </div>
                  <div className="flex justify-between"><>

                    <span>Database Queries</span>
                    <span
</> className="font-medium">23ms</span>
                  </div>
                  <div className="flex justify-between"><>

                    <span>Map Rendering</span>
                    <span
</> className="font-medium">890ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Resource Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1"><>

                      <span>CPU Usage</span>
                      <span
</>>45%</span>
                    </div><>

                    <Progress value={45} />
                  </div>
                  <div
</>>
                    <div className="flex justify-between mb-1"><>

                      <span>Memory</span>
                      <span
</>>67%</span>
                    </div><>

                    <Progress value={67} />
                  </div>
                  <div
</>>
                    <div className="flex justify-between mb-1"><>

                      <span>Storage</span>
                      <span
</>>23%</span>
                    </div>
                    <Progress value={23} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Data Processing Pipeline</CardTitle>
              <CardDescription
</>>Real-time data flow through the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" /><>

                  <h4 className="font-medium">Data Ingestion</h4>
                  <p
</> className="text-2xl font-bold text-blue-600">2.4 TB/day</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" /><>

                  <h4 className="font-medium">Processing</h4>
                  <p
</> className="text-2xl font-bold text-green-600">1.8 TB/day</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Globe className="h-8 w-8 mx-auto mb-2 text-purple-500" /><>

                  <h4 className="font-medium">Distribution</h4>
                  <p
</> className="text-2xl font-bold text-purple-600">1.6 TB/day</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
