
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Bot, TrendingUp, Warning, Clock, CheckCircle  } from '@mui/icons-material';
import { useAgentExecutions, useCreateAgentExecution } from "@/hooks/useProperty";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/hooks/use-toast";

interface AgentPanelProps {
  propertyId: string;
}

export function AgentPanel({ propertyId }: AgentPanelProps) {
  const { data: executions, isLoading } = useAgentExecutions(propertyId);
  const { data: users } = useUsers();
  const createExecution = useCreateAgentExecution();
  const { toast } = useToast();
  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());

  const runAgent = async (agentId: string, taskType: string) => {
    setRunningAgents(prev => new Set(prev).add(agentId));
    
    try {
      // Use first available admin user or create with sample user ID
      const adminUser = users?.find(user => user.role === 'admin');
      const createdBy = adminUser?.id || '550e8400-e29b-41d4-a716-446655440001';

      await createExecution.mutateAsync({
        property_id: propertyId,
        agent_id: agentId,
        task_type: taskType,
        parameters: {
          timestamp: new Date().toISOString(),
          auto_generated: true
        },
        status: "Running" as const,
        created_by: createdBy,
      });

      toast({
        title: "Agent Started",
        description: `${agentId} is now processing ${taskType}`,
      });
    } catch (error) {
      console.error("Failed to start agent:", error);
      toast({
        title: "Agent Failed to Start",
        description: "There was an error starting the agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRunningAgents(prev => {
        const newSet = new Set(prev);
        newSet.delete(agentId);
        return newSet;
      });
    }
  };

  const getRunningExecutions = () => {
    return executions?.filter(ex => ex.status === "Running" || ex.status === "Pending") || [];
  };

  const getRecentExecutions = () => {
    return executions?.slice(0, 5) || [];
  };

  const getSuccessRate = () => {
    if (!executions || executions.length === 0) return 0;
    const completed = executions.filter(ex => ex.status === "Completed").length;
    return Math.round((completed / executions.length) * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Running":
      case "Pending":
        return <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "Failed":
      case "Cancelled":
      case "Timeout":
        return <Warning className="w-4 h-4 text-red-400" />;
      default:
        return <Bot className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "default";
      case "Failed":
      case "Cancelled":
      case "Timeout":
        return "destructive";
      case "Running":
      case "Pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4"><>

              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div
</> className="h-4 bg-white/10 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Agent Panel */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Bot className="w-5 h-5 mr-2 text-cyan-400" />
            AI Agent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {getRunningExecutions().length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><>

                <span className="text-slate-300">Active Executions</span>
                <span
</> className="text-cyan-400">{getRunningExecutions().length}</span>
              </div>
              <Progress value={75} className="bg-white/10" />
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-slate-300 text-sm">Recent Activity:</p>
            {getRecentExecutions().map((execution) => (
              <div key={execution.id} className="flex items-center justify-between text-sm p-2 bg-white/5 rounded">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(execution.status)}<>

                  <span className="text-white">{execution.agent_id}</span>
                  <span
</> className="text-slate-400 text-xs">({execution.task_type})</span>
                </div>
                <Badge variant={getStatusColor(execution.status)} className="text-xs">
                  {execution.status}
                </Badge>
              </div>
            ))}
            {getRecentExecutions().length === 0 && (
              <p className="text-slate-400 text-sm">No recent activity</p>
            )}
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="space-y-2"><>

              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                onClick={() => runAgent("ValuationAgent", "property_valuation")}
                disabled={runningAgents.has("ValuationAgent") || createExecution.isPending}
              >
                {runningAgents.has("ValuationAgent") ? "Running..." : "Run Valuation Agent"}
              </Button>
              <Button
</> 
                size="sm" 
                variant="outline" 
                className="w-full border-white/20 text-white hover:bg-white/10"
                onClick={() => runAgent("QAAgent", "quality_assessment")}
                disabled={runningAgents.has("QAAgent") || createExecution.isPending}
              >
                {runningAgents.has("QAAgent") ? "Running..." : "Run QA Analysis"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full border-white/20 text-white hover:bg-white/10"
                onClick={() => runAgent("SalesValidator", "sales_validation")}
                disabled={runningAgents.has("SalesValidator") || createExecution.isPending}
              >
                {runningAgents.has("SalesValidator") ? "Running..." : "Run Sales Validation"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
            Agent Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between"><>

              <span className="text-slate-300">Success Rate:</span>
              <span
</> className="text-white font-semibold">{getSuccessRate()}%</span>
            </div>
            <div className="flex justify-between"><>

              <span className="text-slate-300">Total Executions:</span>
              <span
</> className="text-white">{executions?.length || 0}</span>
            </div>
            <div className="flex justify-between"><>

              <span className="text-slate-300">Active Agents:</span>
              <span
</> className="text-white">{getRunningExecutions().length}</span>
            </div>
          </div>

          <Badge variant="secondary" className="w-full justify-center bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            {getSuccessRate() > 90 ? "Excellent Performance" : 
             getSuccessRate() > 70 ? "Good Performance" : "Needs Review"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
