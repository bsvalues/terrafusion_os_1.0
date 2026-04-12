/**
 * TerraBuild AI Swarm - Dashboard Component
 *
 * This component displays the status of the AI Swarm and provides controls
 * for running various swarm and agent tasks.
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSwarmStatus, runDemoWorkflow, shutdownSwarm } from '@/lib/swarmClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
  const activeAgents = statusData?.status?.activeAgents || 0;
  const idleAgents = statusData?.status?.idleAgents || 0;
  const busyAgents = statusData?.status?.busyAgents || 0;
  const pendingTasks = statusData?.status?.pendingTasks || 0;
  const successRate = statusData?.status?.successRate || 0;
  const throughput = statusData?.status?.throughputPerMinute || 0;

  return (
    <div className="space-y-4">
      {/* Swarm metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Total Agents</div>
            <div className="text-2xl font-bold">{agentCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Active / Idle</div>
            <div className="text-2xl font-bold">
              <span className="text-green-500">{activeAgents}</span>
              <span className="text-muted-foreground text-lg"> / </span>
              <span className="text-slate-400">{idleAgents}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Success Rate</div>
            <div className="text-2xl font-bold">{(successRate * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-xs text-muted-foreground">Throughput/min</div>
            <div className="text-2xl font-bold">{throughput.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Swarm Control Panel</CardTitle>
          <CardDescription>
            Manage and monitor the TerraFusion OS AI agent swarm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Badge variant={isActive ? "success" : "outline"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
              <span className="text-sm text-gray-500">
                {agentCount.toLocaleString()} agents | {busyAgents} busy | {pendingTasks} pending
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!isActive || shutdownMutation.isPending}
              onClick={handleShutdown}
            >
              {shutdownMutation.isPending ? "Shutting down..." : "Shutdown Swarm"}
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
              <SwarmTaskRunner isActive={isActive ?? false} />
            </TabsContent>

            <TabsContent value="demos" className="space-y-4">
              <h3 className="text-lg font-medium mt-4">Run Demo Workflows</h3>
              <p className="text-sm text-gray-500 mb-4">
                Execute predefined workflows to demonstrate AI Swarm capabilities
              </p>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Cost Assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-gray-500">
                      Demonstrates cost factor tuning and result validation
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      disabled={!isActive || demoMutation.isPending}
                      onClick={() => handleRunDemo('cost-assessment')}
                    >
                      Run Demo
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Scenario Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-gray-500">
                      Demonstrates scenario creation, analysis, and comparison
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      disabled={!isActive || demoMutation.isPending}
                      onClick={() => handleRunDemo('scenario-analysis')}
                    >
                      Run Demo
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Sensitivity Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-gray-500">
                      Demonstrates cost curve training and sensitivity analysis
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      disabled={!isActive || demoMutation.isPending}
                      onClick={() => handleRunDemo('sensitivity-analysis')}
                    >
                      Run Demo
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">BOE Appeal</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-gray-500">
                      Generates persuasive appeal arguments for Board of Equalization hearings
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      disabled={!isActive || demoMutation.isPending}
                      onClick={() => handleRunDemo('boe-appeal')}
                    >
                      Run Demo
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Property Enhancement</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-xs text-gray-500">
                      Recommends property improvements and forecasts ROI and future values
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      size="sm"
                      disabled={!isActive || demoMutation.isPending}
                      onClick={() => handleRunDemo('cost-assessment')}
                    >
                      Run Demo
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
