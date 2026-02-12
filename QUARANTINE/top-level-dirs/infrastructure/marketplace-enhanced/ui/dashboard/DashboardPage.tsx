import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import './DashboardPage.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
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

interface DashboardData {
  plugins: EnrichedPlugin[];
  trends: Record<string, number>;
  errors: Record<string, string[]>;
  onboarding: Record<string, string[]>;
  uptime: Record<string, number>;
  errorTrends: Record<string, ErrorTrendPoint[]>;
}

type FilterType = 'all' | 'unhealthy' | 'launched';
type SortKey = 'name' | 'healthy' | 'launchCount' | 'version' | 'owner' | 'uptime';

interface WebSocketMessage {
  type: 'refresh' | 'plugin_update' | 'error';
  data?: any;
}

const WEBSOCKET_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000/ws/plugin-events';
const RECONNECT_INTERVAL = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    plugins: [],
    trends: {},
    errors: {},
    onboarding: {},
    uptime: {},
    errorTrends: {}
  });
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [modalPlugin, setModalPlugin] = useState<EnrichedPlugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(WEBSOCKET_URL);

      wsRef.current.onopen = () => {
        console.log('Dashboard WebSocket connected');
        setWsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (message.type === 'refresh' || message.type === 'plugin_update') {
            fetchDashboardData();
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };

      wsRef.current.onclose = () => {
        console.log('Dashboard WebSocket disconnected');
        setWsConnected(false);

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
      setWsConnected(false);
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

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;

    try {
      setError(null);

      // First, get plugin IDs
      const idsRes = await fetch('/marketplace/plugins/sidebar.json', { signal });
      if (!idsRes.ok) throw new Error('Failed to fetch plugin list');
      
      const plugins: Plugin[] = await idsRes.json();
      const ids = plugins.map(p => p.id);

      // Parallel fetch all data
      const [healthRes, usageRes, errorRes, onboardRes, uptimeRes, errorTrendsRes] = await Promise.all([
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
        })
      ]);

      // Parse responses with error handling
      const [health, usage, errors, onboarding, uptime, errorTrends] = await Promise.all([
        healthRes.ok ? healthRes.json() : {},
        usageRes.ok ? usageRes.json() : {},
        errorRes.ok ? errorRes.json() : {},
        onboardRes.ok ? onboardRes.json() : {},
        uptimeRes.ok ? uptimeRes.json() : {},
        errorTrendsRes.ok ? errorTrendsRes.json() : {}
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

      setData({ plugins: enriched, trends: usage, errors, onboarding, uptime, errorTrends });
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    }
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

  // Filtered and sorted plugins
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

  const sortedPlugins = useMemo(() => {
    return [...filteredPlugins].sort((a, b) => {
      let v1: any = a[sortKey];
      let v2: any = b[sortKey];

      // Handle null/undefined values
      if (v1 == null) v1 = '';
      if (v2 == null) v2 = '';

      // Compare values
      if (typeof v1 === 'string' && typeof v2 === 'string') {
        return v1.localeCompare(v2) * (sortAsc ? 1 : -1);
      }
      return (v1 < v2 ? -1 : 1) * (sortAsc ? 1 : -1);
    });
  }, [filteredPlugins, sortKey, sortAsc]);

  // Chart data
  const chartData = useMemo(() => {
    return data.plugins
      .filter(p => p.launchCount > 0)
      .map(p => ({ name: p.name, launches: p.launchCount }))
      .sort((a, b) => b.launches - a.launches)
      .slice(0, 10); // Top 10 plugins
  }, [data.plugins]);

  // Handle sort
  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }, [sortKey, sortAsc]);

  // Get status color for chart
  const getBarColor = (entry: any) => {
    const plugin = data.plugins.find(p => p.name === entry.name);
    return plugin?.healthy ? '#007acc' : '#ff4d4f';
  };

  // Keyboard navigation for table
  const handleKeyDown = useCallback((event: React.KeyboardEvent, plugin: EnrichedPlugin) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setModalPlugin(plugin);
    }
  }, []);

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
</>
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
</>
className="dashboard-meta"><>

          <span className="last-update">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <span
</>
className={`ws-status ${wsConnected ? 'connected' : 'disconnected'}`}>
            {wsConnected ? '🟢 Live' : '🔴 Offline'}
          </span>
        </div>
      </header>

      <div className="dashboard-controls">
        <div className="filter-group"><>

          <label htmlFor="filter-select">Filter:</label>
          <select
</>

            id="filter-select"
            value={filter} 
            onChange={(e) => setFilter(e.target.value as FilterType)}
            aria-label="Filter plugins"
          ><>

            <option value="all">All Plugins ({data.plugins.length})</option>
            <option
</>
value="unhealthy">Unhealthy ({data.plugins.filter(p => !p.healthy).length})</option>
            <option value="launched">Launched ({data.plugins.filter(p => p.launchCount > 0).length})</option>
          </select>
        </div>
        
        <div className="action-links"><>

          <Button variant="ghost" onClick={fetchDashboardData} aria-label="Refresh data">
            🔄 Refresh
          </Button>
          <a
</>
href="/admin" className="admin-link">
            ↪ Admin Shell
          </a>
        </div>
      </div>

      {chartData.length > 0 && (
        <section className="chart-section" aria-label="Plugin launch statistics"><>

          <h2>Top Plugins by Launch Count</h2>
          <ResponsiveContainer
</>
width="100%" height={300}>
            <BarChart data={chartData} layout="horizontal" margin={{ top: 20, right: 20, bottom: 20, left: 150 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={140} />
              <Tooltip 
                formatter={(value: number) => [`${value} launches`, 'Launches']}
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
              />
              <Bar dataKey="launches">
                {chartData.map((entry /* , index */) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}

      <section className="table-section" aria-label="Plugin details table">
        <table className="plugin-table" role="table">
          <thead>
            <tr role="row"><>

              <th role="columnheader" 
                  onClick={() => handleSort('name')} 
                  className="sortable"
                  aria-sort={sortKey === 'name' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('name')}>
                Plugin {sortKey === 'name' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
</>
role="columnheader"
                  onClick={() => handleSort('version')}
                  className="sortable"
                  aria-sort={sortKey === 'version' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('version')}>
                Version {sortKey === 'version' && (sortAsc ? '↑' : '↓')}
              </th><>

              <th role="columnheader"
                  onClick={() => handleSort('healthy')}
                  className="sortable"
                  aria-sort={sortKey === 'healthy' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('healthy')}>
                Status {sortKey === 'healthy' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
</>
role="columnheader"
                  onClick={() => handleSort('launchCount')}
                  className="sortable"
                  aria-sort={sortKey === 'launchCount' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('launchCount')}>
                Launches {sortKey === 'launchCount' && (sortAsc ? '↑' : '↓')}
              </th><>

              <th role="columnheader">Errors</th>
              <th
</>
role="columnheader">Onboarding</th><>

              <th role="columnheader">Tags</th>
              <th
</>
role="columnheader">Categories</th><>

              <th role="columnheader"
                  onClick={() => handleSort('owner')}
                  className="sortable"
                  aria-sort={sortKey === 'owner' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('owner')}>
                Owner {sortKey === 'owner' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
</>
role="columnheader"
                  onClick={() => handleSort('uptime')}
                  className="sortable"
                  aria-sort={sortKey === 'uptime' ? (sortAsc ? 'ascending' : 'descending') : 'none'}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSort('uptime')}>
                Uptime {sortKey === 'uptime' && (sortAsc ? '↑' : '↓')}
              </th>
              <th role="columnheader">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlugins.map(p => (
              <tr 
                key={p.id} 
                role="row"
                className={`plugin-row ${!p.healthy ? 'unhealthy' : ''}`}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, p)}
              ><>

                <td role="cell">{p.name}</td>
                <td
</>
role="cell">{p.version}</td>
                <td role="cell" aria-label={p.healthy ? 'Healthy' : 'Unhealthy'}>
                  <span className={`status-indicator ${p.healthy ? 'healthy' : 'unhealthy'}`}>
                    {p.healthy ? '🟢' : '🔴'}
                  </span>
                </td><>

                <td role="cell">{p.launchCount}</td>
                <td
</>
role="cell">
                  {p.errors.length > 0 ? (
                    <Button 
                      variant="link" 
                      onClick={() => setModalPlugin(p)}
                      aria-label={`View ${p.errors.length} errors for ${p.name}`}
                    >
                      {p.errors.length} error{p.errors.length > 1 ? 's' : ''}
                    </Button>
                  ) : (
                    <span className="no-errors">—</span>
                  )}
                </td>
                <td role="cell">
                  {p.onboarding.length > 0 ? (
                    <span className="onboarding-hints" title={p.onboarding.join(', ')}>
                      {p.onboarding.length} tip{p.onboarding.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="onboarding-complete">✅</span>
                  )}
                </td>
                <td role="cell">
                  <div className="tag-list">
                    {p.tags.map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                </td>
                <td role="cell">
                  <div className="category-list">
                    {p.categories.map((cat, i) => (
                      <span key={i} className="category">{cat}</span>
                    ))}
                  </div>
                </td><>

                <td role="cell">{p.owner}</td>
                <td
</>
role="cell" className={p.uptime && p.uptime < 0.95 ? 'low-uptime' : ''}>
                  {p.uptime !== null ? `${(p.uptime * 100).toFixed(1)}%` : '—'}
                </td>
                <td role="cell">
                  <a 
                    href={`/admin/plugin/${p.id}`} 
                    className="admin-link"
                    aria-label={`Admin panel for ${p.name}`}
                  >
                    Admin
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedPlugins.length === 0 && (
          <div className="empty-state">
            <p>No plugins match the current filter.</p>
          </div>
        )}
      </section>

      {modalPlugin && (
        <Dialog open onOpenChange={() => setModalPlugin(null)}>
          <div className="modal-content" role="dialog" aria-labelledby="modal-title"><>

            <h2 id="modal-title" className="modal-title">
              {modalPlugin.name} Details
            </h2>
            
            <div
</>
className="modal-section">
              <p className="plugin-version">
                <strong>Version:</strong> {modalPlugin.version}
              </p>
              
              {modalPlugin.description && (
                <p className="plugin-description">
                  <strong>Description:</strong> {modalPlugin.description}
                </p>
              )}
            </div>

            {modalPlugin.changelog.length > 0 && (
              <div className="modal-section"><>

                <h3>Changelog</h3>
                <ul
</>
className="changelog-list">
                  {modalPlugin.changelog.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {modalPlugin.errors.length > 0 && (
              <div className="modal-section error-section"><>

                <h3>Recent Errors</h3>
                <ul
</>
className="error-list">
                  {modalPlugin.errors.map((e, i) => (
                    <li key={i} className="error-item">{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {modalPlugin.errorTrend.length > 0 && (
              <div className="modal-section"><>

                <h3>Error Trend</h3>
                <ResponsiveContainer
</>
width="100%" height={200}>
                  <LineChart data={modalPlugin.errorTrend}>
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#ff4d4f" 
                      strokeWidth={2}
                      dot={{ fill: '#ff4d4f' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="modal-actions"><>

              <Button onClick={() => setModalPlugin(null)}>
                Close
              </Button>
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