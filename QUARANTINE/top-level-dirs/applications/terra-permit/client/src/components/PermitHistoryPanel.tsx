import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PermitHistory, ActionType } from '@/types';
import { getPermitHistory } from '@/lib/api';
import { History, FileEdit, FileCheck, MessageSquare, AlertCircle, User, CheckCircle, XCircle  } from '@mui/icons-material';
import { format } from 'date-fns';

interface PermitHistoryPanelProps {
  permitId: number;
}

export function PermitHistoryPanel({ permitId }: PermitHistoryPanelProps) {
  const [history, setHistory] = useState<PermitHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
        const historyData = await getPermitHistory(permitId);
        setHistory(historyData);
        setError(null);
      } catch (err) {
        console.error('Error loading permit history:', err);
        setError('Failed to load history data');
      } finally {
        setIsLoading(false);
      }
    }

    if (permitId) {
      loadHistory();
    }
  }, [permitId]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case ActionType.CREATE:
        return <FileEdit className="h-4 w-4 mr-1 text-blue-500" />;
      case ActionType.UPDATE:
        return <FileEdit className="h-4 w-4 mr-1 text-amber-500" />;
      case ActionType.REVIEW:
        return <FileCheck className="h-4 w-4 mr-1 text-green-500" />;
      case ActionType.COMMENT:
        return <MessageSquare className="h-4 w-4 mr-1 text-purple-500" />;
      default:
        return <AlertCircle className="h-4 w-4 mr-1 text-gray-500" />;
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
      <Badge variant={variant} className="ml-auto capitalize">
        {action}
      </Badge>
    );
  };

  // Helper function to format changes nicely
  const formatChanges = (changes: Record<string, any> | undefined) => {
    if (!changes || Object.keys(changes).length === 0) return null;
    
    return (
      <div className="mt-2 space-y-1">
        {Object.entries(changes).map(([key, value]) => {
          // Special formatting for boolean values
          if (typeof value === 'boolean') {
            return (
              <div key={key} className="flex items-center">
                <span className="text-sm font-medium capitalize mr-2">{key}:</span>
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
            <div key={key} className="flex items-start">
              <span className="text-sm font-medium capitalize min-w-[120px]">{key}:</span>
              <span className="text-sm">{String(value)}</span>
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
            <span>Permit History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
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
            <span>Permit History</span>
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
          <span>Permit History</span>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Track all changes made to this permit
        </div>
      </CardHeader>
      <CardContent className="max-h-96 overflow-y-auto">
        {history.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground flex flex-col items-center">
            <History className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p>No history records found for this permit.</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-muted-foreground/20"></div>
            
            {history.map((item /* , index */) => (
              <div key={item.id} className="relative pl-10 pb-6">
                {/* Timeline dot */}
                <div className="absolute left-2.5 top-2 h-5 w-5 rounded-full bg-background border-2 border-muted-foreground/30 flex items-center justify-center">
                  {getActionIcon(item.action)}
                </div>
                
                <div className="border rounded-lg p-4 transition-all hover:shadow-md">
                  <div className="flex items-center mb-2">
                    <span className="font-medium text-sm md:text-base">{item.detail.description}</span>
                    {getActionBadge(item.action)}
                  </div>
                  
                  <div className="flex items-center text-xs text-muted-foreground mb-3">
                    <User className="h-3 w-3 mr-1" />
                    <span>{item.userId ? `User #${item.userId}` : 'System'} • </span>
                    <time className="ml-1">{format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}</time>
                  </div>
                  
                  {/* Collapsible details section */}
                  {(item.action === ActionType.UPDATE && item.detail.changes) ||
                   (item.action === ActionType.CREATE && item.detail.initialState) ||
                   (item.detail.previousState && Object.keys(item.detail.previousState).length > 0) ? (
                    <details className="group">
                      <summary className="cursor-pointer text-xs font-medium text-primary hover:underline focus:outline-none inline-flex items-center">
                        <span>View details</span>
                        <FileEdit className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </summary>
                      <div className="mt-3 space-y-3 text-sm border-l-2 border-primary/20 pl-3">
                        {/* If it's an update, show the changes */}
                        {item.action === ActionType.UPDATE && item.detail.changes && (
                          <div className="bg-muted/30 p-3 rounded-md">
                            <div className="text-xs font-medium mb-2 text-primary/80 flex items-center">
                              <FileEdit className="h-3 w-3 mr-1 text-primary" />
                              <span>Changes:</span>
                            </div>
                            {formatChanges(item.detail.changes)}
                          </div>
                        )}
                        
                        {/* If it's a creation, show the initial state */}
                        {item.action === ActionType.CREATE && item.detail.initialState && (
                          <div className="bg-primary/5 p-3 rounded-md">
                            <div className="text-xs font-medium mb-2 text-primary/80 flex items-center">
                              <FileEdit className="h-3 w-3 mr-1 text-blue-500" />
                              <span>Initial Values:</span>
                            </div>
                            {formatChanges(item.detail.initialState)}
                          </div>
                        )}
                        
                        {/* If we have previous state information */}
                        {item.detail.previousState && Object.keys(item.detail.previousState).length > 0 && (
                          <div className="bg-amber-50/50 p-3 rounded-md">
                            <div className="text-xs font-medium mb-2 text-amber-700 flex items-center">
                              <History className="h-3 w-3 mr-1 text-amber-600" />
                              <span>Previous Values:</span>
                            </div>
                            {formatChanges(item.detail.previousState)}
                          </div>
                        )}
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}