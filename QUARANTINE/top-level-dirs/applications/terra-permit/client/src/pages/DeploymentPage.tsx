import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Shield, 
  Download, 
  CheckCircle, 
  Warning, 
  Activity, 
  Settings, 
  Refresh,
  Server,
  Lock,
  FileCheck,
  Zap
 } from '@mui/icons-material';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ComplianceReport {
  passed: boolean;
  score: number;
  violations: string[];
  recommendations: string[];
  report: string;
}

interface SecurityPolicies {
  gpo_template: {
    name: string;
    settings: any;
  };
  firewall_rules: any[];
}

interface MaintenanceStatus {
  monitoring_active: boolean;
  tracked_files: number;
  config: any;
}

interface HealthData {
  timestamp: string;
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
    };
  };
  services: Record<string, string>;
  security: {
    compliance_level: string;
    encryption: string;
    audit_logging: string;
  };
}

export default function DeploymentPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingInstaller, setIsGeneratingInstaller] = useState(false);

  // Fetch compliance scan results
  const { data: complianceData, isLoading: complianceLoading } = useQuery({
    queryKey: ['/api/deployment/compliance-scan'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch security policies
  const { data: policiesData, isLoading: policiesLoading } = useQuery({
    queryKey: ['/api/deployment/security-policies']
  });

  // Fetch maintenance status
  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['/api/deployment/maintenance-status'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Fetch health report
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/deployment/health-report'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Generate installer mutation
  const generateInstallerMutation = useMutation({
    mutationFn: () => apiRequest('/api/deployment/generate-installer', 'POST'),
    onSuccess: (data) => {
      toast({
        title: "Installer Generated Successfully",
        description: "County deployment package has been created with all security policies applied.",
      });
      setIsGeneratingInstaller(false);
    },
    onError: (error) => {
      toast({
        title: "Installer Generation Failed",
        description: "Failed to generate county deployment package. Please check system logs.",
        variant: "destructive",
      });
      setIsGeneratingInstaller(false);
    }
  });

  // Check updates mutation
  const checkUpdatesMutation = useMutation({
    mutationFn: () => apiRequest('/api/deployment/check-updates'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deployment/check-updates'] });
      toast({
        title: "Update Check Complete",
        description: "System update availability has been verified.",
      });
    }
  });

  const compliance = (complianceData as any)?.compliance as ComplianceReport | undefined;
  const policies = (policiesData as any)?.policies as SecurityPolicies | undefined;
  const maintenance = (maintenanceData as any)?.maintenance as MaintenanceStatus | undefined;
  const health = (healthData as any)?.health as HealthData | undefined;

  const handleGenerateInstaller = () => {
    setIsGeneratingInstaller(true);
    generateInstallerMutation.mutate();
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getServiceStatusColor = (status: string) => {
    return status === 'healthy' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">County Deployment System</h1>
          <p className="text-muted-foreground">
            AI-powered security-first deployment automation with CJIS Level 4 compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => checkUpdatesMutation.mutate()}
            variant="outline"
            disabled={checkUpdatesMutation.isPending}
          >
            <Refresh className={`mr-2 h-4 w-4 ${checkUpdatesMutation.isPending ? 'animate-spin' : ''}`} />
            Check Updates
          </Button>
          <Button onClick={handleGenerateInstaller}
            disabled={isGeneratingInstaller || generateInstallerMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            {isGeneratingInstaller ? 'Generating...' : 'Generate County Installer'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="compliance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                CJIS Level 4 Compliance Status
              </CardTitle>
              <CardDescription
>
                Real-time compliance monitoring and validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {complianceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Refresh className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Running compliance scan...</span>
                </div>
              ) : compliance ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {compliance.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Warning className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">Compliance Score</span>
                    </div>
                    <Badge variant={compliance.passed ? "default" : "destructive"}>
                      <span className={getComplianceColor(compliance.score)}>
                        {compliance.score}/100
                      </span>
                    </Badge>
                  </div>
                  
                  <Progress value={compliance.score} className="w-full" />
                  
                  {compliance.violations.length > 0 && (
                    <Alert variant="destructive">
                      <Warning className="h-4 w-4" />
                      <AlertTitle>Compliance Violations</AlertTitle>
                      <AlertDescription
>
                        <ul className="list-disc list-inside space-y-1">
                          {compliance.violations.map((violation /* , index */) => (
                            <li key={index}>{violation}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Recommendations</h4>
                    <ScrollArea className="h-32 w-full rounded border p-4">
                      <ul className="space-y-1">
                        {compliance.recommendations.map((rec /* , index */) => (
                          <li key={index} className="text-sm">• {rec}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                </div>
              ) : (
                <Alert>
                  <Warning className="h-4 w-4" />
                  <AlertTitle>Compliance Data Unavailable</AlertTitle>
                  <AlertDescription
>
                    Unable to fetch compliance status. Please check system connectivity.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Policies
              </CardTitle>
              <CardDescription
>
                County-specific security configurations and Group Policy templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {policiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Refresh className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading security policies...</span>
                </div>
              ) : policies ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Group Policy Template</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Policy Name:</span>
                            <span className="text-sm">{policies.gpo_template.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Password Length:</span>
                            <span className="text-sm">{policies.gpo_template.settings.password_policy?.min_length || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Audit Logging:</span>
                            <Badge variant="outline">
                              {policies.gpo_template.settings.audit_policy?.logon_events ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Firewall Rules</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-32">
                          <div className="space-y-2">
                            {policies.firewall_rules.map((rule /* , index */) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{rule.name}</span>
                                <Badge variant="outline">{rule.action}</Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Alert>
                  <Warning className="h-4 w-4" />
                  <AlertTitle>Security Policies Unavailable</AlertTitle>
                  <AlertDescription
>
                    Unable to load security policy configuration.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Self-Healing Maintenance System
              </CardTitle>
              <CardDescription
>
                Automated monitoring, integrity checking, and system maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {maintenanceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Refresh className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading maintenance status...</span>
                </div>
              ) : maintenance ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span className="text-sm font-medium">Monitoring</span>
                          </div>
                          <Badge variant={maintenance.monitoring_active ? "default" : "secondary"}>
                            {maintenance.monitoring_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4" />
                            <span className="text-sm font-medium">Tracked Files</span>
                          </div>
                          <Badge variant="outline">{maintenance.tracked_files}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <span className="text-sm font-medium">Auto-Healing</span>
                          </div>
                          <Badge variant="default">Enabled</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Maintenance Configuration</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Update Schedule:</span>
                          <p className="text-muted-foreground">{maintenance.config?.auto_update?.schedule || 'Not configured'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Integrity Actions:</span>
                          <p className="text-muted-foreground">
                            Corruption: {maintenance.config?.integrity_monitoring?.actions?.corruption || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <Warning className="h-4 w-4" />
                  <AlertTitle>Maintenance System Unavailable</AlertTitle>
                  <AlertDescription
>
                    Unable to connect to the maintenance monitoring system.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Health Monitor
              </CardTitle>
              <CardDescription
>
                Real-time system performance and service status monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Refresh className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading health data...</span>
                </div>
              ) : health ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">System Uptime</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Math.floor(health.system.uptime / 3600)}h {Math.floor((health.system.uptime % 3600) / 60)}m
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Memory Usage</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Used</span>
                            <span
>{health.system.memory.used} MB</span>
                          </div>
                          <Progress value={(health.system.memory.used / health.system.memory.total) * 100} />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Security Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Compliance:</span>
                            <Badge variant="default">{health.security.compliance_level}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Encryption:</span>
                            <Badge variant="outline">{health.security.encryption}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Service Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(health.services).map(([service, status]) => (
                        <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="font-medium capitalize">{service.replace(/_/g, ' ')}</span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={`text-sm ${getServiceStatusColor(status)}`}>
                              {status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <Warning className="h-4 w-4" />
                  <AlertTitle>Health Data Unavailable</AlertTitle>
                  <AlertDescription
>
                    Unable to retrieve system health information.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}