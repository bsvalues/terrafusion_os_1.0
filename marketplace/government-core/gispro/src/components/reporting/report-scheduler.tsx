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
  parameters: z.record(z.any()).optional(),
  active: z.boolean().default(true),
});

type SchedulerFormData = z.infer<typeof schedulerFormSchema>;

export function ReportScheduler() {
  const [selectedSchedule, setSelectedSchedule] = useState<ReportScheduleItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ReportScheduleItem | null>(null);
  const { toast } = useToast();

  const form = useForm<SchedulerFormData>({
    resolver: zodResolver(schedulerFormSchema),
    defaultValues: {
      name: '',
      frequency: 'daily',
      hour: 9,
      minute: 0,
      active: true,
      parameters: {},
    },
  });

  // Fetch available report templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/report-templates'],
  });

  // Fetch scheduled reports
  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['/api/report-schedules'],
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: SchedulerFormData) => {
      const response = await apiRequest('POST', '/api/report-schedules', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/report-schedules'] });
      toast({
        title: "Schedule Created",
        description: "Report schedule has been created successfully.",
      });
      setShowForm(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SchedulerFormData }) => {
      const response = await apiRequest('PUT', `/api/report-schedules/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/report-schedules'] });
      toast({
        title: "Schedule Updated",
        description: "Report schedule has been updated successfully.",
      });
      setShowForm(false);
      setEditingSchedule(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/report-schedules/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/report-schedules'] });
      toast({
        title: "Schedule Deleted",
        description: "Report schedule has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle schedule active status
  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const response = await apiRequest('PATCH', `/api/report-schedules/${id}`, { active });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/report-schedules'] });
      toast({
        title: "Schedule Updated",
        description: "Report schedule status has been updated.",
      });
    },
  });

  const handleEditSchedule = (schedule: ReportScheduleItem) => {
    setEditingSchedule(schedule);
    form.reset({
      name: schedule.name,
      templateId: schedule.templateId,
      frequency: schedule.frequency,
      dayOfWeek: schedule.dayOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      hour: schedule.hour,
      minute: schedule.minute,
      parameters: schedule.parameters,
      active: schedule.active,
    });
    setShowForm(true);
  };

  const handleSubmit = (data: SchedulerFormData) => {
    if (editingSchedule) {
      updateScheduleMutation.mutate({ id: editingSchedule.id, data });
    } else {
      createScheduleMutation.mutate(data);
    }
  };

  const handleDeleteSchedule = (id: number) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      deleteScheduleMutation.mutate(id);
    }
  };

  const handleToggleSchedule = (id: number, active: boolean) => {
    toggleScheduleMutation.mutate({ id, active });
  };

  const getFrequencyDescription = (schedule: ReportScheduleItem) => {
    const time = `${schedule.hour.toString().padStart(2, '0')}:${schedule.minute.toString().padStart(2, '0')}`;
    
    switch (schedule.frequency) {
      case 'daily':
        return `Daily at ${time}`;
      case 'weekly':
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = schedule.dayOfWeek !== undefined ? dayNames[schedule.dayOfWeek] : 'Unknown';
        return `Weekly on ${dayName} at ${time}`;
      case 'monthly':
        const dayOfMonth = schedule.dayOfMonth || 1;
        const suffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th';
        return `Monthly on the ${dayOfMonth}${suffix} at ${time}`;
      case 'quarterly':
        return `Quarterly at ${time}`;
      default:
        return `At ${time}`;
    }
  };

  const getNextRunFormatted = (nextRun: string) => {
    try {
      return format(new Date(nextRun), 'MMM dd, yyyy hh:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const getLastRunFormatted = (lastRun?: string) => {
    if (!lastRun) return 'Never';
    try {
      return format(new Date(lastRun), 'MMM dd, yyyy hh:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  if (templatesLoading || schedulesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading schedules...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Report Scheduler</h2>
          <p className="text-muted-foreground">
            Automate report generation with scheduled runs
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingSchedule(null);
            form.reset();
            setShowForm(true);
          }}
        >
          <Calendar className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(s => s.active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused Schedules</CardTitle>
            <Pause className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(s => !s.active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Templates</CardTitle>
            <Clock4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
            </CardTitle>
            <CardDescription>
              {editingSchedule
                ? 'Update the existing report schedule configuration'
                : 'Configure a new automated report schedule'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Weekly Sales Report" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="templateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report Template</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map((template: ReportTemplate) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conditional fields based on frequency */}
                {form.watch('frequency') === 'weekly' && (
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Week</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Sunday</SelectItem>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch('frequency') === 'monthly' && (
                  <FormField
                    control={form.control}
                    name="dayOfMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Month</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Day of the month (1-31). If the day doesn't exist in a month, it will use the last day.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hour (24h format)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minute</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active Schedule
                        </FormLabel>
                        <FormDescription>
                          Enable this schedule to start generating reports automatically
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

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingSchedule(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                  >
                    {(createScheduleMutation.isPending || updateScheduleMutation.isPending) && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>
            Manage your automated report schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <IllustratedTooltip
                illustration={illustrations.empty}
                title="No schedules created"
                description="Create your first automated report schedule to get started"
              />
              <Button
                className="mt-4"
                onClick={() => {
                  setEditingSchedule(null);
                  form.reset();
                  setShowForm(true);
                }}
              >
                Create First Schedule
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule: ReportScheduleItem) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {schedule.name}
                    </TableCell>
                    <TableCell>{schedule.templateName}</TableCell>
                    <TableCell>{getFrequencyDescription(schedule)}</TableCell>
                    <TableCell>{getNextRunFormatted(schedule.nextRun)}</TableCell>
                    <TableCell>{getLastRunFormatted(schedule.lastRun)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {schedule.active
                          ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          )
                          : (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Pause className="h-3 w-3" /> Paused
                            </span>
                          )
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditSchedule(schedule)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleSchedule(schedule.id, !schedule.active)}
                          >
                            {schedule.active ? (
                              <div className="flex items-center">
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                              </div>
                            )}
                          </DropdownMenuItem>
                          <Separator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Helpful Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Scheduling Tips</AlertTitle>
        <AlertDescription>
          Reports are generated using the server's timezone. Make sure to account for timezone differences 
          when setting up schedules. All times are displayed in your local timezone for convenience.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default ReportScheduler;
