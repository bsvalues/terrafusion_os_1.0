import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import TransportationDashboard from './components/TransportationDashboard';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<TransportationDashboard />} />
          <Route path="/dashboard" element={<TransportationDashboard />} />
          <Route path="/traffic" element={<div className="placeholder-content">Traffic Flow Analysis</div>} />
          <Route path="/transit" element={<div className="placeholder-content">Transit Management</div>} />
          <Route path="/signals" element={<div className="placeholder-content">Signal Coordination</div>} />
          <Route path="/parking" element={<div className="placeholder-content">Parking Management</div>} />
          <Route path="/incidents" element={<div className="placeholder-content">Incident Response</div>} />
          <Route path="/analytics" element={<div className="placeholder-content">Transportation Analytics</div>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;