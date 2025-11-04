import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleDashed, 
  ClipboardList,
  Clock,
  Gauge,
  Layers,
  LineChart,
  Loader2,
  MemoryStick,
  Pointer,
  ShieldCheck, 
  Sliders,
  Terminal,
  Timer,
  Zap
 } from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface RealtimeProcessingProps {
  className?: string;
}

type ProcessStatus = 'active' | 'idle' | 'error' | 'throttled';

interface ProcessMetrics {
  throughput: number;
  latency: number;
  successRate: number;
  errorRate: number;
  backpressure: number;
  resourceUtilization: number;
}

interface ProcessInstance {
  id: string;
  name: string;
  type: 'streaming' | 'realtime-etl' | 'event-driven' | 'continuous-query';
  status: ProcessStatus;
  description: string;
  sourceId: string;
  sourceName: string;
  startedAt: string;
  metrics: ProcessMetrics;
  config: {
    autoScaling: boolean;
    maxInstances: number;
    memoryPerInstance: number;
    checkpointInterval: number;
    bufferSize: number;
    windowSize: number;
    priority: 'high' | 'medium' | 'low';
  };
  alertThresholds: {
    latency: number;
    errorRate: number;
    resourceUtilization: number;
  };
  recentEvents: {
    timestamp: string;
    type: 'data' | 'system' | 'error';
    message: string;
  }[];
}

export function RealtimeProcessing({ className = '' }: RealtimeProcessingProps) {
  const [activeTab, setActiveTab] = useState('processes');
  const [processes, setProcesses] = useState<ProcessInstance[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<ProcessInstance | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProcessName, setNewProcessName] = useState('');
  const [newProcessType, setNewProcessType] = useState<string>('streaming');
  const [sourceId, setSourceId] = useState<string>('');
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  const { toast } = useToast();

  // Initialize with demo data
  useEffect(() => {
    // Simulate loading process instances from API
    const demoProcesses: ProcessInstance[] = [
      {
        id: 'proc-001',
        name: 'Permit Stream Processor',
        type: 'streaming',
        status: 'active',
        description: 'Real-time processing of permit data from City Planning API',
        sourceId: 'src-001',
        sourceName: 'City Planning Department API',
        startedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        metrics: {
          throughput: 42.5, // records/sec
          latency: 215, // ms
          successRate: 99.7,
          errorRate: 0.3,
          backpressure: 15, // %
          resourceUtilization: 45 // %
        },
        config: {
          autoScaling: true,
          maxInstances: 3,
          memoryPerInstance: 512, // MB
          checkpointInterval: 60, // seconds
          bufferSize: 1000, // records
          windowSize: 5, // minutes
          priority: 'high'
        },
        alertThresholds: {
          latency: 500, // ms
          errorRate: 2, // %
          resourceUtilization: 80 // %
        },
        recentEvents: [
          {
            timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            type: 'system',
            message: 'Checkpoint completed successfully'
          },
          {
            timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
            type: 'data',
            message: 'Processed batch of 500 permit records'
          },
          {
            timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            type: 'error',
            message: 'Temporary connection timeout, retried successfully'
          }
        ]
      },
      {
        id: 'proc-002',
        name: 'Property Assessment ETL',
        type: 'realtime-etl',
        status: 'idle',
        description: 'Real-time ETL processing for County Assessor data',
        sourceId: 'src-002',
        sourceName: 'County Assessor Database',
        startedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        metrics: {
          throughput: 0,
          latency: 0,
          successRate: 100,
          errorRate: 0,
          backpressure: 0,
          resourceUtilization: 5
        },
        config: {
          autoScaling: false,
          maxInstances: 1,
          memoryPerInstance: 1024,
          checkpointInterval: 300,
          bufferSize: 5000,
          windowSize: 15,
          priority: 'medium'
        },
        alertThresholds: {
          latency: 1000,
          errorRate: 5,
          resourceUtilization: 90
        },
        recentEvents: [
          {
            timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
            type: 'system',
            message: 'Process stopped due to source database maintenance'
          },
          {
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            type: 'data',
            message: 'Processed full data refresh with 356,842 records'
          }
        ]
      }
    ];

    setProcesses(demoProcesses);
    setLoading(false);
    
    // Simulate metrics refresh
    const intervalId = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Update metrics in real-time
  useEffect(() => {
    if (processes.length === 0) return;
    
    setProcesses(prev => prev.map(process => {
      if (process.status !== 'active') return process;
      
      // Simulate random fluctuations in metrics
      const randomFactor = () => (Math.random() * 0.1) - 0.05; // -5% to +5%
      
      return {
        ...process,
        metrics: {
          throughput: Math.max(0, process.metrics.throughput * (1 + randomFactor())),
          latency: Math.max(10, process.metrics.latency * (1 + randomFactor())),
          successRate: Math.min(100, Math.max(80, process.metrics.successRate + (randomFactor() * 0.5))),
          errorRate: Math.max(0, Math.min(20, process.metrics.errorRate + (randomFactor() * 0.5))),
          backpressure: Math.max(0, Math.min(100, process.metrics.backpressure + (randomFactor() * 10))),
          resourceUtilization: Math.max(0, Math.min(100, process.metrics.resourceUtilization + (randomFactor() * 5)))
        }
      };
    }));
  }, [refreshCounter, processes]);

  const handleCreateProcess = () => {
    setIsCreating(true);
    setNewProcessName('');
    setNewProcessType('streaming');
    setSourceId('');
    setConfigValues({
      autoScaling: true,
      maxInstances: 2,
      memoryPerInstance: 512,
      checkpointInterval: 60,
      bufferSize: 1000,
      windowSize: 5,
      priority: 'medium'
    });
  };

  const handleConfigureProcess = (process: ProcessInstance) => {
    setSelectedProcess(process);
    setIsConfiguring(true);
    setConfigValues(process.config);
  };

  const handleSaveConfiguration = () => {
    if (!selectedProcess) return;
    
    setProcesses(prev => prev.map(p => 
      p.id === selectedProcess.id 
        ? { 
            ...p, 
            config: {
              autoScaling: Boolean(configValues.autoScaling),
              maxInstances: Number(configValues.maxInstances || 1),
              memoryPerInstance: Number(configValues.memoryPerInstance || 512),
              checkpointInterval: Number(configValues.checkpointInterval || 60),
              bufferSize: Number(configValues.bufferSize || 1000),
              windowSize: Number(configValues.windowSize || 5),
              priority: (configValues.priority as 'high' | 'medium' | 'low') || 'medium'
            } 
          }
        : p
    ));
    
    setIsConfiguring(false);
    
    toast({
      title: 'Configuration Saved',
      description: `Process "${selectedProcess.name}" configuration updated successfully.`,
    });
  };

  const handleSaveNewProcess = () => {
    if (!newProcessName.trim() || !sourceId) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a name and select a data source.',
        variant: 'destructive',
      });
      return;
    }
    
    const selectedSource = sourceId === 'src-001' 
      ? { id: 'src-001', name: 'City Planning Department API' }
      : { id: 'src-002', name: 'County Assessor Database' };
    
    const newProcess: ProcessInstance = {
      id: `proc-${Math.random().toString(36).substring(2, 8)}`,
      name: newProcessName,
      type: newProcessType as any,
      status: 'idle',
      description: `Real-time processing of data from ${selectedSource.name}`,
      sourceId: selectedSource.id,
      sourceName: selectedSource.name,
      startedAt: new Date().toISOString(),
      metrics: {
        throughput: 0,
        latency: 0,
        successRate: 100,
        errorRate: 0,
        backpressure: 0,
        resourceUtilization: 5
      },
      config: {
        autoScaling: Boolean(configValues.autoScaling),
        maxInstances: Number(configValues.maxInstances || 2),
        memoryPerInstance: Number(configValues.memoryPerInstance || 512),
        checkpointInterval: Number(configValues.checkpointInterval || 60),
        bufferSize: Number(configValues.bufferSize || 1000),
        windowSize: Number(configValues.windowSize || 5),
        priority: (configValues.priority as 'high' | 'medium' | 'low') || 'medium'
      },
      alertThresholds: {
        latency: 800,
        errorRate: 3,
        resourceUtilization: 85
      },
      recentEvents: [
        {
          timestamp: new Date().toISOString(),
          type: 'system',
          message: 'Process created and initialized'
        }
      ]
    };
    
    setProcesses(prev => [...prev, newProcess]);
    setIsCreating(false);
    
    toast({
      title: 'Process Created',
      description: `New process "${newProcessName}" has been created successfully.`,
    });
  };

  const handleStartStopProcess = (process: ProcessInstance) => {
    setProcesses(prev => prev.map(p => {
      if (p.id !== process.id) return p;
      
      const newStatus = p.status === 'active' ? 'idle' : 'active';
      const message = newStatus === 'active' 
        ? 'Process started successfully' 
        : 'Process stopped successfully';
      
      toast({
        title: newStatus === 'active' ? 'Process Started' : 'Process Stopped',
        description: `${p.name} has been ${newStatus === 'active' ? 'started' : 'stopped'}.`,
      });
      
      return {
        ...p,
        status: newStatus,
        recentEvents: [
          {
            timestamp: new Date().toISOString(),
            type: 'system',
            message
          },
          ...p.recentEvents
        ]
      };
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadge = (status: ProcessStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'idle':
        return <Badge variant="outline">Idle</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'throttled':
        return <Badge variant="secondary">Throttled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMetricStatus = (
    value: number, 
    thresholdValue: number, 
    isReversed = false
  ) => {
    const isOverThreshold = isReversed
      ? value < thresholdValue
      : value > thresholdValue;
    
    return isOverThreshold
      ? 'text-red-500'
      : 'text-green-500';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader><>

          <CardTitle>Realtime Processing</CardTitle>
          <CardDescription
</>>Configure and monitor realtime data processing</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading real-time processors...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader><>

          <CardTitle>Realtime Processing</CardTitle>
          <CardDescription
</>>Configure and monitor realtime data processing</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>Error</AlertTitle>
            <AlertDescription
</>>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><>

            <CardTitle>Realtime Processing</CardTitle>
            <CardDescription
</>>Configure and monitor realtime data processing</CardDescription>
          </div>
          {!isCreating && !isConfiguring && (
            <Button onClick={handleCreateProcess}>
              <Zap className="mr-2 h-4 w-4" />
              New Process
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isCreating && (
          <div className="space-y-4"><>

            <h3 className="text-lg font-medium">Create New Process</h3>
            <div
</> className="grid gap-4">
              <div className="grid gap-2"><>

                <Label htmlFor="process-name">Process Name</Label>
                <Input
</>
                  id="process-name"
                  placeholder="Enter process name"
                  value={newProcessName}
                  onChange={(e) => setNewProcessName(e.target.value)}
                />
              </div>
              <div className="grid gap-2"><>

                <Label htmlFor="process-type">Process Type</Label>
                <Select
</>
                  value={newProcessType}
                  onValueChange={setNewProcessType}
                >
                  <SelectTrigger id="process-type"><>

                    <SelectValue placeholder="Select process type" />
                  </SelectTrigger>
                  <SelectContent
</>><>

                    <SelectItem value="streaming">Streaming</SelectItem>
                    <SelectItem
</> value="realtime-etl">Realtime ETL</SelectItem><>

                    <SelectItem value="event-driven">Event-Driven</SelectItem>
                    <SelectItem
</> value="continuous-query">Continuous Query</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><>

                <Label htmlFor="data-source">Data Source</Label>
                <Select
</>
                  value={sourceId}
                  onValueChange={setSourceId}
                >
                  <SelectTrigger id="data-source"><>

                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent
</>><>

                    <SelectItem value="src-001">City Planning Department API</SelectItem>
                    <SelectItem
</> value="src-002">County Assessor Database</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator /><>

              <h4 className="text-sm font-medium">Configuration</h4>
              <div
</> className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between"><>

                    <Label htmlFor="config-autoscaling">Auto Scaling</Label>
                    <Switch
</>
                      id="config-autoscaling"
                      checked={configValues.autoScaling || false}
                      onCheckedChange={(checked) => setConfigValues(prev => ({ ...prev, autoScaling: checked }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2"><>

                  <Label htmlFor="config-instances">Max Instances</Label>
                  <Input
</>
                    id="config-instances"
                    type="number"
                    min="1"
                    max="10"
                    value={configValues.maxInstances || 2}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, maxInstances: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2"><>

                  <Label htmlFor="config-memory">Memory Per Instance (MB)</Label>
                  <Input
</>
                    id="config-memory"
                    type="number"
                    min="256"
                    step="256"
                    value={configValues.memoryPerInstance || 512}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, memoryPerInstance: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2"><>

                  <Label htmlFor="config-checkpoint">Checkpoint Interval (sec)</Label>
                  <Input
</>
                    id="config-checkpoint"
                    type="number"
                    min="10"
                    value={configValues.checkpointInterval || 60}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, checkpointInterval: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2"><>

                  <Label htmlFor="config-buffer">Buffer Size (records)</Label>
                  <Input
</>
                    id="config-buffer"
                    type="number"
                    min="100"
                    value={configValues.bufferSize || 1000}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, bufferSize: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2"><>

                  <Label htmlFor="config-window">Window Size (minutes)</Label>
                  <Input
</>
                    id="config-window"
                    type="number"
                    min="1"
                    value={configValues.windowSize || 5}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, windowSize: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2"><>

                  <Label htmlFor="config-priority">Priority</Label>
                  <Select
</>
                    value={configValues.priority || 'medium'}
                    onValueChange={(value) => setConfigValues(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger id="config-priority"><>

                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="high">High</SelectItem>
                      <SelectItem
</> value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4"><>

              <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button
</> onClick={handleSaveNewProcess}>Create Process</Button>
            </div>
          </div>
        )}

        {isConfiguring && selectedProcess && (
          <div className="space-y-4"><>

            <h3 className="text-lg font-medium">Configure Process: {selectedProcess.name}</h3>
            <div
</> className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between"><>

                    <Label htmlFor="edit-autoscaling">Auto Scaling</Label>
                    <Switch
</>
                      id="edit-autoscaling"
                      checked={configValues.autoScaling || false}
                      onCheckedChange={(checked) => setConfigValues(prev => ({ ...prev, autoScaling: checked }))}
                    />
                  </div>
                </div>
                <div className="grid gap-2"><>

                  <Label htmlFor="edit-instances">Max Instances</Label>
                  <Input
</>
                    id="edit-instances"
                    type="number"
                    min="1"
                    max="10"
                    value={configValues.maxInstances || 2}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, maxInstances: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2"><>

                  <Label htmlFor="edit-memory">Memory Per Instance (MB)</Label>
                  <Input
</>
                    id="edit-memory"
                    type="number"
                    min="256"
                    step="256"
                    value={configValues.memoryPerInstance || 512}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, memoryPerInstance: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2"><>

                  <Label htmlFor="edit-checkpoint">Checkpoint Interval (sec)</Label>
                  <Input
</>
                    id="edit-checkpoint"
                    type="number"
                    min="10"
                    value={configValues.checkpointInterval || 60}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, checkpointInterval: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2"><>

                  <Label htmlFor="edit-buffer">Buffer Size (records)</Label>
                  <Input
</>
                    id="edit-buffer"
                    type="number"
                    min="100"
                    value={configValues.bufferSize || 1000}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, bufferSize: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2"><>

                  <Label htmlFor="edit-window">Window Size (minutes)</Label>
                  <Input
</>
                    id="edit-window"
                    type="number"
                    min="1"
                    value={configValues.windowSize || 5}
                    onChange={(e) => setConfigValues(prev => ({ ...prev, windowSize: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2"><>

                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
</>
                    value={configValues.priority || 'medium'}
                    onValueChange={(value) => setConfigValues(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger id="edit-priority"><>

                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="high">High</SelectItem>
                      <SelectItem
</> value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4"><>

              <Button variant="outline" onClick={() => setIsConfiguring(false)}>Cancel</Button>
              <Button
</> onClick={handleSaveConfiguration}>Save Configuration</Button>
            </div>
          </div>
        )}

        {!isCreating && !isConfiguring && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList><>

              <TabsTrigger value="processes">Processes</TabsTrigger>
              <TabsTrigger
</> value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>
            
            <TabsContent value="processes" className="space-y-4">
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow><>

                        <TableHead>Name</TableHead>
                        <TableHead
</>>Type</TableHead><>

                        <TableHead>Source</TableHead>
                        <TableHead
</>>Status</TableHead><>

                        <TableHead>Started</TableHead>
                        <TableHead
</> className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processes.map((process) => (
                        <TableRow key={process.id}><>

                          <TableCell className="font-medium">{process.name}</TableCell>
                          <TableCell
</>>
                            {process.type === 'streaming' && <Badge variant="outline" className="bg-blue-50">Streaming</Badge>}
                            {process.type === 'realtime-etl' && <Badge variant="outline" className="bg-purple-50">Realtime ETL</Badge>}
                            {process.type === 'event-driven' && <Badge variant="outline" className="bg-yellow-50">Event-Driven</Badge>}
                            {process.type === 'continuous-query' && <Badge variant="outline" className="bg-green-50">Continuous Query</Badge>}
                          </TableCell><>

                          <TableCell>{process.sourceName}</TableCell>
                          <TableCell
</>>{getStatusBadge(process.status)}</TableCell><>

                          <TableCell>{formatDate(process.startedAt)}</TableCell>
                          <TableCell
</> className="text-right">
                            <div className="flex justify-end gap-2"><>

                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleStartStopProcess(process)}
                              >
                                {process.status === 'active' ? 'Stop' : 'Start'}
                              </Button>
                              <Button
</> 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleConfigureProcess(process)}
                              >
                                Configure
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="metrics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processes.map((process) => (
                  <Card key={process.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        <div className="flex items-center justify-between">
                          <span>{process.name}</span>
                          {getStatusBadge(process.status)}
                        </div>
                      </CardTitle>
                      <CardDescription>{process.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      {process.status === 'active' ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm"><>

                                <span className="text-muted-foreground">Throughput</span>
                                <span
</> className="font-medium">{process.metrics.throughput.toFixed(1)} rec/s</span>
                              </div><>

                              <Progress value={process.metrics.throughput} max={100} className="h-2" />
                            </div>
                            <div
</> className="space-y-1">
                              <div className="flex justify-between text-sm"><>

                                <span className="text-muted-foreground">Latency</span>
                                <span
</> className={`font-medium ${getMetricStatus(process.metrics.latency, process.alertThresholds.latency)}`}>
                                  {process.metrics.latency.toFixed(0)} ms
                                </span>
                              </div>
                              <Progress value={Math.min(100, (process.metrics.latency / 10))} max={100} className="h-2" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm"><>

                                <span className="text-muted-foreground">Success Rate</span>
                                <span
</> className="font-medium">{process.metrics.successRate.toFixed(1)}%</span>
                              </div><>

                              <Progress value={process.metrics.successRate} max={100} className="h-2" />
                            </div>
                            <div
</> className="space-y-1">
                              <div className="flex justify-between text-sm"><>

                                <span className="text-muted-foreground">Error Rate</span>
                                <span
</> className={`font-medium ${getMetricStatus(process.metrics.errorRate, process.alertThresholds.errorRate)}`}>
                                  {process.metrics.errorRate.toFixed(1)}%
                                </span>
                              </div>
                              <Progress value={process.metrics.errorRate * 10} max={100} className="h-2" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm"><>

                                <span className="text-muted-foreground">Backpressure</span>
                                <span
</> className="font-medium">{process.metrics.backpressure.toFixed(0)}%</span>
                              </div><>

                              <Progress value={process.metrics.backpressure} max={100} className="h-2" />
                            </div>
                            <div
</> className="space-y-1">
                              <div className="flex justify-between text-sm"><>

                                <span className="text-muted-foreground">Resource Util.</span>
                                <span
</> className={`font-medium ${getMetricStatus(process.metrics.resourceUtilization, process.alertThresholds.resourceUtilization)}`}>
                                  {process.metrics.resourceUtilization.toFixed(0)}%
                                </span>
                              </div>
                              <Progress value={process.metrics.resourceUtilization} max={100} className="h-2" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 flex items-center justify-center text-muted-foreground">
                          <CircleDashed className="h-4 w-4 mr-2" />
                          <span>Process is currently {process.status}</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
                        <div>
                          <Clock className="h-3 w-3 inline mr-1" />
                          <span>Updated just now</span>
                        </div>
                        <div>
                          <MemoryStick className="h-3 w-3 inline mr-1" />
                          <span>{process.config.memoryPerInstance} MB</span>
                        </div>
                        <div>
                          <Layers className="h-3 w-3 inline mr-1" />
                          <span>{process.config.maxInstances} instance{process.config.maxInstances > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="events" className="space-y-4">
              <ScrollArea className="h-[400px] rounded-md border p-4">
                {processes.flatMap(process => 
                  process.recentEvents.map((event /* , index */) => (
                    <div key={`${process.id}-${index}`} className="mb-4">
                      <div className="flex items-start space-x-3">
                        <div className={`mt-0.5 rounded-full p-1 ${
                          event.type === 'error' 
                            ? 'bg-red-100 text-red-600' 
                            : event.type === 'system' 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-green-100 text-green-600'
                        }`}>
                          {event.type === 'error' && <AlertCircle className="h-3 w-3" />}
                          {event.type === 'system' && <Terminal className="h-3 w-3" />}
                          {event.type === 'data' && <ClipboardList className="h-3 w-3" />}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {process.name}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {formatDate(event.timestamp)}
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {event.message}
                          </p>
                        </div>
                      </div>
                      {index < process.recentEvents.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/20 p-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <Timer className="h-3.5 w-3.5 mr-1.5" />
          <span>Auto-refreshing metrics every 5 seconds</span>
        </div>
      </CardFooter>
    </Card>
  );
}