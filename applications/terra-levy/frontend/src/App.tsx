import { useEffect } from 'react';
import { TF, bootOnce } from './terrafusion';

// Icons
const Landmark = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <line x1="3" y1="22" x2="21" y2="22" />
    <line x1="6" y1="18" x2="6" y2="11" />
    <line x1="10" y1="18" x2="10" y2="11" />
    <line x1="14" y1="18" x2="14" y2="11" />
    <line x1="18" y1="18" x2="18" y2="11" />
    <polygon points="12 2 20 7 4 7" />
  </svg>
);

const TrendingUp = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const AlertCircle = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ArrowUpRight = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

export default function App() {
  // Boot Handshake (Deduplicated)
  useEffect(() => {
    bootOnce('terra-levy', () => {
      TF.log('info', 'TerraLevy connection established', { topic: 'boot', data: { port: 5177 } });
      TF.badge('idle');
    });
  }, []);

  const stats = [
    { label: 'Total Levy', val: '$142.5M', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Districts', val: '24', icon: Landmark, color: 'text-blue-400' },
    { label: 'Pending', val: '3', icon: AlertCircle, color: 'text-amber-400' },
  ];

  const districts = [
    'Benton County Gen',
    'Richland School Dist',
    'Kennewick Hospital',
    'Port of Kennewick',
  ];

  return (
    <div className="h-screen bg-slate-900 text-slate-200 p-6 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* HEADER */}
      <header className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <Landmark size={28} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">TerraLevy</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-sm text-emerald-400/80 font-mono">Tax Authority Gateway</p>
          </div>
        </div>
      </header>

      {/* METRICS GRID */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="p-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-slate-500">{stat.label}</span>
              <stat.icon size={16} className={stat.color} />
            </div>
            <div className="text-2xl font-mono font-bold text-white">{stat.val}</div>
          </div>
        ))}
      </div>

      {/* ACTIVE LEVIES LIST */}
      <div className="flex-1 bg-black/20 rounded-xl border border-white/5 overflow-hidden flex flex-col">
        <div className="px-4 py-3 bg-white/5 border-b border-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Active Districts
        </div>
        <div className="p-4 space-y-2 overflow-y-auto">
          {districts.map((name, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded bg-white/5 hover:bg-white/10 cursor-pointer border border-transparent hover:border-emerald-500/30 group transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs font-mono text-slate-500 group-hover:text-white">
                  {i + 1}
                </div>
                <span className="text-sm text-slate-300 font-medium group-hover:text-emerald-300">
                  {name}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">Active</span>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER ACTION (IPC TEST) */}
      <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
        <button
          onClick={() => TF.openApp('terra-dossier')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-sm font-medium transition-all"
        >
          <span>View Tax Dossiers</span>
          <ArrowUpRight size={16} />
        </button>
      </div>
    </div>
  );
}
