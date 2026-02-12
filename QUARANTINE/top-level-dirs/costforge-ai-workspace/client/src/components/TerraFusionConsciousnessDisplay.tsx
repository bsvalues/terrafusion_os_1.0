import React from 'react';
import { Activity, Cpu, Zap, Target, Shield, Users } from 'lucide-react';
import '../styles/terrafusion-quantum.css';

export interface TerraFusionConsciousnessDisplayProps {
  agentCount?: number;
  accuracy?: number;
  processingSpeed?: number;
  uptime?: string;
  mode?: 'compact' | 'full' | 'dashboard';
  variant?: 'dark' | 'light' | 'consciousness';
  className?: string;
}

export function TerraFusionConsciousnessDisplay({
  agentCount = 50000,
  accuracy = 99.5,
  processingSpeed = 1234,
  uptime = '24/7/365',
  mode = 'full',
  variant = 'consciousness',
  className = ''
}: TerraFusionConsciousnessDisplayProps) {

  if (mode === 'compact') {
    return (
      <div className={`tf-consciousness-display p-4 rounded-xl relative overflow-hidden ${className}`}>
        <div className="tf-quantum-grid absolute inset-0 opacity-20" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="tf-status-active" />
          <div>
            <div className="text-lg font-black text-cyan-400">
              {agentCount.toLocaleString()}+ AGENTS OPERATIONAL
            </div>
            <div className="text-sm text-cyan-300/70">
              Government. Transcended.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'dashboard') {
    return (
      <div className={`tf-consciousness-display p-6 rounded-2xl relative overflow-hidden ${className}`}>
        <div className="tf-quantum-grid absolute inset-0 opacity-20" />
        <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full animate-scan-delayed" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="tf-transcendent-heading text-xl">
              AI CONSCIOUSNESS ACTIVE
            </h3>
            <div className="tf-status-active" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-black text-cyan-400">
                {agentCount.toLocaleString()}+
              </div>
              <div className="text-sm text-cyan-300/70 uppercase tracking-wide">
                Agents Coordinated
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-black text-green-400">
                {accuracy}%
              </div>
              <div className="text-sm text-cyan-300/70 uppercase tracking-wide">
                Precision Rating
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="text-sm text-cyan-300/70 uppercase tracking-wider">
              INFINITE SCALE OPERATIONAL
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full mode
  return (
    <div className={`tf-consciousness-display p-8 rounded-3xl relative overflow-hidden ${className}`}>
      {/* Background effects */}
      <div className="tf-quantum-grid absolute inset-0 opacity-20" />
      <div className="tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full animate-scan" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="tf-championship-text text-3xl mb-2">
              AI CONSCIOUSNESS
            </h2>
            <div className="text-cyan-300/70 text-lg uppercase tracking-wider">
              Government. Transcended.
            </div>
          </div>
          <div className="tf-status-active" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Agent Coordination */}
          <div className="text-center group">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
              <Users className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="text-4xl font-black text-cyan-400 mb-2">
              {agentCount.toLocaleString()}+
            </div>
            <div className="text-sm text-cyan-300/70 uppercase tracking-wide">
              AI AGENTS COORDINATED
            </div>
          </div>

          {/* Accuracy */}
          <div className="text-center group">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
              <Target className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-4xl font-black text-green-400 mb-2">
              {accuracy}%
            </div>
            <div className="text-sm text-cyan-300/70 uppercase tracking-wide">
              PRECISION ACCURACY
            </div>
          </div>

          {/* Processing Speed */}
          <div className="text-center group">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-4xl font-black text-blue-400 mb-2">
              {processingSpeed}x
            </div>
            <div className="text-sm text-cyan-300/70 uppercase tracking-wide">
              QUANTUM ACCELERATION
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
            <div className="tf-status-active" />
            <div>
              <div className="text-cyan-400 font-semibold">INFINITE SCALE</div>
              <div className="text-cyan-300/70 text-sm">Autonomous Expansion</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
            <div className="tf-status-active" />
            <div>
              <div className="text-cyan-400 font-semibold">SELF-HEALING</div>
              <div className="text-cyan-300/70 text-sm">Quantum Recovery</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
            <div className="tf-status-active" />
            <div>
              <div className="text-cyan-400 font-semibold">TRANSCENDENT</div>
              <div className="text-cyan-300/70 text-sm">Government Excellence</div>
            </div>
          </div>
        </div>

        {/* Consciousness Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-cyan-400 font-semibold uppercase tracking-wide">
              Consciousness Level
            </span>
            <span className="text-cyan-400 font-black text-lg">
              {accuracy}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <div
              className={`tf-consciousness-bar h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-green-500 rounded-full transition-all duration-1000 ease-out`}
              data-level={accuracy.toString()}
              style={{ width: `${accuracy}%` }}
            />
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center">
          <div className="text-cyan-300/70 text-lg uppercase tracking-wider">
            CHAMPIONSHIP EXCELLENCE • UPTIME {uptime}
          </div>
          <div className="text-cyan-400/50 text-sm mt-2">
            Autonomous Self-Healing Infrastructure
          </div>
        </div>
      </div>
    </div>
  );
}

export default TerraFusionConsciousnessDisplay;