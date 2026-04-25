/**
 * TerraBuild AI Swarm - Agent Status Component
 *
 * This component displays the status of all agents in the AI Swarm.
 */

import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Activity, BarChart, Clock, FileText } from 'lucide-react';

import type { AgentInfo } from '@/lib/swarmClient';

interface SwarmAgentStatusProps {
  agents: AgentInfo[];
}

export function SwarmAgentStatus({ agents }: SwarmAgentStatusProps) {
  if (!agents || agents.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Agent-level telemetry is aggregated at the swarm level. See metrics above for live swarm health.
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Agent</TableHead>
            <TableHead>Specialization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Load</TableHead>
            <TableHead className="text-right">Tasks Completed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.agentId}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  {getAgentIcon(agent.name)}
                  <span className="ml-2">{agent.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{agent.specialization || getAgentCapability(agent.name)}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={agent.status === 'idle' || agent.status === 'active' ? "success" : "outline"}>
                  {agent.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{Math.round((agent.load ?? 0) * 100)}%</TableCell>
              <TableCell className="text-right">{agent.tasksCompleted ?? 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getAgentIcon(agentName: string) {
  const name = agentName.toLowerCase();

  if (name.includes('factor') || name.includes('benchmark')) {
    return <BarChart className="h-4 w-4 text-blue-500" />;
  } else if (name.includes('curve')) {
    return <Activity className="h-4 w-4 text-green-500" />;
  } else if (name.includes('scenario')) {
    return <FileText className="h-4 w-4 text-purple-500" />;
  } else {
    return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

function getAgentCapability(agentName: string) {
  const name = agentName.toLowerCase();

  if (name.includes('factor')) {
    return 'Cost Optimization';
  } else if (name.includes('benchmark')) {
    return 'Quality Control';
  } else if (name.includes('curve')) {
    return 'Pattern Analysis';
  } else if (name.includes('scenario')) {
    return 'Forecasting';
  } else if (name.includes('boe')) {
    return 'Documentation';
  } else {
    return 'General';
  }
}
