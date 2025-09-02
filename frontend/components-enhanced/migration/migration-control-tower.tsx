"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity,
  Warning,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Play,
  Square,
  Shield,
  TrendingUp,
 } from '@mui/icons-material'

interface MigrationData {
  name: string
  state: string
  status: "completed" | "migrating" | "pending" | "error"
  parcels: string
  value: string
  system: string
  started: string
  progress: number
  eta?: string
}

const migrations: MigrationData[] = [
  {
    name: "King County",
    state: "WA",
    status: "completed",
    parcels: "750K",
    value: "$487B",
    system: "ArcGIS Enterprise",
    started: "2025-01-13 18:00",
    progress: 100,
  },
  {
    name: "Pierce County",
    state: "WA",
    status: "completed",
    parcels: "340K",
    value: "$142B",
    system: "ArcGIS REST",
    started: "2025-01-14 20:00",
    progress: 100,
  },
  {
    name: "Los Angeles County",
    state: "CA",
    status: "migrating",
    parcels: "2.4M",
    value: "$1.7T",
    system: "Oracle + ArcGIS",
    started: "2025-01-20 22:00",
    progress: 67,
    eta: "6 hours",
  },
  {
    name: "San Diego County",
    state: "CA",
    status: "migrating",
    parcels: "1.1M",
    value: "$678B",
    system: "ArcGIS Enterprise",
    started: "2025-01-21 18:00",
    progress: 45,
    eta: "12 hours",
  },
  {
    name: "Miami-Dade County",
    state: "FL",
    status: "pending",
    parcels: "870K",
    value: "$567B",
    system: "Custom GIS",
    started: "2025-01-27 18:00",
    progress: 0,
  },
  {
    name: "Harris County",
    state: "TX",
    status: "pending",
    parcels: "1.6M",
    value: "$412B",
    system: "Legacy + Modern",
    started: "2025-01-28 20:00",
    progress: 0,
  },
]

const logEntries = [
  { time: "14:32:15", message: "King County migration completed successfully", type: "success" },
  { time: "14:31:42", message: "Data validation passed for Pierce County", type: "success" },
  { time: "14:30:28", message: "Los Angeles County migration at 67% - ETA 6 hours", type: "info" },
  { time: "14:29:55", message: "San Diego County extraction phase initiated", type: "info" },
  { time: "14:28:33", message: "Warning: High load on migration server 3", type: "warning" },
  { time: "14:27:19", message: "Miami-Dade County scheduled for next wave", type: "info" },
]

export function MigrationControlTower() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [systemStatus, setSystemStatus] = useState("OPERATIONAL")
  const [totalMigrated, setTotalMigrated] = useState(47)
  const [inProgress, setInProgress] = useState(8)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500"
      case "migrating":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500"
      case "pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500"
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500"
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "migrating":
        return <Activity className="w-4 h-4 animate-pulse" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "error":
        return <Warning className="w-4 h-4" />
      default:
        return <Database className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-4">
      {/* Matrix Background Effect */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"><>

                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div
</>><>

                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    MIGRATION CONTROL TOWER
                  </CardTitle>
                  <p
</> className="text-slate-400">Real-time county migration monitoring</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center"><>

                  <div className="text-xs text-cyan-400 uppercase tracking-wider">System Status</div>
                  <div
</> className="text-lg font-bold text-emerald-400">{systemStatus}</div>
                </div>
                <div className="text-center"><>

                  <div className="text-xs text-cyan-400 uppercase tracking-wider">Speed</div>
                  <div
</> className="text-lg font-bold text-emerald-400">379M×</div>
                </div>
                <div className="text-center"><>

                  <div className="text-xs text-cyan-400 uppercase tracking-wider">Uptime</div>
                  <div
</> className="text-lg font-bold text-emerald-400">99.99%</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-4 text-center"><>

              <div className="text-2xl font-bold text-emerald-400">{totalMigrated}</div>
              <div
</> className="text-xs text-slate-400 uppercase tracking-wider">Counties Migrated</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-4 text-center"><>

              <div className="text-2xl font-bold text-cyan-400">{inProgress}</div>
              <div
</> className="text-xs text-slate-400 uppercase tracking-wider">In Progress</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-4 text-center"><>

              <div className="text-2xl font-bold text-blue-400">2.3M</div>
              <div
</> className="text-xs text-slate-400 uppercase tracking-wider">Parcels Processed</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-4 text-center"><>

              <div className="text-2xl font-bold text-purple-400">28hrs</div>
              <div
</> className="text-xs text-slate-400 uppercase tracking-wider">Avg Migration Time</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
            <CardContent className="p-4 text-center"><>

              <div className="text-2xl font-bold text-emerald-400">$24.6M</div>
              <div
</> className="text-xs text-slate-400 uppercase tracking-wider">Revenue Captured</div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              MISSION CONTROL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"><>

                <Play className="w-4 h-4 mr-2" />
                START BATCH MIGRATION
              </Button>
              <Button
</> className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white"><>

                <CheckCircle className="w-4 h-4 mr-2" />
                VALIDATE ALL SYSTEMS
              </Button>
              <Button
</> variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"><>

                <TrendingUp className="w-4 h-4 mr-2" />
                GENERATE REPORT
              </Button>
              <Button
</> variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"><>

                <Clock className="w-4 h-4 mr-2" />
                SCHEDULE NEXT WAVE
              </Button>
              <Button
</> variant="destructive" className="bg-red-600 hover:bg-red-700">
                <Square className="w-4 h-4 mr-2" />
                EMERGENCY STOP
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Migration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {migrations.map((migration /* , index */) => (
            <Card
              key={index}
              className={`bg-slate-900/50 backdrop-blur-sm transition-all duration-300 ${
                migration.status === "migrating"
                  ? "border-cyan-500/50 shadow-cyan-500/20 shadow-lg"
                  : "border-slate-700/50"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div><>

                    <CardTitle className="text-lg text-white">{migration.name}</CardTitle>
                    <p
</> className="text-cyan-400 text-sm">{migration.state}</p>
                  </div>
                  <Badge className={`${getStatusColor(migration.status)} flex items-center gap-1`}>
                    {getStatusIcon(migration.status)}
                    {migration.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><>

                    <div className="text-cyan-400">Parcels</div>
                    <div
</> className="text-white font-semibold">{migration.parcels}</div>
                  </div>
                  <div><>

                    <div className="text-cyan-400">Value</div>
                    <div
</> className="text-white font-semibold">{migration.value}</div>
                  </div>
                  <div><>

                    <div className="text-cyan-400">System</div>
                    <div
</> className="text-white font-semibold">{migration.system}</div>
                  </div>
                  <div><>

                    <div className="text-cyan-400">Started</div>
                    <div
</> className="text-white font-semibold">{migration.started}</div>
                  </div>
                </div>

                {migration.status === "migrating" && (
                  <div className="space-y-2">
                    <Progress value={migration.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-slate-400"><>

                      <span>Progress</span>
                      <span
</>>
                        {migration.progress}% • ETA: {migration.eta}
                      </span>
                    </div>
                  </div>
                )}

                {migration.status === "completed" && (
                  <Alert className="border-emerald-500/30 bg-emerald-500/10">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <AlertDescription className="text-emerald-400">Migration completed successfully</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Log */}
        <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-300 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              ACTIVITY LOG
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-sm">
              {logEntries.map((entry /* , index */) => (
                <div key={index} className="flex gap-4 p-2 rounded border-b border-slate-800/50"><>

                  <span className="text-cyan-400 font-semibold">{entry.time}</span>
                  <span
</>
                    className={`${
                      entry.type === "success"
                        ? "text-emerald-400"
                        : entry.type === "warning"
                          ? "text-amber-400"
                          : entry.type === "error"
                            ? "text-red-400"
                            : "text-slate-300"
                    }`}
                  >
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
