"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Shield, Lock, Eye, Warning, CheckCircle, Activity  } from '@mui/icons-material'

interface SecurityMetric {
  name: string
  value: number
  status: "secure" | "warning" | "critical"
  lastScan: string
}

interface SecurityThreat {
  id: string
  type: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  timestamp: string
  mitigated: boolean
}

export default function SecurityDashboard() {
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetric[]>([])
  const [threats, setThreats] = useState<SecurityThreat[]>([])

  useEffect(() => {
    const mockMetrics: SecurityMetric[] = [
      { name: "Firewall Protection", value: 99.8, status: "secure", lastScan: new Date().toISOString() },
      { name: "Intrusion Detection", value: 98.5, status: "secure", lastScan: new Date().toISOString() },
      { name: "Data Encryption", value: 100, status: "secure", lastScan: new Date().toISOString() },
      { name: "Access Control", value: 97.2, status: "warning", lastScan: new Date().toISOString() },
      { name: "Vulnerability Scan", value: 94.8, status: "warning", lastScan: new Date().toISOString() },
    ]

    const mockThreats: SecurityThreat[] = [
      {
        id: "threat-001",
        type: "Unauthorized Access Attempt",
        severity: "medium",
        description: "Multiple failed login attempts detected from IP 192.168.1.100",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        mitigated: true,
      },
      {
        id: "threat-002",
        type: "Suspicious Network Traffic",
        severity: "low",
        description: "Unusual data transfer pattern detected in water monitoring network",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        mitigated: false,
      },
    ]

    setSecurityMetrics(mockMetrics)
    setThreats(mockThreats)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "secure":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-blue-100 text-blue-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
<>

          <h2 className="text-2xl font-bold">Security Operations Center</h2>
          <p
</>

className="text-gray-600">Real-time security monitoring and threat detection</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <Shield className="h-4 w-4 mr-1" />
          Security Level: HIGH
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Overall Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
<>

            <div className="text-3xl font-bold text-green-600">98.1%</div>
            <Progress
</>

value={98.1} className="mt-2" />
            <p className="text-sm text-gray-600 mt-2">Excellent security posture</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Active Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
<>

            <div className="text-3xl font-bold">24/7</div>
            <div
</>

className="text-sm text-gray-600">
<>

              <div>• 2,847 endpoints monitored</div>
              <div
</>

</>>• 156 events/sec processed</div>
              <div>• 0 critical alerts</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Threat Response
            </CardTitle>
          </CardHeader>
          <CardContent>
<>

            <div className="text-3xl font-bold text-blue-600">47ms</div>
            <div
</>

className="text-sm text-gray-600">
<>

              <div>Average response time</div>
              <div
</>

className="mt-2">
                <Badge variant="outline">Auto-mitigation: ON</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
<>

            <CardTitle>Security Metrics</CardTitle>
            <CardDescription
</>

</>>Real-time security system performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityMetrics.map((metric /* , index */) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
<>

                    <div className="font-medium">{metric.name}</div>
                    <div
</>

className="text-xs text-gray-500">
                      Last scan: {new Date(metric.lastScan).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
<>

                    <div className={`text-lg font-bold ${getStatusColor(metric.status)}`}>{metric.value}%</div>
                    <Progress
</>

value={metric.value} className="w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
<>

            <CardTitle>Recent Security Events</CardTitle>
            <CardDescription
</>

</>>Latest threats and security incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {threats.map((threat) => (
                <Alert key={threat.id}>
                  <Warning className="h-4 w-4" />
                  <AlertTitle className="flex justify-between items-center">
<>

                    <span>{threat.type}</span>
                    <div
</>

className="flex items-center gap-2">
                      <Badge className={getSeverityColor(threat.severity)}>{threat.severity.toUpperCase()}</Badge>
                      {threat.mitigated ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Activity className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </AlertTitle>
                  <AlertDescription>
                    {threat.description}
                    <div className="text-xs text-gray-500 mt-1">{new Date(threat.timestamp).toLocaleString()}</div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
