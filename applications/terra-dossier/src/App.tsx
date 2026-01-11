import React, { useState, useEffect } from 'react';

const Icons = {
  Logo: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  File: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
  Brain: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
  Zap: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
};

export default function App() {
  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState('SYNCING');
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(res => { if(res.ok) { setStatus('ONLINE'); loadNotebooks(); } else setStatus('ERROR'); })
      .catch(() => setStatus('OFFLINE'));
  }, []);

  async function loadNotebooks() {
    try {
      const res = await fetch('http://localhost:5000/api/data/notebooks');
      setNotebooks(await res.json());
    } catch (e) { console.error(e); }
  }

  async function createNotebook() {
    try {
      const res = await fetch('http://localhost:5000/api/data/notebooks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Operation ' + new Date().toLocaleTimeString() })
      });
      if(res.ok) { const n = await res.json(); setNotebooks([n, ...notebooks]); setActiveId(n.id); }
    } catch (e) { alert("Failed"); }
  }

  async function analyze() {
    if(!text) return;
    try {
      const res = await fetch('http://localhost:5000/api/ai/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      setAnalysis(await res.json());
    } catch(e) { console.error(e); }
  }

  const activeBook = notebooks.find(n => n.id === activeId);

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-[#111111] border-r border-white/5 flex flex-col p-4">
        <div className="flex items-center gap-3 mb-6 text-emerald-500 font-bold tracking-widest"><Icons.Logo /> TERRA</div>
        <div className="text-xs mb-4 text-zinc-500">KERNEL: <span className={status==='ONLINE'?'text-emerald-500':'text-red-500'}>{status}</span></div>
        <button onClick={createNotebook} className="bg-zinc-100 text-black p-2 rounded mb-4 flex items-center justify-center gap-2"><Icons.Plus /> New Op</button>
        <div className="space-y-1 overflow-y-auto flex-1">
          {notebooks.map(nb => (
            <div key={nb.id} onClick={() => { setActiveId(nb.id); setText(''); setAnalysis(null); }} className={`p-2 rounded cursor-pointer ${activeId===nb.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <div className="flex items-center gap-2"><Icons.File /> {nb.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* EDITOR */}
      <div className="flex-1 flex flex-col bg-[#0c0c0e] p-8">
        {activeBook ? (
          <>
            <h1 className="text-2xl font-bold mb-4 text-white">{activeBook.title}</h1>
            <textarea className="w-full h-full bg-transparent resize-none focus:outline-none text-zinc-300 text-lg font-serif" 
              placeholder="Type intel here (e.g. 'Parcel 404 has a critical tax levy violation')..."
              value={text} onChange={(e) => setText(e.target.value)}></textarea>
          </>
        ) : <div className="m-auto text-zinc-700">Select Operation</div>}
      </div>

      {/* AI CORTEX */}
      <div className="w-80 bg-[#09090b] border-l border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5 flex items-center gap-2 text-indigo-400 font-bold"><Icons.Brain /> SENTINEL AI</div>
        <div className="p-4 flex-1 overflow-y-auto">
          {activeBook ? (
            <>
              <button onClick={analyze} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded mb-6 flex items-center justify-center gap-2 transition-all">
                <Icons.Zap /> ANALYZE INTEL
              </button>
              {analysis && (
                <div className="space-y-4 animate-pulse-once">
                  <div className="p-3 bg-white/5 rounded border border-white/10">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Risk Level</div>
                    <div className={`font-bold ${analysis.risk_score === 'HIGH' ? 'text-red-500' : analysis.risk_score === 'MEDIUM' ? 'text-yellow-500' : 'text-emerald-500'}`}>
                      {analysis.risk_score}
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded border border-white/10">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Classification</div>
                    <div className="text-indigo-300">{analysis.classification}</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded border border-white/10">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Detected Vectors</div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.detected_topics.map(t => <span key={t} className="px-2 py-1 bg-indigo-900/50 text-indigo-200 text-xs rounded border border-indigo-700">{t}</span>)}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-600 font-mono mt-4 border-t border-white/5 pt-2">{analysis.summary}</div>
                </div>
              )}
              {!analysis && <div className="text-zinc-600 text-sm text-center mt-10">Awaiting input stream...</div>}
            </>
          ) : <div className="text-zinc-700 text-sm p-4">System Idle.</div>}
        </div>
      </div>
    </div>
  );
}
