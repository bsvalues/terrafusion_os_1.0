import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Refresh,
  CalendarDays,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Loader2,
  AlertCircle,
 } from '@mui/icons-material';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, subDays } from 'date-fns';

// Type definitions
interface MetricsData {
  workflows: {
    byStatus: { name: string; value: number; color: string }[];
    byType: { name: string; value: number }[];
    trend: { date: string; active: number; completed: number }[];
  };
  documents: {
    byType: { name: string; value: number; color: string }[];
    trend: { date: string; count: number }[];
  };
  parcels: {
    byZoning: { name: string; value: number; color: string }[];
    byActivity: { date: string; created: number; modified: number }[];
  };
}

// Sample colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#48C9B0'];
const STATUS_COLORS = {
  active: '#22c55e',
  pending: '#f59e0b',
  completed: '#3b82f6',
  rejected: '#ef4444'
};

export function EnhancedMetricsPanel() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  
  // Fetch metrics data
  const { data, isLoading, isError, refetch } = useQuery<MetricsData>({
    queryKey: ['/api/metrics', timeRange],
    queryFn: async () => {
      try {
        // In a production app, this would fetch from the API
        // For now, we'll simulate data
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Generate mock data based on time range
        const getDaysInRange = () => {
          switch(timeRange) {
            case '7d': return 7;
            case '30d': return 30;
            case '90d': return 90;
            case '1y': return 365;
            default: return 30;
          }
        };
        
        // Generate trend data based on time range
        const generateTrendData = (days: number) => {
          return Array.from({ length: Math.min(days, 12) }, (_, i) => {
            const datePoint = subDays(new Date(), days - i * Math.max(1, Math.floor(days / 12)));
            return {
              date: format(datePoint, 'MMM d'),
              active: Math.floor(Math.random() * 15) + 5,
              completed: Math.floor(Math.random() * 12) + 3
            };
          });
        };
        
        // Simulated metrics data
        const simulatedData: MetricsData = {
          workflows: {
            byStatus: [
              { name: 'Active', value: 24, color: STATUS_COLORS.active },
              { name: 'Pending', value: 18, color: STATUS_COLORS.pending },
              { name: 'Completed', value: 42, color: STATUS_COLORS.completed },
              { name: 'Rejected', value: 8, color: STATUS_COLORS.rejected }
            ],
            byType: [
              { name: 'Boundary Line Adjustment', value: 32 },
              { name: 'Long Plat', value: 24 },
              { name: 'Short Plat', value: 18 },
              { name: 'Lot Line Revision', value: 12 },
              { name: 'Tax Segregation', value: 6 }
            ],
            trend: generateTrendData(getDaysInRange())
          },
          documents: {
            byType: [
              { name: 'Plat Map', value: 45, color: COLORS[0] },
              { name: 'Deed', value: 37, color: COLORS[1] },
              { name: 'Survey', value: 28, color: COLORS[2] },
              { name: 'Legal Description', value: 22, color: COLORS[3] },
              { name: 'BLA', value: 15, color: COLORS[4] },
              { name: 'Tax Form', value: 12, color: COLORS[5] },
              { name: 'Other', value: 8, color: COLORS[6] }
            ],
            trend: generateTrendData(getDaysInRange()).map(item => ({
              date: item.date,
              count: item.active + item.completed
            }))
          },
          parcels: {
            byZoning: [
              { name: 'Residential', value: 58, color: COLORS[0] },
              { name: 'Commercial', value: 22, color: COLORS[1] },
              { name: 'Agricultural', value: 12, color: COLORS[2] },
              { name: 'Industrial', value: 8, color: COLORS[3] }
            ],
            byActivity: generateTrendData(getDaysInRange()).map(item => ({
              date: item.date,
              created: Math.floor(item.active * 0.7),
              modified: item.completed + Math.floor(item.active * 0.3)
            }))
          }
        };
        
        return simulatedData;
      } catch (error) {
        console.error('Error fetching metrics:', error);
        throw new Error('Failed to fetch metrics data');
      }
    },
    refetchOnWindowFocus: false
  });
  
  // Format number for display
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className="col-span-12">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading Metrics...</span>
          </CardTitle>
          <CardDescription>Preparing your dashboard analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-4 pb-2"><>

                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent
</> className="p-4 pt-2">
                  <Skeleton className="h-[180px] w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (isError) {
    return (
      <Card className="col-span-12">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Error Loading Metrics</span>
          </CardTitle>
          <CardDescription>There was a problem fetching your dashboard analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => refetch()}>
            <Refresh className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // If data is undefined, return error
  if (!data) {
    return (
      <Card className="col-span-12">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>No Data Available</span>
          </CardTitle>
          <CardDescription>No metrics data could be retrieved</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => refetch()}>
            <Refresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="col-span-12">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div><>

            <CardTitle className="text-xl">Dashboard Analytics</CardTitle>
            <CardDescription
</>>Key metrics and insights for your workflows and documents</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as any)}
            >
              <SelectTrigger className="w-28">
                <CalendarDays className="mr-2 h-4 w-4" /><>

                <SelectValue />
              </SelectTrigger>
              <SelectContent
</>><>

                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem
</> value="30d">30 days</SelectItem><>

                <SelectItem value="90d">90 days</SelectItem>
                <SelectItem
</> value="1y">1 year</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex rounded-md border">
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none h-9 px-2.5"
                onClick={() => setChartType('bar')}
              ><>

                <BarChart2 className="h-4 w-4" />
              </Button>
              <Button
</>
                variant={chartType === 'pie' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none border-x h-9 px-2.5"
                onClick={() => setChartType('pie')}
              ><>

                <PieChartIcon className="h-4 w-4" />
              </Button>
              <Button
</>
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none h-9 px-2.5"
                onClick={() => setChartType('line')}
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => refetch()}
            >
              <Refresh className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="workflows" className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mb-6"><>

            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger
</> value="documents">Documents</TabsTrigger>
            <TabsTrigger value="parcels">Parcels</TabsTrigger>
          </TabsList>
          
          <TabsContent value="workflows" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Workflow Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartType === 'bar' && (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.workflows.byStatus}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value">
                          {data.workflows.byStatus.map((entry /* , index */) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {chartType === 'pie' && (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={data.workflows.byStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {data.workflows.byStatus.map((entry /* , index */) => (<>

                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
</> />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {chartType === 'line' && (
                    <div className="flex items-center justify-center h-[220px]">
                      <div className="text-center text-muted-foreground">
                        <BarChart2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Line chart not available for this data</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Workflow Types</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartType === 'bar' && (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.workflows.byType}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tickFormatter={(value) => value.split(' ')[0]} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8">
                          {data.workflows.byType.map((entry /* , index */) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {chartType === 'pie' && (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={data.workflows.byType}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          label={({name, percent}) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                        >
                          {data.workflows.byType.map((entry /* , index */) => (<>

                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
</> />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {chartType === 'line' && (
                    <div className="flex items-center justify-center h-[220px]">
                      <div className="text-center text-muted-foreground">
                        <BarChart2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Line chart not available for this data</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Workflow Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {(chartType === 'bar' || chartType === 'line') && (
                    <ResponsiveContainer width="100%" height={220}>
                      {chartType === 'bar' ? (
                        <BarChart data={data.workflows.trend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="active" fill={STATUS_COLORS.active} name="Active" />
                          <Bar dataKey="completed" fill={STATUS_COLORS.completed} name="Completed" />
                        </BarChart>
                      ) : (
                        <LineChart data={data.workflows.trend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="active" stroke={STATUS_COLORS.active} name="Active" />
                          <Line type="monotone" dataKey="completed" stroke={STATUS_COLORS.completed} name="Completed" />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  )}
                  {chartType === 'pie' && (
                    <div className="flex items-center justify-center h-[220px]">
                      <div className="text-center text-muted-foreground">
                        <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Pie chart not available for trend data</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="documents" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Document Types</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartType === 'bar' && (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.documents.byType}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8">
                          {data.documents.byType.map((entry /* , index */) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {chartType === 'pie' && (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={data.documents.byType}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {data.documents.byType.map((entry /* , index */) => (<>

                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
</> />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {chartType === 'line' && (
                    <div className="flex items-center justify-center h-[220px]">
                      <div className="text-center text-muted-foreground">
                        <BarChart2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Line chart not available for this data</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Document Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {(chartType === 'bar' || chartType === 'line') && (
                    <ResponsiveContainer width="100%" height={220}>
                      {chartType === 'bar' ? (
                        <BarChart data={data.documents.trend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill={STATUS_COLORS.active} name="Documents" />
                        </BarChart>
                      ) : (
                        <LineChart data={data.documents.trend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke={STATUS_COLORS.active} name="Documents" />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  )}
                  {chartType === 'pie' && (
                    <div className="flex items-center justify-center h-[220px]">
                      <div className="text-center text-muted-foreground">
                        <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Pie chart not available for trend data</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="parcels" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Parcels by Zoning</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartType === 'bar' && (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={data.parcels.byZoning}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8">
                          {data.parcels.byZoning.map((entry /* , index */) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  {chartType === 'pie' && (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={data.parcels.byZoning}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {data.parcels.byZoning.map((entry /* , index */) => (<>

                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
</> />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {chartType === 'line' && (
                    <div className="flex items-center justify-center h-[220px]">
                      <div className="text-center text-muted-foreground">
                        <BarChart2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Line chart not available for this data</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Parcel Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {(chartType === 'bar' || chartType === 'line') && (
                    <ResponsiveContainer width="100%" height={220}>
                      {chartType === 'bar' ? (
                        <BarChart data={data.parcels.byActivity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="created" fill={COLORS[0]} name="Created" />
                          <Bar dataKey="modified" fill={COLORS[1]} name="Modified" />
                        </BarChart>
                      ) : (
                        <LineChart data={data.parcels.byActivity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="created" stroke={COLORS[0]} name="Created" />
                          <Line type="monotone" dataKey="modified" stroke={COLORS[1]} name="Modified" />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  )}
                  {chartType === 'pie' && (
                    <div className="flex items-center justify-center h-[220px]">
                      <div className="text-center text-muted-foreground">
                        <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Pie chart not available for trend data</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}