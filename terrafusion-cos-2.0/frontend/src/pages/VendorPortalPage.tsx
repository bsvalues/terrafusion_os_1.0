/**
 * TerraFusion cOS 2.0 - Vendor Portal Page
 * Vendor management and integration dashboard
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface Vendor {
  id: string;
  name: string;
  type: string;
  contact_email: string;
  subscription_tier: 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  created_at: string;
  last_activity: string;
  integrations: Integration[];
  metrics: VendorMetrics;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  last_sync: string;
  sync_frequency: number;
  error_count: number;
}

interface VendorMetrics {
  total_integrations: number;
  active_integrations: number;
  data_volume_processed: number;
  api_calls_today: number;
  success_rate: number;
  uptime: number;
}

interface VendorPortalMetrics {
  total_vendors: number;
  active_vendors: number;
  total_integrations: number;
  active_integrations: number;
  total_api_calls: number;
  average_response_time: number;
  system_uptime: number;
}

const VendorPortalPage: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'vendors' | 'integrations' | 'metrics' | 'settings'>('vendors');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [newVendor, setNewVendor] = useState({
    name: '',
    type: '',
    contact_email: '',
    subscription_tier: 'basic' as const
  });

  // Fetch vendors
  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ['vendors'],
    queryFn: async () => {
      return [
        {
          id: '1',
          name: 'Harris Computer Systems',
          type: 'Government Software',
          contact_email: 'contact@harriscomputer.com',
          subscription_tier: 'enterprise',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          last_activity: '2024-01-15T14:30:00Z',
          integrations: [
            {
              id: '1',
              name: 'PACS Integration',
              type: 'data_sync',
              status: 'active',
              last_sync: '2024-01-15T14:30:00Z',
              sync_frequency: 300,
              error_count: 0
            },
            {
              id: '2',
              name: 'CAMA System',
              type: 'api_integration',
              status: 'active',
              last_sync: '2024-01-15T14:25:00Z',
              sync_frequency: 600,
              error_count: 1
            }
          ],
          metrics: {
            total_integrations: 2,
            active_integrations: 2,
            data_volume_processed: 5.2,
            api_calls_today: 15420,
            success_rate: 99.2,
            uptime: 99.8
          }
        },
        {
          id: '2',
          name: 'Tyler Technologies',
          type: 'Government Software',
          contact_email: 'contact@tylertech.com',
          subscription_tier: 'enterprise',
          status: 'active',
          created_at: '2024-01-05T00:00:00Z',
          last_activity: '2024-01-15T14:28:00Z',
          integrations: [
            {
              id: '3',
              name: 'Court Systems',
              type: 'workflow_integration',
              status: 'active',
              last_sync: '2024-01-15T14:28:00Z',
              sync_frequency: 180,
              error_count: 0
            }
          ],
          metrics: {
            total_integrations: 1,
            active_integrations: 1,
            data_volume_processed: 3.8,
            api_calls_today: 8930,
            success_rate: 98.5,
            uptime: 99.5
          }
        },
        {
          id: '3',
          name: 'Esri',
          type: 'GIS Software',
          contact_email: 'contact@esri.com',
          subscription_tier: 'professional',
          status: 'active',
          created_at: '2024-01-10T00:00:00Z',
          last_activity: '2024-01-15T14:25:00Z',
          integrations: [
            {
              id: '4',
              name: 'ArcGIS Online',
              type: 'spatial_integration',
              status: 'active',
              last_sync: '2024-01-15T14:25:00Z',
              sync_frequency: 120,
              error_count: 0
            }
          ],
          metrics: {
            total_integrations: 1,
            active_integrations: 1,
            data_volume_processed: 8.1,
            api_calls_today: 25670,
            success_rate: 99.7,
            uptime: 99.9
          }
        }
      ];
    }
  });

  // Fetch vendor portal metrics
  const { data: portalMetrics } = useQuery<VendorPortalMetrics>({
    queryKey: ['vendor-portal-metrics'],
    queryFn: async () => {
      return {
        total_vendors: 3,
        active_vendors: 3,
        total_integrations: 4,
        active_integrations: 4,
        total_api_calls: 50020,
        average_response_time: 145,
        system_uptime: 99.7
      };
    }
  });

  // Create vendor mutation
  const createVendor = useMutation({
    mutationFn: async (vendorData: typeof newVendor) => {
      return { success: true, vendor_id: 'new_vendor_id' };
    },
    onSuccess: () => {
      toast.success('Vendor created successfully');
      setNewVendor({ name: '', type: '', contact_email: '', subscription_tier: 'basic' });
    },
    onError: () => {
      toast.error('Failed to create vendor');
    }
  });

  // Update vendor status mutation
  const updateVendorStatus = useMutation({
    mutationFn: async ({ vendorId, status }: { vendorId: string; status: string }) => {
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Vendor status updated');
    },
    onError: () => {
      toast.error('Failed to update vendor status');
    }
  });

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (vendorsLoading) {
    return (
      <div className="tf-loading">
        <div className="tf-skeleton" style={{ height: '400px' }} />
      </div>
    );
  }

  return (
    <div className="tf-vendor-portal-page">
      <div className="tf-page-header">
        <h1 className="tf-h1">Vendor Portal</h1>
        <p className="tf-text-muted">Manage vendor integrations and monitor system health</p>
      </div>

      {/* View Selector */}
      <div className="tf-view-selector">
        <button
          className={`tf-btn ${selectedView === 'vendors' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('vendors')}
        >
          Vendors
        </button>
        <button
          className={`tf-btn ${selectedView === 'integrations' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('integrations')}
        >
          Integrations
        </button>
        <button
          className={`tf-btn ${selectedView === 'metrics' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('metrics')}
        >
          Metrics
        </button>
        <button
          className={`tf-btn ${selectedView === 'settings' ? 'tf-btn-primary' : 'tf-btn-ghost'}`}
          onClick={() => setSelectedView('settings')}
        >
          Settings
        </button>
      </div>

      {/* Content based on selected view */}
      {selectedView === 'vendors' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Create New Vendor */}
          <div className="tf-card tf-mb-6">
            <h3 className="tf-h3 tf-mb-4">Add New Vendor</h3>
            <div className="tf-form-grid">
              <div className="tf-form-group">
                <label className="tf-label">Vendor Name</label>
                <input
                  type="text"
                  className="tf-input"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  placeholder="e.g., Acme Government Solutions"
                />
              </div>
              <div className="tf-form-group">
                <label className="tf-label">Vendor Type</label>
                <input
                  type="text"
                  className="tf-input"
                  value={newVendor.type}
                  onChange={(e) => setNewVendor({ ...newVendor, type: e.target.value })}
                  placeholder="e.g., Government Software"
                />
              </div>
              <div className="tf-form-group">
                <label className="tf-label">Contact Email</label>
                <input
                  type="email"
                  className="tf-input"
                  value={newVendor.contact_email}
                  onChange={(e) => setNewVendor({ ...newVendor, contact_email: e.target.value })}
                  placeholder="contact@vendor.com"
                />
              </div>
              <div className="tf-form-group">
                <label className="tf-label">Subscription Tier</label>
                <select
                  className="tf-input"
                  value={newVendor.subscription_tier}
                  onChange={(e) => setNewVendor({ ...newVendor, subscription_tier: e.target.value as any })}
                >
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <button
              className="tf-btn tf-btn-primary tf-mt-4"
              onClick={() => createVendor.mutate(newVendor)}
              disabled={!newVendor.name || !newVendor.type || !newVendor.contact_email}
            >
              Add Vendor
            </button>
          </div>

          {/* Vendors List */}
          <div className="tf-vendors-grid">
            {vendors?.map((vendor) => (
              <motion.div
                key={vendor.id}
                className="tf-vendor-card"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="tf-vendor-header">
                  <div className="tf-vendor-info">
                    <h4 className="tf-h4">{vendor.name}</h4>
                    <div className="tf-vendor-type">{vendor.type}</div>
                  </div>
                  <div className="tf-vendor-status">
                    <div className={`tf-status tf-status-${vendor.status}`}>
                      <span className="tf-status-dot"></span>
                      {vendor.status}
                    </div>
                    <div className="tf-subscription-tier">
                      {vendor.subscription_tier}
                    </div>
                  </div>
                </div>
                
                <div className="tf-vendor-contact">
                  <span className="tf-contact-label">Contact:</span>
                  <span className="tf-contact-email">{vendor.contact_email}</span>
                </div>
                
                <div className="tf-vendor-metrics">
                  <div className="tf-metric">
                    <div className="tf-metric-value">{vendor.metrics.total_integrations}</div>
                    <div className="tf-metric-label">Integrations</div>
                  </div>
                  <div className="tf-metric">
                    <div className="tf-metric-value">{vendor.metrics.success_rate}%</div>
                    <div className="tf-metric-label">Success Rate</div>
                  </div>
                  <div className="tf-metric">
                    <div className="tf-metric-value">{vendor.metrics.uptime}%</div>
                    <div className="tf-metric-label">Uptime</div>
                  </div>
                </div>
                
                <div className="tf-vendor-integrations">
                  <div className="tf-integrations-header">
                    <span>Active Integrations ({vendor.metrics.active_integrations})</span>
                  </div>
                  <div className="tf-integrations-list">
                    {vendor.integrations.map((integration) => (
                      <div key={integration.id} className="tf-integration-item">
                        <span className="tf-integration-name">{integration.name}</span>
                        <div className={`tf-status tf-status-${integration.status}`}>
                          <span className="tf-status-dot"></span>
                          {integration.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="tf-vendor-actions">
                  <button
                    className="tf-btn tf-btn-sm tf-btn-primary"
                    onClick={() => setSelectedVendor(vendor)}
                  >
                    Manage
                  </button>
                  <button
                    className="tf-btn tf-btn-sm tf-btn-ghost"
                    onClick={() => updateVendorStatus.mutate({ 
                      vendorId: vendor.id, 
                      status: vendor.status === 'active' ? 'inactive' : 'active' 
                    })}
                  >
                    {vendor.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
                
                <div className="tf-vendor-activity">
                  Last activity: {new Date(vendor.last_activity).toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {selectedView === 'integrations' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="tf-integrations-container">
            {vendors?.flatMap(vendor => 
              vendor.integrations.map(integration => (
                <motion.div
                  key={integration.id}
                  className="tf-integration-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="tf-integration-header">
                    <div className="tf-integration-info">
                      <h4 className="tf-h4">{integration.name}</h4>
                      <div className="tf-integration-vendor">{vendor.name}</div>
                    </div>
                    <div className={`tf-status tf-status-${integration.status}`}>
                      <span className="tf-status-dot"></span>
                      {integration.status}
                    </div>
                  </div>
                  
                  <div className="tf-integration-details">
                    <div className="tf-integration-type">
                      <span className="tf-detail-label">Type:</span>
                      <span className="tf-detail-value">{integration.type.replace('_', ' ')}</span>
                    </div>
                    <div className="tf-integration-frequency">
                      <span className="tf-detail-label">Sync Frequency:</span>
                      <span className="tf-detail-value">{integration.sync_frequency}s</span>
                    </div>
                    <div className="tf-integration-errors">
                      <span className="tf-detail-label">Errors:</span>
                      <span className={`tf-detail-value ${integration.error_count > 0 ? 'tf-text-danger' : 'tf-text-success'}`}>
                        {integration.error_count}
                      </span>
                    </div>
                  </div>
                  
                  <div className="tf-integration-last-sync">
                    Last sync: {new Date(integration.last_sync).toLocaleString()}
                  </div>
                  
                  <div className="tf-integration-actions">
                    <button className="tf-btn tf-btn-sm tf-btn-primary">
                      Sync Now
                    </button>
                    <button className="tf-btn tf-btn-sm tf-btn-ghost">
                      Configure
                    </button>
                  </div>
                </motion.div>
              ))
            )}
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
              <h3 className="tf-h3">Total Vendors</h3>
              <div className="tf-metric-value">{portalMetrics?.total_vendors}</div>
              <div className="tf-metric-label">Active: {portalMetrics?.active_vendors}</div>
            </div>

            <div className="tf-metric-card">
              <h3 className="tf-h3">Total Integrations</h3>
              <div className="tf-metric-value">{portalMetrics?.total_integrations}</div>
              <div className="tf-metric-label">Active: {portalMetrics?.active_integrations}</div>
            </div>

            <div className="tf-metric-card">
              <h3 className="tf-h3">API Calls Today</h3>
              <div className="tf-metric-value tf-text-success">
                {(portalMetrics?.total_api_calls || 0).toLocaleString()}
              </div>
              <div className="tf-metric-trend positive">↑ 15.3%</div>
            </div>

            <div className="tf-metric-card">
              <h3 className="tf-h3">Average Response Time</h3>
              <div className="tf-metric-value">
                {portalMetrics?.average_response_time}ms
              </div>
              <div className="tf-metric-label">P95 latency</div>
            </div>

            <div className="tf-metric-card">
              <h3 className="tf-h3">System Uptime</h3>
              <div className="tf-metric-value tf-text-success">
                {portalMetrics?.system_uptime}%
              </div>
              <div className="tf-progress tf-mt-3">
                <div 
                  className="tf-progress-bar tf-bg-success-gradient"
                  style={{ width: `${portalMetrics?.system_uptime}%` }}
                />
              </div>
            </div>

            <div className="tf-metric-card tf-metric-card-wide">
              <h3 className="tf-h3">Vendor Performance</h3>
              <div className="tf-vendor-performance-chart">
                {vendors?.map((vendor) => (
                  <div key={vendor.id} className="tf-vendor-performance-item">
                    <div className="tf-vendor-name">{vendor.name}</div>
                    <div className="tf-performance-bars">
                      <div className="tf-performance-bar">
                        <span className="tf-bar-label">Success Rate</span>
                        <div className="tf-bar-container">
                          <div 
                            className="tf-bar tf-bar-success"
                            style={{ width: `${vendor.metrics.success_rate}%` }}
                          />
                          <span className="tf-bar-value">{vendor.metrics.success_rate}%</span>
                        </div>
                      </div>
                      <div className="tf-performance-bar">
                        <span className="tf-bar-label">Uptime</span>
                        <div className="tf-bar-container">
                          <div 
                            className="tf-bar tf-bar-uptime"
                            style={{ width: `${vendor.metrics.uptime}%` }}
                          />
                          <span className="tf-bar-value">{vendor.metrics.uptime}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {selectedView === 'settings' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="tf-settings-container">
            <div className="tf-card">
              <h3 className="tf-h3 tf-mb-4">Portal Settings</h3>
              
              <div className="tf-settings-section">
                <h4 className="tf-h4">API Configuration</h4>
                <div className="tf-form-group">
                  <label className="tf-label">Default Rate Limit (requests/minute)</label>
                  <input type="number" className="tf-input" defaultValue="1000" />
                </div>
                <div className="tf-form-group">
                  <label className="tf-label">Request Timeout (seconds)</label>
                  <input type="number" className="tf-input" defaultValue="30" />
                </div>
              </div>
              
              <div className="tf-settings-section">
                <h4 className="tf-h4">Monitoring</h4>
                <div className="tf-form-group">
                  <label className="tf-label">Health Check Interval (seconds)</label>
                  <input type="number" className="tf-input" defaultValue="60" />
                </div>
                <div className="tf-form-group">
                  <label className="tf-label">Alert Threshold (error rate %)</label>
                  <input type="number" className="tf-input" defaultValue="5" />
                </div>
              </div>
              
              <div className="tf-settings-section">
                <h4 className="tf-h4">Security</h4>
                <div className="tf-form-group">
                  <label className="tf-label">Session Timeout (minutes)</label>
                  <input type="number" className="tf-input" defaultValue="60" />
                </div>
                <div className="tf-form-group">
                  <label className="tf-label">Max Failed Attempts</label>
                  <input type="number" className="tf-input" defaultValue="5" />
                </div>
              </div>
              
              <button className="tf-btn tf-btn-primary tf-mt-6">
                Save Settings
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Page Styles */}
      <style jsx>{`
        .tf-vendor-portal-page {
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

        .tf-vendors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: var(--tf-space-4);
        }

        .tf-vendor-card {
          background: var(--tf-midnight);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--tf-radius-lg);
          padding: var(--tf-space-4);
          transition: all var(--tf-duration-normal) var(--tf-easing-smooth);
        }

        .tf-vendor-card:hover {
          border-color: var(--tf-trust-blue);
          box-shadow: var(--tf-shadow-lg);
        }

        .tf-vendor-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--tf-space-3);
        }

        .tf-vendor-info {
          flex: 1;
        }

        .tf-vendor-type {
          color: var(--tf-gray-400);
          font-size: var(--tf-small);
          margin-top: var(--tf-space-1);
        }

        .tf-vendor-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--tf-space-1);
        }

        .tf-subscription-tier {
          background: var(--tf-trust-blue);
          color: var(--tf-white);
          padding: var(--tf-space-1) var(--tf-space-2);
          border-radius: var(--tf-radius-full);
          font-size: var(--tf-small);
          font-weight: 600;
          text-transform: capitalize;
        }

        .tf-vendor-contact {
          display: flex;
          gap: var(--tf-space-2);
          margin-bottom: var(--tf-space-3);
          font-size: var(--tf-small);
        }

        .tf-contact-label {
          color: var(--tf-gray-400);
        }

        .tf-contact-email {
          color: var(--tf-trust-blue);
        }

        .tf-vendor-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--tf-space-3);
          margin-bottom: var(--tf-space-4);
        }

        .tf-vendor-integrations {
          margin-bottom: var(--tf-space-4);
        }

        .tf-integrations-header {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
          margin-bottom: var(--tf-space-2);
        }

        .tf-integrations-list {
          display: flex;
          flex-direction: column;
          gap: var(--tf-space-2);
        }

        .tf-integration-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--tf-space-2);
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--tf-radius);
          font-size: var(--tf-small);
        }

        .tf-integration-name {
          color: var(--tf-white);
        }

        .tf-vendor-actions {
          display: flex;
          gap: var(--tf-space-2);
          margin-bottom: var(--tf-space-3);
        }

        .tf-vendor-activity {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-integrations-container {
          display: flex;
          flex-direction: column;
          gap: var(--tf-space-3);
        }

        .tf-integration-card {
          background: var(--tf-midnight);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--tf-radius-lg);
          padding: var(--tf-space-4);
        }

        .tf-integration-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--tf-space-3);
        }

        .tf-integration-vendor {
          color: var(--tf-gray-400);
          font-size: var(--tf-small);
          margin-top: var(--tf-space-1);
        }

        .tf-integration-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--tf-space-3);
          margin-bottom: var(--tf-space-3);
        }

        .tf-detail-label {
          color: var(--tf-gray-400);
          font-size: var(--tf-small);
        }

        .tf-detail-value {
          color: var(--tf-white);
          font-size: var(--tf-small);
          font-weight: 600;
        }

        .tf-integration-last-sync {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
          margin-bottom: var(--tf-space-3);
        }

        .tf-integration-actions {
          display: flex;
          gap: var(--tf-space-2);
        }

        .tf-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--tf-space-4);
        }

        .tf-metric-card-wide {
          grid-column: span 2;
        }

        .tf-vendor-performance-chart {
          display: flex;
          flex-direction: column;
          gap: var(--tf-space-4);
          margin-top: var(--tf-space-4);
        }

        .tf-vendor-performance-item {
          padding: var(--tf-space-3);
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--tf-radius);
        }

        .tf-vendor-name {
          font-weight: 600;
          margin-bottom: var(--tf-space-2);
        }

        .tf-performance-bars {
          display: flex;
          flex-direction: column;
          gap: var(--tf-space-2);
        }

        .tf-performance-bar {
          display: flex;
          align-items: center;
          gap: var(--tf-space-3);
        }

        .tf-bar-label {
          min-width: 100px;
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
        }

        .tf-bar-container {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--tf-space-2);
        }

        .tf-bar {
          height: 8px;
          border-radius: var(--tf-radius-full);
          transition: width var(--tf-duration-normal) var(--tf-easing-smooth);
        }

        .tf-bar-success {
          background: var(--tf-success-green);
        }

        .tf-bar-uptime {
          background: var(--tf-trust-blue);
        }

        .tf-bar-value {
          min-width: 40px;
          font-size: var(--tf-small);
          font-weight: 600;
          text-align: right;
        }

        .tf-settings-container {
          max-width: 800px;
        }

        .tf-settings-section {
          margin-bottom: var(--tf-space-6);
          padding-bottom: var(--tf-space-4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tf-settings-section:last-child {
          border-bottom: none;
        }

        @media (max-width: 768px) {
          .tf-vendors-grid {
            grid-template-columns: 1fr;
          }

          .tf-vendor-metrics {
            grid-template-columns: 1fr;
          }

          .tf-integration-details {
            grid-template-columns: 1fr;
          }

          .tf-vendor-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--tf-space-2);
          }

          .tf-vendor-status {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default VendorPortalPage;
