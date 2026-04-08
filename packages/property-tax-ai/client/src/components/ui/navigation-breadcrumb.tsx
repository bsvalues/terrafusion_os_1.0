
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const NavigationBreadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 mb-4" aria-label="Breadcrumb">
      <Link 
        to="/"
        className="hover:text-primary transition-colors flex items-center"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {pathSegments.map((segment, index) => (
        <React.Fragment key={segment}>
          <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
          <Link
            to={`/${pathSegments.slice(0, index + 1).join('/')}`}
            className="hover:text-primary transition-colors capitalize"
            aria-current={index === pathSegments.length - 1 ? 'page' : undefined}
          >
            {segment.replace(/-/g, ' ')}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
};
