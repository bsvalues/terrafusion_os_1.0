import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import './DashboardPage.css';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell, CartesianGrid, Legend, Area, AreaChart 
} from 'recharts';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Type definitions
interface Plugin {
  id: string;
  name: string;
  version?: string;
  tags?: string[];
  categories?: string[];
  owner?: string;
  changelog?: string[];
  description?: string;
  api?: string;
  k8s?: string;
}

interface EnrichedPlugin extends Plugin {
  healthy: boolean;
  launchCount: number;
  errors: string[];
  onboarding: string[];
  uptime: number | null;
  errorTrend: ErrorTrendPoint[];
}

interface ErrorTrendPoint {
  timestamp: string;
  count: number;
}

interface UptimeHistoryPoint {
  timestamp: string;
  uptime: number;
}

interface DashboardData {
  plugins: EnrichedPlugin[];
  trends: Record<string, number>;
  errors: Record<string, string[]>;
  onboarding: Record<string, string[]>;
  uptime: Record<string, number>;
  errorTrends: Record<string, ErrorTrendPoint[]>;
  uptimeHistory: Record<string, UptimeHistoryPoint[]>;
}

interface LogEntry {
  timestamp: string;
  message: string;
  level?: 'info' | 'warning' | 'error';
  pluginId?: string;
}

interface WebSocketMessage {
  type: 'refresh' | 'plugin_update' | 'error' | 'log';
  payload?: any;
}

type FilterType = 'all' | 'unhealthy' | 'launched';
type SortKey = 'name' | 'healthy' | 'launchCount' | 'version' | 'owner' | 'uptime';
type AdminAction = 'restart' | 'scale' | 'pause' | 'resume' | 'update';

const WEBSOCKET_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000/ws/plugin-events';
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_LOG_ENTRIES = 50;

export function DashboardPage() {
  // State management
  const [data, setData] = useState<DashboardData>({
    plugins: [],
    trends: {},
    errors: {},
    onboarding: {},
    uptime: {},
    errorTrends: {},
    uptimeHistory: {}
  });
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [modalPlugin, setModalPlugin] = useState<EnrichedPlugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [adminLoading, setAdminLoading] = useState<string | null>(null);
  const [expandedPlugins, setExpandedPlugins] = useState<Set<string>>(new Set());

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (showLogs && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      setWsStatus('connecting');
      wsRef.current = new WebSocket(WEBSOCKET_URL);

      wsRef.current.onopen = () => {
        console.log('Dashboard WebSocket connected');
        setWsStatus('connected');
        reconnectAttemptsRef.current = 0;
        addLog('WebSocket connected', 'info');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'refresh':
            case 'plugin_update':
              fetchDashboardData();
              break;
            case 'log':
              if (message.payload) {
                addLog(message.payload.message || message.payload, 
                      message.payload.level || 'info',
                      message.payload.pluginId);
              }
              break;
            case 'error':
              addLog(`WebSocket error: ${message.payload}`, 'error');
              break;
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsStatus('disconnected');
        addLog('WebSocket error', 'error');
      };

      wsRef.current.onclose = () => {
        console.log('Dashboard WebSocket disconnected');
        setWsStatus('disconnected');
        addLog('WebSocket disconnected', 'warning');

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          const delay = RECONNECT_INTERVAL * Math.min(reconnectAttemptsRef.current, 3);
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setWsStatus('disconnected');
    }
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Add log entry
  const addLog = useCallback((message: string, level: LogEntry['level'] = 'info', pluginId?: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      message,
      level,
      pluginId
    };

    setLogs(prev => {
      const newLogs = [...prev, entry];
      // Keep only the last MAX_LOG_ENTRIES
      return newLogs.slice(-MAX_LOG_ENTRIES);
    });
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;

    try {
      setError(null);
      
      // Get plugin list
      const idsRes = await fetch('/marketplace/plugins/sidebar.json', { signal });
      if (!idsRes.ok) throw new Error('Failed to fetch plugin list');
      
      const plugins: Plugin[] = await idsRes.json();
      const ids = plugins.map(p => p.id);

      // Parallel fetch all data
      const [
        healthRes, usageRes, errorRes, onboardRes, 
        uptimeRes, errorTrendsRes, uptimeHistoryRes
      ] = await Promise.all([
        fetch('/api/plugin-health', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/launch-trends', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/plugin-errors', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/plugin-onboarding', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/plugin-uptime', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/plugin-error-trends', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        }),
        fetch('/api/plugin-uptime-history', {
          method: 'POST',
          body: JSON.stringify(ids),
          headers: { 'Content-Type': 'application/json' },
          signal
        })
      ]);

      // Parse responses with error handling
      const [
        health, usage, errors, onboarding, 
        uptime, errorTrends, uptimeHistory
      ] = await Promise.all([
        healthRes.ok ? healthRes.json() : {},
        usageRes.ok ? usageRes.json() : {},
        errorRes.ok ? errorRes.json() : {},
        onboardRes.ok ? onboardRes.json() : {},
        uptimeRes.ok ? uptimeRes.json() : {},
        errorTrendsRes.ok ? errorTrendsRes.json() : {},
        uptimeHistoryRes.ok ? uptimeHistoryRes.json() : {}
      ]);

      // Enrich plugin data
      const enriched: EnrichedPlugin[] = plugins.map(p => ({
        ...p,
        healthy: health[p.id] ?? true,
        launchCount: usage[p.id] ?? 0,
        errors: errors[p.id] ?? [],
        onboarding: onboarding[p.id] ?? [],
        tags: p.tags ?? [],
        categories: p.categories ?? [],
        owner: p.owner ?? '—',
        version: p.version ?? '—',
        changelog: p.changelog ?? [],
        uptime: uptime[p.id] ?? null,
        errorTrend: errorTrends[p.id] ?? []
      }));

      setData({ 
        plugins: enriched, 
        trends: usage, 
        errors, 
        onboarding, 
        uptime, 
        errorTrends,
        uptimeHistory: uptimeHistory || {}
      });
      setLastRefresh(new Date());
      setLoading(false);
      addLog('Dashboard data refreshed', 'info');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
        addLog(`Failed to fetch data: ${err.message}`, 'error');
      }
    }
  }, [addLog]);

  // Handle admin actions
  const handleAdminAction = useCallback(async (pluginId: string, action: AdminAction) => {
    setAdminLoading(`${pluginId}-${action}`);
    
    try {
      // Execute admin action
      const actionRes = await fetch(`/api/admin/${action}`, {
        method: 'POST',
        body: JSON.stringify({ pluginId }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!actionRes.ok) {
        throw new Error(`Admin action failed: ${actionRes.statusText}`);
      }

      // Log telemetry
      await fetch('/api/telemetry/admin-action', {
        method: 'POST',
        body: JSON.stringify({ 
          pluginId, 
          action, 
          timestamp: Date.now(),
          user: 'dashboard-admin'
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      addLog(`Admin action '${action}' executed for ${pluginId}`, 'info', pluginId);
      
      // Refresh data after action
      setTimeout(fetchDashboardData, 1000);
    } catch (err: any) {
      console.error('Admin action failed:', err);
      addLog(`Admin action '${action}' failed for ${pluginId}: ${err.message}`, 'error', pluginId);
    } finally {
      setAdminLoading(null);
    }
  }, [addLog, fetchDashboardData]);

  // Toggle plugin expansion
  const togglePluginExpansion = useCallback((pluginId: string) => {
    setExpandedPlugins(prev => {
      const next = new Set(prev);
      if (next.has(pluginId)) {
        next.delete(pluginId);
      } else {
        next.add(pluginId);
      }
      return next;
    });
  }, []);

  // Initialize WebSocket and data
  useEffect(() => {
    connectWebSocket();
    fetchDashboardData();

    return () => {
      disconnectWebSocket();
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [connectWebSocket, disconnectWebSocket, fetchDashboardData]);

  // Filtered plugins
  const filteredPlugins = useMemo(() => {
    switch (filter) {
      case 'unhealthy':
        return data.plugins.filter(p => !p.healthy);
      case 'launched':
        return data.plugins.filter(p => p.launchCount > 0);
      default:
        return data.plugins;
    }
  }, [data.plugins, filter]);

  // Get WebSocket status icon
  const getWsStatusIcon = () => {
    switch (wsStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'disconnected': return '🔴';
    }
  };

  // Get log level color
  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '#ff4d4f';
      case 'warning': return '#faad14';
      default: return '#52c41a';
    }
  };

  // Format uptime percentage
  const formatUptime = (uptime: number | null) => {
    if (uptime === null) return '—';
    const percentage = uptime * 100;
    return `${percentage.toFixed(1)}%`;
  };

  // Get uptime color
  const getUptimeColor = (uptime: number | null) => {
    if (uptime === null) return '#8884d8';
    if (uptime >= 0.99) return '#52c41a';
    if (uptime >= 0.95) return '#faad14';
    return '#ff4d4f';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error" role="alert"><>

        <h2>Error Loading Dashboard</h2>
        <p
</>>{error}</p>
        <Button onClick={fetchDashboardData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="dashboard" role="main">
      <header className="dashboard-header"><>

        <h1>🧠 Terrafusion Plugin Dashboard</h1>
        <div
</> className="header-status">
          <span className="ws-indicator" title={`WebSocket: ${wsStatus}`}>
            {getWsStatusIcon()}
          </span>
        </div>
      </header>

      <div className="dashboard-controls">
        <div className="control-group"><>

          <label htmlFor="filter">Filter:</label>
          <select
</> 
            id="filter"
            value={filter} 
            onChange={(e) => setFilter(e.target.value as FilterType)}
          ><>

            <option value="all">All ({data.plugins.length})</option>
            <option
</> value="unhealthy">
              Unhealthy ({data.plugins.filter(p => !p.healthy).length})
            </option>
            <option value="launched">
              Launched ({data.plugins.filter(p => p.launchCount > 0).length})
            </option>
          </select>
        </div>

        <div className="control-actions"><>

          <Button 
            size="sm" 
            variant="outline"
            onClick={fetchDashboardData}
          >
            🔄 Refresh
          </Button>
          
          <Button
</>
            size="sm"
            variant="outline"
            onClick={() => setShowLogs(!showLogs)}
          >
            📋 {showLogs ? 'Hide' : 'Show'} Logs ({logs.length})
          </Button>

          {lastRefresh && (
            <span className="last-update">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}

          <a href="/admin" className="admin-shell-link">
            ↪ Admin Shell
          </a>
        </div>
      </div>

      {/* Log Panel */}
      {showLogs && (
        <div className="log-panel" role="log"><>

          <h3>System Logs</h3>
          <div
</> className="log-entries">
            {logs.length === 0 ? (
              <div className="log-empty">No logs yet...</div>
            ) : (
              logs.map((log, i) => (
                <div 
                  key={i} 
                  className="log-entry"
                  style={{ color: getLogLevelColor(log.level) }}
                >
                  <span className="log-time">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {log.pluginId && (
                    <span className="log-plugin">[{log.pluginId}]</span>
                  )}
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* Plugin Cards */}
      <div className="plugin-grid">
        {filteredPlugins.map((plugin) => {
          const isExpanded = expandedPlugins.has(plugin.id);
          const uptimeData = data.uptimeHistory[plugin.id] || [];
          
          return (
            <div 
              key={plugin.id} 
              className={`plugin-card ${!plugin.healthy ? 'unhealthy' : ''}`}
            >
              <div className="plugin-header">
                <div className="plugin-title"><>

                  <h2>{plugin.name}</h2>
                  <span
</> className="plugin-version">v{plugin.version}</span>
                  <span 
                    className={`health-badge ${plugin.healthy ? 'healthy' : 'unhealthy'}`}
                    title={plugin.healthy ? 'Healthy' : 'Unhealthy'}
                  >
                    {plugin.healthy ? '🟢' : '🔴'}
                  </span>
                </div>

                <div className="plugin-actions"><>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => togglePluginExpansion(plugin.id)}
                  >
                    {isExpanded ? '▼' : '▶'} Details
                  </Button>
                  
                  <Button
</>
                    size="sm"
                    disabled={adminLoading === `${plugin.id}-restart`}
                    onClick={() => handleAdminAction(plugin.id, 'restart')}
                  >
                    {adminLoading === `${plugin.id}-restart` ? '...' : '🔄'}
                  </Button>
                  
                  <Button
                    size="sm"
                    disabled={adminLoading === `${plugin.id}-scale`}
                    onClick={() => handleAdminAction(plugin.id, 'scale')}
                  >
                    {adminLoading === `${plugin.id}-scale` ? '...' : '📊'}
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="plugin-stats">
                <div className="stat"><>

                  <span className="stat-label">Launches</span>
                  <span
</> className="stat-value">{plugin.launchCount}</span>
                </div>
                <div className="stat"><>

                  <span className="stat-label">Uptime</span>
                  <span
</> 
                    className="stat-value"
                    style={{ color: getUptimeColor(plugin.uptime) }}
                  >
                    {formatUptime(plugin.uptime)}
                  </span>
                </div>
                <div className="stat"><>

                  <span className="stat-label">Errors</span>
                  <span
</> className="stat-value error-count">
                    {plugin.errors.length}
                  </span>
                </div>
              </div>

              {/* Uptime Chart */}
              {uptimeData.length > 0 && (
                <div className="uptime-chart">
                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={uptimeData}>
                      <defs>
                        <linearGradient id={`colorUptime-${plugin.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#52c41a" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(value) => new Date(value).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                        hide
                      />
                      <YAxis 
                        domain={[0, 1]} 
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                        width={45}
                      />
                      <Tooltip 
                        formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                        labelFormatter={(label) => new Date(label).toLocaleString()}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #ddd' 
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="uptime"
                        stroke="#52c41a"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#colorUptime-${plugin.id})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Expanded Details */}
              {isExpanded && (
                <div className="plugin-details">
                  {plugin.tags.length > 0 && (
                    <div className="detail-row"><>

                      <strong>Tags:</strong>
                      <div
</> className="tag-list">
                        {plugin.tags.map((tag, i) => (
                          <span key={i} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {plugin.errors.length > 0 && (
                    <div className="detail-row"><>

                      <strong>Recent Errors:</strong>
                      <ul
</> className="error-list">
                        {plugin.errors.slice(0, 3).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                      {plugin.errors.length > 3 && (
                        <Button
                          size="sm"
                          variant="link"
                          onClick={() => setModalPlugin(plugin)}
                        >
                          View all {plugin.errors.length} errors
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="detail-actions"><>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setModalPlugin(plugin)}
                    >
                      View Full Details
                    </Button>
                    <a
</> 
                      href={`/admin/plugin/${plugin.id}`}
                      className="admin-link"
                    >
                      Admin Panel →
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Plugin Detail Modal */}
      {modalPlugin && (
        <Dialog open onOpenChange={() => setModalPlugin(null)}>
          <div className="modal-content"><>

            <h2>{modalPlugin.name} - Full Details</h2>
            
            <div
</> className="modal-section">
              <p><strong>Version:</strong> {modalPlugin.version}</p>
              <p><strong>Owner:</strong> {modalPlugin.owner}</p>
              <p><strong>Current Uptime:</strong> {formatUptime(modalPlugin.uptime)}</p>
              <p><strong>Total Launches:</strong> {modalPlugin.launchCount}</p>
            </div>

            {modalPlugin.errors.length > 0 && (
              <div className="modal-section"><>

                <h3>All Errors ({modalPlugin.errors.length})</h3>
                <ul
</> className="error-list-full">
                  {modalPlugin.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {modalPlugin.errorTrend.length > 0 && (
              <div className="modal-section"><>

                <h3>Error Trend</h3>
                <ResponsiveContainer
</> width="100%" height={200}>
                  <LineChart data={modalPlugin.errorTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#ff4d4f" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="modal-actions"><>

              <Button onClick={() => setModalPlugin(null)}>Close</Button>
              <Button
</>
                variant="outline"
                onClick={() => window.open(`/admin/plugin/${modalPlugin.id}`, '_blank')}
              >
                Open Admin Panel
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}