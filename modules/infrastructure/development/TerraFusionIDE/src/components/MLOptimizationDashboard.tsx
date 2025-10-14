import React, { useState, useEffect } from 'react';
import { Brain,
  TrendingUp,
  Activity,
  Play,
  Square,
  Download,
  Settings,
  BarChart3,
  Zap,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader
 } from 'lucide-react';
import MLOptimizationEngine, { MLModel, TrainingJob, OptimizationConfig } from '../core/MLOptimizationEngine';

interface MLOptimizationDashboardProps {
  className?: string;
}

const MLOptimizationDashboard: React.FC<MLOptimizationDashboardProps> = ({ className = '' }) => {
  const [mlEngine] = useState(() => new MLOptimizationEngine());
  const [models, setModels] = useState<MLModel[]>([]);
  const [activeJobs, setActiveJobs] = useState<TrainingJob[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig>({
    targetMetric: 'accuracy',
    optimizationType: 'hyperparameter',
    constraints: {
      maxTrainingTime: 300000,
      maxMemoryUsage: 2048,
      minAccuracy: 0.8
    }
  });

  useEffect(() => {
    setModels(mlEngine.getAllModels());
    
    const updateJobs = () => {
      setActiveJobs(mlEngine.getActiveJobs());
    };

    mlEngine.on('optimization-started', updateJobs);
    mlEngine.on('optimization-progress', updateJobs);
    mlEngine.on('optimization-completed', updateJobs);

    return () => {
      mlEngine.removeAllListeners();
    };
  }, [mlEngine]);

  const handleStartOptimization = async () => {
    if (!selectedModel) return;
    
    try {
      const jobId = await mlEngine.optimizeModel(selectedModel, optimizationConfig);
      console.log(`Optimization started: ${jobId}`);
    } catch (error) {
      console.error('Failed to start optimization:', error);
    }
  };

  const handleAutoOptimizeAll = async () => {
    try {
      const jobIds = await mlEngine.autoOptimizeAll();
      console.log(`Auto-optimization started for ${jobIds.length} models`);
    } catch (error) {
      console.error('Failed to start auto-optimization:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'training': return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatAccuracy = (accuracy: number) => `${(accuracy * 100).toFixed(1)}%`;
  const formatLatency = (latency: number) => `${latency}ms`;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">

          <Brain className="w-8 h-8 text-purple-600" />
          ML Optimization Dashboard
        </h2>
        <div

className="flex items-center gap-2">
          <button
            onClick={handleAutoOptimizeAll}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            <Zap className="w-4 h-4" />
            Auto-Optimize All
          </button>
        </div>
      </div>

      {/* Model Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {models.map(model => (
          <div key={model.id} className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">

              <h3 className="text-lg font-semibold text-gray-800">{model.name}</h3>
              <span

className={`px-2 py-1 text-xs rounded-full ${
                model.type === 'classification' ? 'bg-green-100 text-green-800' :
                model.type === 'regression' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {model.type}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">

                <span className="text-sm text-gray-600">Accuracy:</span>
                <span

className="font-semibold text-gray-800">{formatAccuracy(model.accuracy)}</span>
              </div>
              <div className="flex justify-between items-center">

                <span className="text-sm text-gray-600">Precision:</span>
                <span

className="font-semibold text-gray-800">{formatAccuracy(model.performance.precision)}</span>
              </div>
              <div className="flex justify-between items-center">

                <span className="text-sm text-gray-600">Recall:</span>
                <span

className="font-semibold text-gray-800">{formatAccuracy(model.performance.recall)}</span>
              </div>
              <div className="flex justify-between items-center">

                <span className="text-sm text-gray-600">Latency:</span>
                <span

className="font-semibold text-gray-800">{formatLatency(model.performance.latency)}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Training Data: {model.trainingDataSize.toLocaleString()}</span>
                <span>Last: {model.lastTrained.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Optimization Controls */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">

          <Settings className="w-5 h-5" />
          Optimization Controls
        </h3>
        
        <div

className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">Target Metric</label>
            <select

              value={optimizationConfig.targetMetric}
              onChange={(e) => setOptimizationConfig(prev => ({
                ...prev,
                targetMetric: e.target.value as OptimizationConfig['targetMetric']
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select target metric for optimization"
            >

              <option value="accuracy">Accuracy</option>
              <option

value="precision">Precision</option>

              <option value="recall">Recall</option>
              <option

value="f1">F1 Score</option>
              <option value="latency">Latency</option>
            </select>
          </div>

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">Optimization Type</label>
            <select

              value={optimizationConfig.optimizationType}
              onChange={(e) => setOptimizationConfig(prev => ({
                ...prev,
                optimizationType: e.target.value as OptimizationConfig['optimizationType']
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select optimization type"
            >

              <option value="hyperparameter">Hyperparameter</option>
              <option

value="architecture">Architecture</option>
              <option value="feature-selection">Feature Selection</option>
            </select>
          </div>

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">Max Training Time (ms)</label>
            <input

              type="number"
              value={optimizationConfig.constraints.maxTrainingTime}
              onChange={(e) => setOptimizationConfig(prev => ({
                ...prev,
                constraints: {
                  ...prev.constraints,
                  maxTrainingTime: parseInt(e.target.value)
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter maximum training time in milliseconds"
              title="Maximum training time in milliseconds"
            />
          </div>

          <div>

            <label className="block text-sm font-medium text-gray-700 mb-2">Min Accuracy</label>
            <input

              type="number"
              step="0.01"
              min="0"
              max="1"
              value={optimizationConfig.constraints.minAccuracy}
              onChange={(e) => setOptimizationConfig(prev => ({
                ...prev,
                constraints: {
                  ...prev.constraints,
                  minAccuracy: parseFloat(e.target.value)
                }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter minimum accuracy (0.0 to 1.0)"
              title="Minimum accuracy threshold (0.0 to 1.0)"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select model for optimization"
          >
            <option value="">Select Model</option>
            {models.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>

          <button
            onClick={handleStartOptimization}
            disabled={!selectedModel}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            <Play className="w-4 h-4" />
            Start Optimization
          </button>
        </div>
      </div>

      {/* Active Training Jobs */}
      {activeJobs.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">

            <Activity className="w-5 h-5" />
            Active Training Jobs ({activeJobs.length})
          </h3>
          
          <div

className="space-y-4">
            {activeJobs.map(job => {
              const model = models.find(m => m.id === job.modelId);
              return (
                <div key={job.id} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status)}
                      <div>

                        <h4 className="font-medium text-gray-800">{model?.name || 'Unknown Model'}</h4>
                        <p

className="text-sm text-gray-500">Job ID: {job.id}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {job.startTime.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{job.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {job.metrics.accuracy.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>

                        <span className="text-gray-600">Current Accuracy: </span>
                        <span

className="font-medium">{formatAccuracy(job.metrics.accuracy[job.metrics.accuracy.length - 1])}</span>
                      </div>
                      <div>

                        <span className="text-gray-600">Current Loss: </span>
                        <span

className="font-medium">{job.metrics.loss[job.metrics.loss.length - 1]?.toFixed(4)}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance Metrics Chart */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">

          <BarChart3 className="w-5 h-5" />
          Performance Metrics
        </h3>
        
        <div

className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">

            <h4 className="font-medium text-gray-800 mb-3">Model Comparison</h4>
            <div

className="space-y-3">
              {models.map(model => (
                <div key={model.id} className="flex items-center justify-between">

                  <span className="text-sm text-gray-600">{model.name}</span>
                  <div

className="flex items-center gap-4">

                    <span className="text-sm font-medium">{formatAccuracy(model.accuracy)}</span>
                    <div

className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${model.accuracy * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">

            <h4 className="font-medium text-gray-800 mb-3">Latency Analysis</h4>
            <div

className="space-y-3">
              {models.map(model => (
                <div key={model.id} className="flex items-center justify-between">

                  <span className="text-sm text-gray-600">{model.name}</span>
                  <div

className="flex items-center gap-2">

                    <span className="text-sm font-medium">{formatLatency(model.performance.latency)}</span>
                    <div

className={`w-3 h-3 rounded-full ${
                      model.performance.latency < 30 ? 'bg-green-500' :
                      model.performance.latency < 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLOptimizationDashboard;
