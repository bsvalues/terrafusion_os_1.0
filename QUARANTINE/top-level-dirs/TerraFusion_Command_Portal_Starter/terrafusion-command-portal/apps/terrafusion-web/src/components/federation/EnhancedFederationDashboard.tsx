/**
 * TerraFusion Enhanced Federation Dashboard
 * 
 * Government-grade federation monitoring with advanced real-time capabilities
 * Comprehensive county and connection management dashboard
 * 
 * THE TERRAFUSION WAY: Ultimate federation excellence
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  MapPin, 
  Shield, 
  Users, 
  Network, 
  AlertTriangle, 
  CheckCircle2,
  Wifi,
  Server,
  Globe,
  Lock,
  TrendingUp,
  Gauge
} from 'lucide-react';
import { useAdvancedWebSocket, WebSocketMessage } from '@/lib/hooks/useAdvancedWebSocket';

interface CountyMetrics {
  fips_code?: string;
  county_name: string;
  state_code?: string;
  coordinates?: [number, number];
  population?: number;
  active_connections: number;
  total_throughput_mbps: number;
  avg_latency_ms: number;
  status: 'Online' | 'Degraded' | 'Offline' | 'Maintenance';
  last_updated: number;
  security_clearance: 'Public' | 'Confidential' | 'Secret' | 'TopSecret';
}

interface CountyConnection {
  id: string;
  source_county: string;
  target_county: string;
  source_fips?: string;
  target_fips?: string;
  status: 'Active' | 'Degraded' | 'Failed' | 'Maintenance' | 'Establishing';
  latency_ms: number;
  throughput_mbps: number;
  last_updated: number;
  connection_type: 'Primary' | 'Backup' | 'Emergency' | 'Satellite';
  security_level: 'Public' | 'Confidential' | 'Secret' | 'TopSecret';
  packet_loss_percent: number;
  bandwidth_utilization: number;
}

interface FederationMetrics {
  timestamp: number;
  total_counties: number;
  active_counties: number;
  total_connections: number;
  active_connections: number;
  avg_latency_ms: number;
  total_throughput_gbps: number;
  security_incidents: number;
  system_health: number;
  geographic_coverage: number;
  redundancy_factor: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
    case 'Online':
      return 'bg-green-500';
    case 'Degraded':
      return 'bg-yellow-500';
    case 'Failed':
    case 'Offline':
      return 'bg-red-500';
    case 'Maintenance':
      return 'bg-blue-500';
    case 'Establishing':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

const getSecurityColor = (level: string) => {
  switch (level) {
    case 'TopSecret':
      return 'bg-red-600 text-white';
    case 'Secret':
      return 'bg-orange-600 text-white';
    case 'Confidential':
      return 'bg-blue-600 text-white';
    case 'Public':
      return 'bg-green-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};

const EnhancedFederationDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<FederationMetrics | null>(null);
  const [counties, setCounties] = useState<CountyMetrics[]>([]);
  const [connections, setConnections] = useState<CountyConnection[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [alertsCount, setAlertsCount] = useState(0);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    setLastUpdate(new Date());

    switch (message.message_type) {
      case 'federation_initial_data':
        if (message.data && typeof message.data === 'object' && message.data !== null) {
          const data = message.data as { counties?: CountyMetrics[], connections?: CountyConnection[] };
          if (data.counties) setCounties(data.counties);
          if (data.connections) setConnections(data.connections);
        }
        break;
      case 'federation_metrics':
        if (message.data && typeof message.data === 'object') {
          setMetrics(message.data as FederationMetrics);
        }
        break;
      case 'connections_update':
        if (Array.isArray(message.data)) {
          setConnections(message.data as CountyConnection[]);
        }
        break;
      case 'security_alert':
        setAlertsCount(prev => prev + 1);
        break;
    }
  }, []);

  // Advanced WebSocket connection
  const wsUrl = process.env.NODE_ENV === 'production' 
    ? 'wss://localhost:8787/ws/federation'
    : 'ws://localhost:8787/ws/federation';

  const { status: wsStatus } = useAdvancedWebSocket({
    url: wsUrl,
    onMessage: handleWebSocketMessage,
    onConnect: () => console.log('[FEDERATION] WebSocket connected'),
    onDisconnect: () => console.log('[FEDERATION] WebSocket disconnected'),
    onError: (error) => console.error('[FEDERATION] WebSocket error:', error),
  });

  // Computed statistics
  const stats = useMemo(() => {
    const totalThroughput = counties.reduce((sum, county) => sum + county.total_throughput_mbps, 0);
    const avgLatency = counties.length > 0 
      ? counties.reduce((sum, county) => sum + county.avg_latency_ms, 0) / counties.length 
      : 0;
    
    const connectionHealth = connections.length > 0
      ? (connections.filter(conn => conn.status === 'Active').length / connections.length) * 100
      : 0;

    return {
      totalThroughput: totalThroughput / 1000, // Convert to Gbps
      avgLatency,
      connectionHealth,
      secureConnections: connections.filter(conn => 
        conn.security_level === 'Secret' || conn.security_level === 'TopSecret'
      ).length,
    };
  }, [counties, connections]);

  const formatNumber = (num: number, decimals: number = 1): string => {
    return num.toFixed(decimals);
  };

  const formatBytes = (mbps: number): string => {
    if (mbps >= 1000) {
      return `${(mbps / 1000).toFixed(2)} Gbps`;
    }
    return `${mbps.toFixed(1)} Mbps`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <Globe className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              TerraFusion Federation Command Center
            </h1>
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          
          <p className="text-slate-600 text-lg font-medium">
            Advanced Government-Grade Federation Monitoring & Analytics
          </p>
          
          <div className="flex items-center justify-center space-x-6">
            <Badge variant={wsStatus.connected ? 'default' : 'destructive'} className="px-4 py-2">
              {wsStatus.connected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Real-time Connected
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Connection Lost
                </>
              )}
            </Badge>
            
            {wsStatus.connected && (
              <Badge variant="outline" className="px-4 py-2">
                <Wifi className="w-4 h-4 mr-2" />
                {wsStatus.latency}ms latency
              </Badge>
            )}
            
            {lastUpdate && (
              <span className="text-sm text-slate-500 font-mono">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            
            {alertsCount > 0 && (
              <Badge variant="destructive" className="px-4 py-2">
                <AlertTriangle className="w-4 h-4 mr-2" />
                {alertsCount} Security Alerts
              </Badge>
            )}
          </div>
        </div>

        {/* Advanced Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-emerald-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Federation Health</CardTitle>
              <Activity className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">
                {formatNumber(stats.connectionHealth)}%
              </div>
              <Progress value={stats.connectionHealth} className="mt-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {counties.filter(c => c.status === 'Online').length}/{counties.length} counties online
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Throughput</CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {formatNumber(stats.totalThroughput, 2)} Gbps
              </div>
              <p className="text-xs text-muted-foreground">
                Across {connections.length} active connections
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Latency</CardTitle>
              <Gauge className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {formatNumber(stats.avgLatency)}ms
              </div>
              <p className="text-xs text-muted-foreground">
                Average response time
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Secure Channels</CardTitle>
              <Lock className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {stats.secureConnections}
              </div>
              <p className="text-xs text-muted-foreground">
                High-security connections
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Counties and Connections Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Enhanced Counties Panel */}
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <span>Federation Counties ({counties.length})</span>
                </div>
                <Badge variant="outline">{counties.filter(c => c.status === 'Online').length} Active</Badge>
              </CardTitle>
              <CardDescription>
                Real-time county node monitoring and performance analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {counties.map((county, index) => (
                  <div
                    key={county.fips_code || index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl hover:from-slate-100 hover:to-slate-200 transition-all duration-300 border shadow-sm"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(county.status)} shadow-lg`} />
                      <div>
                        <div className="font-semibold text-slate-800">{county.county_name}</div>
                        <div className="text-sm text-slate-600 flex items-center space-x-3">
                          <span className="flex items-center space-x-1">
                            <Network className="w-3 h-3" />
                            <span>{county.active_connections} links</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Gauge className="w-3 h-3" />
                            <span>{formatNumber(county.avg_latency_ms)}ms</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge className={getSecurityColor(county.security_clearance)} variant="secondary">
                        {county.security_clearance}
                      </Badge>
                      <div className="text-sm font-medium text-slate-700">
                        {formatBytes(county.total_throughput_mbps)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Connections Panel */}
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Server className="h-6 w-6 text-green-600" />
                  <span>Active Connections ({connections.length})</span>
                </div>
                <Badge variant="outline">{connections.filter(c => c.status === 'Active').length} Online</Badge>
              </CardTitle>
              <CardDescription>
                Inter-county communication links with performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl hover:from-slate-100 hover:to-slate-200 transition-all duration-300 border shadow-sm"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(connection.status)} shadow-lg`} />
                      <div>
                        <div className="font-medium text-sm text-slate-800">
                          {connection.source_county} → {connection.target_county}
                        </div>
                        <div className="text-xs text-slate-600 flex items-center space-x-3">
                          <span>{formatNumber(connection.latency_ms)}ms</span>
                          <span>•</span>
                          <span>{formatNumber(connection.packet_loss_percent, 2)}% loss</span>
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            {connection.connection_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-sm font-semibold text-slate-700">
                        {formatBytes(connection.throughput_mbps)}
                      </div>
                      <Progress 
                        value={connection.bandwidth_utilization * 100} 
                        className="w-20 h-2"
                      />
                      <div className="text-xs text-slate-500">
                        {formatNumber(connection.bandwidth_utilization * 100)}% utilization
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Overview Panel */}
        {metrics && (
          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50">
              <CardTitle className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-blue-600" />
                <span>Federation System Overview</span>
              </CardTitle>
              <CardDescription>
                Comprehensive federation network health and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-blue-600">
                    {formatNumber(metrics.geographic_coverage * 100)}%
                  </div>
                  <div className="text-sm font-medium text-slate-600">Geographic Coverage</div>
                  <Progress value={metrics.geographic_coverage * 100} className="h-3" />
                </div>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-purple-600">
                    {formatNumber(metrics.redundancy_factor, 1)}x
                  </div>
                  <div className="text-sm font-medium text-slate-600">Network Redundancy</div>
                  <Progress value={(metrics.redundancy_factor / 3) * 100} className="h-3" />
                </div>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-emerald-600">
                    {formatNumber((metrics.active_connections / metrics.total_connections) * 100)}%
                  </div>
                  <div className="text-sm font-medium text-slate-600">System Availability</div>
                  <Progress value={(metrics.active_connections / metrics.total_connections) * 100} className="h-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnhancedFederationDashboard;