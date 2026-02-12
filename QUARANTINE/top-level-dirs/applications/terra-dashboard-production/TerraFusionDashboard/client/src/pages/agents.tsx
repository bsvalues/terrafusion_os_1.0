import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bot, Play, Pause, Settings, Activity, Clock, CheckCircle  } from '@mui/icons-material';

export default function AgentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch agents
  const { data: agents, isLoading } = useQuery({
    queryKey: ['/api/agents'],
    refetchInterval: 30000,
  });

  // Fetch recent jobs
  const { data: recentJobs } = useQuery({
    queryKey: ['/api/agents/jobs/recent'],
    refetchInterval: 15000,
  });

  // Launch agent mutation
  const launchAgentMutation = useMutation({
    mutationFn: async ({ agentId, jobType }: { agentId: string; jobType: string }) => {
      const response = await fetch(`/api/agents/${agentId}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType, inputData: { source: 'manual-launch' } }),
      });
      if (!response.ok) throw new Error('Failed to launch agent');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/jobs/recent'] });
      toast({
        title: "Agent Launched",
        description: "Agent job has been queued for processing",
      });
    },
    onError: () => {
      toast({
        title: "Launch Failed",
        description: "Failed to launch agent job",
        variant: "destructive",
      });
    },
  });

  const handleLaunchAgent = (agentId: string, jobType: string) => {
    launchAgentMutation.mutate({ agentId, jobType });
  };

  return (
    <div className="tf-app-container bg-tf-background min-h-screen">
      <Sidebar />
      
      <main className="tf-main-content">
        <div className="tf-content-wrapper">
          <DashboardHeader 
            title="Terrafusion Agents" 
            subtitle="AI-powered property analysis and automation"
          />
          
          <div className="tf-content-area space-y-6">
            {/* Agent Status Overview */}
            <div className="tf-grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">Active Agents</p>
                      <div
</> className="text-2xl font-bold text-tf-text">
                        {isLoading ? (
                          <div className="h-8 w-12 bg-tf-accent/10 rounded animate-pulse"></div>
                        ) : (
                          Array.isArray(agents) ? agents.filter((agent: any) => agent.status === 'active').length : 0
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <Bot className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">Jobs Completed Today</p>
                      <div
</> className="text-2xl font-bold text-tf-text">
                        {Array.isArray(recentJobs) ? recentJobs.filter((job: any) => job.status === 'completed').length : 0}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">Processing Queue</p>
                      <div
</> className="text-2xl font-bold text-tf-text">
                        {Array.isArray(recentJobs) ? recentJobs.filter((job: any) => job.status === 'processing').length : 0}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agent Management */}
            <Card className="tf-card bg-tf-surface border-tf-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-tf-text">
                  <Bot className="w-5 h-5 text-tf-accent" />
                  Enterprise AI Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-tf-accent/5 rounded-lg">
                        <div className="flex items-center gap-4">
<>
                          <div className="w-12 h-12 bg-tf-accent/10 rounded-lg animate-pulse"></div>
                          <div
</>>
<>
                            <div className="h-4 w-32 bg-tf-accent/10 rounded animate-pulse mb-2"></div>
                            <div
</> className="h-3 w-48 bg-tf-accent/10 rounded animate-pulse"></div>
                          </div>
                        </div>
                        <div className="h-8 w-20 bg-tf-accent/10 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(agents) && agents.map((agent: any) => (
                      <div key={agent.id} className="flex items-center justify-between p-4 bg-tf-accent/5 rounded-lg border border-tf-accent/10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-tf-accent/10 rounded-lg flex items-center justify-center">
<>
                            <Bot className="w-6 h-6 text-tf-accent" />
                          </div>
                          <div
</>>
                            <div className="flex items-center gap-2">
<>
                              <h3 className="font-medium text-tf-text">{agent.name}</h3>
                              <Badge
</> 
                                variant="outline" 
                                className={`${
                                  agent.status === 'active' 
                                    ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                                    : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                }`}
                              >
                                {agent.status}
                              </Badge>
                            </div>
<>
                            <p className="text-sm text-tf-text/60">{agent.description}</p>
                            <p
</> className="text-xs text-tf-text/40">Version {agent.version} • {agent.capabilities?.join(', ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-tf-accent border-tf-accent/30 hover:bg-tf-accent/10"
                            onClick={() => handleLaunchAgent(agent.id, 'property-analysis')}
                            disabled={launchAgentMutation.isPending}
                          >
<>
                            <Play className="w-4 h-4 mr-1" />
                            Launch
                          </Button>
                          <Button
</>
                            size="sm"
                            variant="ghost"
                            className="text-tf-text/60 hover:text-tf-text"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Jobs */}
            <Card className="tf-card bg-tf-surface border-tf-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-tf-text">
                  <Activity className="w-5 h-5 text-tf-accent" />
                  Recent Agent Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(recentJobs) && recentJobs.length > 0 ? (
                  <div className="space-y-3">
                    {recentJobs.slice(0, 10).map((job: any /* , index */: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-tf-accent/5 rounded-lg border border-tf-accent/10">
                        <div>
<>
                          <p className="text-sm font-medium text-tf-text">{job.jobType || 'Property Analysis'}</p>
                          <p
</> className="text-xs text-tf-text/60">Agent: {job.agentName || 'NarratorAI'} • Started: {job.startedAt || '2 minutes ago'}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`${
                            job.status === 'completed' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/30'
                              : job.status === 'processing'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                          }`}
                        >
                          {job.status || 'completed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-tf-text/30 mx-auto mb-4" />
<>
                    <p className="text-tf-text/60">No recent agent jobs found</p>
                    <p
</> className="text-sm text-tf-text/40">Launch an agent to see activity here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}