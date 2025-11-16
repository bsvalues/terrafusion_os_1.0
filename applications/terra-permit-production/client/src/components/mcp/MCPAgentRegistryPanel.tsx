/**
 * Model Content Protocol (MCP) Agent Registry Panel
 * 
 * This component manages and visualizes registered AI agents within the Model Content Protocol.
 */

import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Network,
  UserCircle,
  PlusCircle,
  Refresh,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Zap,
  MessagesSquare,
  BookOpen,
  Brain,
  Bot,
  Cable
 } from '@mui/icons-material';

// Agent capabilities constants
const CAPABILITIES = {
  TEXT_GENERATION: "text-generation",
  TEXT_EMBEDDING: "text-embedding",
  IMAGE_GENERATION: "image-generation",
  IMAGE_ANALYSIS: "image-analysis",
  AUDIO_TRANSCRIPTION: "audio-transcription",
  AUDIO_GENERATION: "audio-generation",
  VIDEO_ANALYSIS: "video-analysis",
  PLANNING: "planning",
  REASONING: "reasoning",
  MEMORY: "memory",
  TOOL_USE: "tool-use",
  CODE_GENERATION: "code-generation",
  CODE_ANALYSIS: "code-analysis"
};

// Interface for Agent
interface Agent {
  id: string;
  name: string;
  type: string;
  provider: string;
  version: string;
  status: "active" | "inactive" | "error";
  capabilities: string[];
  lastActive: number;
  description: string;
  config: {
    baseUrl?: string;
    apiKey?: string;
    contextWindow: number;
    outputTokenLimit?: number;
    temperature?: number;
  };
}

// Mock data for registered agents
const mockAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Text Assistant",
    type: "LLM",
    provider: "OpenAI",
    version: "gpt-4o",
    status: "active",
    capabilities: [
      CAPABILITIES.TEXT_GENERATION,
      CAPABILITIES.TEXT_EMBEDDING,
      CAPABILITIES.PLANNING,
      CAPABILITIES.REASONING,
      CAPABILITIES.MEMORY,
      CAPABILITIES.TOOL_USE
    ],
    lastActive: Date.now() - 120000, // 2 minutes ago
    description: "General purpose text assistant for content generation and analysis",
    config: {
      contextWindow: 8192,
      outputTokenLimit: 2048,
      temperature: 0.7
    }
  },
  {
    id: "agent-2",
    name: "Image Analyzer",
    type: "Multimodal",
    provider: "OpenAI",
    version: "gpt-4-vision",
    status: "active",
    capabilities: [
      CAPABILITIES.TEXT_GENERATION,
      CAPABILITIES.IMAGE_ANALYSIS,
      CAPABILITIES.REASONING
    ],
    lastActive: Date.now() - 3600000, // 1 hour ago
    description: "Specialized image analysis agent for visual content understanding",
    config: {
      contextWindow: 4096,
      outputTokenLimit: 1024,
      temperature: 0.5
    }
  },
  {
    id: "agent-3",
    name: "Code Assistant",
    type: "LLM",
    provider: "Anthropic",
    version: "claude-3-opus",
    status: "inactive",
    capabilities: [
      CAPABILITIES.TEXT_GENERATION,
      CAPABILITIES.CODE_GENERATION,
      CAPABILITIES.CODE_ANALYSIS,
      CAPABILITIES.REASONING
    ],
    lastActive: Date.now() - 86400000, // 1 day ago
    description: "Specialized code generation and analysis assistant",
    config: {
      contextWindow: 10000,
      outputTokenLimit: 4000,
      temperature: 0.3
    }
  },
  {
    id: "agent-4",
    name: "Data Analyst",
    type: "Function-calling",
    provider: "OpenAI",
    version: "gpt-4-turbo",
    status: "error",
    capabilities: [
      CAPABILITIES.TEXT_GENERATION,
      CAPABILITIES.REASONING,
      CAPABILITIES.TOOL_USE
    ],
    lastActive: Date.now() - 7200000, // 2 hours ago
    description: "Data processing and visualization specialist with tool integration",
    config: {
      contextWindow: 8192,
      outputTokenLimit: 2048,
      temperature: 0.2
    }
  }
];

export default function MCPAgentRegistryPanel() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { toast } = useToast();
  
  // Filter agents based on search query
  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleActivateAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, status: "active" } : agent
    ));
    
    toast({
      title: "Agent Activated",
      description: `Agent has been activated successfully.`,
    });
  };
  
  const handleDeactivateAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, status: "inactive" } : agent
    ));
    
    toast({
      title: "Agent Deactivated",
      description: `Agent has been deactivated successfully.`,
    });
  };
  
  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDialogOpen(true);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Inactive</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Error</Badge>;
      default:
        return null;
    }
  };
  
  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case CAPABILITIES.TEXT_GENERATION:
        return <MessagesSquare className="h-3.5 w-3.5" />;
      case CAPABILITIES.TEXT_EMBEDDING:
        return <BookOpen className="h-3.5 w-3.5" />;
      case CAPABILITIES.IMAGE_GENERATION:
      case CAPABILITIES.IMAGE_ANALYSIS:
        return <UserCircle className="h-3.5 w-3.5" />;
      case CAPABILITIES.PLANNING:
      case CAPABILITIES.REASONING:
        return <Brain className="h-3.5 w-3.5" />;
      case CAPABILITIES.TOOL_USE:
        return <Zap className="h-3.5 w-3.5" />;
      case CAPABILITIES.CODE_GENERATION:
      case CAPABILITIES.CODE_ANALYSIS:
        return <Cpu className="h-3.5 w-3.5" />;
      default:
        return <Bot className="h-3.5 w-3.5" />;
    }
  };
  
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><>

        <h2 className="text-xl font-semibold">Agent Registry</h2>
        <Button
</>>
          <PlusCircle className="h-4 w-4 mr-2" />
          Register New Agent
        </Button>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <Input 
          placeholder="Search agents..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-[300px]"
        />
        <Button variant="outline" size="icon">
          <Refresh className="h-4 w-4" />
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><>

                <TableHead>Name</TableHead>
                <TableHead
</>>Type</TableHead><>

                <TableHead>Provider</TableHead>
                <TableHead
</>>Version</TableHead><>

                <TableHead>Status</TableHead>
                <TableHead
</>>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}><>

                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell
</>>{agent.type}</TableCell><>

                  <TableCell>{agent.provider}</TableCell>
                  <TableCell
</>>{agent.version}</TableCell><>

                  <TableCell>{getStatusBadge(agent.status)}</TableCell>
                  <TableCell
</>>{formatTimestamp(agent.lastActive)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(agent)}
                      >
                        Details
                      </Button>
                      {agent.status === "active" ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeactivateAgent(agent.id)}
                        >
                          <ShieldAlert className="h-3.5 w-3.5 mr-1 text-amber-500" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleActivateAgent(agent.id)}
                        >
                          <ShieldCheck className="h-3.5 w-3.5 mr-1 text-green-500" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredAgents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    No agents found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Agent Details Dialog */}
      {selectedAgent && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><>

                <Network className="h-5 w-5" />
                Agent Details: {selectedAgent.name}
              </DialogTitle>
              <div
</> className="text-sm text-muted-foreground">
                Detailed information about the selected agent.
              </div>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div><>

                <h3 className="text-sm font-medium text-gray-500">Basic Information</h3>
                <div
</> className="mt-2 space-y-2">
                  <div><>

                    <span className="text-sm font-medium">ID:</span>
                    <span
</> className="text-sm ml-2">{selectedAgent.id}</span>
                  </div>
                  <div><>

                    <span className="text-sm font-medium">Type:</span>
                    <span
</> className="text-sm ml-2">{selectedAgent.type}</span>
                  </div>
                  <div><>

                    <span className="text-sm font-medium">Provider:</span>
                    <span
</> className="text-sm ml-2">{selectedAgent.provider}</span>
                  </div>
                  <div><>

                    <span className="text-sm font-medium">Version:</span>
                    <span
</> className="text-sm ml-2">{selectedAgent.version}</span>
                  </div>
                  <div><>

                    <span className="text-sm font-medium">Status:</span>
                    <span
</> className="text-sm ml-2">{getStatusBadge(selectedAgent.status)}</span>
                  </div>
                  <div><>

                    <span className="text-sm font-medium">Last Active:</span>
                    <span
</> className="text-sm ml-2">{formatTimestamp(selectedAgent.lastActive)}</span>
                  </div>
                </div>
              </div>
              
              <div><>

                <h3 className="text-sm font-medium text-gray-500">Configuration</h3>
                <div
</> className="mt-2 space-y-2">
                  <div><>

                    <span className="text-sm font-medium">Context Window:</span>
                    <span
</> className="text-sm ml-2">{selectedAgent.config.contextWindow} tokens</span>
                  </div>
                  {selectedAgent.config.outputTokenLimit && (
                    <div><>

                      <span className="text-sm font-medium">Output Token Limit:</span>
                      <span
</> className="text-sm ml-2">{selectedAgent.config.outputTokenLimit} tokens</span>
                    </div>
                  )}
                  {selectedAgent.config.temperature && (
                    <div><>

                      <span className="text-sm font-medium">Temperature:</span>
                      <span
</> className="text-sm ml-2">{selectedAgent.config.temperature}</span>
                    </div>
                  )}
                  {selectedAgent.config.baseUrl && (
                    <div><>

                      <span className="text-sm font-medium">Base URL:</span>
                      <span
</> className="text-sm ml-2">{selectedAgent.config.baseUrl}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="col-span-2"><>

                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p
</> className="mt-2 text-sm">{selectedAgent.description}</p>
              </div>
              
              <div className="col-span-2"><>

                <h3 className="text-sm font-medium text-gray-500">Capabilities</h3>
                <div
</> className="mt-2 flex flex-wrap gap-2">
                  {selectedAgent.capabilities.map((capability) => (
                    <Badge 
                      key={capability} 
                      variant="outline"
                      className="flex items-center gap-1 py-1"
                    >
                      {getCapabilityIcon(capability)}
                      {capability.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
              {selectedAgent.status === "active" ? (
                <Button 
                  variant="outline"
                  onClick={() => {
                    handleDeactivateAgent(selectedAgent.id);
                    setIsDialogOpen(false);
                  }}
                >
                  <ShieldAlert className="h-4 w-4 mr-2 text-amber-500" />
                  Deactivate Agent
                </Button>
              ) : (
                <Button 
                  variant="default"
                  onClick={() => {
                    handleActivateAgent(selectedAgent.id);
                    setIsDialogOpen(false);
                  }}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Activate Agent
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}