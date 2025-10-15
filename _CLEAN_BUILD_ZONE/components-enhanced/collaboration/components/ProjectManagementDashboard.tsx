/**
 * Terrafusion OS 1.0 - Project Management Dashboard
 * Government-Grade Multi-User Project Coordination
 * 
 * Comprehensive project management interface for government teams
 * with real-time collaboration, task tracking, and compliance features.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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
  Alert,
  AlertDescription,
} from '../../ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
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
import { Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  Activity,
  FileText,
  Settings,
  MoreVertical,
  Kanban,
  List,
  BarChart3,
  Refresh
 } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useToast } from '../../ui/use-toast';
import {
  Project,
  Task,
  CollaborationUser,
  Team,
  ProjectStatus,
  ProjectPriority,
  TaskStatus,
  ProjectType,
  CollaborationComponentProps
} from '../types/CollaborationTypes';
import { collaborationService } from '../services/CollaborationService';
import { ProjectCreateDialog } from './ProjectCreateDialog';
import { TaskKanbanBoard } from './TaskKanbanBoard';
import { ProjectAnalytics } from './ProjectAnalytics';
import { TeamCollaboration } from './TeamCollaboration';

interface ProjectManagementDashboardProps extends CollaborationComponentProps {
  viewMode?: 'grid' | 'list' | 'kanban';
  showAnalytics?: boolean;
  showTeamView?: boolean;
  departmentFilter?: string;
}

export const ProjectManagementDashboard: React.FC<ProjectManagementDashboardProps> = ({
  className = '',
  user,
  viewMode: initialViewMode = 'grid',
  showAnalytics = true,
  showTeamView = true,
  departmentFilter,
  onUpdate,
  onError
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ProjectPriority | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ProjectType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('projects');

  // Fetch projects
  const { 
    data: projects = [], 
    isLoading: projectsLoading, 
    error: projectsError,
    refetch: refetchProjects
  } = useQuery({
    queryKey: ['collaboration-projects', user?.id],
    queryFn: () => user ? collaborationService.getUserProjects(user.id) : [],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch teams
  const { 
    data: teams = [], 
    isLoading: teamsLoading 
  } = useQuery({
    queryKey: ['collaboration-teams', user?.id],
    queryFn: () => user ? collaborationService.getUserTeams(user.id) : [],
    enabled: !!user,
  });

  // Fetch collaboration metrics
  const { 
    data: metrics,
    isLoading: metricsLoading 
  } = useQuery({
    queryKey: ['collaboration-metrics'],
    queryFn: () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      return collaborationService.getMetrics(startDate, endDate);
    },
    enabled: showAnalytics,
    refetchInterval: 60000, // Refresh every minute
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (projectData: Partial<Project>) => 
      collaborationService.createProject(projectData),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries(['collaboration-projects']);
      toast({
        title: 'Project Created',
        description: `"${newProject.name}" has been created successfully.`,
      });
      setIsCreateDialogOpen(false);
      onUpdate?.(newProject);
    },
    onError: (error) => {
      console.error('Failed to create project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
      onError?.(error as Error);
    },
  });

  // Update project status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ projectId, status }: { projectId: string; status: ProjectStatus }) =>
      collaborationService.updateProjectStatus(projectId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['collaboration-projects']);
      toast({
        title: 'Status Updated',
        description: 'Project status has been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Failed to update project status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project status.',
        variant: 'destructive',
      });
    },
  });

  // Filter projects based on current filters
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(p => p.priority === priorityFilter);
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === typeFilter);
    }
    if (departmentFilter) {
      filtered = filtered.filter(p => p.team.department === departmentFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.team.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [projects, statusFilter, priorityFilter, typeFilter, departmentFilter, searchQuery]);

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter(p => p.status === ProjectStatus.ACTIVE).length;
    const completed = projects.filter(p => p.status === ProjectStatus.COMPLETED).length;
    const overdue = projects.filter(p => 
      p.timeline.endDate < new Date() && 
      p.status !== ProjectStatus.COMPLETED
    ).length;

    return { total, active, completed, overdue };
  }, [projects]);

  // Real-time updates
  useEffect(() => {
    const handleProjectUpdated = (updatedProject: Project) => {
      queryClient.setQueryData(['collaboration-projects', user?.id], (oldData: Project[] = []) => {
        return oldData.map(p => p.id === updatedProject.id ? updatedProject : p);
      });
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      // Update projects with task changes
      queryClient.invalidateQueries(['collaboration-projects']);
    };

    collaborationService.on('project-updated', handleProjectUpdated);
    collaborationService.on('task-updated', handleTaskUpdated);

    return () => {
      collaborationService.off('project-updated', handleProjectUpdated);
      collaborationService.off('task-updated', handleTaskUpdated);
    };
  }, [queryClient, user?.id]);

  const handleProjectCreate = (projectData: Partial<Project>) => {
    createProjectMutation.mutate(projectData);
  };

  const handleStatusChange = (projectId: string, status: ProjectStatus) => {
    updateStatusMutation.mutate({ projectId, status });
  };

  const getStatusBadgeVariant = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.ACTIVE:
        return 'default';
      case ProjectStatus.COMPLETED:
        return 'secondary';
      case ProjectStatus.ON_HOLD:
        return 'outline';
      case ProjectStatus.CANCELLED:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: ProjectPriority) => {
    switch (priority) {
      case ProjectPriority.CRITICAL:
      case ProjectPriority.EMERGENCY:
        return 'destructive';
      case ProjectPriority.HIGH:
        return 'secondary';
      case ProjectPriority.MEDIUM:
        return 'default';
      default:
        return 'outline';
    }
  };

  if (projectsError) {
    return (
      <Alert variant="destructive" className={`mx-4 ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load projects. Please refresh the page or contact support.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><>

          <h2 className="text-2xl font-bold tracking-tight">Project Management</h2>
          <p
</>
className="text-muted-foreground">
            Manage your government projects with real-time collaboration
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchProjects()}
            disabled={projectsLoading}
          ><>

            <Refresh className={`h-4 w-4 mr-2 ${projectsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Dialog
</>
open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <ProjectCreateDialog
                teams={teams}
                currentUser={user}
                onSubmit={handleProjectCreate}
                onClose={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText
</>
className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity
</>
className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2
</>
className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle
</>
className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList><>

          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger
</>
value="tasks">Tasks</TabsTrigger>
          {showAnalytics && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          {showTeamView && <TabsTrigger value="teams">Teams</TabsTrigger>}
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-32"><>

                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent
</>
</>><>

                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem
</>
value={ProjectStatus.DRAFT}>Draft</SelectItem><>

                  <SelectItem value={ProjectStatus.PLANNING}>Planning</SelectItem>
                  <SelectItem
</>
value={ProjectStatus.ACTIVE}>Active</SelectItem><>

                  <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
                  <SelectItem
</>
value={ProjectStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
                <SelectTrigger className="w-32"><>

                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent
</>
</>><>

                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem
</>
value={ProjectPriority.LOW}>Low</SelectItem><>

                  <SelectItem value={ProjectPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem
</>
value={ProjectPriority.HIGH}>High</SelectItem>
                  <SelectItem value={ProjectPriority.CRITICAL}>Critical</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                ><>

                  <Kanban className="h-4 w-4" />
                </Button>
                <Button
</>

                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Projects Grid/List */}
          {projectsLoading ? (
            <div className="text-center py-8">
              <Refresh className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-8 w-8 mx-auto mb-4 text-muted-foreground" /><>

                <p className="text-lg font-medium mb-2">No projects found</p>
                <p
</>
className="text-muted-foreground mb-4">
                  {projects.length === 0 
                    ? "Create your first project to get started"
                    : "Try adjusting your filters"
                  }
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
              : 'space-y-4'
            }>
              {filteredProjects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div><>

                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription
</>
className="mt-1 line-clamp-2">
                          {project.description}
                        </CardDescription>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent><>

                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
</>
onClick={() => setSelectedProject(project)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator /><>

                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(project.id, ProjectStatus.ACTIVE)}
                          >
                            Mark Active
                          </DropdownMenuItem>
                          <DropdownMenuItem
</>

                            onClick={() => handleStatusChange(project.id, ProjectStatus.ON_HOLD)}
                          >
                            Put On Hold
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(project.id, ProjectStatus.COMPLETED)}
                          >
                            Mark Complete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3"><>

                      <Badge variant={getStatusBadgeVariant(project.status)}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                      <Badge
</>
variant={getPriorityBadgeVariant(project.priority)}>
                        {project.priority}
                      </Badge>
                      <Badge variant="outline">
                        {project.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" /><>

                        <span>{project.team.name}</span>
                        <span
</>
</>>•</span>
                        <span>{project.participants.length} members</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {new Date(project.timeline.endDate).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {project.tasks.filter(t => t.status === TaskStatus.DONE).length} / {project.tasks.length} tasks completed
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: project.tasks.length > 0 
                              ? `${(project.tasks.filter(t => t.status === TaskStatus.DONE).length / project.tasks.length) * 100}%`
                              : '0%'
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <TaskKanbanBoard
            projects={filteredProjects}
            currentUser={user}
            onUpdate={onUpdate}
            onError={onError}
          />
        </TabsContent>

        {/* Analytics Tab */}
        {showAnalytics && (
          <TabsContent value="analytics">
            <ProjectAnalytics
              projects={projects}
              metrics={metrics}
              isLoading={metricsLoading}
              onUpdate={onUpdate}
              onError={onError}
            />
          </TabsContent>
        )}

        {/* Teams Tab */}
        {showTeamView && (
          <TabsContent value="teams">
            <TeamCollaboration
              teams={teams}
              currentUser={user}
              projects={projects}
              onUpdate={onUpdate}
              onError={onError}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ProjectManagementDashboard;