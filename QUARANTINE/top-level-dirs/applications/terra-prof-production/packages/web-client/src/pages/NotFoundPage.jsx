/**
 * TerraFusionPro - Not Found Page
 * 404 error page shown when a route is not found
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * NotFoundPage Component
 */
const NotFoundPage = () => {
  const location = useLocation();
  
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-message">
          The page <code>{location.pathname}</code> you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="not-found-actions">
          <Link to="/" className="home-button">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>Go to Home</span>
          </Link>
          
          <button 
            onClick={() => window.history.back()} 
            className="back-button"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Go Back</span>
          </button>
        </div>
        
        <div className="not-found-help">
          <p>
            If you believe this is an error, please{' '}
            <Link to="/help/support" className="support-link">
              contact support
            </Link>.
          </p>
        </div>
      </div>
      
      <div className="not-found-illustration">
        <svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
          <path d="M484.2,95.7c-33.4-47.9-95.4-74.5-151.2-61.5c-43.7,10.2-81.4,47.7-119.8,77.6c-48.3,37.6-109.8,72-118.9,133.7
            c-8.9,60.1,37.7,113.3,90.3,140.5c59.1,30.6,133.5,20.3,185-22.9c39.7-33.3,52.5-85.3,95-115.8c28.2-20.2,64.8-29.8,83.3-61.2
            C567.9,149.5,510.9,134.5,484.2,95.7z" fill="#f0f0f0"/>
          <circle cx="300" cy="260" r="90" fill="#e0e0e0"/>
          <text x="240" y="270" font-family="sans-serif" font-size="40" fill="#606060">Oops!</text>
        </svg>
      </div>
    </div>
  );
};

export default NotFoundPage;