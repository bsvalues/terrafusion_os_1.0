/**
 * TerraFusion cOS 2.0 - Main Layout
 * Public-facing layout with navigation
 */

import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import TerraFusionLogo from '../components/TerraFusionLogo';

const MainLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/vendor-portal', label: 'Vendor Portal' },
    { path: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <div className="tf-layout-main">
      {/* Header */}
      <header className="tf-header">
        <div className="tf-container">
          <nav className="tf-nav">
            <Link to="/" className="tf-nav-logo">
              <TerraFusionLogo variant="full" size="md" />
            </Link>
            
            <div className="tf-nav-links">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`tf-nav-link ${
                    location.pathname === item.path ? 'active' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="tf-nav-actions">
              <button className="tf-btn tf-btn-ghost">
                Documentation
              </button>
              <button className="tf-btn tf-btn-primary">
                Get Started
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="tf-main">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="tf-footer">
        <div className="tf-container">
          <div className="tf-footer-content">
            <div className="tf-footer-section">
              <TerraFusionLogo variant="icon" size="md" />
              <p className="tf-text-muted tf-mt-2">
                Government. Transcended.
              </p>
            </div>
            
            <div className="tf-footer-section">
              <h4 className="tf-h3 tf-mb-2">Platform</h4>
              <ul className="tf-footer-links">
                <li><a href="#">AI Swarm</a></li>
                <li><a href="#">CostForge AI</a></li>
                <li><a href="#">TerraFlow</a></li>
                <li><a href="#">Security Mesh</a></li>
              </ul>
            </div>
            
            <div className="tf-footer-section">
              <h4 className="tf-h3 tf-mb-2">Resources</h4>
              <ul className="tf-footer-links">
                <li><a href="#">Documentation</a></li>
                <li><a href="#">API Reference</a></li>
                <li><a href="#">Integration Guide</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>
            
            <div className="tf-footer-section">
              <h4 className="tf-h3 tf-mb-2">Company</h4>
              <ul className="tf-footer-links">
                <li><a href="#">About</a></li>
                <li><a href="#">Partners</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="tf-footer-bottom">
            <p className="tf-text-muted tf-small">
              © 2024 TerraFusion Systems. MIT PhD Systems Design Engineer Standards.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
