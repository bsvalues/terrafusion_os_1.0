import React from 'react';
import Header from './components/Header';
import HealthDashboard from './components/HealthDashboard';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="public-health-app">
      <Header />
      <main className="main-content">
        <HealthDashboard />
      </main>
    </div>
  );
};

export default App;