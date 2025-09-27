import React, { useState, useEffect } from 'react';
import { useModuleService, TerraFusionModule } from '../services/ModuleService';

interface ModuleDetailProps {
  moduleId: string;
  onClose: () => void;
  onInstall: (moduleId: string) => void;
  onUninstall: (moduleId: string) => void;
}

export const ModuleDetail: React.FC<ModuleDetailProps> = ({ 
  moduleId, 
  onClose, 
  onInstall, 
  onUninstall 
}) => {
  const [module, setModule] = useState<TerraFusionModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { service, modules } = useModuleService();

  useEffect(() => {
    loadModuleDetails();
  }, [moduleId, modules]);

  const loadModuleDetails = async () => {
    try {
      setLoading(true);
      // Use modules from the hook first, then fallback to service scan
      let allModules = modules;
      if (allModules.length === 0) {
        allModules = await service.scanModules();
      }
      const moduleData = allModules.find((m: TerraFusionModule) => m.name === moduleId || m.id === moduleId);
      setModule(moduleData || null);
    } catch (error) {
      console.error('Failed to load module details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const parsePrice = (priceString: string | number): number => {
    if (typeof priceString === 'number') return priceString;
    // Convert "$2300/year" to annual number
    const match = priceString.match(/\$(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  if (loading) {
    return (
      <div className="tf-module-detail-overlay">
        <div className="tf-module-detail-modal">
          <div className="tf-loading">Loading module details...</div>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="tf-module-detail-overlay">
        <div className="tf-module-detail-modal">
          <div className="tf-error">Module not found</div>
          <button onClick={onClose} className="tf-close-btn">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tf-module-detail-overlay">
      <div className="tf-module-detail-modal">
        {/* Header */}
        <div className="tf-module-detail-header">
          <div className="tf-module-title-section">
            <h2>{module.name}</h2>
            <span className={`tf-module-status ${module.status || 'available'}`}>
              {module.status === 'installed' ? '✅ Installed' : '📦 Available'}
            </span>
          </div>
          <button onClick={onClose} className="tf-close-btn">✕</button>
        </div>

        {/* Navigation Tabs */}
        <div className="tf-module-tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'features' ? 'active' : ''}
            onClick={() => setActiveTab('features')}
          >
            Features
          </button>
          <button 
            className={activeTab === 'technical' ? 'active' : ''}
            onClick={() => setActiveTab('technical')}
          >
            Technical
          </button>
          <button 
            className={activeTab === 'compliance' ? 'active' : ''}
            onClick={() => setActiveTab('compliance')}
          >
            Compliance
          </button>
        </div>

        {/* Tab Content */}
        <div className="tf-module-content">
          {activeTab === 'overview' && (
            <div className="tf-overview-tab">
              <div className="tf-module-description-section">
                <h3>Description</h3>
                <p>{module.description || 'No description available.'}</p>
              </div>

              <div className="tf-module-pricing-section">
                <h3>Pricing</h3>
                <div className="tf-pricing-grid">
                  <div className="tf-pricing-card">
                    <h4>Monthly Subscription</h4>
                    <div className="tf-price">{formatCurrency(parsePrice(module.price) || module.monthlyPrice || 0)}</div>
                    <span className="tf-price-period">per month</span>
                  </div>
                  {module.annualPrice && (
                    <div className="tf-pricing-card annual">
                      <h4>Annual Subscription</h4>
                      <div className="tf-price">{formatCurrency(module.annualPrice)}</div>
                      <span className="tf-price-period">per year</span>
                      <span className="tf-savings">Save 10%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="tf-module-category-section">
                <h3>Classification</h3>
                <div className="tf-classification-grid">
                  <div className="tf-classification-item">
                    <span className="tf-label">Category:</span>
                    <span className="tf-value">{module.category || 'General'}</span>
                  </div>
                  {module.tier && (
                    <div className="tf-classification-item">
                      <span className="tf-label">Tier:</span>
                      <span className="tf-value">{module.tier}</span>
                    </div>
                  )}
                  <div className="tf-classification-item">
                    <span className="tf-label">Type:</span>
                    <span className="tf-value">{module.type || 'Government Module'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="tf-features-tab">
              <h3>Module Features</h3>
              <div className="tf-features-grid">
                {module.features && module.features.length > 0 ? (
                  module.features.map((feature: string, index: number) => (
                    <div key={index} className="tf-feature-item">
                      <span className="tf-feature-icon">✅</span>
                      <span className="tf-feature-text">{feature}</span>
                    </div>
                  ))
                ) : (
                  <div className="tf-no-features">
                    <p>Feature list not available. This module provides government-specific functionality.</p>
                  </div>
                )}
              </div>

              {module.endpoints && (
                <div className="tf-endpoints-section">
                  <h3>Available Endpoints</h3>
                  <div className="tf-endpoints-list">
                    {Object.entries(module.endpoints).map(([type, path], index) => (
                      <div key={index} className="tf-endpoint-item">
                        <span className="tf-endpoint-method">GET</span>
                        <span className="tf-endpoint-path">{path}</span>
                        <span className="tf-endpoint-type">{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="tf-technical-tab">
              <h3>Technical Specifications</h3>
              
              <div className="tf-tech-grid">
                <div className="tf-tech-section">
                  <h4>System Requirements</h4>
                  <div className="tf-tech-item">
                    <span className="tf-tech-label">Platform:</span>
                    <span className="tf-tech-value">TerraFusion OS</span>
                  </div>
                  <div className="tf-tech-item">
                    <span className="tf-tech-label">Framework:</span>
                    <span className="tf-tech-value">.NET 8.0 + Rust Engine</span>
                  </div>
                  <div className="tf-tech-item">
                    <span className="tf-tech-label">Hot-Swap:</span>
                    <span className="tf-tech-value">✅ Supported</span>
                  </div>
                </div>

                <div className="tf-tech-section">
                  <h4>API Integration</h4>
                  {module.endpoints ? (
                    <div>
                      <div className="tf-tech-item">
                        <span className="tf-tech-label">Health Check:</span>
                        <span className="tf-tech-value">/modules/{module.name}/health</span>
                      </div>
                      <div className="tf-tech-item">
                        <span className="tf-tech-label">API Base:</span>
                        <span className="tf-tech-value">/modules/{module.name}/api</span>
                      </div>
                      <div className="tf-tech-item">
                        <span className="tf-tech-label">UI Route:</span>
                        <span className="tf-tech-value">/modules/{module.name}/ui</span>
                      </div>
                    </div>
                  ) : (
                    <p>API documentation not available</p>
                  )}
                </div>
              </div>

              {module.permissions && (
                <div className="tf-permissions-section">
                  <h4>Required Permissions</h4>
                  <div className="tf-permissions-list">
                    {module.permissions.map((permission: string, index: number) => (
                      <div key={index} className="tf-permission-item">
                        <span className="tf-permission-icon">🔐</span>
                        <span className="tf-permission-text">{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="tf-compliance-tab">
              <h3>Government Compliance</h3>
              
              <div className="tf-compliance-grid">
                <div className="tf-compliance-section">
                  <h4>Security Standards</h4>
                  <div className="tf-compliance-badges">
                    <span className="tf-compliance-badge verified">✅ FISMA Compliant</span>
                    <span className="tf-compliance-badge verified">✅ NIST-800-53</span>
                    <span className="tf-compliance-badge verified">✅ Section508</span>
                    <span className="tf-compliance-badge verified">✅ WCAG 2.1</span>
                    <span className="tf-compliance-badge verified">✅ SOC2 Type II</span>
                  </div>
                </div>

                <div className="tf-compliance-section">
                  <h4>Government Certifications</h4>
                  <div className="tf-cert-list">
                    <div className="tf-cert-item">
                      <span className="tf-cert-icon">🏛️</span>
                      <span className="tf-cert-text">Government Edition Certified</span>
                    </div>
                    <div className="tf-cert-item">
                      <span className="tf-cert-icon">🔒</span>
                      <span className="tf-cert-text">Multi-Level Security Classification</span>
                    </div>
                    <div className="tf-cert-item">
                      <span className="tf-cert-icon">📊</span>
                      <span className="tf-cert-text">Real-time Audit Logging</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tf-security-details">
                <h4>Security Features</h4>
                <ul className="tf-security-list">
                  <li>AES-256-GCM Encryption</li>
                  <li>Advanced Threat Monitoring</li>
                  <li>Role-based Access Control</li>
                  <li>Government-grade Data Protection</li>
                  <li>Continuous Security Validation</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="tf-module-actions">
          {module.status === 'installed' ? (
            <div className="tf-installed-actions">
              <button className="tf-btn-secondary">Configure</button>
              <button className="tf-btn-warning" onClick={() => onUninstall(module.name)}>
                Uninstall Module
              </button>
            </div>
          ) : (
            <div className="tf-install-actions">
              <button className="tf-btn-primary" onClick={() => onInstall(module.name)}>
                Install Module - {formatCurrency(parsePrice(module.price) || module.monthlyPrice || 0)}/month
              </button>
              {module.annualPrice && (
                <button className="tf-btn-secondary">
                  Install Annual - {formatCurrency(module.annualPrice)}/year
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};