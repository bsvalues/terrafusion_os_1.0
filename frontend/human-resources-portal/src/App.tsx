import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HRDashboard from './components/HRDashboard';
import EmployeeManagement from './components/EmployeeManagement';
import PayrollAdministration from './components/PayrollAdministration';
import PerformanceManagement from './components/PerformanceManagement';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HRDashboard />;
      case 'employees':
        return <EmployeeManagement />;
      case 'payroll':
        return <PayrollAdministration />;
      case 'performance':
        return <PerformanceManagement />;
      default:
        return <HRDashboard />;
    }
  };

  return (
    <div className="App">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main style={{ minHeight: 'calc(100vh - 200px)' }}>
        {renderContent()}
      </main>
      
      {/* Footer */}
      <footer style={{
        background: '#374151',
        color: 'white',
        padding: '1.5rem',
        marginTop: '3rem'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              TerraFusion Human Resources Portal
            </h3>
            <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>
              Advanced Human Resources & Personnel Management System
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
              Benton County, Washington
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
              Government Operations • Port \${{TF_PORT_5360:-5360}}
            </div>
          </div>
        </div>
        
        <div style={{ 
          borderTop: '1px solid #4b5563',
          marginTop: '1rem',
          paddingTop: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          opacity: 0.7
        }}>
          <div>
            © 2024 TerraFusion OS. Advanced Government Technology Platform.
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>Employee Management</span>
            <span>•</span>
            <span>Payroll Administration</span>
            <span>•</span>
            <span>Performance Management</span>
            <span>•</span>
            <span>Government Compliance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;