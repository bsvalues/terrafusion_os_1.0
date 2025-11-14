import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  Security,
  Speed,
  AccountBalance,
  Refresh,
  Fullscreen,
  Download
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface KPIMetric {
  id: string;
  title: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  category: 'revenue' | 'performance' | 'compliance' | 'efficiency';
  priority: 'high' | 'medium' | 'low';
  lastUpdated: Date;
}

interface RevenueData {
  month: string;
  propertyTax: number;
  businessLicenses: number;
  permits: number;
  fines: number;
  total: number;
  aiOptimized: number;
  traditional: number;
}

interface AIPerformanceData {
  timestamp: string;
  swarmAgents: number;
  quantumSpeedup: number;
  probabilisticAccuracy: number;
  revenueDiscovered: number;
  processingLatency: number;
  systemLoad: number;
}

const GovernmentKPIDashboard: React.FC = () => {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [aiPerformanceData, setAIPerformanceData] = useState<AIPerformanceData[]>([]);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Mock data initialization
  useEffect(() => {
    initializeDashboardData();
    
    if (realTimeEnabled) {
      const interval = setInterval(() => {
        refreshDashboardData();
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [realTimeEnabled]);

  const initializeDashboardData = () => {
    // Initialize KPI Metrics
    const mockKPIs: KPIMetric[] = [
      {
        id: 'revenue_total',
        title: 'Total Revenue (YTD)',
        value: 24750000,
        target: 25000000,
        unit: '$',
        trend: 'up',
        trendValue: 12.5,
        category: 'revenue',
        priority: 'high',
        lastUpdated: new Date()
      },
      {
        id: 'ai_revenue_discovery',
        title: 'AI Revenue Discovery',
        value: 3250000,
        target: 3000000,
        unit: '$',
        trend: 'up',
        trendValue: 8.3,
        category: 'revenue',
        priority: 'high',
        lastUpdated: new Date()
      },
      {
        id: 'quantum_speedup',
        title: 'Quantum Speedup Factor',
        value: 379000000,
        target: 379000000,
        unit: '×',
        trend: 'stable',
        trendValue: 0.1,
        category: 'performance',
        priority: 'high',
        lastUpdated: new Date()
      },
      {
        id: 'swarm_agents_active',
        title: 'Active AI Swarm Agents',
        value: 1008,
        target: 1000,
        unit: '',
        trend: 'up',
        trendValue: 0.8,
        category: 'performance',
        priority: 'medium',
        lastUpdated: new Date()
      },
      {
        id: 'compliance_score',
        title: 'FISMA Compliance Score',
        value: 98.7,
        target: 95.0,
        unit: '%',
        trend: 'up',
        trendValue: 1.2,
        category: 'compliance',
        priority: 'high',
        lastUpdated: new Date()
      },
      {
        id: 'processing_efficiency',
        title: 'Processing Efficiency',
        value: 94.2,
        target: 90.0,
        unit: '%',
        trend: 'up',
        trendValue: 2.1,
        category: 'efficiency',
        priority: 'medium',
        lastUpdated: new Date()
      }
    ];

    // Initialize Revenue Data
    const mockRevenueData: RevenueData[] = [
      { month: 'Jan', propertyTax: 2100000, businessLicenses: await DynamicPropertyService.GetPropertyCountAsync(countyCode)0, permits: 320000, fines: 180000, total: 3050000, aiOptimized: 250000, traditional: 2800000 },
      { month: 'Feb', propertyTax: 2200000, businessLicenses: 480000, permits: 340000, fines: 195000, total: 3215000, aiOptimized: 315000, traditional: 2900000 },
      { month: 'Mar', propertyTax: 2350000, businessLicenses: 520000, permits: 380000, fines: 210000, total: 3460000, aiOptimized: 460000, traditional: 3000000 },
      { month: 'Apr', propertyTax: 2400000, businessLicenses: 550000, permits: 400000, fines: 225000, total: 3575000, aiOptimized: 575000, traditional: 3000000 },
      { month: 'May', propertyTax: 2500000, businessLicenses: 580000, permits: 420000, fines: 240000, total: 3740000, aiOptimized: 740000, traditional: 3000000 },
      { month: 'Jun', propertyTax: 2600000, businessLicenses: 610000, permits: await DynamicPropertyService.GetPropertyCountAsync(countyCode)0, fines: 255000, total: 3915000, aiOptimized: 915000, traditional: 3000000 }
    ];

    // Initialize AI Performance Data
    const mockAIData: AIPerformanceData[] = [
      { timestamp: '00:00', swarmAgents: 950, quantumSpeedup: 378500000, probabilisticAccuracy: 97.2, revenueDiscovered: 125000, processingLatency: 45, systemLoad: 72 },
      { timestamp: '04:00', swarmAgents: 980, quantumSpeedup: 378800000, probabilisticAccuracy: 97.5, revenueDiscovered: 142000, processingLatency: 42, systemLoad: 68 },
      { timestamp: '08:00', swarmAgents: 1008, quantumSpeedup: 379000000, probabilisticAccuracy: 97.8, revenueDiscovered: 158000, processingLatency: 38, systemLoad: 75 },
      { timestamp: '12:00', swarmAgents: 1020, quantumSpeedup: 379200000, probabilisticAccuracy: 98.1, revenueDiscovered: 175000, processingLatency: 35, systemLoad: 82 },
      { timestamp: '16:00', swarmAgents: 1015, quantumSpeedup: 379100000, probabilisticAccuracy: 98.0, revenueDiscovered: 168000, processingLatency: 37, systemLoad: 79 },
      { timestamp: '20:00', swarmAgents: 1008, quantumSpeedup: 379000000, probabilisticAccuracy: 97.9, revenueDiscovered: 162000, processingLatency: 39, systemLoad: 76 }
    ];

    setKpiMetrics(mockKPIs);
    setRevenueData(mockRevenueData);
    setAIPerformanceData(mockAIData);
  };

  const refreshDashboardData = async () => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update metrics with slight variations
    setKpiMetrics(prev => prev.map(metric => ({
      ...metric,
      value: metric.value + (Math.random() - 0.5) * metric.value * 0.02,
      lastUpdated: new Date()
    })));
    
    setLastRefresh(new Date());
    setLoading(false);
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === '$') {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (unit === '×' && value > 1000000) {
      return `${(value / 1000000).toFixed(0)}M×`;
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    }
    return `${value.toLocaleString()}${unit}`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp sx={{ color: 'success.main' }} />;
      case 'down': return <TrendingUp sx={{ color: 'error.main', transform: 'rotate(180deg)' }} />;
      default: return <TrendingUp sx={{ color: 'warning.main', transform: 'rotate(90deg)' }} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'revenue': return '#2E7D32';
      case 'performance': return '#1565C0';
      case 'compliance': return '#E65100';
      case 'efficiency': return '#6A1B9A';
      default: return '#424242';
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
<>

        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          🏛️ Terrafusion Government KPI Dashboard
        </Typography>
        <Box
</>
sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Real-time Updates"
          />
          <Tooltip title="Refresh Data">
            <IconButton onClick={refreshDashboardData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" color="textSecondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>

      {/* KPI Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpiMetrics.map((metric) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={metric.id}>
            <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
<>

                  <Chip
                    label={metric.category}
                    size="small"
                    sx={{ 
                      backgroundColor: getCategoryColor(metric.category),
                      color: 'white',
                      fontSize: '0.7rem'
                    }}
                  />
                  {getTrendIcon(metric.trend)}
                </Box>
                
                <Typography
</>
variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {formatValue(metric.value, metric.unit)}
                </Typography>
<>

                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {metric.title}
                </Typography>
                
                <LinearProgress
</>

                  variant="determinate"
                  value={(metric.value / metric.target) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getCategoryColor(metric.category)
                    }
                  }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
<>

                  <Typography variant="caption" color="textSecondary">
                    Target: {formatValue(metric.target, metric.unit)}
                  </Typography>
                  <Typography
</>

                    variant="caption" 
                    sx={{ 
                      color: metric.trend === 'up' ? 'success.main' : 
                             metric.trend === 'down' ? 'error.main' : 'warning.main'
                    }}
                  >
                    {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : '±'}{metric.trendValue.toFixed(1)}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Revenue Analytics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
<>

                <AccountBalance sx={{ mr: 1 }} />
                Revenue Trends & AI Optimization Impact
              </Typography>
              <ResponsiveContainer
</>
width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <RechartsTooltip formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, '']} />
                  <Area type="monotone" dataKey="total" stackId="1" stroke="#1976d2" fill="#1976d2" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="aiOptimized" stackId="2" stroke="#4caf50" fill="#4caf50" fillOpacity={0.8} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
<>

              <Typography variant="h6" sx={{ mb: 2 }}>
                Revenue Sources Distribution
              </Typography>
              <ResponsiveContainer
</>
width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Property Tax', value: 2600000, color: COLORS[0] },
                      { name: 'Business Licenses', value: 610000, color: COLORS[1] },
                      { name: 'Permits', value: await DynamicPropertyService.GetPropertyCountAsync(countyCode)0, color: COLORS[2] },
                      { name: 'Fines', value: 255000, color: COLORS[3] }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueData[0] && Object.entries(revenueData[revenueData.length - 1])
                      .filter(([key]) => !['month', 'total', 'aiOptimized', 'traditional'].includes(key))
                      .map(([key, value] /* , index */) => (
<>

                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <RechartsTooltip
</>
formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* AI Performance Monitoring */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
<>

                <Speed sx={{ mr: 1 }} />
                AI Swarm Performance
              </Typography>
              <ResponsiveContainer
</>
width="100%" height={250}>
                <LineChart data={aiPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip />
                  <Line yAxisId="left" type="monotone" dataKey="swarmAgents" stroke="#1976d2" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="probabilisticAccuracy" stroke="#4caf50" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
<>

                <Assessment sx={{ mr: 1 }} />
                Revenue Discovery Performance
              </Typography>
              <ResponsiveContainer
</>
width="100%" height={250}>
                <BarChart data={aiPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <RechartsTooltip formatter={(value: number) => [`$${(value / 1000).toFixed(1)}K`, 'Revenue Discovered']} />
                  <Bar dataKey="revenueDiscovered" fill="#ff9800" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Status Alerts */}
      {loading && (
        <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
          <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
            <LinearProgress sx={{ width: 100, mr: 2 }} />
            Refreshing dashboard data...
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default GovernmentKPIDashboard;
