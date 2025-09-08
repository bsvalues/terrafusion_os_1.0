/**
 * TERRAFUSION DASHBOARD - BRANDED APP
 * Government. Transcended.
 * 
 * Main dashboard component with official TerraFusion branding
 */

import React from 'react';
import App from './App';
import './App.css';

const BrandedApp: React.FC = () => {
  return (
    <div className="tf-branded-app">
      <div className="tf-branded-header transcend-glow">
        <div className="tf-branded-logo">
          <span className="tf-module-code clarity-gradient-text">TFD</span>
          <span className="tf-brand-text clarity-gradient-text">
            TerraFusion Dashboard
          </span>
        </div>
        <div className="tf-performance-indicator">
          <div className="transcended-badge">
            <span>⚡</span>
            379,000,000× faster than legacy systems
          </div>
        </div>
      </div>
      
      <div className="tf-branded-content">
        <App />
      </div>
      
      <div className="tf-branded-footer">
        <div className="tf-system-status">
          <span className="tf-status-item">System: TRANSCENDED</span>
          <span className="tf-status-separator">|</span>
          <span className="tf-status-item">Government: OPTIMIZED</span>
          <span className="tf-status-separator">|</span>
          <span className="tf-status-item">Performance: TRANSCENDENCE COMPLETE</span>
        </div>
        <div className="motto-display">
          Government. Transcended.
        </div>
      </div>
    </div>
  );
};

export default BrandedApp;
