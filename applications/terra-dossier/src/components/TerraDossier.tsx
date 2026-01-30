import { useEffect, useState } from 'react';

// Types
interface Metric {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface DossierSection {
  id: string;
  title: string;
  status: 'secure' | 'marketing' | 'classified';
  content: string;
}

export default function TerraDossier() {
  const [systemStatus, setSystemStatus] = useState<'ONLINE' | 'OFFLINE' | 'CONNECTING'>(
    'CONNECTING'
  );
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simulate/Check Connection to OS Kernel
    const checkKernel = async () => {
      try {
        const res = await fetch('http://localhost:5000/health');
        if (res.ok) setSystemStatus('ONLINE');
        else setSystemStatus('OFFLINE');
      } catch (e) {
        // Fallback for demo if offline
        setTimeout(() => setSystemStatus('ONLINE'), 1500);
      }
    };
    checkKernel();
  }, []);

  const metrics: Metric[] = [
    { label: 'System Confidence', value: '99.9%', trend: 'up', color: 'text-emerald-400' },
    { label: 'Active Agents', value: '1,024', trend: 'up', color: 'text-blue-400' },
    { label: 'Threat Level', value: 'LOW', trend: 'stable', color: 'text-gray-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono p-4 md:p-8 flex flex-col gap-6">
      {/* Header / HUD */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${systemStatus === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}
          />
          <h1 className="text-xl tracking-widest font-bold text-slate-100">
            TERRA<span className="text-emerald-500">DOSSIER</span>{' '}
            <span className="text-xs text-slate-500">v2.0.0</span>
          </h1>
        </div>
        <div className="text-xs text-slate-500 flex gap-4">
          <span>KERNEL: {systemStatus}</span>
          <span>PORT: 3007</span>
          <span>SEC: ENCRYPTED</span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
        {/* Sidebar / Navigation */}
        <aside className="md:col-span-1 bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex flex-col gap-2">
          <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
            Modules
          </div>
          {['overview', 'intelligence', 'operatives', 'logs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-3 py-2 rounded text-sm transition-all border-l-2 ${
                activeTab === tab
                  ? 'bg-slate-800/80 border-emerald-500 text-emerald-400'
                  : 'border-transparent hover:bg-slate-800/50 hover:text-slate-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}

          <div className="mt-auto pt-4 border-t border-slate-800">
            <div className="p-3 bg-slate-950 rounded border border-slate-800/50">
              <div className="text-[10px] text-slate-500 mb-1">CURRENT USER</div>
              <div className="text-sm font-bold text-blue-400">CMDR. ELITE</div>
              <div className="text-[10px] text-emerald-600 mt-1">ACCESS: LEVEL 5</div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="md:col-span-3 flex flex-col gap-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-4">
            {metrics.map(m => (
              <div key={m.label} className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">{m.label}</div>
                <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Core Panel */}
          <div className="flex-1 bg-slate-900/30 border border-slate-800 rounded-lg p-6 relative overflow-hidden">
            {/* Scanline Effect */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent opacity-10 pointer-events-none animate-scan"
              style={{ animationDuration: '4s' }}
            ></div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-emerald-400">
                // {activeTab.toUpperCase()}_PANEL
              </h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-xs rounded hover:bg-emerald-500/20">
                  REFRESH STREAM
                </button>
              </div>
            </div>

            {/* Simulated Data View */}
            <div className="space-y-4 font-mono text-sm">
              <div className="flex items-start gap-4 p-3 bg-slate-950/50 border-l-2 border-emerald-500">
                <div className="text-emerald-500 shrink-0">14:02:22</div>
                <div>
                  <span className="text-slate-400">[SYSTEM]</span> Connecting to neural interface...
                  <div className="text-emerald-600/80 mt-1">✓ Handshake complete (23ms)</div>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 bg-slate-950/50 border-l-2 border-slate-700">
                <div className="text-slate-500 shrink-0">14:02:25</div>
                <div>
                  <span className="text-slate-400">[KERNEL]</span> Loading module manifest from port
                  5000...
                  <div className="text-slate-500 mt-1"> Waiting for stream...</div>
                </div>
              </div>
              <div className="flex items-start gap-4 p-3 bg-slate-950/50 border-l-2 border-blue-500">
                <div className="text-blue-500 shrink-0">14:02:28</div>
                <div>
                  <span className="text-slate-400">[AI_SWARM]</span> Agent{' '}
                  <span className="text-blue-400">@terra-architect</span> requesting authorization.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
