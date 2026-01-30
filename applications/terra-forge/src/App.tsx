/**
 * TerraForge - AI-Powered Cost Calculation & Valuation Modeling Suite
 *
 * Gen2 Application for the TerraFusion OS
 *
 * @module App
 */

import { useEffect, useState } from 'react';
import { TF } from './lib/terraSystem';

// ============================================================================
// Boot Telemetry
// ============================================================================

function useTerraFusionBoot() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    if (booted) return;

    // Emit boot event to Neural Feed
    TF.log('info', 'TerraForge initialized', {
      topic: 'boot',
      data: {
        version: '1.0.0',
        port: 4201,
        timestamp: new Date().toISOString(),
      },
    });

    setBooted(true);
  }, [booted]);

  return booted;
}

// ============================================================================
// Main Application
// ============================================================================

export default function App() {
  const booted = useTerraFusionBoot();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* TerraForge Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">TerraForge</h1>
              <p className="text-xs text-slate-400">Cost Calculation & Valuation Modeling</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <h2 className="text-xl font-semibold mb-2">Welcome to TerraForge</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              AI-powered cost estimation and valuation modeling for government property assessment.
              This Gen2 application integrates with the TerraFusion OS neural feed.
            </p>
          </div>

          {/* IPC Demo Section */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              IPC Bridge Demo
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => {
                  TF.log('info', 'User clicked the demo button', { topic: 'user-action' });
                }}
                className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition text-sm font-medium"
              >
                📡 Send Log to Neural Feed
              </button>
              <button
                onClick={() => {
                  TF.openApp('terra-dossier');
                }}
                className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition text-sm font-medium"
              >
                🗂️ Open TerraDossier
              </button>
              <button
                onClick={() => {
                  TF.badge('busy', 'Processing...');
                  setTimeout(() => TF.badge('idle'), 3000);
                }}
                className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition text-sm font-medium"
              >
                ⏳ Set Busy Badge (3s)
              </button>
              <button
                onClick={() => {
                  TF.log('warn', 'Simulated warning event', {
                    topic: 'demo',
                    data: { severity: 'medium' },
                  });
                }}
                className="px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20 transition text-sm font-medium"
              >
                ⚠️ Send Warning
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Open the Sentinel Panel (click the chip in the taskbar) to see messages appear in the
              Neural Feed.
            </p>
          </div>

          {/* Coming Soon */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-400">Cost Engine Coming Soon</h3>
            <p className="text-sm text-slate-600 mt-2">
              RCNLD calculations, depreciation modeling, and AI-assisted valuation workflows
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
