import React from 'react';
import { Link } from 'react-router-dom';

/**
 * NotFound Component
 * 404 error page
 */
const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="error-code">404</div>
        
        <h1 className="error-title">Page Not Found</h1>
        
        <p className="error-message">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="action-buttons">
          <Link to="/" className="btn btn-primary">
            Go to Dashboard
          </Link>
          
          <button 
            className="btn btn-outline"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
        
        <div className="help-text">
          <p>
            If you believe this is an error, please <Link to="/contact">contact support</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;