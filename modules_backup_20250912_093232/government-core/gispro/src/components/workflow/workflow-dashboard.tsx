import {useState, useMemo, useRef} from 'react';
import {useQuery, useMutation} from '@tanstack/react-query';
import {format, isAfter, isBefore, isWithinInterval, parseISO} from 'date-fns';
import {CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  Flag,
  Layers,
  List,
  Tags,
  FileText,
  Warning,
  Search,
  Calendar,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  ArrowUpDown,
  X,
  PenLine,} from '@mui/icons-material';

import {Workflow, WorkflowEvent} from '@shared/schema';
import {useAuth} from '@/hooks/use-auth';
import {Button} from '@/components/ui/button';
import {Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,} from '@/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,} from '@/components/ui/dialog';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,} from '@/components/ui/select';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Calendar as CalendarComponent} from '@/components/ui/calendar';
import {queryClient} from '@/lib/queryClient';

export function WorkflowDashboard() {const { user} = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);
  const [showDateFilterDialog, setShowDateFilterDialog] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showPriorityChangeDialog, setShowPriorityChangeDialog] = useState(false);

  // Fetch workflows
  const {data: workflows, isLoading} = useQuery({queryKey: ['/api/workflows'],
    queryFn: async () =>{
      const response = await fetch('/api/workflows');
      if (!response.ok) {
        throw new Error('Failed to fetch workflows');}
      return response.json();
    },
  });

  // Fetch workflow events for the selected workflow
  const {data: workflowEvents} = useQuery({
    queryKey: ['/api/workflow-events', selectedWorkflow?.id],
    queryFn: async () => {
      if (!selectedWorkflow) return [];
      const response = await fetch(`/api/workflow-events/${selectedWorkflow.id}`);
      if (!response.ok) {throw new Error('Failed to fetch workflow events');}
      return response.json();
    },
    enabled: !!selectedWorkflow,
  });

  // Update workflow priority mutation
  const updatePriorityMutation = useMutation({mutationFn: async ({ workflowId, priority}: {workflowId: number; priority: string}) => {
      const response = await fetch(`/api/workflows/${workflowId}/priority`, {method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',},
        body: JSON.stringify({priority}),
      });

      if (!response.ok) {throw new Error('Failed to update workflow priority');}

      return response.json();
    },
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['/api/workflows']});
      setShowPriorityChangeDialog(false);
    },
  });

  // Toggle event expanded
  const toggleEventExpanded = (eventId: number) => {setExpandedEventId(expandedEventId === eventId ? null : eventId);};

  // Reset all filters
  const resetAllFilters = () => {setSelectedPriority(null);
    setSearchQuery('');
    setStartDate(undefined);
    setEndDate(undefined);
    setSortField(null);
    setSortDirection('desc');};

  // Apply date filter
  const applyDateFilter = () => {setShowDateFilterDialog(false);};

  // Filter and sort workflows
  const filteredWorkflows = useMemo(() => {if (!workflows) return [];

    let filtered = workflows.filter((workflow: Workflow) => {
      // Filter by tab (status)
      if (activeTab !== 'all' && workflow.status !== activeTab) {
        return false;}

      // Filter by priority
      if (selectedPriority && workflow.priority !== selectedPriority) {return false;}

      // Filter by search query
      if (searchQuery) {const query = searchQuery.toLowerCase();
        if (
          !workflow.title.toLowerCase().includes(query) &&
          !workflow.description?.toLowerCase().includes(query)
        ) {
          return false;}
      }

      // Filter by date range
      if (startDate || endDate) {const workflowDate = parseISO(workflow.createdAt);

        if (startDate && isBefore(workflowDate, startDate)) {
          return false;}

        if (endDate && isAfter(workflowDate, endDate)) {return false;}
      }

      return true;
    });

    // Sort workflows
    if (sortField) {filtered = filtered.sort((a: Workflow, b: Workflow) => {
        let valueA = a[sortField as keyof Workflow];
        let valueB = b[sortField as keyof Workflow];

        // Handle special cases for dates
        if (sortField === 'createdAt' || sortField === 'updatedAt') {
          valueA = new Date(valueA as string).getTime();
          valueB = new Date(valueB as string).getTime();}

        // Determine sort direction
        if (sortDirection === 'asc') {return valueA< valueB ? -1 : valueA >valueB ? 1 : 0;} else {return valueA > valueB ? -1 : valueA< valueB ? 1 : 0;}
      });
    }

    return filtered;
  }, [
    workflows,
    activeTab,
    selectedPriority,
    searchQuery,
    startDate,
    endDate,
    sortField,
    sortDirection,
  ]);

  // Priority badge colors
  const getPriorityColor = (priority: string) =>{switch (priority) {
      case 'high':
        return 'bg-red-500 hover:bg-red-600';
      case 'medium':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-slate-500 hover:bg-slate-600';}
  };

  // Status badge colors
  const getStatusColor = (status: string) => {switch (status) {
      case 'draft':
        return 'bg-slate-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'review':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-green-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-slate-500';}
  };

  // Format display date
  const formatDate = (dateString: string | Date) => {return format(new Date(dateString), 'MMM d, yyyy');};

  // Handle workflow selection and timeline display
  const handleWorkflowClick = (workflow: Workflow) => {setSelectedWorkflow(workflow);
    setShowTimelineDialog(true);};

  // If loading, show loading state
  if (isLoading) {return (<div className="flex items-center justify-center h-64"><div className="text-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div><p className="mt-2 text-sm text-muted-foreground">Loading workflows...</p></div></div>);}

  return (<div className="container mx-auto p-4"><div className="mb-6"><h1 className="text-3xl font-bold tracking-tight">Workflow Dashboard</h1><p className="text-muted-foreground">Manage and track all your workflows</p></div><div className="flex flex-col md:flex-row gap-4 mb-6"><div className="flex-1"><Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          ><TabsList className="grid grid-cols-5 mb-4"><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="draft">Draft</TabsTrigger><TabsTrigger value="in_progress">In Progress</TabsTrigger><TabsTrigger value="review">Review</TabsTrigger><TabsTrigger value="completed">Completed</TabsTrigger></TabsList>{/* Search bar */}<div className="flex gap-2 mb-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input
                  placeholder="Search workflows by title or description..."
                  value={searchQuery}
                  onChange={e =>setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (<Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  ><X className="h-3 w-3" /></Button>)}</div>{/* Date filter */}<Dialog open={showDateFilterDialog} onOpenChange={setShowDateFilterDialog}><DialogTrigger asChild><Button variant="outline" className="flex items-center gap-1"><Calendar size={16} />Date Filter
                    {(startDate || endDate) && (<Badge variant="secondary" className="ml-1 px-1 text-xs">Active</Badge>)}</Button></DialogTrigger><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Filter by Date Range</DialogTitle><DialogDescription>Filter workflows by their creation date</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="start-date" className="text-right">Start Date</Label><div className="col-span-3"><Popover><PopoverTrigger asChild><Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >{startDate ? format(startDate, 'PPP') : 'Pick a date'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus /></PopoverContent></Popover></div></div><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="end-date" className="text-right">End Date</Label><div className="col-span-3"><Popover><PopoverTrigger asChild><Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >{endDate ? format(endDate, 'PPP') : 'Pick a date'}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarComponent
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus /></PopoverContent></Popover></div></div></div><DialogFooter><Button
                      type="button"
                      variant="outline"
                      onClick={() =>{
                        setStartDate(undefined);
                        setEndDate(undefined);
                        setShowDateFilterDialog(false);}}
                    >
                      Clear</Button><Button type="button" onClick={applyDateFilter}>Apply</Button></DialogFooter></DialogContent></Dialog>{(selectedPriority || searchQuery || startDate || endDate) && (<Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAllFilters}
                  className="flex items-center gap-1"
                ><RotateCcw size={16} />Reset Filters</Button>)}</div>{/* Priority filter buttons */}<div className="flex flex-wrap gap-2 mb-4"><Button
                variant={selectedPriority === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority(null)}
                className="flex items-center gap-1"
              ><Filter size={16} />All Priorities</Button><Button
                variant={selectedPriority === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority('high')}
                className="flex items-center gap-1"
              ><Warning size={16} className="text-red-500" />High Priority</Button><Button
                variant={selectedPriority === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority('medium')}
                className="flex items-center gap-1"
              ><Flag size={16} className="text-yellow-500" />Medium Priority</Button><Button
                variant={selectedPriority === 'low' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPriority('low')}
                className="flex items-center gap-1"
              ><CheckCircle2 size={16} className="text-green-500" />Low Priority</Button></div><TabsContent value={activeTab} className="mt-0">{filteredWorkflows.length === 0 ? (<div className="p-8 text-center border rounded-lg"><Layers className="mx-auto h-10 w-10 text-muted-foreground" /><h3 className="mt-2 text-lg font-medium">No workflows found</h3><p className="mt-1 text-sm text-muted-foreground">{activeTab === 'all'
                      ? 'There are no workflows that match your filters.'
                      : `There are no workflows with status '${activeTab}'.`}</p></div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{filteredWorkflows.map(workflow => (<Card
                      key={workflow.id}
                      className={`cursor-pointer workflow-item priority-${workflow.priority} border-l-4 ${workflow.priority === 'high'
                          ? 'border-l-red-500'
                          : workflow.priority === 'medium'
                            ? 'border-l-yellow-500'
                            : 'border-l-green-500'} hover:shadow-md transition-shadow`}
                      onClick={() => handleWorkflowClick(workflow)}
                    ><CardHeader className="pb-3"><div className="flex justify-between items-start"><CardTitle className="text-lg">{workflow.title}</CardTitle><Badge className={getPriorityColor(workflow.priority)}>{workflow.priority}</Badge></div><CardDescription className="line-clamp-2">{workflow.description || 'No description provided'}</CardDescription></CardHeader><CardContent><div className="flex justify-between items-center text-sm"><Badge className={getStatusColor(workflow.status)}>{workflow.status.replace('_', ' ')}</Badge><span className="text-muted-foreground">{formatDate(workflow.createdAt)}</span></div></CardContent></Card>))}</div>)}</TabsContent></Tabs></div></div>{/* Priority Change Dialog */}<Dialog open={showPriorityChangeDialog} onOpenChange={setShowPriorityChangeDialog}><DialogContent className="sm:max-w-[425px]"><DialogHeader><DialogTitle>Change Workflow Priority</DialogTitle><DialogDescription>Update the priority level for this workflow</DialogDescription></DialogHeader><div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="priority" className="text-right">Priority</Label><Select defaultValue={selectedWorkflow?.priority}><SelectTrigger className="col-span-3"><SelectValue placeholder="Select priority" /></SelectTrigger><SelectContent><SelectItem value="high">High Priority</SelectItem><SelectItem value="medium">Medium Priority</SelectItem><SelectItem value="low">Low Priority</SelectItem></SelectContent></Select></div></div><DialogFooter><Button variant="outline" onClick={() =>setShowPriorityChangeDialog(false)}>
              Cancel</Button></DialogFooter></DialogContent></Dialog>{/* Workflow Timeline Dialog */}<Dialog open={showTimelineDialog} onOpenChange={setShowTimelineDialog}><DialogContent className="sm:max-w-[525px]"><DialogHeader><DialogTitle>Workflow Timeline</DialogTitle><DialogDescription>View the history and updates for {selectedWorkflow?.title}</DialogDescription></DialogHeader><div className="mt-4"><div className="flex items-center justify-between mb-4"><div className="flex items-center"><Tags className="mr-2 h-4 w-4" /><span className="text-sm font-medium">{selectedWorkflow?.type.replace('_', ' ').toUpperCase()}</span></div><div className="flex gap-2"><Button
                  variant="outline"
                  size="sm"
                  onClick={() =>{
                    setShowPriorityChangeDialog(true);
                    setShowTimelineDialog(false);}}
                >
                  Change Priority</Button><Badge className={getStatusColor(selectedWorkflow?.status || 'draft')}>{selectedWorkflow?.status?.replace('_', ' ') || 'draft'}</Badge></div></div><Separator className="my-4" /><ScrollArea className="h-[300px] pr-4"><div className="space-y-4">{/* If we have events data, show it, otherwise show basic created/updated */}
                {workflowEvents && workflowEvents.length > 0 ? (
                  workflowEvents.map((event: WorkflowEvent) => (<Collapsible
                      key={event.id}
                      open={expandedEventId === event.id}
                      onOpenChange={() => toggleEventExpanded(event.id)}
                      className="w-full"
                    ><div className="flex"><div className="mr-4 flex flex-col items-center"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">{event.eventType === 'created' && (<FileText className="h-5 w-5 text-primary" />)}
                            {event.eventType === 'updated' && (<Clock className="h-5 w-5 text-primary" />)}
                            {event.eventType === 'status_changed' && (<CheckCircle2 className="h-5 w-5 text-primary" />)}
                            {event.eventType === 'priority_changed' && (<Flag className="h-5 w-5 text-primary" />)}
                            {event.eventType === 'document_added' && (<PenLine className="h-5 w-5 text-primary" />)}
                            {event.eventType === 'parcel_added' && (<PenLine className="h-5 w-5 text-primary" />)}</div><div className="h-full w-px bg-border" /></div><div className="mb-4 flex-1"><CollapsibleTrigger asChild><div className="cursor-pointer hover:bg-slate-50 rounded p-1 -m-1"><div className="flex items-center justify-between"><h4 className="text-sm font-medium">{event.eventType.charAt(0).toUpperCase() +
                                    event.eventType.slice(1).replace('_', ' ')}</h4>{expandedEventId === event.id ? (<ChevronUp className="h-4 w-4 text-muted-foreground" />) : (<ChevronDown className="h-4 w-4 text-muted-foreground" />)}</div><p className="text-sm text-muted-foreground">{event.description}</p><p className="mt-1 flex items-center text-xs text-muted-foreground"><CalendarDays className="mr-1 h-3 w-3" />{formatDate(event.createdAt)}</p></div></CollapsibleTrigger><CollapsibleContent className="space-y-2 pt-2">{event.eventData && (<div className="bg-slate-50 rounded p-3 text-sm"><pre className="whitespace-pre-wrap text-xs">{JSON.stringify(event.eventData, null, 2)}</pre></div>)}</CollapsibleContent></div></div></Collapsible>))
                ) : (<div className="space-y-4"><div className="flex"><div className="mr-4 flex flex-col items-center"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div></div><div className="flex-1"><h4 className="text-sm font-medium">Workflow Created</h4><p className="text-sm text-muted-foreground">This workflow was created and is ready for processing.</p><p className="mt-1 flex items-center text-xs text-muted-foreground"><CalendarDays className="mr-1 h-3 w-3" />{selectedWorkflow && formatDate(selectedWorkflow.createdAt)}</p></div></div></div>)}</div></ScrollArea></div></DialogContent></Dialog></div>
  );
}

export default WorkflowDashboard;
