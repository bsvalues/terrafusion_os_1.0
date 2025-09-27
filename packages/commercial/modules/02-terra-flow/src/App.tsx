import "./terrafusion-brand.css";
import {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Workflow,
  Play,
  Pause,
  Square,
  Plus,
  Settings,
  GitBranch,
  Activity,
  Layers,
  Zap,
  Eye,
  MoreHorizontal,
  Monitor,
  Link,
  Layers as Template,
  Home} from '@mui/icons-material';
import './App.css';

// Import our new components
import WorkflowBuilder from './components/WorkflowBuilder';
import WorkflowTemplates from './components/WorkflowTemplates';
import WorkflowMonitor from './components/WorkflowMonitor';
import CrossAppAutomation from './components/CrossAppAutomation';

interface WorkflowNode {id: string;
  type: 'trigger' | 'action' | 'condition';
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  position: { x: number; y: number};
  config: Record<string, any>;
}

interface Workflow {id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  nodes: WorkflowNode[];
  lastRun?: string;
  runCount: number;}

function App() {const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'builder' | 'templates' | 'monitor' | 'automation'>('dashboard');
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | undefined>();

  useEffect(() =>{
    loadWorkflows();}, []);

  const loadWorkflows = async () => {try {
      // Simulate loading workflows - replace with actual Tauri command
      const mockWorkflows: Workflow[] = [
        {
          id: '1',
          name: 'Data Processing Pipeline',
          status: 'active',
          nodes: [],
          runCount: 42,
          lastRun: new Date().toISOString()},
        {id: '2',
          name: 'Report Generation',
          status: 'draft',
          nodes: [],
          runCount: 0},
        {id: '3',
          name: 'API Sync Workflow',
          status: 'paused',
          nodes: [],
          runCount: 156,
          lastRun: new Date(Date.now() - 86400000).toISOString()}
      ];
      setWorkflows(mockWorkflows);
    } catch (error) {console.error('Failed to load workflows:', error);}
  };

  const getStatusIcon = (status: string) => {switch (status) {
      case 'active':
        return<Play className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'draft':
        return <Square className="w-4 h-4 text-gray-400" />;
      default:
        return <Square className="w-4 h-4 text-gray-400" />;}
  };

  const getStatusColor = (status: string) =>{switch (status) {
      case 'active': return 'border-green-200 bg-green-50';
      case 'paused': return 'border-yellow-200 bg-yellow-50';
      case 'draft': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-white';}
  };

  const handleSaveWorkflow = (workflow: any) => {const newWorkflow: Workflow = {
      id: workflow.id,
      name: workflow.name,
      status: workflow.status,
      nodes: workflow.nodes || [],
      runCount: 0};
    
    setWorkflows(prev => {const existingIndex = prev.findIndex(w => w.id === workflow.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...newWorkflow};
        return updated;
      }
      return [...prev, newWorkflow];
    });
    
    setCurrentView('dashboard');
    setSelectedWorkflow(undefined);
  };

  const handleCreateFromTemplate = (template: any) => {
    setSelectedWorkflow({
      id: template.id || `workflow_${Date.now()}`,
      name: template.name,
      status: 'draft',
      nodes: template.nodes || [],
      runCount: 0
    });
    setCurrentView('builder');
  };

  const handleEditWorkflow = (workflow: Workflow) => {setSelectedWorkflow(workflow);
    setCurrentView('builder');};

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Navigation items
  const navigationItems = [
    {id: 'dashboard', name: 'Dashboard', icon: Home, description: 'Workflow overview'},
    {id: 'builder', name: 'Builder', icon: Settings, description: 'Create workflows'},
    {id: 'templates', name: 'Templates', icon: Template, description: 'Workflow templates'},
    {id: 'monitor', name: 'Monitor', icon: Monitor, description: 'Execution monitoring'},
    {id: 'automation', name: 'Cross-App', icon: Link, description: 'App integration'}
  ];

  // Render different views based on current selection
  const renderCurrentView = () => {
    switch (currentView) {
      case 'builder':
        return (<WorkflowBuilder
            workflow={selectedWorkflow as any}
            onSave={handleSaveWorkflow}
            onClose={() =>{
              setCurrentView('dashboard');
              setSelectedWorkflow(undefined);}}
          />
        );
      case 'templates':
        return (<WorkflowTemplates
            onSelectTemplate={handleCreateFromTemplate}
            onClose={() =>setCurrentView('dashboard')}
          />
        );
      case 'monitor':
        return<WorkflowMonitor />;
      case 'automation':
        return <CrossAppAutomation />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">{/* Header */}<motion.header 
        initial={{ opacity: 0, y: -20}}
        animate={{ opacity: 1, y: 0}}
        className="border-b border-white/20 backdrop-blur-xl bg-white/10 sticky top-0 z-50"
      ><div className="max-w-7xl mx-auto px-6 py-4"><div className="flex items-center justify-between"><div className="flex items-center space-x-6"><motion.div 
                whileHover={{ scale: 1.05}}
                className="flex items-center space-x-3"
              ><div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg"><><Workflow className="w-6 h-6 text-white" /></div><div
</></>><><h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">TerraFlow</h1><p
</>
className="text-sm text-gray-500 font-medium">Workflow Automation Engine</p></div></motion.div>{/* Navigation */}<nav className="hidden md:flex items-center space-x-1">{navigationItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (<motion.button
                      key={item.id}
                      onClick={() => setCurrentView(item.id as typeof currentView)}
                      whileHover={{ scale: 1.02}}
                      whileTap={{ scale: 0.98}}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all ${
                        isActive 
                          ? 'bg-white/90 text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:bg-white/50 hover:text-gray-800'}`}
                      title={item.description}
                    ><Icon className="w-4 h-4" /><span className="text-sm">{item.name}</span></motion.button>);
                })}</nav></div><div className="flex items-center space-x-4"><div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-lg p-1"><button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                ><><Layers className="w-4 h-4" /></button><button
</>

                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                ><MoreHorizontal className="w-4 h-4" /></button></div><motion.button
                whileHover={{ scale: 1.02}}
                whileTap={{ scale: 0.98}}
                onClick={() => setCurrentView('builder')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
              ><Plus className="w-4 h-4" /><span>New Workflow</span></motion.button><motion.button
                whileHover={{ scale: 1.02}}
                whileTap={{ scale: 0.98}}
                onClick={() => setCurrentView('templates')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
              ><Template className="w-4 h-4" /><span>Templates</span></motion.button></div></div></div></motion.header>{/* Main Content */}<main className="max-w-7xl mx-auto px-6 py-8">{/* Search and Stats */}<motion.div 
          initial={{ opacity: 0, y: 20}}
          animate={{ opacity: 1, y: 0}}
          transition={{ delay: 0.1}}
          className="mb-8"
        ><div className="flex items-center justify-between mb-6"><div className="flex-1 max-w-md"><div className="relative"><input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search workflows..."
                  className="w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium"
                /><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Activity className="w-5 h-5 text-gray-400" /></div></div></div><div className="flex items-center space-x-6"><div className="text-center"><><div className="text-2xl font-bold text-gray-900">{workflows.length}</div><div
</>
className="text-sm text-gray-500 font-medium">Total Workflows</div></div><div className="text-center"><><div className="text-2xl font-bold text-green-600">{workflows.filter(w => w.status === 'active').length}</div><div
</>
className="text-sm text-gray-500 font-medium">Active</div></div><div className="text-center"><><div className="text-2xl font-bold text-yellow-600">{workflows.filter(w => w.status === 'paused').length}</div><div
</>
className="text-sm text-gray-500 font-medium">Paused</div></div></div></div></motion.div>{/* Workflows Grid */}<AnimatePresence><motion.div 
            layout
            className={`grid gap-6 ${
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
          >{filteredWorkflows.map((workflow /* , index */) => (<motion.div
                key={workflow.id}
                layout
                initial={{ opacity: 0, y: 20}}
                animate={{ opacity: 1, y: 0}}
                transition={{ delay: index * 0.1}}
                whileHover={{ y: -4, scale: 1.02}}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer shadow-lg hover:shadow-xl backdrop-blur-sm ${
                  getStatusColor(workflow.status)}`}
                onClick={() => handleEditWorkflow(workflow)}
              ><div className="flex items-start justify-between mb-4"><div className="flex items-center space-x-3">{getStatusIcon(workflow.status)}<h3 className="font-semibold text-gray-900 truncate">{workflow.name}</h3></div><button className="p-1 hover:bg-white/50 rounded-md transition-colors"><Settings className="w-4 h-4 text-gray-400" /></button></div><div className="space-y-3"><div className="flex items-center justify-between text-sm"><><span className="text-gray-600 font-medium">Status</span><span
</>className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workflow.status === 'active' ? 'bg-green-100 text-green-700' :
                      workflow.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'}`}>
                      {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}</span></div><div className="flex items-center justify-between text-sm"><><span className="text-gray-600 font-medium">Runs</span><span
</>
className="text-gray-900 font-semibold">{workflow.runCount}</span></div>{workflow.lastRun && (<div className="flex items-center justify-between text-sm"><><span className="text-gray-600 font-medium">Last Run</span><span
</>className="text-gray-500 text-xs">
                        {new Date(workflow.lastRun).toLocaleDateString()}</span></div>)}</div><div className="flex items-center justify-between mt-4 pt-4 border-t border-white/50"><div className="flex items-center space-x-2"><GitBranch className="w-4 h-4 text-gray-400" /><span className="text-xs text-gray-500 font-medium">{workflow.nodes.length} nodes</span></div><div className="flex items-center space-x-1"><motion.button
                      whileHover={{ scale: 1.1}}
                      whileTap={{ scale: 0.9}}
                      className="p-1.5 hover:bg-white/50 rounded-md transition-colors"
                    ><Eye className="w-4 h-4 text-gray-400" /></motion.button><motion.button
                      whileHover={{ scale: 1.1}}
                      whileTap={{ scale: 0.9}}
                      className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-md transition-colors"
                    ><Zap className="w-4 h-4" /></motion.button></div></div></motion.div>))}</motion.div></AnimatePresence>{filteredWorkflows.length === 0 && (<motion.div 
            initial={{ opacity: 0}}
            animate={{ opacity: 1}}
            className="text-center py-16"
          ><div className="max-w-md mx-auto"><div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center"><><Workflow className="w-12 h-12 text-blue-600" /></div><h3
</>className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No workflows found' : 'No workflows yet'}</h3><p className="text-gray-500 mb-6">{searchTerm 
                  ? `No workflows match "${searchTerm}". Try a different search term.`
                  : 'Create your first workflow to automate your processes and boost productivity.'
                }</p>{!searchTerm && (<motion.button
                  whileHover={{ scale: 1.05}}
                  whileTap={{ scale: 0.95}}
                  onClick={() =>setCurrentView('builder')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  Create Your First Workflow</motion.button>)}</div></motion.div>)}</main></div>
  );

  return renderCurrentView();
}

export default App;