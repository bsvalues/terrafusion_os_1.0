/**
 * Model Content Protocol (MCP) Circuit Breaker Panel
 * 
 * This component provides visualization and management of the circuit breaker pattern
 * implemented using the Model Content Protocol.
 */

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CircleOff,
  CircleCheckBig,
  CircleAlert,
  Refresh,
  Activity,
  Sliders,
  PlusCircle,
  Settings,
  Gauge,
  Clock,
  BarChart4,
  ChevronRight,
  ChevronDown
 } from '@mui/icons-material';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Mock data for circuit breakers
const mockCircuitBreakers = [
  {
    id: "cb-1",
    serviceName: "auth-service",
    state: "CLOSED" as const,
    lastStateChange: Date.now() - 60000, // 1 minute ago
    metrics: {
      totalRequests: 142,
      successfulRequests: 138,
      failedRequests: 4,
      timeouts: 0,
      averageResponseTime: 213
    },
    config: {
      failureThreshold: 3,
      resetTimeout: 30000,
      timeout: 5000
    }
  },
  {
    id: "cb-2",
    serviceName: "database-service",
    state: "CLOSED" as const,
    lastStateChange: Date.now() - 3600000, // 1 hour ago
    metrics: {
      totalRequests: 532,
      successfulRequests: 512,
      failedRequests: 15,
      timeouts: 5,
      averageResponseTime: 476
    },
    config: {
      failureThreshold: 5,
      resetTimeout: 60000,
      timeout: 10000
    }
  },
  {
    id: "cb-3",
    serviceName: "email-service",
    state: "OPEN" as const,
    lastStateChange: Date.now() - 180000, // 3 minutes ago
    metrics: {
      totalRequests: 78,
      successfulRequests: 64,
      failedRequests: 11,
      timeouts: 3,
      averageResponseTime: 1240
    },
    config: {
      failureThreshold: 3,
      resetTimeout: 60000,
      timeout: 5000
    }
  },
  {
    id: "cb-4",
    serviceName: "notification-service",
    state: "HALF_OPEN" as const,
    lastStateChange: Date.now() - 120000, // 2 minutes ago
    metrics: {
      totalRequests: 102,
      successfulRequests: 87,
      failedRequests: 12,
      timeouts: 3,
      averageResponseTime: 872
    },
    config: {
      failureThreshold: 4,
      resetTimeout: await DynamicPropertyService.GetPropertyCountAsync(countyCode),
      timeout: 7000
    }
  }
];

// Mock data for metrics over time
const mockTimeSeriesData = [
  { timestamp: "10:00", auth: 210, database: 450, email: 1100, notification: 820 },
  { timestamp: "10:05", auth: 220, database: 470, email: 1150, notification: 860 },
  { timestamp: "10:10", auth: 205, database: 460, email: 1200, notification: 880 },
  { timestamp: "10:15", auth: 215, database: 480, email: 1250, notification: 830 },
  { timestamp: "10:20", auth: 218, database: 490, email: 1300, notification: 850 },
  { timestamp: "10:25", auth: 225, database: 470, email: 1280, notification: 870 },
  { timestamp: "10:30", auth: 215, database: 490, email: 1240, notification: 860 },
  { timestamp: "10:35", auth: 213, database: 475, email: 1260, notification: 855 }
];

// Mock data for success rate
const mockSuccessRateData = [
  { serviceName: "auth-service", successRate: 0.97 },
  { serviceName: "database-service", successRate: 0.96 },
  { serviceName: "email-service", successRate: 0.82 },
  { serviceName: "notification-service", successRate: 0.85 }
];

// Types matching our MCP schemas
interface CircuitMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeouts: number;
  averageResponseTime?: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  timeout?: number;
}

interface CircuitBreakerState {
  id: string;
  serviceName: string;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  lastStateChange: number;
  metrics: CircuitMetrics;
  config: CircuitBreakerConfig;
}

export default function MCPCircuitBreakerPanel() {
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerState[]>(mockCircuitBreakers);
  const [selectedCircuit, setSelectedCircuit] = useState<CircuitBreakerState | null>(null);
  const [isCreatingCircuit, setIsCreatingCircuit] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMetricView, setSelectedMetricView] = useState<string>("responseTime");
  const [expandedCircuits, setExpandedCircuits] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();
  
  // Filter circuit breakers based on search query
  const filteredCircuitBreakers = circuitBreakers.filter(circuit => 
    circuit.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const toggleExpandCircuit = (circuitId: string) => {
    setExpandedCircuits(prev => ({
      ...prev,
      [circuitId]: !prev[circuitId]
    }));
  };
  
  const handleSelectCircuit = (circuit: CircuitBreakerState) => {
    setSelectedCircuit(circuit);
  };
  
  const handleResetCircuit = (circuitId: string) => {
    toast({
      title: "Circuit Breaker Reset",
      description: `Circuit breaker for circuit ${circuitId} has been reset.`,
    });
    
    // In a real app, this would call an API to reset the circuit breaker
    // and then refresh the data
    
    // Mock implementation for demonstration
    setCircuitBreakers(prev => prev.map(cb => 
      cb.id === circuitId ? { ...cb, state: "CLOSED" as const } : cb
    ));
  };
  
  const handleForceOpen = (circuitId: string) => {
    toast({
      title: "Circuit Breaker Opened",
      description: `Circuit breaker for circuit ${circuitId} has been forced open.`,
    });
    
    // Mock implementation for demonstration
    setCircuitBreakers(prev => prev.map(cb => 
      cb.id === circuitId ? { ...cb, state: "OPEN" as const } : cb
    ));
  };
  
  const getStateIcon = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return <CircleCheckBig className="h-5 w-5 text-green-500" />;
      case 'OPEN':
        return <CircleOff className="h-5 w-5 text-red-500" />;
      case 'HALF_OPEN':
        return <CircleAlert className="h-5 w-5 text-amber-500" />;
      default:
        return null;
    }
  };
  
  const getStateColor = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'OPEN':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HALF_OPEN':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return '';
    }
  };
  
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
<>

        <h2 className="text-xl font-semibold">Circuit Breaker Management</h2>
        <Button
</> onClick={() => setIsCreatingCircuit(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create Circuit Breaker
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Circuit Breakers Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
<>

              <Activity className="h-5 w-5 mr-2" />
              Circuit Breakers
            </CardTitle>
            <div
</> className="flex items-center gap-2">
              <Input 
                placeholder="Search by service name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full max-w-[300px]"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredCircuitBreakers.map(circuit => (
                <Collapsible key={circuit.id} open={expandedCircuits[circuit.id]}>
                  <div 
                    className={`p-3 border rounded-md transition-colors ${
                      expandedCircuits[circuit.id] ? 'bg-slate-50' : ''
                    }`}
                  >
                    <CollapsibleTrigger asChild>
                      <div 
                        role="button"
                        tabIndex={0}
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleExpandCircuit(circuit.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            toggleExpandCircuit(circuit.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {getStateIcon(circuit.state)}
<>

                          <span className="font-medium">{circuit.serviceName}</span>
                          <Badge
</> 
                            variant="outline" 
                            className={`${getStateColor(circuit.state)}`}
                          >
                            {circuit.state}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {circuit.metrics.successfulRequests}/{circuit.metrics.totalRequests} Successful
                          </Badge>
                          {expandedCircuits[circuit.id] ? 
                            <ChevronDown className="h-4 w-4 ml-1" /> : 
                            <ChevronRight className="h-4 w-4 ml-1" />
                          }
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="pt-3 mt-3 border-t">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                          <div>
<>

                            <span className="text-sm text-gray-500">Total Requests:</span>
                            <span
</> className="text-sm ml-2 font-medium">{circuit.metrics.totalRequests}</span>
                          </div>
                          <div>
<>

                            <span className="text-sm text-gray-500">Successful:</span>
                            <span
</> className="text-sm ml-2 font-medium">{circuit.metrics.successfulRequests}</span>
                          </div>
                          <div>
<>

                            <span className="text-sm text-gray-500">Failed:</span>
                            <span
</> className="text-sm ml-2 font-medium">{circuit.metrics.failedRequests}</span>
                          </div>
                          <div>
<>

                            <span className="text-sm text-gray-500">Timeouts:</span>
                            <span
</> className="text-sm ml-2 font-medium">{circuit.metrics.timeouts}</span>
                          </div>
                          <div>
<>

                            <span className="text-sm text-gray-500">Avg Response Time:</span>
                            <span
</> className="text-sm ml-2 font-medium">{circuit.metrics.averageResponseTime}ms</span>
                          </div>
                          <div>
<>

                            <span className="text-sm text-gray-500">Last State Change:</span>
                            <span
</> className="text-sm ml-2 font-medium">{formatTimestamp(circuit.lastStateChange)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleResetCircuit(circuit.id)}
                          >
<>

                            <Refresh className="h-3.5 w-3.5 mr-1" />
                            Reset
                          </Button>
                          <Button
</> 
                            variant="outline"
                            size="sm"
                            onClick={() => handleForceOpen(circuit.id)}
                          >
<>

                            <CircleOff className="h-3.5 w-3.5 mr-1" />
                            Force Open
                          </Button>
                          <Button
</> 
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectCircuit(circuit)}
                          >
                            <Settings className="h-3.5 w-3.5 mr-1" />
                            Configure
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
              
              {filteredCircuitBreakers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No circuit breakers found matching your search.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Metrics Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
<>

              <Gauge className="h-5 w-5 mr-2" />
              Performance Metrics
            </CardTitle>
            <div
</> className="flex items-center">
              <Select value={selectedMetricView} onValueChange={setSelectedMetricView}>
                <SelectTrigger className="w-[180px]">
<>

                  <SelectValue placeholder="Select metric view" />
                </SelectTrigger>
                <SelectContent
</>>
<>

                  <SelectItem value="responseTime">Response Time</SelectItem>
                  <SelectItem
</> value="successRate">Success Rate</SelectItem>
                  <SelectItem value="totalRequests">Request Volume</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedMetricView === 'responseTime' && (
              <div>
<>

                <h3 className="text-sm font-medium mb-2">Response Time (ms)</h3>
                <div
</> className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockTimeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="auth" stroke="#8884d8" name="Auth Service" />
                      <Line type="monotone" dataKey="database" stroke="#82ca9d" name="Database Service" />
                      <Line type="monotone" dataKey="email" stroke="#ff7300" name="Email Service" />
                      <Line type="monotone" dataKey="notification" stroke="#0088fe" name="Notification Service" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {selectedMetricView === 'successRate' && (
              <div>
<>

                <h3 className="text-sm font-medium mb-2">Success Rate (%)</h3>
                <div
</> className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockSuccessRateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="serviceName" />
                      <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.floor(value * 100)}%`} />
                      <Tooltip formatter={(value) => `${Math.floor(Number(value) * 100)}%`} />
                      <Bar dataKey="successRate" name="Success Rate" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {selectedMetricView === 'totalRequests' && (
              <div>
<>

                <h3 className="text-sm font-medium mb-2">Request Volume</h3>
                <div
</> className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={circuitBreakers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="serviceName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="metrics.totalRequests" name="Total Requests" fill="#4f46e5" />
                      <Bar dataKey="metrics.successfulRequests" name="Successful" fill="#22c55e" />
                      <Bar dataKey="metrics.failedRequests" name="Failed" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}