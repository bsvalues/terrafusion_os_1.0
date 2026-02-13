'use client';

import React, { useState } from 'react';
import { IDELayout } from './components/ide/IDELayout';
import { WorkspaceDashboard } from './components/WorkspaceDashboard';

// App Component
const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [useWorkspaceDashboard, setUseWorkspaceDashboard] = useState(true); // Toggle for Phase 4 Portal

  // Splash screen timeout
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center text-white">
          {/* TerraFusion Logo from favicon.svg */}
          <div className="mb-8 flex justify-center">
            <svg width="120" height="120" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="tfGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width="256" height="256" fill="#0a1f2e" />
              <circle
                cx="128"
                cy="128"
                r="100"
                fill="none"
                stroke="#00d9ff"
                strokeWidth="2"
                opacity="0.3"
                filter="url(#tfGlow)"
              />
              <circle
                cx="128"
                cy="128"
                r="80"
                fill="none"
                stroke="#00d9ff"
                strokeWidth="2"
                opacity="0.2"
              />
              <circle
                cx="128"
                cy="128"
                r="50"
                fill="none"
                stroke="#00d9ff"
                strokeWidth="2.5"
                filter="url(#tfGlow)"
              />
              <path d="M128 78 L148 98 L128 118 L108 98 Z" fill="#00d9ff" filter="url(#tfGlow)" />
              <circle cx="128" cy="128" r="15" fill="#00d9ff" filter="url(#tfGlow)" opacity="0.8" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold mb-4 animate-fade-in">
            TerraFusion Developer Platform
          </h1>

          <p className="text-xl text-gray-300 mb-8 animate-fade-in-delay">
            VS Code-like IDE with Rust Backend
          </p>

          {/* Loading Animation */}
          <div className="flex justify-center mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>

          {/* Feature Tags */}
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
            {[
              '� File Browser',
              '✏️ Code Editor',
              '🔌 Terminal',
              '🤖 AI Copilot',
              '⚡ Task Runner',
              '🌐 Federation',
              '🔐 XMTP Escrow',
              '� Real-time Metrics',
            ].map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white/10 rounded-full text-sm backdrop-blur-sm animate-fade-in-stagger"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-sm text-gray-400 mt-8">Initializing developer environment...</p>
        </div>
      </div>
    );
  }

  return useWorkspaceDashboard ? <WorkspaceDashboard /> : <IDELayout />;
};

export default App;
