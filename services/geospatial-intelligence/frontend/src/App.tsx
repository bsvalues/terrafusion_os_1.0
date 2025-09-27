import React from 'react';
import Header from './components/Header';
import GISDashboard from './components/GISDashboard';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="App">
      <Header />
      <GISDashboard />
    </div>
  );
};

export default App;