import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AI_AGENTS } from "@/lib/constants";

interface AgentControlPanelProps {
  selectedPropertyId?: string | null;
}

export default function AgentControlPanel({ selectedPropertyId }: AgentControlPanelProps) {
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

  // Launch agent job mutation
  const launchAgentMutation = useMutation({
    mutationFn: async ({ agentId, jobType, inputData }: { agentId: string; jobType: string; inputData?: any }) => {
      const response = await fetch(`/api/agents/${agentId}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType, inputData }),
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
    onError: (error) => {
      toast({
        title: "Launch Failed",
        description: "Failed to launch agent job",
        variant: "destructive",
      });
    },
  });

  const handleLaunchAgent = (agentId: string, agentName: string) => {
    const inputData = selectedPropertyId 
      ? { source: 'property-selection', propertyId: selectedPropertyId }
      : { source: 'manual-launch' };
    
    launchAgentMutation.mutate({
      agentId,
      jobType: 'property-analysis',
      inputData,
    });
  };

  return (
    <Card className="tf-card bg-tf-surface border-tf-accent/20">
      <CardHeader className="border-b border-tf-accent/20 bg-tf-surface">
<>
        <CardTitle className="text-lg font-semibold text-tf-text">Terrafusion AI Agents</CardTitle>
        <p
</> className="text-sm text-tf-text/70">Enterprise property analysis agents</p>
      </CardHeader>
      
      <CardContent className="p-6 bg-tf-surface">
        {/* Agent Status Grid */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-tf-dark rounded-lg border border-tf-accent/20">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-3 h-3 rounded-full bg-tf-accent/20" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1 bg-tf-accent/20" />
                      <Skeleton className="h-3 w-32 bg-tf-accent/20" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-16 bg-tf-accent/20" />
                </div>
              ))}
            </div>
          ) : Array.isArray(agents) && agents.length > 0 ? (
            agents.map((agent: any) => {
              const jobCount = agent.jobCount || 0;
              const isActive = agent.healthStatus === 'healthy';
              
              return (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-4 bg-tf-dark rounded-lg border border-tf-accent/20 hover:border-tf-accent/40 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-tf-accent' : 'bg-tf-text/30'} animate-pulse`} />
                    <div>
<>
                      <p className="text-sm font-medium text-tf-text">{agent.name}</p>
                      <p
</> className="text-xs text-tf-text/60">
                        Active • {jobCount} jobs today
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-tf-accent hover:text-tf-accent/80 hover:bg-tf-accent/10"
                    onClick={() => handleLaunchAgent(agent.id, agent.name)}
                    disabled={launchAgentMutation.isPending}
                  >
                    {launchAgentMutation.isPending ? "Launching..." : "Launch"}
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-tf-text/50">Loading AI agents...</p>
            </div>
          )}
        </div>

        {/* Property Context */}
        {selectedPropertyId && (
          <div className="mt-6 p-4 bg-tf-dark border border-tf-accent/20 rounded-lg">
<>
            <h4 className="text-sm font-medium text-tf-text mb-2">Analysis Target</h4>
            <p
</> className="text-xs text-tf-text/70">Property ID: {selectedPropertyId}</p>
            <Badge variant="outline" className="mt-2 text-tf-accent border-tf-accent/30 bg-tf-accent/10">
              Ready for analysis
            </Badge>
          </div>
        )}

        {/* Agent Launcher */}
        <div className="mt-6">
          <Button 
            className="w-full tf-button-primary bg-tf-accent hover:bg-tf-accent/90 text-tf-dark"
            disabled={!selectedPropertyId}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            {selectedPropertyId ? "Deploy Analysis Suite" : "Select Property First"}
          </Button>
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
<>
          <h4 className="text-sm font-medium text-tf-text mb-3">Recent Activity</h4>
          <div
</> className="space-y-2">
            {Array.isArray(recentJobs) && recentJobs.length > 0 ? recentJobs.slice(0, 3).map((job: any) => (
              <div key={job.id} className="text-xs text-tf-text/70 p-2 bg-tf-dark rounded border border-tf-accent/20">
                <span className="font-medium text-tf-accent">{job.jobType}</span> completed processing
                <span className="block text-tf-text/50">
                  {new Date(job.completedAt || job.createdAt).toLocaleTimeString()}
                </span>
              </div>
            )) : (
              <p className="text-xs text-tf-text/50 p-2 bg-tf-dark rounded border border-tf-accent/20">4 agents ready for deployment</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
