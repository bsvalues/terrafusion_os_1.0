import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Breadcrumbs Component
 * Displays the navigation path for the current page
 */
const Breadcrumbs = ({ items = [] }) => {
  if (!items || items.length === 0) {
    return null;
  }
  
  return (
    <div className="breadcrumbs">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb-list">
          {items.map((item /* , index */) => {
            const isLast = index === items.length - 1;
            
            return (
              <li 
                key={`${item.path}-${index}`} 
                className={`breadcrumb-item ${isLast ? 'active' : ''}`}
              >
                {isLast ? (
                  <span className="breadcrumb-text">{item.label}</span>
                ) : (
                  <Link to={item.path} className="breadcrumb-link">
                    {item.label}
                  </Link>
                )}
                
                {!isLast && (
                  <span className="breadcrumb-separator">/</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumbs;