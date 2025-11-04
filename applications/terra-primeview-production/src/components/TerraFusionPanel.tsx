
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, 
  Zap, 
  CloudUpload, 
  Warning, 
  CheckCircle2, 
  XCircle, 
  Radio,
  Database,
  Globe,
  Phone,
  Building2,
  Cpu
 } from '@mui/icons-material';
import { terraFusionOrchestrator, type ExternalSystem, type ThreatAlert } from "@/services/TerraFusionIntegration";
import { toast } from "sonner";

const TerraFusionPanel = () => {
  const [systems, setSystems] = useState<ExternalSystem[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [alerts, setAlerts] = useState<ThreatAlert[]>([]);

  useEffect(() => {
    const updateData = () => {
      setSystems(terraFusionOrchestrator.getIntegrations());
      setMetrics(terraFusionOrchestrator.getSystemMetrics());
    };

    updateData();
    const interval = setInterval(updateData, 3000);

    const unsubscribe = terraFusionOrchestrator.subscribeToAlerts((alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 10));
      toast.error(`${alert.severity} Threat Detected: ${alert.threat_type}`, {
        description: alert.description
      });
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const getSystemIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      'MUNICIPAL_GIS': Globe,
      'MUNICIPAL_ERP': Building2,
      'IOT_SENSORS': Radio,
      'EMERGENCY_SERVICES': Phone,
      'CLOUD_STORAGE': CloudUpload,
      'COMPLIANCE_SYSTEMS': Shield
    };
    const Icon = iconMap[type] || Database;
    return <Icon className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'bg-green-500';
      case 'CONNECTING': return 'bg-yellow-500 animate-pulse';
      case 'DISCONNECTED': return 'bg-red-500';
      case 'ERROR': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const handleTestThreatAlert = () => {
    const testAlert: ThreatAlert = {
      threat_id: `test-${Date.now()}`,
      asset_id: 'infrastructure-bridge-001',
      threat_type: 'structural_integrity_degradation',
      severity: 'HIGH',
      probability: 0.85,
      location: { latitude: 40.7128, longitude: -74.0060 },
      description: 'Structural integrity sensors detected abnormal stress patterns',
      mitigation_strategies: [
        'Deploy emergency inspection team',
        'Implement traffic restrictions',
        'Monitor real-time structural data',
        'Prepare contingency rerouting'
      ],
      requires_immediate_action: true
    };

    terraFusionOrchestrator.broadcastThreatAlert(testAlert);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center"><>

            <Shield className="w-6 h-6 mr-2 text-cyan-400" />
            Terrafusion Integration Center
          </h2>
          <p
</> className="text-slate-300">Omniscient civil infrastructure brain connectivity</p>
        </div>
        <Button 
          onClick={handleTestThreatAlert}
          variant="outline" 
          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
        >
          <Warning className="w-4 h-4 mr-2" />
          Test Threat Alert
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium text-slate-300">Connected Systems</CardTitle>
            <Cpu
</> className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-white">{metrics.connected_systems}/{metrics.total_systems}</div>
            <Progress
</> value={(metrics.connected_systems / metrics.total_systems) * 100} className="mt-2 bg-white/10" />
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium text-slate-300">Avg Health Score</CardTitle>
            <CheckCircle2
</> className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{(metrics.avg_health_score * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium text-slate-300">Avg Latency</CardTitle>
            <Zap
</> className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{Math.round(metrics.avg_latency || 0)}ms</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium text-slate-300">Data Points</CardTitle>
            <Database
</> className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.total_data_points?.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="systems" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/10"><>

          <TabsTrigger value="systems" className="text-white data-[state=active]:bg-cyan-500/20">External Systems</TabsTrigger>
          <TabsTrigger
</> value="alerts" className="text-white data-[state=active]:bg-cyan-500/20">Threat Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="systems" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-4">
            {systems.map((system) => (
              <Card key={system.id} className="bg-white/5 border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getSystemIcon(system.type)}
                      <div><>

                        <CardTitle className="text-white text-sm">{system.name}</CardTitle>
                        <CardDescription
</> className="text-slate-400 text-xs">{system.type.replace('_', ' ')}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(system.status)}`} />
                      <Badge variant="outline" className="text-xs border-white/20 text-slate-300">
                        {system.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><>

                    <span className="text-slate-300">Health Score:</span>
                    <span
</> className="text-white font-mono">{(system.health_score * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={system.health_score * 100} className="bg-white/10" />
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between"><>

                      <span className="text-slate-400">Latency:</span>
                      <span
</> className="text-cyan-400 font-mono">{system.latency_ms}ms</span>
                    </div>
                    <div className="flex justify-between"><>

                      <span className="text-slate-400">Error Rate:</span>
                      <span
</> className="text-red-400 font-mono">{(system.error_rate * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between"><>

                      <span className="text-slate-400">Data Points:</span>
                      <span
</> className="text-white font-mono">{system.data_points.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between"><>

                      <span className="text-slate-400">Last Sync:</span>
                      <span
</> className="text-green-400 font-mono">
                        {new Date(system.last_sync).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader><>

              <CardTitle className="text-white">Recent Threat Alerts</CardTitle>
              <CardDescription
</> className="text-slate-300">
                Real-time threat detection and response coordination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" /><>

                      <p>No threat alerts detected</p>
                      <p
</> className="text-xs">Systems operating within normal parameters</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.threat_id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Warning className={`w-5 h-5 ${
                              alert.severity === 'CRITICAL' || alert.severity === 'CATASTROPHIC' 
                                ? 'text-red-400' 
                                : alert.severity === 'HIGH' 
                                ? 'text-orange-400' 
                                : 'text-yellow-400'
                            }`} />
                            <div><>

                              <h4 className="text-white font-medium">{alert.threat_type.replace('_', ' ')}</h4>
                              <p
</> className="text-slate-400 text-sm">{alert.description}</p>
                            </div>
                          </div>
                          <Badge className={`${
                            alert.severity === 'CRITICAL' || alert.severity === 'CATASTROPHIC'
                              ? 'bg-red-500/20 text-red-300 border-red-500/30'
                              : alert.severity === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                              : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          }`}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <div className="mt-3 text-xs text-slate-400">
                          Asset: {alert.asset_id} • Probability: {(alert.probability * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TerraFusionPanel;
