/**
 * Transportation Portal - Index
 */

import { Routes, Route } from 'react-router-dom';
import { PortalProvider } from '../shared/context/PortalContext';
import PortalLayout from '../shared/components/PortalLayout';
import DashboardPage from './pages/DashboardPage';
import TrafficPage from './pages/TrafficPage';
import TransitPage from './pages/TransitPage';
import ParkingPage from './pages/ParkingPage';
import AnalyticsPage from './pages/AnalyticsPage';

const TransportationPortal = () => {
  return (
    <PortalProvider portalName="transportation">
      <Routes>
        <Route path="/" element={<PortalLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="traffic" element={<TrafficPage />} />
          <Route path="transit" element={<TransitPage />} />
          <Route path="parking" element={<ParkingPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </PortalProvider>
  );
};

export default TransportationPortal;
