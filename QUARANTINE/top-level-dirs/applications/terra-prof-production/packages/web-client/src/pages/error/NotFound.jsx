import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * NotFound Component
 * Displayed when a user navigates to a non-existent route
 */
const NotFound = () => {
  const navigate = useNavigate();
  
  // Go back to previous page
  const handleGoBack = () => {
    navigate(-1);
  };
  
  return (
    <div className="error-page not-found-page">
      <div className="error-container">
        <div className="error-code">404</div>
        
        <div className="error-content">
          <h1>Page Not Found</h1>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          
          <div className="error-actions">
            <button 
              className="btn btn-outline"
              onClick={handleGoBack}
            >
              Go Back
            </button>
            
            <Link to="/" className="btn btn-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;