import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import NotificationCenter from '../components/common/NotificationCenter';

/**
 * Main Layout Component
 * The primary layout for authenticated users
 */
const MainLayout = ({ children }) => {
  const location = useLocation();
  
  // Generate breadcrumb items based on current location
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // Home is always the first item
    const items = [{ label: 'Home', path: '/' }];
    
    // Build path as we go to create proper links
    let currentPath = '';
    
    pathSegments.forEach(segment => {
      currentPath += `/${segment}`;
      
      // Format the segment name (capitalize, replace hyphens with spaces)
      const formattedName = segment
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      
      items.push({
        label: formattedName,
        path: currentPath
      });
    });
    
    return items;
  };
  
  return (
    <div className="main-layout">
      <Header />
      
      <div className="main-container">
        <Sidebar />
        
        <main className="content">
          <Breadcrumbs items={getBreadcrumbs()} />
          
          <div className="page-container">
            {children}
          </div>
          
          <Footer />
        </main>
      </div>
      
      <NotificationCenter />
    </div>
  );
};

export default MainLayout;