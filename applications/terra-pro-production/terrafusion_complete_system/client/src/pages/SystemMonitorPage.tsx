import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "@/components/ui/connection-status";
import { AlertCircle, CheckCircle2, Database, Refresh, Server, Zap  } from '@mui/icons-material';
import { useWebSocket } from "@/contexts/WebSocketContext";

interface SystemHealth {
  status: string;
  timestamp: string;
  components: {
    database: {
      status: string;
      responseTime: string;
      timestamp?: string;
      error?: string;
    };
    webSocketServer: {
      status: string;
      connections: number;
      listening: boolean;
      error?: string;
    };
  };
  metrics: {
    timestamp: string;
    uptime: number;
    memory: {
      total: number;
      free: number;
      used: number;
      usagePercent: string;
    };
    cpu: {
      loadAvg: number[];
      cores: number;
    };
    network: {
      interfaces: number;
    };
    process: {
      pid: number;
      memoryUsage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
        arrayBuffers?: number;
      };
      nodeVersion: string;
    };
  };
}

export default function SystemMonitorPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const { connectionStatus, isConnected } = useWebSocket();
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10 seconds

  // Fetch the system health data
  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useQuery<SystemHealth>({
    queryKey: ["/health/details"],
    refetchInterval: refreshInterval,
  });

  // Format bytes to human-readable format
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format date to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format uptime to a readable format
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  // Get status badge for a component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500">Healthy</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-500">Degraded</Badge>;
      case "unhealthy":
        return <Badge className="bg-red-500">Unhealthy</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  // Get status icon for a component
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "unhealthy":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container py-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center"><>

          <h1 className="text-3xl font-bold">System Monitor</h1>
          <div
</> className="flex gap-2 items-center"><>

            <span className="text-sm text-gray-500">
              Last updated: {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "Never"}
            </span>
            <Button
</> onClick={() => refetch()} variant="outline" size="icon"><>

              <Refresh className="h-4 w-4" />
            </Button>
            <div
</> className="flex items-center gap-2"><>

              <span className="text-sm text-gray-500">Auto-refresh:</span>
              <select
</>
                className="text-sm bg-gray-100 border border-gray-200 rounded px-2 py-1"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
              ><>

                <option value={5000}>5s</option>
                <option
</> value={10000}>10s</option><>

                <option value={30000}>30s</option>
                <option
</> value={60000}>1m</option>
                <option value={0}>Off</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-2">
              <Refresh className="animate-spin h-8 w-8 text-gray-400" />
              <p className="text-gray-500">Loading system health data...</p>
            </div>
          </div>
        )}

        {isError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-medium text-red-700">
                  Error loading system health data
                </h3>
              </div><>

              <p className="mt-2 text-red-600">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <Button
</> onClick={() => refetch()} className="mt-4" variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {data && (
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4"><>

              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger
</> value="memory">Memory</TabsTrigger><>

              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger
</> value="connections">Connections</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2"><>

                    <CardTitle className="text-lg flex justify-between items-center">
                      System Status
                      {getStatusBadge(data.status)}
                    </CardTitle>
                    <CardDescription
</>>Overall system health</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center"><>

                        <span>Uptime:</span>
                        <span
</> className="font-medium">{formatUptime(data.metrics.uptime)}</span>
                      </div>
                      <div className="flex justify-between items-center"><>

                        <span>Node.js Version:</span>
                        <span
</> className="font-medium">{data.metrics.process.nodeVersion}</span>
                      </div>
                      <div className="flex justify-between items-center"><>

                        <span>Last Checked:</span>
                        <span
</> className="font-medium">{formatDate(data.timestamp)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        <span>Database</span>
                      </div>
                      {getStatusBadge(data.components.database.status)}
                    </CardTitle>
                    <CardDescription>Database health and performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center"><>

                        <span>Status:</span>
                        <div
</> className="flex items-center gap-1">
                          {getStatusIcon(data.components.database.status)}
                          <span className="font-medium">{data.components.database.status}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center"><>

                        <span>Response Time:</span>
                        <span
</> className="font-medium">{data.components.database.responseTime}</span>
                      </div>
                      {data.components.database.error && (
                        <div className="mt-2 text-red-500 text-sm bg-red-50 p-2 rounded">
                          {data.components.database.error}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        <span>WebSocket Server</span>
                      </div>
                      {getStatusBadge(data.components.webSocketServer.status)}
                    </CardTitle>
                    <CardDescription>WebSocket connections and status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center"><>

                        <span>Status:</span>
                        <div
</> className="flex items-center gap-1">
                          {getStatusIcon(data.components.webSocketServer.status)}
                          <span className="font-medium">
                            {data.components.webSocketServer.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center"><>

                        <span>Active Connections:</span>
                        <span
</> className="font-medium">
                          {data.components.webSocketServer.connections}
                        </span>
                      </div>
                      <div className="flex justify-between items-center"><>

                        <span>Listening:</span>
                        <span
</> className="font-medium">
                          {data.components.webSocketServer.listening ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t"><>

                        <span>Client Connection:</span>
                        <ConnectionStatus
</> />
                      </div>
                      {data.components.webSocketServer.error && (
                        <div className="mt-2 text-red-500 text-sm bg-red-50 p-2 rounded">
                          {data.components.webSocketServer.error}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2"><>

                  <CardTitle className="text-lg">Memory Usage</CardTitle>
                  <CardDescription
</>>System memory allocation and usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="flex justify-between mb-1"><>

                        <span className="text-sm">
                          Memory Usage: {data.metrics.memory.usagePercent}%
                        </span>
                        <span
</> className="text-sm">
                          {formatBytes(data.metrics.memory.used)} /{" "}
                          {formatBytes(data.metrics.memory.total)}
                        </span>
                      </div><>

                      <Progress
                        value={parseFloat(data.metrics.memory.usagePercent)}
                        className="h-2"
                      />
                    </div>

                    <div
</>>
                      <div className="flex justify-between mb-1"><>

                        <span className="text-sm">Heap Usage</span>
                        <span
</> className="text-sm">
                          {formatBytes(data.metrics.process.memoryUsage.heapUsed)} /{" "}
                          {formatBytes(data.metrics.process.memoryUsage.heapTotal)}
                        </span>
                      </div>
                      <Progress
                        value={
                          (data.metrics.process.memoryUsage.heapUsed /
                            data.metrics.process.memoryUsage.heapTotal) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="memory" className="space-y-4">
              <Card>
                <CardHeader><>

                  <CardTitle>Memory Details</CardTitle>
                  <CardDescription
</>>Detailed memory usage information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><>

                      <h3 className="text-lg font-medium mb-3">System Memory</h3>
                      <div
</> className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1"><>

                            <span className="text-sm">
                              Memory Usage: {data.metrics.memory.usagePercent}%
                            </span>
                            <span
</> className="text-sm">
                              {formatBytes(data.metrics.memory.used)} /{" "}
                              {formatBytes(data.metrics.memory.total)}
                            </span>
                          </div><>

                          <Progress
                            value={parseFloat(data.metrics.memory.usagePercent)}
                            className="h-2"
                          />
                        </div>

                        <div
</> className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">Total Memory</div>
                            <div
</> className="text-lg font-medium">
                              {formatBytes(data.metrics.memory.total)}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">Free Memory</div>
                            <div
</> className="text-lg font-medium">
                              {formatBytes(data.metrics.memory.free)}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">Used Memory</div>
                            <div
</> className="text-lg font-medium">
                              {formatBytes(data.metrics.memory.used)}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">Usage Percent</div>
                            <div
</> className="text-lg font-medium">
                              {data.metrics.memory.usagePercent}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div><>

                      <h3 className="text-lg font-medium mb-3">Process Memory</h3>
                      <div
</> className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1"><>

                            <span className="text-sm">Heap Usage</span>
                            <span
</> className="text-sm">
                              {formatBytes(data.metrics.process.memoryUsage.heapUsed)} /{" "}
                              {formatBytes(data.metrics.process.memoryUsage.heapTotal)}
                            </span>
                          </div><>

                          <Progress
                            value={
                              (data.metrics.process.memoryUsage.heapUsed /
                                data.metrics.process.memoryUsage.heapTotal) *
                              100
                            }
                            className="h-2"
                          />
                        </div>

                        <div
</> className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">RSS</div>
                            <div
</> className="text-lg font-medium">
                              {formatBytes(data.metrics.process.memoryUsage.rss)}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">Heap Total</div>
                            <div
</> className="text-lg font-medium">
                              {formatBytes(data.metrics.process.memoryUsage.heapTotal)}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">Heap Used</div>
                            <div
</> className="text-lg font-medium">
                              {formatBytes(data.metrics.process.memoryUsage.heapUsed)}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">External</div>
                            <div
</> className="text-lg font-medium">
                              {formatBytes(data.metrics.process.memoryUsage.external)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <Card>
                <CardHeader><>

                  <CardTitle>System Information</CardTitle>
                  <CardDescription
</>>Detailed system metrics and information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><>

                      <h3 className="text-lg font-medium mb-3">CPU & Processing</h3>
                      <div
</> className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">CPU Cores</div>
                            <div
</> className="text-lg font-medium">{data.metrics.cpu.cores}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">Load Average (1m)</div>
                            <div
</> className="text-lg font-medium">
                              {data.metrics.cpu.loadAvg[0].toFixed(2)}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">Load Average (5m)</div>
                            <div
</> className="text-lg font-medium">
                              {data.metrics.cpu.loadAvg[1].toFixed(2)}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">Load Average (15m)</div>
                            <div
</> className="text-lg font-medium">
                              {data.metrics.cpu.loadAvg[2].toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div><>

                      <h3 className="text-lg font-medium mb-3">Process Information</h3>
                      <div
</> className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">Process ID</div>
                            <div
</> className="text-lg font-medium">{data.metrics.process.pid}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">Uptime</div>
                            <div
</> className="text-lg font-medium">
                              {formatUptime(data.metrics.uptime)}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">Node.js Version</div>
                            <div
</> className="text-lg font-medium">
                              {data.metrics.process.nodeVersion}
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded"><>

                            <div className="text-sm text-gray-500">Network Interfaces</div>
                            <div
</> className="text-lg font-medium">
                              {data.metrics.network.interfaces}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="connections" className="space-y-4">
              <Card>
                <CardHeader><>

                  <CardTitle>Connection Status</CardTitle>
                  <CardDescription
</>>Database and WebSocket connections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><>

                      <h3 className="text-lg font-medium mb-3">Database Connections</h3>
                      <div
</> className="bg-gray-50 p-4 rounded border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          {getStatusIcon(data.components.database.status)}
                          <span className="font-medium">
                            Status: {data.components.database.status}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between"><>

                            <span>Response Time:</span>
                            <span
</> className="font-medium">
                              {data.components.database.responseTime}
                            </span>
                          </div>
                          <div className="flex justify-between"><>

                            <span>Last Query:</span>
                            <span
</> className="font-medium">
                              {data.components.database.timestamp
                                ? formatDate(data.components.database.timestamp)
                                : "N/A"}
                            </span>
                          </div>
                          {data.components.database.error && (
                            <div className="mt-3 text-red-500 text-sm bg-red-50 p-2 rounded">
                              <div className="font-medium">Error:</div>
                              {data.components.database.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div><>

                      <h3 className="text-lg font-medium mb-3">WebSocket Connections</h3>
                      <div
</> className="bg-gray-50 p-4 rounded border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          {getStatusIcon(data.components.webSocketServer.status)}
                          <span className="font-medium">
                            Status: {data.components.webSocketServer.status}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between"><>

                            <span>Active Connections:</span>
                            <span
</> className="font-medium">
                              {data.components.webSocketServer.connections}
                            </span>
                          </div>
                          <div className="flex justify-between"><>

                            <span>Server Listening:</span>
                            <span
</> className="font-medium">
                              {data.components.webSocketServer.listening ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between"><>

                            <span>Current Client Status:</span>
                            <div
</> className="font-medium flex items-center gap-1">
                              <div
                                className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                              ></div>
                              {connectionStatus}
                            </div>
                          </div>
                          {data.components.webSocketServer.error && (
                            <div className="mt-3 text-red-500 text-sm bg-red-50 p-2 rounded">
                              <div className="font-medium">Error:</div>
                              {data.components.webSocketServer.error}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
