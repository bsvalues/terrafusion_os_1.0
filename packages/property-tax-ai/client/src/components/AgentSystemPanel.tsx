import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, Square, FileText, Activity, Database, BarChart } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Agent, AgentSystemStatus, AgentCapability, ExecuteCapabilityRequest, ExecuteCapabilityResponse } from '@/types/agent-types';

/**
 * Agent System Panel Component
 * 
 * This component provides a UI for interacting with the MCP Agent System,
 * including system status, agent control, and capability execution.
 */
export function AgentSystemPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [capabilityParams, setCapabilityParams] = useState<Record<string, unknown>>({});
  const [capabilityResult, setCapabilityResult] = useState<unknown>(null);
  const [executing, setExecuting] = useState(false);

  // Fetch system status
  const { data: systemStatus, isLoading: statusLoading, error: statusError } = useQuery<AgentSystemStatus>({
    queryKey: ['/api/agents/status'],
    refetchInterval: 10000, // Refresh every 10 seconds
    queryFn: () => apiRequest('/api/agents/status')
  });
  
  // Convert agent object to array if needed
  const agentsArray = React.useMemo<Agent[]>(() => {
    if (!systemStatus?.agents) return [];
    
    // Check if agents is already an array
    if (Array.isArray(systemStatus.agents)) {
      return systemStatus.agents;
    }
    
    // Convert object to array
    return Object.entries(systemStatus.agents).map(([name, agent]) => ({
      name,
      ...agent,
    }));
  }, [systemStatus]);

  // Initialize agent system 
  const initMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/agents/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast({
        title: "Agent System Initialized",
        description: "The MCP Agent System has been successfully initialized.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/status'] });
    },
    onError: (error) => {
      toast({
        title: "Initialization Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Start all agents
  const startAgentsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/agents/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast({
        title: "Agents Started",
        description: "All agents in the MCP system have been started.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/status'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Start Agents",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Stop all agents
  const stopAgentsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/agents/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast({
        title: "Agents Stopped",
        description: "All agents in the MCP system have been stopped.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/status'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Stop Agents",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Execute capability
  const executeCapability = async () => {
    if (!selectedAgent || !selectedCapability) return;
    
    setExecuting(true);
    setCapabilityResult(null);
    
    try {
      const result = await apiRequest('/api/agents/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: selectedAgent,
          capability: selectedCapability,
          parameters: capabilityParams
        })
      });
      
      setCapabilityResult(result);
      
      toast({
        title: "Capability Executed",
        description: `Successfully executed ${selectedCapability} on ${selectedAgent} agent.`,
      });
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  };

  // Get agent icon based on name
  const getAgentIcon = (agentName: string) => {
    switch (agentName) {
      case 'property_assessment':
        return <FileText className="h-5 w-5" />;
      case 'data_ingestion':
        return <Database className="h-5 w-5" />;
      case 'reporting':
        return <BarChart className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  // Get agent capabilities based on selected agent
  const getAgentCapabilities = () => {
    if (!systemStatus || !selectedAgent) return [];
    
    const agent = agentsArray.find((a: any) => a.name === selectedAgent);
    return agent?.capabilities || [];
  };

  // Get capability parameter fields based on selected capability
  const getCapabilityParams = () => {
    const capabilities = getAgentCapabilities();
    if (!capabilities.length || !selectedCapability) return [];
    
    const capability = capabilities.find((c: any) => c.name === selectedCapability);
    return capability?.parameters || [];
  };

  // Update capability parameters
  const handleParamChange = (paramName: string, value: any) => {
    setCapabilityParams(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  useEffect(() => {
    // Reset capability-related state when agent changes
    setSelectedCapability(null);
    setCapabilityParams({});
    setCapabilityResult(null);
  }, [selectedAgent]);

  useEffect(() => {
    // Reset parameters when capability changes
    setCapabilityParams({});
    setCapabilityResult(null);
  }, [selectedCapability]);

  // Determine if system is ready (all agents initialized and not in pending state)
  const isSystemReady = () => {
    if (!systemStatus) return false;
    return systemStatus.isInitialized && 
           agentsArray.every((agent: Agent) => agent.status !== 'pending');
  };

  // Get status badge for an agent
  const getStatusBadge = (status: string) => {
    let variant = "default";
    switch (status) {
      case 'online':
        variant = "success";
        break;
      case 'offline':
        variant = "destructive";
        break;
      case 'pending':
        variant = "warning";
        break;
      default:
        variant = "secondary";
    }
    
    return (
      <Badge variant={variant as any}>
        {status}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>MCP Agent System</CardTitle>
        <CardDescription>
          Model Context Protocol Agent System for Property Assessment and Analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status">
          <TabsList className="mb-4">
            <TabsTrigger value="status">System Status</TabsTrigger>
            <TabsTrigger value="control">Agent Control</TabsTrigger>
            <TabsTrigger value="execute">Execute Capability</TabsTrigger>
          </TabsList>
          
          {/* System Status Tab */}
          <TabsContent value="status" className="space-y-4">
            {statusLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : statusError ? (
              <div className="text-center py-4 text-destructive">
                Error loading system status
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium">System State</h3>
                    <p className="text-lg font-semibold">
                      {systemStatus?.isInitialized ? 'Initialized' : 'Not Initialized'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Active Agents</h3>
                    <p className="text-lg font-semibold">
                      {agentsArray.filter((a: Agent) => a.status === 'online').length || 0} / {agentsArray.length || 0}
                    </p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <h3 className="font-medium mb-2">Agents</h3>
                <div className="space-y-3">
                  {agentsArray.map((agent: Agent) => (
                    <div key={agent.name} className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                      <div className="flex items-center gap-3">
                        {getAgentIcon(agent.name)}
                        <div>
                          <p className="font-medium">{agent.displayName}</p>
                          <p className="text-sm text-muted-foreground">{agent.capabilities?.length || 0} capabilities</p>
                        </div>
                      </div>
                      {getStatusBadge(agent.status)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
          
          {/* Agent Control Tab */}
          <TabsContent value="control" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Button 
                onClick={() => initMutation.mutate()}
                disabled={initMutation.isPending || (systemStatus?.isInitialized === true)}
                className="w-full"
                variant="outline"
              >
                {initMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Initialize Agent System
              </Button>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => startAgentsMutation.mutate()}
                  disabled={startAgentsMutation.isPending || !systemStatus?.isInitialized}
                  className="w-full"
                  variant="outline"
                >
                  {startAgentsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Start All Agents
                </Button>
                
                <Button 
                  onClick={() => stopAgentsMutation.mutate()}
                  disabled={stopAgentsMutation.isPending || !systemStatus?.isInitialized}
                  className="w-full" 
                  variant="outline"
                >
                  {stopAgentsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
                  Stop All Agents
                </Button>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Agent Status</h3>
                {statusLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {agentsArray.map((agent: Agent) => (
                      <div key={agent.name} className="flex items-center justify-between bg-muted/30 p-2 rounded">
                        <span>{agent.displayName}</span>
                        {getStatusBadge(agent.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Execute Capability Tab */}
          <TabsContent value="execute" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Agent Selection */}
              <div>
                <label htmlFor="agent-select" className="block text-sm font-medium mb-2">
                  Select Agent
                </label>
                <select
                  id="agent-select"
                  value={selectedAgent || ''}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  disabled={!isSystemReady()}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">-- Select an agent --</option>
                  {agentsArray.map((agent: Agent) => (
                    <option key={agent.name} value={agent.name}>
                      {agent.displayName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Capability Selection (only if agent is selected) */}
              {selectedAgent && (
                <div>
                  <label htmlFor="capability-select" className="block text-sm font-medium mb-2">
                    Select Capability
                  </label>
                  <select
                    id="capability-select"
                    value={selectedCapability || ''}
                    onChange={(e) => setSelectedCapability(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">-- Select a capability --</option>
                    {getAgentCapabilities().map((capability: AgentCapability) => (
                      <option key={capability.name} value={capability.name}>
                        {capability.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Capability Parameters (only if capability is selected) */}
              {selectedCapability && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Parameters</h3>
                  {getCapabilityParams().length === 0 ? (
                    <p className="text-sm text-muted-foreground">No parameters required</p>
                  ) : (
                    <div className="space-y-3">
                      {getCapabilityParams().map((param: AgentCapabilityParameter) => (
                        <div key={param.name}>
                          <label htmlFor={`param-${param.name}`} className="block text-sm font-medium mb-1">
                            {param.displayName || param.name} 
                            {param.required && <span className="text-destructive ml-1">*</span>}
                          </label>
                          {param.type === 'boolean' ? (
                            <input
                              type="checkbox"
                              id={`param-${param.name}`}
                              checked={!!capabilityParams[param.name]}
                              onChange={(e) => handleParamChange(param.name, e.target.checked)}
                            />
                          ) : param.type === 'number' ? (
                            <input
                              type="number"
                              id={`param-${param.name}`}
                              value={capabilityParams[param.name] || ''}
                              onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          ) : (
                            <input
                              type="text"
                              id={`param-${param.name}`}
                              value={capabilityParams[param.name] || ''}
                              onChange={(e) => handleParamChange(param.name, e.target.value)}
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          )}
                          {param.description && (
                            <p className="text-xs text-muted-foreground mt-1">{param.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Button
                    onClick={executeCapability}
                    disabled={executing || !selectedAgent || !selectedCapability}
                    className="w-full mt-4"
                  >
                    {executing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Execute Capability
                  </Button>
                </div>
              )}
              
              {/* Capability Result (only if there's a result) */}
              {capabilityResult && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Result</h3>
                  <div className="p-3 bg-muted rounded-md">
                    <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                      {JSON.stringify(capabilityResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          MCP Agent System v1.0.0
        </div>
        <div className="text-sm">
          {statusLoading ? (
            <span className="flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" /> Checking status...
            </span>
          ) : systemStatus?.isInitialized ? (
            <span className="text-green-600">System Ready</span>
          ) : (
            <span className="text-amber-600">Not Initialized</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}