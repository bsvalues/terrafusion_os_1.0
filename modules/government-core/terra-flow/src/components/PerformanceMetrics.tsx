import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Cpu,
  HardDrive,
  Zap,
  Users
} from 'lucide-react';
import { Line, Bar, Area, ResponsiveContainer, LineChart, BarChart, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface PerformanceData {
  timestamp: string;
  executions: number;
  successRate: number;
  cpu: number;
  memory: number;
  throughput: number;
}

interface ExecutionMetrics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  performance: {
    cpu: number;
    memory: number;
    throughput: number;
  };
  errors: Array<{
    timestamp: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface PerformanceMetricsProps {
  metrics: ExecutionMetrics;
  className?: string;
}

// Mock data for charts
const mockPerformanceData: PerformanceData[] = [
  { timestamp: '00:00', executions: 45, successRate: 98, cpu: 35, memory: 42, throughput: 890 },
  { timestamp: '04:00', executions: 52, successRate: 97, cpu: 42, memory: 38, throughput: 920 },
  { timestamp: '08:00', executions: 78, successRate: 99, cpu: 58, memory: 55, throughput: 1150 },
  { timestamp: '12:00', executions: 95, successRate: 98, cpu: 65, memory: 62, throughput: 1340 },
  { timestamp: '16:00', executions: 87, successRate: 99, cpu: 60, memory: 58, throughput: 1280 },
  { timestamp: '20:00', executions: 69, successRate: 97, cpu: 48, memory: 45, throughput: 1050 }
];

const mockThroughputData = [
  { name: 'Workflow A', value: 1240 },
  { name: 'Workflow B', value: 980 },
  { name: 'Workflow C', value: 1450 },
  { name: 'Workflow D', value: 720 },
  { name: 'Workflow E', value: 1180 }
];

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ 
  metrics, 
  className 
}) => {
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceColor = (value: number): string => {
    if (value <= 50) return 'text-green-600';
    if (value <= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`performance-metrics p-6 h-full overflow-auto bg-gray-50 ${className || ''}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
            <p className="text-gray-600">Real-time workflow performance insights</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Executions</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(metrics.totalExecutions)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+12.5%</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-600 mb-1">Success Rate</p>
              <p className={`text-2xl font-bold ${getSuccessRateColor(metrics.successRate)}`}>
                {metrics.successRate.toFixed(1)}%
              </p>
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Excellent</span>
              </div>
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
              <p className="text-sm text-gray-600 mb-1">Avg Execution Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.averageExecutionTime.toFixed(1)}s
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-600">Optimized</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
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
              <p className="text-sm text-gray-600 mb-1">Throughput</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(metrics.performance.throughput)}/h
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-600">High</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Execution Timeline */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Execution Timeline</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mockPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="executions" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Executions"
              />
              <Line 
                type="monotone" 
                dataKey="successRate" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Success Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Resource Usage */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={mockPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="cpu" 
                stackId="1"
                stroke="#F59E0B" 
                fill="#FEF3C7"
                name="CPU (%)"
              />
              <Area 
                type="monotone" 
                dataKey="memory" 
                stackId="1"
                stroke="#EF4444" 
                fill="#FEE2E2"
                name="Memory (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* System Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* CPU Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">CPU Usage</h3>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold ${getPerformanceColor(metrics.performance.cpu)}`}>
              {metrics.performance.cpu.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${metrics.performance.cpu}%` }}
                transition={{ delay: 0.8, duration: 1 }}
                className={`h-2 rounded-full ${
                  metrics.performance.cpu <= 50 ? 'bg-green-500' :
                  metrics.performance.cpu <= 80 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">Current utilization</p>
          </div>
        </motion.div>

        {/* Memory Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Memory Usage</h3>
          </div>
          
          <div className="text-center">
            <div className={`text-3xl font-bold ${getPerformanceColor(metrics.performance.memory)}`}>
              {metrics.performance.memory.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${metrics.performance.memory}%` }}
                transition={{ delay: 0.9, duration: 1 }}
                className={`h-2 rounded-full ${
                  metrics.performance.memory <= 50 ? 'bg-green-500' :
                  metrics.performance.memory <= 80 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">RAM utilization</p>
          </div>
        </motion.div>

        {/* Error Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Error Summary</h3>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {metrics.errors.length}
            </div>
            <p className="text-sm text-gray-600 mt-2">Recent errors</p>
            
            {metrics.errors.length > 0 ? (
              <div className="mt-4 space-y-2">
                {metrics.errors.slice(0, 2).map((error, index) => (
                  <div key={index} className="text-left p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-xs font-medium text-red-800">{error.severity.toUpperCase()}</p>
                    <p className="text-xs text-red-600 truncate">{error.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 p-2 bg-green-50 rounded border border-green-200">
                <p className="text-xs text-green-600">No recent errors</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Workflow Throughput */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Throughput Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockThroughputData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default PerformanceMetrics;
