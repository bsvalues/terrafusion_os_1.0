import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Bot, Activity, CheckCircle, AlertCircle, Clock, TrendingUp, Code  } from '@mui/icons-material';
import { Link } from "react-router-dom";
import AgentImplementation from "@/components/AgentImplementation";

const AgentDashboard = () => {
  const [systemMetrics, setSystemMetrics] = useState({
    activeAgents: 12,
    tasksCompleted: 847,
    accuracy: 98.4,
    uptime: 99.9
  });

  const [activityFeed, setActivityFeed] = useState<Array<{
    id: string;
    agent: string;
    action: string;
    status: 'completed' | 'running' | 'error';
    time: string;
  }>>([]);

  const agents = [
    { name: "LandValuationAgent", status: "active", accuracy: 98.7, tasksToday: 156 },
    { name: "SalesValidationAgent", status: "active", accuracy: 97.2, tasksToday: 89 },
    { name: "IncomeEvalAgent", status: "active", accuracy: 99.1, tasksToday: 45 },
    { name: "StatisticalRatioStudyAgent", status: "active", accuracy: 96.8, tasksToday: 23 },
    { name: "StateDORComplianceAgent", status: "idle", accuracy: 98.9, tasksToday: 12 },
    { name: "LegislativeComplianceAgent", status: "active", accuracy: 99.3, tasksToday: 8 },
    { name: "AuditTrailAgent", status: "active", accuracy: 99.8, tasksToday: 134 },
    { name: "BusinessPersonalPropertyAgent", status: "idle", accuracy: 97.5, tasksToday: 67 },
    { name: "AgricultureValuationAgent", status: "active", accuracy: 98.1, tasksToday: 34 },
    { name: "ImprovementDetailsAgent", status: "active", accuracy: 97.9, tasksToday: 178 },
    { name: "ImprovementFeaturesAgent", status: "active", accuracy: 98.5, tasksToday: 145 },
    { name: "NeighborhoodClusteringAgent", status: "running", accuracy: 99.2, tasksToday: 56 },
    { name: "ExemptionSeer", status: "active", accuracy: 98.6, tasksToday: 23 },
    { name: "TerraNarrator", status: "active", accuracy: 99.4, tasksToday: 67 },
    { name: "AdminAgent", status: "active", accuracy: 99.7, tasksToday: 89 }
  ];

  useEffect(() => {
    // Simulate real-time activity
    const interval = setInterval(() => {
      const newActivity = {
        id: Date.now().toString(),
        agent: agents[Math.floor(Math.random() * agents.length)].name,
        action: [
          "completed parcel valuation",
          "validated sales comparison",
          "processed improvement analysis",
          "generated compliance report",
          "updated neighborhood statistics"
        ][Math.floor(Math.random() * 5)],
        status: Math.random() > 0.1 ? 'completed' : 'running' as 'completed' | 'running',
        time: new Date().toLocaleTimeString()
      };

      setActivityFeed(prev => [newActivity, ...prev.slice(0, 19)]);
      
      // Update metrics
      setSystemMetrics(prev => ({
        ...prev,
        tasksCompleted: prev.tasksCompleted + 1,
        accuracy: 98 + Math.random() * 2
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Suite
                </Button>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <h1 className="text-xl font-bold text-white">AI Agent Command Center</h1>
            </div>
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
              System Online
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* System Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium text-slate-300">Active Agents</CardTitle>
              <Bot
</> className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold text-white">{systemMetrics.activeAgents}</div>
              <p
</> className="text-xs text-slate-400">of 15 total agents</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium text-slate-300">Tasks Completed</CardTitle>
              <CheckCircle
</> className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold text-white">{systemMetrics.tasksCompleted.toLocaleString()}</div>
              <p
</> className="text-xs text-slate-400">today</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium text-slate-300">Accuracy Rate</CardTitle>
              <TrendingUp
</> className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold text-white">{systemMetrics.accuracy.toFixed(1)}%</div>
              <p
</> className="text-xs text-slate-400">average across all agents</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium text-slate-300">System Uptime</CardTitle>
              <Activity
</> className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent><>

              <div className="text-2xl font-bold text-white">{systemMetrics.uptime}%</div>
              <p
</> className="text-xs text-slate-400">last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard with Tabs */}
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10"><>

            <TabsTrigger value="status" className="text-white data-[state=active]:bg-cyan-500/20">Agent Status</TabsTrigger>
            <TabsTrigger
</> value="activity" className="text-white data-[state=active]:bg-cyan-500/20">Live Activity</TabsTrigger><>

            <TabsTrigger value="implementations" className="text-white data-[state=active]:bg-cyan-500/20">Implementations</TabsTrigger>
            <TabsTrigger
</> value="orchestrator" className="text-white data-[state=active]:bg-cyan-500/20">Orchestrator</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Agent Status Panel */}
              <div className="lg:col-span-2">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader><>

                    <CardTitle className="text-white">Agent Status Overview</CardTitle>
                    <CardDescription
</> className="text-slate-300">
                      Real-time monitoring of all Terrafusion AI agents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {agents.map((agent /* , index */) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                agent.status === 'active' ? 'bg-green-400 animate-pulse' :
                                agent.status === 'running' ? 'bg-yellow-400 animate-pulse' :
                                'bg-slate-400'
                              }`} />
                              <div><>

                                <p className="text-white font-medium">{agent.name}</p>
                                <p
</> className="text-slate-400 text-sm">
                                  {agent.tasksToday} tasks today • {agent.accuracy}% accuracy
                                </p>
                              </div>
                            </div>
                            <Badge variant={
                              agent.status === 'active' ? 'default' :
                              agent.status === 'running' ? 'secondary' :
                              'outline'
                            } className={
                              agent.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                              agent.status === 'running' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                              'bg-slate-500/20 text-slate-300 border-slate-500/30'
                            }>
                              {agent.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* System Controls */}
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">System Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3"><>

                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                      Deploy All Agents
                    </Button>
                    <Button
</> variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      Generate System Report
                    </Button>
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      Agent Configuration
                    </Button>
                  </CardContent>
                </Card>

                {/* Performance Metrics */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2"><>

                        <span className="text-slate-300">CPU Usage</span>
                        <span
</> className="text-cyan-400">34%</span>
                      </div><>

                      <Progress value={34} className="bg-white/10" />
                    </div>
                    <div
</>>
                      <div className="flex justify-between text-sm mb-2"><>

                        <span className="text-slate-300">Memory Usage</span>
                        <span
</> className="text-cyan-400">67%</span>
                      </div><>

                      <Progress value={67} className="bg-white/10" />
                    </div>
                    <div
</>>
                      <div className="flex justify-between text-sm mb-2"><>

                        <span className="text-slate-300">Network I/O</span>
                        <span
</> className="text-cyan-400">23%</span>
                      </div>
                      <Progress value={23} className="bg-white/10" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center"><>

                  <Activity className="w-5 h-5 mr-2 text-cyan-400" />
                  Live Activity Feed
                </CardTitle>
                <CardDescription
</> className="text-slate-300">
                  Real-time agent activity and task completion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {activityFeed.map((activity /* , index */) => (
                      <div key={activity.id} className={`p-3 rounded border ${
                        activity.status === 'completed' ? 'bg-green-500/10 border-green-500/20' :
                        activity.status === 'running' ? 'bg-yellow-500/10 border-yellow-500/20' :
                        'bg-red-500/10 border-red-500/20'
                      }`}>
                        <div className="flex items-center space-x-2">
                          {activity.status === 'completed' ? (
                            <CheckCircle className="w-3 h-3 text-green-400" />
                          ) : activity.status === 'running' ? (
                            <Clock className="w-3 h-3 text-yellow-400" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-400" />
                          )}
                          <span className="text-white font-medium">{activity.agent}</span>
                        </div><>

                        <p className="text-slate-300 mt-1">{activity.action}</p>
                        <p
</> className="text-slate-400 text-xs mt-1">{activity.time}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="implementations" className="mt-6"><>

            <AgentImplementation />
          </TabsContent>

          <TabsContent
</> value="orchestrator" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center"><>

                  <Code className="w-5 h-5 mr-2 text-cyan-400" />
                  Rust Orchestrator Integration
                </CardTitle>
                <CardDescription
</> className="text-slate-300">
                  Production-ready agent coordination infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3"><>

                    <h4 className="text-white font-semibold">Core Features</h4>
                    <ul
</> className="text-slate-300 space-y-2 text-sm"><>

                      <li>• Dynamic agent registry and health monitoring</li>
                            <li
</>>• Async task orchestration with retry logic</li><>

                      <li>• Load balancing and capacity management</li>
                            <li
</>>• Real-time status tracking and notifications</li>
                    </ul>
                  </div>
                  <div className="space-y-3"><>

                    <h4 className="text-white font-semibold">Production Ready</h4>
                    <ul
</> className="text-slate-300 space-y-2 text-sm"><>

                      <li>• HTTP client with configurable timeouts</li>
                            <li
</>>• Comprehensive error handling and logging</li><>

                      <li>• Graceful shutdown and resource cleanup</li>
                            <li
</>>• Metrics collection and monitoring</li>
                    </ul>
                  </div>
                </div>
                
                <div className="p-4 bg-black/30 rounded-lg border border-cyan-500/20"><>

                  <h4 className="text-cyan-400 font-semibold mb-2">Orchestrator Status</h4>
                  <div
</> className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between"><>

                      <span className="text-slate-300">Registry:</span>
                      <span
</> className="text-green-400">Online</span>
                    </div>
                    <div className="flex justify-between"><>

                      <span className="text-slate-300">Task Queue:</span>
                      <span
</> className="text-green-400">Processing</span>
                    </div>
                    <div className="flex justify-between"><>

                      <span className="text-slate-300">Health Monitor:</span>
                      <span
</> className="text-green-400">Active</span>
                    </div>
                    <div className="flex justify-between"><>

                      <span className="text-slate-300">Endpoints:</span>
                      <span
</> className="text-cyan-400">5 Active</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                  View Full Orchestrator Monitor
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentDashboard;
