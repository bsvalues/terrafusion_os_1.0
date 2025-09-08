import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square,
  RotateCcw,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Settings,
  Download,
  Zap
} from 'lucide-react';

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startTime: string;
  endTime?: string;
  duration?: number;
  progress: number;
  triggeredBy: string;
  steps: ExecutionStep[];
  logs: string[];
  error?: string;
}

interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: string;
  endTime?: string;
  duration?: number;
  output?: any;
  errorMessage?: string;
  retryCount: number;
}

interface WorkflowMonitorProps {
  className?: string;
}

const mockExecutions: WorkflowExecution[] = [
  {
    id: 'exec-1',
    workflowId: 'wf-1',
    workflowName: 'Data Processing Pipeline',
    status: 'running',
    startTime: '2025-09-06T14:30:00Z',
    progress: 65,
    triggeredBy: 'schedule',
    steps: [
      { id: 'step-1', name: 'Data Ingestion', status: 'completed', startTime: '2025-09-06T14:30:00Z', endTime: '2025-09-06T14:31:30Z', duration: 90, retryCount: 0 },
      { id: 'step-2', name: 'Data Validation', status: 'completed', startTime: '2025-09-06T14:31:30Z', endTime: '2025-09-06T14:32:15Z', duration: 45, retryCount: 0 },
      { id: 'step-3', name: 'Data Transformation', status: 'running', startTime: '2025-09-06T14:32:15Z', retryCount: 0 },
      { id: 'step-4', name: 'Data Export', status: 'pending', retryCount: 0 },
      { id: 'step-5', name: 'Notification', status: 'pending', retryCount: 0 }
    ],
    logs: [
      '[14:30:00] Starting workflow execution',
      '[14:30:15] Connecting to data source',
      '[14:31:30] Data ingestion completed successfully',
      '[14:31:45] Starting data validation',
      '[14:32:15] Validation completed, starting transformation'
    ]
  },
  {
    id: 'exec-2',
    workflowId: 'wf-2',
    workflowName: 'Report Generation',
    status: 'completed',
    startTime: '2025-09-06T13:00:00Z',
    endTime: '2025-09-06T13:05:30Z',
    duration: 330,
    progress: 100,
    triggeredBy: 'manual',
    steps: [
      { id: 'step-1', name: 'Data Collection', status: 'completed', startTime: '2025-09-06T13:00:00Z', endTime: '2025-09-06T13:02:00Z', duration: 120, retryCount: 0 },
      { id: 'step-2', name: 'Report Generation', status: 'completed', startTime: '2025-09-06T13:02:00Z', endTime: '2025-09-06T13:05:00Z', duration: 180, retryCount: 0 },
      { id: 'step-3', name: 'Report Distribution', status: 'completed', startTime: '2025-09-06T13:05:00Z', endTime: '2025-09-06T13:05:30Z', duration: 30, retryCount: 0 }
    ],
    logs: [
      '[13:00:00] Starting report generation',
      '[13:02:00] Data collection completed',
      '[13:05:00] Report generated successfully',
      '[13:05:30] Report distributed to stakeholders'
    ]
  },
  {
    id: 'exec-3',
    workflowId: 'wf-3',
    workflowName: 'Error Handling Test',
    status: 'failed',
    startTime: '2025-09-06T12:00:00Z',
    endTime: '2025-09-06T12:02:15Z',
    duration: 135,
    progress: 40,
    triggeredBy: 'api',
    error: 'Connection timeout to external service',
    steps: [
      { id: 'step-1', name: 'Initialize', status: 'completed', startTime: '2025-09-06T12:00:00Z', endTime: '2025-09-06T12:00:30Z', duration: 30, retryCount: 0 },
      { id: 'step-2', name: 'API Call', status: 'failed', startTime: '2025-09-06T12:00:30Z', endTime: '2025-09-06T12:02:15Z', duration: 105, errorMessage: 'Connection timeout', retryCount: 3 },
      { id: 'step-3', name: 'Process Response', status: 'skipped', retryCount: 0 }
    ],
    logs: [
      '[12:00:00] Starting workflow execution',
      '[12:00:30] Making API call to external service',
      '[12:01:30] Retry attempt 1 failed',
      '[12:02:00] Retry attempt 2 failed',
      '[12:02:15] Maximum retries exceeded, workflow failed'
    ]
  }
];

export const WorkflowMonitor: React.FC<WorkflowMonitorProps> = ({ className }) => {
  const [executions, setExecutions] = useState<WorkflowExecution[]>(mockExecutions);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');

  useEffect(() => {
    // Simulate real-time updates for running executions
    const interval = setInterval(() => {
      setExecutions(prev => prev.map(exec => {
        if (exec.status === 'running') {
          const newProgress = Math.min(exec.progress + Math.random() * 5, 100);
          return {
            ...exec,
            progress: newProgress,
            status: newProgress >= 100 ? 'completed' : 'running'
          };
        }
        return exec;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const filteredExecutions = executions.filter(exec => 
    filter === 'all' || exec.status === filter
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'skipped':
        return 'bg-gray-400';
      default:
        return 'bg-gray-300';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const retryExecution = (executionId: string) => {
    setExecutions(prev => prev.map(exec =>
      exec.id === executionId
        ? { ...exec, status: 'running', progress: 0, error: undefined }
        : exec
    ));
  };

  const pauseExecution = (executionId: string) => {
    setExecutions(prev => prev.map(exec =>
      exec.id === executionId && exec.status === 'running'
        ? { ...exec, status: 'paused' }
        : exec
    ));
  };

  const resumeExecution = (executionId: string) => {
    setExecutions(prev => prev.map(exec =>
      exec.id === executionId && exec.status === 'paused'
        ? { ...exec, status: 'running' }
        : exec
    ));
  };

  const stopExecution = (executionId: string) => {
    setExecutions(prev => prev.map(exec =>
      exec.id === executionId && (exec.status === 'running' || exec.status === 'paused')
        ? { ...exec, status: 'failed', error: 'Manually stopped' }
        : exec
    ));
  };

  return (
    <div className={`workflow-monitor p-6 h-full overflow-auto ${className || ''}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              Workflow Monitor
            </h2>
            <p className="text-gray-600 mt-1">Real-time monitoring of workflow executions</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Executions</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Logs
            </motion.button>
          </div>
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
              <p className="text-sm text-gray-600">Running</p>
              <p className="text-2xl font-bold text-blue-600">
                {executions.filter(e => e.status === 'running').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {executions.filter(e => e.status === 'completed').length}
              </p>
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
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {executions.filter(e => e.status === 'failed').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
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
              <p className="text-2xl font-bold text-green-600">
                {Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Executions List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Executions</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredExecutions.map((execution, index) => (
              <motion.div
                key={execution.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedExecution?.id === execution.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => setSelectedExecution(execution)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(execution.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{execution.workflowName}</h4>
                      <p className="text-sm text-gray-500">ID: {execution.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                      {execution.status}
                    </span>
                    
                    <div className="flex gap-1">
                      {execution.status === 'running' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              pauseExecution(execution.id);
                            }}
                            className="p-1 text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              stopExecution(execution.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          >
                            <Square className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {execution.status === 'paused' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resumeExecution(execution.id);
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      
                      {execution.status === 'failed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            retryExecution(execution.id);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-900">{execution.progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${execution.progress}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-2 rounded-full ${
                        execution.status === 'failed' ? 'bg-red-500' :
                        execution.status === 'completed' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Started:</span>
                    <span className="ml-1 text-gray-900">
                      {new Date(execution.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-1 text-gray-900">
                      {formatDuration(execution.duration)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Triggered by:</span>
                    <span className="ml-1 text-gray-900 capitalize">{execution.triggeredBy}</span>
                  </div>
                </div>

                {execution.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Error</span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{execution.error}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Execution Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {selectedExecution ? (
            <div>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Execution Details</h3>
                  <button
                    onClick={() => setSelectedExecution(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Step Timeline */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Steps</h4>
                  <div className="space-y-3">
                    {selectedExecution.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className={`w-3 h-3 rounded-full ${getStepStatusColor(step.status)}`}
                          />
                          <span className="text-sm font-medium text-gray-900">{step.name}</span>
                        </div>
                        
                        <div className="flex-1 text-xs text-gray-500">
                          {step.duration && `${formatDuration(step.duration)}`}
                        </div>

                        {step.errorMessage && (
                          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                            Error: {step.errorMessage}
                          </div>
                        )}

                        {step.retryCount > 0 && (
                          <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                            Retries: {step.retryCount}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Execution Logs */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Execution Logs</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {selectedExecution.logs.map((log, index) => (
                      <div key={index} className="text-xs text-gray-600 font-mono mb-1">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select an execution to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowMonitor;
