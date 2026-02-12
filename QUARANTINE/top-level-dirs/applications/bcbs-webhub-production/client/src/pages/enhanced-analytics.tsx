import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { TrendingUp, TrendingDown, Download, Refresh, Calendar,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Users, Clock, CheckCircle, AlertCircle, FileText
 } from '@mui/icons-material';

interface TimeSeriesData {
  date: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  inProgress: number;
  needsInfo: number;
}

interface PerformanceMetrics {
  totalAudits: number;
  completedAudits: number;
  completionRate: number;
  approvalRate: number;
  avgProcessingTime: string;
  throughput: number;
  qualityScore: number;
}

interface TrendData {
  trend: "increasing" | "decreasing" | "stable";
  change: string;
  forecast: number[];
}

interface RealTimeData {
  currentStats: {
    totalAudits: number;
    todayAudits: number;
    yesterdayAudits: number;
    pendingAudits: number;
    inProgressAudits: number;
    completedToday: number;
  };
  recentActivity: Array<{
    id: number;
    type: string;
    auditId: number;
    timestamp: string;
    comment?: string;
  }>;
  trends: {
    todayVsYesterday: {
      audits: string;
      completions: string;
    };
  };
  activeUsers: number;
}

export default function EnhancedAnalytics() {
  const [period, setPeriod] = useState("30d");
  const [granularity, setGranularity] = useState("day");
  const [selectedMetric, setSelectedMetric] = useState("volume");
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch historical analytics data
  const { data: historicalData, isLoading: isLoadingHistorical } = useQuery<{
    data: TimeSeriesData[];
    period: string;
    granularity: string;
  }>({
    queryKey: ["/api/analytics/historical", period, granularity],
    queryFn: async ({ queryKey }) => {
      const [, , periodParam, granularityParam] = queryKey;
      const response = await fetch(`/api/analytics/historical?period=${periodParam}&granularity=${granularityParam}`);
      if (!response.ok) throw new Error('Failed to fetch historical data');
      return response.json();
    },
  });

  // Fetch performance metrics
  const { data: performanceData, isLoading: isLoadingPerformance } = useQuery<{
    metrics: PerformanceMetrics;
  }>({
    queryKey: ["/api/analytics/performance", period],
    queryFn: async ({ queryKey }) => {
      const [, periodParam] = queryKey;
      const response = await fetch(`/api/analytics/performance?period=${periodParam}`);
      if (!response.ok) throw new Error('Failed to fetch performance data');
      return response.json();
    },
  });

  // Fetch trend data
  const { data: trendData, isLoading: isLoadingTrends } = useQuery<{
    trends: TrendData;
  }>({
    queryKey: ["/api/analytics/trends", selectedMetric, period],
    queryFn: async ({ queryKey }) => {
      const [, metricParam, periodParam] = queryKey;
      const response = await fetch(`/api/analytics/trends?metric=${metricParam}&period=${periodParam}`);
      if (!response.ok) throw new Error('Failed to fetch trend data');
      return response.json();
    },
  });

  // Fetch real-time data
  const { data: realTimeData, isLoading: isLoadingRealTime } = useQuery<RealTimeData>({
    queryKey: ["/api/analytics/realtime"],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(queryKey[0] as string);
      if (!response.ok) throw new Error('Failed to fetch real-time data');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Generate report function
  const generateReport = async (type: "pdf" | "excel" | "csv" | "json") => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (period === "7d" ? 7 : period === "90d" ? 90 : 30));

      const response = await fetch("/api/analytics/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          sections: ["summary", "charts", "tables", "performance"],
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');
      
      const result = await response.json();
      
      if (type === "json") {
        // For JSON, download directly
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For other formats, show success message
        alert(`${type.toUpperCase()} report generation initiated. Report ID: ${result.reportId}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
  };

  const chartColors = {
    pending: "#3b82f6",
    approved: "#10b981",
    rejected: "#ef4444",
    inProgress: "#f59e0b",
    needsInfo: "#8b5cf6",
    total: "#6b7280"
  };

  const getTrendIcon = (trend: string, change: string) => {
    const changeNum = parseFloat(change);
    if (trend === "increasing" || changeNum > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (trend === "decreasing" || changeNum < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <div className="h-4 w-4" />;
  };

  return (
      <Header title="Enhanced Analytics" />
      
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 pb-4 px-4 md:px-6">
        <div className="my-6">
          {/* Header Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div><>

              <h2 className="text-2xl font-bold mb-2">Advanced Analytics Dashboard</h2>
              <p
</>

className="text-gray-600">Comprehensive audit performance metrics and insights</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32"><>

                  <SelectValue />
                </SelectTrigger>
                <SelectContent
</>

</>><>

                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem
</>

value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={granularity} onValueChange={setGranularity}>
                <SelectTrigger className="w-32"><>

                  <SelectValue />
                </SelectTrigger>
                <SelectContent
</>

</>><>

                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem
</>

value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm">
                <Refresh className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Real-time Stats Bar */}
          {realTimeData && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center"><>

                    <div className="text-2xl font-bold text-blue-600">
                      {realTimeData.currentStats.totalAudits}
                    </div>
                    <div
</>

className="text-sm text-gray-600">Total Audits</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center"><>

                    <div className="text-2xl font-bold text-green-600">
                      {realTimeData.currentStats.todayAudits}
                    </div>
                    <div
</>

className="text-sm text-gray-600">Today</div>
                    <div className="text-xs text-gray-500">
                      {realTimeData.trends.todayVsYesterday.audits}% vs yesterday
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center"><>

                    <div className="text-2xl font-bold text-yellow-600">
                      {realTimeData.currentStats.pendingAudits}
                    </div>
                    <div
</>

className="text-sm text-gray-600">Pending</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center"><>

                    <div className="text-2xl font-bold text-purple-600">
                      {realTimeData.currentStats.inProgressAudits}
                    </div>
                    <div
</>

className="text-sm text-gray-600">In Progress</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center"><>

                    <div className="text-2xl font-bold text-green-600">
                      {realTimeData.currentStats.completedToday}
                    </div>
                    <div
</>

className="text-sm text-gray-600">Completed Today</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center"><>

                    <div className="text-2xl font-bold text-indigo-600">
                      {realTimeData.activeUsers}
                    </div>
                    <div
</>

className="text-sm text-gray-600">Active Users</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Analytics Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4"><>

              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger
</>

value="performance">Performance</TabsTrigger><>

              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger
</>

value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Time Series Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5" />
                    Audit Volume Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingHistorical ? (
                    <div className="h-80 flex items-center justify-center">
                      <div className="text-gray-500">Loading chart data...</div>
                    </div>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={historicalData?.data || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="total" 
                            stackId="1"
                            stroke={chartColors.total}
                            fill={chartColors.total}
                            fillOpacity={0.3}
                            name="Total"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="approved" 
                            stackId="2"
                            stroke={chartColors.approved}
                            fill={chartColors.approved}
                            fillOpacity={0.8}
                            name="Approved"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="rejected" 
                            stackId="2"
                            stroke={chartColors.rejected}
                            fill={chartColors.rejected}
                            fillOpacity={0.8}
                            name="Rejected"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="pending" 
                            stackId="2"
                            stroke={chartColors.pending}
                            fill={chartColors.pending}
                            fillOpacity={0.8}
                            name="Pending"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5" />
                      Current Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHistorical ? (
                      <div className="h-64 flex items-center justify-center">
                        <div className="text-gray-500">Loading...</div>
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={historicalData?.data.slice(-1)[0] ? [
                                { name: 'Pending', value: historicalData.data.slice(-1)[0].pending, color: chartColors.pending },
                                { name: 'Approved', value: historicalData.data.slice(-1)[0].approved, color: chartColors.approved },
                                { name: 'Rejected', value: historicalData.data.slice(-1)[0].rejected, color: chartColors.rejected },
                                { name: 'In Progress', value: historicalData.data.slice(-1)[0].inProgress, color: chartColors.inProgress },
                                { name: 'Needs Info', value: historicalData.data.slice(-1)[0].needsInfo, color: chartColors.needsInfo },
                              ] : []}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {historicalData?.data.slice(-1)[0] && [
                                { name: 'Pending', value: historicalData.data.slice(-1)[0].pending, color: chartColors.pending },
                                { name: 'Approved', value: historicalData.data.slice(-1)[0].approved, color: chartColors.approved },
                                { name: 'Rejected', value: historicalData.data.slice(-1)[0].rejected, color: chartColors.rejected },
                                { name: 'In Progress', value: historicalData.data.slice(-1)[0].inProgress, color: chartColors.inProgress },
                                { name: 'Needs Info', value: historicalData.data.slice(-1)[0].needsInfo, color: chartColors.needsInfo },
                              ].map((entry /* , index */) => (<>

                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
</>

/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {realTimeData?.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-2 border rounded"><>

                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                          <div
</>

className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {activity.type.replace('_', ' ')} - Audit #{activity.auditId}
                            </p>
                            {activity.comment && (
                              <p className="text-xs text-gray-600 truncate">{activity.comment}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              {performanceData && (
                  {/* Performance Metrics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div><>

                            <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                            <p
</>

className="text-2xl font-bold">{performanceData.metrics.completionRate.toFixed(1)}%</p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div><>

                            <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                            <p
</>

className="text-2xl font-bold">{performanceData.metrics.approvalRate.toFixed(1)}%</p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div><>

                            <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                            <p
</>

className="text-2xl font-bold">{performanceData.metrics.avgProcessingTime}h</p>
                          </div>
                          <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div><>

                            <p className="text-sm font-medium text-gray-600">Quality Score</p>
                            <p
</>

className="text-2xl font-bold">{performanceData.metrics.qualityScore.toFixed(1)}</p>
                          </div>
                          <AlertCircle className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Performance Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { metric: 'Completion Rate', value: performanceData.metrics.completionRate },
                            { metric: 'Approval Rate', value: performanceData.metrics.approvalRate },
                            { metric: 'Quality Score', value: performanceData.metrics.qualityScore },
                            { metric: 'Throughput', value: performanceData.metrics.throughput * 10 }, // Scale for visibility
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="metric" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
              )}
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <div className="flex gap-4 mb-4">
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-48"><>

                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
</>

</>><>

                    <SelectItem value="volume">Audit Volume</SelectItem>
                    <SelectItem
</>

value="completion">Completion Rate</SelectItem>
                    <SelectItem value="approval">Approval Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {trendData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Trend Analysis - {selectedMetric}
                      <Badge variant={trendData.trends.trend === 'increasing' ? 'default' : 
                                   trendData.trends.trend === 'decreasing' ? 'destructive' : 'secondary'}>
                        {getTrendIcon(trendData.trends.trend, trendData.trends.change)}
                        {trendData.trends.change}% change
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600">
                        Trend: <span className="font-medium capitalize">{trendData.trends.trend}</span>
                      </div>
                      
                      {trendData.trends.forecast.length > 0 && (
                        <div><>

                          <h4 className="font-medium mb-2">7-Day Forecast</h4>
                          <div
</>

className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={trendData.trends.forecast.map((value /* , index */) => ({
                                day: `Day ${index + 1}`,
                                forecast: value
                              }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeDasharray="5 5" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Generate Analytics Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4"><>

                    <p className="text-gray-600">
                      Export comprehensive analytics reports in various formats for sharing and archival purposes.
                    </p>
                    
                    <div
</>

className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button 
                        onClick={() => generateReport("json")}
                        className="flex flex-col items-center gap-2 h-20"
                      ><>

                        <Download className="h-5 w-5" />
                        JSON Report
                      </Button>
                      
                      <Button
</>

                        onClick={() => generateReport("csv")}
                        variant="outline"
                        className="flex flex-col items-center gap-2 h-20"
                      ><>

                        <Download className="h-5 w-5" />
                        CSV Export
                      </Button>
                      
                      <Button
</>

                        onClick={() => generateReport("excel")}
                        variant="outline"
                        className="flex flex-col items-center gap-2 h-20"
                      ><>

                        <Download className="h-5 w-5" />
                        Excel Report
                      </Button>
                      
                      <Button
</>

                        onClick={() => generateReport("pdf")}
                        variant="outline"
                        className="flex flex-col items-center gap-2 h-20"
                      >
                        <Download className="h-5 w-5" />
                        PDF Report
                      </Button>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg"><>

                      <h4 className="font-medium mb-2">Report Contents</h4>
                      <ul
</>

className="text-sm text-gray-600 space-y-1"><>

                        <li>• Executive summary with key metrics</li>
                            <li
</>

</>>• Time-series charts and trend analysis</li><>

                        <li>• Performance metrics breakdown</li>
                            <li
</>

</>>• Status distribution and activity logs</li><>

                        <li>• User productivity analytics</li>
                            <li
</>

</>>• Quality scores and recommendations</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
  );
}