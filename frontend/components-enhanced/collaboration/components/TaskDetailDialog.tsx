/**
 * Terrafusion OS 1.0 - Task Detail Dialog
 * Government-Grade Task Management Interface
 * 
 * Comprehensive task detail view with comments, history, and real-time updates.
 */

import React, { useState, useEffect } from 'react';
import {
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../ui/tabs';
import {
  Badge,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Textarea,
} from '../../ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../ui/alert-dialog';
import { MessageSquare,
  Clock,
  Calendar,
  User,
  Flag,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  History,
  FileText,
  CheckCircle2,
  Warning,
  Timer,
  Users,
 } from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { useMutation, useQueryClient } from 'react-query';
import { useToast } from '../../ui/use-toast';
import {
  Task,
  Project,
  TaskComment,
  TaskStatus,
  TaskPriority,
  CollaborationUser,
  CommentType,
} from '../types/CollaborationTypes';
import { collaborationService } from '../services/CollaborationService';

interface TaskDetailDialogProps {
  task: Task;
  project?: Project;
  currentUser?: CollaborationUser;
  onUpdate: (task: Task) => void;
  onClose: () => void;
}

export const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  task,
  project,
  currentUser,
  onUpdate,
  onClose,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: TaskStatus) =>
      collaborationService.updateTask(task.id, { status }),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries(['collaboration-projects']);
      toast({
        title: 'Status Updated',
        description: `Task status changed to ${updatedTask.status.replace('_', ' ')}`,
      });
      onUpdate(updatedTask);
    },
    onError: (error) => {
      console.error('Failed to update task status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status.',
        variant: 'destructive',
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => {
      // In a real implementation, this would be a separate API call
      const comment: TaskComment = {
        id: `comment_${Date.now()}`,
        taskId: task.id,
        user: currentUser!,
        content,
        type: CommentType.COMMENT,
        createdAt: new Date(),
        mentions: [],
      };
      
      return collaborationService.updateTask(task.id, {
        comments: [...task.comments, comment]
      });
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries(['collaboration-projects']);
      setNewComment('');
      toast({
        title: 'Comment Added',
        description: 'Your comment has been added successfully.',
      });
      onUpdate(updatedTask);
    },
    onError: (error) => {
      console.error('Failed to add comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment.',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadgeVariant = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return 'default';
      case TaskStatus.IN_PROGRESS:
        return 'secondary';
      case TaskStatus.BLOCKED:
        return 'destructive';
      case TaskStatus.IN_REVIEW:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGHEST:
        return 'destructive';
      case TaskPriority.HIGH:
        return 'secondary';
      case TaskPriority.MEDIUM:
        return 'default';
      default:
        return 'outline';
    }
  };

  const isTaskOverdue = () => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;
  };

  const getTimeSpent = () => {
    // In a real implementation, this would calculate actual time spent
    return task.actualHours || 0;
  };

  const getProgressPercentage = () => {
    switch (task.status) {
      case TaskStatus.DONE:
        return 100;
      case TaskStatus.TESTING:
        return 90;
      case TaskStatus.IN_REVIEW:
        return 80;
      case TaskStatus.IN_PROGRESS:
        return 50;
      case TaskStatus.TO_DO:
        return 20;
      case TaskStatus.BACKLOG:
        return 0;
      case TaskStatus.BLOCKED:
        return 25;
      default:
        return 0;
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateStatusMutation.mutate(newStatus);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !currentUser) return;
    addCommentMutation.mutate(newComment.trim());
  };

  return (
    <>
      <DialogHeader>
        <div className="flex items-start justify-between">
          <div><>

            <DialogTitle className="text-xl">{task.title}</DialogTitle>
            <div
</> className="flex items-center gap-2 mt-2"><>

              <Badge variant={getStatusBadgeVariant(task.status)}>
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge
</> variant={getPriorityBadgeVariant(task.priority)}>
                {task.priority}
              </Badge>
              <Badge variant="outline">
                {task.type.replace('_', ' ')}
              </Badge>
              {isTaskOverdue() && (
                <Badge variant="destructive">
                  <Warning className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent><>

              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
</> onClick={() => setIsEditing(true)}><>

                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuSeparator
</> />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Task
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><>

                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription
</>>
                      This action cannot be undone. This will permanently delete the task
                      and all associated comments and history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter><>

                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
</> className="bg-red-600 hover:bg-red-700">
                      Delete Task
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger
</> value="comments">
            Comments ({task.comments.length})
          </TabsTrigger><>

          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger
</> value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Select
              value={task.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-48"><>

                <SelectValue />
              </SelectTrigger>
              <SelectContent
</>>
                {Object.values(TaskStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {task.status !== TaskStatus.DONE && (
              <Button
                onClick={() => handleStatusChange(TaskStatus.DONE)}
                variant="default"
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>

          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2"><>

                    <span>Completion</span>
                    <span
</>>{getProgressPercentage()}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><>

                    <span className="text-muted-foreground">Time Spent: </span>
                    <span
</>>{getTimeSpent()}h</span>
                    {task.estimatedHours && (
                      <span className="text-muted-foreground"> / {task.estimatedHours}h</span>
                    )}
                  </div>
                  <div><>

                    <span className="text-muted-foreground">Created: </span>
                    <span
</>>{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            </CardContent>
          </Card>

          {/* Project Info */}
          {project && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Project Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><>

                    <span className="text-muted-foreground">Project: </span>
                    <span
</>>{project.name}</span>
                  </div>
                  <div><>

                    <span className="text-muted-foreground">Team: </span>
                    <span
</>>{project.team.name}</span>
                  </div>
                  <div><>

                    <span className="text-muted-foreground">Project Status: </span>
                    <Badge
</> variant="outline" className="text-xs">
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div><>

                    <span className="text-muted-foreground">Project Due: </span>
                    <span
</>>{format(new Date(project.timeline.endDate), 'PPP')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-6 mt-6">
          {/* Add Comment */}
          {currentUser && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback className="text-xs">
                      {currentUser.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || addCommentMutation.isLoading}
                        size="sm"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {addCommentMutation.isLoading ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {task.comments.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" /><>

                  <p className="text-muted-foreground">No comments yet</p>
                  <p
</> className="text-xs text-muted-foreground mt-1">
                    Be the first to add a comment
                  </p>
                </CardContent>
              </Card>
            ) : (
              task.comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user.avatar} />
                        <AvatarFallback className="text-xs">
                          {comment.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1"><>

                          <span className="font-medium text-sm">{comment.user.name}</span>
                          <Badge
</> variant="outline" className="text-xs">
                            {comment.user.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Task created */}
                <div className="flex gap-3 pb-4 border-b"><>

                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div
</>>
                    <p className="text-sm">
                      <span className="font-medium">{task.reporter.name}</span> created this task
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(task.createdAt), 'PPP p')}
                    </p>
                  </div>
                </div>

                {/* Comments as activity */}
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 pb-4 border-b last:border-b-0"><>

                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div
</>>
                      <p className="text-sm">
                        <span className="font-medium">{comment.user.name}</span> added a comment
                      </p><>

                      <p className="text-xs text-muted-foreground mb-2">
                        {format(new Date(comment.createdAt), 'PPP p')}
                      </p>
                      <div
</> className="bg-muted p-2 rounded text-xs">
                        {comment.content.substring(0, 100)}
                        {comment.content.length > 100 && '...'}
                      </div>
                    </div>
                  </div>
                ))}

                {task.comments.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No activity beyond task creation
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Task Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><>

                    <span className="text-muted-foreground">ID: </span>
                    <span
</> className="font-mono">{task.id.substring(0, 8)}</span>
                  </div>
                  <div><>

                    <span className="text-muted-foreground">Type: </span>
                    <span
</>>{task.type.replace('_', ' ')}</span>
                  </div>
                  <div><>

                    <span className="text-muted-foreground">Priority: </span>
                    <span
</>>{task.priority}</span>
                  </div>
                  <div><>

                    <span className="text-muted-foreground">Status: </span>
                    <span
</>>{task.status.replace('_', ' ')}</span>
                  </div>
                  <div><>

                    <span className="text-muted-foreground">Created: </span>
                    <span
</>>{format(new Date(task.createdAt), 'PPP')}</span>
                  </div>
                  <div><>

                    <span className="text-muted-foreground">Updated: </span>
                    <span
</>>{format(new Date(task.updatedAt), 'PPP')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* People */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">People</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><>

                  <p className="text-xs text-muted-foreground mb-2">Reporter</p>
                  <div
</> className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.reporter.avatar} />
                      <AvatarFallback className="text-xs">
                        {task.reporter.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{task.reporter.name}</span>
                  </div>
                </div>

                {task.assignee && (
                  <div><>

                    <p className="text-xs text-muted-foreground mb-2">Assignee</p>
                    <div
</> className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.assignee.avatar} />
                        <AvatarFallback className="text-xs">
                          {task.assignee.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.name}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tags and Dependencies */}
          <div className="grid grid-cols-2 gap-6">
            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                {task.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No tags</p>
                )}
              </CardContent>
            </Card>

            {/* Dependencies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dependencies</CardTitle>
              </CardHeader>
              <CardContent>
                {task.dependencies.length > 0 ? (
                  <div className="space-y-2">
                    {task.dependencies.map((depId) => (
                      <div key={depId} className="text-sm">
                        <span className="font-mono">{depId.substring(0, 8)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No dependencies</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Time Tracking */}
          {(task.estimatedHours || task.actualHours) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><>

                    <span className="text-muted-foreground">Estimated: </span>
                    <span
</>>{task.estimatedHours || 0}h</span>
                  </div>
                  <div><>

                    <span className="text-muted-foreground">Actual: </span>
                    <span
</>>{task.actualHours || 0}h</span>
                  </div>
                </div>
                {task.estimatedHours && task.actualHours && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1"><>

                      <span>Progress</span>
                      <span
</>>
                        {Math.min(100, Math.round((task.actualHours / task.estimatedHours) * 100))}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          task.actualHours > task.estimatedHours 
                            ? 'bg-red-500' 
                            : 'bg-primary'
                        }`}
                        style={{
                          width: `${Math.min(100, (task.actualHours / task.estimatedHours) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-6">
        <Button onClick={onClose}>Close</Button>
      </div>
    </>
  );
};

export default TaskDetailDialog;