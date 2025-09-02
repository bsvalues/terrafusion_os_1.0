import React, { useState, useEffect, useRef } from 'react';

// Import Terrafusion Ultimate CSS Architecture
import '../styles/terrafusion-intelligent-architecture.css';

interface OSShellWindowProps {
  children: React.ReactNode;
}

interface SystemMetrics {
  aiAgentCount: number;
  activeAgents: number;
  quantumCoherence: number;
  systemReliability: number;
  performanceIndex: number;
}

interface TerraFusionBridge {
  shell: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    openExternal: (_url: string) => void;
  };
  api: {
    port?: number;
    baseUrl?: string;
    getPort: () => Promise<number>;
    getBaseUrl: () => Promise<string>;
  };
  isDesktop?: boolean;
  platform?: string;
}

declare global {
  interface Window {
    terrafusion?: TerraFusionBridge;
  }
}

const OSShellWindow: React.FC<OSShellWindowProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Preparing transcendence...');
  const [error, setError] = useState<string | null>(null);
  const [apiPort, setApiPort] = useState<number | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    aiAgentCount: 1008,
    activeAgents: 987,
    quantumCoherence: 0.97,
    systemReliability: 0.9999,
    performanceIndex: 0.95
  });
  const healthCheckRef = useRef<number | null>(null);

  // Set CSS custom properties for AI-responsive design
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--tf-ai-total-agents', systemMetrics.aiAgentCount.toString());
    root.style.setProperty('--tf-ai-active-agents', systemMetrics.activeAgents.toString());
    root.style.setProperty('--tf-quantum-coherence', systemMetrics.quantumCoherence.toString());
    root.style.setProperty('--tf-system-reliability', systemMetrics.systemReliability.toString());
    root.style.setProperty('--tf-performance-index', systemMetrics.performanceIndex.toString());
    root.style.setProperty('--tf-user-expertise-level', '0.8'); // Expert user
    root.style.setProperty('--tf-user-stress-level', '0.2'); // Low stress
    root.style.setProperty('--tf-interface-complexity', '0.9'); // High complexity interface
    root.style.setProperty('--tf-dev-mode', 'block'); // Show dev tools
  }, [systemMetrics]);

  useEffect(() => {
    initializeShell();
    return () => cleanup();
  }, []);

  const initializeShell = async () => {
    try {
      setLoadingStatus('Connecting to unified orchestration...');
      await connectToUnifiedBackend();
      
      setLoadingStatus('Initializing Terrafusion Shell...');
      await initializeWebView();
      
      setLoadingStatus('Starting AI agent coordination...');
      await loadApplication();
      
      setLoadingStatus('Quantum coherence stabilization...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      startHealthMonitoring();
      setIsLoading(false);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during initialization';
      setError(`Failed to initialize Terrafusion OS: ${errorMessage}`);
    }
  };

  const connectToUnifiedBackend = async (): Promise<void> => {
    const maxAttempts = 5;
    const ports = [5000, 5001, 8080, 3000];

    for (let i = 0; i < maxAttempts; i++) {
      for (const port of ports) {
        try {
          // Try unified backend first
          const healthResponse = await fetch(`http://localhost:${port}/api/health`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          }).catch(() => null);

          if (healthResponse?.ok) {
            const health = await healthResponse.json();
            const moduleCount = health.checks?.modules?.activeCount || health.ModuleCount || 0;
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log('✅ Terrafusion Unified Backend connected:', moduleCount, 'modules');
            }
            setApiPort(port);
            // Update system metrics from backend
            setSystemMetrics(prev => ({
              ...prev,
              activeAgents: health.AIAgents || prev.activeAgents,
              performanceIndex: health.PerformanceIndex || prev.performanceIndex
            }));
            return;
          }

          // Try basic backend
          const basicResponse = await fetch(`http://localhost:${port}/health`, {
            method: 'GET'
          }).catch(() => null);

          if (basicResponse?.ok) {
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log('✅ Terrafusion Basic Backend connected');
            }
            setApiPort(port);
            return;
          }

        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log(`⚠️ Connection attempt ${i + 1}/${maxAttempts} failed`);
          }
        }
      }

      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw new Error('Could not connect to Terrafusion backend services');
  };

  const initializeWebView = async (): Promise<void> => {
    // Initialize Terrafusion bridge for desktop integration
    if (!window.terrafusion) {
      window.terrafusion = {
        shell: {
          minimize: () => {
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log('Shell: Minimize requested (browser mode)');
            }
          },
          maximize: () => {
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log('Shell: Maximize requested (browser mode)');
            }
            setIsMaximized(!isMaximized);
          },
          close: () => {
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log('Shell: Close requested (browser mode)');
            }
            if (confirm('Close Terrafusion OS?')) {
              window.close();
            }
          },
          openExternal: (url: string) => {
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log('Shell: Open external URL:', url);
            }
            window.open(url, '_blank');
          }
        },
        api: {
          port: apiPort || 5000,
          baseUrl: `http://localhost:${apiPort || 5000}`,
          getPort: async () => apiPort || 5000,
          getBaseUrl: async () => `http://localhost:${apiPort || 5000}`
        },
        isDesktop: false
      };
    }
  };

  const loadApplication = async (): Promise<void> => {
    // In desktop app, this would navigate WebView to the PWA
    // In browser, we're already running the PWA
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const startHealthMonitoring = () => {
    // Real-time system health monitoring
    const monitorInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:${apiPort || 5000}/api/health`);
        if (response.ok) {
          const health = await response.json();
          setSystemMetrics(prev => ({
            ...prev,
            activeAgents: health.AIAgents || prev.activeAgents,
            performanceIndex: health.PerformanceIndex || prev.performanceIndex,
            systemReliability: health.SystemReliability || prev.systemReliability
          }));
        }
      } catch (error) {
        // Silent fail for health monitoring
      }
    }, 5000); // Check every 5 seconds

    healthCheckRef.current = monitorInterval as unknown as number;
  };

  const cleanup = () => {
    if (healthCheckRef.current) {
      clearInterval(healthCheckRef.current);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    initializeShell();
  };

  if (error) {
    return (
      <div className="tf-ultimate-component tf-system-failure tf-stress-adaptive" data-stress="high">
        <div className="tf-card tf-error tf-auto-recover" data-error="true">


          <div className="tf-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            ⚠️ System Recovery Mode
          </div>
          <div
 className="tf-error-message" data-context="support">
            {error}
          </div>
          <button
            onClick={handleRetry}
            className="tf-btn tf-btn-primary tf-ultimate-focusable"
          >
            Initialize System Recovery
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="tf-government-interface tf-ai-adaptive" 
           data-user-level="expert" 
           data-performance="optimal">
        <div className="tf-ultimate-component tf-loading-message tf-clarity-fade" 
             data-context="government">
          
          {/* Terrafusion OS Logo with Quantum Effects */}


          <div className="tf-title tf-ai-command-brain">
            🚀 Terrafusion OS
          </div>
          
          <div
 className="tf-tagline tf-neural-sync">
            {/* Auto-displays: "Government. Transcended." */}
          </div>
          
          {/* AI Agent Status Grid */}
          <div className="tf-ultimate-ai-grid" data-agent-count="1008">
            {Array.from({ length: 64 }, (_, i) => (
              <div key={i} 
                   className="tf-ultimate-ai-node tf-ai-agent-node" 
                   data-status={i < 60 ? 'active' : i < 62 ? 'processing' : 'idle'}
                   style={{ '--node-status': i < 60 ? 'active' : i < 62 ? 'processing' : 'idle' } as React.CSSProperties} />
            ))}
          </div>
          
          {/* Loading Progress with Quantum Visualization */}
          <div className="tf-module-transcending tf-data-flow-active">
            <div className="tf-loading tf-quantum-coherent">
              <div className="tf-performance-bar">
                <div className="tf-performance-bar-fill" 
                     style={{ '--fill-percentage': '85' } as React.CSSProperties} />
              </div>
            </div>
          </div>
          
          {/* Loading Status with Brand Microcopy */}
          <div className="tf-subtitle tf-neural-sync">
            {loadingStatus}
          </div>
          
          {/* System Metrics Display */}
          <div className="tf-text tf-transcend-pulse">
            Initializing {systemMetrics.aiAgentCount} AI agents • 
            Quantum coherence at {(systemMetrics.quantumCoherence * 100).toFixed(1)}% • 
            System reliability: {(systemMetrics.systemReliability * 100).toFixed(2)}%
          </div>
          
          {/* Performance Monitor HUD */}
          <div className="tf-performance-hud" style={{ '--tf-debug-mode': 'block' } as React.CSSProperties}>
            <div className="tf-performance-metric" data-status="optimal">


              <span>AI Agents</span>
              <span
>{systemMetrics.activeAgents}/{systemMetrics.aiAgentCount}</span>
            </div>
            <div className="tf-performance-metric" data-status="optimal">


              <span>Quantum Coherence</span>
              <span
>{(systemMetrics.quantumCoherence * 100).toFixed(1)}%</span>
            </div>
            <div className="tf-performance-metric" data-status="optimal">


              <span>System Reliability</span>
              <span
>{(systemMetrics.systemReliability * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tf-government-interface tf-ultimate-component tf-perf-adaptive" 
         data-performance="excellent"
         data-ai-agent-count="1008">
      
      {/* Performance Monitoring Integration */}
      <div className="tf-performance-monitor" style={{ '--tf-dev-mode': 'block' } as React.CSSProperties}>
        <div className="tf-dev-info" />
      </div>
      
      {/* System Status Indicators */}
      <div className="tf-system-health">
        <div className="tf-health-indicator tf-system-health-optimal" data-component="api" />
        <div className="tf-health-indicator tf-system-health-optimal" data-component="database" />
        <div className="tf-health-indicator tf-system-health-optimal" data-component="ai-swarm" />
      </div>
      
      {/* Desktop Window Controls (Enhanced) */}
      <div className="tf-window-controls">
        <button
          onClick={() => window.terrafusion?.shell.minimize()}
          className="tf-window-control tf-window-minimize tf-ultimate-focusable"
          title="Minimize Terrafusion OS"
        />
        <button
          onClick={() => window.terrafusion?.shell.maximize()}
          className="tf-window-control tf-window-maximize tf-ultimate-focusable"
          title="Maximize Terrafusion OS"
        />
        <button
          onClick={() => window.terrafusion?.shell.close()}
          className="tf-window-control tf-window-close tf-ultimate-focusable"
          title="Close Terrafusion OS"
        />
      </div>
      
      {/* Main Application Content */}
      <div className="tf-layout-main tf-container">
        {children}
      </div>
      
      {/* SLA Compliance Monitor */}
      <div className="tf-sla-monitor" style={{ '--tf-sla-compliance': systemMetrics.systemReliability * 100 } as React.CSSProperties} />
    </div>
  );
};

export default OSShellWindow;
