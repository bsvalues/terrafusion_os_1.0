/**
 * Connection Health Metrics Component
 * 
 * This component displays detailed metrics about the WebSocket connection health.
 * It shows statistics like total reconnection attempts, fallback activations,
 * and recent connection events.
 */

import { useAgentSocketIO } from '@/hooks/use-agent-socketio';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export function ConnectionHealthMetrics() {
  const { connectionMetrics, isPolling } = useAgentSocketIO();

  if (!connectionMetrics) {
    return (
      <div className="text-xs text-center py-2 text-muted-foreground">
        No connection metrics available
      </div>
    );
  }

  const {
    totalReconnectAttempts,
    totalFallbackActivations,
    totalErrors,
    averageReconnectTime,
    connectionEvents,
    lastError
  } = connectionMetrics;

  // Calculate a simplified health score from 0-100 for visualization
  const calculateHealthScore = (): number => {
    if (isPolling) {
      return 30; // In fallback mode, health is reduced
    }
    
    // Base score is 100
    let score = 100;
    
    // Reduce score for each reconnect attempt (max reduction: 30)
    const reconnectPenalty = Math.min(30, totalReconnectAttempts * 5);
    score -= reconnectPenalty;
    
    // Reduce score for each error (max reduction: 40)
    const errorPenalty = Math.min(40, totalErrors * 8);
    score -= errorPenalty;
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();
  
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Connection Health</p>
          <p className="text-xs font-medium">{healthScore}%</p>
        </div>
        <Progress value={healthScore} className="h-1.5" />
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground">Reconnect Attempts:</div>
          <div className="font-medium">{totalReconnectAttempts}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Fallback Activations:</div>
          <div className="font-medium">{totalFallbackActivations}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Total Errors:</div>
          <div className="font-medium">{totalErrors}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Avg. Reconnect Time:</div>
          <div className="font-medium">
            {averageReconnectTime ? `${averageReconnectTime.toFixed(0)}ms` : 'N/A'}
          </div>
        </div>
      </div>
      
      {lastError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-2 text-xs">
          <div className="flex text-red-700 dark:text-red-400 font-medium items-center">
            <AlertCircle className="h-3 w-3 mr-1.5" />
            Last Error
          </div>
          <pre className="mt-1 whitespace-pre-wrap break-all text-red-700 dark:text-red-400 text-[10px]">
            {lastError.message || JSON.stringify(lastError, null, 2)}
          </pre>
        </div>
      )}
      
      <div>
        <p className="text-xs font-medium mb-1.5">Recent Connection Events</p>
        <ScrollArea className="h-28 rounded-md border">
          <div className="p-2 space-y-1.5">
            {connectionEvents.slice(-10).reverse().map((event, i) => (
              <div key={i} className="text-[10px] flex items-start">
                <span className="inline-flex mr-1.5 mt-0.5">
                  {event.type === 'status_change' && event.details?.status === 'connected' && (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  {event.type === 'status_change' && event.details?.status === 'disconnected' && (
                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                  )}
                  {event.type === 'reconnect_attempt' && (
                    <RefreshCw className="h-3 w-3 text-blue-500" />
                  )}
                  {event.type === 'error' && (
                    <AlertCircle className="h-3 w-3 text-red-500" />
                  )}
                  {event.type === 'fallback_activated' && (
                    <Badge 
                      variant="outline" 
                      className="text-[8px] h-3 py-0 px-0.5 border-yellow-500 text-yellow-700 dark:text-yellow-400"
                    >
                      FB
                    </Badge>
                  )}
                </span>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      {event.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {event.details && (
                    <span className="text-muted-foreground break-all line-clamp-1">
                      {typeof event.details === 'string' 
                        ? event.details 
                        : JSON.stringify(event.details)
                      }
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {connectionEvents.length === 0 && (
              <div className="text-[10px] py-2 text-center text-muted-foreground">
                No connection events recorded
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}