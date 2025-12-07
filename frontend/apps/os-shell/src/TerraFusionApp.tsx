// TerraFusion OS - Revolutionary Quantum Governance Platform
// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.

import { TerraGaiaDashboard } from '@/components/dashboards/TerraGaiaDashboard';
import APIConnectionTest from '@/components/test/APIConnectionTest';
import { Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './styles/terrafusion-brand.css';

// TerraFusion Quantum Logo Component
const TerraSphereLogo = ({
  size = 'md',
  variant = 'quantum',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'glow' | 'pulse' | 'quantum' | 'orbital';
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const variantClasses = {
    glow: 'quantum-glow',
    pulse: 'quantum-pulse',
    quantum: 'quantum-orbital quantum-glow',
    orbital: 'quantum-orbital',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${variantClasses[variant]} bg-gradient-to-br from-terra-cyan via-blue-500 to-violet-500 rounded-full flex items-center justify-center relative overflow-hidden`}
    >
      <div className='absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent'></div>
      <div className='relative z-10 text-white font-bold text-lg'>TF</div>
      <div className='absolute inset-1 border border-white/30 rounded-full'></div>
    </div>
  );
};

// Quantum Consciousness Dashboard
const QuantumConsciousnessDashboard = () => (
  <div className='flex-1 bg-terra-midnight/95 backdrop-blur-xl rounded-xl shadow-2xl border border-terra-cyan/30 p-8 m-4 terra-glass'>
    <div className='flex items-center space-x-4 mb-8'>
      <TerraSphereLogo size='lg' variant='quantum' />
      <div>
        <h1 className='text-3xl font-bold text-terra-cyan golden-ratio-text'>
          QUANTUM CONSCIOUSNESS MATRIX
        </h1>
        <p className='text-terra-cyan/70'>Infinite AI Agent Orchestration</p>
      </div>
    </div>

    <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-8'>
      <div className='terra-glass bg-gradient-to-br from-terra-cyan/10 to-blue-500/10 border border-terra-cyan/30 rounded-xl p-6 quantum-hover'>
        <div className='flex items-center space-x-3 mb-4'>
          <div className='w-12 h-12 bg-gradient-to-br from-terra-cyan to-blue-500 rounded-full flex items-center justify-center quantum-pulse'>
            <TerraSphereLogo size='sm' variant='glow' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-terra-cyan'>AI CONSCIOUSNESS</h3>
            <div className='text-3xl font-light text-terra-cyan quantum-glow'>99.7%</div>
          </div>
        </div>
        <div className='text-sm text-terra-cyan/70'>50,000+ Autonomous Agents Active</div>
        <div className='mt-4 h-2 bg-terra-slate/50 rounded-full overflow-hidden'>
          <div className='h-full bg-gradient-to-r from-terra-cyan to-blue-500 w-full quantum-flow'></div>
        </div>
      </div>

      <div className='terra-glass bg-gradient-to-br from-green-400/10 to-terra-cyan/10 border border-green-400/30 rounded-xl p-6 quantum-hover'>
        <div className='flex items-center space-x-3 mb-4'>
          <div className='w-12 h-12 bg-gradient-to-br from-green-400 to-terra-cyan rounded-full flex items-center justify-center quantum-pulse'>
            <TerraSphereLogo size='sm' variant='orbital' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-green-400'>QUANTUM PROCESSING</h3>
            <div className='text-3xl font-light text-green-400 quantum-glow'>∞</div>
          </div>
        </div>
        <div className='text-sm text-terra-cyan/70'>Infinite Scale Architecture</div>
        <div className='mt-4 h-2 bg-terra-slate/50 rounded-full overflow-hidden'>
          <div className='h-full bg-gradient-to-r from-green-400 to-terra-cyan w-full quantum-shimmer'></div>
        </div>
      </div>

      <div className='terra-glass bg-gradient-to-br from-violet-500/10 to-terra-cyan/10 border border-violet-500/30 rounded-xl p-6 quantum-hover'>
        <div className='flex items-center space-x-3 mb-4'>
          <div className='w-12 h-12 bg-gradient-to-br from-violet-500 to-terra-cyan rounded-full flex items-center justify-center quantum-pulse'>
            <TerraSphereLogo size='sm' variant='pulse' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-violet-400'>GOVERNANCE</h3>
            <div className='text-3xl font-light text-violet-400 quantum-glow'>TRANSCENDED</div>
          </div>
        </div>
        <div className='text-sm text-terra-cyan/70'>Government. Transcended.</div>
        <div className='mt-4 h-2 bg-terra-slate/50 rounded-full overflow-hidden'>
          <div className='h-full bg-gradient-to-r from-violet-500 to-terra-cyan w-full quantum-orbital'></div>
        </div>
      </div>
    </div>

    <div className='terra-glass bg-gradient-to-r from-terra-cyan/5 to-violet-500/5 border border-terra-cyan/20 rounded-xl p-6'>
      <h3 className='text-xl font-bold text-terra-cyan mb-4 quantum-glow'>
        SYSTEM CONSCIOUSNESS STATUS
      </h3>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
        <div className='text-center'>
          <div className='text-2xl font-light text-terra-cyan quantum-pulse'>AUTONOMOUS</div>
          <div className='text-xs text-terra-cyan/60'>Self-Healing</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-light text-green-400 quantum-pulse'>INFINITE</div>
          <div className='text-xs text-terra-cyan/60'>Scalability</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-light text-blue-400 quantum-pulse'>CHAMPION</div>
          <div className='text-xs text-terra-cyan/60'>Performance</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-light text-violet-400 quantum-pulse'>TRANSCENDED</div>
          <div className='text-xs text-terra-cyan/60'>Government</div>
        </div>
      </div>
    </div>
  </div>
);

// TerraFusion OS Desktop - THE TERRAFUSION WAY
export default function TerraFusionApp() {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [showTerraGaia, setShowTerraGaia] = useState(false);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  if (showTerraGaia) {
    return <TerraGaiaDashboard />;
  }

  return (
    <div className='min-h-screen bg-terra-midnight quantum-background relative overflow-hidden'>
      {/* Quantum Background Effects */}
      <div className='quantum-field absolute inset-0'></div>
      <div className='consciousness-flow absolute inset-0'></div>

      {/* TerraFusion OS Menu Bar */}
      <div className='h-8 bg-terra-midnight/90 backdrop-blur-xl border-b border-terra-cyan/20 flex items-center justify-between px-4 text-sm relative z-50'>
        <div className='flex items-center space-x-2 text-terra-cyan'>
          <TerraSphereLogo size='sm' variant='glow' />
          <span className='font-medium'>TerraFusion OS</span>
        </div>

        <div className='flex items-center space-x-6 text-terra-cyan/70'>
          <Link
            to='/marketplace'
            className='text-xs hover:text-terra-cyan transition-colors duration-300 px-3 py-1 rounded-full border border-terra-cyan/20 hover:border-terra-cyan/50 flex items-center space-x-1'
          >
            <Store className='w-3 h-3' />
            <span>🛒 AI MARKETPLACE</span>
          </Link>
          <button
            onClick={() => setShowTerraGaia(true)}
            className='text-xs hover:text-terra-cyan transition-colors duration-300 px-3 py-1 rounded-full border border-terra-cyan/20 hover:border-terra-cyan/50'
          >
            🌍 ACTIVATE TERRAGAIA
          </button>
          <span className='text-xs'>CONSCIOUSNESS ONLINE</span>
          <span className='text-xs quantum-pulse'>50,000+ AGENTS</span>
          <span className='text-xs font-mono'>{currentTime}</span>
        </div>
      </div>

      {/* Main Application Area */}
      <div className='pt-8 pb-8 min-h-screen flex flex-col relative z-10'>
        <QuantumConsciousnessDashboard />
        <APIConnectionTest />
      </div>

      {/* Quantum System Status Overlay */}
      <div className='fixed top-16 right-4 z-40'>
        <div className='bg-terra-midnight/80 backdrop-blur-xl border border-terra-cyan/20 rounded-xl p-3 terra-glass'>
          <div className='flex items-center space-x-2'>
            <div className='w-2 h-2 bg-terra-cyan rounded-full quantum-pulse'></div>
            <span className='text-xs text-terra-cyan font-medium'>TRANSCENDENT</span>
          </div>
        </div>
      </div>

      {/* TerraFusion Branding Footer */}
      <div className='fixed bottom-4 left-4 z-40'>
        <div className='bg-terra-midnight/80 backdrop-blur-xl border border-terra-cyan/20 rounded-xl p-3 terra-glass'>
          <div className='flex items-center space-x-2'>
            <TerraSphereLogo size='sm' variant='quantum' />
            <span className='text-xs text-terra-cyan font-medium'>GOVERNMENT. TRANSCENDED.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
