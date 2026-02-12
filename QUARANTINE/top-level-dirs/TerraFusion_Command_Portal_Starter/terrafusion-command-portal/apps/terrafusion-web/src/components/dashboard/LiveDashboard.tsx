'use client';

import React, { useState, useEffect } from 'react';
import { 
  useHealthStatus, 
  usePerformanceMetrics, 
  useWorkspaceAnalytics,
  useSecurityEvents,
  useDeploymentStatus
} from '@/lib/api/hooks';
import { TerraSphereContainer } from '@/components/terra-sphere/TerraSphereContainer';
import { useWebSocket } from '@/lib/websocket/WebSocketProvider';

interface DashboardProps {
  className?: string;
}

export const LiveDashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'security' | 'deployments'>('overview');

  // THE TERRAFUSION WAY - WebSocket integration
  const { isConnected, connectionStatus, lastMessage } = useWebSocket();

  // Real-time API hooks
  const { data: health, isLoading: healthLoading } = useHealthStatus();
  const { data: performance, isLoading: perfLoading } = usePerformanceMetrics();
  const { data: analytics, isLoading: analyticsLoading } = useWorkspaceAnalytics('default', '24h');
  const { data: security, isLoading: securityLoading } = useSecurityEvents();
  const { data: deployments, isLoading: deploymentsLoading } = useDeploymentStatus();

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Status indicators
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return 'bg-green-900/30 border-green-400/50';
      case 'warning': return 'bg-yellow-900/30 border-yellow-400/50';
      case 'critical': return 'bg-red-900/30 border-red-400/50';
      default: return 'bg-gray-900/30 border-gray-400/50';
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white ${className}`}>
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">TF</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  TerraFusion Command Portal
                </h1>
                <p className="text-sm text-slate-400">
                  {currentTime.toLocaleString()} · Live Dashboard
                </p>
              </div>
            </div>
            
            {/* System Status */}
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full border text-sm ${getStatusBg(health?.status || 'unknown')}`}>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getStatusColor(health?.status || 'unknown')} bg-current`}></span>
                System {health?.status || 'Unknown'}
              </div>
              <div className="text-sm text-slate-400">
                {health?.workspaces_healthy || 0}/{health?.total || 0} Workspaces
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* THE TERRAFUSION WAY - Communication Layer Status */}
        <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6 mb-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-blue-300">🌍 THE TERRAFUSION WAY - Multi-Layer Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* XMTP Layer */}
            <div className="bg-slate-800/50 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-green-400">🔐 XMTP Layer</h3>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">SECURE</span>
              </div>
              <div className="text-sm text-slate-300 space-y-1">
                <div>• Key Escrow: Ready</div>
                <div>• Government Compliance: Active</div>
                <div>• Audit Trails: Enabled</div>
                <div>• AWS KMS: Dev Mode</div>
              </div>
            </div>

            {/* WebSocket Layer */}
            <div className="bg-slate-800/50 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-400">🔌 WebSocket Layer</h3>
                <span className={`text-xs px-2 py-1 rounded ${
                  isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {connectionStatus.toUpperCase()}
                </span>
              </div>
              <div className="text-sm text-slate-300 space-y-1">
                <div>• Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
                <div>• Last Message: {lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString() : 'None'}</div>
                <div>• Message Type: {lastMessage?.type || 'N/A'}</div>
                <div>• TerraSphere Sync: {isConnected ? 'Live' : 'Offline'}</div>
              </div>
            </div>

            {/* HTTP API Layer */}
            <div className="bg-slate-800/50 border border-purple-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-purple-400">📡 HTTP API Layer</h3>
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">CORE</span>
              </div>
              <div className="text-sm text-slate-300 space-y-1">
                <div>• Health Checks: Healthy</div>
                <div>• Workspace API: Ready</div>
                <div>• AI Integration: Active</div>
                <div>• CORS: Enabled</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* TerraSphere 3D Engine */}
          <div className="xl:col-span-1">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4 text-slate-200">🌍 TerraSphere Engine</h3>
              <div className="aspect-square">
                <TerraSphereContainer 
                  className="w-full h-full"
                  showHUD={true}
                  enableTelemetry={true}
                />
              </div>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-slate-800/30 p-1 rounded-lg border border-slate-700/50">
              {[
                { id: 'overview', label: 'System Overview', icon: '📊' },
                { id: 'analytics', label: 'Workspace Analytics', icon: '📈' },
                { id: 'security', label: 'Security Events', icon: '🔒' },
                { id: 'deployments', label: 'Deployments', icon: '🚀' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* System Health */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-200">System Health</h4>
                    <span className="text-2xl">❤️</span>
                  </div>
                  {healthLoading ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-700 rounded mb-2"></div>
                      <div className="h-4 bg-slate-700 rounded w-2/3"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status</span>
                        <span className={getStatusColor(health?.status || 'unknown')}>
                          {health?.status || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Healthy</span>
                        <span className="text-green-400">{health?.workspaces_healthy || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Warnings</span>
                        <span className="text-yellow-400">{health?.warnings || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Critical</span>
                        <span className="text-red-400">{health?.critical || 0}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Performance Metrics */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-200">Performance</h4>
                    <span className="text-2xl">⚡</span>
                  </div>
                  {perfLoading ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-700 rounded mb-2"></div>
                      <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">CPU Usage</span>
                        <span className="text-blue-400">{performance?.cpu_usage?.toFixed(1) || '0.0'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Memory</span>
                        <span className="text-purple-400">{performance?.memory_usage?.toFixed(1) || '0.0'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Response Time</span>
                        <span className="text-green-400">{performance?.response_time || '0'}ms</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Workspaces */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-200">Workspaces</h4>
                    <span className="text-2xl">🌍</span>
                  </div>
                  {analyticsLoading ? (
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-700 rounded mb-2"></div>
                      <div className="h-4 bg-slate-700 rounded w-1/2"></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Active</span>
                        <span className="text-green-400">{analytics?.active_workspaces || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total</span>
                        <span className="text-blue-400">{analytics?.total_workspaces || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Average Load</span>
                        <span className="text-purple-400">{analytics?.average_load?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-4 text-slate-200">📈 Workspace Analytics</h4>
                {analyticsLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-700 rounded"></div>
                    <div className="h-32 bg-slate-700 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{analytics?.active_workspaces || 0}</div>
                        <div className="text-sm text-slate-400">Active Workspaces</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{analytics?.successful_deployments || 0}</div>
                        <div className="text-sm text-slate-400">Successful Deploys</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{analytics?.average_load?.toFixed(2) || '0.00'}</div>
                        <div className="text-sm text-slate-400">Average Load</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{analytics?.total_requests || 0}</div>
                        <div className="text-sm text-slate-400">Total Requests</div>
                      </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div>
                      <h5 className="font-medium mb-3 text-slate-300">Recent Activity</h5>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {analytics?.recent_activities?.map((activity, index) => (
                          <div key={index} className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm">{activity.type === 'deployment' ? '🚀' : activity.type === 'workspace' ? '🌍' : '📊'}</span>
                              <span className="text-sm text-slate-300">{activity.message}</span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {new Date(activity.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        )) || (
                          <div className="text-center py-8 text-slate-500">No recent activities</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-4 text-slate-200">🔒 Security Events</h4>
                {securityLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-700 rounded"></div>
                    <div className="h-24 bg-slate-700 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{security?.blocked_attempts || 0}</div>
                        <div className="text-sm text-slate-400">Blocked Attempts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{security?.security_warnings || 0}</div>
                        <div className="text-sm text-slate-400">Warnings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{security?.critical_alerts || 0}</div>
                        <div className="text-sm text-slate-400">Critical Alerts</div>
                      </div>
                    </div>

                    {/* Recent Security Events */}
                    <div>
                      <h5 className="font-medium mb-3 text-slate-300">Recent Security Events</h5>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {security?.recent_events?.map((event, index) => (
                          <div key={index} className={`p-3 rounded border-l-4 ${
                            event.severity === 'critical' ? 'bg-red-900/20 border-red-400' :
                            event.severity === 'warning' ? 'bg-yellow-900/20 border-yellow-400' :
                            'bg-green-900/20 border-green-400'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">{event.event_type}</span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  event.severity === 'critical' ? 'bg-red-400/20 text-red-300' :
                                  event.severity === 'warning' ? 'bg-yellow-400/20 text-yellow-300' :
                                  'bg-green-400/20 text-green-300'
                                }`}>
                                  {event.severity}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">{event.description}</p>
                          </div>
                        )) || (
                          <div className="text-center py-8 text-slate-500">No recent security events</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deployments' && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h4 className="text-lg font-semibold mb-4 text-slate-200">🚀 Deployment Status</h4>
                {deploymentsLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-slate-700 rounded"></div>
                    <div className="h-32 bg-slate-700 rounded"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{deployments?.successful_deployments || 0}</div>
                        <div className="text-sm text-slate-400">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{deployments?.failed_deployments || 0}</div>
                        <div className="text-sm text-slate-400">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{deployments?.active_pipelines || 0}</div>
                        <div className="text-sm text-slate-400">Active Pipelines</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{deployments?.avg_deployment_time || '0'}m</div>
                        <div className="text-sm text-slate-400">Avg Time</div>
                      </div>
                    </div>

                    {/* Active Deployments */}
                    <div>
                      <h5 className="font-medium mb-3 text-slate-300">Active Deployments</h5>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {deployments?.active_deployments?.map((deployment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                deployment.status === 'success' ? 'bg-green-400' :
                                deployment.status === 'running' ? 'bg-blue-400 animate-pulse' :
                                deployment.status === 'failed' ? 'bg-red-400' :
                                'bg-yellow-400'
                              }`}></div>
                              <div>
                                <div className="font-medium text-slate-200">{deployment.pipeline_name}</div>
                                <div className="text-sm text-slate-400">{deployment.environment}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-medium ${
                                deployment.status === 'success' ? 'text-green-400' :
                                deployment.status === 'running' ? 'text-blue-400' :
                                deployment.status === 'failed' ? 'text-red-400' :
                                'text-yellow-400'
                              }`}>
                                {deployment.status}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(deployment.started_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-8 text-slate-500">No active deployments</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveDashboard;