import React from 'react'
import './ModuleStatus.css'

interface ModuleInfo {
  name: string
  status: 'active' | 'inactive' | 'error'
  version: string
  port?: number
  health_check?: string
}

interface ModuleStatusProps {
  modules: ModuleInfo[]
}

const ModuleStatus: React.FC<ModuleStatusProps> = ({ modules }) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'var(--tf-success)'
      case 'inactive': return 'var(--tf-warning)'
      case 'error': return 'var(--tf-danger)'
      default: return 'var(--tf-secondary)'
    }
  }

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'active': return '✅'
      case 'inactive': return '⏸️'
      case 'error': return '❌'
      default: return '❓'
    }
  }

  const activeModules = modules.filter(m => m.status === 'active')
  const inactiveModules = modules.filter(m => m.status === 'inactive')
  const errorModules = modules.filter(m => m.status === 'error')

  return (
    <div className="module-status">
      <div className="module-header">
        <h2>🔧 TerraFusion Module Management</h2>
        <div className="module-summary">
          <div className="summary-item">
            <span className="summary-count">{activeModules.length}</span>
            <span className="summary-label">Active</span>
          </div>
          <div className="summary-item">
            <span className="summary-count">{inactiveModules.length}</span>
            <span className="summary-label">Inactive</span>
          </div>
          <div className="summary-item">
            <span className="summary-count">{errorModules.length}</span>
            <span className="summary-label">Error</span>
          </div>
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="no-modules">
          <div className="no-modules-icon">📦</div>
          <h3>No Module Data Available</h3>
          <p>Module information will appear here when the backend connects</p>
        </div>
      ) : (
        <div className="modules-grid">
          {modules.map((module, index) => (
            <div key={index} className={`module-card ${module.status}`}>
              <div className="module-header-info">
                <div className="module-name">
                  <span className="module-icon">{getStatusIcon(module.status)}</span>
                  <h3>{module.name}</h3>
                </div>
                <div 
                  className={`module-status-badge ${module.status}`}
                  style={{ background: getStatusColor(module.status) }}
                >
                  {module.status}
                </div>
              </div>

              <div className="module-details">
                <div className="module-detail">
                  <span className="detail-label">Version:</span>
                  <span className="detail-value">{module.version}</span>
                </div>
                
                {module.port && (
                  <div className="module-detail">
                    <span className="detail-label">Port:</span>
                    <span className="detail-value">{module.port}</span>
                  </div>
                )}
                
                {module.health_check && (
                  <div className="module-detail">
                    <span className="detail-label">Health Check:</span>
                    <span className="detail-value health-url">{module.health_check}</span>
                  </div>
                )}
              </div>

              <div className="module-actions">
                {module.status === 'active' && (
                  <>
                    <button className="action-btn restart" title="Restart Module">
                      🔄 Restart
                    </button>
                    <button className="action-btn stop" title="Stop Module">
                      ⏹️ Stop
                    </button>
                  </>
                )}
                
                {module.status === 'inactive' && (
                  <button className="action-btn start" title="Start Module">
                    ▶️ Start
                  </button>
                )}
                
                {module.status === 'error' && (
                  <>
                    <button className="action-btn diagnose" title="Diagnose Issues">
                      🔍 Diagnose
                    </button>
                    <button className="action-btn restart" title="Restart Module">
                      🔄 Restart
                    </button>
                  </>
                )}
                
                <button className="action-btn config" title="Configure Module">
                  ⚙️ Config
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="module-actions-panel">
        <h3>🛠️ Global Module Actions</h3>
        <div className="global-actions">
          <button className="global-btn refresh">
            🔄 Refresh All Modules
          </button>
          <button className="global-btn start-all">
            ▶️ Start All Inactive
          </button>
          <button className="global-btn health-check">
            🏥 Run Health Checks
          </button>
          <button className="global-btn hot-swap">
            🔥 Hot-Swap Manager
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModuleStatus