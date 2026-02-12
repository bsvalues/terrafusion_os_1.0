/**
 * TerraFusion cOS - Main Application Component
 * Government Operating System Desktop Interface
 * 
 * @architecture This demonstrates Terra-UI component library usage
 * All UI elements use design tokens via Terra-UI components
 */

import React, { useState, useEffect } from 'react';

// Import Terra-UI components
import { TerraButton, TerraCard, TerraMetric } from './src/components';

// Import cOS Core Modules - AI-Native Government Operating System
import TerraFlowApp from '../../modules/government-core/terra-flow/src/App';
import TerraFusionSyncApp from '../../modules/government-core/terra-fusion-sync/src/App_clean';
import CostForgeAIApp from '../../modules/government-core/costforge-ai-enhanced/src/CostForgeSimple'; // Using simplified version due to JSX corruption
import AISwarmDashboard from '../../modules/ai-systems/ai-swarm/src/AISwarmDashboard';

const TerraFusionCOSApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    // Load system status from Electron IPC
    if (window.electronAPI) {
      window.electronAPI.getSystemStatus().then(status => {
        if (status.success) {
          setSystemStatus(status.data);
        }
      });
    }
  }, []);

  return (
    <div className="tf-app">
      {/* TerraFusion cOS Header */}
      <header className="tf-header">
        <div className="tf-logo-section">
          <h1 className="tf-brand-title">TerraFusion cOS</h1>
          <p className="tf-tagline">Government. Transcended.</p>
        </div>
        <div className="tf-status-indicator">
          <span className="tf-status-dot tf-status-active"></span>
          <span className="tf-status-text">OPERATIONAL</span>
        </div>
      </header>

      {/* Navigation */}
      <nav className="tf-sidebar">
        <div className="tf-nav-menu">
          <button 
            className={`tf-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="tf-nav-icon">🏛️</span>
            <span className="tf-nav-label">Dashboard</span>
          </button>
          <button 
            className={`tf-nav-item ${currentView === 'costforge' ? 'active' : ''}`}
            onClick={() => setCurrentView('costforge')}
          >
            <span className="tf-nav-icon">💰</span>
            <span className="tf-nav-label">CostForge AI</span>
          </button>
          <button 
            className={`tf-nav-item ${currentView === 'sync' ? 'active' : ''}`}
            onClick={() => setCurrentView('sync')}
          >
            <span className="tf-nav-icon">🔄</span>
            <span className="tf-nav-label">TerraFusion Sync</span>
          </button>
          <button 
            className={`tf-nav-item ${currentView === 'flow' ? 'active' : ''}`}
            onClick={() => setCurrentView('flow')}
          >
            <span className="tf-nav-icon">⚡</span>
            <span className="tf-nav-label">TerraFlow</span>
          </button>
          <button 
            className={`tf-nav-item ${currentView === 'ai-swarm' ? 'active' : ''}`}
            onClick={() => setCurrentView('ai-swarm')}
          >
            <span className="tf-nav-icon">🤖</span>
            <span className="tf-nav-label">AI Swarm</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="tf-main-content">
        {currentView === 'dashboard' && <DashboardView status={systemStatus} />}
        {currentView === 'costforge' && <CostForgeAIApp />}
        {currentView === 'sync' && <TerraFusionSyncApp />}
        {currentView === 'flow' && <TerraFlowApp />}
        {currentView === 'ai-swarm' && <AISwarmDashboard />}
      </main>
    </div>
  );
};

// Dashboard View - Now using Terra-UI components!
const DashboardView = ({ status }) => (
  <div className="tf-dashboard">
    <h2 className="tf-section-title">Government Operations Center</h2>
    <div className="tf-status-grid">
      <TerraMetric 
        value={status?.aiSwarm?.agents || '50,000+'}
        label="AI Swarm Agents"
        subtitle="Active"
        trend="up"
        icon="🤖"
        animated={true}
      />
      <TerraMetric 
        value={status?.costforge?.integrations || '3'}
        label="CostForge AI Integrations"
        subtitle="Active"
        variant="success"
        icon="💰"
      />
      <TerraMetric 
        value={status?.security?.level || 'GOV'}
        label="Security Grade"
        subtitle="Secured"
        variant="success"
        icon="🔒"
      />
      <TerraMetric 
        value="LIVE"
        label="TerraFusion Sync"
        subtitle="Real-Time"
        trend="up"
        icon="🔄"
      />
    </div>
  </div>
);

// AI Swarm View - Now using TerraMetric components!
const AISwarmView = ({ status }) => (
  <div className="tf-swarm-view">
    <h2 className="tf-section-title">AI Swarm Coordination Center</h2>
    <p className="tf-section-subtitle">50,000+ AI agents working in harmony</p>
    <div className="tf-swarm-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)', marginTop: 'var(--spacing-xl)' }}>
      <TerraMetric 
        value="50,000+"
        label="Active Agents"
        trend="up"
        animated={true}
        variant="default"
      />
      <TerraMetric 
        value="99.8%"
        label="Success Rate"
        variant="success"
        trend="up"
      />
      <TerraMetric 
        value="1.8ms"
        label="Response Time"
        subtitle="Average"
        variant="success"
      />
      <TerraMetric 
        value="Claude"
        label="Supreme Commander"
        icon="👑"
        variant="default"
      />
    </div>
  </div>
);

export default TerraFusionCOSApp;

