import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, AlertCircle, Play, Pause, RefreshCw, BarChart3, TrendingUp } from '@mui/icons-material';

interface TaskProgress {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  estimatedCompletion?: Date;
  dependencies?: string[];
}

interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  runningTasks: number;
  failedTasks: number;
  overallProgress: number;
  estimatedTimeRemaining: number;
  velocity: number;
}

export default function ProgressTrackerDemo() {
  const [tasks, setTasks] = useState<TaskProgress[]>([]);
  const [metrics, setMetrics] = useState<ProjectMetrics>({
    totalTasks: 0,
    completedTasks: 0,
    runningTasks: 0,
    failedTasks: 0,
    overallProgress: 0,
    estimatedTimeRemaining: 0,
    velocity: 0
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Initialize demo tasks
  useEffect(() => {
    const initialTasks: TaskProgress[] = [
      {
        id: 'task-1',
        name: 'Data Collection',
        description: 'Gathering parcel data from multiple sources',
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() - 3000000),
        duration: 600000
      },
      {
        id: 'task-2',
        name: 'Data Validation',
        description: 'Validating data integrity and completeness',
        status: 'running',
        progress: 65,
        startTime: new Date(Date.now() - 1800000),
        dependencies: ['task-1']
      },
      {
        id: 'task-3',
        name: 'Spatial Processing',
        description: 'Processing geometric data and projections',
        status: 'pending',
        progress: 0,
        dependencies: ['task-2']
      },
      {
        id: 'task-4',
        name: 'Map Generation',
        description: 'Creating interactive map visualizations',
        status: 'pending',
        progress: 0,
        dependencies: ['task-3']
      },
      {
        id: 'task-5',
        name: 'Report Creation',
        description: 'Generating comprehensive analysis reports',
        status: 'pending',
        progress: 0,
        dependencies: ['task-4']
      },
      {
        id: 'task-6',
        name: 'Quality Assurance',
        description: 'Final quality checks and validation',
        status: 'pending',
        progress: 0,
        dependencies: ['task-5']
      }
    ];

    setTasks(initialTasks);
    updateMetrics(initialTasks);
  }, []);

  // Update project metrics
  const updateMetrics = (taskList: TaskProgress[]) => {
    const totalTasks = taskList.length;
    const completedTasks = taskList.filter(t => t.status === 'completed').length;
    const runningTasks = taskList.filter(t => t.status === 'running').length;
    const failedTasks = taskList.filter(t => t.status === 'failed').length;
    
    const overallProgress = taskList.reduce((sum, task) => sum + task.progress, 0) / totalTasks;
    
    // Calculate velocity (tasks per hour)
    const completedWithDuration = taskList.filter(t => t.status === 'completed' && t.duration);
    const avgTaskTime = completedWithDuration.length > 0 
      ? completedWithDuration.reduce((sum, t) => sum + (t.duration || 0), 0) / completedWithDuration.length
      : 3600000; // Default 1 hour
    
    const remainingTasks = totalTasks - completedTasks;
    const estimatedTimeRemaining = remainingTasks * avgTaskTime;
    const velocity = completedWithDuration.length > 0 ? 3600000 / avgTaskTime : 0;

    setMetrics({
      totalTasks,
      completedTasks,
      runningTasks,
      failedTasks,
      overallProgress: Math.round(overallProgress),
      estimatedTimeRemaining,
      velocity: Math.round(velocity * 10) / 10
    });
  };

  // Simulate task progress
  const simulateProgress = () => {
    setIsSimulating(true);
    
    const interval = setInterval(() => {
      setTasks(prevTasks => {
        const updatedTasks = prevTasks.map(task => {
          if (task.status === 'running') {
            const newProgress = Math.min(task.progress + Math.random() * 5, 100);
            
            if (newProgress >= 100) {
              return {
                ...task,
                progress: 100,
                status: 'completed' as const,
                endTime: new Date(),
                duration: task.startTime ? Date.now() - task.startTime.getTime() : undefined
              };
            }
            
            return { ...task, progress: Math.round(newProgress) };
          }
          
          // Start next pending task if dependencies are met
          if (task.status === 'pending' && task.dependencies) {
            const dependenciesMet = task.dependencies.every(depId =>
              prevTasks.find(t => t.id === depId)?.status === 'completed'
            );
            
            if (dependenciesMet) {
              return {
                ...task,
                status: 'running' as const,
                startTime: new Date(),
                progress: 1
              };
            }
          }
          
          return task;
        });
        
        updateMetrics(updatedTasks);
        return updatedTasks;
      });
    }, 1000);

    // Stop simulation when all tasks complete
    setTimeout(() => {
      clearInterval(interval);
      setIsSimulating(false);
    }, 30000);
  };

  // Reset all tasks
  const resetTasks = () => {
    setTasks(prevTasks => 
      prevTasks.map(task => ({
        ...task,
        status: task.id === 'task-1' ? 'completed' : 'pending',
        progress: task.id === 'task-1' ? 100 : 0,
        startTime: task.id === 'task-1' ? new Date(Date.now() - 3600000) : undefined,
        endTime: task.id === 'task-1' ? new Date(Date.now() - 3000000) : undefined,
        duration: task.id === 'task-1' ? 600000 : undefined
      }))
    );
    setIsSimulating(false);
  };

  // Toggle task status
  const toggleTaskStatus = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          if (task.status === 'running') {
            return { ...task, status: 'paused' };
          } else if (task.status === 'paused') {
            return { ...task, status: 'running' };
          } else if (task.status === 'pending') {
            return { ...task, status: 'running', startTime: new Date() };
          }
        }
        return task;
      })
    );
  };

  // Get status icon
  const getStatusIcon = (status: TaskProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'running':
        return <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'paused':
        return <Pause className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: TaskProgress['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Format duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progress Tracker Demo</h1>
          <p className="text-muted-foreground">Monitor and manage task progress in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={simulateProgress}
            disabled={isSimulating}
            variant="default"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Simulation
              </>
            )}
          </Button>
          <Button onClick={resetTasks} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{metrics.overallProgress}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={metrics.overallProgress} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Tasks</p>
                <p className="text-2xl font-bold">{metrics.completedTasks}/{metrics.totalTasks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Running Tasks</p>
                <p className="text-2xl font-bold">{metrics.runningTasks}</p>
              </div>
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Velocity</p>
                <p className="text-2xl font-bold">{metrics.velocity} tasks/hr</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Task Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Task Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div key={task.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getStatusIcon(task.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">{task.name}</h3>
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Progress value={task.progress} className="h-2" />
                        </div>
                        <span className="text-sm font-medium">{task.progress}%</span>
                      </div>
                      
                      {task.duration && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Duration: {formatDuration(task.duration)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleTaskStatus(task.id)}
                        disabled={task.status === 'completed' || task.status === 'failed'}
                      >
                        {task.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Task Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Task</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Progress</th>
                      <th className="text-left p-2">Start Time</th>
                      <th className="text-left p-2">Duration</th>
                      <th className="text-left p-2">Dependencies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id} className="border-b">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{task.name}</div>
                            <div className="text-muted-foreground text-xs">{task.description}</div>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(task.status)}
                            <Badge variant={getStatusBadgeVariant(task.status)}>
                              {task.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <Progress value={task.progress} className="w-20 h-2" />
                            <span>{task.progress}%</span>
                          </div>
                        </td>
                        <td className="p-2">
                          {task.startTime ? task.startTime.toLocaleTimeString() : '-'}
                        </td>
                        <td className="p-2">
                          {task.duration ? formatDuration(task.duration) : 
                           task.startTime && task.status === 'running' ? 
                           formatDuration(Date.now() - task.startTime.getTime()) : '-'}
                        </td>
                        <td className="p-2">
                          {task.dependencies ? task.dependencies.join(', ') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Average Task Duration</span>
                  <span className="font-mono">
                    {tasks.filter(t => t.duration).length > 0
                      ? formatDuration(
                          tasks.filter(t => t.duration).reduce((sum, t) => sum + (t.duration || 0), 0) /
                          tasks.filter(t => t.duration).length
                        )
                      : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Estimated Time Remaining</span>
                  <span className="font-mono">
                    {metrics.estimatedTimeRemaining > 0
                      ? formatDuration(metrics.estimatedTimeRemaining)
                      : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Success Rate</span>
                  <span className="font-mono">
                    {metrics.totalTasks > 0
                      ? `${Math.round((metrics.completedTasks / (metrics.completedTasks + metrics.failedTasks)) * 100)}%`
                      : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{task.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {task.status === 'completed' && task.endTime
                            ? `Completed at ${task.endTime.toLocaleTimeString()}`
                            : task.status === 'running' && task.startTime
                            ? `Started at ${task.startTime.toLocaleTimeString()}`
                            : 'Pending'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {isSimulating && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Simulation is running. Tasks will progress automatically and advance through the pipeline.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
