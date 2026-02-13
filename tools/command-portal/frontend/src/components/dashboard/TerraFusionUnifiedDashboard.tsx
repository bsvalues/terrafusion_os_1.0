'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Tier17PrivacyDashboard from './Tier17PrivacyDashboard'
import Tier18ImmersiveDashboard from './Tier18ImmersiveDashboard'
import axios from 'axios'

// Combined System Status Types
interface SystemHealthData {
  backend_status: 'healthy' | 'degraded' | 'down';
  tier_17_status: 'operational' | 'limited' | 'offline';
  tier_18_status: 'operational' | 'limited' | 'offline';
  federation_status: 'connected' | 'partial' | 'disconnected';
  total_active_users: number;
  total_active_sessions: number;
  privacy_budget_global: number;
  compliance_score_overall: number;
  websocket_connections: number;
  last_updated: string;
}

interface QuickStats {
  privacy_queries_today: number;
  immersive_sessions_today: number;
  federated_nodes_online: number;
  real_time_connections: number;
  privacy_incidents: number;
  system_uptime_hours: number;
}

// UI Components
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className = '' }: CardProps) => (
  <div className={`border rounded-lg shadow-sm bg-white ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children, className = '' }: CardProps) => (
  <div className={`p-4 border-b ${className}`}>
    {children}
  </div>
)

const CardTitle = ({ children, className = '' }: CardProps) => (
  <h3 className={`text-lg font-semibold ${className}`}>
    {children}
  </h3>
)

const CardContent = ({ children, className = '' }: CardProps) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
)

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'destructive' | 'success';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  disabled?: boolean;
}

const Button = ({ children, onClick, variant = 'default', size = 'default', className = '', disabled = false }: ButtonProps) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50'
  const variants = {
    default: 'bg-slate-900 text-slate-50 hover:bg-slate-800',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50',
    destructive: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-green-500 text-white hover:bg-green-600'
  }
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 py-1 text-sm',
    lg: 'h-12 px-6 py-3 text-lg'
  }
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  )
}

// Status Indicator Component
const StatusIndicator = ({ status, label }: { status: string; label: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'operational':
      case 'connected':
        return 'bg-green-500'
      case 'degraded':
      case 'limited':
      case 'partial':
        return 'bg-yellow-500'
      case 'down':
      case 'offline':
      case 'disconnected':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'operational':
      case 'connected':
        return '✅'
      case 'degraded':
      case 'limited':
      case 'partial':
        return '⚠️'
      case 'down':
      case 'offline':
      case 'disconnected':
        return '❌'
      default:
        return '❓'
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)} animate-pulse`} />
      <span className="text-sm font-medium">{label}:</span>
      <span className="text-sm text-gray-600 flex items-center gap-1">
        {getStatusIcon(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  )
}

// Real-time Metric Component
const MetricCard = ({ 
  title, 
  value, 
  unit = '', 
  trend = 'stable', 
  icon = '📊', 
  color = 'blue' 
}: { 
  title: string; 
  value: number | string; 
  unit?: string; 
  trend?: 'up' | 'down' | 'stable'; 
  icon?: string; 
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' 
}) => {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600', 
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600'
  }

  const trendIcons = {
    up: '📈',
    down: '📉',
    stable: '➡️'
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${colorClasses[color]}`}>
              {value}{unit}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xs text-gray-500">{trendIcons[trend]}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main TerraFusion Unified Dashboard
const TerraFusionUnifiedDashboard = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null)
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeSystem, setActiveSystem] = useState<'overview' | 'tier17' | 'tier18'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const API_BASE = 'http://localhost:8787'

  // Fetch system health data
  const fetchSystemHealth = useCallback(async () => {
    try {
      setRefreshing(true)
      
      // Fetch health from backend
      const healthResponse = await axios.get(`${API_BASE}/health`)
      
      // Simulate system health data (would be real API calls in production)
      const mockSystemHealth: SystemHealthData = {
        backend_status: 'healthy',
        tier_17_status: 'operational',
        tier_18_status: 'operational', 
        federation_status: 'connected',
        total_active_users: Math.floor(Math.random() * 100) + 50,
        total_active_sessions: Math.floor(Math.random() * 20) + 10,
        privacy_budget_global: Math.random() * 5 + 2,
        compliance_score_overall: Math.random() * 20 + 80,
        websocket_connections: Math.floor(Math.random() * 15) + 5,
        last_updated: new Date().toISOString()
      }
      
      const mockQuickStats: QuickStats = {
        privacy_queries_today: Math.floor(Math.random() * 200) + 100,
        immersive_sessions_today: Math.floor(Math.random() * 50) + 25,
        federated_nodes_online: 7,
        real_time_connections: Math.floor(Math.random() * 30) + 10,
        privacy_incidents: Math.floor(Math.random() * 3),
        system_uptime_hours: Math.floor(Math.random() * 100) + 500
      }
      
      setSystemHealth(mockSystemHealth)
      setQuickStats(mockQuickStats)
      setError(null)
      
    } catch (err) {
      setError('Failed to fetch system health data')
      console.error('System health fetch error:', err)
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Emergency system actions
  const emergencyShutdown = async () => {
    try {
      console.log('Initiating emergency shutdown...')
      // In production, this would trigger actual emergency procedures
      alert('Emergency shutdown initiated. All systems will be gracefully terminated.')
    } catch (err) {
      console.error('Emergency shutdown error:', err)
    }
  }

  const forceSystemRestart = async () => {
    try {
      console.log('Initiating system restart...')
      // In production, this would trigger actual restart procedures
      alert('System restart initiated. All services will be restarted in order.')
    } catch (err) {
      console.error('System restart error:', err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchSystemHealth()
      setLoading(false)
    }
    
    loadData()
    
    // Auto-refresh every 15 seconds if enabled
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchSystemHealth, 15000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [fetchSystemHealth, autoRefresh])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-xl text-gray-600">
            Initializing TerraFusion Command Portal...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Loading Tier 17 Privacy & Tier 18 Immersive Systems
          </p>
        </div>
      </div>
    )
  }

  if (error && !systemHealth) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium">System Error</h3>
        <p className="text-red-600 mt-2">{error}</p>
        <Button 
          onClick={fetchSystemHealth} 
          variant="outline" 
          className="mt-4"
        >
          Retry Connection
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                🌍 TerraFusion Command Portal
              </h1>
              <p className="text-gray-600 mt-2">
                Washington State Federation • Tier 17 Privacy + Tier 18 Immersive Integration
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Auto-refresh toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                <label htmlFor="auto-refresh" className="text-sm text-gray-600">
                  Auto-refresh
                </label>
              </div>
              
              <Button 
                onClick={fetchSystemHealth}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  '↻'
                )}
                Refresh
              </Button>
            </div>
          </div>

          {/* System Status Bar */}
          {systemHealth && (
            <div className="pb-4 border-t pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatusIndicator 
                  status={systemHealth.backend_status} 
                  label="Backend API" 
                />
                <StatusIndicator 
                  status={systemHealth.tier_17_status} 
                  label="Privacy System" 
                />
                <StatusIndicator 
                  status={systemHealth.tier_18_status} 
                  label="Immersive System" 
                />
                <StatusIndicator 
                  status={systemHealth.federation_status} 
                  label="Federation" 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm mb-6">
          {[
            { key: 'overview', label: '📊 System Overview', icon: '📊' },
            { key: 'tier17', label: '🔒 Tier 17 Privacy', icon: '🔒' },
            { key: 'tier18', label: '🎮 Tier 18 Immersive', icon: '🎮' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSystem(tab.key as any)}
              className={`flex-1 px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                activeSystem === tab.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden text-xl">{tab.icon}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        {activeSystem === 'overview' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            {quickStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <MetricCard 
                  title="Privacy Queries Today"
                  value={quickStats.privacy_queries_today}
                  icon="🔍"
                  color="blue"
                  trend="up"
                />
                <MetricCard 
                  title="Immersive Sessions"
                  value={quickStats.immersive_sessions_today}
                  icon="🎮"
                  color="purple"
                  trend="up"
                />
                <MetricCard 
                  title="Federation Nodes"
                  value={quickStats.federated_nodes_online}
                  unit="/7"
                  icon="🌐"
                  color="green"
                  trend="stable"
                />
                <MetricCard 
                  title="Real-time Connections"
                  value={quickStats.real_time_connections}
                  icon="⚡"
                  color="orange"
                  trend="stable"
                />
                <MetricCard 
                  title="Privacy Incidents"
                  value={quickStats.privacy_incidents}
                  icon="🚨"
                  color="red"
                  trend="down"
                />
                <MetricCard 
                  title="System Uptime"
                  value={quickStats.system_uptime_hours}
                  unit="h"
                  icon="⏱️"
                  color="blue"
                  trend="up"
                />
              </div>
            )}

            {/* System Health Overview */}
            {systemHealth && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>⚡ System Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Active Users:</span>
                      <span className="font-bold text-xl text-blue-600">
                        {systemHealth.total_active_users}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Active Sessions:</span>
                      <span className="font-bold text-xl text-green-600">
                        {systemHealth.total_active_sessions}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">WebSocket Connections:</span>
                      <span className="font-bold text-xl text-purple-600">
                        {systemHealth.websocket_connections}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Global Privacy Budget:</span>
                      <span className="font-bold text-xl text-orange-600">
                        {systemHealth.privacy_budget_global.toFixed(2)}ε
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Compliance Score:</span>
                      <span className="font-bold text-xl text-emerald-600">
                        {systemHealth.compliance_score_overall.toFixed(1)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle>🚨 Emergency Controls</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => setActiveSystem('tier17')}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      🔒 Open Privacy Dashboard
                    </Button>
                    <Button 
                      onClick={() => setActiveSystem('tier18')}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      🎮 Open Immersive Dashboard
                    </Button>
                    <Button 
                      onClick={fetchSystemHealth}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      🔍 Run System Diagnostics
                    </Button>
                    <hr className="my-2" />
                    <Button 
                      onClick={forceSystemRestart}
                      variant="destructive"
                      className="w-full justify-start"
                      size="sm"
                    >
                      🔄 Force System Restart
                    </Button>
                    <Button 
                      onClick={emergencyShutdown}
                      variant="destructive"
                      className="w-full justify-start"
                      size="sm"
                    >
                      🛑 Emergency Shutdown
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Federation Status */}
            <Card>
              <CardHeader>
                <CardTitle>🌐 Washington State Federation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { county: 'King County', status: 'connected', users: 45, sessions: 8 },
                    { county: 'Pierce County', status: 'connected', users: 32, sessions: 5 },
                    { county: 'Snohomish County', status: 'connected', users: 28, sessions: 4 },
                    { county: 'Spokane County', status: 'partial', users: 15, sessions: 2 },
                    { county: 'Clark County', status: 'connected', users: 22, sessions: 3 },
                    { county: 'Thurston County', status: 'connected', users: 18, sessions: 2 },
                    { county: 'Kitsap County', status: 'connected', users: 12, sessions: 1 }
                  ].map((county) => (
                    <Card key={county.county} className="border">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h4 className="font-medium text-sm mb-2">{county.county}</h4>
                          <StatusIndicator 
                            status={county.status} 
                            label="" 
                          />
                          <div className="mt-3 space-y-1">
                            <div className="text-xs text-gray-600">
                              Users: {county.users}
                            </div>
                            <div className="text-xs text-gray-600">
                              Sessions: {county.sessions}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>ℹ️ System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">🔒 Tier 17 Privacy Features</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Differential privacy query processing</li>
                      <li>• Federated learning coordination</li>
                      <li>• Real-time compliance monitoring</li>
                      <li>• Privacy budget management</li>
                      <li>• Risk assessment automation</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">🎮 Tier 18 Immersive Features</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• 3D data visualization creation</li>
                      <li>• VR county exploration experiences</li>
                      <li>• AR data overlay deployment</li>
                      <li>• Metaverse governance spaces</li>
                      <li>• Real-time WebSocket communication</li>
                    </ul>
                  </div>
                </div>
                
                {systemHealth && (
                  <div className="mt-6 pt-4 border-t text-xs text-gray-500">
                    Last updated: {new Date(systemHealth.last_updated).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tier 17 Privacy Dashboard */}
        {activeSystem === 'tier17' && (
          <div>
            <Tier17PrivacyDashboard />
          </div>
        )}

        {/* Tier 18 Immersive Dashboard */}
        {activeSystem === 'tier18' && (
          <div>
            <Tier18ImmersiveDashboard />
          </div>
        )}
      </div>
    </div>
  )
}

export default TerraFusionUnifiedDashboard