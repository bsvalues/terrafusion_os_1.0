import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  SmartToy,
  Psychology,
  Speed,
  TrendingUp,
  Warning,
  CheckCircle,
  Error,
  Pause,
  PlayArrow,
  Stop,
  Refresh,
  Visibility
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis } from 'recharts';

interface AIAgent {
  id: string;
  name: string;
  type: 'scout' | 'worker' | 'queen' | 'sentinel' | 'communicator';
  status: 'active' | 'idle' | 'error' | 'maintenance';
  performance: number;
  tasksCompleted: number;
  efficiency: number;
  lastActivity: Date;
  specialization: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
}

interface SwarmMetrics {
  totalAgents: number;
  activeAgents: number;
  coherenceLevel: number;
  emergentBehaviors: number;
  collectiveIntelligence: number;
  taskThroughput: number;
  errorRate: number;
  adaptationRate: number;
}

interface PerformanceData {
  timestamp: string;
  swarmCoherence: number;
  taskCompletion: number;
  emergentIntelligence: number;
  quantumEntanglement: number;
  probabilisticAccuracy: number;
  revenueOptimization: number;
}

const AIAgentMonitoringDashboard: React.FC = () => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [swarmMetrics, setSwarmMetrics] = useState<SwarmMetrics>({
    totalAgents: 1008,
    activeAgents: 987,
    coherenceLevel: 94.7,
    emergentBehaviors: 23,
    collectiveIntelligence: 97.2,
    taskThroughput: 15420,
    errorRate: 0.3,
    adaptationRate: 8.7
  });
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);

  useEffect(() => {
    initializeAgentData();
    initializePerformanceData();
    
    const interval = setInterval(() => {
      updateRealTimeData();
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const initializeAgentData = () => {
    const mockAgents: AIAgent[] = [
      {
        id: 'agent-001',
        name: 'Revenue Hunter Alpha',
        type: 'scout',
        status: 'active',
        performance: 97.5,
        tasksCompleted: 1247,
        efficiency: 94.2,
        lastActivity: new Date(),
        specialization: 'Property Tax Discovery',
        location: 'Benton County Sector A',
        priority: 'high'
      },
      {
        id: 'agent-002',
        name: 'Quantum Optimizer Beta',
        type: 'worker',
        status: 'active',
        performance: 99.1,
        tasksCompleted: 2156,
        efficiency: 98.7,
        lastActivity: new Date(),
        specialization: 'Quantum Speedup Optimization',
        location: 'Quantum Processing Core',
        priority: 'high'
      },
      {
        id: 'agent-003',
        name: 'Swarm Coordinator Gamma',
        type: 'queen',
        status: 'active',
        performance: 96.8,
        tasksCompleted: 892,
        efficiency: 95.3,
        lastActivity: new Date(),
        specialization: 'Collective Intelligence',
        location: 'Central Command Hub',
        priority: 'high'
      },
      {
        id: 'agent-004',
        name: 'Security Sentinel Delta',
        type: 'sentinel',
        status: 'active',
        performance: 98.2,
        tasksCompleted: 567,
        efficiency: 97.1,
        lastActivity: new Date(),
        specialization: 'FISMA Compliance Monitoring',
        location: 'Security Perimeter',
        priority: 'high'
      },
      {
        id: 'agent-005',
        name: 'Data Communicator Epsilon',
        type: 'communicator',
        status: 'active',
        performance: 93.7,
        tasksCompleted: 3421,
        efficiency: 91.8,
        lastActivity: new Date(),
        specialization: 'Inter-Agent Communication',
        location: 'Communication Network',
        priority: 'medium'
      },
      {
        id: 'agent-006',
        name: 'Probabilistic Analyzer Zeta',
        type: 'worker',
        status: 'idle',
        performance: 89.4,
        tasksCompleted: 1876,
        efficiency: 87.2,
        lastActivity: new Date(Date.now() - 300000),
        specialization: 'P-bit Computation',
        location: 'Probabilistic Engine',
        priority: 'medium'
      },
      {
        id: 'agent-007',
        name: 'Revenue Scout Eta',
        type: 'scout',
        status: 'error',
        performance: 45.2,
        tasksCompleted: 234,
        efficiency: 42.1,
        lastActivity: new Date(Date.now() - 1800000),
        specialization: 'Business License Discovery',
        location: 'Clark County Sector B',
        priority: 'low'
      }
    ];
    
    setAgents(mockAgents);
  };

  const initializePerformanceData = () => {
    const mockPerformanceData: PerformanceData[] = [
      { timestamp: '00:00', swarmCoherence: 92.1, taskCompletion: 89.5, emergentIntelligence: 94.2, quantumEntanglement: 97.8, probabilisticAccuracy: 96.1, revenueOptimization: 91.7 },
      { timestamp: '04:00', swarmCoherence: 93.4, taskCompletion: 91.2, emergentIntelligence: 95.1, quantumEntanglement: 98.1, probabilisticAccuracy: 96.8, revenueOptimization: 93.2 },
      { timestamp: '08:00', swarmCoherence: 94.7, taskCompletion: 93.8, emergentIntelligence: 96.7, quantumEntanglement: 98.5, probabilisticAccuracy: 97.2, revenueOptimization: 94.8 },
      { timestamp: '12:00', swarmCoherence: 95.2, taskCompletion: 95.1, emergentIntelligence: 97.2, quantumEntanglement: 98.9, probabilisticAccuracy: 97.8, revenueOptimization: 96.1 },
      { timestamp: '16:00', swarmCoherence: 94.9, taskCompletion: 94.3, emergentIntelligence: 96.9, quantumEntanglement: 98.7, probabilisticAccuracy: 97.5, revenueOptimization: 95.4 },
      { timestamp: '20:00', swarmCoherence: 94.1, taskCompletion: 92.7, emergentIntelligence: 96.2, quantumEntanglement: 98.3, probabilisticAccuracy: 97.1, revenueOptimization: 94.2 }
    ];
    
    setPerformanceData(mockPerformanceData);
  };

  const updateRealTimeData = () => {
    setSwarmMetrics(prev => ({
      ...prev,
      activeAgents: prev.totalAgents - Math.floor(Math.random() * 25),
      coherenceLevel: Math.max(90, Math.min(100, prev.coherenceLevel + (Math.random() - 0.5) * 2)),
      taskThroughput: Math.floor(prev.taskThroughput + (Math.random() - 0.5) * 1000),
      errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.5))
    }));

    setAgents(prev => prev.map(agent => ({
      ...agent,
      performance: Math.max(0, Math.min(100, agent.performance + (Math.random() - 0.5) * 5)),
      tasksCompleted: agent.status === 'active' ? agent.tasksCompleted + Math.floor(Math.random() * 10) : agent.tasksCompleted
    })));
  };

  const getAgentTypeIcon = (type: string) => {
    switch (type) {
      case 'scout': return <Visibility />;
      case 'worker': return <SmartToy />;
      case 'queen': return <Psychology />;
      case 'sentinel': return <Warning />;
      case 'communicator': return <TrendingUp />;
      default: return <SmartToy />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'idle': return 'warning';
      case 'error': return 'error';
      case 'maintenance': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle color="success" />;
      case 'idle': return <Pause color="warning" />;
      case 'error': return <Error color="error" />;
      case 'maintenance': return <Stop color="info" />;
      default: return <CheckCircle />;
    }
  };

  const radarData = [
    { subject: 'Swarm Coherence', A: swarmMetrics.coherenceLevel, fullMark: 100 },
    { subject: 'Collective Intelligence', A: swarmMetrics.collectiveIntelligence, fullMark: 100 },
    { subject: 'Task Throughput', A: (swarmMetrics.taskThroughput / 20000) * 100, fullMark: 100 },
    { subject: 'Adaptation Rate', A: swarmMetrics.adaptationRate * 10, fullMark: 100 },
    { subject: 'Error Resilience', A: (5 - swarmMetrics.errorRate) * 20, fullMark: 100 },
    { subject: 'Emergent Behaviors', A: (swarmMetrics.emergentBehaviors / 30) * 100, fullMark: 100 }
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}><>

        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          🤖 AI Agent Swarm Monitoring Dashboard
        </Typography>
        <Box
</> sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            label={`${swarmMetrics.activeAgents}/${swarmMetrics.totalAgents} Active`}
            color="primary"
            variant="filled"
          />
          <Chip 
            label={`${swarmMetrics.coherenceLevel.toFixed(1)}% Coherence`}
            color="success"
            variant="filled"
          />
        </Box>
      </Box>

      {/* Swarm Overview Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}><>

                  <SmartToy />
                </Avatar>
                <Box
</>><>

                  <Typography variant="h4">{swarmMetrics.totalAgents}</Typography>
                  <Typography
</> variant="body2" color="textSecondary">Total Agents</Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(swarmMetrics.activeAgents / swarmMetrics.totalAgents) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}><>

                  <Psychology />
                </Avatar>
                <Box
</>><>

                  <Typography variant="h4">{swarmMetrics.collectiveIntelligence.toFixed(1)}%</Typography>
                  <Typography
</> variant="body2" color="textSecondary">Collective Intelligence</Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={swarmMetrics.collectiveIntelligence}
                sx={{ height: 8, borderRadius: 4 }}
                color="success"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}><>

                  <Speed />
                </Avatar>
                <Box
</>><>

                  <Typography variant="h4">{swarmMetrics.taskThroughput.toLocaleString()}</Typography>
                  <Typography
</> variant="body2" color="textSecondary">Tasks/Hour</Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(swarmMetrics.taskThroughput / 20000) * 100}
                sx={{ height: 8, borderRadius: 4 }}
                color="warning"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}><>

                  <Warning />
                </Avatar>
                <Box
</>><>

                  <Typography variant="h4">{swarmMetrics.errorRate.toFixed(1)}%</Typography>
                  <Typography
</> variant="body2" color="textSecondary">Error Rate</Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={swarmMetrics.errorRate * 20}
                sx={{ height: 8, borderRadius: 4 }}
                color="error"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent><>

              <Typography variant="h6" sx={{ mb: 2 }}>
                AI Swarm Performance Trends
              </Typography>
              <ResponsiveContainer
</> width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[85, 100]} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="swarmCoherence" stroke="#1976d2" strokeWidth={2} name="Swarm Coherence" />
                  <Line type="monotone" dataKey="emergentIntelligence" stroke="#4caf50" strokeWidth={2} name="Emergent Intelligence" />
                  <Line type="monotone" dataKey="quantumEntanglement" stroke="#ff9800" strokeWidth={2} name="Quantum Entanglement" />
                  <Line type="monotone" dataKey="revenueOptimization" stroke="#9c27b0" strokeWidth={2} name="Revenue Optimization" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent><>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Swarm Capability Radar
              </Typography>
              <ResponsiveContainer
</> width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Performance" dataKey="A" stroke="#1976d2" fill="#1976d2" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Agent Details Table */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent><>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Individual Agent Status
              </Typography>
              <TableContainer
</> component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow><>

                      <TableCell>Agent</TableCell>
                      <TableCell
</>>Type</TableCell><>

                      <TableCell>Status</TableCell>
                      <TableCell
</>>Performance</TableCell><>

                      <TableCell>Tasks</TableCell>
                      <TableCell
</>>Efficiency</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}><>

                            <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                              {getAgentTypeIcon(agent.type)}
                            </Avatar>
                            <Box
</>><>

                              <Typography variant="body2" fontWeight="bold">
                                {agent.name}
                              </Typography>
                              <Typography
</> variant="caption" color="textSecondary">
                                {agent.specialization}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell><>

                          <Chip 
                            label={agent.type} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell
</>>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getStatusIcon(agent.status)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {agent.status}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
                            <LinearProgress
                              variant="determinate"
                              value={agent.performance}
                              sx={{ flexGrow: 1, mr: 1, height: 6 }}
                              color={agent.performance > 90 ? 'success' : agent.performance > 70 ? 'warning' : 'error'}
                            />
                            <Typography variant="body2">
                              {agent.performance.toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell><>

                        <TableCell>{agent.tasksCompleted.toLocaleString()}</TableCell>
                        <TableCell
</>>{agent.efficiency.toFixed(1)}%</TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => setSelectedAgent(agent)}>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Restart Agent">
                            <IconButton size="small">
                              <Refresh />
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
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent><>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Agent Type Distribution
              </Typography>
              <List
</>>
                {['scout', 'worker', 'queen', 'sentinel', 'communicator'].map((type) => {
                  const count = agents.filter(agent => agent.type === type).length;
                  const activeCount = agents.filter(agent => agent.type === type && agent.status === 'active').length;
                  
                  return (
                    <ListItem key={type}>
                      <ListItemAvatar>
                        <Badge badgeContent={activeCount} color="primary">
                          <Avatar sx={{ bgcolor: 'grey.300' }}>
                            {getAgentTypeIcon(type)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={type.charAt(0).toUpperCase() + type.slice(1)}
                        secondary={`${count} total, ${activeCount} active`}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIAgentMonitoringDashboard;
