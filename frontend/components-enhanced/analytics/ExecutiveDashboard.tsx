import React, {useState, useEffect, useCallback} from 'react';
import {Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar} from '@mui/material';
import {TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon} from '@mui/icons-material';
import {LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart} from 'recharts';
import {useExecutiveDashboard} from './hooks/useExecutiveDashboard';
import {KPICard} from './components/KPICard';
import {StrategicInsightCard} from './components/StrategicInsightCard';
import {AlertsPanel} from './components/AlertsPanel';
import {PerformanceGauge} from './components/PerformanceGauge';

interface ExecutiveDashboardProps {jurisdiction: string;
  refreshInterval?: number;
  showSettings?: boolean;}

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({jurisdiction,
  refreshInterval = 30000, // 30 seconds
  showSettings = true}) => {const {
    dashboardData,
    kpiData,
    strategicInsights,
    alerts,
    performanceMetrics,
    isLoading,
    error,
    lastUpdated,
    refreshDashboard,
    exportDashboard,
    updateSettings} = useExecutiveDashboard(jurisdiction, refreshInterval);

  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'revenue',
    'efficiency',
    'compliance',
    'performance'
  ]);

  const timeRangeOptions = [
    {value: '7d', label: 'Last 7 Days'},
    {value: '30d', label: 'Last 30 Days'},
    {value: '90d', label: 'Last 90 Days'},
    {value: '1y', label: 'Last Year'},
    {value: 'ytd', label: 'Year to Date'}
  ];

  const handleRefresh = useCallback(() =>{refreshDashboard(selectedTimeRange);}, [refreshDashboard, selectedTimeRange]);

  const handleExport = useCallback(async (format: 'pdf' | 'excel') => {try {
      await exportDashboard(format);} catch (error) {console.error('Export failed:', error);}
  }, [exportDashboard]);

  const renderKPISection = () => (<Grid container spacing={3}>{kpiData.map((kpi /* , index */) => (<Grid item xs={12} sm={6} md={3} key={index}><KPICard
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            trend={kpi.trend}
            format={kpi.format}
            target={kpi.target}
            status={kpi.status}
            icon={kpi.icon}
            color={kpi.color} /></Grid>))}</Grid>);

  const renderRevenueChart = () => (<Paper sx={{ p: 3, height: 400}}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}><><Typography variant="h6">Revenue Trends</Typography><Box
</></>><Tooltip title="Revenue is trending up 12% vs last period"><TrendingUpIcon color="success" /></Tooltip></Box></Box><ResponsiveContainer width="100%" height={300}><ComposedChart data={dashboardData?.revenueData || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><RechartsTooltip formatter={(value: any) => [`$${value?.toLocaleString()}`, 'Revenue']} /><Legend /><Area
            type="monotone"
            dataKey="actual"
            fill="#1976d2"
            fillOpacity={0.3}
            stroke="#1976d2"
            strokeWidth={2}
            name="Actual Revenue" /><Line
            type="monotone"
            dataKey="forecast"
            stroke="#ff9800"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Forecast" /><Line
            type="monotone"
            dataKey="target"
            stroke="#4caf50"
            strokeWidth={2}
            name="Target" /></ComposedChart></ResponsiveContainer></Paper>);

  const renderPerformanceMetrics = () => (<Paper sx={{ p: 3}}><><Typography variant="h6" gutterBottom>System Performance</Typography><Grid
</>container spacing={3}>
        {performanceMetrics.map((metric /* , index */) => (<Grid item xs={12} sm={6} md={3} key={index}><PerformanceGauge
              title={metric.title}
              value={metric.value}
              max={metric.max}
              unit={metric.unit}
              color={metric.color}
              thresholds={metric.thresholds} /></Grid>))}</Grid></Paper>);

  const renderStrategicInsights = () => (<Paper sx={{ p: 3}}><><Typography variant="h6" gutterBottom>Strategic Insights</Typography><Grid
</>container spacing={2}>
        {strategicInsights.map((insight /* , index */) => (<Grid item xs={12} md={6} key={index}><StrategicInsightCard
              title={insight.title}
              description={insight.description}
              impact={insight.impact}
              confidence={insight.confidence}
              category={insight.category}
              recommendations={insight.recommendations}
              priority={insight.priority} /></Grid>))}</Grid></Paper>);

  const renderComplianceStatus = () => (<Paper sx={{ p: 3}}><><Typography variant="h6" gutterBottom>Compliance Status</Typography><Grid
</>container spacing={2}>
        {dashboardData?.complianceData?.map((item /* , index */) => (<Grid item xs={12} sm={6} md={4} key={index}><Card sx={{ height: '100%'}}><CardContent><Box sx={{ display: 'flex', alignItems: 'center', mb: 1}}>{item.status === 'compliant' &&<CheckCircleIcon color="success" />}
                  {item.status === 'warning' && <WarningIcon color="warning" />}
                  {item.status === 'non-compliant' && <ErrorIcon color="error" />}
                  <Typography variant="subtitle1" sx={{ ml: 1}}>{item.framework}</Typography></Box><><Typography variant="body2" color="text.secondary">Score: {item.score}%</Typography><Typography
</>variant="body2" color="text.secondary">
                  Last Audit: {new Date(item.lastAudit).toLocaleDateString()}</Typography>{item.issues > 0 && (<Chip
                    label={`${item.issues} Issues`}
                    color="warning"
                    size="small"
                    sx={{ mt: 1}} />)}</CardContent></Card></Grid>))}</Grid></Paper>);

  const renderAIAgentStatus = () => (<Paper sx={{ p: 3}}><><Typography variant="h6" gutterBottom>AI Agent Performance</Typography><Grid
</>
container spacing={2}><Grid item xs={12} md={8}><ResponsiveContainer width="100%" height={250}><AreaChart data={dashboardData?.aiPerformanceData || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis /><RechartsTooltip /><Area
                type="monotone"
                dataKey="activeAgents"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                name="Active Agents" /><Area
                type="monotone"
                dataKey="processingTasks"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                name="Processing Tasks" /></AreaChart></ResponsiveContainer></Grid><Grid item xs={12} md={4}><List><ListItem><ListItemIcon><Avatar sx={{ bgcolor: 'primary.main'}}>{dashboardData?.aiStats?.totalAgents || 0}</Avatar></ListItemIcon><><ListItemText
                primary="Total Agents"
                secondary={`${dashboardData?.aiStats?.activeAgents || 0} active`} /></ListItem><ListItem
</></>><ListItemIcon><Avatar sx={{ bgcolor: 'success.main'}}><SpeedIcon /></Avatar></ListItemIcon><><ListItemText
                primary="Avg Response Time"
                secondary={`${dashboardData?.aiStats?.avgResponseTime || 0}ms`} /></ListItem><ListItem
</></>><ListItemIcon><Avatar sx={{ bgcolor: 'info.main'}}><AssessmentIcon /></Avatar></ListItemIcon><ListItemText
                primary="Success Rate"
                secondary={`${dashboardData?.aiStats?.successRate || 0}%`} /></ListItem></List></Grid></Grid></Paper>);

  const renderSettingsDialog = () => (<Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} maxWidth="md" fullWidth><><DialogTitle>Dashboard Settings</DialogTitle><DialogContent
</></>><Box sx={{ mt: 2}}><FormControlLabel
            control={<Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          /><Typography variant="body2" color="text.secondary" sx={{ ml: 4}}>Automatically refresh data every {refreshInterval / 1000} seconds</Typography></Box><Divider sx={{ my: 2}} /><><Typography variant="subtitle1" gutterBottom>Visible Metrics</Typography><Grid
</>container spacing={1}>
          {['revenue', 'efficiency', 'compliance', 'performance', 'ai-agents', 'security'].map((metric) => (<Grid item key={metric}><Chip
                label={metric.charAt(0).toUpperCase() + metric.slice(1)}
                variant={selectedMetrics.includes(metric) ? 'filled' : 'outlined'}
                onClick={() => {
                  setSelectedMetrics(prev =>
                    prev.includes(metric)
                      ? prev.filter(m => m !== metric)
                      : [...prev, metric]
                  );}}
                color="primary"
              /></Grid>))}</Grid></DialogContent><DialogActions><><Button onClick={() => setShowSettingsDialog(false)}>Cancel</Button><Button
</>variant="contained"
          onClick={() => {
            updateSettings({ autoRefresh, selectedMetrics});
            setShowSettingsDialog(false);
          }}
        >
          Save Settings</Button></DialogActions></Dialog>);

  if (error) {
    return (<Alert severity="error" sx={{ m: 2}}>Failed to load dashboard data: {error}<Button onClick={handleRefresh} sx={{ ml: 2}}>Retry</Button></Alert>);
  }

  return (<Box sx={{ p: 3}}>{/* Header */}<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3}}><Box><><Typography variant="h4" gutterBottom>Executive Dashboard</Typography><Typography
</>variant="subtitle1" color="text.secondary">
            {jurisdiction} • Last updated: {lastUpdated?.toLocaleTimeString()}</Typography></Box><Box sx={{ display: 'flex', gap: 1}}><FormControl size="small" sx={{ minWidth: 150}}><><InputLabel>Time Range</InputLabel><Select
</>value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              label="Time Range"
            >
              {timeRangeOptions.map((option) => (<MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>))}</Select></FormControl><Tooltip title="Refresh Dashboard"><IconButton onClick={handleRefresh} disabled={isLoading}>{isLoading ?<CircularProgress size={20} />:<RefreshIcon />}
            </IconButton></Tooltip><Tooltip title="Export Dashboard"><IconButton onClick={() => handleExport('pdf')}><DownloadIcon /></IconButton></Tooltip>{showSettings && (<Tooltip title="Settings"><IconButton onClick={() => setShowSettingsDialog(true)}><SettingsIcon /></IconButton></Tooltip>)}</Box></Box>{/* Alerts */}
      {alerts.length > 0 && (<Box sx={{ mb: 3}}><AlertsPanel alerts={alerts} /></Box>)}

      {/* KPI Cards */}<Box sx={{ mb: 3}}>{renderKPISection()}</Box>{/* Main Charts */}<Grid container spacing={3} sx={{ mb: 3}}><><Grid item xs={12} lg={8}>{renderRevenueChart()}</Grid><Grid
</>item xs={12} lg={4}>
          {renderPerformanceMetrics()}</Grid></Grid>{/* Strategic Insights */}<Box sx={{ mb: 3}}>{renderStrategicInsights()}</Box>{/* Additional Sections */}<Grid container spacing={3}><><Grid item xs={12} md={6}>{renderComplianceStatus()}</Grid><Grid
</>item xs={12} md={6}>
          {renderAIAgentStatus()}</Grid></Grid>{/* Settings Dialog */}
      {renderSettingsDialog()}</Box>
  );
};

export default ExecutiveDashboard;
