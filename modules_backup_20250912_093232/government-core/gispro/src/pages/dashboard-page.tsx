import {useState, useEffect, useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useLocation} from 'wouter';
import {Workflow, WorkflowEvent, ChecklistItem, User, Document} from '@shared/schema';
import {DocumentType} from '@shared/document-types';
import {Header} from '@/components/layout/header';
import {Sidebar} from '@/components/layout/sidebar';
import {Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,} from '@/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {ScrollArea} from '@/components/ui/scroll-area';
import {PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,} from 'recharts';
import {ClipboardCheck,
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
  Timer,} from '@mui/icons-material';
import {workflowTypeLabels,
  workflowTypeIcons,
  WorkflowType,
  workflowSteps,} from '@/lib/workflow-types';
import {getQueryFn} from '@/lib/queryClient';
import {format,
  formatDistance,
  formatRelative,
  subDays,
  addDays,
  addHours,
  isAfter,
  isBefore,
  differenceInDays,} from 'date-fns';

// Custom component for status indicators
const StatusDot = ({status}: {status: string | null | undefined}) =>{const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'review':
        return 'bg-yellow-500';
      case 'draft':
        return 'bg-gray-400';
      case 'archived':
        return 'bg-neutral-300';
      default:
        return 'bg-gray-400';}
  };

  return<span className={`inline-block w-2 h-2 rounded-full ${getStatusColor()} mr-2`} />;
};

// User stats summary component
const UserStatsSummary = ({user, workflowStats}: {user: User | null; workflowStats: any}) =>{
  return (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"><Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total Workflows</p><h3 className="text-2xl font-bold mt-1">{workflowStats.total || 0}</h3></div><div className="bg-primary/10 p-2 rounded-full"><ClipboardCheck className="h-5 w-5 text-primary" /></div></div></CardContent></Card><Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">In Progress</p><h3 className="text-2xl font-bold mt-1">{workflowStats.inProgress || 0}</h3></div><div className="bg-blue-100 p-2 rounded-full"><Clock className="h-5 w-5 text-blue-600" /></div></div></CardContent></Card><Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Completed</p><h3 className="text-2xl font-bold mt-1">{workflowStats.completed || 0}</h3></div><div className="bg-green-100 p-2 rounded-full"><CheckCircle className="h-5 w-5 text-green-600" /></div></div></CardContent></Card><Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">High Priority</p><h3 className="text-2xl font-bold mt-1">{workflowStats.highPriority || 0}</h3></div><div className="bg-red-100 p-2 rounded-full"><Warning className="h-5 w-5 text-red-600" /></div></div></CardContent></Card></div>
  );
};

// Workflow Status Chart component
const WorkflowStatusChart = ({workflows}: {workflows: Workflow[]}) => {const chartData = useMemo(() => {
    const statusCounts = workflows.reduce((acc: Record<string, number>, workflow) =>{
      acc[workflow.status] = (acc[workflow.status] || 0) + 1;
      return acc;}, {});

    return Object.entries(statusCounts).map(([status, count]) => ({status: status.replace('_', ' ').toUpperCase(),
      count,
      fill:
        status === 'completed'
          ? '#22c55e'
          : status === 'in_progress'
            ? '#3b82f6'
            : status === 'review'
              ? '#f59e0b'
              : status === 'draft'
                ? '#6b7280'
                : '#8b5cf6',}));
  }, [workflows]);

  return (<Card className="h-full"><CardHeader className="pb-2"><div className="flex justify-between items-center"><div><CardTitle className="text-lg">Workflow Status Distribution</CardTitle><CardDescription>Current status breakdown of all workflows</CardDescription></div><div className="bg-blue-100 p-2 rounded-full"><PieChartIcon className="h-5 w-5 text-blue-600" /></div></div></CardHeader><CardContent><div className="h-[250px]">{chartData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><PieChart><Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  label={({ status, percent}) =>`${status}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Pie><Tooltip formatter={(value: number) => [`${value} workflows`, 'Count']} /><Legend /></PieChart></ResponsiveContainer>) : (<div className="flex items-center justify-center h-full"><p className="text-muted-foreground">No workflow data available</p></div>)}</div></CardContent></Card>
  );
};

// Workflow Type Chart component
const WorkflowTypeChart = ({workflows}: {workflows: Workflow[]}) => {const chartData = useMemo(() => {
    const typeCounts = workflows.reduce((acc: Record<string, number>, workflow) =>{
      acc[workflow.type] = (acc[workflow.type] || 0) + 1;
      return acc;}, {});

    return Object.entries(typeCounts).map(([type, count]) => ({type: workflowTypeLabels[type as WorkflowType] || type,
      count,}));
  }, [workflows]);

  return (<Card className="h-full"><CardHeader className="pb-2"><div className="flex justify-between items-center"><div><CardTitle className="text-lg">Workflow Types</CardTitle><CardDescription>Distribution by workflow category</CardDescription></div><div className="bg-purple-100 p-2 rounded-full"><BarChart2 className="h-5 w-5 text-purple-600" /></div></div></CardHeader><CardContent><div className="h-[250px]">{chartData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="type" tick={{ fontSize: 12}} /><YAxis /><Tooltip /><Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>) : (<div className="flex items-center justify-center h-full"><p className="text-muted-foreground">No workflow data available</p></div>)}</div></CardContent></Card>);
};

// Recent Activity component
const RecentActivity = ({events}: {events: WorkflowEvent[]}) => {const recentEvents = useMemo(() => {
    return events
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(event => ({
        ...event,
        timeAgo: formatDistance(new Date(event.createdAt), new Date(), { addSuffix: true}),
      }));
  }, [events]);

  const getEventIcon = (eventType: string) => {switch (eventType) {
      case 'created':
        return<FileCheck className="h-4 w-4 text-blue-600" />;
      case 'status_changed':
        return <Activity className="h-4 w-4 text-green-600" />;
      case 'assigned':
        return <UserIcon className="h-4 w-4 text-purple-600" />;
      case 'comment_added':
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;}
  };

  return (
    <Card className="h-full"><CardHeader className="pb-2"><div className="flex justify-between items-center"><div><CardTitle className="text-lg">Recent Activity</CardTitle><CardDescription>Latest workflow updates</CardDescription></div><div className="bg-green-100 p-2 rounded-full"><Activity className="h-5 w-5 text-green-600" /></div></div></CardHeader><CardContent>{recentEvents.length > 0 ? (<ScrollArea className="h-[250px] pr-4"><div className="space-y-4">{recentEvents.map(event => (<div key={event.id} className="flex items-start gap-3"><div className="bg-neutral-100 p-2 rounded-full h-8 w-8 flex items-center justify-center mt-0.5">{getEventIcon(event.eventType)}</div><div className="flex-1"><div className="flex justify-between"><p className="text-sm font-medium">{event.description}</p><span className="text-xs text-muted-foreground">{event.timeAgo}</span></div><Badge variant="outline" className="text-xs mt-1">{event.eventType.replace('_', ' ')}</Badge></div></div>))}</div></ScrollArea>) : (<div className="flex flex-col items-center justify-center h-[250px] text-center"><Activity className="h-12 w-12 text-gray-100 mb-3" /><h3 className="text-base font-medium text-neutral-600">No Recent Activity</h3><p className="text-sm text-muted-foreground mt-1">Activity will appear here as workflows are updated</p></div>)}</CardContent></Card>);
};

// Quick Actions component
const QuickActions = () => {const [, navigate] = useLocation();

  const actions = [
    {
      title: 'New Workflow',
      description: 'Start a new workflow process',
      icon:<FileCheck className="h-5 w-5" />,
      onClick: () =>navigate('/workflow/new'),
      variant: 'default' as const,},
    {title: 'View All Workflows',
      description: 'Browse and manage workflows',
      icon:<Search className="h-5 w-5" />,
      onClick: () =>navigate('/workflow-dashboard'),
      variant: 'outline' as const,},
    {title: 'GIS Map',
      description: 'Access property mapping tools',
      icon:<Map className="h-5 w-5" />,
      onClick: () =>navigate('/gis-map'),
      variant: 'outline' as const,},
    {title: 'Document Center',
      description: 'Manage workflow documents',
      icon:<File className="h-5 w-5" />,
      onClick: () =>navigate('/documents'),
      variant: 'outline' as const,},
  ];

  return (<Card><CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle><CardDescription>Common tasks and shortcuts</CardDescription></CardHeader><CardContent><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{actions.map((action, index) => (<Button
              key={index}
              variant={action.variant}
              className="h-auto p-4 flex flex-col items-center gap-2 text-center"
              onClick={action.onClick}
            ><div className="bg-primary/10 p-2 rounded-full">{action.icon}</div><div><p className="font-medium">{action.title}</p><p className="text-xs text-muted-foreground">{action.description}</p></div></Button>))}</div></CardContent></Card>
  );
};

// Document Classification Summary (NEW)
const DocumentClassificationSummary = ({documents}: {documents: Document[]}) => {const classificationData = useMemo(() => {
    const typeCounts = documents.reduce((acc: Record<string, number>, doc) =>{
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;}, {});

    return Object.entries(typeCounts).map(([type, count]) => ({type: type.replace('_', ' ').toUpperCase(),
      count,}));
  }, [documents]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (<Card className="h-full"><CardHeader className="pb-2"><div className="flex justify-between items-center"><div><CardTitle className="text-lg">Document Classification</CardTitle><CardDescription>Your document types overview</CardDescription></div><div className="bg-emerald-100 p-2 rounded-full"><FileDigit className="h-5 w-5 text-emerald-600" /></div></div></CardHeader><CardContent><div className="h-[240px]">{classificationData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><BarChart data={classificationData} layout="horizontal"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="type" type="category" width={80} tick={{ fontSize: 11}} /><Tooltip /><Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>) : (<div className="flex flex-col items-center justify-center h-full text-center"><FileText className="h-12 w-12 text-gray-100 mb-3" /><h3 className="text-base font-medium text-neutral-600">No Documents</h3><p className="text-sm text-muted-foreground mt-1">Document classification will appear here</p></div>)}</div></CardContent></Card>);
};

// Priority Tasks component
const PriorityTasks = ({workflows,
  checklists,}: {workflows: Workflow[];
  checklists: ChecklistItem[];}) => {const [, navigate] = useLocation();

  const priorityTasks = useMemo(() => {
    return workflows
      .filter(workflow => workflow.priority === 'high' && workflow.status !== 'completed')
      .flatMap(workflow => {
        const workflowItems = checklists
          .filter(item => item.workflowId === workflow.id && !item.completed)
          .map(item => ({
            workflowId: workflow.id,
            workflowTitle: workflow.title,
            workflowType: workflow.type,
            itemTitle: item.title,
            itemId: item.id,
            priority: workflow.priority,}));
        return workflowItems;
      })
      .slice(0, 5);
  }, [workflows, checklists]);

  return (<Card className="h-full"><CardHeader className="pb-2"><div className="flex justify-between items-center"><div><CardTitle className="text-lg">Priority Tasks</CardTitle><CardDescription>Your high priority incomplete tasks</CardDescription></div><Badge variant="destructive" className="gap-1"><Warning className="h-3 w-3" />High Priority</Badge></div></CardHeader><CardContent>{priorityTasks.length > 0 ? (<ScrollArea className="h-[250px] pr-4"><div className="space-y-4">{priorityTasks.map(task => (<div key={`${task.workflowId}-${task.itemId}`} className="flex items-start gap-3"><div className="bg-red-100 p-2 rounded-full h-8 w-8 flex items-center justify-center mt-0.5"><Pin className="h-4 w-4 text-red-600" /></div><div className="flex-1"><div className="flex justify-between"><h4 className="text-sm font-medium">{task.itemTitle}</h4><Badge variant="outline" className="text-xs">{workflowTypeLabels[task.workflowType as WorkflowType]}</Badge></div><p className="text-xs text-muted-foreground mt-1">From: {task.workflowTitle}</p></div></div>))}</div></ScrollArea>) : (<div className="flex flex-col items-center justify-center h-[250px] text-center"><CheckCircle className="h-12 w-12 text-green-100 mb-3" /><h3 className="text-base font-medium text-neutral-600">No Priority Tasks</h3><p className="text-sm text-muted-foreground mt-1">You're all caught up with high priority items!</p></div>)}</CardContent><CardFooter className="pt-0"><Button
          variant="outline"
          className="w-full"
          onClick={() =>navigate('/workflow-dashboard')}
        >
          View All Tasks</Button></CardFooter></Card>);
};

// User Efficiency Metrics component (NEW)
const UserEfficiencyMetrics = ({workflows,
  events,}: {workflows: Workflow[];
  events: WorkflowEvent[];}) => {const completionTrendData = useMemo(() => {
    const result = [];
    const now = new Date();

    const completedEvents = events.filter(
      event => event.eventType === 'status_changed' && event.description.includes('completed')
    );

    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const formattedDate = format(date, 'MMM dd');

      const completedCount = completedEvents.filter(event => {
        const eventDate = new Date(event.createdAt);
        return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');}).length;

      result.push({date: formattedDate,
        completed: completedCount,});
    }

    return result;
  }, [events]);

  const averageCompletionTime = useMemo(() => {const completedWorkflows = workflows.filter(w => w.status === 'completed');

    if (completedWorkflows.length === 0) {
      return 0;}

    let totalCompletionDays = 0;
    let countedWorkflows = 0;

    completedWorkflows.forEach(workflow => {const creationEvent = events.find(
        e => e.workflowId === workflow.id && e.eventType === 'created'
      );

      const completionEvent = events.find(
        e =>
          e.workflowId === workflow.id &&
          e.eventType === 'status_changed' &&
          e.description.includes('completed')
      );

      if (creationEvent && completionEvent) {
        const startDate = new Date(creationEvent.createdAt);
        const endDate = new Date(completionEvent.createdAt);
        const days = differenceInDays(endDate, startDate);

        if (days >= 0) {
          totalCompletionDays += days;
          countedWorkflows++;}
      }
    });

    return countedWorkflows > 0 ? Math.round(totalCompletionDays / countedWorkflows) : 0;
  }, [workflows, events]);

  const weeklyCompletionRate = useMemo(() => {const totalCompletedThisWeek = completionTrendData.reduce((sum, day) => sum + day.completed, 0);
    return totalCompletedThisWeek;}, [completionTrendData]);

  return (<Card className="h-full"><CardHeader className="pb-2"><div className="flex justify-between items-center"><div><CardTitle className="text-lg">Your Efficiency Metrics</CardTitle><CardDescription>Personalized workflow completion insights</CardDescription></div><div className="bg-indigo-100 p-2 rounded-full"><LineChartIcon className="h-5 w-5 text-indigo-600" /></div></div></CardHeader><CardContent><div className="grid grid-cols-2 gap-4 mb-4"><div className="p-3 bg-blue-50 rounded-lg"><div className="flex items-center gap-2"><Timer className="h-5 w-5 text-blue-600" /><span className="text-sm font-medium text-blue-800">Avg. Completion Time</span></div><div className="mt-2 flex items-end gap-1"><span className="text-2xl font-bold text-blue-700">{averageCompletionTime}</span><span className="text-sm text-blue-600 mb-0.5">days</span></div></div><div className="p-3 bg-green-50 rounded-lg"><div className="flex items-center gap-2"><CheckSquare className="h-5 w-5 text-green-600" /><span className="text-sm font-medium text-green-800">This Week</span></div><div className="mt-2 flex items-end gap-1"><span className="text-2xl font-bold text-green-700">{weeklyCompletionRate}</span><span className="text-sm text-green-600 mb-0.5">completed</span></div></div></div><div className="h-[140px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={completionTrendData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 11}} /><YAxis /><Tooltip /><Line
                type="monotone"
                dataKey="completed"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4}} /></LineChart></ResponsiveContainer></div></CardContent></Card>);
};

// Workflow Progress component
const WorkflowProgress = ({workflows, states}: {workflows: Workflow[]; states: any[]}) => {const [, navigate] = useLocation();

  const inProgressWorkflows = useMemo(() => {
    return workflows
      .filter(workflow => workflow.status === 'in_progress')
      .map(workflow => {
        const steps = workflowSteps[workflow.type as WorkflowType] || [];
        const currentStepIndex = steps.findIndex(step => {
          const state = states.find(s => s.workflowId === workflow.id);
          return state && step === state.currentStep;});

        return {...workflow,
          currentStep: Math.max(1, currentStepIndex + 1),
          progress:
            steps.length > 0 ? Math.round(((currentStepIndex + 1) / steps.length) * 100) : 0,
          totalSteps: steps.length,};
      })
      .sort((a, b) => (b.priority === 'high' ? 1 : 0) - (a.priority === 'high' ? 1 : 0))
      .slice(0, 5);
  }, [workflows, states]);

  return (<Card className="h-full"><CardHeader className="pb-2"><CardTitle className="text-lg">Workflow Progress</CardTitle><CardDescription>Track your active workflows</CardDescription></CardHeader><CardContent>{inProgressWorkflows.length > 0 ? (<ScrollArea className="h-[250px] pr-4"><div className="space-y-5">{inProgressWorkflows.map(workflow => (<div key={workflow.id} className="space-y-2"><div className="flex justify-between items-center"><div className="flex items-center gap-2"><StatusDot status={workflow.status} /><h4 className="text-sm font-medium truncate max-w-[200px]">{workflow.title}</h4></div><Badge
                      variant={workflow.priority === 'high' ? 'destructive' : 'outline'}
                      className="text-xs"
                    >{workflow.priority}</Badge></div><Progress value={workflow.progress} className="h-2" /><div className="flex justify-between items-center text-xs text-muted-foreground"><span>Step {workflow.currentStep} of {workflow.totalSteps}</span><span>{workflow.progress}% complete</span></div></div>))}</div></ScrollArea>) : (<div className="flex flex-col items-center justify-center h-[250px] text-center"><Activity className="h-12 w-12 text-gray-100 mb-3" /><h3 className="text-base font-medium text-neutral-600">No Active Workflows</h3><p className="text-sm text-muted-foreground mt-1">Start a workflow to track progress here</p></div>)}</CardContent><CardFooter className="pt-0"><Button
          variant="outline"
          className="w-full"
          onClick={() =>navigate('/workflow-dashboard')}
        >
          View All Workflows</Button></CardFooter></Card>);
};

// Task Breakdown component (NEW)
const TaskBreakdown = ({workflows}: {workflows: Workflow[]}) => {const taskDistribution = useMemo(() => {
    const currentUserId = 2;

    const personal = workflows.filter(w => w.userId === currentUserId).length;
    const team = workflows.filter(w => w.userId !== currentUserId).length;

    return [
      { name: 'Personal', value: personal},
      {name: 'Team', value: team},
    ];
  }, [workflows]);

  const COLORS = ['#3b82f6', '#8b5cf6'];

  return (<Card className="h-full"><CardHeader className="pb-2"><div className="flex justify-between items-center"><div><CardTitle className="text-lg">Task Distribution</CardTitle><CardDescription>Personal vs. team workload</CardDescription></div><div className="bg-blue-100 p-2 rounded-full"><Users className="h-5 w-5 text-blue-600" /></div></div></CardHeader><CardContent><div className="h-[240px] flex flex-col justify-center">{taskDistribution.some(item => item.value > 0) ? (<ResponsiveContainer width="100%" height="100%"><PieChart><Pie
                  data={taskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent}) =>`${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {taskDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip formatter={(value: number) => [`${value} tasks`, 'Count']} /><Legend /></PieChart></ResponsiveContainer>) : (<div className="flex flex-col items-center justify-center text-center"><UserIcon className="h-12 w-12 text-gray-100 mb-3" /><h3 className="text-base font-medium text-neutral-600">No Tasks Assigned</h3><p className="text-sm text-muted-foreground mt-1">Tasks will appear here once assigned</p></div>)}</div></CardContent></Card>);
};

// Upcoming Deadlines component (NEW)
const UpcomingDeadlines = ({workflows}: {workflows: Workflow[]}) => {const [, navigate] = useLocation();

  const deadlines = useMemo(() => {
    const now = new Date();
    return workflows
      .filter(w => w.status === 'in_progress')
      .map(workflow => {
        let deadline;
        if (workflow.priority === 'high') {
          deadline = addDays(now, Math.floor(Math.random() * 3) + 1);} else if (workflow.priority === 'medium') {deadline = addDays(now, Math.floor(Math.random() * 7) + 3);} else {deadline = addDays(now, Math.floor(Math.random() * 14) + 7);}

        return {workflowId: workflow.id,
          workflowTitle: workflow.title,
          workflowType: workflow.type,
          deadline,
          priority: workflow.priority,
          daysRemaining: differenceInDays(deadline, now),};
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 5);
  }, [workflows]);

  return (<Card className="h-full"><CardHeader className="pb-2"><div className="flex justify-between items-center"><div><CardTitle className="text-lg">Upcoming Deadlines</CardTitle><CardDescription>Your workflow due dates</CardDescription></div><div className="bg-orange-100 p-2 rounded-full"><Calendar className="h-5 w-5 text-orange-600" /></div></div></CardHeader><CardContent>{deadlines.length > 0 ? (<ScrollArea className="h-[250px] pr-4"><div className="space-y-4">{deadlines.map(deadline => (<div key={deadline.workflowId} className="flex items-start gap-3"><div
                    className={`p-2 rounded-full h-8 w-8 flex items-center justify-center mt-0.5 ${
                      deadline.daysRemaining <= 1
                        ? 'bg-red-100'
                        : deadline.daysRemaining <= 3
                          ? 'bg-orange-100'
                          : 'bg-blue-100'}`}
                  ><Hourglass
                      className={`h-4 w-4 ${
                        deadline.daysRemaining <= 1
                          ? 'text-red-600'
                          : deadline.daysRemaining <= 3
                            ? 'text-orange-600'
                            : 'text-blue-600'}`} /></div><div className="flex-1"><div className="flex justify-between"><h4 className="text-sm font-medium">{deadline.workflowTitle}</h4><Badge
                        variant={deadline.priority === 'high' ? 'destructive' : 'outline'}
                        className="text-xs"
                      >{deadline.daysRemaining<= 0 ? 'Overdue' : `${deadline.daysRemaining}d`}
                      </Badge></div><p className="text-xs text-muted-foreground mt-1">Due: {format(deadline.deadline, 'MMM dd, yyyy')}</p></div></div>))}</div></ScrollArea>) : (<div className="flex flex-col items-center justify-center h-[250px] text-center"><Calendar className="h-12 w-12 text-gray-100 mb-3" /><h3 className="text-base font-medium text-neutral-600">No Upcoming Deadlines</h3><p className="text-sm text-muted-foreground mt-1">All workflows are on track</p></div>)}</CardContent><CardFooter className="pt-0"><Button
          variant="outline"
          className="w-full"
          onClick={() =>navigate('/workflow-dashboard')}
        >
          View All Deadlines</Button></CardFooter></Card>);
};

export default function DashboardPage() {const [activeTab, setActiveTab] = useState('overview');
  const [notificationCount, setNotificationCount] = useState(0);

  const { data: user, isLoading: isUserLoading} = useQuery({queryKey: ['user', 'current'],
    queryFn: getQueryFn('/api/user/current'),});

  const {data: workflows, isLoading: isWorkflowsLoading} = useQuery({queryKey: ['workflows'],
    queryFn: getQueryFn('/api/workflows'),});

  const {data: workflowStates, isLoading: isStatesLoading} = useQuery({queryKey: ['workflow-states'],
    queryFn: getQueryFn('/api/workflow-states'),});

  const {data: workflowEvents, isLoading: isEventsLoading} = useQuery({queryKey: ['workflow-events'],
    queryFn: getQueryFn('/api/workflow-events'),});

  const {data: checklistItems, isLoading: isChecklistLoading} = useQuery({queryKey: ['checklist-items'],
    queryFn: getQueryFn('/api/checklist-items'),});

  const {data: documents, isLoading: isDocumentsLoading} = useQuery({queryKey: ['documents'],
    queryFn: getQueryFn('/api/documents'),});

  const workflowStats = useMemo(() => {if (!workflows)
      return {
        total: 0,
        inProgress: 0,
        completed: 0,
        highPriority: 0,};

    return {total: workflows.length,
      inProgress: workflows.filter(w => w.status === 'in_progress').length,
      completed: workflows.filter(w => w.status === 'completed').length,
      highPriority: workflows.filter(w => w.priority === 'high').length,};
  }, [workflows]);

  useEffect(() => {if (workflows && workflows.length > 0) {
      const inProgressCount = workflows.filter(w => w.status === 'in_progress').length;
      setNotificationCount(inProgressCount > 0 ? inProgressCount : 0);} else {setNotificationCount(0);}
  }, [workflows]);

  const isLoading =
    isUserLoading ||
    isWorkflowsLoading ||
    isStatesLoading ||
    isEventsLoading ||
    isChecklistLoading ||
    isDocumentsLoading;

  return (<div className="flex flex-col h-screen"><Header notificationCount={notificationCount} /><div className="flex flex-1 overflow-hidden"><Sidebar /><main className="flex-1 overflow-auto bg-neutral-50 p-6"><div className="mb-4"><div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold text-neutral-800 mb-1">Dashboard</h1><p className="text-neutral-600">Welcome back,{' '}
                  {isUserLoading
                    ? 'Loading...'
                    : (user as any)?.fullName || user?.username || 'User'}</p></div><Button onClick={() => window.location.reload()} variant="outline" className="gap-2"><Refresh className="h-4 w-4" />Refresh</Button></div></div><Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6"><TabsList className="grid w-full max-w-md grid-cols-2"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="personal">Personal Insights</TabsTrigger></TabsList></Tabs>{isLoading ? (<div className="space-y-6"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{Array(4)
                  .fill(0)
                  .map((_, i) => (<Skeleton key={i} className="h-28 w-full" />))}</div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">{Array(2)
                  .fill(0)
                  .map((_, i) => (<Skeleton key={i} className="h-96 w-full" />))}</div><div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{Array(3)
                  .fill(0)
                  .map((_, i) => (<Skeleton key={i} className="h-80 w-full" />))}</div></div>) : (<div><UserStatsSummary user={user || null} workflowStats={workflowStats} /><TabsContent value="overview" className="mt-0"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"><WorkflowStatusChart workflows={workflows || []} /><WorkflowTypeChart workflows={workflows || []} /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"><WorkflowProgress workflows={workflows || []} states={workflowStates || []} /><PriorityTasks workflows={workflows || []} checklists={checklistItems || []} /><RecentActivity events={workflowEvents || []} /></div><QuickActions /></TabsContent><TabsContent value="personal" className="mt-0"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"><UserEfficiencyMetrics
                    workflows={workflows || []}
                    events={workflowEvents || []} /><DocumentClassificationSummary documents={documents || []} /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"><TaskBreakdown workflows={workflows || []} /><UpcomingDeadlines workflows={workflows || []} /><PriorityTasks workflows={workflows || []} checklists={checklistItems || []} /></div><QuickActions /></TabsContent></div>)}</main></div></div>
  );
}
