import React from 'react'
import './ServiceMonitoring.css'

interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'warning'
  port?: number
  url?: string
  response_time?: number
  last_check: string
}

interface ServiceMonitoringProps {
  services: ServiceStatus[]
}

const ServiceMonitoring: React.FC<ServiceMonitoringProps> = ({ services }) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online': return 'var(--tf-success)'
      case 'offline': return 'var(--tf-danger)'
      case 'warning': return 'var(--tf-warning)'
      default: return 'var(--tf-secondary)'
    }
  }

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'online': return '🟢'
      case 'offline': return '🔴'
      case 'warning': return '🟡'
      default: return '⚪'
    }
  }

  const getResponseTimeColor = (responseTime?: number): string => {
    if (!responseTime) return 'var(--tf-secondary)'
    if (responseTime < 100) return 'var(--tf-success)'
    if (responseTime < 500) return 'var(--tf-warning)'
    return 'var(--tf-danger)'
  }

  const formatResponseTime = (ms?: number): string => {
    if (!ms) return 'N/A'
    return `${ms}ms`
  }

  const onlineServices = services.filter(s => s.status === 'online')
  const offlineServices = services.filter(s => s.status === 'offline')
  const warningServices = services.filter(s => s.status === 'warning')

  return (
    <div className="service-monitoring">
      <div className="service-header">
        <h2>🌐 Service Monitoring Dashboard</h2>
        <div className="service-summary">
          <div className="summary-item online">
            <span className="summary-count">{onlineServices.length}</span>
            <span className="summary-label">Online</span>
          </div>
          <div className="summary-item warning">
            <span className="summary-count">{warningServices.length}</span>
            <span className="summary-label">Warning</span>
          </div>
          <div className="summary-item offline">
            <span className="summary-count">{offlineServices.length}</span>
            <span className="summary-label">Offline</span>
          </div>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="no-services">
          <div className="no-services-icon">🌐</div>
          <h3>No Service Data Available</h3>
          <p>Service monitoring information will appear here when connected</p>
        </div>
      ) : (
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className={`service-card ${service.status}`}>
              <div className="service-header-info">
                <div className="service-name">
                  <span className="service-icon">{getStatusIcon(service.status)}</span>
                  <h3>{service.name}</h3>
                </div>
                <div 
                  className={`service-status-badge ${service.status}`}
                  style={{ background: getStatusColor(service.status) }}
                >
                  {service.status}
                </div>
              </div>

              <div className="service-details">
                {service.port && (
                  <div className="service-detail">
                    <span className="detail-label">Port:</span>
                    <span className="detail-value port">{service.port}</span>
                  </div>
                )}
                
                {service.url && (
                  <div className="service-detail">
                    <span className="detail-label">URL:</span>
                    <span className="detail-value url">{service.url}</span>
                  </div>
                )}
                
                <div className="service-detail">
                  <span className="detail-label">Response Time:</span>
                  <span 
                    className="detail-value response-time"
                    style={{ color: getResponseTimeColor(service.response_time) }}
                  >
                    {formatResponseTime(service.response_time)}
                  </span>
                </div>
                
                <div className="service-detail">
                  <span className="detail-label">Last Check:</span>
                  <span className="detail-value">
                    {new Date(service.last_check).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="service-actions">
                <button className="action-btn ping" title="Ping Service">
                  📡 Ping
                </button>
                
                {service.url && (
                  <button 
                    className="action-btn open-url" 
                    title="Open Service URL"
                    onClick={() => window.open(service.url, '_blank')}
                  >
                    🔗 Open
                  </button>
                )}
                
                <button className="action-btn logs" title="View Service Logs">
                  📄 Logs
                </button>
                
                {service.status === 'offline' && (
                  <button className="action-btn restart" title="Restart Service">
                    🔄 Restart
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="service-actions-panel">
        <h3>🛠️ Global Service Actions</h3>
        <div className="global-actions">
          <button className="global-btn refresh">
            🔄 Refresh All Services
          </button>
          <button className="global-btn health-check">
            🏥 Run Health Checks
          </button>
          <button className="global-btn ping-all">
            📡 Ping All Services
          </button>
          <button className="global-btn restart-failed">
            ⚡ Restart Failed Services
          </button>
        </div>
      </div>

      <div className="service-metrics">
        <h3>📊 Service Performance Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">⚡</span>
              <span className="metric-label">Avg Response Time</span>
            </div>
            <div className="metric-value">
              {onlineServices.length > 0 ? (
                <span className="metric-number">
                  {Math.round(
                    onlineServices.reduce((sum, s) => sum + (s.response_time || 0), 0) / 
                    onlineServices.length
                  )}ms
                </span>
              ) : (
                <span className="metric-number">N/A</span>
              )}
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">📈</span>
              <span className="metric-label">Uptime Percentage</span>
            </div>
            <div className="metric-value">
              <span className="metric-number">
                {services.length > 0 ? 
                  Math.round((onlineServices.length / services.length) * 100) : 0}%
              </span>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-icon">🎯</span>
              <span className="metric-label">Services Online</span>
            </div>
            <div className="metric-value">
              <span className="metric-number">
                {onlineServices.length}/{services.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceMonitoring