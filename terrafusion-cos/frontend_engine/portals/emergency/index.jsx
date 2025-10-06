/**
 * Emergency Portal - Index
 * Routes and configuration for emergency management portal
 */

import { Routes, Route } from 'react-router-dom';
import { PortalProvider } from '../shared/context/PortalContext';
import PortalLayout from '../shared/components/PortalLayout';
import DashboardPage from './pages/DashboardPage';
import IncidentsPage from './pages/IncidentsPage';
import ResourcesPage from './pages/ResourcesPage';
import AlertsPage from './pages/AlertsPage';
import MapPage from './pages/MapPage';

const EmergencyPortal = () => {
  return (
    <PortalProvider portalName="emergency">
      <Routes>
        <Route path="/" element={<PortalLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="map" element={<MapPage />} />
        </Route>
      </Routes>
    </PortalProvider>
  );
};

export default EmergencyPortal;
