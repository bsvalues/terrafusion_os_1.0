import React, {useState} from 'react';
import {useApi} from '../../src/hooks/useApi';
import {Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
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
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress} from '@mui/material';
import {TrendingUp,
  TrendingDown,
  Speed,
  Memory,
  NetworkCheck,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  Settings,
  Analytics,
  Psychology,
  SmartToy,
  Timeline} from '@mui/icons-material';
import {LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer} from 'recharts';

interface ModelPerformance {modelName: string;
  accuracy: number;
  precision: number;
  recall: number;}

interface AIAnalyticsData {modelsLoaded: number;
  datasetsProcessed: number;
  inferenceAccuracy: number;
  modelPerformance: ModelPerformance[];}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AIAnalyticsDashboard: React.FC = () => {const { data: analyticsData, loading, error, refetch} = useApi<AIAnalyticsData>('aianalytics/data');

  const getStatusColor = (status: string) =>{switch (status) {
      case 'active':
      case 'available':
      case 'running':
      case 'completed':
        return 'success';
      case 'busy':
        return 'warning';
      case 'error':
      case 'failed':
      case 'unavailable':
        return 'error';
      default:
        return 'default';}
  };

  const getStatusIcon = (status: string) => {switch (status) {
      case 'active':
      case 'available':
      case 'running':
      case 'completed':
        return<CheckCircle />;
      case 'busy':
        return <Warning />;
      case 'error':
      case 'failed':
      case 'unavailable':
        return <Error />;
      default:
        return <CheckCircle />;}
  };

  const formatCurrency = (amount: number) =>{return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'}).format(amount);
  };

  const formatNumber = (num: number) => {return new Intl.NumberFormat('en-US').format(num);};

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading || !analyticsData) {
    return (<Box display="flex" justifyContent="center" alignItems="center" height="400px"><CircularProgress size={60} /><Typography variant="h6" sx={{ ml: 2}}>Loading AI Analytics Dashboard...</Typography></Box>);
  }

  if (error) {
    return (<Box display="flex" justifyContent="center" alignItems="center" height="400px"><Alert severity="error">Failed to load AI Analytics Data: {error}</Alert></Box>);
  }

  return (<Box sx={{ p: 3}}>{/* Header */}<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}><Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1}}><><Analytics color="primary" />AI Analytics Dashboard</Typography><Box
</>
display="flex" alignItems="center" gap={2}><Tooltip title="Refresh Data"><IconButton onClick={refetch}><Refresh /></IconButton></Tooltip><Tooltip title="Settings"><IconButton><Settings /></IconButton></Tooltip></Box></Box>{/* System Health Overview */}<Grid container spacing={3} mb={3}><Grid item xs={12} md={4}><Card><CardContent><><Typography color="textSecondary" gutterBottom>Models Loaded</Typography><Typography
</>
variant="h4">{analyticsData.modelsLoaded}</Typography></CardContent></Card></Grid><Grid item xs={12} md={4}><Card><CardContent><><Typography color="textSecondary" gutterBottom>Datasets Processed</Typography><Typography
</>
variant="h4">{analyticsData.datasetsProcessed}</Typography></CardContent></Card></Grid><Grid item xs={12} md={4}><Card><CardContent><><Typography color="textSecondary" gutterBottom>Inference Accuracy</Typography><Typography
</>
variant="h4">{(analyticsData.inferenceAccuracy * 100).toFixed(2)}%</Typography></CardContent></Card></Grid></Grid>{/* AI Models Performance */}<Grid container spacing={3} mb={3}><Grid item xs={12}><Card><CardContent><><Typography variant="h6" gutterBottom>AI Models Performance</Typography><TableContainer
</></>><Table><TableHead><TableRow><><TableCell>Model</TableCell><TableCell
</></>>Accuracy</TableCell><><TableCell>Precision</TableCell><TableCell
</></>>Recall</TableCell></TableRow></TableHead><TableBody>{analyticsData.modelPerformance.map((model) => (<TableRow key={model.modelName}><><TableCell>{model.modelName}</TableCell><TableCell
</></>>{(model.accuracy * 100).toFixed(2)}%</TableCell><><TableCell>{(model.precision * 100).toFixed(2)}%</TableCell><TableCell
</></>>{(model.recall * 100).toFixed(2)}%</TableCell></TableRow>))}</TableBody></Table></TableContainer></CardContent></Card></Grid></Grid></Box>
  );
};
