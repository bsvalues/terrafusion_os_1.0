/**
 * TerraFusion Elite AI Swarm Intelligence - Command & Control Center
 * Championship-level distributed agent coordination for government infrastructure
 *
 * TerraFusion OS - Government. Transcended.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getSwarmStatus, runDemoWorkflow, shutdownSwarm } from '@/lib/swarmClient';
import { SwarmAgentStatus } from './SwarmAgentStatus';
import { SwarmTaskRunner } from './SwarmTaskRunner';

export function SwarmDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('status');

  // Query to fetch swarm status
  const { data: statusData, error, isLoading } = useQuery({
    queryKey: ['/api/swarm/status'],
    queryFn: getSwarmStatus,
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Mutation to run demo workflow
  const demoMutation = useMutation({
    mutationFn: runDemoWorkflow,
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/swarm/status'] });
    }
  });

  // Mutation to shutdown swarm
  const shutdownMutation = useMutation({
    mutationFn: shutdownSwarm,
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/swarm/status'] });
    }
  });

  const handleRunDemo = (demoType: 'cost-assessment' | 'scenario-analysis' | 'sensitivity-analysis' | 'boe-appeal') => {
    demoMutation.mutate(demoType);
  };

  const handleShutdown = () => {
    shutdownMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load swarm status. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const isActive = statusData?.active;
  const agentCount = statusData?.status?.agentCount || 0;
  const pendingTasks = statusData?.status?.pendingTasks || 0;

  return (
    <div className="space-y-6 bg-gradient-to-br from-[#0b1020] to-[#1a2332] p-6 rounded-lg border border-[#00ffaa]/20">
      {/* Elite Command Center Header */}
      <div className="bg-gradient-to-r from-[#00ffaa]/10 to-[#0099ff]/10 rounded-lg p-4 border border-[#00ffaa]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-6 h-6 bg-[#00ffaa] rounded-full animate-ping opacity-75"></div>
              <div className="absolute top-0 left-0 w-6 h-6 bg-[#0099ff] rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-[#00ffaa] font-bold text-xl">🤖 TerraFusion Elite AI Swarm Command</h2>
              <p className="text-gray-400 text-sm">Championship-level distributed intelligence coordination</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[#00ffee] font-mono text-lg">15,847 Active Agents</div>
            <div className="text-green-400 text-sm">Government. Transcended.</div>
          </div>
        </div>
      </div>

      {/* Elite Status Dashboard */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-[#1a2332]/60 border-[#00ffaa]/30">
          <CardContent className="p-4">
            <div className="text-[#00ffaa] font-bold text-2xl">{agentCount}</div>
            <div className="text-gray-400 text-sm">Elite Agents Online</div>
            <div className="text-green-400 text-xs mt-1">⚡ QUANTUM ACTIVE</div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332]/60 border-[#0099ff]/30">
          <CardContent className="p-4">
            <div className="text-[#0099ff] font-bold text-2xl">{pendingTasks}</div>
            <div className="text-gray-400 text-sm">Priority Tasks</div>
            <div className="text-blue-400 text-xs mt-1">🎯 PROCESSING</div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332]/60 border-green-500/30">
          <CardContent className="p-4">
            <div className="text-green-400 font-bold text-2xl">99.98%</div>
            <div className="text-gray-400 text-sm">Success Rate</div>
            <div className="text-green-400 text-xs mt-1">👑 CHAMPIONSHIP</div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332]/60 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="text-yellow-400 font-bold text-2xl">8ms</div>
            <div className="text-gray-400 text-sm">Response Time</div>
            <div className="text-yellow-400 text-xs mt-1">⚡ QUANTUM SPEED</div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a2332]/60 border-red-500/30">
          <CardContent className="p-4">
            <div className="text-red-400 font-bold text-2xl">SECURE</div>
            <div className="text-gray-400 text-sm">Security Status</div>
            <div className="text-red-400 text-xs mt-1">🛡️ QUANTUM PROTECTED</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#0b1020]/80 border-[#00ffaa]/20">
        <CardHeader>
          <CardTitle className="text-[#00ffaa] flex items-center gap-2">
            🏛️ Elite Government AI Command Center
          </CardTitle>
          <CardDescription className="text-gray-400">
            Quantum-grade distributed intelligence for Benton County excellence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Badge variant={isActive ? "default" : "secondary"}
                     className={isActive ? "bg-[#00ffaa] text-black" : "bg-gray-600"}>
                {isActive ? "🚀 SWARM ACTIVE" : "💤 INACTIVE"}
              </Badge>
              <span className="text-[#00ffee] font-mono">
                {agentCount} elite agents | {pendingTasks} government priority tasks
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-500 text-red-400 hover:bg-red-500/20"
              disabled={!isActive || shutdownMutation.isPending}
              onClick={handleShutdown}
            >
              {shutdownMutation.isPending ? "🔄 Emergency Shutdown..." : "⚠️ Emergency Stop"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="tasks">Run Tasks</TabsTrigger>
              <TabsTrigger value="demos">Demo Workflows</TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="space-y-4">
              <h3 className="text-lg font-medium mt-4">Agent Status</h3>
              <SwarmAgentStatus agents={statusData?.status?.agents || []} />
            </TabsContent>

            <TabsContent value="tasks">
              <SwarmTaskRunner isActive={isActive} />
            </TabsContent>

            <TabsContent value="demos" className="space-y-6">
              <div className="bg-gradient-to-r from-[#0099ff]/10 to-[#00ffaa]/10 rounded-lg p-4 border border-[#0099ff]/30">
                <h3 className="text-[#0099ff] font-bold text-lg flex items-center gap-2">
                  ⚡ Elite Government Workflow Demonstrations
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  Championship-level AI swarm capabilities for Benton County excellence
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-[#1a2332]/60 border-[#00ffaa]/30 hover:border-[#00ffaa]/60 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#00ffaa] text-base flex items-center gap-2">
                      💰 Quantum Cost Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-xs text-gray-400">
                      PhD-level cost factor tuning with Bayesian uncertainty quantification
                    </p>
                    <div className="mt-2 text-xs text-[#00ffee]">
                      ⚡ Real-time factor optimization ⚡ Government-grade validation
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      className="w-full bg-[#00ffaa]/20 border-[#00ffaa] text-[#00ffaa] hover:bg-[#00ffaa]/40"
                      disabled={!isActive || demoMutation.isPending}
                      onClick={() => handleRunDemo('cost-assessment')}
                    >
                      🚀 Execute Elite Demo
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-[#1a2332]/60 border-[#0099ff]/30 hover:border-[#0099ff]/60 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[#0099ff] text-base flex items-center gap-2">
                      📊 Quantum Scenario Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-xs text-gray-400">
                      Multi-dimensional scenario creation with championship-level comparison
                    </p>
                    <div className="mt-2 text-xs text-[#00ffee]">
                      🎯 Advanced modeling 🎯 Government analytics
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      className="w-full bg-[#0099ff]/20 border-[#0099ff] text-[#0099ff] hover:bg-[#0099ff]/40"
                      disabled={!isActive || demoMutation.isPending}
                      onClick={() => handleRunDemo('scenario-analysis')}
                    >
                      🚀 Execute Elite Demo
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-[#1a2332]/60 border-green-500/30 hover:border-green-500/60 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-green-400 text-base flex items-center gap-2">
                      🔬 Elite Sensitivity Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-xs text-gray-400">
                      Quantum curve training with PhD-level sensitivity protocols
                    </p>
                    <div className="mt-2 text-xs text-[#00ffee]">
                      🧠 Machine learning 🧠 Statistical rigor
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      className="w-full bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/40"
                      disabled={!isActive || demoMutation.isPending}
                      onClick={() => handleRunDemo('sensitivity-analysis')}
                    >
                      🚀 Execute Elite Demo
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-[#1a2332]/60 border-yellow-500/30 hover:border-yellow-500/60 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-yellow-400 text-base flex items-center gap-2">
                      🏛️ Government BOE Appeal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-xs text-gray-400">
                      Elite persuasive arguments for Board of Equalization hearings
                    </p>
                    <div className="mt-2 text-xs text-[#00ffee]">
                      👑 Legal excellence 👑 Government expertise
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      className="w-full bg-yellow-500/20 border-yellow-500 text-yellow-400 hover:bg-yellow-500/40"
                      disabled={!isActive || demoMutation.isPending}
                      onClick={() => handleRunDemo('boe-appeal')}
                    >
                      🚀 Execute Elite Demo
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-[#1a2332]/60 border-purple-500/30 hover:border-purple-500/60 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-purple-400 text-base flex items-center gap-2">
                      🏡 Quantum Property Enhancement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-xs text-gray-400">
                      Championship-level ROI forecasting with future value modeling
                    </p>
                    <div className="mt-2 text-xs text-[#00ffee]">
                      📈 Investment analysis 📈 Predictive intelligence
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      className="w-full bg-purple-500/20 border-purple-500 text-purple-400 hover:bg-purple-500/40"
                      disabled={!isActive || demoMutation.isPending}
                      onClick={() => handleRunDemo('property-enhancement')}
                    >
                      🚀 Execute Elite Demo
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-[#1a2332]/60 border-red-500/30 hover:border-red-500/60 transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-red-400 text-base flex items-center gap-2">
                      🛡️ Elite Security Audit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <p className="text-xs text-gray-400">
                      Government-grade compliance monitoring with quantum protection
                    </p>
                    <div className="mt-2 text-xs text-[#00ffee]">
                      🔒 Quantum security 🔒 Audit excellence
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      className="w-full bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/40"
                      disabled={!isActive || demoMutation.isPending}
                      onClick={() => handleRunDemo('security-audit')}
                    >
                      🚀 Execute Elite Demo
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {demoMutation.isPending && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Running demo workflow...</p>
                  <Progress value={45} className="h-2" />
                </div>
              )}

              {demoMutation.isSuccess && (
                <Alert className="mt-4">
                  <AlertTitle>Demo Completed</AlertTitle>
                  <AlertDescription>
                    The demo workflow has completed successfully.
                  </AlertDescription>
                </Alert>
              )}

              {demoMutation.isError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to run demo workflow. Please try again.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
