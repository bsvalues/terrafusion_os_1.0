import React, { useState, useEffect } from 'react';

// NO ICONS IMPORTED - PURE TEXT FALLBACK
export default function App() {
  const [status, setStatus] = useState('OFFLINE');

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(res => res.ok ? setStatus('CONNECTED') : setStatus('ERROR'))
      .catch(() => setStatus('DISCONNECTED'));
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 p-4">
        <h1 className="text-emerald-400 font-bold mb-4">[BOOK] TERRA DOSSIER</h1>
        <div className="text-xs text-slate-500 mb-6">KERNEL: {status}</div>
        <button className="w-full bg-emerald-900/30 text-emerald-400 p-2 rounded border border-emerald-800 mb-4">
          + New Operation
        </button>
        <div className="space-y-2">
          <div className="p-2 bg-slate-800 border-l-2 border-emerald-500">Operation Ironclad</div>
          <div className="p-2 text-slate-400 hover:bg-slate-800/50">Pending Assessment</div>
        </div>
      </div>

      {/* EDITOR */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Operation Ironclad</h1>
          <textarea className="w-full h-96 bg-transparent text-slate-300 focus:outline-none resize-none" 
            placeholder="System Operational. Icons removed for stability. Type here..."></textarea>
        </div>
      </div>
    </div>
  );
}
