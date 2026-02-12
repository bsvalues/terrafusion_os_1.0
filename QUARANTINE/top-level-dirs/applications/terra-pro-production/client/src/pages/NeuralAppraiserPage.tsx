import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain,
  Zap,
  Activity,
  Settings,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Users,
  Database,
  Target,
  Sparkles,
 } from '@mui/icons-material';

interface NeuralAgent {
  id: string;
  name: string;
  type: "Residential" | "Commercial" | "Rural" | "Mixed-Use";
  experience: number;
  accuracy: number;
  overridePattern: string;
  sessionCount: number;
  status: "Training" | "Active" | "Tuning" | "Deployed";
}

interface TrainingSession {
  id: string;
  agentId: string;
  scenario: string;
  duration: string;
  accuracy: number;
  overrides: number;
  learningPoints: string[];
  status: "Completed" | "Running" | "Failed";
}

export default function NeuralAppraiserPage() {
  const [activeAgent, setActiveAgent] = useState<string>("agent-001");
  const [isTraining, setIsTraining] = useState(false);

  const neuralAgents: NeuralAgent[] = [
    {
      id: "agent-001",
      name: "WA-Residential-Alpha",
      type: "Residential",
      experience: 97.4,
      accuracy: 94.2,
      overridePattern: "Zoning-sensitive with condition-adjustment preference",
      sessionCount: 2847,
      status: "Active",
    },
    {
      id: "agent-002",
      name: "WA-Commercial-Beta",
      type: "Commercial",
      experience: 89.1,
      accuracy: 91.7,
      overridePattern: "Market-trend focused with CAP rate emphasis",
      sessionCount: 1923,
      status: "Training",
    },
    {
      id: "agent-003",
      name: "WA-Rural-Gamma",
      type: "Rural",
      experience: 92.8,
      accuracy: 88.4,
      overridePattern: "Agricultural consideration with water rights integration",
      sessionCount: 1456,
      status: "Deployed",
    },
    {
      id: "agent-004",
      name: "WA-MixedUse-Delta",
      type: "Mixed-Use",
      experience: 85.3,
      accuracy: 86.9,
      overridePattern: "Development potential with highest-best-use analysis",
      sessionCount: 987,
      status: "Tuning",
    },
  ];

  const trainingSessions: TrainingSession[] = [
    {
      id: "session-001",
      agentId: "agent-001",
      scenario: "King County SFR with ADU potential",
      duration: "14m 23s",
      accuracy: 96.7,
      overrides: 3,
      learningPoints: [
        "Zoning overlay consideration for ADU development",
        "Market adjustment for proximity to transit",
        "Condition assessment from aerial imagery",
      ],
      status: "Completed",
    },
    {
      id: "session-002",
      agentId: "agent-002",
      scenario: "Spokane commercial retail strip",
      duration: "22m 41s",
      accuracy: 89.2,
      overrides: 5,
      learningPoints: [
        "CAP rate variance in secondary markets",
        "Vacancy impact on rental income approach",
        "Local market tenant quality assessment",
      ],
      status: "Completed",
    },
    {
      id: "session-003",
      agentId: "agent-003",
      scenario: "Yakima Valley agricultural with water rights",
      duration: "18m 15s",
      accuracy: 91.4,
      overrides: 2,
      learningPoints: [
        "Water rights valuation complexity",
        "Soil classification impact on productivity",
        "Climate change consideration for long-term value",
      ],
      status: "Running",
    },
  ];

  const systemMetrics = {
    totalTrainingForms: 72113,
    activeAgents: 24,
    completedSessions: 8234,
    averageAccuracy: 92.6,
    overridePatternLearning: 97.4,
    neuralModelVersion: "3.6.1",
  };

  const startTraining = () => {
    setIsTraining(true);
    setTimeout(() => setIsTraining(false), 5000); // Simulate training
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
      case "Deployed":
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Training":
      case "Running":
        return "bg-blue-100 text-blue-800";
      case "Tuning":
        return "bg-yellow-100 text-yellow-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Brain className="w-8 h-8 text-purple-600" />
        <div><>

          <h1 className="text-3xl font-bold text-gray-900">
            Neural Appraiser Modeling Engine (NAME)
          </h1>
          <p
</> className="text-gray-600">
            Digital twin agents learning from 72,000+ real-world appraisal forms
          </p>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Training Forms</CardTitle>
            <Database
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-purple-600">
              {systemMetrics.totalTrainingForms.toLocaleString()}
            </div>
            <p
</> className="text-xs text-muted-foreground">Real WA forms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-blue-600">{systemMetrics.activeAgents}</div>
            <p
</> className="text-xs text-muted-foreground">24-core LLM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Activity
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-green-600">
              {systemMetrics.completedSessions.toLocaleString()}
            </div>
            <p
</> className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <Target
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-orange-600">
              {systemMetrics.averageAccuracy}%
            </div>
            <p
</> className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Override Learning</CardTitle>
            <TrendingUp
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-red-600">
              {systemMetrics.overridePatternLearning}%
            </div>
            <p
</> className="text-xs text-muted-foreground">Pattern tuned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Model Version</CardTitle>
            <Sparkles
</> className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-indigo-600">
              {systemMetrics.neuralModelVersion}
            </div>
            <p
</> className="text-xs text-muted-foreground">Latest</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3"><>

          <TabsTrigger value="agents">Neural Agents</TabsTrigger>
          <TabsTrigger
</> value="training">Training Sessions</TabsTrigger>
          <TabsTrigger value="control">Control Center</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader><>

              <CardTitle>Digital Twin Appraiser Agents</CardTitle>
              <CardDescription
</>>
                Autonomous valuation agents trained on real-world WA appraisal patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {neuralAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      activeAgent === agent.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveAgent(agent.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <Brain className="w-5 h-5 text-purple-500" />
                          <div><>

                            <div className="font-medium">{agent.name}</div>
                            <div
</> className="text-sm text-gray-600">{agent.type} Specialist</div>
                          </div>
                          <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                        </div>
                        <div className="text-sm text-gray-700 ml-8">
                          <strong>Override Pattern:</strong> {agent.overridePattern}
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-600 ml-8"><>

                          <span>Sessions: {agent.sessionCount.toLocaleString()}</span>
                          <div
</> className="flex items-center space-x-2"><>

                            <span>Experience:</span>
                            <Progress
</> value={agent.experience} className="w-16 h-2" />
                            <span>{agent.experience}%</span>
                          </div>
                          <div className="flex items-center space-x-2"><>

                            <span>Accuracy:</span>
                            <Progress
</> value={agent.accuracy} className="w-16 h-2" />
                            <span>{agent.accuracy}%</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between"><>

                <span>Training Sessions</span>
                <Button
</> onClick={startTraining} disabled={isTraining}>
                  {isTraining ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Training...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Session
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                Real-time neural appraiser training with scenario-based learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingSessions.map((session) => (
                  <div key={session.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2"><>

                          <Badge variant="outline">{session.id}</Badge>
                          <Badge
</> className={getStatusColor(session.status)}>{session.status}</Badge>
                          <span className="text-sm text-gray-600">
                            Agent: {neuralAgents.find((a) => a.id === session.agentId)?.name}
                          </span>
                        </div>
                        <div><>

                          <div className="font-medium">{session.scenario}</div>
                          <div
</> className="text-sm text-gray-600">
                            Duration: {session.duration} | Accuracy: {session.accuracy}% |
                            Overrides: {session.overrides}
                          </div>
                        </div>
                        <div className="ml-0"><>

                          <div className="text-sm font-medium text-gray-700 mb-1">
                            Learning Points:
                          </div>
                          <ul
</> className="text-sm text-gray-600 space-y-1">
                            {session.learningPoints.map((point /* , index */) => (
                              <li key={index} className="flex items-start">
                                <span className="text-purple-500 mr-2">•</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="control" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><>

                <CardTitle>Training Control</CardTitle>
                <CardDescription
</>>Manage neural appraiser training parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" onClick={startTraining}><>

                  <Play className="w-4 h-4 mr-2" />
                  Start Autonomous Valuation Session
                </Button>
                <Button
</> variant="outline" className="w-full justify-start"><>

                  <Pause className="w-4 h-4 mr-2" />
                  Pause All Training
                </Button>
                <Button
</> variant="outline" className="w-full justify-start"><>

                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Neural Patterns
                </Button>
                <Button
</> variant="outline" className="w-full justify-start">
                  <Zap className="w-4 h-4 mr-2" />
                  Deploy New Agent
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><>

                <CardTitle>System Performance</CardTitle>
                <CardDescription
</>>Real-time neural network metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Override Pattern Learning</span>
                    <span
</>>{systemMetrics.overridePatternLearning}%</span>
                  </div><>

                  <Progress value={systemMetrics.overridePatternLearning} className="h-2" />
                </div>
                <div
</> className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Zoning Tension Recognition</span>
                    <span
</>>94.7%</span>
                  </div><>

                  <Progress value={94.7} className="h-2" />
                </div>
                <div
</> className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Human Logic Replication</span>
                    <span
</>>89.3%</span>
                  </div><>

                  <Progress value={89.3} className="h-2" />
                </div>
                <div
</> className="space-y-2">
                  <div className="flex justify-between text-sm"><>

                    <span>Neural Model Coherence</span>
                    <span
</>>96.1%</span>
                  </div>
                  <Progress value={96.1} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {isTraining && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader><>

                <CardTitle className="text-purple-900">Neural Training in Progress</CardTitle>
                <CardDescription
</> className="text-purple-700">
                  Agent learning from override patterns and zoning tensions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-purple-600 animate-spin" />
                  <div className="text-purple-800">
                    Processing valuation scenarios and building neural pathways...
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
