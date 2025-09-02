/**
 * Terrafusion OS 1.0 - Task Creation Dialog
 * Government-Grade Task Creation Interface
 * 
 * Comprehensive task creation form with project assignment,
 * assignee selection, and priority management.
 */

import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Button,
  Input,
  Textarea,
  Badge,
  Calendar,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../ui';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '../../ui/command';
import { CalendarIcon,
  Check,
  ChevronsUpDown,
  User,
  Flag,
  Clock,
  FileText,
 } from '@mui/icons-material';
import { format, addDays } from 'date-fns';
import { useMutation, useQueryClient } from 'react-query';
import { useToast } from '../../ui/use-toast';
import {
  Project,
  Task,
  TaskType,
  TaskPriority,
  TaskStatus,
  CollaborationUser,
} from '../types/CollaborationTypes';
import { collaborationService } from '../services/CollaborationService';

interface TaskCreateDialogProps {
  projects: Project[];
  currentUser?: CollaborationUser;
  defaultProjectId?: string;
  defaultAssigneeId?: string;
  onSubmit: (task: Partial<Task>) => void;
  onClose: () => void;
}

interface TaskFormData {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  dueDate?: Date;
  estimatedHours?: number;
  tags: string[];
}

export const TaskCreateDialog: React.FC<TaskCreateDialogProps> = ({
  projects,
  currentUser,
  defaultProjectId,
  defaultAssigneeId,
  onSubmit,
  onClose,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [assigneeComboboxOpen, setAssigneeComboboxOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<CollaborationUser | null>(null);
  const [tagInput, setTagInput] = useState('');

  const form = useForm<TaskFormData>({
    defaultValues: {
      title: '',
      description: '',
      type: TaskType.FEATURE,
      priority: TaskPriority.MEDIUM,
      projectId: defaultProjectId || (projects.length > 0 ? projects[0].id : ''),
      assigneeId: defaultAssigneeId || '',
      dueDate: addDays(new Date(), 7), // Default to 7 days from now
      estimatedHours: undefined,
      tags: [],
    },
  });

  const { handleSubmit, control, watch, setValue, formState: { errors, isValid } } = form;

  const watchedProjectId = watch('projectId');
  const watchedAssigneeId = watch('assigneeId');
  const watchedTags = watch('tags');

  // Get available assignees from selected project
  const availableAssignees = useMemo(() => {
    const project = projects.find(p => p.id === watchedProjectId);
    if (!project) return [];
    
    return project.participants.map(p => p.user).concat(
      project.team.members.filter(member => 
        !project.participants.some(p => p.user.id === member.id)
      )
    );
  }, [projects, watchedProjectId]);

  // Update selected project when projectId changes
  React.useEffect(() => {
    const project = projects.find(p => p.id === watchedProjectId);
    setSelectedProject(project || null);
    
    // Reset assignee if not available in new project
    if (project && watchedAssigneeId) {
      const assigneeAvailable = availableAssignees.some(a => a.id === watchedAssigneeId);
      if (!assigneeAvailable) {
        setValue('assigneeId', '');
        setSelectedAssignee(null);
      }
    }
  }, [watchedProjectId, projects, setValue, availableAssignees, watchedAssigneeId]);

  // Update selected assignee when assigneeId changes
  React.useEffect(() => {
    const assignee = availableAssignees.find(a => a.id === watchedAssigneeId);
    setSelectedAssignee(assignee || null);
  }, [watchedAssigneeId, availableAssignees]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: ({ projectId, taskData }: { projectId: string; taskData: Partial<Task> }) =>
      collaborationService.createTask(projectId, taskData),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries(['collaboration-projects']);
      toast({
        title: 'Task Created',
        description: `"${newTask.title}" has been created successfully.`,
      });
      onSubmit(newTask);
    },
    onError: (error) => {
      console.error('Failed to create task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onFormSubmit = (data: TaskFormData) => {
    if (!selectedProject || !currentUser) {
      toast({
        title: 'Error',
        description: 'Please select a project and ensure you are logged in.',
        variant: 'destructive',
      });
      return;
    }

    const taskData: Partial<Task> = {
      title: data.title,
      description: data.description,
      type: data.type,
      priority: data.priority,
      projectId: data.projectId,
      assignee: selectedAssignee || undefined,
      reporter: currentUser,
      dueDate: data.dueDate,
      estimatedHours: data.estimatedHours,
      tags: data.tags,
      status: TaskStatus.TO_DO,
      comments: [],
      dependencies: [],
    };

    createTaskMutation.mutate({ projectId: data.projectId, taskData });
  };

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      setValue('tags', [...watchedTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const getTaskTypeDescription = (type: TaskType) => {
    const descriptions: Record<TaskType, string> = {
      [TaskType.FEATURE]: 'New functionality or capability',
      [TaskType.BUG]: 'Issue or defect that needs fixing',
      [TaskType.IMPROVEMENT]: 'Enhancement to existing functionality',
      [TaskType.DOCUMENTATION]: 'Documentation creation or updates',
      [TaskType.TESTING]: 'Testing and quality assurance tasks',
      [TaskType.DEPLOYMENT]: 'Deployment and infrastructure tasks',
      [TaskType.MAINTENANCE]: 'Maintenance and operational tasks',
    };
    return descriptions[type] || 'General task';
  };

  const getPriorityDescription = (priority: TaskPriority) => {
    const descriptions: Record<TaskPriority, string> = {
      [TaskPriority.LOWEST]: 'Can be addressed when time permits',
      [TaskPriority.LOW]: 'Should be done but not urgent',
      [TaskPriority.MEDIUM]: 'Normal priority for regular workflow',
      [TaskPriority.HIGH]: 'Important and should be prioritized',
      [TaskPriority.HIGHEST]: 'Critical and requires immediate attention',
    };
    return descriptions[priority] || 'Normal priority';
  };

  return (
    <>
      <DialogHeader><>

        <DialogTitle>Create New Task</DialogTitle>
        <DialogDescription
</>>
          Create a new task and assign it to a team member. Tasks help break down project work into manageable pieces.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="title"
              rules={{ required: 'Task title is required' }}
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>Task Title *</FormLabel>
                  <FormControl
</>><>

                    <Input 
                      placeholder="Enter task title" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage
</> />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="type"
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>Task Type</FormLabel>
                  <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TaskType).map((type) => (
                        <SelectItem key={type} value={type}>
                          <div>
                            <div className="font-medium flex items-center gap-2"><>

                              <FileText className="h-3 w-3" />
                              {type.replace('_', ' ')}
                            </div>
                            <div
</> className="text-xs text-muted-foreground">
                              {getTaskTypeDescription(type)}
                            </div>
                          </div>
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
            control={control}
            name="description"
            rules={{ required: 'Task description is required' }}
            render={({ field }) => (
              <FormItem><>

                <FormLabel>Description *</FormLabel>
                <FormControl
</>><>

                  <Textarea
                    placeholder="Describe what needs to be done, acceptance criteria, and any relevant details"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage
</> />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="priority"
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>Priority</FormLabel>
                  <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TaskPriority).map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <div>
                            <div className="font-medium flex items-center gap-2"><>

                              <Flag className="h-3 w-3" />
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </div>
                            <div
</> className="text-xs text-muted-foreground">
                              {getPriorityDescription(priority)}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="projectId"
              rules={{ required: 'Project assignment is required' }}
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>Project *</FormLabel>
                  <Select
</> onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div><>

                            <div className="font-medium">{project.name}</div>
                            <div
</> className="text-xs text-muted-foreground">
                              {project.team.name} • {project.status}
                            </div>
                          </div>
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
            control={control}
            name="assigneeId"
            render={({ field }) => (
              <FormItem><>

                <FormLabel>Assignee</FormLabel>
                <Popover
</> open={assigneeComboboxOpen} onOpenChange={setAssigneeComboboxOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedAssignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={selectedAssignee.avatar} />
                              <AvatarFallback className="text-xs">
                                {selectedAssignee.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span>{selectedAssignee.name}</span>
                          </div>
                        ) : (
                          "Select assignee..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search team members..." /><>

                      <CommandEmpty>No team members found.</CommandEmpty>
                      <CommandGroup
</>>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            field.onChange('');
                            setAssigneeComboboxOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              !selectedAssignee ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>Unassigned</span>
                          </div>
                        </CommandItem>
                        {availableAssignees.map((assignee) => (
                          <CommandItem
                            key={assignee.id}
                            value={assignee.id}
                            onSelect={() => {
                              field.onChange(assignee.id);
                              setAssigneeComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedAssignee?.id === assignee.id ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={assignee.avatar} />
                                <AvatarFallback className="text-xs">
                                  {assignee.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div><>

                                <div className="font-medium">{assignee.name}</div>
                                <div
</> className="text-xs text-muted-foreground">
                                  {assignee.role} • {assignee.department}
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="dueDate"
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>Due Date</FormLabel>
                  <Popover
</>>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="estimatedHours"
              render={({ field }) => (
                <FormItem><>

                  <FormLabel>Estimated Hours</FormLabel>
                  <FormControl
</>>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="0"
                        className="pl-10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tags */}
          <FormItem><>

            <FormLabel>Tags</FormLabel>
            <FormControl
</>>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag}>
                    Add
                  </Button>
                </div>
                {watchedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {watchedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </FormControl>
          </FormItem>

          {/* Selected Project Info */}
          {selectedProject && (
            <div className="p-4 bg-muted rounded-lg"><>

              <h4 className="font-medium text-sm mb-2">Project Details</h4>
              <div
</> className="grid grid-cols-2 gap-4 text-sm">
                <div><>

                  <span className="text-muted-foreground">Team: </span>
                  <span
</>>{selectedProject.team.name}</span>
                </div>
                <div><>

                  <span className="text-muted-foreground">Status: </span>
                  <span
</>>{selectedProject.status.replace('_', ' ')}</span>
                </div>
                <div><>

                  <span className="text-muted-foreground">Due: </span>
                  <span
</>>{format(new Date(selectedProject.timeline.endDate), 'PPP')}</span>
                </div>
                <div><>

                  <span className="text-muted-foreground">Tasks: </span>
                  <span
</>>{selectedProject.tasks.length} existing</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4"><>

            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
</> 
              type="submit" 
              disabled={!isValid || createTaskMutation.isLoading}
            >
              {createTaskMutation.isLoading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default TaskCreateDialog;