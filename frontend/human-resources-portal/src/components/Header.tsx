import React from 'react';
import { FaUsers, FaBriefcase, FaMoneyBillWave, FaTasks } from 'react-icons/fa';

interface HeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab = 'dashboard', onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'HR Dashboard', icon: FaTasks },
    { id: 'employees', label: 'Employee Management', icon: FaUsers },
    { id: 'payroll', label: 'Payroll Administration', icon: FaMoneyBillWave },
    { id: 'performance', label: 'Performance Management', icon: FaBriefcase }
  ];

  return (
    <header className="government-container mb-4">
      <div className="government-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
              TerraFusion Human Resources Portal
            </h1>
            <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Advanced Human Resources & Personnel Management System
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>
              Benton County, Washington
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              Government HR Operations
            </div>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          fontSize: '0.875rem'
        }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            background: '#10b981', 
            borderRadius: '50%' 
          }}></div>
          <span>HR System Operational</span>
          <span style={{ margin: '0 1rem', opacity: 0.7 }}>•</span>
          <span>506 Active Employees</span>
          <span style={{ margin: '0 1rem', opacity: 0.7 }}>•</span>
          <span>10 Departments</span>
          <span style={{ margin: '0 1rem', opacity: 0.7 }}>•</span>
          <span>Port \${{TF_PORT_5360:-5360}}</span>
        </div>
      </div>
      
      <nav className="nav-tabs">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange?.(tab.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconComponent size={16} />
                <span>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </nav>
    </header>
  );
};

export default Header;