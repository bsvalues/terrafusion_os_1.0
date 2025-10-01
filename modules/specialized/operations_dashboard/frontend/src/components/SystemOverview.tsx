import React from 'react'
import './SystemOverview.css'

interface SystemMetrics {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  network_io: {
    bytes_sent: number
    bytes_recv: number
  }
  uptime: number
  timestamp: string
}

interface SystemOverviewProps {
  metrics: SystemMetrics | null
  connected: boolean
}

const SystemOverview: React.FC<SystemOverviewProps> = ({ metrics, connected }) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const getStatusColor = (value: number): string => {
    if (value < 50) return 'var(--tf-success)'
    if (value < 80) return 'var(--tf-warning)'
    return 'var(--tf-danger)'
  }

  if (!connected) {
    return (
      <div className="system-overview">
        <div className="connection-error">
          <div className="error-icon">🔌</div>
          <h3>Connection Lost</h3>
          <p>Unable to connect to TerraFusion Operations Backend</p>
          <p className="error-details">Check if the Python backend is running on port \${{TF_DEBUG_PORT:-9999}}</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="system-overview">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h3>Loading System Metrics...</h3>
          <p>Connecting to TerraFusion monitoring systems</p>
        </div>
      </div>
    )
  }

  return (
    <div className="system-overview">
      <div className="overview-header">
        <h2>🌍 TerraFusion OS System Overview</h2>
        <div className="last-updated">
          Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🖥️</span>
            <h3>CPU Usage</h3>
          </div>
          <div className="metric-value">
            <span className="value-number">{metrics.cpu_usage.toFixed(1)}%</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${metrics.cpu_usage}%`,
                  background: getStatusColor(metrics.cpu_usage)
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">💾</span>
            <h3>Memory Usage</h3>
          </div>
          <div className="metric-value">
            <span className="value-number">{metrics.memory_usage.toFixed(1)}%</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${metrics.memory_usage}%`,
                  background: getStatusColor(metrics.memory_usage)
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">💿</span>
            <h3>Disk Usage</h3>
          </div>
          <div className="metric-value">
            <span className="value-number">{metrics.disk_usage.toFixed(1)}%</span>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${metrics.disk_usage}%`,
                  background: getStatusColor(metrics.disk_usage)
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">⏱️</span>
            <h3>System Uptime</h3>
          </div>
          <div className="metric-value">
            <span className="value-number">{formatUptime(metrics.uptime)}</span>
            <div className="uptime-status">
              <span className="status online">Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="network-stats">
        <div className="network-card">
          <h3>📡 Network I/O</h3>
          <div className="network-metrics">
            <div className="network-metric">
              <span className="network-label">📤 Bytes Sent:</span>
              <span className="network-value">{formatBytes(metrics.network_io.bytes_sent)}</span>
            </div>
            <div className="network-metric">
              <span className="network-label">📥 Bytes Received:</span>
              <span className="network-value">{formatBytes(metrics.network_io.bytes_recv)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="system-status">
        <div className="status-card">
          <h3>🏛️ Government OS Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Kernel Status:</span>
              <span className="status online">Active</span>
            </div>
            <div className="status-item">
              <span className="status-label">AI Swarm:</span>
              <span className="status online">Operational</span>
            </div>
            <div className="status-item">
              <span className="status-label">Module System:</span>
              <span className="status online">Hot-Swappable</span>
            </div>
            <div className="status-item">
              <span className="status-label">Security Layer:</span>
              <span className="status online">11-Layer Protection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemOverview