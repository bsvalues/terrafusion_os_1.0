import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BarChart3, 
  PieChart, 
  LineChart, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Filter, 
  Download, 
  Calendar,
  List,
  BarChart,
  SlidersHorizontal
 } from '@mui/icons-material';
import { Permit, Upload } from '@/types';
import { getPermitsByUploadId } from '@/lib/api';

// Import our visualization components
import PermitStatusChart from './PermitStatusChart.tsx';
import PermitTypeDistribution from './PermitTypeDistribution.tsx';
import PermitValueChart from './PermitValueChart.tsx';
import ReportTable from './ReportTable.tsx';
import TimeAnalysisChart from './TimeAnalysisChart.tsx';
import PermitFilterPanel from './PermitFilterPanel.tsx';

interface ReportingDashboardProps {
  uploadId?: number;
  // If null, we'll show data across all uploads
}

export function ReportingDashboard({ uploadId }: ReportingDashboardProps) {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [filteredPermits, setFilteredPermits] = useState<Permit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeFrame, setTimeFrame] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    async function loadData() {
      if (!uploadId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const result = await getPermitsByUploadId(uploadId);
        setPermits(result.permits);
        setFilteredPermits(result.permits);
        setError(null);
      } catch (err) {
        console.error('Error loading permit data for reporting:', err);
        setError('Failed to load permit data');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [uploadId]);
  
  // Apply time frame filter and get time-filtered permits for advanced filtering
  const [timeFilteredPermits, setTimeFilteredPermits] = useState<Permit[]>([]);
  
  useEffect(() => {
    if (permits.length === 0) return;
    
    let filtered = permits;
    
    if (timeFrame !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (timeFrame) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = permits.filter(permit => new Date(permit.issueDate) >= cutoffDate);
    }
    
    setTimeFilteredPermits(filtered);
    
    // If advanced filters are not shown, directly set filtered permits
    if (!showFilters) {
      setFilteredPermits(filtered);
    }
  }, [permits, timeFrame, showFilters]);
  
  // Handler for advanced filter changes
  const handleAdvancedFilterChange = (advancedFilteredPermits: Permit[]) => {
    setFilteredPermits(advancedFilteredPermits);
  };
  
  // Calculate summary metrics for the dashboard
  const totalPermits = filteredPermits.length;
  const enteredPermits = filteredPermits.filter(p => p.enterPermit).length;
  const skippedPermits = totalPermits - enteredPermits;
  const enteredPercentage = totalPermits > 0 ? Math.round((enteredPermits / totalPermits) * 100) : 0;
  const skippedPercentage = totalPermits > 0 ? Math.round((skippedPermits / totalPermits) * 100) : 0;
  
  if (isLoading) {
    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span>Permit Report Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="h-40 bg-gray-200 rounded w-full"></div>
            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
            <div className="h-40 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span>Permit Report Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-destructive">
          Error: {error}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <span>Permit Report Dashboard</span>
        </CardTitle>
        <CardDescription>
          {uploadId 
            ? `Analyzing data from upload #${uploadId}` 
            : 'Analyzing data across all uploads'}
        </CardDescription>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select 
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Time</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="quarter">Past Quarter</option>
              <option value="year">Past Year</option>
            </select>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs ml-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-3 w-3 mr-1" />
              {showFilters ? 'Hide Filters' : 'Advanced Filters'}
            </Button>
          </div>
          
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="h-3 w-3 mr-1" />
            Export Report
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {showFilters && (
          <div className="mb-6">
            <PermitFilterPanel 
              permits={timeFilteredPermits}
              onFilteredPermitsChange={handleAdvancedFilterChange}
            />
          </div>
        )}
      
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalPermits}</div>
              <p className="text-xs text-muted-foreground">Total Permits</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{enteredPermits}</div>
              <div className="flex items-center">
                <p className="text-xs text-muted-foreground">Entered</p>
                <div className="text-xs text-green-600 ml-auto flex items-center">
                  <ArrowUpCircle className="h-3 w-3 mr-1" />
                  {enteredPercentage}%
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{skippedPermits}</div>
              <div className="flex items-center">
                <p className="text-xs text-muted-foreground">Skipped</p>
                <div className="text-xs text-orange-600 ml-auto flex items-center">
                  <ArrowDownCircle className="h-3 w-3 mr-1" />
                  {skippedPercentage}%
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                ${filteredPermits.reduce((total, permit) => {
                  const value = parseFloat(permit.value.replace(/[^0-9.-]+/g, ""));
                  return isNaN(value) ? total : total + value;
                }, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="flex items-center">
              <PieChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center">
              <List className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center">
              <LineChart className="h-4 w-4 mr-2" />
              Trends
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-80">
                <PermitStatusChart permits={filteredPermits} />
              </div>
              
              <div className="h-80">
                <PermitTypeDistribution permits={filteredPermits} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Permit Details</CardTitle>
              </CardHeader>
              <CardContent>
                <ReportTable permits={filteredPermits} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-80">
                <PermitValueChart permits={filteredPermits} />
              </div>
              
              <div className="h-80">
                <TimeAnalysisChart permits={filteredPermits} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ReportingDashboard;