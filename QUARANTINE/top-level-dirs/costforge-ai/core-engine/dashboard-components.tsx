/**
 * CostForge AI Advanced Monitoring Dashboard - Support Components
 * Additional components and utilities for the monitoring dashboard
 *
 * Features:
 * - Real-time data visualization components
 * - Performance alert system
 * - Quantum optimization metrics
 * - Agent health monitoring
 * - Deployment utilities
 */

import {
    CheckCircle,
    CloudQueue,
    Computer,
    Error,
    Info,
    Memory,
    Pause,
    PlayArrow,
    Refresh,
    Speed
} from '@mui/icons-material';
import {
    Alert,
    AlertTitle,
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    IconButton,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Typography
} from '@mui/material';
import React from 'react';

// TerraFusion color palette
const TF_COLORS = {
  trustBlue: '#0099ff',
  transcendCyan: '#00ffee',
  successGreen: '#00ffaa',
  deepSpace: '#0b1020',
  warningOrange: '#ffaa00',
  errorRed: '#ff4444',
  clarityGradient: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)'
};

// Performance Alert Component
export const PerformanceAlert: React.FC<{
  severity: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  metric?: number;
  threshold?: number;
}> = ({ severity, title, message, metric, threshold }) => {
  return (
    <Alert
      severity={severity}
      sx={{
        mb: 2,
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${TF_COLORS.transcendCyan}30`
      }}
    >
      <AlertTitle>{title}</AlertTitle>
      {message}
      {metric !== undefined && threshold !== undefined && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption">
            Current: {metric.toFixed(2)} | Threshold: {threshold.toFixed(2)}
          </Typography>
        </Box>
      )}
    </Alert>
  );
};

// System Health Status Component
export const SystemHealthStatus: React.FC<{
  healthData: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_latency: number;
    uptime_seconds: number;
  }
}> = ({ healthData }) => {
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getUsageColor = (usage: number): string => {
    if (usage < 70) return TF_COLORS.successGreen;
    if (usage < 85) return TF_COLORS.warningOrange;
    return TF_COLORS.errorRed;
  };

  return (
    <Card sx={{
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${TF_COLORS.transcendCyan}30`
    }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Computer sx={{ mr: 1 }} />
          System Health
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">CPU Usage</Typography>
                <Typography variant="body2">{healthData.cpu_usage.toFixed(1)}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={healthData.cpu_usage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getUsageColor(healthData.cpu_usage)
                  }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Memory Usage</Typography>
                <Typography variant="body2">{healthData.memory_usage.toFixed(1)}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={healthData.memory_usage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getUsageColor(healthData.memory_usage)
                  }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Disk Usage</Typography>
                <Typography variant="body2">{healthData.disk_usage.toFixed(1)}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={healthData.disk_usage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getUsageColor(healthData.disk_usage)
                  }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">Uptime</Typography>
              <Chip
                label={formatUptime(healthData.uptime_seconds)}
                size="small"
                sx={{ backgroundColor: TF_COLORS.successGreen, color: 'white' }}
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// AI Agent Status List Component
export const AIAgentStatusList: React.FC<{
  agents: Array<{
    id: string;
    name: string;
    status: 'active' | 'idle' | 'busy' | 'error';
    last_activity: string;
    tasks_completed: number;
    accuracy_score: number;
  }>
}> = ({ agents }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle sx={{ color: TF_COLORS.successGreen }} />;
      case 'idle': return <CloudQueue sx={{ color: TF_COLORS.trustBlue }} />;
      case 'busy': return <Speed sx={{ color: TF_COLORS.warningOrange }} />;
      case 'error': return <Error sx={{ color: TF_COLORS.errorRed }} />;
      default: return <Info sx={{ color: '#666' }} />;
    }
  };

  return (
    <Card sx={{
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${TF_COLORS.transcendCyan}30`
    }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI Agent Status
        </Typography>

        <List dense>
          {agents.slice(0, 10).map((agent) => (
            <ListItem key={agent.id} sx={{ px: 0 }}>
              <ListItemIcon>
                {getStatusIcon(agent.status)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">{agent.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={`${agent.accuracy_score.toFixed(1)}%`}
                        size="small"
                        sx={{ backgroundColor: TF_COLORS.trustBlue, color: 'white' }}
                      />
                      <Chip
                        label={`${agent.tasks_completed} tasks`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="textSecondary">
                    Last activity: {agent.last_activity}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Quantum Metrics Display Component
export const QuantumMetricsDisplay: React.FC<{
  quantumFactor: number;
  optimizationLevel: number;
  quantumEfficiency: number;
  enhancementActive: boolean;
}> = ({ quantumFactor, optimizationLevel, quantumEfficiency, enhancementActive }) => {
  return (
    <Card sx={{
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${TF_COLORS.transcendCyan}30`
    }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Memory sx={{ mr: 1 }} />
          Quantum Enhancement
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography
                variant="h2"
                sx={{
                  background: TF_COLORS.clarityGradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 'bold'
                }}
              >
                {quantumFactor}
              </Typography>
              <Typography variant="h6" color={TF_COLORS.transcendCyan}>
                QUANTUM FACTOR
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Optimization
              </Typography>
              <Typography variant="h6" sx={{ color: TF_COLORS.successGreen }}>
                {optimizationLevel.toFixed(1)}%
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Efficiency
              </Typography>
              <Typography variant="h6" sx={{ color: TF_COLORS.trustBlue }}>
                {quantumEfficiency.toFixed(1)}%
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Enhancement
              </Typography>
              <Chip
                label={enhancementActive ? "ACTIVE" : "INACTIVE"}
                size="small"
                sx={{
                  backgroundColor: enhancementActive ? TF_COLORS.successGreen : TF_COLORS.errorRed,
                  color: 'white'
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Dashboard Controls Component
export const DashboardControls: React.FC<{
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  onRefresh: () => void;
  onExportData: () => void;
  loading?: boolean;
}> = ({ isMonitoring, onToggleMonitoring, onRefresh, onExportData, loading = false }) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Tooltip title={isMonitoring ? "Pause monitoring" : "Start monitoring"}>
        <IconButton
          onClick={onToggleMonitoring}
          sx={{
            color: isMonitoring ? TF_COLORS.warningOrange : TF_COLORS.successGreen,
            border: `1px solid ${isMonitoring ? TF_COLORS.warningOrange : TF_COLORS.successGreen}30`
          }}
        >
          {isMonitoring ? <Pause /> : <PlayArrow />}
        </IconButton>
      </Tooltip>

      <Tooltip title="Refresh data">
        <IconButton
          onClick={onRefresh}
          disabled={loading}
          sx={{
            color: TF_COLORS.trustBlue,
            border: `1px solid ${TF_COLORS.trustBlue}30`
          }}
        >
          <Refresh />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

// Export utility functions
export const exportPerformanceData = (data: any[]) => {
  const csv = [
    ['Timestamp', 'Accuracy', 'Response Time (ms)', 'Throughput'],
    ...data.map(row => [row.timestamp, row.accuracy, row.responseTime, row.throughput])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `costforge-performance-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export default {
  PerformanceAlert,
  SystemHealthStatus,
  AIAgentStatusList,
  QuantumMetricsDisplay,
  DashboardControls,
  exportPerformanceData
};
