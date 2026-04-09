/**
 * Agent Control Panel Component
 * 
 * Provides a user interface for interacting with and managing the agent system.
 * Displays agent information, allows sending commands to agents, and manages agent tasks.
 */

import { useState, useEffect } from 'react';
import { useAgentWebSocket, type ConnectionStatus } from '@/hooks/use-agent-websocket';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AgentMessageLog } from './agent-message-log';
import { AgentSystemStatus } from './agent-system-status';
import { ConnectionStatusIndicator } from './connection-status-indicator';
import {
  RefreshCw,
  Send,
  Bot,
  X,
  Play,
  Pause,
  Terminal,
  Settings,
  Code,
  MessagesSquare,
  PlusCircle,
  ListPlus,
  Info
} from 'lucide-react';
import { agentWebSocketService } from '@/services/agent-websocket-service';

// Agent interface
interface Agent {
  id: number;
  agentId: string;
  name: string;
  type: string;
  status: string;
  description: string;
  capabilities: string[];
}

// Task interface
interface Task {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedTo: string;
  description: string;
  createdAt: string;
  completedAt?: string;
  priority: number;
}

export function AgentControlPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [command, setCommand] = useState<string>('');
  const [commandParams, setCommandParams] = useState<string>('{}');
  const [loadingAgents, setLoadingAgents] = useState<boolean>(false);
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [sendingCommand, setSendingCommand] = useState<boolean>(false);
  const { connectionStatus, sendActionRequest } = useAgentWebSocket({ autoConnect: true, showToasts: true });
  const { toast } = useToast();

  // Fetch agents from API
  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const response = await fetch('/api/ai-agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
        // Auto-select the first agent if none is selected
        if (data.length > 0 && !selectedAgent) {
          setSelectedAgent(data[0].agentId);
        }
      } else {
        console.error('Failed to fetch agents:', await response.text());
        toast({
          title: 'Error',
          description: 'Failed to fetch agents. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: 'Error',
        description: 'Could not connect to the agent API.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAgents(false);
    }
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        console.error('Failed to fetch tasks:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Handle command submission
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !command) return;

    setSendingCommand(true);
    try {
      // Parse command parameters
      let params = {};
      try {
        params = JSON.parse(commandParams);
      } catch (error) {
        toast({
          title: 'Invalid Parameters',
          description: 'Please provide valid JSON for the command parameters.',
          variant: 'destructive',
        });
        return;
      }

      // Send command to the selected agent
      await sendActionRequest(selectedAgent, command, params);
      
      toast({
        title: 'Command Sent',
        description: `Successfully sent "${command}" to ${selectedAgent}`,
      });
      
      // Clear command input after sending
      setCommand('');
      setCommandParams('{}');
    } catch (error) {
      console.error('Error sending command:', error);
      toast({
        title: 'Command Failed',
        description: `Failed to send command to agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setSendingCommand(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    // Initial data load
    fetchAgents();
    fetchTasks();
    
    console.log(`[Agent UI] Setting up polling with connection status: ${connectionStatus}`);
    
    // Always poll for data regardless of WebSocket connection status
    // This ensures the UI stays responsive even if the WebSocket is having issues
    const pollingInterval = setInterval(() => {
      console.log(`[Agent UI] Polling for data (connection: ${connectionStatus})`);
      fetchAgents();
      fetchTasks();
    }, connectionStatus === 'connected' ? 10000 : 3000);
    
    // Clean up interval on unmount
    return () => {
      clearInterval(pollingInterval);
    };
  }, [connectionStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agent Control Panel</h2>
          <p className="text-muted-foreground">
            Monitor and control the multi-agent system
          </p>
        </div>
        <AgentSystemStatus />
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">
            <Bot className="h-4 w-4 mr-2" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListPlus className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="console">
            <Terminal className="h-4 w-4 mr-2" />
            Console
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Available Agents</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchAgents}
              disabled={loadingAgents}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingAgents ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className={selectedAgent === agent.agentId ? 'border-primary' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-md">{agent.name}</CardTitle>
                    <Button 
                      variant={selectedAgent === agent.agentId ? "default" : "ghost"} 
                      size="sm"
                      onClick={() => setSelectedAgent(agent.agentId)}
                    >
                      Select
                    </Button>
                  </div>
                  <CardDescription>{agent.type}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="mb-2">{agent.description}</p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-2 w-2 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500' : 
                      agent.status === 'standby' ? 'bg-yellow-500' : 
                      'bg-gray-500'
                    }`}></div>
                    <span className="capitalize">{agent.status}</span>
                  </div>
                  
                  {agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold mb-1">Capabilities:</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.map((capability, idx) => (
                          <span 
                            key={idx} 
                            className="text-xs px-2 py-1 bg-secondary rounded-full"
                          >
                            {capability}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {agents.length === 0 && !loadingAgents && (
              <Card className="col-span-full">
                <CardContent className="pt-6 flex flex-col items-center justify-center h-40">
                  <Bot className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No agents available</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={fetchAgents}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Agent Command Interface */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-md">Send Command</CardTitle>
                  <CardDescription>
                    Direct an agent to perform a specific action
                  </CardDescription>
                </div>
                <ConnectionStatusIndicator />
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCommandSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-select">Select Agent</Label>
                  <Select
                    value={selectedAgent}
                    onValueChange={setSelectedAgent}
                    disabled={agents.length === 0 || connectionStatus !== 'connected'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.agentId}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="command">Command</Label>
                  <Input
                    id="command"
                    placeholder="Enter command (e.g., analyze_property)"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    disabled={!selectedAgent || connectionStatus !== 'connected'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="params">Parameters (JSON)</Label>
                  <Input
                    id="params"
                    placeholder='{}'
                    value={commandParams}
                    onChange={(e) => setCommandParams(e.target.value)}
                    disabled={!selectedAgent || !command || connectionStatus !== 'connected'}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={!selectedAgent || !command || sendingCommand || connectionStatus !== 'connected'}
                >
                  {sendingCommand ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Command
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Agent Tasks</h3>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchTasks}
                disabled={loadingTasks}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingTasks ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="default" size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[400px] rounded-md border">
            {tasks.length > 0 ? (
              <div className="p-4 space-y-4">
                {tasks.map((task) => (
                  <Card key={task.id} className="mb-4">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-md">{task.name}</CardTitle>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            {task.status === 'running' ? (
                              <Pause className="h-4 w-4" />
                            ) : task.status === 'pending' ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        Assigned to: {task.assignedTo} • Priority: {task.priority}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${
                          task.status === 'completed' ? 'bg-green-500' : 
                          task.status === 'running' ? 'bg-blue-500' : 
                          task.status === 'failed' ? 'bg-red-500' : 
                          'bg-yellow-500'
                        }`}></div>
                        <span className="capitalize">{task.status}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          Created: {new Date(task.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-10">
                <ListPlus className="h-10 w-10 mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No tasks available</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={fetchTasks}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        {/* Console Tab */}
        <TabsContent value="console" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Agent Message Console</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Code className="h-4 w-4 mr-2" />
                Debug Mode
              </Button>
              <Button variant="outline" size="sm">
                <MessagesSquare className="h-4 w-4 mr-2" />
                Chat View
              </Button>
            </div>
          </div>
          
          <AgentMessageLog height="h-[500px]" showControls={true} />
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent System Settings</CardTitle>
              <CardDescription>
                Configure how agents communicate and operate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionStatus !== 'connected' && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Connection Status: {connectionStatus === 'errored' ? 'Error' : connectionStatus}
                      </h3>
                      <p className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                        The agent system is currently using{' '}
                        {(() => {
                          switch(connectionStatus) {
                            case 'disconnected':
                            case 'connecting':
                            case 'errored':
                              return 'REST API polling (fallback mode)';
                            case 'connected':
                              return 'WebSocket connection';
                            default:
                              return 'Unknown connection method';
                          }
                        })()} for communication.
                        {(() => {
                          switch(connectionStatus) {
                            case 'disconnected':
                            case 'connecting':
                            case 'errored':
                              return ' This provides full functionality with slightly higher latency.';
                            default:
                              return '';
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="connection-timeout">Connection Timeout (ms)</Label>
                <Input 
                  id="connection-timeout" 
                  type="number" 
                  placeholder="30000" 
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="log-level">Log Level</Label>
                <Select defaultValue="info">
                  <SelectTrigger>
                    <SelectValue placeholder="Select log level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="agent-timeout">Agent Response Timeout (ms)</Label>
                <Input 
                  id="agent-timeout" 
                  type="number" 
                  placeholder="5000" 
                />
              </div>
              
              <Button className="w-full">Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}