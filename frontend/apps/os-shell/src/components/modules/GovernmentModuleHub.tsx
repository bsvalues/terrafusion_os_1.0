/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION GOVERNMENT MODULE HUB
 * Elite Government Operations Center for PhD-Level Users
 * Complete Module Ecosystem • Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import { useEffect, useState } from 'react';
import { QuantumModule, quantumModuleManager } from '../../services/QuantumModuleManager';
import './government-module-hub.css';

interface ModuleHubState {
  modules: QuantumModule[];
  activeModules: QuantumModule[];
  selectedTier: 'ALL' | 'Tier1' | 'Tier2' | 'Tier3';
  selectedCategory: 'ALL' | 'Government' | 'AI' | 'Analysis' | 'Security' | 'Workflow';
  loading: boolean;
  searchQuery: string;
}

interface ModuleMetrics {
  totalModules: number;
  activeModules: number;
  quantumOptimization: number;
  systemEfficiency: number;
  governmentCompliance: number;
}

export default function GovernmentModuleHub() {
  const [hubState, setHubState] = useState<ModuleHubState>({
    modules: [],
    activeModules: [],
    selectedTier: 'ALL',
    selectedCategory: 'ALL',
    loading: true,
    searchQuery: '',
  });

  const [moduleMetrics, setModuleMetrics] = useState<ModuleMetrics>({
    totalModules: 0,
    activeModules: 0,
    quantumOptimization: 949,
    systemEfficiency: 97.5,
    governmentCompliance: 99.8,
  });

  const [showModuleDetails, setShowModuleDetails] = useState<string | null>(null);

  // Initialize module hub
  useEffect(() => {
    initializeGovernmentModuleHub();
  }, []);

  const initializeGovernmentModuleHub = async () => {
    try {
      setHubState((prev) => ({ ...prev, loading: true }));

      // Initialize quantum module manager
      await quantumModuleManager.initialize();

      // Load all modules
      const allModules = quantumModuleManager.getAllModules();
      const activeModules = quantumModuleManager.getActiveModules();

      setHubState((prev) => ({
        ...prev,
        modules: allModules,
        activeModules: activeModules,
        loading: false,
      }));

      setModuleMetrics({
        totalModules: allModules.length,
        activeModules: activeModules.length,
        quantumOptimization: 949,
        systemEfficiency: calculateSystemEfficiency(allModules),
        governmentCompliance: 99.8,
      });

      console.log('🏛️ Government Module Hub initialized with excellence!');
    } catch (error) {
      console.error('❌ Failed to initialize Government Module Hub:', error);
      setHubState((prev) => ({ ...prev, loading: false }));
    }
  };

  const calculateSystemEfficiency = (modules: QuantumModule[]): number => {
    if (modules.length === 0) return 0;
    const totalQuantumLevel = modules.reduce((sum, module) => sum + module.quantumLevel, 0);
    return (totalQuantumLevel / modules.length) * 1.05; // Government enhancement multiplier
  };

  const handleModuleLaunch = async (moduleId: string) => {
    const success = await quantumModuleManager.launchModule(moduleId);
    if (success) {
      // Refresh active modules
      const activeModules = quantumModuleManager.getActiveModules();
      setHubState((prev) => ({ ...prev, activeModules }));
      setModuleMetrics((prev) => ({ ...prev, activeModules: activeModules.length }));
    }
  };

  const handleModuleStop = async (moduleId: string) => {
    const success = await quantumModuleManager.stopModule(moduleId);
    if (success) {
      // Refresh active modules
      const activeModules = quantumModuleManager.getActiveModules();
      setHubState((prev) => ({ ...prev, activeModules }));
      setModuleMetrics((prev) => ({ ...prev, activeModules: activeModules.length }));
    }
  };

  const getFilteredModules = (): QuantumModule[] => {
    let filtered = hubState.modules;

    // Filter by tier
    if (hubState.selectedTier !== 'ALL') {
      filtered = filtered.filter((module) => module.tier === hubState.selectedTier);
    }

    // Filter by category
    if (hubState.selectedCategory !== 'ALL') {
      filtered = filtered.filter((module) => module.category === hubState.selectedCategory);
    }

    // Filter by search query
    if (hubState.searchQuery) {
      const query = hubState.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (module) =>
          module.displayName.toLowerCase().includes(query) ||
          module.description.toLowerCase().includes(query) ||
          module.name.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => a.priority - b.priority);
  };

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'Tier1':
        return 'var(--tf-quantum-cyan)'; // Terra-cyan for core
      case 'Tier2':
        return 'var(--success-green)'; // Terra-green for essential
      case 'Tier3':
        return 'var(--tf-network-blue)'; // Terra-blue for extended
      default:
        return 'var(--tf-text-primary)fff';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'var(--success-green)';
      case 'loading':
        return 'var(--warning-amber)';
      case 'error':
        return 'var(--error-red)';
      default:
        return 'var(--gray-500)';
    }
  };

  if (hubState.loading) {
    return (
      <div className='tf-gov-hub-loading'>
        <div className='tf-quantum-loader'>
          <div className='tf-loader-ring'></div>
          <div className='tf-loader-text'>Initializing Government Modules...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='tf-government-module-hub'>
      <header className='tf-hub-header'>
        <div className='tf-header-content'>
          <div className='tf-header-title'>
            <div className='tf-hub-icon'>🏛️</div>
            <div>
              <h1>Government Module Hub</h1>
              <p>Complete Module Ecosystem • Government. Transcended.</p>
            </div>
          </div>

          <div className='tf-header-metrics'>
            <div className='tf-metric-card'>
              <div className='tf-metric-value'>{moduleMetrics.totalModules}</div>
              <div className='tf-metric-label'>Total Modules</div>
            </div>
            <div className='tf-metric-card'>
              <div className='tf-metric-value'>{moduleMetrics.activeModules}</div>
              <div className='tf-metric-label'>Active Modules</div>
            </div>
            <div className='tf-metric-card'>
              <div className='tf-metric-value'>{moduleMetrics.quantumOptimization}</div>
              <div className='tf-metric-label'>Quantum Factor</div>
            </div>
            <div className='tf-metric-card'>
              <div className='tf-metric-value'>{moduleMetrics.systemEfficiency.toFixed(1)}%</div>
              <div className='tf-metric-label'>System Efficiency</div>
            </div>
          </div>
        </div>
      </header>

      <div className='tf-hub-controls'>
        <div className='tf-search-section'>
          <input
            type='text'
            placeholder='Search government modules...'
            value={hubState.searchQuery}
            onChange={(e) => setHubState((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className='tf-search-input'
          />
        </div>

        <div className='tf-filter-section'>
          <div className='tf-filter-group'>
            <label>Government Tier:</label>
            <select
              value={hubState.selectedTier}
              onChange={(e) =>
                setHubState((prev) => ({ ...prev, selectedTier: e.target.value as any }))
              }
              className='tf-filter-select'
            >
              <option value='ALL'>All Tiers</option>
              <option value='Tier1'>Tier 1 - Core Government</option>
              <option value='Tier2'>Tier 2 - Essential Operations</option>
              <option value='Tier3'>Tier 3 - Extended Features</option>
            </select>
          </div>

          <div className='tf-filter-group'>
            <label>Category:</label>
            <select
              value={hubState.selectedCategory}
              onChange={(e) =>
                setHubState((prev) => ({ ...prev, selectedCategory: e.target.value as any }))
              }
              className='tf-filter-select'
            >
              <option value='ALL'>All Categories</option>
              <option value='Government'>Government Operations</option>
              <option value='AI'>AI & Intelligence</option>
              <option value='Analysis'>Analysis & Analytics</option>
              <option value='Security'>Security & Compliance</option>
              <option value='Workflow'>Workflow & Automation</option>
            </select>
          </div>
        </div>
      </div>

      <main className='tf-hub-content'>
        <div className='tf-modules-grid'>
          {getFilteredModules().map((module) => (
            <div
              key={module.id}
              className={`tf-module-card ${module.status === 'active' ? 'tf-active' : ''}`}
              onClick={() =>
                setShowModuleDetails(showModuleDetails === module.id ? null : module.id)
              }
            >
              <div className='tf-module-header'>
                <div className='tf-module-icon'>{module.icon}</div>
                <div className='tf-module-info'>
                  <h3 className='tf-module-name'>{module.displayName}</h3>
                  <p className='tf-module-description'>{module.description}</p>
                </div>
                <div className='tf-module-status' style={{ color: getStatusColor(module.status) }}>
                  {module.status.toUpperCase()}
                </div>
              </div>

              <div className='tf-module-meta'>
                <div className='tf-module-badges'>
                  <span className='tf-tier-badge' style={{ color: getTierColor(module.tier) }}>
                    {module.tier}
                  </span>
                  <span className='tf-category-badge'>{module.category}</span>
                  <span className='tf-quantum-badge'>Q{module.quantumLevel}</span>
                </div>
                <div className='tf-module-version'>v{module.version}</div>
              </div>

              {showModuleDetails === module.id && (
                <div className='tf-module-details'>
                  <div className='tf-detail-section'>
                    <h4>Technical Specifications</h4>
                    <ul>
                      <li>Quantum Level: {module.quantumLevel}/100</li>
                      <li>Priority: {module.priority}</li>
                      <li>Core Module: {module.isCore ? 'Yes' : 'No'}</li>
                      <li>Launch Path: {module.launchPath}</li>
                    </ul>
                  </div>

                  {module.permissions.length > 0 && (
                    <div className='tf-detail-section'>
                      <h4>Required Permissions</h4>
                      <div className='tf-permission-tags'>
                        {module.permissions.map((permission, index) => (
                          <span key={index} className='tf-permission-tag'>
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {module.targetCounties && module.targetCounties.length > 0 && (
                    <div className='tf-detail-section'>
                      <h4>Target Counties</h4>
                      <div className='tf-county-tags'>
                        {module.targetCounties.map((county, index) => (
                          <span key={index} className='tf-county-tag'>
                            {county.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className='tf-module-actions'>
                    {module.status === 'active' ? (
                      <button
                        className='tf-action-btn tf-stop-btn'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModuleStop(module.id);
                        }}
                      >
                        🛑 Stop Module
                      </button>
                    ) : (
                      <button
                        className='tf-action-btn tf-launch-btn'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModuleLaunch(module.id);
                        }}
                        disabled={module.status === 'loading'}
                      >
                        {module.status === 'loading' ? '⏳ Loading...' : '🚀 Launch Module'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {getFilteredModules().length === 0 && (
          <div className='tf-no-modules'>
            <div className='tf-no-modules-icon'>🔍</div>
            <h3>No modules found</h3>
            <p>Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
}
