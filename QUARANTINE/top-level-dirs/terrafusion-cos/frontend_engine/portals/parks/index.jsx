/**
 * Parks & Recreation Portal - Index
 */

import { Routes, Route } from 'react-router-dom';
import { PortalProvider } from '../shared/context/PortalContext';
import PortalLayout from '../shared/components/PortalLayout';
import DashboardPage from './pages/DashboardPage';
import FacilitiesPage from './pages/FacilitiesPage';
import ReservationsPage from './pages/ReservationsPage';
import MaintenancePage from './pages/MaintenancePage';
import EventsPage from './pages/EventsPage';

const ParksPortal = () => {
  return (
    <PortalProvider portalName="parks">
      <Routes>
        <Route path="/" element={<PortalLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="facilities" element={<FacilitiesPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="events" element={<EventsPage />} />
        </Route>
      </Routes>
    </PortalProvider>
  );
};

export default ParksPortal;
