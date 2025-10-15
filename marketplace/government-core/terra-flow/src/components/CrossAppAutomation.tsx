import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Play, 
  Pause,
  Settings, 
  ArrowRight,
  Link,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap
} from 'lucide-react';

interface App {
  id: string;
  name: string;
  type: 'source' | 'target' | 'bidirectional';
  status: 'connected' | 'disconnected' | 'error';
  position: { x: number; y: number };
  color: string;
}

interface AutomationRule {
  id: string;
  name: string;
  sourceApp: string;
  targetApp: string;
  trigger: string;
  action: string;
  status: 'active' | 'inactive' | 'error';
  executionCount: number;
  lastExecution: string;
}

interface CrossAppAutomationProps {
  className?: string;
}

const mockApps: App[] = [
  { id: 'terraflow', name: 'TerraFlow', type: 'source', status: 'connected', position: { x: 100, y: 200 }, color: '#3B82F6' },
  { id: 'terraagent', name: 'TerraAgent', type: 'bidirectional', status: 'connected', position: { x: 300, y: 150 }, color: '#10B981' },
  { id: 'terrainsight', name: 'TerraInsight', type: 'target', status: 'connected', position: { x: 500, y: 200 }, color: '#8B5CF6' },
  { id: 'terralevyenhanced', name: 'TerraLevy Enhanced', type: 'target', status: 'connected', position: { x: 300, y: 350 }, color: '#F59E0B' },
  { id: 'marketplace', name: 'Marketplace', type: 'bidirectional', status: 'connected', position: { x: 500, y: 100 }, color: '#EF4444' }
];

const mockRules: AutomationRule[] = [
  {
    id: 'rule-1',
    name: 'Auto Tax Calculation',
    sourceApp: 'terraflow',
    targetApp: 'terralevyenhanced',
    trigger: 'New workflow completion',
    action: 'Calculate tax implications',
    status: 'active',
    executionCount: 1247,
    lastExecution: '2 minutes ago'
  },
  {
    id: 'rule-2',
    name: 'Insight Generation',
    sourceApp: 'terraagent',
    targetApp: 'terrainsight',
    trigger: 'Data analysis complete',
    action: 'Generate business insights',
    status: 'active',
    executionCount: 892,
    lastExecution: '5 minutes ago'
  },
  {
    id: 'rule-3',
    name: 'Marketplace Sync',
    sourceApp: 'terraflow',
    targetApp: 'marketplace',
    trigger: 'Workflow published',
    action: 'Sync to marketplace',
    status: 'active',
    executionCount: 456,
    lastExecution: '1 hour ago'
  }
];

export const CrossAppAutomation: React.FC<CrossAppAutomationProps> = ({ className }) => {
  const [apps] = useState<App[]>(mockApps);
  const [rules, setRules] = useState<AutomationRule[]>(mockRules);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [isExecuting, setIsExecuting] = useState<string | null>(null);

  const getConnectionPath = (sourceAppId: string, targetAppId: string) => {
    const sourceApp = apps.find(app => app.id === sourceAppId);
    const targetApp = apps.find(app => app.id === targetAppId);
    
    if (!sourceApp || !targetApp) {
      return { source: { x: 0, y: 0 }, target: { x: 0, y: 0 } };
    }

    return {
      source: { x: sourceApp.position.x + 50, y: sourceApp.position.y + 25 },
      target: { x: targetApp.position.x, y: targetApp.position.y + 25 }
    };
  };

  const executeRule = async (ruleId: string) => {
    setIsExecuting(ruleId);
    
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, executionCount: rule.executionCount + 1, lastExecution: 'Just now' }
        : rule
    ));
    
    setIsExecuting(null);
  };

  const toggleRuleStatus = (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId
        ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' }
        : rule
    ));
  };

  return (
    <div className={`cross-app-automation p-6 h-full overflow-auto ${className || ''}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Link className="w-8 h-8 text-blue-600" />
              Cross-App Automation
            </h2>
            <p className="text-gray-600 mt-1">Connect and automate workflows across TerraFusion OS modules</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRuleBuilder(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Automation Rule
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Connected Apps</p>
              <p className="text-2xl font-bold text-blue-600">{apps.filter(a => a.status === 'connected').length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Link className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Rules</p>
              <p className="text-2xl font-bold text-green-600">{rules.filter(r => r.status === 'active').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Executions</p>
              <p className="text-2xl font-bold text-purple-600">
                {rules.reduce((sum, rule) => sum + rule.executionCount, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">98.7%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* App Integration Map */}
        <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">App Integration Map</h3>
          
          <div className="relative bg-gray-50 rounded-lg p-8" style={{ minHeight: '500px' }}>
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {rules.map(rule => {
                const path = getConnectionPath(rule.sourceApp, rule.targetApp);
                const isSelected = selectedRule?.id === rule.id;
                
                return (
                  <g key={rule.id}>
                    <line
                      x1={path.source.x}
                      y1={path.source.y}
                      x2={path.target.x}
                      y2={path.target.y}
                      stroke={isSelected ? '#3B82F6' : rule.status === 'active' ? '#10B981' : '#EF4444'}
                      strokeWidth={isSelected ? '3' : '2'}
                      strokeDasharray={rule.status === 'active' ? 'none' : '5,5'}
                    />
                    <motion.circle
                      cx={path.source.x + (path.target.x - path.source.x) / 2}
                      cy={path.source.y + (path.target.y - path.source.y) / 2}
                      r="4"
                      fill={rule.status === 'active' ? '#10B981' : '#EF4444'}
                      initial={{ scale: 0 }}
                      animate={{ scale: isExecuting === rule.id ? [1, 1.5, 1] : 1 }}
                      transition={{ duration: 1, repeat: isExecuting === rule.id ? Infinity : 0 }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* App nodes */}
            {apps.map(app => (
              <motion.div
                key={app.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute bg-white rounded-lg p-4 shadow-md border-2 cursor-pointer hover:shadow-lg transition-shadow"
                style={{
                  left: app.position.x,
                  top: app.position.y,
                  borderColor: app.color,
                  width: '120px'
                }}
              >
                <div className="text-center">
                  <div 
                    className="w-8 h-8 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: app.color }}
                  />
                  <h4 className="font-medium text-sm text-gray-900">{app.name}</h4>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        app.status === 'connected' ? 'bg-green-400' : 
                        app.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
                      }`} 
                    />
                    <span className="text-xs text-gray-500 capitalize">{app.status}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Automation Rules Panel */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Rules</h3>
          
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedRule?.id === rule.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRule(selectedRule?.id === rule.id ? null : rule)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{rule.name}</h4>
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        rule.status === 'active' ? 'bg-green-400' : 
                        rule.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
                      }`} 
                    />
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rule.status === 'active' ? 'bg-green-100 text-green-800' :
                      rule.status === 'error' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.status}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{rule.trigger} → {rule.action}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{rule.executionCount} executions</span>
                  <span>{rule.lastExecution}</span>
                </div>

                {selectedRule?.id === rule.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          executeRule(rule.id);
                        }}
                        disabled={isExecuting === rule.id}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                      >
                        {isExecuting === rule.id ? (
                          <Clock className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        {isExecuting === rule.id ? 'Executing' : 'Execute'}
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRuleStatus(rule.id);
                        }}
                        className={`flex-1 text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                          rule.status === 'active'
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        {rule.status === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        {rule.status === 'active' ? 'Pause' : 'Activate'}
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-3 py-2 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Settings className="w-3 h-3" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Rule Builder Modal */}
      <AnimatePresence>
        {showRuleBuilder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Create Automation Rule</h3>
                <button
                  onClick={() => setShowRuleBuilder(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter automation rule name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source App</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select source app</option>
                      {apps.map(app => (
                        <option key={app.id} value={app.id}>{app.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target App</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select target app</option>
                      {apps.map(app => (
                        <option key={app.id} value={app.id}>{app.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Event</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What event should trigger this automation?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="What action should be performed?"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowRuleBuilder(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Create Rule
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CrossAppAutomation;
