import React, { useState, useEffect } from 'react';

// --- INLINE ICONS (Zero-Dependency) ---
const Icons = {
  Logo: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  File: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Brain: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
  Save: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
};

export default function App() {
  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState('SYNCING');

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(res => {
         if(res.ok) { setStatus('ONLINE'); loadNotebooks(); }
         else setStatus('OFFLINE');
      })
      .catch(() => setStatus('OFFLINE'));
  }, []);

  async function loadNotebooks() {
    try {
      const res = await fetch('http://localhost:5000/api/data/notebooks');
      const data = await res.json();
      setNotebooks(data);
      if (data.length > 0 && !activeId) setActiveId(data[0].id);
    } catch (e) { console.error(e); }
  }

  const activeBook = notebooks.find(n => n.id === activeId);

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-emerald-500/30">
      
      {/* SIDEBAR */}
      <div className="w-72 bg-[#09090b] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <Icons.Logo />
            <span className="font-semibold tracking-[0.2em] text-xs text-zinc-100">TERRAFUSION</span>
          </div>
          <div className="flex items-center gap-2">
             <div className={`w-1.5 h-1.5 rounded-full ${status === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
             <span className="text-[10px] font-mono text-zinc-500">{status}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="text-[10px] font-mono text-zinc-600 px-3 py-2 uppercase tracking-wider">Operations</div>
            {notebooks.map(nb => (
                <button key={nb.id} onClick={() => setActiveId(nb.id)}
                     className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 border border-transparent flex items-center gap-3 ${activeId === nb.id ? 'bg-white/5 border-white/5 text-zinc-100' : 'hover:bg-white/5 text-zinc-500 hover:text-zinc-300'}`}>
                    <Icons.File />
                    <span className="text-sm font-medium truncate">{nb.title}</span>
                </button>
            ))}
        </div>
        
        <div className="p-4 border-t border-white/5">
            <button className="w-full flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 hover:bg-white p-2 rounded text-sm font-medium transition-colors">
                <Icons.Plus /> New Operation
            </button>
        </div>
      </div>

      {/* EDITOR */}
      <div className="flex-1 flex flex-col bg-[#0c0c0e]">
        {activeBook ? (
            <>
                <div className="h-16 flex items-center justify-between px-8 border-b border-white/5">
                    <span className="text-lg font-medium text-zinc-100">{activeBook.title}</span>
                    <button className="text-zinc-500 hover:text-emerald-400 transition-colors"><Icons.Save /></button>
                </div>
                <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
                    <textarea className="w-full h-full bg-transparent resize-none focus:outline-none text-zinc-300 text-lg leading-relaxed font-serif" 
                        placeholder="Begin entry..."></textarea>
                </div>
            </>
        ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-700">
                <p>Select an operation to begin.</p>
            </div>
        )}
      </div>

      {/* CONTEXT LENS (AI) */}
      <div className="w-80 border-l border-white/5 bg-[#09090b]">
        <div className="p-6 border-b border-white/5 flex items-center gap-2 text-indigo-400">
            <Icons.Brain />
            <span className="text-xs font-bold tracking-widest uppercase">Sentinel AI</span>
        </div>
        <div className="p-6">
            <div className="bg-white/5 rounded p-4 text-xs text-zinc-400 leading-relaxed border border-white/5">
                Monitoring active context. Waiting for input...
            </div>
        </div>
      </div>

    </div>
  );
}
