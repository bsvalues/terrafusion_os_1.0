import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  Square,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  Search,
  ChevronDown,
  ChevronRight,
  Refresh
 } from '@mui/icons-material';

// Types for monitoring
interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  steps: StepExecution[];
  triggeredBy: string;
  inputData: any;
  outputData?: any;
  errorMessage?: string;
  progress: number;
}

interface StepExecution {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  duration?: number;
  errorMessage?: string;
  retryCount: number;
  logs: LogEntry[];
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: any;
}

interface WorkflowMetrics {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  activeWorkflows: number;
  failedWorkflows: number;
  throughput: {
    hourly: number;
    daily: number;
    weekly: number;
  };
  topFailureReasons: Array<{
    reason: string;
    count: number;
  }>;
}

// Mock data generator
const generateMockExecutions = (): WorkflowExecution[] => {
  const statuses: WorkflowExecution['status'][] = ['running', 'completed', 'failed', 'paused'];
  const workflows = [
    'Multi-App Data Synchronization',
    'Automated Report Generation',
    'Smart Property Valuation Pipeline',
    'Regulatory Compliance Monitor',
    'Real Estate Market Analysis'
  ];

  return Array.from({ length: 15 }, (_, i) => ({
    id: `exec_${i + 1}`,
    workflowId: `workflow_${(i % 5) + 1}`,
    workflowName: workflows[i % workflows.length],
    status: i === 0 ? 'running' : statuses[Math.floor(Math.random() * statuses.length)],
    startTime: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    endTime: i === 0 ? undefined : new Date(Date.now() - Math.random() * 3600000).toISOString(),
    duration: i === 0 ? undefined : Math.floor(Math.random() * 300000) + 30000,
    progress: i === 0 ? Math.floor(Math.random() * 80) + 10 : 100,
    triggeredBy: Math.random() > 0.5 ? 'schedule' : 'manual',
    inputData: { properties: Math.floor(Math.random() * 100) + 1 },
    outputData: i === 0 ? undefined : { processed: Math.floor(Math.random() * 50) + 1 },
    steps: Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, j) => ({
      id: `step_${j + 1}`,
      name: `Step ${j + 1}`,
      status: j < 2 ? 'completed' : j === 2 && i === 0 ? 'running' : 'pending',
      startTime: j < 2 ? new Date(Date.now() - Math.random() * 3600000).toISOString() : undefined,
      endTime: j < 2 ? new Date(Date.now() - Math.random() * 1800000).toISOString() : undefined,
      duration: j < 2 ? Math.floor(Math.random() * 60000) + 5000 : undefined,
      retryCount: Math.floor(Math.random() * 3),
      logs: []
    }))
  }));
};

const generateMockMetrics = (): WorkflowMetrics => ({
  totalExecutions: 1247,
  successRate: 94.2,
  averageDuration: 142000, // milliseconds
  activeWorkflows: 3,
  failedWorkflows: 8,
  throughput: {
    hourly: 12,
    daily: 87,
    weekly: 623
  },
  topFailureReasons: [
    { reason: 'Network timeout', count: 15 },
    { reason: 'Invalid data format', count: 12 },
    { reason: 'Authentication failed', count: 8 },
    { reason: 'Resource unavailable', count: 6 }
  ]
});

// Status badge component
const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return { color: 'bg-blue-100 text-blue-700', icon: Activity, iconColor: 'text-blue-500' };
      case 'completed':
        return { color: 'bg-green-100 text-green-700', icon: CheckCircle, iconColor: 'text-green-500' };
      case 'failed':
        return { color: 'bg-red-100 text-red-700', icon: XCircle, iconColor: 'text-red-500' };
      case 'paused':
        return { color: 'bg-yellow-100 text-yellow-700', icon: PauseCircle, iconColor: 'text-yellow-500' };
      case 'cancelled':
        return { color: 'bg-gray-100 text-gray-700', icon: Square, iconColor: 'text-gray-500' };
      default:
        return { color: 'bg-gray-100 text-gray-700', icon: Clock, iconColor: 'text-gray-500' };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <span className={`inline-flex items-center space-x-1 rounded-full font-medium ${config.color} ${sizeClasses}`}>
      <Icon className={`${iconSize} ${config.iconColor}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
};

// Progress bar component
const ProgressBar: React.FC<{ progress: number; status: string }> = ({ progress, status }) => {
  const getProgressColor = () => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <motion.div
        className={`h-2 rounded-full ${getProgressColor()}`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};

// Metrics card component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}> = ({ title, value, subtitle, icon: Icon, color, trend, trendValue }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return null;
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${color} text-white`}>
          <Icon className="w-6 h-6" />
        </div>
        {TrendIcon && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendIcon className="w-4 h-4" />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="mt-4"><>

        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p
</>
className="text-gray-600 font-medium">{title}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
};

const WorkflowMonitor: React.FC = () => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedExecutions, setExpandedExecutions] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // In a real app, these would be API calls
      const mockExecutions = generateMockExecutions();
      const mockMetrics = generateMockMetrics();
      
      setExecutions(mockExecutions);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const toggleExecutionExpansion = (executionId: string) => {
    const newExpanded = new Set(expandedExecutions);
    if (newExpanded.has(executionId)) {
      newExpanded.delete(executionId);
    } else {
      newExpanded.add(executionId);
    }
    setExpandedExecutions(newExpanded);
  };

  const filteredExecutions = executions.filter(execution => {
    const matchesStatus = filterStatus === 'all' || execution.status === filterStatus;
    const matchesSearch = execution.workflowName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-2xl font-bold text-gray-900">Workflow Monitor</h1>
          <p
</>
className="text-gray-600">Real-time workflow execution monitoring and analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            <Refresh className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Executions"
          value={metrics.totalExecutions.toLocaleString()}
          icon={BarChart3}
          color="from-blue-500 to-cyan-600"
          trend="up"
          trendValue="+12%"
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics.successRate}%`}
          icon={CheckCircle}
          color="from-green-500 to-emerald-600"
          trend="up"
          trendValue="+2.1%"
        />
        <MetricCard
          title="Avg Duration"
          value={formatDuration(metrics.averageDuration)}
          icon={Clock}
          color="from-yellow-500 to-amber-600"
          trend="down"
          trendValue="-15s"
        />
        <MetricCard
          title="Active Workflows"
          value={metrics.activeWorkflows}
          subtitle={`${metrics.failedWorkflows} failed`}
          icon={Activity}
          color="from-purple-500 to-violet-600"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" /><>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search workflows..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
</>

              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            ><>

              <option value="all">All Status</option>
              <option
</>
value="running">Running</option><>

              <option value="completed">Completed</option>
              <option
</>
value="failed">Failed</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            {filteredExecutions.length} of {executions.length} executions
          </div>
        </div>
      </div>

      {/* Executions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Executions</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredExecutions.map(execution => (
            <motion.div
              key={execution.id}
              layout
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleExecutionExpansion(execution.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {expandedExecutions.has(execution.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (<>

                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <div
</>
</>><>

                    <h3 className="font-medium text-gray-900">{execution.workflowName}</h3>
                    <p
</>
className="text-sm text-gray-500">
                      Started {formatTimestamp(execution.startTime)}
                      {execution.triggeredBy && ` • Triggered by ${execution.triggeredBy}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    {execution.duration && (
                      <p className="text-sm font-medium text-gray-900">
                        {formatDuration(execution.duration)}
                      </p>
                    )}
                    {execution.status === 'running' && (
                      <p className="text-sm text-gray-500">{execution.progress}% complete</p>
                    )}
                  </div>
                  <StatusBadge status={execution.status} />
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedExecution(execution)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    ><>

                      <Eye className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
</>
className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                      <Download className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress bar for running workflows */}
              {execution.status === 'running' && (
                <div className="mt-3 ml-8">
                  <ProgressBar progress={execution.progress} status={execution.status} />
                </div>
              )}

              {/* Expanded details */}
              <AnimatePresence>
                {expandedExecutions.has(execution.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 ml-8"
                  >
                    <div className="bg-gray-50 rounded-lg p-4"><>

                      <h4 className="font-medium text-gray-900 mb-3">Execution Steps</h4>
                      <div
</>
className="space-y-2">
                        {execution.steps.map(step => (
                          <div key={step.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                              <StatusBadge status={step.status} size="sm" />
                              <span className="text-sm text-gray-900">{step.name}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {step.duration && formatDuration(step.duration)}
                              {step.retryCount > 0 && ` • ${step.retryCount} retries`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Execution Detail Modal */}
      <AnimatePresence>
        {selectedExecution && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedExecution(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div><>

                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedExecution.workflowName}
                    </h3>
                    <p
</>
className="text-gray-600">Execution ID: {selectedExecution.id}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={selectedExecution.status} />
                    <button
                      onClick={() => setSelectedExecution(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div><>

                      <h4 className="font-medium text-gray-900 mb-2">Execution Details</h4>
                      <div
</>
className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between"><>

                          <span className="text-gray-600">Started:</span>
                          <span
</>
className="text-gray-900">{formatTimestamp(selectedExecution.startTime)}</span>
                        </div>
                        {selectedExecution.endTime && (
                          <div className="flex justify-between"><>

                            <span className="text-gray-600">Ended:</span>
                            <span
</>
className="text-gray-900">{formatTimestamp(selectedExecution.endTime)}</span>
                          </div>
                        )}
                        {selectedExecution.duration && (
                          <div className="flex justify-between"><>

                            <span className="text-gray-600">Duration:</span>
                            <span
</>
className="text-gray-900">{formatDuration(selectedExecution.duration)}</span>
                          </div>
                        )}
                        <div className="flex justify-between"><>

                          <span className="text-gray-600">Triggered by:</span>
                          <span
</>
className="text-gray-900 capitalize">{selectedExecution.triggeredBy}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div><>

                      <h4 className="font-medium text-gray-900 mb-2">Input/Output Data</h4>
                      <div
</>
className="bg-gray-50 rounded-lg p-4">
                        <div className="mb-3"><>

                          <span className="text-sm font-medium text-gray-700">Input:</span>
                          <pre
</>
className="text-xs text-gray-600 mt-1 bg-white p-2 rounded">
                            {JSON.stringify(selectedExecution.inputData, null, 2)}
                          </pre>
                        </div>
                        {selectedExecution.outputData && (
                          <div><>

                            <span className="text-sm font-medium text-gray-700">Output:</span>
                            <pre
</>
className="text-xs text-gray-600 mt-1 bg-white p-2 rounded">
                              {JSON.stringify(selectedExecution.outputData, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div><>

                  <h4 className="font-medium text-gray-900 mb-4">Step Details</h4>
                  <div
</>
className="space-y-3">
                    {selectedExecution.steps.map((step /* , index */) => (
                      <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3"><>

                            <span className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                              {index + 1}
                            </span>
                            <span
</>
className="font-medium text-gray-900">{step.name}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <StatusBadge status={step.status} size="sm" />
                            {step.duration && (
                              <span className="text-sm text-gray-500">
                                {formatDuration(step.duration)}
                              </span>
                            )}
                          </div>
                        </div>

                        {step.errorMessage && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <strong>Error:</strong> {step.errorMessage}
                          </div>
                        )}

                        {step.retryCount > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            Retry attempts: {step.retryCount}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkflowMonitor;