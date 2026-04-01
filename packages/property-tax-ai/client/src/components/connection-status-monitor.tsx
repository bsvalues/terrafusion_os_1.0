/**
 * Connection Status Monitor Component
 * 
 * This component provides monitoring and visualization of connection status.
 * It includes both basic status information as well as detailed metrics
 * for monitoring connection health and fallback status.
 */

import { useState } from 'react';
import { useAgentSocketIO } from '@/hooks/use-agent-socketio';
import { ConnectionHealthMetrics } from './connection-health-metrics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, LayoutDashboard, X } from 'lucide-react';

export function ConnectionStatusMonitor() {
  const [showMonitor, setShowMonitor] = useState(false);
  const { connect, connectionStatus, connectionStatuses, isPolling } = useAgentSocketIO();

  // Only render a button to toggle monitor when needed
  if (!showMonitor) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setShowMonitor(true)} 
          variant="outline" 
          size="sm"
          className="flex items-center space-x-1 bg-white shadow-md dark:bg-slate-800"
        >
          <BarChart className="h-4 w-4" />
          <span className="hidden sm:inline">
            Connection Monitor
          </span>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card className="border border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700">
        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium flex items-center">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Connection Monitor
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={() => setShowMonitor(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-xs">
                <div className="text-muted-foreground">Status:</div>
                <div className="font-medium">
                  {connectionStatus}
                </div>
              </div>
              <div className="text-xs">
                <div className="text-muted-foreground">Mode:</div>
                <div className="font-medium">
                  {isPolling ? 'Fallback (REST)' : 'WebSocket'}
                </div>
              </div>
            </div>
            
            {connectionStatus !== connectionStatuses.CONNECTED && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs h-7"
                onClick={() => connect()}
              >
                Attempt Reconnection
              </Button>
            )}
            
            <ConnectionHealthMetrics />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}