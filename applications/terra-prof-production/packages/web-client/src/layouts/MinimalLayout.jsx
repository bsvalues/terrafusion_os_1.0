import React from 'react';
import { Link } from 'react-router-dom';
import NotificationCenter from '../components/common/NotificationCenter';

/**
 * Minimal Layout Component
 * A simplified layout for auth pages and error pages
 */
const MinimalLayout = ({ children }) => {
  return (
    <div className="minimal-layout">
      <header className="minimal-header">
        <div className="logo-container">
          <Link to="/" className="logo-link">
            <img 
              src="/assets/images/terrafusion-logo.svg" 
              alt="TerraFusionPro Logo" 
              className="logo-image"
            />
            <span className="logo-text">TerraFusionPro</span>
          </Link>
        </div>
      </header>
      
      <main className="minimal-content">
        {children}
      </main>
      
      <footer className="minimal-footer">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} TerraFusionPro. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
        </div>
      </footer>
      
      <NotificationCenter />
    </div>
  );
};

export default MinimalLayout;