/**
 * ═══════════════════════════════════════════════════════════════
 * ENHANCED DATA VISUALIZATION - COSTFORGE ANALYTICS SYSTEM
 * Migrated from TerraBuild DataVisualization with CostForge integration
 * THE TERRAFUSION WAY - GOVERNMENT-GRADE EXCELLENCE
 * ═══════════════════════════════════════════════════════════════
 */

import {
  Activity,
  AlertCircle,
  BarChart3,
  Database,
  PieChart as PieIcon,
  TrendingUp,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

// CostForge Analytics colors - TerraFusion Design System
const COSTFORGE_ANALYTICS_COLORS = {
  trustBlue: 'var(--tf-network-blue)',
  transcendCyan: 'var(--tf-transcend-highlight)',
  successGreen: 'var(--tf-accent-success)',
  warningAmber: 'var(--warning-amber)',
  criticalRed: 'var(--error-red)',
  deepSpace: 'var(--tf-bg-surface)',
  surfaceGray: 'var(--tf-bg-surface)',
};

const CHART_COLORS = ['var(--tf-transcend-highlight)', 'var(--tf-network-blue)', 'var(--tf-accent-success)', 'var(--warning-amber)', 'var(--tf-accent-pink)', 'var(--tf-accent-teal)'];

interface TimeSeriesDataPoint {
  date: string;
  value: number;
  projected?: number;
  confidence?: number;
}

interface ComparisonData {
  name: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface CostBreakdownData {
  category: string;
  amount: number;
  percentage: number;
  trend: number;
}

interface MarketIntelligenceData {
  region: string;
  materialCosts: number;
  laborRates: number;
  demandIndex: number;
  seasonalFactor: number;
}

export const EnhancedDataVisualization: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('12m');
  const [selectedRegion, setSelectedRegion] = useState('BENTON');
  const [selectedProperty, setSelectedProperty] = useState('ALL');

  // Mock data states - in production, these would come from CostForge APIs
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const [regionalComparison, setRegionalComparison] = useState<ComparisonData[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownData[]>([]);
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligenceData[]>([]);

  // Generate mock time series data for demonstration
  const generateTimeSeriesData = (): TimeSeriesDataPoint[] => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months.map((month, index) => ({
      date: month,
      value: 150 + Math.sin(index * 0.5) * 20 + Math.random() * 15,
      projected: 150 + Math.sin(index * 0.5) * 20,
      confidence: 85 + Math.random() * 10,
    }));
  };

  // Generate mock regional comparison data
  const generateRegionalData = (): ComparisonData[] => {
    const regions = [
      { name: 'Richland', base: 165, variance: 15 },
      { name: 'Kennewick', base: 158, variance: 12 },
      { name: 'Pasco', base: 152, variance: 10 },
      { name: 'West Richland', base: 172, variance: 18 },
      { name: 'Benton City', base: 145, variance: 8 },
      { name: 'Prosser', base: 142, variance: 6 },
    ];

    return regions.map((region) => ({
      name: region.name,
      value: region.base + (Math.random() * region.variance - region.variance / 2),
      change: (Math.random() - 0.5) * 10,
      trend:
        Math.random() > 0.5
          ? ('up' as const)
          : Math.random() > 0.3
            ? ('stable' as const)
            : ('down' as const),
    }));
  };

  // Generate mock cost breakdown data
  const generateCostBreakdown = (): CostBreakdownData[] => {
    return [
      { category: 'Labor', amount: 85000, percentage: 42, trend: 3.2 },
      { category: 'Materials', amount: 65000, percentage: 32, trend: -1.5 },
      { category: 'Equipment', amount: 28000, percentage: 14, trend: 5.1 },
      { category: 'Permits', amount: 15000, percentage: 7, trend: 0.8 },
      { category: 'Overhead', amount: 10000, percentage: 5, trend: 2.1 },
    ];
  };

  // Generate mock market intelligence data
  const generateMarketIntelligence = (): MarketIntelligenceData[] => {
    const regions = ['Benton', 'Franklin', 'Walla Walla', 'Yakima', 'Clark', 'King'];
    return regions.map((region) => ({
      region,
      materialCosts: 95 + Math.random() * 20,
      laborRates: 85 + Math.random() * 30,
      demandIndex: 70 + Math.random() * 30,
      seasonalFactor: 0.8 + Math.random() * 0.4,
    }));
  };

  // Load data on component mount
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setTimeSeriesData(generateTimeSeriesData());
      setRegionalComparison(generateRegionalData());
      setCostBreakdown(generateCostBreakdown());
      setMarketIntelligence(generateMarketIntelligence());
      setIsLoading(false);
    }, 1500);
  }, [selectedRegion, selectedProperty, dateRange]);

  // Refresh data when filters change
  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setTimeSeriesData(generateTimeSeriesData());
      setRegionalComparison(generateRegionalData());
      setCostBreakdown(generateCostBreakdown());
      setMarketIntelligence(generateMarketIntelligence());
      setIsLoading(false);
    }, 800);
  };

  // Loading component
  const LoadingChart = () => (
    <div className='space-y-4 w-full h-80 flex flex-col justify-center'>
      <Skeleton className='h-8 w-3/4 bg-slate-600' />
      <Skeleton className='h-64 w-full bg-slate-600' />
      <div className='flex space-x-2'>
        <Skeleton className='h-4 w-20 bg-slate-600' />
        <Skeleton className='h-4 w-24 bg-slate-600' />
        <Skeleton className='h-4 w-16 bg-slate-600' />
      </div>
    </div>
  );

  // Error component
  const ErrorAlert = ({ message }: { message: string }) => (
    <Alert variant='destructive' className='my-4 bg-red-500/10 border-red-500/30'>
      <AlertCircle className='h-4 w-4' />
      <AlertTitle className='text-red-400'>Error</AlertTitle>
      <AlertDescription className='text-red-300'>{message}</AlertDescription>
    </Alert>
  );

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6'>
      {/* CostForge Analytics Header */}
      <div className='mb-8'>
        <div className='bg-white/10 backdrop-blur-lg border border-cyan-400/20 rounded-2xl p-6 relative overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full animate-pulse' />
          <div className='relative z-10'>
            <div className='flex items-center mb-4'>
              <BarChart3 className='text-cyan-400 mr-3 h-8 w-8' />
              <h1 className='text-4xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent'>
                COSTFORGE ANALYTICS
              </h1>
            </div>
            <p className='text-xl text-slate-300 mb-2'>
              Advanced Construction Cost Intelligence & Market Analytics
            </p>
            <p className='text-cyan-400 font-semibold'>
              Real-Time Data • Predictive Modeling • Government Compliance
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className='mb-6 bg-slate-800/50 backdrop-blur-lg border border-cyan-400/20 rounded-xl p-4'>
        <div className='flex flex-wrap gap-4 items-center justify-between'>
          <div className='flex gap-4 items-center'>
            <div>
              <label className='block text-sm font-medium mb-1 text-slate-300'>Region</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className='bg-slate-700 border-cyan-400/30 text-white w-48'>
                  <SelectValue placeholder='Select region' />
                </SelectTrigger>
                <SelectContent className='bg-slate-700 border-cyan-400/30'>
                  <SelectItem value='ALL' className='text-white'>
                    All Regions
                  </SelectItem>
                  <SelectItem value='BENTON' className='text-white'>
                    Benton County
                  </SelectItem>
                  <SelectItem value='FRANKLIN' className='text-white'>
                    Franklin County
                  </SelectItem>
                  <SelectItem value='WALLA_WALLA' className='text-white'>
                    Walla Walla County
                  </SelectItem>
                  <SelectItem value='YAKIMA' className='text-white'>
                    Yakima County
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='block text-sm font-medium mb-1 text-slate-300'>Property Type</label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className='bg-slate-700 border-green-400/30 text-white w-48'>
                  <SelectValue placeholder='Select property type' />
                </SelectTrigger>
                <SelectContent className='bg-slate-700 border-green-400/30'>
                  <SelectItem value='ALL' className='text-white'>
                    All Properties
                  </SelectItem>
                  <SelectItem value='RESIDENTIAL' className='text-white'>
                    Residential
                  </SelectItem>
                  <SelectItem value='COMMERCIAL' className='text-white'>
                    Commercial
                  </SelectItem>
                  <SelectItem value='INDUSTRIAL' className='text-white'>
                    Industrial
                  </SelectItem>
                  <SelectItem value='AGRICULTURAL' className='text-white'>
                    Agricultural
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='block text-sm font-medium mb-1 text-slate-300'>Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className='bg-slate-700 border-blue-400/30 text-white w-32'>
                  <SelectValue placeholder='Select range' />
                </SelectTrigger>
                <SelectContent className='bg-slate-700 border-blue-400/30'>
                  <SelectItem value='3m' className='text-white'>
                    3 Months
                  </SelectItem>
                  <SelectItem value='6m' className='text-white'>
                    6 Months
                  </SelectItem>
                  <SelectItem value='12m' className='text-white'>
                    1 Year
                  </SelectItem>
                  <SelectItem value='24m' className='text-white'>
                    2 Years
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={refreshData}
            disabled={isLoading}
            className='bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white'
          >
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-5 bg-slate-700/50 border border-cyan-400/30 mb-6'>
          <TabsTrigger
            value='overview'
            className='data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-300'
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value='trends'
            className='data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-300'
          >
            Trends
          </TabsTrigger>
          <TabsTrigger
            value='regional'
            className='data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-300'
          >
            Regional
          </TabsTrigger>
          <TabsTrigger
            value='breakdown'
            className='data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-300'
          >
            Breakdown
          </TabsTrigger>
          <TabsTrigger
            value='intelligence'
            className='data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-300'
          >
            Market Intel
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Key Metrics Cards */}
            <div className='grid grid-cols-2 gap-4'>
              <Card className='bg-slate-800/50 border-cyan-400/30'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm text-cyan-300'>Avg Cost/SqFt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-white'>$158</div>
                  <div className='flex items-center text-green-400 text-sm'>
                    <TrendingUp className='h-3 w-3 mr-1' />
                    +2.3% from last month
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-slate-800/50 border-green-400/30'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm text-green-300'>Active Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-white'>2,847</div>
                  <div className='flex items-center text-cyan-400 text-sm'>
                    <Activity className='h-3 w-3 mr-1' />
                    +156 this week
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-slate-800/50 border-blue-400/30'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm text-blue-300'>Market Demand</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-white'>High</div>
                  <div className='text-yellow-400 text-sm'>Construction season peak</div>
                </CardContent>
              </Card>

              <Card className='bg-slate-800/50 border-purple-400/30'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm text-purple-300'>AI Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold text-white'>94.2%</div>
                  <div className='text-green-400 text-sm'>Government standard</div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Trends Chart */}
            <Card className='bg-slate-800/50 border-cyan-400/30'>
              <CardHeader>
                <CardTitle className='text-cyan-300 flex items-center'>
                  <TrendingUp className='h-5 w-5 mr-2' />
                  Cost Trends Overview
                </CardTitle>
                <CardDescription className='text-slate-400'>
                  12-month cost per square foot trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingChart />
                ) : (
                  <div className='h-64'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <AreaChart data={timeSeriesData}>
                        <defs>
                          <linearGradient id='costGradient' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='5%' stopColor='var(--tf-transcend-highlight)' stopOpacity={0.8} />
                            <stop offset='95%' stopColor='var(--tf-transcend-highlight)' stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray='3 3' stroke='var(--gray-700)' />
                        <XAxis dataKey='date' stroke='var(--gray-400)' />
                        <YAxis stroke='var(--gray-400)' />
                        <Tooltip
                          formatter={(value, name) => [`$${Number(value).toFixed(0)}`, 'Cost/SqFt']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--tf-surface-dark-hs) 11% / 0.9)',
                            border: '1px solid hsl(var(--tf-transcend-cyan-hs) 50% / 0.3)',
                            borderRadius: '8px',
                            color: 'var(--tf-text-primary)',
                          }}
                        />
                        <Area
                          type='monotone'
                          dataKey='value'
                          stroke='var(--tf-transcend-highlight)'
                          fillOpacity={1}
                          fill='url(#costGradient)'
                          strokeWidth={2}
                        />
                        <Line
                          type='monotone'
                          dataKey='projected'
                          stroke='var(--tf-network-blue)'
                          strokeDasharray='5 5'
                          strokeWidth={1}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value='trends' className='space-y-6'>
          <Card className='bg-slate-800/50 border-cyan-400/30'>
            <CardHeader>
              <CardTitle className='text-cyan-300 flex items-center'>
                <TrendingUp className='h-5 w-5 mr-2' />
                Market Trends Analysis
              </CardTitle>
              <CardDescription className='text-slate-400'>
                Historical and projected cost trends with confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingChart />
              ) : (
                <div className='h-96'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray='3 3' stroke='var(--gray-700)' />
                      <XAxis dataKey='date' stroke='var(--gray-400)' />
                      <YAxis stroke='var(--gray-400)' />
                      <Tooltip
                        formatter={(value, name) => [
                          name === 'confidence'
                            ? `${Number(value).toFixed(1)}%`
                            : `$${Number(value).toFixed(0)}`,
                          name === 'value'
                            ? 'Actual Cost'
                            : name === 'projected'
                              ? 'Projected'
                              : 'Confidence',
                        ]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--tf-surface-dark-hs) 11% / 0.9)',
                          border: '1px solid hsl(var(--tf-transcend-cyan-hs) 50% / 0.3)',
                          borderRadius: '8px',
                          color: 'var(--tf-text-primary)',
                        }}
                      />
                      <Legend />
                      <Line
                        type='monotone'
                        dataKey='value'
                        name='Actual Cost'
                        stroke='var(--tf-transcend-highlight)'
                        strokeWidth={3}
                        activeDot={{ r: 6, fill: 'var(--tf-transcend-highlight)' }}
                      />
                      <Line
                        type='monotone'
                        dataKey='projected'
                        name='Projected'
                        stroke='var(--tf-network-blue)'
                        strokeWidth={2}
                        strokeDasharray='5 5'
                      />
                      <Line
                        type='monotone'
                        dataKey='confidence'
                        name='Confidence %'
                        stroke='var(--tf-accent-success)'
                        strokeWidth={1}
                        yAxisId='right'
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Tab */}
        <TabsContent value='regional' className='space-y-6'>
          <Card className='bg-slate-800/50 border-cyan-400/30'>
            <CardHeader>
              <CardTitle className='text-cyan-300 flex items-center'>
                <Database className='h-5 w-5 mr-2' />
                Regional Cost Comparison
              </CardTitle>
              <CardDescription className='text-slate-400'>
                Construction costs across Washington State regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingChart />
              ) : (
                <div className='h-80'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart
                      data={regionalComparison}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray='3 3' stroke='var(--gray-700)' />
                      <XAxis dataKey='name' stroke='var(--gray-400)' />
                      <YAxis stroke='var(--gray-400)' />
                      <Tooltip
                        formatter={(value, name) => [
                          `$${Number(value).toFixed(0)}/sqft`,
                          'Cost per SqFt',
                        ]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--tf-surface-dark-hs) 11% / 0.9)',
                          border: '1px solid hsl(var(--tf-transcend-cyan-hs) 50% / 0.3)',
                          borderRadius: '8px',
                          color: 'var(--tf-text-primary)',
                        }}
                      />
                      <Bar dataKey='value' radius={[4, 4, 0, 0]}>
                        {regionalComparison.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.trend === 'up'
                                ? 'var(--tf-accent-success)'
                                : entry.trend === 'down'
                                  ? 'var(--tf-accent-pink)'
                                  : 'var(--tf-transcend-highlight)'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Regional Details */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {regionalComparison.map((region, index) => (
              <Card key={region.name} className='bg-slate-800/50 border-cyan-400/30'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm text-cyan-300'>{region.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-xl font-bold text-white mb-1'>
                    ${Math.round(region.value)}/sqft
                  </div>
                  <div
                    className={`flex items-center text-sm ${
                      region.trend === 'up'
                        ? 'text-green-400'
                        : region.trend === 'down'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                    }`}
                  >
                    {region.trend === 'up' ? '↗' : region.trend === 'down' ? '↘' : '→'}
                    {region.change
                      ? ` ${region.change > 0 ? '+' : ''}${region.change.toFixed(1)}%`
                      : ' Stable'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value='breakdown' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Cost Breakdown Pie Chart */}
            <Card className='bg-slate-800/50 border-cyan-400/30'>
              <CardHeader>
                <CardTitle className='text-cyan-300 flex items-center'>
                  <PieIcon className='h-5 w-5 mr-2' />
                  Cost Component Breakdown
                </CardTitle>
                <CardDescription className='text-slate-400'>
                  Average distribution of construction costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingChart />
                ) : (
                  <div className='h-80'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <PieChart>
                        <Pie
                          data={costBreakdown}
                          cx='50%'
                          cy='50%'
                          labelLine={true}
                          label={({ category, percentage }) => `${category}: ${percentage}%`}
                          outerRadius={80}
                          fill='var(--tf-chart-1)'
                          dataKey='amount'
                        >
                          {costBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [
                            `$${Number(value).toLocaleString()}`,
                            'Amount',
                          ]}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--tf-surface-dark-hs) 11% / 0.9)',
                            border: '1px solid hsl(var(--tf-transcend-cyan-hs) 50% / 0.3)',
                            borderRadius: '8px',
                            color: 'var(--tf-text-primary)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Breakdown Table */}
            <Card className='bg-slate-800/50 border-cyan-400/30'>
              <CardHeader>
                <CardTitle className='text-cyan-300'>Detailed Breakdown</CardTitle>
                <CardDescription className='text-slate-400'>
                  Cost components with trend analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {costBreakdown.map((item, index) => (
                    <div
                      key={item.category}
                      className='flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/50'
                    >
                      <div className='flex items-center space-x-3'>
                        <div
                          className='w-4 h-4 rounded-full'
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <div>
                          <div className='text-white font-medium'>{item.category}</div>
                          <div className='text-slate-400 text-sm'>{item.percentage}% of total</div>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='text-white font-medium'>
                          ${item.amount.toLocaleString()}
                        </div>
                        <div
                          className={`text-sm ${item.trend > 0 ? 'text-green-400' : item.trend < 0 ? 'text-red-400' : 'text-yellow-400'}`}
                        >
                          {item.trend > 0 ? '+' : ''}
                          {item.trend.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Market Intelligence Tab */}
        <TabsContent value='intelligence' className='space-y-6'>
          <Card className='bg-slate-800/50 border-cyan-400/30'>
            <CardHeader>
              <CardTitle className='text-cyan-300 flex items-center'>
                <Activity className='h-5 w-5 mr-2' />
                Market Intelligence Dashboard
              </CardTitle>
              <CardDescription className='text-slate-400'>
                Real-time market conditions and forecasting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                {marketIntelligence.slice(0, 4).map((market) => (
                  <div
                    key={market.region}
                    className='bg-slate-700/30 p-4 rounded-lg border border-cyan-400/20'
                  >
                    <h4 className='text-cyan-300 font-medium mb-3'>{market.region} County</h4>
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-slate-400'>Material Costs:</span>
                        <span className='text-white'>{market.materialCosts.toFixed(0)}%</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-slate-400'>Labor Rates:</span>
                        <span className='text-white'>{market.laborRates.toFixed(0)}%</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-slate-400'>Demand Index:</span>
                        <span className='text-white'>{market.demandIndex.toFixed(0)}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-slate-400'>Seasonal Factor:</span>
                        <span className='text-white'>{market.seasonalFactor.toFixed(2)}x</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Market Trends Chart */}
              {isLoading ? (
                <LoadingChart />
              ) : (
                <div className='h-80'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={marketIntelligence.slice(0, 6)}>
                      <CartesianGrid strokeDasharray='3 3' stroke='var(--gray-700)' />
                      <XAxis dataKey='region' stroke='var(--gray-400)' />
                      <YAxis stroke='var(--gray-400)' />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--tf-surface-dark-hs) 11% / 0.9)',
                          border: '1px solid hsl(var(--tf-transcend-cyan-hs) 50% / 0.3)',
                          borderRadius: '8px',
                          color: 'var(--tf-text-primary)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey='materialCosts' name='Material Costs %' fill='var(--tf-transcend-highlight)' />
                      <Bar dataKey='laborRates' name='Labor Rates %' fill='var(--tf-network-blue)' />
                      <Bar dataKey='demandIndex' name='Demand Index' fill='var(--tf-accent-success)' />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedDataVisualization;
