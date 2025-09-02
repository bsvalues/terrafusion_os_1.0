/**
 * Terrafusion OS 1.0 - Task Kanban Board
 * Government-Grade Task Management Interface
 * 
 * Interactive Kanban board for task management with drag-and-drop,
 * real-time updates, and government compliance tracking.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import {
  Badge,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Plus,
  MoreVertical,
  Clock,
  Warning,
  User,
  Calendar,
  MessageSquare,
  FileText,
  Flag,
  Filter,
  Search,
  Users,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
 } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useToast } from '../../ui/use-toast';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';
import {
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  CollaborationUser,
  CollaborationComponentProps,
} from '../types/CollaborationTypes';
import { collaborationService } from '../services/CollaborationService';
import { TaskCreateDialog } from './TaskCreateDialog';
import { TaskDetailDialog } from './TaskDetailDialog';

interface TaskKanbanBoardProps extends CollaborationComponentProps {
  projects: Project[];
  showProjectFilter?: boolean;
  showAssigneeFilter?: boolean;
  compactView?: boolean;
}

interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  limit?: number;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
  { id: TaskStatus.BACKLOG, title: 'Backlog', color: 'bg-gray-100 text-gray-800' },
  { id: TaskStatus.TO_DO, title: 'To Do', color: 'bg-blue-100 text-blue-800', limit: 10 },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'bg-yellow-100 text-yellow-800', limit: 5 },
  { id: TaskStatus.IN_REVIEW, title: 'In Review', color: 'bg-purple-100 text-purple-800', limit: 8 },
  { id: TaskStatus.TESTING, title: 'Testing', color: 'bg-orange-100 text-orange-800', limit: 6 },
  { id: TaskStatus.DONE, title: 'Done', color: 'bg-green-100 text-green-800' },
  { id: TaskStatus.BLOCKED, title: 'Blocked', color: 'bg-red-100 text-red-800' },
];

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  className = '',
  projects,
  currentUser,
  showProjectFilter = true,
  showAssigneeFilter = true,
  compactView = false,
  onUpdate,
  onError,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Get all tasks from selected projects
  const allTasks = useMemo(() => {
    let tasks: Task[] = [];
    
    if (selectedProjectId === 'all') {
      tasks = projects.flatMap(p => p.tasks);
    } else {
      const project = projects.find(p => p.id === selectedProjectId);
      tasks = project?.tasks || [];
    }

    return tasks;
  }, [projects, selectedProjectId]);

  // Get all unique assignees
  const allAssignees = useMemo(() => {
    const assignees = new Map<string, CollaborationUser>();
    allTasks.forEach(task => {
      if (task.assignee) {
        assignees.set(task.assignee.id, task.assignee);
      }
    });
    return Array.from(assignees.values());
  }, [allTasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = allTasks;

    if (selectedAssigneeId !== 'all') {
      filtered = filtered.filter(t => t.assignee?.id === selectedAssigneeId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.assignee?.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allTasks, selectedAssigneeId, searchQuery]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      [TaskStatus.BACKLOG]: [],
      [TaskStatus.TO_DO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.IN_REVIEW]: [],
      [TaskStatus.TESTING]: [],
      [TaskStatus.DONE]: [],
      [TaskStatus.BLOCKED]: [],
    };

    filteredTasks.forEach(task => {
      grouped[task.status].push(task);
    });

    // Sort tasks within each column
    Object.values(TaskStatus).forEach(status => {
      grouped[status].sort((a, b) => {
        // Priority first, then due date
        const priorityOrder = { 
          [TaskPriority.HIGHEST]: 5, 
          [TaskPriority.HIGH]: 4, 
          [TaskPriority.MEDIUM]: 3, 
          [TaskPriority.LOW]: 2, 
          [TaskPriority.LOWEST]: 1 
        };
        
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    });

    return grouped;
  }, [filteredTasks]);

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      collaborationService.updateTask(taskId, { status }),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries(['collaboration-projects']);
      toast({
        title: 'Task Updated',
        description: `Task status changed to ${updatedTask.status.replace('_', ' ')}`,
      });
      onUpdate?.(updatedTask);
    },
    onError: (error) => {
      console.error('Failed to update task status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status. Please try again.',
        variant: 'destructive',
      });
      onError?.(error as Error);
    },
  });

  // Handle drag and drop
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Same column - just reordering (we could implement this later)
      return;
    }

    // Moving to different column - update status
    const newStatus = destination.droppableId as TaskStatus;
    const taskId = draggableId.replace('task-', '');

    updateTaskStatusMutation.mutate({ taskId, status: newStatus });
  }, [updateTaskStatusMutation]);

  // Real-time updates
  useEffect(() => {
    const handleTaskUpdated = (updatedTask: Task) => {
      queryClient.setQueryData(['collaboration-projects', currentUser?.id], (oldData: Project[] = []) => {
        return oldData.map(project => ({
          ...project,
          tasks: project.tasks.map(task => 
            task.id === updatedTask.id ? updatedTask : task
          )
        }));
      });
    };

    collaborationService.on('task-updated', handleTaskUpdated);
    return () => collaborationService.off('task-updated', handleTaskUpdated);
  }, [queryClient, currentUser?.id]);

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGHEST:
      case TaskPriority.HIGH:
        return <Flag className="h-3 w-3 text-red-500" />;
      case TaskPriority.MEDIUM:
        return <Flag className="h-3 w-3 text-orange-500" />;
      default:
        return <Flag className="h-3 w-3 text-gray-400" />;
    }
  };

  const getTaskTypeColor = (type: TaskType) => {
    const colors: Record<TaskType, string> = {
      [TaskType.FEATURE]: 'bg-blue-500',
      [TaskType.BUG]: 'bg-red-500',
      [TaskType.IMPROVEMENT]: 'bg-green-500',
      [TaskType.DOCUMENTATION]: 'bg-purple-500',
      [TaskType.TESTING]: 'bg-orange-500',
      [TaskType.DEPLOYMENT]: 'bg-indigo-500',
      [TaskType.MAINTENANCE]: 'bg-gray-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  const isTaskOverdue = (task: Task) => {
    return task.dueDate && isBefore(new Date(task.dueDate), new Date()) && task.status !== TaskStatus.DONE;
  };

  const TaskCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => {
    const isOverdue = isTaskOverdue(task);
    const project = projects.find(p => p.id === task.projectId);

    return (
      <Draggable draggableId={`task-${task.id}`} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`mb-3 ${snapshot.isDragging ? 'opacity-50' : ''}`}
          >
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-2 h-2 rounded-full ${getTaskTypeColor(task.type)}`}
                        title={task.type}
                      />
                      {getPriorityIcon(task.priority)}
                      {isOverdue && <Warning className="h-3 w-3 text-red-500" />}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent><>

                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
</>

                          onClick={() => {
                            setSelectedTask(task);
                            setIsDetailDialogOpen(true);
                          }}
                        ><>

                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
</>
</>><>

                          <Edit className="h-4 w-4 mr-2" />
                          Edit Task
                        </DropdownMenuItem>
                        <DropdownMenuSeparator
</>
/>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Title */}
                  <h4 className="font-medium text-sm leading-tight line-clamp-2">
                    {task.title}
                  </h4>

                  {/* Project badge (if showing all projects) */}
                  {selectedProjectId === 'all' && project && (
                    <Badge variant="outline" className="text-xs">
                      {project.name}
                    </Badge>
                  )}

                  {/* Description */}
                  {!compactView && task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {/* Assignee */}
                      {task.assignee && (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={task.assignee.avatar} />
                            <AvatarFallback className="text-xs">
                              {task.assignee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}

                      {/* Comments count */}
                      {task.comments.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          <span>{task.comments.length}</span>
                        </div>
                      )}
                    </div>

                    {/* Due date */}
                    {task.dueDate && (
                      <div className={`flex items-center gap-1 text-xs ${
                        isOverdue ? 'text-red-500' : 'text-muted-foreground'
                      }`}>
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>
    );
  };

  const KanbanColumn: React.FC<{ column: KanbanColumn; tasks: Task[] }> = ({ column, tasks }) => {
    const isLimitExceeded = column.limit && tasks.length > column.limit;

    return (
      <div className="flex flex-col min-w-80 max-w-80">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><>

              <h3 className="font-semibold text-sm">{column.title}</h3>
              <Badge
</>
variant="secondary" className={`text-xs ${isLimitExceeded ? 'bg-red-100 text-red-800' : ''}`}>
                {tasks.length}{column.limit && ` / ${column.limit}`}
              </Badge>
            </div>
            
            {column.id === TaskStatus.TO_DO && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCreateDialogOpen(true)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>

          {isLimitExceeded && (
            <div className="text-xs text-red-600 mb-2">
              ⚠️ Column limit exceeded
            </div>
          )}
        </div>

        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`flex-1 min-h-32 p-2 rounded-lg transition-colors ${
                snapshot.isDraggingOver 
                  ? 'bg-blue-50 border-2 border-blue-200 border-dashed' 
                  : 'bg-gray-50'
              }`}
            >
              {tasks.map((task /* , index */) => (
                <TaskCard key={task.id} task={task} index={index} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><>

          <h3 className="text-lg font-semibold">Task Board</h3>
          
          <div
</>
className="flex items-center gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <TaskCreateDialog
                  projects={projects.filter(p => selectedProjectId === 'all' || p.id === selectedProjectId)}
                  currentUser={currentUser}
                  onSubmit={(taskData) => {
                    // Handle task creation
                    setIsCreateDialogOpen(false);
                    onUpdate?.(taskData);
                  }}
                  onClose={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showProjectFilter && (
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger className="w-48"><>

                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent
</>
</>>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {showAssigneeFilter && (
              <Select value={selectedAssigneeId} onValueChange={setSelectedAssigneeId}>
                <SelectTrigger className="w-48"><>

                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent
</>
</>><>

                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem
</>
value="unassigned">Unassigned</SelectItem>
                  {allAssignees.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.id]}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Task Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          {selectedTask && (
            <TaskDetailDialog
              task={selectedTask}
              project={projects.find(p => p.id === selectedTask.projectId)}
              currentUser={currentUser}
              onUpdate={(updatedTask) => {
                onUpdate?.(updatedTask);
                setIsDetailDialogOpen(false);
              }}
              onClose={() => setIsDetailDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskKanbanBoard;