import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import EmergencyDashboard from './components/EmergencyDashboard';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <EmergencyDashboard />;
      case 'incidents':
        return (
          <div className="content-placeholder">
            <h2>🚨 Active Incidents Management</h2>
            <p>Comprehensive incident tracking, command structure, and response coordination interface coming soon...</p>
          </div>
        );
      case 'alerts':
        return (
          <div className="content-placeholder">
            <h2>📢 Emergency Alert System</h2>
            <p>Mass notification system, wireless emergency alerts, and communication management interface coming soon...</p>
          </div>
        );
      case 'resources':
        return (
          <div className="content-placeholder">
            <h2>🚒 Emergency Resource Management</h2>
            <p>Resource allocation, deployment tracking, and availability management interface coming soon...</p>
          </div>
        );
      case 'response':
        return (
          <div className="content-placeholder">
            <h2>📋 Emergency Response Plans</h2>
            <p>Response plan activation, procedure management, and protocol execution interface coming soon...</p>
          </div>
        );
      case 'notifications':
        return (
          <div className="content-placeholder">
            <h2>📱 Mass Notification System</h2>
            <p>Public notification management, social media integration, and communication channels interface coming soon...</p>
          </div>
        );
      case 'coordination':
        return (
          <div className="content-placeholder">
            <h2>🤝 Multi-Agency Coordination</h2>
            <p>Interagency communication, resource sharing, and unified command interface coming soon...</p>
          </div>
        );
      case 'recovery':
        return (
          <div className="content-placeholder">
            <h2>🔄 Recovery Operations</h2>
            <p>Post-incident recovery planning, damage assessment, and restoration coordination interface coming soon...</p>
          </div>
        );
      case 'analytics':
        return (
          <div className="content-placeholder">
            <h2>📊 Emergency Analytics</h2>
            <p>Performance metrics, trend analysis, and emergency management reporting interface coming soon...</p>
          </div>
        );
      case 'admin':
        return (
          <div className="content-placeholder">
            <h2>⚙️ System Administration</h2>
            <p>System configuration, user management, and emergency management system settings coming soon...</p>
          </div>
        );
      default:
        return <EmergencyDashboard />;
    }
  };

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="app-main">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;