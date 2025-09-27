/**
 * Terrafusion OS 1.0 - Team Collaboration Component
 * Government-Grade Team Management Interface
 * 
 * Comprehensive team management and collaboration interface
 * with member management, project assignments, and performance metrics.
 */

import React, {useState, useMemo} from 'react';
import {Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,} from '../../ui/card';
import {Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,} from '../../ui/tabs';
import {Badge,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Input,} from '../../ui';
import {Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,} from '../../ui/dialog';
import {DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,} from '../../ui/dropdown-menu';
import {Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,} from '../../ui/select';
import {Plus,
  Search,
  Users,
  MoreVertical,
  User,
  Settings,
  UserPlus,
  UserMinus,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  Warning,
  MessageSquare,
  Star,
  Award,
  Target,
  Briefcase,} from '@mui/icons-material';
import {useQuery, useMutation, useQueryClient} from 'react-query';
import {useToast} from '../../ui/use-toast';
import {Team,
  Project,
  CollaborationUser,
  UserRole,
  TaskStatus,
  TeamMetrics,
  CollaborationComponentProps,} from '../types/CollaborationTypes';
import {collaborationService} from '../services/CollaborationService';

interface TeamCollaborationProps extends CollaborationComponentProps {teams: Team[];
  projects: Project[];
  showMetrics?: boolean;}

export const TeamCollaboration: React.FC<TeamCollaborationProps> = ({className = '',
  teams,
  projects,
  currentUser,
  showMetrics = true,
  onUpdate,
  onError,}) => {const { toast} = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    teams.length >0 ? teams[0].id : ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  // Get team projects
  const teamProjects = useMemo(() => {return projects.filter(p => p.team.id === selectedTeamId);}, [projects, selectedTeamId]);

  // Calculate team metrics
  const teamMetrics = useMemo(() => {if (!selectedTeam) return null;

    const allTasks = teamProjects.flatMap(p => p.tasks);
    const completedTasks = allTasks.filter(t => t.status === TaskStatus.DONE);
    const overdueTasks = allTasks.filter(t => 
      t.dueDate && new Date(t.dueDate)< new Date() && t.status !== TaskStatus.DONE
    );

    const activeProjects = teamProjects.filter(p =>p.status === 'active').length;
    const completedProjects = teamProjects.filter(p => p.status === 'completed').length;

    // Calculate individual member performance
    const memberStats = selectedTeam.members.map(member => {
      const memberTasks = allTasks.filter(t => t.assignee?.id === member.id);
      const memberCompleted = memberTasks.filter(t => t.status === TaskStatus.DONE);
      const memberOverdue = memberTasks.filter(t => 
        t.dueDate && new Date(t.dueDate)< new Date() && t.status !== TaskStatus.DONE
      );

      return {
        member,
        totalTasks: memberTasks.length,
        completedTasks: memberCompleted.length,
        overdueTasks: memberOverdue.length,
        completionRate: memberTasks.length >0 
          ? Math.round((memberCompleted.length / memberTasks.length) * 100)
          : 0,};
    });

    return {totalMembers: selectedTeam.members.length,
      activeProjects,
      completedProjects,
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      completionRate: allTasks.length > 0 
        ? Math.round((completedTasks.length / allTasks.length) * 100)
        : 0,
      memberStats,
      productivity: allTasks.length > 0 
        ? Math.round(((completedTasks.length - overdueTasks.length) / allTasks.length) * 100)
        : 100,};
  }, [selectedTeam, teamProjects]);

  // Filter team members
  const filteredMembers = useMemo(() => {if (!selectedTeam) return [];
    
    if (!searchQuery) return selectedTeam.members;
    
    const query = searchQuery.toLowerCase();
    return selectedTeam.members.filter(member =>
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.department.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query)
    );}, [selectedTeam, searchQuery]);

  // Add team member mutation
  const addMemberMutation = useMutation({mutationFn: ({ teamId, userId, role}: {teamId: string; userId: string; role?: string}) =>
      collaborationService.addTeamMember(teamId, userId, role),
    onSuccess: () => {queryClient.invalidateQueries(['collaboration-teams']);
      toast({
        title: 'Member Added',
        description: 'Team member has been added successfully.',});
    },
    onError: (error) => {console.error('Failed to add team member:', error);
      toast({
        title: 'Error',
        description: 'Failed to add team member.',
        variant: 'destructive',});
    },
  });

  // Remove team member mutation
  const removeMemberMutation = useMutation({mutationFn: ({ teamId, userId}: {teamId: string; userId: string}) =>
      collaborationService.removeTeamMember(teamId, userId),
    onSuccess: () => {queryClient.invalidateQueries(['collaboration-teams']);
      toast({
        title: 'Member Removed',
        description: 'Team member has been removed successfully.',});
    },
    onError: (error) => {console.error('Failed to remove team member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove team member.',
        variant: 'destructive',});
    },
  });

  const getRoleIcon = (role: UserRole) => {switch (role) {
      case UserRole.ADMINISTRATOR:
        return<Star className="h-3 w-3 text-yellow-500" />;
      case UserRole.DEPARTMENT_HEAD:
        return <Award className="h-3 w-3 text-purple-500" />;
      case UserRole.TEAM_LEAD:
        return <Target className="h-3 w-3 text-blue-500" />;
      case UserRole.PROJECT_MANAGER:
        return <Briefcase className="h-3 w-3 text-green-500" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;}
  };

  const getPerformanceBadgeVariant = (completionRate: number) => {if (completionRate >= 90) return 'default';
    if (completionRate >= 70) return 'secondary';
    if (completionRate >= 50) return 'outline';
    return 'destructive';};

  const MemberCard: React.FC<{member: CollaborationUser; stats?: any}>= ({member, stats}) => (<Card className="hover:shadow-md transition-shadow"><CardContent className="p-4"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="relative"><Avatar className="h-12 w-12"><AvatarImage src={member.avatar} /><AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>{member.isOnline && (<div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>)}</div><div><><h4 className="font-medium">{member.name}</h4><p
</>
className="text-sm text-muted-foreground">{member.email}</p><div className="flex items-center gap-2 mt-1"><><Badge variant="outline" className="text-xs flex items-center gap-1">{getRoleIcon(member.role)}
                  {member.role.replace('_', ' ')}</Badge><Badge
</>variant="secondary" className="text-xs">
                  {member.department}</Badge></div></div></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent><><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem
</></>><><MessageSquare className="h-4 w-4 mr-2" />Send Message</DropdownMenuItem><DropdownMenuItem
</></>><><Activity className="h-4 w-4 mr-2" />View Activity</DropdownMenuItem><DropdownMenuSeparator
</>
/><DropdownMenuItem className="text-red-600"><UserMinus className="h-4 w-4 mr-2" />Remove from Team</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>{stats && showMetrics && (<div className="mt-4 pt-4 border-t"><div className="grid grid-cols-2 gap-4 text-xs"><div><><span className="text-muted-foreground">Tasks: </span><span
</></>>{stats.completedTasks} / {stats.totalTasks}</span></div><div><><span className="text-muted-foreground">Rate: </span><Badge
</>variant={getPerformanceBadgeVariant(stats.completionRate)}
                  className="text-xs"
                >
                  {stats.completionRate}%</Badge></div></div>{stats.overdueTasks > 0 && (<div className="mt-2 flex items-center gap-1 text-xs text-red-600"><Warning className="h-3 w-3" /><span>{stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''}</span></div>)}</div>)}</CardContent></Card>);

  if (teams.length === 0) {
    return (<Card className={className}><CardContent className="text-center py-8"><Users className="h-8 w-8 mx-auto mb-4 text-muted-foreground" /><><p className="text-lg font-medium mb-2">No Teams Available</p><p
</>className="text-muted-foreground">
            You are not a member of any teams yet.</p></CardContent></Card>);
  }

  return (<div className={`space-y-6 ${className}`}>{/* Header */}<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><><h3 className="text-lg font-semibold">Team Collaboration</h3><p
</>className="text-muted-foreground">
            Manage team members, track performance, and coordinate projects</p></div><div className="flex items-center gap-2"><Select value={selectedTeamId} onValueChange={setSelectedTeamId}><SelectTrigger className="w-64"><><SelectValue placeholder="Select team" /></SelectTrigger><SelectContent
</></>>{teams.map((team) => (<SelectItem key={team.id} value={team.id}><div className="flex items-center gap-2"><Users className="h-4 w-4" /><><span>{team.name}</span><Badge
</>variant="outline" className="text-xs">
                      {team.members.length}</Badge></div></SelectItem>))}</SelectContent></Select><Button variant="outline" size="sm"><UserPlus className="h-4 w-4 mr-2" />Add Member</Button></div></div>{selectedTeam && (
          {/* Team Info Card */}<Card><CardHeader><CardTitle className="flex items-center gap-2"><><Users className="h-5 w-5" />{selectedTeam.name}</CardTitle><CardDescription
</></>>{selectedTeam.description}</CardDescription></CardHeader>{teamMetrics && showMetrics && (<CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="text-center"><><div className="text-2xl font-bold">{teamMetrics.totalMembers}</div><div
</>
className="text-xs text-muted-foreground">Members</div></div><div className="text-center"><><div className="text-2xl font-bold">{teamMetrics.activeProjects}</div><div
</>
className="text-xs text-muted-foreground">Active Projects</div></div><div className="text-center"><><div className="text-2xl font-bold">{teamMetrics.completionRate}%</div><div
</>
className="text-xs text-muted-foreground">Task Completion</div></div><div className="text-center"><><div className="text-2xl font-bold">{teamMetrics.productivity}%</div><div
</>
className="text-xs text-muted-foreground">Productivity</div></div></div></CardContent>)}</Card><Tabs value={activeTab} onValueChange={setActiveTab}><TabsList><><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger
</>
value="members">Members ({selectedTeam.members.length})</TabsTrigger><TabsTrigger value="projects">Projects ({teamProjects.length})</TabsTrigger>{showMetrics &&<TabsTrigger value="performance">Performance</TabsTrigger>}
            </TabsList><TabsContent value="overview" className="space-y-6">{/* Quick Stats */}<div className="grid gap-4 md:grid-cols-3"><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><><CardTitle className="text-sm font-medium">Active Tasks</CardTitle><Activity
</>
className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{teamMetrics?.totalTasks - teamMetrics?.completedTasks || 0}</div></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><><CardTitle className="text-sm font-medium">Completed</CardTitle><CheckCircle2
</>
className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{teamMetrics?.completedTasks || 0}</div></CardContent></Card><Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><><CardTitle className="text-sm font-medium">Overdue</CardTitle><Warning
</>
className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{teamMetrics?.overdueTasks || 0}</div></CardContent></Card></div>{/* Recent Projects */}<Card><CardHeader><CardTitle className="text-sm">Recent Projects</CardTitle></CardHeader><CardContent>{teamProjects.length === 0 ? (<p className="text-muted-foreground text-sm">No projects assigned to this team</p>) : (<div className="space-y-2">{teamProjects.slice(0, 3).map((project) => (<div key={project.id} className="flex items-center justify-between p-2 border rounded"><div><><p className="font-medium text-sm">{project.name}</p><p
</>
className="text-xs text-muted-foreground">{project.description}</p></div><Badge variant="outline">{project.status.replace('_', ' ')}</Badge></div>))}
                      {teamProjects.length > 3 && (<p className="text-xs text-muted-foreground text-center pt-2">And {teamProjects.length - 3} more projects...</p>)}</div>)}</CardContent></Card></TabsContent><TabsContent value="members" className="space-y-4">{/* Search */}<div className="flex items-center gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><><Input
                    placeholder="Search team members..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  /></div><Button
</></>><UserPlus className="h-4 w-4 mr-2" />Add Member</Button></div>{/* Members Grid */}<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filteredMembers.map((member) => {
                  const memberStats = teamMetrics?.memberStats.find(
                    s => s.member.id === member.id
                  );
                  return (<MemberCard
                      key={member.id}
                      member={member}
                      stats={memberStats} />);
                })}</div>{filteredMembers.length === 0 && (<Card><CardContent className="text-center py-8"><User className="h-8 w-8 mx-auto mb-4 text-muted-foreground" /><><p className="text-lg font-medium mb-2">No Members Found</p><p
</>className="text-muted-foreground">
                      {searchQuery ? 'Try adjusting your search criteria' : 'This team has no members'}</p></CardContent></Card>)}</TabsContent><TabsContent value="projects" className="space-y-4"><div className="grid gap-4 md:grid-cols-2">{teamProjects.map((project) => (<Card key={project.id}><CardHeader><div className="flex items-start justify-between"><div><><CardTitle className="text-base">{project.name}</CardTitle><CardDescription
</>className="line-clamp-2">
                            {project.description}</CardDescription></div><Badge variant="outline">{project.status.replace('_', ' ')}</Badge></div></CardHeader><CardContent><div className="space-y-2 text-sm"><div className="flex justify-between"><><span className="text-muted-foreground">Priority:</span><Badge
</>variant={project.priority === 'critical' || project.priority === 'emergency' 
                              ? 'destructive' : 'secondary'}>
                            {project.priority}</Badge></div><div className="flex justify-between"><><span className="text-muted-foreground">Tasks:</span><span
</></>>{project.tasks.filter(t => t.status === TaskStatus.DONE).length} / {project.tasks.length}</span></div><div className="flex justify-between"><><span className="text-muted-foreground">Due Date:</span><span
</></>>{new Date(project.timeline.endDate).toLocaleDateString()}</span></div></div></CardContent></Card>))}</div>{teamProjects.length === 0 && (<Card><CardContent className="text-center py-8"><Briefcase className="h-8 w-8 mx-auto mb-4 text-muted-foreground" /><><p className="text-lg font-medium mb-2">No Projects</p><p
</>className="text-muted-foreground">
                      This team doesn't have any projects assigned yet</p></CardContent></Card>)}</TabsContent>{showMetrics && teamMetrics && (<TabsContent value="performance" className="space-y-6">{/* Team Performance Overview */}<Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Team Performance Overview</CardTitle></CardHeader><CardContent><div className="space-y-4"><div className="flex justify-between items-center"><><span className="text-sm">Overall Productivity</span><div
</>
className="flex items-center gap-2"><div className="w-32 bg-secondary rounded-full h-2"><><div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${teamMetrics.productivity}%` }} /></div><span
</>
className="text-sm font-medium">{teamMetrics.productivity}%</span></div></div><div className="flex justify-between items-center"><><span className="text-sm">Task Completion Rate</span><div
</>
className="flex items-center gap-2"><div className="w-32 bg-secondary rounded-full h-2"><><div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${teamMetrics.completionRate}%` }} /></div><span
</>
className="text-sm font-medium">{teamMetrics.completionRate}%</span></div></div></div></CardContent></Card>{/* Member Performance */}<Card><CardHeader><CardTitle className="text-sm">Member Performance</CardTitle></CardHeader><CardContent><div className="space-y-4">{teamMetrics.memberStats.map((stats) => (<div key={stats.member.id} className="flex items-center gap-4 p-3 border rounded"><Avatar className="h-8 w-8"><AvatarImage src={stats.member.avatar} /><AvatarFallback className="text-xs">{stats.member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar><div className="flex-1"><><p className="font-medium text-sm">{stats.member.name}</p><div
</>
className="flex items-center gap-4 text-xs text-muted-foreground"><><span>{stats.totalTasks} tasks</span><span
</></>>{stats.completedTasks} completed</span>{stats.overdueTasks > 0 && (<span className="text-red-600">{stats.overdueTasks} overdue</span>)}</div></div><Badge variant={getPerformanceBadgeVariant(stats.completionRate)}>{stats.completionRate}%</Badge></div>))}</div></CardContent></Card></TabsContent>)}</Tabs>)}</div>
  );
};

export default TeamCollaboration;