import React, {useState, useEffect} from 'react';
import AICommandBrain from './AICommandBrain';
import {Activity,
  Warning,
  BarChart3,
  Bell,
  Brain,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  Globe,
  Home,
  Inbox,
  LineChart,
  Mail,
  MapPin,
  MessageSquare,
  Mic,
  Package,
  PieChart,
  Refresh,
  Search,
  Send,
  Settings,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  Users,
  Zap,
  XCircle,
  Archive,
  Trash2,
  Edit3,
  Share2,
  Printer,
  Lock,
  Unlock,
  AlertCircle} from '@mui/icons-material';

interface Request {id: string;
  citizenName: string;
  citizenEmail: string;
  citizenPhone?: string;
  query: string;
  naturalLanguage: string;
  translatedQuery: string;
  status: 'new' | 'in_progress' | 'waiting' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  department?: string;
  dateSubmitted: Date;
  dateDue: Date;
  responseTime?: number;
  documents?: Document[];
  notes?: Note[];
  fee?: number;
  aiConfidence: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];}

interface Document {id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: Date;
  status: 'pending_review' | 'approved' | 'redacted' | 'rejected';}

interface Note {id: string;
  author: string;
  content: string;
  timestamp: Date;
  internal: boolean;}

interface StaffMember {id: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  activeRequests: number;
  completedToday: number;
  avgResponseTime: number;}

interface AIDiscovery {id: string;
  type: 'compliance' | 'revenue' | 'efficiency' | 'risk' | 'opportunity';
  title: string;
  description: string;
  impact: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionRequired: boolean;
  potentialSavings?: number;
  affectedRecords?: number;
  suggestedAction?: string;}

interface StaffCommandCenterProps {onReturnToPublic?: () => void;}

const StaffCommandCenter: React.FC<StaffCommandCenterProps> = ({onReturnToPublic}) => {const [selectedView, setSelectedView] = useState<'dashboard' | 'requests' | 'analytics' | 'team' | 'ai' | 'settings'>('dashboard');
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  // Real-time statistics
  const [stats, setStats] = useState({
    activeRequests: 47,
    avgResponseTime: 0.8,
    citizenSatisfaction: 94,
    requestsToday: 342,
    requestsThisWeek: 1847,
    documentsProcessed: 2341,
    revenueCollected: 47293,
    complianceRate: 98.5,
    aiDiscoveries: 12,
    staffOnline: 8,
    systemLoad: 23,
    storageUsed: 67});

  // Mock staff data
  const [staffMembers] = useState<StaffMember[]>([
    {id: '1', name: 'Sarah Johnson', role: 'Records Manager', department: 'Administration', status: 'online', activeRequests: 5, completedToday: 23, avgResponseTime: 0.5},
    {id: '2', name: 'Mike Chen', role: 'Senior Clerk', department: 'Building & Planning', status: 'online', activeRequests: 8, completedToday: 19, avgResponseTime: 0.7},
    {id: '3', name: 'Emily Davis', role: 'Public Information Officer', department: 'Communications', status: 'away', activeRequests: 3, completedToday: 15, avgResponseTime: 0.9},
    {id: '4', name: 'James Wilson', role: 'Records Specialist', department: 'Sheriff', status: 'online', activeRequests: 6, completedToday: 27, avgResponseTime: 0.4}
  ]);

  // Mock AI discoveries
  const [aiDiscoveries] = useState<AIDiscovery[]>([
    {id: '1',
      type: 'revenue',
      title: '47 Building Permits Missing Fees',
      description: 'AI detected 47 approved building permits from last month that have not collected required inspection fees',
      impact: '$47,000 in uncollected revenue',
      priority: 'high',
      actionRequired: true,
      potentialSavings: 47000,
      affectedRecords: 47,
      suggestedAction: 'Send automated payment reminders to permit holders'},
    {id: '2',
      type: 'compliance',
      title: 'Public Records Response Time Alert',
      description: '12 requests approaching statutory deadline without assigned staff',
      impact: 'Legal compliance risk',
      priority: 'critical',
      actionRequired: true,
      affectedRecords: 12,
      suggestedAction: 'Auto-assign to available staff based on workload'},
    {id: '3',
      type: 'efficiency',
      title: 'Duplicate Document Detection',
      description: 'Found 1,234 duplicate documents across multiple departments',
      impact: '2.3GB storage savings possible',
      priority: 'medium',
      actionRequired: false,
      potentialSavings: 2300,
      affectedRecords: 1234,
      suggestedAction: 'Run deduplication process during off-hours'},
    {id: '4',
      type: 'opportunity',
      title: 'Popular Search Pattern Detected',
      description: '23% of searches this week are for "2024 tax assessment" - consider creating quick access',
      impact: 'Reduce search load by 23%',
      priority: 'low',
      actionRequired: false,
      suggestedAction: 'Add to featured documents section'}
  ]);

  // Generate mock requests
  useEffect(() =>{const mockRequests: Request[] = [
      {
        id: 'REQ-2024-001',
        citizenName: 'John Smith',
        citizenEmail: 'john.smith@email.com',
        citizenPhone: '(555) 123-4567',
        query: 'building permit deck',
        naturalLanguage: 'I need a building permit for my deck',
        translatedQuery: 'Building Permit Application - Residential Deck Construction',
        status: 'in_progress',
        priority: 'medium',
        assignedTo: 'Mike Chen',
        department: 'Building & Planning',
        dateSubmitted: new Date('2024-01-15T09:30:00'),
        dateDue: new Date('2024-01-20T17:00:00'),
        responseTime: 0.003,
        aiConfidence: 98,
        sentiment: 'positive',
        tags: ['building', 'permit', 'residential'],
        fee: 450},
      {id: 'REQ-2024-002',
        citizenName: 'Mary Johnson',
        citizenEmail: 'mary.j@email.com',
        query: 'property tax 2024',
        naturalLanguage: 'What\'s my property tax for this year?',
        translatedQuery: 'Property Tax Assessment Records - Tax Year 2024',
        status: 'new',
        priority: 'high',
        department: 'Assessor',
        dateSubmitted: new Date('2024-01-15T10:15:00'),
        dateDue: new Date('2024-01-18T17:00:00'),
        responseTime: 0.002,
        aiConfidence: 95,
        sentiment: 'neutral',
        tags: ['tax', 'assessment', 'property']},
      {id: 'REQ-2024-003',
        citizenName: 'Robert Davis',
        citizenEmail: 'rdavis@email.com',
        query: 'council meeting minutes december',
        naturalLanguage: 'I want the council meeting minutes from December',
        translatedQuery: 'City Council Meeting Minutes - December 2023',
        status: 'completed',
        priority: 'low',
        assignedTo: 'Emily Davis',
        department: 'City Clerk',
        dateSubmitted: new Date('2024-01-14T14:20:00'),
        dateDue: new Date('2024-01-19T17:00:00'),
        responseTime: 0.004,
        aiConfidence: 99,
        sentiment: 'positive',
        tags: ['council', 'minutes', 'meeting'],
        documents: [
          {
            id: 'DOC-001',
            name: 'Council_Minutes_Dec_2023.pdf',
            type: 'PDF',
            size: '2.4 MB',
            uploadedBy: 'System',
            uploadedAt: new Date('2024-01-14T14:25:00'),
            status: 'approved'}
        ]
      },
      {id: 'REQ-2024-004',
        citizenName: 'Linda Wilson',
        citizenEmail: 'lwilson@email.com',
        query: 'business license restaurant',
        naturalLanguage: 'How do I get a business license for a restaurant?',
        translatedQuery: 'Business License Application - Food Service Establishment',
        status: 'waiting',
        priority: 'urgent',
        assignedTo: 'Sarah Johnson',
        department: 'Business Licensing',
        dateSubmitted: new Date('2024-01-15T11:00:00'),
        dateDue: new Date('2024-01-16T17:00:00'),
        responseTime: 0.003,
        aiConfidence: 94,
        sentiment: 'positive',
        tags: ['business', 'license', 'restaurant', 'food'],
        notes: [
          {
            id: 'NOTE-001',
            author: 'Sarah Johnson',
            content: 'Waiting for health department clearance',
            timestamp: new Date('2024-01-15T11:30:00'),
            internal: true}
        ]
      }
    ];
    setRequests(mockRequests);
  }, []);

  // Real-time updates simulation
  useEffect(() => {const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeRequests: prev.activeRequests + Math.floor(Math.random() * 3 - 1),
        requestsToday: prev.requestsToday + Math.floor(Math.random() * 2),
        documentsProcessed: prev.documentsProcessed + Math.floor(Math.random() * 5),
        revenueCollected: prev.revenueCollected + Math.floor(Math.random() * 100),
        systemLoad: Math.min(100, Math.max(10, prev.systemLoad + Math.floor(Math.random() * 10 - 5)))}));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {switch(status) {
      case 'completed': return 'text-green-400 bg-green-900/30';
      case 'in_progress': return 'text-blue-400 bg-blue-900/30';
      case 'new': return 'text-yellow-400 bg-yellow-900/30';
      case 'waiting': return 'text-orange-400 bg-orange-900/30';
      case 'rejected': return 'text-red-400 bg-red-900/30';
      default: return 'text-gray-400 bg-gray-900/30';}
  };

  const getPriorityColor = (priority: string) => {switch(priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';}
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on ${selectedRequests.length} requests`);
    setSelectedRequests([]);
    setShowBulkActions(false);
  };

  const filteredRequests = requests.filter(req => {const matchesSearch = searchTerm === '' || 
      req.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.naturalLanguage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || req.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;});

  return (<div className="min-h-screen bg-slate-900 text-white flex">{/* Sidebar Navigation */}<div className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700"><div className="p-4 border-b border-slate-700"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center"><><Shield className="text-white" size={20} /></div><div
</></>><><h1 className="text-lg font-bold">Command Center</h1><p
</>
className="text-xs text-slate-400">Staff Portal</p></div></div></div><nav className="p-4"><ul className="space-y-1">{[
              {id: 'dashboard', label: 'Dashboard', icon: Activity},
              {id: 'requests', label: 'Requests', icon: Inbox, badge: stats.activeRequests},
              {id: 'analytics', label: 'Analytics', icon: BarChart3},
              {id: 'team', label: 'Team', icon: Users, badge: staffMembers.filter(s => s.status === 'online').length},
              {id: 'ai', label: 'AI Insights', icon: Brain, badge: aiDiscoveries.filter(d => d.actionRequired).length},
              {id: 'settings', label: 'Settings', icon: Settings}
            ].map(item => (<li key={item.id}><button
                  onClick={() => setSelectedView(item.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    selectedView === item.id
                      ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-400'
                      : 'text-slate-300 hover:bg-slate-800'}`}
                ><div className="flex items-center gap-3"><item.icon size={18} /><span>{item.label}</span></div>{item.badge && (<span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">{item.badge}</span>)}</button></li>))}</ul></nav>{/* Quick Stats */}<div className="mt-auto p-4 border-t border-slate-700"><div className="space-y-3"><div className="flex items-center justify-between text-sm"><><span className="text-slate-400">Response Time</span><span
</>
className="text-green-400 font-mono">{stats.avgResponseTime}s</span></div><div className="flex items-center justify-between text-sm"><><span className="text-slate-400">System Load</span><div
</>
className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden"><><div 
                    className={`h-full transition-all ${
                      stats.systemLoad < 50 ? 'bg-green-500' : 
                      stats.systemLoad < 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${stats.systemLoad}%` }} /></div><span
</>
className="text-xs font-mono">{stats.systemLoad}%</span></div></div></div></div></div>{/* Main Content Area */}<div className="flex-1 flex flex-col">{/* Top Header */}<header className="bg-slate-800 border-b border-slate-700 px-6 py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><><h2 className="text-2xl font-bold">{selectedView === 'dashboard' && 'Operations Dashboard'}
                {selectedView === 'requests' && 'Request Management'}
                {selectedView === 'analytics' && 'Analytics & Reports'}
                {selectedView === 'team' && 'Team Performance'}
                {selectedView === 'ai' && 'AI Discoveries'}
                {selectedView === 'settings' && 'System Settings'}</h2><div
</>
className="flex items-center gap-2 text-sm"><><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span
</>
className="text-green-400">Live</span></div></div><div className="flex items-center gap-3">{onReturnToPublic && (<button 
                  onClick={onReturnToPublic}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                ><Globe size={18} />Public Portal</button>)}<button className="p-2 hover:bg-slate-700 rounded-lg transition-colors"><><Bell size={20} /></button><button
</>
className="p-2 hover:bg-slate-700 rounded-lg transition-colors"><><Refresh size={20} /></button><div
</>
className="flex items-center gap-3 pl-3 border-l border-slate-600"><div className="text-right"><><p className="text-sm font-medium">Admin User</p><p
</>
className="text-xs text-slate-400">System Administrator</p></div><div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-600 rounded-full"></div></div></div></div></header>{/* Content Area */}<main className="flex-1 overflow-auto p-6">{/* Dashboard View */}
          {selectedView === 'dashboard' && (<div className="space-y-6">{/* Key Metrics */}<div className="grid grid-cols-4 gap-4"><div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-6 rounded-xl border border-green-700/30"><div className="flex items-center justify-between mb-2"><TrendingUp className="text-green-400" size={24} /><span className="text-xs text-green-400">+12%</span></div><><div className="text-3xl font-bold">{stats.requestsToday}</div><div
</>
className="text-sm text-slate-400">Requests Today</div></div><div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 p-6 rounded-xl border border-blue-700/30"><div className="flex items-center justify-between mb-2"><Clock className="text-blue-400" size={24} /><span className="text-xs text-blue-400">-47%</span></div><><div className="text-3xl font-bold">{stats.avgResponseTime}s</div><div
</>
className="text-sm text-slate-400">Avg Response</div></div><div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-6 rounded-xl border border-purple-700/30"><div className="flex items-center justify-between mb-2"><Users className="text-purple-400" size={24} /><span className="text-xs text-purple-400">{stats.citizenSatisfaction}%</span></div><><div className="text-3xl font-bold">{stats.requestsThisWeek}</div><div
</>
className="text-sm text-slate-400">Weekly Volume</div></div><div className="bg-gradient-to-br from-orange-900/30 to-orange-800/30 p-6 rounded-xl border border-orange-700/30"><div className="flex items-center justify-between mb-2"><DollarSign className="text-orange-400" size={24} /><span className="text-xs text-orange-400">Revenue</span></div><><div className="text-3xl font-bold">${(stats.revenueCollected / 1000).toFixed(1)}K</div><div
</>
className="text-sm text-slate-400">Collected Today</div></div></div>{/* AI Discoveries Alert */}<div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-700/30 p-6"><h3 className="text-xl font-bold mb-4 flex items-center gap-2"><><Brain className="text-purple-400" />AI Discoveries Requiring Action</h3><div
</>className="space-y-3">
                  {aiDiscoveries.filter(d => d.actionRequired).slice(0, 3).map(discovery => (<div key={discovery.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"><div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${
                          discovery.priority === 'critical' ? 'bg-red-500' :
                          discovery.priority === 'high' ? 'bg-orange-500' :
                          'bg-yellow-500'}`} /><div><><p className="font-medium">{discovery.title}</p><p
</>
className="text-sm text-slate-400">{discovery.impact}</p></div></div><button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors">Take Action</button></div>))}</div></div>{/* Live Activity Feed */}<div className="grid grid-cols-2 gap-6"><div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6"><h3 className="text-lg font-bold mb-4 flex items-center gap-2"><><Activity className="text-blue-400" />Live Activity</h3><div
</>
className="space-y-3"><div className="flex items-start gap-3"><><div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div><div
</>
className="flex-1"><p className="text-sm">New request from <span className="text-blue-400">John Smith</span></p><p className="text-xs text-slate-400">Building permit inquiry • Just now</p></div></div><div className="flex items-start gap-3"><><div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div><div
</>
className="flex-1"><><p className="text-sm">Request #REQ-2024-003 completed</p><p
</>
className="text-xs text-slate-400">Response time: 0.4s • 2 min ago</p></div></div><div className="flex items-start gap-3"><><div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div><div
</>
className="flex-1"><><p className="text-sm">AI detected duplicate documents</p><p
</>
className="text-xs text-slate-400">1,234 files • 5 min ago</p></div></div></div></div><div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6"><h3 className="text-lg font-bold mb-4 flex items-center gap-2"><><Users className="text-green-400" />Team Status</h3><div
</>className="space-y-3">
                    {staffMembers.filter(s => s.status === 'online').map(staff => (<div key={staff.id} className="flex items-center justify-between"><div className="flex items-center gap-3"><><div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full"></div><div
</></>><><p className="text-sm font-medium">{staff.name}</p><p
</>
className="text-xs text-slate-400">{staff.activeRequests} active • {staff.completedToday} completed</p></div></div><div className="flex items-center gap-2"><><div className="w-2 h-2 bg-green-500 rounded-full"></div><span
</>
className="text-xs text-green-400">Online</span></div></div>))}</div></div></div></div>)}

          {/* Requests View */}
          {selectedView === 'requests' && (<div className="space-y-6">{/* Filters and Search */}<div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4"><div className="flex items-center gap-4"><div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><><input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search requests by name, ID, or content..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none"
                    /></div><select
</>

                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  ><><option value="all">All Status</option><option
</>
value="new">New</option><><option value="in_progress">In Progress</option><option
</>
value="waiting">Waiting</option><><option value="completed">Completed</option><option
</>
value="rejected">Rejected</option></select><select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none"
                  ><><option value="all">All Priority</option><option
</>
value="urgent">Urgent</option><><option value="high">High</option><option
</>
value="medium">Medium</option><option value="low">Low</option></select><button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                  ><Package size={18} />Bulk Actions</button></div>{/* Bulk Actions Bar */}
                {showBulkActions && selectedRequests.length > 0 && (<div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-700/30 flex items-center justify-between"><><span className="text-sm">{selectedRequests.length} requests selected</span><div
</>
className="flex gap-2"><><button
                        onClick={() =>handleBulkAction('assign')}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                      >
                        Assign</button><button
</>onClick={() => handleBulkAction('export')}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                      >
                        Export</button><button
                        onClick={() =>handleBulkAction('archive')}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                      >
                        Archive</button></div></div>)}</div>{/* Requests Table */}<div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden"><table className="w-full"><thead className="bg-slate-900/50 border-b border-slate-700"><tr>{showBulkActions && (<th className="p-4"><input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRequests(filteredRequests.map(r => r.id));} else {setSelectedRequests([]);}
                            }}
                            className="rounded border-slate-600"
                          /></th>)}<><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID</th><th
</>
className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Citizen</th><><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Request</th><th
</>
className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">AI Translation</th><><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th><th
</>
className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Priority</th><><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Assigned</th><th
</>
className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Due</th><th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th></tr></thead><tbody className="divide-y divide-slate-700">{filteredRequests.map(request => (<tr key={request.id} className="hover:bg-slate-800/50 transition-colors">{showBulkActions && (<td className="p-4"><input
                              type="checkbox"
                              checked={selectedRequests.includes(request.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRequests([...selectedRequests, request.id]);} else {setSelectedRequests(selectedRequests.filter(id => id !== request.id));}
                              }}
                              className="rounded border-slate-600"
                            /></td>)}<td className="px-4 py-3"><span className="font-mono text-sm text-blue-400">{request.id}</span></td><td className="px-4 py-3"><div><><p className="text-sm font-medium">{request.citizenName}</p><p
</>
className="text-xs text-slate-400">{request.citizenEmail}</p></div></td><td className="px-4 py-3"><p className="text-sm text-slate-300 max-w-xs truncate">{request.naturalLanguage}</p></td><td className="px-4 py-3"><div className="flex items-center gap-2"><><p className="text-sm text-slate-300 max-w-xs truncate">{request.translatedQuery}</p><span
</>
className="text-xs text-green-400">{request.aiConfidence}%</span></div></td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>{request.status === 'completed' &&<CheckCircle size={12} />}
                            {request.status === 'in_progress' && <Clock size={12} />}
                            {request.status === 'new' && <AlertCircle size={12} />}
                            {request.status === 'waiting' && <Warning size={12} />}
                            {request.status === 'rejected' && <XCircle size={12} />}
                            {request.status.replace('_', ' ')}
                          </span></td><td className="px-4 py-3"><span className={`text-sm font-medium ${getPriorityColor(request.priority)}`}>{request.priority}</span></td><td className="px-4 py-3"><p className="text-sm">{request.assignedTo || 'Unassigned'}</p></td><td className="px-4 py-3"><p className="text-sm text-slate-400">{request.dateDue.toLocaleDateString()}</p></td><td className="px-4 py-3"><div className="flex gap-2"><button
                              onClick={() => setSelectedRequest(request)}
                              className="p-1 hover:bg-slate-700 rounded transition-colors"
                            ><><Eye size={16} /></button><button
</>
className="p-1 hover:bg-slate-700 rounded transition-colors"><><Edit3 size={16} /></button><button
</>
className="p-1 hover:bg-slate-700 rounded transition-colors"><MessageSquare size={16} /></button>{request.documents && (<button className="p-1 hover:bg-slate-700 rounded transition-colors"><Download size={16} /></button>)}</div></td></tr>))}</tbody></table></div></div>)}

          {/* AI Insights View - Now with FULL AI Command Brain */}
          {selectedView === 'ai' &&<AICommandBrain />}

          {/* Analytics View */}
          {selectedView === 'analytics' && (
            <div className="space-y-6">{/* Time Range Selector */}<div className="flex items-center gap-2">{['today', 'week', 'month', 'year'].map(range => (<button
                    key={range}
                    onClick={() =>setTimeRange(range as any)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}</button>))}</div>{/* Analytics Grid */}<div className="grid grid-cols-2 gap-6"><div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6"><h3 className="text-lg font-bold mb-4 flex items-center gap-2"><><LineChart className="text-blue-400" />Request Volume Trend</h3><div
</>className="h-64 flex items-end justify-between gap-2">
                    {[65, 72, 68, 74, 79, 82, 78, 85, 88, 92, 87, 94].map((height, i) => (<div key={i} className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t" style={{ height: `${height}%` }}></div>))}</div><div className="flex justify-between mt-2 text-xs text-slate-400"><><span>Jan</span><span
</></>>Feb</span><><span>Mar</span><span
</></>>Apr</span><><span>May</span><span
</></>>Jun</span><><span>Jul</span><span
</></>>Aug</span><><span>Sep</span><span
</></>>Oct</span><><span>Nov</span><span
</></>>Dec</span></div></div><div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6"><h3 className="text-lg font-bold mb-4 flex items-center gap-2"><><PieChart className="text-purple-400" />Request Categories</h3><div
</>className="space-y-3">
                    {[
                      {category: 'Property Records', percentage: 35, color: 'bg-blue-500'},
                      {category: 'Building Permits', percentage: 25, color: 'bg-green-500'},
                      {category: 'Tax Documents', percentage: 20, color: 'bg-purple-500'},
                      {category: 'Council Minutes', percentage: 12, color: 'bg-orange-500'},
                      {category: 'Other', percentage: 8, color: 'bg-gray-500'}
                    ].map(item => (<div key={item.category}><div className="flex justify-between text-sm mb-1"><><span>{item.category}</span><span
</>
className="text-slate-400">{item.percentage}%</span></div><div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${item.color} transition-all`} style={{ width: `${item.percentage}%` }}></div></div></div>))}</div></div></div>{/* Export Options */}<div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6"><><h3 className="text-lg font-bold mb-4">Generate Reports</h3><div
</>
className="grid grid-cols-4 gap-4"><button className="p-4 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex flex-col items-center gap-2"><FileText className="text-blue-400" size={24} /><span className="text-sm">Daily Summary</span></button><button className="p-4 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex flex-col items-center gap-2"><BarChart3 className="text-green-400" size={24} /><span className="text-sm">Performance Report</span></button><button className="p-4 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex flex-col items-center gap-2"><Users className="text-purple-400" size={24} /><span className="text-sm">Team Analytics</span></button><button className="p-4 bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex flex-col items-center gap-2"><DollarSign className="text-orange-400" size={24} /><span className="text-sm">Revenue Report</span></button></div></div></div>)}

          {/* Team View */}
          {selectedView === 'team' && (<div className="space-y-6"><div className="grid grid-cols-3 gap-6">{staffMembers.map(staff => (<div key={staff.id} className="bg-slate-800/50 rounded-xl border border-slate-700 p-6"><div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><><div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full"></div><div
</></>><><h3 className="font-bold">{staff.name}</h3><p
</>
className="text-sm text-slate-400">{staff.role}</p><p className="text-xs text-slate-500">{staff.department}</p></div></div><div className="flex items-center gap-2"><><div className={`w-2 h-2 rounded-full ${
                          staff.status === 'online' ? 'bg-green-500' :
                          staff.status === 'away' ? 'bg-yellow-500' :
                          'bg-gray-500'}`}></div><span
</>
className="text-xs capitalize">{staff.status}</span></div></div><div className="space-y-2"><div className="flex justify-between text-sm"><><span className="text-slate-400">Active Requests</span><span
</>
className="font-mono">{staff.activeRequests}</span></div><div className="flex justify-between text-sm"><><span className="text-slate-400">Completed Today</span><span
</>
className="font-mono text-green-400">{staff.completedToday}</span></div><div className="flex justify-between text-sm"><><span className="text-slate-400">Avg Response</span><span
</>
className="font-mono text-blue-400">{staff.avgResponseTime}s</span></div></div><div className="mt-4 pt-4 border-t border-slate-700 flex gap-2"><><button className="flex-1 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors">View Work</button><button
</>className="flex-1 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition-colors">
                        Message</button></div></div>))}</div></div>)}</main></div>{/* Request Detail Modal */}
      {selectedRequest && (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"><div className="bg-slate-800 rounded-xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-auto"><div className="p-6 border-b border-slate-700 flex items-center justify-between"><><h2 className="text-xl font-bold">Request Details: {selectedRequest.id}</h2><button
</>

                onClick={() => setSelectedRequest(null)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              ><XCircle size={20} /></button></div><div className="p-6 space-y-6">{/* Request Info */}<div className="grid grid-cols-2 gap-6"><div><><h3 className="text-sm font-medium text-slate-400 mb-2">Citizen Information</h3><div
</>
className="space-y-2"><div className="flex items-center gap-2"><User size={16} className="text-slate-400" /><span>{selectedRequest.citizenName}</span></div><div className="flex items-center gap-2"><Mail size={16} className="text-slate-400" /><span className="text-blue-400">{selectedRequest.citizenEmail}</span></div>{selectedRequest.citizenPhone && (<div className="flex items-center gap-2"><Globe size={16} className="text-slate-400" /><span>{selectedRequest.citizenPhone}</span></div>)}</div></div><div><><h3 className="text-sm font-medium text-slate-400 mb-2">Request Status</h3><div
</>
className="space-y-2"><div className="flex items-center gap-2"><><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>{selectedRequest.status.replace('_', ' ')}</span><span
</>className={`text-sm font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                        {selectedRequest.priority} priority</span></div><><div className="text-sm text-slate-400">Submitted: {selectedRequest.dateSubmitted.toLocaleString()}</div><div
</>className="text-sm text-slate-400">
                      Due: {selectedRequest.dateDue.toLocaleString()}</div></div></div></div>{/* AI Translation */}<div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/30"><div className="flex items-center justify-between mb-2"><h3 className="font-medium flex items-center gap-2"><><Brain className="text-purple-400" size={16} />AI Translation</h3><span
</>className="text-xs text-green-400">
                    {selectedRequest.aiConfidence}% confidence</span></div><><p className="text-sm text-slate-400 mb-1">Original: "{selectedRequest.naturalLanguage}"</p><p
</>
className="text-sm">Translated: "{selectedRequest.translatedQuery}"</p></div>{/* Quick Actions */}<div className="flex gap-3"><button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"><><User size={18} />Assign to Me</button><button
</>
className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"><><MessageSquare size={18} />Add Note</button><button
</>
className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"><><Upload size={18} />Upload Document</button><button
</>
className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"><CheckCircle size={18} />Mark Complete</button></div></div></div></div>)}</div>
  );
};

export default StaffCommandCenter;