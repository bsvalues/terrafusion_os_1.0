import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Search,
  Filter,
  Plus,
  Play,
  Pause,
  Square,
  Settings,
  Users,
  Calendar,
  TrendingUp,
  Zap,
  Activity,
  ChevronRight,
  Star,
  Clock,
  GitBranch,
  BarChart3,
  BookOpen,
  Code2,
  Database,
  Globe,
  Mail,
  FileText,} from 'lucide-react';

interface Workflow {id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft' | 'archived';
  category: string;
  tags: string[];
  runCount: number;
  successRate: number;
  lastRun?: string;
  nextRun?: string;
  author: string;
  created: string;
  modified: string;
  estimatedDuration: string;
  complexity: 'simple' | 'medium' | 'complex';
  isStarred: boolean;
  nodes: number;
  connections: number;
  triggers: string[];}

const mockWorkflows: Workflow[] = [
  {id: 'wf-1',
    name: 'Customer Onboarding',
    description: 'Automated customer onboarding workflow with email sequences and CRM integration',
    status: 'active',
    category: 'Customer Management',
    tags: ['onboarding', 'email', 'crm', 'automation'],
    runCount: 1247,
    successRate: 98.5,
    lastRun: '2025-09-06T14:30:00Z',
    nextRun: '2025-09-06T15:00:00Z',
    author: 'Sarah Johnson',
    created: '2025-08-15T10:00:00Z',
    modified: '2025-09-05T16:45:00Z',
    estimatedDuration: '15 minutes',
    complexity: 'medium',
    isStarred: true,
    nodes: 8,
    connections: 12,
    triggers: ['form_submission', 'api_webhook'],},
  {id: 'wf-2',
    name: 'Data Backup & Sync',
    description: 'Daily database backup with cloud synchronization and notification alerts',
    status: 'active',
    category: 'Data Management',
    tags: ['backup', 'database', 'cloud', 'notifications'],
    runCount: 892,
    successRate: 99.8,
    lastRun: '2025-09-06T02:00:00Z',
    nextRun: '2025-09-07T02:00:00Z',
    author: 'Mike Chen',
    created: '2025-07-20T09:15:00Z',
    modified: '2025-09-01T11:20:00Z',
    estimatedDuration: '45 minutes',
    complexity: 'complex',
    isStarred: false,
    nodes: 12,
    connections: 18,
    triggers: ['schedule'],},
  {id: 'wf-3',
    name: 'Lead Qualification',
    description: 'Automated lead scoring and routing based on engagement and demographics',
    status: 'active',
    category: 'Sales & Marketing',
    tags: ['leads', 'scoring', 'routing', 'sales'],
    runCount: 2156,
    successRate: 94.2,
    lastRun: '2025-09-06T13:45:00Z',
    nextRun: '2025-09-06T14:00:00Z',
    author: 'Emily Rodriguez',
    created: '2025-06-10T14:30:00Z',
    modified: '2025-09-04T09:10:00Z',
    estimatedDuration: '8 minutes',
    complexity: 'simple',
    isStarred: true,
    nodes: 5,
    connections: 7,
    triggers: ['form_submission', 'email_click'],},
  {id: 'wf-4',
    name: 'Invoice Processing',
    description: 'Automated invoice generation, approval workflow, and payment tracking',
    status: 'paused',
    category: 'Finance',
    tags: ['invoice', 'approval', 'payment', 'finance'],
    runCount: 567,
    successRate: 96.8,
    lastRun: '2025-09-05T16:20:00Z',
    author: 'David Kim',
    created: '2025-05-18T11:45:00Z',
    modified: '2025-09-05T16:25:00Z',
    estimatedDuration: '25 minutes',
    complexity: 'medium',
    isStarred: false,
    nodes: 10,
    connections: 15,
    triggers: ['manual', 'schedule'],},
  {id: 'wf-5',
    name: 'Social Media Posting',
    description: 'Scheduled content publishing across multiple social media platforms',
    status: 'draft',
    category: 'Marketing',
    tags: ['social', 'content', 'scheduling', 'multi-platform'],
    runCount: 0,
    successRate: 0,
    author: 'Lisa Wang',
    created: '2025-09-06T10:00:00Z',
    modified: '2025-09-06T14:15:00Z',
    estimatedDuration: '12 minutes',
    complexity: 'simple',
    isStarred: false,
    nodes: 6,
    connections: 8,
    triggers: ['schedule', 'manual'],},
  {id: 'wf-6',
    name: 'Error Monitoring & Alerts',
    description: 'Real-time application monitoring with automated incident response',
    status: 'active',
    category: 'DevOps',
    tags: ['monitoring', 'alerts', 'devops', 'incidents'],
    runCount: 3421,
    successRate: 99.1,
    lastRun: '2025-09-06T14:35:00Z',
    nextRun: '2025-09-06T14:40:00Z',
    author: 'Alex Thompson',
    created: '2025-04-12T08:30:00Z',
    modified: '2025-09-06T12:00:00Z',
    estimatedDuration: '5 minutes',
    complexity: 'complex',
    isStarred: true,
    nodes: 15,
    connections: 22,
    triggers: ['webhook', 'threshold'],},
];

const categories = [
  'All',
  'Customer Management',
  'Data Management',
  'Sales & Marketing',
  'Finance',
  'Marketing',
  'DevOps',
];

export function App() {const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'workflows' | 'templates' | 'monitor'
  >('dashboard');

  useEffect(() =>{
    let filtered = workflows;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        workflow =>
          workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );}

    // Apply category filter
    if (selectedCategory !== 'All') {filtered = filtered.filter(workflow => workflow.category === selectedCategory);}

    // Apply status filter
    if (statusFilter !== 'all') {filtered = filtered.filter(workflow => workflow.status === statusFilter);}

    setFilteredWorkflows(filtered);
  }, [workflows, searchTerm, selectedCategory, statusFilter]);

  const getStatusColor = (status: string) => {switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';}
  };

  const getComplexityColor = (complexity: string) => {switch (complexity) {
      case 'simple':
        return 'bg-green-50 text-green-700';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700';
      case 'complex':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-50 text-gray-700';}
  };

  const formatDate = (dateString: string) => {return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',});
  };

  const toggleWorkflowStatus = (workflowId: string) => {setWorkflows(prev =>
      prev.map(workflow => {
        if (workflow.id === workflowId) {
          const newStatus = workflow.status === 'active' ? 'paused' : 'active';
          return { ...workflow, status: newStatus};
        }
        return workflow;
      })
    );
  };

  const toggleStarred = (workflowId: string) => {setWorkflows(prev =>
      prev.map(workflow => {
        if (workflow.id === workflowId) {
          return { ...workflow, isStarred: !workflow.isStarred};
        }
        return workflow;
      })
    );
  };

  const stats = {total: workflows.length,
    active: workflows.filter(w => w.status === 'active').length,
    paused: workflows.filter(w => w.status === 'paused').length,
    successRate: workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length,};

  return (<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">{/* Header */}<motion.header
        initial={{ y: -100, opacity: 0}}
        animate={{ y: 0, opacity: 1}}
        className="bg-white/90 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50"
      ><div className="max-w-7xl mx-auto px-6 py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="flex items-center gap-3"><div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl"><Zap className="w-8 h-8 text-white" /></div><div><h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">TerraFlow</h1><p className="text-sm text-gray-500 font-medium">Workflow Automation Engine</p></div></div></div><nav className="flex items-center gap-2">{[
                {id: 'dashboard', label: 'Dashboard', icon: BarChart3},
                {id: 'workflows', label: 'Workflows', icon: GitBranch},
                {id: 'templates', label: 'Templates', icon: BookOpen},
                {id: 'monitor', label: 'Monitor', icon: Activity},
              ].map(item => (<motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05}}
                  whileTap={{ scale: 0.95}}
                  onClick={() => setCurrentView(item.id as any)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                    currentView === item.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'}`}
                ><item.icon className="w-4 h-4" /><span>Templates</span></motion.button>))}</nav></div></div></motion.header>{/* Main Content */}<main className="max-w-7xl mx-auto px-6 py-8">{/* Dashboard Overview */}<motion.div
          initial={{ opacity: 0, y: 20}}
          animate={{ opacity: 1, y: 0}}
          transition={{ delay: 0.1}}
          className="mb-8"
        ><div className="flex items-center justify-between mb-6"><div className="flex-1 max-w-md"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
                /></div></div><div className="flex items-center gap-4 ml-6"><select
                value={selectedCategory}
                onChange={e =>setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
              >
                {categories.map(category => (<option key={category} value={category}>{category}</option>))}</select><select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
              ><option value="all">All Status</option><option value="active">Active</option><option value="paused">Paused</option><option value="draft">Draft</option><option value="archived">Archived</option></select><motion.button
                whileHover={{ scale: 1.05}}
                whileTap={{ scale: 0.95}}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all font-medium shadow-lg"
              ><Plus className="w-5 h-5" />New Workflow</motion.button></div></div>{/* Stats Cards */}<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"><motion.div
              initial={{ opacity: 0, y: 20}}
              animate={{ opacity: 1, y: 0}}
              transition={{ delay: 0.2}}
              className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/60 shadow-sm"
            ><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">Total Workflows</p><p className="text-3xl font-bold text-gray-900">{stats.total}</p></div><div className="p-3 bg-blue-100 rounded-lg"><GitBranch className="w-6 h-6 text-blue-600" /></div></div></motion.div><motion.div
              initial={{ opacity: 0, y: 20}}
              animate={{ opacity: 1, y: 0}}
              transition={{ delay: 0.3}}
              className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/60 shadow-sm"
            ><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">Active</p><p className="text-3xl font-bold text-green-600">{stats.active}</p></div><div className="p-3 bg-green-100 rounded-lg"><Play className="w-6 h-6 text-green-600" /></div></div></motion.div><motion.div
              initial={{ opacity: 0, y: 20}}
              animate={{ opacity: 1, y: 0}}
              transition={{ delay: 0.4}}
              className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/60 shadow-sm"
            ><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">Paused</p><p className="text-3xl font-bold text-yellow-600">{stats.paused}</p></div><div className="p-3 bg-yellow-100 rounded-lg"><Pause className="w-6 h-6 text-yellow-600" /></div></div></motion.div><motion.div
              initial={{ opacity: 0, y: 20}}
              animate={{ opacity: 1, y: 0}}
              transition={{ delay: 0.5}}
              className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/60 shadow-sm"
            ><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">Success Rate</p><p className="text-3xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</p></div><div className="p-3 bg-green-100 rounded-lg"><TrendingUp className="w-6 h-6 text-green-600" /></div></div></motion.div></div></motion.div>{/* Workflows Grid */}<AnimatePresence mode="wait"><motion.div
            key={filteredWorkflows.length}
            initial={{ opacity: 0}}
            animate={{ opacity: 1}}
            exit={{ opacity: 0}}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >{filteredWorkflows.map((workflow, index) => (<motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20}}
                animate={{ opacity: 1, y: 0}}
                transition={{ delay: index * 0.1}}
                className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-gray-200/60 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              ><div className="flex items-start justify-between mb-4"><div className="flex-1"><div className="flex items-center gap-2 mb-2"><h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{workflow.name}</h3><button
                        onClick={e => {
                          e.stopPropagation();
                          toggleStarred(workflow.id);}}
                        className={`p-1 rounded transition-colors ${
                          workflow.isStarred
                            ? 'text-yellow-500'
                            : 'text-gray-400 hover:text-yellow-500'}`}
                      ><Star className={`w-4 h-4 ${workflow.isStarred ? 'fill-current' : ''}`} /></button></div><p className="text-gray-600 text-sm mb-3 line-clamp-2">{workflow.description}</p></div></div><div className="flex items-center justify-between mb-4"><span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}
                  >{workflow.status}</span><span
                    className={`px-2 py-1 rounded text-xs font-medium ${getComplexityColor(workflow.complexity)}`}
                  >{workflow.complexity}</span></div><div className="grid grid-cols-2 gap-4 mb-4 text-sm"><div><span className="text-gray-500">Runs:</span><span className="text-gray-900 font-semibold ml-1">{workflow.runCount}</span></div><div><span className="text-gray-500">Success:</span><span className="text-gray-900 font-semibold ml-1">{workflow.successRate}%</span></div></div>{workflow.lastRun && (<div className="mb-4"><div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-gray-400" /><span className="text-gray-500">Last run:</span><span className="text-gray-900">{formatDate(workflow.lastRun)}</span></div></div>)}<div className="flex items-center gap-2 mb-4">{workflow.tags.slice(0, 3).map(tag => (<span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{tag}</span>))}</div><div className="flex items-center justify-between"><div className="flex items-center gap-3"><button
                      onClick={e =>{
                        e.stopPropagation();
                        toggleWorkflowStatus(workflow.id);}}
                      className={`p-2 rounded-lg transition-colors ${
                        workflow.status === 'active'
                          ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                    >
                      {workflow.status === 'active' ? (<Pause className="w-4 h-4" />) : (<Play className="w-4 h-4" />)}</button><button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"><Settings className="w-4 h-4" /></button></div><div className="flex items-center gap-2 text-sm text-gray-500"><Users className="w-4 h-4" /><span>{workflow.author}</span></div></div></motion.div>))}</motion.div></AnimatePresence>{filteredWorkflows.length === 0 && (<motion.div
            initial={{ opacity: 0, y: 20}}
            animate={{ opacity: 1, y: 0}}
            className="text-center py-16"
          ><div className="text-gray-400 mb-4"><GitBranch className="w-16 h-16 mx-auto" /></div><h3 className="text-xl font-semibold text-gray-900 mb-2">No workflows found</h3><p className="text-gray-500 mb-6">Try adjusting your search or filters, or create a new workflow to get started.</p><motion.button
              whileHover={{ scale: 1.05}}
              whileTap={{ scale: 0.95}}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-all font-medium shadow-lg"
            ><Plus className="w-5 h-5" />Create Your First Workflow</motion.button></motion.div>)}</main></div>
  );
}

export default App;
