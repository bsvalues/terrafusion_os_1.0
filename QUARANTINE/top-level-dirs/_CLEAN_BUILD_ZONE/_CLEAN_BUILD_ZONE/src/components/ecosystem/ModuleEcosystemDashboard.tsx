import React, { useState, useMemo } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  LinearProgress,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import { Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon,
  Visibility as VisibilityIcon } from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { 
  useModuleEcosystem, 
  useRealTimeEcosystem,
  ModuleHealthStatus 
} from '../../hooks/useModuleEcosystem';

/**
 * Module Ecosystem Dashboard - Comprehensive visualization for 33+ module system
 * Real-time monitoring with React 18 concurrent features
 */
const ModuleEcosystemDashboard: React.FC = () => {
  const {
    ecosystemStatus,
    performanceSummary: _performanceSummary,
    isLoading,
    error,
    initializeEcosystem,
    refetchStatus,
    getSystemHealthScore,
    getCriticalModules,
    getModulesByTier
  } = useModuleEcosystem();

  const { realtimeStatus, connectionStatus } = useRealTimeEcosystem();
  
  const [selectedModule, setSelectedModule] = useState<ModuleHealthStatus | null>(null);
  const [showInitDialog, setShowInitDialog] = useState(false);

  // Use real-time data if available, otherwise fall back to regular data
  const currentStatus = realtimeStatus || ecosystemStatus;

  const healthScore = getSystemHealthScore();
  const criticalModules = getCriticalModules();

  // Memoized calculations for performance
  const moduleDistribution = useMemo(() => {
    if (!currentStatus) return { tier1: 0, tier2: 0, tier3: 0 };
    
    return {
      tier1: getModulesByTier('Tier1').length,
      tier2: getModulesByTier('Tier2').length,
      tier3: getModulesByTier('Tier3').length
    };
  }, [currentStatus, getModulesByTier]);

  const performanceData = useMemo(() => {
    if (!currentStatus) return [];
    
    // Generate mock time series data for performance chart
    return Array.from({ length: 12 }, (_, i) => ({
      time: `${12 - i}min ago`,
      performance: Math.max(0, Math.min(100, 
        (currentStatus.averagePerformance * 100) + (Math.random() - 0.5) * 20
      )),
      memory: Math.max(0, Math.min(100, 
        (currentStatus.totalMemoryUsage / (32 * 1024 * 1024 * 1024)) * 100 + (Math.random() - 0.5) * 10
      ))
    }));
  }, [currentStatus]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Healthy': return '#4caf50';
      case 'Warning': return '#ff9800';
      case 'Critical': return '#f44336';
      case 'Offline': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'Healthy': return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case 'Warning': return <WarningIcon sx={{ color: '#ff9800' }} />;
      case 'Critical': return <ErrorIcon sx={{ color: '#f44336' }} />;
      default: return <ErrorIcon sx={{ color: '#9e9e9e' }} />;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading && !currentStatus) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading Module Ecosystem...</Typography>
      </Box>
    );
  }

  if (error && !currentStatus) {
    return (
      <Alert severity="error">
        <AlertTitle>Failed to Load Module Ecosystem</AlertTitle>
        {error.toString()}
        <Button onClick={() => refetchStatus()} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>


        <Typography variant="h4" component="h1">
          Terrafusion OS Module Ecosystem
        </Typography>
        <Box

display="flex" gap={1}>
          <Chip 
            label={`${connectionStatus === 'connected' ? 'Real-time' : 'Polling'}`}
            color={connectionStatus === 'connected' ? 'success' : 'default'}
            size="small"
          />
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => refetchStatus()} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Initialize Ecosystem">
            <IconButton onClick={() => setShowInitDialog(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Critical Alerts */}
      {criticalModules.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Critical Modules Detected</AlertTitle>
          {criticalModules.length} module(s) require immediate attention: {' '}
          {criticalModules.map(m => m.moduleId).join(', ')}
        </Alert>
      )}

      {/* Overview Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>


                  <Typography color="textSecondary" gutterBottom>
                    Total Modules
                  </Typography>
                  <Typography

variant="h4">
                    {currentStatus?.totalModules || 0}
                  </Typography>
                  <Typography color="textSecondary">
                    {currentStatus?.activeModules || 0} active
                  </Typography>
                </Box>
                <SpeedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>


                  <Typography color="textSecondary" gutterBottom>
                    System Health
                  </Typography>
                  <Typography

variant="h4">
                    {healthScore}%
                  </Typography>


                  <LinearProgress 
                    variant="determinate" 
                    value={healthScore} 
                    sx={{ mt: 1 }}
                  />
                </Box>
                <CheckCircleIcon

sx={{ fontSize: 40, color: healthScore > 80 ? 'success.main' : 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>


                  <Typography color="textSecondary" gutterBottom>
                    Memory Usage
                  </Typography>
                  <Typography

variant="h4">
                    {formatBytes(currentStatus?.totalMemoryUsage || 0)}
                  </Typography>
                  <Typography color="textSecondary">
                    Across all modules
                  </Typography>
                </Box>
                <MemoryIcon sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>


                  <Typography color="textSecondary" gutterBottom>
                    Components
                  </Typography>
                  <Typography

variant="h4">
                    {(currentStatus?.totalComponentCount || 0).toLocaleString()}
                  </Typography>
                  <Typography color="textSecondary">
                    Total loaded
                  </Typography>
                </Box>
                <StorageIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Performance Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>


                <Typography variant="h6">System Performance</Typography>
                <Tooltip

title="Real-time performance metrics">
                  <TimelineIcon />
                </Tooltip>
              </Box>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line 
                      type="monotone" 
                      dataKey="performance" 
                      stroke="#2196f3" 
                      strokeWidth={2}
                      name="Performance %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memory" 
                      stroke="#ff9800" 
                      strokeWidth={2}
                      name="Memory %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Module Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>


              <Typography variant="h6" mb={2}>Module Distribution</Typography>
              <Box

height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Tier 1 (Core)', value: moduleDistribution.tier1, color: '#4caf50' },
                        { name: 'Tier 2 (Essential)', value: moduleDistribution.tier2, color: '#2196f3' },
                        { name: 'Tier 3 (Extended)', value: moduleDistribution.tier3, color: '#ff9800' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Tier 1', value: moduleDistribution.tier1, color: '#4caf50' },
                        { name: 'Tier 2', value: moduleDistribution.tier2, color: '#2196f3' },
                        { name: 'Tier 3', value: moduleDistribution.tier3, color: '#ff9800' }
                      ].map((entry, index) => (


                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip

/>
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Module Health Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>


              <Typography variant="h6" mb={2}>Module Health Status</Typography>
              <Box

sx={{ maxHeight: 400, overflow: 'auto' }}>
                <List>
                  {currentStatus?.moduleHealthStatuses.map((module) => (
                    <React.Fragment key={module.moduleId}>
                      <ListItem 
                        button 
                        onClick={() => setSelectedModule(module)}
                        sx={{ 
                          borderLeft: `4px solid ${getHealthColor(module.health)}`,
                          mb: 1,
                          bgcolor: 'background.paper',
                          borderRadius: 1
                        }}
                      >


                        <ListItemIcon>
                          {getHealthIcon(module.health)}
                        </ListItemIcon>
                        <ListItemText

primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">


                              <Typography variant="subtitle1" fontWeight="medium">
                                {module.moduleId}
                              </Typography>
                              <Chip

label={module.health}
                                color={
                                  module.health === 'Healthy' ? 'success' :
                                  module.health === 'Warning' ? 'warning' :
                                  module.health === 'Critical' ? 'error' : 'default'
                                }
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                Uptime: {module.uptime} | Checks: {module.healthChecks.length}
                              </Typography>
                              {module.issues.length > 0 && (
                                <Typography variant="body2" color="error">
                                  Issues: {module.issues.join(', ')}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <IconButton size="small">
                          <VisibilityIcon />
                        </IconButton>
                      </ListItem>
                    </React.Fragment>
                  )) || []}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Initialize Dialog */}
      <Dialog open={showInitDialog} onClose={() => setShowInitDialog(false)} maxWidth="sm" fullWidth>


        <DialogTitle>Initialize Module Ecosystem</DialogTitle>
        <DialogContent

>


          <Typography paragraph>
            This will initialize the complete Terrafusion OS module ecosystem with all 33 modules.
          </Typography>
          <Typography

paragraph color="textSecondary">
            • Creates hierarchical module structure<br/>
            • Establishes inter-module dependencies<br/>
            • Starts performance monitoring<br/>
            • Enables health checks
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>


            <Button onClick={() => setShowInitDialog(false)}>
              Cancel
            </Button>
            <Button

variant="contained" 
              onClick={() => {
                initializeEcosystem();
                setShowInitDialog(false);
              }}
              disabled={isLoading}
            >
              Initialize Ecosystem
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Module Details Dialog */}
      <Dialog 
        open={!!selectedModule} 
        onClose={() => setSelectedModule(null)} 
        maxWidth="md" 
        fullWidth
      >


        <DialogTitle>
          Module Details: {selectedModule?.moduleId}
        </DialogTitle>
        <DialogContent

>
          {selectedModule && (
            <Box>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2 }}>


                    <Typography variant="subtitle2" color="textSecondary">Health Status</Typography>
                    <Box

display="flex" alignItems="center" gap={1} mt={1}>
                      {getHealthIcon(selectedModule.health)}
                      <Typography variant="h6">{selectedModule.health}</Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2 }}>


                    <Typography variant="subtitle2" color="textSecondary">Uptime</Typography>
                    <Typography

variant="h6" mt={1}>{selectedModule.uptime}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />


              <Typography variant="h6" mb={2}>Health Checks</Typography>
              <Box

mb={2}>
                {selectedModule.healthChecks.map((check, index) => (
                  <Chip key={index} label={check} variant="outlined" sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>

              {selectedModule.issues.length > 0 && (
                <div>
                  <Typography variant="h6" mb={2} color="error">Issues</Typography>
                  <List dense>
                    {selectedModule.issues.map((issue, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <ErrorIcon color="error" />
                        </ListItemIcon>
                        <ListItemText primary={issue} />
                      </ListItem>
                    ))}
                  </List>
                </div>
              )}


              <Typography variant="h6" mb={2}>Metrics</Typography>
              <Paper

sx={{ p: 2 }}>
                <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                  {JSON.stringify(selectedModule.healthMetrics, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ModuleEcosystemDashboard;
