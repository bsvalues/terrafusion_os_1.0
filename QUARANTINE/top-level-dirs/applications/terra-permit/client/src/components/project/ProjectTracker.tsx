import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, Clock, XCircle, CircleSlash, Calendar, PieChart, BarChart, ExternalLink  } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ModuleDetail from './ModuleDetail';
import DependencyGraph from './DependencyGraph';

// Define a Pull Request type
export interface PullRequest {
  id: string;
  title: string;
  status: 'open' | 'closed' | 'merged';
  url?: string;
  date: Date;
}

// Define the project module type
export interface ProjectModule {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned' | 'blocked' | 'skipped';
  progress: number; // 0-100
  createdAt: Date;
  completedAt?: Date;
  tasks: ProjectTask[];
  owner?: string;
  dependencies?: string[];
  pullRequests?: PullRequest[];
}

// Define the task type
export interface ProjectTask {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'planned' | 'blocked' | 'skipped';
  description?: string;
  dependsOn?: string[];
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface ProjectTrackerProps {
  title?: string;
  description?: string;
  modules?: ProjectModule[];
}

export interface ProjectSnapshot {
  timestamp: Date;
  moduleCounts: {
    completed: number;
    inProgress: number;
    planned: number;
    blocked: number;
    skipped: number;
  };
  overallProgress: number;
}

export const ProjectTracker: React.FC<ProjectTrackerProps> = ({
  title = 'PermitsBS Development Tracker',
  description = 'Track the progress of application development',
  modules = []
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [overallProgress, setOverallProgress] = useState(0);
  const [historySnapshots, setHistorySnapshots] = useState<ProjectSnapshot[]>([]);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<ProjectModule | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Calculate overall progress and capture historical snapshots
  useEffect(() => {
    if (modules.length === 0) return;
    
    const completedModules = modules.filter(m => m.status === 'completed').length;
    const inProgressWeight = 0.5;
    const inProgressModules = modules.filter(m => m.status === 'in-progress')
      .reduce((total, current) => total + (current.progress / 100) * inProgressWeight, 0);
    
    const calculatedProgress = ((completedModules + inProgressModules) / modules.length) * 100;
    setOverallProgress(Math.round(calculatedProgress));
    
    // Create a new snapshot of the current state
    const newSnapshot: ProjectSnapshot = {
      timestamp: new Date(),
      moduleCounts: {
        completed: modules.filter(m => m.status === 'completed').length,
        inProgress: modules.filter(m => m.status === 'in-progress').length,
        planned: modules.filter(m => m.status === 'planned').length,
        blocked: modules.filter(m => m.status === 'blocked').length,
        skipped: modules.filter(m => m.status === 'skipped').length,
      },
      overallProgress: Math.round(calculatedProgress)
    };
    
    // In a real app, we would store this in local storage or a database
    // For now, we'll just keep the latest snapshot
    setHistorySnapshots(prev => {
      // Limit snapshots to prevent memory issues
      const updatedSnapshots = [...prev, newSnapshot].slice(-10);
      return updatedSnapshots;
    });
    
  }, [modules]);

  // Count modules by status
  const getStatusCounts = () => {
    return {
      completed: modules.filter(m => m.status === 'completed').length,
      inProgress: modules.filter(m => m.status === 'in-progress').length,
      planned: modules.filter(m => m.status === 'planned').length,
      blocked: modules.filter(m => m.status === 'blocked').length,
      skipped: modules.filter(m => m.status === 'skipped').length,
    };
  };

  // Filter modules by status if a filter is active
  const getFilteredModules = () => {
    if (!filterStatus) return modules;
    return modules.filter(m => m.status === filterStatus);
  };

  const statusCounts = getStatusCounts();
  
  // Get status icon by status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'planned':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'blocked':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'skipped':
        return <CircleSlash className="h-5 w-5 text-gray-400" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  // Handle module click to open details
  const handleModuleClick = (module: ProjectModule) => {
    setSelectedModule(module);
    setIsDetailOpen(true);
  };
  
  // Handle closing the module detail modal
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription
>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <div>Overall Progress</div>
            <div className="font-bold">{overallProgress}%</div>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-4">
          <motion.div 
            className="bg-green-50 p-2 rounded-md border border-green-100"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-1.5 text-sm font-medium text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <span>Completed</span>
            </div>
            <div className="text-xl font-bold text-green-700 mt-1">
              {statusCounts.completed}
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-blue-50 p-2 rounded-md border border-blue-100"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-1.5 text-sm font-medium text-blue-800">
              <Clock className="h-4 w-4" />
              <span>In Progress</span>
            </div>
            <div className="text-xl font-bold text-blue-700 mt-1">
              {statusCounts.inProgress}
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gray-50 p-2 rounded-md border border-gray-100"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <Clock className="h-4 w-4" />
              <span>Planned</span>
            </div>
            <div className="text-xl font-bold text-gray-700 mt-1">
              {statusCounts.planned}
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-red-50 p-2 rounded-md border border-red-100"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-1.5 text-sm font-medium text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span>Blocked</span>
            </div>
            <div className="text-xl font-bold text-red-700 mt-1">
              {statusCounts.blocked}
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-gray-50 p-2 rounded-md border border-gray-100"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <CircleSlash className="h-4 w-4" />
              <span>Skipped</span>
            </div>
            <div className="text-xl font-bold text-gray-600 mt-1">
              {statusCounts.skipped}
            </div>
          </motion.div>
        </div>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" onClick={() => setActiveTab('overview')}>Overview</TabsTrigger>
            <TabsTrigger value="modules" onClick={() => setActiveTab('modules')}>Modules</TabsTrigger>
            <TabsTrigger value="tasks" onClick={() => setActiveTab('tasks')}>Tasks</TabsTrigger>
            <TabsTrigger value="dependencies" onClick={() => setActiveTab('dependencies')}>Dependencies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="text-sm text-gray-700">
              <p>The PermitsBS application development is tracked across multiple modules and tasks. Each module represents a major feature area or component of the system.</p>
              <p className="mt-2">The overview shows high-level progress across all aspects of the project.</p>
            </div>
            
            {/* Status Filter */}
            <div className="flex flex-wrap gap-2 mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={filterStatus === null ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setFilterStatus(null)}
                    >
                      All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show all modules</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={filterStatus === 'completed' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setFilterStatus('completed')}
                      className="bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 border-green-200"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Completed
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show only completed modules</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={filterStatus === 'in-progress' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setFilterStatus('in-progress')}
                      className="bg-blue-100 text-blue-800 hover:bg-blue-200 hover:text-blue-900 border-blue-200"
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      In Progress
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show only in-progress modules</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={filterStatus === 'planned' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setFilterStatus('planned')}
                      className="bg-gray-100 text-gray-800 hover:bg-gray-200 hover:text-gray-900 border-gray-200"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Planned
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show only planned modules</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={filterStatus === 'blocked' ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setFilterStatus('blocked')}
                      className="bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 border-red-200"
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Blocked
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Show only blocked modules</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Progress History */}
            <div className="space-y-2 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  <span>Progress History</span>
                </h3>
                <Badge variant="outline" className="text-xs">
                  Last {historySnapshots.length} snapshots
                </Badge>
              </div>
              
              <div className="h-24 w-full bg-gray-50 rounded-md p-2 border border-gray-100">
                {historySnapshots.length > 1 ? (
                  <div className="relative h-full w-full">
                    {/* Simple line visualization of progress history */}
                    <div className="flex h-full items-end justify-between">
                      {historySnapshots.map((snapshot /* , index */) => (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <motion.div 
                                className="bg-primary h-full w-5 mx-1 rounded-t-sm opacity-80 hover:opacity-100"
                                style={{ 
                                  height: `${snapshot.overallProgress}%`,
                                  minHeight: '4px'
                                }}
                                initial={{ height: 0 }}
                                animate={{ height: `${snapshot.overallProgress}%` }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                              />
                            </TooltipTrigger>
                            <TooltipContent
>
                              <div className="text-xs">
                                <p className="font-medium">{snapshot.timestamp.toLocaleString()}</p>
                                <p
>Progress: {snapshot.overallProgress}%</p>
                                <p>Completed: {snapshot.moduleCounts.completed}</p>
                                <p
>In Progress: {snapshot.moduleCounts.inProgress}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                    <p>Not enough history data yet</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Recent Completions */}
            <div className="space-y-4 mt-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Recent Completions</span>
              </h3>
              
              <div className="divide-y rounded-md border border-gray-100 bg-white overflow-hidden">
                {modules
                  .filter(m => m.status === 'completed')
                  .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
                  .slice(0, 3)
                  .map(module => (
                    <motion.div 
                      key={module.id} 
                      className="p-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="font-medium">{module.name}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 ml-6 mt-1">
                        <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                        {module.completedAt?.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 ml-6 mt-1">
                        {module.tasks.filter(t => t.status === 'completed').length} of {module.tasks.length} tasks completed
                      </div>
                    </motion.div>
                  ))}
                  
                {modules.filter(m => m.status === 'completed').length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No completed modules yet
                  </div>
                )}
              </div>
            </div>
            
            {/* In Progress */}
            <div className="space-y-4 mt-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Currently In Progress</span>
              </h3>
              
              <div className="divide-y rounded-md border border-gray-100 bg-white overflow-hidden">
                {modules
                  .filter(m => m.status === 'in-progress')
                  .sort((a, b) => b.progress - a.progress)
                  .slice(0, 3)
                  .map(module => (
                    <motion.div 
                      key={module.id} 
                      className="p-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="font-medium">{module.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {module.progress}%
                        </Badge>
                      </div>
                      <div className="ml-6 mt-2">
                        <Progress value={module.progress} className="h-1" />
                      </div>
                      <div className="text-xs text-gray-500 ml-6 mt-1">
                        {module.tasks.filter(t => t.status === 'completed').length} of {module.tasks.length} tasks completed
                      </div>
                    </motion.div>
                  ))}
                  
                {modules.filter(m => m.status === 'in-progress').length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No modules currently in progress
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="modules" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">
                {filterStatus 
                  ? `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Modules` 
                  : 'All Modules'}
              </h3>
              
              <div className="flex gap-2">
                <Badge variant="outline">
                  {getFilteredModules().length} module{getFilteredModules().length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
            
            <div className="divide-y rounded-md border border-gray-100 overflow-hidden bg-white">
              {getFilteredModules().length > 0 ? getFilteredModules().map(module => (
                <motion.div 
                  key={module.id} 
                  className="p-4 cursor-pointer"
                  onClick={() => handleModuleClick(module)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(module.status)}
                      <span className="font-medium">{module.name}</span>
                      
                      <Badge variant="outline" 
                        className={`ml-2 ${
                          module.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                          module.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          module.status === 'blocked' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {module.status}
                      </Badge>
                    </div>
                    
                    {module.status === 'in-progress' && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {module.progress}%
                      </Badge>
                    )}
                    
                    {module.status === 'completed' && module.completedAt && (
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        {module.completedAt.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  
                  {module.status === 'in-progress' && (
                    <div className="mt-2">
                      <Progress value={module.progress} className="h-1" />
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    {module.description}
                  </div>
                  
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-700 mb-2">Tasks</div>
                    <div className="grid grid-cols-1 gap-1">
                      {module.tasks.map(task => (
                        <div 
                          key={task.id} 
                          className={`text-xs p-1.5 rounded flex items-center gap-1.5 ${
                            task.status === 'completed' ? 'bg-green-50 text-green-700' : 
                            task.status === 'in-progress' ? 'bg-blue-50 text-blue-700' :
                            task.status === 'blocked' ? 'bg-red-50 text-red-700' :
                            'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {getStatusIcon(task.status)}
                          <span>{task.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="p-6 text-center text-gray-500">
                  <div className="mb-2">
                    <CircleSlash className="h-6 w-6 mx-auto text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium mb-1">No modules found</h3>
                  <p className="text-xs text-gray-400">
                    {filterStatus 
                      ? `There are no modules with '${filterStatus}' status.` 
                      : "No modules available."}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="tasks" className="space-y-4 mt-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4 mb-4">
              <div className="bg-white rounded-md border border-gray-100 p-3 col-span-1">
                <h3 className="text-sm font-medium mb-3">Filter Tasks</h3>
                
                <div className="space-y-2">
                  <Button 
                    variant={filterStatus === null ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setFilterStatus(null)}
                    className="w-full justify-start"
                  >
                    <span className="mr-2">All</span>
                    <Badge variant="outline" className="ml-auto">
                      {modules.flatMap(m => m.tasks).length}
                    </Badge>
                  </Button>
                  
                  <Button 
                    variant={filterStatus === 'completed' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setFilterStatus('completed')}
                    className="w-full justify-start bg-green-50 text-green-800 hover:bg-green-100 hover:text-green-900 border-green-100"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <span>Completed</span>
                    <Badge variant="outline" className="ml-auto border-green-200 text-green-700">
                      {modules.flatMap(m => m.tasks).filter(t => t.status === 'completed').length}
                    </Badge>
                  </Button>
                  
                  <Button 
                    variant={filterStatus === 'in-progress' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setFilterStatus('in-progress')}
                    className="w-full justify-start bg-blue-50 text-blue-800 hover:bg-blue-100 hover:text-blue-900 border-blue-100"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    <span>In Progress</span>
                    <Badge variant="outline" className="ml-auto border-blue-200 text-blue-700">
                      {modules.flatMap(m => m.tasks).filter(t => t.status === 'in-progress').length}
                    </Badge>
                  </Button>
                  
                  <Button 
                    variant={filterStatus === 'planned' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setFilterStatus('planned')}
                    className="w-full justify-start bg-gray-50 text-gray-800 hover:bg-gray-100 hover:text-gray-900 border-gray-100"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Planned</span>
                    <Badge variant="outline" className="ml-auto">
                      {modules.flatMap(m => m.tasks).filter(t => t.status === 'planned').length}
                    </Badge>
                  </Button>
                  
                  <Button 
                    variant={filterStatus === 'blocked' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setFilterStatus('blocked')}
                    className="w-full justify-start bg-red-50 text-red-800 hover:bg-red-100 hover:text-red-900 border-red-100"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>Blocked</span>
                    <Badge variant="outline" className="ml-auto border-red-200 text-red-700">
                      {modules.flatMap(m => m.tasks).filter(t => t.status === 'blocked').length}
                    </Badge>
                  </Button>
                </div>
              </div>
              
              <div className="bg-white rounded-md border border-gray-100 col-span-1 md:col-span-3 overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-sm font-medium">
                    {filterStatus 
                      ? `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Tasks` 
                      : 'All Tasks'}
                  </h3>
                </div>
                
                <div className="divide-y max-h-[400px] overflow-y-auto p-1">
                  {modules.flatMap(module => 
                    module.tasks
                      .filter(task => !filterStatus || task.status === filterStatus)
                      .map(task => (
                        <motion.div 
                          key={`${module.id}-${task.id}`} 
                          className="p-3 cursor-pointer"
                          onClick={() => handleModuleClick(module)}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                              {getStatusIcon(task.status)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{task.name}</div>
                                <Badge variant="outline" 
                                  className={`${
                                    task.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 
                                    task.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    task.status === 'blocked' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-gray-50 text-gray-700 border-gray-200'
                                  }`}
                                >
                                  {task.status}
                                </Badge>
                              </div>
                              
                              {task.description && (
                                <div className="text-sm text-gray-500 mt-1">
                                  {task.description}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 mt-2">
                                <div className="text-xs inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                                  <span>{module.name}</span>
                                </div>
                                
                                {task.dependsOn && task.dependsOn.length > 0 && (
                                  <div className="text-xs text-gray-500">
                                    Depends on: {task.dependsOn.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                  )}
                  
                  {modules.flatMap(module => 
                    module.tasks.filter(task => !filterStatus || task.status === filterStatus)
                  ).length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      <div className="mb-2">
                        <CircleSlash className="h-6 w-6 mx-auto text-gray-400" />
                      </div>
                      <h3 className="text-sm font-medium mb-1">No tasks found</h3>
                      <p className="text-xs text-gray-400">
                        {filterStatus 
                          ? `There are no tasks with '${filterStatus}' status.` 
                          : "No tasks available."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="dependencies" className="space-y-4 mt-4">
            <DependencyGraph 
              modules={modules} 
              onModuleClick={handleModuleClick}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        Last updated: {new Date().toLocaleString()}
      </CardFooter>
      
      {/* Module Detail Modal */}
      <ModuleDetail
        module={selectedModule}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </Card>
  );
};

export default ProjectTracker;