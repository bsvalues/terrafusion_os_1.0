/**
 * PortalHeader - Top header bar with breadcrumbs, search, and notifications
 */

import { useLocation, Link } from 'react-router-dom';
import { usePortal } from '../context/PortalContext';
import './PortalHeader.css';

const PortalHeader = () => {
  const location = useLocation();
  const { notifications, unreadCount, portalName } = usePortal();

  // Generate breadcrumbs from current path
  const getBreadcrumbs = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', path: '/' }];

    let currentPath = '';
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;
      const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      breadcrumbs.push({
        label,
        path: currentPath,
        isLast: index === pathParts.length - 1,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="portal-header">
      <div className="portal-header-content">
        <nav className="portal-breadcrumbs">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.path} className="portal-breadcrumb">
              {index > 0 && <span className="portal-breadcrumb-separator">/</span>}
              {crumb.isLast ? (
                <span className="portal-breadcrumb-current">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="portal-breadcrumb-link">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <div className="portal-header-actions">
          <div className="portal-header-search">
            <input
              type="search"
              placeholder="Search..."
              className="portal-search-input"
            />
            <span className="portal-search-icon">🔍</span>
          </div>

          <button className="portal-header-button" title="Notifications">
            <span className="portal-notification-icon">🔔</span>
            {unreadCount > 0 && (
              <span className="portal-notification-badge">{unreadCount}</span>
            )}
          </button>

          <button className="portal-header-button" title="Settings">
            <span>⚙️</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default PortalHeader;
