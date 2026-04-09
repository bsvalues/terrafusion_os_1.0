/**
 * MCP Dashboard Component
 * 
 * This is the main dashboard for the Model Content Protocol system,
 * providing access to all MCP-related features and components.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CircuitBoard, 
  Network, 
  Workflow,
  BrainCog,
  Wrench,
  Activity
} from 'lucide-react';

// Import components
// Using default exports for existing components and named exports for new ones
import MCPCircuitBreakerPanel from './MCPCircuitBreakerPanel';
import MCPAgentRegistryPanel from './MCPAgentRegistryPanel';
import MCPWorkflowPanel from './MCPWorkflowPanel';
import { MCPEventMonitor } from './MCPEventMonitor';
import { MCPMaintenancePanel } from './MCPMaintenancePanel';

// Dashboard tabs
const TABS = [
  { 
    id: 'circuit-breakers', 
    label: 'Circuit Breakers', 
    icon: <CircuitBoard className="h-4 w-4 mr-2" />,
    description: 'Service resilience and fault isolation'
  },
  { 
    id: 'agent-registry', 
    label: 'Agent Registry', 
    icon: <BrainCog className="h-4 w-4 mr-2" />,
    description: 'AI agent registration and management'
  },
  { 
    id: 'workflows', 
    label: 'Workflows', 
    icon: <Workflow className="h-4 w-4 mr-2" />,
    description: 'Process automation and orchestration'
  },
  { 
    id: 'maintenance', 
    label: 'Maintenance', 
    icon: <Wrench className="h-4 w-4 mr-2" />,
    description: 'System health and maintenance recommendations'
  },
  { 
    id: 'monitoring', 
    label: 'Monitoring', 
    icon: <Activity className="h-4 w-4 mr-2" />,
    description: 'Real-time system monitoring and analysis'
  }
];

export default function MCPDashboard() {
  const [activeTab, setActiveTab] = useState<string>(TABS[0].id);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-2xl">
          <Network className="h-6 w-6 mr-2 text-primary" />
          TerraFusion Intelligence Hub
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Natural language AI assistants for permit processing, analysis, and optimization
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Description displayed outside Tabs */}
        <div className="mt-2 mb-4 text-sm text-muted-foreground">
          {TABS.find(tab => tab.id === activeTab)?.description}
        </div>
        
        <Tabs defaultValue={TABS[0].id} onValueChange={handleTabChange} className="mt-4">
          <TabsList className="grid grid-cols-5">
            {TABS.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center">
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="circuit-breakers" className="mt-4 space-y-4">
            <motion.div
              key="circuit-breakers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <MCPCircuitBreakerPanel />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="agent-registry" className="mt-4 space-y-4">
            <motion.div
              key="agent-registry"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <MCPAgentRegistryPanel />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="workflows" className="mt-4 space-y-4">
            <motion.div
              key="workflows"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <MCPWorkflowPanel />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="maintenance" className="mt-4 space-y-4">
            <motion.div
              key="maintenance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <MCPMaintenancePanel />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="monitoring" className="mt-4 space-y-4">
            <motion.div
              key="monitoring"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 gap-4">
                <MCPEventMonitor />
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}