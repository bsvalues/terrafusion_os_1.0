import React, { useState } from 'react'
import './AlertsPanel.css'

interface AlertInfo {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  timestamp: string
  source: string
}

interface AlertsPanelProps {
  alerts: AlertInfo[]
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedAlert, setSelectedAlert] = useState<AlertInfo | null>(null)

  const alertTypes = ['all', 'error', 'warning', 'info']

  const filteredAlerts = filterType === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === filterType)

  const getAlertColor = (type: string): string => {
    switch (type) {
      case 'error': return 'var(--tf-danger)'
      case 'warning': return 'var(--tf-warning)'
      case 'info': return 'var(--tf-info)'
      default: return 'var(--tf-secondary)'
    }
  }

  const getAlertIcon = (type: string): string => {
    switch (type) {
      case 'error': return '🚨'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📢'
    }
  }

  const getAlertGradient = (type: string): string => {
    switch (type) {
      case 'error': return 'var(--tf-gradient-danger)'
      case 'warning': return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      case 'info': return 'var(--tf-gradient-secondary)'
      default: return 'var(--tf-gradient-secondary)'
    }
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date()
    const alertTime = new Date(timestamp)
    const diffMs = now.getTime() - alertTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const dismissAlert = (alertId: string) => {
    // This would typically call a parent function to dismiss the alert
    console.log('Dismiss alert:', alertId)
  }

  const dismissAllAlerts = () => {
    // This would typically call a parent function to dismiss all alerts
    console.log('Dismiss all alerts')
  }

  const clearByType = (type: string) => {
    console.log('Clear alerts by type:', type)
  }

  const errorCount = alerts.filter(a => a.type === 'error').length
  const warningCount = alerts.filter(a => a.type === 'warning').length
  const infoCount = alerts.filter(a => a.type === 'info').length

  return (
    <div className="alerts-panel">
      <div className="alerts-header">
        <h2>🚨 System Alerts & Notifications</h2>
        <div className="alert-stats">
          <div className="stat-item error">
            <span className="stat-count">{errorCount}</span>
            <span className="stat-label">Errors</span>
          </div>
          <div className="stat-item warning">
            <span className="stat-count">{warningCount}</span>
            <span className="stat-label">Warnings</span>
          </div>
          <div className="stat-item info">
            <span className="stat-count">{infoCount}</span>
            <span className="stat-label">Info</span>
          </div>
        </div>
      </div>

      <div className="alerts-controls">
        <div className="filter-controls">
          <label htmlFor="type-filter">Filter by Type:</label>
          <select
            id="type-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            {alertTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="action-controls">
          <button
            className="control-btn dismiss-all"
            onClick={dismissAllAlerts}
            title="Dismiss All Alerts"
          >
            🗑️ Dismiss All
          </button>
          
          {filterType !== 'all' && (
            <button
              className="control-btn clear-type"
              onClick={() => clearByType(filterType)}
              title={`Clear ${filterType} alerts`}
            >
              🧹 Clear {filterType}
            </button>
          )}
        </div>
      </div>

      <div className="alerts-container">
        {filteredAlerts.length === 0 ? (
          <div className="no-alerts">
            <div className="no-alerts-icon">✅</div>
            <h3>No Alerts</h3>
            <p>
              {alerts.length === 0 
                ? 'All systems are operating normally'
                : 'No alerts match the current filter'
              }
            </p>
          </div>
        ) : (
          <div className="alerts-list">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`alert-item ${alert.type}`}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="alert-header">
                  <div className="alert-type-info">
                    <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                    <span 
                      className="alert-type-badge"
                      style={{ background: getAlertGradient(alert.type) }}
                    >
                      {alert.type.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="alert-meta">
                    <span className="alert-time">{getTimeAgo(alert.timestamp)}</span>
                    <button
                      className="dismiss-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissAlert(alert.id)
                      }}
                      title="Dismiss Alert"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="alert-content">
                  <div className="alert-source">
                    <span className="source-label">Source:</span>
                    <span className="source-value">{alert.source}</span>
                  </div>
                  
                  <div className="alert-message">
                    {alert.message}
                  </div>
                  
                  <div className="alert-timestamp">
                    {formatTimestamp(alert.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedAlert && (
        <div className="alert-modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="modal-icon">{getAlertIcon(selectedAlert.type)}</span>
                Alert Details
              </h3>
              <button
                className="modal-close"
                onClick={() => setSelectedAlert(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="modal-field">
                <label>Type:</label>
                <span 
                  className="field-value type-badge"
                  style={{ background: getAlertGradient(selectedAlert.type) }}
                >
                  {selectedAlert.type.toUpperCase()}
                </span>
              </div>
              
              <div className="modal-field">
                <label>Source:</label>
                <span className="field-value">{selectedAlert.source}</span>
              </div>
              
              <div className="modal-field">
                <label>Timestamp:</label>
                <span className="field-value">{formatTimestamp(selectedAlert.timestamp)}</span>
              </div>
              
              <div className="modal-field">
                <label>Message:</label>
                <div className="field-value message-content">
                  {selectedAlert.message}
                </div>
              </div>
              
              <div className="modal-field">
                <label>Alert ID:</label>
                <span className="field-value alert-id">{selectedAlert.id}</span>
              </div>
            </div>
            
            <div className="modal-actions">
              <button
                className="modal-btn dismiss"
                onClick={() => {
                  dismissAlert(selectedAlert.id)
                  setSelectedAlert(null)
                }}
              >
                🗑️ Dismiss Alert
              </button>
              
              <button
                className="modal-btn close"
                onClick={() => setSelectedAlert(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="alerts-footer">
        <div className="alerts-info">
          Showing {filteredAlerts.length} of {alerts.length} alerts
        </div>
        <div className="alerts-connection">
          <span className="connection-indicator online">
            <span className="indicator-dot"></span>
            Real-time Monitoring Active
          </span>
        </div>
      </div>
    </div>
  )
}

export default AlertsPanel