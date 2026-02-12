import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, BarChart2 } from 'lucide-react';

const AppHeader = () => {
  const location = useLocation();
  
  // Determine which navigation item is active
  const isActive = (path) => {
    const currentPath = location.pathname;
    
    if (path === '/' && (currentPath === '/' || currentPath === '/properties')) {
      return true;
    }
    
    if (path !== '/' && currentPath.startsWith(path)) {
      return true;
    }
    
    return false;
  };

  return (
    <header className="bg-white shadow-sm fixed w-full z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                Terrafusion Pro
              </Link>
            </div>
            <nav className="ml-8 flex space-x-4 items-center">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Home size={18} className="mr-1.5" />
                  <span>Properties</span>
                </div>
              </Link>
              <Link
                to="/appraisals"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/appraisals') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <FileText size={18} className="mr-1.5" />
                  <span>Appraisals</span>
                </div>
              </Link>
              <Link
                to="/reports"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/reports') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <BarChart2 size={18} className="mr-1.5" />
                  <span>Reports</span>
                </div>
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link
                to="/properties/new"
                className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Property
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;