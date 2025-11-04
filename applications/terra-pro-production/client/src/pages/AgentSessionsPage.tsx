import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot,
  Play,
  Pause,
  Refresh,
  Activity,
  Clock,
  CheckCircle,
  Warning,
  Target,
  Zap,
 } from '@mui/icons-material';

interface AppraiserSession {
  id: string;
  appraiserName: string;
  license: string;
  sessionType: "Simulation" | "Training" | "Live" | "Validation";
  propertyAddress: string;
  startTime: string;
  duration: number;
  status: "Active" | "Completed" | "Paused" | "Error";
  progressPercentage: number;
  currentStep: string;
  overridesDetected: number;
  complianceScore: number;
  aiAcceptanceRate: number;
  zoneValidation: "Passed" | "Failed" | "Pending";
  nftMinted: boolean;
}

interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  completedToday: number;
  avgComplianceScore: number;
  overrideAcceptanceRate: number;
  avgSessionDuration: number;
}

export default function AgentSessionsPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const sessions: AppraiserSession[] = [
    {
      id: "SIM-001",
      appraiserName: "Sarah Chen",
      license: "WA-CG-4829",
      sessionType: "Simulation",
      propertyAddress: "406 Stardust Ct, Grandview, WA",
      startTime: "2025-05-30T00:15:00Z",
      duration: 23,
      status: "Active",
      progressPercentage: 67,
      currentStep: "Comparable Analysis",
      overridesDetected: 2,
      complianceScore: 94,
      aiAcceptanceRate: 92,
      zoneValidation: "Passed",
      nftMinted: true,
    },
    {
      id: "TRN-002",
      appraiserName: "Michael Rodriguez",
      license: "WA-CR-7231",
      sessionType: "Training",
      propertyAddress: "1247 Vineyard Ave, Walla Walla, WA",
      startTime: "2025-05-30T00:08:00Z",
      duration: 31,
      status: "Active",
      progressPercentage: 89,
      currentStep: "UAD Field Validation",
      overridesDetected: 1,
      complianceScore: 97,
      aiAcceptanceRate: 96,
      zoneValidation: "Passed",
      nftMinted: true,
    },
    {
      id: "VAL-003",
      appraiserName: "Jennifer Wilson",
      license: "WA-CG-1847",
      sessionType: "Validation",
      propertyAddress: "892 Orchard St, Yakima, WA",
      startTime: "2025-05-29T23:42:00Z",
      duration: 47,
      status: "Completed",
      progressPercentage: 100,
      currentStep: "Report Finalized",
      overridesDetected: 3,
      complianceScore: 91,
      aiAcceptanceRate: 88,
      zoneValidation: "Passed",
      nftMinted: true,
    },
    {
      id: "SIM-004",
      appraiserName: "David Park",
      license: "WA-TR-5294",
      sessionType: "Simulation",
      propertyAddress: "3451 Hillside Dr, Spokane, WA",
      startTime: "2025-05-30T00:18:00Z",
      duration: 19,
      status: "Active",
      progressPercentage: 34,
      currentStep: "Property Inspection Data",
      overridesDetected: 0,
      complianceScore: 98,
      aiAcceptanceRate: 99,
      zoneValidation: "Pending",
      nftMinted: false,
    },
    {
      id: "LIV-005",
      appraiserName: "Amanda Foster",
      license: "WA-CG-9182",
      sessionType: "Live",
      propertyAddress: "567 Maple Ave, Bellingham, WA",
      startTime: "2025-05-30T00:05:00Z",
      duration: 35,
      status: "Paused",
      progressPercentage: 78,
      currentStep: "Override Justification",
      overridesDetected: 4,
      complianceScore: 86,
      aiAcceptanceRate: 84,
      zoneValidation: "Failed",
      nftMinted: false,
    },
  ];

  const sessionMetrics: SessionMetrics = {
    totalSessions: 247,
    activeSessions: 34,
    completedToday: 89,
    avgComplianceScore: 92.6,
    overrideAcceptanceRate: 91.4,
    avgSessionDuration: 42.3,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      case "Paused":
        return "bg-yellow-100 text-yellow-800";
      case "Error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case "Simulation":
        return "bg-purple-100 text-purple-800";
      case "Training":
        return "bg-blue-100 text-blue-800";
      case "Live":
        return "bg-green-100 text-green-800";
      case "Validation":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getZoneValidationColor = (validation: string) => {
    switch (validation) {
      case "Passed":
        return "text-green-600";
      case "Failed":
        return "text-red-600";
      case "Pending":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const filteredSessions = sessions.filter((session) => {
    if (selectedFilter === "all") return true;
    return session.sessionType.toLowerCase() === selectedFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Bot className="w-8 h-8 text-purple-600" />
          <div><>

            <h1 className="text-3xl font-bold text-gray-900">Agent Sessions</h1>
            <p
</> className="text-gray-600">Real-time appraiser simulation and training monitoring</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center space-x-2"
          >
            <Refresh className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} />
            <span>Auto Refresh</span>
          </Button>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Session Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-blue-600">{sessionMetrics.totalSessions}</div>
            <p
</> className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Zap
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-green-600">{sessionMetrics.activeSessions}</div>
            <p
</> className="text-xs text-muted-foreground">Running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-purple-600">
              {sessionMetrics.completedToday}
            </div>
            <p
</> className="text-xs text-muted-foreground">Sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Avg Compliance</CardTitle>
            <Target
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-orange-600">
              {sessionMetrics.avgComplianceScore}%
            </div>
            <p
</> className="text-xs text-muted-foreground">Score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Override Rate</CardTitle>
            <Warning
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-indigo-600">
              {sessionMetrics.overrideAcceptanceRate}%
            </div>
            <p
</> className="text-xs text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-red-600">
              {sessionMetrics.avgSessionDuration}m
            </div>
            <p
</> className="text-xs text-muted-foreground">Minutes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <div className="flex items-center space-x-4">
        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
          <SelectTrigger className="w-64"><>

            <SelectValue placeholder="Filter by session type" />
          </SelectTrigger>
          <SelectContent
</>><>

            <SelectItem value="all">All Session Types</SelectItem>
            <SelectItem
</> value="simulation">Simulation</SelectItem><>

            <SelectItem value="training">Training</SelectItem>
            <SelectItem
</> value="live">Live</SelectItem>
            <SelectItem value="validation">Validation</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline"><>

          <Play className="w-4 h-4 mr-2" />
          Start New Session
        </Button>

        <Button
</> variant="outline">
          <Pause className="w-4 h-4 mr-2" />
          Pause All
        </Button>
      </div>

      {/* Session List */}
      <Card>
        <CardHeader><>

          <CardTitle>Active Agent Sessions</CardTitle>
          <CardDescription
</>>
            Real-time monitoring of appraiser simulation and training sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div key={session.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-3">
                      <div><>

                        <div className="font-medium text-lg">{session.appraiserName}</div>
                        <div
</> className="text-sm text-gray-600">
                          {session.license} • {session.id}
                        </div>
                      </div><>

                      <Badge className={getSessionTypeColor(session.sessionType)}>
                        {session.sessionType}
                      </Badge>
                      <Badge
</> className={getStatusColor(session.status)}>{session.status}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><>

                        <div className="text-sm text-gray-600">Property</div>
                        <div
</> className="font-medium">{session.propertyAddress}</div>
                      </div>
                      <div><>

                        <div className="text-sm text-gray-600">Current Step</div>
                        <div
</> className="font-medium">{session.currentStep}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><>

                        <div className="text-gray-600">Duration</div>
                        <div
</> className="font-medium">{session.duration}m</div>
                      </div>
                      <div><>

                        <div className="text-gray-600">Overrides</div>
                        <div
</> className="font-medium">{session.overridesDetected}</div>
                      </div>
                      <div><>

                        <div className="text-gray-600">Compliance</div>
                        <div
</> className="font-medium">{session.complianceScore}%</div>
                      </div>
                      <div><>

                        <div className="text-gray-600">AI Acceptance</div>
                        <div
</> className="font-medium">{session.aiAcceptanceRate}%</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><>

                        <span>Session Progress</span>
                        <span
</>>{session.progressPercentage}%</span>
                      </div><>

                      <Progress value={session.progressPercentage} className="h-2" />
                    </div>

                    <div
</> className="flex items-center justify-between">
                      <div className="flex items-center space-x-4"><>

                        <div
                          className={`text-sm ${getZoneValidationColor(session.zoneValidation)}`}
                        >
                          Zone: {session.zoneValidation}
                        </div>
                        <div
</>
                          className={`text-sm ${session.nftMinted ? "text-green-600" : "text-gray-400"}`}
                        >
                          NFT: {session.nftMinted ? "Minted" : "Pending"}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {session.status === "Active" && (
                          <Button size="sm" variant="outline">
                            <Pause className="w-4 h-4 mr-1" />
                            Pause
                          </Button>
                        )}
                        {session.status === "Paused" && (
                          <Button size="sm" variant="outline">
                            <Play className="w-4 h-4 mr-1" />
                            Resume
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live System Status */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader><>

          <CardTitle className="text-green-900">System Status: AUTONOMOUS OPERATION</CardTitle>
          <CardDescription
</> className="text-green-700">
            UAD 3.6 Nexus system running with full simulation and validation capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Activity className="w-5 h-5 text-green-600" />
              <div className="text-green-800"><>

                <div className="font-medium">AI Simulation Engine</div>
                <div
</> className="text-sm">Running continuously</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="text-green-800"><>

                <div className="font-medium">UAD 3.6 Compliance</div>
                <div
</> className="text-sm">100% validated</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-green-600" />
              <div className="text-green-800"><>

                <div className="font-medium">Blockchain Integration</div>
                <div
</> className="text-sm">NFT minting active</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
