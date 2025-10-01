import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PublicPortal from './components/PublicPortal';
import RecordsSearch from './components/RecordsSearch';
import FOIARequest from './components/FOIARequest';
import './App.css';

type ActiveTab = 'public-portal' | 'search-records' | 'submit-foia' | 'track-requests' | 'transparency' | 'citizen-help';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('public-portal');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    // Monitor backend connection
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:\${{TF_PORT_7000:-7000}}/api/health');
        if (response.ok) {
          setIsConnected(true);
          setConnectionStatus('connected');
        } else {
          setIsConnected(false);
          setConnectionStatus('error');
        }
      } catch (error) {
        setIsConnected(false);
        setConnectionStatus('disconnected');
      }
    };

    // Initial check
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'public-portal':
        return <PublicPortal />;
      case 'search-records':
        return <RecordsSearch />;
      case 'submit-foia':
        return <FOIARequest />;
      case 'track-requests':
        return (
          <div className="coming-soon">
            <div className="coming-soon-icon">📋</div>
            <h2>Request Tracking</h2>
            <p>Track the status of your FOIA and public records requests</p>
            <div className="coming-soon-note">Coming Soon</div>
          </div>
        );
      case 'transparency':
        return (
          <div className="coming-soon">
            <div className="coming-soon-icon">🌟</div>
            <h2>Transparency Dashboard</h2>
            <p>Explore government transparency metrics and open data</p>
            <div className="coming-soon-note">Coming Soon</div>
          </div>
        );
      case 'citizen-help':
        return (
          <div className="coming-soon">
            <div className="coming-soon-icon">❓</div>
            <h2>Citizen Help Center</h2>
            <p>Get help with FOIA requests and accessing public records</p>
            <div className="coming-soon-note">Coming Soon</div>
          </div>
        );
      default:
        return <PublicPortal />;
    }
  };

  return (
    <div className="app">
      <Header 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isConnected={isConnected}
        connectionStatus={connectionStatus}
      />
      <main className="app-main">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;