import React, { useState } from 'react';
import { useApi } from '../../src/hooks/useApi';
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
  Alert,
  AlertTitle,
  Avatar,
  LinearProgress,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Security,
  Warning,
  Error,
  CheckCircle,
  Shield,
  Lock,
  Visibility,
  Block,
  Refresh,
  Assessment,
  Policy,
  VpnLock,
  AdminPanelSettings,
  VerifiedUser,
  Report
} from '@mui/icons-material';
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
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface ThreatDetails {
  threatType: string;
  severity: string;
  timestamp: string;
  status: string;
}

interface SecurityData {
  threatsDetected: number;
  anomaliesFound: number;
  systemResilienceScore: number;
  recentThreats: ThreatDetails[];
}

const SecurityDashboard: React.FC = () => {
  const { data: securityData, loading, error, refetch } = useApi<SecurityData>('security/dashboard');
  const [showDevNotice, setShowDevNotice] = useState(true);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return '#d32f2f';
      case 'High': return '#f57c00';
      case 'Medium': return '#fbc02d';
      case 'Low': return '#388e3c';
      default: return '#757575';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical': return <Error sx={{ color: '#d32f2f' }} />;
      case 'High': return <Warning sx={{ color: '#f57c00' }} />;
      case 'Medium': return <Warning sx={{ color: '#fbc02d' }} />;
      case 'Low': return <CheckCircle sx={{ color: '#388e3c' }} />;
      default: return <CheckCircle />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'error';
      case 'InProgress': return 'warning';
      case 'Resolved': return 'success';
      case 'FalsePositive': return 'info';
      default: return 'default';
    }
  };

  
    if (loading || !securityData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Security Dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Alert severity="error">Failed to load Security Data: {error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {showDevNotice && (
        <Alert
          severity="info"
          onClose={() => setShowDevNotice(false)}
          sx={{ mb: 2 }}
        >
          <strong>Development Mode:</strong> Data shown on this dashboard is currently simulated for development and testing purposes. Real-time backend integration is pending.
        </Alert>
      )}
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}><>

        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          🛡️ Security & Compliance Dashboard
        </Typography>
        <Box
</>
sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={refetch}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Critical Alerts */}
      {securityData.recentThreats.filter(threat => threat.severity === 'Critical').length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Critical Security Alerts</AlertTitle>
          {securityData.recentThreats.filter(threat => threat.severity === 'Critical').length} critical threat(s) require immediate attention!
        </Alert>
      )}

      {/* Security Overview Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}><>

                  <Security />
                </Avatar>
                <Box
</>
</>><>

                  <Typography variant="h4">{securityData.threatsDetected}</Typography>
                  <Typography
</>
variant="body2" color="textSecondary">Threats Detected</Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min((securityData.threatsDetected / 10) * 100, 100)}
                sx={{ height: 8, borderRadius: 4 }}
                color="error"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}><>

                  <Shield />
                </Avatar>
                <Box
</>
</>><>

                  <Typography variant="h4">{securityData.anomaliesFound}</Typography>
                  <Typography
</>
variant="body2" color="textSecondary">Anomalies Found</Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={100}
                sx={{ height: 8, borderRadius: 4 }}
                color="success"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}><>

                  <Assessment />
                </Avatar>
                <Box
</>
</>><>

                  <Typography variant="h4">{(securityData.systemResilienceScore * 100).toFixed(1)}%</Typography>
                  <Typography
</>
variant="body2" color="textSecondary">System Resilience</Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={securityData.systemResilienceScore * 100}
                sx={{ height: 8, borderRadius: 4 }}
                color={securityData.systemResilienceScore * 100 >= 90 ? 'success' : 'warning'}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      
      {/* Detailed Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent><>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Threats
              </Typography>
              <TableContainer
</>
component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow><>

                      <TableCell>Severity</TableCell>
                      <TableCell
</>
</>>Threat Type</TableCell><>

                      <TableCell>Status</TableCell>
                      <TableCell
</>
</>>Time</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {securityData.recentThreats.map((threat /* , index */) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getSeverityIcon(threat.severity)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {threat.severity}
                            </Typography>
                          </Box>
                        </TableCell><>

                        <TableCell>{threat.threatType}</TableCell>
                        <TableCell
</>
</>><>

                          <Chip 
                            label={threat.status} 
                            size="small" 
                            color={getStatusColor(threat.status) as any}
                          />
                        </TableCell>
                        <TableCell
</>
</>>
                          <Typography variant="body2">
                            {new Date(threat.timestamp).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Block User">
                            <IconButton size="small">
                              <Block />
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

              </Grid>
    </Box>
  );
};

export default SecurityDashboard;
