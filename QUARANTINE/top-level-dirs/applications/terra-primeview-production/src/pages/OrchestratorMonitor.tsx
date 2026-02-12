
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Activity, Bot, CheckCircle, AlertCircle, Clock, Zap, Database, Network  } from '@mui/icons-material';
import { Link } from "react-router-dom";

interface AgentInfo {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  endpoint: string;
  health_status: 'Healthy' | 'Degraded' | 'Unhealthy' | 'Unknown';
  last_heartbeat: string;
  active_tasks: number;
  max_concurrent_tasks: number;
}

interface TaskInfo {
  id: string;
  agent_id: string;
  property_id: string;
  task_type: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Failed' | 'Cancelled';
  created_at: string;
  completed_at?: string;
  duration?: number;
}

const OrchestratorMonitor = () => {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [systemMetrics, setSystemMetrics] = useState({
    totalTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageResponseTime: 0,
    throughputPerMinute: 0
  });

  // Initialize with sample data
  useEffect(() => {
    const sampleAgents: AgentInfo[] = [
      {
        id: "narrator-ai",
        name: "NarratorAI",
        description: "Generates assessment narratives and explanations",
        capabilities: ["PropertyValuation", "NarrativeGeneration"],
        endpoint: "http://localhost:8001",
        health_status: "Healthy",
        last_heartbeat: new Date().toISOString(),
        active_tasks: 2,
        max_concurrent_tasks: 5
      },
      {
        id: "exemption-seer",
        name: "ExemptionSeer",
        description: "Analyzes property exemption eligibility",
        capabilities: ["ExemptionAnalysis", "ComplianceCheck"],
        endpoint: "http://localhost:8002",
        health_status: "Healthy",
        last_heartbeat: new Date().toISOString(),
        active_tasks: 1,
        max_concurrent_tasks: 3
      },
      {
        id: "sales-validator",
        name: "SalesValidator",
        description: "Validates property sales data and market analysis",
        capabilities: ["SalesValidation", "NeighborhoodAnalysis"],
        endpoint: "http://localhost:8003",
        health_status: "Healthy",
        last_heartbeat: new Date().toISOString(),
        active_tasks: 3,
        max_concurrent_tasks: 4
      },
      {
        id: "land-valuation-agent",
        name: "LandValuationAgent",
        description: "Specialized in land value assessment and analysis",
        capabilities: ["LandValuation", "PropertyValuation"],
        endpoint: "http://localhost:8004",
        health_status: "Degraded",
        last_heartbeat: new Date(Date.now() - 120000).toISOString(),
        active_tasks: 1,
        max_concurrent_tasks: 3
      },
      {
        id: "compliance-agent",
        name: "ComplianceAgent",
        description: "Ensures state DOR and legislative compliance",
        capabilities: ["ComplianceCheck", "AuditTrail"],
        endpoint: "http://localhost:8005",
        health_status: "Healthy",
        last_heartbeat: new Date().toISOString(),
        active_tasks: 0,
        max_concurrent_tasks: 2
      }
    ];

    setAgents(sampleAgents);

    // Simulate real-time task updates
    const interval = setInterval(() => {
      // Generate new task
      const newTask: TaskInfo = {
        id: `task-${Date.now()}`,
        agent_id: sampleAgents[Math.floor(Math.random() * sampleAgents.length)].id,
        property_id: `prop-${Math.floor(Math.random() * 1000)}`,
        task_type: ['PropertyValuation', 'ExemptionAnalysis', 'SalesValidation', 'ComplianceCheck'][Math.floor(Math.random() * 4)],
        status: 'Pending',
        created_at: new Date().toISOString()
      };

      setTasks(prev => {
        const updated = [newTask, ...prev];
        
        // Update existing tasks status
        const processed = updated.map(task => {
          if (task.status === 'Pending' && Math.random() > 0.7) {
            return { ...task, status: 'InProgress' as const };
          }
          if (task.status === 'InProgress' && Math.random() > 0.6) {
            return { 
              ...task, 
              status: Math.random() > 0.1 ? 'Completed' as const : 'Failed' as const,
              completed_at: new Date().toISOString(),
              duration: Math.floor(Math.random() * 5000) + 1000
            };
          }
          return task;
        });

        return processed.slice(0, 50); // Keep only last 50 tasks
      });

      // Update system metrics
      setSystemMetrics(prev => ({
        totalTasks: prev.totalTasks + 1,
        activeTasks: Math.floor(Math.random() * 10) + 5,
        completedTasks: prev.completedTasks + (Math.random() > 0.3 ? 1 : 0),
        failedTasks: prev.failedTasks + (Math.random() > 0.9 ? 1 : 0),
        averageResponseTime: 1200 + Math.floor(Math.random() * 800),
        throughputPerMinute: 15 + Math.floor(Math.random() * 10)
      }));

      // Update agent health occasionally
      if (Math.random() > 0.8) {
        setAgents(prev => prev.map(agent => ({
          ...agent,
          health_status: Math.random() > 0.1 ? 'Healthy' as const : 'Degraded' as const,
          last_heartbeat: new Date().toISOString(),
          active_tasks: Math.floor(Math.random() * agent.max_concurrent_tasks)
        })));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'Healthy': return 'bg-green-500';
      case 'Degraded': return 'bg-yellow-500';
      case 'Unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-400';
      case 'Failed': return 'text-red-400';
      case 'InProgress': return 'text-yellow-400';
      case 'Pending': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

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
              <h1 className="text-xl font-bold text-white">Orchestrator Monitor</h1>
            </div>
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
              Live Production
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* System Metrics */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium text-slate-300">Total Tasks</CardTitle>
              <Database
</> className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{systemMetrics.totalTasks}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium text-slate-300">Active</CardTitle>
              <Activity
</> className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{systemMetrics.activeTasks}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium text-slate-300">Completed</CardTitle>
              <CheckCircle
</> className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{systemMetrics.completedTasks}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium text-slate-300">Failed</CardTitle>
              <AlertCircle
</> className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{systemMetrics.failedTasks}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium text-slate-300">Avg Response</CardTitle>
              <Clock
</> className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{systemMetrics.averageResponseTime}ms</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

              <CardTitle className="text-sm font-medium text-slate-300">Throughput</CardTitle>
              <Zap
</> className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{systemMetrics.throughputPerMinute}/min</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10"><>

            <TabsTrigger value="agents" className="text-white data-[state=active]:bg-cyan-500/20">Agent Registry</TabsTrigger>
            <TabsTrigger
</> value="tasks" className="text-white data-[state=active]:bg-cyan-500/20">Task Queue</TabsTrigger>
            <TabsTrigger value="network" className="text-white data-[state=active]:bg-cyan-500/20">Network</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {agents.map((agent) => (
                <Card key={agent.id} className="bg-white/5 border-white/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white flex items-center"><>

                          <div className={`w-3 h-3 rounded-full mr-3 ${getHealthColor(agent.health_status)} ${agent.health_status === 'Healthy' ? 'animate-pulse' : ''}`} />
                          {agent.name}
                        </CardTitle>
                        <CardDescription
</> className="text-slate-300">{agent.description}</CardDescription>
                      </div>
                      <Badge className={`${
                        agent.health_status === 'Healthy' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                        agent.health_status === 'Degraded' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                        'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}>
                        {agent.health_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm"><>

                      <span className="text-slate-300">Active Tasks:</span>
                      <span
</> className="text-white">{agent.active_tasks}/{agent.max_concurrent_tasks}</span>
                    </div>
                    <Progress 
                      value={(agent.active_tasks / agent.max_concurrent_tasks) * 100} 
                      className="bg-white/10" 
                    />
                    <div className="flex justify-between text-sm"><>

                      <span className="text-slate-300">Endpoint:</span>
                      <span
</> className="text-cyan-400 font-mono text-xs">{agent.endpoint}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map((cap) => (
                        <Badge key={cap} variant="outline" className="text-xs border-white/20 text-slate-300">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader><>

                <CardTitle className="text-white">Live Task Queue</CardTitle>
                <CardDescription
</> className="text-slate-300">
                  Real-time task processing and status updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            task.status === 'Completed' ? 'bg-green-400' :
                            task.status === 'Failed' ? 'bg-red-400' :
                            task.status === 'InProgress' ? 'bg-yellow-400 animate-pulse' :
                            'bg-blue-400'
                          }`} />
                          <div><>

                            <p className="text-white font-medium text-sm">{task.task_type}</p>
                            <p
</> className="text-slate-400 text-xs">
                              {task.agent_id} • {task.property_id}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getTaskStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          {task.duration && (
                            <p className="text-slate-400 text-xs mt-1">{task.duration}ms</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network" className="mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Network className="w-5 h-5 mr-2" />
                  Network Topology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg border border-cyan-500/20 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Network className="w-16 h-16 mx-auto mb-4 text-cyan-400" /><>

                    <h3 className="text-xl font-semibold mb-2">Agent Network Visualization</h3>
                    <p
</> className="text-slate-300">Interactive network topology showing agent connections and data flow</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrchestratorMonitor;
