import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import CitizenServicesDashboard from './components/CitizenServicesDashboard';
import ServiceCatalog from './components/ServiceCatalog';
import RequestTracking from './components/RequestTracking';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<CitizenServicesDashboard />} />
            <Route path="/catalog" element={<ServiceCatalog />} />
            <Route path="/tracking" element={<RequestTracking />} />
            <Route path="/appointments" element={
              <div className="coming-soon">
                <h2>Appointments</h2>
                <p>Appointment scheduling system coming soon...</p>
              </div>
            } />
            <Route path="/feedback" element={
              <div className="coming-soon">
                <h2>Citizen Feedback</h2>
                <p>Feedback management system coming soon...</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;