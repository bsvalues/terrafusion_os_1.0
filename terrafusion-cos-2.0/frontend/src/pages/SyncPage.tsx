/**
 * TerraFusion cOS 2.0 - TerraFusion Sync Page
 * Real-time data synchronization management
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface SyncConnection {
  id: string;
  name: string;
  source: string;
  target: string;
  status: 'active' | 'syncing' | 'error' | 'paused';
  last_sync: string;
  records_synced: number;
  sync_frequency: number;
  error_count: number;
}

interface SyncMetrics {
  total_connections: number;
  active_connections: number;
  records_synced_today: number;
  sync_success_rate: number;
  average_sync_time: number;
  data_volume_processed: number;
}

interface SyncLog {
  id: string;
  connection_id: string;
  sync_type: string;
  status: 'success' | 'error' | 'warning';
  records_processed: number;
  records_successful: number;
  records_failed: number;
  started_at: string;
  completed_at: string;
  error_details?: string;
}

const SyncPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'connections' | 'metrics' | 'logs'>('connections');
  const [newConnection, setNewConnection] = useState({
    name: '',
    source: '',
    target: '',
    sync_frequency: 300
  });

  // Fetch sync connections
  const { data: connections, isLoading: connectionsLoading } = useQuery<SyncConnection[]>({
    queryKey: ['sync-connections'],
    queryFn: async () => {
      // In production, fetch from API
      return [
        {
          id: '1',
          name: 'Harris PACS to TerraFusion',
          source: 'harris_pacs_db',
          target: 'terrafusion_sync',
          status: 'active',
          last_sync: '2024-01-15T10:30:00Z',
          records_synced: 15420,
          sync_frequency: 300,
          error_count: 0
        },
        {
          id: '2',
          name: 'Tyler Courts to Analytics',
          source: 'tyler_courts',
          target: 'analytics_db',
          status: 'syncing',
          last_sync: '2024-01-15T10:25:00Z',
          records_synced: 8930,
          sync_frequency: 600,
          error_count: 2
        },
        {
          id: '3',
          name: 'Esri GIS to Spatial DB',
          source: 'esri_arcgis',
          target: 'spatial_database',
          status: 'active',
          last_sync: '2024-01-15T10:28:00Z',
          records_synced: 25670,
          sync_frequency: 180,
          error_count: 0
        },
        {
          id: '4',
          name: 'CostForge Financial Data',
          source: 'costforge_api',
          target: 'financial_warehouse',
          status: 'error',
          last_sync: '2024-01-15T09:45:00Z',
          records_synced: 5420,
          sync_frequency: 900,
          error_count: 5
        }
      ];
    }
  });

  // Fetch sync metrics
  const { data: metrics } = useQuery<SyncMetrics>({
    queryKey: ['sync-metrics'],
    queryFn: async () => {
      return {
        total_connections: 4,
        active_connections: 3,
        records_synced_today: 125000,
        sync_success_rate: 97.5,
        average_sync_time: 2.3,
        data_volume_processed: 2.4
      };
    }
  });

  // Fetch sync logs
  const { data: logs } = useQuery<SyncLog[]>({
    queryKey: ['sync-logs'],
    queryFn: async () => {
      return [
        {
          id: '1',
          connection_id: '1',
          sync_type: 'incremental',
          status: 'success',
          records_processed: 150,
          records_successful: 150,
          records_failed: 0,
          started_at: '2024-01-15T10:30:00Z',
          completed_at: '2024-01-15T10:30:15Z'
        },
        {
          id: '2',
          connection_id: '2',
          sync_type: 'full',
          status: 'error',
          records_processed: 1000,
          records_successful: 950,
          records_failed: 50,
          started_at: '2024-01-15T10:25:00Z',
          completed_at: '2024-01-15T10:27:30Z',
          error_details: 'Connection timeout to Tyler Courts API'
        },
        {
          id: '3',
          connection_id: '3',
          sync_type: 'incremental',
          status: 'success',
          records_processed: 75,
          records_successful: 75,
          records_failed: 0,
          started_at: '2024-01-15T10:28:00Z',
          completed_at: '2024-01-15T10:28:08Z'
        }
      ];
    }
  });

  // Create new connection mutation
  const createConnection = useMutation({
    mutationFn: async (connectionData: typeof newConnection) => {
      // In production, send to API
      return { success: true, connection_id: 'new_connection_id' };
    },
    onSuccess: () => {
      toast.success('Connection created successfully');
      setNewConnection({ name: '', source: '', target: '', sync_frequency: 300 });
    },
    onError: () => {
      toast.error('Failed to create connection');
    }
  });

  // Sync connection mutation
  const syncConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      // In production, trigger sync via API
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Sync triggered successfully');
    },
    onError: () => {
      toast.error('Failed to trigger sync');
    }
  });

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (connectionsLoading) {
    return (
      <div className="tf-loading">
        <div className="tf-skeleton" style={{ height: '400px' }} />
      </div>
    );
  }

  return (
    <div className="tf-sync-page">
      <div className="tf-page-header">
        <h1 className="tf-h1">TerraFusion Sync</h1>
        <p className="tf-text-muted">Real-time data synchronization across vendor systems</p>
      </div>

      {/* View Selector */}
      <div className="tf-view-selector">
        <button
          className={`tf-btn ${selectedView === 'connections' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('connections')}
        >
          Connections
        </button>
        <button
          className={`tf-btn ${selectedView === 'metrics' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('metrics')}
        >
          Metrics
        </button>
        <button
          className={`tf-btn ${selectedView === 'logs' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('logs')}
        >
          Logs
        </button>
      </div>

      {/* Content based on selected view */}
      {selectedView === 'connections' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Create New Connection */}
          <div className="tf-card tf-mb-6">
            <h3 className="tf-h3 tf-mb-4">Create New Connection</h3>
            <div className="tf-form-grid">
              <div className="tf-form-group">
                <label className="tf-label">Connection Name</label>
                <input
                  type="text"
                  className="tf-input"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  placeholder="e.g., Harris PACS to Analytics"
                />
              </div>
              <div className="tf-form-group">
                <label className="tf-label">Source System</label>
                <input
                  type="text"
                  className="tf-input"
                  value={newConnection.source}
                  onChange={(e) => setNewConnection({ ...newConnection, source: e.target.value })}
                  placeholder="e.g., harris_pacs_db"
                />
              </div>
              <div className="tf-form-group">
                <label className="tf-label">Target System</label>
                <input
                  type="text"
                  className="tf-input"
                  value={newConnection.target}
                  onChange={(e) => setNewConnection({ ...newConnection, target: e.target.value })}
                  placeholder="e.g., terrafusion_sync"
                />
              </div>
              <div className="tf-form-group">
                <label className="tf-label">Sync Frequency (seconds)</label>
                <input
                  type="number"
                  className="tf-input"
                  value={newConnection.sync_frequency}
                  onChange={(e) => setNewConnection({ ...newConnection, sync_frequency: parseInt(e.target.value) })}
                  min="60"
                  max="3600"
                />
              </div>
            </div>
            <button
              className="tf-btn tf-btn-primary tf-mt-4"
              onClick={() => createConnection.mutate(newConnection)}
              disabled={!newConnection.name || !newConnection.source || !newConnection.target}
            >
              Create Connection
            </button>
          </div>

          {/* Connections List */}
          <div className="tf-connections-grid">
            {connections?.map((connection) => (
              <motion.div
                key={connection.id}
                className="tf-connection-card"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="tf-connection-header">
                  <h4 className="tf-h4">{connection.name}</h4>
                  <div className={`tf-status tf-status-${connection.status}`}>
                    <span className="tf-status-dot"></span>
                    {connection.status}
                  </div>
                </div>
                
                <div className="tf-connection-details">
                  <div className="tf-connection-route">
                    <span className="tf-source">{connection.source}</span>
                    <span className="tf-arrow">→</span>
                    <span className="tf-target">{connection.target}</span>
                  </div>
                  
                  <div className="tf-connection-metrics">
                    <div className="tf-metric">
                      <div className="tf-metric-value">{connection.records_synced.toLocaleString()}</div>
                      <div className="tf-metric-label">Records Synced</div>
                    </div>
                    <div className="tf-metric">
                      <div className="tf-metric-value">{formatDuration(connection.sync_frequency)}</div>
                      <div className="tf-metric-label">Frequency</div>
                    </div>
                    <div className="tf-metric">
                      <div className="tf-metric-value">{connection.error_count}</div>
                      <div className="tf-metric-label">Errors</div>
                    </div>
                  </div>
                  
                  <div className="tf-connection-actions">
                    <button
                      className="tf-btn tf-btn-sm tf-btn-primary"
                      onClick={() => syncConnection.mutate(connection.id)}
                      disabled={connection.status === 'syncing'}
                    >
                      {connection.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button className="tf-btn tf-btn-sm tf-btn-ghost">
                      Configure
                    </button>
                  </div>
                  
                  <div className="tf-connection-last-sync">
                    Last sync: {new Date(connection.last_sync).toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {selectedView === 'metrics' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="tf-metrics-grid">
            <div className="tf-metric-card">
              <h3 className="tf-h3">Total Connections</h3>
              <div className="tf-metric-value">{metrics?.total_connections}</div>
              <div className="tf-metric-label">Active: {metrics?.active_connections}</div>
            </div>

            <div className="tf-metric-card">
              <h3 className="tf-h3">Records Synced Today</h3>
              <div className="tf-metric-value tf-text-success">
                {(metrics?.records_synced_today || 0).toLocaleString()}
              </div>
              <div className="tf-metric-trend positive">↑ 12.5%</div>
            </div>

            <div className="tf-metric-card">
              <h3 className="tf-h3">Success Rate</h3>
              <div className="tf-metric-value tf-text-success">
                {metrics?.sync_success_rate}%
              </div>
              <div className="tf-progress tf-mt-3">
                <div 
                  className="tf-progress-bar tf-bg-success-gradient"
                  style={{ width: `${metrics?.sync_success_rate}%` }}
                />
              </div>
            </div>

            <div className="tf-metric-card">
              <h3 className="tf-h3">Average Sync Time</h3>
              <div className="tf-metric-value">
                {metrics?.average_sync_time}s
              </div>
              <div className="tf-metric-label">Per sync operation</div>
            </div>

            <div className="tf-metric-card">
              <h3 className="tf-h3">Data Volume Processed</h3>
              <div className="tf-metric-value">
                {formatBytes((metrics?.data_volume_processed || 0) * 1024 * 1024 * 1024)}
              </div>
              <div className="tf-metric-label">Today</div>
            </div>
          </div>
        </motion.div>
      )}

      {selectedView === 'logs' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="tf-logs-container">
            {logs?.map((log) => (
              <motion.div
                key={log.id}
                className={`tf-log-entry tf-log-${log.status}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="tf-log-header">
                  <div className="tf-log-type">{log.sync_type}</div>
                  <div className={`tf-log-status tf-log-status-${log.status}`}>
                    {log.status}
                  </div>
                  <div className="tf-log-time">
                    {new Date(log.started_at).toLocaleString()}
                  </div>
                </div>
                
                <div className="tf-log-details">
                  <div className="tf-log-metrics">
                    <span>Processed: {log.records_processed.toLocaleString()}</span>
                    <span>Successful: {log.records_successful.toLocaleString()}</span>
                    <span>Failed: {log.records_failed.toLocaleString()}</span>
                  </div>
                  
                  {log.error_details && (
                    <div className="tf-log-error">
                      <strong>Error:</strong> {log.error_details}
                    </div>
                  )}
                  
                  <div className="tf-log-duration">
                    Duration: {formatDuration(
                      Math.floor((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000)
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Page Styles */}
      <style jsx>{`
        .tf-sync-page {
          max-width: 1400px;
          margin: 0 auto;
        }

        .tf-view-selector {
          display: flex;
          gap: var(--tf-space-2);
          margin-bottom: var(--tf-space-6);
        }

        .tf-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--tf-space-4);
        }

        .tf-connections-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: var(--tf-space-4);
        }

        .tf-connection-card {
          background: var(--tf-midnight);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--tf-radius-lg);
          padding: var(--tf-space-4);
          transition: all var(--tf-duration-normal) var(--tf-easing-smooth);
        }

        .tf-connection-card:hover {
          border-color: var(--tf-trust-blue);
          box-shadow: var(--tf-shadow-lg);
        }

        .tf-connection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--tf-space-3);
        }

        .tf-connection-route {
          display: flex;
          align-items: center;
          gap: var(--tf-space-2);
          margin-bottom: var(--tf-space-3);
          font-family: var(--tf-font-mono);
        }

        .tf-source {
          color: var(--tf-caution-amber);
        }

        .tf-arrow {
          color: var(--tf-gray-400);
        }

        .tf-target {
          color: var(--tf-success-green);
        }

        .tf-connection-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--tf-space-3);
          margin-bottom: var(--tf-space-4);
        }

        .tf-connection-actions {
          display: flex;
          gap: var(--tf-space-2);
          margin-bottom: var(--tf-space-3);
        }

        .tf-connection-last-sync {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--tf-space-4);
        }

        .tf-logs-container {
          display: flex;
          flex-direction: column;
          gap: var(--tf-space-3);
        }

        .tf-log-entry {
          background: var(--tf-midnight);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--tf-radius-lg);
          padding: var(--tf-space-4);
        }

        .tf-log-success {
          border-left: 4px solid var(--tf-success-green);
        }

        .tf-log-error {
          border-left: 4px solid var(--tf-danger-red);
        }

        .tf-log-warning {
          border-left: 4px solid var(--tf-caution-amber);
        }

        .tf-log-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--tf-space-2);
        }

        .tf-log-type {
          font-weight: 600;
          text-transform: capitalize;
        }

        .tf-log-status {
          padding: var(--tf-space-1) var(--tf-space-2);
          border-radius: var(--tf-radius-full);
          font-size: var(--tf-small);
          font-weight: 600;
        }

        .tf-log-status-success {
          background: rgba(0, 255, 170, 0.2);
          color: var(--tf-success-green);
        }

        .tf-log-status-error {
          background: rgba(255, 59, 48, 0.2);
          color: var(--tf-danger-red);
        }

        .tf-log-status-warning {
          background: rgba(255, 170, 0, 0.2);
          color: var(--tf-caution-amber);
        }

        .tf-log-metrics {
          display: flex;
          gap: var(--tf-space-4);
          margin-bottom: var(--tf-space-2);
          font-size: var(--tf-small);
          color: var(--tf-gray-300);
        }

        .tf-log-error {
          background: rgba(255, 59, 48, 0.1);
          border: 1px solid rgba(255, 59, 48, 0.3);
          border-radius: var(--tf-radius);
          padding: var(--tf-space-2);
          margin: var(--tf-space-2) 0;
          font-size: var(--tf-small);
        }

        .tf-log-duration {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-status-syncing {
          background: rgba(0, 255, 238, 0.2);
          color: var(--tf-transcend-cyan);
          border-color: var(--tf-transcend-cyan);
        }

        .tf-status-syncing .tf-status-dot {
          background: var(--tf-transcend-cyan);
          animation: tf-pulse 1s infinite;
        }

        @media (max-width: 768px) {
          .tf-connections-grid {
            grid-template-columns: 1fr;
          }

          .tf-connection-metrics {
            grid-template-columns: 1fr;
          }

          .tf-log-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--tf-space-2);
          }
        }
      `}</style>
    </div>
  );
};

export default SyncPage;
