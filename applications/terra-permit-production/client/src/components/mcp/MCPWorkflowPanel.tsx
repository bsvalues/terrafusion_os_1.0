/**
 * Model Content Protocol (MCP) Workflow Panel
 * 
 * This component visualizes and manages workflow definitions and instances
 * within the Model Content Protocol framework.
 */

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GitBranch,
  PlayCircle,
  PauseCircle,
  StopCircle,
  PlusCircle,
  FileSymlink,
  FolderTree,
  LayoutList,
  Activity,
  History,
  Timer,
  Sparkles
 } from '@mui/icons-material';
import { WorkflowRecommendations } from '@/components/workflow/WorkflowRecommendations';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ScrollArea } from "@/components/ui/scroll-area";

// Workflow Definition interface
interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: WorkflowStep[];
  createdAt: number;
  updatedAt: number;
}

// Workflow Step interface
interface WorkflowStep {
  id: string;
  name: string;
  type: "agent" | "function" | "conditional" | "parallel" | "loop";
  config: {
    agentId?: string;
    functionName?: string;
    condition?: string;
    iterations?: number;
  };
  next: string | null;
  error: string | null;
}

// Workflow Instance interface
interface WorkflowInstance {
  id: string;
  definitionId: string;
  name: string;
  status: "running" | "completed" | "failed" | "paused";
  progress: number;
  startTime: number;
  endTime: number | null;
  currentStep: string | null;
  executionHistory: ExecutionHistoryItem[];
}

// Execution History Item
interface ExecutionHistoryItem {
  stepId: string;
  stepName: string;
  status: "success" | "failed" | "running";
  startTime: number;
  endTime: number | null;
  output?: any;
  error?: string;
}

// Mock workflow definitions
const mockWorkflowDefinitions: WorkflowDefinition[] = [
  {
    id: "wf-def-1",
    name: "Document Processing Workflow",
    description: "Process and analyze document content with multiple agent steps",
    version: "1.0.0",
    steps: [
      {
        id: "step-1",
        name: "Document Classification",
        type: "agent",
        config: {
          agentId: "agent-1"
        },
        next: "step-2",
        error: "step-error"
      },
      {
        id: "step-2",
        name: "Content Extraction",
        type: "agent",
        config: {
          agentId: "agent-2"
        },
        next: "step-3",
        error: "step-error"
      },
      {
        id: "step-3",
        name: "Sentiment Analysis",
        type: "agent",
        config: {
          agentId: "agent-1"
        },
        next: null,
        error: "step-error"
      },
      {
        id: "step-error",
        name: "Error Handling",
        type: "function",
        config: {
          functionName: "logError"
        },
        next: null,
        error: null
      }
    ],
    createdAt: Date.now() - 86400000 * 7, // 7 days ago
    updatedAt: Date.now() - 86400000 * 2  // 2 days ago
  },
  {
    id: "wf-def-2",
    name: "Customer Support Assistant",
    description: "Multi-step workflow for processing customer inquiries",
    version: "1.2.1",
    steps: [
      {
        id: "step-1",
        name: "Intent Recognition",
        type: "agent",
        config: {
          agentId: "agent-1"
        },
        next: "step-2",
        error: "step-error"
      },
      {
        id: "step-2",
        name: "Knowledge Retrieval",
        type: "function",
        config: {
          functionName: "retrieveKnowledge"
        },
        next: "step-3",
        error: "step-error"
      },
      {
        id: "step-3",
        name: "Response Generation",
        type: "agent",
        config: {
          agentId: "agent-1"
        },
        next: "step-4",
        error: "step-error"
      },
      {
        id: "step-4",
        name: "Satisfaction Check",
        type: "conditional",
        config: {
          condition: "satisfaction > 0.8"
        },
        next: null,
        error: "step-error"
      },
      {
        id: "step-error",
        name: "Error Handling",
        type: "function",
        config: {
          functionName: "escalateToHuman"
        },
        next: null,
        error: null
      }
    ],
    createdAt: Date.now() - 86400000 * 14, // 14 days ago
    updatedAt: Date.now() - 86400000 * 3   // 3 days ago
  }
];

// Mock workflow instances
const mockWorkflowInstances: WorkflowInstance[] = [
  {
    id: "wf-inst-1",
    definitionId: "wf-def-1",
    name: "Document Processing #1249",
    status: "completed",
    progress: 100,
    startTime: Date.now() - 3600000, // 1 hour ago
    endTime: Date.now() - 3540000,   // 59 minutes ago
    currentStep: null,
    executionHistory: [
      {
        stepId: "step-1",
        stepName: "Document Classification",
        status: "success",
        startTime: Date.now() - 3600000,  // 1 hour ago
        endTime: Date.now() - 3580000,    // 59 min 40 sec ago
        output: { documentType: "invoice", confidence: 0.95 }
      },
      {
        stepId: "step-2",
        stepName: "Content Extraction",
        status: "success",
        startTime: Date.now() - 3580000,  // 59 min 40 sec ago
        endTime: Date.now() - 3560000,    // 59 min 20 sec ago
        output: { entities: 24, extractedText: "...[truncated]..." }
      },
      {
        stepId: "step-3",
        stepName: "Sentiment Analysis",
        status: "success",
        startTime: Date.now() - 3560000,  // 59 min 20 sec ago
        endTime: Date.now() - 3540000,    // 59 minutes ago
        output: { sentiment: "neutral", score: 0.1 }
      }
    ]
  },
  {
    id: "wf-inst-2",
    definitionId: "wf-def-1",
    name: "Document Processing #1250",
    status: "running",
    progress: 66,
    startTime: Date.now() - 600000,  // 10 min ago
    endTime: null,
    currentStep: "step-3",
    executionHistory: [
      {
        stepId: "step-1",
        stepName: "Document Classification",
        status: "success",
        startTime: Date.now() - 600000,  // 10 min ago
        endTime: Date.now() - 540000,    // 9 min ago
        output: { documentType: "contract", confidence: 0.88 }
      },
      {
        stepId: "step-2",
        stepName: "Content Extraction",
        status: "success",
        startTime: Date.now() - 540000,  // 9 min ago
        endTime: Date.now() - 300000,    // 5 min ago
        output: { entities: 36, extractedText: "...[truncated]..." }
      },
      {
        stepId: "step-3",
        stepName: "Sentiment Analysis",
        status: "running",
        startTime: Date.now() - 300000,  // 5 min ago
        endTime: null
      }
    ]
  },
  {
    id: "wf-inst-3",
    definitionId: "wf-def-2",
    name: "Support Ticket #4587",
    status: "failed",
    progress: 33,
    startTime: Date.now() - 7200000,  // 2 hours ago
    endTime: Date.now() - 7140000,    // 1 hour 59 min ago
    currentStep: null,
    executionHistory: [
      {
        stepId: "step-1",
        stepName: "Intent Recognition",
        status: "success",
        startTime: Date.now() - 7200000,  // 2 hours ago
        endTime: Date.now() - 7170000,    // 1 hour 59.5 min ago
        output: { intent: "refund_request", confidence: 0.92 }
      },
      {
        stepId: "step-2",
        stepName: "Knowledge Retrieval",
        status: "failed",
        startTime: Date.now() - 7170000,  // 1 hour 59.5 min ago
        endTime: Date.now() - 7140000,    // 1 hour 59 min ago
        error: "Database connection timeout after 30000ms"
      },
      {
        stepId: "step-error",
        stepName: "Error Handling",
        status: "success",
        startTime: Date.now() - 7140000,  // 1 hour 59 min ago
        endTime: Date.now() - 7138000,    // 1 hour 58.97 min ago
        output: { escalated: true, ticketId: "ESC-789" }
      }
    ]
  }
];

// Mock execution metrics data
const mockExecutionMetrics = [
  { date: "2023-04-25", executions: 12, avgDuration: 45, errorRate: 0.08 },
  { date: "2023-04-26", executions: 18, avgDuration: 51, errorRate: 0.11 },
  { date: "2023-04-27", executions: 15, avgDuration: 42, errorRate: 0.07 },
  { date: "2023-04-28", executions: 22, avgDuration: 39, errorRate: 0.05 },
  { date: "2023-04-29", executions: 28, avgDuration: 44, errorRate: 0.04 },
  { date: "2023-04-30", executions: 25, avgDuration: 47, errorRate: 0.08 },
  { date: "2023-05-01", executions: 30, avgDuration: 40, errorRate: 0.03 }
];

export default function MCPWorkflowPanel() {
  const [activeTab, setActiveTab] = useState("instances");
  const [searchQuery, setSearchQuery] = useState("");
  const [workflowDefinitions, setWorkflowDefinitions] = useState<WorkflowDefinition[]>(mockWorkflowDefinitions);
  const [workflowInstances, setWorkflowInstances] = useState<WorkflowInstance[]>(mockWorkflowInstances);
  const [selectedDefinition, setSelectedDefinition] = useState<WorkflowDefinition | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);
  const [metricView, setMetricView] = useState<"executions" | "duration" | "errors">("executions");
  
  const { toast } = useToast();
  
  // Filter workflow definitions and instances based on search query
  const filteredDefinitions = workflowDefinitions.filter(def => 
    def.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    def.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredInstances = workflowInstances.filter(inst => 
    inst.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleCreateWorkflow = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Workflow creation will be available in the next release.",
    });
  };
  
  const handlePauseWorkflow = (id: string) => {
    setWorkflowInstances(prev => prev.map(instance => 
      instance.id === id ? { ...instance, status: "paused" } : instance
    ));
    
    toast({
      title: "Workflow Paused",
      description: `Workflow instance has been paused.`,
    });
  };
  
  const handleResumeWorkflow = (id: string) => {
    setWorkflowInstances(prev => prev.map(instance => 
      instance.id === id ? { ...instance, status: "running" } : instance
    ));
    
    toast({
      title: "Workflow Resumed",
      description: `Workflow instance has been resumed.`,
    });
  };
  
  const handleStopWorkflow = (id: string) => {
    setWorkflowInstances(prev => prev.map(instance => 
      instance.id === id ? { ...instance, status: "failed", endTime: Date.now() } : instance
    ));
    
    toast({
      title: "Workflow Stopped",
      description: `Workflow instance has been stopped.`,
    });
  };
  
  const handleCreateInstance = (definitionId: string) => {
    const definition = workflowDefinitions.find(def => def.id === definitionId);
    
    if (!definition) return;
    
    const newInstance: WorkflowInstance = {
      id: `wf-inst-${workflowInstances.length + 1}`,
      definitionId: definitionId,
      name: `${definition.name} #${Math.floor(1000 + Math.random() * 9000)}`,
      status: "running",
      progress: 0,
      startTime: Date.now(),
      endTime: null,
      currentStep: definition.steps[0]?.id || null,
      executionHistory: []
    };
    
    setWorkflowInstances(prev => [...prev, newInstance]);
    
    toast({
      title: "Workflow Started",
      description: `New workflow instance "${newInstance.name}" has been created and started.`,
    });
  };
  
  const handleViewDefinition = (definitionId: string) => {
    const definition = workflowDefinitions.find(def => def.id === definitionId);
    if (definition) {
      setSelectedDefinition(definition);
      setSelectedInstance(null);
    }
  };
  
  const handleViewInstance = (instanceId: string) => {
    const instance = workflowInstances.find(inst => inst.id === instanceId);
    if (instance) {
      setSelectedInstance(instance);
      setSelectedDefinition(null);
    }
  };
  
  const formatTimestamp = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Failed</Badge>;
      case 'paused':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Paused</Badge>;
      default:
        return null;
    }
  };
  
  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Running</Badge>;
      default:
        return null;
    }
  };
  
  const getExecutionDuration = (start: number, end: number | null) => {
    if (!end) return 'In progress';
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes} min ${remainingSeconds} sec`;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><>

        <h2 className="text-xl font-semibold">Workflow Management</h2>
        <Button
</> onClick={handleCreateWorkflow}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Workflow
        </Button>
      </div>
      
      <div className="flex items-center gap-2 mb-4"><>

        <Input 
          placeholder="Search workflows..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-[300px]"
        />
      </div>
      
      <Tabs
</> value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="instances" className="flex items-center"><>

            <LayoutList className="h-4 w-4 mr-2" />
            Workflow Instances
          </TabsTrigger>
          <TabsTrigger
</> value="definitions" className="flex items-center"><>

            <FolderTree className="h-4 w-4 mr-2" />
            Workflow Definitions
          </TabsTrigger>
          <TabsTrigger
</> value="metrics" className="flex items-center"><>

            <Activity className="h-4 w-4 mr-2" />
            Execution Metrics
          </TabsTrigger>
          <TabsTrigger
</> value="recommendations" className="flex items-center">
            <Sparkles className="h-4 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="instances" className="space-y-4">
          {selectedInstance ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-lg gap-2">
                      <FileSymlink className="h-5 w-5" />
                      {selectedInstance.name}
                      {getStatusBadge(selectedInstance.status)}
                    </CardTitle>
                  </div><>

                  <Button variant="outline" onClick={() => setSelectedInstance(null)}>
                    Back to List
                  </Button>
                  <div
</> className="w-full text-sm text-muted-foreground mt-2">
                    Workflow instance details and execution history
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><>

                      <h3 className="text-sm font-medium mb-2">Instance Information</h3>
                      <div
</> className="space-y-2">
                        <div><>

                          <span className="text-sm font-medium">ID:</span>
                          <span
</> className="text-sm ml-2">{selectedInstance.id}</span>
                        </div>
                        <div><>

                          <span className="text-sm font-medium">Definition ID:</span>
                          <span
</> className="text-sm ml-2">{selectedInstance.definitionId}</span>
                        </div>
                        <div><>

                          <span className="text-sm font-medium">Status:</span>
                          <span
</> className="text-sm ml-2">{getStatusBadge(selectedInstance.status)}</span>
                        </div>
                        <div><>

                          <span className="text-sm font-medium">Progress:</span>
                          <span
</> className="text-sm ml-2">{selectedInstance.progress}%</span>
                        </div>
                        <div><>

                          <span className="text-sm font-medium">Current Step:</span>
                          <span
</> className="text-sm ml-2">
                            {selectedInstance.currentStep || 'Completed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div><>

                      <h3 className="text-sm font-medium mb-2">Timing Information</h3>
                      <div
</> className="space-y-2">
                        <div><>

                          <span className="text-sm font-medium">Start Time:</span>
                          <span
</> className="text-sm ml-2">{formatTimestamp(selectedInstance.startTime)}</span>
                        </div>
                        <div><>

                          <span className="text-sm font-medium">End Time:</span>
                          <span
</> className="text-sm ml-2">{formatTimestamp(selectedInstance.endTime)}</span>
                        </div>
                        <div><>

                          <span className="text-sm font-medium">Total Duration:</span>
                          <span
</> className="text-sm ml-2">
                            {getExecutionDuration(selectedInstance.startTime, selectedInstance.endTime || Date.now())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div><>

                    <h3 className="text-sm font-medium mb-2">Execution History</h3>
                    <Table
</>>
                      <TableHeader>
                        <TableRow><>

                          <TableHead>Step</TableHead>
                          <TableHead
</>>Status</TableHead><>

                          <TableHead>Start Time</TableHead>
                          <TableHead
</>>End Time</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInstance.executionHistory.map((historyItem) => (
                          <TableRow key={historyItem.stepId}><>

                            <TableCell className="font-medium">{historyItem.stepName}</TableCell>
                            <TableCell
</>>{getStepStatusIcon(historyItem.status)}</TableCell><>

                            <TableCell>{formatTimestamp(historyItem.startTime)}</TableCell>
                            <TableCell
</>>{formatTimestamp(historyItem.endTime)}</TableCell>
                            <TableCell>
                              {getExecutionDuration(historyItem.startTime, historyItem.endTime || Date.now())}
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {selectedInstance.executionHistory.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                              No execution history available.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {selectedInstance.status === "running" && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handlePauseWorkflow(selectedInstance.id)}
                      ><>

                        <PauseCircle className="h-4 w-4 mr-2" />
                        Pause Workflow
                      </Button>
                      <Button
</> 
                        variant="outline" 
                        onClick={() => handleStopWorkflow(selectedInstance.id)}
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop Workflow
                      </Button>
                    </div>
                  )}
                  
                  {selectedInstance.status === "paused" && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleResumeWorkflow(selectedInstance.id)}
                      ><>

                        <PlayCircle className="h-4 w-4 mr-2" />
                        Resume Workflow
                      </Button>
                      <Button
</> 
                        variant="outline" 
                        onClick={() => handleStopWorkflow(selectedInstance.id)}
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop Workflow
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><>

                  <TableHead>Name</TableHead>
                  <TableHead
</>>Status</TableHead><>

                  <TableHead>Progress</TableHead>
                  <TableHead
</>>Start Time</TableHead><>

                  <TableHead>Duration</TableHead>
                  <TableHead
</>>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstances.map((instance) => (
                  <TableRow key={instance.id}><>

                    <TableCell className="font-medium">{instance.name}</TableCell>
                    <TableCell
</>>{getStatusBadge(instance.status)}</TableCell><>

                    <TableCell>{instance.progress}%</TableCell>
                    <TableCell
</>>{formatTimestamp(instance.startTime)}</TableCell><>

                    <TableCell>
                      {getExecutionDuration(instance.startTime, instance.endTime || Date.now())}
                    </TableCell>
                    <TableCell
</>>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewInstance(instance.id)}
                        >
                          View Details
                        </Button>
                        
                        {instance.status === "running" && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePauseWorkflow(instance.id)}
                            ><>

                              <PauseCircle className="h-3.5 w-3.5 mr-1" />
                              Pause
                            </Button>
                            <Button
</> 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStopWorkflow(instance.id)}
                            >
                              <StopCircle className="h-3.5 w-3.5 mr-1" />
                              Stop
                            </Button>
                          </>
                        )}
                        
                        {instance.status === "paused" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleResumeWorkflow(instance.id)}
                          >
                            <PlayCircle className="h-3.5 w-3.5 mr-1" />
                            Resume
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredInstances.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                      No workflow instances found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        
        <TabsContent value="definitions" className="space-y-4">
          {selectedDefinition ? (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-lg">
                      <FolderTree className="h-5 w-5 mr-2" />
                      {selectedDefinition.name} <span className="text-sm ml-2">v{selectedDefinition.version}</span>
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {selectedDefinition.description}
                    </div>
                  </div>
                  <div className="flex items-center gap-2"><>

                    <Button variant="outline" onClick={() => setSelectedDefinition(null)}>
                      Back to List
                    </Button>
                    <Button
</> onClick={() => handleCreateInstance(selectedDefinition.id)}>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Start New Instance
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div><>

                      <span className="text-sm font-medium">Created:</span>
                      <span
</> className="text-sm ml-2">{formatTimestamp(selectedDefinition.createdAt)}</span>
                    </div>
                    <div><>

                      <span className="text-sm font-medium">Last Updated:</span>
                      <span
</> className="text-sm ml-2">{formatTimestamp(selectedDefinition.updatedAt)}</span>
                    </div>
                    <div><>

                      <span className="text-sm font-medium">Total Steps:</span>
                      <span
</> className="text-sm ml-2">{selectedDefinition.steps.length}</span>
                    </div>
                  </div>
                  
                  <div><>

                    <h3 className="text-sm font-medium mb-2">Workflow Steps</h3>
                    <ScrollArea
</> className="h-[400px] rounded-md border p-4">
                      <div className="space-y-4">
                        {selectedDefinition.steps.map((step /* , index */) => (
                          <div key={step.id} className="relative pl-5 pb-4">
                            {/* Connector line */}
                            {index < selectedDefinition.steps.length - 1 && (
                              <div className="absolute left-2.5 top-6 w-0.5 h-full bg-gray-200"></div>
                            )}
                            
                            {/* Step */}
                            <div className="relative border rounded-lg p-3">
                              {/* Step number indicator */}<>

                              <div className="absolute left-[-20px] top-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                                {index + 1}
                              </div>
                              
                              <div
</> className="flex items-center justify-between mb-2"><>

                                <h4 className="font-medium">{step.name}</h4>
                                <Badge
</> className="capitalize">
                                  {step.type}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1 text-sm">
                                {step.type === "agent" && step.config.agentId && (
                                  <div><>

                                    <span className="font-medium">Agent ID:</span>
                                    <span
</> className="ml-2">{step.config.agentId}</span>
                                  </div>
                                )}
                                
                                {step.type === "function" && step.config.functionName && (
                                  <div><>

                                    <span className="font-medium">Function:</span>
                                    <span
</> className="ml-2">{step.config.functionName}</span>
                                  </div>
                                )}
                                
                                {step.type === "conditional" && step.config.condition && (
                                  <div><>

                                    <span className="font-medium">Condition:</span>
                                    <span
</> className="ml-2">{step.config.condition}</span>
                                  </div>
                                )}
                                
                                {step.type === "loop" && step.config.iterations !== undefined && (
                                  <div><>

                                    <span className="font-medium">Iterations:</span>
                                    <span
</> className="ml-2">{step.config.iterations}</span>
                                  </div>
                                )}
                                
                                <div className="pt-1"><>

                                  <span className="font-medium">Next:</span>
                                  <span
</> className="ml-2">{step.next || "End"}</span>
                                </div>
                                
                                <div><>

                                  <span className="font-medium">Error:</span>
                                  <span
</> className="ml-2">{step.error || "None"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><>

                  <TableHead>Name</TableHead>
                  <TableHead
</>>Version</TableHead><>

                  <TableHead>Steps</TableHead>
                  <TableHead
</>>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDefinitions.map((definition) => (
                  <TableRow key={definition.id}><>

                    <TableCell className="font-medium">{definition.name}</TableCell>
                    <TableCell
</>>v{definition.version}</TableCell><>

                    <TableCell>{definition.steps.length}</TableCell>
                    <TableCell
</>>{formatTimestamp(definition.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2"><>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDefinition(definition.id)}
                        >
                          View Definition
                        </Button>
                        <Button
</> 
                          size="sm"
                          onClick={() => handleCreateInstance(definition.id)}
                        >
                          <PlayCircle className="h-3.5 w-3.5 mr-1" />
                          Run
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredDefinitions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                      No workflow definitions found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TabsContent>
        
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg"><>

                <Sparkles className="h-5 w-5 mr-2" />
                Personalized Workflow Recommendations
              </CardTitle>
              <CardDescription
</>>
                AI-powered recommendations based on your workflow patterns and processing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowRecommendations userId={1} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg"><>

                <Activity className="h-5 w-5 mr-2" />
                Workflow Execution Metrics
              </CardTitle>
              <div
</> className="flex items-center gap-2"><>

                <Button 
                  variant={metricView === "executions" ? "default" : "outline"} 
                  onClick={() => setMetricView("executions")}
                  size="sm"
                >
                  Executions
                </Button>
                <Button
</> 
                  variant={metricView === "duration" ? "default" : "outline"} 
                  onClick={() => setMetricView("duration")}
                  size="sm"
                ><>

                  <Timer className="h-3.5 w-3.5 mr-1" />
                  Avg. Duration
                </Button>
                <Button
</> 
                  variant={metricView === "errors" ? "default" : "outline"} 
                  onClick={() => setMetricView("errors")}
                  size="sm"
                >
                  Error Rate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockExecutionMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis 
                      domain={metricView === "errors" ? [0, 0.15] : metricView === "duration" ? [0, 60] : [0, 35]}
                      tickFormatter={
                        metricView === "errors" 
                          ? (value) => `${Math.round(value * 100)}%` 
                          : undefined
                      }
                    />
                    <Tooltip 
                      formatter={
                        metricView === "errors" 
                          ? (value) => [`${Math.round(Number(value) * 100)}%`, "Error Rate"]
                          : undefined
                      }
                    />
                    <Legend />
                    {metricView === "executions" && (
                      <Line 
                        type="monotone" 
                        dataKey="executions" 
                        name="Workflow Executions" 
                        stroke="#4f46e5" 
                        strokeWidth={2}
                      />
                    )}
                    {metricView === "duration" && (
                      <Line 
                        type="monotone" 
                        dataKey="avgDuration" 
                        name="Avg. Duration (seconds)" 
                        stroke="#0ea5e9" 
                        strokeWidth={2}
                      />
                    )}
                    {metricView === "errors" && (
                      <Line 
                        type="monotone" 
                        dataKey="errorRate" 
                        name="Error Rate" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4"><>

                    <div className="text-2xl font-bold">
                      {mockExecutionMetrics.reduce((sum, item) => sum + item.executions, 0)}
                    </div>
                    <div
</> className="text-sm text-gray-500">Total Executions</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4"><>

                    <div className="text-2xl font-bold">
                      {Math.round(mockExecutionMetrics.reduce((sum, item) => sum + item.avgDuration, 0) / mockExecutionMetrics.length)}s
                    </div>
                    <div
</> className="text-sm text-gray-500">Average Duration</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4"><>

                    <div className="text-2xl font-bold">
                      {Math.round(mockExecutionMetrics.reduce((sum, item) => sum + item.errorRate, 0) / mockExecutionMetrics.length * 100)}%
                    </div>
                    <div
</> className="text-sm text-gray-500">Average Error Rate</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}