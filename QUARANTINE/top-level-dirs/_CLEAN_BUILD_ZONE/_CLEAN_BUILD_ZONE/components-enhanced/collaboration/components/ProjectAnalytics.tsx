/**
 * Terrafusion OS 1.0 - Project Analytics Component
 * Government-Grade Project Analytics Dashboard
 * 
 * Comprehensive project analytics with performance metrics,
 * trend analysis, and government compliance reporting.
 */

import React, { useMemo } from 'react';
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
  Progress,
} from '../../ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Clock,
  Users,
  Target,
  Warning,
  CheckCircle2,
  Calendar,
  DollarSign,
 } from '@mui/icons-material';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import {
  Project,
  CollaborationMetrics,
  TaskStatus,
  ProjectStatus,
  ProjectPriority,
  TaskPriority,
  CollaborationComponentProps,
} from '../types/CollaborationTypes';

interface ProjectAnalyticsProps extends CollaborationComponentProps {
  projects: Project[];
  metrics?: CollaborationMetrics;
  isLoading?: boolean;
  timeframe?: 'week' | 'month' | 'quarter' | 'year';
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({
  className = '',
  projects,
  metrics,
  isLoading = false,
  timeframe = 'month',
  onUpdate,
  onError,
}) => {
  // Calculate project statistics
  const projectStats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === ProjectStatus.ACTIVE).length;
    const completedProjects = projects.filter(p => p.status === ProjectStatus.COMPLETED).length;
    const onHoldProjects = projects.filter(p => p.status === ProjectStatus.ON_HOLD).length;
    const cancelledProjects = projects.filter(p => p.status === ProjectStatus.CANCELLED).length;

    const allTasks = projects.flatMap(p => p.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === TaskStatus.DONE).length;
    const overdueTasks = allTasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.DONE
    ).length;

    const overdueProjects = projects.filter(p => 
      new Date(p.timeline.endDate) < new Date() && p.status !== ProjectStatus.COMPLETED
    ).length;

    const totalBudget = projects.reduce((sum, p) => 
      sum + (p.metadata.estimatedBudget || 0), 0
    );

    const averageTasksPerProject = totalProjects > 0 ? totalTasks / totalProjects : 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      cancelledProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      overdueProjects,
      totalBudget,
      averageTasksPerProject,
      completionRate,
    };
  }, [projects]);

  // Project status distribution data
  const statusDistribution = useMemo(() => [
    { name: 'Active', value: projectStats.activeProjects, color: COLORS[0] },
    { name: 'Completed', value: projectStats.completedProjects, color: COLORS[3] },
    { name: 'On Hold', value: projectStats.onHoldProjects, color: COLORS[2] },
    { name: 'Cancelled', value: projectStats.cancelledProjects, color: COLORS[1] },
  ].filter(item => item.value > 0), [projectStats]);

  // Priority distribution
  const priorityDistribution = useMemo(() => {
    const priorities = projects.reduce((acc, project) => {
      acc[project.priority] = (acc[project.priority] || 0) + 1;
      return acc;
    }, {} as Record<ProjectPriority, number>);

    return Object.entries(priorities).map(([priority, count] /* , index */) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: count,
      color: COLORS[index % COLORS.length],
    }));
  }, [projects]);

  // Task progress over time (mock data for demonstration)
  const progressData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 30),
      end: new Date(),
    });

    return days.map((day /* , index */) => {
      const completedTasksUpToDay = Math.min(
        projectStats.completedTasks,
        Math.floor((index / days.length) * projectStats.completedTasks)
      );
      
      return {
        date: format(day, 'MMM dd'),
        completedTasks: completedTasksUpToDay,
        totalTasks: Math.min(projectStats.totalTasks, completedTasksUpToDay + (projectStats.totalTasks - projectStats.completedTasks)),
      };
    });
  }, [projectStats]);

  // Department performance (if available from metrics)
  const departmentData = useMemo(() => {
    if (!metrics?.departmentMetrics) return [];

    return metrics.departmentMetrics.map(dept => ({
      department: dept.department,
      resourceUtilization: dept.resourceUtilization,
      collaboration: dept.crossTeamCollaboration,
      projects: dept.teams.reduce((sum, team) => sum + team.projectsCompleted, 0),
    }));
  }, [metrics]);

  // Project timeline analysis
  const timelineAnalysis = useMemo(() => {
    const onTime = projects.filter(p => 
      p.status === ProjectStatus.COMPLETED && 
      new Date(p.updatedAt) <= new Date(p.timeline.endDate)
    ).length;

    const delayed = projects.filter(p => 
      (p.status === ProjectStatus.COMPLETED && new Date(p.updatedAt) > new Date(p.timeline.endDate)) ||
      (p.status !== ProjectStatus.COMPLETED && new Date() > new Date(p.timeline.endDate))
    ).length;

    const onTrack = projects.filter(p => 
      p.status === ProjectStatus.ACTIVE && 
      new Date() <= new Date(p.timeline.endDate)
    ).length;

    return {
      onTime,
      delayed,
      onTrack,
      total: projects.length,
    };
  }, [projects]);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse"><>

                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div
</>
className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <BarChart3
</>
className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">{projectStats.totalProjects}</div>
            <p
</>
className="text-xs text-muted-foreground">
              {projectStats.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target
</>
className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">{Math.round(projectStats.completionRate)}%</div>
            <Progress
</>
value={projectStats.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <Warning
</>
className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold text-destructive">
              {projectStats.overdueProjects + projectStats.overdueTasks}
            </div>
            <p
</>
className="text-xs text-muted-foreground">
              {projectStats.overdueProjects} projects, {projectStats.overdueTasks} tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign
</>
className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><>

            <div className="text-2xl font-bold">
              ${projectStats.totalBudget.toLocaleString()}
            </div>
            <p
</>
className="text-xs text-muted-foreground">
              Estimated across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger
</>
value="progress">Progress</TabsTrigger><>

          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger
</>
value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Project Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4" />
                  Project Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusDistribution.map((entry /* , index */) => (<>

                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
</>
/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center"><>

                  <div className="text-2xl font-bold text-green-600">{timelineAnalysis.onTime}</div>
                  <div
</>
className="text-xs text-muted-foreground">Completed On Time</div>
                </div>
                <div className="text-center"><>

                  <div className="text-2xl font-bold text-blue-600">{timelineAnalysis.onTrack}</div>
                  <div
</>
className="text-xs text-muted-foreground">On Track</div>
                </div>
                <div className="text-center"><>

                  <div className="text-2xl font-bold text-red-600">{timelineAnalysis.delayed}</div>
                  <div
</>
className="text-xs text-muted-foreground">Delayed</div>
                </div>
                <div className="text-center"><>

                  <div className="text-2xl font-bold">{timelineAnalysis.total}</div>
                  <div
</>
className="text-xs text-muted-foreground">Total Projects</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {/* Progress Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Task Completion Progress (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="completedTasks" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981"
                      name="Completed Tasks"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalTasks" 
                      stackId="2"
                      stroke="#3b82f6" 
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="Total Tasks"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Individual Project Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Project Progress Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => {
                  const progress = project.tasks.length > 0 
                    ? (project.tasks.filter(t => t.status === TaskStatus.DONE).length / project.tasks.length) * 100
                    : 0;
                  
                  const isOverdue = new Date(project.timeline.endDate) < new Date() && 
                    project.status !== ProjectStatus.COMPLETED;

                  return (
                    <div key={project.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div><>

                          <p className="font-medium text-sm">{project.name}</p>
                          <div
</>
className="flex items-center gap-2 text-xs text-muted-foreground"><>

                            <Badge variant="outline">{project.status.replace('_', ' ')}</Badge>
                            <Badge
</>
variant={project.priority === 'critical' || project.priority === 'emergency' ? 'destructive' : 'secondary'}>
                              {project.priority}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right"><>

                          <p className="text-sm font-medium">{Math.round(progress)}%</p>
                          <p
</>
className="text-xs text-muted-foreground">
                            {project.tasks.filter(t => t.status === TaskStatus.DONE).length} / {project.tasks.length} tasks
                          </p>
                        </div>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Department Performance */}
          {departmentData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Department Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="resourceUtilization" fill="#3b82f6" name="Resource Utilization %" />
                      <Bar dataKey="collaboration" fill="#10b981" name="Collaboration Score %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Metrics */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center"><>

                  <span className="text-sm">Average Tasks per Project</span>
                  <span
</>
className="font-medium">{Math.round(projectStats.averageTasksPerProject)}</span>
                </div>
                <div className="flex justify-between items-center"><>

                  <span className="text-sm">Task Completion Rate</span>
                  <span
</>
className="font-medium">{Math.round(projectStats.completionRate)}%</span>
                </div>
                <div className="flex justify-between items-center"><>

                  <span className="text-sm">Project Success Rate</span>
                  <span
</>
className="font-medium">
                    {projectStats.totalProjects > 0 
                      ? Math.round((projectStats.completedProjects / projectStats.totalProjects) * 100)
                      : 0
                    }%
                  </span>
                </div>
                <div className="flex justify-between items-center"><>

                  <span className="text-sm">On-Time Delivery Rate</span>
                  <span
</>
className="font-medium">
                    {timelineAnalysis.total > 0 
                      ? Math.round((timelineAnalysis.onTime / timelineAnalysis.total) * 100)
                      : 0
                    }%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quality Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center"><>

                  <span className="text-sm">Projects Completed</span>
                  <div
</>
className="flex items-center gap-2"><>

                    <span className="font-medium">{projectStats.completedProjects}</span>
                    <CheckCircle2
</>
className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <div className="flex justify-between items-center"><>

                  <span className="text-sm">Projects Overdue</span>
                  <div
</>
className="flex items-center gap-2"><>

                    <span className="font-medium">{projectStats.overdueProjects}</span>
                    <Warning
</>
className="h-4 w-4 text-red-500" />
                  </div>
                </div>
                <div className="flex justify-between items-center"><>

                  <span className="text-sm">Tasks Overdue</span>
                  <div
</>
className="flex items-center gap-2"><>

                    <span className="font-medium">{projectStats.overdueTasks}</span>
                    <Clock
</>
className="h-4 w-4 text-red-500" />
                  </div>
                </div>
                <div className="flex justify-between items-center"><>

                  <span className="text-sm">Budget Utilization</span>
                  <div
</>
className="flex items-center gap-2"><>

                    <span className="font-medium">${projectStats.totalBudget.toLocaleString()}</span>
                    <DollarSign
</>
className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          {/* Timeline Health */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

                <CardTitle className="text-sm font-medium">On Schedule</CardTitle>
                <TrendingUp
</>
className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent><>

                <div className="text-2xl font-bold text-green-600">
                  {timelineAnalysis.onTrack + timelineAnalysis.onTime}
                </div>
                <p
</>
className="text-xs text-muted-foreground">
                  Projects meeting deadlines
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

                <CardTitle className="text-sm font-medium">At Risk</CardTitle>
                <Warning
</>
className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {projects.filter(p => {
                    const daysUntilDeadline = Math.ceil(
                      (new Date(p.timeline.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return daysUntilDeadline <= 7 && daysUntilDeadline > 0 && p.status === ProjectStatus.ACTIVE;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Due within 7 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><>

                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <TrendingDown
</>
className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent><>

                <div className="text-2xl font-bold text-red-600">
                  {timelineAnalysis.delayed}
                </div>
                <p
</>
className="text-xs text-muted-foreground">
                  Past deadline
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects
                  .filter(p => p.status === ProjectStatus.ACTIVE)
                  .sort((a, b) => new Date(a.timeline.endDate).getTime() - new Date(b.timeline.endDate).getTime())
                  .slice(0, 5)
                  .map((project) => {
                    const daysUntilDeadline = Math.ceil(
                      (new Date(project.timeline.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isUrgent = daysUntilDeadline <= 3;
                    const isOverdue = daysUntilDeadline < 0;

                    return (
                      <div key={project.id} className="flex justify-between items-center p-3 border rounded">
                        <div><>

                          <p className="font-medium text-sm">{project.name}</p>
                          <p
</>
className="text-xs text-muted-foreground">
                            Team: {project.team.name}
                          </p>
                        </div>
                        <div className="text-right"><>

                          <p className={`text-sm font-medium ${
                            isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-muted-foreground'
                          }`}>
                            {isOverdue 
                              ? `${Math.abs(daysUntilDeadline)} days overdue`
                              : daysUntilDeadline === 0 
                                ? 'Due today'
                                : `${daysUntilDeadline} days left`
                            }
                          </p>
                          <p
</>
className="text-xs text-muted-foreground">
                            {format(new Date(project.timeline.endDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                
                {projects.filter(p => p.status === ProjectStatus.ACTIVE).length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No active projects with upcoming deadlines
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectAnalytics;