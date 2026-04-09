import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { getDateRangeLineage, getSourceLineage, getUserLineage, formatLineageTimestamp } from '@/lib/dataLineageService';
import { LineageFilters, LineageFiltersState } from '@/components/data-lineage/LineageFilters';
import { LineageTimeline } from '@/components/data-lineage/LineageTimeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Info, FileBarChart2, Database, Users, Calendar } from 'lucide-react';

export function DataLineageDashboardPage() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = React.useState<LineageFiltersState>({});
  const [tab, setTab] = React.useState('date');
  const [propertyId, setPropertyId] = React.useState('');
  const [searchDialogOpen, setSearchDialogOpen] = React.useState(false);
  
  // Build query parameters based on filters and tab
  const queryParams = React.useMemo(() => {
    switch (tab) {
      case 'date':
        return {
          startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
          endDate: filters.endDate ? filters.endDate.toISOString() : undefined
        };
      case 'source':
        return {
          source: filters.sources && filters.sources.length > 0 ? filters.sources[0] : undefined
        };
      case 'user':
        return {
          userId: filters.users && filters.users.length > 0 ? filters.users[0] : undefined
        };
      default:
        return {};
    }
  }, [tab, filters]);
  
  // Fetch lineage data
  const {
    data: lineageData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['/api/lineage', tab, queryParams],
    queryFn: async () => {
      // Choose the appropriate API based on the active tab
      switch (tab) {
        case 'date':
          if (queryParams.startDate && queryParams.endDate) {
            return getDateRangeLineage(queryParams.startDate, queryParams.endDate);
          }
          break;
        case 'source':
          if (queryParams.source) {
            return getSourceLineage(queryParams.source);
          }
          break;
        case 'user':
          if (queryParams.userId) {
            return getUserLineage(queryParams.userId);
          }
          break;
      }
      
      // Default: fetch last 7 days of lineage if no specific filter
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      return getDateRangeLineage(startDate, endDate);
    },
    enabled: true,
  });
  
  // Get available sources
  const availableSources = React.useMemo(() => {
    if (!lineageData?.lineage || lineageData.lineage.length === 0) return [];
    
    const sources = new Set<string>();
    lineageData.lineage.forEach(record => {
      sources.add(record.source);
    });
    
    return Array.from(sources);
  }, [lineageData]);
  
  // Get available users
  const availableUsers = React.useMemo(() => {
    if (!lineageData?.lineage || lineageData.lineage.length === 0) return [];
    
    const users = new Map<number, string>();
    lineageData.lineage.forEach(record => {
      users.set(record.userId, `User #${record.userId}`);
    });
    
    return Array.from(users.entries()).map(([id, name]) => ({ id, name }));
  }, [lineageData]);
  
  // Filter records based on the current filters
  const filteredRecords = React.useMemo(() => {
    if (!lineageData?.lineage || lineageData.lineage.length === 0) return [];
    
    let records = [...lineageData.lineage];
    
    // Apply source filter (if tab is not already filtering by source)
    if (tab !== 'source' && filters.sources && filters.sources.length > 0) {
      records = records.filter(record => 
        filters.sources!.includes(record.source)
      );
    }
    
    // Apply user filter (if tab is not already filtering by user)
    if (tab !== 'user' && filters.users && filters.users.length > 0) {
      records = records.filter(record => 
        filters.users!.includes(record.userId)
      );
    }
    
    // Apply field filter
    if (filters.fields && filters.fields.length > 0) {
      records = records.filter(record => 
        filters.fields!.includes(record.fieldName)
      );
    }
    
    return records;
  }, [lineageData, filters, tab]);
  
  // Navigate to specific property lineage
  const handlePropertySearch = () => {
    if (propertyId.trim()) {
      setLocation(`/property/${propertyId.trim()}/lineage`);
    }
    setSearchDialogOpen(false);
  };
  
  const handleFilterChange = (newFilters: LineageFiltersState) => {
    setFilters(newFilters);
  };
  
  const handleTabChange = (value: string) => {
    setTab(value);
  };
  
  // Get available fields
  const availableFields = React.useMemo(() => {
    if (!lineageData?.lineage || lineageData.lineage.length === 0) return [];
    
    const fields = new Set<string>();
    lineageData.lineage.forEach(record => {
      fields.add(record.fieldName);
    });
    
    return Array.from(fields);
  }, [lineageData]);
  
  // Tab filter help text
  const getTabDescription = () => {
    switch (tab) {
      case 'date':
        return "View data changes by date range";
      case 'source':
        return "Filter data changes by source type";
      case 'user':
        return "View data changes by user";
      default:
        return "View data changes";
    }
  };
  
  // Compute dashboard statistics
  const stats = React.useMemo(() => {
    if (!lineageData?.lineage || lineageData.lineage.length === 0) {
      return {
        totalChanges: 0,
        uniqueProperties: 0,
        uniqueFields: 0,
        bySource: {},
        recentActivity: {
          last24h: 0,
          last7d: 0
        }
      };
    }
    
    const uniqueProperties = new Set();
    const uniqueFields = new Set();
    const bySource: Record<string, number> = {};
    let last24h = 0;
    let last7d = 0;
    
    const now = new Date().getTime();
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;
    
    lineageData.lineage.forEach(record => {
      uniqueProperties.add(record.propertyId);
      uniqueFields.add(record.fieldName);
      
      // Count by source
      bySource[record.source] = (bySource[record.source] || 0) + 1;
      
      // Recent activity
      const recordTime = new Date(record.changeTimestamp).getTime();
      if (now - recordTime < day) {
        last24h++;
      }
      if (now - recordTime < week) {
        last7d++;
      }
    });
    
    return {
      totalChanges: lineageData.lineage.length,
      uniqueProperties: uniqueProperties.size,
      uniqueFields: uniqueFields.size,
      bySource,
      recentActivity: {
        last24h,
        last7d
      }
    };
  }, [lineageData]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <h1 className="text-2xl font-bold">Data Lineage Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  
  // Error state
  if (isError || !lineageData) {
    return (
      <div className="container py-6 space-y-6">
        <h1 className="text-2xl font-bold">Data Lineage Dashboard</h1>
        
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            {error instanceof Error 
              ? error.message 
              : "Could not load lineage data. Please try again later or check the API endpoint."
            }
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Data Lineage Dashboard</h1>
        
        <div className="flex items-center gap-2">
          <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                Search by Property ID
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Property Lineage Search</DialogTitle>
                <DialogDescription>
                  Enter a property ID to view its detailed change history.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 mt-4">
                <Input 
                  placeholder="Enter property ID" 
                  value={propertyId} 
                  onChange={(e) => setPropertyId(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handlePropertySearch();
                    }
                  }}
                />
                <Button onClick={handlePropertySearch}>Search</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">Total Changes</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.totalChanges.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {stats.uniqueProperties} properties
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.recentActivity.last24h.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 24 hours ({stats.recentActivity.last7d.toLocaleString()} changes this week)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">Fields Changed</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.uniqueFields.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Distinct fields with recorded changes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">Top Source</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {Object.keys(stats.bySource).length > 0 ? (
              <>
                <div className="text-2xl font-bold capitalize">
                  {Object.entries(stats.bySource).sort((a, b) => b[1] - a[1])[0][0]}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Object.entries(stats.bySource).sort((a, b) => b[1] - a[1])[0][1].toLocaleString()} changes
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground mt-1">
                  No source data available
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Filter Tabs */}
      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <TabsList>
            <TabsTrigger value="date" className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>Date Range</span>
            </TabsTrigger>
            <TabsTrigger value="source" className="flex items-center gap-1">
              <Database className="h-3.5 w-3.5" />
              <span>Source</span>
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>User</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="text-sm text-muted-foreground">
            {getTabDescription()}
          </div>
        </div>
        
        <TabsContent value="date" className="m-0 pt-2">
          <LineageFilters 
            onChange={handleFilterChange}
            availableSources={availableSources}
            availableUsers={availableUsers}
            availableFields={availableFields}
            value={filters}
          />
        </TabsContent>
        
        <TabsContent value="source" className="m-0 pt-2">
          <LineageFilters 
            onChange={handleFilterChange}
            availableSources={availableSources}
            availableUsers={availableUsers}
            availableFields={availableFields}
            value={filters}
          />
        </TabsContent>
        
        <TabsContent value="user" className="m-0 pt-2">
          <LineageFilters 
            onChange={handleFilterChange}
            availableSources={availableSources}
            availableUsers={availableUsers}
            availableFields={availableFields}
            value={filters}
          />
        </TabsContent>
      </Tabs>
      
      {/* Timeline View */}
      {filteredRecords.length > 0 ? (
        <LineageTimeline 
          entries={filteredRecords}
          onEntryClick={(entry) => setLocation(`/property/${entry.propertyId}/lineage`)}
        />
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Records Found</AlertTitle>
          <AlertDescription>
            No lineage records match your current filter criteria. Try adjusting your filters or tab selection.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}