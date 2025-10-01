import React from 'react';
import {motion} from 'framer-motion';
import {Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  BarChart3,
  Clock,} from 'lucide-react';

interface AIRecommendation {type: 'performance' | 'security' | 'optimization';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: number;}

interface AIInsights {activeAgents: number;
  optimizationScore: number;
  recommendations: AIRecommendation[];
  predictions: {
    nextFailure: string | null;
    performanceTrend: 'improving' | 'stable' | 'declining';
    resourceUsage: number;};
}

interface AIOptimizationPanelProps {insights: AIInsights;
  className?: string;}

export const AIOptimizationPanel: React.FC<AIOptimizationPanelProps>= ({insights,
  className,}) => {const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',};

  const typeIcons = {performance: TrendingUp,
    security: AlertTriangle,
    optimization: Zap,};

  const trendColors = {improving: 'text-green-600',
    stable: 'text-blue-600',
    declining: 'text-red-600',};

  return (<div className={`ai-optimization-panel p-6 h-full overflow-auto ${className || ''}`}>{/* Header */}<div className="mb-8"><div className="flex items-center gap-3 mb-4"><div className="p-3 bg-purple-100 rounded-lg"><Brain className="w-8 h-8 text-purple-600" /></div><div><h2 className="text-2xl font-bold text-gray-900">AI Optimization Center</h2><p className="text-gray-600">Advanced AI insights and recommendations</p></div></div>{/* AI Status Cards */}<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"><motion.div
            initial={{ opacity: 0, y: 20}}
            animate={{ opacity: 1, y: 0}}
            transition={{ delay: 0.1}}
            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
          ><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Active AI Agents</p><p className="text-2xl font-bold text-purple-600">{insights.activeAgents}</p></div><div className="p-2 bg-purple-100 rounded-lg"><Brain className="w-6 h-6 text-purple-600" /></div></div></motion.div><motion.div
            initial={{ opacity: 0, y: 20}}
            animate={{ opacity: 1, y: 0}}
            transition={{ delay: 0.2}}
            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
          ><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Optimization Score</p><p className="text-2xl font-bold text-green-600">{insights.optimizationScore}%</p></div><div className="p-2 bg-green-100 rounded-lg"><Target className="w-6 h-6 text-green-600" /></div></div></motion.div><motion.div
            initial={{ opacity: 0, y: 20}}
            animate={{ opacity: 1, y: 0}}
            transition={{ delay: 0.3}}
            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
          ><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Resource Usage</p><p className="text-2xl font-bold text-blue-600">{insights.predictions.resourceUsage}%</p></div><div className="p-2 bg-blue-100 rounded-lg"><BarChart3 className="w-6 h-6 text-blue-600" /></div></div></motion.div></div></div>{/* AI Recommendations */}<div className="mb-8"><h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" />AI Recommendations</h3><div className="space-y-4">{insights.recommendations.map((recommendation, index) => {
            const IconComponent = typeIcons[recommendation.type];

            return (<motion.div
                key={index}
                initial={{ opacity: 0, x: -20}}
                animate={{ opacity: 1, x: 0}}
                transition={{ delay: 0.4 + index * 0.1}}
                className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              ><div className="flex items-start gap-4"><div className="p-2 bg-gray-100 rounded-lg"><IconComponent className="w-5 h-5 text-gray-600" /></div><div className="flex-1"><div className="flex items-center gap-2 mb-2"><h4 className="font-medium text-gray-900">{recommendation.title}</h4><span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          priorityColors[recommendation.priority]}`}
                      >{recommendation.priority.toUpperCase()}</span></div><p className="text-sm text-gray-600 mb-3">{recommendation.description}</p><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-xs text-gray-500">Expected Impact:</span><span className="text-sm font-medium text-green-600">+{recommendation.impact}%</span></div><button className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors">Apply</button></div></div></div></motion.div>);
          })}</div></div>{/* AI Predictions */}<div className="mb-8"><h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500" />AI Predictions</h3><div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><h4 className="font-medium text-gray-900 mb-2">Performance Trend</h4><div className="flex items-center gap-2"><TrendingUp
                  className={`w-5 h-5 ${trendColors[insights.predictions.performanceTrend]}`} /><span
                  className={`font-medium capitalize ${trendColors[insights.predictions.performanceTrend]}`}
                >{insights.predictions.performanceTrend}</span></div><p className="text-sm text-gray-600 mt-1">Workflow performance is showing positive trends</p></div><div><h4 className="font-medium text-gray-900 mb-2">Next Failure Prediction</h4><div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /><span className="font-medium text-green-600">{insights.predictions.nextFailure || 'No failures predicted'}</span></div><p className="text-sm text-gray-600 mt-1">System reliability is optimal</p></div></div></div></div>{/* AI Agent Status */}<div><h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-purple-500" />AI Agent Status</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[
            {name: 'Workflow Optimizer',
              status: 'active',
              efficiency: 97,
              description: 'Optimizing workflow execution paths',},
            {name: 'Process Intelligence',
              status: 'active',
              efficiency: 94,
              description: 'Analyzing process patterns',},
            {name: 'Performance Monitor',
              status: 'active',
              efficiency: 99,
              description: 'Real-time performance tracking',},
          ].map((agent, index) => (<motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 20}}
              animate={{ opacity: 1, y: 0}}
              transition={{ delay: 0.6 + index * 0.1}}
              className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
            ><div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /><h4 className="font-medium text-gray-900 text-sm">{agent.name}</h4></div><p className="text-xs text-gray-600 mb-2">{agent.description}</p><div className="flex items-center justify-between"><span className="text-xs text-gray-500">Efficiency</span><span className="text-sm font-medium text-green-600">{agent.efficiency}%</span></div><div className="w-full bg-gray-200 rounded-full h-1.5 mt-2"><motion.div
                  initial={{ width: 0}}
                  animate={{ width: `${agent.efficiency}%` }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 1}}
                  className="bg-green-500 h-1.5 rounded-full" /></div></motion.div>))}</div></div></div>
  );
};

export default AIOptimizationPanel;
