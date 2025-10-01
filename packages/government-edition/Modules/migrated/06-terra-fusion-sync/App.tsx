import "./terrafusion-brand.css";
import {useState, useEffect} from 'react';
import {invoke} from '@tauri-apps/api/tauri';
import {Refresh, 
  Database, 
  Cloud, 
  Server, 
  Wifi, 
  WifiOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  Zap,
  Globe,
  HardDrive,
  Link,
  Settings,
  Monitor,
  BarChart3,
  TrendingUp} from '@mui/icons-material';
import {LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell} from 'recharts';

interface SyncSource {id: string;
  name: string;
  type: 'postgresql' | 'api' | 'gis' | 'mls' | 'file';
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  last_sync: string;
  record_count: number;
  sync_frequency: string;
  health_score: number;
  bandwidth_usage: number;
  error_rate: number;}

interface SyncJob {id: string;
  source_id: string;
  source_name: string;
  status: 'running' | 'completed' | 'failed' | 'queued';
  progress: number;
  records_processed: number;
  records_total: number;
  started_at: string;
  estimated_completion?: string;
  sync_type: 'full' | 'incremental' | 'real-time';}

interface Integration {id: string;
  name: string;
  type: 'internal' | 'external';
  status: 'active' | 'inactive' | 'error';
  endpoint: string;
  last_health_check: string;
  response_time: number;
  success_rate: number;}

interface SystemStatus {overall_health: 'healthy' | 'warning' | 'critical';
  active_syncs: number;
  queued_jobs: number;
  total_records_synced: number;
  data_throughput: number;
  uptime: string;
  memory_usage: number;
  cpu_usage: number;}

function App() {const [activeTab, setActiveTab] = useState<'sync' | 'integrations' | 'monitoring' | 'settings'>('sync');
  const [syncSources, setSyncSources] = useState<SyncSource[]>([]);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Real-time data for charts
  const [syncMetrics, setSyncMetrics] = useState<any[]>([]);
  const [throughputData, setThroughputData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(updateRealTimeData, 3000);
    return () => clearInterval(interval);}, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [sourcesData, jobsData, integrationsData, statusData] = await Promise.all([
        invoke<{sync_sources: SyncSource[]}>('get_sync_sources'),
        invoke<{sync_jobs: SyncJob[]}>('get_sync_jobs'),
        invoke<{integrations: Integration[]}>('get_integrations'),
        invoke<SystemStatus>('get_system_status')
      ]);
      
      setSyncSources(sourcesData.sync_sources || []);
      setSyncJobs(jobsData.sync_jobs || []);
      setIntegrations(integrationsData.integrations || []);
      setSystemStatus(statusData);
      
      generateChartData();
    } catch (error) {console.error('Failed to load data:', error);
      loadMockData();} finally {setLoading(false);}
  };

  const loadMockData = () => {setSyncSources([
      {
        id: 'source-001',
        name: 'Property Database',
        type: 'postgresql',
        status: 'connected',
        last_sync: new Date(Date.now() - 30000).toISOString(),
        record_count: 15420,
        sync_frequency: 'Every 5 minutes',
        health_score: 98.5,
        bandwidth_usage: 2.4,
        error_rate: 0.1},
      {id: 'source-002',
        name: 'Market Data Feed',
        type: 'api',
        status: 'syncing',
        last_sync: new Date(Date.now() - 60000).toISOString(),
        record_count: 8950,
        sync_frequency: 'Real-time',
        health_score: 95.2,
        bandwidth_usage: 5.1,
        error_rate: 0.3},
      {id: 'source-003',
        name: 'GIS Systems',
        type: 'gis',
        status: 'connected',
        last_sync: new Date(Date.now() - 120000).toISOString(),
        record_count: 45200,
        sync_frequency: 'Hourly',
        health_score: 92.1,
        bandwidth_usage: 8.7,
        error_rate: 0.2}
    ]);

    setSyncJobs([
      {id: 'job-001',
        source_id: 'source-002',
        source_name: 'Market Data Feed',
        status: 'running',
        progress: 75,
        records_processed: 6712,
        records_total: 8950,
        started_at: new Date(Date.now() - 180000).toISOString(),
        sync_type: 'incremental'},
      {id: 'job-002',
        source_id: 'source-001',
        source_name: 'Property Database',
        status: 'completed',
        progress: 100,
        records_processed: 15420,
        records_total: 15420,
        started_at: new Date(Date.now() - 300000).toISOString(),
        sync_type: 'full'}
    ]);

    setIntegrations([
      {id: 'int-001',
        name: 'TerraInsight',
        type: 'internal',
        status: 'active',
        endpoint: 'http://localhost:\${{TF_DESKTOP_PORT:-3003}}/api',
        last_health_check: new Date().toISOString(),
        response_time: 85,
        success_rate: 99.2},
      {id: 'int-002',
        name: 'External MLS API',
        type: 'external',
        status: 'active',
        endpoint: 'https://api.mls-provider.com/v1',
        last_health_check: new Date().toISOString(),
        response_time: 245,
        success_rate: 97.8}
    ]);

    setSystemStatus({overall_health: 'healthy',
      active_syncs: 2,
      queued_jobs: 1,
      total_records_synced: 125840,
      data_throughput: 2.3,
      uptime: '15d 4h 32m',
      memory_usage: 68.4,
      cpu_usage: 23.1});

    generateChartData();
  };

  const updateRealTimeData = async () => {try {
      const metrics = await invoke<SystemStatus>('get_real_time_metrics');
      setSystemStatus(metrics);
      updateChartData();} catch (error) {// Mock real-time updates
      updateChartData();}
  };

  const generateChartData = () =>{// Generate last 24 hours of sync metrics
    const hours = Array.from({ length: 24}, (_, i) => {const hour = new Date();
      hour.setHours(hour.getHours() - (23 - i));
      return {
        time: hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}),
        records_synced: 1000 + Math.random() * 2000,
        throughput: 1.5 + Math.random() * 2,
        errors: Math.random() * 10,
        active_connections: 3 + Math.floor(Math.random() * 5)
      };
    });
    setSyncMetrics(hours);

    // Generate throughput data
    setThroughputData(hours.map(h => ({time: h.time,
      throughput: h.throughput,
      target: 2.0})));

    // Status distribution
    setStatusDistribution([
      {name: 'Connected', value: 65, color: '#10b981'},
      {name: 'Syncing', value: 25, color: '#f59e0b'},
      {name: 'Offline', value: 8, color: '#ef4444'},
      {name: 'Error', value: 2, color: '#8b5cf6'}
    ]);
  };

  const updateChartData = () => {// Add new data point and remove oldest
    setSyncMetrics(prev => {
      const newPoint = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}),
        records_synced: 1000 + Math.random() * 2000,
        throughput: 1.5 + Math.random() * 2,
        errors: Math.random() * 10,
        active_connections: 3 + Math.floor(Math.random() * 5)
      };
      return [...prev.slice(1), newPoint];
    });
  };

  const triggerSync = async (sourceId: string) => {try {
      setLoading(true);
      await invoke('trigger_sync', { sourceId});
      await loadInitialData();
    } catch (error) {console.error('Failed to trigger sync:', error);} finally {setLoading(false);}
  };

  const pauseSync = async (jobId: string) => {try {
      await invoke('pause_sync_job', { jobId});
      await loadInitialData();
    } catch (error) {console.error('Failed to pause sync:', error);}
  };

  const renderSyncTab = () => (<div className="space-y-6"><div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-lg"><><h2 className="text-2xl font-bold mb-2">Data Synchronization</h2><p
</>
className="opacity-90">Real-time data synchronization and orchestration hub</p></div>{/* System Status Overview */}
      {systemStatus && (<div className="grid grid-cols-1 lg:grid-cols-4 gap-4"><div className="bg-white rounded-lg shadow-lg p-4"><div className="flex items-center justify-between mb-2"><><span className="text-sm font-medium text-gray-600">Active Syncs</span><Activity
</>
className="h-4 w-4 text-blue-600" /></div><><div className="text-2xl font-bold text-blue-600">{systemStatus.active_syncs}</div><div
</>className="text-xs text-gray-500">
              {systemStatus.queued_jobs} queued</div></div><div className="bg-white rounded-lg shadow-lg p-4"><div className="flex items-center justify-between mb-2"><><span className="text-sm font-medium text-gray-600">Throughput</span><Zap
</>
className="h-4 w-4 text-green-600" /></div><><div className="text-2xl font-bold text-green-600">{systemStatus.data_throughput.toFixed(1)}</div><div
</>
className="text-xs text-gray-500">MB/s</div></div><div className="bg-white rounded-lg shadow-lg p-4"><div className="flex items-center justify-between mb-2"><><span className="text-sm font-medium text-gray-600">Records Synced</span><Database
</>
className="h-4 w-4 text-purple-600" /></div><><div className="text-2xl font-bold text-purple-600">{systemStatus.total_records_synced.toLocaleString()}</div><div
</>
className="text-xs text-gray-500">total</div></div><div className="bg-white rounded-lg shadow-lg p-4"><div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-600">System Health</span>{systemStatus.overall_health === 'healthy' ? (<CheckCircle className="h-4 w-4 text-green-600" />) : (<><AlertCircle className="h-4 w-4 text-red-600" />)}</div><div
</>className={`text-2xl font-bold capitalize ${
              systemStatus.overall_health === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
              {systemStatus.overall_health}</div><div className="text-xs text-gray-500">Uptime: {systemStatus.uptime}</div></div></div>)}

      {/* Sync Sources */}<div className="bg-white rounded-lg shadow-lg p-6"><div className="flex items-center justify-between mb-4"><h3 className="text-xl font-semibold flex items-center"><><Database className="h-5 w-5 mr-2 text-blue-600" />Sync Sources</h3><button
</>

            onClick={() => loadInitialData()}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          ><Refresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div><div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">{syncSources.map((source) => (<div key={source.id} className="border border-gray-200 rounded-lg p-4"><div className="flex items-center justify-between mb-3"><div className="flex items-center">{source.type === 'postgresql' &&<Server className="h-5 w-5 text-blue-600 mr-2" />}
                  {source.type === 'api' && <Cloud className="h-5 w-5 text-green-600 mr-2" />}
                  {source.type === 'gis' && <Globe className="h-5 w-5 text-purple-600 mr-2" />}
                  {source.type === 'mls' && <HardDrive className="h-5 w-5 text-orange-600 mr-2" />}
                  <div><><h4 className="font-semibold">{source.name}</h4><p
</>
className="text-sm text-gray-600 capitalize">{source.type}</p></div></div><div className={`connection-indicator ${source.status}`}>{source.status === 'connected' &&<Wifi className="h-4 w-4 text-green-600" />}
                  {source.status === 'disconnected' && <WifiOff className="h-4 w-4 text-red-600" />}
                  {source.status === 'syncing' && <Refresh className="h-4 w-4 text-blue-600 animate-spin" />}
                  {source.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                </div></div><div className="space-y-2 mb-4"><div className="flex justify-between text-sm"><><span>Records:</span><span
</>
className="font-semibold">{source.record_count.toLocaleString()}</span></div><div className="flex justify-between text-sm"><><span>Health Score:</span><span
</>
className="font-semibold text-green-600">{source.health_score}%</span></div><div className="flex justify-between text-sm"><><span>Bandwidth:</span><span
</>
className="font-semibold">{source.bandwidth_usage} MB/s</span></div><div className="flex justify-between text-sm"><><span>Error Rate:</span><span
</>
className="font-semibold text-red-600">{source.error_rate}%</span></div></div><div className="w-full bg-gray-200 rounded-full h-2 mb-3"><div 
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${source.health_score}%` }}
                ></div></div><div className="flex justify-between items-center"><><div className="text-xs text-gray-500">Last sync: {new Date(source.last_sync).toLocaleTimeString()}</div><button
</>onClick={() => triggerSync(source.id)}
                  disabled={source.status === 'syncing' || loading}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50 text-sm"
                >
                  Sync Now</button></div></div>))}</div></div>{/* Active Sync Jobs */}<div className="bg-white rounded-lg shadow-lg p-6"><h3 className="text-xl font-semibold mb-4 flex items-center"><><Clock className="h-5 w-5 mr-2 text-orange-600" />Active Sync Jobs</h3><div
</>className="space-y-4">
          {syncJobs.map((job) => (<div key={job.id} className="border border-gray-200 rounded-lg p-4"><div className="flex items-center justify-between mb-3"><div><><h4 className="font-semibold">{job.source_name}</h4><p
</>className="text-sm text-gray-600 capitalize">
                    {job.sync_type} sync • {job.status}</p></div><div className="text-right"><><div className="text-sm font-medium">{job.records_processed.toLocaleString()} / {job.records_total.toLocaleString()}</div><div
</>className="text-xs text-gray-500">
                    {job.progress}% complete</div></div></div>{job.status === 'running' && (<div className="mb-3"><div className="w-full bg-gray-200 rounded-full h-2"><div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500 data-flow"
                      style={{ width: `${job.progress}%` }}
                    ></div></div></div>)}<div className="flex justify-between items-center text-sm text-gray-600"><span>Started: {new Date(job.started_at).toLocaleTimeString()}</span>{job.status === 'running' && (<button
                    onClick={() =>pauseSync(job.id)}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    Pause</button>)}</div></div>))}</div></div></div>);

  const renderIntegrationsTab = () => (<div className="space-y-6"><div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg"><><h2 className="text-2xl font-bold mb-2">System Integrations</h2><p
</>
className="opacity-90">External and internal service connections</p></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{integrations.map((integration) => (<div key={integration.id} className="bg-white rounded-lg shadow-lg p-6"><div className="flex items-center justify-between mb-4"><div className="flex items-center"><Link className="h-6 w-6 text-blue-600 mr-3" /><div><><h3 className="font-semibold text-lg">{integration.name}</h3><p
</>
className="text-sm text-gray-600 capitalize">{integration.type}</p></div></div><div className={`px-3 py-1 rounded-full text-sm font-medium ${
                integration.status === 'active' ? 'bg-green-100 text-green-800' :
                integration.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'}`}>{integration.status}</div></div><div className="space-y-3 mb-4"><div className="text-sm"><><span className="text-gray-600">Endpoint:</span><div
</>className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                  {integration.endpoint}</div></div><div className="grid grid-cols-2 gap-4"><div className="text-center p-3 bg-gray-50 rounded"><><div className="text-lg font-bold text-blue-600">{integration.response_time}ms</div><div
</>
className="text-xs text-gray-600">Response Time</div></div><div className="text-center p-3 bg-gray-50 rounded"><><div className="text-lg font-bold text-green-600">{integration.success_rate}%</div><div
</>
className="text-xs text-gray-600">Success Rate</div></div></div></div><div className="text-xs text-gray-500">Last health check: {new Date(integration.last_health_check).toLocaleString()}</div></div>))}</div></div>);

  const renderMonitoringTab = () => (<div className="space-y-6"><div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-lg"><><h2 className="text-2xl font-bold mb-2">Real-time Monitoring</h2><p
</>
className="opacity-90">Live performance metrics and system analytics</p></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-white rounded-lg shadow-lg p-6"><h3 className="text-xl font-semibold mb-4 flex items-center"><><TrendingUp className="h-5 w-5 mr-2 text-blue-600" />Sync Performance</h3><div
</>
className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={syncMetrics}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis /><Tooltip /><Legend /><Line 
                  type="monotone" 
                  dataKey="records_synced" 
                  stroke="#8884d8" 
                  name="Records Synced" /><Line 
                  type="monotone" 
                  dataKey="active_connections" 
                  stroke="#82ca9d" 
                  name="Active Connections" /></LineChart></ResponsiveContainer></div></div><div className="bg-white rounded-lg shadow-lg p-6"><h3 className="text-xl font-semibold mb-4 flex items-center"><><BarChart3 className="h-5 w-5 mr-2 text-green-600" />Data Throughput</h3><div
</>
className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={throughputData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis /><Tooltip /><Legend /><Area 
                  type="monotone" 
                  dataKey="throughput" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                  name="Actual" /><Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#ff0000" 
                  strokeDasharray="5 5"
                  name="Target" /></AreaChart></ResponsiveContainer></div></div><div className="bg-white rounded-lg shadow-lg p-6"><h3 className="text-xl font-semibold mb-4 flex items-center"><><Monitor className="h-5 w-5 mr-2 text-purple-600" />Connection Status</h3><div
</>
className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent}) =>`${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry /* , index */) => (<><Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip
</>
/></PieChart></ResponsiveContainer></div></div><div className="bg-white rounded-lg shadow-lg p-6"><h3 className="text-xl font-semibold mb-4 flex items-center"><><Activity className="h-5 w-5 mr-2 text-orange-600" />System Metrics</h3><div
</>className="space-y-4">
            {systemStatus && (<div className="flex justify-between items-center p-3 bg-gray-50 rounded"><><span className="font-medium">CPU Usage</span><span
</>
className="text-lg font-bold text-blue-600">{systemStatus.cpu_usage}%</span></div><div className="flex justify-between items-center p-3 bg-gray-50 rounded"><><span className="font-medium">Memory Usage</span><span
</>
className="text-lg font-bold text-green-600">{systemStatus.memory_usage}%</span></div><div className="flex justify-between items-center p-3 bg-gray-50 rounded"><><span className="font-medium">Data Throughput</span><span
</>
className="text-lg font-bold text-purple-600">{systemStatus.data_throughput} MB/s</span></div><div className="flex justify-between items-center p-3 bg-gray-50 rounded"><><span className="font-medium">System Uptime</span><span
</>
className="text-lg font-bold text-orange-600">{systemStatus.uptime}</span></div>)}</div></div></div></div>);

  const renderSettingsTab = () => (<div className="space-y-6"><div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white p-6 rounded-lg"><><h2 className="text-2xl font-bold mb-2">Sync Configuration</h2><p
</>
className="opacity-90">System settings and synchronization preferences</p></div><div className="bg-white rounded-lg shadow-lg p-6"><h3 className="text-xl font-semibold mb-4 flex items-center"><><Settings className="h-5 w-5 mr-2 text-gray-600" />Global Settings</h3><div
</>className="text-center py-8 text-gray-500">
          Configuration panel coming soon...</div></div></div>);

  return (<div className="min-h-screen bg-gray-100">{/* Header */}<header className="bg-white shadow-sm border-b"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between items-center py-4"><div className="flex items-center"><Refresh className="h-8 w-8 text-blue-600 mr-3 sync-pulse" /><div><><h1 className="text-2xl font-bold text-gray-900">TerraFusionSync</h1><p
</>
className="text-sm text-gray-600">Real-time Data Synchronization</p></div></div><div className="flex items-center space-x-2"><><div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">v3.0.0</div><div
</>className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Championship Edition</div></div></div></div></header>{/* Navigation */}<nav className="bg-white shadow-sm"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex space-x-8">{[
              {id: 'sync', label: 'Synchronization', icon: Refresh},
              {id: 'integrations', label: 'Integrations', icon: Link},
              {id: 'monitoring', label: 'Monitoring', icon: Monitor},
              {id: 'settings', label: 'Settings', icon: Settings}
            ].map(({id, label, icon: Icon}) => (<button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              ><Icon className="h-4 w-4 mr-2" />{label}</button>))}</div></div></nav>{/* Main Content */}<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{activeTab === 'sync' && renderSyncTab()}
        {activeTab === 'integrations' && renderIntegrationsTab()}
        {activeTab === 'monitoring' && renderMonitoringTab()}
        {activeTab === 'settings' && renderSettingsTab()}</main></div>
  );
}

export default App;