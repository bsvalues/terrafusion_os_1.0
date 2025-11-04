import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import DashboardHeader from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Activity, Clock, CheckCircle, Warning, PlayCircle  } from '@mui/icons-material';

export default function OrchestratorPage() {
  // Fetch orchestrator stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/orchestrator/stats'],
    refetchInterval: 15000,
  });

  // Fetch system health
  const { data: systemHealth } = useQuery({
    queryKey: ['/api/system/health'],
    refetchInterval: 30000,
  });

  return (
    <div className="tf-app-container bg-tf-background min-h-screen">
      <Sidebar />
      
      <main className="tf-main-content">
        <div className="tf-content-wrapper">
          <DashboardHeader 
            title="Terrafusion Orchestrator" 
            subtitle="System orchestration and job queue management"
          />
          
          <div className="tf-content-area space-y-6">
            {/* Job Queue Overview */}
            <div className="tf-grid grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">Pending Jobs</p>
                      <div
</> className="text-2xl font-bold text-tf-text">
                        {isLoading ? (
                          <div className="h-8 w-12 bg-tf-accent/10 rounded animate-pulse"></div>
                        ) : (
                          (stats as any)?.pending || 0
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">Processing</p>
                      <div
</> className="text-2xl font-bold text-tf-text">
                        {isLoading ? (
                          <div className="h-8 w-12 bg-tf-accent/10 rounded animate-pulse"></div>
                        ) : (
                          (stats as any)?.processing || 0
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <PlayCircle className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">Completed</p>
                      <div
</> className="text-2xl font-bold text-tf-text">
                        {isLoading ? (
                          <div className="h-8 w-12 bg-tf-accent/10 rounded animate-pulse"></div>
                        ) : (
                          (stats as any)?.completed || 0
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
<>
                      <p className="text-sm text-tf-text/60">Failed</p>
                      <div
</> className="text-2xl font-bold text-tf-text">
                        {isLoading ? (
                          <div className="h-8 w-12 bg-tf-accent/10 rounded animate-pulse"></div>
                        ) : (
                          (stats as any)?.failed || 0
                        )}
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <Warning className="w-6 h-6 text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card className="tf-card bg-tf-surface border-tf-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-tf-text">
                  <Activity className="w-5 h-5 text-tf-accent" />
                  System Health Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {systemHealth ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Object.entries(systemHealth as any).map(([key, service]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-tf-accent/5 rounded-lg border border-tf-accent/10">
                        <div className="flex items-center gap-3">
<>
                          <div className={`w-3 h-3 rounded-full ${
                            service.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                          <div
</>>
<>
                            <h3 className="font-medium text-tf-text">{service.name}</h3>
                            <p
</> className="text-xs text-tf-text/60">{service.version} • Last check: {service.lastCheck}</p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`${
                            service.status === 'healthy' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {service.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-tf-accent/5 rounded-lg">
                        <div className="flex items-center gap-3">
<>
                          <div className="w-3 h-3 rounded-full bg-tf-accent/20 animate-pulse"></div>
                          <div
</>>
<>
                            <div className="h-4 w-24 bg-tf-accent/10 rounded animate-pulse mb-1"></div>
                            <div
</> className="h-3 w-32 bg-tf-accent/10 rounded animate-pulse"></div>
                          </div>
                        </div>
                        <div className="h-6 w-16 bg-tf-accent/10 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Queue Management */}
            <div className="tf-grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-tf-text">
                    <Settings className="w-5 h-5 text-tf-accent" />
                    Queue Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Max Concurrent Jobs</span>
                      <Badge
</> variant="outline" className="bg-tf-accent/10 text-tf-accent border-tf-accent/30">
                        25
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Job Timeout</span>
                      <Badge
</> variant="outline" className="bg-tf-accent/10 text-tf-accent border-tf-accent/30">
                        30m
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Retry Attempts</span>
                      <Badge
</> variant="outline" className="bg-tf-accent/10 text-tf-accent border-tf-accent/30">
                        3
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Priority Levels</span>
                      <Badge
</> variant="outline" className="bg-tf-accent/10 text-tf-accent border-tf-accent/30">
                        5
                      </Badge>
                    </div>
                    <div className="pt-2">
                      <Button size="sm" variant="outline" className="text-tf-accent border-tf-accent/30 hover:bg-tf-accent/10">
                        Configure Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="tf-card bg-tf-surface border-tf-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-tf-text">
                    <Clock className="w-5 h-5 text-tf-accent" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Avg Job Duration</span>
                      <Badge
</> className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                        2.3m
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Success Rate</span>
                      <Badge
</> className="bg-green-500/10 text-green-400 border-green-500/30">
                        98.7%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">Queue Throughput</span>
                      <Badge
</> className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                        145/hr
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-tf-text/80">System Load</span>
                      <Badge
</> className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                        Medium
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Jobs */}
            <Card className="tf-card bg-tf-surface border-tf-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-tf-text">
                  <Activity className="w-5 h-5 text-tf-accent" />
                  Recent Job Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-tf-accent/5 rounded-lg border border-tf-accent/10">
                    <div>
<>
                      <p className="text-sm font-medium text-tf-text">Property Analysis Batch #1247</p>
                      <p
</> className="text-xs text-tf-text/60">Agent: NarratorAI • Started: 2 minutes ago</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                      Processing
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-tf-accent/5 rounded-lg border border-tf-accent/10">
                    <div>
<>
                      <p className="text-sm font-medium text-tf-text">Market Comparison Analysis</p>
                      <p
</> className="text-xs text-tf-text/60">Agent: SalesValidator • Completed: 5 minutes ago</p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      Completed
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-tf-accent/5 rounded-lg border border-tf-accent/10">
                    <div>
<>
                      <p className="text-sm font-medium text-tf-text">Exemption Processing</p>
                      <p
</> className="text-xs text-tf-text/60">Agent: ExemptionSeer • Completed: 8 minutes ago</p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      Completed
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-tf-accent/5 rounded-lg border border-tf-accent/10">
                    <div>
<>
                      <p className="text-sm font-medium text-tf-text">Cost Analysis Report</p>
                      <p
</> className="text-xs text-tf-text/60">Agent: CostAnalyzer • Completed: 12 minutes ago</p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      Completed
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}