import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';

// TerraFusion OS Shell with FULL Brand Asset Integration
// Government. Transcended.

const TerraFusionShell = styled.div`
  min-height: 100vh;
  background: var(--tf-dark, #0b1020);
  color: var(--tf-light, #ffffff);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const TranscendenceHeader = styled.header`
  background: linear-gradient(135deg, 
    var(--tf-primary) 0%, 
    var(--tf-transcend) 50%, 
    var(--tf-accent) 100%);
  padding: 1rem 2rem;
  box-shadow: 0 0 20px rgba(0, 255, 238, 0.4);
`;

const BrandTitle = styled.h1`
  margin: 0;
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(135deg, 
    var(--tf-light) 0%, 
    var(--tf-transcend) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Tagline = styled.p`
  margin: 0.5rem 0 0 0;
  font-size: 1.2rem;
  color: var(--tf-light);
  opacity: 0.9;
`;

const Dashboard = () => (
  <div className="clarity-gradient" style={{ padding: '2rem', borderRadius: '12px', margin: '2rem' }}>
    <h2 className="transcend-glow">Government Operations Dashboard</h2>
    <p>Real-time county operations with AI Swarm coordination</p>
    <div className="intelligence-pulse" style={{ padding: '1rem', background: 'rgba(0, 255, 238, 0.1)', borderRadius: '8px' }}>
      <strong>50,000+ AI Agents Active</strong>
      <br />Supreme Commander Claude coordinating government operations
    </div>
  </div>
);

const Marketplace = () => (
  <div className="clarity-gradient" style={{ padding: '2rem', borderRadius: '12px', margin: '2rem' }}>
    <h2 className="transcend-glow">Government App Store</h2>
    <p>Plugin Economy: $477/month base + $142 marketplace ARPU</p>
    <div className="intelligence-pulse" style={{ padding: '1rem', background: 'rgba(0, 255, 170, 0.1)', borderRadius: '8px' }}>
      <strong>42+ Government Modules Available</strong>
      <br />Hot-swappable applications for county operations
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <TerraFusionShell className="tf-government-app">
      <TranscendenceHeader>
        <BrandTitle>TerraFusion OS</BrandTitle>
        <Tagline>Government. Transcended.</Tagline>
      </TranscendenceHeader>
      
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </TerraFusionShell>
  );
};