import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Security,
  Assessment,
  Gavel,
  Warning,
  CheckCircle,
  Schedule,
  TrendingUp,
  Download
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface ComplianceFramework {
  FISMA: 'FISMA';
  NIST: 'NIST';
  SOC2: 'SOC2';
  FedRAMP: 'FedRAMP';
  HIPAA: 'HIPAA';
}

interface ComplianceStatus {
  framework: string;
  complianceScore: number;
  totalControls: number;
  implementedControls: number;
  violationCount: number;
  lastAssessment: string;
  status: string;
}

interface ComplianceViolation {
  id: string;
  framework: string;
  controlId: string;
  controlName: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  detectedAt: string;
  status: 'Open' | 'In Progress' | 'Resolved';
}

interface ComplianceDashboardData {
  frameworkStatus: Record<string, ComplianceStatus>;
  recentViolations: ComplianceViolation[];
  overallMetrics: {
    complianceScore: number;
    totalAuditEvents: number;
    securityIncidents: number;
    violationsByType: Record<string, number>;
  };
  trendData: Record<string, any>;
}

const ComplianceDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<ComplianceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<string>('FISMA');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/compliance/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch compliance data');
      }

      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load compliance dashboard data');
      console.error('Error fetching compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      const response = await fetch('/api/compliance/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          framework: selectedFramework,
          startDate: reportStartDate,
          endDate: reportEndDate,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${selectedFramework}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setReportDialogOpen(false);
      }
    } catch (err) {
      console.error('Error generating report:', err);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'compliant': return '#4caf50';
      case 'partially compliant': return '#ff9800';
      case 'non-compliant': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' => {
    switch (severity.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}><>

        <Typography variant="h4" gutterBottom>Compliance Dashboard</Typography>
        <LinearProgress
</> />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}><>

        <Typography variant="h4" gutterBottom>Compliance Dashboard</Typography>
        <Alert
</> severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}><>

        <Typography variant="h4">Compliance Dashboard</Typography>
        <Button
</>
          startIcon={<Download />}
          onClick={() => setReportDialogOpen(true)}
          variant="contained"
        >
          Generate Report
        </Button>
      </Box>

      {dashboardData && (
        <>
          {/* Overall Compliance Score */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security sx={{ mr: 1, color: '#1976d2' }} />
                    <Typography variant="h6">Overall Compliance</Typography>
                  </Box><>

                  <Typography variant="h3" sx={{ color: '#1976d2' }}>
                    {dashboardData.overallMetrics.complianceScore.toFixed(1)}%
                  </Typography>
                  <Typography
</> variant="body2" color="text.secondary">
                    Compliance Score
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Assessment sx={{ mr: 1, color: '#388e3c' }} />
                    <Typography variant="h6">Audit Events</Typography>
                  </Box><>

                  <Typography variant="h3" sx={{ color: '#388e3c' }}>
                    {dashboardData.overallMetrics.totalAuditEvents.toLocaleString()}
                  </Typography>
                  <Typography
</> variant="body2" color="text.secondary">
                    Total Events
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Warning sx={{ mr: 1, color: '#f57c00' }} />
                    <Typography variant="h6">Security Incidents</Typography>
                  </Box><>

                  <Typography variant="h3" sx={{ color: '#f57c00' }}>
                    {dashboardData.overallMetrics.securityIncidents}
                  </Typography>
                  <Typography
</> variant="body2" color="text.secondary">
                    This Period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Gavel sx={{ mr: 1, color: '#7b1fa2' }} />
                    <Typography variant="h6">Active Violations</Typography>
                  </Box><>

                  <Typography variant="h3" sx={{ color: '#7b1fa2' }}>
                    {dashboardData.recentViolations.filter(v => v.status !== 'Resolved').length}
                  </Typography>
                  <Typography
</> variant="body2" color="text.secondary">
                    Require Attention
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Framework Status */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent><>

                  <Typography variant="h6" gutterBottom>Framework Compliance Status</Typography>
                  <TableContainer
</>>
                    <Table>
                      <TableHead>
                        <TableRow><>

                          <TableCell>Framework</TableCell>
                          <TableCell
</>>Score</TableCell><>

                          <TableCell>Controls</TableCell>
                          <TableCell
</>>Violations</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.values(dashboardData.frameworkStatus).map((framework) => (
                          <TableRow key={framework.framework}><>

                            <TableCell>{framework.framework}</TableCell>
                            <TableCell
</>>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={framework.complianceScore}
                                  sx={{ width: 100, mr: 1 }}
                                />
                                <Typography variant="caption">
                                  {framework.complianceScore.toFixed(1)}%
                                </Typography>
                              </Box>
                            </TableCell><>

                            <TableCell>
                              {framework.implementedControls}/{framework.totalControls}
                            </TableCell>
                            <TableCell
</>><>

                              <Chip
                                label={framework.violationCount}
                                color={framework.violationCount > 0 ? 'error' : 'success'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell
</>>
                              <Chip
                                label={framework.status}
                                sx={{ backgroundColor: getStatusColor(framework.status), color: 'white' }}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent><>

                  <Typography variant="h6" gutterBottom>Violations by Type</Typography>
                  <ResponsiveContainer
</> width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={Object.entries(dashboardData.overallMetrics.violationsByType).map(([type, count]) => ({
                          name: type,
                          value: count
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {Object.keys(dashboardData.overallMetrics.violationsByType).map((_ /* , index */) => (<>

                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
</> />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Violations */}
          <Card sx={{ mb: 4 }}>
            <CardContent><>

              <Typography variant="h6" gutterBottom>Recent Compliance Violations</Typography>
              <TableContainer
</>>
                <Table>
                  <TableHead>
                    <TableRow><>

                      <TableCell>Control</TableCell>
                      <TableCell
</>>Description</TableCell><>

                      <TableCell>Severity</TableCell>
                      <TableCell
</>>Framework</TableCell><>

                      <TableCell>Detected</TableCell>
                      <TableCell
</>>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentViolations.slice(0, 10).map((violation) => (
                      <TableRow key={violation.id}><>

                        <TableCell>{violation.controlId}</TableCell>
                        <TableCell
</>>{violation.description}</TableCell>
                        <TableCell><>

                          <Chip
                            label={violation.severity}
                            color={getSeverityColor(violation.severity)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell
</>>{violation.framework}</TableCell><>

                        <TableCell>
                          {new Date(violation.detectedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell
</>>
                          <Chip
                            label={violation.status}
                            color={violation.status === 'Resolved' ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Report Generation Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth><>

        <DialogTitle>Generate Compliance Report</DialogTitle>
        <DialogContent
</>>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}><>

            <InputLabel>Framework</InputLabel>
            <Select
</>
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
            ><>

              <MenuItem value="FISMA">FISMA</MenuItem>
              <MenuItem
</> value="NIST">NIST</MenuItem><>

              <MenuItem value="SOC2">SOC 2</MenuItem>
              <MenuItem
</> value="FedRAMP">FedRAMP</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={reportStartDate}
            onChange={(e) => setReportStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          /><>


          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={reportEndDate}
            onChange={(e) => setReportEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions
</>><>

          <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
          <Button
</> onClick={generateReport} variant="contained">
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplianceDashboard;
