import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import PublicWorksDashboard from './components/PublicWorksDashboard';
import AssetManagement from './components/AssetManagement';
import WorkOrderManagement from './components/WorkOrderManagement';
import MaintenanceScheduling from './components/MaintenanceScheduling';
import CapitalProjects from './components/CapitalProjects';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="terrafusion-app">
      <Router>
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PublicWorksDashboard />} />
            <Route path="/assets" element={<AssetManagement />} />
            <Route path="/work-orders" element={<WorkOrderManagement />} />
            <Route path="/maintenance" element={<MaintenanceScheduling />} />
            <Route path="/projects" element={<CapitalProjects />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
};

export default App;