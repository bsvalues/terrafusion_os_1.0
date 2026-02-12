/**
 * TerraFusionPro Web Client - Footer Component
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>About TerraFusionPro</h3>
            <p>
              Advanced real estate appraisal platform with cutting-edge analytics
              and comprehensive property data management.
            </p>
          </div>
          
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/properties">Properties</Link></li>
              <li><Link to="/reports">Reports</Link></li>
              <li><Link to="/analysis">Market Analysis</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Resources</h3>
            <ul className="footer-links">
              <li><Link to="/help">Help Center</Link></li>
              <li><Link to="/docs">Documentation</Link></li>
              <li><Link to="/api-docs">API Reference</Link></li>
              <li><Link to="/training">Training</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Legal</h3>
            <ul className="footer-links">
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/security">Security</Link></li>
              <li><Link to="/compliance">Compliance</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} TerraFusionPro. All rights reserved.</p>
          <p>
            <span className="version">Version 1.0.0</span>
            <span className="separator">|</span>
            <a href="mailto:support@terrafusionpro.com">Contact Support</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;