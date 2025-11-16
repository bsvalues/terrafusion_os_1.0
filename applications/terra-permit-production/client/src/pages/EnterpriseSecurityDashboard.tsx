import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, 
  Users, 
  Globe, 
  Warning, 
  CheckCircle, 
  Refresh,
  Key,
  Activity,
  Zap,
  Eye,
  EyeOff,
  RotateCcw,
  Server
 } from '@mui/icons-material';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function EnterpriseSecurityDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comprehensive system overview
  const { data: overview, isLoading } = useQuery({
    queryKey: ['/api/enhanced-deployment/analytics/overview'],
    refetchInterval: 5000 // Real-time updates
  });

  // Fetch multi-site data
  const { data: sitesData } = useQuery({
    queryKey: ['/api/enhanced-deployment/sites']
  });

  // Fetch threat information
  const { data: threatsData } = useQuery({
    queryKey: ['/api/enhanced-deployment/security/threats'],
    refetchInterval: 10000
  });

  // Fetch credentials data
  const { data: credentialsData } = useQuery({
    queryKey: ['/api/enhanced-deployment/credentials']
  });

  // Security monitoring mutations
  const startMonitoringMutation = useMutation({
    mutationFn: () => apiRequest('/api/enhanced-deployment/security/start-monitoring', 'POST'),
    onSuccess: () => {
      toast({
        title: "Security Monitoring Activated",
        description: "Advanced threat detection is now actively monitoring all systems.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced-deployment/security/threats'] });
    }
  });

  const stopMonitoringMutation = useMutation({
    mutationFn: () => apiRequest('/api/enhanced-deployment/security/stop-monitoring', 'POST'),
    onSuccess: () => {
      toast({
        title: "Security Monitoring Paused",
        description: "Threat detection monitoring has been temporarily disabled.",
      });
    }
  });

  // Credential rotation mutation
  const rotateCredentialMutation = useMutation({
    mutationFn: (credentialId: string) => 
      apiRequest(`/api/enhanced-deployment/credentials/${credentialId}/rotate`, 'POST'),
    onSuccess: () => {
      toast({
        title: "Credential Rotation Initiated",
        description: "Automatic credential rotation has been scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced-deployment/credentials'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'healthy':
      case 'completed':
        return 'text-green-600';
      case 'warning':
      case 'medium':
        return 'text-yellow-600';
      case 'critical':
      case 'high':
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <Refresh className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading enterprise security dashboard...</span>
        </div>
      </div>
    );
  }

  const systemOverview = overview?.overview;
  const sites = sitesData?.sites || [];
  const threats = threatsData?.summary;
  const credentials = credentialsData?.credentials || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><>

            <Shield className="h-8 w-8 text-blue-600" />
            Enterprise Security Command Center
          </h1>
          <p
</> className="text-muted-foreground">
            Multi-site security management with advanced threat detection
          </p>
        </div>
        <div className="flex gap-2"><>

          <Badge variant="outline" className="text-lg px-4 py-2">
            {sites.length} Active Sites
          </Badge>
          <Badge
</> variant={threats?.activethreats > 0 ? "destructive" : "default"} className="text-lg px-4 py-2">
            {threats?.activethreats || 0} Active Threats
          </Badge>
        </div>
      </div>

      {/* System Health Overview */}
      {systemOverview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Multi-Site Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2"><>

                <div className="text-2xl font-bold">{systemOverview.sites.activeSites}</div>
                <div
</> className="text-xs text-muted-foreground">
                  of {systemOverview.sites.totalSites} total sites
                </div>
                <div className="text-xs text-green-600">
                  {systemOverview.sites.averageUptime?.toFixed(1)}% avg uptime
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Posture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2"><>

                <div className="text-2xl font-bold text-green-600">
                  {systemOverview.sites.averageComplianceScore?.toFixed(0)}%
                </div>
                <Progress
</> value={systemOverview.sites.averageComplianceScore} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  CJIS Compliance Score
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Threat Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2"><>

                <div className="text-2xl font-bold">
                  {systemOverview.security.totalThreats}
                </div>
                <div
</> className="text-xs text-muted-foreground">
                  {systemOverview.security.activethreats} active threats
                </div>
                <div className="text-xs text-green-600">
                  {systemOverview.security.mitigatedThreats} mitigated
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Server className="h-4 w-4" />
                System Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2"><>

                <div className="text-2xl font-bold">
                  {formatUptime(systemOverview.systemHealth.uptime)}
                </div>
                <div
</> className="text-xs text-muted-foreground">
                  System Uptime
                </div>
                <div className="text-xs">
                  {systemOverview.systemHealth.memory.used}MB / {systemOverview.systemHealth.memory.total}MB
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="sites" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="sites">Multi-Site Management</TabsTrigger>
          <TabsTrigger
</> value="threats">Threat Detection</TabsTrigger><>

          <TabsTrigger value="credentials">Credential Security</TabsTrigger>
          <TabsTrigger
</> value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <Globe className="h-5 w-5" />
                County Site Management
              </CardTitle>
              <CardDescription
</>>
                Monitor and manage multiple county deployment sites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sites.map((site: any) => (
                  <Card key={site.id} className="border">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start"><>

                        <CardTitle className="text-base">{site.name}</CardTitle>
                        <Badge
</> variant={site.status === 'active' ? 'default' : 'secondary'}>
                          {site.status}
                        </Badge>
                      </div>
                      <CardDescription>{site.type} • {site.region}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><>

                          <span>Population:</span>
                          <span
</>>{site.population.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between"><>

                          <span>Compliance:</span>
                          <Badge
</> variant="outline">{site.complianceLevel}</Badge>
                        </div>
                        <div className="flex justify-between"><>

                          <span>Permits:</span>
                          <span
</>>{site.metrics.permits}</span>
                        </div>
                        <div className="flex justify-between"><>

                          <span>Processing Rate:</span>
                          <span
</> className="text-green-600">{site.metrics.processing_rate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between"><>

                          <span>Uptime:</span>
                          <span
</> className="text-green-600">{site.metrics.uptime.toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <Shield className="h-5 w-5" />
                Advanced Threat Detection
              </CardTitle>
              <CardDescription
</>>
                Real-time security monitoring and threat mitigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><>

                    <h4 className="font-medium">Monitoring Status</h4>
                    <p
</> className="text-sm text-muted-foreground">
                      {threatsData?.monitoring ? 'Active threat monitoring' : 'Monitoring paused'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => startMonitoringMutation.mutate()}
                      disabled={threatsData?.monitoring || startMonitoringMutation.isPending}
                    ><>

                      <Eye className="mr-2 h-4 w-4" />
                      Start Monitoring
                    </Button>
                    <Button
</>
                      variant="outline"
                      onClick={() => stopMonitoringMutation.mutate()}
                      disabled={!threatsData?.monitoring || stopMonitoringMutation.isPending}
                    >
                      <EyeOff className="mr-2 h-4 w-4" />
                      Stop Monitoring
                    </Button>
                  </div>
                </div>

                {threats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div><>

                            <p className="text-sm font-medium">Total Threats</p>
                            <p
</> className="text-2xl font-bold">{threats.totalThreats}</p>
                          </div>
                          <Warning className="h-8 w-8 text-orange-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div><>

                            <p className="text-sm font-medium">Active Threats</p>
                            <p
</> className="text-2xl font-bold text-red-600">{threats.activethreats}</p>
                          </div>
                          <Shield className="h-8 w-8 text-red-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div><>

                            <p className="text-sm font-medium">Mitigated</p>
                            <p
</> className="text-2xl font-bold text-green-600">{threats.mitigatedThreats}</p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div><>

                            <p className="text-sm font-medium">Critical</p>
                            <p
</> className="text-2xl font-bold text-red-600">{threats.severityBreakdown.critical}</p>
                          </div>
                          <Warning className="h-8 w-8 text-red-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {threatsData?.recentThreats && threatsData.recentThreats.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Security Events</h4>
                    {threatsData.recentThreats.slice(0, 5).map((threat: any) => (
                      <Alert key={threat.id}>
                        <Warning className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex justify-between items-start">
                            <div><>

                              <span className="font-medium">{threat.type.replace('_', ' ')}</span>
                              <p
</> className="text-sm">{threat.description}</p>
                            </div>
                            <Badge variant={threat.severity === 'critical' ? 'destructive' : 'outline'}>
                              {threat.severity}
                            </Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <Key className="h-5 w-5" />
                Credential Security Management
              </CardTitle>
              <CardDescription
</>>
                Automated credential rotation and security monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {credentialsData?.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border">
                      <CardContent className="pt-6">
                        <div className="text-center"><>

                          <p className="text-2xl font-bold">{credentialsData.summary.totalCredentials}</p>
                          <p
</> className="text-sm text-muted-foreground">Total Credentials</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border">
                      <CardContent className="pt-6">
                        <div className="text-center"><>

                          <p className="text-2xl font-bold text-green-600">{credentialsData.summary.activeCredentials}</p>
                          <p
</> className="text-sm text-muted-foreground">Active</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border">
                      <CardContent className="pt-6">
                        <div className="text-center"><>

                          <p className="text-2xl font-bold text-yellow-600">{credentialsData.summary.expiringCredentials}</p>
                          <p
</> className="text-sm text-muted-foreground">Expiring Soon</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border">
                      <CardContent className="pt-6">
                        <div className="text-center"><>

                          <p className="text-2xl font-bold text-red-600">{credentialsData.summary.failedRotations}</p>
                          <p
</> className="text-sm text-muted-foreground">Failed Rotations</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="space-y-2"><>

                  <h4 className="font-medium">Credential Inventory</h4>
                  <div
</> className="space-y-2">
                    {credentials.map((credential: any) => (
                      <Card key={credential.id} className="border">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2"><>

                                <h5 className="font-medium">{credential.name}</h5>
                                <Badge
</> variant="outline">{credential.type}</Badge>
                                <Badge variant={credential.status === 'active' ? 'default' : 'destructive'}>
                                  {credential.status}
                                </Badge>
                              </div>
                              <div className="flex gap-4 text-sm text-muted-foreground mt-1"><>

                                <span>Environment: {credential.environment}</span>
                                <span
</>>Expires: {new Date(credential.expiresAt).toLocaleDateString()}</span>
                                <span>Last Rotated: {new Date(credential.lastRotated).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => rotateCredentialMutation.mutate(credential.id)}
                              disabled={rotateCredentialMutation.isPending}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Rotate
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><>

                <Zap className="h-5 w-5" />
                Performance Optimization
              </CardTitle>
              <CardDescription
</>>
                System performance monitoring and optimization tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemOverview && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4"><>

                    <h4 className="font-medium">Batch Processing</h4>
                    <div
</> className="space-y-2">
                      <div className="flex justify-between text-sm"><>

                        <span>Pending Jobs:</span>
                        <span
</>>{systemOverview.performance.batch.pending}</span>
                      </div>
                      <div className="flex justify-between text-sm"><>

                        <span>Processing:</span>
                        <span
</>>{systemOverview.performance.batch.processing}</span>
                      </div>
                      <div className="flex justify-between text-sm"><>

                        <span>Total Queued:</span>
                        <span
</>>{systemOverview.performance.batch.total}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4"><>

                    <h4 className="font-medium">Cache Performance</h4>
                    <div
</> className="space-y-2">
                      <div className="flex justify-between text-sm"><>

                        <span>Hit Rate:</span>
                        <span
</> className="text-green-600">{(systemOverview.performance.cache.hitRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm"><>

                        <span>Entries:</span>
                        <span
</>>{systemOverview.performance.cache.entries}</span>
                      </div>
                      <div className="flex justify-between text-sm"><>

                        <span>Memory Usage:</span>
                        <span
</>>{Math.round(systemOverview.performance.cache.memoryUsage / 1024)} KB</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}