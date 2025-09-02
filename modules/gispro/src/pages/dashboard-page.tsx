import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Workflow, WorkflowEvent, ChecklistItem, User, Document } from "@shared/schema";
import { DocumentType } from "@shared/document-types";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, LineChart, Line, AreaChart, Area } from "recharts";
import { ClipboardCheck, 
  Clock, 
  Activity, 
  Zap, 
  Warning, 
  CheckCircle, 
  PieChart as PieChartIcon, 
  BarChart2, 
  Map, 
  FileCheck, 
  Check,
  ArrowRight,
  XCircle,
  Clock4,
  CheckSquare,
  Pin,
  Eye,
  Edit,
  File,
  FileText,
  Search,
  Refresh,
  LineChart as LineChartIcon,
  Calendar,
  Hourglass,
  Users,
  User as UserIcon,
  FileDigit,
  BarChartHorizontal,
  Layers,
  Timer
 } from '@mui/icons-material';
import { workflowTypeLabels, workflowTypeIcons, WorkflowType, workflowSteps } from "@/lib/workflow-types";
import { getQueryFn } from "@/lib/queryClient";
import { format, formatDistance, formatRelative, subDays, addDays, addHours, isAfter, isBefore, differenceInDays } from "date-fns";

// Custom component for status indicators
const StatusDot = ({ status }: { status: string | null | undefined }) => {
  const getStatusColor = () => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-blue-500";
      case "review": return "bg-yellow-500";
      case "draft": return "bg-gray-400";
      case "archived": return "bg-neutral-300";
      default: return "bg-gray-400";
    }
  };

  return (
    <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor()} mr-2`} />
  );
};

// User stats summary component
const UserStatsSummary = ({ user, workflowStats }: { user: User | null, workflowStats: any }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><>

              <p className="text-sm font-medium text-muted-foreground">Total Workflows</p>
              <h3
</>
className="text-2xl font-bold mt-1">{workflowStats.total || 0}</h3>
            </div>
            <div className="bg-primary/10 p-2 rounded-full">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><>

              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <h3
</>
className="text-2xl font-bold mt-1">{workflowStats.inProgress || 0}</h3>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><>

              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <h3
</>
className="text-2xl font-bold mt-1">{workflowStats.completed || 0}</h3>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div><>

              <p className="text-sm font-medium text-muted-foreground">High Priority</p>
              <h3
</>
className="text-2xl font-bold mt-1">{workflowStats.highPriority || 0}</h3>
            </div>
            <div className="bg-amber-100 p-2 rounded-full">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Workflow Status Distribution Chart
const WorkflowStatusChart = ({ workflows }: { workflows: Workflow[] }) => {
  // Count workflows by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      draft: 0,
      in_progress: 0,
      review: 0,
      completed: 0,
      archived: 0,
    };
    
    workflows.forEach(workflow => {
      if (workflow.status) {
        counts[workflow.status] += 1;
      } else {
        counts['draft'] += 1;
      }
    });
    
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count
    }));
  }, [workflows]);

  const COLORS = ['#9CA3AF', '#3B82F6', '#F59E0B', '#10B981', '#6B7280'];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2"><>

        <CardTitle className="text-lg">Workflow Status Distribution</CardTitle>
        <CardDescription
</>
</>>
          Overview of your workflows by status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusCounts}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {statusCounts.map((entry /* , index */) => (<>

                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
</>
formatter={(value: number) => [value, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Workflow Type Distribution Chart
const WorkflowTypeChart = ({ workflows }: { workflows: Workflow[] }) => {
  // Count workflows by type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    workflows.forEach(workflow => {
      if (!counts[workflow.type]) {
        counts[workflow.type] = 0;
      }
      counts[workflow.type] += 1;
    });
    
    return Object.entries(counts).map(([type, count]) => ({
      name: workflowTypeLabels[type as WorkflowType] || type,
      value: count
    }));
  }, [workflows]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2"><>

        <CardTitle className="text-lg">Workflow Type Distribution</CardTitle>
        <CardDescription
</>
</>>
          Breakdown by workflow type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              width={500}
              height={300}
              data={typeCounts}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Priority Tasks component
const PriorityTasks = ({ workflows, checklists }: { workflows: Workflow[], checklists: ChecklistItem[] }) => {
  const [, navigate] = useLocation();
  // Get high priority workflows and their pending checklist items
  const priorityTasks = useMemo(() => {
    const highPriorityWorkflows = workflows.filter(w => w.priority === 'high' && w.status !== 'completed');
    
    // Match checklist items to workflows and filter for incomplete items
    return highPriorityWorkflows.flatMap(workflow => {
      const workflowChecklists = checklists.filter(
        c => c.workflowId === workflow.id && !c.completed
      ).slice(0, 2); // Get up to 2 incomplete checklist items per workflow
      
      return workflowChecklists.map(item => ({
        workflowId: workflow.id,
        workflowTitle: workflow.title,
        workflowType: workflow.type,
        itemTitle: item.title,
        itemId: item.id,
        priority: workflow.priority
      }));
    }).slice(0, 5); // Limit to 5 items total
  }, [workflows, checklists]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div><>

            <CardTitle className="text-lg">Priority Tasks</CardTitle>
            <CardDescription
</>
</>>
              Your high priority incomplete tasks
            </CardDescription>
          </div>
          <Badge variant="destructive" className="gap-1">
            <Warning className="h-3 w-3" /> High Priority
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {priorityTasks.length > 0 ? (
          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-4">
              {priorityTasks.map((task /* , index */) => (
                <div key={`${task.workflowId}-${task.itemId}`} className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-full h-8 w-8 flex items-center justify-center mt-0.5"><>

                    <Pin className="h-4 w-4 text-red-600" />
                  </div>
                  <div
</>
className="flex-1">
                    <div className="flex justify-between"><>

                      <h4 className="text-sm font-medium">{task.itemTitle}</h4>
                      <Badge
</>
variant="outline" className="text-xs">
                        {workflowTypeLabels[task.workflowType as WorkflowType]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      From: {task.workflowTitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px] text-center">
            <CheckCircle className="h-12 w-12 text-green-100 mb-3" /><>

            <h3 className="text-base font-medium text-neutral-600">No Priority Tasks</h3>
            <p
</>
className="text-sm text-muted-foreground mt-1">
              You're all caught up with high priority items!
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" className="w-full" onClick={() => navigate("/workflow-dashboard")}>
          View All Tasks
        </Button>
      </CardFooter>
    </Card>
  );
};

// User Efficiency Metrics component (NEW)
const UserEfficiencyMetrics = ({ workflows, events }: { workflows: Workflow[], events: WorkflowEvent[] }) => {
  const completionTrendData = useMemo(() => {
    // Generate data for the last 7 days
    const result = [];
    const now = new Date();
    
    // Get completed workflow events
    const completedEvents = events.filter(event => 
      event.eventType === 'status_changed' && 
      event.description.includes('completed')
    );
    
    // Count completed workflows by day for the past week
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const formattedDate = format(date, 'MMM dd');
      
      // Count completed on this day
      const completedCount = completedEvents.filter(event => {
        const eventDate = new Date(event.createdAt);
        return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      }).length;
      
      result.push({
        date: formattedDate,
        completed: completedCount
      });
    }
    
    return result;
  }, [events]);
  
  // Calculate average completion time in days
  const averageCompletionTime = useMemo(() => {
    // Get completed workflows with creation events
    const completedWorkflows = workflows.filter(w => w.status === 'completed');
    
    if (completedWorkflows.length === 0) {
      return 0;
    }
    
    // Calculate total completion time
    let totalCompletionDays = 0;
    let countedWorkflows = 0;
    
    completedWorkflows.forEach(workflow => {
      // Find creation event
      const creationEvent = events.find(
        e => e.workflowId === workflow.id && e.eventType === 'created'
      );
      
      // Find completion event
      const completionEvent = events.find(
        e => e.workflowId === workflow.id && e.eventType === 'status_changed' && e.description.includes('completed')
      );
      
      if (creationEvent && completionEvent) {
        const startDate = new Date(creationEvent.createdAt);
        const endDate = new Date(completionEvent.createdAt);
        const days = differenceInDays(endDate, startDate);
        
        // Only count reasonable values (0 or more days)
        if (days >= 0) {
          totalCompletionDays += days;
          countedWorkflows++;
        }
      }
    });
    
    return countedWorkflows > 0 ? Math.round(totalCompletionDays / countedWorkflows) : 0;
  }, [workflows, events]);
  
  // Weekly completion rate
  const weeklyCompletionRate = useMemo(() => {
    const totalCompletedThisWeek = completionTrendData.reduce((sum, day) => sum + day.completed, 0);
    return totalCompletedThisWeek;
  }, [completionTrendData]);
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div><>

            <CardTitle className="text-lg">Your Efficiency Metrics</CardTitle>
            <CardDescription
</>
</>>
              Personalized workflow completion insights
            </CardDescription>
          </div>
          <div className="bg-indigo-100 p-2 rounded-full">
            <LineChartIcon className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Avg. Completion Time</span>
            </div>
            <div className="mt-2 flex items-end gap-1"><>

              <span className="text-2xl font-bold text-blue-700">{averageCompletionTime}</span>
              <span
</>
className="text-sm text-blue-600 mb-0.5">days</span>
            </div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Weekly Completions</span>
            </div>
            <div className="mt-2 flex items-end gap-1"><>

              <span className="text-2xl font-bold text-green-700">{weeklyCompletionRate}</span>
              <span
</>
className="text-sm text-green-600 mb-0.5">workflows</span>
            </div>
          </div>
        </div>
        
        <div className="h-[180px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={completionTrendData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: number) => [`${value} completed`, 'Workflows']} />
              <Area 
                type="monotone" 
                dataKey="completed" 
                name="Completed Workflows" 
                stroke="#4f46e5" 
                fill="#c7d2fe" 
                activeDot={{ r: 6 }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Document Classification Summary (NEW)
const DocumentClassificationSummary = ({ documents }: { documents: Document[] }) => {
  // Organize documents by type and count
  const documentTypeData = useMemo(() => {
    const typeCount: Record<string, number> = {};
    
    documents.forEach(doc => {
      const docType = doc.type || DocumentType.UNCLASSIFIED;
      if (!typeCount[docType]) {
        typeCount[docType] = 0;
      }
      typeCount[docType]++;
    });
    
    // Convert to array format for chart
    return Object.entries(typeCount).map(([type, count]) => ({
      name: type.replace(/_/g, ' '),
      value: count
    }));
  }, [documents]);
  
  // Calculate classification percentage
  const classificationStats = useMemo(() => {
    if (documents.length === 0) {
      return {
        classified: 0,
        unclassified: 0,
        percentage: 0
      };
    }
    
    const classified = documents.filter(doc => doc.type !== DocumentType.UNCLASSIFIED).length;
    const unclassified = documents.length - classified;
    const percentage = Math.round((classified / documents.length) * 100);
    
    return {
      classified,
      unclassified,
      percentage
    };
  }, [documents]);
  
  // Document type colors
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div><>

            <CardTitle className="text-lg">Document Classification</CardTitle>
            <CardDescription
</>
</>>
              Breakdown of your document library
            </CardDescription>
          </div>
          <div className="bg-purple-100 p-2 rounded-full">
            <FileDigit className="h-5 w-5 text-purple-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2"><>

                <span className="text-sm font-medium">Classification Progress</span>
                <span
</>
className="text-sm text-muted-foreground">{classificationStats.percentage}%</span>
              </div>
              <Progress value={classificationStats.percentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1"><>

                <span>{classificationStats.classified} classified</span>
                <span
</>
</>>{classificationStats.unclassified} unclassified</span>
              </div>
            </div>
            
            <div className="h-[180px] mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={documentTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {documentTypeData.map((entry /* , index */) => (<>

                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
</>
formatter={(value) => [`${value} documents`, 'Documents']} />
                  <Legend formatter={(value) => value} />
                </PieChart>
              </ResponsiveContainer>
            </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px] text-center">
            <File className="h-12 w-12 text-gray-100 mb-3" /><>

            <h3 className="text-base font-medium text-neutral-600">No Documents</h3>
            <p
</>
className="text-sm text-muted-foreground mt-1">
              Your document library is empty
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Recent Activity component
const RecentActivity = ({ events }: { events: WorkflowEvent[] }) => {
  const [, navigate] = useLocation();
  // Get most recent events
  const recentEvents = useMemo(() => {
    // Sort events by createdAt descending and take the 5 most recent
    return [...events]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [events]);

  // Icon mapping for event types
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return <FileCheck className="h-4 w-4 text-green-600" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'status_changed':
        return <CheckSquare className="h-4 w-4 text-purple-600" />;
      case 'priority_changed':
        return <Warning className="h-4 w-4 text-amber-600" />;
      case 'document_added':
        return <FileText className="h-4 w-4 text-indigo-600" />;
      case 'parcel_added':
        return <Map className="h-4 w-4 text-emerald-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2"><>

        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <CardDescription
</>
</>>
          Latest updates on your workflows
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentEvents.length > 0 ? (
          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3"><>

                  <div className="bg-blue-50 p-2 rounded-full h-8 w-8 flex items-center justify-center mt-0.5">
                    {getEventIcon(event.eventType)}
                  </div>
                  <div
</>
className="flex-1"><>

                    <p className="text-sm font-medium">{event.description}</p>
                    <div
</>
className="flex justify-between items-center mt-1"><>

                      <span className="text-xs text-muted-foreground">
                        {formatDistance(new Date(event.createdAt), new Date(), { addSuffix: true })}
                      </span>
                      <Badge
</>
variant="outline" className="text-xs">
                        {event.eventType.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px] text-center">
            <Clock4 className="h-12 w-12 text-gray-100 mb-3" /><>

            <h3 className="text-base font-medium text-neutral-600">No Recent Activity</h3>
            <p
</>
className="text-sm text-muted-foreground mt-1">
              Your activity feed will appear here
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" className="w-full" onClick={() => navigate("/workflow-dashboard")}>
          View All Activity
        </Button>
      </CardFooter>
    </Card>
  );
};

// Define WorkflowState type
type WorkflowState = {
  id: number;
  workflowId: number;
  currentStep: number | null;
  formData: any;
  updatedAt: Date | null;
};

// Workflow Progress component
const WorkflowProgress = ({ workflows, states }: { workflows: Workflow[], states: WorkflowState[] }) => {
  // Calculate progress for in-progress workflows
  const inProgressWorkflows = useMemo(() => {
    return workflows
      .filter(w => w.status === 'in_progress')
      .map(workflow => {
        const state = states.find(s => s.workflowId === workflow.id);
        const workflowType = workflow.type as WorkflowType;
        const steps = workflowSteps[workflowType] || [];
        
        let progress = 0;
        if (state?.currentStep && steps.length > 0) {
          progress = Math.round((state.currentStep / steps.length) * 100);
        }
        
        return {
          ...workflow,
          progress,
          currentStep: state?.currentStep || 1,
          totalSteps: steps.length
        };
      })
      .sort((a, b) => (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0))
      .slice(0, 5);
  }, [workflows, states]);

  const [, navigate] = useLocation();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2"><>

        <CardTitle className="text-lg">Workflow Progress</CardTitle>
        <CardDescription
</>
</>>
          Track your active workflows
        </CardDescription>
      </CardHeader>
      <CardContent>
        {inProgressWorkflows.length > 0 ? (
          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-5">
              {inProgressWorkflows.map((workflow) => (
                <div key={workflow.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <StatusDot status={workflow.status} />
                      <h4 className="text-sm font-medium truncate max-w-[200px]">{workflow.title}</h4>
                    </div>
                    <Badge variant={workflow.priority === 'high' ? 'destructive' : 'outline'} className="text-xs">
                      {workflow.priority}
                    </Badge>
                  </div>
                  <Progress value={workflow.progress} className="h-2" />
                  <div className="flex justify-between items-center text-xs text-muted-foreground"><>

                    <span>
                      Step {workflow.currentStep} of {workflow.totalSteps}
                    </span>
                    <span
</>
</>>{workflow.progress}% complete</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px] text-center">
            <Activity className="h-12 w-12 text-gray-100 mb-3" /><>

            <h3 className="text-base font-medium text-neutral-600">No Active Workflows</h3>
            <p
</>
className="text-sm text-muted-foreground mt-1">
              Start a workflow to track progress here
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" className="w-full" onClick={() => navigate("/workflow-dashboard")}>
          View All Workflows
        </Button>
      </CardFooter>
    </Card>
  );
};

// Task Breakdown component (NEW)
const TaskBreakdown = ({ workflows }: { workflows: Workflow[] }) => {
  // Calculate personal vs team task distribution
  const taskDistribution = useMemo(() => {
    // In a real application, this would compare against the logged-in user ID
    // Since we're using demo data, we'll simulate this by assuming userId 2 is the current user
    const currentUserId = 2;
    
    // Count personal and team tasks (workflows)
    const personal = workflows.filter(w => w.userId === currentUserId).length;
    const team = workflows.filter(w => w.userId !== currentUserId).length;
    
    return [
      { name: 'Personal', value: personal },
      { name: 'Team', value: team }
    ];
  }, [workflows]);
  
  const COLORS = ['#3b82f6', '#8b5cf6'];
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div><>

            <CardTitle className="text-lg">Task Distribution</CardTitle>
            <CardDescription
</>
</>>
              Personal vs. team workload
            </CardDescription>
          </div>
          <div className="bg-blue-100 p-2 rounded-full">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] flex flex-col justify-center">
          {taskDistribution.some(item => item.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {taskDistribution.map((entry /* , index */) => (<>

                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
</>
formatter={(value: number) => [`${value} tasks`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <UserIcon className="h-12 w-12 text-gray-100 mb-3" /><>

              <h3 className="text-base font-medium text-neutral-600">No Tasks Assigned</h3>
              <p
</>
className="text-sm text-muted-foreground mt-1">
                Tasks will appear here once assigned
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Upcoming Deadlines component (NEW)
const UpcomingDeadlines = ({ workflows }: { workflows: Workflow[] }) => {
  const [, navigate] = useLocation();
  // Generate mock deadlines based on workflow data
  // In a real application, these would come from actual deadline fields in the database
  const deadlines = useMemo(() => {
    // Create simulated deadlines for in-progress workflows
    const now = new Date();
    return workflows
      .filter(w => w.status === 'in_progress')
      .map(workflow => {
        // Simulate deadlines based on priority
        let deadline;
        if (workflow.priority === 'high') {
          deadline = addDays(now, Math.floor(Math.random() * 3) + 1); // 1-3 days
        } else if (workflow.priority === 'medium') {
          deadline = addDays(now, Math.floor(Math.random() * 7) + 3); // 3-10 days
        } else {
          deadline = addDays(now, Math.floor(Math.random() * 14) + 7); // 7-21 days
        }
        
        return {
          workflowId: workflow.id,
          workflowTitle: workflow.title,
          workflowType: workflow.type,
          deadline,
          priority: workflow.priority,
          daysRemaining: differenceInDays(deadline, now)
        };
      })
      // Sort by closest deadline first
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5); // Limit to 5 items
  }, [workflows]);
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div><>

            <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
            <CardDescription
</>
</>>
              Tasks requiring your attention soon
            </CardDescription>
          </div>
          <div className="bg-amber-100 p-2 rounded-full">
            <Calendar className="h-5 w-5 text-amber-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {deadlines.length > 0 ? (
          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-4">
              {deadlines.map((item) => (
                <div key={item.workflowId} className="flex items-start gap-3">
                  <div className={`p-2 rounded-full h-8 w-8 flex items-center justify-center mt-0.5 ${
                    item.daysRemaining <= 2 ? 'bg-red-100' : 
                    item.daysRemaining <= 5 ? 'bg-amber-100' : 'bg-blue-100'
                  }`}><>

                    <Hourglass className={`h-4 w-4 ${
                      item.daysRemaining <= 2 ? 'text-red-600' : 
                      item.daysRemaining <= 5 ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div
</>
className="flex-1"><>

                    <h4 className="text-sm font-medium truncate max-w-[200px]">{item.workflowTitle}</h4>
                    <div
</>
className="flex justify-between items-center mt-1"><>

                      <span className="text-xs text-muted-foreground">
                        Due {format(item.deadline, 'MMM d')}
                      </span>
                      <Badge
</>

                        variant={
                          item.daysRemaining <= 2 ? 'destructive' : 
                          item.daysRemaining <= 5 ? 'default' : 'outline'
                        } 
                        className="text-xs"
                      >
                        {item.daysRemaining === 0 ? 'Today' : 
                         item.daysRemaining === 1 ? 'Tomorrow' : 
                         `${item.daysRemaining} days`}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px] text-center">
            <Calendar className="h-12 w-12 text-gray-100 mb-3" /><>

            <h3 className="text-base font-medium text-neutral-600">No Upcoming Deadlines</h3>
            <p
</>
className="text-sm text-muted-foreground mt-1">
              You're all caught up!
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" className="w-full" onClick={() => navigate("/workflow-dashboard")}>
          View All Workflows
        </Button>
      </CardFooter>
    </Card>
  );
};

// Quick Actions component
const QuickActions = () => {
  const [, navigate] = useLocation();
  
  const quickActions = [
    { 
      name: "New Long Plat", 
      description: "Start a long plat process", 
      icon: <Map className="h-5 w-5 text-blue-600" />,
      action: () => navigate("/workflow/long_plat")
    },
    { 
      name: "View Map", 
      description: "Open interactive GIS map", 
      icon: <Eye className="h-5 w-5 text-green-600" />,
      action: () => navigate("/map-viewer")
    },
    { 
      name: "Property Search", 
      description: "Search parcels and records", 
      icon: <Search className="h-5 w-5 text-amber-600" />,
      action: () => navigate("/property-search")
    },
    { 
      name: "Generate Report", 
      description: "Create a new SM00 report", 
      icon: <FileText className="h-5 w-5 text-purple-600" />,
      action: () => navigate("/report")
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2"><>

        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription
</>
</>>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="h-auto py-4 px-4 justify-start flex items-center gap-3"
              onClick={action.action}
            ><>

              <div className="bg-primary/10 p-2 rounded-full">
                {action.icon}
              </div>
              <div
</>
className="text-left"><>

                <h4 className="text-sm font-medium">{action.name}</h4>
                <p
</>
className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Page
export default function DashboardPage() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeTab, setActiveTab] = useState("overview"); // Default tab
  
  // Get user information
  const { data: user, isLoading: isUserLoading } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch workflows
  const { data: workflows, isLoading: isWorkflowsLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
    enabled: !!user,
  });
  
  // Fetch workflow states
  const { data: workflowStates, isLoading: isStatesLoading } = useQuery<WorkflowState[]>({
    queryKey: ["/api/workflow-states"],
    enabled: !!user,
  });
  
  // Fetch workflow events
  const { data: workflowEvents, isLoading: isEventsLoading } = useQuery<WorkflowEvent[]>({
    queryKey: ["/api/workflow-events"],
    enabled: !!user,
  });
  
  // Fetch checklist items
  const { data: checklistItems, isLoading: isChecklistLoading } = useQuery<ChecklistItem[]>({
    queryKey: ["/api/checklist-items"],
    enabled: !!user,
  });
  
  // Fetch documents
  const { data: documents, isLoading: isDocumentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    enabled: !!user,
  });

  // Calculate workflow statistics
  const workflowStats = useMemo(() => {
    if (!workflows) return {
      total: 0,
      inProgress: 0,
      completed: 0,
      highPriority: 0
    };
    
    return {
      total: workflows.length,
      inProgress: workflows.filter(w => w.status === 'in_progress').length,
      completed: workflows.filter(w => w.status === 'completed').length,
      highPriority: workflows.filter(w => w.priority === 'high').length
    };
  }, [workflows]);

  // Set notification count based on number of workflows with recent updates
  useEffect(() => {
    if (workflows && workflows.length > 0) {
      // Count in-progress workflows as notifications
      const inProgressCount = workflows.filter(w => w.status === 'in_progress').length;
      setNotificationCount(inProgressCount > 0 ? inProgressCount : 0);
    } else {
      setNotificationCount(0);
    }
  }, [workflows]);

  const isLoading = isUserLoading || isWorkflowsLoading || isStatesLoading || 
                    isEventsLoading || isChecklistLoading || isDocumentsLoading;

  return (
    <div className="flex flex-col h-screen">
      <Header notificationCount={notificationCount} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-auto bg-neutral-50 p-6">
          {/* User Welcome Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <div><>

                <h1 className="text-2xl font-bold text-neutral-800 mb-1">
                  Dashboard
                </h1>
                <p
</>
className="text-neutral-600">
                  Welcome back, {isUserLoading ? 'Loading...' : ((user as any)?.fullName || user?.username || 'User')}
                </p>
              </div>
              <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
                <Refresh className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2"><>

              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger
</>
value="personal">Personal Insights</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {Array(4).fill(0).map((_, i) => (<>

                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
              
              <div
</>
className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {Array(2).fill(0).map((_, i) => (<>

                  <Skeleton key={i} className="h-96 w-full" />
                ))}
              </div>
              
              <div
</>
className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-80 w-full" />
                ))}
              </div>
            </div>
          ) : (
              {/* Stats Cards (common to both tabs) */}
              <UserStatsSummary user={user || null} workflowStats={workflowStats} />
              
              <TabsContent value="overview" className="mt-0">
                {/* Standard Overview Tab Content */}
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <WorkflowStatusChart workflows={workflows || []} />
                  <WorkflowTypeChart workflows={workflows || []} />
                </div>
                
                {/* Insights Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <WorkflowProgress 
                    workflows={workflows || []} 
                    states={workflowStates || []} 
                  />
                  <PriorityTasks 
                    workflows={workflows || []} 
                    checklists={checklistItems || []}
                  />
                  <RecentActivity events={workflowEvents || []} />
                </div>
                
                {/* Quick Actions */}<>

                <QuickActions />
              </TabsContent>
              
              <TabsContent
</>
value="personal" className="mt-0">
                {/* Personalized Insights Tab Content */}
                {/* Personal Metrics Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <UserEfficiencyMetrics 
                    workflows={workflows || []} 
                    events={workflowEvents || []} 
                  />
                  <DocumentClassificationSummary documents={documents || []} />
                </div>
                
                {/* Personal Task Management Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <TaskBreakdown workflows={workflows || []} />
                  <UpcomingDeadlines workflows={workflows || []} />
                  <PriorityTasks 
                    workflows={workflows || []} 
                    checklists={checklistItems || []}
                  />
                </div>
                
                {/* Quick Actions */}
                <QuickActions />
              </TabsContent>
          )}
        </main>
      </div>
    </div>
  );
}