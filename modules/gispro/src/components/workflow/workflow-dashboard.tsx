import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, isAfter, isBefore, isWithinInterval, parseISO } from 'date-fns';
import { CalendarDays, 
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
  PenLine
 } from '@mui/icons-material';

import { Workflow, WorkflowEvent } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { queryClient } from '@/lib/queryClient';

export function WorkflowDashboard() {
  const { user } = useAuth();
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
  const { data: workflows, isLoading } = useQuery({
    queryKey: ['/api/workflows'],
    queryFn: async () => {
      const response = await fetch('/api/workflows');
      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }
      return response.json();
    },
  });

  // Fetch workflow events for the selected workflow
  const { data: workflowEvents } = useQuery({
    queryKey: ['/api/workflow-events', selectedWorkflow?.id],
    queryFn: async () => {
      if (!selectedWorkflow) return [];
      const response = await fetch(`/api/workflow-events/${selectedWorkflow.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch workflow events');
      }
      return response.json();
    },
    enabled: !!selectedWorkflow,
  });
  
  // Update workflow priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: async ({ workflowId, priority }: { workflowId: number, priority: string }) => {
      const response = await fetch(`/api/workflows/${workflowId}/priority`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update workflow priority');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      if (selectedWorkflow) {
        queryClient.invalidateQueries({ queryKey: ['/api/workflow-events', selectedWorkflow.id] });
      }
      setShowPriorityChangeDialog(false);
    },
  });

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending order for new field
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Update a workflow's priority
  const handlePriorityChange = (priority: string) => {
    if (!selectedWorkflow) return;
    
    updatePriorityMutation.mutate({
      workflowId: selectedWorkflow.id,
      priority
    });
  };
  
  // Handle date filter application
  const applyDateFilter = () => {
    setShowDateFilterDialog(false);
  };
  
  // Reset all filters
  const resetAllFilters = () => {
    setActiveTab('all');
    setSelectedPriority(null);
    setSearchQuery('');
    setStartDate(undefined);
    setEndDate(undefined);
    setSortField(null);
  };
  
  // Toggle expanded state for event
  const toggleEventExpanded = (eventId: number) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(eventId);
    }
  };

  // Filter workflows based on all filters
  const filteredWorkflows = useMemo(() => {
    if (!workflows) return [];
    
    let filtered = [...workflows];
    
    // Filter by status tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(workflow => workflow.status === activeTab);
    }
    
    // Filter by priority
    if (selectedPriority) {
      filtered = filtered.filter(workflow => workflow.priority === selectedPriority);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(workflow => 
        workflow.title.toLowerCase().includes(query) || 
        (workflow.description && workflow.description.toLowerCase().includes(query))
      );
    }
    
    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(workflow => {
        const createdAt = parseISO(workflow.createdAt);
        
        if (startDate && endDate) {
          return isWithinInterval(createdAt, { start: startDate, end: endDate });
        } else if (startDate) {
          return isAfter(createdAt, startDate) || createdAt.getTime() === startDate.getTime();
        } else if (endDate) {
          return isBefore(createdAt, endDate) || createdAt.getTime() === endDate.getTime();
        }
        
        return true;
      });
    }
    
    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let valueA = a[sortField as keyof Workflow];
        let valueB = b[sortField as keyof Workflow];
        
        // Handle special cases for dates
        if (sortField === 'createdAt' || sortField === 'updatedAt') {
          valueA = new Date(valueA as string).getTime();
          valueB = new Date(valueB as string).getTime();
        }
        
        // Determine sort direction
        if (sortDirection === 'asc') {
          return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        } else {
          return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }
      });
    }
    
    return filtered;
  }, [workflows, activeTab, selectedPriority, searchQuery, startDate, endDate, sortField, sortDirection]);
  
  // Priority badge colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 hover:bg-red-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-slate-500 hover:bg-slate-600';
    }
  };
  
  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-500';
      case 'in_progress': return 'bg-blue-500';
      case 'review': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-slate-500';
    }
  };

  // Format display date
  const formatDate = (dateString: string | Date) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  // Handle workflow selection and timeline display
  const handleWorkflowClick = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setShowTimelineDialog(true);
  };
  
  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center"><>

          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p
</> className="mt-2 text-sm text-muted-foreground">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6"><>

        <h1 className="text-3xl font-bold tracking-tight">Workflow Dashboard</h1>
        <p
</> className="text-muted-foreground">Manage and track all your workflows</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 mb-4"><>

              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger
</> value="draft">Draft</TabsTrigger><>

              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger
</> value="review">Review</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            {/* Search bar */}
            <div className="flex items-center mb-4 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><>

                <Input 
                  placeholder="Search workflows" 
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Dialog
</> open={showDateFilterDialog} onOpenChange={setShowDateFilterDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Calendar size={16} />
                    Filter by Date
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader><>

                    <DialogTitle>Filter by Date</DialogTitle>
                    <DialogDescription
</>>
                      Set a date range to filter workflows by their creation date
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2"><>

                        <Label htmlFor="start-date">Start Date</Label>
                        <Popover
</>>
                          <PopoverTrigger asChild>
                            <Button
                              id="start-date"
                              variant={"outline"}
                              className="justify-start text-left"
                            >
                              {startDate ? (
                                format(startDate, "PPP")
                              ) : (
                                <span className="text-muted-foreground">Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={startDate}
                              onSelect={setStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex flex-col gap-2"><>

                        <Label htmlFor="end-date">End Date</Label>
                        <Popover
</>>
                          <PopoverTrigger asChild>
                            <Button
                              id="end-date"
                              variant={"outline"}
                              className="justify-start text-left"
                            >
                              {endDate ? (
                                format(endDate, "PPP")
                              ) : (
                                <span className="text-muted-foreground">Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                  <DialogFooter><>

                    <Button type="button" variant="outline" onClick={() => {
                      setStartDate(undefined);
                      setEndDate(undefined);
                      setShowDateFilterDialog(false);
                    }}>
                      Clear
                    </Button>
                    <Button
</> type="button" onClick={applyDateFilter}>Apply</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {(selectedPriority || searchQuery || startDate || endDate) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetAllFilters}
                  className="flex items-center gap-1"
                >
                  <RotateCcw size={16} />
                  Reset Filters
                </Button>
              )}
            </div>
            
            {/* Priority filter buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button 
                variant={selectedPriority === null ? "default" : "outline"} 
                size="sm" 
                onClick={() => setSelectedPriority(null)}
                className="flex items-center gap-1"
              ><>

                <Filter size={16} />
                All Priorities
              </Button>
              <Button
</> 
                variant={selectedPriority === 'high' ? "default" : "outline"} 
                size="sm" 
                onClick={() => setSelectedPriority('high')}
                className="flex items-center gap-1"
              ><>

                <Warning size={16} className="text-red-500" />
                High Priority
              </Button>
              <Button
</> 
                variant={selectedPriority === 'medium' ? "default" : "outline"} 
                size="sm" 
                onClick={() => setSelectedPriority('medium')}
                className="flex items-center gap-1"
              ><>

                <Flag size={16} className="text-yellow-500" />
                Medium Priority
              </Button>
              <Button
</> 
                variant={selectedPriority === 'low' ? "default" : "outline"} 
                size="sm" 
                onClick={() => setSelectedPriority('low')}
                className="flex items-center gap-1"
              >
                <CheckCircle2 size={16} className="text-green-500" />
                Low Priority
              </Button>
            </div>
            
            <TabsContent value={activeTab} className="mt-0">
              {filteredWorkflows.length === 0 ? (
                <div className="p-8 text-center border rounded-lg">
                  <Layers className="mx-auto h-10 w-10 text-muted-foreground" /><>

                  <h3 className="mt-2 text-lg font-medium">No workflows found</h3>
                  <p
</> className="mt-1 text-sm text-muted-foreground">
                    {activeTab === 'all' 
                      ? 'There are no workflows that match your filters.' 
                      : `There are no workflows with status '${activeTab}'.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWorkflows.map((workflow) => (
                    <Card 
                      key={workflow.id} 
                      className={`cursor-pointer workflow-item priority-${workflow.priority} border-l-4 ${
                        workflow.priority === 'high' 
                          ? 'border-l-red-500' 
                          : workflow.priority === 'medium' 
                            ? 'border-l-yellow-500' 
                            : 'border-l-green-500'
                      }`}
                      onClick={() => handleWorkflowClick(workflow)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div><>

                            <CardTitle className="text-xl">{workflow.title}</CardTitle>
                            <CardDescription
</> className="mt-1">
                              {workflow.type.replace('_', ' ').toUpperCase()}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(workflow.status)}>
                            {workflow.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent><>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {workflow.description || 'No description provided'}
                        </p>
                        <div
</> className="flex items-center mt-4 text-sm text-muted-foreground">
                          <Clock size={16} className="mr-1" />
                          <span>Updated {formatDate(workflow.updatedAt)}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-between"><>

                        <Badge variant="outline" className={`${getPriorityColor(workflow.priority)} text-white`}>
                          {workflow.priority.charAt(0).toUpperCase() + workflow.priority.slice(1)} Priority
                        </Badge>
                        <div
</> className="flex items-center">
                          <Button variant="ghost" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleWorkflowClick(workflow);
                          }}>
                            View Timeline
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Workflow Timeline Dialog */}
      {/* Priority change dialog */}
      <Dialog open={showPriorityChangeDialog} onOpenChange={setShowPriorityChangeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><>

            <DialogTitle>Change Priority</DialogTitle>
            <DialogDescription
</>>
              Update the priority level for {selectedWorkflow?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><>

              <Label htmlFor="priority">Priority</Label>
              <Select
</> 
                onValueChange={handlePriorityChange} 
                defaultValue={selectedWorkflow?.priority || "medium"}
              >
                <SelectTrigger><>

                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent
</>><>

                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem
</> value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriorityChangeDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Workflow Timeline Dialog */}
      <Dialog open={showTimelineDialog} onOpenChange={setShowTimelineDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader><>

            <DialogTitle>Workflow Timeline</DialogTitle>
            <DialogDescription
</>>
              View the history and updates for {selectedWorkflow?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Tags className="mr-2 h-4 w-4" />
                <span className="text-sm font-medium">{selectedWorkflow?.type.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="flex gap-2"><>

                <Button variant="outline" size="sm" onClick={() => {
                  setShowPriorityChangeDialog(true);
                  setShowTimelineDialog(false);
                }}>
                  Change Priority
                </Button>
                <Badge
</> className={getStatusColor(selectedWorkflow?.status || 'draft')}>
                  {selectedWorkflow?.status?.replace('_', ' ') || 'draft'}
                </Badge>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {/* If we have events data, show it, otherwise show basic created/updated */}
                {workflowEvents && workflowEvents.length > 0 ? (
                  workflowEvents.map((event: WorkflowEvent) => (
                    <Collapsible
                      key={event.id}
                      open={expandedEventId === event.id}
                      onOpenChange={() => toggleEventExpanded(event.id)}
                      className="w-full"
                    >
                      <div className="flex">
                        <div className="mr-4 flex flex-col items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            {event.eventType === 'created' && <FileText className="h-5 w-5 text-primary" />}
                            {event.eventType === 'updated' && <Clock className="h-5 w-5 text-primary" />}
                            {event.eventType === 'status_changed' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                            {event.eventType === 'priority_changed' && <Flag className="h-5 w-5 text-primary" />}
                            {event.eventType === 'document_added' && <PenLine className="h-5 w-5 text-primary" />}
                            {event.eventType === 'parcel_added' && <PenLine className="h-5 w-5 text-primary" />}
                          </div><>

                          <div className="h-full w-px bg-border" />
                        </div>
                        <div
</> className="mb-4 flex-1">
                          <CollapsibleTrigger asChild>
                            <div className="cursor-pointer hover:bg-slate-50 rounded p-1 -m-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">
                                  {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1).replace('_', ' ')}
                                </h4>
                                {expandedEventId === event.id ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (<>

                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <p
</> className="text-sm text-muted-foreground">{event.description}</p>
                              <p className="mt-1 flex items-center text-xs text-muted-foreground">
                                <CalendarDays className="mr-1 h-3 w-3" />
                                {formatDate(event.createdAt)}
                              </p>
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent className="mt-2 pl-2 border-l-2 border-primary/20">
                            {event.metadata && (
                              <div className="text-xs space-y-1 text-muted-foreground">
                                {event.eventType === 'priority_changed' && typeof event.metadata === 'string' && (() => {
                                  try {
                                    const metadata = JSON.parse(event.metadata as string);
                                    return (
                                      <>
                                        <p><span className="font-medium">Old Priority:</span> {metadata.oldPriority}</p>
                                        <p><span className="font-medium">New Priority:</span> {metadata.newPriority}</p>
                                      </>
                                    );
                                  } catch (e) {
                                    return <p>Invalid metadata format</p>;
                                  }
                                })()}
                                {event.eventType === 'status_changed' && typeof event.metadata === 'string' && (() => {
                                  try {
                                    const metadata = JSON.parse(event.metadata as string);
                                    return (
                                      <>
                                        <p><span className="font-medium">Old Status:</span> {metadata.oldStatus}</p>
                                        <p><span className="font-medium">New Status:</span> {metadata.newStatus}</p>
                                      </>
                                    );
                                  } catch (e) {
                                    return <p>Invalid metadata format</p>;
                                  }
                                })()}
                                {event.eventType === 'document_added' && typeof event.metadata === 'string' && (() => {
                                  try {
                                    const metadata = JSON.parse(event.metadata as string);
                                    return <p><span className="font-medium">Document:</span> {metadata.documentName}</p>;
                                  } catch (e) {
                                    return <p>Invalid metadata format</p>;
                                  }
                                })()}
                                {event.eventType === 'parcel_added' && typeof event.metadata === 'string' && (() => {
                                  try {
                                    const metadata = JSON.parse(event.metadata as string);
                                    return <p><span className="font-medium">Parcel:</span> {metadata.parcelNumber}</p>;
                                  } catch (e) {
                                    return <p>Invalid metadata format</p>;
                                  }
                                })()}
                                {event.eventType === 'created' && typeof event.metadata === 'string' && (() => {
                                  try {
                                    const metadata = JSON.parse(event.metadata as string);
                                    return <p><span className="font-medium">Created By:</span> User ID {metadata.userId}</p>;
                                  } catch (e) {
                                    return <p>Invalid metadata format</p>;
                                  }
                                })()}
                              </div>
                            )}
                          </CollapsibleContent>
                        </div>
                      </div>
                    </Collapsible>
                  ))
                ) : (
                  <>
                    {/* If no events, show basic information */}
                    <div className="flex">
                      <div className="mr-4 flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><>

                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div
</> className="h-full w-px bg-border" />
                      </div>
                      <div className="mb-4 flex-1"><>

                        <h4 className="text-sm font-medium">Created</h4>
                        <p
</> className="text-sm text-muted-foreground">Workflow was created</p>
                        <p className="mt-1 flex items-center text-xs text-muted-foreground">
                          <CalendarDays className="mr-1 h-3 w-3" />
                          {selectedWorkflow?.createdAt && formatDate(selectedWorkflow.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <div className="mr-4 flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1"><>

                        <h4 className="text-sm font-medium">Updated</h4>
                        <p
</> className="text-sm text-muted-foreground">Last modification to workflow</p>
                        <p className="mt-1 flex items-center text-xs text-muted-foreground">
                          <CalendarDays className="mr-1 h-3 w-3" />
                          {selectedWorkflow?.updatedAt && formatDate(selectedWorkflow.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between">
              <div className="flex items-center text-sm text-muted-foreground">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback>{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span>Assigned to {user?.fullName || 'Unknown'}</span>
              </div>
              <div><>

                <Button variant="outline" size="sm" className="mr-2" onClick={() => setShowTimelineDialog(false)}>
                  Close
                </Button>
                <Button
</> size="sm">View Details</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}