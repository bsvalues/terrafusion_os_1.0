import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {History, 
  User, 
  Calendar, 
  Filter,
  Search,
  Download,
  MessageCircle,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock} from '@mui/icons-material';
import {format} from 'date-fns';
import {apiRequest} from '@/lib/queryClient';

interface AuditTrailEntry {id: number;
  entityType: string;
  entityId: number;
  action: string;
  details: any;
  userId: number;
  username: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;}

interface AuditTrailProps {entityType?: string;
  entityId?: number;
  showFilters?: boolean;}

export function AuditTrail({entityType, entityId, showFilters = true}: AuditTrailProps) {const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (entityType) queryParams.append('entityType', entityType);
  if (entityId) queryParams.append('entityId', entityId.toString());
  if (searchTerm) queryParams.append('search', searchTerm);
  if (actionFilter !== 'all') queryParams.append('action', actionFilter);
  queryParams.append('dateRange', dateRange);
  queryParams.append('limit', '50');

  const { data: auditTrail, isLoading} = useQuery({
    queryKey: ['/api/audit-trail', queryParams.toString()],
    queryFn: () =>apiRequest('GET', `/api/audit-trail?${queryParams.toString()}`),
    refetchInterval: 30000
  });

  const getActionIcon = (action: string) => {switch (action) {
      case 'annotation_created':
      case 'annotation_updated':
        return<FileText className="h-4 w-4" />;
      case 'comment_created':
        return <MessageCircle className="h-4 w-4" />;
      case 'status_changed':
        return <CheckCircle className="h-4 w-4" />;
      case 'user_mentioned':
        return <User className="h-4 w-4" />;
      case 'priority_changed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;}
  };

  const getActionColor = (action: string) =>{switch (action) {
      case 'annotation_created':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'annotation_updated':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'comment_created':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'status_changed':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'user_mentioned':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'priority_changed':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';}
  };

  const formatActionText = (entry: AuditTrailEntry) => {
    switch (entry.action) {
      case 'annotation_created':
        return `created an annotation "${entry.details?.title || 'Untitled'}"`;
      case 'annotation_updated':
        return `updated annotation "${entry.details?.title || 'Untitled'}"`;
      case 'comment_created':
        return `added a comment`;
      case 'status_changed':
        return `changed status from ${entry.details?.from} to ${entry.details?.to}`;
      case 'user_mentioned':
        return `mentioned @${entry.details?.mentionedUser}`;
      case 'priority_changed':
        return `changed priority from ${entry.details?.from} to ${entry.details?.to}`;
      default:
        return entry.action.replace(/_/g, ' ');
    }
  };

  const exportAuditTrail = () => {// TODO: Implement export functionality
    console.log('Exporting audit trail...');};

  if (isLoading) {return (<Card className="bg-gray-900/50 border-gray-700"><CardContent className="p-6"><div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div></div></CardContent></Card>);}

  const entries: AuditTrailEntry[] = auditTrail?.data || [];

  return (<Card className="bg-gray-900/50 border-gray-700"><CardHeader className="pb-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><History className="h-5 w-5 text-cyan-400" /><CardTitle className="text-lg font-semibold text-white">Audit Trail</CardTitle></div><Button
            variant="outline"
            size="sm"
            onClick={exportAuditTrail}
            className="bg-gray-800 border-gray-600 hover:bg-gray-700"
          ><Download className="h-4 w-4 mr-2" />Export</Button></div>{showFilters && (<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /><><Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              /></div><Select
</>
value={actionFilter} onValueChange={setActionFilter}><SelectTrigger className="bg-gray-800 border-gray-600 text-white"><Filter className="h-4 w-4 mr-2" /><><SelectValue placeholder="Filter by action" /></SelectTrigger><SelectContent
</>
className="bg-gray-800 border-gray-600"><><SelectItem value="all">All Actions</SelectItem><SelectItem
</>
value="annotation_created">Annotations Created</SelectItem><><SelectItem value="annotation_updated">Annotations Updated</SelectItem><SelectItem
</>
value="comment_created">Comments Added</SelectItem><><SelectItem value="status_changed">Status Changes</SelectItem><SelectItem
</>
value="user_mentioned">User Mentions</SelectItem><SelectItem value="priority_changed">Priority Changes</SelectItem></SelectContent></Select><Select value={dateRange} onValueChange={setDateRange}><SelectTrigger className="bg-gray-800 border-gray-600 text-white"><Calendar className="h-4 w-4 mr-2" /><><SelectValue placeholder="Time range" /></SelectTrigger><SelectContent
</>
className="bg-gray-800 border-gray-600"><><SelectItem value="1h">Last Hour</SelectItem><SelectItem
</>
value="24h">Last 24 Hours</SelectItem><><SelectItem value="7d">Last 7 Days</SelectItem><SelectItem
</>
value="30d">Last 30 Days</SelectItem><><SelectItem value="90d">Last 90 Days</SelectItem><SelectItem
</>
value="all">All Time</SelectItem></SelectContent></Select><div className="text-sm text-gray-400 flex items-center"><span>{entries.length} activities found</span></div></div>)}</CardHeader><CardContent className="p-0"><ScrollArea className="h-96"><div className="p-6 pt-0">{entries.length === 0 ? (<div className="text-center py-8"><History className="h-12 w-12 text-gray-600 mx-auto mb-4" /><><p className="text-gray-400">No audit trail entries found</p><p
</>className="text-sm text-gray-500 mt-1">
                  Activity will appear here as users interact with the system</p></div>) : (<div className="space-y-4">{entries.map((entry /* , index */) => (<div key={entry.id} className="relative">{index< entries.length - 1 && (
                      <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-700" />)}<div className="flex items-start gap-4"><><div className={`p-2 rounded-full border ${getActionColor(entry.action)}`}>{getActionIcon(entry.action)}</div><div
</>
className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><><span className="font-medium text-white">{entry.username}</span><span
</>className="text-gray-400 text-sm">
                              {formatActionText(entry)}</span></div><Badge variant="outline" className={getActionColor(entry.action)}>{entry.action.replace(/_/g, ' ')}</Badge></div><div className="flex items-center gap-4 mt-1 text-xs text-gray-500"><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}</span>{entry.ipAddress && (<span>IP: {entry.ipAddress}</span>)}</div>{entry.details && Object.keys(entry.details).length > 0 && (<div className="mt-2 p-3 bg-gray-800/50 rounded-lg"><pre className="text-xs text-gray-300 whitespace-pre-wrap">{JSON.stringify(entry.details, null, 2)}</pre></div>)}</div></div></div>))}</div>)}</div></ScrollArea></CardContent></Card>
  );
}

export default AuditTrail;