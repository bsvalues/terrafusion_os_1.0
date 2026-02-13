'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, MapPin, Zap, Shield, Users, Network, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

interface WebSocketMessage {
  message_type: string;
  timestamp: number;
  data: FederationMetrics | CountyConnection[] | { counties: CountyMetrics[], connections: CountyConnection[] } | null;
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

const FederationMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<FederationMetrics | null>(null);
  const [counties, setCounties] = useState<CountyMetrics[]>([]);
  const [connections, setConnections] = useState<CountyConnection[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const connectWebSocket = () => {
      try {
        const wsUrl = process.env.NODE_ENV === 'production' 
          ? 'wss://localhost:8787/ws/federation'
          : 'ws://localhost:8787/ws/federation';
        
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('Federation WebSocket connected');
          setIsConnected(true);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            setLastUpdate(new Date());

            switch (message.message_type) {
              case 'federation_initial_data':
                if (message.data && typeof message.data === 'object' && 'counties' in message.data) {
                  const initialData = message.data as { counties: CountyMetrics[], connections: CountyConnection[] };
                  if (initialData.counties) {
                    setCounties(initialData.counties);
                  }
                  if (initialData.connections) {
                    setConnections(initialData.connections);
                  }
                }
                break;
              case 'federation_metrics':
                if (message.data && typeof message.data === 'object' && 'timestamp' in message.data) {
                  setMetrics(message.data as FederationMetrics);
                }
                break;
              case 'connections_update':
                if (message.data && Array.isArray(message.data)) {
                  setConnections(message.data as CountyConnection[]);
                }
                break;
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log('Federation WebSocket disconnected');
          setIsConnected(false);
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };

        wsRef.current.onerror = (error) => {
          console.error('Federation WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setTimeout(connectWebSocket, 5000);
      }
    };

    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        const [metricsRes, countiesRes, connectionsRes] = await Promise.all([
          fetch('/api/federation/dashboard'),
          fetch('/api/federation/counties'),
          fetch('/api/federation/connections')
        ]);

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }

        if (countiesRes.ok) {
          const countiesData = await countiesRes.json();
          setCounties(countiesData);
        }

        if (connectionsRes.ok) {
          const connectionsData = await connectionsRes.json();
          setConnections(connectionsData);
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };

    fetchInitialData();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🌐 TerraFusion Federation Monitor
          </h1>
          <p className="text-slate-600 text-lg">
            Real-time county-to-county connectivity and performance dashboard
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Connected
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
            {lastUpdate && (
              <span className="text-sm text-slate-500">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Main Metrics Grid */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.system_health * 100, 1)}%
                </div>
                <Progress value={metrics.system_health * 100} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.active_counties}/{metrics.total_counties} counties active
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Throughput</CardTitle>
                <Zap className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.total_throughput_gbps, 2)} Gbps
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {metrics.active_connections} connections
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
                <Network className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.avg_latency_ms, 1)}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Network response time
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                <Shield className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Secure</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.security_incidents} incidents today
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Counties and Connections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Counties List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Federation Counties ({counties.length})</span>
              </CardTitle>
              <CardDescription>
                County nodes and their operational status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {counties.map((county, index) => (
                  <div
                    key={county.fips_code || index}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(county.status)}`} />
                      <div>
                        <div className="font-medium">{county.county_name}</div>
                        <div className="text-sm text-slate-500">
                          {county.active_connections} connections • {formatNumber(county.avg_latency_ms)}ms
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={getSecurityColor(county.security_clearance)} variant="secondary">
                        {county.security_clearance}
                      </Badge>
                      <div className="text-sm text-slate-500">
                        {formatBytes(county.total_throughput_mbps)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Connections List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5" />
                <span>Active Connections ({connections.length})</span>
              </CardTitle>
              <CardDescription>
                Real-time inter-county communication links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(connection.status)}`} />
                      <div>
                        <div className="font-medium text-sm">
                          {connection.source_county} → {connection.target_county}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center space-x-2">
                          <span>{formatNumber(connection.latency_ms)}ms</span>
                          <span>•</span>
                          <span>{formatNumber(connection.packet_loss_percent, 2)}% loss</span>
                          <Badge variant="outline" className="text-xs">
                            {connection.connection_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm font-medium">
                        {formatBytes(connection.throughput_mbps)}
                      </div>
                      <Progress 
                        value={connection.bandwidth_utilization * 100} 
                        className="w-16 h-2"
                      />
                      <div className="text-xs text-slate-500">
                        {formatNumber(connection.bandwidth_utilization * 100)}% util
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Geographic Coverage Metrics */}
        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Federation Overview</span>
              </CardTitle>
              <CardDescription>
                Comprehensive federation network statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(metrics.geographic_coverage * 100)}%
                  </div>
                  <div className="text-sm text-slate-600">Geographic Coverage</div>
                  <Progress value={metrics.geographic_coverage * 100} />
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(metrics.redundancy_factor, 1)}x
                  </div>
                  <div className="text-sm text-slate-600">Redundancy Factor</div>
                  <Progress value={(metrics.redundancy_factor / 3) * 100} />
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber((metrics.active_connections / metrics.total_connections) * 100)}%
                  </div>
                  <div className="text-sm text-slate-600">Connection Uptime</div>
                  <Progress value={(metrics.active_connections / metrics.total_connections) * 100} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FederationMonitoringDashboard;