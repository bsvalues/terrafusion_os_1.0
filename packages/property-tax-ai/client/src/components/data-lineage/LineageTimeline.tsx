import * as React from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Filter, SlidersHorizontal, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataLineageEntry {
  id: number;
  propertyId: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  changeTimestamp: Date;
  source: string;
  userId: number;
  userName?: string;
  details?: any;
}

interface LineageTimelineProps {
  entries: DataLineageEntry[];
  isLoading?: boolean;
  onEntryClick?: (entry: DataLineageEntry) => void;
}

export function LineageTimeline({
  entries = [],
  isLoading = false,
  onEntryClick,
}: LineageTimelineProps) {
  const [selectedSource, setSelectedSource] = React.useState<string | null>(null);
  const [selectedView, setSelectedView] = React.useState('timeline');
  
  // Source event counter to show badges
  const sourceEventCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(entry => {
      counts[entry.source] = (counts[entry.source] || 0) + 1;
    });
    return counts;
  }, [entries]);
  
  // Filtered entries based on selected source
  const filteredEntries = React.useMemo(() => {
    if (!selectedSource) return entries;
    return entries.filter(entry => entry.source === selectedSource);
  }, [entries, selectedSource]);
  
  // Group entries by day for timeline view
  const entriesByDay = React.useMemo(() => {
    const grouped: Record<string, DataLineageEntry[]> = {};
    
    filteredEntries.forEach(entry => {
      const day = format(new Date(entry.changeTimestamp), 'yyyy-MM-dd');
      if (!grouped[day]) {
        grouped[day] = [];
      }
      grouped[day].push(entry);
    });
    
    // Sort each day's entries by timestamp (newest first)
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => 
        new Date(b.changeTimestamp).getTime() - new Date(a.changeTimestamp).getTime()
      );
    });
    
    return grouped;
  }, [filteredEntries]);
  
  // Get sorted days for display (newest first)
  const sortedDays = React.useMemo(() => {
    return Object.keys(entriesByDay).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [entriesByDay]);
  
  // Get all unique sources
  const sources = React.useMemo(() => {
    const uniqueSources = [...new Set(entries.map(entry => entry.source))];
    return uniqueSources.sort();
  }, [entries]);
  
  // Return class for source type badge
  const getSourceBadgeColor = (source: string) => {
    switch (source.toLowerCase()) {
      case 'api':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'import':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'manual':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'calculated':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'validated':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
      case 'correction':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  // Format and abbreviate values for display
  const formatValue = (value: string) => {
    if (!value) return '(empty)';
    if (value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return value;
  };
  
  // Show "no data" message when appropriate
  if (!isLoading && entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Lineage</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No lineage data available</h3>
          <p className="text-muted-foreground max-w-md">
            There are no recorded changes for the selected filters. Try adjusting your filters or 
            selecting a different time range.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Data Lineage</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                selectedView === 'timeline' && 'bg-muted'
              )}
              onClick={() => setSelectedView('timeline')}
            >
              <FileText className="mr-1 h-4 w-4" />
              Timeline
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                selectedView === 'table' && 'bg-muted'
              )}
              onClick={() => setSelectedView('table')}
            >
              <SlidersHorizontal className="mr-1 h-4 w-4" />
              Table
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sources.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className={cn(
                'text-xs',
                selectedSource === null && 'bg-muted'
              )}
              onClick={() => setSelectedSource(null)}
            >
              <Filter className="mr-1 h-3 w-3" />
              All Sources
            </Button>
            
            {sources.map(source => (
              <Button
                key={source}
                size="sm"
                variant="outline"
                className={cn(
                  'text-xs',
                  selectedSource === source && 'bg-muted'
                )}
                onClick={() => setSelectedSource(selectedSource === source ? null : source)}
              >
                {source.charAt(0).toUpperCase() + source.slice(1)}
                {sourceEventCounts[source] > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-1 px-1.5 py-0"
                  >
                    {sourceEventCounts[source]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}
        
        <Tabs value={selectedView} className="w-full">
          <TabsContent value="timeline" className="mt-0">
            {sortedDays.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No data available for the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-8 py-2">
                {sortedDays.map(day => (
                  <div key={day} className="relative">
                    <div className="sticky top-0 bg-card z-10 py-2 border-b mb-4">
                      <h3 className="font-medium">
                        {format(new Date(day), 'EEEE, MMMM d, yyyy')}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {entriesByDay[day].map(entry => (
                        <div
                          key={entry.id}
                          className="flex flex-col sm:flex-row gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          onClick={() => onEntryClick?.(entry)}
                          style={{ cursor: onEntryClick ? 'pointer' : 'default' }}
                        >
                          <div className="flex-shrink-0 text-xs text-muted-foreground">
                            {format(new Date(entry.changeTimestamp), 'h:mm a')}
                          </div>
                          <div className="flex-grow">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                              <div className="font-medium">
                                {entry.fieldName}
                              </div>
                              <Badge 
                                className={cn(
                                  "px-1.5 py-0.5 text-xs",
                                  getSourceBadgeColor(entry.source)
                                )}
                                variant="outline"
                              >
                                {entry.source}
                              </Badge>
                              {entry.userName && (
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <User className="mr-1 h-3 w-3" />
                                  {entry.userName}
                                </div>
                              )}
                            </div>
                            <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <span className="text-muted-foreground">From: </span>
                                <span className={entry.oldValue ? '' : 'italic text-muted-foreground'}>
                                  {formatValue(entry.oldValue) || '(empty)'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">To: </span>
                                <span className={entry.newValue ? '' : 'italic text-muted-foreground'}>
                                  {formatValue(entry.newValue) || '(empty)'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="table" className="mt-0">
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date/Time</TableHead>
                    <TableHead className="w-[150px]">Field</TableHead>
                    <TableHead className="w-[100px]">Source</TableHead>
                    <TableHead className="w-[150px]">User</TableHead>
                    <TableHead>Old Value</TableHead>
                    <TableHead>New Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No data available for the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map(entry => (
                      <TableRow 
                        key={entry.id}
                        className={onEntryClick ? 'cursor-pointer hover:bg-muted/50' : undefined}
                        onClick={() => onEntryClick?.(entry)}
                      >
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(entry.changeTimestamp), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell className="font-medium">{entry.fieldName}</TableCell>
                        <TableCell>
                          <Badge 
                            className={cn(
                              "px-1.5 py-0.5 text-xs whitespace-nowrap",
                              getSourceBadgeColor(entry.source)
                            )}
                            variant="outline"
                          >
                            {entry.source}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.userName || `User #${entry.userId}`}</TableCell>
                        <TableCell className={!entry.oldValue ? 'italic text-muted-foreground' : ''}>
                          {formatValue(entry.oldValue) || '(empty)'}
                        </TableCell>
                        <TableCell className={!entry.newValue ? 'italic text-muted-foreground' : ''}>
                          {formatValue(entry.newValue) || '(empty)'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}