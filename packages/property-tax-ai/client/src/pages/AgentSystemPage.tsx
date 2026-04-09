import React, { useEffect } from 'react';
import { AgentControlPanel, AgentSystemStatus } from '@/components/agent-system';
import { useAgentWebSocket } from '@/hooks/use-agent-websocket';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, AlertTriangle, Bot, Database, BarChart, Network, CpuIcon } from 'lucide-react';

export default function AgentSystemPage() {
  const { connectionStatus, connect } = useAgentWebSocket({
    autoConnect: true,
    showToasts: true
  });

  // Connect to the agent WebSocket system when the page loads
  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      connect().catch(error => {
        console.error('Failed to connect to agent system:', error);
      });
    }
  }, [connectionStatus, connect]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">MCP Agent System</h1>
          <p className="text-muted-foreground max-w-2xl">
            The Model Context Protocol (MCP) Agent System provides AI-powered capabilities for property assessment,
            data ingestion and reporting through a secure, controlled interface.
          </p>
        </div>
        <AgentSystemStatus variant="default" />
      </div>
      
      <Tabs defaultValue="control">
        <TabsList className="mb-6">
          <TabsTrigger value="control">
            <CpuIcon className="mr-2 h-4 w-4" />
            Control Panel
          </TabsTrigger>
          <TabsTrigger value="overview">
            <Network className="mr-2 h-4 w-4" />
            Architecture
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="control" className="space-y-6">
          <AgentControlPanel />
        </TabsContent>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Agent Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Property Assessment Agent Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold">Property Assessment Agent</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Advanced AI capabilities for property analysis, valuation, and comparison using multiple data sources.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    Property value analysis
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    Comparable property identification
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    Property story generation
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    Market trend analysis
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            {/* Data Ingestion Agent Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
                    <Database className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold">Data Ingestion Agent</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Securely imports, validates, and processes property data from multiple sources including PACS systems.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    FTP/SFTP data retrieval
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    Data validation and cleansing
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    PACS system integration
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    Data transformation and loading
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            {/* Reporting Agent Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
                    <BarChart className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold">Reporting Agent</h2>
                </div>
                <p className="text-muted-foreground mb-4">
                  Generates detailed property assessment reports and analytics with customizable parameters.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    Customizable report templates
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    Data aggregation and analysis
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    Scheduled report generation
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-primary" />
                    Export in multiple formats
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* MCP Architecture Overview */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">MCP Architecture Overview</h2>
              <p className="mb-4">
                The Model Context Protocol (MCP) architecture provides a secure framework for AI-powered agents to interact with property data and external systems, maintaining data integrity and access controls.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Key Features</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-primary" />
                      Secure AI capability execution with permission controls
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-primary" />
                      Comprehensive audit logging and tool execution tracking
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-primary" />
                      Multi-AI provider support (OpenAI, Claude, Perplexity)
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-primary" />
                      PACS system integration with proprietary data mapping
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Security Features</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-primary" />
                      SQL injection and parameter validation
                    </li>
                    <li className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-primary" />
                      Rate limiting and request validation
                    </li>
                    <li className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-primary" />
                      Authentication and authorization checks
                    </li>
                    <li className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-primary" />
                      Tool execution permissions model
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}