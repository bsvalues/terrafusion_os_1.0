/**
 * Layout Component
 * Main application layout including header, sidebar, and footer
 */

import React from 'react';
import Header from '../Header';
import Footer from '../Footer';
import Sidebar from './Sidebar';
import { ToastContainer } from '../ui/Toast';
import { useApp } from '../../contexts/AppContext';

/**
 * Layout Component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 * @param {boolean} props.showSidebar - Whether to show the sidebar
 * @param {boolean} props.showHeader - Whether to show the header
 * @param {boolean} props.showFooter - Whether to show the footer
 * @param {string} props.className - Additional CSS classes for main content area
 * @returns {JSX.Element} Layout component
 */
const Layout = ({
  children,
  showSidebar = true,
  showHeader = true,
  showFooter = true,
  className = ''
}) => {
  const { toasts, removeToast, isLoading } = useApp();

  return (
    <div className="app-container">
      {/* Global spinner when loading */}
      {isLoading && (
        <div className="global-spinner">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      
      {/* Toast container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} position="top-right" />
      
      {/* App layout structure */}
      <div className="layout-wrapper">
        {showSidebar && <Sidebar />}
        
        <div className="layout-main">
          {showHeader && <Header />}
          
          <main className={`main-content ${className}`}>
            {children}
          </main>
          
          {showFooter && <Footer />}
        </div>
      </div>
    </div>
  );
};

export default Layout;