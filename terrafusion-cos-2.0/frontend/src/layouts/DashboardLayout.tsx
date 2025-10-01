/**
 * TerraFusion cOS 2.0 - Dashboard Layout
 * Internal dashboard with sidebar navigation
 */

import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import TerraFusionLogo from '../components/TerraFusionLogo';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Overview',
      icon: '📊',
      description: 'System overview and metrics'
    },
    {
      path: '/ai-swarm',
      label: 'AI Swarm',
      icon: '🤖',
      description: '50,000+ AI agents'
    },
    {
      path: '/costforge',
      label: 'CostForge AI',
      icon: '💰',
      description: 'Financial intelligence'
    },
    {
      path: '/sync',
      label: 'TerraFusion Sync',
      icon: '🔄',
      description: 'Real-time data sync'
    },
    {
      path: '/flow',
      label: 'TerraFlow',
      icon: '🌊',
      description: 'Workflow orchestration'
    },
    {
      path: '/ide',
      label: 'TerraFusion IDE',
      icon: '💻',
      description: 'Development environment'
    },
    {
      path: '/reports',
      label: 'Report Builder',
      icon: '📊',
      description: 'Analytics platform'
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: '📈',
      description: 'Data visualization'
    },
  ];

  return (
    <div className="tf-dashboard-layout">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            className="tf-sidebar"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3 }}
          >
            <div className="tf-sidebar-header">
              <TerraFusionLogo variant="full" size="sm" />
              <div className="tf-badge tf-badge-trust tf-mt-2">
                cOS 2.0
              </div>
            </div>

            <nav className="tf-sidebar-nav">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`tf-sidebar-link ${
                    location.pathname === item.path ? 'active' : ''
                  }`}
                >
                  <span className="tf-sidebar-icon">{item.icon}</span>
                  <div className="tf-sidebar-text">
                    <div className="tf-sidebar-label">{item.label}</div>
                    <div className="tf-sidebar-description">{item.description}</div>
                  </div>
                </Link>
              ))}
            </nav>

            <div className="tf-sidebar-footer">
              <div className="tf-status active">
                <span className="tf-status-dot"></span>
                All Systems Operational
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={`tf-dashboard-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Top Bar */}
        <header className="tf-dashboard-header">
          <button
            className="tf-sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12H21M3 6H21M3 18H21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="tf-dashboard-title">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </div>

          <div className="tf-dashboard-actions">
            <button className="tf-btn tf-btn-ghost tf-btn-sm">
              <span>🔔</span>
              Alerts
            </button>
            <button className="tf-btn tf-btn-ghost tf-btn-sm">
              <span>⚙️</span>
              Settings
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="tf-dashboard-content">
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
      </div>

      {/* Add dashboard-specific styles */}
      <style jsx>{`
        .tf-dashboard-layout {
          display: flex;
          height: 100vh;
          background: var(--tf-deep-space);
        }

        .tf-sidebar {
          width: 280px;
          height: 100vh;
          background: var(--tf-midnight);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
        }

        .tf-sidebar-header {
          padding: var(--tf-space-4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tf-sidebar-nav {
          flex: 1;
          padding: var(--tf-space-2);
          overflow-y: auto;
        }

        .tf-sidebar-link {
          display: flex;
          align-items: center;
          gap: var(--tf-space-3);
          padding: var(--tf-space-3);
          margin-bottom: var(--tf-space-1);
          border-radius: var(--tf-radius-lg);
          color: var(--tf-gray-300);
          text-decoration: none;
          transition: all var(--tf-duration-fast) var(--tf-easing-smooth);
        }

        .tf-sidebar-link:hover {
          background: rgba(0, 153, 255, 0.1);
          color: var(--tf-white);
        }

        .tf-sidebar-link.active {
          background: var(--tf-trust-blue);
          color: var(--tf-white);
          box-shadow: var(--tf-glow-trust);
        }

        .tf-sidebar-icon {
          font-size: 24px;
          width: 32px;
          text-align: center;
        }

        .tf-sidebar-text {
          flex: 1;
        }

        .tf-sidebar-label {
          font-weight: 600;
          font-size: var(--tf-body);
        }

        .tf-sidebar-description {
          font-size: var(--tf-small);
          color: var(--tf-gray-400);
          margin-top: 2px;
        }

        .tf-sidebar-link.active .tf-sidebar-description {
          color: rgba(255, 255, 255, 0.8);
        }

        .tf-sidebar-footer {
          padding: var(--tf-space-4);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tf-dashboard-main {
          flex: 1;
          margin-left: 280px;
          display: flex;
          flex-direction: column;
          transition: margin-left var(--tf-duration-normal) var(--tf-easing-smooth);
        }

        .tf-dashboard-main:not(.sidebar-open) {
          margin-left: 0;
        }

        .tf-dashboard-header {
          height: 64px;
          background: rgba(26, 31, 58, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          padding: 0 var(--tf-space-4);
          gap: var(--tf-space-4);
          backdrop-filter: blur(10px);
        }

        .tf-sidebar-toggle {
          background: transparent;
          border: none;
          color: var(--tf-white);
          cursor: pointer;
          padding: var(--tf-space-2);
          border-radius: var(--tf-radius-md);
          transition: all var(--tf-duration-fast) var(--tf-easing-smooth);
        }

        .tf-sidebar-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .tf-dashboard-title {
          font-size: var(--tf-heading-3);
          font-weight: 600;
          flex: 1;
        }

        .tf-dashboard-actions {
          display: flex;
          gap: var(--tf-space-2);
        }

        .tf-dashboard-content {
          flex: 1;
          padding: var(--tf-space-6);
          overflow-y: auto;
        }

        .tf-btn-sm {
          padding: var(--tf-space-2) var(--tf-space-3);
          font-size: var(--tf-small);
        }

        @media (max-width: 768px) {
          .tf-sidebar {
            width: 100%;
            transform: translateX(-100%);
          }

          .tf-dashboard-main {
            margin-left: 0;
          }

          .tf-dashboard-content {
            padding: var(--tf-space-4);
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
