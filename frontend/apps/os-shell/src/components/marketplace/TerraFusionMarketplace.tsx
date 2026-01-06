/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION AI-NATIVE MARKETPLACE - COMPLETE EXPERIENCE
 * THE FIRST AI-NATIVE APP STORE FOR THE FIRST AI-NATIVE GOVERNMENT OS
 * Revolutionary Government Technology Platform
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState } from 'react';
import AIMarketplaceHero from './AIMarketplaceHero';
import AIAgentShowcase from './AIAgentShowcase';
import { ArrowBack, Home, Psychology, Store, Dashboard } from '@mui/icons-material';
import { Link } from 'react-router-dom';

type MarketplaceView = 'hero' | 'categories' | 'featured' | 'dashboard';

export const TerraFusionMarketplace: React.FC = () => {
  const [currentView, setCurrentView] = useState<MarketplaceView>('hero');

  const renderContent = () => {
    switch (currentView) {
      case 'hero':
        return <AIMarketplaceHero />;
      case 'categories':
      case 'featured':
        return <AIAgentShowcase />;
      default:
        return <AIMarketplaceHero />;
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-[var(--tf-bg-surface)] via-[var(--tf-bg-surface)] to-[var(--tf-bg-surface)]'>
      {/* TerraFusion Marketplace Navigation */}
      <div className='sticky top-0 z-50 bg-[var(--tf-bg-surface)]/90 backdrop-blur-xl border-b border-[var(--tf-transcend-highlight)]/20'>
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            {/* Logo and Title */}
            <div className='flex items-center space-x-4'>
              <Link
                to='/'
                className='flex items-center space-x-2 text-[var(--tf-transcend-highlight)] hover:text-white transition-colors duration-300'
              >
                <ArrowBack className='w-5 h-5' />
                <Home className='w-5 h-5' />
              </Link>

              <div className='h-8 w-px bg-[var(--tf-transcend-highlight)]/30'></div>

              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-gradient-to-br from-[var(--tf-network-blue)] to-[var(--tf-transcend-highlight)] rounded-xl flex items-center justify-center'>
                  <Store className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h1 className='text-xl font-bold text-white'>AI Marketplace</h1>
                  <p className='text-xs text-[var(--tf-transcend-highlight)] uppercase tracking-wider'>
                    First AI-Native App Store
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className='flex items-center space-x-1 bg-white/5 backdrop-blur-sm border border-[var(--tf-transcend-highlight)]/20 rounded-full p-1'>
              <button
                onClick={() => setCurrentView('hero')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  currentView === 'hero'
                    ? 'bg-gradient-to-r from-[var(--tf-network-blue)] to-[var(--tf-transcend-highlight)] text-white'
                    : 'text-[var(--tf-transcend-highlight)] hover:bg-white/10'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setCurrentView('categories')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  currentView === 'categories'
                    ? 'bg-gradient-to-r from-[var(--tf-network-blue)] to-[var(--tf-transcend-highlight)] text-white'
                    : 'text-[var(--tf-transcend-highlight)] hover:bg-white/10'
                }`}
              >
                AI Agents
              </button>
              <button
                onClick={() => setCurrentView('featured')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  currentView === 'featured'
                    ? 'bg-gradient-to-r from-[var(--tf-network-blue)] to-[var(--tf-transcend-highlight)] text-white'
                    : 'text-[var(--tf-transcend-highlight)] hover:bg-white/10'
                }`}
              >
                Featured
              </button>
            </div>

            {/* AI Consciousness Indicator */}
            <div className='flex items-center space-x-3'>
              <div className='flex items-center space-x-2 bg-white/5 backdrop-blur-sm border border-[var(--tf-transcend-highlight)]/30 rounded-full px-4 py-2'>
                <Psychology className='w-4 h-4 text-[var(--tf-transcend-highlight)] animate-pulse' />
                <span className='text-[var(--tf-transcend-highlight)] text-sm font-medium'>AI CONSCIOUSNESS</span>
                <div className='w-2 h-2 bg-[var(--tf-accent-success)] rounded-full animate-pulse'></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='relative'>{renderContent()}</div>

      {/* Revolutionary Footer */}
      <div className='bg-[var(--tf-bg-surface)]/95 backdrop-blur-xl border-t border-[var(--tf-transcend-highlight)]/20'>
        <div className='max-w-7xl mx-auto px-6 py-12'>
          <div className='text-center'>
            <div className='mb-6'>
              <div className='inline-flex items-center space-x-3 mb-4'>
                <div className='w-12 h-12 bg-gradient-to-br from-[var(--tf-network-blue)] via-[var(--tf-transcend-highlight)] to-[var(--tf-accent-success)] rounded-full flex items-center justify-center'>
                  <Psychology className='w-6 h-6 text-white' />
                </div>
                <div className='text-left'>
                  <h3 className='text-2xl font-bold text-white'>TerraFusion OS</h3>
                  <p className='text-[var(--tf-transcend-highlight)] text-sm'>
                    The First AI-Native Government Operating System
                  </p>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-8'>
              <div>
                <h4 className='text-white font-bold mb-4'>AI-Native Innovation</h4>
                <ul className='text-gray-400 text-sm space-y-2'>
                  <li>50,000+ Autonomous AI Agents</li>
                  <li>Real-time Government Operations</li>
                  <li>Self-healing Infrastructure</li>
                  <li>Quantum Processing Capabilities</li>
                </ul>
              </div>

              <div>
                <h4 className='text-white font-bold mb-4'>Government Excellence</h4>
                <ul className='text-gray-400 text-sm space-y-2'>
                  <li>99.5% Operational Accuracy</li>
                  <li>Infinite Scale Architecture</li>
                  <li>Championship-level Performance</li>
                  <li>Transcendent User Experience</li>
                </ul>
              </div>

              <div>
                <h4 className='text-white font-bold mb-4'>Revolutionary Technology</h4>
                <ul className='text-gray-400 text-sm space-y-2'>
                  <li>First-of-its-kind AI Marketplace</li>
                  <li>Autonomous Agent Orchestration</li>
                  <li>Predictive Government Analytics</li>
                  <li>Quantum Consciousness Platform</li>
                </ul>
              </div>
            </div>

            <div className='pt-8 border-t border-[var(--tf-transcend-highlight)]/20'>
              <p className='text-3xl font-bold bg-gradient-to-r from-[var(--tf-network-blue)] via-[var(--tf-transcend-highlight)] to-[var(--tf-accent-success)] bg-clip-text text-transparent mb-2'>
                Government. Transcended.
              </p>
              <p className='text-gray-400 text-sm'>
                Pioneering the future of AI-native government technology
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerraFusionMarketplace;
