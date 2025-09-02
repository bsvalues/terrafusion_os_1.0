import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, 
  Calendar, 
  Clock, 
  ChevronRight, 
  MoreHorizontal, 
  Trash2, 
  Edit2, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertCircle, 
  Clock4 
 } from '@mui/icons-material';
import { cn } from '@/lib/utils';
import { IllustratedTooltip } from '@/components/ui/illustrated-tooltip';
import { illustrations } from '@/lib/illustrations';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ReportTemplate {
  id: number;
  name: string;
  description: string;
}

interface ReportScheduleItem {
  id: number;
  name: string;
  templateId: number;
  templateName: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour: number;
  minute: number;
  parameters: Record<string, any>;
  active: boolean;
  nextRun: string;
  lastRun?: string;
}

const schedulerFormSchema = z.object({
  name: z.string().min(3, "Schedule name must be at least 3 characters"),
  templateId: z.number({
    required_error: "Please select a report template",
  }),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  dayOfWeek: z.number().optional(),
  dayOfMonth: z.number().optional(),
  hour: z.number().min(0).max(23),
  minute: z.number().min(0).max(59),
  active: z.boolean().default(true),
  parameters: z.record(z.any()),
});

type SchedulerFormValues = z.infer<typeof schedulerFormSchema>;

export const ReportScheduler = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ReportScheduleItem | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const { toast } = useToast();
  
  // Fetch templates for dropdown
  const templatesQuery = useQuery({
    queryKey: ['/api/report-templates'],
    queryFn: async () => {
      const response = await fetch('/api/report-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch report templates');
      }
      return response.json();
    }
  });
  
  // Fetch existing schedules
  const schedulesQuery = useQuery({
    queryKey: ['/api/report-schedules'],
    queryFn: async () => {
      const response = await fetch('/api/report-schedules');
      if (!response.ok) {
        throw new Error('Failed to fetch report schedules');
      }
      return response.json();
    }
  });
  
  // Form setup
  const form = useForm<SchedulerFormValues>({
    resolver: zodResolver(schedulerFormSchema),
    defaultValues: {
      name: '',
      hour: 0,
      minute: 0,
      active: true,
      parameters: {},
    }
  });
  
  // Create new schedule
  const createScheduleMutation = useMutation({
    mutationFn: async (data: SchedulerFormValues) => {
      const response = await apiRequest('/api/report-schedules', {
        method: 'POST',
        data,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/report-schedules'] });
      toast({
        title: "Schedule Created",
        description: "Your report schedule has been created successfully.",
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update existing schedule
  const updateScheduleMutation = useMutation({
    mutationFn: async (data: SchedulerFormValues & { id: number }) => {
      const { id, ...scheduleData } = data;
      const response = await apiRequest(`/api/report-schedules/${id}`, {
        method: 'PATCH',
        data: scheduleData,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/report-schedules'] });
      toast({
        title: "Schedule Updated",
        description: "Your report schedule has been updated successfully.",
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete schedule
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/report-schedules/${id}`, {
        method: 'DELETE',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/report-schedules'] });
      toast({
        title: "Schedule Deleted",
        description: "Your report schedule has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Toggle schedule active status
  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const response = await apiRequest(`/api/report-schedules/${id}`, {
        method: 'PATCH',
        data: { active },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/report-schedules'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Helper function to format frequency display text
  const formatFrequency = (schedule: ReportScheduleItem) => {
    const time = `${schedule.hour.toString().padStart(2, '0')}:${schedule.minute.toString().padStart(2, '0')}`;
    
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${time}`;
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const day = days[schedule.dayOfWeek || 0];
        return `Every ${day} at ${time}`;
      case 'monthly':
        const dayOfMonth = schedule.dayOfMonth || 1;
        const ordinal = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th';
        return `Monthly on the ${dayOfMonth}${ordinal} at ${time}`;
      case 'quarterly':
        return `Quarterly on the ${schedule.dayOfMonth || 1}${schedule.dayOfMonth === 1 ? 'st' : 'th'} at ${time}`;
      default:
        return 'Unknown frequency';
    }
  };
  
  // Handle form submission
  const onSubmit = (values: SchedulerFormValues) => {
    // Clean up values based on frequency
    if (values.frequency !== 'weekly') {
      delete values.dayOfWeek;
    }
    
    if (values.frequency !== 'monthly' && values.frequency !== 'quarterly') {
      delete values.dayOfMonth;
    }
    
    if (editingSchedule) {
      updateScheduleMutation.mutate({ ...values, id: editingSchedule.id });
    } else {
      createScheduleMutation.mutate(values);
    }
  };
  
  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    const id = parseInt(templateId, 10);
    const template = templatesQuery.data?.find((t: ReportTemplate) => t.id === id);
    
    if (template) {
      setSelectedTemplate(template);
      form.setValue('templateId', id);
      
      // If this is a new schedule, update the name based on template
      if (!editingSchedule) {
        form.setValue('name', `${template.name} Schedule`);
      }
    }
  };
  
  // Toggle schedule active status
  const handleToggleActive = (schedule: ReportScheduleItem) => {
    toggleScheduleMutation.mutate({ 
      id: schedule.id, 
      active: !schedule.active 
    });
  };
  
  // Delete a schedule
  const handleDeleteSchedule = (schedule: ReportScheduleItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the schedule "${schedule.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      deleteScheduleMutation.mutate(schedule.id);
    }
  };
  
  // Reset form and editing state
  const resetForm = () => {
    form.reset({
      name: '',
      hour: 0,
      minute: 0,
      active: true,
      parameters: {},
    });
    setIsCreating(false);
    setEditingSchedule(null);
    setSelectedTemplate(null);
  };
  
  // Handle edit button click
  const handleEditSchedule = (schedule: ReportScheduleItem) => {
    setEditingSchedule(schedule);
    setIsCreating(true);
    
    // Find the template
    const template = templatesQuery.data?.find((t: ReportTemplate) => t.id === schedule.templateId);
    setSelectedTemplate(template || null);
    
    // Fill the form with schedule data
    form.reset({
      name: schedule.name,
      templateId: schedule.templateId,
      frequency: schedule.frequency,
      dayOfWeek: schedule.dayOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      hour: schedule.hour,
      minute: schedule.minute,
      active: schedule.active,
      parameters: schedule.parameters || {},
    });
  };
  
  // Show the form or schedule list based on state
  if (isCreating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
            <IllustratedTooltip
              illustration={illustrations.report.schedule}
              title="Report Scheduler"
              content={
                <div><>

                  <p className="mb-1">• Schedule automated report generation</p>
                  <p
</>
className="mb-1">• Configure frequency and timing</p><>

                  <p className="mb-1">• Set custom parameters for each schedule</p>
                  <p
</>
</>>• Manage all your report schedules</p>
                </div>
              }
              position="right"
            />
          </CardTitle>
          <CardDescription>
            {editingSchedule 
              ? `Update settings for "${editingSchedule.name}"`
              : 'Configure automatic report generation on a schedule'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {templatesQuery.isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <p>Loading templates...</p>
            </div>
          ) : templatesQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" /><>

              <AlertTitle>Error</AlertTitle>
              <AlertDescription
</>
</>>
                Failed to load report templates. Please try again later.
              </AlertDescription>
            </Alert>
          ) : templatesQuery.data?.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" /><>

              <AlertTitle>No Templates Available</AlertTitle>
              <AlertDescription
</>
</>>
                There are no report templates available for scheduling.
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Schedule Name</FormLabel>
                        <FormControl
</>
</>><>

                          <Input 
                            {...field} 
                            placeholder="Enter a name for this schedule"
                          />
                        </FormControl>
                        <FormDescription
</>
</>>
                          A descriptive name to identify this schedule
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem><>

                        <FormLabel>Report Template</FormLabel>
                        <Select
</>

                          onValueChange={(value) => {
                            field.onChange(parseInt(value, 10));
                            handleTemplateChange(value);
                          }}
                          value={field.value?.toString()}
                          disabled={!!editingSchedule}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templatesQuery.data?.map((template: ReportTemplate) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select><>

                        <FormDescription>
                          {selectedTemplate?.description || 'The report template to use for this schedule'}
                        </FormDescription>
                        <FormMessage
</>
/>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-4"><>

                  <h3 className="text-lg font-medium">Schedule Settings</h3>
                  
                  <div
</>
className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Frequency</FormLabel>
                          <Select
</>

                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent><>

                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem
</>
value="weekly">Weekly</SelectItem><>

                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem
</>
value="quarterly">Quarterly</SelectItem>
                            </SelectContent>
                          </Select><>

                          <FormDescription>
                            How often the report should be generated
                          </FormDescription>
                          <FormMessage
</>
/>
                        </FormItem>
                      )}
                    />
                    
                    {form.watch('frequency') === 'weekly' && (
                      <FormField
                        control={form.control}
                        name="dayOfWeek"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Day of Week</FormLabel>
                            <Select
</>

                              onValueChange={(value) => field.onChange(parseInt(value, 10))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select day" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent><>

                                <SelectItem value="0">Sunday</SelectItem>
                                <SelectItem
</>
value="1">Monday</SelectItem><>

                                <SelectItem value="2">Tuesday</SelectItem>
                                <SelectItem
</>
value="3">Wednesday</SelectItem><>

                                <SelectItem value="4">Thursday</SelectItem>
                                <SelectItem
</>
value="5">Friday</SelectItem>
                                <SelectItem value="6">Saturday</SelectItem>
                              </SelectContent>
                            </Select><>

                            <FormDescription>
                              Which day of the week the report should run
                            </FormDescription>
                            <FormMessage
</>
/>
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {(form.watch('frequency') === 'monthly' || form.watch('frequency') === 'quarterly') && (
                      <FormField
                        control={form.control}
                        name="dayOfMonth"
                        render={({ field }) => (
                          <FormItem><>

                            <FormLabel>Day of Month</FormLabel>
                            <Select
</>

                              onValueChange={(value) => field.onChange(parseInt(value, 10))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select day" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                  <SelectItem key={day} value={day.toString()}>
                                    {day}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select><>

                            <FormDescription>
                              Which day of the month the report should run
                            </FormDescription>
                            <FormMessage
</>
/>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="hour"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Hour</FormLabel>
                          <Select
</>

                            onValueChange={(value) => field.onChange(parseInt(value, 10))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select hour" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                <SelectItem key={hour} value={hour.toString()}>
                                  {hour.toString().padStart(2, '0')}:00
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select><>

                          <FormDescription>
                            Hour of the day (24-hour format)
                          </FormDescription>
                          <FormMessage
</>
/>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="minute"
                      render={({ field }) => (
                        <FormItem><>

                          <FormLabel>Minute</FormLabel>
                          <Select
</>

                            onValueChange={(value) => field.onChange(parseInt(value, 10))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select minute" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[0, 15, 30, 45].map((minute) => (
                                <SelectItem key={minute} value={minute.toString()}>
                                  :{minute.toString().padStart(2, '0')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select><>

                          <FormDescription>
                            Minute of the hour
                          </FormDescription>
                          <FormMessage
</>
/>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5"><>

                          <FormLabel className="text-base">
                            Active
                          </FormLabel>
                          <FormDescription
</>
</>>
                            Enable or disable this schedule
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                {selectedTemplate && (
                  <Alert className="mt-4">
                    <Clock4 className="h-4 w-4" /><>

                    <AlertTitle>Schedule Preview</AlertTitle>
                    <AlertDescription
</>
</>>
                      Based on your settings, the report{' '}
                      <span className="font-medium">{selectedTemplate.name}</span>{' '}
                      will run{' '}
                      {form.watch('frequency') === 'daily' && 'every day'}
                      {form.watch('frequency') === 'weekly' && form.watch('dayOfWeek') !== undefined && 
                        `every ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][form.watch('dayOfWeek')]}`
                      }
                      {form.watch('frequency') === 'monthly' && form.watch('dayOfMonth') !== undefined && 
                        `on day ${form.watch('dayOfMonth')} of every month`
                      }
                      {form.watch('frequency') === 'quarterly' && form.watch('dayOfMonth') !== undefined && 
                        `on day ${form.watch('dayOfMonth')} of the first month of each quarter`
                      }{' '}
                      at{' '}
                      {form.watch('hour')?.toString().padStart(2, '0')}:{form.watch('minute')?.toString().padStart(2, '0')}.
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between"><>

          <Button 
            variant="outline" 
            onClick={resetForm}
          >
            Cancel
          </Button>
          <Button
</>

            onClick={form.handleSubmit(onSubmit)}
            disabled={
              createScheduleMutation.isPending || 
              updateScheduleMutation.isPending || 
              !form.formState.isValid
            }
          >
            {(createScheduleMutation.isPending || updateScheduleMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              Scheduled Reports
              <IllustratedTooltip
                illustration={illustrations.report.schedule}
                title="Report Scheduler"
                content={
                  <div><>

                    <p className="mb-1">• Schedule automated report generation</p>
                    <p
</>
className="mb-1">• Configure frequency and timing</p><>

                    <p className="mb-1">• Set custom parameters for each schedule</p>
                    <p
</>
</>>• Manage all your report schedules</p>
                  </div>
                }
                position="right"
              />
            </CardTitle>
            <CardDescription>
              Manage your automated report generation schedules
            </CardDescription>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Calendar className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {schedulesQuery.isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <p>Loading schedules...</p>
          </div>
        ) : schedulesQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" /><>

            <AlertTitle>Error</AlertTitle>
            <AlertDescription
</>
</>>
              Failed to load report schedules. Please try again later.
            </AlertDescription>
          </Alert>
        ) : !schedulesQuery.data || schedulesQuery.data.length === 0 ? (
          <div className="text-center py-10 border rounded-md bg-muted/10">
            <Calendar className="mx-auto h-10 w-10 text-muted-foreground mb-2" /><>

            <h3 className="text-lg font-medium">No Scheduled Reports</h3>
            <p
</>
className="text-muted-foreground mb-6 max-w-md mx-auto">
              You haven't created any report schedules yet. Schedule reports to automate your reporting workflow.
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Create Your First Schedule
            </Button>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow><>

                  <TableHead>Name</TableHead>
                  <TableHead
</>
</>>Report</TableHead><>

                  <TableHead>Frequency</TableHead>
                  <TableHead
</>
</>>Next Run</TableHead><>

                  <TableHead>Status</TableHead>
                  <TableHead
</>
className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedulesQuery.data.map((schedule: ReportScheduleItem) => (
                  <TableRow key={schedule.id}><>

                    <TableCell className="font-medium">{schedule.name}</TableCell>
                    <TableCell
</>
</>>{schedule.templateName}</TableCell><>

                    <TableCell>{formatFrequency(schedule)}</TableCell>
                    <TableCell
</>
className="whitespace-nowrap">
                      {format(new Date(schedule.nextRun), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      <div 
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full w-fit",
                          schedule.active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        )}
                      >
                        {schedule.active 
                          ? <><CheckCircle2 className="h-3 w-3" /> Active<div : <><Pause className="h-3 w-3" /> Paused<div }
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(schedule)}
                          title={schedule.active ? "Pause schedule" : "Activate schedule"}
                        >
                          {schedule.active ? (
                            <Pause className="h-4 w-4" />
                          ) : (<>

                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <DropdownMenu
</>
</>>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSchedule(schedule)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              <span>Edit Schedule</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleToggleActive(schedule)}
                              className="text-amber-600"
                            >
                              {schedule.active ? (
                                  <Pause className="h-4 w-4 mr-2" />
                                  <span>Pause Schedule</span>
                              ) : (
                                  <Play className="h-4 w-4 mr-2" />
                                  <span>Activate Schedule</span>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteSchedule(schedule)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              <span>Delete Schedule</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};