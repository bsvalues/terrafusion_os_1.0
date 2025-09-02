import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './PluginSidebar.css';

interface Plugin {
  id: string;
  name: string;
  tags?: string[];
  api: string;
  k8s: string;
  healthy?: boolean;
  launchCount?: number;
  errors?: string[];
  onboarding?: string[];
  codespacesUrl?: string;
  electronUrl?: string;
  entryPoint?: string;
  description?: string;
  version?: string;
  category?: string;
}

interface PluginHealthStatus {
  [key: string]: boolean;
}

interface PluginUsageData {
  [key: string]: number;
}

interface PluginErrorMap {
  [key: string]: string[];
}

interface PluginOnboardingHints {
  [key: string]: string[];
}

export function PluginSidebar() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const controllerRef = useRef<AbortController | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchPlugins = useCallback(async () => {
    // Cancel previous request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;

    try {
      setError(null);
      
      // Fetch plugin data
      const pluginRes = await fetch('/marketplace/plugins/sidebar.json', { signal });
      if (!pluginRes.ok) throw new Error('Failed to fetch plugins');
      const data: Plugin[] = await pluginRes.json();

      const pluginIds = data.map(p => p.id);

      // Parallel fetch for all metadata
      const [healthRes, usageRes, errorRes, onboardRes] = await Promise.all([
        fetch('/api/plugin-health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pluginIds),
          signal
        }),
        fetch('/api/launch-trends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pluginIds),
          signal
        }),
        fetch('/api/plugin-errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pluginIds),
          signal
        }),
        fetch('/api/plugin-onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pluginIds),
          signal
        })
      ]);

      // Parse responses with error handling
      const healthStatus: PluginHealthStatus = healthRes.ok ? await healthRes.json() : {};
      const usageData: PluginUsageData = usageRes.ok ? await usageRes.json() : {};
      const errorMap: PluginErrorMap = errorRes.ok ? await errorRes.json() : {};
      const onboardingHints: PluginOnboardingHints = onboardRes.ok ? await onboardRes.json() : {};

      // Merge all data
      const merged = data.map(plugin => ({
        ...plugin,
        healthy: healthStatus[plugin.id] ?? true,
        launchCount: usageData[plugin.id] ?? 0,
        errors: errorMap[plugin.id] ?? [],
        onboarding: onboardingHints[plugin.id] ?? []
      }));

      setPlugins(merged);
      setLoading(false);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
        setError(error.message || 'Failed to load plugins');
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchPlugins();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchPlugins, 30000); // 30 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [fetchPlugins, autoRefresh]);

  // Filter plugins based on debounced search
  const filtered = useMemo(() => {
    if (!debouncedSearch) return plugins;
    
    const searchLower = debouncedSearch.toLowerCase();
    return plugins.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.description?.toLowerCase().includes(searchLower) ||
      p.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
      p.category?.toLowerCase().includes(searchLower)
    );
  }, [plugins, debouncedSearch]);

  const handleLaunch = useCallback(async (plugin: Plugin, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    // Log launch telemetry
    try {
      const log = { 
        pluginId: plugin.id, 
        timestamp: new Date().toISOString(),
        launchMode: plugin.codespacesUrl ? 'codespaces' : plugin.electronUrl ? 'electron' : 'local'
      };
      
      await fetch('/api/plugin-launch-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
    } catch (error) {
      console.error('Failed to log launch:', error);
    }

    // Launch plugin
    if (plugin.codespacesUrl) {
      window.open(plugin.codespacesUrl, '_blank');
    } else if (plugin.electronUrl) {
      window.open(plugin.electronUrl, '_blank');
    } else if (plugin.entryPoint) {
      window.open(plugin.entryPoint, '_blank');
    } else {
      console.error('No launch URL available for plugin:', plugin.id);
    }
  }, []);

  const handlePluginClick = useCallback((plugin: Plugin, event: React.MouseEvent) => {
    // Don't open modal if clicking on action buttons
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }

    lastFocusedElementRef.current = document.activeElement as HTMLElement;
    setSelectedPlugin(plugin);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPlugin(null);
    
    // Restore focus
    setTimeout(() => {
      if (lastFocusedElementRef.current) {
        lastFocusedElementRef.current.focus();
      }
    }, 0);
  }, []);

  // Keyboard navigation for modal
  useEffect(() => {
    if (!selectedPlugin || !modalRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };

    // Focus trap
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    firstFocusable?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    modalRef.current.addEventListener('keydown', handleTabKey);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      modalRef.current?.removeEventListener('keydown', handleTabKey);
    };
  }, [selectedPlugin, handleCloseModal]);

  const getLaunchIcon = (plugin: Plugin) => {
    if (plugin.codespacesUrl) return '🌐';
    if (plugin.electronUrl) return '🖥️';
    return '📂';
  };

  const getLaunchTooltip = (plugin: Plugin) => {
    if (plugin.codespacesUrl) return 'Launch in GitHub Codespaces';
    if (plugin.electronUrl) return 'Launch Electron App';
    return 'Launch locally';
  };

  return (
    <div className="plugin-sidebar" role="complementary" aria-label="Plugin Marketplace">
      <div className="sidebar-header"><>

        <h2>Plugin Marketplace</h2>
        <button
</>

          className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
          onClick={() => setAutoRefresh(!autoRefresh)}
          aria-label={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          title={autoRefresh ? 'Auto-refresh enabled (30s)' : 'Auto-refresh disabled'}
        >
          <span className={autoRefresh ? 'spinning' : ''}>🔄</span>
        </button>
      </div>

      <input
        className="sidebar-search"
        type="text"
        placeholder="Search plugins..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search plugins"
        aria-describedby="search-results"
      />
      
      <div id="search-results" className="sr-only" aria-live="polite">
        {filtered.length} plugins found
      </div>

      {loading && <div className="loading-spinner">Loading plugins...</div>}
      {error && <div className="error-message" role="alert">Error: {error}</div>}

      <div className="plugin-list" role="list">
        {filtered.map(plugin => (
          <div
            key={plugin.id}
            className={`plugin-item ${plugin.healthy === false ? 'plugin-unhealthy' : ''}`}
            onClick={(e) => handlePluginClick(plugin, e)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePluginClick(plugin, e as any);
              }
            }}
            tabIndex={0}
            role="listitem"
            aria-label={`${plugin.name} - ${plugin.healthy === false ? 'Unhealthy' : 'Healthy'} - ${plugin.launchCount} launches`}
          >
            <div className="plugin-info">
              <span className="plugin-name">{plugin.name}</span>
              {plugin.healthy === false && (
                <span className="health-indicator" title="Health Check Failed" aria-label="Health check failed">
                  🔴
                </span>
              )}
              <small className="launch-count">({plugin.launchCount})</small>
            </div>
            
            <button 
              className="launch-button quick-launch"
              onClick={(e) => handleLaunch(plugin, e)}
              aria-label={`${getLaunchTooltip(plugin)} - ${plugin.name}`}
              title={getLaunchTooltip(plugin)}
            >
              {getLaunchIcon(plugin)}
            </button>
          </div>
        ))}
      </div>

      {selectedPlugin && (
        <div 
          className="modal-overlay"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            ref={modalRef}
            className="plugin-detail modal-content"
            onClick={(e) => e.stopPropagation()}
            role="document"
          ><>

            <h2 id="modal-title">{selectedPlugin.name}</h2>
            
            <div
</>
className="detail-section">
              <p><strong>Tags:</strong> {selectedPlugin.tags?.join(', ') || 'None'}</p>
              <p><strong>API:</strong> <code>{selectedPlugin.api}</code></p>
              <p><strong>K8s:</strong> <code>{selectedPlugin.k8s}</code></p>
              <p><strong>Status:</strong> 
                <span className={selectedPlugin.healthy === false ? 'status-unhealthy' : 'status-healthy'}>
                  {selectedPlugin.healthy === false ? 'Unhealthy' : 'Healthy'}
                </span>
              </p>
              <p><strong>Launches:</strong> {selectedPlugin.launchCount}</p>
              
              {selectedPlugin.errors && selectedPlugin.errors.length > 0 && (
                <div className="error-section"><>

                  <strong>Recent Errors:</strong>
                  <ul
</>
</>>
                    {selectedPlugin.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedPlugin.onboarding && selectedPlugin.onboarding.length > 0 && (
                <div className="onboarding-section"><>

                  <strong>Setup Tips:</strong>
                  <ul
</>
</>>
                    {selectedPlugin.onboarding.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-actions"><>

              <button 
                className="primary-button"
                onClick={() => handleLaunch(selectedPlugin)}
              >
                Launch {getLaunchIcon(selectedPlugin)}
              </button>
              <button
</>

                className="secondary-button"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}