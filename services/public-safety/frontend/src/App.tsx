import React from 'react';
import Header from './components/Header';
import SafetyDashboard from './components/SafetyDashboard';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <Header />
      <SafetyDashboard />
    </div>
  );
};

export default App;