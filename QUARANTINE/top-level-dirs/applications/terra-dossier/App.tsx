import { useState } from 'react';

export default function App() {
  const [status, setStatus] = useState('READY');
  const [operations] = useState([
    { id: 1, name: 'Operation Ironclad', status: 'active' },
    { id: 2, name: 'Assessment Q4 2026', status: 'pending' },
    { id: 3, name: 'Valuation Defense', status: 'pending' },
  ]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 font-sans">
      {/* SIDEBAR */}
      <div className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-5 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
            TD
          </div>
          <div>
            <h1 className="text-emerald-400 font-semibold text-lg tracking-tight">TerraDossier</h1>
            <div className="text-[10px] text-emerald-500/70 uppercase tracking-widest">
              Gen2 Sovereign
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400">Kernel: {status}</span>
        </div>

        <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-3 rounded-xl font-medium shadow-lg shadow-emerald-500/20 transition-all mb-6">
          + New Operation
        </button>

        <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Operations</div>
        <div className="space-y-2 flex-1 overflow-auto">
          {operations.map(op => (
            <div
              key={op.id}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                op.status === 'active'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/30 border border-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {op.status === 'active' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
                <span className="text-sm font-medium">{op.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-white/5 mt-4">
          <div className="text-[10px] text-slate-600 text-center">
            TerraDossier v1.0 • Gen2 Architecture
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/30 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium text-white">Operation Ironclad</h2>
            <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
              AI
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="text-sm text-slate-500 mb-2">Document Content</div>
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/5 p-6 min-h-[400px]">
                <textarea
                  className="w-full h-full bg-transparent text-slate-300 focus:outline-none resize-none min-h-[350px] placeholder-slate-600"
                  placeholder="Begin drafting your defense packet or assessment documentation here...

TerraDossier Gen2 provides:
• AI-assisted document generation
• Property defense packet workflows  
• Integration with TerraForge valuation data
• Sovereign county data isolation"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI PANEL */}
      <div className="w-72 bg-slate-900/50 backdrop-blur-xl border-l border-white/10 p-5">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm">◇</span>
          </div>
          <div>
            <h3 className="text-violet-400 font-semibold">Sentinel AI</h3>
            <div className="text-[10px] text-violet-400/60 uppercase tracking-wider">Assistant</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <div className="text-xs text-violet-300 mb-1">System Ready</div>
            <div className="text-xs text-slate-400">
              AI assistant is online and ready to help with document generation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
