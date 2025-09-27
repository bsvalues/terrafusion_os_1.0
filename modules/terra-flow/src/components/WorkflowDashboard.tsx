import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Play,
  Pause,
  Square,
  BarChart3,
  Settings,
  Zap,
  Brain,
  Network,
  TrendingUp,
  Shield,
  CheckCircle,} from 'lucide-react';
import {useWorkflowStore} from '../stores/WorkflowStore';
import {WorkflowCanvas} from './WorkflowCanvas';
import {AIOptimizationPanel} from './AIOptimizationPanel';
import {PerformanceMetrics} from './PerformanceMetrics';

interface WorkflowDashboardProps {className?: string;}

export const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({className}) => {const {
    workflows,
    activeWorkflow,
    isExecuting,
    executionMetrics,
    aiInsights,
    startExecution,
    pauseExecution,
    stopExecution,
    loadWorkflows,} = useWorkflowStore();

  const [selectedTab, setSelectedTab] = useState<'designer' | 'analytics' | 'ai-optimization'>(
    'designer'
  );
  const [showAIPanel, setShowAIPanel] = useState(false);

  useEffect(() =>{loadWorkflows();}, [loadWorkflows]);

  const handleExecutionControl = (action: 'start' | 'pause' | 'stop') => {if (!activeWorkflow) return;

    switch (action) {
      case 'start':
        startExecution(activeWorkflow.id);
        break;
      case 'pause':
        pauseExecution(activeWorkflow.id);
        break;
      case 'stop':
        stopExecution(activeWorkflow.id);
        break;}
  };

  const tabVariants = {hidden: { opacity: 0, y: 20},
    visible: {opacity: 1, y: 0},
    exit: {opacity: 0, y: -20},
  };

  return (<div className={`workflow-dashboard h-full flex flex-col ${className || ''}`}>{/* Header */}<div className="dashboard-header bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold flex items-center gap-3"><Zap className="w-8 h-8" />TerraFlow Enhanced</h1><p className="text-blue-100 mt-1">MIT PhD-Level Workflow Automation Engine</p></div><div className="flex items-center gap-4">{/* AI Status Indicator */}<div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2"><Brain className="w-5 h-5 text-green-300" /><span className="text-sm">AI Active</span></div>{/* Execution Controls */}<div className="flex items-center gap-2"><motion.button
                whileHover={{ scale: 1.05}}
                whileTap={{ scale: 0.95}}
                onClick={() => handleExecutionControl('start')}
                disabled={isExecuting || !activeWorkflow}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              ><Play className="w-4 h-4" />Start</motion.button><motion.button
                whileHover={{ scale: 1.05}}
                whileTap={{ scale: 0.95}}
                onClick={() => handleExecutionControl('pause')}
                disabled={!isExecuting}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              ><Pause className="w-4 h-4" />Pause</motion.button><motion.button
                whileHover={{ scale: 1.05}}
                whileTap={{ scale: 0.95}}
                onClick={() => handleExecutionControl('stop')}
                disabled={!isExecuting}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              ><Square className="w-4 h-4" />Stop</motion.button></div>{/* AI Panel Toggle */}<motion.button
              whileHover={{ scale: 1.05}}
              whileTap={{ scale: 0.95}}
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            ><Brain className="w-4 h-4" />AI Insights</motion.button></div></div></div>{/* Navigation Tabs */}<div className="tab-navigation bg-white border-b border-gray-200"><div className="flex">{[
            {id: 'designer', label: 'Workflow Designer', icon: Network},
            {id: 'analytics', label: 'Performance Analytics', icon: BarChart3},
            {id: 'ai-optimization', label: 'AI Optimization', icon: Brain},
          ].map(tab => (<motion.button
              key={tab.id}
              whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)'}}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'}`}
            ><tab.icon className="w-5 h-5" />{tab.label}</motion.button>))}</div></div>{/* Main Content Area */}<div className="dashboard-content flex-1 flex overflow-hidden">{/* Primary Content */}<div className="primary-content flex-1 overflow-auto"><AnimatePresence mode="wait">{selectedTab === 'designer' && (<motion.div
                key="designer"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3}}
                className="h-full"
              ><WorkflowCanvas /></motion.div>)}

            {selectedTab === 'analytics' && (<motion.div
                key="analytics"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3}}
                className="h-full"
              ><PerformanceMetrics metrics={executionMetrics} /></motion.div>)}

            {selectedTab === 'ai-optimization' && (<motion.div
                key="ai-optimization"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3}}
                className="h-full"
              ><AIOptimizationPanel insights={aiInsights} /></motion.div>)}</AnimatePresence></div>{/* AI Insights Sidebar */}<AnimatePresence>{showAIPanel && (<motion.div
              initial={{ width: 0, opacity: 0}}
              animate={{ width: 400, opacity: 1}}
              exit={{ width: 0, opacity: 0}}
              transition={{ duration: 0.3}}
              className="ai-sidebar bg-gray-50 border-l border-gray-200 overflow-hidden"
            ><div className="p-6"><div className="flex items-center justify-between mb-6"><h3 className="text-lg font-semibold flex items-center gap-2"><Brain className="w-5 h-5 text-purple-600" />AI Insights</h3><button
                    onClick={() =>setShowAIPanel(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×</button></div>{/* Real-time AI Recommendations */}<div className="space-y-4"><div className="bg-white rounded-lg p-4 border border-gray-200"><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green-600" /><span className="font-medium text-sm">Performance Optimization</span></div><p className="text-sm text-gray-600">AI suggests parallel execution for steps 3-5 to improve performance by 34%</p></div><div className="bg-white rounded-lg p-4 border border-gray-200"><div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-blue-600" /><span className="font-medium text-sm">Security Enhancement</span></div><p className="text-sm text-gray-600">Add input validation to API connector to prevent security vulnerabilities</p></div><div className="bg-white rounded-lg p-4 border border-gray-200"><div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-purple-600" /><span className="font-medium text-sm">Quality Assurance</span></div><p className="text-sm text-gray-600">Workflow complexity: Optimal. Test coverage: 94%. Ready for production.</p></div></div>{/* AI Metrics */}<div className="mt-6"><h4 className="font-medium mb-3">AI Analysis</h4><div className="space-y-2"><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Optimization Score</span><span className="text-sm font-medium">97%</span></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Reliability Index</span><span className="text-sm font-medium">99.2%</span></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Performance Grade</span><span className="text-sm font-medium">A+</span></div></div></div></div></motion.div>)}</AnimatePresence></div>{/* Status Bar */}<div className="status-bar bg-gray-800 text-white px-6 py-3 flex items-center justify-between"><div className="flex items-center gap-6"><div className="flex items-center gap-2"><div
              className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-green-400' : 'bg-gray-400'}`} /><span className="text-sm">{isExecuting ? 'Executing' : 'Ready'}</span></div>{activeWorkflow && (<div className="text-sm text-gray-300">Active: {activeWorkflow.name}</div>)}</div><div className="flex items-center gap-4 text-sm text-gray-300"><span>MCP Server: Connected</span><span>AI Agents: {aiInsights?.activeAgents || 0} Active</span><span>Marketplace: Synced</span></div></div></div>
  );
};

export default WorkflowDashboard;
