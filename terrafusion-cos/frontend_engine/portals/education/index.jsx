/**
 * Education Portal - Index
 * Routes and configuration for education portal
 */

import { Routes, Route } from 'react-router-dom';
import { PortalProvider } from '../shared/context/PortalContext';
import PortalLayout from '../shared/components/PortalLayout';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import ClassesPage from './pages/ClassesPage';
import AttendancePage from './pages/AttendancePage';
import GradesPage from './pages/GradesPage';
import ReportsPage from './pages/ReportsPage';

const EducationPortal = () => {
  return (
    <PortalProvider portalName="education">
      <Routes>
        <Route path="/" element={<PortalLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="grades" element={<GradesPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </PortalProvider>
  );
};

export default EducationPortal;
