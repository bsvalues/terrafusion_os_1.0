
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Clock, CheckCircle, Warning, TrendingUp  } from '@mui/icons-material';

export function PerformanceKPIs() {
  const { data: kpiData } = useQuery({
    queryKey: ["performance-kpis"],
    queryFn: async () => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: executions } = await supabase
        .from("agent_executions")
        .select("*")
        .gte("started_at", oneWeekAgo);

      const { data: properties } = await supabase
        .from("properties")
        .select("assessed_value, last_assessment_date")
        .eq("active", true);

      const totalExecutions = executions?.length || 0;
      const completedExecutions = executions?.filter(e => e.status === "Completed").length || 0;
      const failedExecutions = executions?.filter(e => e.status === "Failed").length || 0;
      const runningExecutions = executions?.filter(e => e.status === "Running" || e.status === "Pending").length || 0;

      const successRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;
      const failureRate = totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0;

      const avgDuration = executions
        ?.filter(e => e.duration_ms && e.status === "Completed")
        .reduce((sum, e) => sum + (e.duration_ms || 0), 0) / 
        (executions?.filter(e => e.duration_ms && e.status === "Completed").length || 1) || 0;

      const avgConfidence = executions
        ?.filter(e => e.confidence_score && e.status === "Completed")
        .reduce((sum, e) => sum + (e.confidence_score || 0), 0) /
        (executions?.filter(e => e.confidence_score && e.status === "Completed").length || 1) || 0;

      const recentAssessments = properties?.filter(p => {
        const assessmentDate = new Date(p.last_assessment_date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return assessmentDate > thirtyDaysAgo;
      }).length || 0;

      const assessmentVelocity = recentAssessments / 30;

      return {
        totalExecutions,
        completedExecutions,
        failedExecutions,
        runningExecutions,
        successRate,
        failureRate,
        avgDuration,
        avgConfidence,
        assessmentVelocity,
      };
    },
    staleTime: 1 * 60 * 1000,
    refetchInterval: 15 * 1000,
  });

  const getStatusColor = (value: number, type: 'success' | 'warning' | 'danger') => {
    switch (type) {
      case 'success':
        return value >= 90 ? 'text-green-400' : value >= 70 ? 'text-yellow-400' : 'text-red-400';
      case 'warning':
        return value <= 5 ? 'text-green-400' : value <= 15 ? 'text-yellow-400' : 'text-red-400';
      case 'danger':
        return value <= 5 ? 'text-green-400' : value <= 10 ? 'text-yellow-400' : 'text-red-400';
    }
  };

  const getPerformanceStatus = (successRate: number) => {
    if (successRate >= 95) return { label: "Excellent", variant: "default" as const };
    if (successRate >= 85) return { label: "Good", variant: "secondary" as const };
    if (successRate >= 70) return { label: "Fair", variant: "outline" as const };
    return { label: "Needs Attention", variant: "destructive" as const };
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Bot className="w-5 h-5 mr-2 text-cyan-400" />
            AI Agent Performance (7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center"><>

              <div className="text-2xl font-bold text-white">
                {kpiData?.totalExecutions || 0}
              </div>
              <p
</> className="text-xs text-slate-400">Total Executions</p>
            </div>
            <div className="text-center"><>

              <div className={`text-2xl font-bold ${getStatusColor(kpiData?.successRate || 0, 'success')}`}>
                {Math.round(kpiData?.successRate || 0)}%
              </div>
              <p
</> className="text-xs text-slate-400">Success Rate</p>
            </div>
            <div className="text-center"><>

              <div className="text-2xl font-bold text-white">
                {Math.round((kpiData?.avgDuration || 0) / 1000)}s
              </div>
              <p
</> className="text-xs text-slate-400">Avg Duration</p>
            </div>
            <div className="text-center"><>

              <div className="text-2xl font-bold text-cyan-400">
                {Math.round((kpiData?.avgConfidence || 0) * 100)}%
              </div>
              <p
</> className="text-xs text-slate-400">Avg Confidence</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm"><>

              <span className="text-slate-300">System Health</span>
              <Badge
</> variant={getPerformanceStatus(kpiData?.successRate || 0).variant}>
                {getPerformanceStatus(kpiData?.successRate || 0).label}
              </Badge>
            </div>
            <Progress value={kpiData?.successRate || 0} className="bg-white/10" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
            Assessment Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <div><>

                <div className="text-lg font-semibold text-white">
                  {kpiData?.completedExecutions || 0}
                </div>
                <p
</> className="text-xs text-slate-400">Completed</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <div><>

                <div className="text-lg font-semibold text-white">
                  {kpiData?.runningExecutions || 0}
                </div>
                <p
</> className="text-xs text-slate-400">In Progress</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Warning className="w-4 h-4 text-red-400" />
              <div><>

                <div className="text-lg font-semibold text-white">
                  {kpiData?.failedExecutions || 0}
                </div>
                <p
</> className="text-xs text-slate-400">Failed</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="flex justify-between text-sm"><>

              <span className="text-slate-300">Assessment Velocity:</span>
              <span
</> className="text-white font-medium">
                {(kpiData?.assessmentVelocity || 0).toFixed(1)} per day
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
