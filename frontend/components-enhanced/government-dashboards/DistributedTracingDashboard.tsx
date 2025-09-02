import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar
} from '@mui/material';
import {
  Timeline,
  Search,
  Visibility,
  Error,
  CheckCircle,
  Warning,
  Speed,
  Memory,
  AccessTime,
  TrendingUp,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';

interface TraceSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tags: Record<string, any>;
  events: TraceEvent[];
  status: 'active' | 'completed' | 'error';
  serviceName: string;
  userId?: string;
  requestId?: string;
}

interface TraceEvent {
  eventId: string;
  name: string;
  timestamp: Date;
  data: Record<string, any>;
  level: string;
}

interface TraceMetrics {
  traceId: string;
  totalDuration: number;
  spanCount: number;
  errorCount: number;
  serviceLatencies: Record<string, number>;
  operationCounts: Record<string, number>;
  criticalPath: string[];
  throughputRpm: number;
  errorRate: number;
}

interface PerformanceData {
  timestamp: string;
  averageLatency: number;
  throughput: number;
  errorRate: number;
  p95Latency: number;
  p99Latency: number;
  activeTraces: number;
}

const DistributedTracingDashboard: React.FC = () => {
  const [traces, setTraces] = useState<TraceSpan[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
  const [traceDetails, setTraceDetails] = useState<TraceSpan[]>([]);
  const [traceMetrics, setTraceMetrics] = useState<TraceMetrics | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('1h');
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    initializeTraceData();
    initializePerformanceData();
    
    const interval = setInterval(() => {
      updateRealTimeData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const initializeTraceData = () => {
    const mockTraces: TraceSpan[] = [
      {
        spanId: 'span-001',
        traceId: 'trace-001',
        operationName: 'GET /api/properties/search',
        startTime: new Date(Date.now() - 300000),
        endTime: new Date(Date.now() - 298500),
        duration: 1500,
        tags: { 'http.method': 'GET', 'http.status_code': 200, 'user.id': 'user123' },
        events: [],
        status: 'completed',
        serviceName: 'Terrafusion.API',
        userId: 'user123',
        requestId: 'req-001'
      },
      {
        spanId: 'span-002',
        traceId: 'trace-002',
        operationName: 'AI Revenue Discovery',
        startTime: new Date(Date.now() - 240000),
        endTime: new Date(Date.now() - 235000),
        duration: 5000,
        tags: { 'ai.model': 'revenue-hunter', 'county': 'benton', 'properties.count': 1247 },
        events: [],
        status: 'completed',
        serviceName: 'AI.SwarmIntelligence',
        userId: 'system',
        requestId: 'req-002'
      },
      {
        spanId: 'span-003',
        traceId: 'trace-003',
        operationName: 'Quantum Optimization',
        startTime: new Date(Date.now() - 180000),
        endTime: new Date(Date.now() - 178200),
        duration: 1800,
        tags: { 'quantum.speedup': '379000000x', 'p-bits': 1000, 'algorithm': 'TSP' },
        events: [],
        status: 'completed',
        serviceName: 'Quantum.Engine',
        userId: 'system',
        requestId: 'req-003'
      },
      {
        spanId: 'span-004',
        traceId: 'trace-004',
        operationName: 'Database Query - Properties',
        startTime: new Date(Date.now() - 120000),
        endTime: new Date(Date.now() - 118700),
        duration: 1300,
        tags: { 'db.operation': 'SELECT', 'db.table': 'Properties', 'rows.returned': 156 },
        events: [],
        status: 'completed',
        serviceName: 'Terrafusion.Data',
        userId: 'user456',
        requestId: 'req-004'
      },
      {
        spanId: 'span-005',
        traceId: 'trace-005',
        operationName: 'Probabilistic Engine - Uncertainty Resolution',
        startTime: new Date(Date.now() - 60000),
        endTime: new Date(Date.now() - 57500),
        duration: 2500,
        tags: { 'uncertainty.reduction': '87%', 'bayesian.inference': true, 'confidence': 0.94 },
        events: [],
        status: 'completed',
        serviceName: 'Probabilistic.Engine',
        userId: 'system',
        requestId: 'req-005'
      },
      {
        spanId: 'span-006',
        traceId: 'trace-006',
        operationName: 'Authentication Validation',
        startTime: new Date(Date.now() - 30000),
        duration: 15000,
        tags: { 'auth.method': 'JWT', 'user.role': 'admin' },
        events: [],
        status: 'error',
        serviceName: 'Auth.Service',
        userId: 'user789',
        requestId: 'req-006'
      }
    ];
    
    setTraces(mockTraces);
  };

  const initializePerformanceData = () => {
    const mockPerformanceData: PerformanceData[] = [
      { timestamp: '00:00', averageLatency: 245, throughput: 1247, errorRate: 0.2, p95Latency: 890, p99Latency: 1250, activeTraces: 23 },
      { timestamp: '00:05', averageLatency: 198, throughput: 1356, errorRate: 0.1, p95Latency: 756, p99Latency: 1100, activeTraces: 31 },
      { timestamp: '00:10', averageLatency: 167, throughput: 1489, errorRate: 0.3, p95Latency: 623, p99Latency: 945, activeTraces: 28 },
      { timestamp: '00:15', averageLatency: 223, throughput: 1298, errorRate: 0.4, p95Latency: 834, p99Latency: 1180, activeTraces: 35 },
      { timestamp: '00:20', averageLatency: 189, throughput: 1567, errorRate: 0.1, p95Latency: 712, p99Latency: 1025, activeTraces: 42 },
      { timestamp: '00:25', averageLatency: 156, throughput: 1678, errorRate: 0.2, p95Latency: 589, p99Latency: 876, activeTraces: 38 }
    ];
    
    setPerformanceData(mockPerformanceData);
  };

  const updateRealTimeData = () => {
    setTraces(prev => prev.map(trace => ({
      ...trace,
      duration: trace.status === 'active' ? (trace.duration || 0) + Math.random() * 1000 : trace.duration
    })));

    const newDataPoint: PerformanceData = {
      timestamp: new Date().toLocaleTimeString(),
      averageLatency: 150 + Math.random() * 100,
      throughput: 1400 + Math.random() * 400,
      errorRate: Math.random() * 0.5,
      p95Latency: 600 + Math.random() * 300,
      p99Latency: 900 + Math.random() * 400,
      activeTraces: 25 + Math.floor(Math.random() * 20)
    };

    setPerformanceData(prev => [...prev.slice(-5), newDataPoint]);
  };

  const handleTraceClick = async (traceId: string) => {
    setSelectedTrace(traceId);
    
    // Mock detailed trace data
    const mockTraceDetails: TraceSpan[] = [
      {
        spanId: 'root-span',
        traceId: traceId,
        operationName: 'HTTP Request',
        startTime: new Date(Date.now() - 5000),
        endTime: new Date(Date.now() - 2000),
        duration: 3000,
        tags: { 'http.method': 'GET', 'http.url': '/api/properties/search' },
        events: [
          {
            eventId: 'event-1',
            name: 'request.started',
            timestamp: new Date(Date.now() - 5000),
            data: { 'user.id': 'user123' },
            level: 'info'
          }
        ],
        status: 'completed',
        serviceName: 'API Gateway'
      },
      {
        spanId: 'auth-span',
        traceId: traceId,
        parentSpanId: 'root-span',
        operationName: 'Authentication',
        startTime: new Date(Date.now() - 4800),
        endTime: new Date(Date.now() - 4600),
        duration: 200,
        tags: { 'auth.method': 'JWT' },
        events: [],
        status: 'completed',
        serviceName: 'Auth Service'
      },
      {
        spanId: 'db-span',
        traceId: traceId,
        parentSpanId: 'root-span',
        operationName: 'Database Query',
        startTime: new Date(Date.now() - 4500),
        endTime: new Date(Date.now() - 3200),
        duration: 1300,
        tags: { 'db.statement': 'SELECT * FROM Properties WHERE...' },
        events: [],
        status: 'completed',
        serviceName: 'Database'
      }
    ];

    const mockMetrics: TraceMetrics = {
      traceId: traceId,
      totalDuration: 3000,
      spanCount: 3,
      errorCount: 0,
      serviceLatencies: {
        'API Gateway': 3000,
        'Auth Service': 200,
        'Database': 1300
      },
      operationCounts: {
        'HTTP Request': 1,
        'Authentication': 1,
        'Database Query': 1
      },
      criticalPath: ['HTTP Request', 'Database Query'],
      throughputRpm: 1247,
      errorRate: 0
    };

    setTraceDetails(mockTraceDetails);
    setTraceMetrics(mockMetrics);
    setDetailsOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      case 'active': return <AccessTime color="warning" />;
      default: return <CheckCircle />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'error': return 'error';
      case 'active': return 'warning';
      default: return 'default';
    }
  };

  const filteredTraces = traces.filter(trace => {
    const matchesSearch = trace.operationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trace.traceId.includes(searchQuery) ||
                         trace.serviceName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesService = serviceFilter === 'all' || trace.serviceName === serviceFilter;
    const matchesStatus = statusFilter === 'all' || trace.status === statusFilter;
    
    return matchesSearch && matchesService && matchesStatus;
  });

  const services = [...new Set(traces.map(trace => trace.serviceName))];

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}><>

        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          🔍 Distributed Tracing Dashboard
        </Typography>
        <Box
</>
sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            label={`${traces.filter(t => t.status === 'active').length} Active Traces`}
            color="warning"
            variant="filled"
          />
          <Chip 
            label={`${(traces.filter(t => t.status === 'error').length / traces.length * 100).toFixed(1)}% Error Rate`}
            color={traces.filter(t => t.status === 'error').length > 0 ? 'error' : 'success'}
            variant="filled"
          />
        </Box>
      </Box>

      {/* Performance Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent><>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Real-time Performance Metrics
              </Typography>
              <ResponsiveContainer
</>
width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis yAxisId="latency" orientation="left" />
                  <YAxis yAxisId="throughput" orientation="right" />
                  <RechartsTooltip />
                  <Line yAxisId="latency" type="monotone" dataKey="averageLatency" stroke="#1976d2" strokeWidth={2} name="Avg Latency (ms)" />
                  <Line yAxisId="latency" type="monotone" dataKey="p95Latency" stroke="#ff9800" strokeWidth={2} name="P95 Latency (ms)" />
                  <Line yAxisId="throughput" type="monotone" dataKey="throughput" stroke="#4caf50" strokeWidth={2} name="Throughput (req/min)" />
                  <Line yAxisId="latency" type="monotone" dataKey="errorRate" stroke="#f44336" strokeWidth={2} name="Error Rate (%)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent><>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Service Latency Distribution
              </Typography>
              <ResponsiveContainer
</>
width="100%" height={300}>
                <BarChart data={[
                  { service: 'API Gateway', latency: 245 },
                  { service: 'AI Swarm', latency: 1567 },
                  { service: 'Quantum Engine', latency: 89 },
                  { service: 'Database', latency: 423 },
                  { service: 'Auth Service', latency: 156 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="latency" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search traces"
                variant="outlined"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth><>

                <InputLabel>Service</InputLabel>
                <Select
</>

                  value={serviceFilter}
                  label="Service"
                  onChange={(e) => setServiceFilter(e.target.value)}
                >
                  <MenuItem value="all">All Services</MenuItem>
                  {services.map(service => (
                    <MenuItem key={service} value={service}>{service}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth><>

                <InputLabel>Status</InputLabel>
                <Select
</>

                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                ><>

                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem
</>
value="completed">Completed</MenuItem><>

                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem
</>
value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth><>

                <InputLabel>Time Range</InputLabel>
                <Select
</>

                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                ><>

                  <MenuItem value="5m">Last 5 minutes</MenuItem>
                  <MenuItem
</>
value="1h">Last hour</MenuItem><>

                  <MenuItem value="24h">Last 24 hours</MenuItem>
                  <MenuItem
</>
value="7d">Last 7 days</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => updateRealTimeData()}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Traces Table */}
      <Card>
        <CardContent><>

          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Traces ({filteredTraces.length})
          </Typography>
          <TableContainer
</>
component={Paper} sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow><>

                  <TableCell>Trace ID</TableCell>
                  <TableCell
</>
</>>Operation</TableCell><>

                  <TableCell>Service</TableCell>
                  <TableCell
</>
</>>Status</TableCell><>

                  <TableCell>Duration</TableCell>
                  <TableCell
</>
</>>Start Time</TableCell><>

                  <TableCell>User</TableCell>
                  <TableCell
</>
</>>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTraces.map((trace) => (
                  <TableRow key={trace.spanId} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {trace.traceId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {trace.operationName}
                      </Typography>
                    </TableCell>
                    <TableCell><>

                      <Chip 
                        label={trace.serviceName} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell
</>
</>>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(trace.status)}
                        <Chip 
                          label={trace.status} 
                          size="small" 
                          color={getStatusColor(trace.status) as any}
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {trace.duration ? `${trace.duration.toFixed(0)}ms` : 'In progress...'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {trace.startTime.toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {trace.userId || 'System'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Trace Details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleTraceClick(trace.traceId)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Trace Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><>

            <Typography variant="h6">
              Trace Details: {selectedTrace}
            </Typography>
            <Box
</>
</>>
              {traceMetrics && (
                  <Chip label={`${traceMetrics.totalDuration}ms`} color="primary" sx={{ mr: 1 }} />
                  <Chip label={`${traceMetrics.spanCount} spans`} color="secondary" sx={{ mr: 1 }} />
                  <Chip 
                    label={`${traceMetrics.errorCount} errors`} 
                    color={traceMetrics.errorCount > 0 ? 'error' : 'success'} 
                  />
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}><>

              <Typography variant="h6" sx={{ mb: 2 }}>Span Timeline</Typography>
              <List
</>
</>>
                {traceDetails.map((span /* , index */) => (
                  <React.Fragment key={span.spanId}>
                    <ListItem>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}><>

                          <Timeline />
                        </Avatar>
                        <Box
</>
sx={{ flexGrow: 1 }}><>

                          <Typography variant="body1" fontWeight="bold">
                            {span.operationName}
                          </Typography>
                          <Typography
</>
variant="body2" color="textSecondary">
                            {span.serviceName} • {span.duration}ms
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {Object.entries(span.tags).map(([key, value]) => (
                              <Chip 
                                key={key}
                                label={`${key}: ${value}`}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        </Box>
                        {getStatusIcon(span.status)}
                      </Box>
                    </ListItem>
                    {index < traceDetails.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 2 }}>Trace Metrics</Typography>
              {traceMetrics && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Total Duration:</strong> {traceMetrics.totalDuration}ms
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Span Count:</strong> {traceMetrics.spanCount}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Error Rate:</strong> {(traceMetrics.errorRate * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Throughput:</strong> {traceMetrics.throughputRpm} req/min
                  </Typography><>

                  <Typography variant="h6" sx={{ mb: 1 }}>Critical Path:</Typography>
                  <List
</>
dense>
                    {traceMetrics.criticalPath.map((operation /* , index */) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemText 
                          primary={`${index + 1}. ${operation}`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DistributedTracingDashboard;
