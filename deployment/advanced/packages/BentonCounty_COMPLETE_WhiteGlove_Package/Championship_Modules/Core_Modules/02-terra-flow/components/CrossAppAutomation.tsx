import React, {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Zap,
  Database,
  MapPin,
  Calculator,
  BarChart,
  FileText,
  ShoppingCart,
  Package,
  Settings,
  Link,
  Play,
  Pause,
  ExternalLink,
  ArrowRight,
  Plus} from '@mui/icons-material';

// Terrafusion app definitions
const TERRAFUSION_APPS = [
  {id: 'terra-agent',
    name: 'Terra Agent',
    description: 'AI-powered property intelligence',
    icon: Zap,
    color: 'from-blue-500 to-cyan-600',
    status: 'active',
    endpoints: [
      { id: 'properties', name: 'Property Data', type: 'data'},
      {id: 'insights', name: 'AI Insights', type: 'analysis'},
      {id: 'recommendations', name: 'Recommendations', type: 'output'}
    ]
  },
  {id: 'terra-flow',
    name: 'Terra Flow',
    description: 'Workflow automation engine',
    icon: Settings,
    color: 'from-purple-500 to-violet-600',
    status: 'active',
    endpoints: [
      { id: 'workflows', name: 'Workflow Management', type: 'control'},
      {id: 'triggers', name: 'Event Triggers', type: 'input'},
      {id: 'notifications', name: 'Notifications', type: 'output'}
    ]
  },
  {id: 'web-audit-tracker',
    name: 'Web Audit Tracker',
    description: 'Compliance and audit management',
    icon: FileText,
    color: 'from-orange-500 to-red-600',
    status: 'active',
    endpoints: [
      { id: 'audits', name: 'Audit Records', type: 'data'},
      {id: 'compliance', name: 'Compliance Status', type: 'analysis'},
      {id: 'reports', name: 'Audit Reports', type: 'output'}
    ]
  },
  {id: 'terra-levy',
    name: 'Terra Levy',
    description: 'Tax and financial analysis',
    icon: Calculator,
    color: 'from-green-500 to-emerald-600',
    status: 'active',
    endpoints: [
      { id: 'calculations', name: 'Tax Calculations', type: 'analysis'},
      {id: 'assessments', name: 'Property Assessments', type: 'data'},
      {id: 'reports', name: 'Financial Reports', type: 'output'}
    ]
  },
  {id: 'terra-miner',
    name: 'Terra Miner',
    description: 'Data processing and mining',
    icon: Database,
    color: 'from-teal-500 to-cyan-600',
    status: 'active',
    endpoints: [
      { id: 'processing', name: 'Data Processing', type: 'control'},
      {id: 'patterns', name: 'Pattern Analysis', type: 'analysis'},
      {id: 'insights', name: 'Mining Insights', type: 'output'}
    ]
  },
  {id: 'terra-fusion-sync',
    name: 'Terra Fusion Sync',
    description: 'Cross-platform synchronization',
    icon: Link,
    color: 'from-indigo-500 to-blue-600',
    status: 'active',
    endpoints: [
      { id: 'sync', name: 'Data Synchronization', type: 'control'},
      {id: 'monitoring', name: 'Sync Monitoring', type: 'analysis'},
      {id: 'logs', name: 'Sync Logs', type: 'output'}
    ]
  },
  {id: 'gispro',
    name: 'GIS Pro',
    description: 'Geographic information system',
    icon: MapPin,
    color: 'from-yellow-500 to-amber-600',
    status: 'active',
    endpoints: [
      { id: 'maps', name: 'Map Data', type: 'data'},
      {id: 'analysis', name: 'Spatial Analysis', type: 'analysis'},
      {id: 'visualizations', name: 'Map Visualizations', type: 'output'}
    ]
  },
  {id: 'costforge-ai',
    name: 'CostForge AI',
    description: 'AI-powered cost analysis',
    icon: BarChart,
    color: 'from-pink-500 to-rose-600',
    status: 'active',
    endpoints: [
      { id: 'analysis', name: 'Cost Analysis', type: 'analysis'},
      {id: 'predictions', name: 'Cost Predictions', type: 'output'},
      {id: 'factors', name: 'Cost Factors', type: 'data'}
    ]
  },
  {id: 'property-workbench',
    name: 'Property Workbench',
    description: 'Property management tools',
    icon: Package,
    color: 'from-violet-500 to-purple-600',
    status: 'active',
    endpoints: [
      { id: 'properties', name: 'Property Management', type: 'control'},
      {id: 'maintenance', name: 'Maintenance Tracking', type: 'data'},
      {id: 'reports', name: 'Property Reports', type: 'output'}
    ]
  },
  {id: 'terra-insight',
    name: 'Terra Insight',
    description: 'Business intelligence and analytics',
    icon: BarChart,
    color: 'from-cyan-500 to-blue-600',
    status: 'active',
    endpoints: [
      { id: 'analytics', name: 'Analytics Engine', type: 'analysis'},
      {id: 'dashboards', name: 'Business Dashboards', type: 'output'},
      {id: 'metrics', name: 'Performance Metrics', type: 'data'}
    ]
  },
  {id: 'terra-fusion-dashboard',
    name: 'Terra Fusion Dashboard',
    description: 'Central command center',
    icon: BarChart,
    color: 'from-gray-500 to-slate-600',
    status: 'active',
    endpoints: [
      { id: 'overview', name: 'System Overview', type: 'output'},
      {id: 'controls', name: 'System Controls', type: 'control'},
      {id: 'monitoring', name: 'System Monitoring', type: 'analysis'}
    ]
  },
  {id: 'terra-fusion-assessor',
    name: 'Terra Fusion Assessor',
    description: 'Property assessment tools',
    icon: Calculator,
    color: 'from-emerald-500 to-green-600',
    status: 'active',
    endpoints: [
      { id: 'assessments', name: 'Property Assessments', type: 'analysis'},
      {id: 'valuations', name: 'Property Valuations', type: 'output'},
      {id: 'comparisons', name: 'Market Comparisons', type: 'data'}
    ]
  },
  {id: 'marketplace',
    name: 'Marketplace',
    description: 'Property marketplace platform',
    icon: ShoppingCart,
    color: 'from-red-500 to-pink-600',
    status: 'active',
    endpoints: [
      { id: 'listings', name: 'Property Listings', type: 'data'},
      {id: 'transactions', name: 'Transaction Processing', type: 'control'},
      {id: 'market-data', name: 'Market Data', type: 'analysis'}
    ]
  },
  {id: 'terra-collections',
    name: 'Terra Collections',
    description: 'Document and asset management',
    icon: Package,
    color: 'from-stone-500 to-gray-600',
    status: 'active',
    endpoints: [
      { id: 'documents', name: 'Document Management', type: 'data'},
      {id: 'assets', name: 'Asset Tracking', type: 'control'},
      {id: 'archives', name: 'Archive Management', type: 'output'}
    ]
  }
];

// Cross-app automation rules
interface AutomationRule {id: string;
  name: string;
  description: string;
  sourceApp: string;
  sourceEndpoint: string;
  targetApp: string;
  targetEndpoint: string;
  trigger: 'data_change' | 'schedule' | 'manual' | 'event';
  conditions: any[];
  transformations: any[];
  status: 'active' | 'paused' | 'error';
  lastRun?: string;
  runCount: number;
  successRate: number;}

// Connection visualization component
const AppConnectionMap: React.FC<{apps: typeof TERRAFUSION_APPS;
  rules: AutomationRule[];
  selectedRule?: AutomationRule | null;
  onRuleSelect: (rule: AutomationRule | null) => void;}> = ({apps, rules, selectedRule, onRuleSelect: _onRuleSelect}) => {const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  const getConnectionsForApp = (appId: string) =>{
    return rules.filter(rule => rule.sourceApp === appId || rule.targetApp === appId);};

  const getConnectionPath = (sourceApp: string, targetApp: string) => {const sourceIndex = apps.findIndex(app => app.id === sourceApp);
    const targetIndex = apps.findIndex(app => app.id === targetApp);
    
    // Simple path calculation for demo - in real app would be more sophisticated
    return {
      source: { x: (sourceIndex % 4) * 200 + 100, y: Math.floor(sourceIndex / 4) * 150 + 100},
      target: {x: (targetIndex % 4) * 200 + 100, y: Math.floor(targetIndex / 4) * 150 + 100}
    };
  };

  return (<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"><><h3 className="text-lg font-semibold text-gray-900 mb-4">App Integration Map</h3><div
</>className="relative bg-gray-50 rounded-lg p-8" style={{ minHeight: '500px'}}>
        {/* Connection lines */}<svg className="absolute inset-0 w-full h-full pointer-events-none">{rules.map(rule => {
            const path = getConnectionPath(rule.sourceApp, rule.targetApp);
            const isSelected = selectedRule?.id === rule.id;
            
            return (<g key={rule.id}><line
                  x1={path.source.x}
                  y1={path.source.y}
                  x2={path.target.x}
                  y2={path.target.y}
                  stroke={isSelected ? '#3B82F6' : rule.status === 'active' ? '#10B981' : '#EF4444'}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeDasharray={rule.status === 'paused' ? '5,5' : 'none'}
                  opacity={isSelected ? 1 : 0.6} /><circle
                  cx={path.target.x}
                  cy={path.target.y}
                  r="4"
                  fill={isSelected ? '#3B82F6' : rule.status === 'active' ? '#10B981' : '#EF4444'} /></g>);
          })}</svg>{/* App nodes */}
        {apps.slice(0, 12).map((app /* , index */) => {
          const connections = getConnectionsForApp(app.id);
          const Icon = app.icon;
          const x = (index % 4) * 200;
          const y = Math.floor(index / 4) * 150;
          
          return (<motion.div
              key={app.id}
              className={`absolute cursor-pointer transition-all ${
                hoveredApp === app.id ? 'z-10' : ''}`}
              style={{ left: x, top: y}}
              onMouseEnter={() => setHoveredApp(app.id)}
              onMouseLeave={() => setHoveredApp(null)}
              whileHover={{ scale: 1.1}}
            ><div className={`relative bg-white rounded-xl p-4 shadow-md border-2 transition-all ${
                hoveredApp === app.id ? 'border-blue-300 shadow-lg' : 'border-gray-200'}`}><div className={`p-3 rounded-lg bg-gradient-to-r ${app.color} text-white mb-2`}><><Icon className="w-6 h-6" /></div><h4
</>

className="font-medium text-gray-900 text-sm mb-1">{app.name}</h4><p className="text-xs text-gray-500 mb-2">{connections.length} connections</p>{connections.length > 0 && (<div className="flex space-x-1">{connections.slice(0, 3).map(conn => (<div
                        key={conn.id}
                        className={`w-2 h-2 rounded-full ${
                          conn.status === 'active' ? 'bg-green-400' :
                          conn.status === 'paused' ? 'bg-yellow-400' : 'bg-red-400'}`} />))}
                    {connections.length > 3 && (<span className="text-xs text-gray-400">+{connections.length - 3}</span>)}</div>)}</div></motion.div>);
        })}</div></div>
  );
};

// Automation rule builder
const AutomationRuleBuilder: React.FC<{apps: typeof TERRAFUSION_APPS;
  onSave: (rule: Partial<AutomationRule>) =>void;
  onClose: () => void;
  editingRule?: AutomationRule;}> = ({apps, onSave, onClose, editingRule}) => {const [formData, setFormData] = useState({
    name: editingRule?.name || '',
    description: editingRule?.description || '',
    sourceApp: editingRule?.sourceApp || '',
    sourceEndpoint: editingRule?.sourceEndpoint || '',
    targetApp: editingRule?.targetApp || '',
    targetEndpoint: editingRule?.targetEndpoint || '',
    trigger: editingRule?.trigger || 'data_change' as const});

  const sourceApp = apps.find(app => app.id === formData.sourceApp);
  const targetApp = apps.find(app => app.id === formData.targetApp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: editingRule?.id || `rule_${Date.now()}`,
      conditions: [],
      transformations: [],
      status: 'active',
      runCount: editingRule?.runCount || 0,
      successRate: editingRule?.successRate || 100
    });
  };

  return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><motion.div
        initial={{ scale: 0.9, opacity: 0}}
        animate={{ scale: 1, opacity: 1}}
        exit={{ scale: 0.9, opacity: 0}}
        className="bg-white rounded-xl max-w-2xl w-full mx-4 p-6"
      ><><h3 className="text-xl font-semibold text-gray-900 mb-6">{editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}</h3><form
</>

onSubmit={handleSubmit} className="space-y-6"><div className="grid grid-cols-2 gap-4"><div><><label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label><input
</>

                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              /></div><div><><label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label><select
</>

                value={formData.trigger}
                onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value as any}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              ><><option value="data_change">Data Change</option><option
</>

value="schedule">Schedule</option><><option value="manual">Manual</option><option
</>

value="event">Event</option></select></div></div><div><><label className="block text-sm font-medium text-gray-700 mb-2">Description</label><textarea
</>

              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            /></div><div className="grid grid-cols-2 gap-6"><div className="space-y-4"><><h4 className="font-medium text-gray-900">Source (Trigger)</h4><div
</></>><><label className="block text-sm font-medium text-gray-700 mb-2">Source App</label><select
</>

                  value={formData.sourceApp}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceApp: e.target.value, sourceEndpoint: ''}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                ><option value="">Select source app</option>{apps.map(app => (<option key={app.id} value={app.id}>{app.name}</option>))}</select></div>{sourceApp && (<div><><label className="block text-sm font-medium text-gray-700 mb-2">Source Endpoint</label><select
</>

                    value={formData.sourceEndpoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, sourceEndpoint: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  ><option value="">Select endpoint</option>{sourceApp.endpoints.map(endpoint => (<option key={endpoint.id} value={endpoint.id}>{endpoint.name}</option>))}</select></div>)}</div><div className="space-y-4"><><h4 className="font-medium text-gray-900">Target (Action)</h4><div
</></>><><label className="block text-sm font-medium text-gray-700 mb-2">Target App</label><select
</>

                  value={formData.targetApp}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetApp: e.target.value, targetEndpoint: ''}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                ><option value="">Select target app</option>{apps.filter(app => app.id !== formData.sourceApp).map(app => (<option key={app.id} value={app.id}>{app.name}</option>))}</select></div>{targetApp && (<div><><label className="block text-sm font-medium text-gray-700 mb-2">Target Endpoint</label><select
</>

                    value={formData.targetEndpoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetEndpoint: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  ><option value="">Select endpoint</option>{targetApp.endpoints.map(endpoint => (<option key={endpoint.id} value={endpoint.id}>{endpoint.name}</option>))}</select></div>)}</div></div><div className="flex justify-end space-x-3 pt-6 border-t border-gray-200"><><button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >Cancel</button><motion
</></>.button
              whileHover={{ scale: 1.02}}
              whileTap={{ scale: 0.98}}
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
            >{editingRule ? 'Update Rule' : 'Create Rule'}</motion.button></div></form></motion.div></div>
  );
};

const CrossAppAutomation: React.FC = () => {const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: 'rule_1',
      name: 'Property Data Sync',
      description: 'Sync property data from Terra Agent to CostForge AI',
      sourceApp: 'terra-agent',
      sourceEndpoint: 'properties',
      targetApp: 'costforge-ai',
      targetEndpoint: 'analysis',
      trigger: 'data_change',
      conditions: [],
      transformations: [],
      status: 'active',
      lastRun: new Date(Date.now() - 3600000).toISOString(),
      runCount: 45,
      successRate: 98.2},
    {id: 'rule_2',
      name: 'GIS Analysis Update',
      description: 'Update GIS analysis when property assessments change',
      sourceApp: 'terra-fusion-assessor',
      sourceEndpoint: 'assessments',
      targetApp: 'gispro',
      targetEndpoint: 'analysis',
      trigger: 'data_change',
      conditions: [],
      transformations: [],
      status: 'active',
      lastRun: new Date(Date.now() - 7200000).toISOString(),
      runCount: 23,
      successRate: 100}
  ]);

  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | undefined>();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleSaveRule = (ruleData: Partial<AutomationRule>) =>{if (editingRule) {
      setAutomationRules(prev => prev.map(rule =>
        rule.id === editingRule.id ? { ...rule, ...ruleData} : rule
      ));
    } else {setAutomationRules(prev => [...prev, ruleData as AutomationRule]);}
    setShowRuleBuilder(false);
    setEditingRule(undefined);
  };

  const handleEditRule = (rule: AutomationRule) => {setEditingRule(rule);
    setShowRuleBuilder(true);};

  const handleToggleRule = (ruleId: string) => {setAutomationRules(prev => prev.map(rule =>
      rule.id === ruleId
        ? { ...rule, status: rule.status === 'active' ? 'paused' : 'active'}
        : rule
    ));
  };

  const filteredRules = automationRules.filter(rule =>
    filterStatus === 'all' || rule.status === filterStatus
  );

  return (<div className="p-6 space-y-6">{/* Header */}<div className="flex items-center justify-between"><div><><h1 className="text-2xl font-bold text-gray-900">Cross-App Automation</h1><p
</>

className="text-gray-600">Manage automation between Terrafusion applications</p></div><motion.button
          whileHover={{ scale: 1.02}}
          whileTap={{ scale: 0.98}}
          onClick={() => setShowRuleBuilder(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        ><Plus className="w-4 h-4" /><span>New Rule</span></motion.button></div>{/* Connection Map */}<AppConnectionMap
        apps={TERRAFUSION_APPS}
        rules={automationRules}
        selectedRule={selectedRule}
        onRuleSelect={setSelectedRule} />{/* Rules Management */}<div className="bg-white rounded-xl shadow-sm border border-gray-200"><div className="p-4 border-b border-gray-200"><div className="flex items-center justify-between"><><h2 className="text-lg font-semibold text-gray-900">Automation Rules</h2><div
</>

className="flex items-center space-x-3"><select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              ><><option value="all">All Status</option><option
</>

value="active">Active</option><><option value="paused">Paused</option><option
</>

value="error">Error</option></select></div></div></div><div className="divide-y divide-gray-200">{filteredRules.map(rule => {
            const sourceApp = TERRAFUSION_APPS.find(app => app.id === rule.sourceApp);
            const targetApp = TERRAFUSION_APPS.find(app => app.id === rule.targetApp);
            
            return (<motion.div
                key={rule.id}
                layout
                className="p-4 hover:bg-gray-50 transition-colors"
              ><div className="flex items-center justify-between"><div className="flex items-center space-x-4"><div className="flex items-center space-x-2">{sourceApp && (<div className={`p-2 rounded-lg bg-gradient-to-r ${sourceApp.color} text-white`}><sourceApp.icon className="w-4 h-4" /></div>)}<ArrowRight className="w-4 h-4 text-gray-400" />{targetApp && (<div className={`p-2 rounded-lg bg-gradient-to-r ${targetApp.color} text-white`}><targetApp.icon className="w-4 h-4" /></div>)}</div><div><><h3 className="font-medium text-gray-900">{rule.name}</h3><p
</>

className="text-sm text-gray-500">{rule.description}</p><div className="flex items-center space-x-4 mt-1"><><span className="text-xs text-gray-400">{sourceApp?.name} → {targetApp?.name}</span><span
</>className="text-xs text-gray-400">
                          {rule.runCount} runs • {rule.successRate}% success</span>{rule.lastRun && (<span className="text-xs text-gray-400">Last run: {new Date(rule.lastRun).toLocaleString()}</span>)}</div></div></div><div className="flex items-center space-x-3"><><span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rule.status === 'active' ? 'bg-green-100 text-green-700' :
                      rule.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'}`}>{rule.status.charAt(0).toUpperCase() + rule.status.slice(1)}</span><div
</>

className="flex items-center space-x-1"><button
                        onClick={() =>handleToggleRule(rule.id)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title={rule.status === 'active' ? 'Pause rule' : 'Activate rule'}
                      >
                        {rule.status === 'active' ? (<Pause className="w-4 h-4 text-gray-400" />) : (<><Play className="w-4 h-4 text-gray-400" />)}</button><button
</>

                        onClick={() => handleEditRule(rule)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      ><><Settings className="w-4 h-4 text-gray-400" /></button><button
</>

                        onClick={() => setSelectedRule(rule)}
                        className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                      ><ExternalLink className="w-4 h-4" /></button></div></div></div></motion.div>);
          })}</div></div>{/* Rule Builder Modal */}<AnimatePresence>{showRuleBuilder && (<AutomationRuleBuilder
            apps={TERRAFUSION_APPS}
            onSave={handleSaveRule}
            onClose={() =>{
              setShowRuleBuilder(false);
              setEditingRule(undefined);}}
            editingRule={editingRule}
          />
        )}</AnimatePresence></div>
  );
};

export default CrossAppAutomation;