import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { EliteDashboard } from './pages/EliteDashboard';
import { QuantumAnalytics } from './pages/QuantumAnalytics';
import { ImmersiveVisualization } from './pages/ImmersiveVisualization';
import { TerraFusionHeader } from './components/TerraFusionHeader';
import './App.css';

/**
 * TerraLevy Elite - Main Application Component
 * PhD-Level Quantum AI Power User Interface
 * Government. Transcended.
 */
export function App() {
  return (
    <div className="terra-levy-elite">
      <TerraFusionHeader />
      <main className="elite-main">
        <Routes>
          <Route path="/" element={<EliteDashboard />} />
          <Route path="/analytics" element={<QuantumAnalytics />} />
          <Route path="/visualization" element={<ImmersiveVisualization />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
