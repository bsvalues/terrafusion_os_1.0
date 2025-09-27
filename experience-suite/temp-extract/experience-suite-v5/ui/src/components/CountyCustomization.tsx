import React, { useState, useEffect } from 'react';

interface CountyConfig {
  countyId: string;
  countyName: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
  };
  modules: {
    [key: string]: {
      enabled: boolean;
      config: any;
    };
  };
  features: {
    enableAI: boolean;
    enableRustEngine: boolean;
    complianceLevel: 'Standard' | 'FISMA' | 'Top Secret';
  };
}

export const CountyCustomization: React.FC = () => {
  const [currentCounty, setCurrentCounty] = useState<CountyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    loadCountyConfig();
  }, []);

  const loadCountyConfig = async () => {
    try {
      setLoading(true);
      // Mock Benton County configuration
      const config: CountyConfig = {
        countyId: 'benton-county-wa',
        countyName: 'Benton County, Washington',
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af',
          logo: '/assets/benton-county-logo.png'
        },
        modules: {
          'ai-swarm': { enabled: true, config: { agents: 50000 } },
          'government-edition': { enabled: true, config: { compliance: 'FISMA' } },
          'gis-pro': { enabled: true, config: { parcels: 89247 } },
          'terra-collections': { enabled: false, config: {} }
        },
        features: {
          enableAI: true,
          enableRustEngine: true,
          complianceLevel: 'FISMA'
        }
      };
      setCurrentCounty(config);
    } catch (error) {
      console.error('Failed to load county configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCountyConfig = async (updates: Partial<CountyConfig>) => {
    if (!currentCounty) return;

    try {
      const updatedConfig = { ...currentCounty, ...updates };
      setCurrentCounty(updatedConfig);
      
      // Mock API call to save configuration
      const response = await fetch(`/api/counties/${currentCounty.countyId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });

      if (response.ok) {
        alert('County configuration updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update county configuration:', error);
      alert('Failed to update configuration');
    }
  };

  if (loading) {
    return (
      <div className="tf-county-customization">
        <h2>🏛️ County Customization</h2>
        <div className="tf-loading">Loading county configuration...</div>
      </div>
    );
  }

  if (!currentCounty) {
    return (
      <div className="tf-county-customization">
        <h2>🏛️ County Customization</h2>
        <div className="tf-error">Failed to load county configuration</div>
      </div>
    );
  }

  return (
    <div className="tf-county-customization">
      <div className="tf-county-header">
        <h2>🏛️ County Customization</h2>
        <p className="tf-county-subtitle">Customize TerraFusion OS for {currentCounty.countyName}</p>
      </div>

      {/* Navigation Tabs */}
      <div className="tf-county-tabs">
        <button 
          className={activeSection === 'general' ? 'active' : ''}
          onClick={() => setActiveSection('general')}
        >
          General Settings
        </button>
        <button 
          className={activeSection === 'theme' ? 'active' : ''}
          onClick={() => setActiveSection('theme')}
        >
          Theme & Branding
        </button>
        <button 
          className={activeSection === 'modules' ? 'active' : ''}
          onClick={() => setActiveSection('modules')}
        >
          Module Configuration
        </button>
        <button 
          className={activeSection === 'compliance' ? 'active' : ''}
          onClick={() => setActiveSection('compliance')}
        >
          Compliance & Security
        </button>
      </div>

      {/* Tab Content */}
      <div className="tf-county-content">
        {activeSection === 'general' && (
          <div className="tf-general-settings">
            <h3>General Settings</h3>
            
            <div className="tf-setting-group">
              <label>County Name</label>
              <input
                type="text"
                value={currentCounty.countyName}
                onChange={(e) => updateCountyConfig({ countyName: e.target.value })}
                className="tf-input"
              />
            </div>

            <div className="tf-setting-group">
              <label>County ID</label>
              <input
                type="text"
                value={currentCounty.countyId}
                disabled
                className="tf-input disabled"
              />
              <span className="tf-help-text">County ID cannot be changed after setup</span>
            </div>

            <div className="tf-feature-toggles">
              <h4>Core Features</h4>
              
              <div className="tf-toggle-item">
                <label>
                  <input
                    type="checkbox"
                    checked={currentCounty.features.enableAI}
                    onChange={(e) => updateCountyConfig({
                      features: { ...currentCounty.features, enableAI: e.target.checked }
                    })}
                  />
                  <span className="tf-toggle-label">Enable AI Agent Swarm (50,000+ Agents)</span>
                </label>
              </div>

              <div className="tf-toggle-item">
                <label>
                  <input
                    type="checkbox"
                    checked={currentCounty.features.enableRustEngine}
                    onChange={(e) => updateCountyConfig({
                      features: { ...currentCounty.features, enableRustEngine: e.target.checked }
                    })}
                  />
                  <span className="tf-toggle-label">Enable Elite Rust Performance Engine</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'theme' && (
          <div className="tf-theme-settings">
            <h3>Theme & Branding</h3>
            
            <div className="tf-theme-preview">
              <h4>Current Theme Preview</h4>
              <div 
                className="tf-theme-demo"
                style={{
                  backgroundColor: currentCounty.theme.primaryColor,
                  color: 'white'
                }}
              >
                <div className="tf-demo-header">
                  {currentCounty.countyName} - TerraFusion OS
                </div>
                <div 
                  className="tf-demo-content"
                  style={{
                    backgroundColor: currentCounty.theme.secondaryColor
                  }}
                >
                  Sample government interface with your branding
                </div>
              </div>
            </div>

            <div className="tf-color-settings">
              <div className="tf-setting-group">
                <label>Primary Color</label>
                <div className="tf-color-input">
                  <input
                    type="color"
                    value={currentCounty.theme.primaryColor}
                    onChange={(e) => updateCountyConfig({
                      theme: { ...currentCounty.theme, primaryColor: e.target.value }
                    })}
                  />
                  <input
                    type="text"
                    value={currentCounty.theme.primaryColor}
                    onChange={(e) => updateCountyConfig({
                      theme: { ...currentCounty.theme, primaryColor: e.target.value }
                    })}
                    className="tf-input"
                  />
                </div>
              </div>

              <div className="tf-setting-group">
                <label>Secondary Color</label>
                <div className="tf-color-input">
                  <input
                    type="color"
                    value={currentCounty.theme.secondaryColor}
                    onChange={(e) => updateCountyConfig({
                      theme: { ...currentCounty.theme, secondaryColor: e.target.value }
                    })}
                  />
                  <input
                    type="text"
                    value={currentCounty.theme.secondaryColor}
                    onChange={(e) => updateCountyConfig({
                      theme: { ...currentCounty.theme, secondaryColor: e.target.value }
                    })}
                    className="tf-input"
                  />
                </div>
              </div>

              <div className="tf-setting-group">
                <label>County Logo URL</label>
                <input
                  type="text"
                  value={currentCounty.theme.logo}
                  onChange={(e) => updateCountyConfig({
                    theme: { ...currentCounty.theme, logo: e.target.value }
                  })}
                  className="tf-input"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'modules' && (
          <div className="tf-module-settings">
            <h3>Module Configuration</h3>
            
            <div className="tf-module-config-grid">
              {Object.entries(currentCounty.modules).map(([moduleId, moduleConfig]) => (
                <div key={moduleId} className="tf-module-config-card">
                  <div className="tf-module-config-header">
                    <h4>{moduleId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                    <label className="tf-switch">
                      <input
                        type="checkbox"
                        checked={moduleConfig.enabled}
                        onChange={(e) => {
                          const updatedModules = {
                            ...currentCounty.modules,
                            [moduleId]: { ...moduleConfig, enabled: e.target.checked }
                          };
                          updateCountyConfig({ modules: updatedModules });
                        }}
                      />
                      <span className="tf-slider"></span>
                    </label>
                  </div>
                  
                  <div className="tf-module-config-details">
                    <span className={`tf-status ${moduleConfig.enabled ? 'enabled' : 'disabled'}`}>
                      {moduleConfig.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    
                    {moduleConfig.config && Object.keys(moduleConfig.config).length > 0 && (
                      <div className="tf-config-preview">
                        {Object.entries(moduleConfig.config).map(([key, value]) => (
                          <div key={key} className="tf-config-item">
                            <span>{key}:</span>
                            <span>{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'compliance' && (
          <div className="tf-compliance-settings">
            <h3>Compliance & Security</h3>
            
            <div className="tf-compliance-level">
              <h4>Compliance Level</h4>
              <div className="tf-compliance-options">
                {['Standard', 'FISMA', 'Top Secret'].map((level) => (
                  <label key={level} className="tf-radio-option">
                    <input
                      type="radio"
                      name="complianceLevel"
                      value={level}
                      checked={currentCounty.features.complianceLevel === level}
                      onChange={(e) => updateCountyConfig({
                        features: { ...currentCounty.features, complianceLevel: e.target.value as any }
                      })}
                    />
                    <span className="tf-radio-label">{level}</span>
                    <span className="tf-radio-description">
                      {level === 'Standard' && 'Basic government compliance'}
                      {level === 'FISMA' && 'Federal Information Security Management Act'}
                      {level === 'Top Secret' && 'Highest level government security'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="tf-security-features">
              <h4>Active Security Features</h4>
              <div className="tf-security-grid">
                <div className="tf-security-item active">
                  <span className="tf-security-icon">🔒</span>
                  <span>AES-256-GCM Encryption</span>
                </div>
                <div className="tf-security-item active">
                  <span className="tf-security-icon">🛡️</span>
                  <span>Advanced Threat Monitoring</span>
                </div>
                <div className="tf-security-item active">
                  <span className="tf-security-icon">📊</span>
                  <span>Real-time Security Analytics</span>
                </div>
                <div className="tf-security-item active">
                  <span className="tf-security-icon">🔐</span>
                  <span>Multi-Level Classification</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Actions */}
      <div className="tf-county-actions">
        <button
          onClick={() => updateCountyConfig(currentCounty)}
          className="tf-save-btn"
        >
          Save Configuration
        </button>
        <button
          onClick={loadCountyConfig}
          className="tf-reset-btn"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
};