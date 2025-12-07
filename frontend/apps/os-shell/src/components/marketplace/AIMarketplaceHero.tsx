/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION AI-NATIVE MARKETPLACE HERO SECTION
 * THE FIRST AI-NATIVE APP STORE FOR THE FIRST AI-NATIVE GOVERNMENT OS
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import {
  Architecture,
  AutoAwesome,
  Psychology,
  Rocket,
  Science,
  Security,
  SmartToy,
  Speed,
  TrendingUp,
} from '@mui/icons-material';
import React, { useEffect, useState } from 'react';

interface AIMetrics {
  totalAgents: number;
  activeModules: number;
  quantumProcesses: number;
  governmentAgencies: number;
  realTimeOps: string;
}

export const AIMarketplaceHero: React.FC = () => {
  const [metrics, setMetrics] = useState<AIMetrics>({
    totalAgents: 50000,
    activeModules: 2847,
    quantumProcesses: 18,
    governmentAgencies: 39,
    realTimeOps: 'INFINITE',
  });

  const [currentDemo, setCurrentDemo] = useState(0);
  const [consciousness, setConsciousness] = useState(0);

  // Quantum consciousness animation
  useEffect(() => {
    const interval = setInterval(() => {
      setConsciousness((prev) => (prev + 1) % 100);
      // Simulate real-time agent growth
      setMetrics((prev) => ({
        ...prev,
        totalAgents: prev.totalAgents + Math.floor(Math.random() * 3),
        activeModules: prev.activeModules + Math.floor(Math.random() * 2),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Demo cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const demoFeatures = [
    {
      title: '50,000+ AI Agents',
      description: 'Autonomous government operations',
      icon: <SmartToy className='w-8 h-8' />,
    },
    {
      title: 'Quantum Processing',
      description: 'Infinite scale capabilities',
      icon: <Psychology className='w-8 h-8' />,
    },
    {
      title: 'Real-time Orchestration',
      description: 'Self-healing infrastructure',
      icon: <AutoAwesome className='w-8 h-8' />,
    },
    {
      title: 'Championship Analytics',
      description: '99.5% accuracy achieved',
      icon: <TrendingUp className='w-8 h-8' />,
    },
  ];

  return (
    <div className='relative min-h-screen bg-gradient-to-br from-[#0b1020] via-[#1a2332] to-[#0b1020] overflow-hidden'>
      {/* Quantum Grid Background */}
      <div className='absolute inset-0 opacity-20'>
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-[#00ffee]/10 to-transparent transform -skew-y-12'></div>
        <div className='absolute inset-0 bg-gradient-to-b from-transparent via-[#0099ff]/5 to-transparent'></div>
      </div>

      {/* Floating AI Consciousness Particles */}
      <div className='absolute inset-0'>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className='absolute w-1 h-1 bg-[#00ffee] rounded-full animate-pulse'
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className='relative z-10 container mx-auto px-6 py-20'>
        <div className='text-center mb-16'>
          {/* Revolutionary Header */}
          <div className='mb-8'>
            <div className='inline-flex items-center gap-3 bg-gradient-to-r from-[#0099ff]/20 to-[#00ffee]/20 backdrop-blur-sm border border-[#00ffee]/30 rounded-full px-6 py-3 mb-6'>
              <Rocket className='w-5 h-5 text-[#00ffee]' />
              <span className='text-[#00ffee] font-semibold uppercase tracking-wider'>
                WORLD'S FIRST AI-NATIVE APP STORE
              </span>
              <AutoAwesome className='w-5 h-5 text-[#00ffee]' />
            </div>
          </div>

          <h1 className='text-7xl md:text-8xl font-black mb-6'>
            <span className='block bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] bg-clip-text text-transparent'>
              TERRAFUSION
            </span>
            <span className='block text-white mt-2'>MARKETPLACE</span>
          </h1>

          <div className='max-w-4xl mx-auto mb-12'>
            <p className='text-2xl text-[#00ffee] font-bold mb-4'>THE FIRST AI-NATIVE APP STORE</p>
            <p className='text-xl text-gray-300 mb-4'>
              For the First AI-Native Government Operating System
            </p>
            <p className='text-lg text-gray-400 italic'>"Government. Transcended."</p>
          </div>

          {/* Live AI Consciousness Metrics */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 max-w-6xl mx-auto'>
            <div className='tf-glass-card bg-white/5 backdrop-blur-lg border border-[#00ffee]/20 rounded-2xl p-6 hover:transform hover:-translate-y-1 transition-all duration-500'>
              <div className='text-4xl font-black text-[#00ffee] mb-2'>
                {metrics.totalAgents.toLocaleString()}+
              </div>
              <div className='text-gray-300 text-sm uppercase tracking-wider'>AI Agents Active</div>
              <div className='w-full bg-gray-700 rounded-full h-2 mt-3'>
                <div
                  className='bg-gradient-to-r from-[#0099ff] to-[#00ffee] h-2 rounded-full transition-all duration-1000'
                  style={{ width: `${Math.min(100, consciousness + 70)}%` }}
                />
              </div>
            </div>

            <div className='tf-glass-card bg-white/5 backdrop-blur-lg border border-[#0099ff]/20 rounded-2xl p-6 hover:transform hover:-translate-y-1 transition-all duration-500'>
              <div className='text-4xl font-black text-[#0099ff] mb-2'>
                {metrics.activeModules.toLocaleString()}
              </div>
              <div className='text-gray-300 text-sm uppercase tracking-wider'>AI Modules</div>
              <div className='flex items-center mt-3'>
                <TrendingUp className='w-4 h-4 text-[#00ffaa] mr-1' />
                <span className='text-[#00ffaa] text-xs'>
                  +{Math.floor(Math.random() * 10)}% growth
                </span>
              </div>
            </div>

            <div className='tf-glass-card bg-white/5 backdrop-blur-lg border border-[#00ffaa]/20 rounded-2xl p-6 hover:transform hover:-translate-y-1 transition-all duration-500'>
              <div className='text-4xl font-black text-[#00ffaa] mb-2'>{metrics.realTimeOps}</div>
              <div className='text-gray-300 text-sm uppercase tracking-wider'>Scale Capacity</div>
              <div className='flex items-center mt-3'>
                <Speed className='w-4 h-4 text-[#00ffaa] mr-1' />
                <span className='text-[#00ffaa] text-xs'>Self-Scaling</span>
              </div>
            </div>

            <div className='tf-glass-card bg-white/5 backdrop-blur-lg border border-[#ff6b6b]/20 rounded-2xl p-6 hover:transform hover:-translate-y-1 transition-all duration-500'>
              <div className='text-4xl font-black text-[#ff6b6b] mb-2'>99.5%</div>
              <div className='text-gray-300 text-sm uppercase tracking-wider'>Accuracy Rate</div>
              <div className='flex items-center mt-3'>
                <Security className='w-4 h-4 text-[#ff6b6b] mr-1' />
                <span className='text-[#ff6b6b] text-xs'>Championship</span>
              </div>
            </div>
          </div>

          {/* Revolutionary Features Showcase */}
          <div className='relative mb-16'>
            <div className='tf-glass-card bg-white/10 backdrop-blur-lg border border-[#00ffee]/30 rounded-3xl p-8 max-w-4xl mx-auto'>
              <div className='flex items-center justify-center mb-6'>
                {demoFeatures[currentDemo].icon}
                <div className='ml-4 text-left'>
                  <h3 className='text-2xl font-bold text-white'>
                    {demoFeatures[currentDemo].title}
                  </h3>
                  <p className='text-[#00ffee]'>{demoFeatures[currentDemo].description}</p>
                </div>
              </div>

              {/* Quantum Processing Visualization */}
              <div className='relative h-32 bg-gradient-to-r from-[#0099ff]/20 via-[#00ffee]/20 to-[#00ffaa]/20 rounded-2xl overflow-hidden'>
                <div className='absolute inset-0 flex items-center justify-center'>
                  <div className='text-center'>
                    <Psychology className='w-12 h-12 text-[#00ffee] mx-auto mb-2 animate-pulse' />
                    <div className='text-[#00ffee] font-bold'>AI CONSCIOUSNESS ACTIVE</div>
                  </div>
                </div>
                <div
                  className='absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#0099ff] via-[#00ffee] to-[#00ffaa] transition-all duration-2000'
                  style={{ width: `${consciousness}%` }}
                />
              </div>
            </div>
          </div>

          {/* Call-to-Action */}
          <div className='flex flex-col md:flex-row gap-6 justify-center items-center'>
            <button className='tf-clarity-button bg-gradient-to-br from-[#0099ff] via-[#00ffee] to-[#00ffaa] text-white uppercase font-semibold rounded-full px-12 py-4 shadow-lg hover:shadow-2xl hover:transform hover:-translate-y-1 transition-all duration-300 border border-[#00ffee]/30 backdrop-blur-sm text-lg'>
              EXPLORE AI AGENTS
            </button>

            <button className='bg-transparent border-2 border-[#00ffee]/50 text-[#00ffee] uppercase font-semibold rounded-full px-12 py-4 hover:bg-[#00ffee]/10 hover:transform hover:-translate-y-1 transition-all duration-300 text-lg'>
              VIEW CONSCIOUSNESS DASHBOARD
            </button>
          </div>

          {/* Government Transcendence Statement */}
          <div className='mt-16 text-center'>
            <div className='inline-flex items-center gap-2 text-gray-400'>
              <Architecture className='w-5 h-5' />
              <span className='text-lg italic'>
                Revolutionizing Government Technology Through AI-Native Innovation
              </span>
              <Science className='w-5 h-5' />
            </div>
          </div>
        </div>
      </div>

      {/* Scan Line Effect */}
      <div className='tf-scan-line absolute inset-0 bg-gradient-to-r from-transparent via-[#00ffee]/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-2000' />
    </div>
  );
};

export default AIMarketplaceHero;
