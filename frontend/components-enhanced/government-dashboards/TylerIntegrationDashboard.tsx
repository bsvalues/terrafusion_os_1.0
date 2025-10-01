import React, {useState, useEffect} from 'react';
import {Box,
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
  Tooltip} from '@mui/material';
import {Sync,
  Storage,
  Business,
  Home,
  Assessment,
  AccountBalance,
  Refresh,
  Visibility,
  Download} from '@mui/icons-material';
import {BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell} from 'recharts';

interface HarrisPacsJurisdiction {id: string;
  name: string;
  state: string;
  county: string;
  isActive: boolean;
  lastSync: string;}

interface HarrisPacsProperty {parcelId: string;
  address: string;
  city: string;
  state: string;
  totalValue: number;
  propertyType: string;
  yearBuilt: number;
  lastUpdated: string;}

interface HarrisPacsSyncStatus {jurisdiction: string;
  lastSync: string;
  nextScheduledSync: string;
  status: string;
  recordsProcessed: number;
  recordsUpdated: number;
  recordsAdded: number;
  errors: string[];}

interface HarrisPacsSystemStatus {isOnline: boolean;
  version: string;
  lastHealthCheck: string;
  serviceStatus: Record<string, boolean>;
  activeConnections: number;
  responseTime: number;}

const HarrisPacsIntegrationDashboard: React.FC = () => {
  const [jurisdictions, setJurisdictions] = useState<HarrisPacsJurisdiction[]>([]);
  const [properties, setProperties] = useState<HarrisPacsProperty[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<Record<string, HarrisPacsSyncStatus>>({});
  const [systemStatus, setSystemStatus] = useState<HarrisPacsSystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>('');
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() =>{fetchData();
    const interval = setInterval(fetchSystemStatus, 30000); // Check system status every 30 seconds
    return () => clearInterval(interval);}, []);

  const fetchData = async () => {try {
      setLoading(true);
      await Promise.all([
        fetchJurisdictions(),
        fetchSystemStatus()
      ]);
      setError(null);} catch (err) {setError('Failed to load Harris PACS integration data');
      console.error('Error fetching Harris PACS data:', err);} finally {setLoading(false);}
  };

  const fetchJurisdictions = async () => {
    try {
      const response = await fetch('/api/harris-pacs/jurisdictions');
      if (response.ok) {
        const data = await response.json();
        setJurisdictions(data);
        
        // Fetch sync status for each jurisdiction
        const syncPromises = data.map(async (jurisdiction: HarrisPacsJurisdiction) => {
          try {
            const syncResponse = await fetch(`/api/harris-pacs/jurisdictions/${jurisdiction.id}/sync/status`);
            if (syncResponse.ok) {const syncData = await syncResponse.json();
              return { [jurisdiction.id]: syncData};
            }
          } catch (err) {
            console.error(`Error fetching sync status for ${jurisdiction.id}:`, err);
          }
          return {};
        });
        
        const syncResults = await Promise.all(syncPromises);
        const allSyncStatuses = syncResults.reduce((acc, curr) => ({...acc, ...curr}), {});
        setSyncStatuses(allSyncStatuses);
      }
    } catch (err) {console.error('Error fetching jurisdictions:', err);}
  };

  const fetchSystemStatus = async () => {try {
      const response = await fetch('/api/harris-pacs/system/status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);}
    } catch (err) {console.error('Error fetching system status:', err);}
  };

  const fetchProperties = async (jurisdictionId: string) => {
    try {
      const response = await fetch(`/api/harris-pacs/jurisdictions/${jurisdictionId}/properties?pageSize=50`);
      if (response.ok) {const data = await response.json();
        setProperties(data);}
    } catch (err) {console.error('Error fetching properties:', err);}
  };

  const handleSyncJurisdiction = async (jurisdictionId: string) => {
    try {
      const response = await fetch(`/api/harris-pacs/jurisdictions/${jurisdictionId}/sync`, {method: 'POST'});
      
      if (response.ok) {// Refresh sync status after initiating sync
        setTimeout(() => fetchJurisdictions(), 2000);
        setSyncDialogOpen(false);}
    } catch (err) {console.error('Error syncing jurisdiction:', err);}
  };

  const getStatusColor = (status: string): string => {switch (status.toLowerCase()) {
      case 'completed': return '#4caf50';
      case 'in_progress': return '#ff9800';
      case 'failed': return '#f44336';
      case 'pending': return '#2196f3';
      default: return '#9e9e9e';}
  };

  const formatCurrency = (amount: number): string => {return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0}).format(amount);
  };

  if (loading) {
    return (<Box sx={{ p: 3}}><><Typography variant="h4" gutterBottom>Harris PACS Integration</Typography><LinearProgress
</>
/></Box>);
  }

  return (<Box sx={{ p: 3}}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3}}><><Typography variant="h4">Harris PACS Integration</Typography><Box
</></>><><Button
            startIcon={<Refresh />}
            onClick={fetchData}
            sx={{ mr: 1}}
          >Refresh</Button><Button
</>

            startIcon={<Sync />}
            onClick={() =>setSyncDialogOpen(true)}
            variant="contained"
          >
            Sync Data</Button></Box></Box>{error && (<Alert severity="error" sx={{ mb: 3}}>{error}</Alert>)}

      {/* System Status */}
      {systemStatus && (<Grid container spacing={3} sx={{ mb: 4}}><Grid item xs={12} md={3}><Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', mb: 2}}><Storage sx={{ mr: 1, color: systemStatus.isOnline ? '#4caf50' : '#f44336'}} /><Typography variant="h6">System Status</Typography></Box><><Typography variant="h4" sx={{ color: systemStatus.isOnline ? '#4caf50' : '#f44336'}}>{systemStatus.isOnline ? 'Online' : 'Offline'}</Typography><Typography
</>variant="body2" color="text.secondary">
                  Version {systemStatus.version}</Typography></CardContent></Card></Grid><Grid item xs={12} md={3}><Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', mb: 2}}><Business sx={{ mr: 1, color: '#1976d2'}} /><Typography variant="h6">Active Connections</Typography></Box><><Typography variant="h4" sx={{ color: '#1976d2'}}>{systemStatus.activeConnections}</Typography><Typography
</>variant="body2" color="text.secondary">
                  Current Sessions</Typography></CardContent></Card></Grid><Grid item xs={12} md={3}><Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', mb: 2}}><Assessment sx={{ mr: 1, color: '#388e3c'}} /><Typography variant="h6">Response Time</Typography></Box><><Typography variant="h4" sx={{ color: '#388e3c'}}>{systemStatus.responseTime}ms</Typography><Typography
</>variant="body2" color="text.secondary">
                  Average Response</Typography></CardContent></Card></Grid><Grid item xs={12} md={3}><Card><CardContent><Box sx={{ display: 'flex', alignItems: 'center', mb: 2}}><AccountBalance sx={{ mr: 1, color: '#f57c00'}} /><Typography variant="h6">Jurisdictions</Typography></Box><><Typography variant="h4" sx={{ color: '#f57c00'}}>{jurisdictions.filter(j => j.isActive).length}</Typography><Typography
</>variant="body2" color="text.secondary">
                  Active Jurisdictions</Typography></CardContent></Card></Grid></Grid>)}

      {/* Jurisdictions Table */}<Card sx={{ mb: 4}}><CardContent><><Typography variant="h6" gutterBottom>Jurisdictions & Sync Status</Typography><TableContainer
</></>><Table><TableHead><TableRow><><TableCell>Jurisdiction</TableCell><TableCell
</></>>Location</TableCell><><TableCell>Status</TableCell><TableCell
</></>>Last Sync</TableCell><><TableCell>Records Processed</TableCell><TableCell
</></>>Sync Status</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>{jurisdictions.map((jurisdiction) => {
                  const syncStatus = syncStatuses[jurisdiction.id];
                  return (<TableRow key={jurisdiction.id}><><TableCell>{jurisdiction.name}</TableCell><TableCell
</></>>{jurisdiction.county}, {jurisdiction.state}</TableCell><TableCell><><Chip
                          label={jurisdiction.isActive ? 'Active' : 'Inactive'}
                          color={jurisdiction.isActive ? 'success' : 'error'}
                          size="small" /></TableCell><TableCell
</></>>{syncStatus ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}</TableCell><><TableCell>{syncStatus ? syncStatus.recordsProcessed.toLocaleString() : 'N/A'}</TableCell><TableCell
</></>>{syncStatus && (<><Chip
                            label={syncStatus.status}
                            sx={{ 
                              backgroundColor: getStatusColor(syncStatus.status), 
                              color: 'white'}}
                            size="small" />)}</TableCell><TableCell
</></>><Tooltip title="View Properties"><IconButton
                            size="small"
                            onClick={() => {
                              setSelectedJurisdiction(jurisdiction.id);
                              fetchProperties(jurisdiction.id);}}
                          ><Visibility /></IconButton></Tooltip><Tooltip title="Sync Data"><IconButton
                            size="small"
                            onClick={() => handleSyncJurisdiction(jurisdiction.id)}
                          ><Sync /></IconButton></Tooltip></TableCell></TableRow>);
                })}</TableBody></Table></TableContainer></CardContent></Card>{/* Properties Data */}
      {properties.length > 0 && (<Grid container spacing={3} sx={{ mb: 4}}><Grid item xs={12} md={8}><Card><CardContent><><Typography variant="h6" gutterBottom>Recent Properties</Typography><TableContainer
</>
sx={{ maxHeight: 400}}><Table stickyHeader><TableHead><TableRow><><TableCell>Parcel ID</TableCell><TableCell
</></>>Address</TableCell><><TableCell>Type</TableCell><TableCell
</></>>Value</TableCell><TableCell>Year Built</TableCell></TableRow></TableHead><TableBody>{properties.slice(0, 20).map((property) => (<TableRow key={property.parcelId}><><TableCell>{property.parcelId}</TableCell><TableCell
</></>>{property.address}</TableCell><><TableCell>{property.propertyType}</TableCell><TableCell
</></>>{formatCurrency(property.totalValue)}</TableCell><TableCell>{property.yearBuilt}</TableCell></TableRow>))}</TableBody></Table></TableContainer></CardContent></Card></Grid><Grid item xs={12} md={4}><Card><CardContent><><Typography variant="h6" gutterBottom>Property Types</Typography><ResponsiveContainer
</>
width="100%" height={300}><PieChart><Pie
                      data={Object.entries(
                        properties.reduce((acc, prop) => {
                          acc[prop.propertyType] = (acc[prop.propertyType] || 0) + 1;
                          return acc;}, {} as Record<string, number>)
                      ).map(([type, count]) => ({name: type, value: count}))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {Object.keys(properties.reduce((acc, prop) => {acc[prop.propertyType] = true;
                        return acc;}, {} as Record<string, boolean>)).map((_ /* , index */) => (<><Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><RechartsTooltip
</>
/><Legend /></PieChart></ResponsiveContainer></CardContent></Card></Grid></Grid>)}

      {/* Sync Dialog */}<Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)} maxWidth="sm" fullWidth><><DialogTitle>Sync Jurisdiction Data</DialogTitle><DialogContent
</></>><FormControl fullWidth sx={{ mt: 1}}><><InputLabel>Select Jurisdiction</InputLabel><Select
</>value={selectedJurisdiction}
              onChange={(e) => setSelectedJurisdiction(e.target.value)}
            >
              {jurisdictions.filter(j => j.isActive).map((jurisdiction) => (<MenuItem key={jurisdiction.id} value={jurisdiction.id}>{jurisdiction.name} ({jurisdiction.county}, {jurisdiction.state})</MenuItem>))}</Select></FormControl></DialogContent><DialogActions><><Button onClick={() => setSyncDialogOpen(false)}>Cancel</Button><Button
</>onClick={() => handleSyncJurisdiction(selectedJurisdiction)} 
            variant="contained"
            disabled={!selectedJurisdiction}
          >
            Start Sync</Button></DialogActions></Dialog></Box>
  );
};

export default HarrisPacsIntegrationDashboard;
