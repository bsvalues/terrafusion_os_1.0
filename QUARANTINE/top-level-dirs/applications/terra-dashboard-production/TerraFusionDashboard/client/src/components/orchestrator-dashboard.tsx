import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Activity, Clock, CheckCircle, XCircle, Warning, Play  } from '@mui/icons-material';

interface OrchestratorStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface Task {
  id: string;
  taskType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  retryCount: number;
  scheduledFor: string;
  payload?: any;
}

export default function OrchestratorDashboard() {
  const [realtimeStats, setRealtimeStats] = useState<OrchestratorStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  
  const { sendMessage, lastMessage } = useWebSocket();

  // Fetch orchestrator statistics
  const { data: stats, refetch: refetchStats } = useQuery<OrchestratorStats>({
    queryKey: ['/api/orchestrator/stats'],
    refetchInterval: 5000
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (sendMessage) {
      sendMessage({ type: 'subscribe_orchestrator_updates', data: {} });
      sendMessage({ type: 'get_orchestrator_stats', data: {} });
    }
  }, [sendMessage]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage.data);
        
        switch (message.type) {
          case 'orchestrator_stats':
            setRealtimeStats(message.data);
            break;
          case 'task_submitted':
            setRecentTasks(prev => [message.data, ...prev].slice(0, 10));
            refetchStats();
            break;
          case 'task_completed':
            setRecentTasks(prev => [message.data, ...prev].slice(0, 10));
            refetchStats();
            break;
          case 'task_failed':
            setRecentTasks(prev => [message.data, ...prev].slice(0, 10));
            refetchStats();
            break;
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage, refetchStats]);

  const currentStats: OrchestratorStats = realtimeStats || stats || { pending: 0, processing: 0, completed: 0, failed: 0 };
  const totalTasks = Object.values(currentStats).reduce((sum, count) => sum + count, 0);
  
  const submitTestTask = async (taskType: string) => {
    try {
      const response = await fetch('/api/orchestrator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType,
          payload: {
            testProperty: true,
            timestamp: new Date().toISOString()
          },
          priority: 7
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Task submitted:', result);
      }
    } catch (error) {
      console.error('Failed to submit test task:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing': return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Warning className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
<>
        <h2 className="text-2xl font-bold tracking-tight">Task Orchestrator</h2>
        <div
</> className="flex gap-2">
          <Button 
            onClick={() => submitTestTask('cost-analysis')} 
            size="sm"
            className="bg-terra-600 hover:bg-terra-700"
          >
<>
            <Play className="h-4 w-4 mr-2" />
            Test Cost Analysis
          </Button>
          <Button
</> 
            onClick={() => submitTestTask('property-analysis')} 
            size="sm" 
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Test Property Analysis
          </Button>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock
</> className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
<>
            <div className="text-2xl font-bold">{currentStats.pending}</div>
            <p
</> className="text-xs text-muted-foreground">
              Waiting for processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Activity
</> className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
<>
            <div className="text-2xl font-bold">{currentStats.processing}</div>
            <p
</> className="text-xs text-muted-foreground">
              Currently executing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle
</> className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
<>
            <div className="text-2xl font-bold">{currentStats.completed}</div>
            <p
</> className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<>
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle
</> className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
<>
            <div className="text-2xl font-bold">{currentStats.failed}</div>
            <p
</> className="text-xs text-muted-foreground">
              Execution errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Task Distribution Chart */}
      <Card>
        <CardHeader>
<>
          <CardTitle>Queue Distribution</CardTitle>
          <CardDescription
</>>Current task distribution across different states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalTasks > 0 ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
<>
                  <span className="text-sm font-medium">Pending</span>
                  <span
</> className="text-sm text-muted-foreground">
                    {currentStats.pending} ({Math.round((currentStats.pending / totalTasks) * 100)}%)
                  </span>
                </div>
<>
                <Progress value={(currentStats.pending / totalTasks) * 100} className="h-2" />
              </div>

              <div
</> className="space-y-3">
                <div className="flex items-center justify-between">
<>
                  <span className="text-sm font-medium">Processing</span>
                  <span
</> className="text-sm text-muted-foreground">
                    {currentStats.processing} ({Math.round((currentStats.processing / totalTasks) * 100)}%)
                  </span>
                </div>
<>
                <Progress value={(currentStats.processing / totalTasks) * 100} className="h-2" />
              </div>

              <div
</> className="space-y-3">
                <div className="flex items-center justify-between">
<>
                  <span className="text-sm font-medium">Completed</span>
                  <span
</> className="text-sm text-muted-foreground">
                    {currentStats.completed} ({Math.round((currentStats.completed / totalTasks) * 100)}%)
                  </span>
                </div>
<>
                <Progress value={(currentStats.completed / totalTasks) * 100} className="h-2" />
              </div>

              <div
</> className="space-y-3">
                <div className="flex items-center justify-between">
<>
                  <span className="text-sm font-medium">Failed</span>
                  <span
</> className="text-sm text-muted-foreground">
                    {currentStats.failed} ({Math.round((currentStats.failed / totalTasks) * 100)}%)
                  </span>
                </div>
                <Progress value={(currentStats.failed / totalTasks) * 100} className="h-2" />
              </div>
            </>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No tasks in queue. Click the test buttons above to submit sample tasks.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
<>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription
</>>Real-time task execution events</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTasks.length > 0 ? (
            <div className="space-y-3">
              {recentTasks.map((task /* , index */) => (
                <div key={`${task.taskId}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon('completed')}
                    <div>
<>
                      <div className="font-medium">Task {task.taskId?.slice(0, 8) || 'Unknown'}</div>
                      <div
</> className="text-sm text-muted-foreground">
                        Agent: {task.agentId?.slice(0, 8) || 'System'}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor('completed')}>
                    Completed
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No recent activity. Task events will appear here in real-time.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}