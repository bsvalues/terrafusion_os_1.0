/**
 * TerraFusion cOS - Router-Enabled Application
 * Integrates React Router for portal navigation + legacy demo views
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import TerraFusionCOSApp from './App.jsx';
import EducationPortal from './portals/education/index.jsx';
import EmergencyPortal from './portals/emergency/index.jsx';
import TransportationPortal from './portals/transportation/index.jsx';
import ParksPortal from './portals/parks/index.jsx';
import ErrorBoundary from './src/components/ErrorBoundary';
import './RouterApp.css';

const RouterApp = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter basename="/frontend_engine">
        <div className="router-app">
        {/* Global Navigation */}
        <nav className="global-nav">
          <div className="global-nav-brand">
            <Link to="/" className="brand-link">
              <span className="brand-logo">🌍</span>
              <span className="brand-name">TerraFusion OS</span>
            </Link>
          </div>
          
          <div className="global-nav-menu">
            <Link to="/" className="global-nav-link">Demo</Link>
            <Link to="/education" className="global-nav-link">Education Portal</Link>
            <Link to="/emergency" className="global-nav-link">Emergency</Link>
            <Link to="/transportation" className="global-nav-link">Transportation</Link>
            <Link to="/parks" className="global-nav-link">Parks</Link>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          {/* Legacy Demo View */}
          <Route path="/" element={<TerraFusionCOSApp />} />
          
          {/* Education Portal */}
          <Route path="/education/*" element={<EducationPortal />} />
          
          {/* Emergency Portal */}
          <Route path="/emergency/*" element={<EmergencyPortal />} />
          
          {/* Transportation Portal */}
          <Route path="/transportation/*" element={<TransportationPortal />} />
          
          {/* Parks Portal */}
          <Route path="/parks/*" element={<ParksPortal />} />
        </Routes>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default RouterApp;
