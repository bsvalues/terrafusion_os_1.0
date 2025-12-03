/**
 * LaunchpadOverlay - Grid overlay for launching suites and apps
 * Tahoe-style app grid with glass effects
 */

import { EliteQuantumIcon } from '@/components/icons/EliteIcons';
import React, { useEffect } from 'react';
import type { UserMode } from './TerraFusionDesktop';

interface LaunchpadOverlayProps {
  mode: UserMode;
  onClose: () => void;
  onOpenSuite: (suiteId: string) => void;
  onOpenApp: (appId: string) => void;
}

export const LaunchpadOverlay: React.FC<LaunchpadOverlayProps> = ({
  mode,
  onClose,
  onOpenSuite,
  onOpenApp,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // All available suites
  const suites = [
    {
      id: 'assessment',
      name: 'TerraFusion Assessment',
      subtitle: 'Quantum property valuation with AI consciousness',
      icon: <EliteQuantumIcon iconType='Database' className='w-12 h-12' glowIntensity='high' />,
      category: 'core',
    },
    {
      id: 'levy',
      name: 'TerraFusion Levy Intelligence',
      subtitle: 'Championship tax processing with neural optimization',
      icon: <EliteQuantumIcon iconType='Shield' className='w-12 h-12' glowIntensity='high' />,
      category: 'core',
    },
    {
      id: 'gis',
      name: 'TerraFusion GIS Transcendence',
      subtitle: 'Quantum-enhanced geospatial analysis and mapping',
      icon: <EliteQuantumIcon iconType='Layers' className='w-12 h-12' glowIntensity='high' />,
      category: 'core',
    },
    {
      id: 'insights',
      name: 'TerraFusion Insights Excellence',
      subtitle: 'Government analytics transcended with infinite scale',
      icon: <EliteQuantumIcon iconType='Activity' className='w-12 h-12' glowIntensity='high' />,
      category: 'core',
    },
  ];

  // Apps vary by mode
  const apps =
    mode === 'county'
      ? [
          {
            id: 'help',
            name: 'TerraFusion Support Excellence',
            subtitle: 'Government-grade assistance and documentation',
            icon: (
              <EliteQuantumIcon iconType='Settings' className='w-8 h-8' glowIntensity='medium' />
            ),
            category: 'utility',
          },
          {
            id: 'reports',
            name: 'TerraFusion Reports Intelligence',
            subtitle: 'AI-powered report generation and analytics',
            icon: (
              <EliteQuantumIcon iconType='Activity' className='w-8 h-8' glowIntensity='medium' />
            ),
            category: 'utility',
          },
          {
            id: 'notifications',
            name: 'TerraFusion Notifications',
            subtitle: 'System alerts with consciousness monitoring',
            icon: <EliteQuantumIcon iconType='Zap' className='w-8 h-8' glowIntensity='medium' />,
            category: 'utility',
          },
          {
            id: 'settings',
            name: 'TerraFusion Settings',
            subtitle: 'Account preferences with AI optimization',
            icon: (
              <EliteQuantumIcon iconType='Settings' className='w-8 h-8' glowIntensity='medium' />
            ),
            category: 'utility',
          },
        ]
      : [
          {
            id: 'costforge',
            name: 'CostForge AI Consciousness',
            subtitle: 'Quantum AI cost estimation with neural coordination',
            icon: <EliteQuantumIcon iconType='Brain' glowIntensity='medium' className='w-8 h-8' />,
            category: 'ai',
          },
          {
            id: 'sync',
            name: 'TerraSync Intelligence',
            subtitle: 'Real-time data synchronization with AI orchestration',
            icon: (
              <EliteQuantumIcon iconType='Network' glowIntensity='medium' className='w-8 h-8' />
            ),
            category: 'integration',
          },
          {
            id: 'flow',
            name: 'TerraFlow Orchestration',
            subtitle: 'Workflow automation with quantum optimization',
            icon: <EliteQuantumIcon iconType='Zap' glowIntensity='medium' className='w-8 h-8' />,
            category: 'automation',
          },
          {
            id: 'analytics',
            name: 'TerraFusion Analytics Elite',
            subtitle: 'Championship-level data analysis and insights',
            icon: <EliteQuantumIcon iconType='Gauge' glowIntensity='medium' className='w-8 h-8' />,
            category: 'analysis',
          },
          {
            id: 'monitor',
            name: 'TerraFusion System Monitor',
            subtitle: 'Performance monitoring with consciousness tracking',
            icon: (
              <EliteQuantumIcon iconType='Monitor' glowIntensity='medium' className='w-8 h-8' />
            ),
            category: 'system',
          },
          {
            id: 'terminal',
            name: 'Terminal',
            subtitle: 'Command line access',
            icon: <EliteQuantumIcon iconType='CPU' className='w-8 h-8' glowIntensity='medium' />,
            category: 'system',
          },
          {
            id: 'ai-console',
            name: 'AI Console',
            subtitle: 'AI agent management',
            icon: <EliteQuantumIcon iconType='Brain' className='w-8 h-8' glowIntensity='medium' />,
            category: 'ai',
          },
          {
            id: 'settings',
            name: 'Settings',
            subtitle: 'System configuration',
            icon: (
              <EliteQuantumIcon iconType='Settings' className='w-8 h-8' glowIntensity='medium' />
            ),
            category: 'utility',
          },
        ];

  return (
    <div className='tf-launchpad-overlay' onClick={onClose}>
      <div className='tf-launchpad-content' onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className='tf-launchpad-header'>
          <div className='tf-launchpad-brand'>
            <div className='tf-launchpad-logo-container'>
              <EliteQuantumIcon iconType='Monitor' className='w-16 h-16' glowIntensity='high' />
              <div className='tf-launchpad-logo'>TerraFusion</div>
            </div>
            <h1 className='tf-launchpad-title'>
              {mode === 'county' ? 'Government. Simplified.' : 'Infrastructure Intelligence'}
            </h1>
            <div className='tf-launchpad-subtitle'>
              {mode === 'county'
                ? 'Experience effortless workflows and championship results'
                : 'Infinite scale operations with tactical municipal excellence'}
            </div>
          </div>
          <button className='tf-launchpad-close' onClick={onClose}>
            ×
          </button>
        </div>

        {/* Suites Section */}
        <section className='tf-launchpad-section'>
          <h2 className='tf-launchpad-section-title'>Core Suites</h2>
          <div className='tf-launchpad-grid tf-launchpad-suites'>
            {suites.map((suite) => (
              <button
                key={suite.id}
                className='tf-launchpad-item tf-launchpad-suite'
                onClick={() => onOpenSuite(suite.id)}
              >
                <div className='tf-launchpad-item-icon'>{suite.icon}</div>
                <div className='tf-launchpad-item-content'>
                  <div className='tf-launchpad-item-name'>{suite.name}</div>
                  <div className='tf-launchpad-item-subtitle'>{suite.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Apps Section */}
        <section className='tf-launchpad-section'>
          <h2 className='tf-launchpad-section-title'>
            {mode === 'county' ? 'Tools & Utilities' : 'Advanced Applications'}
          </h2>
          <div className='tf-launchpad-grid tf-launchpad-apps'>
            {apps.map((app) => (
              <button
                key={app.id}
                className={`tf-launchpad-item tf-launchpad-app tf-app-${app.category}`}
                onClick={() => onOpenApp(app.id)}
              >
                <div className='tf-launchpad-item-icon'>{app.icon}</div>
                <div className='tf-launchpad-item-content'>
                  <div className='tf-launchpad-item-name'>{app.name}</div>
                  <div className='tf-launchpad-item-subtitle'>{app.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className='tf-launchpad-footer'>
          <div className='tf-launchpad-stats'>
            <div className='tf-footer-brand'>
              <EliteQuantumIcon iconType='Monitor' className='w-4 h-4' glowIntensity='low' />
              <span className='tf-footer-brand-text'>TerraFusion OS</span>
            </div>
            <span>•</span>
            <span className='tf-footer-tagline'>The neural network of your county</span>
            <span>•</span>
            <span className='tf-footer-excellence'>
              Infrastructure Intelligence • Government Transcended
            </span>
          </div>
          <div className='tf-footer-tagline'>The neural network of your county</div>
        </div>
      </div>
    </div>
  );
};
