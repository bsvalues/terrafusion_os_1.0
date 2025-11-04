import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PermitHistory, ActionType } from '@/types';
import { getUploadHistory } from '@/lib/api';
import { History, FileEdit, FileCheck, MessageSquare, AlertCircle, 
  Search, User, CheckCircle, XCircle, Link as LinkIcon 
 } from '@mui/icons-material';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface UploadHistoryPanelProps {
  uploadId: number;
}

export function UploadHistoryPanel({ uploadId }: UploadHistoryPanelProps) {
  const [history, setHistory] = useState<PermitHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PermitHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
        const historyData = await getUploadHistory(uploadId);
        setHistory(historyData);
        setFilteredHistory(historyData);
        setError(null);
      } catch (err) {
        console.error('Error loading upload history:', err);
        setError('Failed to load history data');
      } finally {
        setIsLoading(false);
      }
    }

    if (uploadId) {
      loadHistory();
    }
  }, [uploadId]);

  // Filter history when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredHistory(history);
      return;
    }

    const filtered = history.filter(item => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        item.action.toLowerCase().includes(searchTermLower) ||
        item.detail?.description?.toLowerCase().includes(searchTermLower) ||
        JSON.stringify(item.detail?.changes || {}).toLowerCase().includes(searchTermLower) ||
        String(item.permitId).includes(searchTermLower)
      );
    });

    setFilteredHistory(filtered);
  }, [searchTerm, history]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case ActionType.CREATE:
        return <FileEdit className="h-4 w-4 text-blue-500" />;
      case ActionType.UPDATE:
        return <FileEdit className="h-4 w-4 text-amber-500" />;
      case ActionType.REVIEW:
        return <FileCheck className="h-4 w-4 text-green-500" />;
      case ActionType.COMMENT:
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadge = (action: string) => {
    const variant = action === ActionType.CREATE 
      ? 'default' 
      : action === ActionType.UPDATE 
        ? 'secondary' 
        : action === ActionType.REVIEW 
          ? 'outline' 
          : 'destructive';

    return (
      <Badge variant={variant} className="capitalize">
        {action}
      </Badge>
    );
  };

  // Helper function to format changes nicely
  const formatChanges = (changes: Record<string, any> | undefined) => {
    if (!changes || Object.keys(changes).length === 0) return null;
    
    return (
      <div className="space-y-1 text-xs">
        {Object.entries(changes).map(([key, value]) => {
          // Special formatting for boolean values
          if (typeof value === 'boolean') {
            return (
              <div key={key} className="flex items-center">
                <span className="font-medium capitalize mr-2">{key}:</span>
                {value ? (
                  <span className="text-green-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" /> Yes
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center">
                    <XCircle className="h-3 w-3 mr-1" /> No
                  </span>
                )}
              </div>
            );
          }
          
          // Default formatting for other types
          return (
            <div key={key} className="flex items-start"><>

              <span className="font-medium capitalize min-w-[80px]">{key}:</span>
              <span
</>>{String(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <span>Upload History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2"><>

            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            <div
</> className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-5 bg-gray-200 rounded w-2/3"></div>
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
            <History className="h-5 w-5" />
            <span>Upload History</span>
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
          <History className="h-5 w-5" />
          <span>Upload History</span>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Track all permit changes across this upload
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by permit ID, action type, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSearchTerm('')}
              className="h-8 px-2"
            >
              Clear
            </Button>
          )}
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
            {history.length === 0 ? (
              <>
                <History className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p>No history records found for this upload.</p>
              </>
            ) : (
              <>
                <Search className="h-10 w-10 text-muted-foreground/30 mb-2" /><>

                <p>No results match your search criteria.</p>
                <Button
</> 
                  variant="link" 
                  size="sm" 
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              </>
            )}
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <Table>
              <TableHeader>
                <TableRow><>

                  <TableHead>Date/Time</TableHead>
                  <TableHead
</>>Permit</TableHead><>

                  <TableHead>Action</TableHead>
                  <TableHead
</> className="w-[50%]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow key={item.id}><>

                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell
</>>
                      <Link href={`#permit-${item.permitId}`} className="flex items-center text-primary hover:underline">
                        <LinkIcon className="h-3 w-3 mr-1" />
                        #{item.permitId}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(item.action)}
                        {getActionBadge(item.action)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm mb-1"><>

                        <span>{item.detail.description}</span>
                        <Badge
</> variant="outline" className="ml-2 text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {item.userId ? `User #${item.userId}` : 'System'}
                        </Badge>
                      </div>
                      
                      {/* Changes section */}
                      {(item.detail.changes || item.detail.initialState || item.detail.previousState) && (
                        <details className="mt-1 text-xs group">
                          <summary className="cursor-pointer text-primary hover:underline focus:outline-none inline-flex items-center"><>

                            <span>View details</span>
                            <FileEdit
</> className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </summary>
                          <div className="mt-2 space-y-3 border-l-2 border-primary/20 pl-3">
                            {/* Show changes if they exist */}
                            {item.detail.changes && (
                              <div className="bg-muted/30 p-3 rounded-md">
                                <div className="font-medium mb-2 text-primary/80 flex items-center">
                                  <FileEdit className="h-3 w-3 mr-1 text-primary" />
                                  <span>Changes:</span>
                                </div>
                                {formatChanges(item.detail.changes)}
                              </div>
                            )}
                            
                            {/* Show initial state if it exists */}
                            {item.detail.initialState && (
                              <div className="bg-primary/5 p-3 rounded-md">
                                <div className="font-medium mb-2 text-primary/80 flex items-center">
                                  <FileEdit className="h-3 w-3 mr-1 text-blue-500" />
                                  <span>Initial Values:</span>
                                </div>
                                {formatChanges(item.detail.initialState)}
                              </div>
                            )}
                            
                            {/* Show previous state if it exists */}
                            {item.detail.previousState && (
                              <div className="bg-amber-50/50 p-3 rounded-md">
                                <div className="font-medium mb-2 text-amber-700 flex items-center">
                                  <History className="h-3 w-3 mr-1 text-amber-600" />
                                  <span>Previous Values:</span>
                                </div>
                                {formatChanges(item.detail.previousState)}
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}