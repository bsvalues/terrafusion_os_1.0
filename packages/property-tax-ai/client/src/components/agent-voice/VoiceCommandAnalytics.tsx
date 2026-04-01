/**
 * Voice Command Analytics
 * 
 * This component displays analytics and usage statistics for voice commands.
 * It provides charts and metrics to help users understand their voice command usage.
 */

import { useState, useEffect } from 'react';
import { 
  getVoiceCommandAnalytics, 
  type VoiceCommandAnalyticsDetails,
  type CommandTypeDistribution,
  type DailyVoiceCommandStats,
  type CommonError,
  type MostUsedCommand
} from '@/services/enhanced-voice-command-service';
import { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  RefreshCw, 
  BarChart3, 
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon, 
  List, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Command, 
  Download, 
  Loader2, 
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subMonths } from 'date-fns';

interface VoiceCommandAnalyticsProps {
  userId: number;
  className?: string;
}

// Chart colors
const CHART_COLORS = [
  '#4f46e5', '#06b6d4', '#10b981', '#8b5cf6', '#f97316', 
  '#ec4899', '#0891b2', '#6366f1', '#84cc16', '#14b8a6'
];

// Error colors
const ERROR_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#d97706', '#b45309'];

export function VoiceCommandAnalytics({
  userId,
  className = ''
}: VoiceCommandAnalyticsProps) {
  // State
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [analytics, setAnalytics] = useState<VoiceCommandAnalyticsDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 1),
    to: new Date()
  });
  
  const { toast } = useToast();
  
  // Load analytics data when component mounts or date range changes
  useEffect(() => {
    loadAnalytics();
  }, [userId, dateRange]);
  
  // Load analytics data
  const loadAnalytics = async () => {
    setIsLoading(true);
    
    try {
      const data = await getVoiceCommandAnalytics(userId, dateRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format a percentage
  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };
  
  // Format a date string
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d');
  };
  
  // Format a time in milliseconds to human-readable format
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };
  
  // Export data as CSV
  const exportData = () => {
    if (!analytics) return;
    
    const summary = analytics.summary;
    const dailyStats = analytics.dailyStats;
    const distribution = analytics.commandTypeDistribution;
    const errors = analytics.commonErrors;
    
    // Create CSV content
    let csv = 'data:text/csv;charset=utf-8,';
    
    // Summary
    csv += 'SUMMARY\n';
    csv += 'Total Commands,Success Count,Error Count,Success Rate,Average Response Time\n';
    csv += `${summary.totalCommands},${summary.successCount},${summary.errorCount},${formatPercentage(summary.successRate)},${formatTime(summary.averageResponseTime)}\n\n`;
    
    // Daily Stats
    csv += 'DAILY STATS\n';
    csv += 'Date,Command Count,Success Count,Error Count,Success Rate\n';
    dailyStats.forEach(day => {
      csv += `${day.date},${day.commandCount},${day.successCount},${day.errorCount},${formatPercentage(day.successRate)}\n`;
    });
    csv += '\n';
    
    // Command Type Distribution
    csv += 'COMMAND TYPE DISTRIBUTION\n';
    csv += 'Command Type,Count,Percentage\n';
    distribution.forEach(type => {
      csv += `${type.commandType},${type.count},${formatPercentage(type.percentage)}\n`;
    });
    csv += '\n';
    
    // Common Errors
    csv += 'COMMON ERRORS\n';
    csv += 'Error,Count,Percentage\n';
    errors.forEach(error => {
      csv += `"${error.error}",${error.count},${formatPercentage(error.percentage)}\n`;
    });
    csv += '\n';
    
    // Most Used Commands
    csv += 'MOST USED COMMANDS\n';
    csv += 'Command,Count,Success Rate\n';
    summary.mostUsedCommands.forEach(cmd => {
      csv += `"${cmd.commandText}",${cmd.count},${formatPercentage(cmd.successRate)}\n`;
    });
    
    // Encode and download
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `voice-command-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Render loading state
  const renderLoading = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
  
  // Render empty state
  const renderEmpty = () => (
    <div className="text-center py-12 text-muted-foreground">
      <Command className="h-12 w-12 mx-auto mb-4 opacity-20" />
      <p className="text-lg font-medium">No Voice Command Data</p>
      <p className="mt-1">Start using voice commands to see analytics here.</p>
    </div>
  );
  
  // Render summary cards
  const renderSummaryCards = () => {
    if (!analytics) return null;
    
    const { summary } = analytics;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Commands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCommands}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 inline mr-1" />
              Avg. response time: {formatTime(summary.averageResponseTime)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatPercentage(summary.successRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" />
              {summary.successCount} successful commands
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatPercentage(1 - summary.successRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <XCircle className="h-3 w-3 inline mr-1 text-red-500" />
              {summary.errorCount} failed commands
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Render command type distribution chart
  const renderCommandTypeChart = () => {
    if (!analytics || analytics.commandTypeDistribution.length === 0) return renderEmpty();
    
    const { commandTypeDistribution } = analytics;
    
    return (
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={commandTypeDistribution}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={120}
              fill="#8884d8"
              dataKey="count"
              nameKey="commandType"
              label={({ commandType, percentage }) => `${commandType} (${formatPercentage(percentage)})`}
            >
              {commandTypeDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [`${value} commands`, name]} 
              labelFormatter={(value) => `Command Type`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  // Render daily stats chart
  const renderDailyStatsChart = () => {
    if (!analytics || analytics.dailyStats.length === 0) return renderEmpty();
    
    const { dailyStats } = analytics;
    
    return (
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dailyStats}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatDate} />
            <YAxis />
            <Tooltip labelFormatter={(value) => `Date: ${formatDate(value as string)}`} />
            <Legend />
            <Line type="monotone" dataKey="commandCount" name="Total Commands" stroke="#4f46e5" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="successCount" name="Successful Commands" stroke="#10b981" />
            <Line type="monotone" dataKey="errorCount" name="Failed Commands" stroke="#ef4444" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  // Render common errors chart
  const renderErrorsChart = () => {
    if (!analytics || analytics.commonErrors.length === 0) return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
        <p className="text-lg font-medium">No Common Errors</p>
        <p className="mt-1">Great job! No common errors were detected.</p>
      </div>
    );
    
    const { commonErrors } = analytics;
    
    return (
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={commonErrors}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="error" 
              tick={{ width: 200 }}
              tickFormatter={(value) => value.length > 30 ? `${value.substring(0, 30)}...` : value}
            />
            <Tooltip 
              formatter={(value, name, props) => [`${value} occurrences`, 'Count']} 
              labelFormatter={(value) => `Error: ${value}`}
            />
            <Legend />
            <Bar dataKey="count" name="Error Count" fill="#ef4444">
              {commonErrors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={ERROR_COLORS[index % ERROR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  // Render most used commands table
  const renderCommandsTable = () => {
    if (!analytics || analytics.summary.mostUsedCommands.length === 0) return renderEmpty();
    
    const { mostUsedCommands } = analytics.summary;
    
    return (
      <Table>
        <TableCaption>Top used voice commands</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead>Command</TableHead>
            <TableHead className="text-right">Count</TableHead>
            <TableHead className="text-right">Success Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mostUsedCommands.map((command, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{i + 1}</TableCell>
              <TableCell className="max-w-[300px] truncate" title={command.commandText}>
                {command.commandText}
              </TableCell>
              <TableCell className="text-right">{command.count}</TableCell>
              <TableCell className={`text-right ${command.successRate >= 0.9 ? 'text-green-500' : command.successRate < 0.7 ? 'text-red-500' : 'text-yellow-500'}`}>
                {formatPercentage(command.successRate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  // Main render
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Voice Command Analytics</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalytics}
              disabled={isLoading}
              aria-label="Refresh analytics"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              disabled={isLoading || !analytics}
              aria-label="Export data"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <CardDescription>
          Analytics and usage statistics for voice commands
        </CardDescription>
        
        <div className="mt-2">
          <DatePickerWithRange
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          renderLoading()
        ) : !analytics || analytics.summary.totalCommands === 0 ? (
          renderEmpty()
        ) : (
          <>
            {renderSummaryCards()}
            
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="overview">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="types">
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Command Types
                </TabsTrigger>
                <TabsTrigger value="trends">
                  <LineChartIcon className="h-4 w-4 mr-2" />
                  Daily Trends
                </TabsTrigger>
                <TabsTrigger value="errors">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Errors
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Most Used Commands</CardTitle>
                    <CardDescription>
                      The most frequently used voice commands
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[350px]">
                      {renderCommandsTable()}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="types">
                <Card>
                  <CardHeader>
                    <CardTitle>Command Type Distribution</CardTitle>
                    <CardDescription>
                      Breakdown of command usage by type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderCommandTypeChart()}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="trends">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Usage Trends</CardTitle>
                    <CardDescription>
                      Command usage over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderDailyStatsChart()}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="errors">
                <Card>
                  <CardHeader>
                    <CardTitle>Common Errors</CardTitle>
                    <CardDescription>
                      Most frequent error messages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderErrorsChart()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}