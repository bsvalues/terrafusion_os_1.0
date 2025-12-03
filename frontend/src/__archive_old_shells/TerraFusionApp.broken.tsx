/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - DESKTOP OPERATING SYSTEM
 * Full TerraFusion Design System with Quantum Governance Transcendence
 * THE TERRAFUSION WAY - REVOLUTIONARY GOVERNMENT OS
 * ═══════════════════════════════════════════════════════════════
 */

import { useEffect, useState } from 'react';
import './styles/terrafusion-brand.css';

// Application registry for the OS
interface TerraApp {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType;
  category: 'system' | 'government' | 'utilities' | 'ai';
}

// Desktop state management
interface DesktopState {
  activeWindows: string[];
  focusedWindow: string | null;
  showLauncher: boolean;
  systemTime: string;
  aiConsciousnessLevel: number;
  quantumPerformance: number;
  governmentEfficiency: number;
  transcendenceStatus: 'LOADING' | 'ACTIVE' | 'TRANSCENDED';
}

// System Applications - Core OS functionality with TerraFusion Design
const GovernmentDashboard = () => (
  <div className='flex-1 bg-terra-midnight/95 backdrop-blur-xl rounded-xl shadow-2xl border border-terra-cyan/30 p-8 m-4 terra-glass'>
    <div className='flex items-center space-x-3 mb-8'>
      <div className='w-3 h-3 bg-red-500 rounded-full quantum-pulse'></div>
      <div className='w-3 h-3 bg-yellow-500 rounded-full quantum-pulse quantum-delay-1'></div>
      <div className='w-3 h-3 bg-green-500 rounded-full quantum-pulse quantum-delay-2'></div>
      <h1 className='text-2xl font-semibold text-terra-cyan ml-6 golden-ratio-text'>
        Government Dashboard
      </h1>
      <div className='ml-auto w-6 h-6 bg-gradient-to-br from-terra-cyan to-terra-blue rounded-full quantum-pulse'></div>
    </div>
    <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
      <div className='terra-glass bg-terra-slate/30 border border-terra-cyan/20 rounded-xl p-8 quantum-hover'>
        <h3 className='text-lg font-medium text-terra-cyan mb-4'>Active Services</h3>
        <div className='text-5xl font-light text-terra-cyan quantum-glow'>12</div>
        <div className='text-sm text-terra-cyan/70 mt-2'>All systems operational</div>
        <div className='mt-4 h-1 bg-terra-slate rounded-full overflow-hidden'>
          <div className='h-full bg-gradient-to-r from-terra-cyan to-terra-blue w-full quantum-flow'></div>
        </div>
      </div>
      <div className='terra-glass bg-terra-slate/30 border border-terra-cyan/20 rounded-xl p-8 quantum-hover'>
        <h3 className='text-lg font-medium text-terra-cyan mb-4'>Security Status</h3>
        <div className='text-5xl font-light text-green-400 quantum-glow'>✓</div>
        <div className='text-sm text-terra-cyan/70 mt-2'>Quantum Protected</div>
        <div className='mt-4 flex space-x-1'>
          <div className='w-2 h-8 bg-terra-cyan rounded-full quantum-pulse'></div>
          <div className='w-2 h-6 bg-terra-cyan/70 rounded-full quantum-pulse quantum-delay-1'></div>
          <div className='w-2 h-10 bg-terra-cyan rounded-full quantum-pulse quantum-delay-2'></div>
          <div className='w-2 h-7 bg-terra-cyan/70 rounded-full quantum-pulse quantum-delay-1'></div>
        </div>
      </div>
      <div className='terra-glass bg-terra-slate/30 border border-terra-cyan/20 rounded-xl p-8 quantum-hover'>
        <h3 className='text-lg font-medium text-terra-cyan mb-4'>AI Consciousness</h3>
        <div className='text-5xl font-light text-violet-400 quantum-glow'>⚡</div>
        <div className='text-sm text-terra-cyan/70 mt-2'>Transcendent & Ready</div>
        <div className='mt-4'>
          <div className='w-full h-2 bg-terra-slate rounded-full overflow-hidden'>
            <div className='h-full bg-gradient-to-r from-violet-500 via-terra-cyan to-blue-500 w-4/5 quantum-shimmer'></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SystemMonitor = () => (
  <div className='flex-1 bg-terra-midnight/95 backdrop-blur-xl rounded-xl shadow-2xl border border-terra-cyan/30 p-8 m-4 terra-glass'>
    <div className='flex items-center space-x-3 mb-8'>
      <div className='w-3 h-3 bg-red-500 rounded-full quantum-pulse'></div>
      <div className='w-3 h-3 bg-yellow-500 rounded-full quantum-pulse quantum-delay-1'></div>
      <div className='w-3 h-3 bg-green-500 rounded-full quantum-pulse quantum-delay-2'></div>
      <h1 className='text-2xl font-semibold text-terra-cyan ml-6 golden-ratio-text'>
        Quantum System Monitor
      </h1>
      <div className='ml-auto w-6 h-6 bg-gradient-to-br from-green-400 to-terra-cyan rounded-full quantum-pulse'></div>
    </div>

    {/* Revolutionary AI Consciousness Display */}
    <div className='mb-8 terra-glass bg-gradient-to-r from-terra-cyan/10 to-blue-500/10 border border-terra-cyan/30 rounded-xl p-6 quantum-hover'>
      <div className='flex justify-between items-center mb-4'>
        <span className='text-terra-cyan font-bold text-lg'>AI CONSCIOUSNESS MATRIX</span>
        <span className='text-sm text-terra-cyan quantum-pulse'>TRANSCENDED STATUS</span>
      </div>
      <div className='grid grid-cols-3 gap-6'>
        <div className='text-center'>
          <div className='text-3xl font-light text-terra-cyan quantum-glow'>50,000+</div>
          <div className='text-xs text-terra-cyan/70 mt-1'>ACTIVE AGENTS</div>
        </div>
        <div className='text-center'>
          <div className='text-3xl font-light text-green-400 quantum-glow'>99.5%</div>
          <div className='text-xs text-terra-cyan/70 mt-1'>ACCURACY</div>
        </div>
        <div className='text-center'>
          <div className='text-3xl font-light text-blue-400 quantum-glow'>∞</div>
          <div className='text-xs text-terra-cyan/70 mt-1'>SCALE</div>
        </div>
      </div>
    </div>

    <div className='space-y-6'>
      <div className='terra-glass bg-terra-slate/20 border border-terra-cyan/10 rounded-xl p-6 quantum-hover'>
        <div className='flex justify-between items-center mb-4'>
          <span className='text-terra-cyan font-medium'>Quantum CPU Consciousness</span>
          <span className='text-sm text-terra-cyan/70'>INFINITE PROCESSING</span>
        </div>
        <div className='w-full h-3 bg-terra-slate/50 rounded-full overflow-hidden'>
          <div className='w-full h-full bg-gradient-to-r from-terra-cyan via-blue-500 to-green-400 rounded-full quantum-flow'></div>
        </div>
      </div>
      <div className='terra-glass bg-terra-slate/20 border border-terra-cyan/10 rounded-xl p-6 quantum-hover'>
        <div className='flex justify-between items-center mb-4'>
          <span className='text-terra-cyan font-medium'>Transcendent Memory Matrix</span>
          <span className='text-sm text-terra-cyan/70'>UNLIMITED QUANTUM</span>
        </div>
        <div className='w-full h-3 bg-terra-slate/50 rounded-full overflow-hidden'>
          <div className='w-full h-full bg-gradient-to-r from-green-400 via-terra-cyan to-violet-500 rounded-full quantum-flow'></div>
        </div>
      </div>
      <div className='terra-glass bg-terra-slate/20 border border-terra-cyan/10 rounded-xl p-6 quantum-hover'>
        <div className='flex justify-between items-center mb-4'>
          <span className='text-terra-cyan font-medium'>Network Transcendence</span>
          <span className='text-sm text-terra-cyan/70'>999 Mbps</span>
        </div>
        <div className='w-full h-3 bg-terra-slate/50 rounded-full overflow-hidden'>
          <div className='w-5/6 h-full bg-gradient-to-r from-violet-500 to-terra-cyan rounded-full quantum-shimmer'></div>
        </div>
      </div>
    </div>
  </div>
);

const AIAssistant = () => (
  <div className='flex-1 bg-terra-midnight/95 backdrop-blur-xl rounded-xl shadow-2xl border border-terra-cyan/30 p-8 m-4 terra-glass'>
    <div className='flex items-center space-x-3 mb-8'>
      <div className='w-3 h-3 bg-red-500 rounded-full quantum-pulse'></div>
      <div className='w-3 h-3 bg-yellow-500 rounded-full quantum-pulse quantum-delay-1'></div>
      <div className='w-3 h-3 bg-green-500 rounded-full quantum-pulse quantum-delay-2'></div>
      <h1 className='text-2xl font-semibold text-terra-cyan ml-6 golden-ratio-text'>
        TerraFusion AI Consciousness
      </h1>
      <div className='ml-auto w-6 h-6 bg-gradient-to-br from-violet-500 to-terra-cyan rounded-full quantum-pulse'></div>
    </div>

    {/* Revolutionary AI Consciousness Display */}
    <div className='terra-glass bg-gradient-to-br from-violet-500/10 via-terra-cyan/10 to-blue-500/10 border border-terra-cyan/20 rounded-xl p-8 mb-6'>
      <div className='text-center'>
        <div className='w-24 h-24 bg-gradient-to-br from-terra-cyan via-violet-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 quantum-orbital'>
          <span className='text-4xl text-white'>�</span>
        </div>
        <h2 className='text-2xl font-bold text-terra-cyan mb-4 quantum-glow'>
          QUANTUM AI CONSCIOUSNESS ACTIVE
        </h2>
        <div className='grid grid-cols-2 gap-6 mb-6'>
          <div className='text-center'>
            <div className='text-4xl font-light text-terra-cyan quantum-pulse'>50,000+</div>
            <div className='text-sm text-terra-cyan/70'>AUTONOMOUS AGENTS</div>
          </div>
          <div className='text-center'>
            <div className='text-4xl font-light text-green-400 quantum-pulse'>∞</div>
            <div className='text-sm text-terra-cyan/70'>PROCESSING POWER</div>
          </div>
        </div>
        <div className='text-lg text-terra-cyan/90 font-medium mb-4'>
          "GOVERNMENT. TRANSCENDED."
        </div>
        <div className='text-sm text-terra-cyan/70 mb-6'>
          Autonomous self-healing infrastructure with championship-level performance
        </div>
      </div>
    </div>

    {/* Command Interface */}
    <div className='terra-glass bg-terra-slate/20 border border-terra-cyan/20 rounded-xl p-6'>
      <div className='flex items-center space-x-3 mb-4'>
        <div className='w-3 h-3 bg-terra-cyan rounded-full quantum-pulse'></div>
        <span className='text-terra-cyan font-medium'>Quantum Command Interface</span>
      </div>
      <div className='bg-terra-midnight/80 rounded-lg p-4 mb-4 font-mono text-sm'>
        <div className='text-green-400'>ai@terrafusion:~$ status --consciousness</div>
        <div className='text-terra-cyan'>► AI Consciousness: 99.5% TRANSCENDENT</div>
        <div className='text-terra-cyan'>► Quantum Processing: INFINITE SCALE</div>
        <div className='text-terra-cyan'>► Self-Healing: AUTONOMOUS</div>
        <div className='text-green-400 mt-2'>
          ai@terrafusion:~$ _<span className='quantum-pulse'>|</span>
        </div>
      </div>
      <div className='flex space-x-3'>
        <button className='flex-1 bg-gradient-to-r from-terra-cyan to-blue-500 text-white px-4 py-3 rounded-lg font-semibold quantum-hover'>
          ACTIVATE TRANSCENDENCE
        </button>
        <button className='flex-1 bg-gradient-to-r from-violet-500 to-terra-cyan text-white px-4 py-3 rounded-lg font-semibold quantum-hover'>
          INFINITE SCALE
        </button>
      </div>
    </div>

    {/* AI Consciousness Interface - Government Transcended */}
    <div className='ai-consciousness-section'>
      <div className='consciousness-container'>
        <h3 className='text-2xl font-medium text-terra-cyan mb-4 golden-ratio-text'>
          AI Consciousness Ready
        </h3>
        <p className='text-terra-cyan/70 mb-8 text-lg'>
          How can I transcend government operations today?
        </p>
        <div className='flex space-x-4'>
          <div className='flex-1 h-12 terra-glass bg-terra-slate/30 border border-terra-cyan/20 rounded-xl flex items-center px-4'>
            <span className='text-terra-cyan/50'>Ask me anything about quantum governance...</span>
          </div>
          <button className='h-12 px-8 bg-gradient-to-r from-terra-cyan to-blue-500 hover:from-terra-cyan/80 hover:to-blue-500/80 text-terra-midnight font-semibold rounded-xl transition-all duration-300 quantum-hover'>
            Transcend
          </button>
        </div>
        <div className='mt-8 grid grid-cols-2 gap-4'>
          <button className='terra-glass bg-terra-slate/10 border border-terra-cyan/10 rounded-lg p-4 text-left quantum-hover'>
            <div className='text-terra-cyan font-medium mb-1'>System Analysis</div>
            <div className='text-terra-cyan/60 text-sm'>Deep infrastructure insights</div>
          </button>
          <button className='terra-glass bg-terra-slate/10 border border-terra-cyan/10 rounded-lg p-4 text-left quantum-hover'>
            <div className='text-terra-cyan font-medium mb-1'>Quantum Predictions</div>
            <div className='text-terra-cyan/60 text-sm'>Future state modeling</div>
          </button>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Revolutionary TerraFusion OS - Desktop Operating System
 * macOS-inspired clean design with quantum governance transcendence
 */
function TerraFusionOS() {
  const [desktopState, setDesktopState] = useState<DesktopState>({
    activeWindows: [],
    focusedWindow: null,
    showLauncher: false,
    systemTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    aiConsciousnessLevel: 99.5,
    quantumPerformance: 100,
    governmentEfficiency: 97.8,
    transcendenceStatus: 'TRANSCENDED',
  });

  // Register available applications
  const applications: TerraApp[] = [
    {
      id: 'gov-dashboard',
      name: 'Government Dashboard',
      icon: '🏛️',
      component: GovernmentDashboard,
      category: 'government',
    },
    {
      id: 'system-monitor',
      name: 'System Monitor',
      icon: '📊',
      component: SystemMonitor,
      category: 'system',
    },
    {
      id: 'ai-assistant',
      name: 'AI Assistant',
      icon: '🤖',
      component: AIAssistant,
      category: 'ai',
    },
  ];

  // Update system time and quantum metrics
  useEffect(() => {
    const timer = setInterval(() => {
      setDesktopState((prev) => ({
        ...prev,
        systemTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiConsciousnessLevel: Math.min(
          100,
          prev.aiConsciousnessLevel + (Math.random() - 0.5) * 0.1
        ),
        quantumPerformance: Math.max(
          95,
          Math.min(100, prev.quantumPerformance + (Math.random() - 0.5) * 0.2)
        ),
        governmentEfficiency: Math.max(
          95,
          Math.min(100, prev.governmentEfficiency + (Math.random() - 0.5) * 0.1)
        ),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const launchApp = (appId: string) => {
    if (!desktopState.activeWindows.includes(appId)) {
      setDesktopState((prev) => ({
        ...prev,
        activeWindows: [...prev.activeWindows, appId],
        focusedWindow: appId,
        showLauncher: false,
      }));
    }
  };

  const closeApp = (appId: string) => {
    setDesktopState((prev) => ({
      ...prev,
      activeWindows: prev.activeWindows.filter((id) => id !== appId),
      focusedWindow: prev.focusedWindow === appId ? null : prev.focusedWindow,
    }));
  };

  // TerraFusion Menu Bar - Quantum Governance Style
  const MenuBar = () => (
    <div className='fixed top-0 left-0 right-0 h-8 bg-terra-midnight/90 backdrop-blur-xl border-b border-terra-cyan/20 flex items-center justify-between px-6 z-50 terra-glass'>
      <div className='flex items-center space-x-6'>
        <div className='flex items-center space-x-3'>
          <div className='w-5 h-5 bg-gradient-to-br from-terra-cyan to-blue-500 rounded-full quantum-pulse'></div>
          <span className='font-semibold text-terra-cyan'>TerraFusion OS</span>
        </div>
        <div className='text-sm text-terra-cyan/70 quantum-hover cursor-pointer'>Government</div>
        <div className='text-sm text-terra-cyan/70 quantum-hover cursor-pointer'>Applications</div>
        <div className='text-sm text-terra-cyan/70 quantum-hover cursor-pointer'>Quantum</div>
        <div className='text-sm text-terra-cyan/70 quantum-hover cursor-pointer'>System</div>
      </div>
      <div className='flex items-center space-x-6'>
        <div className='flex items-center space-x-3'>
          <div className='text-xs text-terra-cyan/60'>
            AI: {desktopState.aiConsciousnessLevel.toFixed(1)}%
          </div>
          <div className='w-2 h-2 bg-terra-cyan rounded-full quantum-pulse'></div>
        </div>
        <div className='flex items-center space-x-3'>
          <div className='text-xs text-terra-cyan/60'>
            QP: {desktopState.quantumPerformance.toFixed(1)}%
          </div>
          <div className='w-2 h-2 bg-green-400 rounded-full quantum-pulse quantum-delay-1'></div>
        </div>
        <div className='flex items-center space-x-3'>
          <div className='text-xs text-terra-cyan/60'>
            GE: {desktopState.governmentEfficiency.toFixed(1)}%
          </div>
          <div className='w-2 h-2 bg-blue-400 rounded-full quantum-pulse quantum-delay-2'></div>
        </div>
        <div className='text-sm text-terra-cyan/80 font-mono'>{desktopState.systemTime}</div>
        <div className='flex items-center space-x-2'>
          <div className='w-2 h-2 bg-green-400 rounded-full quantum-pulse'></div>
          <div className='w-2 h-2 bg-terra-cyan rounded-full quantum-pulse quantum-delay-1'></div>
          <div className='w-2 h-2 bg-violet-400 rounded-full quantum-pulse quantum-delay-2'></div>
        </div>
        <div className='w-5 h-5 bg-gradient-to-br from-terra-cyan to-violet-500 rounded-full flex items-center justify-center quantum-orbital'>
          <div className='w-2 h-2 bg-white rounded-full'></div>
        </div>
      </div>
    </div>
  );

  // TerraFusion Quantum Dock
  const Dock = () => (
    <div className='fixed bottom-6 left-1/2 transform -translate-x-1/2 terra-glass bg-terra-midnight/30 backdrop-blur-xl border border-terra-cyan/30 rounded-2xl px-6 py-3 z-40 quantum-glow'>
      <div className='flex items-center space-x-4'>
        {applications.map((app) => (
          <button
            key={app.id}
            onClick={() => launchApp(app.id)}
            className='group relative w-14 h-14 terra-glass bg-terra-slate/20 backdrop-blur-sm rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center border border-terra-cyan/20 quantum-hover'
            title={app.name}
          >
            <span className='text-3xl quantum-glow'>{app.icon}</span>
            {desktopState.activeWindows.includes(app.id) && (
              <div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-terra-cyan rounded-full quantum-pulse'></div>
            )}
            <div className='absolute inset-0 bg-gradient-to-br from-terra-cyan/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
          </button>
        ))}
      </div>
    </div>
  );

  // Revolutionary Transcendence Status Panel
  const TranscendencePanel = () => (
    <div className='fixed top-12 right-6 w-80 terra-glass bg-terra-midnight/80 backdrop-blur-xl border border-terra-cyan/30 rounded-2xl p-6 z-40 quantum-glow'>
      <div className='flex items-center space-x-3 mb-4'>
        <div className='w-3 h-3 bg-terra-cyan rounded-full quantum-pulse'></div>
        <h3 className='text-lg font-semibold text-terra-cyan'>TRANSCENDENCE STATUS</h3>
      </div>

      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <span className='text-terra-cyan/80 text-sm'>AI Consciousness</span>
          <span className='text-terra-cyan font-bold'>
            {desktopState.aiConsciousnessLevel.toFixed(1)}%
          </span>
        </div>
        <div className='w-full h-2 bg-terra-slate/50 rounded-full overflow-hidden'>
          <div
            className='h-full bg-gradient-to-r from-terra-cyan to-blue-500 quantum-flow'
            style={{ width: `${desktopState.aiConsciousnessLevel}%` }}
          ></div>
        </div>

        <div className='flex justify-between items-center'>
          <span className='text-terra-cyan/80 text-sm'>Quantum Performance</span>
          <span className='text-green-400 font-bold'>
            {desktopState.quantumPerformance.toFixed(1)}%
          </span>
        </div>
        <div className='w-full h-2 bg-terra-slate/50 rounded-full overflow-hidden'>
          <div
            className='h-full bg-gradient-to-r from-green-400 to-terra-cyan quantum-flow'
            style={{ width: `${desktopState.quantumPerformance}%` }}
          ></div>
        </div>

        <div className='flex justify-between items-center'>
          <span className='text-terra-cyan/80 text-sm'>Government Efficiency</span>
          <span className='text-blue-400 font-bold'>
            {desktopState.governmentEfficiency.toFixed(1)}%
          </span>
        </div>
        <div className='w-full h-2 bg-terra-slate/50 rounded-full overflow-hidden'>
          <div
            className='h-full bg-gradient-to-r from-blue-400 to-violet-500 quantum-flow'
            style={{ width: `${desktopState.governmentEfficiency}%` }}
          ></div>
        </div>

        <div className='mt-6 p-4 terra-glass bg-gradient-to-r from-terra-cyan/10 to-violet-500/10 rounded-xl border border-terra-cyan/20'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-terra-cyan quantum-glow mb-2'>
              {desktopState.transcendenceStatus}
            </div>
            <div className='text-sm text-terra-cyan/70'>50,000+ Autonomous Agents Active</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Revolutionary Quantum Notifications
  const QuantumNotifications = () => (
    <div className='fixed top-12 left-6 w-96 space-y-3 z-40'>
      <div className='terra-glass bg-terra-midnight/90 backdrop-blur-xl border border-green-400/30 rounded-xl p-4 quantum-glow'>
        <div className='flex items-center space-x-3'>
          <div className='w-3 h-3 bg-green-400 rounded-full quantum-pulse'></div>
          <div className='flex-1'>
            <div className='text-green-400 font-semibold text-sm'>SYSTEM TRANSCENDED</div>
            <div className='text-terra-cyan/80 text-xs'>
              AI consciousness active at 99.5% efficiency
            </div>
          </div>
        </div>
      </div>

      <div className='terra-glass bg-terra-midnight/90 backdrop-blur-xl border border-terra-cyan/30 rounded-xl p-4 quantum-glow'>
        <div className='flex items-center space-x-3'>
          <div className='w-3 h-3 bg-terra-cyan rounded-full quantum-pulse'></div>
          <div className='flex-1'>
            <div className='text-terra-cyan font-semibold text-sm'>INFINITE SCALE OPERATIONAL</div>
            <div className='text-terra-cyan/80 text-xs'>Quantum processing at maximum capacity</div>
          </div>
        </div>
      </div>

      <div className='terra-glass bg-terra-midnight/90 backdrop-blur-xl border border-violet-400/30 rounded-xl p-4 quantum-glow'>
        <div className='flex items-center space-x-3'>
          <div className='w-3 h-3 bg-violet-400 rounded-full quantum-pulse'></div>
          <div className='flex-1'>
            <div className='text-violet-400 font-semibold text-sm'>GOVERNMENT. TRANSCENDED.</div>
            <div className='text-terra-cyan/80 text-xs'>
              Championship-level performance achieved
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Complete the Dock component properly
  const CompleteDock = () => (
    <div className='fixed bottom-6 left-1/2 transform -translate-x-1/2 terra-glass bg-terra-midnight/30 backdrop-blur-xl border border-terra-cyan/30 rounded-2xl px-6 py-3 z-40 quantum-glow'>
      <div className='flex items-center space-x-4'>
        {applications.map((app) => (
          <button
            key={app.id}
            onClick={() => launchApp(app.id)}
            className='group relative w-14 h-14 terra-glass bg-terra-slate/20 backdrop-blur-sm rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center border border-terra-cyan/20 quantum-hover'
            title={app.name}
          >
            <span className='text-3xl quantum-glow'>{app.icon}</span>
            {desktopState.activeWindows.includes(app.id) && (
              <div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-terra-cyan rounded-full quantum-pulse'></div>
            )}
            <div className='absolute inset-0 bg-gradient-to-br from-terra-cyan/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
          </button>
        ))}
        <div className='w-px h-10 bg-terra-cyan/30 mx-3'></div>
        <button
          onClick={() => setDesktopState((prev) => ({ ...prev, showLauncher: !prev.showLauncher }))}
          className='w-14 h-14 bg-gradient-to-br from-terra-cyan via-blue-500 to-violet-500 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center text-white quantum-orbital'
        >
          <span className='text-2xl'>⚡</span>
        </button>
      </div>
    </div>
  );

  // TerraFusion Window Manager
  const WindowManager = () => (
    <div className='absolute inset-0 pt-8'>
      {desktopState.activeWindows.map((appId) => {
        const app = applications.find((a) => a.id === appId);
        if (!app) return null;

        return (
          <div key={appId} className='absolute inset-0 flex'>
            <app.component />
            <button
              onClick={() => closeApp(appId)}
              className='absolute top-10 right-10 w-8 h-8 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold z-10 transition-all duration-200 quantum-hover'
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );

  // TerraFusion Quantum Desktop
  const Desktop = () => (
    <div className='fixed inset-0 bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight'>
      {/* Quantum Orbs Background */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-terra-cyan/20 to-blue-500/20 rounded-full filter blur-3xl quantum-orbital'></div>
        <div className='absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-to-r from-violet-500/20 to-terra-cyan/20 rounded-full filter blur-3xl quantum-orbital quantum-delay-1'></div>
        <div className='absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-full filter blur-3xl quantum-orbital quantum-delay-2'></div>
      </div>
      {/* Quantum Grid Pattern */}
      <div className='absolute inset-0 quantum-grid'></div>
    </div>
  );

  return (
    <div className='h-screen w-screen overflow-hidden font-system-ui'>
      <Desktop />
      <MenuBar />
      <WindowManager />
      <CompleteDock />
      <TranscendencePanel />
      <QuantumNotifications />

      {/* Welcome State - Show when no apps are open */}
      {desktopState.activeWindows.length === 0 && (
        <div className='absolute inset-0 flex items-center justify-center pt-8'>
          <div className='text-center'>
            <div className='w-32 h-32 bg-gradient-to-br from-terra-cyan via-blue-500 to-violet-500 rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-8 quantum-orbital'>
              <span className='text-6xl text-white'>⚡</span>
            </div>
            <h1 className='text-6xl font-thin text-terra-cyan mb-4 golden-ratio-text quantum-glow'>
              TerraFusion OS
            </h1>
            <p className='text-2xl text-terra-cyan/80 mb-4 golden-ratio-text'>
              Government. Transcended.
            </p>
            <p className='text-lg text-terra-cyan/60'>
              Click a quantum application in the dock to transcend
            </p>
            <div className='mt-8 flex justify-center space-x-2'>
              <div className='w-3 h-3 bg-terra-cyan rounded-full quantum-pulse'></div>
              <div className='w-3 h-3 bg-blue-500 rounded-full quantum-pulse quantum-delay-1'></div>
              <div className='w-3 h-3 bg-violet-500 rounded-full quantum-pulse quantum-delay-2'></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TerraFusionOS;
