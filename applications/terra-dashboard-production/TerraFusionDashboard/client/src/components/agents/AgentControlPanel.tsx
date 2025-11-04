import { useState, useEffect } from 'react';
import { Bot, Play, Pause, Settings, Activity, CheckCircle, AlertCircle, Clock  } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AIAgent, AgentJob } from '@shared/schema';

interface AgentWithStats extends AIAgent {
  activeTasks: number;
  completedTasks: number;
  successRate: number;
  avgResponseTime: number;
}

export function AgentControlPanel() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: agents = [] } = useQuery<AIAgent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: recentJobs = [] } = useQuery<AgentJob[]>({
    queryKey: ["/api/agents/jobs/recent"],
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (jobData: { agentId: string; jobType: string; parameters?: any }) => {
      const response = await fetch(`/api/agents/${jobData.agentId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });
      if (!response.ok) throw new Error("Failed to create agent job");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents/jobs/recent"] });
    },
  });

  // Calculate agent stats
  const agentsWithStats: AgentWithStats[] = agents.map(agent => {
    const agentJobs = recentJobs.filter(job => job.agentId === agent.id);
    const completedJobs = agentJobs.filter(job => job.status === 'completed');
    const activeJobs = agentJobs.filter(job => job.status === 'running' || job.status === 'pending');
    
    return {
      ...agent,
      status: 'active', // Default status for agents
      activeTasks: activeJobs.length,
      completedTasks: completedJobs.length,
      successRate: completedJobs.length > 0 ? (completedJobs.length / agentJobs.length) * 100 : 0,
      avgResponseTime: 234 // Mock value - would calculate from actual job data
    };
  });

  const handleStartAgent = (agentId: string) => {
    createJobMutation.mutate({
      agentId,
      jobType: 'property_assessment',
      parameters: { mode: 'batch_analysis' }
    });
  };



  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
<>
          <Bot className="w-6 h-6 text-blue-600" />
          AI Agents
        </h3>
        <p
</> className="text-sm text-gray-600 mt-1">
          {agentsWithStats.filter(a => (a.status || 'active') === 'active').length} of {agentsWithStats.length} agents active
        </p>
      </div>

      <div className="p-6 space-y-4">
        {agentsWithStats.map((agent) => (
          <AgentCard 
            key={agent.id}
            agent={agent}
            selected={selectedAgent === agent.id}
            onSelect={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
            onStart={() => handleStartAgent(agent.id)}
          />
        ))}
      </div>

      {/* Active Jobs Summary */}
      <div className="p-6 border-t bg-gray-50">
<>
        <h4 className="font-semibold text-gray-800 mb-3">Recent Activity</h4>
        <div
</> className="space-y-2 max-h-32 overflow-y-auto">
          {recentJobs.slice(0, 5).map((job) => (
            <div key={job.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  job.status === 'completed' ? 'bg-green-500' :
                  job.status === 'running' ? 'bg-blue-500' :
                  job.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-gray-700">{job.jobType}</span>
              </div>
              <div className="flex items-center gap-2">
                {job.confidenceScore && (
                  <span className="text-xs text-gray-500">
                    {(parseFloat(job.confidenceScore) * 100).toFixed(0)}%
                  </span>
                )}
                <Badge variant={job.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                  {job.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentCard({ 
  agent, 
  selected, 
  onSelect, 
  onStart 
}: { 
  agent: AgentWithStats;
  selected: boolean;
  onSelect: () => void;
  onStart: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'idle':
        return 'text-yellow-600 bg-yellow-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-red-600 bg-red-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'idle':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <Card className={`cursor-pointer transition-all ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3" onClick={onSelect}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
<>
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div
</>>
<>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              <p
</> className="text-sm text-gray-600">{agent.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(agent.status || 'active')}>
              {agent.status || 'active'}
            </Badge>
            {getStatusIcon(agent.status || 'active')}
          </div>
        </div>
      </CardHeader>

      {selected && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
<>
              <div className="text-lg font-bold text-blue-600">{agent.activeTasks}</div>
              <div
</> className="text-xs text-gray-600">Active Tasks</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
<>
              <div className="text-lg font-bold text-green-600">{agent.completedTasks}</div>
              <div
</> className="text-xs text-gray-600">Completed</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
<>
              <div className="text-lg font-bold text-purple-600">{agent.successRate.toFixed(1)}%</div>
              <div
</> className="text-xs text-gray-600">Success Rate</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
<>
              <div className="text-lg font-bold text-orange-600">{agent.avgResponseTime}ms</div>
              <div
</> className="text-xs text-gray-600">Avg Response</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={onStart}
              className="flex-1"
              size="sm"
            >
<>
              <Play className="w-4 h-4 mr-2" />
              Start Task
            </Button>
            <Button
</> variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}