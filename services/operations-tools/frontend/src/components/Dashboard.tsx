import React, { useState, useEffect } from 'react';
import './Dashboard.css';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: string;
  temperature: number;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  responseTime: number;
  lastCheck: string;
  port: number;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  source: string;
}

const Dashboard: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    uptime: '0 days',
    temperature: 0
  });

  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Mock data for now - replace with actual API calls
      setSystemMetrics({
        cpu: Math.random() * 100,
        memory: 67.3,
        disk: 45.8,
        network: Math.random() * 100,
        uptime: '15 days, 6 hours',
        temperature: 42 + Math.random() * 10
      });

      setServices([
        {
          name: 'TerraFusion API',
          status: 'online',
          responseTime: 6.7,
          lastCheck: '30 seconds ago',
          port: 5000
        },
        {
          name: 'Rust Dev Engine',
          status: 'online',
          responseTime: 12.3,
          lastCheck: '45 seconds ago',
          port: 8080
        },
        {
          name: 'Operations Dashboard',
          status: 'online',
          responseTime: 8.9,
          lastCheck: '15 seconds ago',
          port: 9999
        },
        {
          name: 'AI Swarm',
          status: 'degraded',
          responseTime: 156.7,
          lastCheck: '1 minute ago',
          port: 3000
        },
        {
          name: 'Database Service',
          status: 'online',
          responseTime: 4.2,
          lastCheck: '20 seconds ago',
          port: 5432
        },
        {
          name: 'Cache Service',
          status: 'maintenance',
          responseTime: 0,
          lastCheck: '5 minutes ago',
          port: 6379
        }
      ]);

      setAlerts([
        {
          id: '1',
          type: 'warning',
          message: 'AI Swarm response time exceeding threshold (156ms)',
          timestamp: '2 minutes ago',
          source: 'Performance Monitor'
        },
        {
          id: '2',
          type: 'info',
          message: 'Cache Service scheduled maintenance completed',
          timestamp: '15 minutes ago',
          source: 'Maintenance System'
        },
        {
          id: '3',
          type: 'critical',
          message: 'Disk usage approaching 80% on primary volume',
          timestamp: '1 hour ago',
          source: 'Storage Monitor'
        }
      ]);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#00ff88';
      case 'offline': return '#ff3333';
      case 'degraded': return '#ffaa00';
      case 'maintenance': return '#0099ff';
      default: return '#888888';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return '#ff3333';
      case 'warning': return '#ffaa00';
      case 'info': return '#0099ff';
      default: return '#888888';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📋';
    }
  };

  const getMetricStatus = (value: number, thresholds: {warning: number, critical: number}) => {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'healthy';
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Orchestrating clarity...</div>
      </div>
    );
  }

  return (
    <div className="operations-dashboard">
      
      <div className="dashboard-header">
        <h1>Operations Center</h1>
        <p className="dashboard-subtitle">Turn complexity into clarity through intelligent monitoring</p>
      </div>

      {/* System Metrics Overview */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🖥️</span>
            <span className="metric-title">CPU Usage</span>
          </div>
          <div className="metric-content">
            <div className="metric-value">{systemMetrics.cpu.toFixed(1)}%</div>
            <div className="metric-bar">
              <div 
                className={`metric-fill ${getMetricStatus(systemMetrics.cpu, {warning: 70, critical: 90})}`}
                style={{width: `${systemMetrics.cpu}%`}}
              ></div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">💾</span>
            <span className="metric-title">Memory</span>
          </div>
          <div className="metric-content">
            <div className="metric-value">{systemMetrics.memory.toFixed(1)}%</div>
            <div className="metric-bar">
              <div 
                className={`metric-fill ${getMetricStatus(systemMetrics.memory, {warning: 75, critical: 90})}`}
                style={{width: `${systemMetrics.memory}%`}}
              ></div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">💽</span>
            <span className="metric-title">Disk Space</span>
          </div>
          <div className="metric-content">
            <div className="metric-value">{systemMetrics.disk.toFixed(1)}%</div>
            <div className="metric-bar">
              <div 
                className={`metric-fill ${getMetricStatus(systemMetrics.disk, {warning: 80, critical: 95})}`}
                style={{width: `${systemMetrics.disk}%`}}
              ></div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🌐</span>
            <span className="metric-title">Network I/O</span>
          </div>
          <div className="metric-content">
            <div className="metric-value">{systemMetrics.network.toFixed(1)}%</div>
            <div className="metric-bar">
              <div 
                className={`metric-fill ${getMetricStatus(systemMetrics.network, {warning: 80, critical: 95})}`}
                style={{width: `${systemMetrics.network}%`}}
              ></div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">⏱️</span>
            <span className="metric-title">System Uptime</span>
          </div>
          <div className="metric-content">
            <div className="metric-value">{systemMetrics.uptime}</div>
            <div className="metric-status transcendence-complete">
              ✨ Excellence delivered
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🌡️</span>
            <span className="metric-title">Temperature</span>
          </div>
          <div className="metric-content">
            <div className="metric-value">{systemMetrics.temperature.toFixed(1)}°C</div>
            <div className="metric-bar">
              <div 
                className={`metric-fill ${getMetricStatus(systemMetrics.temperature, {warning: 60, critical: 80})}`}
                style={{width: `${(systemMetrics.temperature / 100) * 100}%`}}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        
        {/* Services Status */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Service Health</h3>
            <div className="panel-actions">
              <button className="refresh-btn" onClick={fetchDashboardData}>
                🔄 Refresh
              </button>
            </div>
          </div>
          <div className="panel-content">
            <div className="services-list">
              {services.map((service, index) => (
                <div key={index} className="service-item">
                  <div className="service-info">
                    <div className="service-name">{service.name}</div>
                    <div className="service-port">Port {service.port}</div>
                  </div>
                  <div className="service-metrics">
                    <div className="response-time">
                      {service.responseTime > 0 ? `${service.responseTime}ms` : 'N/A'}
                    </div>
                    <div className="last-check">{service.lastCheck}</div>
                  </div>
                  <div className="service-status">
                    <div 
                      className="status-indicator"
                      style={{backgroundColor: getStatusColor(service.status)}}
                    ></div>
                    <span className="status-text">{service.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>System Alerts</h3>
            <div className="alert-summary">
              <span className="alert-count critical">{alerts.filter(a => a.type === 'critical').length}</span>
              <span className="alert-count warning">{alerts.filter(a => a.type === 'warning').length}</span>
              <span className="alert-count info">{alerts.filter(a => a.type === 'info').length}</span>
            </div>
          </div>
          <div className="panel-content">
            <div className="alerts-list">
              {alerts.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.type}`}>
                  <div className="alert-icon">{getAlertIcon(alert.type)}</div>
                  <div className="alert-content">
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-meta">
                      <span className="alert-source">{alert.source}</span>
                      <span className="alert-time">{alert.timestamp}</span>
                    </div>
                  </div>
                  <button className="alert-dismiss">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Quick Operations</h3>
          </div>
          <div className="panel-content">
            <div className="actions-grid">
              <button className="action-btn primary">
                <span className="action-icon">🔄</span>
                <span className="action-text">Restart Services</span>
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">🧹</span>
                <span className="action-text">Clear Cache</span>
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">📊</span>
                <span className="action-text">Generate Report</span>
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">🔧</span>
                <span className="action-text">Run Diagnostics</span>
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">💾</span>
                <span className="action-text">Backup System</span>
              </button>
              <button className="action-btn secondary">
                <span className="action-icon">📈</span>
                <span className="action-text">Performance Tune</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Status Summary */}
      <div className="status-summary">
        <div className="summary-item">
          <span className="summary-label">Total Services</span>
          <span className="summary-value">{services.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Online</span>
          <span className="summary-value online">{services.filter(s => s.status === 'online').length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Issues</span>
          <span className="summary-value warning">{services.filter(s => s.status !== 'online').length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg Response</span>
          <span className="summary-value">
            {services.filter(s => s.responseTime > 0).length > 0 
              ? (services.filter(s => s.responseTime > 0).reduce((sum, s) => sum + s.responseTime, 0) / services.filter(s => s.responseTime > 0).length).toFixed(1) + 'ms'
              : 'N/A'
            }
          </span>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;