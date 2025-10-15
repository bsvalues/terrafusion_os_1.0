import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Progress} from '@/components/ui/progress';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {Users, 
  TrendingUp, 
  Clock, 
  Target,
  Award,
  MessageCircle,
  FileText,
  CheckCircle,
  Warning,
  Calendar,
  BarChart3,
  Activity} from '@mui/icons-material';
import {apiRequest} from '@/lib/queryClient';

interface TeamMember {id: number;
  username: string;
  role: string;
  avatar?: string;
  stats: {
    annotationsCreated: number;
    commentsAdded: number;
    issuesResolved: number;
    responseTime: number; // in hours
    collaborationScore: number; // 0-100
    activeThisWeek: boolean;};
}

interface TeamMetrics {totalMembers: number;
  activeMembers: number;
  totalAnnotations: number;
  totalComments: number;
  avgResponseTime: number;
  collaborationTrend: number; // percentage change
  topPerformers: TeamMember[];
  recentActivity: {
    date: string;
    annotations: number;
    comments: number;
    resolutions: number;}[];
}

interface TeamPerformanceProps {dateRange?: string;
  teamId?: number;}

export function TeamPerformance({dateRange = '7d', teamId}: TeamPerformanceProps) {const [selectedDateRange, setSelectedDateRange] = useState(dateRange);
  const [selectedMetric, setSelectedMetric] = useState('collaboration');

  // Fetch team performance metrics
  const { data: teamMetrics, isLoading} = useQuery({
    queryKey: ['/api/collaborative/team-metrics', selectedDateRange, teamId],
    queryFn: () =>{
      const params = new URLSearchParams();
      params.append('dateRange', selectedDateRange);
      if (teamId) params.append('teamId', teamId.toString());
      return apiRequest('GET', `/api/collaborative/team-metrics?${params.toString()}`);
    },
    refetchInterval: 60000 // Refetch every minute
  });

  // Fetch individual team members
  const {data: teamMembers, isLoading: membersLoading} = useQuery({
    queryKey: ['/api/collaborative/team-members', selectedDateRange, teamId],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('dateRange', selectedDateRange);
      if (teamId) params.append('teamId', teamId.toString());
      return apiRequest('GET', `/api/collaborative/team-members?${params.toString()}`);
    }
  });

  const metrics: TeamMetrics = teamMetrics?.data || {totalMembers: 0,
    activeMembers: 0,
    totalAnnotations: 0,
    totalComments: 0,
    avgResponseTime: 0,
    collaborationTrend: 0,
    topPerformers: [],
    recentActivity: []};

  const members: TeamMember[] = teamMembers?.data || [];

  const getPerformanceColor = (score: number) => {if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';};

  const getPerformanceBadge = (score: number) => {if (score >= 90) return { label: 'Excellent', color: 'bg-green-500/20 text-green-300 border-green-500/30'};
    if (score >= 70) return {label: 'Good', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30'};
    if (score >= 50) return {label: 'Average', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'};
    return {label: 'Needs Improvement', color: 'bg-red-500/20 text-red-300 border-red-500/30'};
  };

  const getRoleColor = (role: string) => {switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'supervisor':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'auditor':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'analyst':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';}
  };

  if (isLoading || membersLoading) {return (<Card className="bg-gray-900/50 border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div></div></CardContent></Card>);}

  return (<div className="space-y-6">{/* Header with Controls */}<Card className="bg-gray-900/50 border-gray-700"><CardHeader className="pb-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-cyan-400" /><CardTitle className="text-lg font-semibold text-white">Team Performance Dashboard</CardTitle></div><div className="flex items-center gap-4"><Select value={selectedDateRange} onValueChange={setSelectedDateRange}><SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white"><Calendar className="h-4 w-4 mr-2" /><><SelectValue /></SelectTrigger><SelectContent
</>
className="bg-gray-800 border-gray-600"><><SelectItem value="24h">Last 24 Hours</SelectItem><SelectItem
</>
value="7d">Last 7 Days</SelectItem><><SelectItem value="30d">Last 30 Days</SelectItem><SelectItem
</>
value="90d">Last 90 Days</SelectItem></SelectContent></Select><Select value={selectedMetric} onValueChange={setSelectedMetric}><SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white"><BarChart3 className="h-4 w-4 mr-2" /><><SelectValue /></SelectTrigger><SelectContent
</>
className="bg-gray-800 border-gray-600"><><SelectItem value="collaboration">Collaboration</SelectItem><SelectItem
</>
value="productivity">Productivity</SelectItem><><SelectItem value="response-time">Response Time</SelectItem><SelectItem
</>
value="resolution-rate">Resolution Rate</SelectItem></SelectContent></Select></div></div></CardHeader>{/* Key Metrics */}<CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-6"><div className="text-center"><div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-cyan-500/20 rounded-full"><><Users className="h-6 w-6 text-cyan-400" /></div><div
</>
className="text-2xl font-bold text-white">{metrics.activeMembers}</div><><div className="text-sm text-gray-400">Active Members</div><div
</>
className="text-xs text-cyan-400">of {metrics.totalMembers} total</div></div><div className="text-center"><div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-500/20 rounded-full"><><FileText className="h-6 w-6 text-blue-400" /></div><div
</>
className="text-2xl font-bold text-white">{metrics.totalAnnotations}</div><><div className="text-sm text-gray-400">Annotations</div><div
</>className={`text-xs ${metrics.collaborationTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.collaborationTrend >= 0 ? '↗' : '↘'} {Math.abs(metrics.collaborationTrend)}%</div></div><div className="text-center"><div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-500/20 rounded-full"><><MessageCircle className="h-6 w-6 text-green-400" /></div><div
</>
className="text-2xl font-bold text-white">{metrics.totalComments}</div><><div className="text-sm text-gray-400">Comments</div><div
</>
className="text-xs text-gray-500">this period</div></div><div className="text-center"><div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-orange-500/20 rounded-full"><><Clock className="h-6 w-6 text-orange-400" /></div><div
</>
className="text-2xl font-bold text-white">{metrics.avgResponseTime}h</div><><div className="text-sm text-gray-400">Avg Response</div><div
</>
className="text-xs text-gray-500">time</div></div></div></CardContent></Card>{/* Top Performers */}<Card className="bg-gray-900/50 border-gray-700"><CardHeader><CardTitle className="text-white flex items-center gap-2"><Award className="h-5 w-5 text-yellow-400" />Top Performers</CardTitle></CardHeader><CardContent><div className="space-y-4">{metrics.topPerformers.slice(0, 3).map((performer /* , index */) => (<div key={performer.id} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg"><div className="flex items-center gap-3"><><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-yellow-500/20 text-yellow-300' : 
                      index === 1 ? 'bg-gray-400/20 text-gray-300' : 
                      'bg-orange-500/20 text-orange-300'}`}>{index + 1}</div><Avatar
</></>><AvatarFallback className="bg-cyan-500/20 text-cyan-300">{performer.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar></div><div className="flex-1"><div className="flex items-center justify-between"><div><><div className="font-medium text-white">{performer.username}</div><Badge
</>variant="outline" className={getRoleColor(performer.role)}>
                        {performer.role}</Badge></div><div className="text-right"><><div className={`text-lg font-bold ${getPerformanceColor(performer.stats.collaborationScore)}`}>{performer.stats.collaborationScore}</div><div
</>
className="text-xs text-gray-400">collaboration score</div></div></div><div className="mt-2 grid grid-cols-3 gap-4 text-sm"><div className="text-center"><><div className="text-white font-medium">{performer.stats.annotationsCreated}</div><div
</>
className="text-gray-400 text-xs">Annotations</div></div><div className="text-center"><><div className="text-white font-medium">{performer.stats.commentsAdded}</div><div
</>
className="text-gray-400 text-xs">Comments</div></div><div className="text-center"><><div className="text-white font-medium">{performer.stats.issuesResolved}</div><div
</>
className="text-gray-400 text-xs">Resolved</div></div></div></div></div>))}</div></CardContent></Card>{/* Team Members List */}<Card className="bg-gray-900/50 border-gray-700"><CardHeader><CardTitle className="text-white flex items-center gap-2"><Activity className="h-5 w-5 text-cyan-400" />Team Members ({members.length})</CardTitle></CardHeader><CardContent><div className="space-y-3">{members.map((member) => {
              const performanceBadge = getPerformanceBadge(member.stats.collaborationScore);
              
              return (<div key={member.id} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg"><Avatar><AvatarFallback className="bg-cyan-500/20 text-cyan-300">{member.username.charAt(0).toUpperCase()}</AvatarFallback></Avatar><div className="flex-1"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><><span className="font-medium text-white">{member.username}</span><Badge
</>variant="outline" className={getRoleColor(member.role)}>
                          {member.role}</Badge>{member.stats.activeThisWeek && (<><div className="w-2 h-2 bg-green-400 rounded-full" title="Active this week" />)}</div><Badge
</>variant="outline" className={performanceBadge.color}>
                        {performanceBadge.label}</Badge></div><div className="mb-2"><div className="flex items-center justify-between text-sm mb-1"><><span className="text-gray-400">Collaboration Score</span><span
</>className={getPerformanceColor(member.stats.collaborationScore)}>
                          {member.stats.collaborationScore}/100</span></div><><Progress 
                        value={member.stats.collaborationScore} 
                        className="h-2" /></div><div
</>
className="grid grid-cols-4 gap-4 text-sm"><div className="text-center"><><div className="text-white font-medium">{member.stats.annotationsCreated}</div><div
</>
className="text-gray-400 text-xs">Annotations</div></div><div className="text-center"><><div className="text-white font-medium">{member.stats.commentsAdded}</div><div
</>
className="text-gray-400 text-xs">Comments</div></div><div className="text-center"><><div className="text-white font-medium">{member.stats.issuesResolved}</div><div
</>
className="text-gray-400 text-xs">Resolved</div></div><div className="text-center"><><div className="text-white font-medium">{member.stats.responseTime}h</div><div
</>
className="text-gray-400 text-xs">Response</div></div></div></div></div>);
            })}
            
            {members.length === 0 && (<div className="text-center py-8"><Users className="h-12 w-12 text-gray-600 mx-auto mb-4" /><><p className="text-gray-400">No team members found</p><p
</>className="text-sm text-gray-500 mt-1">
                  Team member data will appear here as users collaborate</p></div>)}</div></CardContent></Card></div>
  );
}

export default TeamPerformance;