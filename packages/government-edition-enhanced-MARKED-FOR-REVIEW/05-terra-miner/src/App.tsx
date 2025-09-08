import "./terrafusion-brand.css";
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Database, 
  TrendingUp, 
  Brain, 
  Search, 
  BarChart3,
  Zap,
  Target,
  Eye,
  Activity,
  Cpu,
  HardDrive,
  Network,
  Warning,
  CheckCircle,
  Clock,
  PlayCircle,
  PauseCircle,
  StopCircle
 } from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface MiningJob {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'completed' | 'queued' | 'failed';
  progress: number;
  data_points: number;
  insights: number;
  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;
}

interface DataInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  generated_at: string;
  metrics?: {
    correlation: number;
    significance: number;
    sample_size: number;
  };
}

interface PatternAnalysis {
  pattern_type: string;
  frequency: number;
  strength: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  prediction: string;
}

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_io: number;
  active_jobs: number;
  processing_rate: number;
}

function App() {
  const [activeTab, setActiveTab] = useState<'mining' | 'insights' | 'patterns' | 'analytics'>('mining');
  const [miningJobs, setMiningJobs] = useState<MiningJob[]>([]);
  const [insights, setInsights] = useState<DataInsight[]>([]);
  const [patterns, setPatterns] = useState<PatternAnalysis[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Chart data
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [insightDistribution, setInsightDistribution] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(updateSystemMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [jobsData, insightsData, patternsData] = await Promise.all([
        invoke<{mining_jobs: MiningJob[]}>('get_mining_jobs'),
        invoke<{insights: DataInsight[]}>('get_data_insights'),
        invoke<{patterns: PatternAnalysis[]}>('get_pattern_analysis')
      ]);
      
      setMiningJobs(jobsData.mining_jobs || []);
      setInsights(insightsData.insights || []);
      setPatterns(patternsData.patterns || []);
      
      generateChartData();
    } catch (error) {
      console.error('Failed to load data:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setMiningJobs([
      {
        id: 'job-001',
        name: 'Property Value Patterns',
        type: 'value-analysis',
        status: 'running',
        progress: 75,
        data_points: 45000,
        insights: 12,
        started_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 'job-002',
        name: 'Market Trend Mining',
        type: 'trend-analysis',
        status: 'completed',
        progress: 100,
        data_points: 78000,
        insights: 127,
        completed_at: '2024-01-01T09:00:00Z'
      },
      {
        id: 'job-003',
        name: 'Risk Factor Analysis',
        type: 'risk-mining',
        status: 'queued',
        progress: 0,
        data_points: 0,
        insights: 0
      }
    ]);

    setInsights([
      {
        id: 'insight-001',
        type: 'market-trend',
        title: 'Urban Property Appreciation',
        description: 'Urban properties show 23% higher appreciation in the last 12 months',
        confidence: 0.94,
        impact: 'high',
        generated_at: '2024-01-01T08:00:00Z',
        metrics: { correlation: 0.87, significance: 0.95, sample_size: 1250 }
      },
      {
        id: 'insight-002',
        type: 'risk-factor',
        title: 'Climate Risk Correlation',
        description: 'Properties in flood zones have 18% higher insurance requirements',
        confidence: 0.89,
        impact: 'medium',
        generated_at: '2024-01-01T07:00:00Z',
        metrics: { correlation: 0.73, significance: 0.88, sample_size: 890 }
      }
    ]);

    setPatterns([
      {
        pattern_type: 'seasonal_pricing',
        frequency: 85.2,
        strength: 0.78,
        trend: 'increasing',
        prediction: 'Spring market surge expected'
      },
      {
        pattern_type: 'location_premium',
        frequency: 92.1,
        strength: 0.85,
        trend: 'stable',
        prediction: 'Transit proximity remains key driver'
      }
    ]);

    generateChartData();
  };

  const updateSystemMetrics = async () => {
    try {
      const metrics = await invoke<SystemMetrics>('get_system_metrics');
      setSystemMetrics(metrics);
    } catch (error) {
      // Mock system metrics
      setSystemMetrics({
        cpu_usage: Math.random() * 100,
        memory_usage: Math.random() * 100,
        disk_usage: 65.4,
        network_io: Math.random() * 1000,
        active_jobs: miningJobs.filter(j => j.status === 'running').length,
        processing_rate: 2300 + Math.random() * 500
      });
    }
  };

  const generateChartData = () => {
    // Performance data for the last 24 hours
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date();
      hour.setHours(hour.getHours() - (23 - i));
      return {
        time: hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        processing_rate: 1800 + Math.random() * 1000,
        insights_generated: Math.floor(Math.random() * 20),
        data_processed: Math.floor(Math.random() * 5000)
      };
    });
    setPerformanceData(hours);

    // Insight distribution
    setInsightDistribution([
      { name: 'Market Trends', value: 35, color: '#8884d8' },
      { name: 'Risk Factors', value: 25, color: '#82ca9d' },
      { name: 'Pattern Recognition', value: 20, color: '#ffc658' },
      { name: 'Predictions', value: 20, color: '#ff7300' }
    ]);
  };

  const startMiningJob = async (jobType: string, dataSource: string) => {
    try {
      setLoading(true);
      await invoke<{job_id: string}>('start_mining_job', {
        jobType,
        dataSource,
        parameters: { depth: 'deep', accuracy: 'high' }
      });
      
      // Refresh jobs list
      await loadInitialData();
    } catch (error) {
      console.error('Failed to start mining job:', error);
    } finally {
      setLoading(false);
    }
  };

  const pauseJob = async (jobId: string) => {
    try {
      await invoke('pause_mining_job', { jobId });
      await loadInitialData();
    } catch (error) {
      console.error('Failed to pause job:', error);
    }
  };

  const stopJob = async (jobId: string) => {
    try {
      await invoke('stop_mining_job', { jobId });
      await loadInitialData();
    } catch (error) {
      console.error('Failed to stop job:', error);
    }
  };

  const renderMiningTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg"><>

        <h2 className="text-2xl font-bold mb-2">Data Mining Operations</h2>
        <p
</>
className="opacity-90">Advanced pattern recognition and machine learning insights</p>
      </div>

      {/* System Metrics */}
      {systemMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-2"><>

              <span className="text-sm font-medium text-gray-600">CPU Usage</span>
              <Cpu
</>
className="h-4 w-4 text-blue-600" />
            </div><>

            <div className="text-2xl font-bold text-blue-600">
              {systemMetrics.cpu_usage.toFixed(1)}%
            </div>
            <div
</>
className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${systemMetrics.cpu_usage}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-2"><>

              <span className="text-sm font-medium text-gray-600">Memory</span>
              <HardDrive
</>
className="h-4 w-4 text-green-600" />
            </div><>

            <div className="text-2xl font-bold text-green-600">
              {systemMetrics.memory_usage.toFixed(1)}%
            </div>
            <div
</>
className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${systemMetrics.memory_usage}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-2"><>

              <span className="text-sm font-medium text-gray-600">Processing Rate</span>
              <Activity
</>
className="h-4 w-4 text-purple-600" />
            </div><>

            <div className="text-2xl font-bold text-purple-600">
              {systemMetrics.processing_rate.toFixed(0)}
            </div>
            <div
</>
className="text-xs text-gray-500">records/min</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-2"><>

              <span className="text-sm font-medium text-gray-600">Active Jobs</span>
              <Network
</>
className="h-4 w-4 text-orange-600" />
            </div><>

            <div className="text-2xl font-bold text-orange-600">
              {systemMetrics.active_jobs}
            </div>
            <div
</>
className="text-xs text-gray-500">running</div>
          </div>
        </div>
      )}

      {/* Mining Jobs */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center"><>

            <Database className="h-5 w-5 mr-2 text-blue-600" />
            Mining Jobs
          </h3>
          <button
</>

            onClick={() => startMiningJob('comprehensive', 'property_database')}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Start New Job
          </button>
        </div>

        <div className="space-y-4">
          {miningJobs.map((job) => (
            <div key={job.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div><>

                  <h4 className="font-semibold text-lg">{job.name}</h4>
                  <p
</>
className="text-sm text-gray-600 capitalize">{job.type.replace('-', ' ')}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {job.status === 'completed' && <CheckCircle className="h-4 w-4 mr-1" />}
                    {job.status === 'running' && <PlayCircle className="h-4 w-4 mr-1" />}
                    {job.status === 'failed' && <Warning className="h-4 w-4 mr-1" />}
                    {job.status === 'queued' && <Clock className="h-4 w-4 mr-1" />}
                    {job.status}
                  </div>
                  
                  {job.status === 'running' && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => pauseJob(job.id)}
                        className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
                      ><>

                        <PauseCircle className="h-4 w-4" />
                      </button>
                      <button
</>

                        onClick={() => stopJob(job.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <StopCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {job.status === 'running' && (
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1"><>

                    <span>Progress</span>
                    <span
</>
</>>{job.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><>

                  <span className="text-gray-600">Data Points:</span>
                  <div
</>
className="font-semibold">{job.data_points.toLocaleString()}</div>
                </div>
                <div><>

                  <span className="text-gray-600">Insights:</span>
                  <div
</>
className="font-semibold">{job.insights}</div>
                </div>
                <div><>

                  <span className="text-gray-600">
                    {job.completed_at ? 'Completed:' : job.started_at ? 'Started:' : 'Scheduled:'}
                  </span>
                  <div
</>
className="font-semibold text-xs">
                    {job.completed_at ? 
                      new Date(job.completed_at).toLocaleString() :
                      job.started_at ?
                      new Date(job.started_at).toLocaleString() :
                      'Pending'
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-6 rounded-lg"><>

        <h2 className="text-2xl font-bold mb-2">AI-Generated Insights</h2>
        <p
</>
className="opacity-90">Machine learning insights and pattern discoveries</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {insights.map((insight) => (
          <div key={insight.id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Brain className="h-6 w-6 text-blue-600 mr-2" />
                <div><>

                  <h3 className="font-semibold text-lg">{insight.title}</h3>
                  <p
</>
className="text-sm text-gray-600 capitalize">{insight.type.replace('-', ' ')}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {insight.impact} impact
              </div>
            </div><>

            <p className="text-gray-700 mb-4">{insight.description}</p>

            <div
</>
className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded"><>

                <div className="text-2xl font-bold text-blue-600">
                  {(insight.confidence * 100).toFixed(1)}%
                </div>
                <div
</>
className="text-sm text-gray-600">Confidence</div>
              </div>
              {insight.metrics && (
                <div className="text-center p-3 bg-gray-50 rounded"><>

                  <div className="text-2xl font-bold text-green-600">
                    {insight.metrics.sample_size.toLocaleString()}
                  </div>
                  <div
</>
className="text-sm text-gray-600">Sample Size</div>
                </div>
              )}
            </div>

            {insight.metrics && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><>

                  <span>Correlation:</span>
                  <span
</>
className="font-semibold">{(insight.metrics.correlation * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm"><>

                  <span>Statistical Significance:</span>
                  <span
</>
className="font-semibold">{(insight.metrics.significance * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              Generated: {new Date(insight.generated_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPatternsTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-lg"><>

        <h2 className="text-2xl font-bold mb-2">Pattern Analysis</h2>
        <p
</>
className="opacity-90">Advanced pattern recognition and trend analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><>

            <Search className="h-5 w-5 mr-2 text-orange-600" />
            Discovered Patterns
          </h3>
          
          <div
</>
className="space-y-4">
            {patterns.map((pattern /* , index */) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2"><>

                  <h4 className="font-semibold capitalize">
                    {pattern.pattern_type.replace('_', ' ')}
                  </h4>
                  <div
</>
className={`px-2 py-1 rounded text-xs font-medium ${
                    pattern.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                    pattern.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {pattern.trend}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div><>

                    <span className="text-sm text-gray-600">Frequency:</span>
                    <div
</>
className="font-semibold">{pattern.frequency.toFixed(1)}%</div>
                  </div>
                  <div><>

                    <span className="text-sm text-gray-600">Strength:</span>
                    <div
</>
className="font-semibold">{(pattern.strength * 100).toFixed(1)}%</div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${pattern.strength * 100}%` }}
                  ></div>
                </div>
                
                <p className="text-sm text-gray-700 italic">{pattern.prediction}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><>

            <Eye className="h-5 w-5 mr-2 text-purple-600" />
            Pattern Visualization
          </h3>
          
          <div
</>
className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData.slice(-12)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="processing_rate" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-center py-4 text-gray-500">
            Real-time pattern recognition visualization
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg"><>

        <h2 className="text-2xl font-bold mb-2">Analytics Dashboard</h2>
        <p
</>
className="opacity-90">Comprehensive performance metrics and visualizations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><>

            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Processing Performance
          </h3>
          
          <div
</>
className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="processing_rate" 
                  stroke="#8884d8" 
                  name="Processing Rate"
                />
                <Line 
                  type="monotone" 
                  dataKey="insights_generated" 
                  stroke="#82ca9d" 
                  name="Insights Generated"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><>

            <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
            Insight Distribution
          </h3>
          
          <div
</>
className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={insightDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {insightDistribution.map((entry /* , index */) => (<>

                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
</>
/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><>

            <Target className="h-5 w-5 mr-2 text-purple-600" />
            Data Processing Volume
          </h3>
          
          <div
</>
className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData.slice(-8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="data_processed" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><>

            <Zap className="h-5 w-5 mr-2 text-yellow-600" />
            Key Performance Indicators
          </h3>
          
          <div
</>
className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded"><>

              <span className="font-medium">Total Records Processed</span>
              <span
</>
className="text-xl font-bold text-blue-600">2.4M</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded"><>

              <span className="font-medium">Insights Generated</span>
              <span
</>
className="text-xl font-bold text-green-600">1,247</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded"><>

              <span className="font-medium">Pattern Accuracy</span>
              <span
</>
className="text-xl font-bold text-purple-600">94.2%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded"><>

              <span className="font-medium">Processing Speed</span>
              <span
</>
className="text-xl font-bold text-orange-600">2.3k/min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-600 mr-3" />
              <div><>

                <h1 className="text-2xl font-bold text-gray-900">TerraMiner</h1>
                <p
</>
className="text-sm text-gray-600">Advanced Data Mining & Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-2"><>

              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                v1.8.0
              </div>
              <div
</>
className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                Championship Edition
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'mining', label: 'Mining Operations', icon: Database },
              { id: 'insights', label: 'AI Insights', icon: Brain },
              { id: 'patterns', label: 'Pattern Analysis', icon: Search },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="fadeIn">
          {activeTab === 'mining' && renderMiningTab()}
          {activeTab === 'insights' && renderInsightsTab()}
          {activeTab === 'patterns' && renderPatternsTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
        </div>
      </main>
    </div>
  );
}

export default App;