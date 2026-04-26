import React, { useEffect, useState } from 'react';
import { resolveTrustedShellUrl } from '../lib/trustedShellUrl';
interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  url?: string;
}
const PWAShell: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [userName, setUserName] = useState('Loading...');
  const [loadingMessage, setLoadingMessage] = useState('Preparing county workspace...');
  const [realDataConnected, setRealDataConnected] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [aiAgentStatus, setAiAgentStatus] = useState<any>(null);
  const [_terraFusionSyncStatus, _setTerraFusionSyncStatus] = useState<any>(null);
  const [shellError, setShellError] = useState<string | null>(null);

  // Cache busting key - forces fresh module data load
  const _CACHE_VERSION = '2.1.20250825_UNIFIED';
  const BRAND = {
    essence: 'Government. Governed.',
    tagline: 'Government. Governed.',
    slogan: 'Turn Complexity into Clarity.',
    motto: 'We do it right the first time.',
    loadingMessages: [
      'Preparing county workspace...',
      'Checking governed service health...',
      'Loading available modules...',
    ],
    confirmationMessages: ['Workspace ready.', 'Your path is clear.', 'Available systems loaded.'],
    errorMessages: [
      "Let's clear the path—together.",
      'We anticipate, we adapt, we solve.',
      'Support is standing by your side.',
    ],
  };

  useEffect(() => {
    // Rotate loading messages
    const messageInterval = setInterval(() => {
      if (loading) {
        setLoadingMessage((prev) => {
          const currentIndex = BRAND.loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % BRAND.loadingMessages.length;
          return BRAND.loadingMessages[nextIndex];
        });
      }
    }, 2000);

    // Load real system data from unified backend
    const loadRealSystemData = async () => {
      try {
        setLoadingMessage('Connecting to unified orchestration...');

        // Get system health from our new API
        const healthResponse = await fetch('/api/system-orchestration/health');
        if (healthResponse.ok) {
          const health = await healthResponse.json();
          setSystemHealth(health);
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
          }
        }
        setLoadingMessage('Loading modules from registry...');

        // Get actual modules from backend
        const modulesResponse = await fetch('/api/modules');
        if (modulesResponse.ok) {
          const backendModules = await modulesResponse.json();
          if (backendModules && backendModules.length > 0) {
            // Convert backend modules to frontend format
            const convertedModules = backendModules.map((mod: any) => ({
              id: mod.Name,
              name: mod.DisplayName || mod.Name,
              description: mod.Description || 'Terrafusion OS Module',
              icon: getModuleIcon(mod.Name),
              enabled: mod.Status === 'Active',
              url: mod.LaunchPath || `/modules/${mod.Name}/index.html`,
            }));
            setModules(convertedModules);
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
            }
          } else {
            setModules([]);
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
            }
          }
        } else {
          setModules([]);
        }
        setLoadingMessage('Checking AI service status...');

        // Check AI Swarm status
        try {
          const aiResponse = await fetch('/api/system-orchestration/info');
          if (aiResponse.ok) {
            const aiInfo = await aiResponse.json();
            setAiAgentStatus(aiInfo);
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
          }
        }
        setLoadingMessage('Finalizing workspace...');
      } catch (error) {
        setModules([]);
        setRealDataConnected(false);
        throw error;
      }
    };

    // Get appropriate icon for module
    const getModuleIcon = (moduleName: string): string => {
      const iconMap: {
        [key: string]: string;
      } = {
        'government-edition': '🏦',
        'ai-swarm': '🤖',
        'ai-command-brain': '🧠',
        'ai-advanced': '🎯',
        'terra-fusion-sync': '🔄',
        'marketplace-champion': '🏢',
        'commercial-suite': '💼',
        'testing-suite': '🧪',
        development: '🔧',
        gispro: '🗺️',
        'property-workbench': '🏠',
        'unified-system': '⚙️',
        'web-audit-tracker': '📋',
        'terra-collections': '📁',
        'terra-levy': '💰',
        'terra-insight': '📊',
      };
      return iconMap[moduleName] || '🕸️';
    };

    // Start health monitoring
    const startHealthChecks = () => {
      const healthInterval = setInterval(async () => {
        try {
          const response = await fetch('/api/system-orchestration/health');
          if (response.ok) {
            const health = await response.json();
            setSystemHealth(health);
            setRealDataConnected(health.IsHealthy);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
          }
          setRealDataConnected(false);
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(healthInterval);
    };

    // Initialize app
    const initApp = async () => {
      try {
        await loadRealSystemData();
        setUserName('Operator');
        setTimeout(() => {
          setLoading(false);
          startHealthChecks();
        }, 500);
      } catch (error) {
        showError('Failed to connect to Terrafusion unified backend');
        setLoading(false);
      }
    };
    initApp();
    return () => {
      clearInterval(messageInterval);
    };
  }, [loading]);
  const loadModule = (module: Module) => {
    if (module.id === 'system-monitoring') {
      window.location.href = '/monitoring';
    } else {
      const trustedUrl = resolveTrustedShellUrl(module.url);
      if (!trustedUrl) {
        showError(`Blocked module launch for ${module.name}`);
        return;
      }

      setCurrentModule({
        ...module,
        url: trustedUrl,
      });
    }
  };
  const closeModule = () => {
    setCurrentModule(null);
  };
  const showError = (message: string) => {
    setShellError(message);
  };
  if (loading) {
    return (
      <div className='w-full flex items-center'>
        <div className='text-center'>
          <div
            style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 2rem',
              position: 'relative',
            }}
          >
            <svg
              width='120'
              height='120'
              viewBox='0 0 120 120'
              style={{
                animation: 'spin 2s linear infinite',
              }}
            >
              <defs>
                <linearGradient id='gradient' x1='0%' y1='0%' x2='100%' y2='100%'>
                  <stop
                    offset='0%'
                    style={{
                      stopColor: 'var(--terra-blue)',
                      stopOpacity: 1,
                    }}
                  />
                  <stop
                    offset='100%'
                    style={{
                      stopColor: 'var(--success-green)',
                      stopOpacity: 1,
                    }}
                  />
                </linearGradient>
              </defs>
              <circle cx='60' cy='60' r='50' fill='none' stroke='url(#gradient)' strokeWidth='3' />
              <text
                x='60'
                y='70'
                fontSize='36'
                fontWeight='bold'
                textAnchor='middle'
                fill='url(#gradient)'
              >
                TF
              </text>
            </svg>
          </div>

          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              background: 'linear-gradient(135deg, var(--terra-blue), var(--terra-cyan), var(--success-green))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.5rem',
            }}
          >
            Terrafusion OS
          </h1>
          <p
            style={{
              color: 'hsl(var(--tf-neutral-hs) 100% / 0.8)',
              fontSize: '1.2rem',
              marginBottom: '0.5rem',
            }}
          >
            Government. Governed.
          </p>

          <p
            style={{
              color: 'hsl(var(--tf-neutral-hs) 100% / 0.6)',
              fontSize: '1rem',
              marginBottom: '2rem',
            }}
          >
            Turn Complexity into Clarity.
          </p>
          <div
            style={{
              width: '300px',
              height: '4px',
              background: 'hsl(var(--tf-neutral-hs) 100% / 0.1)',
              borderRadius: '2px',
              margin: '0 auto',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--terra-blue), var(--terra-cyan), var(--success-green))',
                animation: 'loading 2s ease-in-out infinite',
                borderRadius: '2px',
              }}
            />
          </div>
          <p
            style={{
              color: realDataConnected ? 'var(--success-green)' : 'var(--terra-cyan)',
              fontSize: '1rem',
              marginTop: '1rem',
            }}
          >
            {loadingMessage}
          </p>
          {realDataConnected && (
            <div
              style={{
                color: 'var(--success-green)',
                fontSize: '0.9rem',
                marginTop: '0.5rem',
              }}
            >
              ✅ Backend Connected
            </div>
          )}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes loading {
            0%, 100% { width: 0%; }
            50% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }
  if (currentModule) {
    return (
      <div className='w-full flex'>
        <div className='flex items-center gap-4'>
          <button onClick={closeModule} className='font-semibold'>
            ← Back
          </button>
          <h2
            style={{
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: 0,
            }}
          >
            {currentModule.name}
          </h2>
        </div>
        <iframe src={currentModule.url} title={currentModule.name} className='flex-1 w-full' />
      </div>
    );
  }
  return (
    <div className='w-full'>
      {/* Header Bar */}
      <header className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center'>TF</div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--terra-blue), var(--terra-cyan), var(--success-green))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
            }}
          >
            Terrafusion OS
          </h1>
        </div>

        <div className='flex-1'>
          <input
            type='text'
            placeholder='Search properties, modules, or commands...'
            className='w-full'
          />
        </div>

        <div className='flex items-center gap-4'>
          <span
            style={{
              color: 'hsl(var(--tf-neutral-hs) 100% / 0.8)',
            }}
          >
            {userName}
          </span>
          <div className='flex items-center'>👤</div>
        </div>
      </header>

      {/* Module Grid */}
      <main className='p-8'>
        {/* System Status Banner */}
        <div
          style={{
            background: realDataConnected ? 'hsl(var(--tf-success-hs) 50% / 0.1)' : 'hsl(var(--tf-warning-hs) 50% / 0.1)',
            border: `1px solid ${realDataConnected ? 'var(--success-green)' : 'var(--warning-amber)'}`,
          }}
          className='text-center'
        >
          <div className='flex justify-between items-center gap-4'>
            <div className='flex items-center gap-4'>
              <div
                style={{
                  color: realDataConnected ? 'var(--success-green)' : 'var(--warning-amber)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                }}
              >
                {realDataConnected ? 'Backend connected' : 'Backend unavailable or still connecting'}
              </div>
              {systemHealth && (
                <div className='flex gap-4'>
                  <span>📦 {systemHealth.ModuleCount || modules.length} Modules</span>
                  {aiAgentStatus?.AIAgents !== undefined && <span>🤖 {aiAgentStatus.AIAgents} AI Agents</span>}
                  {systemHealth.Database?.County && <span>🏛️ {systemHealth.Database.County}</span>}
                </div>
              )}
            </div>
            {_terraFusionSyncStatus && (
              <div className='text-right'>
                <div>🔄 TerraFusionSync Active</div>
                <div>📊 {_terraFusionSyncStatus.parcels ?? 'n/a'} Parcels</div>
              </div>
            )}
          </div>

          <div className='font-semibold'>
            ACTIVE_MODULES.md registry v2.1 loaded for launch routing
          </div>
          <div
            style={{
              color: 'hsl(var(--tf-neutral-hs) 100% / 0.7)',
              fontSize: '0.8rem',
              marginTop: '0.5rem',
            }}
          >
            Module registration is not an operational readiness claim. Each module still requires its own gate.
          </div>
        </div>

        {shellError && (
          <div className='mb-4 rounded border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200'>
            {shellError}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          {modules.map((module) => (
            <div
              key={module.id}
              onClick={() => module.enabled && loadModule(module)}
              style={{
                cursor: module.enabled ? 'pointer' : 'not-allowed',
                opacity: module.enabled ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (module.enabled) {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px hsl(var(--tf-primary-hs) 50% / 0.3)';
                  e.currentTarget.style.borderColor = 'var(--terra-cyan)';
                }
              }}
              onMouseLeave={(e) => {
                if (module.enabled) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'hsl(var(--tf-primary-hs) 50% / 0.2)';
                }
              }}
              className='p-8'
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, var(--terra-cyan), transparent)',
                }}
              />

              <div className='flex items-center gap-4'>
                <div className='flex items-center'>{module.icon}</div>
                <div>
                  <h3
                    style={{
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      color: 'white',
                      margin: '0 0 0.5rem 0',
                    }}
                  >
                    {module.name}
                  </h3>
                  {!module.enabled && <span className='font-semibold'>Queued</span>}
                </div>
              </div>

              <p
                style={{
                  color: 'hsl(var(--tf-neutral-hs) 100% / 0.7)',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {module.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
export default PWAShell;
