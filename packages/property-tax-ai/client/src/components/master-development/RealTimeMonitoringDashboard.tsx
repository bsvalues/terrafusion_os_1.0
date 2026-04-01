import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";
import PerformanceMetricsCard from './PerformanceMetricsCard';
import { LoaderCircle, RefreshCw, AlertTriangle, Server, Database, Shield, Network, Zap } from 'lucide-react';

const POLLING_INTERVAL = 10000; // 10 seconds

interface MonitoringEvent {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  component: string;
  message: string;
}

interface MetricGroup {
  title: string;
  description: string;
  metrics: {
    name: string;
    value: number;
    threshold: number;
    unit: string;
    status: 'healthy' | 'warning' | 'critical' | 'unknown';
  }[];
  overallStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
}

const RealTimeMonitoringDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isPolling, setIsPolling] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [monitoringEvents, setMonitoringEvents] = useState<MonitoringEvent[]>([]);
  
  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      // In a real implementation, this would fetch from the server
      // For now, we'll use the agent status API to demonstrate
      const response = await fetch('/api/agents/master-development-status');
      if (!response.ok) {
        throw new Error('Failed to fetch monitoring data');
      }
      
      const data = await response.json();
      
      // Update last updated timestamp
      setLastUpdated(new Date().toLocaleString());
      
      // Generate some sample events based on the health status
      const newEvents: MonitoringEvent[] = [];
      
      if (data.healthDetails?.integrationServices?.status === 'degraded') {
        newEvents.push({
          id: `event-${Date.now()}-1`,
          timestamp: new Date().toISOString(),
          level: 'warning',
          component: 'Integration Services',
          message: `Performance degraded: Latency increased to ${data.healthDetails.integrationServices.latency}ms`
        });
      }
      
      if (monitoringEvents.length === 0 || newEvents.length > 0) {
        setMonitoringEvents(prev => [...newEvents, ...prev].slice(0, 100)); // Keep max 100 events
      }
      
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      toast({
        title: 'Monitoring Error',
        description: 'Failed to fetch real-time monitoring data',
        variant: 'destructive'
      });
    }
  };
  
  // Setup polling
  useEffect(() => {
    // Fetch immediately on mount
    fetchMonitoringData();
    
    // Setup interval if polling is enabled
    let intervalId: NodeJS.Timeout | null = null;
    
    if (isPolling) {
      intervalId = setInterval(fetchMonitoringData, POLLING_INTERVAL);
    }
    
    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPolling]);
  
  // Toggle polling
  const togglePolling = () => {
    setIsPolling(!isPolling);
    toast({
      title: isPolling ? 'Monitoring Paused' : 'Monitoring Resumed',
      description: isPolling ? 'Real-time updates have been paused' : 'Real-time updates have been resumed',
    });
  };
  
  // Manual refresh
  const handleRefresh = () => {
    fetchMonitoringData();
    toast({
      title: 'Refreshed',
      description: 'Monitoring data has been manually refreshed',
    });
  };
  
  // Sample metric groups for demonstration
  const metricGroups: MetricGroup[] = [
    {
      title: 'Authentication Services',
      description: 'Key metrics for authentication system performance',
      overallStatus: 'healthy',
      metrics: [
        {
          name: 'Response Time',
          value: 45,
          threshold: 200,
          unit: 'ms',
          status: 'healthy'
        },
        {
          name: 'Error Rate',
          value: 0.01,
          threshold: 1.0,
          unit: '%',
          status: 'healthy'
        },
        {
          name: 'Active Sessions',
          value: 87,
          threshold: 500,
          unit: '',
          status: 'healthy'
        }
      ]
    },
    {
      title: 'Data Services',
      description: 'Database and data processing performance',
      overallStatus: 'healthy',
      metrics: [
        {
          name: 'Query Response Time',
          value: 120,
          threshold: 300,
          unit: 'ms',
          status: 'healthy'
        },
        {
          name: 'Cache Hit Rate',
          value: 93.5,
          threshold: 80,
          unit: '%',
          status: 'healthy'
        },
        {
          name: 'Active Transactions',
          value: 42,
          threshold: 100,
          unit: '',
          status: 'healthy'
        }
      ]
    },
    {
      title: 'Integration Services',
      description: 'Message bus and service integration metrics',
      overallStatus: 'warning',
      metrics: [
        {
          name: 'Message Processing Time',
          value: 250,
          threshold: 200,
          unit: 'ms',
          status: 'warning'
        },
        {
          name: 'Queue Size',
          value: 235,
          threshold: 300,
          unit: 'messages',
          status: 'warning'
        },
        {
          name: 'Error Rate',
          value: 1.2,
          threshold: 2.0,
          unit: '%',
          status: 'warning'
        }
      ]
    }
  ];
  
  // Define date formatting function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  // Get the level icon
  const getLevelIcon = (level: string) => {
    switch(level) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Server className="h-4 w-4 text-blue-500" />;
    }
  };
  
  // Get the component icon
  const getComponentIcon = (component: string) => {
    if (component.toLowerCase().includes('auth')) return <Shield className="h-4 w-4" />;
    if (component.toLowerCase().includes('data')) return <Database className="h-4 w-4" />;
    if (component.toLowerCase().includes('integration')) return <Network className="h-4 w-4" />;
    return <Zap className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Monitoring</h2>
          <p className="text-gray-500">
            Master Development Agent system performance dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePolling}
          >
            {isPolling ? 'Pause Updates' : 'Resume Updates'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPolling}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      
      {lastUpdated && (
        <div className="text-sm text-gray-500 flex items-center">
          {isPolling && <LoaderCircle className="h-3 w-3 mr-1 animate-spin" />}
          Last updated: {lastUpdated}
          {isPolling && ' • Auto-refreshing every 10 seconds'}
        </div>
      )}
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
        </TabsList>
        
        {/* System Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metricGroups.map((group, index) => (
              <PerformanceMetricsCard
                key={index}
                title={group.title}
                description={group.description}
                metrics={group.metrics}
                overallStatus={group.overallStatus}
                lastUpdated={lastUpdated || undefined}
              />
            ))}
          </div>
        </TabsContent>
        
        {/* Detailed Metrics Tab */}
        <TabsContent value="metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Services</CardTitle>
                <CardDescription>Detailed authentication metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Login Attempts</h4>
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">352</p>
                          <p className="text-xs text-gray-500">Total</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">347</p>
                          <p className="text-xs text-gray-500">Successful</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">5</p>
                          <p className="text-xs text-gray-500">Failed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Token Operations</h4>
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">891</p>
                          <p className="text-xs text-gray-500">Generated</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">87</p>
                          <p className="text-xs text-gray-500">Active</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">45</p>
                          <p className="text-xs text-gray-500">Refreshed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Data Services</CardTitle>
                <CardDescription>Database and data processing statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Query Statistics</h4>
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">1,287</p>
                          <p className="text-xs text-gray-500">Total Queries</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">120</p>
                          <p className="text-xs text-gray-500">Avg. Time (ms)</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">93.5%</p>
                          <p className="text-xs text-gray-500">Cache Hit Rate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Database Connections</h4>
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">10</p>
                          <p className="text-xs text-gray-500">Active</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">42</p>
                          <p className="text-xs text-gray-500">Txns Active</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">50</p>
                          <p className="text-xs text-gray-500">Pool Size</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Integration Services</CardTitle>
                <CardDescription>Message queue and service integration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Message Queue</h4>
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">235</p>
                          <p className="text-xs text-gray-500">Queue Size</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">75</p>
                          <p className="text-xs text-gray-500">Msg/sec</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">250</p>
                          <p className="text-xs text-gray-500">Avg. Latency (ms)</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">2 min</p>
                          <p className="text-xs text-gray-500">Oldest Message</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Service Connections</h4>
                    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">5</p>
                          <p className="text-xs text-gray-500">Active Connections</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-xs text-gray-500">Pending Requests</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">1.2%</p>
                          <p className="text-xs text-gray-500">Error Rate</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">99.85%</p>
                          <p className="text-xs text-gray-500">Uptime</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Event Log Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>System Event Log</CardTitle>
              <CardDescription>
                Real-time monitoring events from all system components
              </CardDescription>
            </CardHeader>
            <CardContent>
              {monitoringEvents.length === 0 ? (
                <Alert>
                  <Server className="h-4 w-4" />
                  <AlertTitle>No events recorded</AlertTitle>
                  <AlertDescription>
                    The system is operating normally with no recent events to display.
                  </AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {monitoringEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-md text-sm ${
                          event.level === 'error' 
                            ? 'bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500' 
                            : event.level === 'warning'
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-500'
                            : 'bg-gray-50 dark:bg-gray-900/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center">
                            {getLevelIcon(event.level)}
                            <span className="font-medium ml-1">
                              {event.level.charAt(0).toUpperCase() + event.level.slice(1)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-1">
                          {getComponentIcon(event.component)}
                          <span className="ml-1">{event.component}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-200">
                          {event.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-xs text-gray-500">
                Showing {monitoringEvents.length} recent events
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimeMonitoringDashboard;