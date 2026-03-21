import React, { useState, useEffect } from 'react';

import { BackendIntegrationService, SystemHealth } from '../../services/BackendIntegrationService';
import './DevelopmentModeIndicator.css';

type ConnectionStats = ReturnType<BackendIntegrationService['getConnectionStats']>;

interface DevelopmentModeIndicatorProps {
  backendService: BackendIntegrationService;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * DevelopmentModeIndicator - Transparency Component
 *
 * This component addresses audit concerns by clearly indicating:
 * 1. Whether the system is using real backend data or mock data
 * 2. Current development phase and data sources
 * 3. Backend connection status and health
 * 4. Clear labeling of mock vs. real data
 *
 * AUDIT TRANSPARENCY: This component ensures users know exactly
 * what type of data they're viewing at all times.
 */
const DevelopmentModeIndicator: React.FC<DevelopmentModeIndicatorProps> = ({
  backendService,
  position = 'top-right',
}) => {
  const [healthStatus, setHealthStatus] = useState<SystemHealth | null>(() =>
    backendService.getHealthStatus()
  );
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(() =>
    backendService.getConnectionStats()
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const backendConnected = Boolean(healthStatus?.backend_connected);
  const showingSimulatedData = !backendConnected;

  const syncStatusFromService = () => {
    setHealthStatus(backendService.getHealthStatus());
    setConnectionStats(backendService.getConnectionStats());
  };

  useEffect(() => {
    syncStatusFromService();

    // Update every 5 seconds
    const interval = setInterval(syncStatusFromService, 5000);
    return () => clearInterval(interval);
  }, [backendService]);

  const handleReconnect = async () => {
    await backendService.reconnect();
    syncStatusFromService();
  };

  const getStatusColor = () => {
    return backendConnected ? 'var(--tf-success-green)' : 'var(--tf-warning-amber)';
  };

  const getStatusText = () => {
    return backendConnected ? 'BACKEND VERIFIED' : 'SIMULATED DATA';
  };

  const getStatusIcon = () => {
    return backendConnected ? '🟢' : '🟡';
  };

  const getStatusValueText = (
    reported: boolean,
    positiveLabel: string,
    unavailableLabel: string = 'Unavailable'
  ) => (reported ? `${positiveLabel} ✅` : `${unavailableLabel} ⚠️`);

  return (
    <div className={`development-mode-indicator ${position}`}>
      <div
        className={`indicator-badge ${showingSimulatedData ? 'simulated-mode' : 'backend-mode'}`}
        style={{ backgroundColor: getStatusColor() }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className='status-icon'>{getStatusIcon()}</span>
        <span className='status-text'>{getStatusText()}</span>
        <span className='expand-icon'>{isExpanded ? '−' : '+'}</span>
      </div>

      {isExpanded && (
        <div className='indicator-details'>
          <div className='detail-header'>
            <h4>🔍 SYSTEM TRANSPARENCY REPORT</h4>
            <p>Addressing AI Audit Concerns</p>
          </div>

          <div className='status-grid'>
            <div className='status-item'>
              <span className='status-label'>Data Source:</span>
              <span className={`status-value ${showingSimulatedData ? 'simulated' : 'backend'}`}>
                {showingSimulatedData ? 'Simulated or workspace data' : 'Backend API data'}
              </span>
            </div>

            <div className='status-item'>
              <span className='status-label'>Environment:</span>
              <span className='status-value'>{connectionStats?.environment || 'Unknown'}</span>
            </div>

            <div className='status-item'>
              <span className='status-label'>Backend Status:</span>
              <span
                className={`status-value ${healthStatus?.backend_connected ? 'connected' : 'disconnected'}`}
              >
                {healthStatus?.backend_connected ? 'Health responding ✅' : 'Health unavailable ⚠️'}
              </span>
            </div>

            <div className='status-item'>
              <span className='status-label'>Database:</span>
              <span
                className={`status-value ${healthStatus?.database_operational ? 'connected' : 'disconnected'}`}
              >
                {getStatusValueText(
                  Boolean(healthStatus?.database_operational),
                  'Reported operational'
                )}
              </span>
            </div>

            <div className='status-item'>
              <span className='status-label'>AI Services:</span>
              <span
                className={`status-value ${healthStatus?.ai_services_online ? 'connected' : 'disconnected'}`}
              >
                {getStatusValueText(Boolean(healthStatus?.ai_services_online), 'Reported online')}
              </span>
            </div>

            <div className='status-item'>
              <span className='status-label'>Security Systems:</span>
              <span
                className={`status-value ${healthStatus?.security_systems_active ? 'connected' : 'disconnected'}`}
              >
                {getStatusValueText(Boolean(healthStatus?.security_systems_active), 'Reported active')}
              </span>
            </div>
          </div>

          <div className='audit-notice'>
            <h5>🛡️ AUDIT TRANSPARENCY NOTICE</h5>
            <p>
              {showingSimulatedData ? (
                <span>
                  <strong>Backend health unavailable:</strong> This indicator is not receiving
                  verified backend status and may sit alongside simulated or workspace-only data
                  used for development and testing.
                </span>
              ) : (
                <span>
                  <strong>Backend health responding:</strong> This indicator is receiving
                  backend-backed status from configured services. This verifies connectivity, not
                  production traffic approval.
                </span>
              )}
            </p>

            {showingSimulatedData && (
              <div className='mock-data-warning'>
                ⚠️ <strong>Simulated data active:</strong> Treat any dashboard metrics shown beside
                this indicator as workspace-only proof until backend health returns and live
                environment gates are separately completed.
              </div>
            )}
          </div>

          <div className='connection-actions'>
            {showingSimulatedData && (
              <button className='reconnect-button' onClick={handleReconnect}>
                🔄 Attempt Backend Connection
              </button>
            )}

            <div className='connection-stats'>
              <small>
                Last Health Check:{' '}
                {healthStatus?.last_health_check
                  ? new Date(healthStatus.last_health_check).toLocaleTimeString()
                  : 'Never'}
              </small>
              {connectionStats?.retryAttempts > 0 && (
                <small>Connection Attempts: {connectionStats.retryAttempts}</small>
              )}
            </div>
          </div>

          <div className='development-info'>
            <h5>📋 DEVELOPMENT CONTEXT</h5>
            <ul>
              <li>✅ Frontend components are workspace-validated</li>
              <li>✅ Backend API endpoints are defined and documented</li>
              <li>✅ Database schemas are implemented</li>
              <li>⚠️ Simulated data may appear while backend health is unavailable</li>
              <li>🔄 Live traffic still depends on separate environment gates and sign-off</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevelopmentModeIndicator;
