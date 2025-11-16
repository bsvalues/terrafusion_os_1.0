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
  InputLabel,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Search as SearchIcon
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
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface PACSProperty {
  parcelNumber: string;
  propertyId: string;
  situsAddress: string;
  city: string;
  state: string;
  zipCode: string;
  landValue?: number;
  buildingValue?: number;
  totalAssessedValue?: number;
  marketValue?: number;
  propertyClass: string;
  landUseCode: string;
  acreage?: number;
  yearBuilt?: number;
  lastUpdated: string;
}

interface PACSJurisdiction {
  jurisdictionId: string;
  jurisdictionName: string;
  countyName: string;
  stateName: string;
  isActive: boolean;
  pacsVersion: string;
  databaseName: string;
  lastSync: string;
}

interface PACSSyncStatus {
  jurisdiction: string;
  lastSync: string;
  nextScheduledSync: string;
  status: string;
  recordsProcessed: number;
  recordsUpdated: number;
  recordsAdded: number;
  recordsSkipped: number;
  errors: string[];
  syncDuration: string;
  syncVersion: string;
}

interface PACSSystemStatus {
  isOnline: boolean;
  version: string;
  lastHealthCheck: string;
  serviceStatus: Record<string, boolean>;
  activeConnections: number;
  responseTime: number;
  databaseSize: number;
  lastBackup: string;
  systemMetrics: Record<string, any>;
}

const HarrisPACSIntegrationDashboard: React.FC = () => {
  const [jurisdictions, setJurisdictions] = useState<PACSJurisdiction[]>([]);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('');
  const [properties, setProperties] = useState<PACSProperty[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<Record<string, PACSSyncStatus>>({});
  const [systemStatus, setSystemStatus] = useState<PACSSystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyPage, setPropertyPage] = useState(1);
  const [propertyPageSize] = useState(50);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(refreshSystemStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedJurisdiction) {
      loadJurisdictionData(selectedJurisdiction);
    }
  }, [selectedJurisdiction, propertyPage]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadJurisdictions(),
        refreshSystemStatus()
      ]);
    } catch (err) {
      setError('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadJurisdictions = async () => {
    try {
      const response = await fetch('/api/harrispacsintegration/jurisdictions');
      if (!response.ok) throw new Error('Failed to load jurisdictions');
      const data = await response.json();
      setJurisdictions(data);
      
      // Load sync statuses for all jurisdictions
      const syncPromises = data.map((j: PACSJurisdiction) => loadSyncStatus(j.jurisdictionId));
      await Promise.all(syncPromises);
    } catch (err) {
      console.error('Error loading jurisdictions:', err);
    }
  };

  const loadJurisdictionData = async (jurisdictionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/harrispacsintegration/jurisdictions/${jurisdictionId}/properties?page=${propertyPage}&pageSize=${propertyPageSize}`
      );
      if (!response.ok) throw new Error('Failed to load properties');
      const data = await response.json();
      setProperties(data);
    } catch (err) {
      setError(`Failed to load data for jurisdiction ${jurisdictionId}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStatus = async (jurisdictionId: string) => {
    try {
      const response = await fetch(
        `/api/harrispacsintegration/jurisdictions/${jurisdictionId}/sync/status`
      );
      if (!response.ok) throw new Error('Failed to load sync status');
      const data = await response.json();
      setSyncStatuses(prev => ({
        ...prev,
        [jurisdictionId]: data
      }));
    } catch (err) {
      console.error(`Error loading sync status for ${jurisdictionId}:`, err);
    }
  };

  const refreshSystemStatus = async () => {
    try {
      const response = await fetch('/api/harrispacsintegration/system/status');
      if (!response.ok) throw new Error('Failed to load system status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (err) {
      console.error('Error loading system status:', err);
    }
  };

  const initiateSync = async (jurisdictionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/harrispacsintegration/jurisdictions/${jurisdictionId}/sync`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Failed to initiate sync');
      
      // Refresh sync status after initiating
      setTimeout(() => loadSyncStatus(jurisdictionId), 2000);
      setSyncDialogOpen(false);
    } catch (err) {
      setError(`Failed to initiate sync for ${jurisdictionId}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'success';
      case 'running':
      case 'in_progress':
        return 'info';
      case 'error':
      case 'failed':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const filteredProperties = properties.filter(property =>
    property.situsAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.parcelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Chart data preparation
  const propertyTypeData = properties.reduce((acc, property) => {
    const type = property.propertyClass || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = Object.entries(propertyTypeData).map(([name, value]) => ({
    name,
    value
  }));

  const syncPerformanceData = Object.entries(syncStatuses).map(([jurisdiction, status]) => ({
    jurisdiction: jurisdictions.find(j => j.jurisdictionId === jurisdiction)?.jurisdictionName || jurisdiction,
    recordsProcessed: status.recordsProcessed,
    recordsUpdated: status.recordsUpdated,
    recordsAdded: status.recordsAdded,
    errors: status.errors.length
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Harris PACS Integration Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* System Status Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box><>

                  <Typography color="textSecondary" gutterBottom>
                    System Status
                  </Typography>
                  <Typography
</>
variant="h6">
                    {systemStatus?.isOnline ? 'Online' : 'Offline'}
                  </Typography>
                </Box>
                {systemStatus?.isOnline ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <ErrorIcon color="error" />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent><>

              <Typography color="textSecondary" gutterBottom>
                PACS Version
              </Typography>
              <Typography
</>
variant="h6">
                {systemStatus?.version || 'Unknown'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent><>

              <Typography color="textSecondary" gutterBottom>
                Response Time
              </Typography>
              <Typography
</>
variant="h6">
                {systemStatus?.responseTime ? `${systemStatus.responseTime}ms` : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent><>

              <Typography color="textSecondary" gutterBottom>
                Active Connections
              </Typography>
              <Typography
</>
variant="h6">
                {formatNumber(systemStatus?.activeConnections)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Jurisdiction Selection and Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <FormControl sx={{ minWidth: 300 }}><>

              <InputLabel>Select Jurisdiction</InputLabel>
              <Select
</>

                value={selectedJurisdiction}
                onChange={(e) => setSelectedJurisdiction(e.target.value)}
                label="Select Jurisdiction"
              >
                {jurisdictions.map((jurisdiction) => (
                  <MenuItem key={jurisdiction.jurisdictionId} value={jurisdiction.jurisdictionId}>
                    {jurisdiction.jurisdictionName} ({jurisdiction.countyName}, {jurisdiction.stateName})
                  </MenuItem>
                ))}
              </Select>
            </FormControl><>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => selectedJurisdiction && loadJurisdictionData(selectedJurisdiction)}
              disabled={!selectedJurisdiction || loading}
            >
              Refresh Data
            </Button>

            <Button
</>

              variant="contained"
              startIcon={<SyncIcon />}
              onClick={() => setSyncDialogOpen(true)}
              disabled={!selectedJurisdiction || loading}
            >
              Sync Data
            </Button>
          </Box>

          {selectedJurisdiction && (
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search properties by address, parcel number, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Sync Status Overview */}
      {selectedJurisdiction && syncStatuses[selectedJurisdiction] && (
        <Card sx={{ mb: 3 }}>
          <CardContent><>

            <Typography variant="h6" gutterBottom>
              Sync Status - {jurisdictions.find(j => j.jurisdictionId === selectedJurisdiction)?.jurisdictionName}
            </Typography>
            
            <Grid
</>
container spacing={2}>
              <Grid item xs={12} md={2}>
                <Box textAlign="center"><>

                  <Typography variant="h4" color="primary">
                    {formatNumber(syncStatuses[selectedJurisdiction].recordsProcessed)}
                  </Typography>
                  <Typography
</>
variant="body2" color="textSecondary">
                    Records Processed
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Box textAlign="center"><>

                  <Typography variant="h4" color="success.main">
                    {formatNumber(syncStatuses[selectedJurisdiction].recordsUpdated)}
                  </Typography>
                  <Typography
</>
variant="body2" color="textSecondary">
                    Updated
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Box textAlign="center"><>

                  <Typography variant="h4" color="info.main">
                    {formatNumber(syncStatuses[selectedJurisdiction].recordsAdded)}
                  </Typography>
                  <Typography
</>
variant="body2" color="textSecondary">
                    Added
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Box textAlign="center"><>

                  <Typography variant="h4" color="warning.main">
                    {formatNumber(syncStatuses[selectedJurisdiction].recordsSkipped)}
                  </Typography>
                  <Typography
</>
variant="body2" color="textSecondary">
                    Skipped
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Box textAlign="center"><>

                  <Typography variant="h4" color="error.main">
                    {syncStatuses[selectedJurisdiction].errors.length}
                  </Typography>
                  <Typography
</>
variant="body2" color="textSecondary">
                    Errors
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Box textAlign="center">
                  <Chip
                    label={syncStatuses[selectedJurisdiction].status}
                    color={getStatusColor(syncStatuses[selectedJurisdiction].status)}
                    size="small"
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Status
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Last Sync: {new Date(syncStatuses[selectedJurisdiction].lastSync).toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {selectedJurisdiction && properties.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent><>

                <Typography variant="h6" gutterBottom>
                  Property Type Distribution
                </Typography>
                <ResponsiveContainer
</>
width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry /* , index */) => (<>

                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
</>
/>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent><>

                <Typography variant="h6" gutterBottom>
                  Sync Performance by Jurisdiction
                </Typography>
                <ResponsiveContainer
</>
width="100%" height={300}>
                  <BarChart data={syncPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jurisdiction" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="recordsProcessed" fill="#8884d8" name="Processed" />
                    <Bar dataKey="recordsUpdated" fill="#82ca9d" name="Updated" />
                    <Bar dataKey="recordsAdded" fill="#ffc658" name="Added" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Properties Table */}
      {selectedJurisdiction && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}><>

              <Typography variant="h6">
                Properties ({formatNumber(filteredProperties.length)})
              </Typography>
              <Button
</>

                startIcon={<DownloadIcon />}
                onClick={() => {
                  // Export functionality would go here
                  console.log('Export properties data');
                }}
              >
                Export
              </Button>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow><>

                      <TableCell>Parcel Number</TableCell>
                      <TableCell
</>
</>>Address</TableCell><>

                      <TableCell>City</TableCell>
                      <TableCell
</>
</>>Property Class</TableCell><>

                      <TableCell align="right">Land Value</TableCell>
                      <TableCell
</>
align="right">Building Value</TableCell><>

                      <TableCell align="right">Total Value</TableCell>
                      <TableCell
</>
</>>Year Built</TableCell>
                      <TableCell>Last Updated</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.parcelNumber} hover><>

                        <TableCell>{property.parcelNumber}</TableCell>
                        <TableCell
</>
</>>{property.situsAddress}</TableCell><>

                        <TableCell>{property.city}</TableCell>
                        <TableCell
</>
</>>{property.propertyClass}</TableCell><>

                        <TableCell align="right">{formatCurrency(property.landValue)}</TableCell>
                        <TableCell
</>
align="right">{formatCurrency(property.buildingValue)}</TableCell><>

                        <TableCell align="right">{formatCurrency(property.totalAssessedValue)}</TableCell>
                        <TableCell
</>
</>>{property.yearBuilt || 'N/A'}</TableCell>
                        <TableCell>{new Date(property.lastUpdated).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync Dialog */}
      <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)}><>

        <DialogTitle>Initiate Data Synchronization</DialogTitle>
        <DialogContent
</>
</>><>

          <Typography>
            Are you sure you want to initiate data synchronization for{' '}
            {jurisdictions.find(j => j.jurisdictionId === selectedJurisdiction)?.jurisdictionName}?
          </Typography>
          <Typography
</>
variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            This process may take several minutes depending on the amount of data to sync.
          </Typography>
        </DialogContent>
        <DialogActions><>

          <Button onClick={() => setSyncDialogOpen(false)}>Cancel</Button>
          <Button
</>

            onClick={() => initiateSync(selectedJurisdiction)}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Start Sync'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HarrisPACSIntegrationDashboard;
