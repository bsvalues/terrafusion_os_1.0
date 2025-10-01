import React, { useState, useEffect } from 'react';
import './SystemMonitoring.css';

interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: 'running' | 'sleeping' | 'stopped' | 'zombie';
  user: string;
}

interface NetworkConnection {
  protocol: string;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  state: string;
  process: string;
}

interface SystemEvent {
  id: string;
  timestamp: string;
  type: 'system' | 'security' | 'application' | 'network';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: string;
}

interface ResourceTrend {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

const SystemMonitoring: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [resourceTrends, setResourceTrends] = useState<ResourceTrend[]>([]);
  const [activeTab, setActiveTab] = useState('processes');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'cpu' | 'memory' | 'name'>('cpu');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      // Mock data for now - replace with actual API calls
      const mockProcesses: ProcessInfo[] = [
        {
          pid: 1234,
          name: 'terrafusion-api',
          cpu: 12.5,
          memory: 256.8,
          status: 'running',
          user: 'terrafusion'
        },
        {
          pid: 5678,
          name: 'rust-dev-engine',
          cpu: 8.3,
          memory: 128.4,
          status: 'running',
          user: 'terrafusion'
        },
        {
          pid: 9012,
          name: 'ai-swarm-commander',
          cpu: 24.7,
          memory: 512.6,
          status: 'running',
          user: 'ai-swarm'
        },
        {
          pid: 3456,
          name: 'operations-dashboard',
          cpu: 6.1,
          memory: 89.2,
          status: 'running',
          user: 'terrafusion'
        },
        {
          pid: 7890,
          name: 'database-engine',
          cpu: 15.8,
          memory: 1024.3,
          status: 'running',
          user: 'postgres'
        },
        {
          pid: 2468,
          name: 'cache-service',
          cpu: 2.4,
          memory: 64.7,
          status: 'sleeping',
          user: 'redis'
        }
      ];

      const mockConnections: NetworkConnection[] = [
        {
          protocol: 'TCP',
          localAddress: '0.0.0.0',
          localPort: 5000,
          remoteAddress: '*',
          remotePort: 0,
          state: 'LISTEN',
          process: 'terrafusion-api'
        },
        {
          protocol: 'TCP',
          localAddress: '0.0.0.0',
          localPort: 8080,
          remoteAddress: '*',
          remotePort: 0,
          state: 'LISTEN',
          process: 'rust-dev-engine'
        },
        {
          protocol: 'TCP',
          localAddress: '192.168.1.100',
          localPort: 5000,
          remoteAddress: '192.168.1.50',
          remotePort: 52847,
          state: 'ESTABLISHED',
          process: 'terrafusion-api'
        },
        {
          protocol: 'TCP',
          localAddress: '0.0.0.0',
          localPort: 3000,
          remoteAddress: '*',
          remotePort: 0,
          state: 'LISTEN',
          process: 'ai-swarm'
        },
        {
          protocol: 'TCP',
          localAddress: '127.0.0.1',
          localPort: 5432,
          remoteAddress: '*',
          remotePort: 0,
          state: 'LISTEN',
          process: 'postgres'
        }
      ];

      const mockEvents: SystemEvent[] = [
        {
          id: '1',
          timestamp: '2024-01-15 14:23:17',
          type: 'system',
          severity: 'info',
          message: 'TerraFusion API service started successfully',
          source: 'SystemManager'
        },
        {
          id: '2',
          timestamp: '2024-01-15 14:22:45',
          type: 'security',
          severity: 'warning',
          message: 'Failed login attempt from IP 192.168.1.75',
          source: 'AuthService'
        },
        {
          id: '3',
          timestamp: '2024-01-15 14:21:33',
          type: 'application',
          severity: 'error',
          message: 'AI Swarm communication timeout detected',
          source: 'AICoordinator'
        },
        {
          id: '4',
          timestamp: '2024-01-15 14:20:12',
          type: 'network',
          severity: 'info',
          message: 'New connection established to Rust Dev Engine',
          source: 'NetworkMonitor'
        },
        {
          id: '5',
          timestamp: '2024-01-15 14:19:55',
          type: 'system',
          severity: 'critical',
          message: 'Disk usage exceeded 85% on primary volume',
          source: 'StorageMonitor'
        }
      ];

      // Generate trend data
      const now = new Date();
      const trends: ResourceTrend[] = [];
      for (let i = 19; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60000).toLocaleTimeString();
        trends.push({
          timestamp,
          cpu: Math.random() * 80 + 10,
          memory: Math.random() * 60 + 30,
          disk: Math.random() * 20 + 40,
          network: Math.random() * 90 + 5
        });
      }

      setProcesses(mockProcesses);
      setConnections(mockConnections);
      setEvents(mockEvents);
      setResourceTrends(trends);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
      setIsLoading(false);
    }
  };

  const sortProcesses = (processes: ProcessInfo[]) => {
    return [...processes].sort((a, b) => {
      switch (sortBy) {
        case 'cpu':
          return b.cpu - a.cpu;
        case 'memory':
          return b.memory - a.memory;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  const filterEvents = (events: SystemEvent[]) => {
    if (filterType === 'all') return events;
    return events.filter(event => event.type === filterType);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return '#00ff88';
      case 'sleeping': return '#0099ff';
      case 'stopped': return '#ffaa00';
      case 'zombie': return '#ff3333';
      default: return '#888888';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ff3333';
      case 'error': return '#ff6666';
      case 'warning': return '#ffaa00';
      case 'info': return '#0099ff';
      default: return '#888888';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📋';
    }
  };

  const getConnectionStateColor = (state: string) => {
    switch (state) {
      case 'LISTEN': return '#0099ff';
      case 'ESTABLISHED': return '#00ff88';
      case 'TIME_WAIT': return '#ffaa00';
      case 'CLOSE_WAIT': return '#ff6666';
      default: return '#888888';
    }
  };

  if (isLoading) {
    return (
      <div className="monitoring-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Initializing surveillance...</div>
      </div>
    );
  }

  return (
    <div className="system-monitoring">
      
      <div className="monitoring-header">
        <h1>System Monitoring</h1>
        <p className="monitoring-subtitle">Real-time system intelligence and process oversight</p>
      </div>

      {/* Resource Trends Chart */}
      <div className="trends-panel">
        <div className="panel-header">
          <h3>Resource Utilization Trends</h3>
          <div className="trend-legends">
            <div className="legend-item">
              <div className="legend-color cpu"></div>
              <span>CPU</span>
            </div>
            <div className="legend-item">
              <div className="legend-color memory"></div>
              <span>Memory</span>
            </div>
            <div className="legend-item">
              <div className="legend-color disk"></div>
              <span>Disk I/O</span>
            </div>
            <div className="legend-item">
              <div className="legend-color network"></div>
              <span>Network</span>
            </div>
          </div>
        </div>
        <div className="trends-chart">
          {resourceTrends.map((trend, index) => (
            <div key={index} className="trend-bar">
              <div className="trend-values">
                <div 
                  className="trend-value cpu" 
                  style={{height: `${trend.cpu}%`}}
                  title={`CPU: ${trend.cpu.toFixed(1)}%`}
                ></div>
                <div 
                  className="trend-value memory" 
                  style={{height: `${trend.memory}%`}}
                  title={`Memory: ${trend.memory.toFixed(1)}%`}
                ></div>
                <div 
                  className="trend-value disk" 
                  style={{height: `${trend.disk}%`}}
                  title={`Disk: ${trend.disk.toFixed(1)}%`}
                ></div>
                <div 
                  className="trend-value network" 
                  style={{height: `${trend.network}%`}}
                  title={`Network: ${trend.network.toFixed(1)}%`}
                ></div>
              </div>
              <div className="trend-timestamp">{trend.timestamp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monitoring Tabs */}
      <div className="monitoring-tabs">
        <button 
          className={`tab-btn ${activeTab === 'processes' ? 'active' : ''}`}
          onClick={() => setActiveTab('processes')}
        >
          <span className="tab-icon">⚙️</span>
          <span>Processes</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          <span className="tab-icon">🌐</span>
          <span>Network</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          <span className="tab-icon">📋</span>
          <span>System Events</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        
        {/* Processes Tab */}
        {activeTab === 'processes' && (
          <div className="processes-panel">
            <div className="panel-controls">
              <div className="sort-controls">
                <label>Sort by:</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as 'cpu' | 'memory' | 'name')}
                >
                  <option value="cpu">CPU Usage</option>
                  <option value="memory">Memory Usage</option>
                  <option value="name">Process Name</option>
                </select>
              </div>
              <button className="refresh-btn" onClick={fetchMonitoringData}>
                🔄 Refresh
              </button>
            </div>
            
            <div className="processes-table">
              <div className="table-header">
                <div className="header-cell">PID</div>
                <div className="header-cell">Process Name</div>
                <div className="header-cell">CPU %</div>
                <div className="header-cell">Memory (MB)</div>
                <div className="header-cell">Status</div>
                <div className="header-cell">User</div>
                <div className="header-cell">Actions</div>
              </div>
              
              <div className="table-body">
                {sortProcesses(processes).map(process => (
                  <div key={process.pid} className="table-row">
                    <div className="table-cell pid">{process.pid}</div>
                    <div className="table-cell process-name">{process.name}</div>
                    <div className="table-cell cpu-usage">
                      <div className="usage-bar">
                        <div 
                          className="usage-fill"
                          style={{
                            width: `${Math.min(process.cpu, 100)}%`,
                            backgroundColor: process.cpu > 80 ? '#ff3333' : process.cpu > 50 ? '#ffaa00' : '#00ff88'
                          }}
                        ></div>
                        <span className="usage-text">{process.cpu.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="table-cell memory-usage">
                      <div className="usage-bar">
                        <div 
                          className="usage-fill"
                          style={{
                            width: `${Math.min((process.memory / 1024) * 100, 100)}%`,
                            backgroundColor: process.memory > 800 ? '#ff3333' : process.memory > 400 ? '#ffaa00' : '#00ff88'
                          }}
                        ></div>
                        <span className="usage-text">{process.memory.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="table-cell status">
                      <div className="status-indicator">
                        <div 
                          className="status-dot"
                          style={{backgroundColor: getStatusColor(process.status)}}
                        ></div>
                        <span>{process.status}</span>
                      </div>
                    </div>
                    <div className="table-cell user">{process.user}</div>
                    <div className="table-cell actions">
                      <button className="action-btn kill" title="Terminate Process">🛑</button>
                      <button className="action-btn details" title="Process Details">📊</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Network Tab */}
        {activeTab === 'network' && (
          <div className="network-panel">
            <div className="panel-controls">
              <button className="refresh-btn" onClick={fetchMonitoringData}>
                🔄 Refresh Connections
              </button>
            </div>
            
            <div className="connections-table">
              <div className="table-header">
                <div className="header-cell">Protocol</div>
                <div className="header-cell">Local Address</div>
                <div className="header-cell">Remote Address</div>
                <div className="header-cell">State</div>
                <div className="header-cell">Process</div>
              </div>
              
              <div className="table-body">
                {connections.map((conn, index) => (
                  <div key={index} className="table-row">
                    <div className="table-cell protocol">{conn.protocol}</div>
                    <div className="table-cell local-addr">
                      {conn.localAddress}:{conn.localPort}
                    </div>
                    <div className="table-cell remote-addr">
                      {conn.remoteAddress === '*' ? '*:*' : `${conn.remoteAddress}:${conn.remotePort}`}
                    </div>
                    <div className="table-cell state">
                      <div className="connection-state">
                        <div 
                          className="state-dot"
                          style={{backgroundColor: getConnectionStateColor(conn.state)}}
                        ></div>
                        <span>{conn.state}</span>
                      </div>
                    </div>
                    <div className="table-cell process">{conn.process}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="events-panel">
            <div className="panel-controls">
              <div className="filter-controls">
                <label>Filter by type:</label>
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">All Events</option>
                  <option value="system">System</option>
                  <option value="security">Security</option>
                  <option value="application">Application</option>
                  <option value="network">Network</option>
                </select>
              </div>
              <button className="refresh-btn" onClick={fetchMonitoringData}>
                🔄 Refresh Events
              </button>
            </div>
            
            <div className="events-list">
              {filterEvents(events).map(event => (
                <div key={event.id} className={`event-item ${event.severity}`}>
                  <div className="event-icon">{getSeverityIcon(event.severity)}</div>
                  <div className="event-content">
                    <div className="event-header">
                      <span className="event-type">[{event.type.toUpperCase()}]</span>
                      <span className="event-timestamp">{event.timestamp}</span>
                    </div>
                    <div className="event-message">{event.message}</div>
                    <div className="event-source">Source: {event.source}</div>
                  </div>
                  <div 
                    className="event-severity"
                    style={{color: getSeverityColor(event.severity)}}
                  >
                    {event.severity.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default SystemMonitoring;