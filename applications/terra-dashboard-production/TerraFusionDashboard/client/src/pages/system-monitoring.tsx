import { EnhancedMonitoringDashboard } from "@/components/enhanced-monitoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Activity,
  Download,
  Refresh,
  Settings,
  Warning,
  TrendingUp,
  Database,
  Network
 } from '@mui/icons-material';
import { formatDateTime, formatNumber } from "@/utils/format";

export default function SystemMonitoringPage() {
  const { data: systemLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['/api/system/logs'],
    refetchInterval: 30000,
  });

  const { data: auditTrail } = useQuery({
    queryKey: ['/api/system/audit'],
    refetchInterval: 60000,
  });

  const { data: deploymentInfo } = useQuery({
    queryKey: ['/api/system/deployment'],
  });

  const handleExportLogs = () => {
    // Export system logs
    const logs = systemLogs || [];
    const csvContent = "data:text/csv;charset=utf-8," + 
      "timestamp,level,service,message\n" +
      logs.map((log: any) => `${log.timestamp},${log.level},${log.service},"${log.message}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `terrafusion-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
<>
              <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
              <p
</> className="mt-2 text-gray-600">
                Real-time monitoring and performance analytics for Terrafusion Platform
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => refetchLogs()}
                className="flex items-center space-x-2"
              >
                <Refresh className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleExportLogs}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Logs</span>
              </Button>
              <Button variant="default" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Configure</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Performance</span>
            </TabsTrigger>
            <TabsTrigger value="infrastructure" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Infrastructure</span>
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center space-x-2">
              <Network className="h-4 w-4" />
              <span>Network</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center space-x-2">
              <Warning className="h-4 w-4" />
              <span>Logs & Alerts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <EnhancedMonitoringDashboard />
            
            {/* Deployment Information */}
            {deploymentInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Deployment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
<>
                      <p className="text-sm font-medium text-gray-500">Version</p>
                      <p
</> className="text-lg font-semibold">{deploymentInfo.version || '2.0.0'}</p>
                    </div>
                    <div>
<>
                      <p className="text-sm font-medium text-gray-500">Environment</p>
                      <Badge
</> variant={deploymentInfo.environment === 'production' ? 'default' : 'secondary'}>
                        {deploymentInfo.environment || 'development'}
                      </Badge>
                    </div>
                    <div>
<>
                      <p className="text-sm font-medium text-gray-500">Last Deployed</p>
                      <p
</> className="text-lg font-semibold">
                        {formatDateTime(deploymentInfo.deployed_at || new Date())}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Agent Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm font-medium">NarratorAI</span>
                      <div
</> className="flex items-center space-x-2">
<>
                        <Badge variant="outline">97.8% accuracy</Badge>
                        <span
</> className="text-sm text-gray-500">245ms avg</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm font-medium">ExemptionSeer</span>
                      <div
</> className="flex items-center space-x-2">
<>
                        <Badge variant="outline">94.2% accuracy</Badge>
                        <span
</> className="text-sm text-gray-500">312ms avg</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm font-medium">SalesValidator</span>
                      <div
</> className="flex items-center space-x-2">
<>
                        <Badge variant="outline">99.1% accuracy</Badge>
                        <span
</> className="text-sm text-gray-500">189ms avg</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm font-medium">CostAnalyzer</span>
                      <div
</> className="flex items-center space-x-2">
<>
                        <Badge variant="outline">96.5% accuracy</Badge>
                        <span
</> className="text-sm text-gray-500">278ms avg</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Processing Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
<>
                      <p className="text-2xl font-bold text-blue-600">{formatNumber(1018)}</p>
                      <p
</> className="text-sm text-gray-500">Properties Analyzed</p>
                    </div>
                    <div>
<>
                      <p className="text-2xl font-bold text-green-600">{formatNumber(847)}</p>
                      <p
</> className="text-sm text-gray-500">Assessments Complete</p>
                    </div>
                    <div>
<>
                      <p className="text-2xl font-bold text-purple-600">96.8%</p>
                      <p
</> className="text-sm text-gray-500">Overall Accuracy</p>
                    </div>
                    <div>
<>
                      <p className="text-2xl font-bold text-orange-600">234ms</p>
                      <p
</> className="text-sm text-gray-500">Avg Response Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kubernetes Pods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">terrafusion-app</span>
                      <Badge
</> variant="outline" className="text-green-600">3/3 Running</Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">postgres</span>
                      <Badge
</> variant="outline" className="text-green-600">1/1 Running</Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">redis</span>
                      <Badge
</> variant="outline" className="text-green-600">1/1 Running</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resource Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
<>
                        <span className="text-sm">CPU</span>
                        <span
</> className="text-sm font-medium">45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
<>
                        <span className="text-sm">Memory</span>
                        <span
</> className="text-sm font-medium">62%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '62%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
<>
                        <span className="text-sm">Storage</span>
                        <span
</> className="text-sm font-medium">28%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '28%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Auto-Scaling Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">Current Replicas</span>
                      <span
</> className="font-medium">3</span>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">Target CPU</span>
                      <span
</> className="font-medium">65%</span>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">Target Memory</span>
                      <span
</> className="font-medium">75%</span>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Scaling Policy Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="network" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Network Traffic</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">Inbound Traffic</span>
                      <span
</> className="font-medium">2.4 MB/s</span>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">Outbound Traffic</span>
                      <span
</> className="font-medium">1.8 MB/s</span>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">Active Connections</span>
                      <span
</> className="font-medium">147</span>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">WebSocket Connections</span>
                      <span
</> className="font-medium">23</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Endpoints Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">/api/properties</span>
                      <Badge
</> variant="outline" className="text-green-600">Healthy</Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">/api/agents</span>
                      <Badge
</> variant="outline" className="text-green-600">Healthy</Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">/api/assessments</span>
                      <Badge
</> variant="outline" className="text-green-600">Healthy</Badge>
                    </div>
                    <div className="flex justify-between items-center">
<>
                      <span className="text-sm">/api/system/health</span>
                      <Badge
</> variant="outline" className="text-green-600">Healthy</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent System Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {systemLogs?.slice(0, 50).map((log: any /* , index */: number) => (
                    <div key={index} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
<>
                      <Badge 
                        variant={log.level === 'error' ? 'destructive' : log.level === 'warn' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {log.level?.toUpperCase() || 'INFO'}
                      </Badge>
                      <div
</> className="flex-1 min-w-0">
<>
                        <p className="text-sm text-gray-900 truncate">{log.message}</p>
                        <p
</> className="text-xs text-gray-500">{formatDateTime(log.timestamp)}</p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <Warning className="h-8 w-8 mx-auto mb-2" />
                      <p>No recent logs available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}