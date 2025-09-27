import React, {useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter as Router, Routes, Route, Link, useLocation} from 'react-router-dom';
import {PluginSidebar} from './PluginSidebar';
import {DashboardPage} from './DashboardPage';
import {AgentTelemetryAssistant} from './AgentTelemetryAssistant';
import {GovernmentDashboard} from './GovernmentDashboard';
import {GovernmentPluginManager} from './GovernmentPluginManager';
import {AIAssistant} from './AIAssistant';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import geniusUXService from './services/GeniusUXService';
import './index.css';
import './PluginSidebar.css';
import './DashboardPage.css';
import './GovernmentDashboard.css';
import './GovernmentPluginManager.css';
import './AIAssistant.css';
import './components/AdvancedAnalytics.css';

function NavBar() {
  const loc = useLocation();
  return (
    <nav className="tf-navbar"><><Link to="/" className="tf-logo">Terrafusion</Link><div
</>
className="tf-nav-links"><><Link className={loc.pathname==='/'?'active':''} to="/">Government Dashboard</Link><Link
</>
className={loc.pathname==='/plugins'?'active':''} to="/plugins">Plugin Marketplace</Link><><Link className={loc.pathname==='/analytics'?'active':''} to="/analytics">Advanced Analytics</Link><Link
</>
className={loc.pathname==='/legacy'?'active':''} to="/legacy">Legacy Dashboard</Link><Link className={loc.pathname==='/agent-telemetry'?'active':''} to="/agent-telemetry">Agent Telemetry</Link></div></nav>);
}

function App() {
  // Initialize Genius UX Service for automatic enhancements
  useEffect(() => {
    // Apply genius enhancements to all existing and new elements
    geniusUXService.calculateGeniusMetrics();
    
    // Log genius metrics for monitoring
    const metrics = geniusUXService.getMetrics();
    console.log('🚀 Terrafusion Genius Metrics:', {
      overall: `${metrics.overallScore.toFixed(1)}%`,
      delight: `${metrics.delightScore.toFixed(1)}%`,
      accessibility: `${metrics.accessibilityScore.toFixed(1)}%`,
      performance: `${metrics.performanceScore.toFixed(1)}%`,
      consistency: `${metrics.consistencyScore.toFixed(1)}%`,
      recommendations: metrics.recommendations
    });
    
    return () => {// Cleanup on unmount
      geniusUXService.destroy();};
  }, []);

  return (<Router><div className="tf-app"><NavBar /><main className="tf-main"><div className="tf-content"><Routes><Route path="/" element={<GovernmentDashboard />} /><Route path="/plugins" element={<GovernmentPluginManager />} /><Route path="/analytics" element={<AdvancedAnalytics />} /><Route path="/legacy" element={<div className="tf-legacy-layout"><PluginSidebar /><div className="tf-legacy-content"><DashboardPage /></div></div>} /><Route path="/agent-telemetry" element={<AgentTelemetryAssistant />} /></Routes></div></main><AIAssistant /></div></Router>);
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>
);

// Add minimal CSS for tf-navbar to index.css or your UI kit:
// .tf-navbar {display: flex; gap: 2rem; padding: 1rem 2rem 0 2rem; background: #f6f6fa; border-bottom: 1px solid #e0e0e0;}
// .tf-navbar a {color: #444; text-decoration: none; font-weight: 500;}
// .tf-navbar a.active {color: #1976d2; border-bottom: 2px solid #1976d2;}

