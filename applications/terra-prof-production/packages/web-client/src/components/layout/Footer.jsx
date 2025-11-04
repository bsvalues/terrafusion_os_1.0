import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer Component
 * Application footer with links and copyright information
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-info">
          <p className="copyright">
            &copy; {currentYear} TerraFusionPro. All rights reserved.
          </p>
          <p className="version">
            Version 1.0.0
          </p>
        </div>
        
        <div className="footer-links">
          <nav className="footer-nav">
            <Link to="/about" className="footer-link">About</Link>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
            <Link to="/contact" className="footer-link">Contact Us</Link>
            <a 
              href="https://docs.terrafusionpro.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="footer-link"
            >
              Documentation
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;