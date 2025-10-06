/**
 * PortalLayout - Main layout wrapper for all portal pages
 * Provides consistent structure with sidebar navigation, header, and content area
 */

import { Outlet } from 'react-router-dom';
import { usePortal } from '../context/PortalContext';
import PortalNav from './PortalNav';
import PortalHeader from './PortalHeader';
import PortalFooter from './PortalFooter';
import './PortalLayout.css';

const PortalLayout = () => {
  const { sidebarCollapsed, loading } = usePortal();

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="portal-loading-spinner"></div>
        <p>Loading portal...</p>
      </div>
    );
  }

  return (
    <div className={`portal-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <PortalNav />
      
      <div className="portal-main">
        <PortalHeader />
        
        <main className="portal-content">
          <Outlet />
        </main>
        
        <PortalFooter />
      </div>
    </div>
  );
};

export default PortalLayout;
